---
layout: post
title:  "Trace analytics with OpenSearch and Jaeger"
authors:
  - derek-ho
date:   2023-03-15
categories:
  - technical-post
meta_keywords: opensearch simple schema, observability schema, opensearch opentelemetry, OpenSearch 2.6, jaeger, trace analytics
meta_description: Organizations are adopting distributed tracing as a way of gaining insight into their systems. Traces help determine where to start investigating issues and ultimately shorten root cause analysis times.
---

As organizations shift toward microservices-based architecture, the operational data produced is becoming increasingly large and complex. Because of the distributed nature of the data, the old approach of digging through logs does not scale.

As a result, organizations are adopting distributed tracing as a way of gaining insight into their systems. Traces help determine where to start investigating issues and ultimately shorten root cause analysis times. They serve as an observability signal that captures the entire lifecycle of a particular request as it traverses distributed services. Traces can have multiple service hops, called _spans_, that make up the entire operation.

## Jaeger

One of the most popular open source solutions for distributed tracing is [Jaeger](https://www.jaegertracing.io/). Jaeger is an open source, end-to-end solution, hosted by the Cloud Native Computing Foundation (CNCF). Jaeger SDKs are OpenTelemetry (OTel) based and support multiple open source data stores, such as Cassandra and OpenSearch, for storing traces. OpenSearch now provides the option for visualizing traces in the OpenSearch Dashboards, which is the native visualization tool included in OpenSearch.

## Trace analytics

OpenSearch provides extensive support for log analytics and observability use cases. Starting with version 1.3, OpenSearch has added support for analyzing distributed tracing data with its Observability feature. Using Observability, you can analyze the crucial Rate, Error, Duration (RED) metrics in their trace data. Additionally, you can evaluate various components of your system for latency and errors and pinpoint services that need attention.

OpenSearch trace analytics launched with support for OTel-compliant trace data provided by Data Prepper---the OpenSearch server-side data collector. To incorporate the popular Jaeger trace data format, in version 2.5, OpenSearch introduced the Trace analytics feature in OpenSearch Observability. 

With OpenSearch Observability, you can now filter traces to isolate the spans that are showing errors in order to quickly identify the relevant logs. You can use the same feature-rich analysis capabilities for RED metrics, contextually linking traces and spans to their related logs that are available for the Data Prepper trace data.

Keep in mind that OTel and Jaeger formats have several differences, as outlined in [OpenTelemetry to Jaeger Transformation](https://opentelemetry.io/docs/reference/specification/trace/sdk_exporters/jaeger/).

## Try it out

To try out this new feature, see the [Analyzing Jaeger trace data](https://opensearch.org/docs/latest/observing-your-data/trace/trace-analytics-jaeger/) documentation. The documentation includes a docker compose file that shows you how to add sample data using the Jaeger hot rod demo and then visualize it using trace analytics. To enable this feature, you need to set the `--es.tags-as-fields.all` flag to `true`, as described in the related [GitHub issue](https://github.com/jaegertracing/jaeger/issues/1299). This is necessary because of an [OpenSearch Dashboards limitation](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/657).

In Dashboards, you can see the top service and operation combinations with the highest number of errors and latency. Selecting any of these will automatically bring you to the **Traces** page with the appropriate filters applied. You can also investigate any trace or service on your own by applying various filters.

![Image: An example Dashboard trace details page]({{site.baseurl}}/assets/media/blog-images/2023-03-15-trace-analytics-jaeger/trace-details.png){:.img-fluid }

## Next Steps

To try OpenSearch trace analytics, check out [the OpenSearch Playground](https://playground.opensearch.org/app/observability-dashboards#/trace_analytics/home) or download the [latest version of OpenSearch](https://www.opensearch.org/downloads.html). We welcome your feedback in the [community forum](https://forum.opensearch.org/)!