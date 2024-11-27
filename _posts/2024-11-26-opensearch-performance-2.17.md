---
layout: post
title: "OpenSearch Project update: A look at performance progress through version 2.17"
layout: post
authors:
    - sisurab
    - pallp
    - vamshin
    - macrakis
    - ihoang
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

OpenSearch has always been committed to expanding functionality, scalability, and performance. In previous performance blogs, we discussed the major improvements we've made between OpenSearch 1.0 and first [2.11](https://opensearch.org/blog/opensearch-performance-improvements/)and then [2.14](https://opensearch.org/blog/opensearch-performance-2.14/). In this blog, we'll bring you up to date on our continuing performance improvements through OpenSearch 2.17.

The wide range of applications that OpenSearch supports means that no one number can summarize the improvements you will see in your applications. That's why we're reporting on a variety of performance metrics, some mostly relevant to analytics in general and log analytics in particular, some mostly relevant to lexical search, and yet others relevant to semantic search using vector embeddings and k-NN. Under the rubric of performance, we're also including improvements in resource utilization, notably RAM and disk.

Overall, OpenSearch 2.17 delivers a 6x overall performance improvement over OpenSearch 1.3, with gains across essential operations such as text queries, term aggregations, range queries, date histograms, and sorting. And that's not even counting improvements to semantic vector search, which is now highly configurable to let you choose the ideal balance of response time, accuracy, and cost for your applications. All these improvements reflect the contributions and collaboration of a dedicated community, whose insights and efforts drive OpenSearch forward.

This post highlights the performance improvements in OpenSearch 2.17. The first section focuses on key query operations, including text queries, term aggregations, range queries, date histograms, and sorting. These improvements were evaluated using the [OpenSearch Big5 workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/big5), which represents common use cases in both search and analytics applications. The benchmarks provide a repeatable framework for measuring real-world performance enhancements. The next section reports on vector search improvements. Finally, we present our roadmap for 2025, where you'll see that we're making qualitative improvements in many areas, in addition to important incremental changes. We are improving query speed by processing data in real time. We are building a query planner which uses resources more efficiently. We are speeding up intra-cluster communications. And we're adding efficient Join operations to query DSL, Piped Processing Language (PPL), and SQL. To follow our work in more detail, and to contribute comments or code, please participate on the [OpenSearch Forum](https://forum.opensearch.org/) as well as directly in our GitHub repos.

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

## Performance improvements through 2.17

Since its inception, OpenSearch has consistently improved performance, and version 2.17 continues this trend. to earlier versions, OpenSearch 2.17 delivers an improved performance, achieving a **6x speedup** over OpenSearch 1.3 and reducing query latencies across various categories. The following graph shows the relative improvements by query category as the 90th percentiile latencies, with a baseline of OpenSearch 1.3.

<img src="/assets/media/blog-images/2024-11-26-opensearch-performance-2.17/OS-PerformanceChart-ldc@2x.png" alt="OpenSearch performance improvements up to 2.17" class="center"/>{:style="width: 100%; max-width: 800px; height: auto; text-align: center"}

### Key highlights 

Based on our benchmarking, we've identified the following key highlights through version 2.17:

- **Overall query performance**: OpenSearch 2.17 delivers **6x better performance** than OpenSearch 1.3.
- **Text queries**: Text search queries, fundamental to many OpenSearch use cases, are **63% faster** in 2.17 compared to the baseline of OpenSearch 1.3.
- **Terms aggregations**: This critical query type for log analytics shows a **81% improvement** compared to OpenSearch 1.3, allowing for faster and more efficient data aggregation.
- **Date histograms**: OpenSearch 2.17 performance for date histograms has **improved by 97%** compared to OpenSearch 1.3, providing major speed improvements for time-series analysis.
- **Range queries**:  With **87% performance improvement** compared to OpenSearch 1.3, range queries now execute quicker using fewer resources.
- **Sorting and filtering**: OpenSearch 2.17 delivers faster sorting with **59% improvement** compared to OpenSearch 1.3, enhancing query performance for numeric and textual datasets.

The following table summarizes performance improvements for the preceding query types.

|	|
**Query Types**	|1.3.18	|2.7	|2.11	|2.12	|2.13	|2.14	|2.15	|2.16	|2.17	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|
**Big 5 areas mean latency, ms
**	|
Text Query	|59.51	|47.91	|41.05	|27.29	|27.61	|27.85	|27.39	|21.7	|21.77	|
|
Sorting	|17.73	|11.24	|8.14	|7.99	|7.53	|7.47	|7.78	|7.22	|7.26	|
|
Terms Aggregation	|1730.71	|1351	|1316	|1228	|291	|293	|113	|112	|113	|
|
Range Queries	|26.08	|23.12	|16.91	|18.71	|17.33	|17.39	|18.51	|3.17	|3.17	|
|
Date Histogram	|6068	|5249	|5168	|469	|357	|146	|157	|164	|160	|
|Aggregate (geo mean)	|195.96	|154.59	|130.9	|74.85	|51.84	|43.44	|37.07	|24.66	|24.63	|
|Speedup factor, compared to OS 1.3 (geo mean)	|1.0	|1.27	|1.50	|2.62	|3.78	|4.51	|5.29	|7.95	|7.96	|
|Relative latency, compared to OS 1.3 (geo mean)	|100%	|78.89	|66.80	|38.20	|26.45	|22.17	|18.92	|12.58	|15.93	|

 For a detailed benchmark analysis or to run your own benchmarks, see the [Appendix](#appendix---benchmarking-tests-and-results).

## Queries

OpenSearch has made the following query improvements.

### Text queries

Text queries are fundamental to effective text search, especially in applications requiring fast and accurate document retrieval. OpenSearch 2.12 introduced the **match_only_text** field to address specific needs in analytics and applications prioritizing 100% recall or customized ranking strategies. This field type dramatically reduced index sizes and accelerated query execution by removing the complexity of relevance-based scoring. As a result, **text queries performed 47% faster compared to OpenSearch 2.11 and 57% faster than OpenSearch 1.3**.

With OpenSearch 2.17, we further amplified these performance gains. Building on the foundations of the **match_only_text** field, OpenSearch 2.17 optimizes text queries, achieving **21% faster performance compared to 2.14** and an overall **63% faster performance compared to 1.3**. These improvements stem from continued enhancements to query execution and index optimization. Applications relying on text search for analytics or high-recall use cases can now achieve faster results with reduced resource usage, making OpenSearch 2.17 an even more powerful choice for modern text search workloads.

### Term and multi-term aggregations 

Term aggregations are crucial for slicing large datasets based on multiple criteria, making them important query operations for data analytics use cases. Building on prior advancements, **OpenSearch 2.17** enhances the efficiency of global term aggregations, using term frequency optimizations to handle large immutable collections, such as log data, with unprecedented speed. 

Performance benchmarks demonstrate a **61% performance improvement when compared with OpenSearch 2.14** and an overall **81% reduction in query latency compared to OpenSearch 1.3**, while **multi-term aggregation queries exhibit up to a 20% reduction in latency**. Additionally, memory efficiency is improved dramatically, with a **50–-60% reduction in memory footprint for short-lived objects**, because new byte array allocations for storing composite keys are not needed. 

OpenSearch 2.17 also introduces support for the **[wildcard field type](https://github.com/opensearch-project/OpenSearch/pull/13461)**, enabling highly efficient execution of wildcard, prefix, and regular expression queries. This new field type uses trigrams (or bigrams and individual characters) to match patterns before applying a post-filtering step to evaluate the original field, resulting in faster and more efficient query execution.

These advancements make OpenSearch 2.17 a powerful tool for analytics use cases, from large-scale log processing to complex query scenarios, continuing the mission of delivering speed, efficiency, and scalability to your data workflows.

### Date Histograms

Date histograms are fundamental for time-based data analysis, underpinning OpenSearch Dashboards visualizations such as time-series charts. In **OpenSearch 2.17**, date histogram queries now execute **55% faster when compared to OpenSearch 2.13** and **97% faster compared to OpenSearch 1.3**, significantly improving the performance of time-series aggregations. This enhancement is particularly impactful for queries without subaggregations and has also been extended to **range aggregations**, further optimizing time-based analyses.

Additionally, **cardinality aggregation**---a critical tool for counting distinct values, such as unique visitors, event types, or products---has received a major performance boost. OpenSearch 2.17 introduces an [optimization](https://github.com/opensearch-project/OpenSearch/pull/13821) that dynamically prunes documents containing distinct values already collected, significantly reducing redundant processing. For **low-cardinality requests**, this leads to notable performance gains, while **high-cardinality requests** see improvements of up to **20%**, streamlining the handling of even the most demanding datasets.

These enhancements make OpenSearch 2.17 an essential upgrade for managing time-based or high-volume datasets, ensuring faster and more efficient query execution for diverse analytics needs.

### Range queries and numeric fields

**Range queries**, commonly used to filter data within specific numerical or date ranges, have undergone significant performance improvements in OpenSearch 2.17. These queries are now **81% faster than OpenSearch 2.14** and **87% faster compared to OpenSearch 1.3**, because of the advancements and optimizations in processing range filters.

At search time, OpenSearch evaluates whether a query can be rewritten from its *original query* to an *approximate query*, which executes faster and uses fewer resources. This [approximate range optimization](https://github.com/opensearch-project/OpenSearch/pull/13788) ensures that most queries deliver equivalent results with reduced computational overhead, maintaining accuracy while improving performance. These enhancements make OpenSearch 2.17 an excellent choice for applications requiring high-performance range filtering, such as analytics dashboards, monitoring systems, and time-series data exploration.

### Sorting and filtering

**Sorting performance** has been a focus throughout the OpenSearch 2.x series, with **OpenSearch 2.17** showing minor improvements when compared to OpenSearch 2.14, while being **59% faster compared to OpenSearch 1.3**. These refinements enable faster query results, particularly for datasets requiring extensive sorting by numeric or textual fields.

Filtering has also seen a significant advancement with the introduction of **[Roaring Bitmap encoding](https://github.com/opensearch-project/OpenSearch/pull/14774)** for handling large filter lists. This approach minimizes memory and network overhead by compressing filter data into efficient bitmap structures. It is particularly effective for high-cardinality scenarios, such as filtering a product catalog by items owned by a specific customer. The bitmap-based filters can be stored and seamlessly joined with the main index at query time. Tests demonstrate that this method maintains **low latency** even with extensive filters, making it a scalable and high-performing alternative to traditional terms queries or lookup strategies. These improvements ensure that OpenSearch 2.17 delivers faster and more efficient sorting and filtering for diverse use cases, from search to large-scale analytics.


##  Vector search

**Disk-optimized vector search:** OpenSearch vector engine continues to prioritize cost savings with its 2.17 release. This release introduces disk-optimized vector search that allows you to use the full potential of vector workloads, even in low-memory environments. Disk-optimized vector search is designed to provide out-of-the-box **32x compression** when using binary quantization, a powerful compression technique. Additionally, you have the flexibility to fine-tune cost, response time, and accuracy to your unique needs through configurable parameters such as compression rate, sampling, and rescoring strategies. According to internal benchmarks, OpenSearch's disk-optimized vector search can deliver cost savings of up to 70%, while maintaining p90 latencies around 200 ms and recall over 0.9. For more information, see [Disk-based vector search](https://opensearch.org/docs/latest/search-plugins/knn/disk-based-vector-search/). 

**Cost improvements by reducing memory footprint:** Vector search capabilities in native engines (Faiss and NMSLIB) have received a significant boost with this latest release. The 2.17 release extends OpenSearch's byte compression technique to the Faiss Engine [HSNW](https://github.com/opensearch-project/k-NN/pull/1823) and [IVF](https://github.com/opensearch-project/k-NN/pull/2002) algorithms to further reduce memory footprint up to 75% for vectors that fit into byte range ([-128, 127]). These provide 25% additional memory footprint savings compared to OpenSearch's 2.14 version with [FP16 quantization](https://opensearch.org/blog/optimizing-opensearch-with-fp16-quantization/) and overall up to 85% savings compared to OpenSearch 1.3. 

**Vector index build improvements:** In 2024, the Vector Engine team made significant [investments](https://github.com/opensearch-project/k-NN/issues/1599) to improve the performance of the OpenSearch vector engine. This includes adding [AVX512 SIMD support](https://github.com/opensearch-project/k-NN/issues/2056), fixing [some bugs](https://github.com/opensearch-project/k-NN/issues/2277) related to segment replication with vector indexes, [transitioning to the more efficient KNNVectorsFormat](https://github.com/opensearch-project/k-NN/issues/1853), and [employing incremental graph builds during merges to reduce memory footprint](https://github.com/opensearch-project/k-NN/issues/1938). With incremental graph builds, the native memory footprint during indexing has been significantly reduced, because the full dataset is loaded into memory at once. This improvement supports HNSW graph builds in low-memory environments and reduces overall build time by approximately 30% compared to OpenSearch 1.3.

**Exact search improvements:** In OpenSearch 2.15, [SIMD optimizations](https://opensearch.org/blog/boosting-k-nn-exact-search/) were added to the k-NN plugin's script scoring, resulting in significant performance gains for CPUs with SIMD support, such as AVX2 or AVX512 on x86 or NEON on ARM. Further improvements in OpenSearch 2.17 introduced Lucene's new vector format, which includes optimized memory-mapped file access. Together, these enhancements significantly reduce search latency for exact k-NN searches on supported hardware.

# Roadmap for 2025

The following improvements are included in the OpenSearch roadmap for 2025.

## Core search engine

In 2025, we will push the boundaries of OpenSearch's query engine with several key initiatives aimed at improving performance, scalability, and efficiency:

* **[Streaming architecture](https://github.com/opensearch-project/OpenSearch/issues/16679)**: We're moving from a request/response model to streaming, processing and delivering data in real time, reducing memory overhead and improving query speed.
* **[Native join support](https://github.com/opensearch-project/OpenSearch/issues/15185)**: We're introducing efficient JOIN operations across indexes to be supported natively, fully integrated with OpenSearch's query DSL, PPL, and SQL.
* **Native vectorized processing**: By using modern CPU SIMD operations and native code, we're optimizing the processing of data streams to eliminate Java's garbage collection bottlenecks.
* **[Smarter query planning](https://github.com/opensearch-project/OpenSearch/issues/12390)**: Optimizing where and how computations run ensures we reduce unnecessary data transfer and improve performance for parallel query execution.
* **[gRPC-based Search API](https://github.com/opensearch-project/OpenSearch/issues/15190)**: We're enhancing client-server communication with Protobuf and gRPC, accelerating search by reducing overhead.
* **[Query performance optimization](https://github.com/orgs/opensearch-project/projects/153)**: Improving performance remains our priority, and several key initiatives such as docId encoding and query approximation will reduce index size and enhance performance of large-range queries.
* **[Star-Tree indexing](https://github.com/opensearch-project/OpenSearch/issues/12498)**: Precomputing aggregations using Star-Tree indexing ensures faster, more predictable performance for aggregation-heavy queries.

### Vector search

In 2025, we will continue to invest in the following key initiatives aimed at performance improvements and cost savings:

* **Index build acceleration with GPUs and SIMD:** k-NN performance can be enhanced by using libraries with GPU support. Because vector distance calculations are compute-heavy, GPUs can speed up computations and enhance the performance of index build time and search queries.
* **Autotuning k-NN indexes:** OpenSearch's vector database offers a toolkit of algorithms tailored for diverse workloads. In 2025, our primary goal is to enhance the out-of-the-box experience by autotuning hyperparameters and settings based on access patterns and hardware resources.
* **Cold-warm tiering:** In version 2.18, we added support for enabling vector search on remote snapshots. We will continue focusing on decoupling index read/write operations to extend vector indexes to different storage systems in order to cut down storage and compute costs.
* **Memory footprint reduction:** We will continue to be aggressive in reducing memory footprint of vector indexes. One of the goals is the ability to partially load the HNSW indexes in native engines. This complements our disk-based-optimized search and helps further cut down the operating cost of the OpenSearch clusters.
* **Reduced disk storage with "derived source":** Currently, vector data is stored both in a doc-values-like format and in the `_source` stored field. The `_source` stored field can contribute more than 60% of the overall storage requirement for vectors. We plan to create a custom stored fields format that will inject the vector fields into the source from the doc-values-like format. In addition to saving storage, this will have secondary effects of improved indexing throughput, lighter shards, and even faster search.

### Neural search

Neural search uses machine learning models to understand the semantic meaning behind search queries, going beyond traditional keyword matching. **It encompasses dense vector search, sparse vector search, and hybrid approaches that combine semantic understanding with lexical search**. Since introducing neural search capabilities in OpenSearch 2.9, we've expanded the functionality to include text embedding, cross-encoder reranking, sparse encoding, and hybrid search.

Our 2025 roadmap emphasizes optimizing performance, enhancing functionality, and simplifying adoption. Key initiatives include:  

- **Improving hybrid query performance**: Reduce latency by up to 25%.  
- **Introducing explainability for hybrid queries**: Provide insights into how each subquery result contributes to the final hybrid query result, enabling better debugging and performance analysis.  
- **Supporting additional algorithms for combining hybrid query results**: Support algorithms like reciprocal rank fusion (RRF), which improves hybrid search latency by avoiding costly score normalization because the scores are rank-based.  
- **Enhancing neural sparse pruning strategies**: Apply techniques such as pruning by weight, by ratio with max weight, by top-k, and by alpha-mass to improve performance by 20%.  
- **Optimizing inference calls during updates and re-indexing**: Reduce the number of inference calls for neural and sparse ingestion pipelines, increasing throughput by 20% for these operations.  
- **Consolidating multi-field inference calls**: Combine multiple field inference calls into a single operation for dense and sparse vector semantic search, reducing inference latency by 15% for multi-field dense-vector-based semantic queries. 
- **Reducing memory usage for resource-constrained systems**: Introduce a new quantization processor to decrease memory usage by 20%, improving efficiency in environments with limited resources or connectivity.  

These advancements aim to enhance query performance, streamline operations, and expand usability across diverse workloads.

# Conclusion

OpenSearch continues to evolve, not only by expanding its functionality but also by significantly enhancing performance, efficiency, and scalability across diverse workloads. OpenSearch 2.17 exemplifies the community's commitment, delivering improvements in query speed, resource utilization, and memory efficiency across text queries, aggregations, range queries, and time-series analytics. These advancements underscore our dedication to optimizing OpenSearch for real-world use cases.

Key innovations like disk-optimized vector search and enhancements to term and multi-term aggregations demonstrate our focus on staying at the forefront of vector search and analytics technology. Additionally, OpenSearch 2.17's improvements to hybrid and vector search, combined with roadmap plans for streaming architecture, gRPC APIs, and smarter query planning, highlight our forward-looking strategy to meet the demands of modern workloads.

These achievements are made possible through collaboration with the broader OpenSearch community, whose contributions in testing, feedback, and development have been invaluable. Together, we are building a robust and efficient search and analytics engine capable of addressing current and future challenges.

Stay connected to our [_blog_](https://opensearch.org/blog) and [_GitHub_](https://github.com/opensearch-project/OpenSearch) for ongoing updates and insights as we continue this journey of innovation and share future plans.

## Appendix: Benchmarking tests and results

This section outlines the performance benchmarks and results achieved using OpenSearch Benchmark to evaluate the Big5 workload across various OpenSearch versions and configurations. 

### Benchmark Setup

- **Benchmarking tool**: OpenSearch Benchmark, our standard benchmarking tool used in prior evaluations.  
- **Instance type**: *c5.2xlarge* (8 vCPU, 16 GB RAM), chosen as a mid-tier option to avoid masking resource efficiency gains with oversized instances.  
- **Cluster configuration**: Single-node cluster for reproducibility and ease of setup.  
- **Index setup**: Big5 Index configured with one shard and no replicas (`--workload-params="number_of_replicas:0"`).  
- **Corpus details**: 100 GB dataset with 116 million documents. The storage size after ingestion was 24 GB for the primary shard.  After removing overheads like doc values, the RSS is expected to be around 8 GB, matching the JVM heap size for the instance. Keeping most of the data in memory ensures a more accurate evaluation of performance improvements.
- **Ingestion**: Conducted with a single bulk indexing client to ensure that data is ingested in chronological order.
- **Merge policy**:  
  - LogByteSizeMergePolicy for OpenSearch 2.11.0 and later.  
  - TieredMergePolicy for OpenSearch 1.3.18 and 2.7.0.  
- **Test mode**: Tests were run in [benchmarking mode](https://opensearch.org/docs/latest/benchmark/user-guide/target-throughput/#benchmarking-mode) (`target-throughput` disabled) so that the OpenSearch client sent requests to the OpenSearch cluster as fast as possible. 

### Key notes and considerations

- **Additional queries**: The Big5 workload was recently updated to include additional queries. These queries have been incorporated in the results of this blog. 
- **`multi_terms-keyword` support**:  OpenSearch 1.3.18 and 2.7.0 recorded `0` ms service time for `multi_terms-keyword`. This is because `multi_terms-keyword` was not supported until OS 2.11.0. Thus, entries in **Mean latency** account for this by excluding `multi_terms-keyword` from the geometric mean computation for OS 1.3.18 and OS 2.7.  

The following table provides benchmarking test results.

|**Buckets**	|Query	|Order	|OS 1.3.18 p90 service time (ms)	|OS 2.7 p90 service time (ms)	|OS 2.11.1 p90 service time (ms)	|OS 2.12.0 p90 service time (ms)	|OS 2.13.0 p90 service time (ms)	|OS 2.14 p90 service time (ms)	|OS 2.15 p90 service time (ms)	|OS 2.16 p90 service time (ms)	|OS 2.17 p90 service time (ms)	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|Text Query	|query-string-on-message	|1	|332.75	|280	|276	|78.25	|80	|77.75	|77.25	|77.75	|78	|
|query-string-on-message-filtered	|2	|67.25	|47	|30.25	|46.5	|47.5	|46	|46.75	|29.5	|30	|
|query-string-on-message-filtered-sorted-num	|3	|125.25	|102	|85.5	|41	|41.25	|41	|40.75	|24	|24.5	|
|term	|4	|4	|3.75	|4	|4	|4	|4	|4	|4	|4	|
|Sorting	|asc_sort_timestamp	|5	|9.75	|15.75	|7.5	|7	|7	|7	|7	|7	|7	|
|asc_sort_timestamp_can_match_shortcut	|6	|13.75	|7	|7	|6.75	|6	|6.25	|6.5	|6	|6.25	|
|asc_sort_timestamp_no_can_match_shortcut	|7	|13.5	|7	|7	|6.5	|6	|6	|6.5	|6	|6.25	|
|asc_sort_with_after_timestamp	|8	|35	|33.75	|238	|212	|197.5	|213.5	|204.25	|160.5	|185.25	|
|desc_sort_timestamp	|9	|12.25	|39.25	|6	|7	|5.75	|5.75	|5.75	|6	|6	|
|desc_sort_timestamp_can_match_shortcut	|10	|7	|120.5	|5	|5.5	|5	|4.75	|5	|5	|5	|
|desc_sort_timestamp_no_can_match_shortcut	|11	|6.75	|117	|5	|5	|4.75	|4.5	|4.75	|5	|5	|
|desc_sort_with_after_timestamp	|12	|487	|33.75	|325.75	|358	|361.5	|385.25	|378.25	|320.25	|329.5	|
|sort_keyword_can_match_shortcut	|13	|291	|3	|3	|3.25	|3.5	|3	|3	|3	|3	|
|sort_keyword_no_can_match_shortcut	|14	|290.75	|3.25	|3	|3.5	|3.25	|3	|3.75	|3	|3.25	|
|sort_numeric_asc	|15	|7.5	|4.5	|4.5	|4	|4	|4	|4	|4	|4	|
|sort_numeric_asc_with_match	|16	|2	|1.75	|2	|2	|2	|2	|1.75	|2	|2	|
|sort_numeric_desc	|17	|8	|6	|6	|5.5	|4.75	|5	|4.75	|4.25	|4.5	|
|sort_numeric_desc_with_match	|18	|2	|2	|2	|2	|2	|2	|1.75	|2	|2	|
|Terms Aggregation	|cardinality-agg-high	|19	|3075.75	|2432.25	|2506.25	|2246	|2284.5	|2202.25	|2323.75	|2337.25	|2408.75	|
|cardinality-agg-low	|20	|2925.5	|2295.5	|2383	|2126	|2245.25	|2159	|3	|3	|3	|
|composite_terms-keyword	|21	|466.75	|378.5	|407.75	|394.5	|353.5	|366	|350	|346.5	|350.25	|
|composite-terms	|22	|290	|242	|263	|252	|233	|228.75	|229	|223.75	|226	|
|keyword-terms	|23	|4695.25	|3478.75	|3557.5	|3220	|29.5	|26	|25.75	|26.25	|26.25	|
|keyword-terms-low-cardinality	|24	|4699.5	|3383	|3477.25	|3249.75	|25	|22	|21.75	|21.75	|21.75	|
|multi_terms-keyword	|25	|0*	|0*	|854.75	|817.25	|796.5	|748	|768.5	|746.75	|770	|
|Range Queries	|keyword-in-range	|26	|101.5	|100	|18	|22	|23.25	|26	|27.25	|18	|17.75	|
|range	|27	|85	|77	|14.5	|18.25	|20.25	|22.75	|24.25	|13.75	|14.25	|
|range_field_conjunction_big_range_big_term_query	|28	|2	|2	|2	|2	|2	|2	|2	|2	|2	|
|range_field_conjunction_small_range_big_term_query	|29	|2	|1.75	|2	|2	|2	|2	|1.5	|2	|2	|
|range_field_conjunction_small_range_small_term_query	|30	|2	|2	|2	|2	|2	|2	|2	|2	|2	|
|range_field_disjunction_big_range_small_term_query	|31	|2	|2	|2	|2	|2	|2	|2	|2	|2.25	|
|range-agg-1	|32	|4641.25	|3810.75	|3745.75	|3578.75	|3477.5	|3328.75	|3318.75	|2	|2.25	|
|range-agg-2	|33	|4568	|3717.25	|3669.75	|3492.75	|3403.5	|3243.5	|3235	|2	|2.25	|
|range-numeric	|34	|2	|2	|2	|2	|2	|2	|2	|2	|2	|
|Date Histogram	|composite-date_histogram-daily	|35	|4828.75	|4055.5	|4051.25	|9	|3	|2.5	|3	|2.75	|2.75	|
|date_histogram_hourly_agg	|36	|4790.25	|4361	|4363.25	|12.5	|12.75	|6.25	|6	|6.25	|6.5	|
|date_histogram_minute_agg	|37	|1404.5	|1340.25	|1113.75	|1001.25	|923	|36	|32.75	|35.25	|39.75	|
|range-auto-date-histo	|38	|10373	|8686.75	|9940.25	|8696.75	|8199.75	|8214.75	|8278.75	|8306	|8293.75	|
|range-auto-date-histo-with-metrics	|39	|22988.5	|20438	|20108.25	|20392.75	|20117.25	|19656.5	|19959.25	|20364.75	|20147.5	|
|	|	|	|71659	|59633.5	|61501.75	|50337.25	|42943.25	|41,119.75	|39,422.00	|33,135.25	|33,048.50	|


