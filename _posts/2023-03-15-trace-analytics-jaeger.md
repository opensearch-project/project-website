---
layout: post
title:  "Trace analytics with OpenSearch and Jaeger"
authors:
  - derek-ho
date:   2023-03-15
categories:
  - technical-post
meta_keywords: opensearch simple schema, observability schema, opensearch opentelemetry, OpenSearch 2.6, jaeger, trace analytics
meta_description: As a result, organizations are adopting distributed tracing as a way of gaining insight and getting an overall picture of their systems, using traces to help determine where to start investigating in case of issues and shorten their root cause analysis times.
---

As organizations evolve their software architectures towards microservices-based architectures, the operational data produced has become increasingly large and complex. Due to the distributed nature of the data, the old approach of digging through logs does not scale.

As a result, organizations are adopting distributed tracing as a way of gaining insight and getting an overall picture of their systems, using traces to help determine where to start investigating in case of issues and shorten their root cause analysis times. Traces are an observability signal that captures the entire lifecycle of a particular request as it traverses distributed services. Traces can have multiple service hops, called spans, that make up the entire operation.

## Jaeger

One of the most popular open source solutions for distributed tracing is [Jaeger](https://www.jaegertracing.io/). Jaeger is an open source, end to end solution, hosted by the Cloud Native Computing Foundation (CNCF). Jaeger SDKs are OpenTelemetry (OTEL) based and support multiple open source data stores, like Cassandra and OpenSearch, for storing traces. OpenSearch now provides the option for visualizing traces in the form of the OpenSearch Dashboards Trace analytics solution, which is the native visualization tool included in OpenSearch.

## Trace analytics

OpenSearch provides great support for log analytics and observability use cases. OpenSearch has added support for analyzing distributed tracing data with its Observability feature, starting with version 1.3. Using Observability, you can analyze the crucial Rate, Error, Duration (RED) metrics in their trace data. You can also analyze various components of your system for things like latency and errors, and pinpoint services that need attention.

OpenSearch trace analytics launched with support for OTEL compliant trace data provided by Data Prepper in OpenSearch. To widen the support for more popular trace formats used by developers, OpenSearch recently added support for Jaeger trace data. With this newly added support added in OpenSearch version 2.5, you can now analyze your Jaeger trace data stored in OpenSearch using the Trace analytics feature in OpenSearch Observability.

You can now filter traces and determine exactly which spans are showing errors and narrow issues down to relevant logs quickly. You can also benefit from the same feature rich analysis capabilities around RED metrics, contextual linking of traces, and spans, to their related logs that are available for the Data Prepper trace data.

Keep in mind that OTEL and Jaeger have several differences between their formats, as outlined [here](https://opentelemetry.io/docs/reference/specification/trace/sdk_exporters/jaeger/).
{: note. }

## Try it out

To try out this new feature, see the following [guide](https://opensearch.org/docs/latest/observing-your-data/trace/trace-analytics-jaeger/), which includes a docker compose file that shows you how to add sample data using the Jaeger hot rod demo, and then visualize it using trace analytics. In order to enable this feature, the `--es.tags-as-fields.all=true` flag needs to be set, as described [here](https://github.com/jaegertracing/jaeger/issues/1299). This is due to a limitation tracked on the following [Github issue](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/657).

[INSERT VIDEO HERE] - Currently waiting for link, which has been requested.

There are currently a few workflows that are helpful with triaging and exploring your data.
In Dashboards, you can see the top service and operation combinations with the highest amount of errors and latency. Selecting any of these will automatically bring you to the **Traces** page with the appropriate filters applied. You can also investigate any trace or services on your own with any filters you want applied.

## Next Steps

You can download the latest version of [OpenSearch here](https://www.opensearch.org/downloads.html), and you can also check out OpenSearch trace analytics live on [the Playground](https://playground.opensearch.org/app/observability-dashboards#/trace_analytics/home). We welcome your feedback in the [community forum](https://forum.opensearch.org/)!