---
layout: post
title:  "Secrets to improving ingestion with OpenSearch"
authors:
  - dtaivpp
date: 2023-11-20 01:00:00 -0700
categories:
    - ingestion
    - clients
twittercard:
  description: Discover the secret to optomizing your OpenSearch cluster! Learn how to boost ingestion speed by 65% and reduce disk size by 19%.
ingestingToOpenSearch: xXEXnNIcvTg
meta_keywords: ingestion, opensearch, optimization, cluster tuning, replication strategies
meta_description: Learn how you can increase your ingestion speed and reduce the size on disk in OpenSearch with these few optomization tips.
excerpt: While most of the optimization secrets I’m sharing with you aren’t intentionally hidden, they sure felt hidden to me when I started with OpenSearch.
---

While most of the secrets I’m sharing with you aren’t intentionally hidden, they sure felt hidden to me when I started with OpenSearch. Part of the reason they aren’t as well known is OpenSearch is growing at a rapid pace. Several things we will cover today were only released within the last few versions. Let’s take a look at how you can get the most out of your OpenSearch cluster, covering everything from your client library to how your data is persisted on disk. Using these strategies I was able to ingest data **65% faster** and **decrease the size on disk by 19%** (measured on a 3-node c5.xlarge cluster using the tarball installation).

# Client Optimization

First and foremost, it’s important to understand our [`_bulk` API](https://opensearch.org/docs/latest/api-reference/document-apis/bulk/). The bulk endpoint allows users to send multiple document actions at once to OpenSearch. This is much more efficient then sending individual document updates one at a time. This is because the `http` protocol takes a fair bit of time, and the more requests you need to make, the more you will experience that overhead.

Below is a sample bulk request. It’s comprised of two parts: the action and the document. The action will include the operation to be performed such as: index, delete, create, update. It also contains additional metadata such as index or document id. The second part is the document you wish to ingest.

```jsx
POST _bulk
{"index": {"_index": "test-index", "_id": 23492543}}
{<document data here>}
{"update": {"_index": "test-index", "_id": 23492543}}
{<updated document data here>}
{"delete": {"_index": "test-index", "_id": 23492543}}
```

With the `_bulk` API there are a few things to know. First things first, you should experiment with multiple sizes for your requests. You can try with 100 items per request and move up from there in increments until the performance no longer improves. Different data has different performance characteristics so it’s important to tune your request size.

Second, after you’ve found the right size for your requests its time to go multi-threaded. Many of our client libraries have asynchronous counterparts. This is important as otherwise you are limited to the amount you can ingest on a single thread on both OpenSearch’s side and client side as well.

The third thing you need to know is the `_bulk` endpoint succeeds even in the event of failures. Because, you are performing several actions some may succeed and some may fail. When there are failures `_bulk` will send back the documents that failed. Even though the http response code may show as a 200 there may still be failures. It’s good practice to have idempotent ingestion (or it can be re-done and produce the same result). Additionally, it’s important to check the http response code for 429’s (too many requests). When you are ingesting data rapidly this can happen so check for that status code and use exponential back off to avoid overwhelming the cluster.

# Host Settings

### JVM Optimization

There are a few optimizations to look into when you are setting up your cluster for OpenSearch. For those who may not know, OpenSearch is a project written in Java and it relies on the JVM (Java Virtual Machine) to run. When the JVM starts up it uses a set amount of memory based on the default configuration (1Gb out of the box). This means that even if you attempt to run OpenSearch on a machine that has 32Gb it will not be able to take full advantage of those resources unless you adjust the settings.

For ingest heavy workloads we recommend setting the JVM size to half of your available memory. There are two ways this can be set:

1. JVM config file (tarball install): `/config/jvm.options`

```bash
# /config/jvm.options

# Min JVM memory size
- Xms16g

# Max JVM memory size
- Xmx16g
```

1. Environment variable (container based installs): `OPENSEARCH_JAVA_OPTS`

```bash
OPENSEARCH_JAVA_OPTS="-Xms16g -Xmx16g“
```

### Translog Flush

A translog flush is when OpenSearch commits the items that have been ingested but not persisted to on-disk Lucene segments. By default this happens every time the translog reaches 512MB. Increasing the translog flush size reduces the frequency of these operations which are resource intensive. Additionally they create larger Lucene segments which merge less frequently saving even more resources for ingestion. To see your current translog statistics you can use the [node stats](https://opensearch.org/docs/latest/api-reference/nodes-apis/nodes-stats/) endpoint like so: `curl -XPOST "<cluster url>/<index name>/_stats/flush?pretty"`

We recommend setting the translog flush size to around 25% of your available Java heap defined earlier. On a node with 16GB of memory we would set our heap to 50% of the available memory which would be 8GB for the heap. Then we would take 25% of the heap to set aside for the translog flushes or 2GB.

```json
POST index-name/_settings
{
	"index": {
		"translog.flush_threshold_size": "2048MB"
	}
}
```

Small note, the translog is not in memory. We set the translog threshold  to 25% of our memory because when the translog flushes it will transfer the data from disk into memory to be compiled into a Lucene segment to be persisted to disk.

# Sharding and Replication

We talked a little bit about threading earlier and now we will dive a little bit more into mechanisms for making things happen in parallel. OpenSearch uses shards to partition indexes. Which shard an index goes to is based off a hash of it’s `_id`. There are primary shards and replica shards. Primary shards are responsible for ingestion and sending the data to the replicas.

### Primary Shard Distribution

We want to ensure we prioritize balancing our shards across nodes so the workload is evenly distributed. Without setting this we could end up with a situation like the one below where all our primary shards for end up on the same node. That would cause our Node 1 here to be completely saturated while the other nodes may be underutilized.

![Primary Shard Distribution](/assets/media/blog-images/2023-11-20-unlocking-the-secrets-to-ingestion/PrimaryShardDistribution.svg){: .img-fluid }

```json
PUT _cluster/settings
{
	"persistent": {
		"cluster.routing.allocation.balanace.prefer_primary": True
	}
}
```

Enabling primary shard distribution ensures primary shards are given the first preference when it comes to spreading them across nodes. When this is enabled replicas may be more likely to end up on the same node however this is okay in an ingestion heavy workload.

![Primary Shard Distribution Enabled](/assets/media/blog-images/2023-11-20-unlocking-the-secrets-to-ingestion/PrimaryShardDistributionEnabled.svg){: .img-fluid }

### Segment Replication

One setting that dramatically impact ingestion is segment replication. Out of the box OpenSearch uses document replication. In this strategy data is first sent to the primary shard which then ingests it back into a Lucene segment. After it’s done that it will send the original unprocessed document to any replicas. They will then ingest the document back to their own Lucene segments. This works really well if you need more immediate consistency however it is duplicating the work done on the CPU for each replica.

![Document Replication](/assets/media/blog-images/2023-11-20-unlocking-the-secrets-to-ingestion/DocumentReplication.svg){: .img-fluid }

With segment replication enabled the first two steps remain the same. Once it gets to the third step is where the magic happens. Instead of sending the original unprocessed document into the replicas we send the processed Lucene segment over the network. Now the nodes that the replicas live on will be free to use more of their compute for ingestion. This comes with a few caveats though. The first is you will be using more bandwidth between nodes as the segments are much larger than the initial documents. It’s important to consider your network topology here. Second, this model is an eventually consistent model as the document updates are not available as readily on replicas. The final, is you will want to increase the refresh interval of the nodes so you do not overwhelm the replica nodes with network traffic. We’ll discuss that more in the next section.

![Segment Replication](/assets/media/blog-images/2023-11-20-unlocking-the-secrets-to-ingestion/SegmentReplication.svg){: .img-fluid }

This setting needs to be applied before the index is created. If you have an index you would like to convert to segment replication you can create a new index and use one of OpenSearch’s reindex api’s to get the data in. Here is how you could configure segment replication for an index.

```json
POST index-name/_settings
{
	"index": {
		"replication.type": "SEGMENT"
	}
}
```

### Refresh Interval

This setting represents amount of time between when a document is received and when it is sent to replicas. This can either be set at a cluster level or on a per-index level. By default OpenSearch uses a 1 second refresh interval but that is probably faster than needed for most people with the observability use case. Below is how you could set that in the index settings. You can change this refresh interval even after the index has already been created.

```json
POST index-name/_settings
{
	"index": {
		"refresh_interval": "30s"
	}
}
```

As we mentioned in the previous section we increase this delay so that we are sending segments less frequently. They are much larger than the original documents so sending them more quickly could end up saturating the connection of a node.

# Compression Settings

When you are storing large amounts of data it can be handy to use compression to minimize on disk size. We have a few different compression algorithms that you can use but the one we will talk about is Zstandard compression (ZSTD). This compression works well because it is tunable, meaning it lets you prioritize either speed or level of compression. Below is the setting we can use to enable ZSTD compression. Note, the compression level is a default of 3 with 6 being the most compressed and 1 being the least.

```json
POST index-name/_settings
{
	"index": {
		"codec": "zstd_no_dict",
		"codec.compression_level": 3
	}
}
```

# End to end

Here are the overall settings that I used (excluding the host settings, as these aren’t applied through the cluster APIs). On the client side we are using the asynchronous Python client to ensure we can saturate our network connection.

For cluster settings, we balance the primary shards and enable segment replication back pressure. The back pressure setting prevents us from overwhelming the nodes if they fall behind the primary replica.

```json
{
  "persistent": {
    "cluster.routing.allocation.balance.prefer_primary": True,
    "segrep.pressure.enabled": True
  }
}
```

Then for our index, we increase the number of shards (and have only one replica for them). We turn on ZSTD compression to decrease the size on disk. Finally, we turn on segment replication and increase the refresh interval.

```json
POST index-name/_settings
{
  "index": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "codec": "zstd_no_dict",
    "replication.type": "SEGMENT",
    "refresh_interval": "30s"
	}
}
```

With all of these settings we were able to see a 65% improvement in ingestion speed and a 19% reduction of the size of our data on disk. These are some pretty serious gains for just doing some straightforward settings updates. While your experience may be different, you now can tune your ingestion to fit the needs of your dataset! Check out [Tuning your cluster for indexing speed](https://opensearch.org/docs/latest/tuning-your-cluster/performance/) for a deeper dive on some of these strategies.

If enjoyed this post and want to see it with some more detail, you can check out my presentation from OpenSearchCon 2023 that this blog was drawn from:

{% include youtube-player.html id=page.ingestingToOpenSearch %}
