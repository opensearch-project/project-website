---
layout: post
title: "Boosting k-NN exact search performance"
authors:
   - ryanbogan
   - jmazane
   - vamshin
   - kolchfa
date: 2024-11-19
categories: 
    - technical-posts
has_science_table: true
meta_keywords: k-NN search performance, SIMD in OpenSearch, script score queries, performance optimization, machine learning, exact K-NN
meta_description: Boost exact k-NN search performance in OpenSearch using SIMD optimizations and script_score queries. Discover real-world performance gains for efficient vector similarity searches in machine learning applications.
---

Exact k-nearest neighbor (k-NN) search in OpenSearch allows you to define custom scoring functions to retrieve documents based on their proximity to a query vector. This method provides highly accurate search results, making it ideal when you need precise, deterministic matches.

Using OpenSearch's `script_score` queries, you can perform exact k-NN searches to find the closest neighbors to a query vector. This query type allows you to create complex scoring functions that account for factors like document attributes, user preferences, or external data. 

Exact k-NN search is especially effective for datasets containing a few hundred to a few thousand documents because it guarantees perfect recall (1.0). This method is often more suitable for small or specialized datasets, where the computational overhead of approximate k-NN may outweigh its speed advantages. For larger datasets, however, approximate search can be a better choice in terms of managing latency. 

## Using Lucene's SIMD optimizations for faster k-NN search

The release of [Lucene 9.7](https://lucene.apache.org/core/9_7_0/index.html) introduced Project Panama's Java Vector API, which accelerates k-NN vector calculations through single instruction, multiple data (SIMD) operations. SIMD enables CPUs to run the same operation on multiple data points simultaneously, speeding up search tasks that rely on data-parallel processing.

In OpenSearch 2.15, SIMD optimizations were added to the k-NN plugin's script scoring, resulting in significant performance gains for CPUs with SIMD support, such as AVX2 or AVX512 on x86 or NEON on ARM. Further improvements in OpenSearch 2.17 introduced Lucene's new vector format, which includes optimized memory-mapped file access. Together, these enhancements significantly reduce search latency for exact k-NN searches on supported hardware.

## How to run exact k-NN search

To get started with exact k-NN search, create an index with one or more `knn_vector` fields that store vector data:

```json
PUT my-knn-index-1
{
  "mappings": {
    "properties": {
      "my_vector1": { "type": "knn_vector", "dimension": 2 },
      "my_vector2": { "type": "knn_vector", "dimension": 4 }
    }
  }
}
```

Next, index some sample data:

```json
POST _bulk
{ "index": { "_index": "my-knn-index-1", "_id": "1" } }
{ "my_vector1": [1.5, 2.5], "price": 12.2 }
{ "index": { "_index": "my-knn-index-1", "_id": "2" } }
{ "my_vector1": [2.5, 3.5], "price": 7.1 }
// Additional documents omitted for brevity
```

Finally, run an exact k-NN search using the `script_score` query:

```json
GET my-knn-index-1/_search
{
 "size": 4,
 "query": {
   "script_score": {
     "query": { "match_all": {} },
     "script": {
       "source": "knn_score",
       "lang": "knn",
       "params": {
         "field": "my_vector2",
         "query_value": [2.0, 3.0, 5.0, 6.0],
         "space_type": "l2"
       }
     }
   }
 }
}
```

For more information about exact k-NN search and `script_score` queries, see [Exact k-NN with scoring script](https://opensearch.org/docs/latest/search-plugins/knn/knn-score-script/). You'll find detailed guides to help you configure k-NN exact search and make the most of custom scoring.

## Experiments show real-world performance gains

To measure the impact of these optimizations, we conducted A/B tests comparing OpenSearch 2.14 to OpenSearch 2.17 in a single-node cluster. 

### Cluster configuration

|Dataset	|Cohere 1m	|
|---	|---	|
|Data nodes	|1	|
|CPUs	|8	|
|EBS volume (GB)	|500	|

### Results

The following table provides latency comparison between OpenSearch versions 2.14 and 2.17.

|Space type	|Version	|50th percentile latency (ms)	|90th percentile latency (ms)	|99th percentile latency (ms)	|
|---	|---	|---	|---	|---	|
|**Inner product**	|2.14	|668.84378	|816.95014	|948.21019	|
||2.17	|99.58072	|117.0792	|121.36626	|
||**Improvement**	|85.11%	|85.67%	|87.20%	|
|**L2**|2.14	|670.98628	|682.84925	|693.12135	|
| | 2.17	|104.36596	|118.85475	|127.60656	|
|| **Improvement**	|84.45%	|82.59%	|81.59%	|

### Conclusion

The tests showed that OpenSearch's new SIMD support and optimized memory access resulted in significant latency reductions, especially for the inner product space type, which saw up to an 87% latency reduction at the 99th percentile.

## What's next for exact k-NN search?

Future OpenSearch versions will provide even more k-NN search flexibility. You'll be able to switch between exact and approximate search at query time. Additionally, future versions will provide the ability to specify which fields build indexes for exact and approximate search types. Stay tuned for these updates as we continue to improve OpenSearch's k-NN search capabilities.


#### Note

To use the optimized Lucene format in OpenSearch 2.17, set `index.knn` to `true` in order to build approximate nearest neighbor (ANN) data structures. In OpenSearch 2.18, a new `index.knn.advanced.approximate_threshold` setting is available. If you are performing only exact searches, set this value to `-1` to reduce indexing time.