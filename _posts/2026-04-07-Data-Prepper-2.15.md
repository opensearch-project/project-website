---
layout: post
title: 'Data Prepper 2.15 brings Apache Iceberg ingestion and Prometheus metrics support'
authors:
  - pshenoy
  - srikanthpadakanti
  - hsotaro
  - dvenable
date: 2026-04-07
categories:
  - releases
excerpt: Data Prepper 2.15 adds Apache Iceberg and Prometheus as sources and writes to open-source Prometheus.
meta_keywords: OpenSearch Data Prepper, Apache Iceberg ingestion, Prometheus metrics, Prometheus remote write, lakehouse architecture, OpenTelemetry metrics, data pipeline, Iceberg CDC, Prometheus sink, metric ingestion, APM service map
meta_description: OpenSearch Data Prepper 2.15 adds Apache Iceberg ingestion, bidirectional Prometheus metrics support, and composable functions for advanced pipeline processing.
---

The OpenSearch Data Prepper maintainers are happy to announce the release of Data Prepper 2.15. With this version, you can ingest data from Apache Iceberg. This release also extends Prometheus support with a remote-write source and the ability to send data to open-source Prometheus.

## Apache Iceberg source

[Apache Iceberg](https://iceberg.apache.org/) is an open table format widely used for lakehouse architectures. Iceberg tables often serve as the single source of truth for curated, transformed data. A common need is to keep OpenSearch synchronized with these tables for performing search and powering real-time dashboards. Until now, doing so required you to build custom ingestion jobs on a distributed compute engine to read Iceberg changelogs and write to OpenSearch, adding operational complexity for what is essentially a data-movement task.

Data Prepper 2.15 introduces an experimental `iceberg` source plugin that captures row-level changes from Iceberg tables and ingests them into sink targets such as OpenSearch. The plugin first exports the full table state and then continuously polls for new snapshots and processes incremental `INSERT`, `UPDATE`, and `DELETE` operations.

The following example pipeline reads the changes from an Iceberg table using a REST catalog and writes them to OpenSearch:

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

Data Prepper 2.14 introduced the ability to write metrics to [Amazon Managed Service for Prometheus](https://aws.amazon.com/prometheus/). With Data Prepper 2.15, the Prometheus sink additionally supports open-source [Prometheus](https://prometheus.io/). You can send metrics to any Prometheus-compatible endpoint without AWS authentication by using either no authentication or HTTP basic authentication.

The following example pipeline writes metrics to an open-source Prometheus instance using basic authentication:

```yaml
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

Data Prepper 2.15 introduces a new Prometheus source that ingests metrics through the [Prometheus Remote-Write protocol](https://prometheus.io/docs/specs/prw/remote_write_spec_2_0/). This allows Prometheus servers to forward metrics directly to Data Prepper, which then converts them into OpenTelemetry-compatible metric events for downstream processing.

The source accepts Snappy-compressed, Protobuf-encoded Remote-Write requests over HTTP and supports all standard Prometheus metric types, including counters, gauges, histograms, and summaries. You can use it alongside the Prometheus sink to build end-to-end Prometheus metric pipelines in Data Prepper.

The following example pipeline receives metrics from a Prometheus server and writes them to OpenSearch:

```yaml
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

You can use Data Prepper expressions to make your pipelines dynamic and tailored to your needs. Expressions let you route data, mutate events, and apply conditional logic within your pipeline configuration. You may already be using functions within expressions to build rich conditions. Data Prepper 2.15 takes this further by letting you compose functions for even more advanced expressions.

For example, you can calculate the approximate size of an event by converting the event to a JSON string and obtaining the string length:

```yaml
- add_entries:
    entries:
      - key: "approximateSize"
        value_expression: 'length(toJsonString())'
```

## Improved application performance monitoring

Data Prepper 2.15 fixes an issue in the APM service map processor in which latency metrics exported to Prometheus had a duplicate `_seconds` suffix in the metric name, resulting in `latency_seconds_seconds`. The metric name is now correctly exported as `latency_seconds`.

## Other notable changes

This release includes the following additional improvements:

* The `s3` sink now supports custom KMS keys for server-side encryption.
* A new `s3_enrich` processor lets you enrich events with data stored in S3 buckets.
* Data Prepper expressions now support new substring functions: `substringAfter`, `substringBefore`, `substringAfterLast`, and `substringBeforeLast`.
* The `sqs` sink is no longer experimental and is ready for production use.


## Getting started

Use the following resources to get up and running with Data Prepper 2.15:

* To download Data Prepper, visit the [Download & Get Started](https://opensearch.org/downloads.html) page.
* For information about getting started with Data Prepper, see [Getting started with OpenSearch Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about upcoming work for Data Prepper, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

Thanks to the following community members who contributed to this release!

* [bagmarnikhil](https://github.com/bagmarnikhil) -- Nikhil Bagmar
* [BhattacharyaSumit](https://github.com/BhattacharyaSumit) -- Sumit Bhattacharya
* [Davidding4718](https://github.com/Davidding4718) -- Siqi Ding
* [dinujoh](https://github.com/dinujoh) -- Dinu John
* [divbok](https://github.com/divbok) -- Divyansh Bokadia
* [dlvenable](https://github.com/dlvenable) -- David Venable
* [enuraju](https://github.com/enuraju) -- Raju Enugula
* [graytaylor0](https://github.com/graytaylor0) -- Taylor Gray
* [JongminChung](https://github.com/JongminChung)
* [kaimst](https://github.com/kaimst) -- Kai Sternad
* [Keyur-S-Patel](https://github.com/Keyur-S-Patel) -- Keyur Patel
* [kkondaka](https://github.com/kkondaka) -- Krishna Kondaka
* [kylehounslow](https://github.com/kylehounslow) -- Kyle Hounslow
* [lawofcycles](https://github.com/lawofcycles) -- Sotaro Hikita
* [oeyh](https://github.com/oeyh) -- Hai Yan
* [ps48](https://github.com/ps48) -- Shenoy Pratik
* [srikanthpadakanti](https://github.com/srikanthpadakanti) -- Srikanth Padakanti
* [TomasLongo](https://github.com/TomasLongo) -- Tomas
* [vamsimanohar](https://github.com/vamsimanohar) -- Vamsi Manohar
* [Zhangxunmt](https://github.com/Zhangxunmt) -- Xun Zhang
