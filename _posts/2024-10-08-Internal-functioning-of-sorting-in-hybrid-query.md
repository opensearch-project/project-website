---
layout: post
title:  "Internal functioning of sorting in hybrid query"
authors:
- varun
- minalsha
- vamshin
- kolchfa
date: 2024-10-08
categories:
  - technical-posts
  - search
meta_keywords: hybrid query, hybrid search, vector search, search, semantic and keyword search
meta_description: The concurrent segment search feature in OpenSearch optimizes CPU usage and enhances vector search performance by executing queries in parallel across multiple segments within a shard.
---

Since the introduction of hybrid query in OpenSearch 2.10, it has become increasingly popular among customers who want to improve the relevance of their semantic search results. Hybrid queries combine full-text search and semantic search to provide better results than either method alone for a wide variety of applications in e-commerce, document search, log analytics, and data exploration. We highly recommend reading our earlier blog on [hybrid search internal functioning](https://opensearch.org/blog/hybrid-search/) and consider it as a prerequisite for this blog.

OpenSearch has been continuously enhancing its Hybrid query capabilities and performance by introducing features like post-filters, aggregations, query parallelization. However, we identified a gap in the hybrid query capability where it did not support sorting of the search results based on custom sort conditions. To overcome this, in OpenSearch 2.16, we introduced new feature of "sorting" in hybrid queries for applications that need to sort hybrid query results based on specific fields or attributes, providing a more flexible and powerful way to enhance the relevance and usability of hybrid queries.

In this blog, we will first understand the query execution workflow, followed by internal functioning of this sorting in hybrid queries and then learn how to leverage this feature in a query. 

## Overview of Query Execution Workflow

At a high level, query execution workflow is divided into two major phases: query phase and fetch phase. The query phase is responsible for obtaining matching results from each shard in the form of objects that contain the document IDs and relevancy score. These results are then sent to the fetch phase, where the source of these document IDs are fetched from the shards. Later, the results from each shard are combined to form the final search response, which is sent to the user. To learn more about the execution process, check out our earlier blog on [query's journey in OpenSearch](https://opensearch.org/blog/a-query-or-there-and-back-again/). 

## High-Level Logic and Example of Sorting in Hybrid query

Typically, in a hybrid query, subquery results are retrieved based on their relevancy scores. The top-scoring documents from each shard are then combined to form the final result. This process prioritizes relevance over other sorting criteria.

To enable sorting within this process, we enhanced the hybrid query logic. Now, the individual subquery results are retrieved based on the specified sort criteria. These individual sorted subquery results are combined at the coordinator level, ensuring the final result reflects the user’s chosen order, not the relevancy scores.

The following example helps to demonstrate the sorting workflow in a hybrid query, accompanied by a diagram. In this scenario, user triggers a hybrid query with two subqueries: match and term, and seek search results to be ordered by stock price in descending order.

The hybrid query internally executes the match and term query individually, and cater the search results respectively based on the specified score criteria (stock price in this case). Unlike traditional sorting, where the search results are purely based on sort criteria and does not cater relevancy score, the hybrid query also caters relevancy score with the sort fields to use it in the normalization process. Following this, the search results from all the subqueries are combined at the coordinator level to form the final shard result. This ensures that the final output adheres to the user’s requested sorting, prioritizing stock prices in descending order.

Below is the diagram showing the flow of the query phase and how the final shard result is created based on sorting criteria.

![hybrid-query-with-sorting](/assets/media/blog-images/2024-10-08-internal-functioning-of-sorting-in-hybrid-search/Hybrid-query-with-sorting.png)

## Detailed overview of Sorting in Hybrid Query 

Building on the high-level logic discussed earlier, let’s now explore the detailed overview of sorting in a hybrid query. At high level, the process can be broken down into two key sub-problems:

1. Sort the individual subquery results at shard level.
2. Combine the multiple subqueries results as per the sort criteria at the coordinator node.

The following diagram explains at a high level on how these sub-problems are solved. The coordinator node sends the requests to the data nodes to retrieve query results from the shards. Internally, during the execution of the query phase, the following process occurs:

* The collector executes on each shard to collect results for each subquery. While collecting, it also inserts the matching result into a priority queue, which is ordered according to the sorting criteria.
* In the post process of the query phase, the subquery results are popped from the priority queue in the sorted order.

Once coordinator node receives the response from all the data nodes, then the normalization process begins. The normalization processor calculates a score for each subquery result. Then, it combines different subqueries results to form a final sorted list of results, as per the sort criteria. The results from the normalization phase are then sent to the fetch phase, which fetches the source of the document ids from the shards and create the final search response to be returned to the user. 

![sorting-hld](/assets/media/blog-images/2024-10-08-internal-functioning-of-sorting-in-hybrid-search/Sorting-hld.png)

## Restrictions for sorting in hybrid query

Certain restrictions apply to sorting in hybrid queries due to the complexity in its formation of the search result. The following points outline these restrictions in detail.

1. If a user applies sorting criteria that include multiple fields and one of them is _score, we need to block this case. This is because the subquery results can only be combined based on either the sort field or _score , but not both simultaneously.

```json
{
  "sort": [
    {
      "foo": {
        "order": "desc"
      }
    },
    {
      "_score": {
        "order": "asc"
      }
    }
  ]
}
```

2. According to the OpenSearch architecture, when a user applies sorting criteria and sets `track_scores=true` in the search request, the scores are calculated during the fetch phase. This needs to be blocked in hybrid queries. In hybrid query implementation, scores are initially calculated in the query phase and later normalized by the normalization processor. Setting `track_scores=true` triggers a recalculation of scores during sorting, which can lead to incorrect results. This is because the recalculated score will not be the normalized score, as the normalization processor operates between the query and fetch phases.

## How to use sorting

To use sorting, the user must add a sort clause to the the query in the search request. In this clause, you define the sorting criteria as shown in the example below:

```json
{
  "query":{
      "hybrid":{
         "queries":[
            {
             "match": {
                "title": "wind"
             }
            },
            {
             "knn":{
                "location":{
                   "vector":[5,4],
                   "k":3
                }
             }
            }
         ]
      }
 },
 "sort":[
     {
      "foo":{
         "order":"desc"
      }
     } 
 ]
}
```
We have provided a detailed [example](https://opensearch.org/docs/latest/search-plugins/hybrid-search/#using-sorting-with-a-hybrid-query) of how to use this feature in the hybrid query documentation. We recommend reading it for a more comprehensive understanding.

## Wrapping up

In summary, we explored the internal functioning of sorting in hybrid queries and learned how it effectively sorts the individual subquery results, combining them based of sorting criteria. However, certain restrictions, such as setting `track_scores = true` and sorting by `_score` with other fields, apply due to the way sorting operates in OpenSearch. We also learned how users can leverage this feature to enhance the relevance and usability of hybrid queries. More such interesting features, like explainability and pagination, will soon be released to make hybrid query more flexible and powerful.

## Sources

* https://opensearch.org/docs/latest/search-plugins/searching-data/sort/
* https://opensearch.org/docs/latest/search-plugins/hybrid-search/

