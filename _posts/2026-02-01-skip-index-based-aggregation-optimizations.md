---
layout: post
title: "Skiplist-Based Aggregation Optimizations in OpenSearch"
authors:
 - jainankitk
 - asimmahmood1
date: 2026-02-01
categories:
 - technical-posts
 - performance
meta_keywords: skiplist, aggregations, performance, date histogram, time series, OpenSearch, Lucene
meta_description: Learn how skiplist-based optimizations improve aggregation performance in OpenSearch 3.2+, with up to 28x faster queries on time-series data.
excerpt: OpenSearch 3.2 introduces skiplist-based aggregation optimizations that dramatically improve performance for range queries and aggregations on sorted data. Learn how this feature works and how to leverage it in your applications.
---

Aggregations are a cornerstone of analytical search workloads in OpenSearch, powering dashboards, reporting, and time-series analytics. Recent enhancements delivered dramatic improvements—up to 100× speedups for many histogram queries—by rewriting filters and using multi-range traversal to avoid scanning every matching document. However, these techniques have limitations when filters and aggregation fields are uncorrelated or when sub-aggregation logic is more complex.

Skiplist-based optimizations represent the next step in this performance journey. Building on Lucene 10's skiplist support for numeric doc values, OpenSearch 3.2 introduces optimizations that can deliver up to 28x faster date histogram aggregations. Instead of iterating over each matching document, skiplists summarize ranges of values so that entire blocks of documents can be **skipped** or **bulk-counted** when they fall into a single aggregation bucket. This reduces per-document work and dramatically improves CPU efficiency, especially for time-series data.

## What is a Skiplist?

A skiplist is a probabilistic data structure that allows efficient searching through ordered data by maintaining multiple levels of "skip pointers." Think of it like an express lane system on a highway—you can skip over large sections of traffic to reach your destination faster.

Lucene has long used skiplists for term positions in inverted indexes, enabling efficient conjunction (AND) queries. Starting with Lucene 10.0, skiplists are now optionally available on top of numeric doc values through [PR #13449](https://github.com/apache/lucene/pull/13449). This extension brings the same skip-ahead efficiency to numeric fields like timestamps, prices, and counters.

### How Lucene Implements Skiplists

Lucene's skiplist implementation uses a hierarchical structure with 4 levels, where each level summarizes data at exponentially increasing intervals of 2^12 (4,096) documents:

- **Level 0**: All documents (baseline data)
- **Level 1**: Every 4,096th document (2^12)
- **Level 2**: Every 16,777,216th document (2^24)
- **Level 3**: Every 68,719,476,736th document (2^36)

At each skip interval, Lucene encodes three critical pieces of metadata:
1. **Minimum value** in the range
2. **Maximum value** in the range  
3. **Document count** in the range

This metadata enables the query engine to make intelligent decisions: if a range's min/max values fall entirely outside the current aggregation bucket, the entire range can be skipped. If they fall entirely within a bucket, all documents in that range can be bulk-counted without individual inspection.

For a worst-case index with 2^31-1 (~2 billion) documents, the skiplist hierarchy would have approximately 524,288 entries at level 1, just 128 at level 2, and only 1 at level 3—dramatically reducing the search space from billions to hundreds of checks. 


## Special Case: Time-Series Data

Skiplists deliver their best performance on **sorted data**. When documents are ordered by the field being aggregated, the skiplist's min/max ranges align perfectly with aggregation buckets, maximizing the opportunities to skip or bulk-count entire ranges.

For log analytics, metrics, and observability workloads—common use cases in OpenSearch—the timestamp field is a natural candidate for skiplist optimization. Most time-series data uses `@timestamp` as the primary temporal field, making it an ideal target for this optimization.

### Ensuring Data Remains Sorted

Simply having a timestamp field doesn't guarantee the data stays sorted as segments merge and documents are added. There are two approaches to maintain sort order:

**Option 1: Index Sort (Recommended)**

Configure an explicit index sort setting to ensure data remains sorted regardless of segment merges:

```json
{
  "settings": {
    "index.sort.field": "@timestamp",
    "index.sort.order": "desc"
  }
}
```

This setting guarantees that all segments maintain timestamp order, providing consistent skiplist performance.

**Option 2: Log Merge Policy**

Alternatively, use a merge policy that preserves the incoming document order. The log merge policy tends to maintain temporal ordering for append-only workloads typical of time-series data.

### Enabling Skiplist on Custom Fields

If you're using a custom timestamp field name or want to enable skiplist on other numeric fields, you can explicitly enable it in your mapping:

```json
{
  "mappings": {
    "properties": {
      "request_timestamp": {
        "type": "date",
        "skip_list": true
      }
    }
  }
}
```

### Default Behavior by Version

OpenSearch has progressively expanded skiplist support:

- **OpenSearch 3.2**: Introduced the `skip_list` parameter for numeric fields (default: `false`)
- **OpenSearch 3.3**: Automatically enables `skip_list` for date fields named `@timestamp` on date histogram aggregations
- **OpenSearch 3.4**: Extends automatic skiplist optimization to auto date histogram aggregations on `@timestamp`

For more details, see the [OpenSearch documentation on date fields](https://docs.opensearch.org/latest/mappings/supported-field-types/date/). 




## From Range Traversal to Skip Indexes

Previously, OpenSearch accelerated date histogram aggregations by transforming queries into multiple range filters and traversing range indexes like Lucene's BKD tree for each bucket. That approach works well when the field being aggregated supports ordered range traversal, but it struggles when:
- The filter and aggregation fields are **different**.
- The query cannot be rewritten cleanly into independent ranges.
- Sub-aggregations add complexity to bucket resolution.

Skip index optimizations build on Lucene's internal indexing structures to summarize values across intervals. Rather than recursing into an index tree per bucket, the execution engine can consult the skip index to determine whether:
- All values in a range fall outside the current bucket, allowing the range to be skipped.
- All values fall into the current bucket, allowing the engine to **count documents in bulk**.

![Skip_Index_Visualization.png](../assets/media/blog-images/2026-02-01-skip-index-based-aggregation-optimizations/Skip_Index_Visualization.png)
*Figure 1: Skip index visualization for an unsorted index field.*

## Real-World Benefits

Skiplist optimizations deliver measurable performance improvements across a range of aggregation workloads. Using OpenSearch Benchmark with the `http_logs` and `big5` datasets, we measured dramatic latency reductions and throughput improvements.

### Date Histogram Performance (http_logs workload)

Testing with [PR #19130](https://github.com/opensearch-project/OpenSearch/pull/19130) on the http_logs dataset showed exceptional improvements for date histogram aggregations:

| Operation | Baseline (p90) | With Skiplist (p90) | Improvement |
|-----------|----------------|---------------------|-------------|
| `date_histogram_calendar_interval` | 19,572 ms | 149 ms | **99.2% faster** (131x) |
| `date_histogram_calendar_interval_with_filter` | 20.8 ms | 10.3 ms | **50% faster** |

The most dramatic improvement came from queries without additional filters, where skiplist optimization reduced p90 latency from over 19 seconds to just 149 milliseconds—a **131x speedup**. Even queries with filters saw 50% latency reduction, demonstrating that skiplist complements existing filter optimizations.

Throughput improvements were equally impressive:
- **21% higher throughput** for date histogram queries
- **0% indexing performance impact** (no degradation in write performance)

### Auto Date Histogram Performance (big5 workload)

OpenSearch 3.4 extended skiplist optimization to auto date histogram aggregations. Testing with [PR #20057](https://github.com/opensearch-project/OpenSearch/pull/20057) on the big5 dataset showed:

| Operation | Baseline (p50) | With Skiplist (p50) | Improvement |
|-----------|----------------|---------------------|-------------|
| `hourly_agg_with_filter` | 83.6 ms | 36 ms | **57% faster** |
| `hourly_agg_with_filter_and_metrics` | 4,177 ms | 959 ms | **77% faster** |

These results demonstrate that skiplist optimization extends beyond simple date histograms to more complex aggregation patterns, including those with sub-aggregations and metrics.

### Trade-offs and Considerations

While skiplist optimization delivers significant performance gains, there are trade-offs to consider:

**Index Size Impact:**
- **@timestamp field only**: ~0.5% increase in index size
- **All numeric fields**: ~63% increase in index size (22 GB to 36 GB in big5 benchmark)

This is why OpenSearch defaults to enabling skiplist only on `@timestamp` fields—it provides targeted benefits with minimal storage overhead.

**When Skiplist Excels:**
- Date histogram and auto date histogram aggregations on time-series data
- Large time ranges with many documents
- High cardinality timestamp data
- Sorted numeric fields with range queries
- Queries that benefit from bulk-counting entire document ranges

**When Benefits Are Minimal:**
- Small time ranges with few documents
- Unsorted fields (skiplist still works but with reduced efficiency)
- Full index scans without range filters
- Fields with very low cardinality

Even in scenarios with complex sub-aggregations and metrics, skiplist optimization typically delivers 30-77% latency improvements, making it valuable across a broad range of use cases.

## Looking Ahead

Skip index-based optimizations don't replace previous techniques; they **complement** them. By broadening the set of query patterns that can be accelerated, OpenSearch continues to deliver faster and more efficient aggregations across use cases.

If you're building analytical workloads on OpenSearch, these improvements provide another lever to improve performance while handling diverse query patterns.
