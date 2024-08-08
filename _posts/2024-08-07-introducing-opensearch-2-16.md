---
layout: post
title:  "Introducing OpenSearch 2.16"
authors:
  - jamesmcintyre
date:   2024-08-07 14:20 -0700
categories:
  - releases
meta_keywords: opensearch machine learning, opensearch vector compression, opensearch binary vector, opensearch generative AI, opensearch data sources, opensearch 2.16, opensearch batch inference, opensearch range aggregation, opensearch fast filter
meta_description: OpenSearch 2.16 arrives with an expanded toolkit to make it easier to build search and generative AI applications, along with more advancements in performance and efficiency and upgrades that improve ease of use.
---
OpenSearch 2.16 is [here](https://opensearch.org/downloads.html) with an expanded toolkit to make it easier to build search and generative AI applications, along with more advancements in performance and efficiency and upgrades that improve ease of use. You can try the latest version using OpenSearch Dashboards on [OpenSearch Playground](https://playground.opensearch.org/app/home) and read the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.16.0.md) for a complete rundown of what's new in this release. Here are some of the new and updated features you can put to work in OpenSearch 2.16.

## _Search and machine learning_ 

OpenSearch 2.16 adds a number of features to OpenSearch's **search** **and machine learning** (ML) toolkit to help accelerate application development and enable generative AI workloads.

**Boost efficiency with vector compression automation for byte-precision vector quantization**

OpenSearch 2.9 added support for [byte-quantized vectors](https://opensearch.org/docs/latest/search-plugins/knn/knn-vector-quantization/) on indexes built using the [Lucene](https://lucene.apache.org/) k-NN engine. This feature can reduce costs and lower query latency through typically favorable search accuracy trade-offs. Byte vector quantization works by compressing your vectors from 4 bytes of data per dimension to 1 byte. This effectively quarters your memory requirements and, in turn, the cost of running your cluster. It adds the benefit of lower query latency, as fewer computations are required to execute a query. Previously, users had to preprocess their vectors off-cluster; in this release, you can configure OpenSearch to byte quantize your full-precision vectors on-cluster as part of your indexing tasks. Support for this capability on the FAISS k-NN engine is targeted for the next release.

**Build more flexible search pipelines with sort search and split search processors**

In OpenSearch 2.16, we've added [sort search and split search processors](https://opensearch.org/docs/latest/search-plugins/search-pipelines/search-processors/) to our search pipeline toolset. The sort processor can be configured within a search pipeline to sort search responses, and the split processor is used to split strings into arrays of substrings. These processors were added to provide more flexibility and support for more use cases. For instance, along with the ML inference search processor, you can now create a reranking search pipeline that uses a custom ranking model to rescore results and then use the sort processor to re-sort them.

**Lower the cost of vector search workloads with binary vector support**

This release delivers support for [binary vectors](https://opensearch.org/docs/latest/field-types/supported-field-types/knn-vector/#binary-k-nn-vectors), enabling 32x compression on full-precision 32-bit vectors. With the ability to index and retrieve binary vectors at 1 bit per dimension, you can now leverage the latest ML models that emit binary vectors and harness the full potential of OpenSearch's vector search capabilities. This feature affords high recall performance, especially for large dimensional vectors (>=768 dimensions), making large-scale deployments more economical and efficient. OpenSearch 2.16 also introduces Hamming distance support, enabling bitwise distance measurements for scoring binary vectors. Binary vectors can be used with both the approximate and exact k-NN variants of vector search. Approximate k-NN search is initially available on the FAISS engine.

**Enrich search flows by integrating any ML model into OpenSearch AI-native APIs**

OpenSearch 2.14 brought enhancements to the AI connector framework that made it possible for users to natively integrate any AI/ML provider with OpenSearch. These connectors enable users to create AI enrichments within ingestion tasks through the Ingest API by configuring ML inference ingest processors that connect to these AI providers. In OpenSearch 2.16, you can also enable AI enrichments within search flows through the Search API by configuring [ML inference search processors](https://opensearch.org/docs/latest/search-plugins/search-pipelines/ml-inference-search-request/) through the same AI connectors.

**Expand ML capabilities with batch inference support for AI connectors**

This release includes enhancements to the AI connector framework that make it possible for integrators to add [batch inference support](https://opensearch.org/docs/latest/ml-commons-plugin/api/model-apis/batch-predict/) to their connectors. Previously, the AI connectors were limited to real-time, synchronous ML inference workloads. With this enhancement, connectors can run asynchronous batch inference jobs for better efficiency with large datasets. Users will be able to run batch API calls to run a batch job through a connector to a provider like Amazon SageMaker. In future releases, OpenSearch will provide functionality that will enable you to run these batch inference jobs through OpenSearch ingestion tasks.

## _Ease of use_

This release also includes tools designed to enhance OpenSearch's **ease of use**

**Easily optimize performance for your use case with application-based configuration templates**

OpenSearch provides a versatile set of tools for a wide range of use cases, such as text and image search, observability, log analytics, security, and much more. This versatility means that setting up OpenSearch for a new use case can entail time-consuming effort spent fine-tuning your indexes to your application requirements. With the 2.16 release, we've made the process of optimizing new applications faster with the introduction of application-based configuration templates. These templates work with the [index template](https://opensearch.org/docs/latest/im-plugin/index-templates/) functionality to provide default settings that can simplify tuning your indexes for compute and storage resource performance as well as for usability through Index State Management (ISM).

**Access multiple data sources for more OpenSearch Dashboards plugins**

As part of the ongoing effort to support [multiple data sources](https://opensearch.org/docs/latest/dashboards/management/multi-data-sources/) across OpenSearch Dashboards, OpenSearch 2.14 added support for nine external Dashboards plugins. This release adds support for more plugins to help you manage data across OpenSearch clusters and combine visualizations into a single dashboard. Two more external Dashboards plugins are now supported: Notebooks and Snapshot. All plugins now support version decoupling in place to filter out incompatible data sources from the selection. 

## _Cost, performance, scale_

This release also delivers new functionality focused on helping you improve the **cost, performance, and scale** of your OpenSearch deployments, including the addition of fast-filter optimization for range aggregations.

**Improve range aggregation performance by as much as 100x**

Recent releases introduced fast-filter optimizations to improve performance for the special case of date histogram aggregations, and with OpenSearch 2.16, you can now apply these optimizations to general [range aggregations](https://opensearch.org/docs/latest/aggregations/bucket/range/). These updates have been shown to deliver a [performance improvement of more than 100x](https://github.com/opensearch-project/OpenSearch/pull/13865#:~:text=0%20%7C%20%20%20%20%20%20%20%20%20%20%200%20%7C%20%20%20%20%20%20%20%20%20%20%20%200%20%7C%20%20%20%20%20%20%25%20%7C-,noaa,-%7C%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2050th%20percentile%20latency) in simple range aggregation for the NOAA workload.

## _Stability, availability, resiliency_

This release introduces updates to help you improve the **stability, availability, and resiliency** of your OpenSearch clusters, including several updates to cluster management.

**Scale large workloads with cluster manager optimizations**

OpenSearch users can encounter challenges when scaling their domains across large workloads. Often, the cluster manager is the cause of the bottleneck. This release brings several updates to the cluster manager, including network optimization of cluster manager APIs, compute optimization of pending task processing, and incremental read/writes for routing tables. The result is a reduced load on the cluster manager, which paves the way for the cluster manager to support a greater number of nodes and shards. Additionally, further optimizations to OpenSearch's shard allocation have reduced the overhead of scaling and operating large domains. Together, these updates will help users scale up to more nodes and larger volumes of data.

## _Security Analytics_
This release also includes a major expansion of OpenSearch's Security Analytics capabilities.

**Expand visibility into potential security threats**

OpenSearch [Security Analytics](https://opensearch.org/platform/security-analytics/index.html) provides a comprehensive toolkit with more than 3,300 prepackaged, open-source Sigma rules for detecting, investigating, and analyzing potential security threats across your monitored infrastructure. With new security threats continuously emerging, users tell us they want to use external sources of threat intelligence to find malicious activity.

With this release, OpenSearch adds [threat intelligence](https://opensearch.org/docs/latest/security-analytics/threat-intelligence/getting-started/) capabilities as part of its out-of-the-box Security Analytics solution. This functionality enables you to use customized Structured Threat Information Expression (STIX)-compliant threat intelligence feeds by uploading a file locally or referencing an Amazon S3 bucket. Supported malicious indicator of compromise (IOC) types include IPv4-Address, IPv6-Address, domains, and file hashes. Users can apply this information to their data to help find potential threats before they escalate. Combined with the threat detection provided by Sigma rules, this functionality offers a more comprehensive view into security threats, affording greater insights to support decision-making and remediation.

## _Deprecating CentOS7_

We previously issued a [deprecation notice in 2.12](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.12.0.md#deprecation-notice) regarding CentOS Linux 7, which reached end-of-life on June 30, 2024. Following the official [notice](https://blog.centos.org/2023/04/end-dates-are-coming-for-centos-stream-8-and-centos-linux-7/) issued by the CentOS Project, the OpenSearch Project is also [deprecating CentOS Linux 7](https://github.com/opensearch-project/opensearch-build/issues/4379) as a continuous integration build image and supported operating system in the 2.16 release. To view OpenSearch's compatible operating systems, visit the [Operating system compatibility](https://opensearch.org/docs/latest/install-and-configure/install-opensearch/index/#operating-system-compatibility) page. 
 
**Getting started with OpenSearch 2.16**

Today's release is [available for download](https://www.opensearch.org/downloads.html) and ready to explore on [OpenSearch Playground](https://playground.opensearch.org/app/home#/). For more information about this release, check out the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.16.0.md) as well as the [documentation release notes](https://github.com/opensearch-project/documentation-website/blob/main/release-notes/opensearch-documentation-release-notes-2.16.0.md). Feel free to share your feedback on this release on our [community forum](https://forum.opensearch.org/)!


*Connect with the OpenSearch community in person!* *Our third annual* [*OpenSearchCon North America*](https://opensearch.org/events/opensearchcon/2024/north-america/index.html) *is coming to San Francisco September 24–26. Join us and meet your fellow community members while learning about new and upcoming OpenSearch developments!*

