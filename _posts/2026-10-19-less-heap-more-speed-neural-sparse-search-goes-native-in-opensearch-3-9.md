---
layout: post
title: "Less heap, more speed: Neural sparse search goes native in OpenSearch 3.9"
authors:
  - zirui
  - liyun
  - yych
  - kolchfa
date: 2026-10-19
categories:
  - technical-posts
has_science_table: true
meta_keywords: neural sparse search, sparse ANN, SEISMIC, native engine, approximate search, OpenSearch
meta_description: The OpenSearch native engine runs approximate neural sparse search in C++ with its index off the JVM heap. We benchmark it on 138 million documents.
excerpt: The OpenSearch native engine runs approximate neural sparse search in C++ and serves its index from the operating system's file cache instead of the JVM heap. On 138 million documents, it returned results about 6 to 32 times faster than the default Lucene engine at the same search quality.
---

Neural sparse search lets you search by meaning while keeping the speed and transparency of a keyword index. However, as your collection grows to hundreds of millions of documents, each query must score more documents, and the cluster needs more memory to store the index.

In this blog post, we'll introduce the OpenSearch native engine for neural sparse search. It runs the same approximate search algorithm that OpenSearch already offers, but in C++, with its index served from the operating system's file cache instead of the JVM heap. We'll show you how to enable it and share benchmark results on a three-node cluster with 138 million documents. At the same search quality (recall, defined later in this post), the native engine answered queries about 6 to 32 times faster than the default Lucene engine, which stores its index on the JVM heap.

## Approximate neural sparse search with SEISMIC

A neural sparse model represents each document as a short list of weighted terms, called a *sparse vector*. To answer a query, OpenSearch finds the documents whose weighted terms best match the query's. An exact search must check every document that shares a term with the query, so its cost grows with the number of documents that match the query.

OpenSearch 3.3 introduced an *approximate* search based on the Spilled Clustering of Inverted Lists with Summaries for Maximum Inner Product Search ([SEISMIC](https://dl.acm.org/doi/10.1145/3626772.3657769)) algorithm. Think of a library in which for each term, the matching documents are grouped into boxes, and each box carries a short label describing its contents. At query time, OpenSearch reads the labels first, skips the boxes that are unlikely to contain a top result, and opens only the promising ones. To compute exact scores for the documents in the opened boxes, it reads their full vectors from a structure called the *forward index*. SEISMIC calls the boxes *blocks* and the labels *summaries*, and the rest of this post uses these terms.

Two query parameters control the trade-off between speed and quality:

- `top_n`: Sets the number of the query's highest-weighted terms used in the search (for example, 3 to 7).
- `heap_factor`: Controls the number of blocks that OpenSearch scores. With the Lucene engine and the native shared layout, `heap_factor` is a multiplier applied to each block's summary score: OpenSearch skips a block when its summary score multiplied by `heap_factor` is lower than the score of the current *k*-th best result. With the native per-block layout, OpenSearch converts `heap_factor` into a fixed number of blocks to read (20 blocks at a `heap_factor` of 1.0, and one block more or fewer for each 0.01 change). In both cases, higher values produce higher recall and lower values reduce latency.

For more information about the algorithm, see the [SEISMIC announcement blog post](https://opensearch.org/blog/scaling-neural-sparse-search-to-billions-of-vectors-with-approximate-search/) and the [neural sparse ANN documentation](https://docs.opensearch.org/latest/vector-search/ai-search/neural-sparse-ann/).

## How the native engine keeps the index off the JVM heap

The Lucene engine stores the forward index on the JVM heap. You set the JVM heap size when you start a node, so a large forward index requires a large heap: about 66 GiB per node in our 138-million-document benchmark.

The native engine stores the forward index in a file and reads it through the operating system's file cache (the *page cache*). The operating system uses available memory for the page cache and can reclaim it when other processes need memory. Scoring runs in a C++ library that OpenSearch calls directly. The following diagram shows how the native engine processes a query.

![Diagram of the native engine. A neural_sparse query in the OpenSearch node is passed to the native C++ scorer for each shard. The scorer reads block summaries, skips unpromising blocks, reads document vectors from the forward index file, which is cached in the operating system page cache outside the JVM heap, and returns its top results to be combined across shards.](/assets/media/blog-images/2026-10-19-less-heap-more-speed-neural-sparse-search-goes-native-in-opensearch-3-9/native-engine-architecture.png){:class="img-centered"}

You query the native engine with the same `neural_sparse` query syntax as the Lucene engine.

## Choosing between two forward index layouts

The native engine supports two forward index layouts, which you select using the `forward_index` mapping parameter. Both layouts store the same 8-bit quantized vectors; they differ only in where each document's vector is placed:

- **Shared layout** (`"forward_index": "shared"`, the default): Each document's vector is stored once, in order of document ID. This layout uses less disk space and builds faster.
- **Per-block layout** (`"forward_index": "per_block"`): Each block stores its own copy of the vectors of the documents that it contains, so a query reads only the blocks that it opens, each as one contiguous range. This layout has lower latency and needs less memory, but uses more disk space. For measurements of both layouts, see [Benchmarking the native engine on 138 million documents](#benchmarking-the-native-engine-on-138-million-documents).

The following diagram compares how a query reads vectors in each layout.

![Diagram comparing the two layouts. In the shared layout, one forward index is ordered by document ID and each document's vector is stored once, so a query reads vectors from many locations in the file. In the per-block layout, each block stores its own copy of the vectors of the documents that it contains, so a query reads only the blocks that it opens, each as one contiguous range.](/assets/media/blog-images/2026-10-19-less-heap-more-speed-neural-sparse-search-goes-native-in-opensearch-3-9/forward-index-layouts.png){:class="img-centered"}

## Getting started with the native engine

The following examples use OpenSearch 3.9.0 and assume that you have deployed a sparse encoding model and ingested documents with sparse embeddings. For more information, see [Neural sparse search](https://docs.opensearch.org/latest/vector-search/ai-search/neural-sparse-search/).

First, enable the native engine for your cluster:

```json
PUT _cluster/settings
{
  "persistent": {
    "plugins.neural_search.sparse.native_engine_enabled": true
  }
}
```

Next, create an index that uses the native engine. The following request creates an index with the shared layout. To use the per-block layout, set `forward_index` to `per_block`:

```json
PUT my-sparse-index
{
  "settings": { "index": { "sparse": true } },
  "mappings": {
    "properties": {
      "sparse_embedding": {
        "type": "sparse_vector",
        "method": {
          "name": "seismic",
          "engine": "native",
          "parameters": {
            "approximate_threshold": 1000000,
            "forward_index": "shared"
          }
        }
      }
    }
  }
}
```

The `approximate_threshold` parameter sets the minimum number of documents that a segment must contain for OpenSearch to build the approximate index for it. OpenSearch searches smaller segments exactly. The other build parameters are optional. If you omit `n_postings`, OpenSearch sets it to 0.05% of the number of documents in each segment, with a minimum of 160. The `cluster_ratio` and `summary_prune_ratio` parameters default to `0.1` and `0.4`, respectively.

Then search the index using a `neural_sparse` query. In `method_parameters`, `k` is the number of results to return, and `top_n` and `heap_factor` are the parameters described earlier:

```json
GET my-sparse-index/_search
{
  "query": {
    "neural_sparse": {
      "sparse_embedding": {
        "query_text": "how do sparse vectors work",
        "model_id": "<model ID>",
        "method_parameters": { "k": 10, "top_n": 5, "heap_factor": 1.0 }
      }
    }
  }
}
```

## Benchmarking the native engine on 138 million documents

We compared three ways of running the same approximate search algorithm: the Lucene engine and the native engine with each of its two layouts.

### Benchmark configuration

We ran all tests on a three-node cluster with the following configuration.

| Setting | Value |
|---|---|
| Nodes | 3 × AWS `r7g.12xlarge` (48 vCPUs, 384 GiB memory, 2 TiB Amazon Elastic Block Store (Amazon EBS) gp3 storage each) |
| Index | 3 primary shards and 0 replicas, so each node hosts one shard of about 46 million documents |
| Dataset | MS MARCO passage v2 (a public web passage collection), 138,364,198 documents |
| Encoding model | `opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte` |
| Parameters | Default build parameters; `top_n` = 5; `heap_factor` adjusted to reach each target recall |

We report two metrics:

- **Recall@10**: The fraction of the true top 10 results (found by an exact search) that the approximate search returned. For example, a recall of 0.90 indicates that the approximate search returned 9 of the true top 10 results.
- **Latency**: The server-side search time per query, at the median (p50) and the 99th percentile (p99). Because OpenSearch searches the three shards in parallel, we report the latency of the slowest shard. All latencies are *warm*: we measured them after a warmup pass, once the data that the queries read had been loaded into memory.

### Latency at matched recall

The following figure shows the trade-off between recall and latency for each implementation. Each point is one `heap_factor` setting, and lower points indicate lower latency. The left panel shows a smaller, 8.8-million-document dataset (MS MARCO passage v1) for comparison.

![Two line charts of recall@10 compared with median latency on a log scale for 8.8 million and 138 million documents. At both scales the native per-block layout has the lowest latency, followed by the native shared layout and then the Lucene engine.](/assets/media/blog-images/2026-10-19-less-heap-more-speed-neural-sparse-search-goes-native-in-opensearch-3-9/recall-latency-frontier.png){:class="img-centered"}

The following table compares the three implementations at two recall targets on 138 million documents.

| Recall target | Implementation | Recall@10 | p50 latency (ms) | p99 latency (ms) | p50 speedup |
|---|---|---|---|---|---|
| About 0.90 | Lucene engine | 0.902 | 4.90 | 20.26 | 1× |
| About 0.90 | Native, shared layout | 0.892 | 0.72 | 3.84 | 6.8× |
| About 0.90 | Native, per-block layout | 0.903 | 0.38 | 1.32 | 12.8× |
| About 0.96 | Lucene engine | 0.959 | 28.17 | 73.23 | 1× |
| About 0.96 | Native, shared layout | 0.960 | 4.85 | 13.85 | 5.8× |
| About 0.96 | Native, per-block layout | 0.957 | 0.87 | 2.41 | 32.4× |

At both recall targets, the native engine responded faster with either layout, and the per-block layout responded fastest. In our tests, the speedup increased with dataset size: on 8.8 million documents, the native engine was about 3 to 10 times faster than the Lucene engine; on 138 million documents, it was about 6 to 32 times faster.

The per-block layout achieved these latencies even though its index (760 GiB per shard) is about twice the size of each node's memory, so only part of the index was in memory at any time.

### Memory footprint

The following table shows how much JVM heap each implementation used to store its forward index on 138 million documents.

| Implementation | Forward index location | JVM heap used by the forward index |
|---|---|---|
| Lucene engine | JVM heap | About 66 GiB per node |
| Native, shared layout | Operating system page cache | Not on the heap |
| Native, per-block layout | Operating system page cache | Not on the heap |

The native engine doesn't need any JVM heap for the forward index. In our tests with limited memory, described in the next section, each node served its shard with a 4 GiB JVM heap.

### Latency under memory limits

Because the native engine reads its index through the page cache, you can run it with less memory than the index size. To measure the memory that each layout requires, we limited each node's total memory with a Linux control group (`cgroup`) and measured warm median latency at a recall of about 0.90. These runs used a 500-query subset and different `heap_factor` values than the runs in the preceding table, so the latencies differ slightly from the preceding table's values.

The following table shows the median latency of each native layout as the memory limit decreases.

| Memory limit per node | Native, shared layout (222 GiB per shard) | Native, per-block layout (760 GiB per shard) |
|---|---|---|
| 200 GiB | 0.62 ms | 0.41 ms |
| 100 GiB | 0.61 ms | 0.41 ms |
| 48 GiB | 0.62 ms | 0.42 ms |
| 32 GiB | 98 ms | 0.42 ms |

The shared layout maintained its latency with a memory limit as low as 48 GiB, about 22% of its shard size. At 32 GiB, its median latency rose to 98 ms, so we recommend providing the shared layout with memory equal to at least 25% of its shard size. At the same 32 GiB limit, about 4% of its shard size, the per-block layout maintained nearly the same latency (0.42 ms).

When the page cache is empty, for example after a machine restart, the first queries read their data from disk and have higher latency. Once the data is cached, queries run at the latencies shown here. The native engine doesn't use the [Warm Up API](https://docs.opensearch.org/latest/vector-search/api/neural/#warm-up), which applies only to the Lucene engine. For more information, see [Comparing the engines](https://docs.opensearch.org/latest/vector-search/ai-search/neural-sparse-ann/#comparing-the-engines). To reduce the number of slow initial queries, run a set of representative queries before sending production traffic.

### Build time and disk usage

OpenSearch builds the approximate index when it merges segments. The following table shows the time to merge each 138-million-document index into one segment per shard.

| Implementation | Merge time |
|---|---|
| Lucene engine | 9 h 27 min |
| Native, shared layout | 2 h 32 min |
| Native, per-block layout | 4 h 28 min |

In our runs, the native layouts built 2.1 to 3.7 times faster than the Lucene engine. On disk, the shared layout used 222 GiB per shard and the per-block layout used 760 GiB per shard, so the per-block layout requires about 3.4 times the disk space of the shared layout.

## Choosing a layout and tuning the native engine

Based on these results, we recommend the following:

- **Choose the layout based on latency, memory, and disk**: Use the shared layout when disk space and build time matter most and you can provide each node with memory equal to at least 25% of its shard size. Use the per-block layout (`"forward_index": "per_block"`) when you need the lowest latency or when memory is much smaller than the index, and provision about 3.4 times the disk space that the shared layout would require.
- **Warm up after a restart**: Run a set of representative queries before sending production traffic.
- **Start with the default build parameters**: We measured all results in this post using the defaults.
- **Tune recall with `heap_factor`**: Keep `top_n` small and adjust `heap_factor` to reach your target recall.

## Next steps

To try the native engine, enable it on a test cluster and create an index with `"engine": "native"`, as shown in [Getting started with the native engine](#getting-started-with-the-native-engine). Because you can't change the `method` object after you create the field, moving an existing index to the native engine requires reindexing: create a new index with `"engine": "native"` and reindex your data into it. For more information about the parameters, see the [neural sparse ANN documentation](https://docs.opensearch.org/latest/vector-search/ai-search/neural-sparse-ann/).

We'd like to hear how the native engine performs with your workloads. Share your results and questions on the [OpenSearch forum](https://forum.opensearch.org/), and if you'd like to contribute, visit the [neural-search](https://github.com/opensearch-project/neural-search) and [neural-sparse-cpp](https://github.com/opensearch-project/neural-sparse-cpp) repositories.
