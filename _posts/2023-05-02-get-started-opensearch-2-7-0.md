---
layout: post
title:  "Get Started with OpenSearch 2.7.0"
authors:
  - jamesmcintyre
date:   2023-05-02 12:15:00 -0700
categories:
  - releases
meta_keywords: opensearch observability, flat field search, security analytics, cluster administration, OpenSearch 2.7
meta_description: Explore OpenSearch 2.7.0 with new tools for search, observability, and security analytics workloads, plus major enhancements for cluster and data management.
twittercard:
  description: "OpenSearch 2.7.0 is ready for download! The latest version of OpenSearch offers a range of new capabilities for search, analytics, observability, and security applications, along with significant enhancements to administration and usability. This release also marks the general availability of several major features that were previously released as experimental—we hope you’re as eager as we are to put capabilities like segment replication, searchable snapshots, and more into production!"
---

OpenSearch 2.7.0 is [ready for download](https://opensearch.org/downloads.html)! The latest version of OpenSearch offers a range of new capabilities for search, analytics, observability, and security applications, along with significant enhancements to administration and usability. This release also marks the general availability of several major features that were previously released as experimental—we hope you’re as eager as we are to put capabilities like segment replication, searchable snapshots, and more into production! As always, the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.7.0.md) provide a full view of what’s new, and you can explore OpenSearch’s visualization tools on the [Playground](https://playground.opensearch.org/app/home#/).

### Gain efficiencies at scale with searchable snapshots

Introduced as experimental in OpenSearch 2.4.0, [searchable snapshots](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/searchable_snapshot) allow you to search indexes that are stored as snapshots within remote repositories in real time, with no need to download the entire set of indexed data to cluster storage ahead of time. Now production ready with a number of enhancements to performance, stability, and administration (as [tracked here](https://github.com/orgs/opensearch-project/projects/55/views/1)), searchable snapshots can help you take advantage of remote storage options while saving time and conserving storage capacity. With this release, phase two of the project’s [storage roadmap](https://github.com/opensearch-project/OpenSearch/issues/3739) is now generally available.

### Enhance performance with segment replication

With the general availability of [segment replication](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/segment-replication/index/), users can choose another strategy for replicating their data, with the potential to improve performance for high-ingestion workloads. Segment replication copies Lucene segment files from the primary shard to its replicas. Lucene’s write-once segmented architecture means that only new segment files need to be copied, offering improved indexing throughput and lower resource utilization at the expense of increased network utilization and refresh times. You can now choose between segment replication and document replication; document replication performs the same indexing operation on the primary shard and each replica in parallel whenever documents are added to, removed from, or updated within an index. Released as experimental in OpenSearch 2.3.0, segment replication received a number of contributions as it approached general availability, as tracked in the [project here](https://github.com/orgs/opensearch-project/projects/99).

### Visualize and explore data from multiple sources

Also ready for production is support for [multiple data sources](https://opensearch.org/docs/latest/dashboards/discover/multi-data-sources/) in OpenSearch Dashboards. Now you can dynamically manage data sources across multiple OpenSearch clusters, create index patterns based on those sources, run queries against a specific data source, and combine visualizations into a single dashboard. Launched as experimental in OpenSearch 2.4.0, this feature has gained functionality in preparation for version 2.7.0, as tracked in [this issue](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3577), including integration with the Dev Tools console and several usability enhancements.

### Reduce overhead with flat objects

Complex JSON objects often include a large number of subfields. As indexes grow, the overhead required to map each field can consume excessive amounts of storage and memory, potentially leading to “mapping explosions” that can impact the performance and resilience of the cluster. With the new [flat object](https://opensearch.org/docs/latest/field-types/flat-object) field type, you have the option to store complex JSON objects in an index without indexing all fields separately. By defining a flat object, you can choose to store the object and all of the objects within it, avoiding the need to separately index the subfields while keeping those subfields accessible as keywords using dot notation in DSL and SQL. This means that you can you tune your index mapping to your data and better manage and utilize your resources. 

### Use observability features in OpenSearch Dashboards

With 2.7.0, OpenSearch continues the trend of integrating observability features as core functionality within OpenSearch Dashboards. Now you can easily access observability features from the main menu, create and select observability dashboards from within Dashboards, and add event analytics visualizations (PPL) to new or existing dashboards in OpenSearch Dashboards. Simply create a new dashboard from within OpenSearch Dashboards and see observability dashboards as an option or add your favorite event analytics PPL visualization to your existing dashboard. For more on this functionality, see [the documentation](https://opensearch.org/docs/latest/observing-your-data/event-analytics/).

### Query geospatial data with shape-based filters

This release brings another round of enhancements to the geospatial tools in OpenSearch Dashboards, with the ability to [filter geospatial data](https://opensearch.org/docs/latest/dashboards/visualize/maps/) against geospatial field types. In earlier versions, users could filter documents by non-geospatial field types in the document layer. Now you can filter your data by drawing a rectangle or polygon over a selected area of the map. This applies filters to geospatial data to identify spatial relationships; you can use this functionality to return documents whose geographic coordinates (geo_point) or geographic shape (geo_shape) intersect, contain, are within, or are not found within the query geometry.

![Image: Animated visual showing user experience for shape-based filter functionality]({{ site.baseurl }}/assets/media/blog-images/2023-05-02-get-started-opensearch-2-7-0/shape-filters-2-5x.gif){: .img-fluid }

### View OpenSearch maps in local languages

With 2.7.0, OpenSearch will now automatically render maps with labels and contents shown in the language for which the OpenSearch instance is configured. In earlier versions, maps are rendered using the language provided by the source library. Now you have the option to display maps in the supported language of their choice. At launch, the selected language will be defined by the OpenSearch Dashboards YAML configuration file; look out for a selectable dropdown menu in a future release.

### Simplify administration with component templates

OpenSearch 2.7.0 simplifies the management of multiple index templates by adding [component templates](https://opensearch.org/docs/latest/dashboards/im-dashboards/component-templates/) directly into the index management UI in OpenSearch Dashboards. In the past, users faced difficulties managing multiple index templates due to duplication, resulting in a larger cluster state. Additionally, making changes to multiple templates required manual updates for each one. Further enhancing the index management UI introduced with 2.5.0*,* component templates allow you to overcome these challenges by abstracting common settings, mappings, and aliases into a reusable building block.

![Image: Animated visual showing user experience of a user creating a component template]({{ site.baseurl }}/assets/media/blog-images/2023-05-02-get-started-opensearch-2-7-0/component.gif){: .img-fluid }

### Configure tenancy dynamically in OpenSearch Dashboards

Another time-saving upgrade for OpenSearch administrators comes with the availability of [dynamic tenant management](https://opensearch.org/docs/latest/security/multi-tenancy/dynamic-config/). OpenSearch Dashboards uses tenants as spaces in which to save and share index patterns, visualizations, dashboards, and other objects, with administrative control over which users can access a tenant and the level of access provided. In earlier versions, tenant creation and mapping was supported in Dashboards, while tenant configuration was done in YAML files, requiring changes to be made within each data node to maintain consistency across nodes and necessitating a restart of Dashboards in order to take effect. With this release, administrators can view, configure, and enable or disable tenancy within Dashboards and effect those changes without needing to restart.

### Maintain performance with hot shard identification

This release brings [hot shard identification](https://opensearch.org/docs/latest/monitoring-your-cluster/pa/rca/shard-hotspot) to the collection of tools available in OpenSearch’s [Performance Analyzer](https://opensearch.org/docs/latest/monitoring-your-cluster/pa/index/) plugin. Hot shards consume more compute, memory, or network resources than other shards in an index; left unaddressed, they can lead to reduced query throughput and increased latency across the index, potentially impacting cluster availability. Now you can use the performance analyzer’s root cause analysis agent to identify hot shards within the cluster so they can be mitigated to the benefit of cluster performance.

### Analyze security events with built-in correlation tools

The log data that comprises security events can span across multiple indexes and data streams, and visualizing relationships between connected events can provide valuable insight for security analysts. Included in this release as an experimental feature, the [correlation engine](https://opensearch.org/docs/latest/security-analytics/sec-analytics-config/correlation-config) lets you define correlations in your security event data, enabling high-fidelity findings across different log sources, like DNS, Netflow, and Active Directory, to name a few. This knowledge graph can be used to identify, store, and recall connected event data across multiple indexes and data streams to help you identify patterns and investigate relationships across different systems in your monitored infrastructure. As always, experimental features are only recommended for use outside of production environments.

### Improve availability for ML models

The experimental machine learning (ML) framework receives updates in this release, including a new [automatic reloading mechanism](https://opensearch.org/docs/latest/ml-commons-plugin/cluster-settings/#Enable-auto-redeploy) for ML models. Now you can set up your search clusters to auto-reload deployed models when a cluster restarts after shutting down or when a node rejoins a cluster, so you can minimize recovery time and get your ML models back into production faster.

### Explore OpenSearch 2.7.0

The latest version of [OpenSearch is ready for download](https://opensearch.org/downloads.html). You can learn more about these features and many more in the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.7.0.md), [documentation release notes](https://github.com/opensearch-project/documentation-website/blob/main/release-notes/opensearch-documentation-release-notes-2.7.0.md/), and [documentation](https://opensearch.org/docs/2.7/), and the [OpenSearch Playground](https://playground.opensearch.org/app/home) is a great place to explore the tools before downloading them. Look for upcoming blog posts that dive deeper into the new features included in OpenSearch 2.7.0.
