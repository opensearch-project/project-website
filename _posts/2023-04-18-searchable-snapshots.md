---
layout: post
title:  "Searchable snapshots are generally available in OpenSearch 2.7"
authors:
  - satnandi
  - andrross
date:   2023-04-27
categories:
  - technical-post
meta_keywords: searchable snapshots, search data segment in snapshots, searchable snapshot index, OpenSearch 2.7
meta_description: In OpenSearch 2.7, you can now search snapshots locally on your OpenSearch cluster. With searchable snapshots, you can search through less frequently accessed indexes saved as snapshots without having to restore them to the cluster beforehand.
has_science_table: true
---

The OpenSearch Project is excited to announce the general availability of searchable snapshots in OpenSearch. With searchable snapshots, you can search indexes that are stored as snapshots within remote repositories in real time without the need to restore the index data to local storage ahead of time. The relevant index data is retrieved on demand with the search request. Searchable snapshots cache data on local storage to improve the performance. In this blog post, we will cover the design and implementation of searchable snapshots, their performance, and planned future enhancements. 

## Using a snapshot for search

Before searchable snapshots, searching data within a snapshot required restoring the entire snapshot to the OpenSearch cluster node. This involved expanding your infrastructure, which is costly and time-consuming. 

The searchable snapshots feature caches frequently used data segments in cluster nodes, using the Least Recently Used (LRU) caching strategy to remove the least used data segments from the cluster nodes in order to make space for frequently used ones. The data segments downloaded from snapshots on block storage reside alongside the general indexes of the cluster nodes. The local storage of the node is used for caching the snapshot data. Any subsequent searches on the cached data perform better because they are served from the node's local storage, or cache, without the need to redownload the segment data from the snapshot. Therefore, you can search snapshots stored in lower-cost storage, like Amazon S3, with acceptable performance. 

The following image shows the creation of an index using a remote storage option, such as Amazon S3.

![Searchable Snapshots](/assets/media/blog-images/search_snap.png){: .img-fluid}

## Enabling searchable snapshots in OpenSearch

To enable searchable snapshots, reference the [instructions](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/searchable_snapshot/) in the OpenSearch documentation.

## Performance

Comparing the performance of searchable snapshot queries and local index queries on the `stackoverflow` dataset, the initial run of searchable snapshots took approximately twice as long as the local index. However, subsequent queries showed similar performance for both searchable snapshots and local index because searchable snapshots used cached data. 

The following table presents the time in seconds taken to scan approximately 36 million documents in the [`stackoverflow`](https://www.kaggle.com/datasets/stackoverflow/stackoverflow) dataset using the Scroll API in a single-threaded test runner.

| | **Local index** | **Searchable snapshot** |
|:--- | --- | --- |
| First scan | 588 | 1233 |
| Repeat scan | 590 | 641 |

Note that searchable snapshots cannot be deleted until the `searchable` flag on these snapshots is removed. Follow the snapshot [configuration steps]({{site.url}}{{site.baseurl}}/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/) in order to remove the flag.

## Benchmarks

For the following benchmarks, the OpenSearch benchmark workload was configured with 0 warmup iterations so that the cache was not populated when the measurements started. The test aimed to achieve 1.5 operations per second. `search_clients` was configured to 16 to match the number of CPU cores on the hosts. For searchable snapshots, the test was performed immediately after creating the searchable snapshot index. 

| | **Local index** | **Searchable snapshot** | 
| :--- | --- | --- |
| **Throughput (search ops/s)** | | |
| Minimum | 0.45 | 0.05 | 
| Mean | 1.48 | 1.38 | 
| Median | 1.50 | 1.45 | 
| Max | 1.50 | 1.47 | 
| **Latency (ms)** | | 
| p50 | 1,065.84 | 1,111.07 | 
| p90 | 1,099.68 | 1,162.98 | 
| p99 | 1,177.59 | 11,287.20 | 
| p99.9 | 2,212.63 | 20,595.50 | 
| p100 | 2,212.72 | 20,596.00 | 

In OpenSearch 2.7, you can now search snapshots locally on your OpenSearch cluster. With searchable snapshots, you can search through less frequently accessed indexes saved as snapshots without having to restore them to the cluster beforehand. 

## When to use searchable snapshots

Use searchable snapshots with less frequently accessed data that is not sensitive to latency.

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
