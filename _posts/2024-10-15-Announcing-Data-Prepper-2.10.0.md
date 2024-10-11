---
layout: post
title: Announcing Data Prepper 2.10.0
authors:
- dvenable
- TODO
date: 2024-10-15 12:30:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.10.0 offers an OpenSearch _bulk API and reads from Amazon Kinesis
meta_keywords: Data Prepper, _bulk, Amazon Kinesis Data Streams, OTel Logs, OTLP JSON
meta_description: Data Prepper 2.10.0 offers a source that simulates the OpenSearch _bulk API and another source for reading from Amazon Kinesis Data Streams.
---

## Introduction

Data Prepper 2.10 is now available for the community to use. 
Two major features include a source to send data to Data Prepper using an API mimicking the OpenSearch `_bulk` API from OpenSearch and reading from Amazon Kinesis Data Streams.


## OpenSearch API source

Many existing OpenSearch clients that perform ingestion directly to OpenSearch can now send that data to Data Prepper first.
With this, you can use Data Prepper's buffering and rich processor set before sending data to OpenSearch without having to change clients when they are using the OpenSearch `_bulk` API. 
A new source has been added in Data Prepper named `opensearch_api` that accepts [OpenSearch Document API Bulk operation](https://opensearch.org/docs/latest/api-reference/document-apis/bulk/) requests from clients using REST and ingests data into OpenSearch. 
The behavior of this source is also quite similar to the existing `http` source. 
It supports industry-standard encryption in the form of TLS/HTTPS and HTTP basic authentication. 
It parses incoming requests and create Data Prepper events and associated event metadata making it compatible with the `opensearch` sink. 
The request body should be compatible with OpenSearch Document API Bulk Operation and will also support all the actions like index, create, delete and update.

The two HTTP methods supported now are the following:

```
POST _bulk
POST <index>/_bulk
```

The second API which specifies the index in the path means you don’t need to include it in the request body.

Moreover, the following query parameters are also supported that are available in OpenSearch Document API Bulk Operation as the following below:

* pipeline
* routing

An example of using the source

```
version: "2"
opensearch-api-pipeline:
  source:
    opensearch_api:
  sink:
    - opensearch:
        hosts: ["https://opensearch:9200"]
        insecure: true
        username: "admin"
        password: "admin"
        index: "${getMetadata(\"opensearch_index\")}"
        action: "${getMetadata(\"opensearch_action\")}"
        document_id: "${getMetadata(\"opensearch_id\")}"
        routing: "${getMetadata(\"opensearch_routing\")}"
        pipeline: "${getMetadata(\"opensearch_pipeline\")}"
```

Consider the sample:

```
POST _bulk
{ "index": { "_index": "movies", "_id": "tt1979320" } }
{ "title": "Rush", "year": 2013 }
```

The above request will be ingested into OpenSearch and a new document will be created under the index movies with a document id `tt1979320` with the document `{ "title": "Rush", "year": 2013 }`.

Over time, the Data Prepper maintainers are interested in expanding this source to support other indexing APIs to allow it to stand-in for an OpenSearch cluster for ingestion workloads.
To learn more or express interest see [Provide an OpenSearch API source #4180](https://github.com/opensearch-project/data-prepper/issues/4180).


## Kinesis source

[Amazon Kinesis Data Streams](https://docs.aws.amazon.com/streams/latest/dev/introduction.html) is a high speed streaming data service. 
Data Prepper is introducing a new source named `kinesis` which can be used to ingest stream records data from multiple Kinesis data streams into OpenSearch clusters. 
You can configure it to read stream records from the beginning or from the latest record. 
Moreover, if you enable end to end acknowledgements, Kinesis data streams will be checkpointed to prevent duplicate processing of records.

Sample pipeline

```
version: "2"
kinesis-pipeline:
  source:
    kinesis:
      codec:
        newline:
      streams:
        - stream_name: "MyStream1"
          initial_position: LATEST
          checkpoint_interval: "PT5M"
        - stream_name: "MyStream2"
          # Enable this if ingestion should start from the start of the stream.
          initial_position: EARLIEST
          consumer_strategy: "polling"
          polling:
            max_polling_records: 100
            idle_time_between_reads: "250ms"
```



## Other features and improvements

Data Prepper 2.10 has a number of other changes to make it more powerful for the community.

* The kafka source now supports authenticating with an Apache Kafka cluster using SASL/SCRAM in addition to the SASL/PLAIN authentication provided in previous versions.
* Data Prepper can now parse OpenTelemetry logs from sources such as Amazon S3. The new `otel_logs` codec parses data from OpenTelemetry Protocol (OTLP) JSON formatted files. Now you can write OpenTelemetry logs from [AWS S3 Exporter for OpenTelemetry Collector](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/exporter/awss3exporter/README.md) and read these from Data Prepper. 
* Additionally, the maintainers have worked to improve the performance through the addition of an internal cache for event keys. Data Prepper administrators can configure this cache as necessary. 


## Next steps

* To download Data Prepper, visit the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.11 and other releases, see the [Data Prepper roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

The following community members contributed to this release. Thank you!

TODO
