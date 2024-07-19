---
layout: post
title:  "Optimize storage and performance with the MatchOnlyText field in OpenSearch"
authors:
  - rishabhmaurya
  - macrakis
date: 2024-07-11
categories:
  - technical-posts
meta_keywords: match_only_text field, text field, text query performance, storage optimization
meta_description: match_only_text field could a replacement of text field, when positions are not required to be indexed, providing better performance and reduced cost.
has_science_table: true
---
<style>

.light-green-clr {
    background-color: #e3f8e3;
}

.bold {
    font-weight: 700;
}

.left {
    text-align: left;
}

.center {
    text-align: center;
}

table { 
    font-size: 16px; 
}

h3 {
    font-size: 22px;
}

th {
    background-color: #f5f7f7;
}​

</style>
## Introduction

The OpenSearch Project introduced a new field type called `match_only_text` in version 2.12. This field type is designed for full-text search scenarios where scoring and positional information of terms within a document are not critical. If you're working with large datasets in OpenSearch and looking to optimize storage and performance, then the `match_only_text` field could be an interesting option to explore.

## What is the MatchOnlyText field?

The `match_only_text` field is a variant of the standard `text` field in OpenSearch. It differs from the regular `text` field in a few key ways:

1. **Reduced storage requirements**: It omits storing positions, frequencies, and norms, which reduces the overall storage requirements.
2. **Constant scoring**: It disables scoring so that all matching documents receive a constant score of 1.0.
3. **Limited query support**: It supports most query types, except for interval and span queries.

By avoiding the overhead of storing frequencies and positions, `match_only_text` fields result in smaller indexes and lower storage costs, especially for large datasets.

## Why use the MatchOnlyText field?

The `match_only_text` field can be particularly beneficial when you need to quickly find documents containing specific terms, without the need for relevance ranking or queries that rely on term proximity or order (like interval or span queries). For example, when searching for exceptions in logs for the last hour, the relevance may not be critical.

The reduced storage requirements of `match_only_text` fields can lead to significant cost savings, especially for organizations dealing with large amounts of text data. According to initial benchmarks, the storage savings can be as high as 25% compared to using standard `text` fields.

## How MatchOnlyText Achieves Smaller Index Sizes

For regular `text` fields, the inverted index stores the term-to-postings mapping, where postings contain the document IDs where the term exists, as well as additional information such as positions, document frequencies, and norms. When executing queries where positions are not needed, such as term queries, the positions are never loaded. However, when running phrase queries, the positions of terms within a document are required to ensure the individual terms of the phrase query are in order.

With the `match_only_text` field, the positional information is not stored, resulting in smaller indexes. To run phrase queries without the positional data, OpenSearch converts the phrase query into a conjunction of individual term queries, and then checks the matching documents against the original document content in the `_source` field using a Lucene MemoryIndex. This approach trades off the performance of phrase queries for the reduced storage requirements.

## Estimating Storage Savings

To understand how much storage cost it would save and whether it's worth trading off unsupported features and the performance of phrase queries, you can use the OpenSearch index stats API:

```
/<index_name>/_stats/segments?level=shards&include_segment_file_sizes&pretty
```

This API provides information about the storage usage of the `pos` (positions), `doc` (frequencies), and `nvm` (norms) components. The savings you can achieve by using `match_only_text` will depend on your specific data and workload, but initial benchmarks have shown storage reductions of up to 25% for the PMC workload in OpenSearch Benchmark.

Keep in mind that with the `_stats` API, it's not possible to get field-level statistics. A [GitHub issue](https://github.com/opensearch-project/OpenSearch/issues/6836#issuecomment-1758529469) has been created to address this limitation in order to help you accurately predict storage optimization after transitioning from `text` to `match_only_text`.

## Using MatchOnlyText in OpenSearch

To use the `match_only_text` field, you can simply define it in your OpenSearch index mappings, like this:

```json
{
  "mappings": {
    "properties": {
      "my_text_field": {
        "type": "match_only_text"
      }
    }
  }
}
```

Remember that the `match_only_text` field comes with some trade-offs, such as reduced phrase query performance and the inability to use proximity-based queries. Make sure to evaluate your specific use case and requirements to determine whether this field type is the right choice for your OpenSearch application.

For more detailed information, refer to the official OpenSearch documentation on the [MatchOnlyText field](https://opensearch.org/docs/latest/field-types/supported-field-types/match-only-text).
