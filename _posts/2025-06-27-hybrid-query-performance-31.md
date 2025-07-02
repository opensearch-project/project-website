---
layout: post
title: "Reducing hybrid query latency in OpenSearch 3.1 with efficient score collection"
category: blog
tags: [hybrid-search, performance, opensearch-3-1, vector-search, benchmark]
authors:
    - gaievski
    - macrakis
    - seanzheng
date: 2025-06-27
categories:
  - technical-posts
meta_keywords: hybrid search, boost hybrid query performance, OpenSearch 3.1, semantic search
meta_description: OpenSearch 3.1 delivers up to 3.8x faster hybrid query throughput by optimizing score collection, batching, and segment-level execution—resulting in lower latency and more predictable performance under load.
has_science_table: true
---

Hybrid queries combine the precision of traditional lexical search with the semantic power of vector search. In OpenSearch 3.1, we’ve delivered significant latency reductions for hybrid queries by redesigning how scores are collected across sub-queries. This improvement builds on the concurrent segment search capabilities already present in OpenSearch and introduces a low-level, efficient bulk scorer tailored for hybrid workloads.

### Background: Bottleneck in hybrid scoring

The new score collection enhances performance through optimized parallel execution and efficient score aggregation across query branches. Prior to 3.1, it worked as follows:

* each query branch (for example, a `match` clause and a `neural` clause) had to score documents separately.
* score collection was performed in a serialized manner, even though the OpenSearch core already supported concurrent segment-level search.
* sub-query scorers introduced additional overhead due to redundant control logic and per-document operations.

### Optimization: Smarter score collection and batch processing

In OpenSearch 3.1, we introduced a **custom bulk scorer** for hybrid queries. This scorer is designed to work with OpenSearch’s **concurrent segment search**, where different segments of an index are searched in parallel by design. Our focus was on minimizing overhead within each segment’s execution.

Key improvements include:

* **Single leaf collector** per segment: Sub-query scorers now share one leaf collector instance, eliminating redundant score collection infrastructure and improving cache locality.
* **Small batch processing**: Scorer processes documents in small, fixed-size windows (for example, 4096 documents at a time), allowing strict loops with reduced memory overhead.
* **Bit set merging**: Document IDs across sub-query scorers are tracked using efficient bit sets, which reduce memory allocations and simplify score merging.
* **Low-level control flow**: We replaced priority queues and dynamic collections with arrays and preallocated structures to minimize GC pressure and avoid runtime branching.

The following diagram shows the high-level architecture of the hybrid query execution path before and after introducing the custom bulk scorer:

![Custom bulk scorer - flow diagram](/assets/media/blog-images/2025-06-27-hybrid-query-performance-31/custom_bulk_scorer_flow_diagram.png)

This design allows hybrid queries to leverage the natural parallelism of OpenSearch's indexing structure (segments) without introducing thread-level concurrency within scorers, which often adds more overhead than benefit.

### Implementation details

Our custom bulk scorer operates on the principle of coordinated iteration across multiple sub-query scorers. Here's how it works:

* **Document ID discovery**: For each segment, we first identify candidate document IDs that match at least one sub-query.
* **Batch processing**: Rather than processing documents one at a time, we collect them in fixed-size batches. We chose a batch size of 2^12 = 4096, which provides an optimal balance between frequency of score collection and memory usage.
* **Coordinated scoring**: For each batch, we score all matching documents across all sub-queries in a tightly optimized loop, maintaining better cache locality.
* **Score combination**: Within the same iteration, scores from different sub-queries are combined according to the hybrid query's weight settings.

This approach minimizes the overhead of document iteration while maximizing the benefits of OpenSearch's segment-level concurrency model.

### Real-world results: Up to 3.5x throughput and 80% latency reductions

We evaluated the improved hybrid scorer against OpenSearch 3.0 using diverse workloads on multiple EC2 instance types. Following table shows improvements in response latency time percentiles.

| Dataset | Query type | Metric | OpenSearch 3.1 (ms) | OpenSearch 3.0 (ms) | Latency reduction |
|---------|-------------|--------|----------------------|----------------------|-------------------|
| NOAA (text only) | 1 keyword query, 1M matches | p50 | 117 | 178 | 34% |
|  |  | p90 | 128 | 193 | 34% |
|  |  | p99 | 137 | 208 | 34% |
|  | 1 keyword query, 10M matches | p50 | 183 | 703 | 74% |
|  |  | p90 | 205 | 958 | 79% |
|  |  | p99 | 220 | 1260 | 83% |
|  | 3 keyword queries, 15M matches | p50 | 336 | 1759 | 81% |
|  |  | p90 | 382 | 2518 | 85% |
|  |  | p99 | 523 | 3243 | 84% |
| Quora (hybrid) | neural + lexical | p50 | 199 | 256 | 22% |
|  |  | p90 | 240 | 332 | 28% |
|  |  | p99 | 286 | 414 | 31% |
|  | neural + 2 lexical | p50 | 248 | 337 | 27% |
|  |  | p90 | 316 | 481 | 34% |
|  |  | p99 | 387 | 603 | 36% |
|  | neural + 2 lexical + aggregations | p50 | 262 | 426 | 39% |
|  |  | p90 | 339 | 631 | 46% |
|  |  | p99 | 407 | 799 | 49% |


These gains were consistent under both benchmark and steady-load conditions (25 QPS), with performance improving even further when concurrent segment search was enabled.

Tail latencies (p99) improved by up to 49 percent even on large instances, making hybrid search more reliable under high load.

The following graph highlights improvements in response times for different datasets and query types:

![Bar chart showing performance improvements](/assets/media/blog-images/2025-06-27-hybrid-query-performance-31/bar_chart_performance_improvements.jpg)

New bulk scorer positively impacts system throughput. Following table shows improvements in search throughput depending on type of machine used as data nodes.

| Dataset | Instance type | Query complexity | Throughput gain |
|---------|----------------|------------------|------------------|
| Combined vector and text data | R5.xlarge | neural + 2 lexical + aggregations | 83% |
|  | R5.xlarge | neural + 2 lexical | 56% |
|  | C5.2xlarge | neural + 2 lexical + aggregations | 18% |
|  | R5.4xlarge | hybrid query overall | 19–27% |
| Only text data | C5.2xlarge | 1 keyword query, 10M matches | 115% |
|  | C5.2xlarge | 3 keyword queries, 15M matches | 254% |
|  | R5.xlarge | 1 keyword query, 10M matches | 272% |
|  | R5.xlarge | 3 keyword queries, 15M matches | 384% |
|  | R5.4xlarge | 1 keyword query, 10M matches | 63% |
|  | R5.4xlarge | 3 keyword queries, 15M matches | 151% |

The following graph illustrates these throughput improvements:

![Throughput bar chart](/assets/media/blog-images/2025-06-27-hybrid-query-performance-31/hybrid_query_throughput_improvement.png)

### Scaling behavior: Better utilization, more predictable performance

The improved scorer not only speeds up individual queries—it also scales more gracefully with increased hardware. On larger instances such as R5.4xlarge:

* Throughput for hybrid queries with multiple keyword-based sub-queries increased by 234 percent over 3.0 when concurrent segment search was enabled.
* Hybrid and complex hybrid queries showed up to 27 percent improvement in throughput.
* p99 latency was reduced by over 60 percent for most complex cases.

These results suggest that the custom scorer improves core efficiency rather than simply consuming more hardware.

### How we ran benchmarks

We used diverse datasets and related OpenSearch Benchmark workloads to evaluate performance of the new solution with the custom bulk scorer.

* **AI Search** workload, based on the Quora dataset, includes semantic and hybrid queries with both text and vector data.
* **Semantic Search** workload, based on the NOAA dataset, includes hybrid queries over lexical and numeric fields.

We set up the OpenSearch cluster using the [OpenSearch Cluster CDK](https://github.com/opensearch-project/opensearch-cluster-cdk) with the following parameters:

* 3 data nodes using various EC2 instance types (C5.2xlarge, R5.xlarge, R5.4xlarge) running x64 architecture
* 3 manager nodes (c5.xlarge EC2 instances)
* All cluster nodes were deployed within a single AWS Availability Zone to minimize network latency effects

We took several steps to ensure consistent and reliable benchmark results:

* All index segments were force-merged before running the tests to eliminate background merge operations
* We verified no other concurrent workloads were running on the cluster during testing

We ingested documents into an index configured with:

* `number_of_shards`: 6  
* `number_of_segments`: 8 (per shard; total = 48)

### Looking ahead

These improvements lay the groundwork for further innovation in hybrid search, including:

* Adaptive batch sizing based on query complexity and segment size
* Collecting scores in parallel within an OpenSearch segment for each sub-query

If you use hybrid queries in production or are building search features that blend lexical and vector semantics, upgrading to OpenSearch 3.1 is a great way to benefit from faster response times and more efficient resource usage.

## References

1. [GitHub issue with high-level proposal for improving response times in hybrid query](https://github.com/opensearch-project/neural-search/issues/783)  
2. [RFC with design for custom bulk scorer](https://github.com/opensearch-project/neural-search/issues/1290)  
3. [Pull request that introduces custom bulk scorer](https://github.com/opensearch-project/neural-search/pull/1289)  
4. [OpenSearch Benchmark Semantic Search workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/noaa_semantic_search)  
5. [OpenSearch Benchmark AI Search workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/neural_search)  
6. [OpenSearch Cluster CDK](https://github.com/opensearch-project/opensearch-cluster-cdk)  
7. [Previous blog post: Boosting hybrid query performance in OpenSearch 2.15](https://opensearch.org/blog/performance-improvment-hybrid-query-215/)
