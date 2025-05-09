---
layout: post
title: "Improve OpenSearch cluster performance by separating search and indexing workloads"
authors:
  - naarcha
  - pudyoda
date: 2025-05-09
categories:
  - technical-posts
meta_keywords: OpenSearch, shard roles, indexing, search separation, performance tuning
meta_description: Learn how separating indexing and search workloads in OpenSearch can improve performance, scalability, and cost-efficiency using dedicated roles and node types.
---

All OpenSearch indexes consist of shards, with each document in an index stored in a shard.

Traditionally, OpenSearch defines two shard types: primary shards and replica shards. The primary shard handles both indexing and search operations, while replica shards maintain a copy of the primary shard's data to provide redundancy and serve search queries. You configure the number of shards at index creation time, and this number cannot be changed later without reindexing.

With the introduction of segment replication and remote storage in OpenSearch, this model has evolved. In segment replication, only the primary shard node performs indexing operations and writes segment files to a remote object store—such as Amazon S3, Google Cloud Storage, or Azure Blob Storage. Replica shards then download the segment files from the object store in parallel, eliminating the need to replay indexing operations on each replica.

## What’s new?

To separate indexing and search workloads, we've introduced new shard roles:

- **Write replicas**: Redundant copies of the primary shard. If a primary shard fails, a write replica can be promoted to primary to maintain write availability.
- **Search replicas**: Serve search queries exclusively and cannot be promoted to primaries.

For hardware separation between indexing and search workloads, we've introduced a new **search node role**. Primary shards and write replicas can be allocated to any node with the `data` role, while search replicas are allocated only to nodes with the `search` role. Nodes with the search role act as dedicated search-serving nodes.

The following diagram shows how data and search workloads are separated across node types in the cluster:

![OpenSearch cluster architecture for search and indexing separation](/assets/media/blog-images/2025-05-09-search-index-separation/rw-separation-architecture.png)

## Benefits

Separating indexing and search workloads provides the following benefits:

- **Parallel and isolated processing**: Improve throughput and predictability by isolating indexing and search.
- **Independent scalability**: Scale indexing and search independently by adding data or search nodes.
- **Failure resilience**: Indexing and search failures are isolated, improving availability.
- **Cost efficiency and performance**: Use specialized hardware—compute-optimized for indexing, memory-optimized for search.
- **Tuning flexibility**: Optimize performance settings like buffers and caches independently for indexing and search.

## Enabling indexing and search separation

For detailed instructions, see [Separate index and search workloads](https://docs.opensearch.org/docs/latest/search-plugins/index-management/index-and-search-separation/).

## Scale to zero with reader/writer separation: The search-only mode

In write-once, read-many scenarios—like log analytics or frozen time-series data—you can reduce resource use after indexing completes. OpenSearch now supports a **search-only mode** through the `_scale` API, allowing you to disable primary shards and write replicas, leaving only search replicas active.

This significantly reduces storage and compute costs while maintaining full search capabilities.

### Search-only mode benefits:

- Scale down indexing capacity when writes are no longer needed
- Free up disk and memory by removing unnecessary write paths
- Work smoothly with index lifecycle controls through `_open`/`_close` operations
- Keep only search replicas active to reduce resource usage
- Maintain green cluster health with active search paths
- Auto-recover search replicas without manual intervention
- Scale back up at any time to resume indexing
- Scale search replicas based on search traffic during search-only mode

### How it works

When the `_scale` API is called with `{ "search_only": true }`, OpenSearch:

1. Adds an internal search-only block to the index
2. Scales down all primaries and write replicas
3. Keeps only search replicas active

To resume indexing, call `_scale` with `{ "search_only": false }`, and OpenSearch restores the original index state. Even in search-only mode, cluster health remains green because all expected search replicas are allocated.

## Benchmark comparison

We benchmarked indexing throughput and query latency across three cluster configurations using the `http_logs` workload in OpenSearch Benchmark. The test ran 50% of indexing first, followed by simultaneous indexing and an expensive multi-term aggregation query.

### Indexing throughput

The chart below compares indexing throughput across the three cluster configurations:

![Indexing throughput comparison](/assets/media/blog-images/2025-05-09-search-index-separation/indexing-throughput-compare-run.png)

### Query latency

The chart below shows how separating workloads improves query latency:

![Query latency comparison](/assets/media/blog-images/2025-05-09-search-index-separation/query-latency.png)

### Cluster configurations

| Cluster | Node roles                        | EC2 Types Used               | Hourly Cost |
|---------|-----------------------------------|------------------------------|--------------|
| Cluster 1 | 4 data (r6g), 2 coord (r6g), 3 mgr (c6g) | r6g.xlarge, c6g.xlarge | $1.62        |
| Cluster 2 | 4 data (c6g), 2 coord (r6g), 3 mgr (c6g) | c6g.xlarge, r6g.xlarge | $1.36        |
| Cluster 3 | 2 data (c6g), 2 search (r6g), 2 coord (r6g), 3 mgr (c6g) | mix | $1.49        |

### Performance results summary

| Metric                    | Cluster 1     | Cluster 3     | Difference (%) |
|---------------------------|---------------|---------------|----------------|
| Index throughput (median) | 58523.95      | 59818.80      | +2.16          |
| Query latency p50 (ms)    | 6725.73       | 5358.19       | -25.52         |
| Query latency p99 (ms)    | 8073.81       | 6180.44       | -30.63         |
| Hourly cost               | $1.62         | $1.49         | -8.72          |

Cluster 3 slightly outperforms others for simultaneous indexing and search, while significantly reducing query latency and lowering cost.

## Additional benefits of separated clusters

- **Failure isolation**: Indexing and search issues are contained
- **Scalable design**: Easily scale indexing and search independently

## Conclusion

Separating indexing and search workloads in OpenSearch gives you greater control to scale, tune, and optimize your cluster. Whether you're prioritizing throughput, reducing latency, or managing costs, this approach helps meet the needs of modern applications.

## Future work

Currently, coordinator nodes handle both search and indexing requests. For full separation, consider routing indexing and search traffic to distinct coordinator node groups.
