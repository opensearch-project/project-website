---
layout: post
title:  "Building effective hybrid Search in OpenSearch: Techniques and best practices"
authors:
  - kazabdu
  - seanzheng
  - kolchfa
date: 2025-04-11
has_science_table: true
categories:
  - technical-posts
meta_keywords: z-score normalization, OpenSearch, neural search plugin, hybrid search, relevance ranking, search normalization, k-nn search, min-max normalization, how reciprocal rank fusion works
meta_description: Learn about lexical, semantic, and hybrid search in OpenSearch. Discover how hybrid search merges results from multiple query sources for improved relevance.
---

In the evolving world of search technology, OpenSearch provides a wide range of capabilities to support modern search needs. It starts with traditional keyword-based techniques, like lexical search using BM25 (Best Matching 25), and expands to more advanced methods like semantic and hybrid search. BM25 remains a reliable and efficient choice for many applications that rely on keyword relevance. Semantic search builds on this by using machine learning to capture meaning beyond keywords. Advanced hybrid techniques combine lexical and semantic approaches, using normalization methods like score-based and rank-based algorithms to balance and integrate scores from different search methods. These techniques progressively enhance search relevance and flexibility, catering to diverse search requirements in modern applications.

In this blog post, we'll explore each of these techniques---lexical, semantic, and hybrid---and deep dive into how hybrid search works in OpenSearch.

## Comparing lexical and semantic search

Lexical and semantic search use different techniques to retrieve relevant documents. Here's how they compare.

### Lexical (BM25) search

BM25 is a probabilistic scoring algorithm used by default in OpenSearch. It's part of the standard full-text search capabilities and is used in queries like `multi_match`, `range`, and `term`. BM25 supports field-level boosting and flexible matching, making it a versatile choice for many applications---from e-commerce product search to document retrieval.

#### Example request

The following request searches for `the martian` in the `title` field:

```json
GET /bookstore_catalog/_search
{
  "query": {
    "match": {
      "title": "the martian"
    }
  }
}
```

### Semantic search

Semantic search in OpenSearch introduces machine learning and natural language processing to enhance search results. It uses dense vector embeddings to represent both documents and queries in a high-dimensional space. These embeddings capture the semantic meaning of the text, allowing the system to go beyond exact keyword matching.

Text embeddings are generated using large language models (LLMs) trained on large datasets. In OpenSearch, embeddings are stored as dense vector fields and searched using k-nearest neighbor (k-NN) algorithms. At search time, your query is also transformed into an embedding, and OpenSearch finds documents containing vectors closest to the query vector using similarity metrics like inner product or cosine similarity.

#### Example request

The following request retrieves documents with embeddings most similar to the query `science fiction`:

```json
GET /bookstore_catalog/_search
{
  "_source": {
    "excludes": [
      "passage_embedding"
    ]
  },
  "query": {
    "neural": {
      "title_embedding": {
        "query_text": "science fiction",
        "k": 100
      }
    }
  }
}
```

This query uses the following parameters:

- `title_embedding`: The dense vector field that contains embeddings of document titles.
- `query_text`: The input query to be converted into an embedding.
- `k`: The number of nearest neighbors to retrieve.

### Summary

Lexical search methods like BM25 offer fast and accurate keyword matching but do not capture the meaning or context of the query. Semantic search, on the other hand, excels at understanding intent and natural language, but may miss important keywords---especially in fact-based searches.

As more use cases demand both keyword precision and semantic understanding, especially in applications using generative AI, hybrid search becomes essential. OpenSearch's hybrid search combines the strengths of both approaches to improve relevance and flexibility.

## Hybrid search: Combining lexical and semantic search

Hybrid search integrates results from multiple search methods, such as BM25 for keyword matching and vector search for semantic understanding, to provide more comprehensive and accurate results. Because these methods produce scores on different scales, normalization helps bring them into a common range. This allows OpenSearch to fairly compare and combine them.

OpenSearch supports two main categories of normalization techniques:

- **Score-based normalization**: Directly manipulates the raw scores returned by search algorithms. These methods are useful when the actual score values carry meaningful information that should be preserved in some form. There are three types of score-based normalization techniques: min-max, L2, and z score (which will be released in OpenSearch 3.0).
- **Rank-based normalization**: Focus on the relative order of results. These methods are useful when merging results from different sources, where raw scores might use different scales and can't be compared directly. Rank-based normalization solves this by normalizing scores based on document rank, making it more reliable across algorithms with varying scoring systems.

In the next sections, we'll present [score-based normalization using the min-max technique](#hybrid-search-using-score-based-min-max-normalization) and [rank normalization using reciprocal rank fusion (RRF)](#hybrid-search-using-reciprocal-rank-fusion).

## Hybrid search using min-max normalization 

Min-max normalization scales individual subquery scores to a fixed range, typically [0, 1], while preserving their relative distribution. For example, BM25 scores don't have a fixed range, but after normalization, their values will fall within a range of 0 to 1.

The normalization formula is:

```r
normalized_score = (score - min_score) / (max_score - min_score)
```

where: 

- `score` is the original score from a subquery.
- `min_score` and `max_score` are the lowest and highest scores within that subquery's result set.

To use min-max normalization in OpenSearch, first define a search pipeline:

```json
PUT /_search/pipeline/min_max-search-pipeline
{
  "description": "Post processor for hybrid search",
  "phase_results_processors": [
    {
      "normalization-processor": {
        "normalization": {
          "technique": "min_max"
        },
        "combination": {
          "technique": "arithmetic_mean",
          "parameters": {
            "weights": [0.3, 0.7]
          }
        }
      }
    }
  ]
}
```

This pipeline applies min-max normalization to each subquery's results and combines them using a weighted arithmetic mean: 30% lexical, 70% semantic.

Then run a hybrid query using the pipeline:

```json
GET /bookstore_catalog/_search?search_pipeline=min_max-search-pipeline
{
  "query": {
    "hybrid": {
      "queries": [
        {
          "match": {
            "title": {
              "query": "science fiction"
            }
          }
        },
        {
          "neural": {
            "title_embedding": {
              "query_text": "science fiction",
              "model_id": "aVeif4oB5Vm0Tdw8zYO2",
              "k": 5
            }
          }
        }
      ]
    }
  }
}
```

This query uses:

- `hybrid`: OpenSearch's built-in hybrid query type
- `search_pipeline`: Applies the min-max normalization and weighted score combination

### How min-max normalization works

Min-max normalization works as follows:

1. OpenSearch runs both the `match` and `neural` queries.
1. The pipeline normalizes each result set using a min-max technique (in this example, min-max scaling).
1. Normalized scores are combined using a weighted average to produce the final score.

In this example, the final document scores are calculated as:  

```r
0.3 * normalized_BM25_score + 0.7 * normalized_neural_score
```

### When to use score-based normalization

Score normalization is useful in scenarios where you want fine-tuned control over how results from different methods are combined. Consider using it when:

- **You can calibrate or train weights**: If you have a reliable way to normalize scores (for example, using min-max or L2 norms) and **tune the weight of each retrieval method**, a linear score combination can slightly outperform rank fusion in relevance metrics.
- **You want to emphasize one method**: Score normalization allows you to explicitly emphasize the more reliable model for your use case. In a general document search, some queries might be answered mostly by keyword matching while others need semantic understanding. By adjusting weights (or using query-dependent logic), you can give BM25 or the neural model more influence when appropriate. 
- **You need precise control over merging (fewer false positives)**: A normalized linear combination gives you more control over how results merge, which can reduce the chance of a less relevant document being boosted solely because of one method. For example, if a semantic model returns a somewhat irrelevant result at a high rank, rank-based normalization (described in the next section) still makes this result high-scoring because of its rank. A score-based approach can mitigate this by yielding a lower normalized relevance score for that document (because this document might be scored at 0 by BM25, and the semantic score alone may not be enough to beat other combined scores). Thus, in a well-tuned hybrid system, score normalization can lead to a more precise top-10 ranking, because each document's final score reflects a balanced lexical and semantic relevance.


## Hybrid search using RRF

Rank-based techniques focus on a document's position in the result set, rather than its raw score. These techniques are especially useful when combining results from different retrieval methods whose scores aren't directly comparable. 

**RRF** is one such technique. It uses the rank of each document in individual query results to calculate a combined score, making it robust against mismatched scoring scales across methods like BM25 and semantic search.

Define the RRF search pipeline:

```json
PUT /_search/pipeline/rrf-pipeline
{
  "description": "Post processor for hybrid RRF search",
  "phase_results_processors": [
    {
      "score-ranker-processor": {
        "combination": {
          "technique": "rrf"
        }
      }
    }
  ]
}
```

Run the hybrid query:

```json
GET /bookstore_catalog/_search?search_pipeline=rrf-pipeline
{
  "query": {
    "hybrid": {
      "queries": [
        {
          "match": {
            "title": {
              "query": "science fiction"
            }
          }
        },
        {
          "neural": {
            "title_embedding": {
              "query_text": "science fiction",
              "model_id": "aVeif4oB5Vm0Tdw8zYO2",
              "k": 5
            }
          }
        }
      ]
    }
  }
}
```

This query uses:

- `hybrid`: Combines results from lexical and semantic search.
- `search_pipeline`: Applies the RRF combination logic to rank the final results.

### How RRF works

RRF works as follows:

1. **Sort documents by score**: Each query method sorts documents by score.
1. **Assign rank positions**: Documents are ranked based on their scores for each query.
1. **Compute the RRF score**: For each document, the RRF score is computed using the following formula:
    ```python
    rankScore(document_i) = sum((1/(k + query_1_rank), (1/(k + query_2_rank), ..., (1/(k + query_j_rank)))
    ```

    where:
    -  `k` is a rank constant 
    - `query_j_rank` represents the ranking of a document in a particular query method. 

1. **Add rank contributions**: Rank calculations are combined, and documents are sorted by decreasing rank score.
1. **Return the top results**: The highest-ranked documents are retrieved based on the query size.

### When to use rank based normalization

Consider using rank based in the following situations:

- **Heterogeneous score distributions**: Rank fusion (especially RRF) excels when BM25 and semantic models produce scores on incompatible scales or with outliers. It avoids complex score calibration by using result ranks only. This yields *stable rankings* even if one query method’s scores would otherwise dominate after normalization.
- **No tuning or calibration needed**: RRF is an out-of-the-box method: it requires no pre-training, weight tuning, or knowledge of score ranges. In general-purpose search systems (with diverse queries and content), it's often impractical to hand-tune weighting for every scenario. Rank fusion is a robust default when labeled data for calibration is unavailable.
* **Resilient to outliers and domain shifts**: Because RRF ignores absolute score magnitude, an extreme-scoring outlier won't skew the results. This is useful in general collections, in which some queries or documents might produce anomalously high scores using one model. Similarly, if the data distribution or query mix changes over time, RRF remains stable without needing recalibration because it uses relative rank positions.
* **Adaptable to changing environments:** When the nature of queries and/or data evolves over time, score-based methods often require continuous fine-tuning of weights to maintain high relevancy. RRF eliminates this need for ongoing maintenance because it relies on relative rankings rather than absolute scores. This makes it particularly valuable in dynamic environments where constant recalibration is resource-intensive or impractical.

## Conclusion

Search in OpenSearch has evolved to meet a wide range of needs, from precise keyword matching with BM25 to deep contextual retrieval with semantic models. Hybrid search brings these strengths together, offering a flexible, powerful approach to information retrieval. By combining lexical and semantic methods, it balances relevance, recall, and ranking stability.

When implementing hybrid search, use the following **best practices**:

- **Data and query types**: Choose techniques based on how structured, sparse, or domain-specific your content and queries are.
- **Performance requirements**: Consider the trade-offs between search accuracy and computational resources, especially for large-scale applications.
- **Tuning and testing**: Carefully tune and test each technique to achieve optimal results for your specific use case.
- **Scalability**: As your data grows, ensure your chosen search strategy can scale effectively.

## What's next?

As machine learning and natural language processing continue to evolve, OpenSearch will keep expanding its hybrid and semantic search capabilities by offering improved model integration, fine-tuned ranking, and better support for real-world use cases.

By understanding how each search method works and when to use it you can build smarter, more relevant, and more responsive search experiences.
