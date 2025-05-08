---
layout: post
title:  "Optimizing date histogram aggregations using the index tree"
authors:
   - bowenlan
   - akjain
   - kolchfa
date: 2025-04-23
categories:
  - technical-posts
meta_keywords: date histogram, aggregation, performance
meta_description: Learn how OpenSearch improves the performance of date histogram aggregations by using the BKD index tree, with support for sub-aggregations and multi-range traversal.
---

OpenSearch is widely used for data analytics, especially when working with time-series data. A core feature of time-series analysis is the date histogram aggregation, which groups documents by date or timestamp into defined intervals like months, weeks, or days. This grouping is crucial for visualizing trends and patterns, such as viewing the hourly number of HTTP requests to a website.

However, as data volume grows, the computation required for these aggregations can slow down analysis and dashboard responsiveness. Traditionally, aggregations iterated over every relevant document to place it into the correct time bucket, a method that becomes inefficient at scale. To address this, OpenSearch introduced optimizations that use the underlying index structure of date fields to significantly accelerate aggregation performance. This post details the evolution of this optimization.

## Why optimize: Use cases and benefits

Date histograms are used across various use cases, for example:

- Analyzing web traffic patterns
- Monitoring application metrics and logs
- Visualizing sales trends
- Tracking IoT sensor data

Optimizing date histogram performance offers the following benefits:

- **Faster analysis**: Reduced dashboard load times for time-series visualizations.
- **Improved scalability**: Efficient handling of large data volumes without sacrificing performance.

## How it works: Using the index tree

To understand the optimization, let's review how OpenSearch stores numeric data like timestamps (using Lucene). Numeric data is stored in two main structures:

1. **Document values (doc values)**: A columnar structure optimized for operations like sorting and aggregations. The traditional aggregation algorithm iterates over these values.
2. **Index tree (BKD tree)**: A specialized index structure (a one-dimensional BKD tree for date fields) designed for fast range filtering. An index tree consists of inner nodes and leaf nodes. Values are stored only in leaf nodes, while inner nodes store the bounding ranges of their children. This structure allows efficient traversal in a sorted order to find documents within specific ranges.

The optimization lets date histogram aggregations use the BKD tree's ability to count documents within the date ranges defined by the histogram buckets rather than iterate over the document values.

The following diagram illustrates the differences between document values and an index tree. The left panel shows raw field data, mapping document IDs to numeric values. The document values is a columnar array storing values by document ID. Aggregations that rely on this structure scan each value individually. The index tree is a hierarchical structure with leaf nodes storing actual values and inner nodes storing ranges. For example, a node labeled `[1,4]` allows OpenSearch to count documents for that range ("4 docs") without reading all the values. 

![Numeric field lucene docvalues vs. index](/assets/media/blog-images/2025-04-23-optimizing-date-histogram-aggregation-using-index/numeric_field_docvalue_vs_index.png){:class="img-centered" width="650px"}  

## The optimization journey

The following sections outline how the optimization evolved over time, starting with initial enhancements in OpenSearch 2.12 and culminating in broader support in OpenSearch 3.0.

### Phase 1: The filter rewrite approach (OpenSearch 2.12)

The initial optimization introduced a filter rewrite strategy. It preemptively created a series of range filters, one for each bucket, in the requested date histogram. For example, consider the following monthly histogram over a year: 

```json
{
  "aggs": {
    "by_month": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "month"
      }
    }
  }
}
```

This histogram generates 12 filters. The filters then use the index tree to determine counts for each bucket faster than document value iteration. This approach was also applied to the auto date histogram, composite aggregation on date histogram source, and, later on, numeric range aggregation with consecutive ranges.

The following diagram illustrates how documents are counted per histogram bucket using the index tree. When doing date histogram bucketing, the algorithm can quickly retrieve this information from the node's metadata (like the "4 docs" shown in the `[1,1]` node) without examining any individual values. However, when actual values from the leaf nodes need to be accessed (like the `[4|5]` node for buckets `[3,4]` and `[5,6]`), the algorithm must perform a sequential scan of all values in that node.

![Bucketing using index](/assets/media/blog-images/2025-04-23-optimizing-date-histogram-aggregation-using-index/bucket-on-index.png){:class="img-centered" width="450px"}  

### Phase 2: Addressing scalability using multi-range traversal (OpenSearch 2.14)

While effective in many cases, the filter rewrite approach faced several challenges. A performance regression was observed in [13087](https://github.com/opensearch-project/OpenSearch/issues/13087), particularly when the number of buckets became very large (that is, for small intervals). The overhead of managing numerous filters and the increased likelihood of needing to access leaf nodes in the index tree could negate its benefits.

To overcome this, we developed _multi-range traversal_. Recognizing that all filters operate on the same index, this method traverses the index tree just once, efficiently counting documents for all required bucket ranges in a single pass. This resolved the reported regression and provided additional performance improvements.

### Phase 3: Expanding support for sub-aggregations (OpenSearch 3.0)

Initially, the optimization only applied to top-level date histograms. However, users frequently need sub-aggregations within time buckets, such as calculating average metrics or counting distinct values (for example, average network bandwidth per hour or counts of HTTP status codes). In OpenSearch 3.0, we added support for these sub-aggregations. Additionally, we implemented protections during development to prevent regressions identified in testing.

## Performance results

The optimizations have yielded significant performance improvements:

* [Filter rewrite](https://github.com/opensearch-project/OpenSearch/pull/11083#issuecomment-1820937321) (version 2.12): **10x to 50x improvements** observed on specific date histogram queries compared to the baseline.
* [Multi-range traversal](https://github.com/opensearch-project/OpenSearch/pull/13317) (version 2.14): Resolved regressions and achieved further **improvements**, including **up to 70%** on the `http_logs` workload and **20--40%** on `nyc_taxis`, compared to the filter rewrite method.
* [Sub-aggregation support](https://github.com/opensearch-project/OpenSearch/pull/17447) (version 3.0): **30--40% improvements** observed for relevant operations in the `big5` workload.

## Limitations

While these improvements offer strong performance gains, it's important to understand where they may not apply or can introduce overhead:

* The filter rewrite optimization primarily applies to match all queries or simple range queries compatible with the index tree computation; it does not support arbitrary top-level queries. While [segment-level match all](https://github.com/opensearch-project/OpenSearch/pull/12073) has been implemented, complex query interactions might still limit filter rewrite applicability.
* While multi-range traversal significantly reduced overhead, extremely fine-grained histograms over sparse datasets can potentially still encounter performance regressions.

## Conclusion

Index-based optimization for date histogram aggregations in OpenSearch significantly enhances the performance of time-series analysis and visualization. It is applied automatically to eligible aggregations, streamlining your workflows without extra manual effort. As OpenSearch evolves, these improvements ensure that you can efficiently gain insights from your data, with less concern about scale.
