---
layout: post
title: "Announcing OpenSearch Data Prepper 2.12: Additional source and sinks for your data ingestion needs"
authors:
  - kkondaka
  - huyp
  - pshenoy
  - dvenable
date: 2025-06-26 14:00:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.12.0 offers an improved OTel source and two new sinks for improved data ingestion as well as additional features and improvements.
meta_keywords: Data Prepper, OpenTelemetry, OTLP, Amazon SQS, AWS X-Ray
meta_description: Data Prepper 2.12.0 offers an improved OTel ingestion experience and two new sinks for improved data ingestion---an Amazon SQS sink and an OTLP sink for AWS X-Ray---as well as additional features and improvements.
---

## Introduction

OpenSearch Data Prepper 2.12 is now available for download!
This release includes a new way to ingest OpenTelemetry (OTel) data as well as two new sinks.

## Unified OTLP source

Data Prepper now includes a unified OpenTelemetry protocol (OTLP) source that streamlines telemetry data ingestion through a single, consolidated configuration. This source supports multiple protocols, seamlessly handling both gRPC and HTTP (with proto encoding) endpoints. It enables ingestion of OTel logs, traces, and metrics through exposed OTLP endpoints, simplifying configuration management and improving the efficiency of the data processing pipeline.

Additionally, to help you process the different signal types that OTel provides, Data Prepper now includes the `getEventType()` function. 
This feature enables dynamic classification and conditional routing of events within pipelines for more flexible and intelligent processing. 
Specifically for the `otlp` source, you can use this to route different types to different pipelines.

This sample pipeline shows a basic `otlp` source that routes logs, metrics, and traces to three different pipelines for processing:

```
source:
  otlp:
  route:
    - logs: 'getEventType() == "LOG"'
    - traces: 'getEventType() == "TRACE"'
    - metrics: 'getEventType() == "METRIC"'
```

## Amazon SQS sink

Data Prepper now supports Amazon Simple Queue Service (Amazon SQS) as an output sink. Amazon SQS is a widely adopted message queuing service designed for decoupling producers and consumers in distributed systems. It is especially suited for lightweight, structured messages that require timely delivery and reliable processing.

Sending Data Prepper output to SQS enables seamless communication between producers and consumers of data. Sending data directly to SQS is significantly faster and more efficient than traditional approaches such as sending output to an Amazon Simple Storage Service (Amazon S3) bucket and configuring an SQS notification on that bucket. With the new SQS sink, Data Prepper bypasses the overhead of writing to S3 and triggering SQS indirectly, reducing latency and improving responsiveness. This eliminates the need to configure S3 event notifications, write intermediate files, or manage bucket lifecycle rules. You can now go straight from processing to queuing with a clean, minimal configuration.

Here's how to get started with the SQS sink:

```yaml
sink:
  - sqs:
        queue_url: <queue-url>
        codec:
          json:
        aws:
          region: <region>
          sts_role_arn: <role>
```

## OTLP sink for AWS X-Ray

You can now enhance your observability pipeline's interoperability by seamlessly exporting processed trace data to AWS X-Ray through Data Prepper's new OTLP sink plugin. This integration enables organizations to leverage Data Prepper's powerful transformation and enrichment capabilities while maintaining compliance with OTel standards and sending data directly to AWS X-Ray using the OTLP format. The OTLP sink currently supports exporting spans to AWS X-Ray endpoints, with future versions planned to support sending spans, metrics, and logs to any OTLP protobuf-compatible endpoint. The plugin is designed for high performance, sustaining up to 3,500 transactions per second with sub-150ms p99 latency while using minimal system resources. Built with production reliability in mind, it features configurable retry logic with exponential backoff, gzip compression for efficient data transfer, and comprehensive metrics for monitoring pipeline health. Here's how to get started with the OTLP sink for AWS X-Ray:

```yaml
source:
  otel_trace_source:
sink:
  - otlp:
      endpoint: "https://xray.{region}.amazonaws.com/v1/traces"
      aws: { }
```

## Maven releases

Many community members have expressed interest in using various Data Prepper features as libraries.
To help support the broader community, the Data Prepper team is now publishing all Data Prepper libraries to Maven Central.

The following Maven groups are available to the community:

* `org.opensearch.dataprepper` -- Includes the `data-prepper-api` library that plugin authors use to write plugins.
* `org.opensearch.dataprepper.test` -- Test libraries to support common test scenarios when developing against Data Prepper.
* `org.opensearch.dataprepper.plugins` -- The plugins that deploy with Data Prepper. Each plugin either has its own jar or is combined with highly related plugins.
* `org.opensearch.dataprepper.core` -- Data Prepper core functionality, such as the plugin framework, events, expressions, and running as a pipeline.

## Other features and improvements

* Data Prepper expressions now support the modulus operator (`%`).
* Data Prepper can now authorize with OpenSearch using an API token. The new parameter `api_token` sets a bearer token and can be used with a JWT to access OpenSearch.
* You can now enable specific experimental plugins rather than enabling all or none.
* You can now disable reporting of specific Data Prepper metrics. This can help reduce the overall quantity of metrics when there are some you don't need to monitor.

## Getting started

* To download Data Prepper, visit the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.13 and other releases, see the [Data Prepper roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

Thanks to the following community members who contributed to this release!

* [alparish](https://github.com/alparish)
* [chenqi0805](https://github.com/chenqi0805) -- Qi Chen
* [Davidding4718](https://github.com/Davidding4718) -- Siqi Ding
* [derek-ho](https://github.com/derek-ho) -- Derek Ho
* [divbok](https://github.com/divbok) -- Divyansh Bokadia
* [dlvenable](https://github.com/dlvenable) -- David Venable
* [gaiksaya](https://github.com/gaiksaya) -- Sayali Gaikawad
* [graytaylor0](https://github.com/graytaylor0) -- Taylor Gray
* [huypham612](https://github.com/huypham612) -- huyPham
* [jeffreyAaron](https://github.com/jeffreyAaron) -- Jeffrey Aaron Jeyasingh
* [KarstenSchnitter](https://github.com/KarstenSchnitter) -- Karsten Schnitter
* [kkondaka](https://github.com/kkondaka) -- Krishna Kondaka
* [MohammedAghil](https://github.com/MohammedAghil) -- Mohammed Aghil Puthiyottil
* [nsgupta1](https://github.com/nsgupta1) -- Neha Gupta
* [oeyh](https://github.com/oeyh) -- Hai Yan
* [ps48](https://github.com/ps48) -- Shenoy Pratik
* [saketh-pallempati](https://github.com/saketh-pallempati) -- Saketh Pallempati
* [san81](https://github.com/san81) -- Santhosh Gandhe
* [savit-aluri](https://github.com/savit-aluri) -- Savit Aluri
* [sb2k16](https://github.com/sb2k16) -- Souvik Bose
* [shenkw1](https://github.com/shenkw1) -- Katherine Shen
* [Zhangxunmt](https://github.com/Zhangxunmt) -- Xun Zhang
