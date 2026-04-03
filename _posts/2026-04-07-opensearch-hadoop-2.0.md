---
layout: post
title: 'Introducing OpenSearch Hadoop 2.0: Spark 4 support, OpenSearch Serverless, and more'
authors:
  - hsotaro
date: 2026-04-07 12:00:00 -0600
categories:
  - releases
  - technical-posts
excerpt: OpenSearch Hadoop 2.0 adds Apache Spark 3.5 and 4 support, OpenSearch 3.x compatibility, Amazon OpenSearch Serverless support, and AWS SDK v2 migration.
meta_keywords: OpenSearch Hadoop, Apache Spark, Spark 4, OpenSearch connector, PySpark, Hadoop connector
meta_description: OpenSearch Hadoop 2.0 adds Apache Spark 3.5 and 4 support, OpenSearch 3.x compatibility, Amazon OpenSearch Serverless support, and AWS SDK v2 migration.
has_science_table: true
---

OpenSearch Hadoop 2.0 is now available. Key updates include Apache Spark 3.5 and 4 support, OpenSearch 3.x compatibility, Amazon OpenSearch Serverless support, and many more.

Along with this release, we have published a new [Hadoop connector](https://docs.opensearch.org/latest/clients/hadoop/) documentation page that covers setup, usage examples, and configuration options. This post walks you through the basics and highlights what's new.

## What is OpenSearch Hadoop?

![OpenSearch Hadoop architecture](/assets/media/blog-images/2026-04-07-opensearch-hadoop-2.0/opensearch-hadoop-architecture.png)

[OpenSearch Hadoop](https://github.com/opensearch-project/opensearch-hadoop) is a connector that lets you read and write data between [Apache Spark](https://spark.apache.org/), [Apache Hive](https://hive.apache.org/), [Hadoop MapReduce](https://hadoop.apache.org/docs/current/hadoop-mapreduce-client/hadoop-mapreduce-client-core/MapReduceTutorial.html), and OpenSearch. These are all distributed systems, and the connector takes advantage of that by parallelizing reads and writes across compute partitions and OpenSearch shards, enabling efficient processing of large volumes of data.

## What's new in 2.0

### Apache Spark 3.5 and 4 support

OpenSearch Hadoop 2.0 introduces dedicated modules for Spark 3.5 and Spark 4 alongside the existing Spark 3.4 module. Choose the artifact that matches your Spark and Scala version:

| Spark version | Scala version | Artifact |
|:---|:---|:---|
| 3.4.x | 2.12 | `org.opensearch.client:opensearch-spark-30_2.12:2.0.0` |
| 3.4.x | 2.13 | `org.opensearch.client:opensearch-spark-30_2.13:2.0.0` |
| 3.5.x | 2.12 | `org.opensearch.client:opensearch-spark-35_2.12:2.0.0` |
| 3.5.x | 2.13 | `org.opensearch.client:opensearch-spark-35_2.13:2.0.0` |
| 4.x | 2.13 | `org.opensearch.client:opensearch-spark-40_2.13:2.0.0` |

The Spark 3.5 module lets you use the connector on platforms that ship with Spark 3.5. The Spark 4 module brings support for the latest Spark release, including Spark 4.0 and 4.1, so you can take advantage of the newest Spark features while reading and writing data to OpenSearch.

To try it out with Spark 4, launch a PySpark shell with the connector loaded using `--packages`:

```
pyspark --packages org.opensearch.client:opensearch-spark-40_2.13:2.0.0
```

Then write and read data:

```python
# Write documents to OpenSearch
df = spark.createDataFrame([("John", 30), ("Jane", 25)], ["name", "age"])
df.write.format("opensearch") \
    .option("opensearch.nodes", "<opensearch host>") \
    .option("opensearch.port", "<port>") \
    .save("people")

# Read documents from OpenSearch
df = spark.read.format("opensearch") \
    .option("opensearch.nodes", "<opensearch host>") \
    .option("opensearch.port", "<port>") \
    .load("people")
df.show()
```

You can also push queries down to OpenSearch so that only matching documents are transferred to Spark:

```python
filtered = spark.read \
    .format("opensearch") \
    .option("opensearch.nodes", "<opensearch host>") \
    .option("opensearch.port", "<port>") \
    .option("opensearch.query", '{"query":{"match":{"name":"John"}}}') \
    .load("people")
filtered.show()
```

For authentication options, Scala, Java, and Spark SQL examples, see the [Hadoop connector documentation](https://docs.opensearch.org/latest/clients/hadoop/).

### Amazon OpenSearch Serverless support

You can now use the connector with [Amazon OpenSearch Serverless](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless.html) collections. Configure the connector with AWS SigV4 authentication and the `aoss` service name:

```python
df = spark.createDataFrame([("product-1", 29.99), ("product-2", 49.99)], ["name", "price"])
df.write.format("opensearch") \
    .option("opensearch.nodes", "https://<collection-id>.<region>.aoss.amazonaws.com") \
    .option("opensearch.port", "443") \
    .option("opensearch.nodes.wan.only", "true") \
    .option("opensearch.net.ssl", "true") \
    .option("opensearch.aws.sigv4.enabled", "true") \
    .option("opensearch.aws.sigv4.region", "<region>") \
    .option("opensearch.aws.sigv4.service", "aoss") \
    .save("my-collection")
```

### OpenSearch 3.x compatibility

The connector has always communicated with OpenSearch over its REST API, so it worked with OpenSearch 3.x out of the box. With this release, the build and test infrastructure has been updated to officially support and test against OpenSearch 3.x clusters.

## Other notable changes

* The legacy Spark 2.x module has been removed.
* The AWS authentication layer has been migrated from AWS SDK v1 to v2, bringing support for newer credential providers and aligning with the AWS SDK v1 end-of-maintenance timeline.
* The minimum runtime JDK has been raised from 8 to 11, and the minimum build JDK is now 21.
* Various bug fixes have improved overall stability. For the full list of changes, see the [CHANGELOG](https://github.com/opensearch-project/opensearch-hadoop/blob/main/CHANGELOG.md).

## Getting started

* To download OpenSearch Hadoop, see the [Maven Central](https://central.sonatype.com/search?q=org.opensearch.client%20opensearch-spark) artifacts.
* For usage examples and configuration options, see the [Hadoop connector documentation](https://docs.opensearch.org/latest/clients/hadoop/).
* To learn more about the project, see the [OpenSearch Hadoop](https://github.com/opensearch-project/opensearch-hadoop) repository.

We welcome your feedback on this release. If you have questions or suggestions, please visit the [community forum](https://forum.opensearch.org/) or open an issue on [GitHub](https://github.com/opensearch-project/opensearch-hadoop/issues).
