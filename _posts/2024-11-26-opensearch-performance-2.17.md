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
    - kolchfa
date: 2024-11-27
categories:
        - technical-posts
        - community
meta_keywords: OpenSearch performance, benchmarking, query optimization, vector search, text queries, aggregations, OpenSearch roadmap
meta_description: Explore the significant performance gains up through OpenSearch 2.17. Explore optimizations in text search, aggregations, range queries, and vector operations, and get a preview of the OpenSearch 2025 roadmap.
has_science_table: true
excerpt: Learn more about the strategic enhancements and performance features that OpenSearch has delivered up to version 2.17.
featured_blog_post: false
featured_image: false
additional_author_info: We sincerely appreciate the contributions to this blog from Anandhi Bumstead, Carl Meadows, Jon Handler, Dagney Braun, Michael Froh, Kunal Khatua, Andrew Ross, Harsha Vamsi, Bowen Lan, Rishabh Kumar Maurya, Sandesh Kumar, Marc Handalian, Rishabh Singh, Govind Kamat, Martin Gaievski, and Minal Shah.
---

Our commitment to enhancing OpenSearch's performance remains unwavering, and this blog post showcases the significant progress we've made. Recently, we've focused our investments on four key areas: text querying, vector storage and querying, ingestion and indexing, and storage efficiency. Additionally, we've published our search and performance roadmap, reaffirming that performance continues to be our top priority. In this blog post, we'll bring you up to date on our continuing performance improvements through [OpenSearch 2.17](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.17.0.md).

OpenSearch 2.17 offers a remarkable **6x performance boost** compared to OpenSearch 1.3, enhancing key operations like text queries, terms aggregations, range queries, date histograms, and sorting. Additionally, the improvements in semantic vector search now allow for highly configurable settings, enabling you to balance response time, accuracy, and cost according to your needs. These advancements are a testament to the dedicated community whose contributions and collaboration propel OpenSearch forward.

The first section focuses on key query operations, including text queries, 297s aggregations, range queries, date histograms, and sorting. These improvements were evaluated using the [OpenSearch Big5 workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/big5), which represents common use cases in both search and analytics applications. The benchmarks provide a repeatable framework for measuring real-world performance enhancements. The next section reports on vector search improvements. Finally, we present our roadmap for 2025, where you'll see that we're making qualitative improvements in many areas, in addition to important incremental changes. We are improving query speed by processing data in real time. We are building a query planner that uses resources more efficiently. We are speeding up intra-cluster communications. And we're adding efficient join operations to query domain-specific language (DSL), Piped Processing Language (PPL), and SQL. To follow our work in more detail, and to contribute comments or code, please participate on the [OpenSearch forum](https://forum.opensearch.org/) as well as directly in our GitHub repos.

<style>

.light-green-clr {
    background-color: #e3f8e3;
}

.gray-clr {
    background-color: #f5f7f7; 
}

.ylw-clr {
    background-color: #FFEFCC;
}

.border-btm {
    border-bottom: 2px solid #e6e6e6;
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

Since its inception, OpenSearch has consistently improved performance, and version 2.17 continues this trend. Compared to earlier versions, OpenSearch 2.17 delivers improved performance, achieving a **6x speed increase** over OpenSearch 1.3 and reducing query latencies across various categories. The following graph shows the relative improvements by query category as 90th percentile latencies, with a baseline of OpenSearch 1.3.

<img src="/assets/media/blog-images/2024-11-26-opensearch-performance-2.17/OS-PerformanceChart-ldc@2x.png" alt="OpenSearch performance improvements up to 2.17" class="center"/>{:style="width: 100%; max-width: 800px; height: auto; text-align: center"}

### Key highlights 

Based on our benchmarking, we've identified the following key highlights:

- **Overall query performance**: OpenSearch 2.17 delivers **6x better performance** than OpenSearch 1.3.
- **Text queries**: Text search queries, fundamental to many OpenSearch use cases, are **63% faster** in 2.17 compared to the baseline of OpenSearch 1.3.
- **Terms aggregations**: This critical query type for log analytics shows an **81% improvement** compared to OpenSearch 1.3, allowing for faster and more efficient data aggregation.
- **Date histograms**: Date histogram performance has **improved by 97%** compared to OpenSearch 1.3, providing major speed improvements for time-series analysis.
- **Range queries**: With an **87% performance improvement** compared to OpenSearch 1.3, range queries now execute more quickly while using fewer resources.
- **Sorting and filtering**: OpenSearch 2.17 delivers faster sorting, with a **59% improvement** compared to OpenSearch 1.3, enhancing query performance for numeric and textual datasets.

The following table summarizes performance improvements for the preceding query types.

<table>
    <tbody>
        <tr>
            <th></th>
            <th>Query type</th>
            <th>OS 1.3.18</th>
            <th>OS <br>2.7</th>
            <th>OS 2.11</th>
            <th>OS 2.12</th>
            <th>OS 2.13</th>
            <th>OS 2.14</th>
            <th>OS 2.15</th>
            <th>OS 2.16</th>
            <th>OS 2.17</th>
        </tr>
        <tr>
            <td rowspan=5 class="bold left gray-clr">Big 5 areas mean latency, ms</td>
            <td class="left">Text queries</td>
            <td class="ylw-clr">59.51</td>
            <td>47.91</td>
            <td>41.05</td>
            <td>27.29</td>
            <td>27.61</td>
            <td>27.85</td>
            <td>27.39</td>
            <td>21.7</td>
            <td class="light-green-clr">21.77</td>
        </tr>
        <tr>
            <td class="left">Sorting</td>
            <td class="ylw-clr">17.73</td>
            <td>11.24</td>
            <td>8.14</td>
            <td>7.99</td>
            <td>7.53</td>
            <td>7.47</td>
            <td>7.78</td>
            <td>7.22</td>
            <td class="light-green-clr">7.26</td>
        </tr>
        <tr>
            <td class="left">Terms aggregations</td>
            <td class="ylw-clr">609.43</td>
            <td>1351</td>
            <td>1316</td>
            <td>1228</td>
            <td>291</td>
            <td>293</td>
            <td>113</td>
            <td>112</td>
            <td class="light-green-clr">113</td>
        </tr>
        <tr>
            <td class="left">Range queries</td>
            <td class="ylw-clr">26.08</td>
            <td>23.12</td>
            <td>16.91</td>
            <td>18.71</td>
            <td>17.33</td>
            <td>17.39</td>
            <td>18.51</td>
            <td>3.17</td>
            <td class="light-green-clr">3.17</td>
        </tr>
        <tr>
            <td class="left">Date histograms</td>
            <td class="ylw-clr">6068</td>
            <td>5249</td>
            <td>5168</td>
            <td>469</td>
            <td>357</td>
            <td>146</td>
            <td>157</td>
            <td>164</td>
            <td class="light-green-clr">160</td>
        </tr>
        <tr>
            <td colspan=2 class="bold left gray-clr">Aggregate (geo mean)</td>
            <td class="ylw-clr">159.04</td>
            <td>154.59</td>
            <td>130.9</td>
            <td>74.85</td>
            <td>51.84</td>
            <td>43.44</td>
            <td>37.07</td>
            <td>24.66</td>
            <td class="light-green-clr">24.63</td>
        </tr>
        <tr>
            <td colspan=2 class="bold left gray-clr">Speedup factor, compared to OS 1.3 (geo mean)</td>
            <td class="ylw-clr">1.0</td>
            <td>1.03</td>
            <td>1.21</td>
            <td>2.12</td>
            <td>3.07</td>
            <td>3.66</td>
            <td>4.29</td>
            <td>6.45</td>
            <td class="light-green-clr">6.46</td>
        </tr>
        <tr>
            <td colspan=2 class="bold left gray-clr">Relative latency, compared to OS 1.3 (geo mean)</td>
            <td class="ylw-clr">100%</td>
            <td>97.20%</td>
            <td>82.31%</td>
            <td>47.06%</td>
            <td>32.60%</td>
            <td>27.31%</td>
            <td>23.31%</td>
            <td>15.51%</td>
            <td class="light-green-clr">15.49%</td>
        </tr>
    </tbody>
</table>

For a detailed benchmark analysis or to run your own benchmarks, see the [Appendix](#appendix-benchmarking-tests-and-results).

## Queries

OpenSearch now features the following query improvements.

### Text queries

Text queries are fundamental to effective text search, especially in applications requiring fast and accurate document retrieval. OpenSearch 2.12 introduced the **match_only_text** field to address specific needs in analytics and applications prioritizing 100% recall or customized ranking strategies. This field type dramatically reduced index sizes and accelerated query execution by removing the complexity of relevance-based scoring. As a result, **text queries performed 47% faster compared to OpenSearch 2.11 and 57% faster compared to OpenSearch 1.3**.

With OpenSearch 2.17, we further amplified these performance gains. Building on the foundation of the **match_only_text** field, OpenSearch 2.17 optimizes text queries, achieving **21% faster performance compared to 2.14** and **63% faster performance compared to 1.3**. These improvements stem from continued enhancements to query execution and index optimization. Applications relying on text search for analytics or high-recall use cases can now achieve faster results with reduced resource usage, making OpenSearch 2.17 an even more powerful choice for modern text search workloads.

### Terms and multi-terms aggregations 

Terms aggregations are crucial for slicing large datasets based on multiple criteria, making them important query operations for data analytics use cases. Building on prior advancements, OpenSearch 2.17 enhances the efficiency of global terms aggregations, using term frequency optimizations to handle large immutable collections, such as log data, with unprecedented speed. 

Performance benchmarks demonstrate a **61% performance improvement compared to OpenSearch 2.14** and an overall **81% reduction in query latency compared to OpenSearch 1.3**, while **multi-terms aggregation queries demonstrate up to a 20% reduction in latency**. Additionally, memory efficiency is improved dramatically, with a **50--60% reduction in memory footprint for short-lived objects** because new byte array allocations for composite key storage are not needed. 

OpenSearch 2.17 also introduced support for the **[wildcard field type](https://github.com/opensearch-project/OpenSearch/pull/13461)**, enabling highly efficient execution of wildcard, prefix, and regular expression queries. This new field type uses trigrams (or bigrams and individual characters) to match patterns before applying a post-filtering step to evaluate the original field, resulting in faster and more efficient query execution.

These advancements make OpenSearch 2.17 a powerful tool for analytics use cases, from large-scale log processing to complex query scenarios, continuing the mission of delivering speed, efficiency, and scalability to your data workflows.

### Date histograms

Date histograms are fundamental to time-based data analysis, underpinning OpenSearch Dashboards visualizations such as time-series charts. In OpenSearch 2.17, date histogram queries now execute **55% faster compared to OpenSearch 2.13** and **97% faster compared to OpenSearch 1.3**, significantly improving the performance of time-series aggregations. This enhancement is particularly impactful for queries without subaggregations and has also been extended to **range aggregations**, further optimizing time-based analyses.

Additionally, **cardinality aggregation**---a critical tool for counting distinct values, such as unique visitors, event types, or products---has received a major performance boost. OpenSearch 2.17 introduced an [optimization](https://github.com/opensearch-project/OpenSearch/pull/13821) that dynamically prunes documents containing distinct values that have already been collected, significantly reducing redundant processing. For **low-cardinality requests**, this leads to notable performance gains, while **high-cardinality requests** see improvements of up to **20%**, streamlining the handling of even the most demanding datasets.

These enhancements make OpenSearch 2.17 an essential upgrade for managing time-based or high-volume datasets, ensuring faster and more efficient query execution for diverse analytics needs.

### Range queries and numeric fields

**Range queries**, commonly used to filter data within specific numerical or date ranges, have undergone significant performance improvements in OpenSearch 2.17. These queries are now **81% faster compared to OpenSearch 2.14** and **87% faster compared to OpenSearch 1.3** because of advancements and optimizations in range filter processing.

At search time, OpenSearch evaluates whether a query can be rewritten from its *original query* to an *approximate query*, which executes faster and uses fewer resources. This [approximate range optimization](https://github.com/opensearch-project/OpenSearch/pull/13788) ensures that most queries deliver equivalent results with reduced computational overhead, maintaining accuracy while improving performance. These enhancements make OpenSearch 2.17 an excellent choice for applications requiring high-performance range filtering, such as analytics dashboards, monitoring systems, and time-series data exploration.

### Sorting and filtering

**Sorting performance** has been a focus throughout the OpenSearch 2.x series, with OpenSearch 2.17 showing minor improvements compared to OpenSearch 2.14 but a **59% performance improvement compared to OpenSearch 1.3**. These refinements enable faster query results, particularly for datasets requiring extensive sorting by numeric or textual fields.

Filtering has also seen a significant advancement with the introduction of **[roaring bitmap encoding](https://github.com/opensearch-project/OpenSearch/pull/14774)** for handling large filter lists. This approach minimizes memory and network overhead by compressing filter data into efficient bitmap structures. It is particularly effective in high-cardinality scenarios, such as when filtering a product catalog by items owned by a specific customer. The bitmap-based filters can be stored and seamlessly joined with the main index at query time. Tests demonstrate that this method maintains **low latency** even with numerous filters, making it a scalable and high-performing alternative to traditional terms queries or lookup strategies. These improvements ensure that OpenSearch 2.17 delivers faster and more efficient sorting and filtering for diverse use cases, from search to large-scale analytics.


## Vector search

**Disk-optimized vector search**: The OpenSearch vector engine continues to prioritize cost savings in the 2.17 release. This release introduced disk-optimized vector search, allowing you to use the full potential of vector workloads, even in low-memory environments. Disk-optimized vector search is designed to provide out-of-the-box **32x compression** when using binary quantization, a powerful compression technique. Additionally, you have the flexibility to fine-tune costs, response time, and accuracy to your unique needs through configurable parameters such as compression rate, sampling, and rescoring. According to internal benchmarks, OpenSearch's disk-optimized vector search can deliver cost savings of up to 70% while maintaining p90 latencies of around 200 ms and recall of over 0.9. For more information, see [Disk-based vector search](https://opensearch.org/docs/latest/search-plugins/knn/disk-based-vector-search/). 

**Cost improvements by reducing memory footprint**: Vector search capabilities in native engines (Faiss and NMSLIB) received a significant boost in OpenSearch 2.17. In this version, OpenSearch's byte compression technique is extended to the Faiss Engine [HSNW](https://github.com/opensearch-project/k-NN/pull/1823) and [IVF](https://github.com/opensearch-project/k-NN/pull/2002) algorithms to further reduce memory footprint by up to 75% for vectors within byte range ([-128, 127]). These provide an additional 25% memory footprint savings compared to OpenSearch 2.14 with [FP16 quantization](https://opensearch.org/blog/optimizing-opensearch-with-fp16-quantization/) and an overall savings of up to 85% compared to OpenSearch 1.3. 

**Vector index build improvements**: In 2024, the Vector Engine team made significant [investments](https://github.com/opensearch-project/k-NN/issues/1599) in improving the performance of the OpenSearch vector engine. These included adding [AVX512 SIMD support](https://github.com/opensearch-project/k-NN/issues/2056), fixing [some bugs](https://github.com/opensearch-project/k-NN/issues/2277) related to segment replication with vector indexes, [transitioning to the more efficient KNNVectorsFormat](https://github.com/opensearch-project/k-NN/issues/1853), and [employing incremental graph builds during merges to reduce memory footprint](https://github.com/opensearch-project/k-NN/issues/1938). With incremental graph builds, the native memory footprint during indexing has been significantly reduced because the full dataset is loaded into memory at once. This improvement supports HNSW graph builds in low-memory environments and reduces overall build time by approximately 30% compared to OpenSearch 1.3.

**Exact search improvements**: In OpenSearch 2.15, [SIMD optimizations](https://opensearch.org/blog/boosting-k-nn-exact-search/) were added to the k-NN plugin's script scoring, resulting in significant performance gains for CPUs with SIMD support, such as AVX2 or AVX512 on x86 or NEON on ARM. Further improvements in OpenSearch 2.17 introduced Lucene's new vector format, which includes optimized memory-mapped file access. Together, these enhancements significantly reduce search latency for exact k-NN searches on supported hardware.

## Roadmap for 2025

The following improvements are included in the OpenSearch roadmap for 2025.

### Core search engine

In 2025, we will push the boundaries of OpenSearch's query engine with several key initiatives aimed at improving performance, scalability, and efficiency:

* **[Streaming architecture](https://github.com/opensearch-project/OpenSearch/issues/16679)**: We're moving from a request/response model to streaming, processing, and delivering data in real time, thereby reducing memory overhead and improving query speed.
* **[Native join support](https://github.com/opensearch-project/OpenSearch/issues/15185)**: We're introducing efficient join operations across indexes that will be natively supported and fully integrated with OpenSearch's query DSL, PPL, and SQL.
* **Native vectorized processing**: By using modern CPU SIMD operations and native code, we're optimizing the processing of data streams to eliminate Java's garbage collection bottlenecks.
* **[Smarter query planning](https://github.com/opensearch-project/OpenSearch/issues/12390)**: Optimizing where and how computations run will ensure reduced unnecessary data transfer and improve performance for parallel query execution.
* **[gRPC-based Search API](https://github.com/opensearch-project/OpenSearch/issues/15190)**: We're enhancing client-server communication with Protobuf and gRPC, accelerating search by reducing overhead.
* **[Query performance optimization](https://github.com/orgs/opensearch-project/projects/153)**: Improving performance remains our consistent priority, and several key initiatives, such as docID encoding and query approximation, will reduce index size and enhance the performance of large-range queries.
* **[Star-tree indexing](https://github.com/opensearch-project/OpenSearch/issues/12498)**: Precomputing aggregations using star-tree indexing will ensure faster, more predictable performance for aggregation-heavy queries.

### Vector search

In 2025, we will continue to invest in the following key initiatives aimed at performance improvements and cost savings:

* **Index build acceleration with GPUs and SIMD:** k-NN performance can be enhanced by using libraries with GPU support. Because vector distance calculations are compute-heavy, GPUs can speed up computations and reduce index build and search query times.
* **Autotuning k-NN indexes:** OpenSearch's vector database offers a toolkit of algorithms tailored for diverse workloads. In 2025, our goal is to enhance the out-of-the-box experience by autotuning hyperparameters and settings based on access patterns and hardware resources.
* **Cold-warm tiering:** In version 2.18, we added support for enabling vector search on remote snapshots. We will continue focusing on decoupling index read/write operations to extend vector indexes to different storage systems in order to reduce storage and compute costs.
* **Memory footprint reduction:** We will continue to aggressively reduce the memory footprint of vector indexes. One of our goals is to support the ability to partially load HNSW indexes into native engines. This complements our disk-optimized search and helps further reduce the operating costs of OpenSearch clusters.
* **Reduced disk storage using derived source:** Currently, vector data is stored both in a doc-values-like format and in the stored `_source` field. The stored `_source` field can contribute more than 60% of the overall vector storage requirement. We plan to create a custom stored field format that will inject the vector fields into the source from the doc-values-like format, creating a derived source field. In addition to storage savings, this approach will improve indexing throughput, reduce shard size, and even accelerate search.

### Neural search

Neural search uses machine learning models to understand the semantic meaning of search queries, going beyond traditional keyword matching. **It encompasses dense vector search, sparse vector search, and hybrid search approaches that combine semantic understanding with lexical search**. Since introducing neural search capabilities in OpenSearch 2.9, we've expanded the functionality to include text embedding, cross-encoder reranking, sparse encoding, and hybrid search.

Our 2025 roadmap emphasizes optimizing performance, enhancing functionality, and simplifying adoption. Key initiatives include:  

- **Improving hybrid query performance**: Reduce latency by up to 25%.  
- **Introducing explainability for hybrid queries**: Provide insights into how each subquery result contributes to the final hybrid query result, enabling better debugging and performance analysis.  
- **Supporting additional algorithms for combining hybrid query results**: Support algorithms like reciprocal rank fusion (RRF), which improves hybrid search latency by avoiding costly score normalization because the scores are rank based.  
- **Enhancing neural sparse pruning strategies**: Apply techniques such as pruning by weight, by ratio with max weight, by top-k, and by alpha-mass to improve performance by 20%.  
- **Optimizing inference calls during updates and reindexing**: Reduce the number of inference calls required for neural and sparse ingestion pipelines, increasing throughput by 20% for these operations.  
- **Consolidating multifield inference calls**: Combine multiple field inference calls into a single operation for dense and sparse vector semantic search, reducing inference latency by 15% for multifield dense-vector-based semantic queries. 
- **Reducing memory usage for resource-constrained systems**: Introduce a new quantization processor to decrease memory usage by 20%, improving efficiency in environments with limited resources or connectivity.  

These advancements aim to enhance query performance, streamline operations, and expand usability across diverse workloads.

## Conclusion

OpenSearch continues to evolve, not only by expanding functionality but also by significantly enhancing performance, efficiency, and scalability across diverse workloads. OpenSearch 2.17 exemplifies the community's commitment, delivering improvements in query speed, resource utilization, and memory efficiency across text queries, aggregations, range queries, and time-series analytics. These advancements underscore our dedication to optimizing OpenSearch for real-world use cases.

Key innovations like disk-optimized vector search and enhancements to terms and multi-terms aggregations demonstrate our focus on staying at the forefront of vector search and analytics technology. Additionally, OpenSearch 2.17's improvements to hybrid and vector search, combined with roadmap plans for streaming architecture, gRPC APIs, and smarter query planning, highlight our forward-looking strategy for meeting the demands of modern workloads.

These achievements are made possible through collaboration with the broader OpenSearch community, whose contributions to testing, feedback, and development have been invaluable. Together, we are building a robust and efficient search and analytics engine capable of addressing current and future challenges.

Stay connected to our [blog](https://opensearch.org/blog) and [GitHub repos](https://github.com/opensearch-project/OpenSearch) for ongoing updates and insights as we continue this journey of innovation and share future plans.

## Appendix: Benchmarking tests and results

This section outlines the performance benchmarks and results achieved using OpenSearch Benchmark to evaluate the Big5 workload across various OpenSearch versions and configurations. 

### Benchmark setup

- **Benchmarking tool**: OpenSearch Benchmark, our standard benchmarking tool used in prior evaluations.  
- **Instance type**: *c5.2xlarge* (8 vCPU, 16 GB RAM), chosen as a mid-tier option to avoid masking resource efficiency gains with oversized instances.  
- **Cluster configuration**: A single-node cluster for reproducibility and ease of setup.  
- **Index setup**: A Big5 Index configured with one shard and no replicas (`--workload-params="number_of_replicas:0"`).  
- **Corpus details**: A 100 GB dataset with 116 million documents. The storage size after ingestion was 24 GB for the primary shard. After removing overheads like doc values, the RSS is expected to be around 8 GB, matching the JVM heap size for the instance. Keeping most of the data in memory ensures a more accurate evaluation of performance improvements.
- **Ingestion**: Conducted with a single bulk indexing client to ensure that data is ingested in chronological order.
- **Merge policy**:  
  - LogByteSizeMergePolicy for OpenSearch 2.11.0 and later.  
  - TieredMergePolicy for OpenSearch 1.3.18 and 2.7.0.  
- **Test mode**: Tests were run in [benchmarking mode](https://opensearch.org/docs/latest/benchmark/user-guide/target-throughput/#benchmarking-mode) (`target-throughput` disabled) so that the OpenSearch client sent requests to the OpenSearch cluster as fast as possible. 

### Results

The following table provides benchmarking test results.

<table>
    <thead>
        <tr>
            <th>Buckets</th>
            <th>Query</th>
            <th>Order</th>
            <th>OS 1.3.18 p90 service time (ms)</th>
            <th>OS 2.7 p90 service time (ms)</th>
            <th>OS 2.11.1 p90 service time (ms)</th>
            <th>OS 2.12.0 p90 service time (ms)</th>
            <th>OS 2.13.0 p90 service time (ms)</th>
            <th>OS 2.14 p90 service time (ms)</th>
            <th>OS 2.15 p90 service time (ms)</th>
            <th>OS 2.16 p90 service time (ms)</th>
            <th>OS 2.17 p90 service time (ms)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan=4 class="bold">Text queries</td>
            <td>query-string-on-message</td>
            <td>1</td>
            <td>332.75</td>
            <td>280</td>
            <td>276</td>
            <td>78.25</td>
            <td>80</td>
            <td>77.75</td>
            <td>77.25</td>
            <td>77.75</td>
            <td>78</td>
        </tr>
        <tr>
            <td>query-string-on-message-filtered</td>
            <td>2</td>
            <td>67.25</td>
            <td>47</td>
            <td>30.25</td>
            <td>46.5</td>
            <td>47.5</td>
            <td>46</td>
            <td>46.75</td>
            <td>29.5</td>
            <td>30</td>
        </tr>
        <tr>
            <td>query-string-on-message-filtered-sorted-num</td>
            <td>3</td>
            <td>125.25</td>
            <td>102</td>
            <td>85.5</td>
            <td>41</td>
            <td>41.25</td>
            <td>41</td>
            <td>40.75</td>
            <td>24</td>
            <td>24.5</td>
        </tr>
        <tr class="border-btm">
            <td>term</td>
            <td>4</td>
            <td>4</td>
            <td>3.75</td>
            <td>4</td>
            <td>4</td>
            <td>4</td>
            <td>4</td>
            <td>4</td>
            <td>4</td>
            <td>4</td>
        </tr>
        <tr>
            <td rowspan=14 class="bold">Sorting</td>
            <td>asc_sort_timestamp</td>
            <td>5</td>
            <td>9.75</td>
            <td>15.75</td>
            <td>7.5</td>
            <td>7</td>
            <td>7</td>
            <td>7</td>
            <td>7</td>
            <td>7</td>
            <td>7</td>
        </tr>
        <tr>
            <td>asc_sort_timestamp_can_match_shortcut</td>
            <td>6</td>
            <td>13.75</td>
            <td>7</td>
            <td>7</td>
            <td>6.75</td>
            <td>6</td>
            <td>6.25</td>
            <td>6.5</td>
            <td>6</td>
            <td>6.25</td>
        </tr>
        <tr>
            <td>asc_sort_timestamp_no_can_match_shortcut</td>
            <td>7</td>
            <td>13.5</td>
            <td>7</td>
            <td>7</td>
            <td>6.5</td>
            <td>6</td>
            <td>6</td>
            <td>6.5</td>
            <td>6</td>
            <td>6.25</td>
        </tr>
        <tr>
            <td>asc_sort_with_after_timestamp</td>
            <td>8</td>
            <td>35</td>
            <td>33.75</td>
            <td>238</td>
            <td>212</td>
            <td>197.5</td>
            <td>213.5</td>
            <td>204.25</td>
            <td>160.5</td>
            <td>185.25</td>
        </tr>
        <tr>
            <td>desc_sort_timestamp</td>
            <td>9</td>
            <td>12.25</td>
            <td>39.25</td>
            <td>6</td>
            <td>7</td>
            <td>5.75</td>
            <td>5.75</td>
            <td>5.75</td>
            <td>6</td>
            <td>6</td>
        </tr>
        <tr>
            <td>desc_sort_timestamp_can_match_shortcut</td>
            <td>10</td>
            <td>7</td>
            <td>120.5</td>
            <td>5</td>
            <td>5.5</td>
            <td>5</td>
            <td>4.75</td>
            <td>5</td>
            <td>5</td>
            <td>5</td>
        </tr>
        <tr>
            <td>desc_sort_timestamp_no_can_match_shortcut</td>
            <td>11</td>
            <td>6.75</td>
            <td>117</td>
            <td>5</td>
            <td>5</td>
            <td>4.75</td>
            <td>4.5</td>
            <td>4.75</td>
            <td>5</td>
            <td>5</td>
        </tr>
        <tr>
            <td>desc_sort_with_after_timestamp</td>
            <td>12</td>
            <td>487</td>
            <td>33.75</td>
            <td>325.75</td>
            <td>358</td>
            <td>361.5</td>
            <td>385.25</td>
            <td>378.25</td>
            <td>320.25</td>
            <td>329.5</td>
        </tr>
        <tr>
            <td>sort_keyword_can_match_shortcut</td>
            <td>13</td>
            <td>291</td>
            <td>3</td>
            <td>3</td>
            <td>3.25</td>
            <td>3.5</td>
            <td>3</td>
            <td>3</td>
            <td>3</td>
            <td>3</td>
        </tr>
        <tr>
            <td>sort_keyword_no_can_match_shortcut</td>
            <td>14</td>
            <td>290.75</td>
            <td>3.25</td>
            <td>3</td>
            <td>3.5</td>
            <td>3.25</td>
            <td>3</td>
            <td>3.75</td>
            <td>3</td>
            <td>3.25</td>
        </tr>
        <tr>
            <td>sort_numeric_asc</td>
            <td>15</td>
            <td>7.5</td>
            <td>4.5</td>
            <td>4.5</td>
            <td>4</td>
            <td>4</td>
            <td>4</td>
            <td>4</td>
            <td>4</td>
            <td>4</td>
        </tr>
        <tr>
            <td>sort_numeric_asc_with_match</td>
            <td>16</td>
            <td>2</td>
            <td>1.75</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>1.75</td>
            <td>2</td>
            <td>2</td>
        </tr>
        <tr>
            <td>sort_numeric_desc</td>
            <td>17</td>
            <td>8</td>
            <td>6</td>
            <td>6</td>
            <td>5.5</td>
            <td>4.75</td>
            <td>5</td>
            <td>4.75</td>
            <td>4.25</td>
            <td>4.5</td>
        </tr>
        <tr class="border-btm">
            <td>sort_numeric_desc_with_match</td>
            <td>18</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>1.75</td>
            <td>2</td>
            <td>2</td>
        </tr>
        <tr>
            <td rowspan=7 class="bold">Terms aggregations</td>
            <td>cardinality-agg-high</td>
            <td>19</td>
            <td>3075.75</td>
            <td>2432.25</td>
            <td>2506.25</td>
            <td>2246</td>
            <td>2284.5</td>
            <td>2202.25</td>
            <td>2323.75</td>
            <td>2337.25</td>
            <td>2408.75</td>
        </tr>
        <tr>
            <td>cardinality-agg-low</td>
            <td>20</td>
            <td>2925.5</td>
            <td>2295.5</td>
            <td>2383</td>
            <td>2126</td>
            <td>2245.25</td>
            <td>2159</td>
            <td>3</td>
            <td>3</td>
            <td>3</td>
        </tr>
        <tr>
            <td>composite_terms-keyword</td>
            <td>21</td>
            <td>466.75</td>
            <td>378.5</td>
            <td>407.75</td>
            <td>394.5</td>
            <td>353.5</td>
            <td>366</td>
            <td>350</td>
            <td>346.5</td>
            <td>350.25</td>
        </tr>
        <tr>
            <td>composite-terms</td>
            <td>22</td>
            <td>290</td>
            <td>242</td>
            <td>263</td>
            <td>252</td>
            <td>233</td>
            <td>228.75</td>
            <td>229</td>
            <td>223.75</td>
            <td>226</td>
        </tr>
        <tr>
            <td>keyword-terms</td>
            <td>23</td>
            <td>4695.25</td>
            <td>3478.75</td>
            <td>3557.5</td>
            <td>3220</td>
            <td>29.5</td>
            <td>26</td>
            <td>25.75</td>
            <td>26.25</td>
            <td>26.25</td>
        </tr>
        <tr>
            <td>keyword-terms-low-cardinality</td>
            <td>24</td>
            <td>4699.5</td>
            <td>3383</td>
            <td>3477.25</td>
            <td>3249.75</td>
            <td>25</td>
            <td>22</td>
            <td>21.75</td>
            <td>21.75</td>
            <td>21.75</td>
        </tr>
        <tr class="border-btm">
            <td>multi_terms-keyword</td>
            <td>25</td>
            <td>0*</td>
            <td>0*</td>
            <td>854.75</td>
            <td>817.25</td>
            <td>796.5</td>
            <td>748</td>
            <td>768.5</td>
            <td>746.75</td>
            <td>770</td>
        </tr>
        <tr>
            <td rowspan=9 class="bold">Range queries</td>
            <td>keyword-in-range</td>
            <td>26</td>
            <td>101.5</td>
            <td>100</td>
            <td>18</td>
            <td>22</td>
            <td>23.25</td>
            <td>26</td>
            <td>27.25</td>
            <td>18</td>
            <td>17.75</td>
        </tr>
        <tr>
            <td>range</td>
            <td>27</td>
            <td>85</td>
            <td>77</td>
            <td>14.5</td>
            <td>18.25</td>
            <td>20.25</td>
            <td>22.75</td>
            <td>24.25</td>
            <td>13.75</td>
            <td>14.25</td>
        </tr>
        <tr>
            <td>range_field_conjunction_big_range_big_term_query</td>
            <td>28</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
        </tr>
        <tr>
            <td>range_field_conjunction_small_range_big_term_query</td>
            <td>29</td>
            <td>2</td>
            <td>1.75</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>1.5</td>
            <td>2</td>
            <td>2</td>
        </tr>
        <tr>
            <td>range_field_conjunction_small_range_small_term_query</td>
            <td>30</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
        </tr>
        <tr>
            <td>range_field_disjunction_big_range_small_term_query</td>
            <td>31</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2.25</td>
        </tr>
        <tr>
            <td>range-agg-1</td>
            <td>32</td>
            <td>4641.25</td>
            <td>3810.75</td>
            <td>3745.75</td>
            <td>3578.75</td>
            <td>3477.5</td>
            <td>3328.75</td>
            <td>3318.75</td>
            <td>2</td>
            <td>2.25</td>
        </tr>
        <tr>
            <td>range-agg-2</td>
            <td>33</td>
            <td>4568</td>
            <td>3717.25</td>
            <td>3669.75</td>
            <td>3492.75</td>
            <td>3403.5</td>
            <td>3243.5</td>
            <td>3235</td>
            <td>2</td>
            <td>2.25</td>
        </tr>
        <tr class="border-btm">
            <td>range-numeric</td>
            <td>34</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
            <td>2</td>
        </tr>
        <tr>
            <td rowspan=5 class="bold">Date histograms</td>
            <td>composite-date_histogram-daily</td>
            <td>35</td>
            <td>4828.75</td>
            <td>4055.5</td>
            <td>4051.25</td>
            <td>9</td>
            <td>3</td>
            <td>2.5</td>
            <td>3</td>
            <td>2.75</td>
            <td>2.75</td>
        </tr>
        <tr>
            <td>date_histogram_hourly_agg</td>
            <td>36</td>
            <td>4790.25</td>
            <td>4361</td>
            <td>4363.25</td>
            <td>12.5</td>
            <td>12.75</td>
            <td>6.25</td>
            <td>6</td>
            <td>6.25</td>
            <td>6.5</td>
        </tr>
        <tr>
            <td>date_histogram_minute_agg</td>
            <td>37</td>
            <td>1404.5</td>
            <td>1340.25</td>
            <td>1113.75</td>
            <td>1001.25</td>
            <td>923</td>
            <td>36</td>
            <td>32.75</td>
            <td>35.25</td>
            <td>39.75</td>
        </tr>
        <tr>
            <td>range-auto-date-histo</td>
            <td>38</td>
            <td>10373</td>
            <td>8686.75</td>
            <td>9940.25</td>
            <td>8696.75</td>
            <td>8199.75</td>
            <td>8214.75</td>
            <td>8278.75</td>
            <td>8306</td>
            <td>8293.75</td>
        </tr>
        <tr>
            <td>range-auto-date-histo-with-metrics</td>
            <td>39</td>
            <td>22988.5</td>
            <td>20438</td>
            <td>20108.25</td>
            <td>20392.75</td>
            <td>20117.25</td>
            <td>19656.5</td>
            <td>19959.25</td>
            <td>20364.75</td>
            <td>20147.5</td>
        </tr>
    </tbody>
</table>

### Notes and considerations

- **Additional queries**: The Big5 workload was recently updated to include additional queries. These queries have been included in the results of this blog post. 
- <sup>*</sup> **`multi_terms-keyword` support**: OpenSearch 1.3.18 and 2.7.0 recorded `0` ms service time for `multi_terms-keyword`. This is because `multi_terms-keyword` was not supported until OpenSearch 2.11.0. Mean latency calculations account for this by excluding `multi_terms-keyword` from the geometric mean computation for OpenSearch 1.3.18 and 2.7.0.