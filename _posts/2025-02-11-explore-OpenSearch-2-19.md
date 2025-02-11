---
layout: post
title:  "Explore OpenSearch 2.19"
authors:
  - jamesmcintyre
date:   2025-02-11 14:20 -0700
categories:
  - releases
meta_keywords: opensearch machine learning, opensearch vector database, opensearch binary vector, opensearch generative AI, opensearch discover, opensearch 2.19, opensearch hybrid search, opensearch search pipeline, opensearch anomaly detection, opensearch remote storage, openseearch reciprocal rank fusion, opensearch RRF
meta_description: OpenSearch 2.19 brings significant updates for vector search and generative AI workloads, including reciprocal rank fusuion for hybrid search applications, plus new tools for anomaly detection and major performance optimizations.

---

The latest version of OpenSearch expands capabilities for search and observability use cases, boosts performance and ease of use, and introduces an array of advancements for machine learning (ML) and generative AI applications. Let's review some of the exciting features available in OpenSearch 2.19; for a deeper dive into what's new, please visit the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.19.0.md). You can download your preferred [OpenSearch distribution here](https://opensearch.org/downloads.html) or check out [OpenSearch Playground](https://playground.opensearch.org/app/home) to explore the latest functionality using our data visualization toolkit.

***Vector database and generative AI***

OpenSearch 2.19 includes updates to OpenSearch's vector database and ML toolkit to help you build more flexible and capable ML-powered and generative AI applications.

### Save up to 60% on storage with an experimental derived source for vectors
This release introduces experimental support for a derived source for k-NN vectors. The `source` field roughly equates to the JSON representation of a document and is used for operations such as fetching values during search and reindexing. The derived source feature removes these vectors from the JSON source and dynamically injects them when needed. For 2.19, this feature works for flat vector mappings, object fields, and single-level nested fields, demonstrating storage savings of up to 60%. Give it a try and share any feedback in [the RFC](https://github.com/opensearch-project/k-NN/issues/2377).

### Implement pluggable storage for vector workloads
OpenSearch 2.18 introduced the ability to use a [pluggable store](https://opensearch.org/blog/enable-pluggable-storage-in-opensearch-vectordb/) to read vector data structures. With this version, users can now extend this support to perform both read and write operations from pluggable storage. OpenSearch distributions that use the `RemoteStore`-based directory implementation are now fully compatible with vector workloads. Refer to [this GitHub issue](https://github.com/opensearch-project/k-NN/issues/2033) for additional information.

### Reduce memory and storage requirements with binary vectors for the Lucene engine
[Binary vectors](https://opensearch.org/docs/latest/field-types/supported-field-types/knn-vector/#binary-vectors) offer an efficient alternative to FP32 vectors, allowing you to reduce both memory footprint and storage usage by [more than 90%](https://github.com/opensearch-project/k-NN/issues/1857#issuecomment-2598998408) while maintaining strong performance on smaller hardware configurations. This release adds [Lucene binary vectors](https://opensearch.org/docs/latest/search-plugins/knn/knn-index/#binary-vectors), complementing existing Faiss engine binary vector support to offer greater flexibility for vector search applications.

### Apply cosine-based similarity search with the Faiss vector engine
The OpenSearch k-NN plugin has introduced support for [cosine similarity](https://opensearch.org/docs/latest/search-plugins/knn/approximate-knn/) in the Faiss engine for k-NN and radial search, enhancing OpenSearch's ability to perform similarity searches based on cosine distance. This improvement allows users to execute cosine similarity searches without the need for manual data normalization, streamlining the process and improving performance. This functionality offers advantages for a range of use cases, including recommendation systems, fraud detection, and content-based search applications. For more information and implementation guidelines, please refer to [this GitHub issue](https://github.com/opensearch-project/k-NN/issues/2242).

### Build applications using ingest and search pipelines in OpenSearch Dashboards
New for OpenSearch 2.19, [OpenSearch Flow](https://opensearch.org/docs/latest/automating-configurations/workflow-builder/) helps developers innovate faster by creating flows powered by the latest AI techniques. Custom flows can be composed with less code to support a range of use cases, such as retrieval-augmented generation and vector search applications. With OpenSearch Flow in OpenSearch Dashboards, you can build search and ingest pipelines iteratively, while the [OpenSearch Flow Framework plugin](https://opensearch.org/docs/latest/automating-configurations/index/) provides automation for configurations and resource management behind the scenes. When you're satisfied with the solution you have built, you can export a [workflow template](https://opensearch.org/docs/latest/automating-configurations/workflow-templates/) to recreate resources across different clusters and data sources.

### Boost search relevance with pagination support in hybrid search
[Hybrid search](https://opensearch.org/docs/latest/search-plugins/hybrid-search/) combines multiple query types, like keyword and neural search, to improve search relevance. In OpenSearch 2.19, hybrid search functionality has been enhanced with several key improvements. The new `pagination_depth` parameter enables better management of large result sets, allowing you to break result sets into smaller subsets by specifying the maximum number of results retrieved from each shard per subquery. 

### Strengthen queries with ML inference search
OpenSearch 2.19 introduces the ML inference search request extension. This feature addresses the limitations of applying ML model predictions during search by allowing users to pass additional input fields that are not part of the search queries. The new `ml_inference` search extension can be used alongside any search query, offering a flexible object containing various model input formats that make search requests adaptable to different models.

### Enhance hybrid search results with reciprocal rank fusion
This release adds [reciprocal rank fusion](https://opensearch.org/docs/latest/search-plugins/search-pipelines/score-ranker-processor/) (RRF), a new rank-based search processor that provides an alternative approach to result combination. The RRF processor focuses on document positions rather than scores to provide more robust and unbiased rankings. This functionality aims to mitigate biases that can occur when combining scaled scores from different subqueries. It achieves this by scoring each document based on the reciprocal of its rank for each query. These reciprocal ranks are then summed to create a final, unified ranking, ensuring a more balanced and effective result set.

### Improve hybrid search debugging and troubleshooting
With [hybrid search](https://opensearch.org/docs/latest/search-plugins/hybrid-search/), the process of score normalization and combination is decoupled from actual query execution and score collection and is performed in the search pipeline processor, making it complex to use debugging and troubleshooting tools like the `explain` parameter. OpenSearch 2.19 adds support for a `hybrid_score_explanation` response processor. This adds the normalization and combination results to the returned search response, giving you a debugging tool for understanding the score and rank normalization process.

***Search***

This release also delivers new functionality that enhances search operations.

### Improve search operations with a new `template` query type
OpenSearch 2.19 lets you use a [template query](https://opensearch.org/docs/latest/query-dsl/specialized/template/) to create search queries that contain placeholder variables. When you submit a search request, these placeholders remain unresolved until a search request processor assigns their value. This approach is particularly useful when your initial search request contains data that needs to be transformed or generated at runtime using search processors. By leveraging the capabilities of search processors, template queries enable more flexible, efficient, and secure search operations.

### Boost query performance and reduce cache utilization with experimental star-tree aggregations
[Star-tree aggregation](https://opensearch.org/docs/latest/search-plugins/star-tree-index/), an experimental functionality in this release, offers significant gains for search performance with support for metric aggregations and date histograms with metric aggregations. Users can apply search queries to filter aggregation results using `term`, `terms`, and `range` queries on keyword and numeric fields (excluding unsigned long and scaled float fields). The release also includes optimizations for binary search for multiple terms in a query to improve star-tree search performance. These updates deliver impressive performance improvements, demonstrating [up to 100x query reductions and 30x lower cache utilization](https://github.com/opensearch-project/OpenSearch/pull/16674#issuecomment-2643981712).

***Observability and log analytics***

This release expands OpenSearch's capabilities for observability and log analytics use cases.

### Fine-tune anomaly detection with new feature criteria
OpenSearch 2.19 gives you the option to add more criteria when defining what behaviors are considered to be [anomalies](https://opensearch.org/docs/latest/observing-your-data/ad/index/). Now each detector feature can be configured to identify either spikes or dips in data patterns for that feature. For example, if you were monitoring CPU data across your fleet, you can now configure your features to focus exclusively on detecting unusual spikes in CPU utilization, where the actual values are higher than the expected values, that might indicate potential problems while ignoring normal decreases in utilization.

### Transform anomaly detection values for richer dashboard visualizations
In [anomaly detection](https://opensearch.org/docs/latest/observing-your-data/ad/index/) in OpenSearch, many values are not flattened, making it difficult to view them on a dashboard. For instance, entity values are nested objects, and features are arrays. To enhance anomaly detection usability, a separate index has been introduced to store [flattened results](https://opensearch.org/docs/latest/observing-your-data/ad/result-mapping/). This index is populated using an ingest pipeline with a script processor to transform nested entity values and feature arrays into a structured format. This architectural enhancement helps ensure that features can be referenced by name and that categorical fields properly support `terms` aggregation, significantly enhancing query efficiency and improving dashboard visualizations.

***Ease of use***

This release also introduces new functionality designed to enhance the way you configure, manage, and discover insights using OpenSearch Dashboards. 

### Improve search performance monitoring with query insights dashboards
OpenSearch 2.19 introduces [query insights dashboards](https://opensearch.org/docs/latest/observing-your-data/query-insights/query-insights-dashboard/), a new visual interface that lets you monitor and analyze the [top N queries](https://opensearch.org/docs/latest/observing-your-data/query-insights/top-n-queries/) collected by the Query Insights plugin. It provides an overview page that lists the top queries and integrates historical data, along with a drill-down view for detailed analysis and a configuration view for streamlining configuration and management. Supporting the new visualization functionality are several new backend enhancements, including field type cache statistics in the Health API to monitor query insights cache performance, a new API for fetching top queries by ID to streamline UI query retrieval, and top N query retention management with configurable data expiration. Together, these features enhance OpenSearch's query observability, making search performance monitoring more scalable and efficient.

### Explore enhancements to an experimental view of Discover
[OpenSearch 2.18](https://opensearch.org/blog/get-started-with-opensearch-2-18/) introduced an experimental view of [Discover](https://opensearch.org/docs/latest/dashboards/discover/index-discover/), including a new look and feel designed to enhance the query experience and enhance customization. The interface allows analysts to collapse unused sections and streamline their workspace. Over the past year, we've gathered valuable feedback from users across OpenSearch's query interfaces, including Piped Processing Language (PPL) in Log Explorer (for observability applications) and SQL in Query Workbench. In response, we're adding PPL and SQL as query options in Discover alongside Dashboards Query Language (DQL) and Lucene, giving analysts the option to use their preferred query language. We've also improved the data selector and added autocomplete functionality—a highly requested feature. The new experience is available behind a feature flag, which you can enable by navigating to **Dashboards Management**, selecting **Advanced Settings**, and toggling **Enable query enhancements** to ON. We will continue to support the existing Discover experience until 2.21 as well as in 3.0 when the new Discover experience will become the default. We welcome your [feedback on this functionality](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/8813) as we continue to collect community input in advance of making this interface generally available.

***Security***

OpenSearch 2.19 includes updates that enhance security for your OpenSearch clusters.

### Strengthen system index protection with a new plugin security approach
This release introduces a new mechanism that allows plugins to access metadata stored in OpenSearch system indexes. OpenSearch offers a rich selection of plugins that extend its core functionality to support an array of use cases. Occasionally, those plugins need to perform privileged operations that are forbidden to regular users, like reading and writing to system indexes in order to persist data. The current mechanism involves calling low-level APIs, requiring plugin developers to have an understanding of how security information is transported during request handling. The new approach, as detailed [in this issue](https://github.com/opensearch-project/security/issues/4439), offers a more secure and intuitive method for providing plugins with the necessary information for their runtime. 

***Cost, performance, and scalability***

This release also introduces several new features designed to help you improve the cost, performance, and scalability of your OpenSearch deployments.

### Improve privilege evaluation performance
In this release, OpenSearch Security introduces new data structures that enable privilege evaluation to be performed in constant time, a process currently performed in linear time, therefore increasing the number of roles and indexes in a cluster. With this optimization, OpenSearch Security takes advantage of precomputed data structures that are optimized for lookup at privilege evaluation time. This release does not include improvements related to [field-level security](https://opensearch.org/docs/latest/security/access-control/field-level-security/), [document-level security](https://opensearch.org/docs/latest/security/access-control/document-level-security/), or [field masking](https://opensearch.org/docs/latest/security/access-control/field-masking/), which are planned for a future release. OpenSearch solution provider [Eliatra](https://opensearch.org/solutionsProviders/eliatra.html) has detailed these performance improvements in blog posts [here](https://eliatra.com/blog/performance-improvements-for-the-access-control-layer-of-opensearch/) and [here](https://eliatra.com/blog/performance-improvements-for-the-access-control-layer-of-opensearch-2/).

### Optimize query efficiency and reduce costs with bitmap filtering
[Bitmap filtering](https://opensearch.org/docs/latest/query-dsl/term/terms/#bitmap-filtering), introduced in version 2.17, enables efficient filtering of numeric fields by using bitmaps to represent terms to be queried. This release improves this functionality through a new bitmap query that uses the index structure of the numeric field for better performance. In addition, this release also introduces cost-based query optimization. When bitmap filtering is used within Boolean queries, OpenSearch automatically selects between the new index-based query or the existing document-value-based query based on real-time estimates of the cost of each approach.

### Increase experimental disk-tiered request cache performance
OpenSearch 2.19 also brings performance improvements to the experimental [disk-tiered request cache](https://opensearch.org/docs/latest/search-plugins/caching/tiered-cache/) by dividing it into multiple partitions, each protected by its own read/write lock. This enables multiple concurrent readers to access data without contention and allows multiple writers to operate simultaneously, resulting in higher write throughput. By default, the number of partitions is determined based on available CPU cores, but this number can also be customized by the user.

***Deprecation notices***

### Deprecating support for Ubuntu Linux 20.04
Please note that OpenSearch will deprecate support for Ubuntu Linux 20.04 as a continuous integration build image and supported operating system in an upcoming version, as Ubuntu Linux 20.04 will reach end-of-life with standard support as of April 2025 (refer to [this notice](https://ubuntu.com/blog/ubuntu-20-04-lts-end-of-life-standard-support-is-coming-to-an-end-heres-how-to-prepare) from Canonical Ubuntu). For a list of OpenSearch's compatible operating systems, [visit here](https://opensearch.org/docs/latest/install-and-configure/os-comp/).

### Deprecating support for features and plugins in OpenSearch 3.0.0
Please note that OpenSearch and OpenSearch Dashboards will deprecate support for the following features and plugins in [OpenSearch 3.0.0](https://github.com/opensearch-project/opensearch-build/issues/3747):

* [Performance-Analyzer-Rca](https://github.com/opensearch-project/performance-analyzer-rca/issues/591): Will be replaced with the [Telemetry plugin](https://github.com/opensearch-project/performance-analyzer/issues/585).
* [Dashboards-Visualizations](https://github.com/opensearch-project/dashboards-visualizations/issues/430) (ganttCharts): Plugin will be removed as part of the OpenSearch Dashboards bundle artifact.
* [Dashboards-Observability](https://github.com/opensearch-project/dashboards-observability/issues/2311): Support will be removed for legacy notebooks from observability indexes.
* [SQL](https://github.com/opensearch-project/sql/issues/3248): OpenSearch 3.0.0 will deprecate the OpenSearch DSL format as well as several settings, remove the SparkSQL connector, and remove DELETE statement support in SQL.
* [k-NN](https://github.com/opensearch-project/k-NN/issues/2396): OpenSearch 3.0.0 will deprecate the NMSLIB engine. Users will be advised to use the Faiss or Lucene engines instead.

### Getting started with OpenSearch 2.19
You can download the latest version of OpenSearch [here](https://www.opensearch.org/downloads.html) and explore OpenSearch Dashboards live on [OpenSearch Playground](https://playground.opensearch.org/app/home#/). For more information about this release, review the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.19.0.md) and the [documentation release notes](https://github.com/opensearch-project/documentation-website/blob/main/release-notes/opensearch-documentation-release-notes-2.19.0.md). Your feedback on this release is appreciated—please visit our [community forum](https://forum.opensearch.org/) to share your thoughts.
