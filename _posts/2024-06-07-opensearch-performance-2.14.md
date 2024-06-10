---
layout: post
title: "OpenSearch Project update: A look at performance progress through version 2.14"
authors:
  - sisurab
  - pallp
  - macrakis
  - hoangia
date: 2024-06-07
categories:
    - technical-posts
    - community
meta_keywords: OpenSearch performance progress 2.14, OpenSearch roadmap
meta_description: Learn more about the strategic enhancements and performance features that OpenSearch has delivered up to version 2.14.
has_science_table: true
---

OpenSearch covers a broad range of functionality for applications involving document search, e-commerce search, log analytics, observability, and data analytics. All of these applications depend on a full-featured, scalable, reliable, and high-performance foundation. In the latest OpenSearch versions, we've added new features such as enhanced artificial intelligence and machine learning (AI/ML) semantic/vector search capabilities, neural search, hybrid search, flat objects, and zero-ETL integrations. As we continue to add new features, we are also improving scalability, reliability, and performance both for existing and for new features. These improvements allow us to support ever-growing data collections with high throughput, low latency, lower resource consumption, and, thus, lower costs. This blog post focuses on performance improvements in OpenSearch 2.12, 2.13, and 2.14. These fall into four broad categories: text querying, vector storage and querying, ingestion and indexing, and storage efficiency.

We evaluated performance improvements using the [OpenSearch Big5 workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/big5), which covers the types of queries common in search and log analytics, including text queries, sorting, term aggregations, range queries, and date histograms. This provides an objective and easy-to-replicate benchmark for performance work.

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

## Performance improvements through 2.14

Since the inception of the OpenSearch Project, we have achieved significant increases in speed. 

The following graph shows the relative improvements by query category as the 90th percentile latencies, with a baseline of OpenSearch 1.0. Every category improved considerably, some dramatically. For the full results, see the [Appendix](#appendix-benchmark-tests-and-results).

The heavy green line summarizes the overall improvements as the geometric mean of the individual categories of improvement, showing continuous progress in performance.

<img src="/assets/media/blog-images/2024-06-07-opensearch-performance-2.14/performance-graph.png" alt="OpenSearch performance improvements up to 2.14" class="center"/>{:style="width: 100%; max-width: 800px; height: auto; text-align: center"}

## Queries

OpenSearch has made the following query improvements.

### Text queries

Text queries are the foundation of text search. When used for traditional document search, text search determines not just *whether* certain text is included in the document but also where and how often. This is needed for the classic term frequency calculation (TF/IDF or BM25), which is the basis for result ranking, as well as for highlighting (snippeting) and proximity matching.

However, many applications do not need this additional information---it's enough to know which documents contain the terms. This applies when the application wants *all* documents with a given term, as is typical in an analytics application, or when it wants 100% recall in order to apply its own result reranking.

For these applications, OpenSearch 2.12 introduced the [`match_only_text`](https://opensearch.org/docs/latest/field-types/supported-field-types/match-only-text) field. This field type dramatically reduces the space needed for indexes and speeds up query execution because there is no complicated scoring for relevance ranking. At the same time, it supports all standard text query types, except for interval and span queries.

Using `match_only_text`, text queries are 47% faster in OpenSearch 2.12 than in 2.11 and 57% faster than in OpenSearch 1.0.

### Term aggregations

Term aggregations are an important tool in data analytics because they allow you to slice and dice data using multiple criteria. For example, you might want to group the brands, model years, and colors of a collection of cars in your data.

OpenSearch 2.13 speeds up term aggregations for global term aggregations in immutable collections such as log data. This is an important and common analytics use case. OpenSearch gains this efficiency by using the term frequencies that Lucene precalculates.

Evaluating term aggregations on Big5 data shows speed improvements of a factor of 85 to 100. 

### Date histograms

Date histograms are OpenSearch’s way of grouping data by date. Almost every Dashboard or Discover visualization in OpenSearch Dashboards depends on this functionality. For example, you might want to aggregate the logs of every HTTP request sent to your site by week. Date histogram optimizations in OpenSearch 2.12 provide speed improvements ranging from 10 to 50 times on the Big5 benchmark, in cases where there are no sub-aggregations in range filters.

### Multi-term queries and numeric fields

Multi-term queries are commonly used in analytics to simultaneously aggregate by many terms, often retrieving only the top *n* results. OpenSearch 2.12 accelerates multi-term queries on keyword fields by over 40% by taking advantage of Lucene's IndexOrDocValuesQuery.

In version 2.14, we also use the IndexOrDocValuesQuery to increase search speed on numeric, IP, Boolean, and date fields, even when the fields are not indexed. This means that you can save storage space by not creating indexes for less commonly used search fields.

## Semantic vectors

Vector search is the foundation of modern semantic/neural search. With semantic search, documents are embedded in a high-dimensional vector space, which preserves important semantic relations, and then indexed for fast retrieval. At search time, queries are embedded in the same space, and the search engine finds similar document vectors by using a nearest-neighbor algorithm (k-NN or approximate nearest neighbor [ANN]). The documents that are semantically close to the query are more likely to represent relevant results.

Document vectors can require a lot of storage space, especially when documents are segmented to provide full content coverage. Decreasing the amount of necessary storage directly lowers resource consumption and costs.

### Vector search cost reduction

By reducing the vector elements from 32-bit to 16-bit (fp16) floating-point numbers, OpenSearch 2.13 reduces the amount of storage required by 45--50%. Our experiments show that this has little or no effect on the quality of the results: Recall remains above 95%, and query latency is unaffected.

OpenSearch 2.14 also improves the memory usage of IVFPQ and HNSWPQ vector indexes by unifying the storage of index metadata.

### Efficient filtering

As a user of nearest-neighbor semantic search, you often want to combine vector similarity with filtering on other fields. Simple post-filtering is inefficient and produces poor results. Introduced in OpenSearch 2.9 and improved in OpenSearch 2.10, _efficient filtering_ filters *during* the nearest-neighbor search. In OpenSearch 2.14, we enhanced the filtering logic to further reduce query latencies for filtered vector search by approximately 30% at P99, using the Faiss engine.

## Indexing

So far, we’ve been discussing improvements to search latency and memory efficiency. But we have also improved indexing performance. Many workloads, notably log analytics workloads, spend most of their computing resources on the indexing phase. For these workloads, accelerating indexing performance can significantly reduce costs. In OpenSearch 2.7, we introduced segment replication, which improves performance by up to 40% compared to document replication by eliminating redundant indexing. OpenSearch 2.11 introduced additional improvements to segment replication, allowing it to use a remote object store for improved durability and scalability.

## Storage

OpenSearch 2.13 enhances storage and retrieval efficiency by introducing more efficient compression codecs. These codecs reduce disk space usage without compromising performance. Additionally, OpenSearch 2.13 introduced enhanced data tiering capabilities to improve data lifecycle management. This allows you to reduce storage costs and improve performance on a wide range of hardware.

## Roadmap for 2024

Here are some planned improvements that we have on the roadmap for the rest of 2024.

### Core search engine

OpenSearch continues to improve the core search engine. Our full plans are available on [GitHub](https://github.com/orgs/opensearch-project/projects/153/views/1). 

We are planning the following enhancements: 

- Supporting fine-grained customer monitoring of query execution, allowing you to identify problematic queries, diagnose query execution bottlenecks, and tune query performance.
- Optimizing common query execution infrastructure by developing multi-level caching (tiered caching); faster interconnections among components using an efficient binary format (Protobuf).
- Improving query execution itself, using document reordering to optimize query throughput and storage efficiency (graph bipartite partitioning); analyzing and rewriting complex queries to make them run more efficiently; dynamic pruning; count-only caching.
- Modularizing the query engine to make future improvements faster and easier.

### Hybrid search 

Hybrid search combines lexical and semantic vector search in order to get the best of both worlds. Highly specific names---like part numbers---are best found using lexical search, while broader queries are often best handled by semantic vector search. We have supported hybrid search since OpenSearch 2.10. 

We are planning the following hybrid search enhancements:

- By executing lexical and vector searches in parallel, we can achieve a latency improvement of up to 25%.
- Supporting re-sorting of hybrid query results.
- Supporting additional algorithms for combining query results. In particular, reciprocal rank fusion has shown good results for some applications.
- Returning the raw scores of subqueries, which are useful for debugging and relevance tuning.

### Vector search

Semantic vector search is a powerful technique for finding semantic similiarities. However, it can be costly because indexing vectors to make them efficient for search is time consuming, and the vectors themselves can consume large amounts of memory.

We are currently working on the following vector search improvements:

- Accelerating vector indexing by 80% and reducing the memory required for indexing.
- Reducing the amount of space needed to store vectors by compressing vector components from 32 bits to 16, 8, and even 1 bit. Our experiments show modest reductions in search quality (recall) with 16- and 8-bit components; we are still analyzing the 1-bit use case (binary quantization).
- Reducing costs by employing disk-based ANN algorithms that use external storage (SSDs, Amazon S3, and so on).

Vector techniques have also been less flexible than lexical techniques in many ways, so we are:

- Improving search relevance by supporting reranking on compressed vectors.
- Supporting ANN vector search for multi-tenant use cases, where each tenant has its own subcollection. This is especially valuable for customers each of whose user organizations has a large vector collection.

### Performance benchmarking

We are planning to update [the Big5 workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/big5) mappings and settings. In particular, we'll add support for dynamic templates, configurable merge policies, match-only text, and setting the default query field to `message`.

## Conclusion

While we're continuing to expand OpenSearch functionality, we are also investing in improving the performance, efficiency, and robustness of the system for every workload. In particular, vector techniques are being widely adopted both for pure semantic search and for hybrid semantic and lexical search.

The OpenSearch team at AWS works in collaboration with the larger OpenSearch community. Without your contributions to testing, feedback, and development, OpenSearch would not be where it is today. Thank you.

Stay tuned to our [blog](https://opensearch.org/blog/) and [GitHub](https://github.com/orgs/opensearch-project/projects/153/views/1) for further updates and insights into our progress and future plans.

## Appendix: Benchmark tests and results

This section provides detailed information about the performance benchmarks we used and the results we obtained. The data was collected by using OpenSearch Benchmark to run the Big5 workload against different OpenSearch distributions and configurations. In particular:

- We used OpenSearch Benchmark---our standard benchmarking tool---for testing. Rally might produce different results.
- We ran each test against a single-node cluster to ensure better reproducibility and an easier setup.
- The instance type was *c5.2xlarge*---8 vCPU, 16 GB---an average instance type. Using oversized instances can conceal resource usage efficiency improvements.
- The Big5 index comprised a single shard with no replicas (run with `--workload-params="number_of_replicas:0"`).
- During the tests, we ingested data using a single bulk indexing client to ensure that data was ingested in chronological order.
- We ran the tests in [benchmarking mode](https://opensearch.org/docs/latest/benchmark/user-guide/target-throughput/#benchmarking-mode) (`target-throughput` was disabled) so that the OpenSearch client sent requests to the OpenSearch cluster as quickly as possible.
- We configured the shard merge policy with LogByteSizeMergePolicy because this optimization was in place last year, prior to the publishing of this blog post.
- The corpus size of the workload was 60 GB, 70M documents. The store size after ingestion was 15 GB for the primary shard. If overhead such as doc values is eliminated, Resident Set Size (RSS) should be about 8 GB, which should match the JVM heap size for the instance. Having most data in-memory should provide an ideal performance assessment.

The following table presents the latency comparison.

<table>
 <tr>
  <th></th>
  <th>Query type</th>
  <th>OS 1.0</th>
  <th>OS 2.7</th>
  <th>OS 2.11</th>
  <th>OS 2.12</th>
  <th>OS 2.13</th>
  <th>OS 2.14</th>
 </tr>
 <tr>
  <td rowspan=5 class="left"><b>Big 5 areas mean latency, ms</b></td>
  <td class="left">Text query</td>
  <td>44.34</td>
  <td>37.02</td>
  <td>36.12</td>
  <td class="green-clr bold">19.42</td>
  <td class="green-clr bold">19.41</td>
  <td class="green-clr bold">20.01</td>
 </tr>
 <tr>
  <td class="left">Sorting</td>
  <td>65.04</td>
  <td>18.58</td>
  <td>10.21</td>
  <td class="green-clr bold">6.22</td>
  <td class="green-clr bold">5.55</td>
  <td class="green-clr bold">5.53</td>
 </tr>
 <tr>
  <td class="left">Terms Aggregation</td>
  <td>311.78</td>
  <td>315.27</td>
  <td>316.32</td>
  <td class="light-green-clr bold">282.41</td>
  <td class="green-clr bold">36.27</td>
  <td class="green-clr bold">27.18</td>
 </tr>
 <tr>
  <td class="left">Range query</td>
  <td>4.06</td>
  <td>4.52</td>
  <td>4.32</td>
  <td class="lightest-green-clr bold">3.81</td>
  <td class="lightest-green-clr bold">3.44</td>
  <td class="lightest-green-clr bold">3.41</td>
 </tr>
 <tr>
  <td class="left">Date histogram</td>
  <td>4812.36</td>
  <td>5093.01</td>
  <td>5057.62</td>
  <td class="green-clr bold">310.32</td>
  <td class="green-clr bold">332.41</td>
  <td class="green-clr bold">141.5</td>
 </tr>
 <tr>
  <td class="left"><b>Relative latency, compared to OS 1.0 (geo mean)</b></td>
  <td></td>
  <td>100%</td>
  <td>78%</td>
  <td>68%</td>
  <td>30%</td>
  <td>19%</td>
  <td>15%</td>
 </tr>
 <tr>
  <td class="left"><b>Speedup factor, compared to OS 1.0 (geo mean)</b></td>
  <td></td>
  <td>1.0</td>
  <td>1.3</td>
  <td>1.5</td>
  <td>3.3</td>
  <td>5.3</td>
  <td>6.7</td>
 </tr>
</table>

The following table presents benchmarking results by query category. It shows the P90 Service Time (ms) values.

<table>
 <tr>
  <th>Buckets</th>
  <th>Query</th>
  <th>OS 1.0 </th>
  <th>OS 2.7</th>
  <th>OS 2.11.0</th>
  <th>OS 2.12.0</th>
  <th>OS 2.13.0</th>
  <th>OS 2.14</th>
 </tr>
 <tr>
  <td rowspan=6><b>Text Querying</b></td>
  <td class="left">default</td>
  <td>2.79</td>
  <td>2.65</td>
  <td>2.41</td>
  <td>2.5</td>
  <td>2.34</td>
  <td>2.27</td>
 </tr>
 <tr>
  <td class="left">scroll</td>
  <td>448.9</td>
  <td>228.42</td>
  <td>227.36</td>
  <td>222.1</td>
  <td>210.41</td>
  <td>217.82</td>
 </tr>
 <tr>
  <td class="left light-green-clr">query_string_on_message</td>
  <td>180.55</td>
  <td>173.6</td>
  <td>168.29</td>
  <td>8.72</td>
  <td>9.29</td>
  <td>8.22</td>
 </tr>
 <tr>
  <td class="left">query_string_on_message_filtered</td>
  <td>174.25</td>
  <td>125.88</td>
  <td>146.62</td>
  <td>102.53</td>
  <td>110.49</td>
  <td>135.98</td>
 </tr>
 <tr>
  <td class="left">query_string_on_message_filtered_sorted_num</td>
  <td>238.14</td>
  <td>183.62</td>
  <td>180.46</td>
  <td>112.39</td>
  <td>120.41</td>
  <td>139.95</td>
 </tr>
 <tr>
  <td class="left">term</td>
  <td>0.81</td>
  <td>1.06</td>
  <td>0.91</td>
  <td>0.96</td>
  <td>0.88</td>
  <td>0.83</td>
 </tr>
 <tr>
  <td rowspan=14><b>Sorting</b></td>
  <td class="left"> desc_sort_timestamp</td>
  <td>13.09</td>
  <td>159.45</td>
  <td>28.39</td>
  <td>20.65</td>
  <td>18.76</td>
  <td>20.4483</td>
 </tr>
 <tr>
  <td class="left">asc_sort_timestamp</td>
  <td>993.81</td>
  <td>61.94</td>
  <td>78.91</td>
  <td>39.78</td>
  <td>36.83</td>
  <td>33.79</td>
 </tr>
 <tr>
  <td class="left">desc_sort_with_after_timestamp</td>
  <td>1123.65</td>
  <td>163.53</td>
  <td>28.93</td>
  <td>19.4</td>
  <td>18.78</td>
  <td>22.492</td>
 </tr>
 <tr>
  <td class="left">asc_sort_with_after_timestamp</td>
  <td>1475.51</td>
  <td>42.69</td>
  <td>38.55</td>
  <td>6.22</td>
  <td>5.55</td>
  <td>5.14</td>
 </tr>
 <tr>
  <td class="left">desc_sort_timestamp_can_match_shortcut</td>
  <td>15.49</td>
  <td>31.13</td>
  <td>7.64</td>
  <td>7.11</td>
  <td>6.54</td>
  <td>6.88</td>
 </tr>
 <tr>
  <td class="left">desc_sort_timestamp_no_can_match_shortcut</td>
  <td>15.29</td>
  <td>30.95</td>
  <td>7.63</td>
  <td>7.17</td>
  <td>6.53</td>
  <td>6.74441</td>
 </tr>
 <tr>
  <td class="left">asc_sort_timestamp_can_match_shortcut</td>
  <td>198.59</td>
  <td>32.46</td>
  <td>18.93</td>
  <td>12.64</td>
  <td>9.45</td>
  <td>8.91</td>
 </tr>
 <tr>
  <td class="left">asc_sort_timestamp_no_can_match_shortcut</td>
  <td>197.36</td>
  <td>32.5</td>
  <td>18.78</td>
  <td>12.74</td>
  <td>9.02</td>
  <td>8.82</td>
 </tr>
 <tr>
  <td class="left">sort_keyword_can_match_shortcut</td>
  <td>181.18</td>
  <td>2.59</td>
  <td>2.37</td>
  <td>2.46</td>
  <td>2.18</td>
  <td>2.13</td>
 </tr>
 <tr>
  <td class="left">sort_keyword_no_can_match_shortcut</td>
  <td>181.06</td>
  <td>2.43</td>
  <td>2.44</td>
  <td>2.49</td>
  <td>2.15</td>
  <td>2.09</td>
 </tr>
 <tr>
  <td class="left">sort_numeric_desc</td>
  <td>36.19</td>
  <td>35.15</td>
  <td>23.6</td>
  <td>6.04</td>
  <td>5.83</td>
  <td>5.78</td>
 </tr>
 <tr>
  <td class="left">sort_numeric_asc</td>
  <td>66.87</td>
  <td>37.74</td>
  <td>21.14</td>
  <td>5.3</td>
  <td>5.15</td>
  <td>5.2</td>
 </tr>
 <tr>
  <td class="left">sort_numeric_desc_with_match</td>
  <td>1.23</td>
  <td>1.01</td>
  <td>0.99</td>
  <td>0.92</td>
  <td>0.85</td>
  <td>0.8</td>
 </tr>
 <tr>
  <td class="left">sort_numeric_asc_with_match</td>
  <td>1.24</td>
  <td>0.99</td>
  <td>0.9</td>
  <td>0.89</td>
  <td>0.84</td>
  <td>0.8</td>
 </tr>
 <tr>
  <td rowspan=5><b>Terms aggregation</b></td>
  <td class="left">multi_terms_keyword</td>
  <td>0.92</td>
  <td>1.1</td>
  <td>1</td>
  <td>1.05</td>
  <td>0.91</td>
  <td>0.89</td>
 </tr>
 <tr>
  <td class="left">keyword_terms</td>
  <td>2126.25</td>
  <td>2117.22</td>
  <td>2382.37</td>
  <td>1906.71</td>
  <td>12.74</td>
  <td>6.96</td>
 </tr>
 <tr>
  <td class="left">keyword_terms_low_cardinality</td>
  <td>2135.16</td>
  <td>2121.88</td>
  <td>2338.1</td>
  <td>1893.9</td>
  <td>10.81</td>
  <td>5.25</td>
 </tr>
 <tr>
  <td class="left">composite_terms</td>
  <td>696.37</td>
  <td>668.09</td>
  <td>631.23</td>
  <td>572.77</td>
  <td>581.24</td>
  <td>551.62</td>
 </tr>
 <tr>
  <td class="left">composite_terms_keyword</td>
  <td>1012.96</td>
  <td>943.35</td>
  <td>900.66</td>
  <td>827.16</td>
  <td>861.81</td>
  <td>826.18</td>
 </tr>
 <tr>
  <td rowspan=7><b>Range queries</b></td>
  <td class="left">range</td>
  <td>203.29</td>
  <td>170.68</td>
  <td>189.77</td>
  <td>115.38</td>
  <td>115.2</td>
  <td>125.99</td>
 </tr>
 <tr>
  <td class="left">range_numeric</td>
  <td>0.81</td>
  <td>0.96</td>
  <td>0.87</td>
  <td>0.9</td>
  <td>0.76</td>
  <td>0.75</td>
 </tr>
 <tr>
  <td class="left">keyword_in_range</td>
  <td>210.69</td>
  <td>179.18</td>
  <td>200.37</td>
  <td>123.59</td>
  <td>124.66</td>
  <td>134.06</td>
 </tr>
 <tr>
  <td class="left">range_field_conjunction_big_range_big_term_query</td>
  <td>0.92</td>
  <td>1.13</td>
  <td>0.99</td>
  <td>1.01</td>
  <td>0.91</td>
  <td>0.82</td>
 </tr>
 <tr>
  <td class="left">range_field_disjunction_big_range_small_term_query</td>
  <td>0.82</td>
  <td>1.08</td>
  <td>1.04</td>
  <td>1</td>
  <td>0.86</td>
  <td>0.81</td>
 </tr>
 <tr>
  <td class="left">range_field_conjunction_small_range_small_term_query</td>
  <td>0.83</td>
  <td>1.09</td>
  <td>0.93</td>
  <td>0.98</td>
  <td>0.85</td>
  <td>0.81</td>
 </tr>
 <tr>
  <td class="left">range_field_conjunction_small_range_big_term_query</td>
  <td>0.83</td>
  <td>0.98</td>
  <td>0.88</td>
  <td>0.91</td>
  <td>0.78</td>
  <td>0.78</td>
 </tr>
 <tr>
  <td rowspan=5><b>Date histogram</b></td>
  <td class="left light-green-clr">date_histogram_hourly_agg</td>
  <td>3618.5</td>
  <td>3664.45</td>
  <td>3785.48</td>
  <td>8.5</td>
  <td>9.97</td>
  <td>3.39</td>
 </tr>
 <tr>
  <td class="left">date_histogram_minute_agg</td>
  <td>2854.99</td>
  <td>2933.76</td>
  <td>2961.69</td>
  <td>2518.69</td>
  <td>2635.16</td>
  <td>148.69</td>
 </tr>
 <tr>
  <td class="left">composite_date_histogram_daily</td>
  <td>3760.5</td>
  <td>4016.42</td>
  <td>3574.18</td>
  <td>1.44</td>
  <td>1.51</td>
  <td>1.39</td>
 </tr>
 <tr>
  <td class="left">range_auto_date_histo</td>
  <td>5267.47</td>
  <td>5960.21</td>
  <td>6055.74</td>
  <td>6784.27</td>
  <td>6977.05</td>
  <td>6129.29</td>
 </tr>
 <tr>
  <td class="left">range_auto_date_histo_with_metrics</td>
  <td>12612.77</td>
  <td>13314.87</td>
  <td>13637.23</td>
  <td>13759.51</td>
  <td>14662.24</td>
  <td>13208.98</td>
 </tr>
</table>

If you decide to run your own benchmarking tests, please feel free to share the results with us. As always, we welcome your feedback and contributions, and we'd love to hear from you on the [OpenSearch forum](https://forum.opensearch.org/).
