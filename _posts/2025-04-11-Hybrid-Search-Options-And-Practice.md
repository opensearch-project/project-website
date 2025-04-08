---
layout: post
title:  Hybrid Search with OpenSearch: Options and Practice
authors:
  - kazabdu
  - xiaoyu
date: 2025-04-08
has_science_table: true
categories:
  - technical-posts
meta_keywords: z-score normalization, OpenSearch, neural search plugin, hybrid search, relevance ranking, search normalization, k-nn search, min-max normalization, how reciprocal rank fusion works
meta_description: Learn about different searches in OpenSearch. Discover how hybrid search merges results from multiple query sources for improved relevance.
---

In the evolving world of search technology, OpenSearch stands out with its powerful search capabilities. OpenSearch offers a range of search techniques, starting with basic lexical search using BM25 (Best Matching 25), which excels at keyword-based retrieval and remains a cornerstone of many search applications. The evolution continues with semantic search, which leverages dense vector embeddings to capture the semantic meaning beyond keywords. Advanced hybrid techniques combine lexical and semantic approaches, using normalization methods like score-based and rank-based algorithms to balance and integrate scores from different search methods. These techniques progressively enhance search relevance and flexibility, catering to diverse search requirements in modern applications. This blog post will guide you through this series of search techniques, from BM25 to hybrid search and provide an overview of how Hybrid Search works in OpenSearch.


### 1. Lexical Search vs Semantic Search

#### Lexical Search (BM25) 

BM25 (Best Matching 25) is a probabilistic retrieval framework used as the default scoring algorithm in many search engines, including OpenSearch. In OpenSearch, BM25 is implemented as part of the standard full-text search capabilities. It can be easily applied across multiple fields using the multi match, range or term queries allowing for field-specific boosting and flexible matching criteria. This makes it a versatile choice for a wide range of search applications, from e-commerce product searches to document retrieval systems.

API Request:


```
GET /bookstore_catalog/_search
{
  "query": {
    "match": {
      "title": "the martian"
    }
  }
}
```



#### Semantic Search


Semantic search in OpenSearch represents a significant advancement in search technology, leveraging the power of machine learning and natural language processing. This approach uses dense vector embeddings to represent both documents and queries in a high-dimensional space, allowing for semantic similarity comparisons that go beyond simple keyword matching. At the core of semantic search is the concept of text embeddings - dense vector representations of text that capture semantic meaning. These embeddings are typically generated using large language models trained on vast corpora of text. In OpenSearch, these embeddings are stored as dense vector fields and can be efficiently searched using k nearest neighbor algorithms. At search time, the user's query is similarly transformed into a vector embedding. The system then finds documents whose vector representations are closest to the query vector, typically using cosine similarity or Euclidean distance.

API Request:


```
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

This query uses:

* `title_embedding`: The query vector of the field title.
* `k`: Number of nearest neighbors to retrieve

In summary, lexical search algorithms like BM25 provide precise keyword matching. They are fast and efficient but do not incorporate semantic meaning. On the other hand, semantic search understands meaning and context, handling natural language queries well. However, it may miss important keywords, especially for fact-based queries. As we enter the era of Generative AI, an increasing number of use cases require both keyword matching and semantic understanding. Hybrid search is OpenSearch's solution to address this need, combining the strengths of both approaches.

### 2. Hybrid Search: Solving the Problem and Options

Hybrid search often involves combining scores from different search methods (e.g., BM25 for keyword search and semantics for vector search). However, these scores can have vastly different scales and distributions. Normalization helps to bring these scores into a common range, allowing for fair comparison and combination. OpenSearch offers various normalization techniques that can be broadly categorized into two main types: Score-based and Rank-based. Let's explore these categories and their specific techniques in detail.

Score-based techniques directly manipulate the raw scores returned by search algorithms. These methods are useful when the actual score values carry meaningful information that should be preserved in some form. There are 3 different types of score based normalization technique: Min max, L2 and z_score (will be released in 3.0-beta1). In this section, we would talk about min max normalization.

#### Hybrid Search with Min-Max Normalization Technique

Min-Max normalization scales scores to a fixed range, typically [0, 1], preserving the relative distribution of scores.

`normalized_score = (score - min_score) / (max_score - min_score)`

First, we need to define a search pipeline for min-max normalization:

API Request:

```
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
            "weights": [
              0.3,
              0.7
            ]
          }
        }
      }
    }
  ]
}
```

Use the same search pipeline with the search request

```
GET /bookstore_catalog/_search?search_pipeline=min_max-search-pipeline
{
  "_source": {
    "exclude": [
      "title_embedding"
    ]
  },
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

* `hybrid`: OpenSearch's built-in hybrid query type
* `search_pipeline`: Applies the min-max normalization and score combination


How it works:

1. OpenSearch executes both the `match` and `neural` queries.
2. The `min_max-search-pipeline` normalizes scores using min-max scaling.
3. Normalized scores are combined using a weighted arithmetic mean (30% lexical, 70% neural in this case which were defined in the search pipeline).


**When to use score normalization:**

* **When You Can Calibrate or Train Weights:** If you have a reliable way to normalize scores (e.g. using min-max or L2 norms) and **tune the weight of each retrieval method**, a linear score combination can slightly outperform rank fusion in relevance metrics
* **Emphasizing a Superior Signal:** Score normalization allows you to explicitly emphasize the more reliable model for your use case. In a general document search, some queries might be answered mostly by keyword matching while others need semantic understanding. By adjusting weights (or using query-dependent logic), you can give BM25 or the neural model more influence when appropriate. 
* **Controlled Merging (Fewer False Positives):** A normalized linear combination gives more continuous control over how results merge, which can reduce the chance of a less relevant document being boosted solely due to one method. For instance, if a semantic model returns a somewhat off-target result at a high rank, RRF would still elevate it because of its rank. A score-based approach can mitigate this by yielding a lower normalized relevance score for that document (since BM25 might give it 0, and the semantic score alone may not be enough to beat other combined scores). Thus, in a well-tuned hybrid system, score normalization can lead to a more precise top-10 ranking, as each document’s final score reflects a balance of both lexical and semantic relevance.



#### Hybrid Search with Reciprocal Rank Fusion 

Rank-based techniques focus on the position or rank of a document in the result set rather than its raw score. These methods are particularly useful when combining results from diverse sources where raw scores may not be directly comparable. RRF normalizes based on the rank of documents, making it robust to differences in scoring scales across different algorithms.


```
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



```
GET /bookstore_catalog/_search?search_pipeline=rrf-pipeline
{
  "_source": {
    "exclude": [
      "title_embedding"
    ]
  },
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

* `hybrid`: Combines lexical and semantic searches
* `search_pipeline`: Applies the RRF score combination


How RRF works:


1. **Sort documents by score**: Each query method sorts documents by score on every shard.
2. **Assign rank positions**: Documents are ranked based on score for each query.
3. **Apply the RRF formula**: The RRF score is computed using the following formula:

```
rankScore(document_i) = sum((1/(k + query_1_rank), (1/(k + query_2_rank), ..., (1/(k + query_j_rank)))

```

In this formula, `k` is a rank constant, and `query_j_rank` represents the ranking of a document in a particular query method. The example in the following diagram applies this formula using the default rank constant of 60.

1. **Add rank contributions**: Rank calculations are combined, and documents are sorted by decreasing rank score.
2. **Return the top results**: The highest-ranked documents are retrieved based on the query size.

**When to use Rank Fusion:**

* **Heterogeneous Score Distributions:** Rank fusion (especially RRF) excels when BM25 and semantic models produce scores on incompatible scales or with outliers. It avoids complex score calibration by using result ranks only. This yields *stable rankings* even if one query method’s scores would otherwise dominate after normalization.
* **No Tuning or Calibration Needed:** RRF is a *“plug & play”* method – it requires no pre-training, weight tuning, or knowledge of score ranges. In general-purpose search systems (with diverse queries and content), it’s often impractical to hand-tune weighting for every scenario. Rank fusion performs robustly out-of-the-box, making it a strong default when labeled data for calibration is unavailable
* **Robust to Outliers and Domain Shifts:** Because RRF ignores absolute score magnitude, an extreme scoring outlier won’t skew the results. This is useful in general collections where some queries or documents might produce anomalously high scores under one model. Similarly, if the data distribution or query mix changes over time, RRF remains stable without needing re-calibration, since it always works off relative rank positions

### Conclusion

The evolution of search techniques in OpenSearch demonstrates the platform's versatility and power in addressing diverse search requirements. While traditional lexical search methods like BM25 continue to provide fast and precise keyword matching, and semantic search offers deep contextual understanding, it is the hybrid search approach that truly revolutionizes information retrieval. Hybrid search in OpenSearch represents a powerful synthesis of these techniques, addressing the limitations of each individual method. 

#### Considerations for Implementation

* **Data Characteristics**: The nature of your data and typical user queries should guide your choice of search technique.
* **Performance Requirements**: Consider the trade-offs between search accuracy and computational resources, especially for large-scale applications.
* **Tuning and Optimization**: Each technique requires careful tuning and testing to achieve optimal results for specific use cases.
* **Scalability**: As your data grows, ensure your chosen search strategy can scale effectively.


#### Future Directions

As machine learning and natural language processing continue to advance, we can expect further innovations in search technology. OpenSearch is well-positioned to incorporate these advancements, potentially offering even more sophisticated hybrid search capabilities in the future.
By understanding and leveraging these various search techniques, developers and data scientists can create powerful, context-aware search experiences that significantly enhance user satisfaction and information discovery.
