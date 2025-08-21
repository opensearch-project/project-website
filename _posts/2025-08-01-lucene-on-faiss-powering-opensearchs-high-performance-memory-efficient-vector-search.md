---
layout: post
title:  "Lucene-On-Faiss : Powering OpenSearch's high-performance, memory-efficient vector search"
authors:
 - kdooyong
 - vamshin
date: 2025-08-01
categories:
 - technical-posts
 - community
meta_keywords: OpenSearch vector engine, vector search, pluggable storage, Faiss, k-NN search, LuceneOnFaiss, performance optimization
meta_description: Showcase how a hybrid approach that takes the best from Lucene and Faiss to achieve better performance.
has_math: false
has_science_table: true
---

# Lucene-On-Faiss : Powering OpenSearch's high-performance, memory-efficient vector search

# Intro

[Vector search](https://opensearch.org/vector-search/) is the backbone of modern applications like semantic search, recommendation systems, and generative AI retrieval, enabling machines to find similar items by comparing their positions in a high-dimensional space. However, existing vector search engines often face limitations - Faiss, a powerful ANN library, requires the entire index to fit in memory, constraining scalability, while Lucene's vector search, though more memory-efficient, has lacked the performance of Faiss.

To address these tradeoffs, we've developed a hybrid approach called Lucene-on-Faiss that combines the best of both worlds. By enabling Lucene's search engine to directly leverage Faiss' high-performance HNSW graph indices, we've unlocked a 2X boost in search throughput while overcoming Faiss' memory limitations. In this post, we'll dive into how this integration works and the impressive performance results it delivers for OpenSearch's vector search use cases.


# Toward the best vector database: A hybrid approach

We’re on a mission to continue to be the best vector database in the world that doesn’t just meet expectations, but redefines them. To get there, we took a pragmatic approach: learn from the best. We combined the strongest aspects of the most battle-tested libraries in the space—Faiss and Lucene. But before diving into our hybrid design, let’s first walk through how Faiss and Lucene work individually.


## How Faiss works

Faiss, developed by Facebook AI Research, is a high-performance library written in C++ for similarity search that uses SIMD instructions to efficiently compute distances between vectors. It offers powerful features like product quantization (PQ), FP16 support, and GPU-based indexing, making it ideal for large-scale, high-throughput applications. 

However, Faiss requires loading the entire index into memory. This means the engine allocates a contiguous off-heap memory block equal to the size of the vector data. For example, a 10GB flat index requires 10GB of physical memory. As a result, Faiss cannot operate in memory-constrained environments where a system has 16GB of RAM, it is simply not feasible to use a Faiss index larger than 16GB, making scalability a challenge without significant hardware investment.

~~Since OpenSearch is heavily using Faiss as one of its vector engines, it inherits both its strengths and limitations.~~


## How Lucene works

Lucene is a highly optimized search engine library written in Java that has recently added native support for vector search, enabling similarity search alongside traditional keyword and filter queries. Unlike Faiss, Lucene allows partial loading of vector data and supports scoring-based retrieval. This design makes Lucene more flexible and resource-efficient, particularly in memory-constrained environments. A key factor behind this efficiency is Lucene’s Directory abstraction, which controls how data is read from and written to the underlying storage. Users can choose different Directory implementations based on their performance and resource requirements. 

For example, NIOFSDirectory reads bytes directly from the filesystem on every request, trading off higher latency for lower memory usage. In contrast, MMapDirectory, which is the default in OpenSearch, uses operating system memory mapping to access files, reducing I/O overhead but increasing memory consumption. This configurability allows users to tailor Lucene’s vector search to their hardware constraints, enabling operation in low-memory environments which something difficult to achieve with Faiss’s all-in-memory approach.

Additionally, Lucene’s implementation of the HNSW graph algorithm includes optimizations beyond those in Faiss. These include the early termination in concurrent searches where minimum eligible scores are shared between threads to speed up convergence, and visiting more vectors during filtering scenarios to improve recall.

However, Lucene lacks support for multiple SIMD optimizations in its distance calculations — for example, bulk XOR operations or support for FP16 and BFP16 formats. These are the areas where Faiss shines. Now you can see the value of this hybrid approach: we can leverage Faiss's SIMD-powered distance computations while continuing to use Lucene's efficient HNSW algorithm for search.


## Lucene-On-Faiss : Combine lucene and faiss

Faiss is great at fast vector search thanks to its use of SIMD for distance calculations. Lucene, meanwhile, shines when it comes to early termination in concurrent searches and loading only the parts of the index it needs. We're trying to bring the best of both worlds together. 

The idea is to plug Faiss’s index into Lucene’s HNSW algorithm, so we can use Lucene’s partial loading and early termination features, while letting Faiss handle the distance computations with its optimized code. This integration allows us to operate vector search under memory constraints even with Faiss index, while also benefiting from Lucene’s concurrent HNSW optimizations.

As the first step, we’ve successfully gotten Lucene’s HNSW algorithm to run on an index built with Faiss. The remaining pieces of the integration are still in progress and will be completed soon.
[Image: Image.jpg]
![LuceneOnFaiss: Running Lucene HNSW algorithm on Faiss index](assets/media/blog-images/2025-08-01-lucene-on-faiss-powering-opensearchs-high-performance-memory-efficient-vector-search/running-lucene-hnsw-algorithm-on-faiss-index.png){:style="width: 100%; max-width: 800px;"}
From user’s perspective, this hybrid set-up is completely transparent. You can enable or disable it using an index setting, and OpenSearch handles the rest behind the scenes. To enable this, use the following request and set `index.knn.memory_optimized_search` to `true`:

```
PUT /my_index
{
  "settings" : {
    "index.knn": true,
    "index.knn.memory_optimized_search" : true # Defaults to false
  },
  "mappings": {
    <Index fields>
  }
}
```


In [OpenSearch’s 3.1](https://opensearch.org/blog/get-started-with-opensearch-3-1/) version, enabling the on-disk mode with 1x compression also activates this hybrid approach at field level. In future releases we will make this approach default for all compression levels with on-disk mode.

```
PUT /my_index
{
  "mappings": {
    "properties": {
      "my_field": {
        <Other info>
        "mode": "on_disk",
        "compression_level": "1x"
      }
    }
  }
}
```


Lucene-on-faiss is supported for all the HNSW configurations including 1x, 2x, 4x, 16x, 32x compressions. Current release do not support training based techniques like IVF, PQ


# Performance results

## Running 30GB Faiss index in t2.large instance

Obviously, with this scheme, there's no need to load all bytes into memory, which makes it possible to run vector search with Faiss engine even in memory-constrained environments! For example, the Faiss index for Cohere-10m data set is around 30GB. When I attempted to run it on a t2.large instance with only 8GB of memory, the OpenSearch process was killed due to failure in allocating enough memory. However, with this new setting enabled, OpenSearch runs successfully, even under such tight memory constraints. Naturally, since not all required vectors are held in memory in this setup, some must be read from disk, leading to slower performance compared to an all-in-memory configuration.


## Search QPS comparison

So, what’s the QPS difference when all bytes are loaded into memory under the same environment? 

Faiss C++ still demonstrates superior performance for FP32 and FP16 due to its use of bulk SIMD for fast distance computation, whereas Java suffers overhead from converting FP16 to FP32. For both FP32 and FP16, we observed a slight improvement in recall, which can be attributed to Faiss using a fixed budget to explore the HNSW graph, while Lucene continues exploration until no promising candidates remain. 

In quantization scenarios (8x, 16x, and 32x), Lucene on Faiss achieves better performance with a mild drop (up to 4.5%) in recall, primarily due to Lucene’s early termination logic, which requires enhancement in future releases. Additionally, as the value of k increases, the QPS gap widens. At 32x quantization with k=100, Lucene on Faiss nearly doubles the QPS. Therefore, Lucene on Faiss not only proves valuable in memory-constrained environments but also shows strong potential when enabled for 32x quantization!

Note that in the below table, a -9.56% change in QPS indicates a 9.56% performance degradation for LuceneOnFaiss, while a 51.52% change reflects a 51.52% improvement (so it becomes faster!). In the 'Recall Drops' column, a positive value (e.g., 0.14%) means recall has improved by that amount, whereas a negative value (e.g., -4.52%) indicates a corresponding decrease in recall.

**K=30**

|	|Faiss C++	|Lucene On Faiss	|QPS Improvement	|Recall Drops	|	|
|---	|---	|---	|---	|---	|---	|
|Index Type	|Max QPS	|P99 Latency (ms)	|Recall	|Max QPS	|P99 Latency (ms)	|Recall	|
|FP32	|5419.7308	|5	|85.01	|4901.7447	|5.6	|85.13	|-9.56%	|0.14%	|	|
|FP16	|3157.6034	|4.9	|85.11	|1881.0994	|6.2	|85.37	|-40.43%	|0.31%	|	|
|8x Quantization	|404.0391	|8.7	|85.29	|714.5516	|9.1	|82.94	|76.85%	|-2.76%	|	|
|16x Quantization	|395.7132	|8.7	|85.39	|732.4748	|7.2	|82.42	|85.10%	|-3.48%	|	|
|32x Quantization	|539.9027	|7.6	|83.18	|818.05	|6.8	|79.42	|51.52%	|-4.52%	|	|
|	|	|	|	|	|	|	|	|	|	|

**K=100**

|	|Faiss C++	|Lucene On Faiss	|QPS Improvement	|Recall Drops	|	|
|---	|---	|---	|---	|---	|---	|
|Index Type	|Max QPS	|P99 Latency (ms)	|Recall	|Max QPS	|P99 Latency (ms)	|Recall	|
|FP32	|3242.3189	|5.8	|92.42	|2667.47	|6.8	|92.78	|-17.73%	|0.39%	|	|
|FP16	|1908.3005	|7	|90.74	|982.71	|8.5	|92.26	|-48.50%	|1.68%	|	|
|8x Quantization	|174.8153	|13.3	|87.86	|411.7968	|8.4	|87.17	|135.56%	|-0.79%	|	|
|16x Quantization	|169.87	|13	|87.9	|431.6184	|8.9	|86.96	|154.09%	|-1.07%	|	|
|32x Quantization	|227.95	|13.3	|87.4	|472.4701	|7.9	|85.9	|107.27%	|-1.72%	|	|
|	|	|	|	|	|	|	|	|	|	|

Following is the testing environment:

* Data set : Cohere-10M
* Metric : Cosine similarity.
* FP32 : 3 nodes of r6g.4xlarge, 6 shards
* FP16 : 3 nodes of r6g.2xlarge, 6 shards
* 8x, 16x and 32x quantization : 3 nodes of r7gd.2xlarge, 6 shards

# What’s next?

There’s still a lot of untapped potential in the current setup. With the initial integration, SIMD is already being used internally for FP32 vectors, but not yet for FP16 or binary vectors. In the next stage, we plan to enable Faiss’s SIMD optimizations for all vector types. For example, FP16 needs to be converted to FP32 in current implementation, but with SIMD, we can skip that step and compute distances directly in Java. And it's not just limited to FP16, other data types can also benefit from SIMD integration in Java, leading to even better speed! 

Addition to this, we’re also looking into explicitly loading vectors off-heap to further boost performance. Overall, there are plenty of opportunities to make things faster and more efficient—we’ll keep pushing these improvements into OpenSearch!

Interested in how the feature is progressing or want to get involved? Follow the development of the feature and join the conversation on [this GitHub issue](https://github.com/opensearch-project/OpenSearch/issues/9568).



















