---
layout: post
title:  "Reduce compute costs and increase throughput with segment replication, generally available in OpenSearch 2.7"
authors:
- satnandi
- handalm
- aalkouz
- handler
- kolchfa
date: 2023-04-27
categories:
 - technical-post
meta_keywords: segment replication, document replication, document based replication, cross cluster replication
meta_description: Learn how OpenSearch segment replication increases index throughout and lowers compute costs by performing heavy indexing workloads only on the primary shard.

excerpt: We are excited to announce that segment replication---a new replication strategy introduced as experimental in OpenSearch 2.3---is generally available in version 2.7. Segment replication is an alternative to document replication, where documents are copied from primary shards to their replicas for durability. With document replication, all replica shards need to perform the same indexing operation as the primary shard. With segment replication, only the primary shard performs the indexing operation, creating segment files that are transferred to the replicas. Thus, the heavy indexing workload is performed only on the primary shard, significantly increasing index throughput and lowering compute costs. In this blog post, we will dive deep into the concept of segment replication, its advantages and shortcomings, and planned future enhancements.
has_science_table: true
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

.border-rt {
    border-right: 4px solid #e6e6e6;
}

.border-btm {
    border-bottom: 2px solid #e6e6e6;
}

.red-clr {
    background-color: #ffb3b3;
}

.green-clr {
    background-color: #c1f0c1;
}
</style>

We are excited to announce that segment replication---a new replication strategy introduced as experimental in OpenSearch 2.3---is generally available in version 2.7. Segment replication is an alternative to document replication, where documents are copied from primary shards to their replicas for durability and to increase capacity. With document replication, all replica shards need to perform the same indexing operation as the primary shard. With segment replication, only the primary shard performs the indexing operation, creating segment files that are transferred to the replicas. Thus, the heavy indexing workload is performed only on the primary shard, significantly increasing index throughput and lowering compute costs. In this blog post, we will dive deep into the concept of segment replication, its advantages and shortcomings, and planned future enhancements.

## Core concepts

When you create an index in OpenSearch, you specify its `number_of_shards` (the default is 1), called _primary shards_, and `number_of_replicas`(the default is 1). Each replica is a full copy of the set of primary shards. If you have 5 primary shards and 1 replica for each of them, you have 10 total shards in your cluster. The data you send for indexing is randomly hashed across the primary shards and replicated by the primary shards to the replica or replicas.

Internally, each shard is an instance of [Lucene](https://lucene.apache.org/)---a Java library for reading and writing search indexes. Lucene is a file-based, append-only technology. A _segment_ is a portion of a Lucene index in a folder on disk. Each document you send for indexing is split out across its fields, with indexed data for the fields stored in 20--30 different structures. Lucene holds these structures in RAM until eventually they are flushed to disk as a collection of files, called a _segment_.

You use replicas for two different purposes: redundancy and capacity. Your first replica provides a redundant copy of the data in your cluster. OpenSearch guarantees that the primary and the replica are allocated to different nodes in the cluster, meaning that even if you lose a node, you don't lose data from the cluster. OpenSearch can automatically recreate the missing copies of any shards that resided on a lost node. If you are running in the cloud, where the cluster spans isolated data centers (AWS _Availability Zones_), you can increase resiliency by having two replicas across three zones. The second and subsequent replicas provide additional query capacity. You add more nodes along with the additional replicas to provide further parallelism for query processing. 

## Document replication

For versions 2.7 and eariler, OpenSearch propagates source documents from the primary shard to the replicas for indexing. All operations that affect an OpenSearch index (for example, adding, updating, or removing documents) are routed to the index’s primary shards. The primary shard is responsible for validating the operation and subsequently executing it locally. Once the operation has been completed successfully on the primary shard, the operation is forwarded to each of its replica shards in parallel. Each replica shard executes the forwarded operation, duplicating the processing performed on the primary shard. When the operation has completed (either successfully or with a failure) on every replica and a response has been received by the primary shard, the primary shard responds to the client. The response includes information about replication success or failure on replica shards.

The advantage of document replication is that documents become searchable on the replicas faster because they are sent to the replicas immediately following ingestion on the primary shard. The system reaches a consistent state between primary shards and replicas as quickly as possible. However, document replication consumes more CPU because for each document, the indexing operation happens on the primary shards and on all its replicas.

Refer to the following diagram of the document replication process.

<img src="/assets/media/blog-images/2023-04-27-segment-replication/document-replication.png" alt="Document replication diagram"/>{: .img-fluid}

## Segment replication

With segment replication, documents are indexed only on the node that contains the primary shard. The produced segment files are then copied directly to all replicas and are made searchable. Segment replication reduces the compute cost for adding, updating, or deleting documents by doing the CPU work only on the nodes with the primary shards. The underlying Lucene append-only indexing makes copying segments possible: as documents are added, updated, or deleted, Lucene creates new segments, but the existing segments are left untouched (deletes are handled with tombstones).

The advantage of segment replication is that it reduces the CPU usage overall in your cluster by removing the duplicated effort of parsing and processing the data in your documents. However, because all indexing and networking originates on the nodes with primary shards, those nodes become more heavily loaded. Additionally, nodes with primary shards spend time waiting for segment creation (this time is controlled by the `refresh_interval`) and time sending the segments to the replica, increasing the time before a particular document is consistently searchable on every shard.

Refer to the following diagram of the segment replication process.

<img src="/assets/media/blog-images/2023-04-27-segment-replication/segment-replication.png" alt="Segment replication diagram"/>{: .img-fluid}

## Understanding the tradeoffs

During testing, our experimental release users reported up to 40% higher throughput with segment replication than with document replication for the same cluster setup. With segment replication, you can get the same throughput for ingestion with 9 nodes in a cluster as you would get with 15 nodes with document replication. 

Segment replication trades CPU usage for time and networking. The primary shard is sending larger blocks of data to its replicas less frequently. As replica count increases, the primary shard becomes the bottleneck, performing all indexing work and replicating all segments. In our testing, we see consistent improvement for a replica count of one. As replica count grows, the improvement decreases linearly. Performance improvement in your cluster depends on the workload, instance types, and configuration. Be sure to test segment replication with your own data and queries to determine the benefits for your workload.

For higher replica counts, remote storage integration works better. In remote storage integration, the primary shard writes segments to an object store, such as Amazon Simple Storage Service (S3). Replicas then load the segments from the object store in parallel, freeing the node with the primary shard from sending out large data blocks to all replicas.  We are planning to introduce remote storage integration in a future release.

As with any distributed system, some cluster nodes can fall behind the tolerable or expected throughput levels. Nodes may not be able to catch up to the primary node for various reasons, such as high local search loads or network congestion. To monitor segment replication performance, see [OpenSearch benchmark](https://github.com/opensearch-project/opensearch-benchmark).

## Segment replication or document replication

Choose **segment replication** if:

- Your cluster deployment has low replica counts (for example, log analytics).

- Your workload prioritizes high ingestion rate with a low search volume.

- Your application is not sensitive to replication lag.

Choose **document replication** if:

- Your cluster deployment has high replica counts and you value low replication lag. You can validate the replication lag across your cluster with the [CAT Segment Replication API](https://opensearch.org/docs/latest/api-reference-cat/cat-segment-replication/).

See the [Benchmarks](#benchmarks) section for benchmarking test results with various cluster configurations and results discussion.

## Segment replication backpressure

In addition to the existing [shard indexing backpressure](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/shard-indexing-backpressure/), OpenSearch 2.7 introduces a new [segment replication backpressure](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/segment-replication/backpressure/) rejection mechanism that is disabled by default. 

Shard indexing backpressure is a shard-level smart rejection mechanism that dynamically rejects indexing requests when your cluster is under strain. It transfers requests from an overwhelmed node or shard to other nodes or shards that are still healthy. 

Segment replication backpressure monitors the replicas to ensure they are not falling behind the primary shard. If a replica has not synchronized to the primary shard within a set time limit, the primary shard will start rejecting requests when ingesting new documents, in an attempt to slow down the indexing. 

## Enabling segment replication

To enable segment replication for your index, follow the [step-by-step instructions](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/segment-replication/configuration/) in the documentation.

## Benchmarks

The following benchmarks were collected with [OpenSearch-benchmark](https://github.com/opensearch-project/opensearch-benchmark) using the [`stackoverflow`](https://www.kaggle.com/datasets/stackoverflow/stackoverflow) and [`nyc_taxi`](https://github.com/topics/nyc-taxi-dataset) datasets.  

The benchmarks demonstrate the effect of the following configurations on segment replication:

- [The workload size](#increasing-the-workload-size)

- [The number of primary shards](#increasing-the-number-of-primary-shards)

- [The number of replicas](#increasing-the-number-of-replicas)

**Note** : Your results may vary based on the cluster topology, hardware used, shard count, and merge settings. 

### Increasing the workload size

The following table lists benchmarking results for the `nyc_taxi` dataset with the following configuration:

- 10 m5.xlarge data nodes

- 40 primary shards, 1 replica each (80 shards total)

- 4 primary shards and 4 replica shards per node

<table>
    <th colspan="2" class="border-rt"></th>
    <th colspan="3" class="border-rt">40 GB primary shard, 80 GB total</th>
    <th colspan="3">240 GB primary shard, 480 GB total</th>
    <tr>
        <td class="border-btm"></td>
        <td class="border-rt border-btm"></td>
        <td class="border-btm">Document Replication</td>
        <td class="border-btm">Segment Replication</td>
        <td class="border-rt border-btm">Percent difference</td>
        <td class="border-btm">Document Replication</td>
        <td class="border-btm">Segment Replication</td>
        <td class="border-btm">Percent difference</td>
    </tr>
    <tr>
        <td>Store size</td>
        <td class="border-rt"></td>
        <td>85.2781</td>
        <td>91.2268</td>
        <td class="border-rt">N/A</td>
        <td>515.726</td>
        <td>558.039</td>
        <td>N/A</td>
    </tr>
    <tr>
        <td rowspan="3">Index throughput (number of requests per second)</td>
        <td class="border-rt">Minimum</td>
        <td>148,134</td>
        <td>185,092</td>
        <td class="border-rt green-clr">24.95%</td>
        <td>100,140</td>
        <td>168,335</td>
        <td class="green-clr">68.10%</td>
    </tr>
    <tr>
        <td class="border-rt">Median</td>
        <td>160,110</td>
        <td>189,799</td>
        <td class="border-rt green-clr">18.54%</td>
        <td>106,642</td>
        <td>170,573</td>
        <td class="green-clr">59.95%</td>
    </tr>
    <tr>
        <td class="border-rt">Maximum</td>
        <td>175,196</td>
        <td>190,757</td>
        <td class="border-rt green-clr">8.88%</td>
        <td>108,583</td>
        <td>172,507</td>
        <td class="green-clr">58.87%</td>
    </tr>
    <tr>
        <td>Error rate</td>
        <td class="border-rt"></td>
        <td>0.00%</td>
        <td>0.00%</td>
        <td class="border-rt">0.00%</td>
        <td>0.00%</td>
        <td>0.00%</td>
        <td>0.00%</td>
    </tr>
</table>

As the size of the workload increases, the benefits of segment replication are amplified because the replicas are not required to index the larger dataset. In general, segment replication leads to a higher throughput at a lower resource cost than document replication in all cluster configurations, not accounting for replication lag. 

### Increasing the number of primary shards

The following table lists benchmarking results for the `nyc_taxi` dataset for 40 and 100 primary shards.

<table>
    <th colspan="2"  class="border-rt"></th>
    <th colspan="3" class="border-rt">40 primary shards, 1 replica</th>
    <th colspan="3">100 primary shards, 1 replica</th>
    <tr>
        <td class="border-btm"></td>
        <td class="border-rt border-btm"></td>
        <td class="border-btm">Document Replication</td>
        <td class="border-btm">Segment Replication</td>
        <td class="border-rt border-btm">Percent difference</td>
        <td class="border-btm">Document Replication</td>
        <td class="border-btm">Segment Replication</td>
        <td class="border-btm">Percent difference</td>
    </tr>
    <tr>
        <td rowspan="3">Index throughput (number of requests per second)</td>
        <td class="border-rt">Minimum</td>
        <td>148,134</td>
        <td>185,092</td>
        <td class="border-rt green-clr">24.95%</td>
        <td>151,404</td>
        <td>167,391</td>
        <td class="green-clr">9.55%</td>
    </tr>
    <tr>
        <td class="border-rt">Median</td>
        <td>160,110</td>
        <td>189,799</td>
        <td class="border-rt green-clr">18.54%</td>
        <td>154,796</td>
        <td>172,995</td>
        <td class="green-clr">10.52%</td>
    </tr>
    <tr>
        <td class="border-rt">Maximum</td>
        <td>175,196</td>
        <td>190,757</td>
        <td class="border-rt green-clr">8.88%</td>
        <td>166,173</td>
        <td>174,655</td>
        <td class="green-clr">4.86%</td>
    </tr>
    <tr>
        <td>Error rate</td>
        <td class="border-rt"></td>
        <td>0.00%</td>
        <td>0.00%</td>
        <td class="border-rt">0.00%</td>
        <td>0.00%</td>
        <td>0.00%</td>
        <td>0.00%</td>
    </tr>
</table>

As the number of primary shards increases, the benefits of segment replication over document replication decrease. While segment replication is still beneficial with a larger number of primary shards, the difference in performance becomes less pronounced because there are more primary shards per node that must copy segment files across the cluster. 

### Increasing the number of replicas

The following table lists benchmarking results for the `stackoverflow` dataset for 1 and 9 replicas.

<table>
    <th colspan="2"  class="border-rt"></th>
    <th colspan="3"  class="border-rt">10 primary shards, 1 replica</th>
    <th colspan="3">10 primary shards, 9 replicas</th>
    <tr>
        <td class="border-btm"></td>
        <td class="border-rt border-btm"></td>
        <td class="border-btm">Document Replication</td>
        <td class="border-btm">Segment Replication</td>
        <td class="border-rt border-btm">Percent difference</td>
        <td class="border-btm">Document Replication</td>
        <td class="border-btm">Segment Replication</td>
        <td class="border-btm">Percent difference</td>
    </tr>
    <tr>
        <td rowspan="2">Index throughput (number of requests per second)</td>
        <td class="border-rt">Median</td>
        <td>72,598.10</td>
        <td>90,776.10</td>
        <td class="border-rt green-clr">25.04%</td>
        <td>16,537.00</td> 
        <td>14,429.80</td> 
        <td class="red-clr">&minus;12.74%</td>
    </tr>
    <tr>
        <td class="border-rt">Maximum</td>
        <td>86,130.80</td>
        <td>96,471.00</td>
        <td class="border-rt green-clr">12.01%</td>
        <td>21,472.40</td>
        <td>38,235.00</td>
        <td class="green-clr">78.07%</td>
    </tr>
    <tr>
        <td rowspan="4">CPU usage (%)</td>
        <td class="border-rt">p50</td>
        <td>17</td>
        <td>18.857</td>
        <td class="border-rt red-clr">10.92%</td>
        <td>69.857</td>
        <td>8.833</td>
        <td class="green-clr">&minus;87.36%</td>
    </tr>
    <tr>
        <td class="border-rt">p90</td>
        <td>76</td>
        <td>82.133</td>
        <td class="border-rt red-clr">8.07%</td>
        <td>99</td>
        <td>86.4</td>
        <td class="green-clr">&minus;12.73%</td>
    </tr>
    <tr>
        <td class="border-rt">p99</td>
        <td>100</td>
        <td>100</td>
        <td class="border-rt">0%</td>
        <td>100</td>
        <td>100</td>
        <td>0%</td>
    </tr>
    <tr>
        <td class="border-rt">p100</td>
        <td>100</td>
        <td>100</td>
        <td class="border-rt">0%</td>
        <td>100</td>
        <td>100</td>
        <td>0%</td>
    </tr>
    <tr>
        <td rowspan="4">Memory usage (%)</td>
        <td class="border-rt">p50</td>
        <td>35</td>
        <td>23</td>
        <td class="border-rt green-clr">&minus;34.29%</td>
        <td>42</td>
        <td>40</td>
        <td class="green-clr">&minus;4.76%</td>
    </tr>
    <tr>
        <td class="border-rt">p90</td>
        <td>59</td>
        <td>57</td>
        <td class="border-rt green-clr">&minus;3.39%</td>
        <td>59</td>
        <td>63</td>
        <td class="red-clr">6.78%</td>
    </tr>
    <tr>
        <td class="border-rt">p99</td>
        <td>69</td>
        <td>61</td>
        <td class="border-rt green-clr">&minus;11.59%</td>
        <td>66</td>
        <td>70</td>
        <td class="red-clr">6.06%</td>
    </tr>
    <tr>
        <td class="border-rt">p100</td>
        <td>72</td>
        <td>62</td>
        <td class="border-rt green-clr">&minus;13.89%</td>
        <td>69</td>
        <td>72</td>
        <td class="red-clr">4.35%</td>
    </tr>
    <tr>
        <td>Error rate</td>
        <td class="border-rt"></td>
        <td>0.00%</td>
        <td>0.00%</td>
        <td class="border-rt">0.00%</td>
        <td>0.00%</td>
        <td>2.30%</td>
        <td>2.30%</td>
    </tr>
</table>

As the number of replicas grows, the time it takes for primary shards to keep replicas up to date (known as the _replication lag_) increases. This is because with segment replication the segment files are copied directly from primary shards to replicas. 

The benchmarking results show a non-zero error rate as the number of replicas increases. The error rate indicates that the [segment replication backpressure](#segment-replication-backpressure) mechanism is initiated at the times when replicas cannot keep up with the primary shard. However, the error rate is offset by the significant CPU and memory gains that segment replication provides.

## Other considerations

The following considerations apply to segment replication in the 2.7 release:

- **Read-after-write guarantees:**  The `wait_until` refresh policy is not compatible with segment replication.  If you use the `wait_until` refresh policy while ingesting documents, you'll get a response only after the primary node has refreshed and made those documents searchable.  Replica shards will respond only after having written to their local translog.  We are exploring other mechanisms for providing read-after-write guarantees. For more information, see the corresponding [GitHub issue](https://github.com/opensearch-project/OpenSearch/issues/6046).  

- **System indexes** will continue to use document replication internally until read-after-write guarantees are available. In this case, document replication does not hinder the overall performance because there are few system indexes. 

- [Enabling segment replication for an existing index](https://github.com/opensearch-project/OpenSearch/issues/3685) requires **reindexing**.


## What's next?

The OpenSearch 2.7 release provides a peer-to-peer (node-to-node) implementation of segment replication. With this release, you can choose to use either document replication or segment replication based on your cluster configuration and workloads. In the coming releases, OpenSearch remote storage, our next-generation storage architecture, will use segment replication as the single replication mechanism. Segment-replication-enabled remote storage will eliminate network bottlenecks on primary shards for clusters with higher replica counts. We are also exploring a chain replication strategy to further alleviate the load on primary shards. For better usability, we are planning to integrate segment replication with OpenSearch Dashboards so that you can enable the feature using the Dashboards UI. 
