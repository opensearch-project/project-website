---
layout: post
title:  "Data Prepper roadmap is now publicly available on GitHub"
authors: 
  - rajtaori
  - laneholl
date:   2021-09-16 01:01:01 -0700
categories: 
  - releases
twittercard:
  description: "Today is an exciting day! The roadmap for Data Prepper is now publicly available. Data Prepper is a component of OpenSearch that accepts, filters, transforms, enriches, and routes data at scale. "
---

Today is an exciting day! The [roadmap](https://github.com/opensearch-project/data-prepper/projects/1) for Data Prepper is now publicly available. Data Prepper is a component of the OpenSearch project that accepts, filters, transforms, enriches, and routes data at scale. Data Prepper was [first introduced](https://opendistro.github.io/for-elasticsearch/blog/releases/2020/12/announcing-trace-analytics/) as a key component of Open Distro for Elasticsearch Trace Analytics feature, which helps developers use distributed trace data to find and fix performance problems in distributed applications. The roadmap outlines a plan to enable Data Prepper to also ingest logs (and eventually metrics) from telemetry data collection agents, such as [Fluent Bit](https://fluentbit.io/) and the [Open Telemetry Collector](https://opentelemetry.io/docs/collector/). When Data Prepper 1.2 becomes available, it can become a single data ingestion component for log and trace data pipelines that can scale to handle stateful processing of complex events such as trace data, aggregation transforms, and log-to-metric calculations.

### Data Prepper Overview

Data Prepper is a data ingestion component of the OpenSearch project that pre-processes documents before storing and indexing in OpenSearch. To pre-process documents, Data Prepper allows you to configure a **pipeline** that specifies a ***source***, ***buffers***, a series of ***processors***, and ***sinks*** *(Figure 1)*. Once you have configured a data pipeline, Data Prepper takes care of managing source, sink, buffer properties, and maintaining state across all instances of Data Prepper on which the pipelines are configured. A single instance of Data Prepper can have one or more pipelines configured. A pipeline definition requires at least a ***source*** and ***sink*** attribute to be configured, and will use the default buffer and no processor if they are not configured. 

![Data Prepper Basics](/assets/media/blog-images/2021-09-16-data-prepper-roadmap/figure1.png){: .img-fluid}

*Figure 1: Data Prepper Pipelines and attributes*


* **Source** is the input component of a pipeline. It defines the mechanism through which a pipeline will consume records. Source component could consume records either by receiving over http/s or reading from external endpoints like Fluent Bit, Beats, OpenTelemetry collectors, Kafka, SQS, CloudWatch etc. 
* **Buffer** is a temporary store of data and could either be in-memory or disk based. The default buffer will be an in-memory queue and is the only option available in the initial release.
* **Sink** is the output component of pipeline. It defines one or more destinations to which a pipeline will publish the records. A sink destination could be either services like OpenSearch, S3, or another pipeline. By using another pipeline as sink, customers can chain multiple Data Prepper pipelines. 
* **Processors** are intermediary processing units which can filter, transform and enrich the records into the desired format before publishing to the sink. The processor is an optional component of the pipeline, and if not defined the records will be published in the format as defined in the source. You can have more than one processor and they are executed in the order they are defined in the pipeline specification. For example, a pipeline might have one processor that removes a field from the document, followed by another processor that renames a field.

Today, Data Prepper 1.0 supports Trace Analytics data processing as shown below in Figure 2 below, and includes support for OpenTelemetry collector as a source, a raw-trace processor for trace data processing, and a service-map processor for service map creation.

![Data Prepper Basics](/assets/media/blog-images/2021-09-16-data-prepper-roadmap/figure2.png){: .img-fluid}

*Figure 2: Trace Analytics data processing pipeline*

### Roadmap

A [roadmap](https://github.com/opensearch-project/data-prepper/projects/1) for Data Prepper was published in the Data Prepper OpenSearch project repository on GitHub. It will give you visibility on plans for new features, enhancements, and bug fixes. We look forward to your feedback on it. In the next few months, the focus is on log collection from multiple sources through Data Prepper where they can be ingested, viewed, and analyzed in OpenSearch Dashboards. Data Prepper 1.2 (December 2021) release is going to provide users the ability to send logs from Fluent Bit to OpenSearch or Amazon OpenSearch Service and use Grok to enhance the logs. These logs can then be correlated to traces coming from the OTEL Collectors to further enhance deep diving into your service problems using OpenSearch Dashboards. Below are the key features that we are targeting for next (1.2) Data Prepper release:

* HTTP Source Plugin (support for Fluent Bit)
* Grok processor
* Logstash template support for Grok
* Sample code and tutorials on creating processors


If you want to add something that is not in the [public roadmap](https://github.com/opensearch-project/data-prepper/projects/1) for OpenSearch Data Prepper, that’s a perfect opportunity to contribute! We are looking for contributors to help develop new processors, new source plugins, and accelerate development of processors/source plugins on the roadmap. This public roadmap follows the same principles in the blog post outlining the [OpenSearch public roadmap](https://opensearch.org/blog/update/2021/05/opensearch-roadmap-announcement/). It is worth emphasizing a few points:

1. Date and milestones reflect intentions rather than firm commitments. Dates may change as anyone learns more or encounters unexpected issues. The roadmap will help make changes more transparent so that anyone can plan around them accordingly. 
2. You can create a [feature request](https://github.com/opensearch-project/.github/blob/main/ISSUE_TEMPLATE/FEATURE_REQUEST_TEMPLATE.md) in the relevant GitHub repo for the feature and socialize the request. A maintainer or someone else in the community may pick this feature up and work on it. As progress is made the maintainers of the repo will help get the feature onto the roadmap.
3. Another option is to build the feature yourself. To do this create a proposal as a GitHub issue in the relevant repo and use the [proposal template](https://github.com/opensearch-project/.github/blob/main/ISSUE_TEMPLATE/PROPOSAL_TEMPLATE.md). Offer your commitment to build it. The maintainers of the repo will work with you to figure out how best to proceed. 

Please also see [OpenSearch FAQ 1.19](https://opensearch.org/faq#q1.19) for more details. Learn more about Data Prepper by accessing the code, examples, and documentation in the [Data Prepper GitHub repository](https://github.com/opensearch-project/data-prepper). You can also connect with us and provide feedback in our [forum category](https://discuss.opendistrocommunity.dev/t/about-the-data-prepper-category/7038).