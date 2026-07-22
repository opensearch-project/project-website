---
layout: post
title:  "Apache Flink Connector for OpenSearch"
authors:
- ftisiot
- reta
date: 2023-02-10
categories:
 - technical-post

excerpt: "Apache Flink and OpenSearch are widely known and successful open source projects. Even if you have never used them, it is likely you have heard or read about them in search or streaming data transformation use cases. And there are reasons for that: although they target different tech markets, they perform their job very well."
meta_keywords: "Apache Flink Connector for OpenSearch, open-source data processing, Aiven for Apache Flink"
meta_description: "Learn how Aiven uses the Apache Flink Connector data processing solution to write from Apache Flink into an OpenSearch index."
---

Apache Flink® and OpenSearch® are widely known and successful open source projects. Even if you have never used them, it is likely you have heard or read about them in search or streaming data transformation use cases. And there are reasons for that: although they target different tech markets, they perform their job very well. 

This post will help you understand how the Apache Flink Connector for OpenSearch bridges both projects by enabling you to push the outcome of data transformations directly to an OpenSearch index.

<img src="/assets/media/blog-images/2023-01-23-OpenSearch-Flink-Connector/flink_opensearch.png" alt="Flink + OpenSearch"/>{: .img-fluid }

## What is Flink?

From the [official project website](https://flink.apache.org/):

> Apache Flink is a framework and distributed processing engine for stateful computations over unbounded and bounded data streams. Apache Flink has been designed to run in all common cluster environments, perform computations at in-memory speed and at any scale.

Apache Flink started from a fork of Stratosphere's distributed execution engine and became an Apache Incubator project in March 2014. In December 2014, Apache Flink was accepted as an Apache top-level project.

Flink is both a **framework**, providing the basics to create apps in Java, Python, and Scala, and a **distributed processing engine** that can scale both vertically and horizontally.
It is used to create data pipelines over both unbounded (for example, streaming) and bounded (batch) datasets, offering various levels of abstractions, depending on the computation needs.
Data is sourced and sinked through dedicated pluggable connectors, similarly to Apache Kafka. The Apache Flink connector ecosystem is continually evolving, with new technologies being added regularly.

All of these principles make Apache Flink a go-to open source data processing solution for a wide variety of industries and use cases.

## Why did Aiven choose Apache Flink over other options?

Aiven applies dogfooding: Aiven runs on Aiven, meaning that we operate on the same data infrastructure we offer to our clients. Our standard approach is to evaluate open-source solutions for our internal needs, gain experience, make them robust, and then, once we’re confident, offer them to our clients. 

We took the same approach with Flink, which was chosen because it’s open source (Aiven loves open source, and we have a [dedicated OSPO team](https://aiven.io/blog/aivens-open-source-program-office)) and because it has a large, varied, and supportive community.

On the technical side, Flink has all the qualifications to become the de facto standard in data processing because it:

* Unifies unbounded and bounded data pipelines, making the transition from batch to streaming a matter of just redefining data sources/sinks.
* Decouples compute from data storage, meaning that it's possible to change the backend without needing to re-architect the transformation layer.
* Scales both vertically and horizontally to accommodate large workloads.
* Offers a rich SQL interface that covers all our data transformations needs.
* Offers a variety of language SDKs at various abstraction levels.
* Works natively with other open-source tools like PostgreSQL®, Apache Kafka®, and now OpenSearch.

## How does Aiven use Flink?

The spread of [Apache Flink’s SQL functions](https://nightlies.apache.org/flink/flink-docs-master/docs/dev/table/functions/systemfunctions/) means that Flink can be used to define a vast variety of data pipelines. Apart from the traditional analytics or filtering workloads, Aiven is using or planning to use Flink for two main use cases:

* **Streaming joins**: Aiven’s data is streamed through Apache Kafka. Flink jobs help integrate data from different sources on the fly, applying lookups and checking data validation and therefore reducing the load from the data warehouse.

* **Sessionization**: Calculating "user sessions" in the data warehouse is very resource intensive. [Flink’s watermarking feature](https://nightlies.apache.org/flink/flink-docs-master/docs/dev/table/functions/systemfunctions/) allows us to perform sessionization with a simple SQL query.

## What is the best way to get started with Flink?

[Apache Flink’s documentation](https://nightlies.apache.org/flink/flink-docs-master/) is awesome because it covers both the theory behind the tool and the tool's practical usage in great detail.

To start defining the first data pipelines, it might be helpful to use the highest level of abstraction in Flink, represented by its SQL layer. You can experiment with a [Docker version of Flink](https://github.com/aiven/sql-cli-for-apache-flink-docker), which offers bare-bones capabilities, or explore a slicker experience on [Aiven for Apache Flink](https://aiven.io/flink?utm_source=blog&utm_medium=organic&utm_campaign=blog_opensearch_flink_opensearch_connector).

If you’re looking for a practical example, check out [how to build a real-time alerting solution](https://docs.aiven.io/docs/products/flink/howto/real-time-alerting-solution) with Apache Flink and a few SQL statements.

## What does the Apache Flink Connector for OpenSearch do?

The [Apache Flink Connector for OpenSearch](https://github.com/apache/flink-connector-opensearch/) allows writing from Apache Flink into an [OpenSearch](https://opensearch.org/) index (sink side). It does not support reading from the index (source side). The connector is a recent addition to the long list of connectors supported by Apache Flink and is available starting with release **1.16**. 

There are two API flavors that the [Apache Flink Connector for OpenSearch](https://github.com/apache/flink-connector-opensearch/) supports: the DataStream API and the Table API. The Table API is the most convenient way to start off with OpenSearch, because it relies on SQL, which is familiar to many users. Follow the [official instructions](https://nightlies.apache.org/flink/flink-docs-release-1.16/docs/connectors/table/opensearch/) to download the SQL flavor of the connector and deploy it in your Apache Flink cluster. 

## The Apache Flink Connector for OpenSearch in action

To set up an OpenSearch cluster, follow the [OpenSearch installation instructions](https://opensearch.org/docs/latest/opensearch/install/index/). The fastest way to get an OpenSearch cluster running locally is by spawning a [Docker container](https://opensearch.org/docs/latest/opensearch/install/docker/):

```
docker run -d                           \
    -p 9200:9200                        \
    -p 9600:9600                        \
    -e "discovery.type=single-node"     \
    opensearchproject/opensearch:2.5.0
```

The latest OpenSearch version is [**2.5.0**](https://opensearch.org/blog/opensearch-2-5-is-live/); however, you can use the [Apache Flink Connector for OpenSearch](https://github.com/apache/flink-connector-opensearch/) with any `1.x` or `2.x` OpenSearch version. 

### Push data to OpenSearch with the Apache Flink SQL Client

With the OpenSearch cluster up and running, you can use  Apache Flink’s [SQL Client](https://nightlies.apache.org/flink/flink-docs-master/docs/dev/table/sqlclient/) to create a table backed by OpenSearch. The following SQL statement creates an Apache Flink table definition (`myUserTable`) pointing to an OpenSearch index named `users`:

```
CREATE TABLE myUserTable (
  user_id STRING,
  user_name STRING,
  uv BIGINT,
  pv BIGINT,
  PRIMARY KEY (user_id) NOT ENFORCED
) WITH (
  'connector' = 'opensearch',
  'hosts' = 'https://localhost:9200',
  'username' = 'admin',
  'password' = 'admin',
  'allow-insecure' = 'true',
  'index' = 'users'
);
```

The `'connector' = 'opensearch'` parameter defines the type of connector. The `hosts`, `username`, and `password` define the target OpenSearch endpoint and authentication credentials.
By default, OpenSearch distributions come with security turned on, requiring communication over HTTPS and mandatory username/password authentication. The `allow-insecure` connector option allows connections to clusters that use self-signed certificates. 
The `index` parameter defines the target OpenSearch index.

You may be wondering what happens if we insert some data into the table. Let's see.

The following SQL statement inserts some data into the `myUserTable` table:
 
```
INSERT INTO myUserTable VALUES ('u1', 'admin', 100, 200)
```

The data should appear in the target OpenSearch `users` index. You can use `curl` to search the index with the following command:

```
curl -ki -u admin:admin https://localhost:9200/users/_search?pretty
```

The result should contain the values listed in the preceding SQL statement in the `_source` field:

```
{
  ...,
  "hits" : {
    ...,
    "hits" : [
      {
        "_index" : "users",
        "_id" : "u1",
        "_score" : 1.0,
        "_source" : {
          "user_id" : "u1",
          "user_name" : "admin",
          "uv" : 100,
          "pv" : 200
        }
      }
    ]
  }
}
```

### Push data to OpenSearch with the Apache Flink DataStream API

The [Apache Flink DataStream API](https://nightlies.apache.org/flink/flink-docs-master/docs/dev/datastream/overview/) allows you to write Apache Flink data pipelines in Java and Scala and therefore allows the use of the Apache Flink Connector for OpenSearch. 

Refer to the [OpenSearch SQL Connector](https://nightlies.apache.org/flink/flink-docs-release-1.16/docs/connectors/table/opensearch/) instructions for information about the necessary dependencies for the build tool of your choice. The following example mimics the data push to the target OpenSearch `users` index in the previous SQL-based code:

```
final StreamExecutionEnvironment env = StreamExecutionEnvironment
        .createRemoteEnvironment("localhost", 8081);

final Collection<Tuple4<String, String, Long, Long>> users = new ArrayList<>();
users.add(Tuple4.of("u1", "admin", 100L, 200L));

final DataStream<Tuple4<String, String, Long, Long>> source = env.fromCollection(users);
final OpensearchSink<Tuple4<String, String, Long, Long>> sink =
    new OpensearchSinkBuilder<Tuple4<String, String, Long, Long>>()
        .setHosts(new HttpHost("localhost", 9200, "https"))
        .setEmitter( (element, ctx, indexer) -> {
            indexer.add(
                Requests
                    .indexRequest()
                    .index("users")
                    .id(element.f0)
                    .source(Map.ofEntries(
                        Map.entry("user_id", element.f0),
                        Map.entry("user_name", element.f1),
                        Map.entry("uv", element.f2),
                        Map.entry("pv", element.f3)
                    )));
                })
        .setConnectionUsername("admin")
        .setConnectionPassword("admin")
        .setAllowInsecure(true)
        .setBulkFlushMaxActions(1)
        .build();

source.sinkTo(sink);
env.execute("OpenSearch end to end sink test example"); 
```

Like in the previous example, the data should appear in the OpenSearch `users` index.


## How can I contribute?

Because the [Apache Flink Connector for OpenSearch](https://github.com/apache/flink-connector-opensearch/) is hosted by the [Apache Software Foundation](https://www.apache.org/), anyone can contribute to it. 

The process is very simple:

* Create a [JIRA issue](https://issues.apache.org/jira/projects/FLINK).
* Create a pull request in the [Apache Flink Connector for OpenSearch repository](https://github.com/apache/flink-connector-opensearch/).
* Optionally, once the pull request is merged, ask for a connector release by following the [release process](https://cwiki.apache.org/confluence/display/FLINK/Creating+a+flink-connector+release).

Apache Flink has a large community, and the project is being actively developed. Even though reviewing and merging changes may take some time, it should not discourage anyone from contributing. One of the interesting new features being developed is the implementation of a new generation of sinks based on [this proposal](https://cwiki.apache.org/confluence/display/FLINK/FLIP-171%3A+Async+Sink) proposal. The [related pull request](https://github.com/apache/flink-connector-opensearch/pull/5) is already open, so please feel free to check it out and contribute! 

If you want to get involved or just stay informed of what is happening in the Apache Flink community, please consider subscribing to the [mailing list](https://flink.apache.org/community.html#how-to-subscribe-to-a-mailing-list) or joining the official [Slack channel](https://flink.apache.org/community.html#slack). 



