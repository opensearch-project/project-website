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

The OpenSearch Data Prepper maintainers are happy to announce the release of Data Prepper 2.13. 
This release includes a number of improvements and new capabilities that make Data Prepper easier to use.

## Prometheus sink
Data Prepper now supports Prometheus as a sink---initially, only Amazon Managed Service for Prometheus is supported as the external Prometheus sink. 
This enables you to export metric data processed within Data Prepper pipelines to the Prometheus ecosystem and allows Data Prepper to serve as a bridge between various metric sources (like OpenTelemetry, Logstash, or Amazon Simple Storage Service [Amazon S3]) and Prometheus-compatible monitoring systems.

A core aspect of the Prometheus sink is its handling of different metric types. The implementation ensures that Data Prepper's internal metric representations are correctly mapped to Prometheus time series families:
* **Counters**: For `Sum` metrics with cumulative aggregation temporality and monotonic, the sink generates a single time series using the metric name. The value represents the cumulative count.
* **Gauges**: Similar to counters, `Gauge` metrics are mapped to a single time series with the current value and also for `Sum` metrics that are not mapped to counters.
* **Summaries**: Summary metrics are converted into a time series with `quantile` labels, along with corresponding `\_sum` and `\_count` series.
* **Histograms**: Support for histograms is more complex. The sink generates many distinct types of time series for each histogram metric to fully represent the distribution, including `buckets`, `sum`, `count`, `min`, and `max`.
* **Exponential histograms**: Support for histograms is more complex. The sink generates many distinct types of time series for each histogram metric to fully represent the distribution, including `negative/postive``buckets`, `scale`, `zero threshold`, `zero count`, `sum`, `count`, `min`, and `max`.

In addition to mapping metrics, the sink handles attribute labeling and name sanitization, creating labels for all metric, resource, and scope attributes.

It can be easily configured for Amazon Managed Service for Prometheus as follows:

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
With this change, Data Prepper will look up the index to determine whether it is a data stream. 
If so, it will configure the bulk writes to the sink so that they work directly with data streams.

Prior to this feature, Data Prepper pipeline authors would need to make manual adjustments to the sink configuration to write to data stream indexes. 
Now users can create a minimal sink configuration that will set up the sink correctly. 
Additionally, Data Prepper will automatically set the `@timestamp` field to the time received by Data Prepper if the pipeline does not already set this value.

For example, the configuration could be as simple as the following:

```yaml
sink:
  - opensearch:
      hosts: [ "https://localhost:9200" ]
      index: my-log-index
```

## Cross-Region s3 source
The `s3` source is a popular Data Prepper feature for ingesting data from S3 buckets. 
This source can read from S3 buckets using Amazon Simple Queue Service (Amazon SQS) notifications or scan multiple S3 buckets. 
It is common for users to have S3 buckets in multiple AWS Regions that they want to read in a single pipeline. 
For example, some teams may want to get VPC flow logs from multiple Regions and consolidate them into a single OpenSearch cluster. 
Now Data Prepper users can read from multiple buckets in different Regions. And there is no need to create a custom configuration for this feature---Data Prepper will handle this for customers.

## Other great changes
* The maintainers have invested in performance improvements for expressions and core processors. Our benchmarking indicates that this has improved throughput by over 20% when using expressions.
* The `dynamodb` source now fully checkpoints within shards. This change reduces duplicate processing from Amazon DynamoDB tables when failures occur. Before this change, when restarting reading from a DynamoDB shard, Data Prepper would start from the beginning of the shard. With this change, a Data Prepper node will start from the last successfully processed event in the shard.
* The `delete_entries` and `select_entries` processors now support regex patterns to determine whether to delete or select fields to help pipeline authors clean up their events.
* The `rename_keys` processor can now normalize keys, allowing pipeline authors to write simple pipelines to get data into OpenSearch.

## Getting started
* To download Data Prepper, visit the [Download & Get Started](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with OpenSearch Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.14 and other releases, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!
Thanks to the following community members who contributed to this release!

* [akshay0709](https://github.com/akshay0709) -- Akshay Pawar
* [alparish](https://github.com/alparish)
* [chenqi0805](https://github.com/chenqi0805) -- Qi Chen
* [danhli](https://github.com/danhli) -- Daniel Li
* [Davidding4718](https://github.com/Davidding4718) -- Siqi Ding
* [derek-ho](https://github.com/derek-ho) -- Derek Ho
* [dinujoh](https://github.com/dinujoh) -- Dinu John
* [divbok](https://github.com/divbok) -- Divyansh Bokadia
* [dlvenable](https://github.com/dlvenable) -- David Venable
* [FedericoBrignola](https://github.com/FedericoBrignola)
* [franky-m](https://github.com/franky-m)
* [gaiksaya](https://github.com/gaiksaya) -- Sayali Gaikawad
* [Galactus22625](https://github.com/Galactus22625) -- Maxwell Brown
* [graytaylor0](https://github.com/graytaylor0) -- Taylor Gray
* [huypham612](https://github.com/huypham612) -- huyPham
* [ivan-tse](https://github.com/ivan-tse) -- Ivan Tse
* [janhoy](https://github.com/janhoy) -- Jan Høydahl
* [jayeshjeh](https://github.com/jayeshjeh) -- Jayesh Parmar
* [jeffreyAaron](https://github.com/jeffreyAaron) -- Jeffrey Aaron Jeyasingh
* [jmsusanto](https://github.com/jmsusanto) -- Jeremy Michael
* [joelmarty](https://github.com/joelmarty) -- Joël Marty
* [juergen-walter](https://github.com/juergen-walter) -- Jürgen Walter
* [KarstenSchnitter](https://github.com/KarstenSchnitter) -- Karsten Schnitter
* [kkondaka](https://github.com/kkondaka) -- Krishna Kondaka
* [LeeroyHannigan](https://github.com/LeeroyHannigan) -- Lee
* [linghengqian](https://github.com/linghengqian) -- Ling Hengqian
* [mishavay-aws](https://github.com/mishavay-aws)
* [MohammedAghil](https://github.com/MohammedAghil) -- Mohammed Aghil Puthiyottil
* [niketan16](https://github.com/niketan16) -- Niketan Chandarana
* [nsgupta1](https://github.com/nsgupta1) -- Neha Gupta
* [oeyh](https://github.com/oeyh) -- Hai Yan
* [ps48](https://github.com/ps48) -- Shenoy Pratik
* [quanghungb](https://github.com/quanghungb) -- qhung
* [RashmiRam](https://github.com/RashmiRam) -- Rashmi
* [Rishikesh1159](https://github.com/Rishikesh1159) -- Rishikesh
* [saketh-pallempati](https://github.com/saketh-pallempati) -- Saketh Pallempati
* [san81](https://github.com/san81) -- Santhosh Gandhe
* [savit-aluri](https://github.com/savit-aluri) -- Savit Aluri
* [sb2k16](https://github.com/sb2k16) -- Souvik Bose
* [seschis](https://github.com/seschis) -- Shane Schisler
* [shenkw1](https://github.com/shenkw1) -- Katherine Shen
* [srikanthjg](https://github.com/srikanthjg) -- Srikanth Govindarajan
* [timo-mue](https://github.com/timo-mue)
* [TomasLongo](https://github.com/TomasLongo) -- Tomas
* [Zhangxunmt](https://github.com/Zhangxunmt) -- Xun Zhang
