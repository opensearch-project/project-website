---
layout: post
title:  "Calyptia and OpenSearch Partnering to Add Connectors for Fluent Bit and Fluentd"
authors:
  - elifish
  - anurag_gup
date: 2022-01-20
categories:
  - releases

excerpt: "Calyptia and the OpenSearch project team are partnering to build OpenSearch connectors for Fluent Bit and Fluentd."
redirect_from: "/blog/releases/2022/01/calyptia-partner-blog-announcement/"
---

We are excited to share that [Calytpia](https://calyptia.com/) and the OpenSearch project team [are partnering](https://calyptia.com/2022/01/20/calyptia-and-opensearch-partner-to-build-first-party-connectors-to-fluent-bit-and-fluentd/) to build OpenSearch connectors for [Fluent Bit](https://fluentbit.io/) and [Fluentd](https://www.fluentd.org/). These open source [Cloud Native Computing Foundation (CNCF)](https://www.cncf.io/) graduated projects are commonly used for log collection, processing, and forwarding.

**What is Fluent Bit?** Fluent Bit is a log processor and forwarder for collecting data, like logs, from different sources, enriching them with filters, and sending them to multiple destinations. It’s designed with performance in mind, meaning it is optimized for high throughput and low CPU and memory usage. It's written in C and has a pluggable architecture supporting more than [70 plugins](https://github.com/fluent/fluent-bit/tree/master/plugins) for inputs, filters, and outputs.

**What is Fluentd?** Fluentd is a data collector for log data collection, processing, and forwarding. It’s written in Ruby and supports [over 500 plugins](https://www.fluentd.org/plugins/all) including data sources, data output, parsers, formatters, and filters.

As maintainers for Fluentd and Fluent Bit, Calyptia brings a wealth of knowledge for the Fluent projects, and we look forward to working together to add OpenSearch connectors for these popular tools. As Eduardo Silva, Co-founder of Calyptia and Creator of Fluent Bit, puts it;

*“Since the launch of OpenSearch, we have seen consistently increasing demand for production-ready OpenSearch connectors for Fluent Bit and Fluentd. We are eager to be partnering with the OpenSearch project team to build these connectors and provide an end-to-end vendor neutral and open source solution for collecting, parsing, storing, and analyzing log data.”*

We are excited to have Fluent Bit and Fluentd join the range of tools like Data Prepper and the OpenSearch Logstash Output Plugin that help people collect, process, and sending data to OpenSearch. To learn more and track the progress on these connectors, you can checkout the [Fluentd GitHub repo](https://github.com/fluent/fluentd) and [Fluent Bit GitHub repo](https://github.com/fluent/fluent-bit).

### Get involved!
We would love to see you contribute to [OpenSearch](https://github.com/opensearch-project), [Fluent Bit](https://github.com/fluent/fluent-bit/), and [Fluentd](https://github.com/fluent/fluentd)! For almost any type of contribution, the first step is opening an [issue](https://github.com/opensearch-project/OpenSearch/issues). Even if you think you already know what the solution is, writing a description of the problem you’re trying to solve will help everyone get context when they review your pull request.
