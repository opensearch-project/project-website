---
layout: post
title:  "Trace analytics with OpenSearch and Jaeger"
authors:
  - derek-ho
date:   2023-03-15
categories:
  - technical-post
meta_keywords: opensearch simple schema, observability schema, opensearch opentelemetry, OpenSearch 2.6, jaeger, trace analytics
meta_description: Organizations are adopting distributed tracing as a way of gaining insight into their systems. Distributed tracing helps determine where to start investigating issues and ultimately reduces the time spent on root cause analysis.
---

As organizations shift toward microservices-based architectures, operational data is becoming increasingly large and complex. Because of the distributed nature of the data, the old approach of sorting through logs is not scalable.

As a result, organizations are adopting distributed tracing as a way of gaining insight into their systems. Distributed tracing helps determine where to start investigating issues and ultimately reduces the time spent on root cause analysis. It serves as an observability signal that captures the entire lifecycle of a particular request as it traverses distributed services. Traces can have multiple service hops, called _spans_, that comprise the entire operation.

## Jaeger

One of the most popular open-source solutions for distributed tracing is [Jaeger](https://www.jaegertracing.io/). Jaeger is an open-source, end-to-end solution hosted by the Cloud Native Computing Foundation (CNCF). Jaeger SDKs are OpenTelemetry (OTel) based and support multiple open-source data stores, such as Cassandra and OpenSearch, for trace storage. OpenSearch now provides the option to visualize traces in OpenSearch Dashboards, the native OpenSearch visualization tool.

## Trace analytics

OpenSearch provides extensive support for log analytics and observability use cases. Starting with version 1.3, OpenSearch added support for distributed trace data analysis with the Observability feature. Using Observability, you can analyze the crucial rate, errors, and duration (RED) metrics in trace data. Additionally, you can evaluate various components of your system for latency and errors and pinpoint services that need attention.

The OpenSearch Project launched the trace analytics feature with support for OTel-compliant trace data provided by Data Prepper---the OpenSearch server-side data collector. To incorporate the popular Jaeger trace data format, in version 2.5 OpenSearch introduced the trace analytics feature in Observability.  

With Observability, you can now filter traces to isolate the spans with errors in order to quickly identify the relevant logs. You can use the same feature-rich analysis capabilities for RED metrics, contextually linking traces and spans to their related logs, which are available for the Data Prepper trace data.

![Image: An example Dashboard trace example GIF]({{site.baseurl}}/assets/media/blog-images/2023-03-15-trace-analytics-jaeger/traces_movie.gif){:.img-fluid }

Keep in mind that the OTel and Jaeger formats have several differences, as outlined in [OpenTelemetry to Jaeger Transformation](https://opentelemetry.io/docs/reference/specification/trace/sdk_exporters/jaeger/) in the OpenTelemetry documentation.

## Try it out

To try out this new feature, see the [Analyzing Jaeger trace data](https://opensearch.org/docs/latest/observing-your-data/trace/trace-analytics-jaeger/) documentation. The documentation includes a Docker Compose file that shows you how to add sample data using a demo and then visualize it using trace analytics. To enable this feature, you need to set the `--es.tags-as-fields.all` flag to `true`, as described in the related [GitHub issue](https://github.com/jaegertracing/jaeger/issues/1299). This is necessary because of an [OpenSearch Dashboards limitation](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/657).

In Dashboards, you can see the top service and operation combinations with the highest latency and the greatest number of errors. Selecting any of these will automatically direct you to the **Traces** page with the appropriate filters applied, as shown in the following image. You can also investigate any trace or service on your own by applying various filters.

![Image: An example Dashboard trace details page]({{site.baseurl}}/assets/media/blog-images/2023-03-15-trace-analytics-jaeger/trace-details.png){:.img-fluid }

## Next steps

To try the OpenSearch trace analytics feature, check out [the OpenSearch Playground](https://playground.opensearch.org/app/observability-dashboards#/trace_analytics/home) or download the [latest version of OpenSearch](https://www.opensearch.org/downloads.html). We welcome your feedback on the [community forum](https://forum.opensearch.org/)!