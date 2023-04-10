---
layout: post
title:  "Searchable Snapshots GA Release"
authors:
  - satish-nandi
date:   2023-04-18
categories:
  - technical-post
meta_keywords: opensearch, searchable snapshots, OpenSearch 2.7
meta_description: The searchable snapshot feature incorporates technics like caching frequently used data segments in cluster nodes and removing the least used data segment from the cluster nodes in order to make space for frequency used data segments.
---

We are excited to announce the general availability of  Searchable Snapshot on the OpenSearch platform. With Searchable Snapshot feature, users can search data segment in snapshots in remote repositories without having to restore the index data in entirety to local disk first. The relevant index data is fetch on-demand on the search request. Searchable Snapshot resembles the UltraWarm Storage Cluster behavior using the OpenSearch cluster itself. Refer to UltraWarm Storage documentation for details. The system employs caching the data on local disk storage to improve the performance of the search.  In this blog post, we will go deeper into design and implementation details of Searchable snapshot, performance characteristics and future enhancements. 

Before Searchable Snapshot, customers had to  restore the snapshots on the OpenSearch Cluster node to search data in the snapshots. This requires users to beef up the infrastructure with larger OpenSearch Cluster nodes 

The searchable snapshot feature incorporates technics like caching frequently used data segments in cluster nodes and removing the least used data segment from the cluster nodes in order to make space for frequency used data segments. The data segments downloaded from snapshots on block storage reside alongside the general indexes of the cluster nodes. As such, the computing capacity of cluster nodes are shared between indexing, local search, and data segments on a snapshot residing on lower-cost object storage like Amazon S3.  While cluster node resources are utilized much more efficiently, the high number of tasks results in slower and longer snapshot searches. The local storage of the node is also used for caching the snapshot data.

## Enabling Searchable Snapshot in OpenSearch Cluster

To enable Searchable snapshots, follow the step-by-step instructions (https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/searchable_snapshot/) in the documentation.

## Attaching snapshot for search 

OpenSearch cluster node will fetch the data from the Snapshot and cache it in the node's local storage. The user can configure the amount of storage available for caching snapshot data or let the system use the defaults based on predetermined logic. Any subsequent search on the cached data is served from the node's local store (Cache) without downloading the segment again from the Snapshot, which improves performance.

Whenever there is a search request on data in Snapshot (s) that is not cached, the data is downloaded from the snapshots from the object-store. If their cache is full, OpenSearch uses the Least Recently Used (LRU) is a common caching strategy, the policy to evict data segments from the cache to make room for new segments downloaded from Snapshot when the cache is full, meaning it discards the least recently used items first.

## Performance expectations

Searchable snapshot provides good search performance/throughout when the cached data is searched again and again. The first read is slow but subsequent search performance are comparable with classic OpenSearch cluster search. The ratio of cache size to the combined size of the searchable snapshot and search pattern will factor into the performance. The higher the cache misses, the lower the overall performance of the searchable snapshot system. Later in the blog, we share the performance results of our benchmarks testing. 

Any snapshots which are enabled for search cannot be deleted until it is searchable flag on these snapshots are disabled. Follow the configuration steps to disable the snapshot from search *Add steps to disable the snapshot or point to documentation where this is noted.* 

## How to calculate the optimal OpenSearch Cluster node configuration for a given number of snapshots and size.

*add to this section screenshots from playground along with written material as applicable*

*add the details of the benchmark testing and results*

The 2.7 OpenSearch release provides capability to search snapshots on their active OpenSearch clusters at acceptable performance similar to UltraWarm.  With this, customers can search through less frequency searched indices saved as snapshot without having to restore them on to the cluster. 

As of current release we have a few caveats.  1) No prefetch logic : In absence of any prefetch algorithm, the data is not fetched until there is an explicit search on the data segment. This will cause every first search to be slow. 2) Managing large search on snapshot, which might slow other OpenSearch Cluster activities like indexing.

## Future plans:

1. Search on remote store index (mutable)
2. Intelligent prefetch
3. Safeguards from long/large searches and avoid impact on hot node activities.
4. Concurrent search to improve the search performance.