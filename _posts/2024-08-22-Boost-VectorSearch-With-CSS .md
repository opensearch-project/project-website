---
layout: post
title:  "Boosting Vector Search Performance With Concurrent Segment Search"
authors:
- vijayanb
- navneev
- vamshin
date: 2024-08-22
categories:
  - technical-posts
  - search
meta_keywords: concurrent segment search, search concurrency, vector search, k-NN
meta_description: With concurrent segment search enabled, vector search brings 60% improvements in service time by just utilizing additional 25-35% of CPU.
has_math: true
has_science_table: true
---
# Boosting Vector Search performance with Concurrent Segment Search

## Background

In OpenSearch, data is stored in shards, and each shard is further divided into segments. When a search query is executed, it needs to be run across all segments of each shard involved in the query. This process is done sequentially, meaning that the query is executed on one segment at a time within a shard. As the number of segments grows larger, this sequential execution can impact the query latency (the time it takes to retrieve the results). This is because the query has to wait for each segment to complete before moving on to the next one, which can introduce delays, especially if some segments are slower than others.
The Concurrent Segment Search feature in OpenSearch addresses this issue by allowing the query to be executed in parallel across multiple segments within a shard by taking advantage of available computing resources. By parallelizing the search across segments, Concurrent Segment Search helps reduce the overall query latency, especially for larger datasets with many segments. This feature aims to provide more predictable and consistent latencies, as the query execution time becomes less dependent on the number of segments or the performance variations between individual segments.

This feature has been introduced in 2.12 version of OpenSearch. In this blog we present the concurrent search impact on vector search workloads

## Enable Concurrent Segment Search

By default, concurrent segment search is not enabled in OpenSearch. Hence, for this experiments we enabled concurrent segment search for all indexes in this cluster by setting the following dynamic cluster setting:


```
PUT _cluster/settings
{
   "persistent":{
      "search.concurrent_segment_search.enabled": true
   }
}
```


In order to search segments concurrently, for each shard, OpenSearch divides the segments into multiple slices, where each slice can be executed in parallel on separate thread. Hence, number of slice actually controls the degree of parallelism that OpenSearch can provide. You can choose one of two available mechanism for assigning segments to slices, (i) Lucene’s mechanism ( default ) (ii) update max slice count . You can check opensearch documentation to see how to update slice count [here](https://opensearch.org/docs/latest/search-plugins/concurrent-segment-search/#slicing-mechanisms).

## Performance results

With [OpenSearch 2.15](https://opensearch.org/versions/opensearch-2-15-0.html), we did benchmarks using OpenSearch Benchmark [vector search workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/vectorsearch) . We selected cohere dataset with two different configuration to understand the improvement in performance of vector search query by running workload with disabled concurrent search, enabled with default setting and at last, enabled with different max slice counts.

### Cluster setup

* 3 Data Nodes with instance type r5.4xlarge ( 128 GB RAM and 16 vCPUs ) and 250 GB disk space
* 3 Cluster Manager with instance type r5.xlarge ( 32 GB RAM and 4 vCPUs ) and 50 GB disk space
* 1 OpenSearch Workload Client with instance type c5.4xlarge ( 32 GB RAM and 16 vCPUs )
* 1 Search Client and 4 Search Clients
* index_searcher thread pool size is 32

#### **Index Settings**

|m	|ef_construction	|ef_search	|shards	|replica count	|Space Type	|
|---	|---	|---	|---	|---	|---	|
|16	|100	|100	|6	|1	|inner product	|

### Service Time Comparison

#### **Experiment  configuration 1**

|Parameters	|Value	|
|---	|---	|
|Dimension	|768	|
|Vector Count	|10M	|
|Search Query Count	|10K	|
|Concurrent Segment Search	|Disabled	|
|Refresh Interval	|1s ( default )	|



**Results**

|KNN Engine	|Segment Count	|No of Search Clients	|Service Time (ms)	|Max CPU %	|JVM Heap Used %	|Recall	|
|---	|---	|---	|---	|---	|---	|---	|
|P50	|P90	|P99	|
|Lucene	|381	|1	|30	|37	|45	|11	|53.48	|0.97	|
|4	|36	|43	|51	|38	|42%	|0.97	|
|Nmslib	|383	|1	|28	|35	|41	|10	|47.5	|0.97	|
|4	|35	|41	|46	|36	|48.06	|0.97	|
|Faiss	|381	|1	|29	|37	|42	|10	|47.85	|0.97	|
|4	|36	|40	|44	|38	|46.38	|0.97	|

#### **Experiment  configuration 2
**

|Parameters	|Value	|
|---	|---	|
|Dimension	|768	|
|Vector Count	|10M	|
|Search Query Count	|10K	|
|Concurrent Segment Search	|Enabled	|
|Refresh Interval	|1s ( default )	|
|max slice count	|0 ( default )	|

**Results**

|Engine Type	|Segment Count	|Observed Slice Count	|No of Search Clients	|Service Time (ms)	|Max CPU %	|JVM Heap Used %	|Recall	|
|---	|---	|---	|---	|---	|---	|---	|---	|
|P50	|P90	|P99	|
|Lucene	|381	|10	|1	|13	|15	|17	|47	|47.99	|0.97	|
|	|4	|27	|32	|37	|81	|45.95	|0.97	|
|Nmslib	|383	|	|1	|13	|14	|16	|38	|47.28	|0.97	|
|	|4	|24	|27	|32	|75	|44.76	|0.97	|
|Faiss	|381	|	|1	|13	|14	|16	|34	|46.04	|0.97	|
|	|4	|25	|28	|33	|76	|47.72	|0.97	|

#### **Experiment  configuration 3**

|Parameters	|Value	|
|---	|---	|
|Dimension	|768	|
|Vector Count	|10M	|
|Search Query Count	|10K	|
|Concurrent Segment Search	|Enabled	|
|Refresh Interval	|1s ( default )	|
|max slice count	|2	|

|Engine Type	|Segment Count	|No of Search Clients	|Service Time (ms)	|Max CPU %	|JVM Heap Used %	|Recall	|
|---	|---	|---	|---	|---	|---	|---	|
|P50	|P90	|P99	|
|Lucene	|381	|1	|14	|16	|19	|41	|52.91	|0.97	|
|4	|28	|34	|42	|88	|51.65	|0.97	|
|Nmslib	|383	|1	|20	|23	|25	|16	|44.97	|0.97	|
|4	|23	|27	|33	|60	|41.06	|41.06	|
|Faiss	|381	|1	|20	|22	|24	|19	|46.42	|0.97	|
|4	|23	|26	|32	|67	|37.23	|0.97	|



#### **Experiment  configuration 4**

|Parameters	|Value	|
|---	|---	|
|Dimension	|768	|
|Vector Count	|10M	|
|Search Query Count	|10K	|
|Concurrent Segment Search	|Enabled	|
|Refresh Interval	|1s ( default )	|
|max slice count	|4	|

|Engine Type	|Segment Count	|No of Search Clients	|Service Time (ms)	|Max CPU %	|JVM Heap Used %	|Recall	|
|---	|---	|---	|---	|---	|---	|---	|
|P50	|P90	|P99	|
|Lucene	|381	|1	|13.6	|15.9	|17.6	|49	|53.37	|0.97	|
|4	|28	|33	|41	|86	|50.12	|0.97	|
|Nmslib	|383	|1	|14	|15	|16	|29	|51.12	|0.97	|
|4	|21	|25	|31	|72	|42.63	|0.97	|
|Faiss	|381	|1	|14	|15	|17	|30	|41.1	|0.97	|
|4	|23	|28	|37	|77	|44.23	|0.97	|



#### **Experiment  configuration 5**

|Parameters	|Value	|
|---	|---	|
|Dimension	|768	|
|Vector Count	|10M	|
|Search Query Count	|10K	|
|Concurrent Segment Search	|Enabled	|
|Refresh Interval	|1s ( default )	|
|max slice count	|8	|

|Engine Type	|Segment Count	|No of Search Clients	|Service Time (ms)	|Max CPU %	|JVM Heap Used %	|Recall	|
|---	|---	|---	|---	|---	|---	|---	|
|P50	|P90	|P99	|
|Lucene	|381	|1	|14	|16	|18	|43	|45.37	|0.97	|
|4	|28	|34	|43	|87	|48.79	|0.97	|
|Nmslib	|383	|1	|10	|12	|14	|41	|45.21	|0.97	|
|4	|23	|25	|29	|75	|45.87	|0.97	|
|Faiss	|381	|1	|15	|16	|17	|44	|48.68	|0.97	|
|4	|23	|26	|32	|79	|47.19	|0.97	|



## Compare Results

For simplicity we will be considering only P90 out of P50, P90 and P99 metrics from above experiments for single search client, since this will capture most of long running vector search queries.

### Service Time Comparison ( P90)

|engine type	|Concurrent segment search disabled	|Concurrent segment search enabled ( Lucene default slices )	|% boost	|Concurrent Segmenet Search with max_slice_count=2	|% boost	|Concurrent Segmenet Search with max_slice_count=4	|% boost	|Concurrent Segmenet Search with max_slice_count=8	|% boost	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|Lucene	|37	|15	|59.5	|16	|56.8	|15.9	|57	|16	|56.8	|
|Nmslib	|35	|14	|60	|23	|34.3	|15	|57.1	|12	|65.7	|
|Faiss	|37	|14	|62.2	|22	|40.5	|15	|59.5	|16	|56.8	|



### CPU Utilization Comparison

|engine type	|Concurrent segment search disabled	|Concurrent segment search enabled ( Lucene default slices )	|% Additional CPU Utilization	|Concurrent Segmenet Search with max_slice_count=2	|% Additional CPU Utilization	|Concurrent Segmenet Search with max_slice_count=4	|% Additional CPU Utilization	|Concurrent Segmenet Search with max_slice_count=8	|% Additional CPU Utilization	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|Lucene	|11	|47	|36	|41	|30	|49	|38	|43	|32	|
|Nmslib	|10	|38	|28	|16	|6	|29	|19	|41	|31	|
|Faiss	|10	|34	|24	|19	|9	|30	|20	|44	|34	|


When we compare concurrent search using default slice count to not using concurrent segment search, we see at least **60% improvements** in service time by just utilizing **additional 25-35% of CPU**. This additional CPU utilization is expected since there are more number of CPU threads `( 2 * number of cpu cores )` are being used with concurrent segment search.

We also observed similar trend with multiple concurrent search clients regarding improvement in service time. With respect to max CPU utilization, we see CPU usage doubled as expected since the number of active concurrent search threads also increases.


## Conclusion

From above experiments it is very clear that concurrent segment search with default slice count improves the performance of vector search query at the cost of consuming more CPU utilization. However, as per our recommendation, when choosing a segment slice count to use, it is important to test your workload to understand whether additional parallelization produced by increasing slice count outweighs the additional processing overhead.

Before concurrent segment search, we recommended users to force merge into single segments to get better performance. The major drawback of this process is that force merge time increases when segments gets larger and larger. With concurrent segment search, and reducing to reasonable number of segments, customers can see better results with respect to vector search queries than before.
