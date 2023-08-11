---
layout: post
title:  "Announcing Data Prepper 2.4.0"
authors:
- sudipto
- kkondaka
- nsifmoh
- dlv
date: 2023-08-28 11:30:00 -0500
categories:
  - releases
meta_keywords: Data Prepper, Apache Kafka, Amazon S3 bucket, OpenSearch ingestion
meta_description: OpenSearch has launched Data Prepper 2.4.0 with feature support for Apache Kafka source, S3 batch processing, filtering in sinks, S3 sink codecs, and high-cardinality anomaly detection.
---

Data Prepper 2.4.0 is now available for [download](https://opensearch.org/downloads.html#data-prepper).
This release introduces a number of exciting new features, including a new Kafka source, Amazon S3 batch processing, filtering inside of sinks, new S3 sink codecs, and streaming anomaly detection with high-cardinality.

## Kafka source

[Apache Kafka](https://kafka.apache.org/) (Kafka) is an open-source distributed event streaming platform used by thousands of companies for high-performance data pipeline, streaming analytics, data integration, and mission-critical application.

Deploying Data Prepper pipelines prior to data storage can lead to substantial performance improvements and reduce the need for large amounts of storage.
Therefore, Data Prepper 2.4 adds support for Kafka and Amazon Managed Streaming for Kafka (MSK) as a source, allowing your ingestion pipeline to consume data from one or more topics in a Kafka cluster.
The pipeline with the Kafka source then transforms the data and sends the data to your storage solution of choice, including OpenSearch and Amazon S3.

Furthermore, multiple Data Prepper pipelines can read data from the same Kafka topics, providing you the capabilities to configure Kafka parameters such as the number of consumers per topic, or tune different fetch parameters for high and low priority data.

To get started using Kafka as a source, add the following basic configuration to your timeline.

```
source:
  kafka:
    topics:
    - name: topic1
    group_id: "group_id1"
    - name: topic2
    group_id: "group_id1"
```

For more information about using Kafka and MSK in Data Prepper, including schema registries and data durability, see the [`kafka` source documentation](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/sources/kafka/).

## S3 batch processing

Data Prepper 2.4.0 adds for the S3 scan functionality, which scans Amazon S3 buckets to process existing objects without having to set up Amazon Simple Queue Service (SQS) notifications.
This is ideal for use cases where large amounts of historical data needs to be migrated or for users who want to run night scan jobs on data uploaded to S3 buckets.

Use the following source configuration to get started with S3 scan:

```
source:
  s3:
    acknowledgments: true
    scan:
      start_time: 2023-01-01T00:00:00
      end_time: 2023-12-31T23:59:59
      buckets:
      - bucket:
          # start_time: 2023-01-01T00:00:00
          # end_time: 2023-12-31T23:59:59
          name: "s3-scan-bucket"
          filter:
            exclude_suffix:
            - "*.log"
            include_prefix:
            - "prefix1/"
    delete_s3_objects_on_read: true
    codec:
      newline:
    aws:
      region: "us-east-1"
       sts_role_arn: "arn:aws:iam::1234567890:role/scan-role"
```

For more information about how to configure S3 scan options, see the list of configurable options in the [s3 source documentation](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/sources/s3/).

## Filtering in sinks

Data Prepper 2.4.0 adds the `include_keys` and `exclude_keys` options for sinks, which gives you the flexibility to ingest data from any source and apply common enrichment using a processor chain.
You can also selectively send data to a specific sink, like OpenSearch or S3, for archival purposes.

The following example shows how to implement in the filters inside a sink:

```
sink:
 - opensearch:
    include_keys:
     - srcport
     - dstport
     - srcaddr
     - dstaddr
     - start
     - end
 - s3:
   exclude_keys:
    - version
    - interfaceId
```

S3 sink codecs

Data Prepper 2.4.0 adds new codecs to the [S3 sink](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/sinks/s3/):

* JSON codec: The JSON codec writes an S3 objects as a valid JSON object and includes all events sent to S3 in the JSON array. This is useful when integrating with systems that expect JSON objects.
* Avro codec - The Arvo codecs gives you the ability to define Arvo schemas and write events in the [Avro format](https://avro.apache.org/docs/).
* Parquet codec - The [Apache Parquet (Parquet)](https://parquet.apache.org/) codec lets you use the Parquet columnar format. By saving you data in the Parquet format, you efficiently retrieve that data at a later time for analysis. You can also define your schema in the Avro format inside the Parquet codec.


The following example configures an Avro codec with a schema for network traffic:


```
s3:
  codec:
    avro:
      schema: >
        {
          "type" : "record",
          "namespace" : "org.opensearch.dataprepper.examples",
          "name" : "NetworkTraffic",
          "fields" : [
            { "name" : "sourcePort", "type": "int"},
            { "name" : "destinationPort", "type": "int"},
            { "name" : "sourceAddress", "type" : "string"},
            { "name" : "destinationAddress", "type" : "string"},
            { "name" : "bytes", "type": "int"},
          ]
        }
```

Additionally, the S3 sink can now write compressed gzip or compressed snappy files to reduce your network or storage needs.
To use this setting, add the following to your pipeline:

```
s3:
  compression: gzip
```



## Streaming anomaly detection with high cardinality

The streaming `anomaly_detector` now contains the `identification_keys` options, which creates a Random Cut Forest (RCF) model for each value in the your time-series data.
With the `identification_keys` option, anomalies can be detected in unique set of keys.

The following examples create an `anomaly_detector` processor that detects anomalies for each unique IP address:

```
processor:
- anomaly_detector:
   identification_keys: ["ip"]
   keys: ["latency"]
   mode:
    random_cut_forest:
```

You can write anomalies detected by the processor to a separate index and create alerts using [document level monitors](https://opensearch.org/docs/latest/observing-your-data/alerting/api/#document-level-monitors).

Furthermore, you can use the `verbose` configuration in the anomaly detector processor to change the number of alerts and anomalies shown by the processor, `false` for less, `true` for more.

## OpenSearch sink with 6.8 version

The `opensearch` sink can now write to ElasticSearch 6.8 changing the `distribution_version` setting to `es6`.


## Upcoming changes

Future versions of Data Prepper will include:

* A [`geoip` processor](https://github.com/opensearch-project/data-prepper/issues/253) for extracting locations from IP addresses.
* The ability to [migrate](https://github.com/opensearch-project/data-prepper/issues/1985) from older versions of OpenSearch.
* The ability to write to Amazon Simple Notification Service (SNS) using an [SNS sink](https://github.com/opensearch-project/data-prepper/issues/2938).

For a list of more features we plan to include in future releases, see the [project roadmap](https://github.com/opensearch-project/data-prepper/projects/1).


## Getting started

* To download Data Prepper, see the [OpenSearch downloads](https://opensearch.org/downloads.html) page
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).


## Thanks to our contributors!

TODO - we will supply this after cutting our branch
