---
layout: post
title: "Batch Processing Semantic Highlighting in OpenSearch 3.3"
authors:
 - junqiu
date: 2025-10-13
categories:
 - technical-post
meta_keywords: "semantic highlighting, batch processing, OpenSearch 3.3, ML inference, remote models, performance optimization"
meta_description: "OpenSearch 3.3 introduces batch processing for remote semantic highlighting models, reducing ML inference calls and delivering 100-1300% performance improvements."
excerpt: "OpenSearch 3.3 introduces batch processing for remote semantic highlighting models, reducing ML inference calls from N to 1 per search query. Our benchmarks demonstrate 100-1300% performance improvements depending on document length and result set size."
has_science_table: true
---

We introduced [semantic highlighting](https://opensearch.org/blog/introducing-semantic-highlighting-in-opensearch/) in OpenSearch 3.0—an AI-powered feature that intelligently identifies relevant passages in search results based on meaning rather than exact keyword matches.

OpenSearch 3.3 introduces batch processing for remote semantic highlighting models, reducing ML inference calls from N to 1 per search query. Our benchmarks demonstrate 100-1300% performance improvements depending on document length and result set size.

**Try demo now:** Experience batch semantic highlighting on the [OpenSearch ML Playground](https://ml.playground.opensearch.org/).

![Semantic highlighting demo]({{ site.baseurl }}/assets/media/blog-images/2025-10-13-batch-processing-semantic-highlighting/semantic-highlighting-demo.gif){: .img-fluid }

## What's New: Batch Processing for Remote Models

In OpenSearch 3.0, semantic highlighting processes each search result individually, making one ML inference call per result. For queries returning many results, this sequential approach can add latency that grows with result set size. OpenSearch 3.3 introduces a new approach: collect all search results and send them in a single batched ML inference call, reducing overhead latency and improving GPU utilization.

![Batch processing comparison]({{ site.baseurl }}/assets/media/blog-images/2025-10-13-batch-processing-semantic-highlighting/batch-comparison.png){: .img-fluid }

Batch processing currently applies to **remote semantic highlighting models only** (deployed on SageMaker, external endpoints, etc.).

## Use batch semantic highlighting in search request

For complete setup, please refer to the [semantic highlighting tutorial](https://docs.opensearch.org/latest/tutorials/vector-search/semantic-highlighting-tutorial/).

### Setting Up Your Remote Model

To use batch processing, you'll need a remote batch inference supported model deployed on an external endpoint. We provide below example on how to integrate with AWS SageMaker endpoint:

* Create AWS SageMaker model endpoint resources, check [here](https://github.com/opensearch-project/opensearch-py-ml/blob/main/docs/source/examples/semantic_highlighting/README.md).
* Deploying the model endpoint to OpenSearch ML, check [here](https://github.com/opensearch-project/ml-commons/blob/main/docs/remote_inference_blueprints/standard_blueprints/sagemaker_semantic_highlighter_standard_blueprint.md).

### Enable System-Generated Pipelines

Add this cluster setting to allow OpenSearch to create the system default batch semantic highlighting search response processing pipeline:

```json
PUT /_cluster/settings
{
  "persistent": {
    "search.pipeline.enabled_system_generated_factories": ["semantic-highlighter"]
  }
}
```

### Add the Batch Flag to Your Query

Add your search request to include `batch_inference: true`, here is a example with neural query:

```json
POST /neural-search-index/_search
{
  "size": 10,
  "query": {
    "neural": {
      "embedding": {
        "query_text": "treatments for neurodegenerative diseases",
        "model_id": "<your-text-embedding-model-id>",
        "k": 10
      }
    }
  },
  "highlight": {
    "fields": {
      "text": {
        "type": "semantic"
      }
    },
    "options": {
      "model_id": "<your-semantic-highlighting-model-id>",
      "batch_inference": true
    }
  }
}
```

Your queries will now use batch processing automatically.

## Performance benchmarks

We evaluated the performance impact of batch processing for semantic highlighting on the [MultiSpanQA dataset](https://multi-span.github.io/). The test environment was configured as follows.

| **OpenSearch cluster** | Version 3.3.0 deployed on AWS (us-east-2) |
| Data nodes | 3 × r6g.2xlarge (8 vCPUs, 64 GB memory each) |
| **Coordinator nodes** | 3 × c6g.xlarge (4 vCPUs, 8 GB memory each) |
| **Semantic highlighting model** | `opensearch-semantic-highlighter-v1` deployed remotely at Amazon SageMaker endpoint with **single GPU-based ml.g5.xlarge** |
| **Embedding model** | `sentence-transformers/all-MiniLM-L6-v2` deployed within OpenSearch cluster |
| **Benchmark client** | ARM64, 16 cores, 61 GB RAM |
| **Test configuration** | 10 warmup iterations, 50 test iterations, 3 shards, 0 replicas |

We tested with two document sets with different document length:

| Dataset | Document length | Mean tokens | P50 tokens | P90 tokens | Max tokens |
|---|---|---|---|---|---|
| **MultiSpanQA** | Long documents | ~303 | ~278 | ~513 | ~1,672 |
| **MultiSpanQA-Short** | Short documents | ~79 | ~70 | ~113 | ~213 |

### Latency

We measured the latency overhead of semantic highlighting by comparing semantic search with and without highlighting enabled. The baseline semantic search latency is approximately 20-25ms across all configurations. The table below shows the highlighting overhead only (values exclude the baseline search time). All latency measurements are service-side took times from OpenSearch responses.

| K-value | Search clients | Doc length | Without batch P50 (ms) | With batch P50 (ms) | P50 Improvement | Without batch P90 (ms) | With batch P90 (ms) | P90 Improvement |
|---|---|---|---|---|---|---|---|---|
| 10 | 1 | Long | 209 | 123 | 70% | 262 | 179 | 46% |
| 10 | 4 | Long | 378 | 171 | 121% | 487 | 302 | 61% |
| 10 | 8 | Long | 699 | 309 | 126% | 955 | 624 | 53% |
| 10 | 1 | Short | 175 | 55 | 218% | 217 | 59 | 268% |
| 10 | 4 | Short | 327 | 62 | 427% | 445 | 120 | 271% |
| 10 | 8 | Short | 610 | 101 | 504% | 860 | 227 | 279% |
| 50 | 1 | Long | 867 | 633 | 37% | 999 | 717 | 39% |
| 50 | 4 | Long | 1,937 | 912 | 112% | 2,248 | 1,685 | 33% |
| 50 | 8 | Long | 3,638 | 1,474 | 147% | 4,355 | 3,107 | 40% |
| 50 | 1 | Short | 760 | 82 | 827% | 828 | 205 | 304% |
| 50 | 4 | Short | 1,666 | 193 | 763% | 1,971 | 362 | 445% |
| 50 | 8 | Short | 3,162 | 219 | 1344% | 3,704 | 729 | 408% |

The benchmarking demonstrates that batch processing reduces the semantic highlighting overhead. For short documents with k=50 and 8 clients, batch processing reduces highlighting latency from 3,162ms to just 219ms (P50)—a **1344% improvement**. The P90 latency also shows improvements (408%), demonstrating consistent performance benefits. The semantic search baseline (~25ms) remains constant, so these improvements directly translate to faster end-to-end response times.

**Key findings:**

* **K=10**: Moderate to significant improvement (46-504% for P50, 46-279% for P90)
* **K=50**: Dramatic improvement (37-1344% for P50, 33-445% for P90)
* **Short documents benefit more**: Up to 1344% faster (P50) vs 147% for long documents at k=50
* **P50 shows larger gains**: Median latency improves more than tail latency, but both benefit significantly

### Throughput

We also measured the throughput (mean operations per second) to understand how batch processing affects the system's capacity to handle concurrent requests. The results show consistent improvements across all configurations.

| K-value | Search clients | Doc length | Without batch (ops/s) | With batch (ops/s) | Improvement |
|---|---|---|---|---|---|
| 10 | 1 | Long | 4.23 | 6.29 | 49% |
| 10 | 4 | Long | 9.18 | 17.9 | 95% |
| 10 | 8 | Long | 10.02 | 21.27 | 112% |
| 10 | 1 | Short | 4.83 | 11.59 | 140% |
| 10 | 4 | Short | 10.47 | 37.79 | 261% |
| 10 | 8 | Short | 12.03 | 48.33 | 302% |
| 50 | 1 | Long | 1.11 | 1.49 | 34% |
| 50 | 4 | Long | 1.99 | 3.74 | 88% |
| 50 | 8 | Long | 2.12 | 4.28 | 102% |
| 50 | 1 | Short | 1.27 | 4.3 | 239% |
| 50 | 4 | Short | 2.27 | 11.55 | 409% |
| 50 | 8 | Short | 2.43 | 14.33 | 490% | |

The throughput improvements demonstrate that batch processing not only reduces individual query latency but also increases the overall system capacity, allowing you to serve more concurrent users with the same infrastructure.

## Conclusion

Batch processing in OpenSearch 3.3 brings significant performance improvements to semantic highlighting for remote models. By reducing ML inference calls from N to 1 per search, we've delivered:

* **100-200% faster** for typical workloads (10+ results)
* **Lower latency** and more predictable performance
* **Reduced infrastructure costs** (better GPU utilization)
* **Backward compatible** - existing queries work unchanged
