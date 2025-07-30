---
layout: post
title: "Diving deep into services with OpenSearch and OpenTelemetry"
category: blog
tags: [observability, traces, services, opentelemetry, opensearch-3-1]
authors:
    - pshenoy
    - tackadam
date: 2025-08-07
categories:
  - technical-posts
meta_keywords: observability, traces, services, OpenTelemetry, OpenSearch 3.1, Investigation, 
meta_description: Learn how to use OpenSearch 3.1 and OpenTelemetry for end-to-end observability, troubleshooting, and root cause analysis in distributed microservices. This blog demonstrates a practical workflow for identifying, investigating, and resolving service issues using advanced tracing, service maps, and AI-powered features in OpenSearch Dashboards.
---

In modern distributed systems, understanding the interactions between microservices is crucial for identifying performance bottlenecks and diagnosing failures. In this blog, we'll demonstrate the new features introduced in Trace Analytics plugin in OpenSearch version 3.1, such as enhanced service map visualizations, advanced span grouping, and latency distribution charts alongside OpenTelemetry to collect and instrument traces. We'll then show how to use OpenSearch and OpenSearch Dashboards to explore, visualize, and analyze an Observability investigation workflow. 

## Setting up the demo

We'll use the OpenTelemetry demo for the Astronomy Shop, an e-commerce site composed of multiple microservices. This demo is available in [OpenTelemetry demo](https://github.com/opensearch-project/opentelemetry-demo). A Docker Compose setup launches the Astronomy Shop services and the following components:

* **Data Prepper**: Ingests logs and traces into OpenSearch.
* **OpenSearch**: Stores telemetry data and serves as the search engine.
* **OpenSearch Dashboards**: Provides a unified UI for logs, metrics, and traces.

The architecture of the demo is shown in the following diagram.

![OpenSearch Observability with OpenTelemetry](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/os-observability-architecture.png){:class="img-centered"}

### OpenTelemetry demo and Astronomy Shop

The Astronomy Shop includes services such as Frontend, Cart, Ad, Accounting, Currency, Payment, and Checkout, as shown in the following image. Each service is implemented in a different language and uses the OpenTelemetry SDK to emit spans and metrics.

![OTel Astronomy Shop](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/otel-demo-astronomy-shop.gif){:class="img-centered"}

### Feature flags in the OpenTelemetry demo

The demo includes a feature-flag service to simulate failures, including `adServiceHighCpu`, `cartServiceFailure`, `productCatalogFailure`, `paymentServiceFailure`, and more, shown in the following image. In this walkthrough, we will focus on the Ad service, triggering a high-error-rate scenario to illustrate how to detect and diagnose faults.

![OTel Demo feature flags](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/otel-demo-feature-flag.png){:class="img-centered"}

### OpenSearch Dashboards 

OpenSearch Dashboards includes several observability plugins. For this demo, enable the following plugins:

1. **Workspaces**: Organizes related dashboards and queries.
2. **Query Enhancements**: Adds autocomplete, syntax highlighting, and AI‑powered suggestions.
3. **Query Assist**: Enables natural language and AI‑driven query generation.

For the demo, we also configured the following plugins:

* **Services**: Shows RED (Rate, Errors, Duration) metrics, service maps, and links to logs and traces.
* **Traces**: Allows exploration of individual traces, trace groups and spans, displays Gantt charts, cumulative service timing, and trace payloads.
* **Discover**: Offers ad‑hoc querying of logs and metrics using PPL, SQL, Lucene, or DQL.

### Setting up correlated log indexes 

The recent update in OpenSearch 3.1 for Trace Analytics plugin allows you to set up traces and service maps indexes, along with correlated log indexes with custom field mappings to support non-OTel log schemas, as shown in the following image.

![Correlations setup](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/correlations-setup.gif){:class="img-centered"}

### Natural language features

The following AI‑driven capabilities streamline investigation:

1. **Text-to-PPL**: Converts plain‑language questions into PPL queries.
2. **Data Summarization**: Provides concise summaries of query results and log fields.

To learn more about OpenSearch Dashboards AI capabilities, see [OpenSearch Assistant for OpenSearch Dashboards](https://docs.opensearch.org/docs/latest/dashboards/dashboards-assistant/index/).


## Observability workflow

When monitoring services in production, a systematic approach to identifying and resolving issues is crucial. This walkthrough demonstrates how to use OpenSearch Observability tools to quickly pinpoint and investigate service errors.

### Step 1: Identify problem services

In the **Services** page, shown in the following image, you can get a high-level overview of all services and their health status. 

![OpenSearch Dashboards services page](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/opensearch-services.png){:class="img-centered"}


To quickly identify problematic services, sort by error rate to identify services with the highest failure rates. Alternatively, you can view the service map with the errors tab selected to visualize which services are experiencing issues and how they're interconnected, as shown in the following image.

![OpenSearch Dashboards services page demo](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/opensearch-services-demo.gif){:class="img-centered"}

### Step 2: Navigate to the problem service

After identifying that the ad service has a significantly high error rate, select it to navigate to its dedicated service page. This page provides a more focused view of the problematic service, shown in the following image.

![Selected Ad service](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/highlighted-ad-service.png){:class="img-centered"}

### Step 3: Analyze service overview

On the ad service page, you can view comprehensive overview metrics, including high-level performance indicators, error rate trends over time, service health patterns, and key performance metrics, as shown in the following image. The trends section helps you understand whether this is a recent issue or an ongoing problem.

![Ad service details](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/ad-service-details.gif)

### Step 4: Investigate individual traces

To dig deeper into the root cause, select the **Traces** icon to redirect to the **Traces** page with this service applied as a filter, as shown in the following image. 

![Jump to Correlated Traces for ad service](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/ad-service-correlated-traces.png)

This is where you can examine individual requests and their execution paths. On the **Traces** page, sort by errors to isolate the problematic requests. This reveals two spans containing errors, as shown in the following image.

![Correlated Traces and Trace Groups for ad service](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/correlated-traces-ad-service.gif)

### Step 5: Analyze the trace timeline

Select a specific Trace ID to redirect to the trace details page. On this page, you can examine the detailed execution flow of that particular request, as shown in the following image. 

![Selected error trace](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/selected-error-trace.png)

The trace details page provides a Gantt chart showing the complete request flow across services, timing information for each service call, error locations within the trace, and service dependencies and call patterns, as shown in the following image Focus on the ad service span and select it to access more detailed information about the specific error.

![Trace details page](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/trace-details-page.gif){:class="img-centered"}

### Step 6: Examine error logs

To understand the root cause, navigate to the **Logs** page, which shows all log entries related to the error span, as shown in the following image. 

![Jump to correlated logs from spans](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/correlated-logs-from-spans.png){:class="img-centered"}

By selecting the **body** field, you can quickly see the specific error message and context that led to the failure, as shown in the following image.

![Correlated logs for errored spans](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/correlated-logs.png){:class="img-centered"}

### Step 7: Use natural language querying

For more advanced investigation, you can use natural language capabilities to query the data. Using a prompt such as "Show me the logs for span id '475dc023cbf02058' and summarize the body field," the system generates the appropriate query and provides a summary of the findings, as shown in the following image. This makes it easier to understand complex error patterns without writing manual queries.


![natural language query generation and summarization](/assets/media/blog-images/2025-08-07-Diving-into-services-with-OpenSearch-and-OpenTelemetry/nlqg-summary-ad-service.gif){:class="img-centered"}

## Key takeaways from this workflow

This systematic approach provides the following benefits:

* *Rapid issue identification* by accessing service-level metrics
* *Precise error location* using distributed tracing
* *Root cause analysis* through detailed log examination
* *Efficient investigation* using natural language queries

By following this workflow, you can quickly move from detecting a service issue to understanding its root cause, enabling faster resolution and improved system reliability.
