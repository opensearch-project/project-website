---
layout: post
title: "Scaling Sparse Vector Search to Billions: Neural Sparse Now Supports Approximate Search for Ultra-Fast Retrieval"
category: blog
authors:
    - yuye
    - liyun
    - zirui
    - yych
date: 2025-10-14
categories:
  - technical-posts
has_science_table: true 
meta_keywords: neural sparse search, query performance, OpenSearch 3.3,
meta_description: Introducing an approximate sparse retrieval algorithm that outperforms traditional BM25 search across billion-document corpora.
excerpt: We're excited to introduce our new algorithm for sparse vector retrieval. This is an approximate algorithm that achieves unprecedented performance on billion-scale corpora, delivering query throughput faster than traditional BM25 while maintaining high recall rates.
---

Neural sparse search has emerged as a promising approach, combining the semantic understanding of neural models with the efficiency of sparse vector representations. This technique has proven effective for semantic retrieval while maintaining the advantages of traditional lexical search, offering better explanation and presentation of results through text matching. As these sparse embeddings have gained popularity among users, the growth in index size presents scalability challenges.

In essence, traditional search methods suffer from increasing query latency as collections grow. This degradation in query throughput can significantly impact user experience. In OpenSearch 2.15, we took an important first step toward addressing this challenge with a feature named [two-phase search processor](https://opensearch.org/blog/introducing-a-neural-sparse-two-phase-algorithm/). By dynamically pruning tokens with negligible weights, this approach reduces the computational load while preserving search relevance.

With this same goal of efficiency and high-quality retrieval, we’re introducing an approximate retrieval algorithm for sparse vectors named [SEISMIC](https://dl.acm.org/doi/10.1145/3626772.3657769) (**S**pilled Clust**e**ring of **I**nverted Lists with **S**ummaries for **M**aximum **I**nner Produ**c**t Search). This algorithm fundamentally changes what's possible in large-scale search. Today, we're excited to announce that Seismic algorithm is now available in OpenSearch 3.3. Seismic is able to achieve query latency faster than traditional BM25 while preserving the semantic understanding of neural sparse models. This represents a fundamental shift in the search performance landscape.

## The Seismic algorithm

The Seismic index consists of two parts: the inverted index and the forward index. Intuitively, the latter stores a mapping from document ID to sparse embeddings, where each component is a token ID and its value denotes the corresponding weight. For the inverted index, it applies multiple pruning techniques:

1. **Clustered posting list**: For each term in the inverted index, Seismic sorts documents by token weights, retains only the top documents, and applies clustering to group similar documents.
2. **Sparse vector summarization**: Each cluster maintains a summary vector containing only the highest-weighted tokens, enabling efficient pruning during query time.
3. **Query pruning**: During query execution, Seismic employs token-level and cluster-level pruning to dramatically reduce the number of documents that need scoring.

![Seismic Data Structure](/assets/media/blog-images/2025-10-14-Scaling-Sparse-Vector-Search-to-Billions-Neural-Sparse-Now-Supports-Approximate-Search-for-Ultra-Fast-Retrieval/seismic.png)

## Try it out

To try the Seismic algorithm, follow these steps.

### Step 1: Create an index

Create a sparse index by setting `index.sparse` to `true` and define a `sparse_vector` field in the index mapping:

```json
PUT sparse-vector-index
{
  "settings": {
    "index": {
      "sparse": true
    },
    "mappings": {
      "properties": {
        "sparse_embedding": {
          "type": "sparse_vector",
          "method": {
            "name": "seismic",
            "parameters": {
              "approximate_threshold": 1
            }
          }
        }
      }
    }
  }
}
```

### Step 2: Ingest data into the index

Ingest three documents containing `sparse_vector` fields into your index:

```json
PUT sparse-vector-index/_doc/1
{
  "sparse_embedding" : {
    "1000": 0.1
  }
}
```

```json
PUT sparse-vector-index/_doc/2
{
  "sparse_embedding" : {
    "2000": 0.2
  }
}
```

```json
PUT sparse-vector-index/_doc/3
{
  "sparse_embedding" : {
    "3000": 0.3
  }
}
```

### Step 3: Search the index

You can query the sparse index by providing either raw vectors or natural language using a [neural sparse query](https://docs.opensearch.org/latest/query-dsl/specialized/neural-sparse/).

#### Query using a raw vector

To query using a raw vector, provide the `query_tokens` parameter:

```json
GET sparse-vector-index/_search
{
  "query": {
    "neural_sparse": {
      "sparse_embedding": {
        "query_tokens": {
          "1000": 5.5
        },
        "method_parameters": {
          "heap_factor": 1.0,
          "top_n": 10,
          "k": 10
        }
      }
    }
  }
}
```

#### Query using natural language

To query using natural language, provide the `query_text` and `model_id` parameters:

```json
GET sparse-vector-index/_search
{
  "query": {
    "neural_sparse": {
      "sparse_embedding": {
        "query_text": "<input text>",
        "model_id": "<model ID>",
        "method_parameters": {
          "k": 10,
          "top_n": 10,
          "heap_factor": 1.0
        }
      }
    }
  }
}
```

## Benchmark Experiment: Seismic and Traditional Approaches

We conducted a billion-scale benchmark to compare the performance of Seismic and traditional search methods, including BM25, neural sparse search and two-phase.

### Experimental Setup

* **Corpus set**: C4 dataset from **[Dolma](https://huggingface.co/datasets/allenai/dolma)**. After preprocessing, the dataset is chunked into 1.29 billion documents (1,285,526,507 to be precise)
* **Query set**: MS MARCO v1 dev set with 6,980 queries
* **Sparse embedding models**: We use the doc-only mode with two models:
    * Corpus encoding: amazon/neural-sparse/opensearch-neural-sparse-encoding-doc-v3-gte
    * Query encoding: amazon/neural-sparse/opensearch-neural-sparse-tokenizer-v1
* **OpenSearch cluster**: We build an OpenSearch cluster with version 3.3
    * Master nodes: 3 m7g.4x large instances
    * Data nodes: 15 r7g.12x large instances

### Benchmark Results

For our billion-scale benchmark, we evenly split the dataset into 10 partitions. After each partition was ingested, we ran force merge to build a new Seismic segment. This approach resulted in 10 Seismic segments per data node, with each segment containing approximately 8.5 million documents.

Following the [Big ANN](https://big-ann-benchmarks.com/neurips23.html) (Approximate Nearest Neighbor) benchmark, we focus on the query performance when recall @ 10 reaches 90%. We consider two experimental settings: single-thread and multi-thread. For single-thread setting, metrics are collected with a Python script, where latency is measured using the `took` time returned by OpenSearch queries. For multi-thread setting, the throughput metrics are measured using opensearch-benchmark with four threads in total.

<div class="table-styler" align="center">
  <p>
    <br>
    <strong>Table I: Comparison between neural sparse, BM25 and Seismic queries</strong>
  </p>

  <table>
    <tr>
      <th colspan="2" align="center">Metrics</th>
      <th>Neural sparse</th>
      <th>Neural sparse two phase</th>
      <th>BM25</th>
      <th>Seismic</th>
    </tr>
    <tr>
      <td colspan="2">Recall @ 10 (%)</td>
      <td>100</td>
      <td>90.483</td>
      <td>N/A</td>
      <td><strong>90.209</strong></td>
    </tr>
    <tr>
      <td rowspan="5">Single-thread</td>
      <td>Average latency (ms)</td>
      <td>125.12</td>
      <td>45.62</td>
      <td>41.52</td>
      <td><strong>11.77</strong></td>
    </tr>
    <tr>
      <td>P50 latency (ms)</td>
      <td>109</td>
      <td>34</td>
      <td>28</td>
      <td><strong>11</strong></td>
    </tr>
    <tr>
      <td>P90 latency (ms)</td>
      <td>226</td>
      <td>100</td>
      <td>90</td>
      <td><strong>16</strong></td>
    </tr>
    <tr>
      <td>P99 latency (ms)</td>
      <td>397.21</td>
      <td>200.21</td>
      <td>200.21</td>
      <td><strong>27</strong></td>
    </tr>
    <tr>
      <td>P99.9 latency (ms)</td>
      <td>551.15</td>
      <td>296.53</td>
      <td>346.06</td>
      <td><strong>50.02</strong></td>
    </tr>
    <tr>
      <td rowspan="1">Multi-thread</td>
      <td>Mean throughput (op/s)</td>
      <td>26.35</td>
      <td>82.05</td>
      <td>85.86</td>
      <td><strong>158.7</strong></td>
    </tr>
  </table>
</div>


The table above lists the benchmark results. Given 90% recall, **Seismic achieves an average query time of merely 11.77ms** - nearly **4x** faster than BM25 (41.52ms) and over **10x** faster than standard neural sparse search (125.12ms). Besides, for multi-thread setting, Seismic's throughput advantage - at 158.7 operations per second, it nearly doubles the throughput of BM25 (85.86 op/s) while maintaining comparable recall to the two-phase approach.

In total, the force merge time is 2 hours, 58 minutes, and 30 seconds. On average, memory consumption was approximately 53 GB per data node to store the Seismic data.
{: .note }

## Best Practices

Based on the benchmark results, we would like to provide a couple of tips to work with Seismic algorithm:

1. **Recommended segment size**: Set the approximate threshold to 5M documents and force merge segments to between 5M and 10M documents for best performance
2. **Memory planning**: Plan for approximately 1GB of memory per 1 million documents - this helps determine appropriate instance types and cluster sizing

These results demonstrate that Seismic delivers unprecedented performance for billion-scale search applications, outperforming even traditional BM25 while maintaining the semantic understanding of neural sparse models.

## Conclusion

In OpenSearch 3.3, we're releasing an approximate retrieval algorithm for sparse vectors. This algorithm can deliver query times faster than BM25 while maintaining the semantic understanding of neural sparse models. For billion-scale search applications, we have removed the most significant barriers. By dramatically reducing the query latency, users can enjoy better performance with fewer nodes required to handle the same query load.

The capability to search across billions of documents with latency less than 12 ms changes what's possible in information retrieval. We're excited to see how developers and organizations will leverage this technology to build the next generation of semantic search applications.

## Further reading

1. [Seismic paper](https://dl.acm.org/doi/10.1145/3626772.3657769)
2. [Improving document retrieval with sparse semantic encoders](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders/)
3. [Introducing the neural sparse two-phase algorithm](https://opensearch.org/blog/introducing-a-neural-sparse-two-phase-algorithm/)
