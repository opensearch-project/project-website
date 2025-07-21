---
layout: post
title: "OpenSearch Approximation Framework"
category: blog
tags: [search, performance, opensearch-3-1, opensearch-3-0]
authors:
    - prudhvigodithi
    - hvamsi
    - sawansri
    - sisurab
date: 2025-07-14
categories:
  - technical-posts
meta_keywords: search, query performance, OpenSearch 3.1, OpenSearch 3.0, OpenSearch performance, query optimization
meta_description: The Approximation Framework is a performance optimization in OpenSearch that introduces early termination during BKD tree traversal. It enhances the efficiency of numeric range, sort, and match_all queries by collecting only the required number of documents. This framework delivers exact results with significantly reduced query latency. By intelligently skipping unnecessary work, it improves search responsiveness, especially in high-throughput or time-series workloads.
---

If you're an OpenSearch user, you probably often run OpenSearch queries to retrieve the most recent logs, metrics, or events - for example, fetching the latest 100 error logs from the past 24 hours, or identifying system metrics over the last 7 days for anomaly detection. These queries often include range filters on time or numeric fields (e.g., `@timestamp > now-1d`), sorting (typically descending), or `match_all` queries to power dashboard visualizations and alerts. Because these are used interactively or in streaming dashboards, latency and efficiency are critical for this experience. 

These queries are typically non-scoring and are often used as the first step in visualizing time-series or event-based data. For example, you may sort results by a timestamp field in descending order to fetch the latest events, or in ascending order to analyze the earliest entries within a given time frame. While Lucene introduced an optimization (`IndexOrDocValuesQuery`) that intelligently uses doc values instead of scanning the entire index when running non-scoring range queries, the default algorithm still traverses all segments and often scores more documents than necessary. This results in unnecessarily processing a large set of documents, while you actually require only a small subset of top results (for example, first 50 or 100 hits).

To address this, we introduced the _Approximation Framework_ that applies early termination logic during BKD tree traversal for eligible queries. The idea is to override the default `PointRangeQuery` and inject a custom `IntersectVisitor` that stops once the requested number of hits is collected, significantly reducing query latency. This approach preserves result correctness while avoiding unnecessary work, making it a valuable optimization for high-volume time-based or event-based workloads.

Starting with version 3.0.0, OpenSearch includes the Approximation Framework as a GA feature.


## Overview

The OpenSearch Approximation Framework is a query optimization technique that implements custom BKD tree traversal with early termination. The key insight is that for queries with a size limit, we don't need to visit all matching documents; we can stop as soon as we've collected enough results.

The framework creates custom versions of standard Lucene queries (like `PointRangeQuery`) that has the following features:

* **Early terminattion** of the BKD tree traversal once the size limit is reached.
* **Returning exact results**, so the documents returned are always correct matches.
* **Optimized traversal order** based on sort requirements.

## Supported sample query shapes and types

The Approximation Framework currently benefits the following query patterns, particularly when `track_total_hits` is not set to `true` and no aggregations are involved. The framework supports all numeric types including `int`, `long`, `float`, `double`, `half_float`, `unsigned_long`  and `scaled_float`.

### Range queries 

```json
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "2023-01-01T00:00:00",
        "lt": "2023-01-03T00:00:00"
      }
    }
  }
}
```

The framework walks the BKD tree and stops once the requested `size` is met.

### Match all + sort (ASC/DESC)

```json
{
  "query": { "match_all": {} },
  "sort": [{ "@timestamp": "desc" }]
}
```

Automatically rewritten into a bounded range query with early termination.

### Range + sort (ASC/DESC)

```json
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "2023-01-01T00:00:00",
        "lte": "2023-01-13T00:00:00"
      }
    }
  },
  "sort": [{ "@timestamp": "asc" }]
}
```

The framework optimizes left-to-right (`ASC`) or right-to-left (`DESC`) traversal to find the top `size` documents quickly.

## BKD walk (custom BKD tree traversal)

Instead of using Lucene's standard tree traversal that visits all matching documents, the framework implements custom `intersectLeft` and `intersectRight` methods with sort-aware traversal, which ensures collecting the correct top-N documents without visiting unnecessary nodes.

* **`ASC` sort**: Uses `intersectLeft` to traverse from smallest to largest values. This method is default and used for plain range queries.
* **`DESC` sort**: Uses `intersectRight` to traverse from largest to smallest values.

### Example: Traversal with approximation

The following example illustrates a BKD tree traversal with approximation.

#### `intersectLeft` traversal 

The following diagram illustrates how the Approximation Framework performs a BKD tree traversal for a query with the following parameters:

* `size` = 1100
* `range` = 10:00 – 10:30

![intersectLeft Traversal - flow diagram](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/intersectLeft-traversal.png)

Because the goal is to collect just 1100 matching documents, the traversal short-circuits once this threshold is met.

##### Traversal path

The tree is traversed as follows:

```
Root → Left1 → Left2 → L1 → L2 → Right2 → L3 → Done
```

* Nodes like `Right1`, `Left3`, `Right3` and all their children (`L5`–`L8`) are entirely skipped, because enough documents were already collected from the left side of the tree.
* This demonstrates how the framework avoids visiting unnecessary subtrees, reducing query latency while still returning accurate top-N results.

### `intersectRight` traversal

The following diagram illustrates how the Approximation Framework performs a descending sort (`SortOrder.DESC`) traversal for a query with the following parameters:

* `size` = 1100
* `range` = 10:00 – 10:30

Because the query is sorted in descending order, the traversal prioritizes the rightmost (newest) values first.

![intersectRight Traversal - flow diagram](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/intersectRight-traversal.png)

##### Traversal path

The tree is traversed as follows:

```
Root → Right1 → Right3 → L8 → L7 → Left3 → L6 → Done
```

* As soon as the traversal collects enough documents (≥1100), it terminates early, skipping the remaining subtrees on the left.
* Nodes like `Left1`, `Left2`, `Right2`, and their respective leaf children are entirely skipped, because they fall outside the descending priority range or are no longer needed.

## Performance: Benchmarking tests and results

While numeric sort, range, and match all queries have seen significant performance improvements overall, the following are specific scenarios highlighting improvements in P90 latencies.

### big5: range query

`range` queries have shown improvement from **~28ms** to **~6ms**, as shown in the following graphs.

![big5 range query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/big5-range-query-without-approximation.png)

![big5 range query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/big5-range-query-with-approximation.png)

### big5: desc_sort_timestamp query

Seen improvement from **~20ms** to **~10ms**

![big5 desc_sort_timestamp query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/big5-desc_sort_timestamp-query-without-approximation.png)

![big5 desc_sort_timestamp query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/big5-desc_sort_timestamp-query-with-approximation.png)

### http_logs: desc_sort_timestamp query

`desc_sort_timestamp` queries have shown improvement from **~280ms** to **~15ms**, as shown in the following graphs.

![http_logs desc_sort_timestamp query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/http_logs-desc_sort_timestamp-query-without-approximation.png)

![http_logs desc_sort_timestamp query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/http_logs-desc_sort_timestamp-query-with-approximation.png)

### http_logs: asc_sort_timestamp query

`asc_sort_timestamp` queries have shown improvement from **~15ms** to **~8ms**, as shown in the following graphs. 

![http_logs asc_sort_timestamp query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/http_logs-asc_sort_timestamp-query-without-approximation.png)

![http_logs asc_sort_timestamp query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/http_logs-asc_sort_timestamp-query-with-approximation.png)


### Additional improvements:

Further improvements, particularly in sort query performance, were observed in the OpenSearch 3.1 release and are shared in detail in the [3.1.0 release issue](https://github.com/opensearch-project/opensearch-build/issues/5487#issuecomment-2989202040).
 
This result comes from a single-segment test for `desc_sort_timestamp`. According to [this comment](https://github.com/opensearch-project/OpenSearch/pull/18439#issuecomment-2961325856), a force merge to a single segment with an optimized custom BKD walk (`intersectRight`) reduced P90 latency dramatically from **2111** ms to **6.1** ms. This improvement is made possible by the Approximation Framework, which enables early termination during BKD traversal, efficiently collecting the most relevant documents with minimal overhead.

As shown in [this comment](https://github.com/opensearch-project/OpenSearch/pull/18439#issuecomment-2942212895), which captures benchmark results from the development phase, several query types showed significant improvements: `http_logs`: `desc_sort_size` showed over **80%** improvement, `http_logs`: `desc_sort_timestamp` improved by more than **80%**, and `asc_sort_timestamp` achieved over **80.55%** improvement in performance.

## Upcoming improvements

The high-level [META issue](https://github.com/opensearch-project/OpenSearch/issues/18619) contains the next set of enhancements related to the Approximation Framework.

The following are some of the upcoming improvements planned for the 3.2.0 release, including extending the Approximation Framework to support all numeric types (see [related PR](https://github.com/opensearch-project/OpenSearch/pull/18530)). Additional performance gains have also been observed in range and sort queries, particularly when tested on the skewed `http_logs` dataset, as shown in the following diagram.

![http_logs performance comparison](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/http_logs-performance-comparison.png)

### http_logs: range_with_asc_sort (between 2.19.1 and 3.2.0) 

Seen improvement from **~300ms** to **~30ms**

![http_logs range_with_asc_sort query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/http_logs-range_with_asc_sort-query-with-approximation.png)

### http_logs: range_size:  (between 2.19.1 and 3.2.0) 

Seen improvement from **~48ms** to **~8ms**

![http_logs range_size query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/http_logs-range_size-query-with-approximation.png)

### http_logs: range_with_desc_sort: (between 2.19.1 and 3.2.0) 

Seen improvement from **~312ms** to **~31ms**

![http_logs range_with_desc_sort query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/http_logs-range_with_desc_sort-query-with-approximation.png)

### nyc_taxis: desc_sort_passenger_count (between 3.1.0 and 3.2.0) 

Seen improvement from **~17ms** to **~12ms**

![nyc_taxis desc_sort_passenger_count query](/assets/media/blog-images/2025-07-14-OpenSearch-Approximation-Framework/nyc_taxis-desc_sort_passenger_count-query-with-approximation.png)


### Additioanl Query shapes and types under exploration 

We're exploring several promising areas for extending the Approximation Framework to additional query types. Here are the types of queries we can target in future releases: 

#### Term Query

The proof of concept for extending the framework to top-level term queries on numeric fields has shown approximately **25%** decrease in latency on the `http_logs` dataset. Related [benchmark results](https://github.com/opensearch-project/OpenSearch/pull/18679#issuecomment-3071292692), related [issue](https://github.com/opensearch-project/OpenSearch/issues/18620) with this topic.

### Boolean Query

Related [issue](https://github.com/opensearch-project/OpenSearch/issues/18692) and [RFC](https://github.com/opensearch-project/OpenSearch/issues/18784) on this topic which has some details on implementing `ApproximateBooleanQuery` as proof of concept which can optimize both single and multi-clause boolean queries.

### Numeric search_after queries

During a proof of concept effort outlined [in this issue](https://github.com/opensearch-project/OpenSearch/issues/18546), observed significant improvements for numeric queries using the `search_after` parameter in OpenSearch, which is designed for efficient deep pagination of large datasets. In tests with `asc_sort_with_after_timestamp`, the P90 latency dropped from **194.828** ms to **8.459** ms, and for `desc_sort_with_after_timestamp`, it dropped from **188.037** ms to **7.09** ms.
