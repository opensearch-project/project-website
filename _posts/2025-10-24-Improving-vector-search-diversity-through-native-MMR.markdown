---
layout: post
title: "Improving vector search diversity through native MMR"
layout: post
authors:
   - bzhangam
date: 2025-10-24
has_science_table: true
categories:
   - technical-posts
meta_keywords: MMR, Maximal Marginal Relevance, search diversity, search ranking, OpenSearch 3.3, vector search
meta_description: Learn how to use Maximal Marginal Relevance (MMR) in OpenSearch to make your search results more diverse.
---


When it comes to search and recommendation systems, returning highly relevant results is only half the battle. An equally important component is diversity---ensuring that users see a range of results rather than multiple near-duplicates. OpenSearch 3.3 now supports native Maximal Marginal Relevance (MMR) for k-NN and neural queries that makes this easy.

## What is MMR?

MMR is a reranking algorithm that balances relevance and diversity:

 - **Relevance:** How well a result matches the query.

 - **Diversity:** How different the results are from each other.

MMR iteratively selects results that are relevant to the query and not too similar to previously selected results. The trade-off is controlled by the `diversity` parameter (0 = prioritize relevance, 1 = prioritize diversity).

In vector search, this is particularly useful because embeddings often cluster similar results together. Without MMR, the top-k results might all look nearly identical.

## Native MMR in OpenSearch

Previously, MMR could only be implemented externally, requiring custom pipelines and extra coding. Now, OpenSearch supports native MMR directly in k-NN and neural queries using `knn_vector`. This simplifies your setup and reduces latency.

## How to Use MMR

### Prerequisites
Before using MMR for reranking, make sure the required [system-generated search processor factories](https://docs.opensearch.org/latest/search-plugins/search-pipelines/system-generated-search-processors/) are enabled in your cluster:

```json
PUT _cluster/settings
{
  "persistent": {
    "cluster.search.enabled_system_generated_factories": [
      "mmr_over_sample_factory",
      "mmr_rerank_factory"
    ]
  }
}
```

These factories enable OpenSearch to automatically perform the oversampling and reranking steps needed for MMR.

### Example: Improving diversity in neural search

Suppose that you have a neural search index with a `semantic` field that stores product descriptions produced by a dense embedding model. You can set up your index following [this guide](https://docs.opensearch.org/latest/field-types/supported-field-types/semantic/).

#### Index sample data

Index a few example product descriptions into the index:

```json
PUT /_bulk
{ "update": { "_index": "my-nlp-index", "_id": "1" } }
{ "doc": {"product_description": "Red apple from USA."}, "doc_as_upsert": true }
{ "update": { "_index": "my-nlp-index", "_id": "2" } }
{ "doc": {"product_description": "Red apple from usa."}, "doc_as_upsert": true }
{ "update": { "_index": "my-nlp-index", "_id": "3" } }
{ "doc": {"product_description": "Crispy apple."}, "doc_as_upsert": true }
{ "update": { "_index": "my-nlp-index", "_id": "4" } }
{ "doc": {"product_description": "Red apple."}, "doc_as_upsert": true }
{ "update": { "_index": "my-nlp-index", "_id": "5" } }
{ "doc": {"product_description": "Orange juice from usa."}, "doc_as_upsert": true }
```

#### Query without MMR

A standard neural search query for "Red apple" might look like this:

```json
GET /my-npl-index/_search
{
  "size": 3,
  "_source": { "exclude": ["product_description_semantic_info"] },
  "query": {
    "neural": {
      "product_description": { "query_text": "Red apple" }
    }
  }
}
```
Results:

```json
"hits": [
    { "_id": "4", "_score": 0.956, "_source": {"product_description": "Red apple."} },
    { "_id": "1", "_score": 0.743, "_source": {"product_description": "Red apple from USA."} },
    { "_id": "2", "_score": 0.743, "_source": {"product_description": "Red apple from usa."} }
]
```
Notice that all top results are very similar---there's little diversity in what the user sees.

#### Query with MMR

By adding MMR, you can diversify the top results while maintaining relevance:

```json
GET /my-npl-index/_search
{
  "size": 3,
  "_source": { "exclude": ["product_description_semantic_info"] },
  "query": {
    "neural": {
      "product_description": { "query_text": "Red apple" }
    }
  },
  "ext": {
    "mmr": {
      "candidates": 10,
      "diversity": 0.4
    }
  }
}
```

Results:

```json
"hits": [
    { "_id": "4", "_score": 0.956, "_source": {"product_description": "Red apple."} },
    { "_id": "1", "_score": 0.743, "_source": {"product_description": "Red apple from USA."} },
    { "_id": "3", "_score": 0.611, "_source": {"product_description": "Crispy apple."} }
]
```

By using MMR, you receive more diverse results (like “Crispy apple”) without sacrificing relevance for the top hits.

## Benchmarking MMR reranking in OpenSearch

To evaluate the performance impact of MMR reranking, we ran benchmark tests on OpenSearch 3.3 across both [vector search](https://github.com/opensearch-project/opensearch-benchmark-workloads/blob/main/vectorsearch/params/corpus/10million/faiss-cohere-768-dp.json) and [neural search](https://github.com/opensearch-project/opensearch-benchmark-workloads/blob/main/neural_search/params/semanticfield/neural_search_semantic_field_dense_model.json) workloads. These tests helped quantify the latency trade-offs introduced by MMR while highlighting the benefits of more diverse search results.

### Cluster configuration

The following OpenSearch cluster configuration was used:

* Version: OpenSearch 3.3
* Data nodes: 3 × r6g.2xlarge
* Master nodes: 3 × c6g.xlarge
* Benchmark instance: c6g.large

### Vector search performance

We used the `cohere-1m` dataset, which contains one million precomputed embeddings, to evaluate k-NN queries. The following table summarizes query latency (in milliseconds) for different values of k and MMR candidate sizes.

| **k** | **Query size** | **MMR candidates** | **k-NN (p50 ms)** | **k-NN (p90 ms)** | **k-NN + MMR (p50 ms)** | **k-NN + MMR (p90 ms)** | **p50 Δ (%)** | **p90 Δ (%)** | **p50 Δ (ms)** | **p90 Δ (ms)** |
| ----- | -------------- | ------------------ | ---------------- | ---------------- | ---------------------- | ---------------------- | ------------- | ------------- | -------------- | -------------- |
| 1     | 1              | 1                  | 6.70             | 7.19             | 8.22                   | 8.79                   | 22.7          | 22.2          | 1.52           | 1.60           |
| 10    | 10             | 10                 | 8.09             | 8.64             | 9.14                   | 9.62                   | 13.0          | 11.3          | 1.05           | 0.98           |
| 10    | 10             | 30                 | 8.09             | 8.64             | 10.83                  | 11.48                  | 33.9          | 32.9          | 2.74           | 2.84           |
| 10    | 10             | 50                 | 8.09             | 8.64             | 11.76                  | 12.55                  | 45.4          | 45.3          | 3.67           | 3.91           |
| 10    | 10             | 100                | 8.09             | 8.64             | 15.81                  | 16.73                  | 95.5          | 93.6          | 7.72           | 8.09           |
| 20    | 20             | 100                | 8.13             | 8.57             | 18.66                  | 19.62                  | 129.6         | 129.0         | 10.54          | 11.05          |
| 50    | 50             | 100                | 8.23             | 8.74             | 28.55                  | 29.63                  | 247.0         | 239.0         | 20.32          | 20.89          |

### Neural search performance

For neural search, we used the Quora dataset, containing over 500,000 documents. The following table shows query latency with and without MMR reranking.

| **k** | **Query size** | **MMR candidates** | **Neural (p50 ms)** | **Neural (p90 ms)** | **Neural + MMR (p50 ms)** | **Neural + MMR (p90 ms)** | **p50 Δ (%)** | **p90 Δ (%)** | **p50 Δ (ms)** | **p90 Δ (ms)** |
| ----- | -------------- | ------------------ | ------------------- | ------------------- | ------------------------- | ------------------------- | ------------- | ------------- | -------------- | -------------- |
| 1     | 1              | 1                  | 113.59              | 122.22              | 113.08                    | 122.38                    | -0.46         | 0.13          | -0.52          | 0.16           |
| 10    | 10             | 10                 | 112.03              | 122.90              | 113.88                    | 122.63                    | 1.66          | -0.22         | 1.86           | -0.27          |
| 10    | 10             | 30                 | 112.03              | 122.90              | 119.57                    | 127.65                    | 6.73          | 3.86          | 7.54           | 4.75           |
| 10    | 10             | 50                 | 112.03              | 122.90              | 122.56                    | 133.34                    | 9.40          | 8.50          | 10.53          | 10.45          |
| 10    | 10             | 100                | 112.03              | 122.90              | 130.52                    | 139.95                    | 16.51         | 13.87         | 18.49          | 17.05          |
| 20    | 20             | 100                | 112.41              | 122.85              | 131.18                    | 141.09                    | 16.69         | 14.85         | 18.77          | 18.24          |
| 50    | 50             | 100                | 114.86              | 121.02              | 141.24                    | 152.42                    | 22.97         | 25.94         | 26.38          | 31.40          |

### Key findings

The following performance observations highlight our key findings:

1. MMR adds latency, and the increase grows with the number of MMR candidates and the query size.
2. k-NN and neural queries without MMR handle increases in k efficiently, with most of the computation time spent on graph traversal (`ef_search`) rather than selecting the top k candidates.

Choosing the number of MMR candidates requires balancing diversity and query latency. More candidates improve result diversity but increase latency, so select values appropriate for your workload.

## Using MMR with cross-cluster search

Currently, for [cross-cluster search](https://docs.opensearch.org/latest/search-plugins/cross-cluster-search/), OpenSearch cannot automatically resolve vector field information from the index mapping in the remote clusters. This means that you must explicitly provide the vector field details when using MMR:

```json
POST /my-index/_search
{
  "query": {
    "neural": {
      "my_vector_field": {
        "query_text": "query text",
        "model_id": "<your model id>"
      }
    }
  },
  "ext": {
    "mmr": {
      "diversity": 0.5,
      "candidates": 10,
      "vector_field_path": "my_vector_field",
      "vector_field_data_type": "float",
      "vector_field_space_type": "l2"
    }
  }
}
```

The query uses the following parameters for MMR configuration:

* `vector_field_path`: The path to the vector field to use for MMR re-ranking.
* `vector_field_data_type`: The data type of the vector (for example, `float`).
* `vector_field_space_type`: The distance metric used for similarity calculations (for example, `l2`).
* `candidates` and `diversity`: Same as in local MMR queries, controlling the number of candidates and the diversity weight.

Providing this information ensures that MMR can correctly compute diversity and rerank results even when querying across remote clusters.

## Summary

OpenSearch's MMR makes it easy to deliver search results that are both relevant and diverse. By intelligently reranking results, MMR helps return a wider variety of options, reduces redundancy, and creates a richer, more engaging search experience for your users.

If you're looking to improve your vector search diversity, MMR in OpenSearch is a powerful tool to try today.

## What's next

In the future, we plan to make MMR even easier to use and more flexible by providing the following updates:

- **Better support for remote clusters**: This will eliminate the need to manually specify vector field information.

- **Expanded query type support**: Currently, MMR works only with k-NN queries or neural queries using a `knn_vector`. We aim to support additional query types, such as `bool` and `hybrid` queries, so MMR can enhance a wider range of search scenarios.