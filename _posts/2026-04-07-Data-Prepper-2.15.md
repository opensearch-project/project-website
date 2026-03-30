---
layout: post
title: 'Data Prepper 2.15: Ingest data from Apache Iceberg and more!'
authors:
  - dvenable
date: 2026-04-07 12:00:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.15 adds Apache Iceberg as a source and writes to open-source Prometheus.
meta_keywords: Data Prepper, Apache Iceberg, application performance monitoring, Prometheus
meta_description: Data Prepper 2.15 adds Apache Iceberg as a source and writes to open-source Prometheus.
---

The OpenSearch Data Prepper maintainers are happy to announce the release of Data Prepper 2.15. 
With this version you can ingest data from Apache Iceberg and write to open-source Prometheus. 

## Apache Iceberg source

TODO: lawofcycles

## Open-source Prometheus as a sink

TODO: ps48

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

TODO: ps48


## Other notable changes

TODO: dlvenable

## Getting started

* To download Data Prepper, visit the [Download & Get Started](https://opensearch.org/downloads.html) page.
* For information about getting started with Data Prepper, see [Getting started with OpenSearch Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.15 and other releases, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

Thanks to the following community members who contributed to this release!

TODO: dlvenable
