---
layout: post
title: "OpenSearch Project update: A look at performance progress through version 2.17"
layout: post
authors:
    - sisurab
    - pallp
date: 2024-11-26
categories:
        - technical-posts
        - community
meta_keywords: OpenSearch performance progress 2.17, OpenSearch roadmap
meta_description: Learn more about the strategic enhancements and performance features that OpenSearch has delivered up to version 2.17.
has_science_table: true
excerpt: Learn more about the strategic enhancements and performance features that OpenSearch has delivered up to version 2.17.
featured_blog_post: false
featured_image: false 
---

OpenSearch covers a broad range of functionality for applications involving document search, e-commerce search, log analytics, observability, and data analytics. All of these applications depend on a full-featured, scalable, reliable, and high-performance foundation. In the latest OpenSearch versions, we've added new features such as enhanced artificial intelligence and machine learning (AI/ML) semantic/vector search capabilities, neural search, hybrid search, flat objects, and zero-ETL integrations. As we continue to add new features, we are also improving scalability, reliability, and performance both for existing and for new features. These improvements allow us to support ever-growing data collections with high throughput, low latency, lower resource consumption, and, thus, lower costs. This blog post focuses on performance improvements in OpenSearch 2.12, 2.13, and 2.14. These fall into four broad categories: text querying, vector storage and querying, ingestion and indexing, and storage efficiency.

In this post, we focus on the performance improvements seen in OpenSearch 2.17, as measured against prior releases, specifically in query types such as text querying, term aggregations, range queries, date histograms, and sorting. These advancements were evaluated using the [OpenSearch Big5 workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/big5), ensuring we target common use cases in both search and analytics applications. The key benchmarks provide an easy-to-replicate framework for measuring real-world performance enhancements. For those interested in a more detailed analysis of the performance benchmarks or wishing to conduct your own benchmark tests, see the [Appendix](#appendix---benchmarking-tests-and-results).

<style>
.green-clr {
    background-color: #c1f0c1;
}

.light-green-clr {
    background-color: #e3f8e3;
}

.lightest-green-clr {
    background-color: #eefbee;
}

.bold {
    font-weight: 700;
}

.left {
    text-align: left;
}

table { 
    font-size: 16px; 
}

h3 {
    font-size: 22px;
}

th {
    background-color: #f5f7f7;
}​

</style>

# Performance improvements through 2.17

Since its inception, OpenSearch has made consistent improvements to performance, and the 2.17 release is no exception. Compared to version 1.x and recent 2.x versions, we have achieved up XX speedups, reducing query latencies across various categories. Below is a detailed breakdown of the improvements in 2.17 across the Big5 workload.

#### Key highlights for Version 2.17

* **Overall Query Performance**: OpenSearch 2.17 achieves **6x better performance** compared to OS 1.x.
* **Text Queries**: Text search queries, fundamental to many OpenSearch use cases, are **57% faster** in 2.17 compared to the baseline of OS 1.0.
* **Terms Aggregation**: This critical query type for log analytics shows a **97% improvement** over OS 1.3, allowing for faster and more efficient data aggregation.
* **Date Histograms**: OpenSearch 2.17 reduces the relative latency for date histograms by **84%** compared to 1.3, showcasing major speed enhancements for time-series analysis.
* **Range Queries**: With **85%-90% performance improvement** compared to OpenSearch 1.x, range queries now execute quicker with fewer resources.


|	|
**Query Types**	|1.3.18	|2.7	|2.11	|2.12	|2.13	|2.14	|2.15	|2.16	|2.17	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|
**Big 5 Buckets**	|
Text Query	|59.51	|47.91	|41.05	|27.29	|27.61	|27.85	|27.39	|21.7	|21.77	|
|
Sorting	|17.73	|11.24	|8.14	|7.99	|7.53	|7.47	|7.78	|7.22	|7.26	|
|
Terms Aggregation	|609.43	|1351	|1316	|1228	|291	|293	|113	|112	|113	|
|
Range Queries	|26.08	|23.12	|16.91	|18.71	|17.33	|17.39	|18.51	|3.17	|3.17	|
|
Date Histogram	|6068	|5249	|5168	|469	|357	|146	|157	|164	|160	|
|Aggregate (geo mean)	|159.04	|154.59	|130.9	|74.85	|51.84	|43.44	|37.07	|24.66	|24.63	|
|Speedup factor, compared to OS 1.3 (geo mean)	|1.0	|1.03	|1.21	|2.12	|3.07	|3.66	|4.29	|6.45	|6.46	|
|Relative latency, compared to OS 1.3 (geo mean)	|100%	|97.20	|82.31	|47.06	|32.60	|27.31	|23.31	|15.51	|15.93	|

## Queries 


#### Text Queries 

Building on the advancements in OpenSearch 2.12, where the `match_only_text` field was introduced, OpenSearch 2.17 takes this further by optimizing text queries, reducing the space needed for indexes and speeding up query execution even more. Text queries are now **64% faster** than in 2.11 and **57% faster** than OpenSearch 1.x.

#### Term and multi-term aggregations 

Term aggregations are crucial for slicing and dicing large datasets across multiple criteria. OpenSearch 2.17 has enhanced the efficiency of global term aggregations, leveraging term frequency optimizations. The results are a **97% reduction in query latency** compared to 1.3, showcasing speedups in handling large immutable collections, such as log data. Latency for Multi Term Aggregation queries have been reduced upto 20% and memory footprint for short lived objects decreased by 50-60% after removing the need for new byte array allocations for storing composite keys. 

We also added support for the["wildcard" field type](https://github.com/opensearch-project/OpenSearch/pull/13461) that supports efficient execution of wildcard, prefix, and regexp queries by matching first against trigrams (or bigrams or individual characters), then post-filtering by evaluating the original field value against the pattern.

#### Date Histograms

A key query type for time-based data analysis, date histograms are now executing **84% faster** in OpenSearch 2.17 compared to 1.3. This enhancement reduces the time required for time-series aggregations, especially when there are no sub-aggregations. Same optimization has been added to range aggregation also. 

Cardinality aggregation is a powerful tool for counting distinct values, used in cases like tracking unique visitors, detecting anomalies in event types, or tallying unique products. We introduce an [optimization](https://github.com/opensearch-project/OpenSearch/pull/13821) that can dynamically prune documents that contain distinct values already collected, significantly improving performance for low-cardinality requests. Even for high-cardinality requests, this can provide up to a 20% speed increase by avoiding processing of redundant documents.

#### Range queries and numeric fields 

These queries, often used to filter data within a specific numerical or date range, have also seen improvements. With version 2.17, range queries are now **85%-90% faster** than they were in OpenSearch 1.3, thanks to [approximate range optimizations](https://github.com/opensearch-project/OpenSearch/pull/13788) in how range filters are handled. During search time we evaluate if a query matches a particular requirement for it to be rewritten from `originalQuery` to `approximateQuery`. The re-written query performs quicker utilizing fewer resources without compromising on search results in most cases. 

#### Sorting and filtering 

Sorting performance has been continuously refined in the 2.x series. With OpenSearch 2.17, sorting is more efficient offering a **59% improvement** over OS 1.3.

We introduced a [new approach](https://github.com/opensearch-project/OpenSearch/pull/14774) to handling large filter lists by encoding filter lists as Roaring Bitmaps. This reduces the memory and network overhead required to store and transmit these filters. The bitmap-based approach excels when filter sizes are huge, such as in common use cases like filtering a product index by a customer's owned products. Users can store and join large bitmap filters with the main index at query time. Our tests show the bitmap method maintains low latency in the high-cardinality scenarios, making it a more scalable solution than traditional terms queries or lookups.



##  Vector Search 

**Disk Optimized vector Search:** OpenSearch vector engine continues to prioritize cost savings with its latest release, version 2.17. This release introduces disk-optimized vector search that enables customers to leverage the full potential of vector workloads, even in low-memory environments. Disk-optimized vector search is designed to provide out-of-the-box 32x compression with Binary quantization, a powerful compression technique. However, users have the flexibility to fine-tune cost, response time, and accuracy to their unique needs through configurable parameters such as compression rate, sampling, and rescoring strategies. According to internal benchmarks, OpenSearch's disk-optimized vector search can deliver cost savings of up to 70%, while maintaining impressive performance with p90 latencies around 200ms and recall over 0.9. Check [documentaion](https://opensearch.org/docs/latest/search-plugins/knn/disk-based-vector-search/) for getting started. 

Vector search capabilities in native engines(faiss, nmslib) have received a significant boost with this latest release. We have integrated the Lucene Vector field with native engines, enabling the use of KNNVectorFormat during segment creation. Further native memory footprint during indexing has been drastically reduced by introducing [incremental graph build](https://github.com/opensearch-project/k-NN/issues/1938) capability instead of loading all the dataset at once into a memory. This helps with HNSW graph builds in low memory environments. OpenSearch's 2.17 release extends OpenSearch's Byte compression technique to Faiss Engine [HSNW](https://github.com/opensearch-project/k-NN/pull/1823) and [IVF](https://github.com/opensearch-project/k-NN/pull/2002) algorithms to further reduce memory footprint up to 75% for vectors that fit into Byte range [-128., 127] . Other improvements include handling [non-existent fields](https://github.com/opensearch-project/k-NN/pull/1874) in filters, [graph merge](https://github.com/opensearch-project/k-NN/pull/1844) stats size calculation, improved [caching](https://github.com/opensearch-project/k-NN/pull/2015) and more.

## Roadmap for 2025

### Core search engine

In 2025, we're pushing the boundaries of OpenSearch's Query Engine with several key initiatives aimed at improving performance, scalability, and efficiency:

* **Streaming Architecture**: We're moving from a request/reply model to streaming, processing and delivering data in real-time, reducing memory overhead and improving query speed.
* **Native Join Support**: We're introducing efficient JOIN operations across indexes to be supported natively, fully integrated with OpenSearch's query DSL, PPL, and SQL.
* **Native Vectorized Processing**: By leveraging modern CPU SIMD operations and native code, we're optimizing the processing of data streams to eliminate Java's garbage collection bottlenecks.
* **[Smarter Query Planning](https://github.com/opensearch-project/OpenSearch/issues/12390)**: Optimizing where and how computations run ensures we reduce unnecessary data transfer and improve performance for parallel query execution.
* **[gRPC-based Search API](https://github.com/opensearch-project/OpenSearch/issues/15190)**: We're enhancing client-server communication with Protobuf and gRPC, speeding up search by cutting down transport overhead.
* **[Query Performance Optimization](https://github.com/orgs/opensearch-project/projects/153)**: Improving performance remain our priority and several key initiatives such as docId encoding and query approximation will enhance performance on large range queries and reduce index size.
* **[Star Tree Indexing](https://github.com/opensearch-project/OpenSearch/issues/12498)**: Precomputing aggregations with star tree indexing ensures faster, more predictable performance for aggregation-heavy queries.




### Hybrid Search 

Hybrid search combines lexical and semantic vector search to get the best of both worlds. Highly specific names — like part numbers — are best found using lexical search, while broader queries are often best handled by semantic vector search. We have supported Hybrid Search since OpenSearch 2.10. We plan a variety of enhancements to it.

By executing the lexical and the vector searches in parallel, we predict up to 25% latency improvement.

We will support re-sorting of the results of hybrid queries.

We will support additional algorithms for combining the query results. In particular, reciprocal rank fusion (RRF) has shown good results in some applications.

Finally, we will return the raw scores of the sub-queries, which is useful for debugging and for relevance tuning.

### Vector Search

Semantic vector search is a powerful technique for finding semantic similiarities, but it can be costly, because indexing vectors to make them efficient to search is time-consuming, and the vectors themselves can consume large amounts of memory.

We are currently working on:

* speeding up vector indexing by 80% and reduce the memory required for indexing;
* reducing the amount of space needed to store vectors by compressing vector components from 32 bits to 16, 8, and even 1 bit. Our experiments show modest reductions in search quality (recall) with 16 and 8 bit components; we are still analyzing the 1-bit case (binary quantization).
* reducing cost with disk based approximate nearest neighbor algorithms (aNN) using external storage (SSDs, S3 etc).

Vector techniques have also been less flexible than lexical techniques in many ways, so we are:

* improving search relevancy by supporting re-ranking on compressed vectors;
* supporting aNN vector search for the multi-tenant case, where each tenant has their own sub-collection. This is especially valuable for customers each of whose user organizations has a large vector collection.

### Performance benchmarking

We will update [the Big5 workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/big5) mappings and settings — in particular, adding support for dynamic templates, configurable merge policies, match-only text, and query default query field set as “message”.

## Conclusion

While OpenSearch continues to expand its functionality, we are also investing in improving the performance, efficiency, and robustness of the system for every workload. In particular, vector techniques are being widely adopted both for pure semantic search and for hybrid semantic and lexical search.

The OpenSearch team at AWS works in collaboration with the larger OpenSearch community. Without its contributions to testing, feedback, and development, OpenSearch would not be where it is today.

Stay tuned to our blog and GitHub for continuous updates and insights into our progress and future plans.



##  Appendix - Benchmarking tests and results



This section presents details on the performance benchmarks we use and the results we've measured. The data was collected using OpenSearch Benchmark to run the big5 workload against different distributions and configurations of OpenSearch. In particular:

* OpenSearch Benchmark was used for testing both ES and OS, since this is our standard tool and Rally numbers might be different.
* Each test ran against a single-node cluster, to ensure better reproducibility and easier setup.
* The instance type was *c5.2xlarge*: 8 vCPU, 16 GB, a middle-of-the-road instance type.  Improvements in resource usage efficiency can be masked by oversized instances.
* Big5 Index was comprised of a single shard, no replicas (i.e. run with `--workload-params="number_of_replicas:0"`).
* Ingestion during the test was run with single bulk indexing client to ensure data is ingested in chronological order.
* Tests were run in [benchmarking mode](https://opensearch.org/docs/latest/benchmark/user-guide/target-throughput/#benchmarking-mode) (i.e. target-throughput was disabled) so that the OpenSearch client sends requests to the OpenSearch cluster as fast as possible
* Indexing LSM was configured with LogByteSizeMergePolicy, since this optimization was in place last year, prior to the blog post being published.
* Corpus size of the workload: 60 GB, 70M docs.  Store size after ingestion is 15 GB for the primary shard.  Eliminating overhead like doc values, etc., RSS should be about 8 GB which should match the JVM heap size for the instance.  Having most data resident in memory should provide a good assessment of performance improvements.
* The mapping file for Elasticsearch will be the one that Elastic used for their blog post runs.  The workload will need to be modified manually to set this up.



|A	|Query Types	|OS 1.0	|OS 2.7	|OS 2.11	|OS 2.12	|OS 2.13	|OS 2.14	|
|---	|---	|---	|---	|---	|---	|---	|---	|
|Big 5 Areas

Mean Latency, ms	|Text Query	|44.34	|37.02	|36.12	|19.42	|19.41	|20.01	|
|---	|---	|---	|---	|---	|---	|---	|---	|
|Sorting	|65.04	|18.58	|10.21	|6.22	|5.55	|5.53	|
|Terms Aggregation	|311.78	|315.27	|316.32	|282.41	|36.27	|27.18	|
|Range Queries	|4.06	|4.52	|4.32	|3.81	|3.44	|3.41	|
|Date Histogram	|4812.36	|5093.01	|5057.62	|310.32	|332.41	|141.5	|
|Geo Mean	|	|111.93	|87.03	|76.08	|33.2	|21.38	|17.07	|
|Relative latency
(Geo Mean)	|	|100	|78	|68	|30	|19	|15	|
|Relative latency
(Geo Mean)	|	|100%	|78%	|68%	|30%	|19%	|15%	|
|Speedup 
(Geo Mean)	|	|1	|1.3	|1.5	|3.3	|5.3	|6.7	|

### 2. Query categories

|**Buckets**	|Query	|Order	|OS 1.0 P90 Service Time (ms)	|ES 7.10 P90 Service Time RSD (%)	|ES 8.8.1 P90 Service Time (ms)	|ES P90 Service Time RSD (%)	|OS 2.7 P90 Service Time (ms)	|**OS 2.7 P90 Service Time RSD (%)**	|OS 2.11.0 P90 Service Time (ms)	|OS 2.11.0 P90 Service Time RSD (%)	|OS 2.12.0 P90 Service Time (ms)	|OS 2.13.0 P90 Service Time (ms)	|OS 2.14 P90 Service Time (ms)	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|Text Querying	|default	|1	|2.79	|0.92	|1.4	|5.52	|2.65	|11.4	|2.41	|2.59	|2.5	|2.34	|2.27	|
|scroll	|22	|448.9	|1.69	|208.29	|3.22	|228.42	|2.43	|227.36	|2.97	|222.1	|210.41	|217.82	|
|query-string-on-message	|23	|180.55	|0.25	|3.33	|6.86	|173.6	|0.16	|168.29	|0.47	|8.72	|9.29	|8.22	|
|query-string-on-message-filtered	|24	|174.25	|0.81	|89.22	|0.31	|125.88	|0.67	|146.62	|0.48	|102.53	|110.49	|135.98	|
|query-string-on-message-filtered-sorted-num	|25	|238.14	|0.38	|194.03	|0.13	|183.62	|0.51	|180.46	|0.25	|112.39	|120.41	|139.95	|
|term	|10	|0.81	|2.5	|0.87	|13.81	|1.06	|8.9	|0.91	|3.35	|0.96	|0.88	|0.83	|
|Sorting	|desc_sort_timestamp	|2	|13.09	|1.68	|246.83	|0.22	|159.45	|1.83	|28.39	|1.36	|20.65	|18.76	|20.4483	|
|asc_sort_timestamp	|3	|993.81	|3.7	|38.5	|1.1	|61.94	|5.79	|78.91	|0.87	|39.78	|36.83	|33.79	|
|desc_sort_with_after_timestamp	|4	|1123.65	|0.14	|237.67	|0.48	|163.53	|1.6	|28.93	|1.43	|19.4	|18.78	|22.492	|
|asc_sort_with_after_timestamp	|5	|1475.51	|0.74	|24.84	|2.09	|42.69	|7.86	|38.55	|1.67	|6.22	|5.55	|5.14	|
|desc_sort_timestamp_can_match_shortcut	|6	|15.49	|0.95	|46.47	|0.48	|31.13	|1.72	|7.64	|2.05	|7.11	|6.54	|6.88	|
|desc_sort_timestamp_no_can_match_shortcut	|7	|15.29	|3.27	|46.61	|0.21	|30.95	|2.31	|7.63	|2.32	|7.17	|6.53	|6.74441	|
|asc_sort_timestamp_can_match_shortcut	|8	|198.59	|0.59	|11.22	|1.6	|32.46	|2.13	|18.93	|2.59	|12.64	|9.45	|8.91	|
|asc_sort_timestamp_no_can_match_shortcut	|9	|197.36	|1.15	|11.26	|1.5	|32.5	|2.08	|18.78	|2.67	|12.74	|9.02	|8.82	|
|sort_keyword_can_match_shortcut	|26	|181.18	|0.34	|2.12	|4.71	|2.59	|11.11	|2.37	|0.51	|2.46	|2.18	|2.13	|
|sort_keyword_no_can_match_shortcut	|27	|181.06	|0.22	|2.12	|4.48	|2.43	|2.04	|2.44	|3.02	|2.49	|2.15	|2.09	|
|sort_numeric_desc	|28	|36.19	|15.15	|20.78	|1.23	|35.15	|1.48	|23.6	|1.65	|6.04	|5.83	|5.78	|
|sort_numeric_asc	|29	|66.87	|3.12	|22.02	|1.07	|37.74	|1.69	|21.14	|1.21	|5.3	|5.15	|5.2	|
|sort_numeric_desc_with_match	|30	|1.23	|4.45	|0.84	|11.51	|1.01	|3.13	|0.99	|9.26	|0.92	|0.85	|0.8	|
|sort_numeric_asc_with_match	|31	|1.24	|1.11	|0.83	|3.93	|0.99	|0.44	|0.9	|1.65	|0.89	|0.84	|0.8	|
|Terms Aggregation	|multi_terms-keyword	|11	|0.92	|1.09	|0.94	|10.32	|1.1	|5.51	|1	|10.09	|1.05	|0.91	|0.89	|
|keyword-terms	|12	|2126.25	|0.28	|1497.29	|0.72	|2117.22	|0.96	|2382.37	|0.68	|1906.71	|12.74	|6.96	|
|keyword-terms-low-cardinality	|13	|2135.16	|0.59	|1505.32	|0.3	|2121.88	|0.42	|2338.1	|1.78	|1893.9	|10.81	|5.25	|
|composite-terms	|14	|696.37	|0.61	|634.91	|0.21	|668.09	|0.28	|631.23	|0.69	|572.77	|581.24	|551.62	|
|composite_terms-keyword	|15	|1012.96	|1.18	|866.91	|0.4	|943.35	|0.48	|900.66	|0.13	|827.16	|861.81	|826.18	|
|Range Queries	|range	|17	|203.29	|1.61	|130.57	|0.88	|170.68	|0.78	|189.77	|0.21	|115.38	|115.2	|125.99	|
|range-numeric	|18	|0.81	|11.34	|0.8	|5.2	|0.96	|3.46	|0.87	|1.14	|0.9	|0.76	|0.75	|
|keyword-in-range	|19	|210.69	|0.57	|138.94	|0.2	|179.18	|1.38	|200.37	|0.05	|123.59	|124.66	|134.06	|
|range_field_conjunction_big_range_big_term_query	|32	|0.92	|1.73	|0.92	|1.81	|1.13	|5.35	|0.99	|3.35	|1.01	|0.91	|0.82	|
|range_field_disjunction_big_range_small_term_query	|33	|0.82	|2.38	|0.91	|2.45	|1.08	|4.66	|1.04	|10.32	|1	|0.86	|0.81	|
|range_field_conjunction_small_range_small_term_query	|34	|0.83	|2.13	|0.95	|8.52	|1.09	|10.28	|0.93	|1.53	|0.98	|0.85	|0.81	|
|range_field_conjunction_small_range_big_term_query	|35	|0.83	|12.05	|0.8	|2.34	|0.98	|1.09	|0.88	|2.22	|0.91	|0.78	|0.78	|
|Date Histogram	|date_histogram_hourly_agg	|20	|3618.5	|0.24	|10.42	|2.91	|3664.45	|0.08	|3785.48	|0.13	|8.5	|9.97	|3.39	|
|date_histogram_minute_agg	|21	|2854.99	|0.34	|3031.03	|0.34	|2933.76	|0.46	|2961.69	|0.12	|2518.69	|2635.16	|148.69	|
|composite-date_histogram-daily	|16	|3760.5	|0.1	|4484.72	|1.6	|4016.42	|1.12	|3574.18	|0.1	|1.44	|1.51	|1.39	|
|range-auto-date-histo	|36	|5267.47	|0.25	|4840.65	|0.21	|5960.21	|0.18	|6055.74	|0.39	|6784.27	|6977.05	|6129.29	|
|range-auto-date-histo-with-metrics	|37	|12612.77	|0.16	|12036.19	|0.33	|13314.87	|0.11	|13637.23	|0.09	|13759.51	|14662.24	|13208.98	|
|	|	|	|40050.08	|	|30391.52	|	|37446.24	|	|37667.78	|	|29110.78	|26579.74	|21,781.75	|
