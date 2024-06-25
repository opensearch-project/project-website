---
layout: post
title:  Diving into OpenSearch 2.15
authors:
  - jamesmcintyre
date: 2024-06-25
categories:
    - releases
meta_keywords: opensearch 2.15, opensearch performance, hybrid search, opensearch parallel processing, opensearch batch processing, opensearch SIMD, opensearch vector performance, opensearch rolling upgrade, opensearch guardrails
meta_description: OpenSearch 2.15.0 brings an array of new and expanded functionality designed to help users scale up performance and efficiency; advance stability, availability, and resiliency; and enhance your search, analytics, and observability applications, along with new machine learning capabilities and ease-of-use improvements.
has_science_table: true
featured_blog_post: false 
featured_image: false # /assets/media/blog-images/__example__image__name.jpg
---

OpenSearch 2.15 is [now available](https://opensearch.org/downloads.html) with an array of new and expanded functionality to help you scale up performance and efficiency; advance stability, availability, and resiliency; and enhance your search applications, along with new machine learning (ML) capabilities and ease-of-use improvements. You can try out the latest updates using OpenSearch Dashboards on [OpenSearch Playground](https://playground.opensearch.org/app/home#/), and for a comprehensive rundown of what's new, check out the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.15.0.md). Here are some of the new tools you can start using with OpenSearch 2.15.

### ***Cost, performance, scale***

This release delivers a number of features focused on helping users improve **cost, performance, and scale** for their OpenSearch deployments.

**Process documents faster with parallel ingestion**

Many modern applications require significant data processing at the time of ingestion. For example, neural search requires that ingested documents be embedded in a vector space by an ML service, which is typically remote. To accelerate ingestion processing and take advantage of the parallelism offered by today's processors and remote services, OpenSearch 2.15 enables [parallel ingestion processing](https://opensearch.org/docs/latest/ingest-pipelines/processors/index-processors/#batch-enabled-processors). The release also introduces the ability to process documents in batches, which can reduce the number of API calls to remote services for greater efficiency. 

**Accelerate hybrid search with parallel processing**

This release also brings parallel processing to hybrid search for significant performance improvements. Introduced in OpenSearch 2.10, [hybrid search](https://opensearch.org/blog/hybrid-search/) combines lexical (BM25) or neural sparse search with semantic vector search to provide higher-quality results than when using either technique alone, and is a best practice for text search. OpenSearch 2.15 lowers hybrid search latency by running the two [subsearches in parallel](https://opensearch.org/docs/latest/search-plugins/neural-sparse-search/#step-5-create-and-enable-the-two-phase-processor-optional)at various stages of the process. The result is a latency reduction of up to 25%.

**Advance search performance with SIMD support for exact search**

OpenSearch 2.12 introduced support for JDK21, enabling users to run OpenSearch clusters on the latest Java version. Building upon this upgrade, OpenSearch 2.15 further enhances performance by adding support for Single Instruction, Multiple Data (SIMD) instruction sets for exact search queries. Previous versions support SIMD for approximate nearest neighbor search queries. The integration of SIMD for exact search requires no additional configuration steps, making it a seamless performance improvement. Users can expect a significant reduction in query latencies and a more efficient and responsive search experience, with approximately 1.5x faster performance than non-SIMD implementations.

**Save vector search storage capacity**

OpenSearch 2.15 introduces the ability to disable document values for the `k-nn` field when using the Lucene engine for vector search. This does not impact k-NN search functionality; for example, you can continue to perform both approximate nearest neighbor and exact search with the Lucene engine, similarly to previous versions of OpenSearch. In our tests, after disabling document values, we observed a ~16% reduction in shard size. We plan to extend this optimization to the NMSLIB and Faiss engines in future releases.

**Query certain data more efficiently with wildcard fields**

Standard `text` fields split text into tokens and build a token index to make search very efficient. However, many applications need to search for arbitrary substrings, regardless of token boundaries, which is not well supported by token indexes. OpenSearch 2.15 introduces the [`wildcard` field type](https://opensearch.org/docs/latest/field-types/supported-field-types/wildcard/). This field type gives you the option to build an index that provides more efficient search for fields that don't have a natural token structure, such as certain logs, or when the number of distinct tokens is extremely large.

**Manipulate document fields and gain efficiencies with derived fields**

OpenSearch 2.15 introduces [derived fields](https://opensearch.org/docs/latest/field-types/supported-field-types/derived/), also known as calculated, generated, or virtual fields. The value of a derived field is calculated at query time, so you can add or manipulate already-indexed fields by executing scripts on the  `_source `document in real time rather than needing to index or store the fields separately. This allows queries to be independent of the field names used at ingestion time, so the same query can be used for data ingested in different ways, enabling dynamic data transformation and enrichment. Dynamic fields can also reduce storage requirements by avoiding direct indexing and can be used to calculate additional fields for filtering or reporting.

**Boost performance for single-cardinality aggregations**

Cardinality aggregation is a common metric aggregation technique that provides an approximate count of the unique values in a given field. Example use cases include counting the number of visitors to a service and detecting anomalies across unique IP addresses or event types. OpenSearch 2.15 introduces a new optimization known as [dynamic pruning](https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/search-settings/) that can significantly improve the performance of single-cardinality aggregations, particularly on fields with low cardinality. Based on observations from the [Big5 workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/big5), this optimization can lead to as much as a 100x improvement in latency when executing these aggregations. Comprehensive results of Big5 benchmark tests are provided in this [pull request](https://github.com/opensearch-project/OpenSearch/pull/13821).

### *Stability, availability, resiliency*

The 2.15 release also includes updates that support the **stability, availability, and resiliency** of your OpenSearch clusters.

**Use rolling upgrades to migrate to remote-backed storage**

Remote-backed storage offers a new way to protect against data loss by automatically creating backups of all index transactions and sending them to remote storage. Introduced in OpenSearch 2.14 as an experimental feature, [migration to remote-backed storage](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/remote-store/migrating-to-remote/) is enabled in OpenSearch 2.15 as production-ready functionality. Now you can migrate a document-replication-based cluster to remote-backed storage through the rolling upgrade mechanism. Rolling upgrades, sometimes referred to as node replacement upgrades, can be performed on running clusters with virtually no downtime. Nodes are individually stopped and migrated in place, or, alternatively, nodes can be stopped and replaced one at a time by remote-backed hosts. During this process you can continue to index and query your cluster data.

**Reduce overhead for cluster state publication (Experimental)**

OpenSearch 2.15 adds an experimental feature that allows users to enable cluster state publication through remote-backed storage. Traditionally, cluster manager node processes updates to the cluster state and then publishes the updated cluster state through the local transport layer to all of the follower nodes. With [remote-backed state publication](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/remote-store/remote-cluster-state/) enabled, the cluster state is backed up to the remote store during every state update. This allows the follower nodes to fetch the updated state from the remote store directly, which reduces the memory and communication overhead on the cluster manager node for publication.

**Improve search query performance visibility with top N queries**

OpenSearch 2.15 introduces several advanced features for [top N queries](https://opensearch.org/docs/latest/observing-your-data/query-insights/top-n-queries/), enhancing query performance analysis and monitoring. In addition to top N queries by latency, users can now configure and retrieve top N queries based on CPU and memory usage. This release also allows users to export query insights to destinations like local indexes, enabling the preservation of historical top N query data for better performance analysis and identification of rogue queries. Additional metrics and information are now also included in top N query results, such as task-level resource usage and the `x-opaque-id` for source tracking of top N queries. These capabilities offer users extended visibility into query performance, facilitating more effective optimization and troubleshooting.

### *Search and ML*

OpenSearch 2.15 includes several additions to the OpenSearch **search** **and** **ML** toolkit, designed to make ML-powered applications and integrations more flexible and easier to build.

**Enable vector search from existing lexical indexes**

Using the [flow framework](https://opensearch.org/docs/latest/automating-configurations/api/index/), users can now run a template to augment an existing lexical index with vector fields from its text fields. This [reindex workflow](https://opensearch.org/docs/latest/automating-configurations/workflow-steps/) functionality provides users an easy way to enable vector and hybrid search on existing indexes without spending time and resources reindexing source indexes.

**Use integrated AI services as guardrails for model toxicity**

Previously, OpenSearch users could only create regex-based guardrails to detect toxic input and output from OpenSearch [models](https://opensearch.org/docs/latest/ml-commons-plugin/api/model-apis/index/). In OpenSearch 2.15, users can configure a remote model to serve as a [guardrail](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/guardrails/). This allows users to create stronger guardrails that use state-of-the-art AI services or models to detect toxicity more accurately.

**Enable local models for ML inference processing**

The [ML inference processor](https://opensearch.org/docs/latest/ingest-pipelines/processors/ml-inference/)enables users to enrich ingest pipelines using inferences from any integrated ML model. Previously, the processor only supported remote models, which connect to model provider APIs like Amazon SageMaker, OpenAI, Cohere, and Amazon Bedrock. In OpenSearch 2.15, the processor is compatible with local models, which are models hosted on the search cluster's infrastructure. 


### ***Ease of use***

This release also includes tools that advance OpenSearch’s **ease of use**.

**Access multiple data sources across more OpenSearch Dashboards plugins**

As part of the ongoing effort to support [multiple data sources](https://opensearch.org/docs/latest/dashboards/management/multi-data-sources/) across OpenSearch Dashboards, OpenSearch 2.14 added support for nine external Dashboards plugins. This release adds support for several more plugins to help you manage data across OpenSearch clusters and combine visualizations into a single dashboard. Four more external Dashboards plugins are now supported: Metrics Analytics, Security Analytics, Dashboards Assistant, and Alerting. One core plugin, Timeline, has also been added as part of this release. Additionally, functionality introduced in OpenSearch 2.9 that lets you build monitors and detectors for visualizations also now supports the use of multiple OpenSearch clusters.

**Getting started with OpenSearch 2.15**

You can download the latest version of OpenSearch [here](https://www.opensearch.org/downloads.html) and explore OpenSearch Dashboards live on [OpenSearch Playground](https://playground.opensearch.org/app/home#/). For more information about this release, see the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.15.0.md) and the [documentation release notes](https://github.com/opensearch-project/documentation-website/blob/main/release-notes/opensearch-documentation-release-notes-2.15.0.md). Your feedback on this release is welcome on our [community forum](https://forum.opensearch.org/)!

*Connect with the OpenSearch community in person!* *Our third annual* [*OpenSearchCon North America*](https://opensearch.org/events/opensearchcon/2024/north-america/index.html) *is coming to San Francisco September 24–26, and we hope to see you there. If you'd like to share your ideas with the community, the* [*Call for Presentations*](https://opensearch.org/events/opensearchcon/2024/north-america/cfp.html) *is closing soon, so submit your proposal today!*
