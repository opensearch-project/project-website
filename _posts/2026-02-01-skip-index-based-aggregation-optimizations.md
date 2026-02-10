---
layout: post
title: "Skip Index-Based Optimizations: Extending Aggregation Performance in OpenSearch"
authors:
 - jainankitk
 - asimmahmood1
date: 2026-02-01
categories:
 - technical-posts
meta_keywords: performance, search, lucene, aggregations, opensearch
meta_description: How skip index optimizations build on earlier performance improvements and address their limitations.
excerpt: Skip index-based optimizations represent the next step in aggregation performance, reducing per-document work by summarizing ranges of values to skip or bulk-count entire blocks of documents.
---

Aggregations are a cornerstone of analytical search workloads in OpenSearch, powering dashboards, reporting and time-series analytics. Recent enhancements delivered dramatic improvements—up to 100× speedups for many histogram queries—by rewriting filters and using multi-range traversal to avoid scanning every matching document. However, these techniques have limitations when filters and aggregation fields are uncorrelated or when sub-aggregation logic is more complex.

Skip index-based optimizations represent the next step in this performance journey. Instead of iterating over each matching document, skip indexes summarize ranges of values so that entire blocks of documents can be **skipped** or **bulk-counted** when they fall into a single aggregation bucket. This reduces per-document work and improves CPU efficiency in scenarios where earlier techniques did not apply.

## What is a skiplist

Skip list is essential meta data of the user data, that allows us to efficiently *skip* many elements that will not match during a serach. Skiplist partiticularly work well when the data is sorted, although we'll back to this. Lucene already uses skiplist for term positions. Term positions are ordred list of docIds where the term occurs. These list include skip list that allow efficient queries like conjunction (AND). For details see [javadoc](https://lucene.apache.org/core/10_3_2/core/org/apache/lucene/codecs/lucene103/Lucene103PostingsFormat.html)

Starting Lucene 10.0, skiplist are optionally available on top of numeric doc values [PR](https://github.com/apache/lucene/pull/13449). The basic idea is that at pecific interrvals, both min and max numeric values will be encodded at index time. As of Lucene 10 this occurs at 2^12 (4k) values, and called skip list level. There are 4 levels at this point. Take the worse case scenario where are an index with 2^31-1 (~2MM) values, 1st level will have 2^19 (~0.5MM), second 2^7 (128), and third only 1. So technically 4th isn't needed. There are 3 values encoded at each interval: min, max and number of documents. 


## Special case: Time Series Data

As mentioned earlier, skiplist is useful when the data is sorted. Common use case for log analysics, metrics and obserbality, time timestamp is a nartual primary field. Most field name for time series data is `@timestamp`. This by itself does not guaretee the timestamp will remain sorted. Best performing option is to explicity create an index sort setting. This will ensure data is always sorted, not matter how many segments or merges happen during indexing. Second option is to select a merge stategy that will preseve the incoming order of documents: log merge policy. 

In Opensearch 3.2, a new `skip_list` parameter was added to [numeric fields](https://github.com/opensearch-project/OpenSearch/pull/18889), which default value of false. Starting  in 3.3, skip_list parameter defaults to [`true` for Date](https://docs.opensearch.org/latest/mappings/supported-field-types/date/) if the field name is `@timestamp`. 




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

Skip index-based execution reduces unnecessary work in queries where earlier range traversal techniques offered limited benefit. It helps:
- Improve performance when filter and aggregation fields are uncorrelated.
- Reduce CPU overhead for large aggregations.
- Better handle cases with deleted or sparse documents.

This optimization is tracked in OpenSearch's performance roadmap and ongoing work around skip-list-based aggregation improvements (see [GitHub Issue #19384](https://github.com/opensearch-project/OpenSearch/issues/19384)).

## Looking Ahead

Skip index-based optimizations don't replace previous techniques; they **complement** them. By broadening the set of query patterns that can be accelerated, OpenSearch continues to deliver faster and more efficient aggregations across use cases.

If you're building analytical workloads on OpenSearch, these improvements provide another lever to improve performance while handling diverse query patterns.
