---
layout: post
title:  "Introducing OpenSearch 2.9.0"
authors:
  - jamesmcintyre
date: 2023-07-24 11:30:00 -0700
categories:
  - releases
meta_keywords: opensearch search, search pipelines, opensearch vector database, opensearch machine learning, opensearch analytics, anomaly detection, opensearch 2.9
meta_description: Learn how OpenSearch 2.9.0 enhances search and analytics applications, adds machine learning and AI functionality, and enables improvements for observability workloads.
---

OpenSearch 2.9.0 is [ready to download](https://opensearch.org/downloads.html), with new features designed to help you build better search solutions and integrate more machine learning (ML) into your applications, along with updates for security analytics workloads, geospatial visualizations, and more. This release also provides new compression codecs that offer significant performance improvements and reduced index sizes. For developers, an experimental extensions software development kit (SDK) simplifies the work of building features and functionality on top of OpenSearch. Following are some highlights from the latest version of OpenSearch and OpenSearch Dashboards; for a comprehensive view, please see the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.9.0.md).

### Power up your search with search pipelines
Search practitioners are looking to introduce new ways to enhance search queries as well as results. With the general availability of [search pipelines](https://opensearch.org/docs/latest/search-plugins/search-pipelines/index/), you can configure a list of one or more processors to transform search requests and responses inside of OpenSearch. By integrating processors for functions like query rewriters or results rerankers directly in OpenSearch, you can make your search applications more accurate and efficient and reduce the need for custom development.
 
Search pipelines incorporate three built-in processors, filter_query, rename_field, and script request, as well as new developer-focused APIs [link to docs section on SearchRequestProcessor and SearchResponseProcessor] to enable developers who want to build their own processors to do so. You can explore search pipelines for yourself in the [OpenSearch Playground](https://searchapps.playground.opensearch.org/app/home). These capabilities are an ongoing priority for learning and development for the project; if you’d like to share input on new processors or other ideas, please see the [request for comments](https://forum.opensearch.org/t/rfc-search-pipelines/12099).

### Build semantic search applications more easily
The OpenSearch Project released experimental [neural search](https://opensearch.org/docs/latest/search-plugins/neural-search/) functionality in OpenSearch 2.4.0. With the 2.9.0 release, neural search is production-ready for your search workloads. These tools allow you to vectorize documents and queries and search those transformed vectors using k-nearest neighbors (k-NN), so you can take advantage of OpenSearch’s [vector database](https://opensearch.org/platform/search/vector-database.html) capabilities to power applications like [semantic search](https://opensearch.org/blog/semantic-search-solutions/). Now you can combine traditional BM25 lexical search with deep-learning-powered semantic search and unlock new ways to tune your queries for improved search relevancy.
 
### Integrate and manage your ML models in your OpenSearch cluster
Applications like semantic search call for integrated ML models. This release makes it easier to operationalize and integrate ML models with the general availability of the [ML framework](https://opensearch.org/docs/latest/ml-commons-plugin/model-serving-framework/). Released as the model-serving framework in 2.4.0 as an experimental feature, this framework lets you upload your own ML models to OpenSearch, with support for text-embedding models from a number of tools, such as [PyTorch](https://pytorch.org/) and [ONNX](https://onnx.ai/), and it does the heavy lifting of preparing models for deployment for neural search and other applications. As part of readying the framework for general availability, OpenSearch 2.9.0 also introduces [ML model access control](https://opensearch.org/latest/ml-commons-plugin/model-access-control/). This feature allows administrators to govern access to individual models that are integrated through the framework.
 
### Integrate externally managed ML models
OpenSearch 2.9.0 expands the functionality of the ML framework by enabling integrators to create [connectors](https://opensearch.org/docs/latest/ml-commons-plugin/connectors/) to artificial intelligence (AI) services and ML platforms with low effort—requiring them only to define a blueprint in JSON. These AI connectors enable users to use models hosted on the connected services and platforms to power ML workloads like the ones required by [semantic search](https://opensearch.org/docs/latest/search-plugins/neural-search/). Instructions for building connectors are included in the documentation. As an example of this capability, this release includes a connector for Amazon SageMaker–hosted models. The project will publish connectors for Cohere Rerank and OpenAI ChatGPT in the near future, with additional integrations to follow.

### Augment search with vector database enhancements
With this release, OpenSearch’s [approximate k-NN implementation](https://opensearch.org/docs/latest/search-plugins/knn/approximate-knn/) supports [pre-filtering for queries](http://https://opensearch.org/docs/latest/search-plugins/knn/filter-search-knn/) using the Facebook AI Similarity Search (FAISS) engine. Now you can filter queries using metadata prior to performing nearest neighbors searches on k-NN indexes built with FAISS, offering more efficient k-NN search and better performance. Previously, OpenSearch only supported pre-filtering for Lucene indexes.

Another update to OpenSearch k-NN comes with support for Lucene’s [byte-sized vectors](https://opensearch.org/latest/search-plugins/knn/knn-index.md#lucene-byte-vector). Users now have the option to ingest and use vectors that have been quantized to the size of one byte per dimension instead of four. This reduces storage and memory requirements for loading, saving, and performing vector search, at the cost of a potential decrease in accuracy.

### Build monitors and detectors in OpenSearch Dashboards
Now you can see your alerts and anomalies directly overlaid with the primary dashboards you use to monitor your environments. By integrating OpenSearch’s [alerting](https://opensearch.org/docs/latest/observing-your-data/alerting/index/) and [anomaly detection](https://opensearch.org/docs/latest/observing-your-data/ad/index/) tools with OpenSearch visualization tools, this release helps streamline the work of users who monitor systems and infrastructure. Users can also create alerting monitors or anomaly detectors directly from their OpenSearch Dashboards VISLIB chart or line visualizations, then view alerts or anomalies overlaid on the configured visualizations. Users with monitors or detectors already defined can now associate them with a visualization. This eliminates the need for users to shift between visualization tools and the information needed to create alerts or anomaly detectors, making it easier to explore data and identify discoveries.

<img src="/assets/media/blog-images/2023-07-24-introducing-opensearch-2.9.0/associate-existing.gif" alt="animated demostration shows the task of associating an existing monitor"/>{: .img-fluid}

### Use composite monitors for more meaningful alerting notifications
New in 2.9.0, [composite monitors](https://opensearch.org/docs/latest/observing-your-data/alerting/comp-monitors/) mark another addition to OpenSearch’s [alerting](https://opensearch.org/docs/latest/observing-your-data/alerting/index/) toolkit. Composite monitors allow users to chain alerts generated by multiple individual monitors into a single workflow. Users are notified when the combined trigger conditions across the monitors are met. This enables users to analyze data sources based on multiple criteria and gain more granular insights into their data. Now users have the opportunity to create targeted notifications while reducing the overall volume of alerts.

### Improve performance with new index compression options
OpenSearch provides built-in codecs that perform compression on indexes, impacting the size of index files and the performance of indexing operations. Previous versions included two codec types: a default index codec, which prioritizes performance over compression, and a best_compression codec, which achieves high compression and smaller index sizes with potential increases in CPU usage during indexing, and can result in higher latencies. With the 2.9.0 release, OpenSearch adds two new codecs, [zstd](https://opensearch.org/docs/latest/api-reference/index-apis/create-index/) and [zstd_no_dict](https://opensearch.org/docs/latest/api-reference/index-apis/create-index/), which use Facebook’s [Zstandard compression algorithm](https://github.com/facebook/zstd). Both codecs aim to balance compression and performance, with zstd_no_dict excluding the dictionary compression feature for potential gains in indexing and search performance at the expense of slightly larger index sizes.

These new zstd and zstd_no_dict codecs provide an option to configure the compression level as an index setting  (`index.codec.compression_level)`. This is not available for other codecs. Compression level offers a trade-off between compression ratio and speed; a higher compression level results in a lower storage size but more CPU resources spent on compression. Optimizing these trade-offs depends on several aspects of the workload, and the best way to optimize for overall performance is to try multiple levels.

<img src="/assets/media/blog-images/2023-07-24-introducing-opensearch-2.9.0/zstd-comparison-chart.png" alt="Table showing comparison between different compression types"/>{: .img-fluid}

As seen above, tests conducted using the [NYC Taxis dataset](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/nyc_taxis) show the potential for significant improvements in compression of up to 35% with zstd compared to the default codec, with throughput increases of up to 7% for zstd and 14% for zstd_no_dict. After upgrading to 2.9.0, users can realize performance improvements by modifying the settings of a new or existing index.

### Simplify threat detection with Security Analytics
Security Analytics now supports a new ingestion schema for log data that follows the [Open Cybersecurity Schema Framework](https://opensearch.org/docs/latest/security-analytics/sec-analytics-config/detectors-config/#amazon-security-lake-logs) (OCSF), enabling OCSF logs from Amazon Route 53, AWS CloudTrail, and Amazon Virtual Private Cloud (Amazon VPC). Also now generally available is the [correlation engine](https://opensearch.org/docs/latest/security-analytics/sec-analytics-config/correlation-config/) for OpenSearch Security Analytics. You can create custom correlation rules that display a visual knowledge graph and a list of findings across different log sources like DNS, Netflow, and Active Directory. The knowledge graph can be used in your security investigations to analyze associated findings, helping you to identify threat patterns and relationships across different systems. Using this knowledge graph can help you respond faster to potential security threats in your organization. 

### Aggregate metrics for geospatial shape data
OpenSearch stores geospatial data using [geoshape](https://opensearch.org/docs/latest/field-types/supported-field-types/geo-shape/) and [geopoint](https://opensearch.org/docs/2.3/opensearch/supported-field-types/geo-point/) field types. Users were able to perform aggregations on geopoint data types in previous versions; with the release of 2.9.0, OpenSearch also supports aggregations for geoshape data types as a backend functionality accessible through the API. This release adds support for geoshapes to three types of aggregations: [geo_bounds](https://opensearch.org/docs/latest/query-dsl/aggregations/metric/geobounds/#aggregating-geoshapes), a metric aggregation that computes the bounding box containing all geo values in a field; [geo_hash](https://opensearch.org/docs/latest/query-dsl/aggregations/bucket/geohash-grid/#aggregating-geoshapes), a multi-bucket aggregation that groups geoshapes into buckets representing cells in a grid; and [geo_tile](https://opensearch.org/docs/latest/query-dsl/aggregations/bucket/geotile-grid/#aggregating-geoshapes), a multi-bucket aggregation that groups geoshapes into buckets representing map tiles.

### Monitor the health of your shards and indexes
OpenSearch provides a [range of metrics](https://opensearch.org/docs/latest/observing-your-data/alerting/monitors/#create-cluster-metrics-monitor) to help you monitor the health of your OpenSearch cluster. This release adds CAT shards and CAT indices monitors. These updates allow you to monitor the state of all primary and replica shards along with information related to index health and resource usage to support operational uptime.
 
### Extend OpenSearch’s functionality with a new SDK
 
The OpenSearch Project maintains a library of [plugins](https://github.com/opensearch-project/opensearch-plugins#opensearch-plugins) that extend the functionality of OpenSearch across different workloads and use cases. For a number of reasons, plugins run within the OpenSearch process, meaning that they must maintain version compatibility and that their resources scale with the OpenSearch cluster. For developers, building new plugins requires considerable familiarity with OpenSearch’s architecture and code base.
 
Some developers have asked for an approach to building OpenSearch-compatible tools that mitigates these limitations. To start to address this, this release introduces an experimental [SDK](https://opensearch.org/docs/latest/developer-documentation/extensions) that gives developers the tools to build extensions for OpenSearch. The OpenSearch Extensions SDK provides codified interfaces for communicating with OpenSearch and other installed plugins and extensions, allows extensions to be decoupled from OpenSearch versions, decouples resources, and introduces many other changes designed to make it easier for developers to build, and users to deploy, new innovations on OpenSearch. To access the SDK, check out the [opensearch-sdk-java repo](https://github.com/opensearch-project/opensearch-sdk-java/].).
 
### Getting started
You can download the latest version of OpenSearch [here](https://www.opensearch.org/downloads.html) and explore OpenSearch Dashboards live on [the Playground](https://playground.opensearch.org/app/home#/). For more information about this release, see the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.9.0.md) and the [documentation release notes](https://github.com/opensearch-project/documentation-website/blob/main/release-notes/opensearch-documentation-release-notes-2.9.0.md). We would appreciate your feedback on this release on the [community forum](https://forum.opensearch.org/)!

*Got plans for September 27–29? We hope you’ll consider joining us for* [*OpenSearchCon 2023*](https://opensearch.org/OpenSearchCon2023.html)*. This annual gathering for the OpenSearch community brings users and developers from across the OpenSearch ecosystem together in Seattle, and you’re invited!*





[Data Prepper](https://opensearch.org/docs/latest/data-prepper/index/) is an open-source data collector used to ingest data into OpenSearch clusters. In addition to Data Prepper's in-memory buffer, which allows for fast throughput, users also want improved data durability, particularly, confirmation that the data received by Data Prepper reaches the desired [sink](https://opensearch.org/docs/latest/data-prepper/index/#sink). End-to-end acknowledgments give Data Prepper this capability.

## The need: Improving data durability 

The Data Prepper maintainers and their teams have observed that a common challenge to data durability is ingestion pipeline reliability. For example, if the OpenSearch cluster cannot receive data because of temporary stress on the cluster or underscaling, then Data Prepper cannot send data to the destination sink. Further, Data Prepper may exhaust memory or other system resources or the hardware running Data Prepper may fail resulting the data loss during the ingestion.

To solve these challenges, the maintainers and their teams must consider the data sources themselves. For example, the Amazon S3 source can read data from a highly durable store. When observing this, capability, it was realized that if Data Prepper fails to deliver data to OpenSearch, Data Prepper can retry reading data from Amazon S3. This, however, requires knowing when the data is written before deleting the SQS message that notifies Data Prepper of an available S3 object to consume.


## Our solution: End-to-end acknowledgments

Data Prepper provides data durability through the use of end-to-end acknowledgments. When a Data Prepper source is configured to use end-to-end acknowledgments, the source is notified only when the data is successfully delivered to the sink. If the source receives end-to-end acknowledgments, it can take appropriate actions such as removing SQS messages that have been successfully delivered to the sink or incrementing the commit offset, such as in the case of a Kafka source. If end-to-end acknowledgments are not received, the source may retry the operation or notify the external source of the failure. The following image shows the control flow when a Data Prepper source is configured to use end-to-end acknowledgments.



1. The Data Prepper source receives a batch of records from an external source (such as Amazon S3).
2. When a Data Prepper source is configured with end-to-end acknowledgments, the source creates an AcknowledgmentSet along with a callback function for each batch of records received from the external source. The source then converts the records to Data Prepper events.
3. Each event in the batch is added to the AcknowledgmentSet, and a reference to the AcknowledgmentSet is kept in the event as a handle.
4. Events are then passed to the ingestion pipeline, which consists of multiple processors that transform, filter, and enrich the data in the event.
5. If an event is dropped in the processors, the AcknowledgmentSet is notified of the event's completion when the event handle is released.
6. All events that are not dropped are sent to the Data Prepper sink.
7. The Data Prepper sink sends the events to the external sink (such as the OpenSearch cluster).
8. When events are successfully sent to the external sink, the AcknowledgmentSet is notified of the event's completion when the event handles are released.
9. When the AcknowledgmentSet has no pending events, it invokes the callback function.
10. The callback function notifies the external source about the successful delivery of the batch of records.

If all events are not successfully delivered to the external sinks, AcknowledgmentSet will retain some events that have not been released. Each AcknowledgmentSet has an expiry time. If all events are not released before the expiry time, the AcknowledgmentSet is freed, and the external source is not notified of the delivery of the records. This situation may trigger the Data Prepper source or the external source to take corrective action, such as retrying the ingestion of the records.

Data Prepper supports multiple pipelines and events can be routed to different pipelines based on the configuration and the data within the events. Additionally, each event may be routed to multiple pipelines that eventually send data to different sinks. In some cases, multiple copies of the same event are not created when the event is routed to multiple pipelines or sinks. This poses a challenge when tracking acknowledgments because multiple acknowledgments are required for the same event. To address this issue, reference counts are maintained for events that are routed to multiple pipelines. When an event handle is released (either in step 5 or step 8), the reference count is decremented. The event is considered completed, and the handle is removed from the AcknowledgmentSet only when the reference count reaches zero, indicating the successful delivery of the event to all sinks. This approach ensures accurate tracking of acknowledgments for events routed to multiple pipelines.

Data Prepper also provides support for sending negative acknowledgments to indicate explicit failure. The callback function can examine the acknowledgment status, whether it is positive or negative, and take appropriate action based on that information.

In certain scenarios, when Data Prepper sinks are configured with a Dead Letter Queue (DLQ), events that cannot be delivered to the external sink (for example OpenSearch) are written to the DLQ. When end-to-end acknowledgments are enabled, successfully writing the events to the DLQ (after failing to deliver them to the external sink) is considered a successful completion of event delivery. In this case, a positive acknowledgment is delivered to the AcknowledgmentSet, indicating successful event processing and handling.


## Moving forward: Conclusion and next steps

End-to-end acknowledgments offer robust data durability when using Data Prepper for data processing and ingestion. Some considerations, however, are necessary:

1. End-to-end acknowledgments currently are not compatible with stateful aggregations. The Data Prepper maintainers are considering this issue and exploring solutions for release in future iterations.

2. To leverage end-to-end acknowledgments, source plugins must integrate with the acknowledgment system. Currently, the Amazon S3 source is the only source plugin with this functionality. However, the capability is designed to expand to include additional sources and is well-suited for pull-based sources. Ongoing development of a new Kafka source is showing to be a promising candidate for using these acknowledgments. Users also have expressed interest in applying these acknowledgments to push-based sources like HTTP, which is an area maintainers are exploring.

If you have data stored in Amazon S3 and would like to ingest it into OpenSearch, try out the Data Prepper end-to-end acknowledgments feature. As always, the Data Prepper community appreciates your feedback and contributions.

See [End-to-end Acknowledgments](https://github.com/opensearch-project/data-prepper/blob/main/docs/end_to_end_acknowledgements.md) for more details about the feature, how to enable it for a source, and what changes needed in a sink to send acknowledgments.

Share your [feedback and comments](https://github.com/opensearch-project/data-prepper/issues) on the feature's overall goals, user experience, and architecture.

