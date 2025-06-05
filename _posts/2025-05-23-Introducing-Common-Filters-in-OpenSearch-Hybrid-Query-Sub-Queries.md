---
layout: post
title: "Introducing common filter support for hybrid search queries"
layout: post
authors:
    - chloewq
    - kolchfa
date: 2025-05-23
categories:
  - technical-posts
meta_keywords: hybrid search in OpenSearch, hybrid query, filtering results, common filter in OpenSearch 3.0
meta_description: Learn how to simplify hybrid search filtering with common filter support in OpenSearch 3.0.
---


[Hybrid search](https://docs.opensearch.org/docs/latest/vector-search/ai-search/hybrid-search/index/) in OpenSearch enables you to combine different query types, such as lexical (keyword) and semantic (vector) queries, to produce one result set. This powerful capability is ideal for modern applications like semantic product search, document retrieval, and multimodal experiences.

However, until OpenSearch 3.0, applying filters to hybrid queries required manually duplicating the same filter in each subquery. This approach was tedious, error prone, and difficult to maintain. OpenSearch 3.0 introduced **common filter support** for hybrid queries, which simplifies query construction and improves performance.

In this post, we'll introduce common filters for hybrid search, explain how they work, and discuss why they're useful for real-world search applications.

## The challenge: Repeated filters in hybrid queries

Hybrid queries merge results from multiple subqueries---for example, a text match and a vector similarity search. Before OpenSearch 3.0, there was no simple way to specify a single filter for all subqueries. Imagine that you want to combine a semantic vector search with a traditional keyword search but only return results in which `category = "shoes"`. In OpenSearch 2.x, to limit the results to only shoes, you'd need apply the `category = "shoes"` filter in each subquery. This led to verbose queries and increased the risk of inconsistent logic between subqueries.

A common workaround was to use a `post_filter` on the overall hybrid results. However, this approach has limitations. In OpenSearch, `post_filter` is applied _after_ documents have been retrieved and scored ( see [Hybrid search with post-filtering](https://opensearch.org/docs/latest/vector-search/ai-search/hybrid-search/post-filtering/#:~:text=The%20,the%20order%20of%20the%20results)). While it can remove unwanted results from the final output, it doesn't affect which documents are considered during query execution.

As a result, subqueries still score documents that will later be filtered out, wasting compute resources. In vector search, this can also impact relevance: if you retrieve only the top k vectors and then apply a filter, you might discard relevant results that were just outside the top k because they didn’t meet the filter conditions.

Clearly, a better approach was needed, one that allows filters to be applied earlier, within the hybrid query itself.


## Introducing common filters for hybrid queries

OpenSearch 3.0 adds **common filter support** to the hybrid query DSL. You can now define a top-level `filter` in your hybrid query, and OpenSearch automatically applies it to all subqueries. This avoids duplication and ensures consistent filtering across your query logic.

Here's an example of a hybrid query using a common filter to restrict results to the `shoes` category:

```json
POST /products/_search
{
  "query": {
    "hybrid": {
      "filter": {
        "term": { "category": "shoes" }
      },
      "queries": [
        { 
            "match": { "description": "running shoes" }, 
            "filter" : {
                "term": {"brand": "nike"}
            }
        },
        { "knn": {
            "embedding": {
              "vector": [1.23, 0.45, 0.67, ...],
              "k": 10
            }
          }
        }
      ]
    }
  }
}
```

The preceding query is equivalent to the following OpenSearch 2.x query that applies the filter to each subquery:

```json
POST /products/_search
{
  "query": {
    "hybrid": {
      "queries": [
        { 
            "match": { "description": "running shoes" } 
            "filter" : {
                "term": {"brand": "nike"},
                "term": {"category": "shoes"}
            }
        },
        { "knn": {
            "embedding": {
              "vector": [1.23, 0.45, 0.67, ...],
              "k": 10
            },
            {
              "filter": {"term": {"category": "shoes"}}
            }
          }
        }
      ]
    }
  }
}
```

You can also combine common filters with subquery-specific filters. OpenSearch will apply both filters using logical `AND`:

```json
POST /products/_search
{
  "query": {
    "hybrid": {
      "filter": {
        "range": { "price": { "gte": 50, "lte": 200 } }
      },
      "queries": [
        {
          "match": { "description": "running shoes" },
          "filter": {
            "term": { "brand": "nike" }
          }
        },
        {
          "knn": {
            "embedding": {
              "vector": [1.23, 0.45, 0.67, ...],
              "k": 10
            }
          }
        }
      ]
    }
  }
}
```

In this example, the top-level `filter (category: shoes)` is applied to both the `match` query and the `knn` vector query. OpenSearch ensures that **only documents in the "shoes" category are considered** by either subquery. This dramatically simplifies the query logic: you no longer need to wrap each subquery in a Boolean filter or duplicate the filter under multiple query clauses---the common filter does it for you.

## How common filters work


When OpenSearch processes a hybrid query with a common filter, it effectively pushes that filter down into each subquery at execution time. Internally, each subquery is combined with the common filter using an `AND` logic. If a subquery already has its own filter criteria, the common filter is combined with the existing conditions using a logical `AND` (further narrowing the results of that subquery). If the subquery has no filter of its own, the engine applies the common filter directly. In practice, this might be implemented by wrapping the subquery in a Boolean query with the filter or by using the filtering capabilities of the subquery type (for example, the k-NN engine can apply a pre-filter on documents before vector similarity search).

The following diagram illustrates how a common filter `F` is applied in a hybrid search query. OpenSearch distributes the filter to each subquery (`Q1`, `Q2`), ensuring that each individual query only searches within the filtered subset of documents prior to combining the results. Each subquery returns results that already satisfy **F**, and then those results are merged and ranked. The final result set inherently respects the filter conditions without the need for additional post-processing. By filtering early, this design avoids unnecessary computation on filtered-out items and prevents any loss of relevant results because of late-stage filtering.

![How common filters are applied](/assets/media/blog-images/2025-05-23-introducing-common-filters-in-hybrid-query/filter-query.png)

## Real-world example: Filtering in an e-commerce search

Consider an e-commerce site that uses hybrid search to power its product search. When a user searches for **“running shoes”**, the system might combine a keyword match on product descriptions with a semantic vector search to capture broader meaning—even if the exact words aren’t present.

Now imagine the user wants to see only items that are **in stock** and belong to the **"shoes"** category. Without common filter support, these filters would need to be manually added to each subquery. This makes query construction more complex and increases the risk of inconsistent filtering, especially if different subqueries apply filters differently or omit them by mistake.

With **common filter support** in OpenSearch 3.0, you can define these filters once at the top level of the hybrid query. For example, adding a common filter similar to the following ensures that all subqueries, whether keyword-based or vector-based, are constrained to in-stock shoes:

```json
"filter": [
  { "term": { "category": "shoes" }},
  { "term": { "in_stock": true }}
]
```

This makes the query logic simpler, reduces the chance of errors, and ensures a consistent filtering experience across all search paths. As a result, users receive a unified and relevant result set, which accurately reflecting their search intent, without irrelevant items from other categories or out-of-stock products.

## Why common filters matter: Key benefits

Enabling common filter support in hybrid queries offers several important advantages over the previous approach:

* **Simpler query definitions:** You define the filter once at the top level, eliminating repetitive filter clauses in each subquery. This makes query DSL easier to read and maintain—especially as you add more subqueries or update filter criteria over time.

* **Consistent filtering behavior:** Centralizing the filter ensures that all subqueries apply the same constraints. This eliminates the risk of missed or inconsistent filters, helping you avoid subtle bugs and maintain uniform logic across the query.

* **Better performance:** Filters are applied early in query execution, so subqueries can skip irrelevant documents from the start. This reduces unnecessary computation and I/O. In contrast, a `post_filter` applies only after scoring, which wastes resources evaluating documents that may be discarded later. For vector search, early filtering also narrows the candidate pool, improving speed and relevance.

* **More accurate results:** Filtering at the subquery level ensures that only eligible documents are scored. This avoids the risk of missing relevant results that get filtered out after scoring (a common issue when using post-filtering with top-*k* vector retrieval). The result is a cleaner, more reliable ranking that accurately reflects the user's intent.

## Summary

Common filter support in OpenSearch 3.0 is a valuable enhancement for anyone building hybrid search applications. It streamlines your query definitions, reduces maintenance burden, and delivers more accurate and efficient results. Whether you're working on semantic product discovery, document search, or multimodal retrieval, this feature makes hybrid search more powerful and easier to use.

## What's next?

Currently, the common filter is always combined with subquery filters using logical `AND`. A proposed enhancement would introduce two new modes for more flexible behavior:

* **Logical OR:** Combines the common filter and the subquery filter using OR logic. A document is included if it matches **either** the common filter **or** the subquery filter—useful when broadening result criteria while still applying some global filtering.

* **Logical REPLACE:** Replaces any filter in the subquery with the common filter. Only the common filter is applied, and the subquery’s original filter is ignored—useful when you want to enforce consistent filtering across all subqueries regardless of their individual logic.


This feature is under discussion in [GitHub issue #1323](https://github.com/opensearch-project/neural-search/issues/1323). If you'd like to see support for these modes in a future release, add a 👍 or comment on the issue to share your feedback. Your input helps guide future improvements to OpenSearch search capabilities.




