---
layout: post
title: Announcing Data Prepper 2.10.0
authors:
- dvenable
- TODO
date: 2024-10-15 12:30:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.10.0 offers an OpenSearch _bulk API and reads from Amazon Kinesis.
meta_keywords: Data Prepper, OpenSearch bulk API, Kinesis data streams, Kafka, SASL/SCRAM authentication, streaming data ingestion
meta_description: Data Prepper 2.10.0 adds OpenSearch API and Kinesis Data Streams sources for seamless ingestion, plus Kafka SASL/SCRAM support and OpenTelemetry log parsing.
---

## Introduction

Data Prepper 2.10 is now available! 
Two major features include a source that sends data to Data Prepper using an API mimicking the OpenSearch `_bulk` API and the ability to read from Amazon Kinesis Data Streams.


## OpenSearch API source

Many existing OpenSearch clients that perform ingestion directly to OpenSearch can now send that data to Data Prepper first.
With this, you can use Data Prepper's buffering and rich processor set before sending data to OpenSearch without having to change clients that are using the OpenSearch `_bulk` API. 
A new Data Prepper source named `opensearch_api` has been added that accepts [OpenSearch Document API bulk operation](https://opensearch.org/docs/latest/api-reference/document-apis/bulk/) requests from clients using REST and ingests data into OpenSearch. 
The behavior of this source is also quite similar to the existing `http` source. 
It supports industry-standard encryption in the form of TLS/HTTPS and HTTP basic authentication. 
It also parses incoming requests and creates Data Prepper events and associated event metadata, making it compatible with the `opensearch` sink. 
The request body is compatible with the OpenSearch Document API bulk operation and supports all actions: index, create, delete, and update.

The following two HTTP methods are now supported:

```
POST _bulk
POST <index>/_bulk
```

The second API specifies the index in the path, so you don't need to include it in the request body.

Additionally, the following OpenSearch Document API bulk operation query parameters are supported:

* `pipeline`
* `routing`

The following example demonstrates how to use the source:

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

Consider the following example request:

```
POST _bulk
{ "index": { "_index": "movies", "_id": "tt1979320" } }
{ "title": "Rush", "year": 2013 }
```

This request will be ingested into OpenSearch, and a new document will be created under the index `movies` with the document ID `tt1979320` with a document source of `{ "title": "Rush", "year": 2013 }`.

The Data Prepper maintainers are interested in further expanding this source to support other indexing APIs, allowing it to stand in for an OpenSearch cluster in ingestion workloads.
To learn more or provide feedback, see [Provide an OpenSearch API source #4180](https://github.com/opensearch-project/data-prepper/issues/4180).


## Kinesis source

[Amazon Kinesis Data Streams](https://docs.aws.amazon.com/streams/latest/dev/introduction.html) is a high-speed streaming data service. 
Data Prepper has also introduced a new source named `kinesis` that can be used to ingest stream record data from multiple Kinesis data streams into OpenSearch clusters. 
You can configure it to read stream records from either the oldest untrimmed record or from the most recent record. 
Moreover, if you enable end-to-end acknowledgements, Kinesis data streams will be checkpointed to prevent duplicate processing of records.

The following is an example pipeline:

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

Data Prepper 2.10 has introduced a number of other improvements:

* The `kafka` source now supports authentication with an Apache Kafka cluster using SASL/SCRAM in addition to the SASL/PLAIN authentication provided in previous versions.
* Data Prepper can now parse OpenTelemetry logs from sources such as Amazon Simple Storage Service (Amazon S3). The new `otel_logs` codec parses data from OpenTelemetry Protocol (OTLP) JSON-formatted files. Now you can write OpenTelemetry logs from [AWS S3 Exporter for OpenTelemetry Collector](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/exporter/awss3exporter/README.md) and read these using Data Prepper. 
* Additionally, the maintainers have worked to improve performance through the addition of an internal cache for event keys. Data Prepper administrators can configure this cache as necessary. 


## Next steps

* To download Data Prepper, visit the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.11 and other releases, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

The following community members contributed to this release. Thank you!

TODO
