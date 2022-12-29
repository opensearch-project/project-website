---
layout: post
title:  "Fluent Bit 2.0 and OpenSearch"
authors:
  - anurag_gup
date: 2022-12-29
categories:
  - releases
  - 
meta_description: "Learn how Fluent Bit v2.0 helps you collect, process, and enrich observability data like logs, metrics, and traces, and use them with OpenSearch."
meta_keywords: "Fluent Bit 2.0, observability, log date, trace data"
---

Earlier this year at KubeCon North America, the Fluent team announced [Fluent Bit v2.0](https://fluentbit.io/announcements/v2.0.0/). The Fluent Bit project is an open-source Apache 2.0 project that helps users collect, process, and enrich observability data (logs, metrics, and traces) from a variety of sources and send it to downstream analytics engines, such as OpenSearch. 

![Fluent Bit 2.0 and OpenSearch]({{ site.baseurl }}/assets/media/blog-images/2022-12-29-fluentbit-20/fluentbit20-1.png){: .img-fluid}

In this blog post, we will discuss some of the features of Fluent Bit v2.0 and how you can use them to get started with OpenSearch.

## Overview of Fluent Bit v2.0

The latest version of Fluent Bit includes commonly requested features from users within the larger Fluent community, including:

* Full support for OpenTelemetry standards (logs, metrics, and traces)—both input and output.
* Enhanced support for Prometheus metrics (Node Exporter, Prometheus Scraper, and Prometheus Remote Write).
* Flexibility with Golang input plugin support and new WebAssembly plugins.
* Greater debugging (tap) and monitoring capabilities (storage metrics).
* Full TLS support for ingestion of syslog and other network traffic.
* Configuration support for the YAML format.
* Dynamic index support for OpenSearch, as of 2.0.6. (This is one of my favorites!) 



## Dynamic index support for OpenSearch

One of the most requested features has been the ability to send data that is part of an incoming data stream to OpenSearch. For example, if you’re reading data from Kubernetes logs, you may want to follow an indexing strategy where each index is named after a Kubernetes namespace. With dynamic index support through Record Accessor, you can now set the index to pull values from the incoming message stream. Record Accessor is a syntax used to pull values from nested fields to use as part of the index. To learn more about this feature, visit the following [_documentation link._](https://docs.fluentbit.io/manual/administration/configuring-fluent-bit/classic-mode/record-accessor)

As an example, we will start with a simple configuration where we are collecting CPU metrics, enriching the logs with our Linux system’s hostname, and then setting the index to be equal to the hostname.


```
[INPUT]
    Name cpu


[FILTER]
    Name modify
    Match *
    Record host $hostname

[OUTPUT]
    Name opensearch
    Type

{INSERT REMAINING CONFIGURATION}
```


After running this configuration, you can see that a create request is sent to OpenSearch and that the index is based on the hostname.


![Fluent Bit 2.0 and OpenSearch]({{ site.baseurl }}/assets/media/blog-images/2022-12-29-fluentbit-20/fluentbit20-2.png){: .img-fluid}

## Next steps

In this blog post, we covered the new features of Fluent Bit v2.0 and how you can make use of dynamic index support to send data to OpenSearch. There are many integrations with the Fluent Bit v2 release that you can make use of with OpenSearch. Some include OpenTelemery data to OpenSearch Data Prepper, ingesting more secure network-based sources, and using the enhanced self-metrics monitoring for Fluent Bit to ensure all of your data flows to OpenSearch. 

If you have any questions or are interested in joining the [Fluent Community](https://fluentbit.io/community/), join us on our [_Fluent Slack channel_](https://fluent-all.slack.com/) or in the [_GitHub repository_](https://github.com/fluent/fluent-bit).
