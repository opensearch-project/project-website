---
layout: post
title: 'Data Prepper 2.15: Ingest data from Apache Iceberg and more!'
authors:
  - dvenable
  - srikanthpadakanti
  - hsotaro
date: 2026-04-07 12:00:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.15 adds Apache Iceberg as a source and writes to open-source Prometheus.
meta_keywords: Data Prepper, Apache Iceberg, application performance monitoring, Prometheus, Prometheus Remote Write
meta_description: Data Prepper 2.15 adds Apache Iceberg as a source and writes to open-source Prometheus.
---

The OpenSearch Data Prepper maintainers are happy to announce the release of Data Prepper 2.15. 
With this version you can ingest data from Apache Iceberg and write to open-source Prometheus. 

## Apache Iceberg source

[Apache Iceberg](https://iceberg.apache.org/) is an open table format widely used for lakehouse architectures. Iceberg tables often serve as the single source of truth for curated, transformed data. A common need is to keep OpenSearch synchronized with these tables for search and real-time dashboards. Until now, this required building custom ingestion jobs on a distributed compute engine to read Iceberg changelogs and write to OpenSearch, adding operational complexity for what is essentially a data movement task.

Data Prepper 2.15 introduces an experimental `iceberg` source plugin that captures row-level changes from Iceberg tables and ingests them into sink targets like OpenSearch. The plugin first exports the full table state, then continuously polls for new snapshots and processes incremental `INSERT`, `UPDATE`, and `DELETE` operations.

The following example pipeline reads changes from an Iceberg table using a REST catalog and writes them to OpenSearch:

```yaml
iceberg-cdc-pipeline:
  source:
    iceberg:
      tables:
        - table_name: "my_database.my_table"
          catalog:
            type: rest
            uri: "http://iceberg-rest-catalog:8181"
            io-impl: "org.apache.iceberg.aws.s3.S3FileIO"
            client.region: "us-east-1"
          identifier_columns: ["id"]
  sink:
    - opensearch:
        hosts: ["https://localhost:9200"]
        index: "my-index"
        action: "${getMetadata(\"bulk_action\")}"
        document_id: "${getMetadata(\"document_id\")}"
```

## Open-source Prometheus as a sink

Data Prepper 2.14 introduced the ability to write metrics to [Amazon Managed Service for Prometheus](https://aws.amazon.com/prometheus/). With Data Prepper 2.15, the Prometheus sink now supports open-source [Prometheus](https://prometheus.io/) as well. You can send metrics to any Prometheus-compatible endpoint without AWS authentication, using either no authentication or HTTP basic authentication.

The following example pipeline writes metrics to an open-source Prometheus instance using basic authentication:

```
prometheus-pipeline:
  source:
    otel_metrics_source:
  sink:
    - prometheus:
        url: "http://my-prometheus-server:9090/api/v1/write"
        authentication:
          http_basic:
            username: "myuser"
            password: "mypassword"
```

## Prometheus source

Data Prepper 2.15 introduces a new Prometheus source that ingests metrics via the [Prometheus Remote Write](https://prometheus.io/docs/concepts/remote_write_spec_2_0/) protocol. This allows Prometheus servers to forward metrics directly to Data Prepper, which then converts them into OpenTelemetry-compatible metric events for downstream processing.

The source accepts Snappy-compressed, protobuf-encoded Remote Write requests over HTTP and supports all standard Prometheus metric types including counters, gauges, histograms, and summaries. You can use it alongside the Prometheus sink to build end-to-end Prometheus metric pipelines through Data Prepper.

The following example pipeline receives metrics from a Prometheus server and writes them to OpenSearch:

```
prometheus-pipeline:
  source:
    prometheus:
      port: 9090
      path: "/api/v1/write"
  sink:
    - opensearch:
        hosts: ["https://localhost:9200"]
        index: prometheus-metrics
```

## Composable functions

You can use Data Prepper expressions to make your pipelines dynamic and custom for your needs.
These expressions determine routing of data, can mutate events dynamically, and configure your pipeline on conditionals.
The community is already using expressions and functions in expressions to create rich conditions.
With Data Prepper 2.15 you can now compose functions to make even more advanced expressions.

For example, you can add the approximate size of an event into a field by creating a JSON representation and getting the length.

```
- add_entries:
    entries:
      - key: "approximateSize"
        value_expression: 'length(toJsonString())'
```

## Improvements for application performance monitoring

Data Prepper 2.15 fixes an issue with the APM service map processor where latency metrics exported to Prometheus had a duplicate `_seconds` suffix in the metric name, resulting in `latency_seconds_seconds`. The metric name is now correctly exported as `latency_seconds`.


## Other notable changes

TODO: dlvenable

## Getting started

* To download Data Prepper, visit the [Download & Get Started](https://opensearch.org/downloads.html) page.
* For information about getting started with Data Prepper, see [Getting started with OpenSearch Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.15 and other releases, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

Thanks to the following community members who contributed to this release!

TODO: dlvenable
