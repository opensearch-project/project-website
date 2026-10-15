---
layout: post
title: "Optimizing remote model throughput in OpenSearch"
authors:
  - yichenzg
  - bzhangam
  - heemin
date: 2026-10-14
categories:
  - technical-posts
meta_keywords: OpenSearch, remote inference, externally hosted models, request splitting, dynamic batching, remote model batching, ingest pipelines, neural search
meta_description: Learn how OpenSearch keeps large ingestion requests within remote model limits and combines concurrent search requests to reduce model calls.
excerpt: "Remote model endpoints have limits, but ingestion and search reach them in opposite ways. Request splitting divides large ingest requests into valid model calls, while dynamic batching combines concurrent search requests before they reach the endpoint."
has_science_table: true
---

At low volume, remote inference is simple: send the input to a model and get the result back. As traffic grows, how requests are sized and grouped starts to matter. During bulk ingestion, a single request can exceed the provider's limits and fail. During search, each query triggers its own model call. That multiplies remote calls and caps throughput, even when the endpoint could handle more queries if they were batched.

OpenSearch 3.9 adds model-level request batching for externally hosted models, with two capabilities. Request splitting breaks oversized prediction requests into smaller calls that stay within endpoint limits. Dynamic batching collects concurrent requests and sends their inputs to the model together. Both are opt-in and are configured on the registered model.

## Handling bulk ingest requests that exceed endpoint limits

![Request splitting before and after: a 100-input ingest request is rejected by a model that accepts at most 96 inputs per call, while request splitting sends two concurrent calls containing 96 and 4 inputs](/assets/media/blog-images/2026-10-14-optimizing-remote-model-throughput/request-splitting-before-after.png)

During bulk ingestion using a [semantic field](https://docs.opensearch.org/latest/field-types/supported-field-types/semantic/) or the [text embedding processor](https://docs.opensearch.org/latest/ingest-pipelines/processors/text-embedding/), OpenSearch can send many documents in a single prediction request to an [externally hosted model](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/). If that request contains more inputs or more bytes than the endpoint accepts, the provider rejects it.

Request splitting sits between the registered model and the connector. When a prediction request arrives, OpenSearch reads the `text_docs` array in order and builds a model call from its input strings. It continues adding input strings until adding the next one would exceed a configured count or byte boundary. It then sends the current call, starts a new one with that next input string, and repeats the process until it has assigned every input string. OpenSearch invokes the resulting calls concurrently and combines the returned results in their original order before the ingest request continues.

Consider [Cohere Embed English v3 on Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-embed-v3.html), which accepts at most 96 input strings in one invocation. A prediction request containing 100 input strings exceeds that limit and is rejected. Request splitting can instead send 2 calls: the first contains 96 input strings, and the second contains 4. However, a count limit alone cannot describe every request. For example, 96 short product titles may fit easily within an endpoint payload limit, while 20 long articles may not. Request splitting therefore considers both the number of input strings and their combined byte size.

The registered model stores these boundaries in `batch_inference_config`. `max_items_per_request` limits the number of input strings in each model call, while `max_bytes_per_request` limits their combined size. The byte limit applies only to the input strings, so its value should leave room for the other fields in the connector request body.

### Example: Configure request splitting for ingestion

The following example registers an ingest model with request splitting enabled. The `96` value matches the maximum number of texts accepted by [Cohere Embed English v3 on Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-embed-v3.html). The `4000000` value is an example text-byte budget; use the official documentation for the deployed model and provider to choose both limits.

```json
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "remote-embedding-model-for-ingest",
  "function_name": "remote",
  "connector_id": "<connector_id>",
  "batch_inference_config": {
    "max_items_per_request": 96,
    "max_bytes_per_request": 4000000
  }
}
```

### How to tune request splitting for ingestion

Request splitting has 2 separate controls: The model limits define the largest call the endpoint can accept and the ingest processor's `batch_size` determines how much work OpenSearch receives before it creates those calls.

Set the model limits first, then use `batch_size` to find the amount of concurrency the endpoint can sustain:

1. **Find the endpoint limits.** Identify the provider and exact model used by the connector. [Supported connectors](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/supported-connectors/) can help identify the model configuration. Then use the provider's official documentation to find the maximum item count and request payload. For a custom endpoint, use the limits configured on the model server.
2. **Set the model boundaries.** Set `max_items_per_request` to the endpoint's item-count limit. Set `max_bytes_per_request` below the endpoint's full payload limit because the connector adds other fields when it creates the request. These values are guardrails for one model call. They should reflect the endpoint limit rather than a throughput target.
3. **Start with one model-sized ingest batch.** Set the text embedding processor's `batch_size` to the same value as `max_items_per_request`. For a model with a 96-item limit, begin with `batch_size` set to 96. OpenSearch sends one model-sized call for each prediction request. If the endpoint can process more than one call at a time, increase `batch_size` to 192 and then 288. OpenSearch splits each larger prediction request into valid calls and invokes those calls concurrently.
4. **Choose the largest useful batch size.** Test each value with documents that resemble the production workload. Include both short and long documents because long texts can reach the payload limit before they reach the item-count limit. Keep increasing `batch_size` only while indexing throughput improves and request latency remains acceptable. When throughput stops improving or the provider begins to rate-limit requests, use the previous value.

The model limits keep every call within the endpoint boundary. The processor's `batch_size` determines how much parallel work OpenSearch creates inside that boundary.

## When search requests are too small to use the model efficiently

![Dynamic batching before and after: three concurrent neural queries produce three one-input model calls, while dynamic batching queues them and sends one call containing three inputs](/assets/media/blog-images/2026-10-14-optimizing-remote-model-throughput/dynamic-batching-before-after.png)

A [neural query](https://docs.opensearch.org/latest/query-dsl/specialized/neural/) commonly produces a prediction request containing one query text. When many searches arrive at the same time, OpenSearch can create many model calls that each contain one input string. The endpoint must still process every call separately, even though it can accept several query texts in one invocation.

Dynamic batching creates a short collection window for a registered model on each OpenSearch node. The first prediction request starts the window. As more requests arrive, OpenSearch groups those that use the same model and the same prediction settings, with `text_docs` as the only field that differs. It collects their input strings until either the configured count or byte limit is reached. In that case, OpenSearch immediately invokes the model. Otherwise, it invokes the model when `dynamic_batching.flush_timeout_ms` expires. When the result returns, OpenSearch uses the stored positions to route each output back to the request that supplied the corresponding input string.

For example, 3 searches might independently submit the query texts `red shoes`, `blue shirt`, and `winter jacket`. If they arrive during the same collection window and use the same model settings, OpenSearch can send the 3 input strings in one model call. Each search still receives only the embedding for its own query text.

### Example: Configure dynamic batching for search

Dynamic batching is configured on a separate search model. It can reference the same connector as the ingest model, while using a short collection window suited to query latency.

```json
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "remote-embedding-model-for-search",
  "function_name": "remote",
  "connector_id": "<connector_id>",
  "batch_inference_config": {
    "max_items_per_request": 96,
    "max_bytes_per_request": 4000000,
    "dynamic_batching": {
      "enabled": true,
      "flush_timeout_ms": 50
    }
  }
}
```

### What dynamic batching changed under concurrent search traffic

We tested dynamic batching on a 3-node cluster using Amazon Bedrock with Cohere Embed English v3. Each prediction request contained one query text. Without dynamic batching, 300 concurrent requests produced 300 model calls. With a 10 ms collection window, OpenSearch combined the same requests into 23 calls, averaging about 13 texts per call.

We then limited the connector to one outbound connection per node and sent 200 concurrent query embedding requests. This made the number of model calls the limiting resource, which shows the effect of combining requests before they reach the endpoint.

![Dynamic batching benchmark under a constrained connector: model calls dropped from 200 to 27, workload time dropped from 14.66 seconds to 3.96 seconds, and throughput rose from 13.6 to 50.5 queries per second](/assets/media/blog-images/2026-10-14-optimizing-remote-model-throughput/dynamic-batching-benchmark.png)

|  | Without dynamic batching | With dynamic batching |
| :--- | :--- | :--- |
| Model calls | 200 | 27 |
| Time to complete the workload | 14.66 seconds | 3.96 seconds |
| Throughput | 13.6 queries/s | 50.5 queries/s |

Dynamic batching reduced the number of calls by 7.4 times and increased throughput by 3.7 times in this workload. The gain came from concurrent requests arriving close enough together to share a model call.

### How to tune dynamic batching for search

Dynamic batching uses the same model limits, but it solves a different problem. Instead of dividing one large ingest request, it waits briefly for independent search requests to arrive and sends their texts together. The model limits define the largest shared call. `dynamic_batching.flush_timeout_ms` defines how long OpenSearch waits for that call to fill.

1. **Set the shared-call limits.** Obtain the item-count and payload limits from the provider's official documentation for the exact model. For a custom endpoint, use the limits configured on the model server. Set `max_items_per_request` and `max_bytes_per_request` as the upper boundary for one shared model call. When either limit is reached, OpenSearch flushes the batch immediately.
2. **Choose the initial wait from the latency budget.** `dynamic_batching.flush_timeout_ms` is the maximum additional wait for the first request in a batch. Its default value is `50` ms. Start with the amount of added latency the search workload can accept. For example, if the latency budget allows up to 10 ms of waiting, begin with `10`. A longer timeout can collect more requests, but it also adds more delay when traffic is low.
3. **Estimate how many requests can join on one node.** Dynamic batching maintains a separate batch for each model ID on each OpenSearch node. A node receiving about 1,000 query embedding requests per second can receive roughly 10 requests during a 10 ms window. Requests routed to different nodes, different model IDs, or different prediction settings do not join the same batch. Use the request rate received by one node when choosing the timeout, rather than the total request rate across the cluster.
4. **Adjust the timeout from the observed tradeoff.** Compare endpoint invocation count, query throughput, and query latency under both peak and low traffic. If endpoint calls remain close to the number of search requests and there is still room in the latency budget, increase the timeout in small steps. If query latency exceeds the budget, reduce it. If batches already reach `max_items_per_request` before the timeout expires, a longer timeout cannot create larger calls and is unlikely to improve throughput.

The timeout determines how much latency is exchanged for fewer endpoint calls. The right value is the shortest wait that produces enough shared calls to meet the search throughput goal.

## Reference

For configuration examples and parameter details, see [Batching requests to externally hosted models](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/batching-requests/).
