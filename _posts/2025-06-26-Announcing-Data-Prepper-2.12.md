---
layout: post
title: "Announcing OpenSearch Data Prepper 2.12"
authors:
  - kkondaka
  - dvenable
date: 2025-06-26 12:30:00 -0600
categories:
  - releases
excerpt:
meta_keywords:
meta_description:
---

## Introduction

OpenSearch Data Prepper 2.12 is now available for download!


## SQS sink

TODO: Krishna

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

TODO: David

## Other features and improvements

TODO: David

## Next steps

TODO: David

## Thanks to our contributors!

TODO: David
