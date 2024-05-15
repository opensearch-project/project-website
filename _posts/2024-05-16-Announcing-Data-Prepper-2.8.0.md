---
layout: post
title:  "Announcing Data Prepper 2.8.0"
authors:
- george-chen
- dinujoh
- kkondaka
- dvenable
date: 2024-05-16 13:30:00 -0600
categories:
  - releases
meta_keywords: Amazon DocumentDB, AWS Secrets Manager support, Kafka buffer
meta_description: Data Prepper 2.8.0 improves on search use-cases with Amazon DocumentDB support and includes other improvements.
---

## Introduction

Data Prepper 2.8.0 continues to improve upon Data Prepper’s usefulness for search use cases by adding a new Amazon DocumentDB source, in addition to many other improvements.
We’d like to highlight a few of the major ones for you.


## Amazon DocumentDB

[Amazon DocumentDB](https://aws.amazon.com/documentdb/) is a fast, scalable, and highly available document database that is MongoDB compatible.
Generally, developers will query Amazon DocumentDB on a specific field and create an index on one or more fields for query performance .
However, many teams would also like to search and analyze data in Amazon DocumentDB.
Now you can use Data Prepper and OpenSearch to search and analyze Amazon DocumentDB data.

Data Prepper’s new `documentdb` source ingests documents from an Amazon DocumentDB collection so that you can index those documents in OpenSearch.
You can import existing data from an Amazon DocumentDB collection.
Data Prepper scans the collection to index the documents in OpenSearch.
For new data, Data Prepper can read from Amazon DocumentDB streams to keep your OpenSearch cluster’s data up to date with DocumentDB collection.

The feature supports change data capture (CDC), so it will keep the OpenSearch index up to date with Amazon DocumentDB.
You can add, update, or delete items.
Data Prepper will handle the complicated work of moving this data for you.

Additionally, this feature uses a new approach for defining pipelines with pipeline transformations.
The actual Amazon DocumentDB pipeline consists of multiple pipelines.
However, you can define a single pipeline, and Data Prepper will transform this transparently for you.
The maintainers hope to expand on this concept to improve other sources in the future.


## AWS Secrets Manager: Automatically refresh credentials

In alignment with [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) secrets rotation, Data Prepper now supports automatic basic credential refreshment configured through a Secrets Manager extension for the following plugins:

* OpenSearch source/sink
* Kafka source
* Amazon DocumentDB source

For example, the following example pipeline YAML file will periodically (every 1 hour) poll the latest username and password secrets values and then refresh the Kafka client connection with the latest credentials:

```
extension:
  aws:
    secrets:
      kafka-secret:
        secret_id: "kafka-credentials"
        region: "<<aws-region>>"
        sts_role_arn: "arn:aws:iam::1234567890:role/test-role"
        refresh_interval: "PT1H"
kafka-pipeline:
  source:
    kafka:
      encryption:
        type: "ssl"
      topics:
        - name: "topic_4"
          group_id: "demoGroup"
      bootstrap_servers:
        - "<<bootstrap-server>>:9092"
      authentication:
        sasl:
          plain:
            username: "${{aws_secrets:kafka-secret:username}}"
            password: "${{aws_secrets:kafka-secret:password}}"
  sink:
    ...
```


## Supporting larger messages with the Kafka buffer

[Apache Kafka](https://kafka.apache.org/) messages have a maximum message size, so any attempt to send a message exceeding this size will result in an error.
The default maximum message size is 1 MB, and Data Prepper allows you to change this value up to 4 MB.
Irrespective of the maximum message size setting, it is possible for the external source to send messages larger than the current maximum message size, but Data Prepper will fail to send that message to Kafka.
To prevent this, Data Prepper changes the incoming messages to a size that is slightly smaller than the maximum message size before they are sent to Kafka.
Each message chunk is a standalone message that you can start processing immediately instead of waiting for all chunks to be received.
This chunking of messages is currently supported only for JSON messages received by the HTTP source. Support for large OpenTelemetry metrics/traces/logs will be added in a future release.




## Other features

* The `s3` sink can write events to [Amazon Simple Storage Service (Amazon S3)](https://aws.amazon.com/s3/) objects with data from events in the key paths. This allows you to organize your key prefixes by dates or other metadata and also allows tools such as [Apache Hadoop](https://hadoop.apache.org/) and [Amazon Athena](https://aws.amazon.com/athena/) to more efficiently perform ad hoc queries on your data.
* Data Prepper now has an `ndjson` codec that you can use to read data from Amazon S3 that looks like NDJSON. By default, it is far more lenient and does not require new lines between JSON objects.
* The new `write_json` processor can serialize event data into a JSON string that you can send downstream.
* The `s3` sink supports bucket ownership validation to ensure more secure interactions with Amazon S3.
* A new `typeof` operator allows you to write conditions that check the type of a field. You can use this anywhere you use other Data Prepper expressions, such as in routes or conditions.



## Getting started

* To download Data Prepper, see the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.9 and other releases, see the [Data Prepper roadmap](https://github.com/opensearch-project/data-prepper/projects/1).

