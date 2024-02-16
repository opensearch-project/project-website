---
layout: post
title: An update on the OpenSearch Project’s continued performance progress through version 2.11 
authors:
  - sisurab
  - pallp
  - dagney
  - rishabhsi
date: 2024-01-10
categories:
    - technical-posts
    - community
meta_keywords: OpenSearch performance improvements, OpenSearch roadmap, high volume indexing, low latency search
meta_description: Learn more about the OpenSearch Project roadmap and how the project improved the performance of its core open source engine to drive down latency and improve efficiency.
has_science_table: true
---

OpenSearch is a community-driven, open-source search and analytics suite used by developers to ingest, search, visualize, and analyze data. [Introduced in January 2021](https://aws.amazon.com/blogs/opensource/stepping-up-for-a-truly-open-source-elasticsearch/), the OpenSearch Project originated as an open-source fork of Elasticsearch 7.10.2. OpenSearch 1.0 was released for production use in [July 2021](https://opensearch.org/blog/opensearch-general-availability-announcement/) and is licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0) (ALv2), with the complete codebase [published to GitHub](https://github.com/opensearch-project). The project has consistently focused on improving the performance of its core open-source engine for high-volume indexing and low-latency search operations. OpenSearch aims to provide the best experience for every user by reducing latency and improving efficiency.

In this blog post, we'll share a comprehensive view of strategic enhancements and performance features that OpenSearch has delivered to date. Additionally, we'll provide a look forward at the [Performance Roadmap](https://github.com/orgs/opensearch-project/projects/153/views/1). We'll compare the core engine performance of the latest OpenSearch version (OpenSearch 2.11) to the state just before the OpenSearch fork, with a specific focus on the advancements made since then. With this goal in mind, we have chosen Elasticsearch 7.10.2 to represent the baseline from which OpenSearch was forked, allowing us to measure all changes that have been delivered after the fork (in OpenSearch 1.0--2.11). These improvements were made in collaboration with the community; thus, the OpenSearch Project is actively seeking to enhance community engagement, specifically in the area of performance improvement.

<style>

.ylw-clr {
    background-color: #FFEFCC;
}

.orange-clr {
    background-color: #FCE2CF;
}

.light-orange-clr {
    background-color: #FDEFE5;
}

.green-clr {
    background-color: #c1f0c1;
}

.light-green-clr {
    background-color: #e3f8e3;
}

.center {
    display: block;
    margin-left: auto;
    margin-right: auto;
}

#infographic {
    border: none;  
    box-shadow: none;
    text-align: center;
}

table { 
    font-size: 16px; 
}

h3 {
    font-size: 22px;
}
h4 {
    font-size: 20px;
}

td {
    text-align: right;
}

td:first-child {
    text-align: left;
}

th {
    background-color: #f5f7f7;
}​

</style>

## Performance improvements to date

OpenSearch performance improvements can be categorized into three high-level buckets: 

1. **Indexing performance**
1. **Query performance**
1. **Storage**

The following image summarizes OpenSearch performance improvements since launch.

<img src="/assets/media/blog-images/2024-01-03-opensearch-performance-improvements/opensearch-performance.png" alt="OpenSearch performance improvements since launch" class="img_bound" id="infographic"/>{:style="width: 100%; max-width: 750px; height: auto;"}

Log analytics workloads are typically indexing heavy, often relying on specific resource-intensive queries. In contrast, search workloads have a more balanced distribution between indexing and query operations. Based on the analysis we’ll detail below comparing Elasticsearch 7.10.2 to OpenSearch 2.11, we have seen a 25% improvement in indexing throughput, a 15--98% decrease in query latencies among some of the most popular query types, and, now with Zstandard compression, a 15--30% reduction in on-disk data size.

### Indexing performance investments

Some of the key OpenSearch features launched this year delivered efficiency improvements in indexing performance. OpenSearch rearchitected the way indexing operations are performed in order to deliver **segment replication**---a physical replication method that replicates index segments rather than source documents. Segment replication, a new replication strategy built on Lucene’s [Near-Real-Time (NRT) Segment Index Replication API](https://blog.mikemccandless.com/2017/09/lucenes-near-real-time-segment-index.html), was released as generally available in OpenSearch 2.7. Segment replication showed increased ingestion rate throughput of up to 25% when compared to default document replication. You can find a more detailed look at segment replication in [this blog post](https://opensearch.org/blog/segment-replication/). 

In version 2.10, OpenSearch introduced **remote-backed storage**, allowing users to directly write segments to object storage, such as Amazon Simple Storage Service (Amazon S3) or Oracle Cloud Infrastructure (OCI) Object Storage, to improve data durability. With remote-backed storage, in addition to storing data on a local disk, all the ingested data is stored in the configured remote store. At every refresh, the remote store also automatically becomes a point-in-time recovery point, helping users achieve a recovery point objective (RPO) of zero with the same durability properties of the configured remote store. To learn more, see [this blog post](https://opensearch.org/blog/remote-backed-storage/). 

### Query performance investments

OpenSearch supports an extensive array of query types for different use cases, from comprehensive search capabilities to a broad spectrum of aggregations, filtering options, and sorting functionalities. One of the major query performance areas in which OpenSearch has improved is in helping vector queries perform at scale, given the rise in vector search popularity. OpenSearch's vector engine offers fast, billion-scale vector searches with efficient latency and recall. 

Recent additions like scalar and product quantization reduced the cluster memory footprint by up to 80%. The incorporation of native libraries (`nmslib` and `faiss`) and HNSW with SIMD instructions has expedited vector indexing and search queries. At a large scale, tested with billions of documents, OpenSearch delivered a roughly 30% lower latency compared to Lucene ANN searches. For more information, see [this partner highlight](https://opensearch.org/blog/aws-knn-algorithms-workload-optimizations/). 

We’ve also continued to invest broadly in core query performance for popular query types used for log analytics, time-series data, and search. OpenSearch has demonstrated significant improvement since the fork from Elasticsearch 7.10.2 for many query types. The benchmarking we performed showed a 15%--98% increase in performance across popular query operations such as match all, range queries, aggregation queries, and full-text queries. You can review key benchmarking findings in the following sections.

### Storage investments

Storage is another major factor that affects the overall efficiency of log analytics and search workloads. In OpenSearch 2.9 and later, customers can use Zstandard compression, resulting in a 30% reduction in on-disk data size while maintaining a near-identical CPU utilization pattern compared to the default compression. Some of the ongoing work, such as the addition of a `match_only_text` field (see [ #11039](https://github.com/opensearch-project/OpenSearch/pull/11039)), has shown a promising reduction of about 25% in data on disk, primarily with text data field optimization, and should be available to users in the upcoming OpenSearch 2.12 release. 

## Measured performance improvements

To compare performance between Elasticsearch 7.10.2 and OpenSearch 2.11, we ran query operations for widely used scenarios in log analytics, time series, and search. We ran the queries across clusters running each version and documented the resulting performance. The following subsections provide the key findings from this exercise.

### Log analytics

For log analytics use cases, we used the `http_logs` workload from [OpenSearch Benchmark](https://opensearch.org/docs/latest/benchmark/index/)---a macro-benchmark utility within the OpenSearch Project---to replicate some of the common query operations. Here are the key highlights:

* `match_all` queries with sorting showed a more than 20x performance boost across the board because of multiple improvements made in the area (see [#6321](https://github.com/opensearch-project/OpenSearch/pull/6321) and [#7244](https://github.com/opensearch-project/OpenSearch/pull/7244)) and other Lucene enhancements.

* Queries for ascending and descending sort-after-timestamp saw a significant performance improvement of up to 70x overall. The optimizations introduced (such as [#6424](https://github.com/opensearch-project/OpenSearch/pull/6424) and [#8167](https://github.com/opensearch-project/OpenSearch/issues/8167)) extend across various numeric types, including `int`, `short`, `float`, `double`, `date`, and others.

* Other popular queries, such as `search_after`, saw about a 60x reduction in latency, attributed to the improvements made in the area involving optimally skipping segments during search (see [#7453](https://github.com/opensearch-project/OpenSearch/pull/7453)). The `search_after` queries can be used as the recommended alternative to scroll queries for a better search experience.

* Implementation support for `match_only_text` field optimization on storage and indexing/search latency for text queries is in progress (see [#11039](https://github.com/opensearch-project/OpenSearch/pull/11039)).

### Time series

In the context of aggregations over range and time-series data, we used the `nyc_taxis` and `http_logs` workloads from OpenSearch Benchmark to benchmark various popular use cases. Here are the key highlights:

* Range queries, popular for aggregation use cases, exhibited about a 50%--75% improvement, attributed to system upgrades such as Lucene (from v8.8 in Elasticsearch 7.10.2 to v9.7 in OpenSearch 2.11) and JDK (from JDK15 in Elasticsearch 7.10.2 to JDK17 in OpenSearch 2.11).

* Hourly aggregations and multi-term aggregations also demonstrated improvement, varying from 5% to 35%, attributed to the time-series improvements discussed previously.

* `date_histograms` and `date_histogram_agg` queries exhibited either comparable or slightly decreased performance, ranging from 5% to around 20% in multi-node environments. These issues are actively being addressed as part of ongoing project efforts (see [#11083](https://github.com/opensearch-project/OpenSearch/pull/11083)).

* For date histogram aggregations, there are upcoming changes aiming to improve performance by rounding down dates to the nearest interval (such as year, quarter, month, week, or day) using SIMD (see [#11194](https://github.com/opensearch-project/OpenSearch/pull/11194)).

### Search

In the realm of text queries, we used `pmc` workloads from OpenSearch Benchmark to emulate various common use cases. Here are the noteworthy highlights:

* Phrase and term queries for text search showed improved latency, with a 25% to 65% reduction, underscoring their improved effectiveness.

* Popular queries related to scrolling exhibited about 15% lower latency, further improving the overall user experience.


## Additional optional performance-enhancing features available in version 2.11

The core engine optimizations discussed in the previous sections are available by default. Additionally, OpenSearch 2.11 includes a few key performance-enhancing features that can be optionally enabled by users. These features were not available in prior versions, so we separately benchmarked performance with those features individually enabled, resulting in the following findings: 

* [**LogByteSize merge policy**](https://github.com/opensearch-project/OpenSearch/issues/9241): Showed a 40--70% improvement in ascending and descending sort queries, which is advantageous for time-series data with timestamp sorting and minimal timestamp overlap between segments.

* [**Zstandard compression**](https://opensearch.org/docs/latest/im-plugin/index-codecs/#changing-an-index-codec): This addition empowers OpenSearch users with the new Zstandard compression codecs for their data, resulting in a 30% reduction in on-disk data size while maintaining a near-identical CPU utilization pattern compared to the default compression.

* [**Concurrent segment search**](https://opensearch.org/blog/concurrent_segment_search/): Enabling every shard-level request to concurrently search across segments during the query phase resulted in latency reduction across multiple query types. Aggregate queries showed a 50%--70% improvement, range queries showed a 65% improvement, and aggregation queries with hourly data aggregations showed a 50% improvement.

## Future roadmap

The OpenSearch Project remains steadfast in its commitment to continuously improving the core engine performance in search, ingestion, and storage operations. [The OpenSearch Project roadmap on GitHub](https://github.com/orgs/opensearch-project/projects/153/views/1) is constantly evolving, and we are excited to share it with you. This roadmap places a special emphasis on the core engine advancements while also encompassing critical areas like benchmarking and query visibility. As part of our ongoing commitment, we plan to consistently update this roadmap with both short- and long-term improvement plans. We're keeping performance excellence at the forefront of our investments, and OpenSearch users can anticipate a series of impactful improvements in new releases in 2024, starting with OpenSearch 2.12.

In the upcoming releases, we will continue to improve the core engine by targeting specific query types. We will also undertake broad strategic initiatives to further enhance the core engine through Protobuf integration, query rewrites, tiered caching, and SIMD and RUST implementations. In addition to improving the core engine, we are committed to improving OpenSearch tooling capabilities. One such improvement that we're currently working on is the query insights functionality, which helps identify the top N queries that impact performance. Additionally, OpenSearch is working on making benchmarks easier for community members to use. For a comprehensive list of investments and additional improvements, or to provide feedback, please check out the OpenSearch [Performance Roadmap](https://github.com/orgs/opensearch-project/projects/153/views/1) on GitHub.

This concludes the main summary of OpenSearch performance improvements to date. The following appendix sections provide the benchmarking details for readers interested in replicating any run.

* * *

## Appendix: Detailed execution and results

If you're interested in the details of the performance benchmarks we used, exploring the methodologies behind their execution, or examining the comprehensive results, keep reading. For OpenSearch users interested in establishing benchmarks and replicating these runs, we've provided comprehensive setup details alongside each result. This section provides the core engine performance comparison between the latest OpenSearch version (OpenSearch 2.11) and the state just before the OpenSearch fork, Elasticsearch 7.10.2, with a mid-point performance measurement on OpenSearch 2.3. 

### OpenSearch Benchmark and workloads

[**OpenSearch Benchmark**](https://github.com/opensearch-project/opensearch-benchmark) serves as a macro-benchmark utility within the OpenSearch Project. With the help of this tool, OpenSearch users and developers can generate and visualize performance metrics from an OpenSearch cluster for various purposes, including:

* Monitoring the overall performance of an OpenSearch cluster.
* Evaluating the benefits of and making decisions about upgrading the cluster to a new version.
* Assessing the potential impact on the cluster resulting from changes to the workflows, such as modifications to the index mappings or changes in queries.

The [**OpenSearch Benchmark workloads**](https://github.com/opensearch-project/opensearch-benchmark-workloads) are comprised of one or multiple benchmarking scenarios. A workload typically includes the ingestion of one or more data corpora into indexes and a collection of queries and operations that are executed as a part of the benchmark.

We used the following workloads for performance evaluation, encompassing aspects such as text/term queries, sorting, aggregations, histograms, and ranges:

* [HTTP logs workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/http_logs#http-logs-workload): This workload is based on [web server logs from the 1998 Football World Cup](http://ita.ee.lbl.gov/html/contrib/WorldCup.html). It is used for evaluating the performance of (web) server logs, which is most in line with the OpenSearch log analytics use case.

* [NYC taxis workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/nyc_taxis#nyc-taxis-workload): This workload contains the rides taken in [yellow taxis in New York in 2015](https://www.nyc.govs.ite/tlc/about/tlc-trip-record-data.page). It is used for evaluating the performance of highly structured data. It is useful for aggregation and date histogram use cases for time-series data.

* [PMC workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/pmc#pmc-workload): This workload contains data retrieved from [PubMed Central (PMC)](https://www.ncbi.nlm.nih.gov/pmc/tools/ftp/). It is used for evaluating the performance of full-text search, in line with the OpenSearch search use case.

The configurations specific to the setup for each evaluation are provided along with the results in the following sections.

## Comparative baseline analysis: Elasticsearch 7.10.2 vs. OpenSearch 2.3 vs. OpenSearch 2.11

We compared the performance of Elasticsearch 7.10.2 (pre-fork), OpenSearch 2.3 (an interim release), and OpenSearch 2.11 (latest version at the time of testing). This analysis covers three workloads (`http-logs`, `nyc-taxis`, and `pmc`) used to assess performance across different use cases. The goal is to provide comparable core engine performance metrics since the Elasticsearch 7.10.2 fork. The benchmarks in the following sections show averages from 7 days of data, generated during nightly runs using [OpenSearch Benchmark](https://github.com/opensearch-project/opensearch-benchmark), intentionally excluding outliers. In the detailed results section, each table contains a percentage improvement column. This column emphasizes the improvements to OpenSearch 2.11 over the previous releases, with positive values indicating improvement and negative values indicating regression.

### Detailed results: Elasticsearch 7.10.2 vs. OpenSearch 2.3 vs. OpenSearch 2.11---deep dive into single-shard performance

**Objective**: To eliminate variables introduced at the coordination level and concentrate on data node query performance.

**Setup**: 1 data node (r5.xlarge) with 32 GB RAM and 16 GB heap. Index settings: 1 shard and 0 replicas.

**`http_logs` workload results**: The following table provides a benchmark comparison for the `http_logs` workload between Elasticsearch 7.10.2, OpenSearch 2.3, and OpenSearch 2.11. It includes the 90th percentile of `took` time latency measurements for each (p90) and the observed percentage improvements.

<table>
    <tr>
        <th>Operations</th>
        <th>ES 7.10.2 (p90_value)</th>
        <th>OS 2.3.0 (p90_value)</th>
        <th>OS 2.11.0 (p90_value)</th>
        <th>OS 2.11.0 improvement (vs. OS 2.3.0)</th>
        <th>OS 2.11.0 improvement (vs. ES 7.10.2)</th>
    </tr>
    <tr class="light-green-clr">
        <td><code>200s-in-range</code></td>
        <td>13</td>
        <td>5</td>
        <td>5.33</td>
        <td>-7%</td>
        <td>59%</td>
    </tr>
    <tr>
        <td><code>400s-in-range</code></td>
        <td>2.73</td>
        <td>2</td>
        <td>2.53</td>
        <td>-26%</td>
        <td>7%</td>
    </tr>
    <tr class="green-clr">
        <td><code>asc_sort_size</code></td>
        <td>4,262.2</td>
        <td>4,471</td>
        <td>4.6</td>
        <td>100%</td>
        <td>100%</td>
    </tr>
    <tr class="green-clr">
        <td><code>asc_sort_timestamp</code></td>
        <td>10.73</td>
        <td>785</td>
        <td>6.47</td>
        <td>99%</td>
        <td>40%</td>
    </tr>
    <tr class="green-clr">
        <td><code>asc_sort_with_after_timestamp</code></td>
        <td>4,576</td>
        <td>5,368</td>
        <td>34.47</td>
        <td>99%</td>
        <td>99%</td>
    </tr>
    <tr>
        <td><code>default</code></td>
        <td>2.91</td>
        <td>3</td>
        <td>3</td>
        <td>0%</td>
        <td>-3%</td>
    </tr>
    <tr class="green-clr">
        <td><code>desc_sort_size</code></td>
        <td>3,800.4</td>
        <td>3,994</td>
        <td>9.53</td>
        <td>100%</td>
        <td>100%</td>
    </tr>
    <tr class="light-orange-clr">
        <td><code>desc_sort_timestamp</code></td>
        <td>39.18</td>
        <td>5,228</td>
        <td>58.8</td>
        <td>99%</td>
        <td>-50%</td>
    </tr>
    <tr class="green-clr">
        <td><code>desc_sort_with_after_timestamp</code></td>
        <td>5,824.27</td>
        <td>6,925</td>
        <td>87.8</td>
        <td>99%</td>
        <td>98%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>hourly_agg</code></td>
        <td>9,387.55</td>
        <td>9,640</td>
        <td>9,112.4</td>
        <td>5%</td>
        <td>3%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>multi_term_agg</code></td>
        <td>N/A</td>
        <td>14,703</td>
        <td>9,669.8</td>
        <td>34%</td>
        <td>N/A</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>range</code></td>
        <td>28.18</td>
        <td>12</td>
        <td>13.4</td>
        <td>-12%</td>
        <td>52%</td>
    </tr>
    <tr>
        <td><code>scroll</code></td>
        <td>213.91</td>
        <td>173</td>
        <td>197.4</td>
        <td>-14%</td>
        <td>8%</td>
    </tr>
    <tr>
        <td><code>term</code></td>
        <td>3.45</td>
        <td>3</td>
        <td>3.4</td>
        <td>-13%</td>
        <td>1%</td>
    </tr>
</table>

**`nyc_taxis` workload results**: The following table provides a benchmark comparison for the `nyc_taxis` workload between Elasticsearch 7.10.2, OpenSearch 2.3, and OpenSearch 2.11. It includes the 90th percentile of `took` time latency measurements for each (p90) and the observed percentage improvements.

<table>
    <tr>
        <th>Operations</th>
        <th>ES 7.10.2 (p90_value)</th>
        <th>OS 2.3.0 (p90_value)</th>
        <th>OS 2.11.0 (p90_value)</th>
        <th>OS 2.11.0 improvement (vs. OS 2.3.0)</th>
        <th>OS 2.11.0 improvement (vs. ES 7.10.2)</th>
    </tr>
    <tr>
        <td><code>autohisto_agg</code></td>
        <td>559.13</td>
        <td>596</td>
        <td>554.6</td>
        <td>7%</td>
        <td>1%</td>
    </tr>
    <tr>
        <td><code>date_histogram_agg</code></td>
        <td>562.4</td>
        <td>584</td>
        <td>545.07</td>
        <td>7%</td>
        <td>3%</td>
    </tr>
    <tr>
        <td><code>default</code></td>
        <td>4.73</td>
        <td>6</td>
        <td>5.07</td>
        <td>15%</td>
        <td>-7%</td>
    </tr>
    <tr class="light-orange-clr">
        <td><code>distance_amount_agg</code></td>
        <td>13181</td>
        <td>12796</td>
        <td>15285</td>
        <td>-19%</td>
        <td>-16%</td>
    </tr>
    <tr class="green-clr">
        <td><code>range</code></td>
        <td>654.67</td>
        <td>213</td>
        <td>213.4</td>
        <td>0%</td>
        <td>67%</td>
    </tr>
</table>

**`pmc` workload results**: The following table provides a benchmark comparison for the `pmc` workload between Elasticsearch 7.10.2, OpenSearch 2.3, and OpenSearch 2.11. It includes the 90th percentile of `took` time latency measurements for each (p90) and the observed percentage improvements.

<table>
    <tr>
        <th>Operations</th>
        <th>ES 7.10.2 (p90_value)</th>
        <th>OS 2.3.0 (p90_value)</th>
        <th>OS 2.11.0 (p90_value)</th>
        <th>OS 2.11.0 improvement (vs. OS 2.3.0)</th>
        <th>OS 2.11.0 improvement (vs. ES 7.10.2)</th>
    </tr>
    <tr>
        <td><code>articles_monthly_agg_cached</code></td>
        <td>2</td>
        <td>2</td>
        <td>2.4</td>
        <td>-20%</td>
        <td>-20%</td>
    </tr>
    <tr>
        <td><code>articles_monthly_agg_uncached</code></td>
        <td>26.5</td>
        <td>27</td>
        <td>27.8</td>
        <td>-3%</td>
        <td>-5%</td>
    </tr>
    <tr>
        <td><code>default</code></td>
        <td>6.5</td>
        <td>6</td>
        <td>5.2</td>
        <td>13%</td>
        <td>20%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>phrase</code></td>
        <td>8.25</td>
        <td>6</td>
        <td>6.4</td>
        <td>-7%</td>
        <td>22%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>scroll</code></td>
        <td>894.5</td>
        <td>857</td>
        <td>753.8</td>
        <td>12%</td>
        <td>16%</td>
    </tr>
    <tr class="green-clr">
        <td><code>term</code></td>
        <td>9</td>
        <td>5</td>
        <td>5.6</td>
        <td>-12%</td>
        <td>38%</td>
    </tr>
</table>

### Detailed results: Elasticsearch 7.10.2 vs. OpenSearch 2.3 vs. OpenSearch 2.11---deep dive into multiple-shard performance

**Objective**: To introduce the coordination layer with parallel search operations extending across multiple nodes with primary shards.

**Setup**: 3 data nodes (r5.xlarge) with 32 GB RAM and 16 GB heap. 3 cluster manager nodes (c5.xlarge) with 8 GB RAM and 4 GB heap. Index settings: 3 shards and 0 replicas.

**`http_logs` workload results**: The following table provides a benchmark comparison for the `http_logs` workload between Elasticsearch 7.10.2, OpenSearch 2.3, and OpenSearch 2.11. It includes the 90th percentile of `took` time latency measurements for each (p90) and the observed percentage improvements.

<table>
    <tr>
        <th>Operations</th>
        <th>ES 7.10.2 (p90_value)</th>
        <th>OS 2.3.0 (p90_value)</th>
        <th>OS 2.11.0 (p90_value)</th>
        <th>OS 2.11.0 improvement (vs. OS 2.3.0)</th>
        <th>OS 2.11.0 Improvement (vs. ES 7.10.2)</th>
    </tr>
    <tr class="light-green-clr">
        <td><code>200s-in-range</code></td>
        <td>9.8</td>
        <td>6</td>
        <td>6.85</td>
        <td>-14%</td>
        <td>30%</td>
    </tr>
    <tr>
        <td><code>400s-in-range</code></td>
        <td>5.8</td>
        <td>5</td>
        <td>5.5</td>
        <td>-10%</td>
        <td>5%</td>
    </tr>
    <tr class="green-clr">
        <td><code>asc_sort_size</code></td>
        <td>1,451.13</td>
        <td>1,602</td>
        <td>8.35</td>
        <td>99%</td>
        <td>99%</td>
    </tr>
    <tr class="green-clr">
        <td><code>asc_sort_timestamp</code></td>
        <td>10.4</td>
        <td>291.5</td>
        <td>10.58</td>
        <td>96%</td>
        <td>-2%</td>
    </tr>
    <tr class="green-clr">
        <td><code>asc_sort_with_after_timestamp</code></td>
        <td>1,488.25</td>
        <td>1,910.5</td>
        <td>25.38</td>
        <td>99%</td>
        <td>98%</td>
    </tr>
    <tr>
        <td><code>default</code></td>
        <td>6</td>
        <td>6</td>
        <td>6.3</td>
        <td>-5%</td>
        <td>-5%</td>
    </tr>
    <tr class="green-clr">
        <td><code>desc_sort_size</code></td>
        <td>1,281.3</td>
        <td>1,431</td>
        <td>13.91</td>
        <td>99%</td>
        <td>99%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>desc_sort_timestamp</code></td>
        <td>34.4</td>
        <td>1,878.5</td>
        <td>91.9</td>
        <td>95%</td>
        <td>-167%</td>
    </tr>
    <tr class="green-clr">
        <td><code>desc_sort_with_after_timestamp</code></td>
        <td>1,887.7</td>
        <td>2,480</td>
        <td>85.78</td>
        <td>97%</td>
        <td>95%</td>
    </tr>
    <tr>
        <td><code>hourly_agg</code></td>
        <td>2,566.9</td>
        <td>3,115</td>
        <td>2,937</td>
        <td>6%</td>
        <td>-14%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>multi_term_agg</code></td>
        <td>N/A</td>
        <td>5205</td>
        <td>3603</td>
        <td>31%</td>
        <td>N/A</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>range</code></td>
        <td>18.1</td>
        <td>9</td>
        <td>8.95</td>
        <td>1%</td>
        <td>51%</td>
    </tr>
    <tr>
        <td><code>scroll</code></td>
        <td>340.1</td>
        <td>267</td>
        <td>323.85</td>
        <td>-21%</td>
        <td>5%</td>
    </tr>
    <tr>
        <td><code>term</code></td>
        <td>5.8</td>
        <td>6</td>
        <td>6.45</td>
        <td>-8%</td>
        <td>-11%</td>
    </tr>
</table>

**`nyc_taxis` workload results**: The following table provides a benchmark comparison for the `nyc_taxis` workload between Elasticsearch 7.10.2, OpenSearch 2.3, and OpenSearch 2.11. It includes the 90th percentile of `took` time latency measurements for each (p90) and the observed percentage improvements.

<table>
    <tr>
        <th>Operations</th>
        <th>ES 7.10.2 (p90_value)</th>
        <th>OS 2.3.0 (p90_value)</th>
        <th>OS 2.11.0 (p90_value)</th>
        <th>OS 2.11.0 Improvement (vs. OS 2.3.0)</th>
        <th>OS 2.11.0 Improvement (vs. ES 7.10.2)</th>
    </tr>
    <tr class="light-orange-clr">
        <td><code>autohisto_agg</code></td>
        <td>208.92</td>
        <td>217</td>
        <td>212.93</td>
        <td>2%</td>
        <td>-2%</td>
    </tr>
    <tr class="light-orange-clr">
        <td><code>date_histogram_agg</code></td>
        <td>198.77</td>
        <td>218</td>
        <td>209.4</td>
        <td>4%</td>
        <td>-5%</td>
    </tr>
    <tr>
        <td><code>default</code></td>
        <td>8.46</td>
        <td>7</td>
        <td>9.67</td>
        <td>-38%</td>
        <td>-14%</td>
    </tr>
    <tr class="light-orange-clr">
        <td><code>distance_amount_agg</code></td>
        <td>4,131</td>
        <td>4,696</td>
        <td>5,067.4</td>
        <td>-8%</td>
        <td>-23%</td>
    </tr>
    <tr class="green-clr">
        <td><code>range</code></td>
        <td>281.62</td>
        <td>73</td>
        <td>79.53</td>
        <td>-9%</td>
        <td>72%</td>
    </tr>
</table>

**`pmc` workload results**: The following table provides a benchmark comparison for the `pmc` workload between Elasticsearch 7.10.2, OpenSearch 2.3, and OpenSearch 2.11. It includes the 90th percentile of `took` time latency measurements for each (p90) and the observed percentage improvements.

<table>
    <tr>
        <th>Operations</th>
        <th>ES 7.10.2 (p90_value)</th>
        <th>OS 2.3.0 (p90_value)</th>
        <th>OS 2.11.0 (p90_value)</th>
        <th>OS 2.11.0 improvement (vs. OS 2.3.0)</th>
        <th>OS 2.11.0 improvement (vs. ES 7.10.2)</th>
    </tr>
    <tr>
        <td><code>articles_monthly_agg_cached</code></td>
        <td>3.55</td>
        <td>3</td>
        <td>3.71</td>
        <td>-24%</td>
        <td>-5%</td>
    </tr>
    <tr>
        <td><code>articles_monthly_agg_uncached</code></td>
        <td>12</td>
        <td>12</td>
        <td>12.43</td>
        <td>-4%</td>
        <td>-4%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>default</code></td>
        <td>9</td>
        <td>6</td>
        <td>6.79</td>
        <td>-13%</td>
        <td>25%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>phrase</code></td>
        <td>8.18</td>
        <td>7</td>
        <td>7.14</td>
        <td>-2%</td>
        <td>13%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>scroll</code></td>
        <td>755.18</td>
        <td>593</td>
        <td>642.79</td>
        <td>-8%</td>
        <td>15%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>term</code></td>
        <td>9</td>
        <td>7</td>
        <td>7.14</td>
        <td>-2%</td>
        <td>21%</td>
    </tr>
</table>

## Elevating performance with new features available in OpenSearch 2.11

The following sections present OpenSearch 2.11 features that improve performance.

### LogByteSize merge policy

In the realm of log analytics, the Tiered merge policy has been a cornerstone of efficient shard merges. In OpenSearch 2.11 we introduced the LogByteSize merge policy. This new approach consistently merges adjacent segments, proving especially advantageous for time-series data characterized by timestamp sorting and minimal timestamp overlap between segments.

The following are the key findings from this exercise.

* Timestamp queries with ascending sort had an improvement of over 75%. This transformation is attributable to the impactful contribution of enhancement [#9241](https://github.com/opensearch-project/OpenSearch/issues/9241).
* About a 40% enhancement in descending sort timestamp queries, surpassing the Tiered merge policy.
* Use cases around ascending and descending sort with an _after_ timestamp saw regression, which is a known case for smaller workloads with this merge policy.
* Other common use cases for log analytics, such as multi-term aggregation, `hourly_agg`, range, and scroll queries exhibited comparable performance, with a subtle improvement of less than 5% attributed to the new segment merge policy.

#### Detailed results: OS 2.11 Tiered merge policy vs OS 2.11 LogByteSize merge policy

**Setup**: 3 data nodes (r5.xlarge) with 32 GB RAM and 16 GB heap. 3 cluster manager nodes (c5.xlarge) with 8 GB RAM and 4 GB heap. Index settings: 3 shards and 0 replicas, `max_segment_size`: 500 MB, `refresh_interval`: 1 s.

**`http_logs` workload results**: The following table provides a benchmark comparison for the `http_logs` workload for OpenSearch 2.11 with the Tiered merge policy vs. the LogByteSize merge policy. It includes the 90th percentile of `took` time latency measurements for each (p90) and the observed percentage improvements.

<table>
    <tr>
        <th>Operations</th>
        <th>OS 2.11&mdash;Tiered (p90_value)</th>
        <th>OS 2.11&mdash;LogByteSize (p90_value)</th>
        <th>% improvement (vs. Tiered merge policy)</th>
    </tr>
    <tr>
        <td><code>200s-in-range</code></td>
        <td>6</td>
        <td>6</td>
        <td>0%</td>
    </tr>
    <tr>
        <td><code>400s-in-range</code></td>
        <td>5</td>
        <td>6</td>
        <td>-20%</td>
    </tr>
    <tr>
        <td><code>asc_sort_size</code></td>
        <td>9</td>
        <td>8</td>
        <td>11%</td>
    </tr>
    <tr class="green-clr">
        <td><code>asc_sort_timestamp</code></td>
        <td>34</td>
        <td>8</td>
        <td>76%</td>
    </tr>
    <tr class="orange-clr">
        <td><code>asc_sort_with_after_timestamp</code></td>
        <td>13</td>
        <td>68</td>
        <td>-423%</td>
    </tr>
    <tr>
        <td><code>default</code></td>
        <td>7</td>
        <td>6</td>
        <td>14%</td>
    </tr>
    <tr>
        <td><code>desc_sort_size</code></td>
        <td>11</td>
        <td>10</td>
        <td>9%</td>
    </tr>
    <tr class="green-clr">
        <td><code>desc_sort_timestamp</code></td>
        <td>29</td>
        <td>17</td>
        <td>41%</td>
    </tr>
    <tr class="orange-clr">
        <td><code>desc_sort_with_after_timestamp</code></td>
        <td>35</td>
        <td>130</td>
        <td>-271%</td>
    </tr>
    <tr>
        <td><code>hourly_agg</code></td>
        <td>2816</td>
        <td>2809</td>
        <td>0%</td>
    </tr>
    <tr>
        <td><code>multi_term_agg</code></td>
        <td>2739</td>
        <td>2800</td>
        <td>-2%</td>
    </tr>
    <tr>
        <td><code>range</code></td>
        <td>7</td>
        <td>8</td>
        <td>-14%</td>
    </tr>
    <tr>
        <td><code>scroll</code></td>
        <td>349</td>
        <td>344</td>
        <td>1%</td>
    </tr>
    <tr>
        <td><code>term</code></td>
        <td>7</td>
        <td>6</td>
        <td>14%</td>
    </tr>
</table>

### Zstandard codec compression

This addition empowers OpenSearch users with the new Zstandard compression codecs for their data. Users can specify `zstd` or `zstd_no_dict` in the `index.codec` setting during index creation or [modify the codecs for existing indexes](https://opensearch.org/docs/latest/im-plugin/index-codecs/#changing-an-index-codec). OpenSearch will continue to support the existing `zlib` and `lz4` codecs, with the default as `lz4`.

The following sections contain benchmarking results representing the average of 5 days of data from nightly runs using OpenSearch Benchmark.

#### Highlights

Here are the key highlights:

* A notable increase in the ingestion throughput, ranging from 5% to 8%, attributed to the new `zstd` codec. This enhancement owes its success to codec-related pull requests ([#7908](https://github.com/opensearch-project/OpenSearch/pull/7908), [#7805](https://github.com/opensearch-project/OpenSearch/issues/7805), and [#7555](https://github.com/opensearch-project/OpenSearch/issues/7555)).

* About a 30% reduction in on-disk data size, surpassing the default `lz4` codec for unparalleled efficiency, all while maintaining a near-identical CPU utilization pattern compared to the default compression.

* The search p90 latencies remained virtually unchanged, with negligible differences of less than 2% in a few areas.

#### Detailed results: OpenSearch 2.11 default (`lz4`) compression vs. OpenSearch 2.11 `zstd` compression using multiple shards

**Setup**: 3 data nodes (r5.xlarge) with 32 GB RAM and 16 GB heap. 3 cluster manager nodes (c5.xlarge) with 8 GB RAM and 4 G heap. Index settings: 3 shards and 0 replicas.

**Indexing throughput results (docs/sec)**: The following table provides an indexing throughput comparison of the `http_logs` and `nyc_taxis` workloads for OpenSearch 2.11 with the default codec vs. the `zstd` codec enabled and includes the percentage improvement observed when using `zstd`.

<table>
    <tr>
        <th>Workload</th>
        <th>OS 2.11&mdash;default codec (mean_value)</th>
        <th>OS 2.11&mdash;zstd codec (mean_value)</th>
        <th>% improvement (vs. default codec)</th>
    </tr>
    <tr class="light-green-clr">
        <td><code>http_logs</code></td>
        <td>209,959.75</td>
        <td>220,948</td>
        <td>5%</td>
    </tr>
    <tr class="light-green-clr">
        <td><code>nyc_taxis</code></td>
        <td>118,123.5</td>
        <td>127,131</td>
        <td>8%</td>
    </tr>
</table>

**`nyc_taxis` search workload results**: The following table illustrates a benchmark comparison for the `nyc_taxis` workload for OpenSearch 2.11 with default codec vs. `zstd` codec enabled, including percentage improvement.

<table>
    <tr>
        <th>Operations</th>
        <th>OS 2.11&mdash;default codec (p90_value)</th>
        <th>OS 2.11&mdash;zstd codec (p90_value)</th>
        <th>% improvement (vs. default codec)</th>
    </tr>
    <tr>
        <td><code>autohisto_agg</code></td>
        <td>216.75</td>
        <td>208</td>
        <td>4%</td>
    </tr>
    <tr>
        <td><code>date_histogram_agg</code></td>
        <td>211.25</td>
        <td>205.5</td>
        <td>3%</td>
    </tr>
    <tr>
        <td><code>default</code></td>
        <td>8</td>
        <td>7.5</td>
        <td>6%</td>
    </tr>
    <tr>
        <td><code>distance_amount_agg</code></td>
        <td>5,012</td>
        <td>4,980</td>
        <td>1%</td>
    </tr>
    <tr>
        <td><code>range</code></td>
        <td>74.5</td>
        <td>77.5</td>
        <td>-4%</td>
    </tr>
</table>

#### Detailed results: Index data size on disk (bytes) with `zstd` compression using a single shard

**Setup**: OpenSearch 2.11.0, single node (r5.xlarge) with 32 GB RAM and 16 GB heap. Index settings: 1 shard and 0 replicas.

**Data size of disk results (bytes)**: The following table illustrates a benchmark comparison of the on-disk data size for the `http_logs` and `pmc` workloads for OpenSearch 2.11 with default vs. `zstd` codec enabled, including percentage improvement.

<table>
    <tr>
        <th></th>
        <th>Default compression (bytes)</th>
        <th>ZSTD (bytes)</th>
        <th>ZSTD_NO_DICT (bytes)</th>
        <th>ZSTD improvement (vs. default codec)</th>
        <th>ZSTD_NO_DICT improvement (vs. default codec)</th>
    </tr>
    <tr class="green-clr">
        <td><code>http_logs</code></td>
        <td>20,056,770,878.5</td>
        <td>15,800,734,037</td>
        <td>16,203,187,551</td>
        <td>21%</td>
        <td>19%</td>
    </tr>
    <tr class="green-clr">
        <td><code>pmc</code></td>
        <td>20,701,211,614.5</td>
        <td>15,608,881,718.5</td>
        <td>15,822,040,185</td>
        <td>25%</td>
        <td>24%</td>
    </tr>
</table>

### Concurrent search improvements (*Experimental in 2.11*)

OpenSearch users can now achieve better execution speed with concurrent segment search, launched as experimental in OpenSearch 2.11. By default, OpenSearch processes a request sequentially across all the data segments on each shard during the query phase of a search request execution. With concurrent search, every shard-level request can concurrently search across segments during the query phase. Each shard divides its segments into [multiple slices](https://opensearch.org/blog/concurrent_segment_search/), where each slice serves as a unit of work executed in parallel on a separate thread. Therefore, the slice count governs the maximum degree of parallelism for a shard-level request. After all the slices finish their tasks, OpenSearch executes a reduce operation on the slices, merging them to generate the final result for the shard-level request.

The following benchmarking results show the benefits of concurrent search in action. These are the averages of data generated from over 4 days of nightly runs using OpenSearch Benchmark.

#### Highlights

Here are the key highlights:

* An increase in performance with aggregate queries on workloads such as the `nyc_taxis` workload, showcasing an improvement ranging between 50% and 70% over the default configuration.
* The log analytics use cases for range queries demonstrated an improvement of around 65%.
* Aggregation queries with hourly data aggregations, such as those for the `http_logs` workload, demonstrated a boost of up to 50% in performance.
* Comparable latencies for auto or date histogram queries, with no noteworthy improvement or regression in performance.
* `multi_term_agg`, `asc_sort_size`, `dec_sort_size`, and `scroll` queries showed regression. To delve deeper into the intricacies, the concurrent search contributors are proactively addressing this in the upcoming OpenSearch 2.12 GA release.

#### Detailed results: OpenSearch 2.11 with concurrent search enabled vs. disabled

**Setup**: OpenSearch 2.11.0 single node (r5.2xlarge) with 64 GB RAM and 32 GB heap. Index settings: 1 shard and 0 replicas.

**`nyc_taxis` workload results**: The following table provides a benchmark comparison of the `nyc_taxis` workload for OpenSearch 2.11 with concurrent search disabled and enabled (with 0 slices and with 4 slices). It includes the 90th percentile of `took` time latency measurements for each (p90) and the observed percentage improvements.

<table>
    <tr>
        <th>Operations</th>
        <th>CS disabled (p90_value)</th>
        <th>CS enabled&mdash;0-slice (p90_value)</th>
        <th>CS enabled&mdash;4-slice (p90_value)</th>
        <th>% improvement (with 0 slices)</th>
        <th>% improvement (with 4 slices)</th>
    </tr>
    <tr class="green-clr">
        <td><code>autohisto_agg</code></td>
        <td>575</td>
        <td>295</td>
        <td>287</td>
        <td>49%</td>
        <td>50%</td>
    </tr>
    <tr class="green-clr">
        <td><code>date_histogram_agg</code></td>
        <td>563</td>
        <td>292</td>
        <td>288</td>
        <td>48%</td>
        <td>49%</td>
    </tr>
    <tr>
        <td><code>default</code></td>
        <td>6</td>
        <td>6</td>
        <td>5</td>
        <td>0%</td>
        <td>17%</td>
    </tr>
    <tr class="green-clr">
        <td><code>distance_amount_agg</code></td>
        <td>15,043</td>
        <td>4,691</td>
        <td>4744</td>
        <td>69%</td>
        <td>68%</td>
    </tr>
    <tr class="green-clr">
        <td><code>range</code></td>
        <td>201</td>
        <td>73</td>
        <td>77</td>
        <td>64%</td>
        <td>62%</td>
    </tr>
</table>

**`http_logs` workload results**: The following table provides a benchmark comparison of the `http_logs` workload for OpenSearch 2.11 with concurrent search disabled and enabled (with 0 slices and with 4 slices). It includes the 90th percentile of latency measurements for each (p90) and the observed percentage improvements.

<table>
    <tr>
        <th>Operations</th>
        <th>CS disabled (p90_value)</th>
        <th>CS enabled&mdash;0-slice (p90_value)</th>
        <th>CS enabled&mdash;4-slice (p90_value)</th>
        <th>% improvement (with 0 slices)</th>
        <th>% improvement (with 4 slices)</th>
    </tr>
    <tr>
        <td><code>200s-in-range</code></td>
        <td>6</td>
        <td>4</td>
        <td>4</td>
        <td>33%</td>
        <td>33%</td>
    </tr>
    <tr>
        <td><code>400s-in-range</code></td>
        <td>2</td>
        <td>2</td>
        <td>2</td>
        <td>0%</td>
        <td>0%</td>
    </tr>
    <tr>
        <td><code>asc-sort-timestamp-after-force-merge-1-seg</code></td>
        <td>20</td>
        <td>20</td>
        <td>22</td>
        <td>0%</td>
        <td>-10%</td>
    </tr>
    <tr>
        <td><code>asc-sort-with-after-timestamp-after-force-merge-1-seg</code></td>
        <td>85</td>
        <td>86</td>
        <td>86</td>
        <td>-1%</td>
        <td>-1%</td>
    </tr>
    <tr class="ylw-clr">
        <td><code>asc_sort_size</code></td>
        <td>3</td>
        <td>5</td>
        <td>5</td>
        <td>-67%</td>
        <td>-67%</td>
    </tr>
    <tr>
        <td><code>asc_sort_timestamp</code></td>
        <td>4</td>
        <td>4</td>
        <td>4</td>
        <td>0%</td>
        <td>0%</td>
    </tr>
    <tr>
        <td><code>asc_sort_with_after_timestamp</code></td>
        <td>34</td>
        <td>33</td>
        <td>34</td>
        <td>3%</td>
        <td>0%</td>
    </tr>
    <tr>
        <td><code>default</code></td>
        <td>4</td>
        <td>4</td>
        <td>3</td>
        <td>0%</td>
        <td>25%</td>
    </tr>
    <tr>
        <td><code>desc-sort-timestamp-after-force-merge-1-seg</code></td>
        <td>64</td>
        <td>62</td>
        <td>67</td>
        <td>3%</td>
        <td>-5%</td>
    </tr>
    <tr>
        <td><code>desc-sort-with-after-timestamp-after-force-merge-1-seg</code></td>
        <td>67</td>
        <td>66</td>
        <td>68</td>
        <td>1%</td>
        <td>-1%</td>
    </tr>
    <tr class="ylw-clr">
        <td><code>desc_sort_size</code></td>
        <td>6</td>
        <td>91</td>
        <td>9</td>
        <td>-1417%</td>
        <td>-50%</td>
    </tr>
    <tr class="ylw-clr">
        <td><code>desc_sort_timestamp</code></td>
        <td>26</td>
        <td>34</td>
        <td>28</td>
        <td>-31%</td>
        <td>-8%</td>
    </tr>
    <tr>
        <td><code>desc_sort_with_after_timestamp</code></td>
        <td>63</td>
        <td>61</td>
        <td>63</td>
        <td>3%</td>
        <td>0%</td>
    </tr>
    <tr class="green-clr">
        <td><code>hourly_agg</code></td>
        <td>8180</td>
        <td>3832</td>
        <td>4034</td>
        <td>53%</td>
        <td>51%</td>
    </tr>
    <tr class="orange-clr">
        <td><code>multi_term_agg</code></td>
        <td>9818</td>
        <td>40015</td>
        <td>54107</td>
        <td>-308%</td>
        <td>-451%</td>
    </tr>
    <tr>
        <td><code>range</code></td>
        <td>15</td>
        <td>12</td>
        <td>13</td>
        <td>20%</td>
        <td>13%</td>
    </tr>
    <tr class="orange-clr">
        <td><code>scroll</code></td>
        <td>179</td>
        <td>375</td>
        <td>212</td>
        <td>-109%</td>
        <td>-18%</td>
    </tr>
    <tr>
        <td><code>term</code></td>
        <td>3</td>
        <td>3</td>
        <td>3</td>
        <td>0%</td>
        <td>0%</td>
    </tr>
</table>

* * *

*We would like to take this opportunity to thank the OpenSearch core developers for their contributions to the technical roadmap. We sincerely appreciate all the suggestions from Michael Froh, Andriy Redko, Jonah Kowall, Amitai Stern, Jon Handler, Prabhakar Sithanandam, Mike McCandless, Anandhi Bumstead, Eli Fisher, Carl Meadows, and Mukul Karnik in writing this blog post. Credits to Fanit Kolchina and Nathan Bower for editing and Carlos Canas for creating the graphics.*
