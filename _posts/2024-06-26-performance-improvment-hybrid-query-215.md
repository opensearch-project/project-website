---
layout: post
title:  "Boosting Hybrid query performance in OpenSearch 2.15"
authors:
  - gaievski
  - vamshin
  - macrakis
date: 2024-07-02
categories:
  - technical-posts
meta_keywords: hybrid search, boost hybrid query performance, OpenSearch 2.15, semantic search
meta_description: The launch of OpenSearch 2.15 greatly improves hybrid search with numerous enhancements that boost hybrid query performance by as much as 70% in comparison to version 2.13.
has_science_table: true
---
Since its introduction in OpenSearch 2.10, hybrid search has become popular among users looking to enhance the relevance of their semantic search results. By combining full-text search and semantic search, hybrid queries deliver superior results for various applications, including e-commerce, document search, log analytics, and data exploration. However, managing large datasets and complex queries can sometimes lead to performance issues.
<style>

.light-green-clr {
    background-color: #e3f8e3;
}

.bold {
    font-weight: 700;
}

.left {
    text-align: left;
}

.center {
    text-align: center;
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



With each new release, OpenSearch has implemented numerous enhancements to improve the performance of hybrid search at scale. In version 2.15, these enhancements led to **hybrid query performance improving by up to 70%** compared to version 2.13.

## Improvements in OpenSearch 2.15

The development team made improvements by analyzing the code and optimizing performance bottlenecks. We focused on the following areas:

- **Conditional scoring logic**: Previously, the core logic for collecting scores during a query was fixed, so computations were performed regardless of whether they were needed. This often led to unnecessary calculations, especially when scoring computations were redundant for specific query types or plugins. In OpenSearch 2.15, we made the scoring logic conditional, allowing certain computations to be skipped if they are not needed by the plugin currently in use. This optimization reduces computational overhead, accelerates query processing, and improves resource utilization. 

    The performance improvements resulting from this change are substantial. Our benchmarks show a **20% increase in query processing speed** for some use cases. For more information, see the following GitHub issues:
    - [[Feature Request] Provide capability for not adding top docs collector in the query search path #13170](https://github.com/opensearch-project/OpenSearch/issues/13170)
    - [Pass empty QueryCollectorContext in case of hybrid query to improve latencies by 20% #731](https://github.com/opensearch-project/neural-search/pull/731)

- **Replacement of inefficient constructs**: We analyzed the performance of version 2.13 and found that the Java Streams API, while convenient, introduced unnecessary overhead in high-performance scenarios. This was particularly evident in areas with intensive data processing requirements.
In version 2.15, we replaced Java Streams constructs with more efficient alternatives, such as for loops and optimized data handling techniques. This change resulted in a **performance gain of up to 25%** for specific data processing tasks, helping OpenSearch handle larger datasets and more complex queries more efficiently. For more information, see the following GitHub issue:
    - [In hybrid query optimize the way we iterate over results and collect scores of sub queries #745](https://github.com/opensearch-project/neural-search/issues/745)

- **Elimination of unnecessary calculations**: We found that certain expensive calculations, such as computing hash codes for query objects, are unnecessary. By removing these calculations, resources are allocated more efficiently, speeding up hybrid queries. This change has **improved query processing speed by 20%**. For more information, see the following GitHub issue:
    - [Improve efficiency by eliminating unnecessary hash code computations #705](https://github.com/opensearch-project/neural-search/issues/705)

- **Optimized data structures**: We improved the use of priority queues, which are used for some sorting operations. By changing the allocation strategy of query hits objects to perform lazy initialization, we removed the lowest-score element when the queue reaches full capacity. Our benchmarks show that this optimization resulted in a **performance gain of up to 10% in query processing speed** for specific data processing tasks. For more information, see the following GitHub issue:
    - [In hybrid query optimize the way we iterate over results and collect scores of sub queries #745](https://github.com/opensearch-project/neural-search/issues/745)

- **Reducing repetitive calculations:** To mitigate redundant internal calculations, we have implemented value caching and reuse strategies, reducing the overall computational overhead within the system. By optimizing the handling of repetitive calculations and promoting value reuse, we have **sped up the system by 5%**. For more information, see the following GitHub issues:
    - [Improve efficiency by caching and reusing internal calculations #756](https://github.com/opensearch-project/neural-search/issues/756)
    - [Enhance performance through value caching and reuse strategies #764](https://github.com/opensearch-project/neural-search/issues/764)

## Benchmark results

Our benchmark results show a **performance improvement of up to 70%** for large datasets (over 10M) in hybrid queries with OpenSearch 2.15 compared to version 2.13. These benchmarks were conducted using a new OpenSearch Benchmark workload created specifically for evaluating semantic-search use cases. The following table summarizes the benchmark results.

<table>
 <tr>
  <th rowspan=2>Number of documents retrieved</th>
  <th rowspan=2>Number of hybrid sub-queries</th>
  <th colspan=3>OpenSearch version 2.13</th>
  <th colspan=3>OpenSearch version 2.15</th>
  <th>Performance improvement</th>
 </tr>
  <tr>
  <th>p50, ms</th>
  <th>p90, ms</th>
  <th>p99, ms</th>
  <th>p50, ms</th>
  <th>p90, ms</th>
  <th>p99, ms</th>
  <th>%</th>
 </tr>
 <tr>
  <td class="left"><b>1.6K</b></td>
  <td>1</td>
  <td>75</td>
  <td>77</td>
  <td>78</td>
  <td>75</td>
  <td>76</td>
  <td>76</td>
  <td class="light-green-clr bold">1</td>
 </tr>
 <tr>
  <td class="left"><b>1.6M</b></td>
  <td>1</td>
  <td>224</td>
  <td>240</td>
  <td>245</td>
  <td>109</td>
  <td>114</td>
  <td>119</td>
  <td class="light-green-clr bold">52</td>
 </tr>
 <tr>
  <td class="left"><b>10M</b></td>
  <td>1</td>
  <td>729</td>
  <td>841</td>
  <td>868</td>
  <td>237</td>
  <td>257</td>
  <td>264</td>
  <td class="light-green-clr bold">70</td>
 </tr>
  <tr>
  <td class="left"><b>15M</b></td>
  <td>3</td>
  <td>1224</td>
  <td>1300</td>
  <td>1367</td>
  <td>294</td>
  <td>330</td>
  <td>343</td>
  <td class="light-green-clr bold">75</td>
 </tr>
 <tr>
  <td colspan=8 class="center bold">% average boost in 2.15 vs 2.13</td>
  <td class="light-green-clr bold">49</td>
 </tr>
</table>

## Planned improvements

We will continue to analyze OpenSearch performance metrics and identify opportunities for further enhancements. Future improvements may include:

- **Advanced optimization techniques for hybrid queries**: Iterating over batches of documents rather than individual ones to further reduce latency and enhance performance. This technique aims to streamline hybrid query processing by minimizing the computational overhead associated with handling large volumes of data.

- **Algorithmic refinements**: Refining existing algorithms and introducing new ones better suited for hybrid search. This includes optimizing ranking and scoring mechanisms to ensure more accurate and faster results.

Ongoing initiatives to provide continuous performance insights and improvements include the following:

- **Nightly benchmark runs**: Starting with version 2.15, we will publish the results of hybrid query nightly benchmark runs so you can track performance changes between versions. These results will be available on the [OpenSearch Performance Benchmarks](https://opensearch.org/benchmarks/) page.

- **Enhanced benchmark workloads**: We'll expand benchmark workloads with extensions in order to gather metrics for vector search queries, in addition to text search queries.

These enhancements will make OpenSearch more powerful and efficient.

---

## References

1. [[META] Improve Hybrid query latency](https://github.com/opensearch-project/neural-search/issues/704)
2. [OpenSearch Benchmark workload for semantic search](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/noaa_semantic_search)  
3. [OpenSearch Performance Benchmarks](https://opensearch.org/benchmarks/)
4. [Improve search relevance with hybrid search, generally available in OpenSearch 2.10](https://opensearch.org/blog/hybrid-search/)  
5. [Hybrid query](https://opensearch.org/docs/latest/query-dsl/compound/hybrid/)  
