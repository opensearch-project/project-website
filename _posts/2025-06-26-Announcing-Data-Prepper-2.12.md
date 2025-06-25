---
layout: post
title: "Announcing OpenSearch Data Prepper 2.12: Adding more sinks for your data ingestion needs"
authors:
  - kkondaka
  - huyp
  - dvenable
date: 2025-06-26 12:30:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.12.0 offers new sinks for improved data ingestion and other features.
meta_keywords: Data Prepper, OpenTelemetry, Amazon SQS, Amazon X-Ray
meta_description: Data Prepper 2.12.0 offers new sinks for improved data ingestion such as Amazon SQS and Amazon X-Ray as well as other features.
---

## Introduction

OpenSearch Data Prepper 2.12 is now available for download!
This release includes two new sinks and other improvements to Data Prepper to improve your data ingestion.


## Amazon SQS sink

Data Prepper now supports Amazon Simple Queue Service (Amazon SQS) as output sink. Amazon SQS is a widely adopted message queuing service designed for decoupling producers and consumers in distributed systems. It is especially suited for lightweight, structured messages that require timely delivery and reliable processing.

Sending Data Prepper output to SQS enables seamless communication between producers and consumers of data. Sending data directly to SQS is significantly faster and more efficient than traditional approaches such as sending output to an S3 bucket and configuring an SQS notification on that bucket. With the new SQS sink, Data Prepper bypasses the overhead of writing to S3 and triggering SQS indirectly, reducing latency and improving responsiveness. This eliminates the need to configure S3 event notifications, write intermediate files, or manage bucket lifecycle rules. You can now go straight from processing to queuing with a clean, minimal configuration.

## OTLP sink for Amazon X-Ray

You can now enhance your observability pipeline's interoperability by seamlessly exporting processed trace data to AWS X-Ray through Data Prepper's new OTLP sink plugin. This integration enables organizations to leverage Data Prepper's powerful transformation and enrichment capabilities while maintaining compliance with OpenTelemetry standards and sending data directly to AWS X-Ray using the OpenTelemetry Protocol format. The OTLP sink currently supports exporting spans to AWS X-Ray endpoints, with future releases planned to support sending spans, metrics, and logs to any OTLP Protobuf-compatible endpoint. The plugin is designed for high performance, sustaining up to 3,500 transactions per second with sub-150ms p99 latency while using minimal system resources. Built with production reliability in mind, it features configurable retry logic with exponential backoff, gzip compression for efficient data transfer, and comprehensive metrics for monitoring pipeline health. Here's how to get started:

```yaml
source:
  otel_trace_source:
sink:
  - otlp:
      endpoint: "https://xray.{region}.amazonaws.com/v1/traces"
      aws: { }
```

## Maven releases

Various community members have been looking to make use of various Data Prepper features as libraries.
To help support broader community use case beyond running Data Prepper, the Data Prepper team is now publishing all the Data Prepper libraries to Maven Central.

The following Maven groups are available for the community to use.

* `org.opensearch.dataprepper` - Includes the `data-prepper-api` library that plugin authors use to write plugins.
* `org.opensearch.dataprepper.test` - Test libraries to support common test scenarios when developing against Data Prepper.
* `org.opensearch.dataprepper.plugins` - The plugins which deploy with Data Prepper. Each plugin either has its own jar or is combined with highly-related plugins.
* `org.opensearch.dataprepper.core` - Data Prepper core functionality such as the plugin framework, events, expressions, and running as a pipeline.

## Other features and improvements

* Data Prepper Expressions now support the modulus operator (`%`).
* Data Prepper can authorize with OpenSearch using an API token. The new parameter `api_token` sets a Bearer token and can be used with a JWT to access OpenSearch.
* You can now enable specific experimental plugins rather than enabling all or none.
* You can disable Data Prepper metrics to reduce the overall metrics that Data Prepper reports.

## Getting started

* To download Data Prepper, visit the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.10 and other releases, see the [Data Prepper roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

TODO: David
