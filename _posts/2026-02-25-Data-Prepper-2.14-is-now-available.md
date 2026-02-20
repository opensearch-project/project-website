---
layout: post
title: Data Prepper 2.14 is now available
authors:
  - kkondaka
  - dvenable
date: 2026-02-25 14:00:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.14 expands its observability capabilities with application performance monitoring features and improved Prometheus support.
meta_keywords: Data Prepper, application performance monitoring, AWS Lambda, ARM, Amazon S3, cross-region, Prometheus
meta_description: Data Prepper 2.14 adds an application performance monitoring service map, improves the Prometheus sink, supports AWS Lambda streaming, and adds support for ARM architectures.
---

The OpenSearch Data Prepper maintainers are happy to announce the release of Data Prepper 2.14. This version expands support for observability use cases with a new application performance monitoring (APM) service map and improved Prometheus support. 

## APM service map

The `otel_apm_service_map` processor analyzes OpenTelemetry trace spans to automatically generate APM service map relationships and metrics. It creates structured events that can be visualized as service topology graphs, showing how services communicate with each other and their performance characteristics.

Key features include:

- **Automatic service relationship discovery**: Identifies service-to-service interactions from OpenTelemetry spans.
- **APM metrics generation**: Creates latency, throughput, and error rate metrics for service interactions using three-window processing with sliding time windows to ensure complete trace context.
- **Environment awareness**: Derives new attributes from existing span attributes to support service environment grouping and custom attributes. It includes environment detection capabilities for AWS EC2, ECS, EKS, Lambda, and API Gateway and can be extended to support other cloud providers.
- **Service map snapshots**: Enables users to view service connections for specific time periods with customizable resource attribute filtering.

## Improved Prometheus sink support

The Prometheus sink now ensures compliance with remote write requirements through integrated sorting and deduplication logic. It chronologically organizes incoming events and strips duplicate samples for identical series/timestamps before transmission, preventing broker-side rejections.

To further handle data ingestion challenges, the new `out_of_order_time_window` option allows a configurable grace period for late-arriving data. This window enables the sink to accept and re-sort samples that arrive out of sequence, significantly improving pipeline resilience in distributed environments where perfectly ordered delivery is difficult to maintain.

## AWS Lambda streaming

One of AWS Lambda's features is [response streaming](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html), which allows functions to stream data back to clients. This reduces latency for the first responses and supports larger payloads, up to 200 MB.  

In Data Prepper 2.14, you can now configure the `aws_lambda` processor to use streaming invocations. This allows you to receive responses larger than 6 MB, making it especially useful when the output exceeds the size of the input data.

## Cross-region S3 sink

Data Prepper's `s3` sink now supports writing to S3 buckets across multiple regions.  

Previously, a single `s3` sink could only write to buckets in one region, which limited the use of one of its key features---dynamic bucket names.  

With this enhancement, you can specify dynamic bucket names that adapt to different regions. For example, you can define a bucket like `myorganization-${/aws/region}`. Data Prepper will then write to buckets such as `myorganization-us-east-2` and `myorganization-eu-central-1`.

## forward_to pipelines

In certain workflows, you may need to send data to sinks in a specific order or use the output from one sink as input for another.

The `opensearch` sink now supports the `forward_to` configuration. This allows you to define a target pipeline that receives events after they are written to OpenSearch. The forwarded events include the document ID field.

## ARM architecture support

Data Prepper now provides a multi-architecture Docker image with support for both ARM and x86.  

As many organizations adopt ARM to reduce compute costs, this change allows you to pull Data Prepper images directly on ARM systems without relying on emulation.  

Additionally, Data Prepper offers ARM archive files, making it easier to run on ARM systems that do not use Docker.

## Other notable changes

* The Data Prepper Docker image is now 46% smaller and has fewer layers, improving Docker pull times.
* The AWS Lambda processor now supports improved timeout configuration.
* The aggregate processor now has enhanced support for end-to-end acknowledgments and configurations for disabling acknowledgments.
* Data Prepper provides several new metrics for observing pipeline health.

## Getting started

* To download Data Prepper, visit the [Download & Get Started](https://opensearch.org/downloads.html) page.
* For information about getting started with Data Prepper, see [Getting started with OpenSearch Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.15 and other releases, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

Thanks to the following community members who contributed to this release!

<!-- TODO -->
