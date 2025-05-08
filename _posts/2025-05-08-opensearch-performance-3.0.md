---
layout: post
title: "OpenSearch Project update: Performance progress in OpenSearch 3.0"
layout: post
authors:
    - sisurab
    - pallp
    - vamshin
    - seanzheng
    - kolchfa
date: 2025-05-08
categories:
        - technical-posts
        - community
meta_keywords: OpenSearch performance, benchmarking, query optimization, vector search, text queries, aggregations, OpenSearch roadmap
meta_description: Explore the significant performance gains up through OpenSearch 3.0. Explore optimizations in text search, aggregations, range queries, and vector operations, and get a preview of the OpenSearch 2025 roadmap.
has_science_table: true
excerpt: Learn more about the strategic enhancements and performance features that OpenSearch has delivered up to version 3.0.
featured_blog_post: false
featured_image: false
#additional_author_info: We sincerely appreciate the contributions to this blog from Anandhi Bumstead, Carl Meadows, Jon Handler, Dagney Braun, Michael Froh, Kunal Khatua, Andrew Ross, Harsha Vamsi, Bowen Lan, Rishabh Kumar Maurya, Sandesh Kumar, Marc Handalian, Rishabh Singh, Govind Kamat, Martin Gaievski, and Minal Shah.
---

OpenSearch 3.0 marks a major milestone in the project's ongoing performance journey - the first major release since 2.0 launched in April 2022. Building on the gains of the 2.x series, the 3.0 release integrates **Apache Lucene 10** and upgrades the Java runtime to **JDK 21**, bringing significant improvements to search throughput, indexing and query latency, and vector processing. With **10x** search performance boost and **2.5x** vector search performance boost, Lucene 10 continues to be our strategic search library, and its latest version delivers measurable gains over earlier releases(baseline 1.x) through enhanced query execution, skip-based filtering, and segment-level concurrency. This post provides a detailed update on OpenSearch 3.0's performance, focusing on search queries, indexing throughput, AI/ML use cases and vector search workloads. We highlight measurable impacts, as observed in our benchmarks, and explain how new Lucene 10 features like concurrent segment search, query optimizations, doc-value skip lists, and prefetch APIs contribute to future OpenSearch roadmaps. All results are supported by benchmark data, keeping with our focus on community transparency and real-world impact.

## Query Performance Improvements in OpenSearch 3.0

OpenSearch 3.0 continues the steady performance gains achieved throughout the 2.x line. Compared to the baseline of OpenSearch 1.3, query latency in 3.0 has been reduced by roughly **90%** (geometric mean across key query types), meaning queries are on average over **~10x faster** than in 1.3 (*Infographic 1*). Also against more recent 2.x versions, 3.0's query operations are about **~24% faster** than 2.19 (the last 2.x release) on the Big 5 workload. Table below summarizes latency benchmarks across versions 1.3.18, 2.x, and 3.0.
[Image: OpenSearch_latency_performance.png]
|	|
**Query Types**	|1.3.18	|2.7	|2.11	|2.12	|2.13	|2.14	|2.15	|2.16	|2.17	|2.18	|2.19	|3.0 GA	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|
**Big 5 areas mean latency, ms
**	|
Text Query	|59.51	|47.91	|41.05	|27.29	|27.61	|27.85	|27.39	|21.7	|21.77	|22.31	|8.22	|8.3	|
|
Sorting	|17.73	|11.24	|8.14	|7.99	|7.53	|7.47	|7.78	|7.22	|7.26	|9.98	|7.96	|7.03	|
|
Terms Aggregation	|609.43	|1351	|1316	|1228	|291	|293	|113	|112	|113	|111.74	|112.08	|79.72	|
|
Range Queries	|26.08	|23.12	|16.91	|18.71	|17.33	|17.39	|18.51	|3.17	|3.17	|3.55	|3.67	|2.68	|
|
Date Histogram	|6068	|5249	|5168	|469	|357	|146	|157	|164	|160	|163.58	|159.57	|85.21	|
|Aggregate (geo mean)	|159.04	|154.59	|130.9	|74.85	|51.84	|43.44	|37.07	|24.66	|24.63	|27.04	|21.21	|16.04	|
|Speedup factor, compared to OS 1.3 (geo mean)	|-	|1.03	|1.21	|2.12	|3.07	|3.66	|4.29	|6.45	|6.46	|5.88	|7.50	|9.92	|
|Relative latency, compared to OS 1.3 (geo mean)	|-	|97.20	|82.31	|47.06	|32.60	|27.31	|23.31	|15.51	|15.49	|17.00	|13.34	|10.09	|

*Row 7 is Big5 benchmark mean latency (ms) by OpenSearch version. Lower is better.* 
*Row 8 and 9 are speedup factor and latency relative to 1.3 baseline.*

The OpenSearch 3.0 release brings search performance gains from two primary fronts: **(1) Out-of-the-box improvements from Lucene 10** and **(2) OpenSearch-specific engine optimizations**. Lucene 10 introduces hardware-level enhancements such as SIMD-accelerated vector scoring and more efficient postings decoding, which immediately benefit query performance. These gains require no configuration changes, such as minute-level date histogram aggregations run up to **60% faster**, `search_after` queries improve by **20–24%**, and scroll queries also show modest latency reductions, thanks to low-level enhancements in both Lucene 10 and JDK 21.

In parallel, the OpenSearch community implemented multiple targeted optimizations across versions 2.18, 2.19, and 3.0 (since our [previous update](https://opensearch.org/blog/opensearch-performance-2.17/)). These include cost-based query planning, optimized handling for high-frequency terms queries, restoration of a time-series sort optimization lost with the Lucene 10 upgrade, aggregation engine improvements, request cache concurrency enhancements, and resolution of Lucene-induced regressions (e.g., sort and merge slowdowns). Additionally, OpenSearch 3.0 introduces **auto-enabled concurrent segment search**, which selectively parallelizes expensive queries, delivering double-digit latency reductions on operations like `date_histogram` and `terms` aggregations.

### Key Performance Highlights

#### _Lucene 10 Improvements_

The Lucene 10 upgrade introduced out-of-the-box speedups via SIMD vectorization and improved I/O patterns. OpenSearch 3.0 inherits these benefits, with complex query-string searches showing **~24% lower p50 latency** compared to 2.19 ([issue #17385](https://github.com/opensearch-project/OpenSearch/issues/17385)). Other operations, like high-cardinality aggregations, improved by **~10–20%** purely from the engine change. OpenSearch also addressed several regressions caused by the Lucene 10 transition, including performance drops in `composite_terms` on keyword fields ([#17387](https://github.com/opensearch-project/OpenSearch/issues/17387), [#17388](https://github.com/opensearch-project/OpenSearch/issues/17388)). With these fixes, keyword-heavy filters and aggs in 3.0 are now back on par, or faster than their 2.x equivalents.

#### _Query Operation Improvements (vs. OpenSearch 1.3.18 and 2.17)_

To further speed up query execution, OpenSearch introduced targeted optimizations across core operations:

* **Text Queries:** Median latency for full-text queries is ~8 ms in 3.0 vs ~60 ms in 1.3 (**~87% faster**). Most gains landed in 2.19 via cost-based filter planning and early clause elimination. Further, boolean scorer improvements helped reduce tail latencies in 3.0. Compared to 2.17 (~21.7 ms), this is a **~3x speedup** ([#17385](https://github.com/opensearch-project/OpenSearch/issues/17385)).
* **Term Aggregations:** Latency dropped from ~609 ms in 1.3 to ~80 ms in 3.0 (**~85% faster**, **~30% vs 2.17**). Improvements include optimized global ordinals, smarter doc values access, and execution hints for controlling cardinality agg memory usage ([#17657](https://github.com/opensearch-project/OpenSearch/pull/17657)). Approximate filtering for range constraints also reduced scan costs in observability use cases.
* **Sort Queries:** Sorted queries are **~60% faster** than 1.3 and **~5–10% faster** than 2.17. OpenSearch 3.0 restored Lucene's time-series sort optimization by correctly invoking the new `searchAfterPartition()` API ([PR #17329](https://github.com/opensearch-project/OpenSearch/pull/17329)), resolving regressions in `desc_sort_timestamp` queries ([#17404](https://github.com/opensearch-project/OpenSearch/issues/17404)).
* **Date Histograms:** Latency fell from ~6s in 1.3 to ~146 ms in 3.0, with lows of ~85 ms using concurrency (up to **60× faster**). Gains come from block skipping, segment-level parallelism, and [sub-agg optimizations](https://github.com/opensearch-project/OpenSearch/pull/17447) (e.g., pushing filters inside range-auto-date aggs). 3.0 is up to **~50% faster than 2.19** in this category.
* **Range Queries:** Range filters now run in ~2.75 ms, down from ~26 ms in 1.3 (**~89% faster**) and **~25% faster than 2.19**. OpenSearch's [range approximation framework](https://github.com/opensearch-project/OpenSearch/issues/16682) became GA in 3.0 where gains came from better use of doc values and skipping non-matching blocks, further reducing the scan costs.

#### _Star-Tree Index for Log Analytics_

Introduced in 2.19, the **[star-tree aggregator](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.19.0.md)** enables pre-aggregated metric and filtered terms queries. In eligible use cases, this reduces query compute by up to **100x** and cache usage by **~30x**. 3.0 extends support to multi-level and fnumeric terms aggregations (with [sorted bucket elimination](https://github.com/opensearch-project/OpenSearch/pull/17671)), achieving **~15–20% lower latency** over 2.19 in benchmarks.

#### _Concurrent Segment Search (Auto Mode)_

OpenSearch 3.0 defaults to **concurrent segment search in “auto” mode**, allowing the engine to choose between sequential vs parallel segment execution per query. Expensive aggregations (e.g. terms, date_histogram) run in parallel, while lightweight queries stay single-threaded to avoid overhead. On an 8-vCPU cluster, this yielded **~35% lower latency on date histograms**, **15%+ on terms aggs**, and **~8% aggregate gain** across the Big 5. Text queries stayed flat (e.g., 8.22 ms sequential vs 8.93 ms auto), confirming the selector works as intended without regression.


## AI/ML and Vector Search Performance Improvements

OpenSearch 3.0 builds on the vector engine enhancements introduced in the 2.x series, continuing to improve performance, memory efficiency, and configurability for both exact and approximate k-NN (ANN) search.  These capabilities are critical for workloads running semantic search and generative AI.

#### _**GPU acceleration for vector index builds**:_

The introduction of GPU acceleration for vector indexing in OpenSearch represents a major advancement in supporting large-scale AI workloads. Benchmarks showed that GPU acceleration improved **indexing speed by 9.3x and reduced costs by 3.75x compared** to CPU-based solutions. This dramatically reduces the time required for billion-scale index builds from days to just hours. The decoupled design, which separates the GPU-powered index build service from the main OpenSearch cluster, provides flexibility to evolve the components independently and enables seamless adoption across cloud and on-premises environments. By leveraging the CAGRA algorithm from NVIDIA's cuVS library and supporting GPU-CPU index interoperability, OpenSearch delivers a robust, scalable vector search solution with built-in fault tolerance and fallback mechanisms for production reliability. Link to detailed blog [post,](http:// https://opensearch.org/blog/GPU-Accelerated-Vector-Search-OpenSearch-New-Frontier/) [RFC](https://github.com/opensearch-project/k-NN/issues/2293)

#### _**Derived Source (3x storage reduction):**_ 

In OpenSearch 3.0, the vector derived source feature is enabled by default for all the vector indices. By removing the redundant storage of the source field, the vector derived source feature has observed a 3x reduction in storage across all engines(faiss, lucene, nmslib) tested. This storage optimization has had a significant impact on performance as well, with a 30x improvement in p90 cold start query latencies for the Lucene engine. The feature also saw strong improvements in merge time reduction upto 40% across all engines. These substantial gains in both storage efficiency and query performance demonstrate the value that the vector derived source feature can provide for operating OpenSearch as a high-scale vector search engine. The transparent nature of this feature, which preserves critical functionality like reindexing and field-based updates, makes it available for wide range of potential customers looking to optimize their vector search workloads on OpenSearch. Link to [RFC](https://github.com/opensearch-project/k-NN/issues/2377)

Nightly benchmarks can be found https://benchmarks.opensearch.org/app/home. Nightlies are run against 10M/768D dataset. 


**3X storage reduction**
**30x improvement in p90 cold start query latencies for Lucene**
**Forcemerge improvements**


#### _**Vector search performance boost up to 2.5x:**_ 

Concurrent Segment Search (CSS) is [now enabled by default](https://github.com/opensearch-project/OpenSearch/pull/17978) for all vector search use cases. CSS boosts the performance of vector queries by up to 2.5x with no impact on recall through parallelizing search queries across multiple threads. Additionally, changes to the floor segment size setting in the merge policy create more balanced segments and [improve](https://github.com/opensearch-project/k-NN/pull/2623#issuecomment-2749056885) tail latencies by up to 20%. This performance boost is applicable to both in memory indices and disk optimized indices.

**Service time comparison (p90 in ms)**

|k-NN engine	|Concurrent segment search disabled	|Concurrent segment search enabled (Lucene default number of slices)	|% Improvement	|Concurrent segment search with max slice count = 2	|% Improvement	|Concurrent segment search with max slice count = 4	|% Improvement	|Concurrent segment search with max slice count = 8	|% Improvement	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|Lucene	|37	|15	|59.5	|16	|56.8	|15.9	|57	|16	|56.8	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|NMSLIB	|35	|14	|60	|23	|34.3	|15	|57.1	|12	|65.7	|
|Faiss	|37	|14	|62.2	|22	|40.5	|15	|59.5	|16	|56.8	|

#### _**Embedding processor optimization**_

In Opensearch 3.0, we added skip_existing support in embedding processor to improve embedding ingestion performance. Previously test embedding processor makes ML inference calls regardless of whether it's to add new embeddings or update existing embeddings. With the feature, customers now have an option to config the processor so it skips inference call when the target embedding field is not changed. This feature applies to both dense embeddings and sparse embeddings. By skipping the inference calls, this can reduce ingestion latencies up to 70% for text embeddings, 40% for text/image embeddings, and 80% for sparse text embeddings.


#### _**Pruning for neural sparse search**_

It was introduced in 2.19. Neural sparse is a semantic search method which is built on native Lucene inverted index. The documents and queries are encoded into sparse vectors, where the entry represents the token and their corresponding semantic weight. Since the model expands the tokens with semantic weights during the encoding process, the number of tokens in the sparse vectors is often greater than the original raw text. Additionally, the token weights in the sparse vectors exhibit a significant long-tail distribution, where tokens with lower semantic importance occupy a large portion of the storage space. Experiments have shown that the index size produced by sparse models could be up to 4x to 7x larger than those from BM25. Pruning can effectively alleviate this problem. During the process of ingestion and search, we prune the sparse vectors according to different strategies, removing tokens with relatively small weights. With pruning, customers can save up to 60% of index size with minimal (1%) tradeoff of search relevancy.

## Indexing and Ingestion Performance


OpenSearch 3.0 maintains the indexing throughput of the 2.x series while incorporating changes from Lucene 10. In benchmark tests indexing 70 million documents (60 GB) on an r5.xlarge node, 3.0 achieved ~20k docs/sec  - matching 2.19 - under identical bulk conditions. Ingestion time and segment counts were comparable after normalizing for merges, suggesting that Lucene 10's format changes introduce minimal overhead for typical workloads.

Lucene 10's support for sparse doc values is enabled in 3.0. When indices are sorted (e.g., by timestamp), Lucene builds skip lists that speed up range queries and aggregations. This adds minor indexing overhead but improves query efficiency. In time-series tests, enabling sparse doc values had no impact on ingest speed, while improving date-based query performance.

Segment merging behavior remained stable in 3.0. There are few changes to default merge settings to take advange of modern machines: force merge now uses [1/4th machine cores instead of 1](https://github.com/opensearch-project/OpenSearch/pull/17255), the default floor segment size from [4MB to 16MB](https://github.com/opensearch-project/OpenSearch/pull/17699), and maxMergeAtOnce changed from 10 to 30, which is inline with Lucene 10 default. The maxMergeAtOnce is now available [as cluster level setting](https://github.com/opensearch-project/OpenSearch/pull/17774) to allow for custom tuning. Although one additional segment was observed post-ingestion (20 vs. 19 in 2.19), forced merges equalized results, with no increase in CPU or GC overhead. Rest of the merge policy remains unchanged.
Vector indexing also improved. OpenSearch 3.0 supports incremental HNSW graph merging using Lucene's `KnnVectorsFormat`, reducing memory usage and avoiding full graph rebuilds. This lowered memory footprint during ingestion and reduced vector index build time by ~30% compared to 1.3. With prior optimizations like byte compression, 3.0 can index large vector datasets using up to 85% less memory than earlier versions.

In Summary, indexing performance in OpenSearch 3.0 is on par with 2.x, while delivering better memory efficiency and benefiting from Lucene 10 features that improve query performance without affecting ingestion speed.


## Roadmap for OpenSearch 3.1 and Beyond

Performance continues to be a central focus for the OpenSearch project. Based on the [public roadmap](https://github.com/orgs/opensearch-project/projects/206/views/20) and upcoming 3.1 release, several initiatives are underway:

* **[Building on Lucene 10](https://github.com/opensearch-project/OpenSearch/issues/16934):** Looking ahead, OpenSearch 3.x releases will continue to build on this foundation. Upcoming efforts include leveraging Lucene's concurrent segment execution for force-merged indices, integrating async disk I/O via the new `IndexInput.prefetch()` API. We also plan to evaluate support for sparse doc values and block-level metadata to enable more efficient range queries and aggregations. These enhancements, combined with continued improvement to performance (e.g., in term query, search-after and sort performance), will help OpenSearch deliver even lower latencies and better throughput across diverse workloads.
* **[Cost-based query planning](https://github.com/opensearch-project/OpenSearch/issues/12390):** OpenSearch is developing a query planner that uses statistics and cost modeling to select execution strategies more efficiently. This includes choosing between bitset and term filters, determining clause order, and deciding when to enable concurrent segment search. This effort targets improved latency and resource usage, especially for complex queries.
* **[Streaming query execution](https://github.com/opensearch-project/OpenSearch/issues/16774):** Work is ongoing to introduce a streaming model where query stages can begin before the previous ones fully complete. This should lower latency and memory usage by allowing results to flow incrementally. Initial support is planned for specific aggregations and query types in the 3.x series.
* [**gRPC/Proto based communitication**](https://github.com/opensearch-project/OpenSearch/issues/15190)**:** As per-shard latency decreases, coordination overhead becomes more significant. Optimizations are planned to reduce serialization costs, improve fan-in efficiency, and support more parallelism in response handling across nodes. Also to consider a step further on adding support on gRPC-based API with protobuf as serializing/de-serializing.
* **[Join support and advanced queries](https://github.com/opensearch-project/OpenSearch/issues/15185):** Native join support is planned for 2025, with an emphasis on runtime efficiency. Techniques like index-level bloom filters or pre-join caching will be used to reduce query costs and support production-grade usage.
* **[Native SIMD and vectorization](https://github.com/opensearch-project/OpenSearch/issues/9423):** OpenSearch is exploring the use of native code and SIMD instructions beyond Lucene for operations like aggregations and result sorting. These efforts aim to reduce JVM overhead and improve throughput in CPU-bound workloads.
* [**GPU acceleration for quantized vector indices**](https://github.com/opensearch-project/k-NN/issues/2295)**:** OpenSearch is expanding its GPU acceleration capabilities for quantized vector indices. While the 3.0 release introduced GPU support for full precision (fp32) indices, the upcoming 3.1 release will extend GPU acceleration to a broader range of quantization techniques, including fp16, byte, and binary indices. Looking beyond version 3.1, OpenSearch plans to extend GPU capabilities for search workloads as well.
* **Disk optimized vector search - Phase 2 :** OpenSearch 3.1 will introduce significant enhancements to its disk-optimized vector search capabilities, marking Phase 2 of its optimization journey. Building upon the success of binary quantization, the system would incorporate techniques: random rotation and Asymmetric Distance Computation (ADC). These improvements, inspired by the innovative RaBitQ paper, deliver a substantial boost to recall performance while maintaining the benefits of disk optimization. 
* [**Partial loading of graphs with Faiss vector engine**](https://github.com/opensearch-project/k-NN/issues/2401)**:** Starting with version 3.1, the introduction of partial graph loading marks a major breakthrough in how vector search operates. Unlike traditional approaches that load entire graphs into memory, this new feature selectively loads only the required portions of the graph needed for search traversal. This smart loading mechanism delivers two crucial benefits: it dramatically reduces memory consumption and enables billion-scale workloads to run efficiently even on single-node environments.
* [**Support for BFloat16 (efficient fp16) for vectors**:](https://github.com/opensearch-project/k-NN/issues/2510) The fp16 support using Faiss scalar quantizer(SQfp16) provides 50% memory reduction besides providing at par performance and mostly similar recall compared to fp32 vectors. But, it has a range limitation where the input vectors needs to be within the range of [-65504, 65504]. BFloat16 comes with an extended range(same as fp32) by trading off precision(supports upto 2 or 3 decimal values or 7 mantissa bits) and still uses 16 bits per dimension (provides 50% memory reduction).
* **[Multi tenancy/high cardinality filtering vector search:](https://github.com/opensearch-project/k-NN/issues/1140)** OpenSearch is taking multi-tenant vector search to the next level with its enhanced filtering capabilities. At the core of this improvement is an innovative approach to partitioning HNSW graphs based on tenant boundaries. This strategic enhancement delivers two critical advantages: superior search accuracy and robust data isolation between tenants. By organizing vector search data structures according to tenant boundaries, filter queries now operate exclusively within their respective tenant partitions, eliminating cross-tenant noise and improving precision.
* **Improving vector Search Throughput with Smart Query Routing**: By implementing semantic-based data organization across OpenSearch nodes, grouping similar embeddings together, we can enable targeted searching of relevant nodes for nearest neighbors. This approach allows searching a subset of shards per query, potentially increasing throughput by up to 3x while reducing compute requirements.
    

OpenSearch 3.1, will be the first minor release to build on 3.0 as per the [OS release schedule](https://opensearch.org/releases/). It will include Lucene updates, refinements to concurrent search, and improvements to aggregation, vector and indexing frameworks. Performance updates will be shared in the release notes and blogs as usual.


## Appendix: Benchmark Methodology

All performance comparisons were conducted using a repeatable process based on the OpenSearch Benchmark (OSB) tool and the Big 5 workload - covering match queries, term aggregations, range filters, date histograms, and sorted queries. The dataset (~100 GB, 116 million documents) reflects time-series and e-commerce use cases.

**Environment:** Tests were run on a single-node OpenSearch cluster using c5.2xlarge EC2 instances (8 vCPUs, 16 GB RAM, 8 GB JVM heap). Default settings were used unless noted. Indices had one primary shard and no replicas to avoid multi-shard variability. Documents were ingested chronologically to simulate time-series workloads.

**Index Settings:** We used Lucene's `LogByteSizeMergePolicy` and did not enable explicit index sorting. In some tests, a force-merge was applied to normalize segment counts (e.g., 10 segments in both 2.19 and 3.0) for fair comparison. 

**Execution:** Each operation was repeated multiple times. We discarded warm-up runs and averaged the next three runs. Latency metrics included p50, p90, and p99; throughput was also recorded. OSB was run in throughput-throttled mode to record accurate query latency for each operation type. 

**Software:** Comparisons used OpenSearch 2.19.1 (Java 17) and 3.0.0-beta (Java 21, Lucene 10.1.0). Only default plugins were enabled. Vector benchmarks used Faiss + HNSW via the k-NN plugin, with recall measured against brute-force results.

**Metrics:** “Big 5 median latency” is the simple mean of the five core query types. “Aggregate latency” is the geometric mean, used for overall comparison. Speedup factors are reported relative to OpenSearch 1.3 where noted.



|
**Buckets**	|
**Query**	|
**Order**	|
**OS 1.3.18**	|
**OS 2.7**	|
**OS 2.11.1**	|
**OS 2.12.0**	|
**OS 2.13.0**	|
**OS 2.14**	|
**OS 2.15**	|
**OS 2.16**	|
**OS 2.17**	|
**OS 2.18**	|
**OS 2.19**	|
**OS 3.0**	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|
**Text queries**	|
query-string-on-message	|1	|332.75	|280	|276	|78.25	|80	|77.75	|77.25	|77.75	|78	|85	|4	|4	|
|
query-string-on-message-filtered	|2	|67.25	|47	|30.25	|46.5	|47.5	|46	|46.75	|29.5	|30	|27	|11	|11	|
|
query-string-on-message-filtered-sorted-num	|3	|125.25	|102	|85.5	|41	|41.25	|41	|40.75	|24	|24.5	|27	|26	|27	|
|
term	|4	|4	|3.75	|4	|4	|4	|4	|4	|4	|4	|4	|4	|4	|
|
**Sorting**	|
asc_sort_timestamp	|5	|9.75	|15.75	|7.5	|7	|7	|7	|7	|7	|7	|7	|7	|7	|
|
asc_sort_timestamp_can_match_shortcut	|6	|13.75	|7	|7	|6.75	|6	|6.25	|6.5	|6	|6.25	|7	|7	|7	|
|
asc_sort_timestamp_no_can_match_shortcut	|7	|13.5	|7	|7	|6.5	|6	|6	|6.5	|6	|6.25	|7	|7	|7	|
|
asc_sort_with_after_timestamp	|8	|35	|33.75	|238	|212	|197.5	|213.5	|204.25	|160.5	|185.25	|216	|150	|168	|
|
desc_sort_timestamp	|9	|12.25	|39.25	|6	|7	|5.75	|5.75	|5.75	|6	|6	|8	|7	|7	|
|
desc_sort_timestamp_can_match_shortcut	|10	|7	|120.5	|5	|5.5	|5	|4.75	|5	|5	|5	|6	|6	|5	|
|
desc_sort_timestamp_no_can_match_shortcut	|11	|6.75	|117	|5	|5	|4.75	|4.5	|4.75	|5	|5	|6	|6	|5	|
|
desc_sort_with_after_timestamp	|12	|487	|33.75	|325.75	|358	|361.5	|385.25	|378.25	|320.25	|329.5	|262	|246	|93	|
|
sort_keyword_can_match_shortcut	|13	|291	|3	|3	|3.25	|3.5	|3	|3	|3	|3	|4	|4	|4	|
|
sort_keyword_no_can_match_shortcut	|14	|290.75	|3.25	|3	|3.5	|3.25	|3	|3.75	|3	|3.25	|4	|4	|4	|
|
sort_numeric_asc	|15	|7.5	|4.5	|4.5	|4	|4	|4	|4	|4	|4	|17	|4	|3	|
|
sort_numeric_asc_with_match	|16	|2	|1.75	|2	|2	|2	|2	|1.75	|2	|2	|2	|2	|2	|
|
sort_numeric_desc	|17	|8	|6	|6	|5.5	|4.75	|5	|4.75	|4.25	|4.5	|16	|5	|4	|
|
sort_numeric_desc_with_match	|18	|2	|2	|2	|2	|2	|2	|1.75	|2	|2	|2	|2	|2	|
|
**Terms aggregations**	|
cardinality-agg-high	|19	|3075.75	|2432.25	|2506.25	|2246	|2284.5	|2202.25	|2323.75	|2337.25	|2408.75	|2324	|2235	|628	|
|
cardinality-agg-low	|20	|2925.5	|2295.5	|2383	|2126	|2245.25	|2159	|3	|3	|3	|3	|3	|3	|
|
composite_terms-keyword	|21	|466.75	|378.5	|407.75	|394.5	|353.5	|366	|350	|346.5	|350.25	|216	|218	|202	|
|
composite-terms	|22	|290	|242	|263	|252	|233	|228.75	|229	|223.75	|226	|333	|362	|328	|
|
keyword-terms	|23	|4695.25	|3478.75	|3557.5	|3220	|29.5	|26	|25.75	|26.25	|26.25	|27	|26	|19	|
|
keyword-terms-low-cardinality	|24	|4699.5	|3383	|3477.25	|3249.75	|25	|22	|21.75	|21.75	|21.75	|22	|22	|13	|
|
multi_terms-keyword	|25	|
0*	|
0*	|854.75	|817.25	|796.5	|748	|768.5	|746.75	|770	|736	|734	|657	|
|
**Range queries**	|
keyword-in-range	|26	|101.5	|100	|18	|22	|23.25	|26	|27.25	|18	|17.75	|64	|68	|14	|
|
range	|27	|85	|77	|14.5	|18.25	|20.25	|22.75	|24.25	|13.75	|14.25	|11	|14	|4	|
|
range_field_conjunction_big_range_big_term_query	|28	|2	|2	|2	|2	|2	|2	|2	|2	|2	|2	|2	|2	|
|
range_field_conjunction_small_range_big_term_query	|29	|2	|1.75	|2	|2	|2	|2	|1.5	|2	|2	|2	|2	|2	|
|
range_field_conjunction_small_range_small_term_query	|30	|2	|2	|2	|2	|2	|2	|2	|2	|2	|2	|2	|2	|
|
range_field_disjunction_big_range_small_term_query	|31	|2	|2	|2	|2	|2	|2	|2	|2	|2.25	|2	|2	|2	|
|
range-agg-1	|32	|4641.25	|3810.75	|3745.75	|3578.75	|3477.5	|3328.75	|3318.75	|2	|2.25	|2	|2	|2	|
|
range-agg-2	|33	|4568	|3717.25	|3669.75	|3492.75	|3403.5	|3243.5	|3235	|2	|2.25	|2	|2	|2	|
|
range-numeric	|34	|2	|2	|2	|2	|2	|2	|2	|2	|2	|2	|2	|2	|
|
**Date histograms**	|
composite-date_histogram-daily	|35	|4828.75	|4055.5	|4051.25	|9	|3	|2.5	|3	|2.75	|2.75	|3	|3	|3	|
|
date_histogram_hourly_agg	|36	|4790.25	|4361	|4363.25	|12.5	|12.75	|6.25	|6	|6.25	|6.5	|7	|6	|4	|
|
date_histogram_minute_agg	|37	|1404.5	|1340.25	|1113.75	|1001.25	|923	|36	|32.75	|35.25	|39.75	|35	|36	|37	|
|
range-auto-date-histo	|38	|10373	|8686.75	|9940.25	|8696.75	|8199.75	|8214.75	|8278.75	|8306	|8293.75	|8095	|7899	|1871	|
|
range-auto-date-histo-with-metrics	|39	|22988.5	|20438	|20108.25	|20392.75	|20117.25	|19656.5	|19959.25	|20364.75	|20147.5	|19686	|20211	|5406	|


While results may vary in different environments, we controlled for noise and hardware variability. The relative performance trends are expected to hold across most real-world scenarios. The [OSB workload](https://github.com/opensearch-project/opensearch-benchmark-workloads) is open-source, and we welcome replication and feedback from the community.

* * *
* * *

#### Appendix - Not part of the Blog

Below infographic was replaced (updated) with the new one above



