# Introducing Common Filter Support for Hybrid Search Queries

Hybrid search in OpenSearch allows combining multiple queries (for example, a keyword query and a vector query) into one set of results ([Hybrid - OpenSearch Documentation](https://opensearch.org/docs/latest/query-dsl/compound/hybrid/#:~:text=You%20can%20use%20a%20hybrid,order%20to%20avoid%20duplicate%20computations)). Until now, applying a filter across all parts of a hybrid query meant duplicating the same filter in each sub-query. This was tedious and error-prone – if you wanted to restrict results to a certain category or date range, you had to add that filter to every sub-query by hand. In OpenSearch 3.0, a new common filter support for hybrid queries addresses this challenge. In this blog post, we’ll introduce common filters for hybrid search, explain how they work under the hood, and discuss why they’re useful for real-world search applications.

## The Challenge of Filtering in Hybrid Search

A hybrid query merges results from multiple sub-queries (e.g., a text match and a vector similarity). Previously, there was no simple way to specify a single filter for all these sub-queries. For example, imagine a search that combines a semantic vector search with a traditional keyword search, but only wants results where `category = "shoes"`. In OpenSearch 2.x, you would have to include the same term filter for `"category": "shoes"` inside each sub-query’s DSL. This led to duplicate filter clauses, making queries longer and harder to maintain. It also left room for mistakes if one sub-query missed the filter or used a slightly different filter logic.
One workaround was to use a **post_filter** on the overall hybrid results, but that had drawbacks. The `post_filter` clause in OpenSearch is applied after the search results are retrieved and scored ([Hybrid search with post-filtering - OpenSearch Documentation](https://opensearch.org/docs/latest/vector-search/ai-search/hybrid-search/post-filtering/#:~:text=The%20,the%20order%20of%20the%20results)). While post-filtering can remove unwanted documents from the final results, it doesn’t narrow down the search during query execution. In other words, the sub-queries would retrieve and score documents regardless of the filter, and only afterwards would the filter remove some. This means extra work is done scoring documents that ultimately get thrown out, and in the case of vector searches, some relevant results could be missed (for example, if you only retrieve the top k vectors globally and then filter, you might drop results that were just outside the top k because they didn’t meet the filter). Clearly, a better solution was needed to apply filters within hybrid queries themselves.

## What Is Common Filter Support for Hybrid Queries?

**Common filter support** is a new feature (introduced in OpenSearch 3.0) that lets you specify a single filter at the top level of a hybrid query. This filter is then applied to all sub-queries automatically. Instead of repeating the same filter clause for each sub-query, you include it once, and OpenSearch ensures every sub-query only considers documents that pass the common filter.
Here’s how you can use a common filter in a hybrid query. Suppose we have an e-commerce product search that combines a lexical match on product description with a vector similarity search on product embeddings. We want to restrict results to the “shoes” category. With common filter support, the query JSON would look like this:
```
POST /products/_search
{
  "query": {
    "hybrid": {
      "filter": {
        "term": { "category": "shoes" }
      },
      "queries": [
        { 
            "match": { "description": "running shoes" } 
            "filter" : {
                "term": {"category": "nike"}
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

The above query is equivalent to original query:

```
POST /products/_search
{
  "query": {
    "hybrid": {
      "queries": [
        { 
            "match": { "description": "running shoes" } 
            "filter" : {
                "term": {"category": "nike"},
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

We also support other types of filter as well:

```
POST /products/_search
{
  "query": {
    "hybrid": {
      "filter": {
        "range": {"field_name": {"gte": 10,"lte": 20}}
      },
      "queries": [
        { 
            "match": { "description": "running shoes" } 
            "filter" : {
                "term": {"category": "nike"}
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
In the above example, the top-level `filter (category: shoes)` is applied to both the `match` query and the `knn` vector query. The OpenSearch engine will ensure that **only documents in the "shoes" category are considered** by either sub-query. This dramatically simplifies the query logic for the user. You no longer need to wrap each sub-query in a bool with the same filter or duplicate the filter under multiple query clauses – the common filter does it for you.

## How It Works Under the Hood
When OpenSearch processes a hybrid query with a common filter, it effectively pushes that filter down into each sub-query at execution time. Internally, each sub-query is combined with the common filter using an AND logic. If a sub-query itself already has its own filter criteria, the common filter will be ANDed with those existing conditions (further narrowing the results of that sub-query). If the sub-query has no filter of its own, the engine will apply the common filter directly. In practice, this might be implemented by wrapping the sub-query in a boolean query with the filter, or by utilizing the filter capabilities of the sub-query type (for example, the k-NN engine can apply a pre-filter on documents before vector similarity search).
How a common filter `F` is applied to all sub-queries in a hybrid search query. The filter is distributed to each sub-query (Q1, Q2), ensuring that each individual query only searches within the filtered subset of documents before the results are combined.
![Image](https://github.com/user-attachments/assets/2ec88dfc-1997-436e-a8c0-2757a1d9e3f1)
By applying the filter at the sub-query level, OpenSearch ensures that each query is only searching through the permitted subset of documents from the start. The diagram above illustrates this process: a hybrid query with filter **F** sends **F** to each of its sub-queries (Q1, Q2). Each sub-query returns results that already satisfy **F**, and then those results are merged and ranked together. The final result set inherently respects the filter without any extra post-processing. This design means that filtering is done early, avoiding unnecessary computation on filtered-out items and preventing any loss of relevant results due to late-stage filtering.

## Real-World Use Case: Unified Filtering in E-commerce Searches
Consider an e-commerce website with a search feature that uses hybrid search to combine keyword and semantic vector queries. A user search for **“running shoes”** might use a traditional text match to find products with “running” or “shoes” in their descriptions, along with a vector similarity search to find products related to the concept of running (even if the exact words aren’t present). Without common filters, if the user also wants to filter by **category = Shoes** and **in_stock = true**, the application would have to inject those filters into both the keyword query and the vector query separately. This not only makes the query construction more complex, but it could also lead to inconsistent results if one of the sub-queries handled the filter differently.
With common filter support, the developer can specify those filters just once at the hybrid query level. For example, the query can ensure **only in-stock shoes** are considered by adding a common filter clause for` {"term": {"category": "shoes"}} `and `{"term": {"in_stock": true}}` alongside the sub-queries. All underlying search logic (whether lexical or vector-based) will automatically be constrained to in-stock shoes. The benefits in this use case are clear: it simplifies the search code and guarantees that no matter how many sub-query types are combined (perhaps textual title match, full-text description match, vector embedding match, etc.), they all respect the exact same filtering criteria. As a result, the user gets a coherent result list of running shoes that are in stock, powered by both keyword relevance and semantic relevance, without any stray results from other categories.

## Benefits and Improvements
Common filter support for hybrid queries brings several benefits over the previous approach:

* **Simpler Queries:** Query DSL becomes cleaner and easier to read. You write the filter once, reducing repetition. This makes maintaining search queries (or search templates) easier, especially as you add more sub-queries or change the filter criteria over time.
* **Consistency:** By centralizing the filter, you eliminate the risk of mismatched filters across sub-queries. There’s no chance that one sub-query misses a filter or uses a slightly different filter logic. The filtering is uniformly applied to all parts of the hybrid search.
* **Performance Efficiency:** Filtering earlier in the query execution can reduce the amount of data each sub-query needs to sift through. Each sub-query ignores documents that don’t meet the filter from the outset, which can save CPU and I/O. In contrast, using a post_filter might waste resources scoring documents only to throw them away later. For vector searches, pushing the filter down means you don’t fetch a bunch of nearest neighbors that you’ll later discard; the vector search can focus only on vectors from the filtered subset, potentially improving speed.
* **Result Accuracy:** Applying filters at the sub-query level also preserves the accuracy of hybrid scoring. If you were using post-filtering as a workaround, you might have encountered situations where the overall top results were filtered out, leaving fewer results or requiring fetching more results than needed. The common filter approach avoids this by ensuring that the scoring of each sub-query only considers valid candidates. This way, the combined ranking isn’t skewed by later filtering, and you won’t miss relevant items that happen to fall outside an unfiltered top-K selection.

## Summary
Overall, common filter support for hybrid search queries is a quality-of-life improvement for OpenSearch users building advanced search solutions. It provides a more intuitive way to constrain hybrid search results, aligning with how users expect filters to behave in multi-faceted searches. By reducing duplicated query logic and handling filtering in the engine, this feature makes it easier to build powerful hybrid search experiences—such as semantic e-commerce searches, multimedia searches, and more—while confidently applying global filters to meet your application needs. With OpenSearch 3.0, you can take advantage of this new capability and simplify your hybrid search queries without sacrificing performance or relevance.

## Whats next?
A new enhancement is under discussion to make common filters even more flexible. Currently, a hybrid query’s top-level common filter is always combined with each sub-query’s filter using a logical `AND` (that is, a document must satisfy both filters). [GitHub issue #1323](https://github.com/opensearch-project/neural-search/issues/1323) proposes adding two new modes: `OR` and `REPLACE`. These would let the common filter be applied in different ways with sub-query filters.

* **Logical OR:** Use `OR` logic to combine the common filter with a sub-query’s filter, so that documents matching either filter are returned. In other words, a hit needs to satisfy the common filter or the sub-query filter (not necessarily both).
* **Logical REPLACE:** Completely replace the sub-query’s filter with the common filter. In this mode, only the common filter is applied and the original sub-query filter is ignored.

This proposal (still in the design stage) would let users choose how common filters interact with individual query filters. If you’d like to see these options in a future release, please visit [GitHub issue #1323](https://github.com/opensearch-project/neural-search/issues/1323) in the neural-search repository and share your feedback (for example, by adding a 👍 reaction or a comment). Community input will help prioritize this enhancement and ensure it meets real-world needs.