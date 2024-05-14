---
layout: post
title:  "Announcing Data Prepper 2.8.0"
authors:
- qichen
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

Data Prepper 2.8.0 continues to improve upon Data Prepper’s usefulness for search use-cases by adding a new Amazon DocumentDB source.
It has many other improvements.
We’d like to highlight a few of the major ones for you.


## Amazon DocumentDB

[Amazon DocumentDB](https://aws.amazon.com/documentdb/) is a fast, scalable, and highly available document database that is MongoDB compatible.
Generally, developers will query DocumentDB on specific field and create index on one or more fields for query performance .
However, many teams would also like to search and analyze data in DocumentDB.
Now you can use Data Prepper and OpenSearch to search and analyze DocumentDB data.

Data Prepper’s new `documentdb` source ingests documents from a DocumentDB collection so that you can index those documents in OpenSearch.
You can import existing data from DocumentDB collection.
Data Prepper scans the collection to index the documents in OpenSearch.
For new data, Data Prepper can read from DocumentDB Streams to keep your OpenSearch cluster’s data up-to-date with DocumentDB collection.

The feature supports change data capture (CDC), so it will keep the OpenSearch index up-to-date with DocumentDB.
You can add items, update items, and delete them.
Data Prepper will handle the complicated work of moving this data for you.

Additionally, this feature is using a new approach for defining pipelines with pipeline transformations.
The actual DocumentDB pipeline consists of multiple pipelines.
However, you can define a single pipeline and Data Prepper will transform this transparently for you.
The maintainers hope to expand on this concept further to improve other sources in the future.


## AWS Secrets - automatic credentials refresh

In alignment with rotate [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) secrets, Data Prepper now supports automatic basic credentials refreshment configured through AWS secrets extension for the following plugins:

* OpenSearch source/sink
* Kafka source
* DocumentDB source

For example, the following pipeline YAML

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

will periodically (every 1 hour) poll the latest secrets values for username and password and then refresh the kafka client connection with the latest credentials.

## Supporting larger messages with the Kafka buffer

[Apache Kafka](https://kafka.apache.org/) messages have a maximum message size and any attempts to send larger messages will result in errors.
The default max message size is 1MB, and Data Prepper allows changing this value to 4MB.
Irrespective of the current setting of the max message size, it is possible for the external source to send messages larger than the current max message size and Data Prepper fails to send that message to Kafka.
To prevent this, Data Prepper is modified to split the incoming messages to a size that is slightly smaller than the max message size before it is sent to Kafka.
Each message chunk is stand-alone message such a way that the consumer of the message can start processing it immediately instead of waiting for all chunks to be received.
This chunking of messages is currently supported only for JSON messages received by http source. Support for large OTEL metrics/traces/logs will be added in a future release.




## Other features

* The `s3` sink can write events to [Amazon S3](https://aws.amazon.com/s3/) objects with data from events in the key paths. This allows you to organize your key prefixes by dates or other metadata. This allows tools such as [Apache Hadoop](https://hadoop.apache.org/) and [Amazon Athena](https://aws.amazon.com/athena/) to more efficiently perform ad-hoc queries on your data.
* Data Prepper now has an `ndjson` codec you can use to read data from S3 that looks like ndjson. By default, it is far more lenient and does not require newlines between JSON objects.
* The new `write_json` processor can serialize event data into a JSON string that you can send downstream.
* The `s3` sink supports bucket ownership validation for more secure interactions with Amazon S3.
* A new `typeof` operator allows you to write conditions which check the type of a field. You can use this anywhere you use other Data Prepper expressions such as in routes or when conditions.



## Getting started

* To download Data Prepper, see the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.9 and other releases, see the [Data Prepper roadmap](https://github.com/opensearch-project/data-prepper/projects/1).

