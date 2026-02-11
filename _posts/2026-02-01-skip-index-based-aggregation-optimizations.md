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

Aggregations are a cornerstone of analytical search workloads in OpenSearch, powering dashboards, reporting, and time-series analytics. Recent enhancements delivered dramatic improvements by rewriting filters and using multi-range traversal to avoid scanning every matching document. However, these techniques have limitations when filters and aggregation fields are uncorrelated or when sub-aggregation logic is more complex.

Skiplist based optimizations represent the next step in this performance journey. Building on Lucene 10's skiplist support for numeric doc values, OpenSearch 3.2 introduces optimizations that can deliver up to 28x faster date histogram aggregations. Instead of iterating over each matching document, skiplists summarize ranges of values so that entire blocks of documents can be **skipped** or **bulk-counted** when they fall into a single aggregation bucket. This reduces per document work and dramatically improves CPU efficiency, especially for time-series data.


## From Range Traversal to Skip Indexes

OpenSearch has continuously evolved its aggregation performance through a series of optimizations. Understanding this evolution helps contextualize how skiplist fits into the broader performance story.

### Previous Optimizations

**Filter Rewrite Optimization**: Earlier versions of OpenSearch accelerated date histogram aggregations by transforming queries into multiple range filters and traversing range indexes like Lucene's BKD tree for each bucket. This approach worked well when the aggregation field supported ordered range traversal.

**Multi-Range Traversal**: Building on filter rewrite, multi-range traversal was further optimized by processing multiple ranges in a single pass through the index, reducing redundant work.

### Limitations of Previous Approaches

While these techniques delivered significant improvements, they struggled in several scenarios:

- **Uncorrelated fields**: When the filter field and aggregation field are different (e.g., filtering on `trip_distance` while aggregating on `dropoff_datetime`)
- **Complex sub-aggregations**: When bucket resolution involves additional aggregation logic beyond simple counting
- **Non-rewritable queries**: When queries cannot be cleanly decomposed into independent range filters

In these cases, the query engine still needed to scan every matching document, limiting performance gains.

### How Skiplist Addresses These Limitations

Skiplist optimization builds on Lucene's internal indexing structures to provide a more general solution. Instead of evaluating each matching document, the execution engine consults the skiplist metadata to determine whether:

1. **All values in a range fall outside the current bucket** → Skip the entire range
2. **All values fall within the current bucket** → Bulk-count all documents in the range
3. **Values span multiple buckets** → Process documents individually (fallback to traditional approach)

This approach works even when filter and aggregation fields are uncorrelated, because the skiplist operates directly on the aggregation field's doc values rather than relying on filter field indexes.

## What is a Skiplist?

A skiplist is a probabilistic data structure that allows efficient searching through ordered data by maintaining multiple levels of "skip pointers." Think of it like an express lane system on a highway, you can skip over large sections of traffic to reach your destination faster.

Lucene has long used skiplists for term positions in inverted indexes, enabling efficient conjunction (AND) queries. Starting with Lucene 10.0, skiplists are now optionally available on top of numeric doc values through [PR #13449](https://github.com/apache/lucene/pull/13449). This extension brings the same skip ahead efficiency to numeric fields like timestamps, prices, and counters.

### How Lucene Implements Skiplists

Lucene's skiplist implementation uses a hierarchical structure with 4 levels, where each level summarizes data at exponentially increasing intervals of 2^12 (4,096) documents:

For a worst case index with 2^31-1 (~2 billion) documents, the skiplist hierarchy would have approximately 524,288 entries at level 1, just 128 at level 2, and only 1 at level 3, dramatically reducing the search space from billions to hundreds of checks. 

At each skip interval, Lucene encodes these critical pieces of metadata:

1. **Minimum value** in the range
2. **Maximum value** in the range  
3. **Min Doc ID** in the range
4. **Max Doc ID** in the range
5. **Doc Counts** in the range


This metadata enables the query engine to make intelligent decisions: if a range's min/max values fall entirely outside the current aggregation bucket, the entire range can be skipped. If they fall entirely within a bucket, all documents in that range can be bulk counted without individual inspection.


![Skip_Index_Visualization.png](../assets/media/blog-images/2026-02-01-skip-index-based-aggregation-optimizations/Skip_Index_Visualization.png)
*Figure 1: Skiplist visualization showing how ranges of documents can be skipped or bulk counted based on min/max metadata.*



## Special Case: Time-Series Data

Skiplists deliver their best performance on **sorted data**. When documents are ordered by the field being aggregated, the skiplist's min/max ranges align perfectly with aggregation buckets, maximizing the opportunities to skip or bulk-count entire ranges.

For log analytics, metrics, and observability workloads, the timestamp field is a natural candidate for skiplist optimization. Most time-series data uses `@timestamp` as the primary temporal field, making it an ideal target for this optimization. (see [DataStreams](https://docs.opensearch.org/latest/im-plugin/data-streams/))

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

Alternatively, use a merge policy that preserves the incoming document order. The `log byte merge` policy tends to maintain temporal ordering for append-only workloads typical of time-series data.

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

See Numeric Data Types: 

### Default Behavior by Version

OpenSearch has progressively expanded skiplist support:

- **OpenSearch 3.2**: Introduced the `skip_list` parameter for numeric fields (default: `false`)
- **OpenSearch 3.3**: Automatically enables `skip_list` for date fields named `@timestamp` on date histogram aggregations
- **OpenSearch 3.4**: Extends automatic skiplist optimization to auto date histogram aggregations on `@timestamp`

For more details, see the [OpenSearch documentation on date fields](https://docs.opensearch.org/latest/mappings/supported-field-types/date/). 



### When Skiplist Applies

Skiplist optimization is most effective when:
- The aggregation field has doc values enabled (default for numeric fields)
- The field is sorted or mostly sorted
- Queries involve range filters or date histogram aggregations
- Document ranges align well with aggregation bucket boundaries

### When It Doesn't Apply

Skiplist optimization provides minimal benefit when:
- The field is completely unsorted and random
- Aggregation buckets are very small relative to skiplist intervals
- The query requires full index scans without any range constraints
- The field has very low cardinality (few unique values)

Even in these cases, skiplist doesn't hurt performance, it simply falls back to traditional document-by-document processing when bulk operations aren't possible.

## Real-World Benefits

Skiplist optimizations deliver measurable performance improvements across a range of aggregation workloads. Using OpenSearch Benchmark with the `http_logs` and `big5` datasets, we measured dramatic latency reductions and throughput improvements.

### Date Histogram Performance (http_logs workload)

Testing with [PR #19130](https://github.com/opensearch-project/OpenSearch/pull/19130) on the http_logs dataset showed exceptional improvements for date histogram aggregations:

| Operation | Baseline (p90) | With Skiplist (p90) | Improvement |
|-----------|----------------|---------------------|-------------|
| `hourly_agg_with_filter` | 998 ms | 36 ms | **95%** (28x) |
| `hourly_agg_with_filter_and_metrics` | 1618 ms | 1618 ms | **40%** |

Throughput improvements were equally impressive:
- **21% higher throughput** for date histogram queries
- **0% indexing performance impact** (no degradation in write performance)

### Auto Date Histogram Performance (big5 workload)

OpenSearch 3.4 extended skiplist optimization to auto date histogram aggregations. Testing with [PR #20057](https://github.com/opensearch-project/OpenSearch/pull/20057) on the big5 dataset showed:

| Operation | Baseline (p90) | With Skiplist (p90) | Improvement |
|-----------|----------------|---------------------|-------------|
| `range-auto-date-histo` | 2,099 ms | 324 ms | **87%** (6.5x) |
| `range-auto-date-histo-with-metrics` | 5,733 ms | 3,928 ms | **35%** |

This result combines the filter re-write optimization for range and skiplist for auto date histogram. 

### Trade-offs and Considerations

While skiplist optimization delivers significant performance gains, there are trade-offs to consider:

**Index Size Impact:**
- **@timestamp field only**: ~0.1% increase in index size
- **All numeric fields**: ~1% increase in index size (22 GB to 23 GB in big5 benchmark)

This is why OpenSearch defaults to enabling skiplist only on `@timestamp` fields, it provides targeted benefits with minimal storage overhead.


## How to Use This Feature

Skiplist optimization is designed to work automatically for the most common use cases while providing flexibility for custom configurations.

### Automatic Enablement

Starting with OpenSearch 3.3, skiplist optimization is **automatically enabled** for:
- Date fields named `@timestamp` in date histogram aggregations
- Auto date histogram aggregations on `@timestamp` (OpenSearch 3.4+)

No configuration is required, if you're using `@timestamp` for time-series data, you're already benefiting from skiplist optimization.

### Manual Configuration

To enable skiplist on other numeric fields, add the `skip_list` parameter to your field mapping:

```json
PUT /my-index
{
  "mappings": {
    "properties": {
      "price": {
        "type": "long",
        "skip_list": true
      },
      "response_time_ms": {
        "type": "integer",
        "skip_list": true
      },
      "custom_timestamp": {
        "type": "date",
        "skip_list": true
      }
    }
  }
}
```

### Decision Framework

Use this framework to decide when to enable skiplist on additional fields:

**Enable skiplist when:**
- The field is frequently used in date histogram or range aggregations
- The field contains sorted or mostly-sorted data
- Query performance is more important than index size
- The field has high cardinality (many unique values)

**Skip skiplist when:**
- The field is rarely aggregated
- Index size is a critical constraint
- The field has very low cardinality
- The field is unsorted and cannot be sorted via index settings

### Example Query

Here's a query that benefits from skiplist optimization:

```json
GET /logs-*/_search
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "2024-01-01",
        "lte": "2024-01-31"
      }
    }
  },
  "aggs": {
    "daily_counts": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "day"
      },
      "aggs": {
        "avg_response_time": {
          "avg": {
            "field": "response_time_ms"
          }
        }
      }
    }
  }
}
```

With skiplist enabled on `@timestamp`, this query can skip entire ranges of documents that fall outside the January 2024 timeframe and bulk-count documents within each daily bucket.

For more information, see the [OpenSearch documentation on skiplist parameters](https://docs.opensearch.org/latest/mappings/supported-field-types/date/) and [data streams](https://docs.opensearch.org/latest/im-plugin/data-streams/).

## Looking Ahead

Skiplist based optimizations don't replace previous techniques like filter rewrite and multi-range traversal, they **complement** them. By broadening the set of query patterns that can be accelerated, OpenSearch continues to deliver faster and more efficient aggregations across diverse use cases. 

### Future Enhancements

The OpenSearch community is actively working on extending skiplist capabilities:

- **Min/Max aggregations**: Using skiplist metadata for instant min/max calculations ([Issue #20174](https://github.com/opensearch-project/OpenSearch/issues/20174))
- **Enhanced bucket handling**: Supporting multiple owning bucket ordinals for more complex aggregation patterns


### Get Involved

Skiplist optimization is part of OpenSearch's broader performance roadmap. To learn more or contribute:

- Review the [meta issue #18882](https://github.com/opensearch-project/OpenSearch/issues/18882) for the complete skiplist implementation plan
- Check out the [performance tracking issue #19384](https://github.com/opensearch-project/OpenSearch/issues/19384) for benchmark results and ongoing work
- Try skiplist optimization in your own workloads and share your results with the community
- Contribute to future enhancements by opening issues or submitting pull requests

Skiplist optimization provides a time saving tool when building analytical workloads on Opensearch. It improves performance while handling diverse query patterns by reducing query latency and improving overall user expereince. 
