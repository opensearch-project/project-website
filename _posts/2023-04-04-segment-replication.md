---
layout: post
title:  "Reduce compute costs and increase throughput with segment replication, generally available in OpenSearch 2.7."
authors:
- satnandi
- handalm
- aalkouz
- kolchfa
date: 2023-04-04
categories:
 - technical-post
meta_keywords: 
meta_description: 

excerpt: We are excited to announce that segment replication---a new replication strategy introduced as experimental in OpenSearch 2.3---is generally available in version 2.7. Segment replication is an alternative to document replication, where documents are copied from primary shards to their replicas for durability. With document replication, all replica shards need to perform the same indexing operation as the primary shard. With segment replication, only the primary shard performs the indexing operation, creating segment files that are transferred to the replicas. Thus, the heavy indexing workload is done only on the primary shard, significantly increasing index throughput and lowering compute costs. In this blog post, we will dive deep into the concept of segment replication, its advantages and shortcomings, and planned future enhancements.
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

We are excited to announce that segment replication---a new replication strategy introduced as experimental in OpenSearch 2.3---is generally available in version 2.7. Segment replication is an alternative to document replication, where documents are copied from primary shards to their replicas for durability. With document replication, all replica shards need to perform the same indexing operation as the primary shard. With segment replication, only the primary shard performs the indexing operation, creating segment files that are transferred to the replicas. Thus, the heavy indexing workload is done only on the primary shard, significantly increasing index throughput and lowering compute costs. In this blog post, we will dive deep into the concept of segment replication, its advantages and shortcomings, and planned future enhancements.

## Document replication

Until version 2.7, OpenSearch achieved durability and search scaling by replicating data, ingesting documents on the primary and replica nodes. This methodology is known as _document replication_. The advantage of document replication is the low refresh latency between the primary node and replica nodes. However, document replication consumes more CPU power because the workload is duplicated on all nodes.

All operations that affect an OpenSearch index (for example, adding, updating, or removing documents) are routed to one of the index’s primary shards. The primary shard is responsible for validating the operation and subsequently executing it locally. Once the operation has been completed successfully on the primary shard, the operation is forwarded to each of its replica shards in parallel. Each replica shard executes the forwarded operation, duplicating the processing performed on the primary shard. When the operation has completed (either successfully or with a failure) on every replica and a response has been received by the primary shard, the primary shard responds to the client. The response includes information about replication success or failure on replica shards. Refer to the following diagram for the document replication process.

<img src="/assets/media/blog-images/2023-04-04-segment-replication/document-replication.png" alt="Document replication diagram"/>{: .img-fluid}

## Segment replication

With segment replication, documents are indexed only once on the node that contains the primary shard. The produced segment files are then copied to all replicas and are made searchable. The underlying Lucene write-once segmented architecture makes copying segments possible: as documents are updated or deleted, new segments are created but the existing segments are left untouched. Additionally, the cluster only acknowledges index requests once all shards have completed the work. 

Segment replication aims to reduce compute costs and improve indexing throughput at the expense of possible replication delays and increased network usage. Segment replication uses a node-to-node replication method, where segments are copied directly from primary shards to their replicas. This replication method is enabled per index and operates within the OpenSearch cluster model and sharding strategy. Refer to the following diagram for the segment replication process.

<img src="/assets/media/blog-images/2023-04-04-segment-replication/segment-replication.png" alt="Segment replication diagram"/>{: .img-fluid}

## Performance

Compared to document replication, segment replication performs better in OpenSearch cluster deployments with low replica counts, such as those used for log analytics. The low replica count requirement is a limitation of node-to-node (peer-to-peer) replication. For higher replica counts, remote store integration works better. We are planning to introduce remote store integration in the future releases.

With segment replication, you can get the same throughput ingestion performance with 9 nodes in the cluster as you would get with 15 nodes with document replication. During experimental testing, our experimental release users have reported up to 40% higher throughput with segment replication than with document replication for the same cluster setup.

## Performance limitations

Segment replication increases data traffic between nodes because of copying of the segments. As the number of replicas grows, the data traffic and the load on the primary node rise to support the copy function. Thus, a higher data transfer load diminishes the advantage of higher ingestion performance achieved with segment replication at a specific replica count. Another tradeoff of enabling segment replication on an index is increased read-after-write latencies because the primary node has to physically copy the segments to replicas after the data is flushed to disks. The segments are opened to searches only after creating the full segment is complete.

As with any distributed system, some cluster nodes can fall behind the tolerable or expected throughput levels. Nodes may not be able to catch up to primary for various reasons, such as high local search loads or network congestion. To monitor segment replication performance, see [OpenSearch benchmark](https://github.com/opensearch-project/opensearch-benchmark).

## Shard indexing backpressure

When replica nodes start falling behind, the primary node will start applying [shard indexing backpressure](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/shard-indexing-backpressure/) when ingesting new documents in an attempt to slow down the indexing. Shard indexing backpressure is a smart rejection mechanism at a per-shard level that dynamically rejects indexing requests when your cluster is under strain. It transfers requests from an overwhelmed node or shard to other nodes or shards that are still healthy.
With shard indexing backpressure, you can prevent nodes in your cluster from running into cascading failures because of performance degradation caused by slow nodes, stuck tasks, resource-intensive requests, traffic surges, or skewed shard allocations. 

## Enabling segment replication

To enable segment replication, follow the [step-by-step instructions](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/segment-replication/configuration/) in the documentation.

## Benchmarks

The following benchmarks were collected with [OpenSearch-benchmark](https://github.com/opensearch-project/opensearch-benchmark) using the [`stackoverflow`](https://www.kaggle.com/datasets/stackoverflow/stackoverflow) and [`nyc_taxi`](https://github.com/topics/nyc-taxi-dataset) datasets.  

Both test runs were performed on a 10-node (m5.xlarge) cluster with 10 shards and 5 replicas. Each shard was about xxMBs. The benchmarking results are listed in the following table.

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

**Note** : Your results may vary based on cluster topology, hardware used, shard count, and merge settings. 

TODO: Add IOPS, network consumption & refresh latencies

## Other considerations

The following considerations apply to segment replication in the 2.7 release:

- **Read after write guarantees:**  The `wait_until` refresh policy is not compatible with segment replication.  If you use the `wait_until` refresh policy while ingesting documents, you'll get a response only after the primary has refreshed and made those documents searchable.  Replica shards will respond only after having written to their local translog.  We are exploring other mechanisms for providing read after write guarantees. For more information, see the corresponding [GitHub issue](https://github.com/opensearch-project/OpenSearch/issues/6046).  

- **System indexes** will continue to use document replication internally until read after write guarantees are available. In this case, document replication does not hinder the overall performance because there are few system indexes. 

- [Enabling segment replication for an existing index]((https://github.com/opensearch-project/OpenSearch/issues/3685)) requires **reindexing**.


## What's next?

The 2.7 OpenSearch release provides a peer-to-peer (node-to-node) implementation of segment replication. With this release, you can choose to use either document replication or segment replication based on your cluster configuration and workloads. In the coming releases, OpenSearch remote storage, our next-generation storage architecture, will use segment replication as the single replication mechanism. Segment replication-enabled remote store will eliminate network bottlenecks on primary shards for clusters with higher replica counts. We are also exploring a chain replication strategy to further alleviate the load on primary shards. For better usability, we are planning to integrate segment replication with OpenSearch Dashboards so you can enable the feature using the Dashboards UI. 
