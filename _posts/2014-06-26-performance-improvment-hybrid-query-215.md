---
layout: post
title:  "Boosting Hybrid Query Performance in OpenSearch 2.15"
authors:
  - gaievski
  - vamshin
  - macrakis
date: 2024-07-02
categories:
  - technical-posts
meta_keywords: Multimodal search, searching with semantic and visual understanding, improve search relevance, hybrid search in OpenSearch 2.10, keyword and image search
meta_description: Improve hybrid query performance in OpenSearch 2.15.
has_science_table: true
---

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

Since its introduction in OpenSearch 2.10, hybrid search has become popular among customers who want to improve the relevance of their semantic search results. Hybrid queries combine full-text search and semantic search to provide better results than either method alone for a wide variety of applications in e-commerce, document search, log analytics, and data exploration. However, its complexity can lead to performance issues, especially when dealing with large datasets or complex query structures.

With each new release, OpenSearch has implemented numerous enhancements to improve the performance of hybrid search at scale. In version 2.15, the improvements in hybrid queries have resulted in up to a 70% performance improvement compared to version 2.13.

These improvements were achieved by analyzing and optimizing hot spots in the code. The development team focused on the following areas:

- **Conditional scoring logic:**  
  We have added conditional scoring logic. Previously, the core logic for collecting scores during a query was fixed, so all computations were performed regardless of their necessity. This often led to unnecessary calculations, especially when certain scoring computations were redundant for specific plugins or query types.

  To address this inefficiency, we made the scoring logic conditional. Now, certain compute operations can be skipped if they are not required by the plugin in use. This optimization reduces computational overhead and accelerates query processing, leading to faster search results and better resource utilization.

  The performance improvements from this change are substantial. According to our benchmarks, query processing speed has increased by up to 20% for certain use cases. This enhancement significantly boosts the efficiency of handling complex queries, making OpenSearch more robust and responsive. Details can be found in the following GitHub issues:
  - [[Feature Request] Provide capability for not adding top docs collector in the query search path #13170](https://github.com/opensearch-project/OpenSearch/issues/13170)
  - [Pass empty QueryCollectorContext in case of hybrid query to improve latencies by 20% #731](https://github.com/opensearch-project/neural-search/pull/731)

- **Replacing inefficient constructs:**  
  In analyzing the performance of 2.13, we found that the Java Streams API, while convenient and expressive, introduced unnecessary overhead in certain high-performance scenarios. This was particularly evident in areas with intensive data processing requirements.

  To address this, 2.15 replaces Java Streams constructs with more performant alternatives, such as for-loops and optimized data handling techniques. These optimizations resulted in a performance gain of up to 25% in specific data processing tasks. This improvement helps OpenSearch handle larger datasets and more complex queries more efficiently. For more details on these changes, refer to the GitHub issue:
  - [In hybrid query optimize the way we iterate over results and collect scores of sub queries #745](https://github.com/opensearch-project/neural-search/issues/745)

- **Eliminating unnecessary calculations:**  
  We also found that certain expensive calculations, such as computing hash codes for Query objects, were being performed unnecessarily. We removed these unnecessary calculations, so resources are now allocated more efficiently, speeding up hybrid queries.

  The detailed analysis in the GitHub issue shows a 20% improvement in query processing speed:
  - [Improve efficiency by eliminating unnecessary hash code computations #705](https://github.com/opensearch-project/neural-search/issues/705)

- **Optimized data structures:**  
  We also found a more efficient way to use priority queues, which are used for some sorting operations. In particular, we improved hybrid query latency by changing the allocation strategy of query hits objects. Previously, those objects were pre-populated. We now perform lazy initialization, removing the lowest-score element when the queue reaches its full capacity.

  Benchmarking shows that these optimizations resulted in a performance gain of up to 10% in query processing times for specific data processing tasks. For more details, see the GitHub issue:
  - [In hybrid query optimize the way we iterate over results and collect scores of sub queries #745](https://github.com/opensearch-project/neural-search/issues/745)

- **Reducing repetitive calculations:**  
  We have mitigated redundant internal computations by implementing value caching and reuse strategies. This has reduced the overall computational overhead within the system.

  By optimizing the handling of repetitive calculations and promoting value reuse, we have sped up the system by 5%. For full details, see the GitHub issues:
  - [Improve efficiency by caching and reusing internal calculations #756](https://github.com/opensearch-project/neural-search/issues/756)
  - [Enhance performance through value caching and reuse strategies #764](https://github.com/opensearch-project/neural-search/issues/764)

Benchmark results have shown up to a 70% performance improvement for large (over 10M) datasets for hybrid queries in OpenSearch 2.15 compared to version 2.13. These benchmarks were conducted using a new OpenSearch Benchmark workload that the team has created specifically for evaluating semantic-search use cases.

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

---

## Future Improvements

We continue to analyze the performance of OpenSearch and identify opportunities for further enhancements. We are considering the following improvements for future versions:

- **Advanced optimization techniques for hybrid query:**  
  We may iterate over blocks of documents rather than individual ones to further reduce latency and enhance performance. These techniques aim to streamline the processing of hybrid queries by minimizing the computational overhead associated with handling large volumes of data.

- **Algorithmic refinements:**  
  Refining existing algorithms and introducing new ones that are better suited for hybrid search. This includes optimizing the ranking and scoring mechanisms to ensure more accurate and faster results.

Additionally, the team is considering the following ongoing initiatives to provide continuous performance insights and improvements:

- **Nightly benchmark runs:**  
  Starting from version 2.15, the team will be publishing the results of hybrid query nightly benchmark runs so users can track changes in performance between versions. These results will be available on the [OpenSearch Benchmarks page](https://opensearch.org/benchmarks/).

- **Enhanced benchmark workloads:**  
  The addition of more extensions for benchmark workloads to gather metrics for vector search queries in addition to text search queries.

These enhancements aim to broaden the capabilities and improve the efficiency of OpenSearch even further.

---

## References

1. [[META] Improve Hybrid query latency](https://github.com/opensearch-project/neural-search/issues/704)
2. [OpenSearch Benchmark workload for semantic search](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/noaa_semantic_search)  
3. [OpenSearch Benchmarks page](https://opensearch.org/benchmarks/)  
4. [Improve search relevance with hybrid search, generally available in OpenSearch 2.10](https://opensearch.org/blog/hybrid-search/)  
5. [Hybrid query](https://opensearch.org/docs/latest/query-dsl/compound/hybrid/)  
