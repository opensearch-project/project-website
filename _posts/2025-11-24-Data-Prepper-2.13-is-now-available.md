---
layout: post
title: Data Prepper 2.13 is now available
authors:
  - kkondaka
  - dvenable
date: 2025-11-24 14:00:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.13 introduces Amazon Managed Prometheus sink support, native OpenSearch data streams, cross-region S3, and performance improvements delivering.
meta_keywords: Data Prepper, Prometheus, Amazon Managed Prometheus, OTLP, data streams
meta_description: Data Prepper 2.13 adds Prometheus sink, OpenSearch data streams, cross-region S3 support, and 20%+ performance improvements for streamlined metric and log processing.
---

# Data Prepper 2.13 is now available

The Data Prepper maintainers are happy to announce the release of Data Prepper 2.13. 
This release includes a number of improvements that make Data Prepper easier to use and opens new capabilities.

## Prometheus Sink
Data Prepper now supports Prometheus as sink with initially supporting only Amazon Managed Prometheus as the external Prometheus sink. 
This enables capability for exporting metric data processed within Data Prepper pipelines to the Prometheus ecosystem and allows Data Prepper to serve as a bridge between various metric sources (like OpenTelemetry, Logstash, or S3) and Prometheus-compatible monitoring system.

A core aspect of the Prometheus sink is its handling of different metric types. The implementation ensures that Data Prepper's internal metric representations are correctly mapped to Prometheus time series families:
* **Counters:** For `Sum` metrics with cumulative aggregation temporality and monotinic, the sink generates a single time series using the metric name. The value represents the cumulative count.
* **Gauges:** Similar to counters, `Gauge` metrics are mapped to a single time series with the current value and also for `Sum` metrics which are not mapped to Counters
* **Summaries:** Support for summary metrics are converted into time series with `quantile` labels, along with corresponding `\_sum` and `\_count` series.
* **Histograms:** Support for histograms is more complex. The sink generates many distinct types of time series for each histogram metric to fully represent the distribution including `buckets`, `sum`, `count`, `min` and `max`.
* **Exponential Histograms:** Support for histograms is more complex. The sink generates many distinct types of time series for each histogram metric to fully represent the distribution including `negative/postive``buckets`, `scale`, `zero threshold`, `zero count`, `sum`, `count`, `min` and `max`.

In addition to mapping metrics, the sink handles attribute labeling and name sanitization, creating labels for all metric, resource, and scope attributes.

It can be configured with easily for Amazon Managed Prometheus as follows:

```yaml
sink:
  - prometheus:
      url: <amp workspace remote-write api url>
      aws:
         region: <region>
         sts_role_arn: <role-arn>
```

## OpenSearch data stream support
Data Prepper now supports OpenSearch data streams natively in the `opensearch` sink. 
With this change, Data Prepper will look up the index to determine if it is a data stream. 
If so, it will configure the bulk writes to the sink to work directly with data streams.

Prior to this feature, Data Prepper pipeline authors would need to make manual adjustments to the sink configuration to make the support work. 
Now, customers can create a minimal sink configuration that will setup the sink correctly. 
Additionally, Data Prepper will set the `@timestamp` field to the time received by Data Prepper automatically if the pipeline does not already set this value.

For example, the configuration could be as simple as the following.

```yaml
sink:
  - opensearch:
      hosts: [ "https://localhost:9200" ]
      index: my-log-index
```

## Cross-region S3
The S3 source is a popular feature in Data Prepper for ingesting data from S3 buckets. 
This source can read from S3 buckets using SQS notifications or scan multiple S3 buckets. 
It is common for community members to have S3 buckets in multiple regions that they want to read in a single pipeline. 
For example, some teams may want to get VPC Flow logs from multiple regions to consolidate into a single OpenSearch cluster. 
Now Data Prepper users can read from multiple buckets in different regions. And there is no need to make a custom configuration for this feature and Data Prepper will handle this for customers.

## Other great changes
* The maintainers have invested in performance improvements for expressions and core processors. Our benchmarking indicates that this has improved throughput by over 20% when using expressions.
* The DynamoDB source is now fully checkpointing within shards. This change reduces duplicate processing from DynamoDB tables when failures occur. Before this change, when restarting reading from a DynamoDB shard, Data Prepper would start from the beginning of the shard. With this change, a Data Prepper node will start from the last successfully processed event in the shard.
* The `delete_entries` and `select_entries` processors now support regex patterns to determine whether to delete or select fields to help pipeline authors clean up their events.
* The `rename_keys` processor can normalize keys allowing pipeline authors to write simple pipelines that can get data into OpenSearch.

## Getting started
* To download Data Prepper, visit the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.14 and other releases, see the [Data Prepper roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!
Thanks to the following community members who contributed to this release!

TODO:
