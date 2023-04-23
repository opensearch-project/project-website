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

The OpenSearch Project is excited to announce the general availability of searchable snapshots in OpenSearch. With searchable snapshots, users can search data segments within snapshots in remote repositories without first having to restore the index data to local storage. The relevant index data is retrieved on-demand with the search request. Searchable snapshots is similar to the UltraWarm storage cluster behavior, using the OpenSearch cluster itself, and employs caching the data on local storage to improve the performance. For further information, see the [UltraWarm Storage documentation](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/ultrawarm.html). In this blog post, we will cover the design and implementation of searchable snapshots, performance, and future enhancements. 

Before searchable snapshots, users had to restore remote snapshots to the OpenSearch cluster node in order to search the data in the snapshots. This required users to size up their infrastructure with larger OpenSearch nodes. 

The searchable snapshot feature incorporates techniques like caching frequently used data segments in cluster nodes and removing the least used data segment from the cluster nodes to make space for frequently used data segments. The data segments downloaded from snapshots on block storage reside alongside the general indexes of the cluster nodes. As such, the computing capacity of cluster nodes is shared between indexing, local search, and data segments on a snapshot residing on lower-cost object storage like Amazon Simple Storage Service (Amazon S3). While cluster node resources are utilized much more efficiently, the high number of tasks results in slower and longer snapshot searches. The local storage of the node is also used for caching the snapshot data. As such, users can search snapshots stored in a lower-cost storage like Amazon S3 with acceptable performance.

The following image demonstrates the creation of an index using a remote storage option, such as Amazon S3.

![Searchable Snapshots](/assets/media/blog-images/search_snap.png){: .img-fluid}

## Enabling searchable snapshot in OpenSearch

To enable searchable snapshots, reference the [instructions](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/searchable_snapshot/) in the OpenSearch documentation.

## Using a snapshot for search

OpenSearch cluster nodes will retrieve data from a snapshot and then cache it to the node's local storage. You can then configure the amount of storage available for caching snapshot data, or use the system defaults which are based on predetermined logic. Any subsequent searches on the cached data is then served from the node's local storage, or cache, without the need to download the segment data again from the snapshot, which improves performance.

Whenever there is a search request on data in a snapshot that is not cached, the data is downloaded from the object-store of the snapshot. If a node's cache is full, OpenSearch will use the Least Recently Used (LRU) caching strategy, which will clear data segments from the cache to make room for new segments, clearing out the least recently used items first.

## Performance

When cached data is searched repeatedly, searchable snapshots provide a good level of search performance and throughout. The first access of the snapshot data is slow, but subsequent searches are comparable to regular OpenSearch cluster searches. Please note however that the ratio of cache size to the combined size of the searchable snapshot, along with the search pattern, will factor into performance. The more data the cache misses, the lower the overall performance of searchable snapshot will be. In the next section of this blog post, we cover the performance results from our benchmarks testing.

Note that any snapshots that are enabled for search cannot be deleted until the "searchable" flag on these snapshots is removed. Follow the snapshot [configuration steps]({{site.url}}{{site.baseurl}}/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/) in order to remove the snapshot from search.

## Benchmarks

For the following benchmarks, the OpenSearch benchmark workload was configured with 0 warmup iterations so that the cache was not populated when the measurements started. The test aimed to achieve 1.5 operations per second. “search_clients” was configured to 16 to match the number of CPU cores on the hosts. For searchable snapshots, the test was performed immediately after creating the searchable snapshot index. For UltraWarm, the test was performed immediately after migrating the index to the warm tier so that the cache was minimally warmed in both test cases.

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

With OpenSearch 2.7, you now have the capability to search snapshots on your OpenSearch cluster with performance similar to UltraWarm. With this, you can search through less frequency accessed indices saved as snapshot without having to restore them on to the cluster beforehand. 

## Things to consider

There are a couple of caveats to keep in mind when using searchable snapshots:

- No prefetch logic: In absence of any prefetch algorithm, data is not fetched until there is an explicit search on the data segment. This will cause every initial search to be slow.
- When managing large searches on snapshots, other OpenSearch cluster activities like indexing may be slower.

## Future enhancements

Please look forward to the following future enhancements coming to searchable snapshots:

1. Searching on a remote store index (mutable).
1. Intelligent prefetch.
1. Safeguards from long or large searches, avoiding impact on hot node activities.
1. Concurrent search to improve search performance.
