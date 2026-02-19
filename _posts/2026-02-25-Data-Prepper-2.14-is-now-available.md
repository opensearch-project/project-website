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

The OpenSearch Data Prepper maintainers are happy to announce the release of Data Prepper 2.14. 
This version has improved support for observability use cases through an application performance monitoring service map and improved Prometheus support. 


## APM service map

The `otel_apm_service_map` processor analyzes OpenTelemetry trace spans to automatically generate application performance monitoring (APM) service map relationships and metrics. It creates structured events that can be visualized as service topology graphs, showing how services communicate with each other and their performance characteristics.
The key features include automatic service relationship discovery that identifies service-to-service 
interactions from OpenTelemetry spans, APM metrics generation that creates latency, throughput, and error rate metrics for service interactions. It uses three-window processing with sliding time windows to ensure complete trace context. The system is environment-aware, deriving new attributes from existing span attributes to support service environment grouping and custom attributes, with environment detection capabilities for AWS EC2, ECS, EKS, Lambda, and API Gateway, and can be extended to support other cloud providers. It provides service map snapshots that enable users to view service connections for specific time periods, with customizable resource attribute filtering.

## Improved Prometheus sink support

The Prometheus sink now ensures compliance with remote write requirements through integrated sorting and deduplication logic. It chronologically organizes incoming events and strips duplicate samples for identical series/timestamps before transmission, preventing broker-side rejections. To further handle data ingestion challenges, the new out_of_order_time_window option allows a configurable grace period for late-arriving data. This window enables the sink to accept and re-sort samples that arrive out of sequence, significantly improving pipeline resilience in distributed environments where perfectly ordered delivery is difficult to maintain.

## AWS Lambda streaming

One of AWS Lambda's features is [response streaming](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html).
This feature allows Lambda functions to stream data back to clients.
It speeds up latency to first responses and allows for larger payloads, up to 200 MB.
In Data Prepper 2.14, you can now configure the `aws_lambda` processor to support streaming invocations.
With this, you can now receive more than 6 MB of data from functions when the response is larger than the input data.


## Cross-region S3 sink

Data Prepper's `s3` sink can now write to S3 buckets cross-region.
Prior to this change, a single sink could write to buckets in only one region.
However this prevented using a key feature of the `s3` sink - dynamic bucket names.
With this improvement you can use specify a dynamic bucket name for S3 buckets in different regions.
For example, you can now create a dynamic bucket such as `myorganization-${/aws/region}`.
This can now write to buckets such as `myorganization-us-east-2` and `my-organization-eu-central-1`.

## Forward to pipelines

Some community members have needed to send data to sinks in a certain order or use data from a sink as input into another sink.
The `opensearch` sink now supports the `forward_to` configuration.
This configuration allows a pipeline author to define a pipeline to forward events to after they are written to OpenSearch.
The pipeline you write to will now have the events written to OpenSearch along with the document Id field.

## ARM architecture support

Data Prepper now releases a multi-architecture Docker image with support for ARM as well as x86.
Many organizations are moving to running on ARM to help save on compute costs.
With this change, you can pull Data Prepper images directly to ARM and avoid emulation.
Additionally, Data Prepper provides ARM archive files to make it easier to run on ARM systems that are not using Docker.

## Other great changes

* The Data Prepper Docker image is now 46% smaller and has fewer layers to improve Docker pull times.
* The AWS Lambda processor now supports better configuration for timeouts.
* The aggregate processor now has better support for end-to-end acknowledgements as well as configurations for disabling acknowledgements.
* Data Prepper provides a number of new metrics for observing pipeline health.


## Getting started
* To download Data Prepper, visit the [Download & Get Started](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with OpenSearch Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.15 and other releases, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!
Thanks to the following community members who contributed to this release!

TODO
