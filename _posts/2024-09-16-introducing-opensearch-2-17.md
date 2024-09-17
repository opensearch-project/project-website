---
layout: post
title:  "Introducing OpenSearch 2.17"
authors:
  - sisurab
date:   2024-09-17 
categories:
  - releases
meta_keywords: OpenSearch 2.17, machine learning, generative AI, vector search, search performance, vector workloads, inference processors, OpenSearch Playground
meta_description: Explore the new features and enhancements in OpenSearch 2.17, including improved machine learning integration, enhanced search performance, increased scalability, and cost efficiency.
---

OpenSearch 2.17 is now available! You can [download the latest version](https://opensearch.org/downloads.html) of OpenSearch to explore exciting new features and enhancements designed to improve machine learning (ML) integration, scalability, cost efficiency, and search performance. This release includes significant updates such as enhanced ML inference search processors, expanded batch processing capabilities, advanced search optimization, and more. Read on to dive into these powerful new features. For a complete breakdown, check out the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.17.0.md). Be sure to explore the new OpenSearch Dashboards on [OpenSearch Playground](https://playground.opensearch.org/app/home#/) and head to our [documentation](https://opensearch.org/docs/latest/) for in-depth guidance.


## Vector Database and generative AI

OpenSearch 2.17 adds a number of features to OpenSearch’s vector database and generative AI functionality to help accelerate application development and enable generative AI workloads.

**Reduce costs and boost efficiency with seamless disk-optimized vector search**

OpenSearch 2.17 introduces the new [_disk-optimized_ vector search](https://opensearch.org/docs/latest/field-types/supported-field-types/knn-vector/#vector-workload-modes), which significantly reduces the operational costs for vector workloads. This feature uses [binary quantization (BQ)](https://opensearch.org/docs/latest/search-plugins/knn/knn-vector-quantization/#binary-quantization), achieving an impressive 32x compression in memory usage. This feature can deliver up to 70% cost savings, while maintaining a recall rate of 0.9 or higher and p90 latencies below 200 milliseconds. One of the key advantages of disk-optimized vector search is its seamless out-of-the-box (OOB) integration, eliminating the need for complex pre-processing or training steps. By optimizing memory usage and reducing computational overhead, disk-optimized vector search helps you efficiently manage large-scale vector workloads. 

**Reduce memory usage and accelerate performance with byte vector encoding**

OpenSearch’s Faiss engine now supports [_byte vector encoding_](https://opensearch.org/docs/latest/field-types/supported-field-types/knn-vector/#byte-vectors). This memory-efficient encoding technique reduces memory usage by up to 75% with a minimal loss in recall, making it suitable for large-scale workloads. We recommend using byte vectors especially when input vectors contain values ranging from -128 to 127. This compact representation lowers search latencies and improves indexing throughput, accelerating your processes.

**Enhance security and streamline updates in Flow Framework**

The Flow Framework plugin now supports [advanced user-level security](https://opensearch.org/docs/latest/automating-configurations/workflow-security/). You can now use backend roles to configure fine-grained access to individual workflows based on roles. New for version 2.17, the [reprovision parameter](https://opensearch.org/docs/latest/automating-configurations/api/create-workflow/#query-parameters) helps you update and provision a template that you've provisioned before.

**Use asynchronous batch ingestion for efficient high-volume ML task processing**

OpenSearch 2.17 also introduces [_asynchronous batch ingestion_](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/async-batch-ingestion/), which allows you to trigger batch inference jobs, monitor job status, and ingest results once batch processing is complete. This streamlines high-volume machine learning tasks, such as generating embeddings for large datasets and ingesting them into k-NN indexes.

**Customize ML inference search response processors for your use case**

OpenSearch 2.16 introduced ML inference search processors, enabling you to run model predictions while executing search queries. Starting with OpenSearch 2.17, you can now choose to run model predictions for all documents in a single request or run model predictions for each document individually, further enhancing search response processors. This search response processor improvement provides you with the flexibility to customize ML inference search response processors to suit your specific use case.

## Search

This release also delivers new functionality focused on helping you improve search and query performance.

**Optimize search performance with enhanced concurrent segment search settings and expanded support**

[Concurrent segment search](https://opensearch.org/docs/latest/search-plugins/concurrent-segment-search/) has been generally available since OpenSearch 2.12. It supports two tuning parameters: an/off switch and a cluster-level setting that specifies the number of slices (maximum thread count) per request. In general, a greater number of slices reduces latency but requires more processing power per request. [More specific analysis](https://opensearch.org/blog/concurrent-search-follow-up/) has shown that some request types (including aggregations and remote store searches) benefit more from concurrent segment search than others. To help you take advantage of concurrent segment search for the right request types, OpenSearch 2.17 introduces a new setting both at index and cluster level. These settings along with [pluggable _decider_ logic](https://github.com/opensearch-project/OpenSearch/pull/15363) provides more granular control over which requests use concurrent search. This release also supports a [per-index (as opposed to per-cluster) maximum slice count setting](https://github.com/opensearch-project/OpenSearch/pull/15336). Additionally, we have expanded concurrent segment search to support more script-based search requests, including [composite aggregations with scripting](https://github.com/opensearch-project/OpenSearch/pull/15072) and [derived fields](https://github.com/opensearch-project/OpenSearch/pull/15326).

**Enhance query performance with efficient numeric term encoding and roaring bitmaps**

The `terms` query type has been provided by OpenSearch since the beginning, serving as a method to filter searches by including documents that contain a field value within a specified set of values. It has always supported a _terms lookup_, which retrieves those filter values from another index based on a document ID, essentially allowing a limited version of cross-index join. A limitation has been that the number of values retrieved from the lookup index was limited to the hundreds (or potentially low thousands). In OpenSearch 2.17, we have [added support for encoding numeric term values](https://github.com/opensearch-project/OpenSearch/pull/14774) as a [roaring bitmap](https://roaringbitmap.org/). By encoding the values more efficiently, a search request can use a stored filter that matches over a million documents, with lower retrieval latency and less memory used. For details, see [Bitmap filtering](https://opensearch.org/docs/latest/query-dsl/term/terms/#bitmap-filtering).

**Optimize query performance with improved multi-term query planning**

In OpenSearch 2.12, we introduced a query planning feature for multi-term queries over keyword fields. These include `range` , `terms` , `wildcard` , `prefix`, and `fuzzy` queries. These queries tend be more expensive to evaluate on an index, because we need to collect all matching keyword terms for the field, then collect all documents that match all of the terms. With the change introduced in version 2.12, if one of these queries is part of a conjunction involving another clause that matches a few documents, we can avoid the heavy upfront work by applying the multi-term query as a secondary filter to documents that match the other clause. Unfortunately, [we have seen some cases](https://github.com/opensearch-project/OpenSearch/issues/14755) where this query planning has chosen the wrong path due to faulty cost estimation. While we work toward improving the cost estimates, we have reverted to the pre-2.12 behavior by default in version 2.17. You can enable the pre-2.12 behavior in versions 2.12--2.16 by setting `search.keyword_index_or_doc_values_enabled` to `true`.

**Accelerate search performance with new techniques for computationally intensive queries**

As part of our ongoing effort to improve search performance, we are introducing a new set of experimental features to improve performance of computationally expensive queries. Our approximation framework brings new techniques to short-circuit long-running queries by only scoring relevant documents in the query. The first queries to take advantage of this framework in version 2.17 are top-level range queries with no other clauses. These queries show benchmark results of up to 50x faster query running times with this optimization. To enable these new experimental features, set `opensearch.experimental.feature.approximate_point_range_query.enabled` to `true` in `opensearch.yml`.


## Observability and log analytics

This release provides an expansion of OpenSearch’s observability and log analytics capabilities.

**Enhance trace analysis with a new custom trace source for advanced filtering and cross-cluster support**

OpenSearch 2.17 introduces a new custom trace source as an experimental feature. This new trace source is based on the OpenTelemetry schema and includes a redesigned overview page for traces and services, which offers advanced filtering capabilities on trace metadata and optimized performance. The new experimental custom trace source will also provide flexibility for wildcards in index names and support for cross-cluster trace indexes.

**Unlock enhanced anomaly detection with flexible data sources, advanced imputation methods, and domain-specific rules**

With OpenSearch 2.17 release, we have added the following enhancements to the Anomaly Detection plugin:

* **Support for remote and multiple data sources**: The Anomaly Detection Dashboards now support remote index selection, allowing you to select indexes from remote clusters in addition to local ones. You can choose any number of remote and local indexes, providing greater flexibility in data analysis.
* **Advanced imputation methods for missing data**: To address gaps in your data streams, we've introduced [new imputation methods](https://opensearch.org/docs/latest/observing-your-data/ad/index/#setting-an-imputation-option), including filling missing values with zeros, previous values, or custom values. These options help maintain data continuity and improve anomaly detection accuracy in the presence of missing data.
* **Integration of ML models with domain-specific rules**: We've combined ML models with domain-specific rules to enhance prediction precision. You can now filter anomalies based on the relationship between actual and expected values using ratio thresholds or absolute value thresholds. This allows for more tailored anomaly detection that aligns with your specific business requirements.



## Ease of use

This release also includes enhancements for better usability.

**Simplify index creation with application-based configuration templates for optimized performance and seamless integration**

OpenSearch 2.17 introduces [application-based configuration templates](https://opensearch.org/docs/latest/im-plugin/index-context/) as an experimental feature. If this feature is enabled, your cluster provides a predefined set of component templates that can be used while creating indexes and index templates based on your use case. These templates are designed to optimize performance for various use cases, such as logs and metrics, and are compatible with the schema defined in the OpenSearch catalog to further ease end-to-end integration with visualization experiences. This feature can be used through the newly available `opensearch-system-templates` plugin.


## Cost, performance, and scalability

This release introduces updates to help you improve the stability, availability, and resiliency of your OpenSearch clusters.

**Enhance snapshot scalability and resilience with centralized operations and improved data distribution**

In OpenSearch 2.17, we added multiple optimizations to snapshots, making them more scalable and resilient. For clusters with remote-backed storage enabled, the snapshot operation is now centralized at the cluster manager node, removing the overhead of communication with other nodes in the cluster. For non-remote-backed storage clusters, we added support for distributing data at the configured snapshot store evenly using [hashed prefixes](https://opensearch.org/docs/latest/api-reference/snapshots/create-repository/). This helps avoid throttling issues at the snapshot store.

**Reduce overhead and boost efficiency with remote cluster state publication**

Remote cluster state publication was introduced as experimental feature in OpenSearch 2.15 and is now generally available in OpenSearch 2.17. When this feature is enabled, the active cluster manager uploads the cluster state to remote-backed storage and then notifies the follower nodes to download the cluster state from remote-backed storage rather than sending it over the transport layer. This reduces the memory, CPU, and communication overhead on the cluster manager node for publication.

**Enhance performance and manage traffic with search-only replica shards**

OpenSearch 2.17 introduces experimental mechanisms to achieve indexing and search isolation within a cluster. We've added a new replica shard type that is intended only to serve search traffic. The shard is isolated from the `_bulk` write path and not primary eligible. These shards work by using segment replication to pull new segments at the refresh interval and are compatible with both node-node and remote-backed replication sources.
To experiment with this feature, set `opensearch.experimental.feature.read.write.split.enabled` to `true` in `in opensearch.yml`.  Once the setting is enabled, you can add or remove shards using the new `index.number_of_search_only_replicas` setting.  You can optionally allocate the shards to specific hardware by using a new `cluster.routing.allocation.search.replica.dedicated.include` filter.
This feature is still in [active development](https://github.com/opensearch-project/OpenSearch/issues/15237) and we appreciate your feedback.


## Get started with OpenSearch 2.17

Ready to try the latest features? Head to on our [downloads page](https://opensearch.org/downloads.html) to download OpenSearch 2.17. For more information, see the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.17.0.md), [documentation release notes](https://github.com/opensearch-project/documentation-website/blob/main/release-notes/opensearch-documentation-release-notes-2.17.0.md/), and [documentation](https://opensearch.org/docs/latest/). You can also explore the new visualization options on the  [OpenSearch Playground](https://playground.opensearch.org/app/home#/). As always, we welcome your feedback about this release in our [community forum](https://forum.opensearch.org/), and we look forward to hearing about your experiences with the latest features!