---
layout: post
title:  "Optimize OpenSearch index shard sizes"
authors:
  - ev2900
  - ronmiller
date: 2023-07-06
categories:
  - technical-posts
meta_keywords: OpenSearch index, OpenSearch shards, shard optimization, optimize shard sizes OpenSearch
meta_description: Learn how optimizing the number of primary and replica shards in your OpenSearch index can help you improve search latency and write performance.
---

This blog post discusses optimizing the number shards in an OpenSearch index. Optimizing shard sizes helps you get the best performance from OpenSearch.

## Introduction
An OpenSearch index is composed of shards. Each document in an index is stored in the shards of an index. An index can have two types of shards, primary and replica. When you write documents to an OpenSearch index, indexing requests first go through primary shards before they are replicated to the replica shard(s). Each primary shard is hosted on a data node in an OpenSearch domain. When you read/search data in OpenSearch, a search request may interact with a number of replica or primary shards. Replica shards are automatically updated, mirroring their corresponding primary shards.

An index can have many primary and replica shards. The number of primary and replica shards is initially set when an index is created. When you create an index, if a number of primary or replica shards is not specified, OpenSearch defaults to one primary and one replica shard, for a total of two shards. The number of shards you set for an index should correspond to the size of an index. Too many small shards or too few large shards degrade OpenSearch performance.

## Ideal shard size(s)
OpenSearch indexes have an ideal shard size. Shard size matters with respect to both search latency and write performance. Having too many small shards can be an issue because metadata for shards is stored in the Java Virtual Machine (JVM) memory heap. If you have too many small shards, you can exhaust memory storing metadata unnecessarily. Having too few large shards can work against the distributed compute capabilities of OpenSearch. Each primary shard is hosted on a data node, allowing for both read and write requests to be distributed across multiple nodes. Having too few large shards doesn’t allow OpenSearch to distribute requests over the entire domain.

What is the ideal number of shards? Only performance testing different numbers of shards, and by association different shard sizes, can determine the ideal number of shards for your index. This given, a good place to start is with a number of shards that gives your index shard sizes between 10--50 GB per shard. Specifically, 10--30 GB per shard is preferred for workloads that prioritize low search latency. Often, these are application search workloads. For write-heavy workloads, 30--50 GB per shard is preferred. Often, these are log analytics workloads.

## View the number and size of shard(s) in an index
Running the API ```GET _cat/indices/?v``` displays the indices on the OpenSearch domain. It also displays the number of primary shards, the replication factor, and the principal storage size. Comparing the storage size and number of primary shards can provide a quick overview of which indices may have suboptimal shard counts.

In the following example, the index named *sample-data-5-1* has five primary shards, each with one replica, for a total of 10 shards. The principal storage size is only 176.9 KB. This means 176.9 KB is stored across five primary shards. Given the small storage size, five primary shards is too many. 

<img src="/assets/media/blog-images/2023-07-06-optimize-index-shard-size/cat_indicies.png" alt="cat/indicies"/>{: .img-fluid }

To view the sizes of the individual shards in an index, run ```GET _cat/shards/<name_of_index>?v```.

Using the cat shards API on the example sample-data-5-1 index, you can see that the primary shards are all less than 1 MB in size. This is too small.

<img src="/assets/media/blog-images/2023-07-06-optimize-index-shard-size/cat_shards.png" alt="cat/indicies"/>{: .img-fluid }

## Change the number of primary shards
It is always best to configure an appropriate number of primary shards when an index is created. The number of primary shards cannot be easily adjusted after an index is created. To adjust the number of primary shards, you must create a new index with the desired number of shards and then either use the reindex API to copy data from the old index to the new index or reingest the data into the new index from the source.

Following along with the example, the following API call creates a new index with one primary shard and one replicate.

```
PUT sample-data-1-1
{
  "settings": {
  "index": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  }
  }
}
```

Once the new index is created with the desired number of primary shards, the reindex API can copy data to the new index from the old index.

Following along with the example, the following API call copies data from the *sample-data-5-1* index to the *sample-data-1-1* index.

```
POST _reindex
{
  "source": {
    "index": "sample-data-5-1"
  },
  "dest": {
    "index": "sample-data-1-1"
  }
}
```

Note a few additional considerations:
* Before reindexing or copying data from the old index to the new index you may consider setting the old index to read only. This ensures that no new data is written to the old index during the copy.
* Free storage space should be considered before reindexing. When copying data to a new index, the new index will consume storage. Ensure you have sufficient free storage before reindexing.
* When creating a new document, always consider using index templates if available. Index templates contain schema information for an index including data types. Using an index template during index creation helps ensure the correct settings are applied to the new index. Index templates are often used in log analytics workloads where new indexes are created frequently.

Following along with the example, we could run the following API call to block all incoming writes to the *sample-data-5-1* index.

```
PUT sample-data-5-1/_settings
{
  "index": {
    "blocks.read_only": true
  }
}
```

## Change the number of replica shards
The number of replicate shards for an index can be easily adjusted after an index is created. The index setting API allows for changing the number of replica shards without needing to create a new index and copying data.

An OpenSearch index has both dynamic and static settings. You can change dynamic index settings at any time, but static settings cannot be changed after index creation. The number of replicas is a dynamic setting, hence why it can be changed without needing to create a new index and copy the data.

Following along with our example, if we want to change the replication factor for the *sample-data-1-1* index from 1 to 0 (that is, no replicas), we can use the index settings API:

```
PUT sample-data-1-1/_settings
{
  "index" : {
    "number_of_replicas": 0
  }
}
```

## Conclusion and other resources
Optimizing the number and size of shards in your index can help you get the best performance from OpenSearch. Thinking about and setting the correct number of primary shards when you first create an index is best. However, if your index size changes or you use the default number of primary shards and the defaults don’t work well for your index, you can use this blog post as a guide to help you optimize shard counts.

If you prefer to learn about this topic in video format instead of a blog post, check out this YouTube video: [OpenSearch - How to change the number of primary and replica shard(s) of an index](https://www.youtube.com/watch?v=xadv93LlbY4). This blog post is based on this GitHub repository: [OpenSearch_Read_Only_Index](https://github.com/ev2900/OpenSearch_Read_Only_Index)

If you are using Amazon OpenSearch Service, the AWS documentation also has information on index shard sizes. The [operational best practices shard strategy](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/bp.html#bp-sharding-strategy) section includes recommendations specific to the AWS managed service.
