---
layout: post
title:  "Reduce compute costs and increase throughput with segment replication, generally available in OpenSearch 2.7"
authors:
- satnandi
- handalm
- aalkouz
- kolchfa
- handler
date: 2023-04-04
categories:
 - technical-post
meta_keywords: 
meta_description: 

excerpt: We are excited to announce that segment replication---a new replication strategy introduced as experimental in OpenSearch 2.3---is generally available in version 2.7. Segment replication is an alternative to document replication, where documents are copied from primary shards to their replicas for durability. With document replication, all replica shards need to perform the same indexing operation as the primary shard. With segment replication, only the primary shard performs the indexing operation, creating segment files that are transferred to the replicas. Thus, the heavy indexing workload is performed only on the primary shard, significantly increasing index throughput and lowering compute costs. In this blog post, we will dive deep into the concept of segment replication, its advantages and shortcomings, and planned future enhancements.
---

<style>
table{
    border:2px solid #e6e6e6;
    display: block;
    max-width: -moz-fit-content;
    max-width: fit-content;
    margin: 0 auto;
    overflow-x: auto;
}

th{
    border:2px solid #e6e6e6;
    padding: 5px;
    text-align: center;
}

td{
    border:1px solid #e6e6e6;
    padding: 10px;
    text-align: center;
}
</style>

We are excited to announce that segment replication---a new replication strategy introduced as experimental in OpenSearch 2.3---is generally available in version 2.7. Segment replication is an alternative to document replication, where documents are copied from primary shards to their replicas for durability and to increas capacity. With document replication, all replica shards need to perform the same indexing operation as the primary shard. With segment replication, only the primary shard performs the indexing operation, creating segment files that are transferred to the replicas. Thus, the heavy indexing workload is performed only on the primary shard, significantly increasing index throughput and lowering compute costs. In this blog post, we will dive deep into the concept of segment replication, its advantages and shortcomings, and planned future enhancements.

## Core concepts

When you create an index in OpenSearch, you specify the index's _number_of_shards_ (default: 1), called "primary shards", and _number_of_replicas (default:1). Each replica is a full copy of the set of primaries. If you have 5 primaries, and 1 replica, you have 10 total shards in your cluster. The data you send for indexing is randomly hashed across the primary shards, and replicated by the primaries to the replica(s).

Under the covers, each shard is an instance of [Lucene](https://lucene.apache.org/) --- a Java library for reading and writing search indices. Lucene, in-turn, is a file-based, append-only technology. A _segment_ is a portion of a Lucene index in a folder, on disk. Each document you send for indexing is split out across its fields, with indexed data for the fields stored across some 20-30 different structures. Lucene holds these structures in RAM until, eventually they are flushed to disk as a collection of files, called a "segment".

You use replicas for two different purposes --- redundancy and capacity. Your first replica provides a redundant copy of the data in your cluster. OpenSearch guarantees that the primary and the replica are allocated to different nodes in the cluster, meaning that even if you lose a node, you don't lose data from the cluster. OpenSearch can automatically recreate the missing copies of any shards that were on a lost node. (If you are running in the cloud, where the cluster spans isolated data centers ("Availability Zones" in AWS), you can increase resiliency by running with 2 replicas across 3 zones.) The second and subsequent replicas provide additional query capacity. You add more nodes along with the additional replicas to provide further parallelism for query processing. 

## Document replication

For versions before 2.7, OpenSearch propagates source documents from the primary to the replicas for indexing. All operations that affect an OpenSearch index (for example, adding, updating, or removing documents) are routed to the index’s primary shards. The primary shard is responsible for validating the operation and subsequently executing it locally. Once the operation has been completed successfully on the primary shard, the operation is forwarded to each of its replica shards in parallel. Each replica shard executes the forwarded operation, duplicating the processing performed on the primary shard. When the operation has completes (either successfully or with a failure) on every replica and a response has been received by the primary shard, the primary shard responds to the client. The response includes information about replication success or failure on replica shards.

The advantage of document replication is that documents are immediately sent to the replicas, where they become searchable as. The system reaches a consistent state between primaries and replicas as quickly as possible. But, because the indexing operation happens _n_ times (primary + replica count) for each document, document replication consumes more CPU.

Refer to the following diagram of the document replication process.

<img src="/assets/media/blog-images/2023-04-04-segment-replication/document-replication.png" alt="Document replication diagram"/>{: .img-fluid}

## Segment replication

With segment replication, documents are indexed only on the node that contains the primary shard. The produced segment files are then copied directly to all replicas and are made searchable. Segment replication reduces the compute cost for adding, updating, or deleting documents by doing the CPU work only on the nodes with the primary shards. The underlying Lucene append-only indexing makes copying segments possible: as documents are added, updated, or deleted, Lucene creates new segments, but the existing segments are left untouched (deletes are handled with tombstones).

The advantage of segment replication is that it reduces the CPU usage overall in your cluster by removing the duplicated effort of parsing and processing the data in your documents. But, because all indexing and networking originates on the nodes with primary shards, those nodes become more heavily loaded. Also, nodes with primary shards spend time waiting for segment creation (controlled by the _\_refresh\_interval_) and time sending the segments to the replica, increasing the time before a particular document is consistently searchable on every shard.

You [enable segment replication](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/segment-replication/configuration/) for your cluster and then per index. Refer to the following diagram of the segment replication process.

<img src="/assets/media/blog-images/2023-04-04-segment-replication/segment-replication.png" alt="Segment replication diagram"/>{: .img-fluid}

## Understanding the trade-offs

With segment replication, you can get the same throughput for ingestion with 9 nodes in a cluster as you would get with 15 nodes with document replication. During testing, our experimental release users reported up to 40% higher throughput with segment replication than with document replication for the same cluster setup.

Compared to document replication, segment replication performs better in OpenSearch cluster deployments with low replica counts, such as those used for log analytics. Segment replication trades CPU for time and networking. The primary is less-frequently, sending larger blocks of data to its replicas. As replica count increases, the primary becomes the bottleneck, doing all of the indexing work, and replicating all of the segments. In our testing, we see an across-the-board improvement for a replica count of 1, decreasing linearly with the replica count. As with all performance results, your mileage will vary! Be sure to test with your own data and queries to determine the benefits for your workload.

For higher replica counts, remote storage integration works better. In remote storage integration, the primary writes segments to an object store, like Amazon Simple Storage Service (S3). Replicas then load the segments from the object store, in parallel, freeing the node with the primary shard from sending out large data blocks to all of the replicas.  We are planning to introduce remote storage integration in a future release.

As with any distributed system, some cluster nodes can fall behind the tolerable or expected throughput levels. Nodes may not be able to catch up to the primary node for various reasons, such as high local search loads or network congestion. To monitor segment replication performance, see [OpenSearch benchmark](https://github.com/opensearch-project/opensearch-benchmark).

## Shard indexing backpressure

When replica nodes start falling behind, the primary node will start applying [shard indexing backpressure](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/shard-indexing-backpressure/) when ingesting new documents, in an attempt to slow down the indexing. Shard indexing backpressure is a smart rejection mechanism at a per-shard level that dynamically rejects indexing requests when your cluster is under strain. It transfers requests from an overwhelmed node or shard to other nodes or shards that are still healthy.
With shard indexing backpressure, you can prevent nodes in your cluster from running into cascading failures because of performance degradation caused by slow nodes, stuck tasks, resource-intensive requests, traffic surges, or skewed shard allocations. 

## Enabling segment replication

To enable segment replication, follow the [step-by-step instructions](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/segment-replication/configuration/) in the documentation.

## Benchmarks

The following benchmarks were collected with [OpenSearch-benchmark](https://github.com/opensearch-project/opensearch-benchmark) using the [`stackoverflow`](https://www.kaggle.com/datasets/stackoverflow/stackoverflow) and [`nyc_taxi`](https://github.com/topics/nyc-taxi-dataset) datasets.  

Both test runs were performed on a 10-node (m5.xlarge) cluster with 10 shards and 5 replicas. Each shard was about <!-- TODO: insert size --> xxMBs in size. The benchmarking results are listed in the following table.

<table>
    <tr>
        <td></td>
        <td></td>
        <td>Document Replication</td>
        <td>Segment Replication</td>
        <td>Percent difference</td>
    </tr>
    <tr>
        <td>Test execution time (minutes)</td>
        <td></td>
        <td>40.00</td>
        <td>22.00</td>
        <td></td>
    </tr>
    <tr>
        <td rowspan="3">Throughput (number of requests per second)</td>
        <td>p0</td>
        <td>17553.90</td>
        <td>28584.30</td>
        <td>63%</td>
    </tr>
    <tr>
        <td>p50</td>
        <td>20647.20</td>
        <td>32790.20</td>
        <td>59%</td>
    </tr>
    <tr>
        <td>p100</td>
        <td>23209.00</td>
        <td>34286.00</td>
        <td>48%</td>
    </tr>
    <tr>
        <td rowspan="4">CPU (%)</td>
        <td>p50</td>
        <td>65.00</td>
        <td>30.00</td>
        <td>-54%</td>
    </tr>
    <tr>
        <td>p90</td>
        <td>79.00</td>
        <td>35.00</td>
        <td>-56%</td>
    </tr>
    <tr>
        <td>p99</td>
        <td>98.00</td>
        <td>45.08</td>
        <td>-54%</td>
    </tr>
    <tr>
        <td>p100</td>
        <td>98.00</td>
        <td>59.00</td>
        <td>-40%</td>
    </tr>
    <tr>
        <td rowspan="4">Memory (%)</td>
        <td>p50</td>
        <td>48.20</td>
        <td>39.00</td>
        <td>-19%</td>
    </tr>
    <tr>
        <td>p90</td>
        <td>62.00</td>
        <td>61.00</td>
        <td>-2%</td>
    </tr>
    <tr>
        <td>p99</td>
        <td>66.21</td>
        <td>68.00</td>
        <td>3%</td>
    </tr>
    <tr>
        <td>p100</td>
        <td>71.00</td>
        <td>69.00</td>
        <td>-3%</td>
    </tr>
    <tr>
        <td rowspan="4">IOPS</td>
        <td>p50</td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>p90</td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>p99</td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>p100</td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td rowspan="4">Latency</td>
        <td>p50</td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>p90</td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>p99</td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>p100</td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
</table>

**Note** : Your results may vary based on the cluster topology, hardware used, shard count, and merge settings. 

<!--TODO: Add IOPS, network consumption & refresh latencies-->

## Other considerations

The following considerations apply to segment replication in the 2.7 release:

- **Read-after-write guarantees:**  The `wait_until` refresh policy is not compatible with segment replication.  If you use the `wait_until` refresh policy while ingesting documents, you'll get a response only after the primary node has refreshed and made those documents searchable.  Replica shards will respond only after having written to their local translog.  We are exploring other mechanisms for providing read-after-write guarantees. For more information, see the corresponding [GitHub issue](https://github.com/opensearch-project/OpenSearch/issues/6046).  

- **System indexes** will continue to use document replication internally until read-after-write guarantees are available. In this case, document replication does not hinder the overall performance because there are few system indexes. 

- [Enabling segment replication for an existing index]((https://github.com/opensearch-project/OpenSearch/issues/3685)) requires **reindexing**.


## What's next?

The OpenSearch 2.7 release provides a peer-to-peer (node-to-node) implementation of segment replication. With this release, you can choose to use either document replication or segment replication based on your cluster configuration and workloads. In the coming releases, OpenSearch remote storage, our next-generation storage architecture, will use segment replication as the single replication mechanism. Segment-replication-enabled remote storage will eliminate network bottlenecks on primary shards for clusters with higher replica counts. We are also exploring a chain replication strategy to further alleviate the load on primary shards. For better usability, we are planning to integrate segment replication with OpenSearch Dashboards so that you can enable the feature using the Dashboards UI. 
