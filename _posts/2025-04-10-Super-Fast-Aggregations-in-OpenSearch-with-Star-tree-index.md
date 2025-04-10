---
layout: post
title:  "Super Fast Aggregations in OpenSearch with Star tree index" 
authors:
  - bharath-techie
  - sandeshkr419
  - backslasht
date: 2025-04-10
has_science_table: true
categories:
  - technical-posts
meta_keywords: star tree,indexing,aggregations,materialized views,startree
meta_description: Learn how star-tree index improves the performance of aggregations in OpenSearch.
permalink: TODO
---
### Background
Aggregations in OpenSearch can help summarize and analyse the data in real time and are also used widely in OpenSearch Dashboards to create charts and visualization dashboards.

There are different types of aggregations such as :

* Metric aggregations - Calculate metrics such as sum, min, max, avg etc on numeric fields.
* Bucket aggregations - Sort query results into groups based on some criteria. Eg: Date histograms

Aggregations present following performance challenges compared to standard queries:

* Scalability: Query latency directly depends on the number of matching documents
* Resource consumption: Consume more CPU cycles, memory and disk utilization

For example, in application logs:

* Aggregations on success status codes (high document count) have significantly higher latency
* Aggregations on failure status codes (low document count) gets processed much faster

| Query | No. of documents | Latency |
|-------|------------------|----------|
| Metric aggregations for status = 200 | 200 Mil documents | 4.2 seconds |
| Metric aggregations for status = 400 | 3000 documents | 5 milliseconds |

The latency can be reduced to constant time milliseconds with star-tree index, an experimental feature introduced in OpenSearch 2.18

### Star-tree index
Star-tree index (STIX) inspired from Apache Pinot’s star-tree index is the first multi-field index that improves the performance of aggregations in OpenSearch. STIX pre-computes the aggregations for the configured metrics for all combinations of the configured dimensions during indexing time.
![High Level Architecture](/assets/media/blog-images/2025-04-10-Super-Fast-Aggregations-in-OpenSearch-with-Star-tree-index/star-tree-structure.png)
STIX consists of star-tree which stores the unique values of the dimensions in the nodes and columnar doc_values data which stores the aggregations of configured metrics for the configured dimensions. The star-tree structure helps faster traversal for the aggregated values across different dimensions.
Refer to star-tree index [structure](https://opensearch.org/docs/latest/search-plugins/star-tree-index/#star-tree-index-structure) to know more about the internals of STIX. 

### Why to use star-tree index
#### Predictable latency
Currently in OpenSearch, aggregation query latency scales linearly with the number of documents. STIX provides faster and more predictable query latency since it pre-computes the resultant aggregations.

| Query | No. of documents | Plain query latency | Star tree query latency |
|-------|------------------|---------------------|------------------------|
| Avg(duration) for status = 200 | 200 Mil documents | 4.2 seconds | 6.3 milliseconds |
| Avg(duration) for status = 400 | 3000 documents | 5 milliseconds | 6.5 milliseconds |

#### Multi-aggregations
If there are multiple aggregations on different fields, each field for each aggregation is processed separately and it leads to higher query latencies. STIX whereas with native multi-field support can especially be more performant in such scenarios since it does pre-processes the queries across different aggregations to avoid multiple star-tree traversals. 

#### Faster Throughput
For slow complex operations like date-histograms with sub-aggregations on large datasets, the throughput and latency improvement is also quite significant as seen below.

| Query | No. of documents | Default query latency | Star tree query latency [N = 10000] | Default Query Throughput | Star Tree Query Throughput |
|-------|------------------|----------------------|-------------------------------------|------------------------|--------------------------|
| Yearly Date histogram on sum of tip amount for passenger count 1 | 120 Mil documents | 13 seconds | 94 miliseconds | 0.08 | 2.01 |
| Yearly Date histogram on sum of tip amount for passenger count 1 to 2 | 140 Mil documents | 15 seconds | 114 miloseconds | 0.07 | 2.01 |
| Yearly Date histogram on sum of tip amount for passenger count 1 to 5 | 160 Mil documents | 17 seconds | 160 miliseconds | 0.06 | 2.01 |

#### Flexibility
STIX can be configured with various [parameters](https://opensearch.org/docs/latest/field-types/supported-field-types/star-tree/#star-tree-index-configuration-options) to tune for storage overhead or performance.
For example, `max_leaf_docs` parameter can help in tuning the storage/performance of STIX. Higher number leads to better storage efficiency but lower query performance and vice versa. 

| Query | No. of documents | Default query latency | Star tree query latency [N = 100] | Star tree query latency [N = 10000] |
|-------|------------------|----------------------|-----------------------------------|-----------------------------------|
| Metric aggregation for status = 200 | 200 Mil documents | 4.2 seconds | 2.5 milliseconds                  | 6.3 milliseconds |
| Metric aggregation for status = 400 | 3000 documents | 5 milliseconds | 2.7 milliseconds                  | 8.5 milliseconds |

#### Real time data
Features such as Index roll-up and transform lets users create a summarized view of users' data centered around certain fields but these solutions are not real time and affects live indexing performance.

STIX is completely real time, has low indexing overhead and queries work seamlessly without any user intervention to modify their queries. OpenSearch internally identifies which queries can be resolved faster using star-tree and 

### Limitations
Even though STIX provides multiple benefits, it has it's limitations, they are:

* A star-tree index should only be enabled on indexes whose data is not updated or deleted because updates and deletions are not accounted presently in a star-tree index.
* Since STIX is created in real time as part of regular refresh/flush/merge flows of indexing, there is a cost attached to the write throughput of indexing. [ Benchmark numbers coming soon ]
* After a star-tree index is enabled, it cannot be disabled. In order to disable a star-tree index, the data in the index must be re-indexed without the star-tree mapping. Furthermore, changing a star-tree configuration will also require a re-index operation. However, search using star-tree can be disabled by setting `indices.composite_index.star_tree.enabled`  to `false`.

Refer to [limitations](https://opensearch.org/docs/latest/search-plugins/star-tree-index/#limitations) to know more.

### How to use star-tree index
* You have to specify the STIX [mapping](https://opensearch.org/docs/latest/field-types/supported-field-types/star-tree/#star-tree-index-mappings) during index creation based on the queries and aggregations they’d like to optimize. Refer to [documentation](https://opensearch.org/docs/latest/field-types/supported-field-types/star-tree/) for detailed information.
* No changes are required in the search query syntax or the request parameters. Currently, only certain [aggregation](https://opensearch.org/docs/latest/search-plugins/star-tree-index/#supported-queries-and-aggregations) queries are resolved using star-tree index as of 2.19. OpenSearch internally identifies which queries can be resolved faster using STIX in real-time.

Apart from configuration during index creation, there is no additional maintenance or changes needed for STIX . Refer to [Search Plan](https://github.com/opensearch-project/OpenSearch/issues/15257) to see which aggregations will be supported in future.

### Conclusion
STIX can be used to massively improve the performance of aggregations as seen above.
Support for more aggregations and queries such as boolean query, date range query, nested aggregations and terms aggregations are coming very soon.


