---
layout: post
title:  "Searchable snapshots are generally available in OpenSearch 2.7"
authors:
  - satnandi
date:   2023-04-27
categories:
  - technical-post
meta_keywords: searchable snapshots, search data segment in snapshots, searchable snapshot index, OpenSearch 2.7
meta_description: In OpenSearch 2.7, you can now search snapshots locally on your OpenSearch cluster with performance similar to UltraWarm storage. With searchable snapshots, you can search through less frequently accessed indexes saved as snapshots without having to restore them to the cluster beforehand.
---

The OpenSearch Project is excited to announce the general availability of searchable snapshots in OpenSearch. With searchable snapshots, you can search data segments within snapshots in remote repositories without first having to restore the index data to local storage. The relevant index data is retrieved on demand with the search request. Similarly to UltraWarm storage clusters, searchable snapshots use the OpenSearch cluster itself, caching data on local storage to improve the performance. For more information, see the [UltraWarm Storage documentation](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/ultrawarm.html). In this blog post, we will cover the design and implementation of searchable snapshots, their performance, and planned future enhancements. 

Before searchable snapshots, searching the data in remote snapshots required restoring the snapshots to the OpenSearch cluster node. Thus, in order to search snapshots, you had to expand your infrastructure with larger OpenSearch nodes. 

The searchable snapshots feature caches frequently used data segments in cluster nodes, removing the least used data segments from the cluster nodes to make space for frequently used ones. The data segments downloaded from snapshots on block storage reside alongside the general indexes of the cluster nodes. As a result, the computing capacity of cluster nodes is shared between indexing, local search, and data segment search in a snapshot that resides in lower-cost object storage, like Amazon Simple Storage Service (Amazon S3). While cluster node resources are utilized much more efficiently, the large number of tasks results in slower snapshot searches. Additionally, the local storage of the node is used for caching the snapshot data. Therefore, you can search snapshots stored in lower-cost storage, like Amazon S3, with acceptable performance.

The following image shows the creation of an index using a remote storage option, such as Amazon S3.

![Searchable Snapshots](/assets/media/blog-images/search_snap.png){: .img-fluid}

## Enabling searchable snapshots in OpenSearch

To enable searchable snapshots, reference the [instructions](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/searchable_snapshot/) in the OpenSearch documentation.

## Using a snapshot for search

OpenSearch cluster nodes retrieve data from a snapshot and then cache it to the node's local storage. You can configure the amount of storage available for caching snapshot data or use the system defaults. Any subsequent searches on the cached data perform better because they are served from the node's local storage, or cache, without the need to redownload the segment data from the snapshot.

For a search request on data in an uncached snapshot, the data is downloaded from the snapshot's object store. If a node's cache is full, OpenSearch clears data segments from the cache using the Least Recently Used (LRU) caching strategy, removing the least recently used segments first.

## Performance

When cached data is searched repeatedly, searchable snapshots provide consistent search performance and throughput. Performance is slow the first time the snapshot data is accessed, but subsequent searches are comparable in performance to regular OpenSearch cluster searches. Note, however, that the ratio of cache size to the combined size of the searchable snapshot, along with the search pattern, will factor into performance. The more data the cache misses, the lower the overall performance. In the next section, we cover the performance results of our benchmark testing.

Note that searchable snapshots cannot be deleted until the `searchable` flag on these snapshots is removed. Follow the snapshot [configuration steps]({{site.url}}{{site.baseurl}}/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/) in order to remove the flag.

## Benchmarks

For the following benchmarks, the OpenSearch benchmark workload was configured with 0 warmup iterations so that the cache was not populated when the measurements started. The test aimed to achieve 1.5 operations per second. `search_clients` was configured to 16 to match the number of CPU cores on the hosts. For searchable snapshots, the test was performed immediately after creating the searchable snapshot index. For UltraWarm, the test was performed immediately after migrating the index to the warm tier so that the cache was minimally warmed in both test cases.

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

In OpenSearch 2.7, you can now search snapshots locally on your OpenSearch cluster with performance similar to UltraWarm storage. With searchable snapshots, you can search through less frequently accessed indexes saved as snapshots without having to restore them to the cluster beforehand. 

## Things to consider

Here are a couple of things to keep in mind when using searchable snapshots:

- No prefetch logic: In the absence of any prefetch algorithm, data is not fetched until there is an explicit search on the data segment. This will cause every initial search to be slow.
- When managing resource-intensive searches on snapshot data, other OpenSearch cluster activities, like indexing, may be slower.

## Future enhancements

The following are planned future enhancements to searchable snapshots:

1. Searching on a remote store index (mutable).
1. Intelligent prefetch.
1. Safeguards against long or large searches, avoiding impact on hot node activities.
1. Concurrent search to improve search performance.

## Try searchable snapshots

Make sure to [download OpenSearch 2.7](https://opensearch.org/downloads.html) and try out searchable snapshots. For detailed information about searchable snapshots, see [Searchable snapshots](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/searchable_snapshot/) in the OpenSearch documentation.
