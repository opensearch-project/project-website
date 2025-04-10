---
layout: post
title:  "Navigating pagination in hybrid queries with pagination_depth"
authors:
- varunudr
- minalsha
- kolchfa
date: 2025-04-19
categories:
  - technical-posts
meta_keywords: hybrid queries, semantic search, lexical search, search relevance, query execution workflow, OpenSearch hybrid search, Pagination
meta_description: Explore how pagination works in hybrid queries by leveraging pagination_depth to efficiently paginate over the result set.
---

Since the introduction of hybrid query in OpenSearch 2.10, it has become increasingly popular among customers who want to improve the relevance of their semantic search results. Hybrid queries combine full-text lexical search and semantic search to provide better results than either method alone for a wide variety of applications in e-commerce, document search, log analytics, and data exploration. Our earlier blog “[Improve search relevance with hybrid search](https://opensearch.org/blog/hybrid-search/)” introduces hybrid search and presents quality and performance results.

OpenSearch has been continuously enhancing its Hybrid query capabilities and performance with powerful features like post-filters, aggregations, query parallelization, explain and sorting. Building on this momentum, OpenSearch 2.19 brings another significant advancement by introducing pagination support through the new 'pagination_depth' parameter. When used in conjunction with traditional from and size parameters, this enhancement enables users to efficiently navigate through hybrid query result sets. For example, in browsing scenarios, users can paginate through thousands of search results without being overwhelmed by too many options at once.

In this blog, we will first learn about what is pagination and  pagination_depth. Later, we will walk through why do we need it in context of hybrid query for enabling pagination feature. Then we will show how to use this feature in a query and finally assess the benchmarking results.

## What is pagination?
OpenSearch uses pagination to divide large result sets into smaller, manageable pages. Each page contains the number of search results equal to the size parameter value sent in the search request. In a nutshell, OpenSearch supports four different types of pagination techniques: the from and size parameters, the scroll search operation, the search_after parameter, and point in time with search_after. To know more about them, please checkout the [OpenSearch documentation](https://opensearch.org/docs/latest/search-plugins/searching-data/paginate/).

In this blog, we will dive deeply into the `from` and `size` parameters technique by leveraging `pagination_depth` parameter in hybrid query.

## What is pagination_depth?
The pagination_depth parameter lets users specify the maximum number of search results to retrieve from each shard for every subquery. This enables precise control over the number of results to hybridize for each subquery.

The figure below illustrates an index with three shards. The user sends a hybrid query search request that includes two subqueries under the hybrid clause: a match query and a k-NN query. The request also specifies `pagination_depth = 20`, `size = 10`, and `from = 5`.

![pagintion-depth](/assets/media/blog-images/2025-04-19-navigating-pagination-with-hybrid-query/pagination-depth.png){:class="img-centered"}

1. User has set pagination_depth = 20, meaning that a maximum of 20 results will be retrieved for both the match query and the k-NN query individually from each shard. (For this example, we assume that each shard contains at least 20 results for each query.)
2. The coordinator node will receive a total of 120 results (60 for match query and 60 for k-nn query). These results are then sent for hybridization (which includes normalization and score combination).
3. During hybridization, any duplicate results appearing in both subqueries will be merged. That is, out of the 120 results (match + k-NN), duplicate entries will be combined into a single result.
4. The final search results will contain the hybridized results, which are then trimmed to size = 10 and start from the 5th entry, as specified by from = 5.

This process ensures that Hybrid Search efficiently merges and ranks results from multiple subqueries while respecting pagination constraints.

## Why do we need pagination_depth for applying pagination with traditional from and size?
In traditional queries like match, term etc, pagination is applied using the from + size formula to determine the maximum number of search results retrieved from each shard. However, when applying the same formula to Hybrid Search, several challenges arise, impacting the ground truth of the search results. Ground truth refers to information provided by direct observation rather than inference, though in practice it often represents the best available test or benchmark under reasonable conditions. It serves as a foundation for validating data accuracy, where the information can come from direct customer feedback, human labels, or the best available testing methods even when the classifications may be imperfect.

Lets understand with the help of following example. A user sent the hybrid query search request with the following parameters from =0 and size = 3. The search request contains two subqueries under the hybrid clause: the match query and the k-nn query. The normalization processor is configured to add more weight to match query than k-nn query i.e 0.7 and 0.3 respectively.

![higher-weightage](/assets/media/blog-images/2025-04-19-navigating-pagination-with-hybrid-query/higher-weightage.png){:class="img-centered"}

### Why ground truth changes by using formula of from + size ?
Modifying from or size values increases the number of results retrieved for each subquery from a shard, as determined by the from + size formula. However, instead of being appended to the last page, these new results tend to appear earlier in the ranked list, altering the ground truth on which the user intends to paginate. This issue occurs in two key scenarios:

1. Impact of Higher Weightage Subqueries
    1. If a subquery with higher weightage introduces new results, they may receive higher rankings after the score combination process.
    2. As a result, these new entries may appear earlier in the final result set—either on the first few pages or somewhere in the middle—rather than at the end, disrupting the expected pagination order.

In continuation with the earlier example, when user increases the size = 4 the newer query 1 result docId 14 does not get added on the last page of the hybrid search response. Instead, it becomes the top 4th document due to higher weight of query 1 during normalization.

![more-weightage](/assets/media/blog-images/2025-04-19-navigating-pagination-with-hybrid-query/more-weightage.png){:class="img-centered"}

2. Impact of Duplicate Results
    1. Newly retrieved results can become duplicates, meaning they exist in both subquery results.
    2. After the score combination process, the combined score of a duplicate entry increases, making it more relevant.
    3. If both subqueries have equal weightage, the duplicate result will rank higher, shifting its position earlier in the search results rather than appearing where the user expects it.

In the following diagram, docId 0 and 12 are the duplicate results that are part of both match and k-nn subqueries. The hybrid score of duplicate documents are generally higher than the single occurrence documents. Therefore, the duplicate documents will appear higher in the single occurrence documents in the search response and it will break the consistent pagination experience.

![duplicate-results](/assets/media/blog-images/2025-04-19-navigating-pagination-with-hybrid-query/duplicate-results.png){:class="img-centered"}

### Addressing the ground truth problem
To prevent changes in the ground truth, `pagination_depth` parameter is introduced. It ensures a consistent number of results are retrieved per shard. This adjustment eliminates dependency on from and size during result retrieval, ensuring that the same set of search results is always returned. The from and size parameters are then applied after hybridization to trim the results and determine how many should be displayed on each page.

#### Key Takeaway
* Maintaining the same `pagination_depth` while navigating between pages (by modifying `from` and `size`) helps maintaining consistent search results.
* If `pagination_depth` is changed while paginating, the search results will become inconsistent.

By implementing `pagination_depth`, Hybrid Search ensures stable and consistent pagination, preserving the integrity of ranked search results across multiple pages.

In the earlier example, to address the ground truth issue user sends `pagination_depth = 5` in the search request. Match query and k-nn query will return up to 5 results from an individual shard to the coordinator node to hybridize the subqueries results. The `from` and `size` parameters will trim the hybrid search response as per the user requirement.

![ground-truth-problem-addressing](/assets/media/blog-images/2025-04-19-navigating-pagination-with-hybrid-query/ground-truth-problem-addressing.png){:class="img-centered"}

## How to apply pagination by using from, size and pagination_depth?
To navigate between pages, user have to provide `pagination_depth` under the hybrid query clause. Following example has `pagination_depth = 10`, `from = 0` and `size = 5`.  (Please note: We have also provided a detailed explanation of the above example in the official [documentation](https://opensearch.org/docs/latest/vector-search/ai-search/hybrid-search/pagination/). We recommend reading it for a more comprehensive understanding.

```json
GET /my-nlp-index/_search?search_pipeline=nlp-search-pipeline
{
  "from": 0,
  "size": 5,
  "query": {
    "hybrid": {
      "pagination_depth": 10,
      "queries": [
        {
          "term": {
            "category": "permission"
          }
        },
        {
          "bool": {
            "should": [
              {
                "term": {
                  "category": "editor"
                }
              },
              {
                "term": {
                  "category": "statement"
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

## Impact on Performance
The goal of the benchmarking is to assess how different values of `pagination_depth` affect cpu utilization and latency. We conducted benchmarking by using the [noaa_semantic_search](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/noaa_semantic_search)) dataset present in [opensearch-benchmark-workloads](https://github.com/opensearch-project/opensearch-benchmark-workloads) to evaluate the impact on performance.

### Benchmarking scenarios
1. `pagination_depth = 50` when `from = 100` and `size = 100`. (Returns 2nd page of the search result where each page contains 100 results by using pagination_depth = 50 to capture the shard results).
2. `pagination_depth = 100` when `from = 100` and `size = 100`. (Returns 2nd page of the search result where each page contains 100 results by using pagination_depth = 100 to capture the shard results).
3. `pagination_depth = 500` when `from = 100` and `size = 100`. (Returns 2nd page of the search result where each page contains 100 results by using pagination_depth = 500 to capture the shard results).
4. `pagination_depth = 1000` when `from = 100` and `size = 100`. (Returns 2nd page of the search result where each page contains 100 results by using pagination_depth = 1000 to capture the shard results).
5. `pagination_depth = 5000` when `from = 100` and `size = 100`. (Returns 2nd page of the search result where each page contains 100 results by using pagination_depth = 5000 to capture the shard results).
6. `pagination_depth = 10000` when `from = 100` and `size = 100`. (Returns 2nd page of the search result where each page contains 100 results by using pagination_depth = 10000 to capture the shard results).

### Different query shapes used during benchmarking
At high level, two different types of queries are used.

1. hybrid query that contains 3 subqueries: term, range and date
2. metric aggregation when applied with hybrid query that contains 3 subqueries: term, range and date

The query shapes used for benchmarking can be found in [hybrid_search.json](https://github.com/opensearch-project/opensearch-benchmark-workloads/blob/main/noaa_semantic_search/operations/hybrid_search.json). The procedure used for benchmarking is [hybrid-query-aggs-light](https://github.com/opensearch-project/opensearch-benchmark-workloads/blob/main/noaa_semantic_search/test_procedures/hybrid_search.json#L2).

### Graphs
Index contains 134 million documents when noaa_semantic_search dataset is indexed four times.

#### Hybrid query containing three BM25 subqueries: term, range and date
![Performance-graph-of-hybrid-query-with-pagination](/assets/media/blog-images/2025-04-19-navigating-pagination-with-hybrid-query/Performance-graph-of-hybrid-query-with-pagination.png){:class="img-centered"}

#### Metric aggregation with hybrid query containing BM25 three subqueries: term, range and date
![metric-aggregation-performance-graph](/assets/media/blog-images/2025-04-19-navigating-pagination-with-hybrid-query/metric-aggregation-performance-graph.png){:class="img-centered"}

#### CPU Utilization
![cpu-utilization](/assets/media/blog-images/2025-04-19-navigating-pagination-with-hybrid-query/cpu-utilization.png){:class="img-centered"}

#### Conclusion
As evident from the graphs, there are no significant spikes in latencies or CPU utilization. The p50, p90, p99, p100 latency metrics and CPU utilization consistently increases when increasing the pagination depth. 

## Best practices for applying `pagination_depth` with hybrid queries

The benchmarking results from the previous section indicate no significant regression when fetching the second page, even with the highest `pagination_depth` value of 10,000. However, as pagination depth increases, both latency and CPU utilization tend to rise. To optimize performance, consider the following recommendations.

### Optimizing `pagination_depth` based on Data Distribution

Efficient pagination depends on how evenly data is distributed across shards. The distribution of the data can be checked by using _cat/shards api. If the documents are equally distributed amongst shards, then even a smaller `pagination_depth` can yield a higher number of hybridized search results per subquery.
For example, in our earlier discussion:

* With `pagination_depth = 20`, users can hybridize up to 60 results per subquery across three shards.
* This assumes each shard contains at least 20 results per subquery, meaning data is evenly distributed.
* If no result entries are common between subqueries, the final result count would be 120, allowing users to paginate through 120 hybridized search results.

### Considerations with Uneven Data Distribution

If data is not equally distributed across shards due to custom routing to specific shards, the following scenarios may occur:
the shard does not contain any relevant results, it will return zero results, reducing the total number of hybridized results.

### Some shards may contain all the relevant results

If a shard contains more than 20 results per subquery, it can still return only 20 results (based on `pagination_depth`).

As a result, the coordinator node will receive fewer results for hybridization, reducing the final search result size.

### Key Recommendations

* Avoid deep pagination: Hybrid Search is designed to return the most relevant results, not to perform exhaustive pagination. If deep pagination is required, consider using traditional search like bool, match.
* Distribute data evenly: Proper shard balancing during indexing ensures better query efficiency and reduces the need for excessively high `pagination_depth` values.

By following these best practices, users can optimize Hybrid Search for efficiency, ensuring high relevance while maintaining performance.

## Limitations
While navigating between pages, users may encounter following exception: “Reached end of search results. Increase `pagination_depth` value to see more results.”

As discussed in the Key Takeaway section, maintaining a consistent `pagination_depth` while paginating ensures stable and predictable search results. However, this also means that the user is paginating within a fixed final search result set. Once the user reaches the last page of the available search results corresponding to the specified `pagination_depth`, system will trigger an exception indicating that the end of the search results has been reached. This indicates that user has exhausted the search results for the given `pagination_depth`. To retrieve additional results beyond this limit, user must increase the `pagination_depth`, effectively expanding the search reference by including more results in the final result set.

## Wrapping Up
In this discussion, we explored the need for pagination_depth and how it resolves the changing ground truth issue associated with pagination using the `from` and `size` parameters. We also examined the performance impact of `pagination_depth` on retrieving the top pages of the final search result. However, applying pagination to retrieve a higher number of pages can degrade search performance, as it increases both computation time and cost. To address this, we reviewed best practices for applying `pagination_depth` to ensure optimal results in Hybrid Search. More features like [inner_hits](https://github.com/opensearch-project/neural-search/issues/718), [collapse](https://github.com/opensearch-project/neural-search/issues/665), [filters](https://github.com/opensearch-project/neural-search/issues/282) will soon be introduced to make Hybrid Queries even more flexible and powerful.
