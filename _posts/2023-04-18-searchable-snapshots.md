---
layout: post
title:  "Searchable Snapshots GA Release"
authors:
  - satnandi
date:   2023-04-27
categories:
  - technical-post
meta_keywords: searchable snapshots, search data segment in snapshots, searchable snapshot index, OpenSearch 2.7
meta_description: Go deeper into the design and implementation of searchable snapshots with OpenSearch, including performance characteristics and future enhancements.
---

We are excited to announce the general availability of Searchable Snapshot on the OpenSearch platform. With Searchable Snapshot feature, users can search data segment in snapshots in remote repositories without having to restore the index data in entirety to local disk first. The relevant index data is fetch on-demand on the search request. Searchable Snapshot resembles the UltraWarm Storage Cluster behavior using the OpenSearch cluster itself. Refer to [UltraWarm Storage documentation](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/ultrawarm.html) for details. The system employs caching the data on local disk storage to improve the performance of the search.  In this blog post, we will go deeper into design and implementation details of Searchable snapshot, performance characteristics and future enhancements. 

Before Searchable Snapshot, customers had to  restore the snapshots on the OpenSearch Cluster node to search data in the snapshots. This requires users to beef up the infrastructure with larger OpenSearch Cluster nodes. 

The searchable snapshot feature incorporates techniques like caching frequently used data segments in cluster nodes and removing the least used data segment from the cluster nodes to make space for frequently used data segments. The data segments downloaded from snapshots on block storage reside alongside the general indexes of the cluster nodes. As such, the computing capacity of cluster nodes is shared between indexing, local search, and data segments on a snapshot residing on lower-cost object storage like Amazon Simple Storage Service (Amazon S3). While cluster node resources are utilized much more efficiently, the high number of tasks results in slower and longer snapshot searches. The local storage of the node is also used for caching the snapshot data. Users can search snapshots stored in a lower-cost storage like Amazon S3 or Google GCP or Azure at acceptable performance.

![Searchable Snapshots](/assets/media/blog-images/search_snap.png){: .img-fluid}

## Enabling Searchable Snapshot in an OpenSearch Cluster

To enable Searchable snapshots, follow the step-by-step instructions (https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/searchable_snapshot/) in the documentation.

## Attaching snapshot for search 

OpenSearch cluster node will fetch the data from the Snapshot and cache it in the node's local storage. The user can configure the amount of storage available for caching snapshot data or let the system use the defaults based on predetermined logic. Any subsequent search on the cached data is served from the node's local store (Cache) without downloading the segment again from the Snapshot, which improves performance.

Whenever there is a search request on data in Snapshot (s) that is not cached, the data is downloaded from the snapshots from the object-store. If their cache is full, OpenSearch uses the Least Recently Used (LRU) is a common caching strategy, the policy to evict data segments from the cache to make room for new segments downloaded from Snapshot when the cache is full, meaning it discards the least recently used items first.

## Performance

Searchable snapshot provides good search performance/throughout when the cached data is searched again and again. The first read is slow but subsequent search performance are comparable with classic OpenSearch cluster search. The ratio of cache size to the combined size of the searchable snapshot and search pattern will factor into the performance. The higher the cache misses, the lower the overall performance of the searchable snapshot system. Later in the blog, we share the performance results of our benchmarks testing. 

Any snapshots which are enabled for search cannot be deleted until it is searchable flag on these snapshots are disabled. Follow the configuration [steps]({{site.url}}{{site.baseurl}}/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/) to disable the snapshot from search.

## Benchmarks

The OSB benchmark workload is configured for 0 warmup iterations so that the cache is not populated when measurements start. The test aims to achieve 1.5 ops/s. “search_clients” is set to 16 to match the number of processor cores on the service hosts. For searchable snapshots, the test is performed immediately after creating the searchable snapshot index and for UltraWarm, the test is performed immediately after migrating the index to the warm tier so that in both cases the cache is minimally warmed.

<table><colgroup><col /><col /><col /><col /><col /></colgroup>
<tbody>
<tr>
<td><strong>Normal Index</strong></td>
<td><strong>Searchable Snapshot</strong></td>
<td><strong>Searchable Snapshot (single segment)</strong></td>
<td><strong>UltraWarm</strong></td>
</tr>
<tr>
<td><strong>Throughput (search ops/s)</strong></td>
</tr>
<tr>
<td>min</td>
<td>0.45</td>
<td>0.05</td>
<td>0.05</td>
<td>0.05</td>
</tr>
<tr>
<td>mean</td>
<td>1.48</td>
<td>1.38</td>
<td>1.40</td>
<td>1.38</td>
</tr>
<tr>
<td>median</td>
<td>1.50</td>
<td>1.45</td>
<td>1.45</td>
<td>1.45</td>
</tr>
<tr>
<td>max</td>
<td>1.50</td>
<td>1.47</td>
<td>1.48</td>
<td>1.47</td>
</tr>
<tr>
<td><strong>Latency (ms)</strong></td>
</tr>
<tr>
<td>p50</td>
<td>1,065.84</td>
<td>1,111.07</td>
<td>1,163.01</td>
<td>1,115.59</td>
</tr>
<tr>
<td>p90</td>
<td>1,099.68</td>
<td>1,162.98</td>
<td>1,304.18</td>
<td>1,228.05</td>
</tr>
<tr>
<td>p99</td>
<td>1,177.59</td>
<td>11,287.20</td>
<td>10,165.70</td>
<td>10,827.60</td>
</tr>
<tr>
<td>p99.9</td>
<td>2,212.63</td>
<td>20,595.50</td>
<td>19,323.90</td>
<td>20,186.10</td>
</tr>
<tr>
<td>p100</td>
<td>2,212.72</td>
<td>20,596.00</td>
<td>19,324.00</td>
<td>20,186.40</td>
</tr>
</tbody>
</table>

The 2.7 OpenSearch release provides capability to search snapshots on their active OpenSearch clusters at acceptable performance similar to UltraWarm. With this, customers can search through less frequency searched indices saved as snapshot without having to restore them on to the cluster. 

## Caveats

- No prefetch logic: In absence of any prefetch algorithm, the data is not fetched until there is an explicit search on the data segment. This will cause every first search to be slow.
- Managing large search on snapshot, which might slow other OpenSearch Cluster activities like indexing.

## Future plans

1. Search on remote store index (mutable)
1. Intelligent prefetch
1. Safeguards from long/large searches and avoid impact on hot node activities.
1. Concurrent search to improve the search performance.
