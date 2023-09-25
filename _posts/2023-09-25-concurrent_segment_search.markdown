---
layout: post
title:  "Introduction to Concurrent Segment Search in OpenSearch"
authors: 
  - reta
  - sohami
date:   2023-09-25
categories: 
  - search
categories:
  - technical-post
meta_keywords: concurrent segment search, search performance, search concurrency, OpenSearch 2.10
meta_description: In OpenSearch 2.10, you can now enable concurrent segment search experimental feature in your OpenSearch cluster. With concurrent segment search, you can search through shard segments parallely and improve search performance for your workload.
has_science_table: true
---

## Overview
OpenSearch is a scalable, flexible, and extensible open-source search and analytics engine. It is built on top of [Apache Lucene](https://lucene.apache.org) and uses its powerful capabilities to ingest user data and serve search requests with latency in milliseconds.

Users are always looking for ways to improve their search performance. For latency-sensitive use cases, users are fine with scaling 
their clusters for improved latency at the cost of adding more resources. There are also users who already have available resources in their cluster and are still unable to improve the latency of their search requests. Apache Lucene constantly improves the search algorithms and heuristics, and OpenSearch incorporates these improvements into its engine. Some of those are straightforward optimizations but others require significant system redesign. Concurrent segment search is a feature that requires non-trivial changes but improves search latency across a variety of workload types.

## Background
Before digging into concurrent search, let’s briefly talk about how OpenSearch stores indexes and handles search requests. OpenSearch is 
a distributed system, usually deployed as a cluster of nodes. Each cluster has one or more data nodes where the indexes are being stored. Each index is split into smaller chunks called shards, which are scattered across data nodes. In turn, each shard is an Apache Lucene index, which is composed of segments, each holding a subset of indexed documents.

<img src="/assets/media/blog-images/2023-09-25-concurrent-segment-search/os-intro.png" alt="Example of OpenSearch cluster layout"/>{: .img-fluid}

The sharding technique allows OpenSearch to scale over massive amounts of data. However, efficiently servicing search queries becomes a challenge.


OpenSearch follows a scatter/gather mechanism when executing search requests and returning responses to the client. When a search 
request lands on a cluster node, that node acts as a coordinator for this request. The coordinator determines which indexes and shards will be used to serve a search request and then orchestrates different phases of the search request such as `can_match`, `dfs`, `query`, and `fetch`. Depending on the search request type, one or more phases will be executed. For example: for a request with size=0, the fetch phase is omitted and only the query phase is executed.
For now, we will focus on the query phase, where actual processing and collection of documents happen for a search request. After identifying the shards, the coordinator node sends an internal request (let’s call it shard search request) to each of the shards in batches (limiting the number of shard search requests sent to each node in parallel). When each shard responds back with its set of documents, the coordinator merges the responses and sends the final response back to the client.

<img src="/assets/media/blog-images/2023-09-25-concurrent-segment-search/os-search-flow.png" alt="Search request scatter-gather protocol"/>{: .img-fluid}

When a shard receives a search request, it tries to rewrite the query (as needed), creating internal objects such as query, weights, and collector tree needed to process this request using Lucene. These represent the various clauses or operations like filters, terminate_after, or aggregations defined in the body of the search request. Once the setup is completed then Lucene’s search API is called to perform the search on all the segments of that shard sequentially. For each segment, Lucene applies the filter/boolean clauses to identify and score matching documents. Then the matched documents are passed through the collector tree to collect the matched document IDs. For example, TopDocsCollector collects top matching documents, while different BucketCollector aggregate matching document values depending on the aggregation type. Once all the collection is performed for the matching documents, OpenSearch performs post processing to create the final shard-level results. For example, aggregations perform post processing where an internal representation for each aggregation result (InternalAggregation) is created that is sent back to the coordinator node. On the coordinator node, all aggregation results are accumulated across shards and reduced to create the final aggregation output in the search response.

<img src="/assets/media/blog-images/2023-09-25-concurrent-segment-search/os-non-concurrent.png" alt="Low level query phase execution in non-concurrent path"/>{: .img-fluid}

## Concurrent Segment Search

In the early days of Apache Lucene, the index searcher had been enhanced with a new experimental capability to traverse segments concurrently. In theory, concurrent segment search offers noticeable improvements of search latency by searching segments using multiple threads

The first implementation of concurrent segment traversal landed in OpenSearch 2.0.0 as a sandbox plugin (see https://github.com/opensearch-project/OpenSearch/pull/1500). Then later we decided to close all the gaps (such as support for aggregations, profile API enhancement, stats, etc) and move the feature towards GA readiness (see https://github.com/opensearch-project/OpenSearch/issues/6798). So why is the concurrent segment search game changer for certain workloads?

Concurrent segment search uses the Lucene capability to process the shard search request in the query phase described in the previous section. There is no change in flow between the coordinator node and the shards. For shard search requests, instead of searching and collecting the matched documents one segment at a time, concurrent segment search performs the collection across segments concurrently. In the concurrent search model, all the segments for a shard are divided into multiple work units called slices. To compute the slice count for each request, by default, OpenSearch uses the Lucene heuristic that allows up to a maximum of 250,000 documents or 5 segments per slice, whichever is met first. Each slice will have one or more segments assigned to it and each shard search request will have one or more slices created for it. Each slice is executed on a separate thread in the provided index_searcher threadpool, which is shared across all the shard search requests. Once all the slices complete their execution, they perform a reduction on the collected results to create the final shard-level result to be sent to the coordinator node.

To achieve this parallel execution model, Apache Lucene applied a scatter/gather pattern and introduced a CollectorManager interface, 
which provides two methods: a) `newCollector` and b) `reduce`. For each shard search request, OpenSearch creates a `CollectorManager` 
tree (with concurrent search flow) instead of a `Collector` tree and passes this `CollectorManager` tree to the Apache Lucene search API.
Depending on the computed *slice* count, Apache Lucene creates a Collector tree using `CollectorManager::newCollector` for each of the slices. Once all the slice execution is completed, Lucene calls `CollectorManager::reduce` to reduce the results collected across Collector instances of each slice. This means each operation supported in Apache Lucene or OpenSearch that needs to support the concurrent model needs to have a corresponding `CollectorManager` interface implementation, which can create the corresponding thread-safe Collector tree. For native Lucene collectors, CollectorManager implementations are supported out of the box. For collectors implemented in OpenSearch, CollectorManager implementation needs to be added (For example:  for `MinimumCollectorManager` and for handling all aggregations, we implemented `AggregationCollectorManager`).

<img src="/assets/media/blog-images/2023-09-25-concurrent-segment-search/os-concurrent-search.png" alt="Low level query phase execution in concurrent path"/>{: .img-fluid}

One of the challenges with Aggregation support is that there are closer to 50 different Aggregation collectors supported in OpenSearch. To support concurrent search, we explored different options (see this issuehttps://github.com/opensearch-project/OpenSearch/issues/6798). We were looking for a mechanism where we can support the reduce operation on different aggregation types in a generic way instead of handling it for each aggregation collector separately. Using that tenet, we realized that today the reduce of Aggregations is performed for the results across shards on the coordinator node and we can apply the similar mechanism to the slice-level reduction on the shards. Thus, for search requests that include an aggregation operation with concurrent search enabled, a similar reduce operation will happen on shards for results across slices and then another reduce will happen on the coordinator for collecting results across shards.

## Performance Results

Currently, the feature is launched in [2.10 as an experimental](https://opensearch.org/docs/latest/search-plugins/concurrent-segment-search/) and not recommended to be used in production. We are working on resolving all 
the issues found along the way to ensure it is stable for production environments. You can track these issues in [this project board](https://github.com/orgs/opensearch-project/projects/117/views/1) 
under the concurrent search section. With the current functionality in 
place, we collected very early benchmark results using the OpenSearch Benchmark [nyc_taxis workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/nyc_taxis) to gauge the impact of concurrent 
search on performance. The results are summarized in the following tables.

Currently, the feature is launched in  and not recommended to be used in production. We are working on resolving 
all the issues found along the way to ensure it is stable for production environments and those can be tracked in [this] project board 
under concurrent search section. With the current set of functionality in place we collected very early benchmark numbers using
the OpenSearch benchmark [nyc_taxis workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/nyc_taxis) to see the impact and below are the results:

### Cluster Setup 1:
* Instance Type: *r5.2xlarge*
* Node count: 1
* Shard count: 1
* Search client count: 1

#### Latency comparison (in ms):
| Workload Operation  | CS Disabled | CS Enabled (Lucene default slices) | %age improvement (+ve is better) | CS Enabled (Fixed slice count 4) | %age improvement (+ve is better) | 
|---------------------|-------------|------------------------------------|----------------------------------|----------------------------------|----------------------------------|
| default             | 4.4         | 4.6                                | -4%                              | 5                                | -13%                             | 
| range               | 234         | 81                                 | +65%                             | 91                               | +61%                             | 
| date_histogram_agg  | 582         | 267                                | +54%                             | 278                              | +52%                             | 
| distance_amount_agg | 15348       | 4022                               | +73%                             | 4293                             | +72%                             | 
| autohisto_agg       | 589         | 260                                | +55%                             | 273                              | +53%                             | 

#### Avg CPU Utilization:

| CS Disabled | CS Enabled (Lucene default slices) | CS Enabled (Fixed slice count 4) | 
|-------------|------------------------------------|----------------------------------|
| 12%         | 65%                                | 43%                              |

### Cluster Setup 2:
* Instance Type: *r5.8xlarge*
* Node count: 1
* Shard count: 1
* Search client count: 1

#### Latency comparison (in ms):
| Workload Operation  | CS Disabled | CS Enabled (Lucene default slices) | %age improvement (+ve is better) | CS Enabled (Fixed slice count 4) | %age improvement (+ve is better) | 
|---------------------|-------------|------------------------------------|----------------------------------|----------------------------------|----------------------------------|
| default             | 4.25        | 4.7                                | -10%                             | 4.1                              | -3%                              | 
| range               | 227         | 91                                 | +60%                             | 74                               | +67%                             | 
| date_histogram_agg  | 558         | 271                                | +51%                             | 255                              | +54%                             | 
| distance_amount_agg | 12894       | 3334                               | +74%                             | 3790                             | +70%                             | 
| autohisto_agg       | 537         | 286                                | +46%                             | 278                              | +48%                             | 

#### Avg CPU Utilization:

| CS Disabled | CS Enabled (Lucene default slices) | CS Enabled (Fixed slice count 4) | 
|-------------|------------------------------------|----------------------------------|
| 3%          | 14%                                | 11%                              |

These are the initial results and we plan to run other scenarios to see the effect of concurrent segment search on performance. We will 
follow-up with a blog post with other benchmark results covering more real world scenarios like with multiple clients and multiple 
shards per node and share the observations with you. This [meta issue](https://github.com/opensearch-project/OpenSearch/issues/9049) is tracking the benchmarking plan with different setups and scenarios. If you think there are other scenarios which are worth pursuing, leave your feedback on this issue. You can also contribute by running these scenarios or some other custom workloads and share the results with us.

## How to's:
To enable and use concurrent segment search in your cluster, follow the instructions in the concurrent search [documentation](https://opensearch.org/docs/latest/search-plugins/concurrent-segment-search/).

## Limitations:
There are a few areas where concurrent search is still not supported (for example, ParentJoinAggregation). To learn more, refer to the 
[limitations section of the documentation](https://opensearch.org/docs/latest/search-plugins/concurrent-segment-search/#limitations)

## Wrapping Up:
We are excited to support concurrent segment search in OpenSearch and run search requests even faster. We highly encourage you to try 
concurrent segment search in a non-production environment and provide feedback about any improvements, gaps, or issues we can help fix 
to make the feature more robust and user-friendly. You can track the progress of this feature using [this project board](https://github.com/orgs/opensearch-project/projects/117/views/1)

