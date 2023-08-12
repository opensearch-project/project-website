---
layout: post
title:  "Announcing Data Prepper 2.4.0"
authors:
- sudipto
- kkondaka
- nsifmoh
- dlv
date: 2023-08-17 14:30:00 -0500
categories:
  - releases
meta_keywords: Data Prepper 2.4.0
meta_description: Data Prepper 2.4.0 reads from Kafka, has more features for reading and writing to S3, and more.
---

The maintainers are happy to announce the release of Data Prepper 2.4.0. 
This release includes a number of exciting new features, including a very common ask - a Kafka source.
You can [download](https://opensearch.org/downloads.html#data-prepper) Data Prepper 2.4.0 now.


## Kafka source

[Apache Kafka](https://kafka.apache.org/) is a popular open-source stream-processing platform and real-time data streaming system. 
It is used for a variety of purposes across industries due to its ability to handle high-throughput, fault-tolerant, and scalable data streaming.

A growing number of enterprises that employ Kafka for data streaming are recognizing the importance of efficiently storing their data in OpenSearch to enable effective data search functionality. 
Employing Data Prepper for ETL tasks prior to data storage in OpenSearch can lead to substantial performance improvements and reduced storage requirements. 
Furthermore, this approach empowers Data Prepper to conduct real-time anomaly detection and aggregation, contributing to enhanced functionality.

Support for Kafka as a source allows the ingestion pipeline to consume data from one or more topics in a Kafka cluster and transform the data before sending the data to a sink such as OpenSearch. 
Multiple pipelines can read from the same Kafka topic too.

Data Prepper also supports reading from [Amazon Managed Streaming for Apache Kafka (MSK)](https://aws.amazon.com/msk/)

Kafka source can be configured to subscribe to multiple topics with each topic level subscription with many user configurable parameters like, number of consumers per topic or the max fetch bytes.  
Kafka source can be started with the following basic configuration;

```
topics:
  - name: topic1
    group_id: "group_id1"    
  - name: topic2
    group_id: "group_id1"
```

Kafka source can be configured with or without authentication. 
By default, Kafka source uses authentication with encryption.
However, it can be disabled to help with development and testing.
When using Amazon MSK, `aws_msk_iam` authentication should be used, in all other cases, username/password authentication should be used for security.

```
    encryption: 
       type: "ssl"
    authentication:
      sasl:
        plaintext:
          username: myuser
          password: mysecret
```

The `kafka` source supports end-to-end acknowledgements. 
When acknowledgements are enabled, Kafka offset commits are done only after the data consumed from Kafka is delivered to the sink or dead-letter queue (DLQ).

Kafka source optionally supports using schema registry.
It supports two popular schema registries: Glue and Confluent.

## S3 sink improvements

Data Prepper 2.4.0 adds additional improvements to the `s3` sink to meet more use cases when writing to [Amazon S3](https://aws.amazon.com/s3/). 
This release includes three new codecs for the data it is writing.


* JSON codec - This codec will write an S3 object which is a valid JSON object. All the events will be found within an array. This can be useful when integrating with systems that expect a JSON object.
* Avro codec - You can define your Avro schema and write events in the efficient [Avro format](https://avro.apache.org/docs/).
* Parquet codec - [Apache Parquet](https://parquet.apache.org/) is a popular columnar format. By saving your Data in Parquet format you can later efficiently retrieve data for analysis. 
* CSV codec - This codec supports writing events as a delimited format, this can be CSV, TSV, or other delimited formats.


For example, you can configure the Avro codec with a schema for network traffic using a similar approach to the following.

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

Additionally, the S3 sink can now write compressed gzip files to reduce your network and storage needs. 
You can include this in your S3 sink configuration similar to the following.

```
s3:
  compression: gzip
```

## Filtering in sinks

User can configure option of `include_keys` and `exclude_keys` under sink to allow-list or deny-list data being written to sinks. 
This provides flexibility to ingest data from any source, apply common enrichments using a processor chain and selective send data to a specific sink like OpenSearch while sending all other data to sink like S3 for archival purpose. 
Archived data in S3 can be written in columnar format say Parquet and can be easily queried in Athena or any other compatible query service. 
Users can on-demand hydrate S3 archived data back to OpenSearch using S3-scan for richer analytics. 
Such filtering allows to optimize storage requirements and hence reduces the cost of overall solution by sending specific data to specific Sinks.

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



## S3 scan

Data Prepper 2.4.0 adds support to `s3` source for scanning Amazon S3 buckets to process existing objects without having to use an Amazon Simple Queue Service (SQS) queue.

User can configure the start and end time of scan which includes objects in scan based on the object’s last modified time. 
Scan can be configured with multiple buckets and start time, end time can be configured at bucket level which will override top level options.

The following source configuration can be used to get started with S3 scan.

```
s3:
  scan:
    start_time: 2023-01-01T00:00:00
    end_time: 2023-12-31T23:59:59
   buckets:
     - bucket:
         name: "s3-scan-bucket"
         filter:
         exclude_suffix:
           - "*.log"
         include_prefix:
           - "prefix1/"
   acknowledgments: true
   delete_s3_objects_on_read: true
   codec:
     newline:
   aws:
     region: "us-east-1"
     sts_role_arn: "arn:aws:iam::123456789012:role/scan-role"
```

Objects scanned using S3 scan can be deleted after processing successfully using the following configuration in s3 source. 
This feature will only work with acknowledgements enabled.

```
s3:
delete_s3_objects_on_read: true
```

Optionally, scanning the bucket can be configured to be done periodically.
The schedule can be configured using an interval between scans.
If no scheduling is configured, then buckets will be scanned once.


See the [s3 sink documentation]((https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/sources/s3/)) for complete set of configurable options.


## Anomaly detection with high cardinality

The anomaly detector plugin will now take an optional value `identification_keys`. 
This value will act the same as it does in the aggregate processor, and will cause the plugin to create a different Random Cut Forest (RCF) model for each group of values identified by the `identification_keys`. 
With this new option, anomalies can be detected in each unique set of identification keys. 
The following configuration will detect latency anomalies for each unique IP address. 
Without the `identification_keys` the anomaly detector would detect anomalies across all IP addresses.

```
processor:
- anomaly_detector:
    identification_keys: ["ip"]
    keys: ["latency"]
    mode:
      random_cut_forest:
```

User can write these anomalies on a separate index and create alerts on these anomalies using [document level monitors](https://opensearch.org/docs/latest/observing-your-data/alerting/api/#document-level-monitors).

We also listened to feedback from customers and took steps towards making the anomaly detection adjustable. 
Notions of anomaly varies across applications as well as use cases. 
For example, how many anomalies would one expect to find in the sequence?


![Anomaly Detection sequence graph](/assets/media/blog-images/2023-08-17-Announcing-Data-Prepper-2.4.0/ad-graph.png){: .img-fluid}

It is quite natural that some use case would expect all the peaks to be labeled anomalies. 
Yet it is also natural that the peaks at the same repeated level are not considered anomalous and one expects only a few anomalies. 
Data Prepper 2.4.0 introduces a `verbose` configuration in anomaly detection processor. 
It is set to false as a default to reduce alerts and produce fewer anomalies, but can be changed to true to increase recall and address broader use cases.

## Other changes

Data Prepper 2.4.0 adds a few other features that can help many different users.

* The Data Prepper `opensearch` sink can now write to ElasticSearch 6.8 clusters. So now you can benefit from Data Prepper's rich feature set on even more versions.


## Upcoming changes

There is a lot of work underway for future versions of Data Prepper.
A few noteworthy features include a [`geoip` processor](https://github.com/opensearch-project/data-prepper/issues/253) extracting locations from IP addresses, [migrations](https://github.com/opensearch-project/data-prepper/issues/1985) from older versions of OpenSearch, and writing to Amazon Simple Notification Service (SNS) using an [SNS sink](https://github.com/opensearch-project/data-prepper/issues/2938).
Take a look at the [project roadmap](https://github.com/opensearch-project/data-prepper/projects/1) to see what we have planned, and add your support to features you are most looking forward to.

## Getting started

* To download Data Prepper, see the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).



## Thanks to our contributors!

TODO - we will supply this after cutting our branch
