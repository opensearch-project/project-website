---
layout: post
title:  "OpenSearch 2.8 is here!"
authors:
  - jamesmcintyre
date:   2023-06-06 12:30:00 -0700
categories:
  - releases
meta_keywords: opensearch observability, opensearch index management, opensearch search pipelines, opensearch vector search, OpenSearch 2.8, vector search k-nn
meta_description: OpenSearch 2.8 adds new observability tools for cross-cluster PPL queries, simplifies index management operations, and introduces enhancements for segment replication, searchable snapshots, and more.
---

[OpenSearch 2.8.0](https://www.opensearch.org/downloads.html) is now available, with a host of new features and enhancements and experimental functionality that are sure to generate excitement within the community! This release includes new tools for machine learning, search, and observability workloads and several enhancements to better manage your indexes and data. Read on for a rundown of what’s new in 2.8.0.

### Query your data across OpenSearch clusters with PPL
This release expands the OpenSearch observability toolkit, including [cross-cluster support](https://opensearch.org/docs/latest/observing-your-data/cross-cluster-replication/) for queries using Piped Processing Language (PPL). Now, you can query and visualize data stored in multiple OpenSearch clusters using the logs feature in Observability. This feature works across your domain boundaries so you can query data from any index, in any OpenSearch cluster, from a single interface and perform the same operations against the data as if it came from a single source.

### Simplify index management tasks
Index operations such as refresh, flush, and clear cache are actions administrators often take to manage their indexes. Previously, refreshing or flushing an index or data stream or clearing a data stream’s cache meant using an API. With this release, those tasks are included in the [index management user interface](https://opensearch.org/docs/latest/dashboards/im-dashboards/index-management). Now, operations like refreshing the index to make the latest data available for search are point-and-click. OpenSearch’s [index state management (ISM)](https://opensearch.org/docs/latest/im-plugin/ism/index/) tools are also new for 2.8.0, offering the option of sending notifications for long-running index operations. Some index operations, such as reindex, split, or shrink, can take minutes to hours. You can now set up automatic notifications when those jobs are complete. Notifications can be configured in OpenSearch Dashboards, through the command line, or in ISM policies.

### Augment search applications with experimental functionality
Available as an experimental feature in 2.8.0, [search pipelines](https://opensearch.org/docs/latest/search-plugins/search-pipelines/index/) provides functionality to build a chain of search processors in an OpenSearch cluster to integrate components such as query rewriters and results rerankers. For search application builders, this functionality unlocks the ability to integrate complex chains of search processors within OpenSearch with no additional processing required by end users. This release includes three built-in processors: filter_query, rename_field, and script request. The project is eager to receive feedback from developers on this functionality and other types of processors that the community finds useful. Let us know your feedback in the [Request for Comments](https://forum.opensearch.org/t/rfc-search-pipelines/12099). You can also explore these tools in the [OpenSearch Playground](https://searchapps.playground.opensearch.org/app/home).

### Enhancements to existing features

This release includes a range of enhancements to existing features. For a comprehensive list of updates, check out the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.8.0.md).

* Generally available since OpenSearch 2.7.0, [segment replication](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/segment-replication/index/) receives updates in this release. Support for mixed cluster versions allows nodes that are running different versions of OpenSearch to replicate segments. You can use segment replication when upgrading OpenSearch to reduce downtime or choose it as the default [index replication strategy](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/segment-replication/index/#setting-the-replication-type-on-a-cluster) at the cluster level.
* Generally available since OpenSearch 2.7.0, [searchable snapshots](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/searchable_snapshot) sees upgrades for improved performance. Searchable snapshots now defaults to the primary shard when querying indexes, reducing query latency by more efficiently using the cache. Users also now have capabilities to clear the file caches of one or more indexes through an API.
* OpenSearch Dashboards now supports Node.js versions 14, 16, and 18. Users have the flexibility to choose from these versions to run the web application. Previous 2.x versions were distributed with Node.js version 14. OpenSearch 2.8.0 includes version 16.
* OpenSearch’s vector search functionality has two enhancements to k-NN implementation. First, an update to [optimize native memory allocations](https://github.com/opensearch-project/k-NN/issues/922) offers stability improvements for large workloads. Second, [an update to Apache Lucene](https://github.com/opensearch-project/k-NN/issues/785) optimizes write performance for k-NN indexes.
* Released for production workloads with OpenSearch 2.7.0, support for [multiple data sources](https://opensearch.org/docs/latest/dashboards/discover/multi-data-sources/) in OpenSearch Dashboards gave you capabilities for managing data sources across multiple OpenSearch clusters, combining visualizations into a single dashboard, and more. With this release, OpenSearch adds support for Amazon OpenSearch Serverless with the [SigV4 authorization type](https://opensearch.org/docs/latest/dashboards/discover/multi-data-sources/).

### Getting started

You can download the [latest version of OpenSearch](https://www.opensearch.org/downloads.html) from the Download & Get Started page. OpenSearch Dashboards is also available to explore live on the [OpenSearch Playground](https://playground.opensearch.org/app/home#/). Learn more about this release in the [project’s release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.8.0.md) and the [documentation release notes](https://github.com/opensearch-project/documentation-website/blob/main/release-notes/opensearch-documentation-release-notes-2.8.0.md). As always, we appreciate hearing from you. Leave your feedback on this release in the [community forum](https://forum.opensearch.org/)!

*Got plans for September 28? Consider joining us for [OpenSearchCon 2023](https://opensearch.org/OpenSearchCon2023.html). This annual gathering for the OpenSearch community brings users and developers from across the OpenSearch ecosystem together in Seattle, and you’re invited! We’re looking for speakers who’d like to share their story. Please take a look at our [Call for Presentations](https://opensearch.org/blog/call-for-presentations-bring-your-ideas-to-opensearchcon-2023/), open for submissions through June 16.*
