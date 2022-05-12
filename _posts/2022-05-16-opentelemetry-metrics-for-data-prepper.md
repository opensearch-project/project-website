---
layout: post
title:  "Metrics Ingestion with Data Prepper using OpenTelemetry"
authors:
  - kschnitter
  - ksternad
date:   2022-05-06 12:00:00 -0200
categories:
  - technical-post
---
Data Prepper offers great capabilities for ingesting traces and logs into OpenSearch.
Until now, that leaves out the third pillar of observability: Metrics.
Data Prepper 1.4.0 introduces support for metrics received via OpenTelemetry.
This feature aligns nicely with the OpenTelemetry traces support in Data Prepper.

## Why Ingest Metrics in OpenSearch?

At a first glance, OpenSearch offers great support for storing and analyzing any structured observability data.
It provides powerful search and aggregation capabilities.
Excellent visualizations support users in generating insights.
The Vega visualizations lift the metrics use-case to a whole new level.
OpenSearch already comes with alerting and anomaly detection, that nicely extends to metrics.

However, OpenSearch was not built as a time series database.
Storing metrics will be a lot less efficient with regard to resource consumption in comparison to specialized solutions.
But, OpenSearch can shine on special use-cases: High-cardinality data sets.
Metrics at least consists of a name, a timestamp and a value.
Additionally, attributes can be attached that describe the nature or origin of the metrics better.
OpenSearch does not care about the number of different values in any of those fields, specialized time series databases often do.
Let's say you count the number of service request by a service key.
Depending on the number of service keys, this might be problematic.

When storing metrics in OpenSearch you need to be mindful of the overall event rate, but you do not need to plan ahead for cardinality.
You will be able to augment logs and traces by a careful selection of metrics to enhance your overall observability.

## Solution Architecture

Data Prepper now supports metrics ingestion into OpenSearch using the OpenTelemetry protocol.
There are many implementations capable of sending metrics using this protocol.
The OpenTelemetry Collector was chosen as an agent for metrics acquisition in the following diagram.
It can pull several metrics endpoints or act as a receiver for others.
Metrics are sent to Data Prepper using the gRPC-based OpenTelemetry protocol.
Data Prepper receives the metrics, dissects and maps their data points and saves each data point as an individual OpenSearch document.
The diagram outlines the basic architecture for metrics ingestion using OpenTelemetry collector, Data Prepper and OpenSearch.

![Architecture]({{ site.baseurl }}/assets/media/blog-images/2022-05-16-opentelemetry-metrics-for-data-prepper/architecture.drawio.png){: .img-fluid}

The OpenTelemetry metrics data model is described in great detail in its [specification.](https://opentelemetry.io/docs/reference/specification/metrics/datamodel/)
Very briefly, metrics are divided into 5 different types:

* Sum
* Gauge
* Histogram
* ExponentialHistogram
* Summary

Each metric type has a specific data point format.
For example, sums and gauges use single value data points, while histograms and summaries used nested arrays to represent buckets of data.

Correlation between different metrics as well as traces and logs is provided by attributes and trace/span ids.
Direct connections to spans can be included with the Exemplars feature of OpenTelemetry.
These exemplars will be mapped to an array in the generated document.

The Data Prepper OpenTelemetry metrics support consists of two plugins: 

* The OTel Metrics source to deserialize the gRPC data,
* The OTel Metrics processor to preprocess the data points with regard to the metrics type.

The following diagram shows a prototypical pipeline:

![Pipeline]({{ site.baseurl }}/assets/media/blog-images/2022-05-16-opentelemetry-metrics-for-data-prepper/pipeline.drawio.png){: .img-fluid}

Support for ExponentialHistograms is not yet included in Data Prepper 1.4 but will follow in a future version. 

## Configuration

Setting up the OpenTelemetry metrics support is straight-forward.
You just need to configure the source and processor plugins: 

```yaml
metrics-pipeline:
  source:
    otel_trace_source:
  processor:
    - otel_metrics_raw_processor:
  sink:
    - opensearch:
      hosts: [ "https://opensearch.local:9200" ]
      username: username
      password: password
```

The metric source supports the same configuration as the OpenTelemetry trace source.
The metrics raw processor supports some properties for histograms:

```yaml
  processor:
    - otel_metrics_raw_processor:
      calculate_histogram_buckets: true
      calculate_exponential_histogram_buckets: true
      exponential_histogram_max_allowed_scale: 10
```

The example above outlines the default values.
The parameters control, whether the bucket boundaries should be calculated and included in the OpenSearch documents.
For exponential histograms, the maximum allowed scale can be defined.
High values lead to very small bucket sizes, that may underflow the precision of JSON floats.

## Outlook

You can start analysing your metrics data in OpenSearch with the simple configuration outlined above.
Data Prepper supports the full feature set of OpenTelemetry metrics.
The generated documents allow for easy visualizations as well as advanced use-cases in OpenSearch.
Enhance your observability with anomaly detection and alerts based on your custom metrics.
