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
