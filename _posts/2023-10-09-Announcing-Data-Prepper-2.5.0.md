---
layout: post
title:  "Announcing Data Prepper 2.5.0"
authors:
- graytaylor0
- oeyh
date: 2023-10-09 11:30:00 -0500
categories:
  - releases
meta_keywords: Data Prepper, OpenSearch migration, Processors, OpenSearch ingestion
meta_description: OpenSearch has launched Data Prepper 2.5.0 with feature support for an OpenSearch source, translate and dissect processors, and key-value processor enhancements
---

Data Prepper 2.5.0 is now available for download. This release includes a new OpenSearch source, new dissect and translate processors, and additions to the existing key-value processor.

## OpenSearch source

The OpenSearch source is tailored for data migration and replication of OpenSearch clusters. While this is commonly done with [Snapshots](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/index/), there are often incompatibilities between snapshots of different versions within or between OpenSearch and Elasticsearch. In combination with Data Prepper’s [OpenSearch sink plugin](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/sinks/opensearch/), Data Prepper can now migrate all indices, or just specific indices, from one or more source clusters, to one or more sink clusters. The OpenSearch source will continually detect new indices in the source cluster that need to be processed, and can even be scheduled to reprocess indices at a configurable interval to pick up on new documents.

This is a great way to upgrade legacy Elasticsearch 7.x clusters to the latest OpenSearch versions as well as OpenSearch 2.x clusters to [Amazon OpenSearch Serverless](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless.html) collections, which do not support native snapshots. Additionally, serverless collections can be specified as the source cluster to replicate and migrate indexes between serverless collections.

For more information, see the [OpenSearch source documentation](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/sources/opensearch/).

## Translate processor

Data Prepper 2.5.0 introduces a new translate processor that modifies, or “translates,” a value in incoming events to a different value based on user-configured mappings. For example, you can translate an HTTP status code such as 404 to "Not Found" to make it readable. The processor supports regular expressions, number ranges, and comma-delimited values as mapping keys. Users also have the flexibility to define the mappings either directly in the pipeline configuration or through a file on the local machine or in a remote Amazon Simple Storage Service (Amazon S3) bucket.

## Dissect processor

Data Prepper possesses a suite of tools for parsing data with various types and structures, for example, [csv processor](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/csv/), [parse_json processor](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/parse-json/), [key_value processor](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/key-value/), [grok processor](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/grok/), etc. In Data Prepper 2.5.0, we are introducing a new addition to this collection: the dissect processor. The dissect processor uses a predefined pattern to extract individual fields from log messages. It shares similarities with the grok processor in terms of field extraction but is faster and simpler (no need for regular expressions) in cases where the each log line has the same set of fields separated by delimiters.

## Other improvements

Data Prepper 2.5.0 includes a number of other improvements. We want to highlight a few of them.

* The OpenSearch sink now supports update, upsert and delete actions for bulk operation in additions to the existing create and index actions. Actions can also be specified with a condition to determine when to take which type of actions.
* The `key_value` processor now supports writing parsed values to the root of event and adding tags to metadata when parsing fails.

## Thanks to our contributors!

* [asifsmohammed](https://github.com/asifsmohammed) - Asif Sohail Mohammed
* [chenqi0805](https://github.com/chenqi0805) - Qi Chen
* [daixba](https://github.com/daixba) - Aiden Dai
* [dlvenable](https://github.com/dlvenable) - David Venable
* [gaiksaya](https://github.com/gaiksaya) - Sayali Gaikawad
* [graytaylor0](https://github.com/graytaylor0) - Taylor Gray
* [JonahCalvo](https://github.com/JonahCalvo) - Jonah Calvo
* [KarstenSchnitter](https://github.com/KarstenSchnitter) - Karsten Schnitter
* [kkondaka](https://github.com/kkondaka) - Krishna Kondaka
* [oeyh](https://github.com/oeyh) - Hai Yan
* [rajeshLovesToCode](https://github.com/rajeshLovesToCode)
* [shenkw1](https://github.com/shenkw1) - Katherine Shen
* [vishalboin](https://github.com/vishalboin) - Vishal Boinapalli