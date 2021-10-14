---
layout: post
title:  "Data Prepper 1.1 is Available!"
authors: 
  - rajtaori
  - laneholl
  - 
date:   2021-10-14 01:01:01 -0700
categories: 
  - releases
twittercard:
  description: "Data Prepper 1.1 is now available! Data Prepper is a component of OpenSearch that accepts, filters, transforms, enriches, and routes data at scale. "
---

Today we’re happy to announce the release of Data Prepper 1.1.0, and we want to say huge “Thank You!” for your continued support. This release provides security enhancements for the [OpenTelemetry (OTEL) Collector](https://opentelemetry.io/docs/collector/) Source and Peer Forwarder processors, AWS Cloud Map integration for peer discovery when running as a cluster in AWS infrastructure, less hard-coded configuration, and better performance when running trace analytics workloads.

Some of the key features we’ve introduced are an integration with [AWS Certificate Manager](https://aws.amazon.com/certificate-manager/) (ACM) and S3 for both the OTEL Trace Source and Peer Forwarder plugins. These allow private keys and certificates to be fetched from ACM or S3 when establishing TLS connections. Another feature is [AWS Cloud Map](https://aws.amazon.com/cloud-map/) integration with the Peer Forwarder plugin. Now in addition to creating Data Prepper clusters through static files or DNS Discovery you can integrate with AWS Cloud Map to perform node discovery, reducing the amount of configuration and problems that can occur in static files or customer DNS discovery.

We’ve also introduced some crucial configurability enhancements in Data Prepper 1.1.0. First, the peer forwarder target port is no longer hard coded. Secondly, the AWS IAM roll used by the OpenSearch sink is now configurable. The OTEL Collector source configuration can now accept application/json in addition to gRPC. In addition, you can define multiple [Micrometer](https://github.com/micrometer-metrics/micrometer) registries so that in addition to Prometheus, you can now register Amazon CloudWatch as a destination for performance and availability metrics. These all ensure Data Prepper is easier to configure and use in your infrastructure.

You can download Data Prepper 1.1 in source code or as a Docker container. and reference the readme [here](https://github.com/opensearch-project/data-prepper/blob/main/release/release-notes/data-prepper.release-notes-1.1.0.md). If you’re interested in learning more, have a specific question, or just want to provide feedback and thoughts, please visit [OpenSearch.org](http://opensearch.org/), open an issue on [GitHub](https://github.com/opensearch-project/data-prepper/issues), or post in the [forums](https://discuss.opendistrocommunity.dev/). 

We are so excited about the progress so far! The entire community of contributors should be incredibly proud of the accomplishment of reaching 1.1.0 together.
