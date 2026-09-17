---
layout: post
title: "Improve remote model throughput with server-side batch inference"
authors:
  - yichenzg
  - bzhangam
  - heemin
date: 2026-09-15
categories:
  - technical-posts
meta_keywords: OpenSearch remote inference, server-side batch inference, remote model throughput, inference batching, request coalescing, semantic search, text embeddings
meta_description: Learn how OpenSearch 3.9 uses size-based splitting and a short server-side queue to keep remote inference calls within provider limits and make better use of model batch capacity.
excerpt: "Remote embedding workloads tend to run into two opposite problems: ingest requests become too large, while search sends many one-text calls. Server-side batch inference in OpenSearch handles both patterns before calling the remote model endpoint."
has_science_table: true
---

## Overview

[Remote inference](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/index/) in OpenSearch produces two very different traffic patterns. During ingest, [ingest processors](https://docs.opensearch.org/latest/ingest-pipelines/processors/index-processors/) often send many texts at once, whereas during [search](https://docs.opensearch.org/latest/query-dsl/specialized/neural/), each query commonly triggers a prediction request for one text. As a result, large ingest calls can cross a model endpoint's request limits, while small search calls can leave most of its batch capacity unused.

This post introduces server-side batch inference in OpenSearch 3.9. The feature adds two opt-in capabilities to the remote prediction path: size-based splitting for large multi-text requests and cross-request queueing for compatible requests that arrive close together. Both capabilities are configured on the [model record](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/index/#step-3-register-an-externally-hosted-model), so callers continue to use the same ingest and search APIs. This post explains how the two capabilities work, how to configure them for ingest and search, and how they improve remote inference efficiency.

## How prediction requests reach a remote model

In OpenSearch, a registered remote model uses two linked pieces of configuration. The [connector](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/connectors/) describes how to call the endpoint, including authentication, the request body, and response mapping. The model record points to that connector and provides the model ID used by ingest processors, neural queries, and direct [Predict API](https://docs.opensearch.org/latest/ml-commons-plugin/api/train-predict/predict/) requests.

Without model-level batching, OpenSearch sends texts to the remote endpoint using the request boundary created by the caller. During ingest, a processor such as [`text_embedding`](https://docs.opensearch.org/latest/ingest-pipelines/processors/text-embedding/) collects documents according to its `batch_size` and sends them in one prediction request. If `batch_size` is 100, that request can contain 100 texts. By contrast, a search query usually contributes one text, so 300 concurrent searches can produce 300 separate model calls. The endpoint therefore sees one large call from ingest and many small calls from search, even when neither shape matches the way the model serves batches most efficiently.

## Why ingest and search need different batching behavior

The request boundaries created by ingest and search lead to opposite problems. Ingest can send more work than the endpoint accepts in one call, while search often sends too little work to use the endpoint's batch capacity.

### Ingest requests can exceed model limits

Consider an embedding endpoint (Amazon Bedrock with `cohere.embed-english-v3`) that accepts at most 96 texts per call. A request containing 100 texts exceeds that limit and is rejected. We can resolve this item-count problem by sending the input as two requests, one containing 96 texts and the other containing 4. However, item count is only one constraint. The endpoint may also limit request size, and document length can vary widely: 96 short product titles may fit easily, while 20 long articles may exceed the limit.

For that reason, changing the processor's `batch_size` alone cannot account for both limits. A conservative value reduces failures but leaves model capacity unused for short documents, whereas a larger value uses that capacity more effectively but can produce over-limit requests when documents are long. In addition, relying on `batch_size` requires the ingest pipeline to track the limits of each model endpoint.

### Search requests can leave batch capacity unused

Search has no natural bulk boundary, so each query arrives independently and usually contributes one text to the embedding request. If 300 queries arrive concurrently, sending each one immediately can produce 300 remote model calls even when the model can process many texts in a single call. Although this pattern may be acceptable at low traffic, under concurrency it consumes connection and request-rate capacity while leaving the model's batch capacity unused.

A client-side queue can reduce the number of calls, but it only sees requests from its own client instance. It cannot combine work from other clients or other requests routed to the same model, and each client would still need to maintain the batching limits for every model it uses. Therefore, the useful batching point is in OpenSearch, after requests from independent callers reach the same registered model and before OpenSearch sends them through its connector.

## How server-side batch inference addresses ingest and search

To address both request patterns, OpenSearch 3.9 adds a batching layer to the remote prediction path. The layer runs after a prediction request reaches the registered model and before OpenSearch sends a request through the connector to the remote endpoint. Because it sits at the point where independent requests converge, OpenSearch can apply the endpoint limits stored with the model and combine compatible work from different callers.

The feature provides two complementary capabilities:

* **Size-based splitting** handles large ingest requests. The batching layer divides the input into calls that stay within the configured item-count and text-size limits.
* **Cross-request queueing** handles small concurrent requests. The batching layer briefly collects compatible requests for the same model and sends their texts in shared calls.

For ingest, this means that a request containing 100 texts can be split into calls containing 96 and 4 texts, and the byte limit can split those calls further when the documents are large. For search, concurrent one-text requests can be combined into fewer calls that make better use of the model's batch capacity.

Both capabilities are opt-in. Adding `batch_inference_config` to a model enables size-based splitting, and adding an enabled `queue` block also enables cross-request queueing. Both paths use the same size-based splitter, so queued requests still respect the configured item and byte limits. OpenSearch preserves input order for split requests and returns queued results to the callers that supplied them.

The following diagram shows how the ingest and search paths use the same connector while applying different batching behavior at the model level.

![Server-side batch inference request flow](/assets/media/blog-images/2026-09-15-improve-remote-model-throughput-with-server-side-batch-inference/server-side-batch-inference-flow.svg)
*Figure 1: An ingest model applies size-based splitting directly, while a search model first collects compatible requests in a queue. Both model records can reference the same connector.*

## How to use server-side batch inference

Place `batch_inference_config` at the top level of a model registration request, alongside `connector_id`. The connector continues to define how OpenSearch calls the endpoint, while the model record defines how prediction inputs are batched. The following settings apply to the ingest and search examples:

| Setting | Requirement | Where to get the value | How OpenSearch uses it |
| :--- | :--- | :--- | :--- |
| `max_items_per_request` | Conditionally required | The provider's official model or API documentation for the exact model version, or the model server configuration for a custom endpoint | Starts a new remote call before adding an input that would exceed the item limit |
| `max_bytes_per_request` | Conditionally required | The provider's official API documentation for the request or payload size limit, or the model server configuration for a custom endpoint | Sets the UTF-8 byte budget for the text inputs in one remote call |
| `queue.enabled` | Required for queueing | Set to `true` on a model used for overlapping small requests | Enables cross-request queueing |
| `queue.flush_timeout_ms` | Optional; defaults to 50 ms | The latency budget for the search workload | Sets the maximum time a request can wait for compatible requests to join it |

When `batch_inference_config` is present, at least one of `max_items_per_request` and `max_bytes_per_request` must be set to a positive value.

`max_bytes_per_request` counts the UTF-8 bytes in the text inputs rather than the connector's complete JSON request. If the provider specifies a limit for the entire request body, reserve space for the request envelope and other fields. A single text that exceeds the configured byte budget is sent by itself rather than truncated.

### Ingest: Split large requests by size

(1) **Find the model limits.** Use [Supported connectors](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/supported-connectors/) and [Connector blueprints](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/blueprints/) to identify the provider and model used by the connector. Then obtain the item-count and payload limits from the provider's official website for that exact model version. For a custom or Amazon SageMaker endpoint, use the limits configured on the model server.

(2) **Register a model for ingest.** After [creating the connector](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/connectors/), add `batch_inference_config` to the model registration request. The following example enables size-based splitting only, so it omits the `queue` block:

```json
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "<ingest_model_name>",
  "function_name": "remote",
  "connector_id": "<connector_id>",
  "batch_inference_config": {
    "max_items_per_request": <model_input_limit>,
    "max_bytes_per_request": <text_byte_budget>
  }
}
```

Replace the two numeric placeholders with the limits from step 1. If the endpoint enforces only one limit, omit the other field. The registration request returns a task ID; when the task completes, use its model ID in step 3.

(3) **Use the model in the ingest pipeline.** Set `model_id` in the [`text_embedding` processor](https://docs.opensearch.org/latest/ingest-pipelines/processors/text-embedding/) to the model ID produced by step 2. Both `model_id` and `batch_size` belong inside the processor:

```json
PUT /_ingest/pipeline/server-side-batched-embeddings
{
  "processors": [
    {
      "text_embedding": {
        "model_id": "<ingest_model_id>",
        "field_map": {
          "text": "text_embedding"
        },
        "batch_size": <ingest_batch_size>
      }
    }
  ]
}
```

The processor's `batch_size` controls how many documents it collects for one prediction request. The model's `batch_inference_config` then divides those texts into remote calls that stay within the endpoint limits. OpenSearch combines the outputs in their original order before returning the response to the processor.

### Search: Combine concurrent requests with a queue

(1) **Choose the model limits and queue timeout.** Obtain the item-count and payload limits from the provider's official website for the exact model version. For a custom endpoint, use the limits configured on the model server. Choose `flush_timeout_ms` from the search latency budget. A shorter timeout adds less waiting, while a longer timeout gives more requests an opportunity to join the same remote call.

(2) **Register a separate model for search.** The search model can reference the same connector as the ingest model while enabling different batching behavior. Place `queue` inside `batch_inference_config` in the model registration request:

```json
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "<search_model_name>",
  "function_name": "remote",
  "connector_id": "<same_connector_id>",
  "batch_inference_config": {
    "max_items_per_request": <model_input_limit>,
    "max_bytes_per_request": <text_byte_budget>,
    "queue": {
      "enabled": true,
      "flush_timeout_ms": <search_latency_budget_ms>
    }
  }
}
```

OpenSearch flushes the queue when the accumulated texts reach either size limit or when `flush_timeout_ms` expires. The flushed inputs still pass through size-based splitting before OpenSearch calls the endpoint.

(3) **Use the search model ID.** When the registration task completes, use its model ID wherever the search setup selects the embedding model. The following example shows a [neural query](https://docs.opensearch.org/latest/query-dsl/specialized/neural/) that specifies `model_id` directly. The batching settings remain on the model record and are not added to the query:

```json
GET /<index_name>/_search
{
  "query": {
    "neural": {
      "<vector_field>": {
        "query_text": "<query_text>",
        "model_id": "<search_model_id>",
        "k": 10
      }
    }
  }
}
```

## How batching improves efficiency

Size-based splitting makes ingest more reliable because large requests can be divided before they reach the remote endpoint. In the 96-text example, OpenSearch sends a 100-text input as calls containing 96 and 4 texts instead of allowing the endpoint to reject the original request. When the endpoint has available parallel capacity, concurrent sub-batches can also improve ingest throughput.

Queueing makes concurrent search traffic more efficient by combining small requests into fewer remote calls. In one concurrent workload, 300 one-text requests were sent in 23 model calls instead of 300. The largest reduction occurs when many compatible requests overlap; a request that arrives alone may wait until the configured timeout.

Both capabilities are selected through the model ID, so ingest pipelines and search requests continue to use their existing APIs.

## Conclusion

Server-side batch inference in OpenSearch 3.9 aligns remote model calls with two common workload patterns. Use size-based splitting for large ingest requests and enable queueing on a separate model record for concurrent search requests. The two model records can share one connector while using batching settings suited to each workload.
