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

Neural sparse search lets you search by meaning while keeping the speed and transparency of a keyword index. As your collection grows into the hundreds of millions of documents, though, the work behind each query grows with it, and so does the memory needed to serve it.

In this blog post, we'll introduce the OpenSearch native engine for neural sparse search. It runs the same approximate search algorithm that OpenSearch already offers, but in C++, with its index served from the operating system's file cache instead of the JVM heap. We'll show you how to turn it on and share benchmark results on a 3-node cluster with 138 million documents. At the same search quality (recall, defined later in this post), the native engine answered queries about **6 to 32 times** faster than the default Lucene engine, which stores its index on the JVM heap.

## A quick refresher on approximate neural sparse search

A neural sparse model represents each document as a short list of weighted terms, called a *sparse vector*. To answer a query, OpenSearch looks for documents whose weighted terms best match the query's. An exact search has to check every document that shares a term with the query, which becomes expensive at scale.

OpenSearch 3.3 introduced an *approximate* search based on the [SEISMIC](https://dl.acm.org/doi/10.1145/3626772.3657769) algorithm. Think of a library where, for each term, the matching documents are grouped into boxes, and each box carries a short label describing its contents. At query time, OpenSearch reads the labels first, skips the boxes that are unlikely to contain a top result, and only opens the promising ones. To compute exact scores for the documents in the opened boxes, it reads their full vectors from a structure called the *forward index*. In SEISMIC, these boxes are called *blocks*, and their labels are called *summaries*; the rest of this post uses those terms.

Two query parameters control the trade-off between speed and quality:

- `top_n`: how many of the query's highest-weighted terms to search with (for example, 3 to 7).
- `heap_factor`: controls how many blocks OpenSearch scores. With the Lucene engine and the native shared layout, it is a multiplier on each block's summary score: OpenSearch skips a block when its summary score multiplied by `heap_factor` is lower than the score of the current *k*-th best result. With the native per-block layout, OpenSearch converts `heap_factor` into a fixed number of blocks to read (20 blocks at `heap_factor` 1.0, and one block more or fewer for each 0.01 change). In both cases, higher values give higher recall and lower values give lower latency.

For a complete walkthrough of the algorithm, see the [SEISMIC announcement blog post](https://opensearch.org/blog/scaling-neural-sparse-search-to-billions-of-vectors-with-approximate-search/) and the [neural sparse ANN documentation](https://docs.opensearch.org/latest/vector-search/ai-search/neural-sparse-ann/).

## How the native engine keeps the index off the JVM heap

In the default Lucene engine, the forward index is held in memory on the JVM heap. The JVM heap is a fixed amount of memory that you reserve for OpenSearch when you start a node, so at large scale you need to reserve a lot of it ahead of time.

The native engine stores the forward index in a file and reads it through the operating system's file cache (the *page cache*). The operating system uses whatever memory is free for that cache and can reclaim it when other processes need memory. The scoring itself runs in a C++ library that OpenSearch calls directly. The following diagram shows how a query flows through the native engine.

![Diagram of the native engine. A neural_sparse query in the OpenSearch node is passed to the native C++ scorer for each shard. The scorer reads block summaries, skips unpromising blocks, reads document vectors from the forward index file, which is cached in the operating system page cache outside the JVM heap, and returns its top results to be combined across shards.](/assets/media/blog-images/2026-10-19-less-heap-more-speed-neural-sparse-search-goes-native-in-opensearch-3-9/native-engine-architecture.png){:class="img-centered"}

You query the native engine with the same `neural_sparse` query syntax as the Lucene engine.

## Choosing between two forward index layouts

The native engine can arrange the forward index in two ways, which you choose with the `forward_index` mapping parameter. Both layouts store the same 8-bit quantized vectors; they differ only in where each document's vector is placed:

- **Shared layout** (`"forward_index": "shared"`, the default): each document's vector is stored once, in order of document ID. This layout uses less than a third of the disk space of the per-block layout and builds faster. In our tests, it kept its latency when about a quarter of its shard size was available in memory.
- **Per-block layout** (`"forward_index": "per_block"`): each block keeps its own copy of the vectors of the documents it contains, so a query reads only the few blocks it opens, each in one piece. In our tests, this layout had the lowest latency at every recall level we tested (about 1.6 times faster than the shared layout at a recall of 0.90 and 5.6 times faster at 0.96) and kept its latency with about 4% of its shard size in memory. In exchange, it needs about 3.4 times the disk space of the shared layout.

The following diagram compares how a query reads vectors in each layout.

![Diagram comparing the two layouts. In the shared layout, one forward index is ordered by document ID and each document's vector is stored once, so a query collects vectors from many places in the file. In the per-block layout, each block stores its own copy of the vectors of the documents it contains, so a query reads only the blocks it opens, each in one piece.](/assets/media/blog-images/2026-10-19-less-heap-more-speed-neural-sparse-search-goes-native-in-opensearch-3-9/forward-index-layouts.png){:class="img-centered"}

## Getting started with the native engine

The following examples use OpenSearch 3.9.0.

First, enable the native sparse engine for your cluster:

```json
PUT _cluster/settings
{
  "persistent": {
    "plugins.neural_search.sparse.native_engine_enabled": true
  }
}
```

Next, create an index that uses the native engine. The `forward_index` parameter selects the layout: `shared` (the default) or `per_block`:

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

The `approximate_threshold` parameter sets how many documents a segment must contain before OpenSearch builds the approximate index for it; smaller segments are searched exactly. The other build parameters are optional. If you omit `n_postings`, OpenSearch sets it to 0.05% of the number of documents in each segment (at least 160); `cluster_ratio` and `summary_prune_ratio` default to 0.1 and 0.4.

Then search the index as usual. In `method_parameters`, `k` is the number of results to return, and `top_n` and `heap_factor` are the parameters described earlier:

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

This example assumes that you have deployed a sparse encoding model and ingested documents with sparse embeddings. For setup steps, see [Neural sparse search](https://docs.opensearch.org/latest/vector-search/ai-search/neural-sparse-search/).

## Benchmarking the native engine on 138 million documents

We compared three ways of running the same approximate search algorithm: the Lucene engine and the native engine with each of its two layouts.

### Test setup

We ran all tests on a 3-node cluster with the following configuration.

| Setting | Value |
|---|---|
| Nodes | 3 × AWS `r7g.12xlarge` (48 vCPUs, 384 GiB memory, 2 TiB EBS gp3 storage each) |
| Index | 3 primary shards and 0 replicas, so each node holds one shard of about 46 million documents |
| Dataset | MS MARCO passage v2 (a public web passage collection), 138,364,198 documents |
| Encoding model | `opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte` |
| Parameters | Default build parameters; `top_n` = 5; `heap_factor` adjusted to reach each target recall |

We report two metrics:

- **Recall@10**: the fraction of the true top 10 results (found by an exact search) that the approximate search returned. For example, a recall of 0.90 means 9 of the true top 10 results.
- **Latency**: the server-side search time per query, at the median (p50) and the 99th percentile (p99). Because the 3 shards are searched in parallel, we count the slowest shard. All latencies are *warm*: we measured them after a warm-up pass, once the data that the queries read had been loaded into memory.

### Latency at matched recall

The following figure shows the trade-off between recall and latency for each implementation. Each point is one `heap_factor` setting, and lower is faster. The left panel shows a smaller, 8.8-million-document dataset (MS MARCO passage v1) for comparison.

![Two line charts of recall@10 compared with median latency on a log scale for 8.8 million and 138 million documents. At both scales the native per-block layout has the lowest latency, followed by the native shared layout and then the Lucene engine.](/assets/media/blog-images/2026-10-19-less-heap-more-speed-neural-sparse-search-goes-native-in-opensearch-3-9/recall-latency-frontier.png){:class="img-centered"}

The following table compares the three implementations at two recall targets on 138 million documents.

| Recall target | Implementation | Recall@10 | p50 latency (ms) | p99 latency (ms) | p50 speedup |
|---|---|---|---|---|---|
| About 0.90 | Lucene engine | 0.902 | 4.90 | 20.26 | 1× |
| About 0.90 | Native, shared layout | 0.899 | 0.59 | 2.79 | 8.3× |
| About 0.90 | Native, per-block layout | 0.903 | 0.38 | 1.32 | 12.8× |
| About 0.96 | Lucene engine | 0.959 | 28.17 | 73.23 | 1× |
| About 0.96 | Native, shared layout | 0.960 | 4.85 | 13.85 | 5.8× |
| About 0.96 | Native, per-block layout | 0.957 | 0.87 | 2.41 | 32.4× |

At both recall targets, the native engine responded faster with either layout, and the per-block layout responded fastest. In our tests, the gap grew with the dataset: on 8.8 million documents, the native engine was about 3 to 10 times faster than the Lucene engine; on 138 million documents, it was about **6 to 32 times** faster.

The per-block layout reached these latencies even though its index (760 GiB per shard) is about twice the size of each node's memory, so only part of the index was in memory at any time.

### Memory footprint

The following table shows how much JVM heap each implementation used to hold its forward index on 138 million documents.

| Implementation | Where the forward index lives | JVM heap used by the forward index |
|---|---|---|
| Lucene engine | JVM heap | About 66 GiB per node |
| Native, shared layout | Operating system page cache | Not on the heap |
| Native, per-block layout | Operating system page cache | Not on the heap |

With the native engine, you don't need to reserve heap for the forward index. In our memory-limit tests, described in the next section, each node served its shard with a 4 GiB JVM heap.

### Latency under memory limits

Because the native engine reads its index through the page cache, you can run it with less memory than the index size. To measure how much memory each layout needs, we limited each node's total memory with a Linux control group (`cgroup`), kept the JVM heap at 4 GiB, and measured warm median latency at a recall of about 0.90. These runs used a 500-query subset and slightly different `heap_factor` values than the preceding table, so their latencies differ slightly from it.

The following table shows the median latency of each native layout as the memory limit decreases.

| Memory limit per node | Native, shared layout (222 GiB per shard) | Native, per-block layout (760 GiB per shard) |
|---|---|---|
| 200 GiB | 0.62 ms | 0.41 ms |
| 100 GiB | 0.61 ms | 0.41 ms |
| 48 GiB | 0.62 ms | 0.42 ms |
| 32 GiB | 98 ms | 0.42 ms |

The shared layout kept the same latency down to 48 GiB, about 22% of its shard size. At 32 GiB, its median latency rose to 98 ms, so we recommend giving the shared layout at least about a quarter of its shard size in memory. At the same 32 GiB limit, about 4% of its shard size, the per-block layout kept nearly the same latency (0.42 ms). Because a per-block query reads only the few blocks it opens, in our tests this layout needed only a small fraction of its index size in memory at this recall level.

When the page cache is empty, for example after a machine restart, the first queries read their data from disk and take longer. Once that data is cached, queries run at the latencies shown here. The native engine doesn't use the Warm Up API, which applies only to the Lucene engine. To reduce the number of slow first queries, send a set of representative queries before sending production traffic.

### Build time and disk usage

OpenSearch builds the approximate index when it merges segments. The following table shows the time to merge each 138-million-document index into one segment per shard.

| Implementation | Merge time |
|---|---|
| Lucene engine | 9 h 27 min |
| Native, shared layout | 2 h 32 min |
| Native, per-block layout | 4 h 28 min |

In our runs, the native layouts built 2.1 to 3.7 times faster than the Lucene engine. On disk, the shared layout used 222 GiB per shard and the per-block layout used 760 GiB per shard. Because the per-block layout stores a copy of each vector in every block that contains it, it needs about 3.4 times the disk space of the shared layout, so plan your storage accordingly.

## Choosing a layout and tuning the native engine

- **Choose the layout based on latency, memory, and disk.** Use the shared layout when disk space and build time matter most and you can give each node memory equal to at least about a quarter of its shard size. Use the per-block layout (`"forward_index": "per_block"`) when you want the lowest latency or when memory is much smaller than the index, and provision about 3.4 times the disk space that the shared layout would need.
- **Warm up after a restart.** Send a set of representative queries before sending production traffic so that fewer of the first requests read from disk. The Warm Up API doesn't apply to the native engine.
- **Start with the default build parameters.** All results in this post use them.
- **Tune recall with `heap_factor`.** Increase `heap_factor` for higher recall and decrease it for lower latency. Keep `top_n` small, for example 3 to 7.

## Next steps

To try the native engine, enable it on a test cluster and create an index with `"engine": "native"`, as shown in [Getting started with the native engine](#getting-started-with-the-native-engine). The `method` object can't be changed after the field is created, so to move an existing index to the native engine, create a new index with `"engine": "native"` and reindex your data. For parameter details, see the [neural sparse ANN documentation](https://docs.opensearch.org/latest/vector-search/ai-search/neural-sparse-ann/).

We'd like to hear how the native engine performs on your workloads. Share your results and questions on the [OpenSearch forum](https://forum.opensearch.org/), and if you'd like to contribute, visit the [neural-search](https://github.com/opensearch-project/neural-search) and [neural-sparse-cpp](https://github.com/opensearch-project/neural-sparse-cpp) repositories.
