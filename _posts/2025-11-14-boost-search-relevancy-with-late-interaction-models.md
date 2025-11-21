---
layout: post
title: "Boost search relevance with late interaction models"
authors:
  - mingshl
  - vigyas
  - navneev
  - iflorbri
date: 2025-11-14
categories:
  - technical-posts
meta_keywords: late interaction models, vector search, ColBERT, semantic search, multi-vector embeddings, multi-modal search
meta_description: Learn how late interaction models like ColBERT can improve search accuracy by preserving token-level information while maintaining efficiency in vector search systems.
---

Vector search has become the foundation of modern semantic search systems. Today's most common approach uses single vector embeddings. Recent state-of-the-art research has discovered that multi-vector representations created by late interaction models can significantly improve search accuracy by preserving fine-grained, token-level information. This blog post will explore what late interaction models are, why they're becoming increasingly important in search applications, and how they can benefit both users and search system developers.

## What is a late interaction model?

To understand late interaction models, it's helpful to first understand the spectrum of query-document interaction approaches in neural search.

Interaction is the process of evaluating the relevance between a query and a document by comparing their representations at a fine-grained level. Based on interactions, we explain three main types of interaction models as follows:

### Bi-Encoder models (no interaction)

The most common approach today uses bi-encoder models, which encode queries and documents completely independently. Imagine a search engine processing your query "best hiking trails near Seattle." A bi-encoder would pass this query through an encoder model to produce a single vector representation. Similarly, each document is independently encoded into its own single vector. These encodings happen in isolation—the query encoder never "sees" the document, and vice versa. Relevance is then determined by comparing these pre-computed single vectors using simple similarity metrics like cosine similarity or dot product. This approach is highly efficient because document vectors can be computed offline and stored, but it sacrifices accuracy because there's no interaction between query and document during the encoding process. No interaction models, such as `amazon.titan-embed-text-v2:0`, are great for fast first stage retrieval in vector search, especially for large datasets.

![Bi-Encoder Models](/assets/media/blog-images/2025-11-14-boost-search-relevancy-with-late-interaction-models/bi-encoders.png)
### Cross-Encoder models (early/full interaction)

At the opposite end of the spectrum are cross-encoder models, which achieve the highest accuracy by enabling full interaction between query and document. For our "best hiking trails near Seattle" query, a cross-encoder would concatenate the query with each candidate document and feed this combined text through a transformer model. The model's attention mechanism allows every query token to attend to every document token during encoding, capturing highly nuanced relationships between them. The model then outputs a single relevance score directly. While this deep interaction produces excellent results, it's computationally expensive—you cannot pre-compute anything, and each query-document pair requires a full forward pass through a large model. Early/Full interaction models are ideal for 'second phase' reranking, where you reorder a small, pre-ranked subset of results to ensure the best hits get to top slots. The result set fed to cross-encoders will depend on the cost, latency, and accuracy requirements of your system, but usually, these models are reserved for a small size of search hits on the first page. OpenSearch supports reranking with cross-encoder models in search pipelines.

![Cross-Encoder Models](/assets/media/blog-images/2025-11-14-boost-search-relevancy-with-late-interaction-models/cross encoders.png)
### Late interaction models (balanced approach)

Late interaction models like ColBERT (which stands for Contextualized Late Interaction over BERT) strike a balance between these two extremes. They process the query and document independently (like bi-encoders), but instead of producing single vectors, they generate multiple contextualized embeddings—typically one for each token. For our "best hiking trails near Seattle" query, the model creates individual embeddings for "best," "hiking," "trails," "near," and "Seattle," where each embedding is contextualized by the surrounding words. Similarly, documents are encoded into multi-vector representations at the token level. The key innovation is that the interaction between query and document happens after encoding, through fine-grained token-level similarity computations.

![Late Interaction Models](/assets/media/blog-images/2025-11-14-boost-search-relevancy-with-late-interaction-models/late interactions.png)
For example, ColBERT, a popular late interaction model, demonstrates this approach clearly. After generating contextualized token embeddings for both query and document, it calculates the maximum similarity between each query token embedding and all document token embeddings. These maximum similarities are then summed to produce a final relevance score. This "late interaction" preserves the efficiency benefits of independent encoding (document embeddings can be pre-computed) while enabling more granular and nuanced matching than simple single-vector comparison.

### The trade-off spectrum

* **Bi-encoders**: Most efficient, least accurate, no interaction
* **Late interaction models**: Balanced efficiency and accuracy, token-level interaction after encoding
* **Cross-encoders**: Most accurate, least efficient, full interaction during encoding

## Why use late interaction models in search?

Using late interaction models in search is driven by several compelling advantages:

**Enhanced Semantic Understanding**: Unlike traditional approaches that compress documents into single vectors, late interaction models preserve token-level information until the final matching stage. This enables precise token-level matching that single-vector models miss. For example, when searching "How can the orientation of texture be characterized?" in a multimodal document collection, a late interaction model like ColPali can identify specific sections within PDF pages that discuss texture orientation analysis, even when the exact phrase doesn't appear in the text. The model's token-level embeddings can match "orientation" with related concepts like "directional analysis" and "texture" with "surface patterns" at a granular level, then combine these matches for accurate document ranking. This granular approach is particularly valuable in specialized domains like scientific literature, technical documentation, or legal content where precision is critical.

**Optimal Efficiency-Accuracy Balance**: Late interaction models combine the efficiency of bi-encoders (pre-computed embeddings of documents) with accuracy approaching cross-encoders (early/full interactions).

**Multimodal Capabilities**: Recent advances like ColPali and ColQwen extend late interaction to images and other media through patch-level embeddings. This enables searches like "charts illustrating quarterly revenue" to pinpoint specific sections within PDFs—a capability difficult for traditional single-vector models.

## How to use the late interaction model in OpenSearch?

The prevailing pattern in the search industry leverages late interaction models through a two-phase search strategy that balances speed and accuracy. First, the system performs a fast approximate k-NN search using single-vector embeddings from a bi-encoder model to identify candidate documents from the larger corpus. This initial retrieval phase quickly narrows down the search space without the computational overhead of multi-vector processing. Then in the reranking phase, late interaction scoring uses multi-vectors to calculate precise token-level relevance for only the candidate set. The final results are documents ranked by these fine-grained similarity scores, capturing nuanced query-document relationships while maintaining high scalability.

OpenSearch 3.3 introduced native support for reranking through the `lateInteractionScore` function that calculates document relevance using token-level vector matching. It compares each query vector against all document vectors, finds the maximum similarity for each query vector, and sums these maximum scores to produce the final document score.

The following example demonstrates using the `lateInteractionScore` function with cosine similarity to measure vector similarity based on direction rather than distance. In this example, it compares vector similarity between the document vectors named `my_vector` and the query vectors under `params`, named `query_vectors`. To test the function with `lateInteractionScore`, you need multi-vectors generated offline in documents and multi-vectors computed online during the search for queries.

```json
GET my_index/_search
{
  "query": {
    "script_score": {
      "query": { "match_all": {} },
      "script": {
        "source": "lateInteractionScore(params.query_vectors, 'my_vector', params._source, params.space_type)",
        "params": {
          "query_vectors": [[[1.0, 0.0]], [[0.0, 1.0]]],
          "space_type": "cosinesimil"
        }
      }
    }
  }
}
```

OpenSearch supports the entire workflow for connecting late interaction models, using the model during ingestion, and search. The implementation requires configuring two key components: the ml-inference ingest processor, which generates both single-vector and multi-vector embeddings from text, PDFs, or images during document ingestion, and the ml-inference search request processor, which rewrites queries into k-NN queries with the `lateInteractionScore` function at search time. This configuration enables multimodal search with improved relevance across different content types. For detailed setup instructions, refer to the [tutorial on reranking with externally hosted late interaction models](https://opensearch.org/docs/latest/search-plugins/search-pipelines/rerank-processor/).

To demonstrate the search performance using late interaction models, the [ml-playground](https://ml.playground.opensearch.org/app/searchRelevance#/?config=eyJxdWVyeTEiOnsiaW5kZXgiOiJtdWx0aW1vZGFsX2RvY3MiLCJkc2xfcXVlcnkiOiJ7XG4gIFwicXVlcnlcIjoge1xuICAgIFwidGVybVwiOiB7XG4gICAgICBcImNvbHBhbGlfc2VhcmNoXCI6IHtcbiAgICAgICAgXCJ2YWx1ZVwiOiBcIiVTZWFyY2hUZXh0JVwiXG4gICAgICB9XG4gICAgfVxuICB9XG59Iiwic2VhcmNoX3BpcGVsaW5lIjoiY29scGFsaV9zZWFyY2gifSwicXVlcnkyIjp7ImluZGV4IjoibXVsdGltb2RhbF9kb2NzIiwiZHNsX3F1ZXJ5Ijoie1xuICBcInF1ZXJ5XCI6IHtcbiAgICBcInRlcm1cIjoge1xuICAgICAgXCJ0aXRhbl9lbWJlZGRpbmdfc2VhcmNoXCI6IHtcbiAgICAgICAgXCJ2YWx1ZVwiOiBcIiVTZWFyY2hUZXh0JVwiXG4gICAgICB9XG4gICAgfVxuICB9XG59Iiwic2VhcmNoX3BpcGVsaW5lIjoidGl0YW5fZW1iZWRkaW5nX3NlYXJjaCJ9LCJzZWFyY2giOiIgSG93IGNhbiB0aGUgb3JpZW50YXRpb24gb2YgdGV4dHVyZSBiZSBjaGFyYWN0ZXJpemVkPyJ9) provides a comparison using the [vidore dataset](https://huggingface.co/datasets/vidore/syntheticDocQA_artificial_intelligence_test). This dataset is from the internet with query about "artificial intelligence", and we include 20 pages in the ml-playground `multimodal_docs`index. You can compare search results between a two-phase approach using the [ColPali model](https://huggingface.co/vidore/colpali-v1.3-hf) for late interaction reranking compared to a single-phase baseline using `amazon.titan-embed-image-v1` with no interaction. Try different search queries to see how late interaction models improve relevance ranking for multimodal content.

![Late Interaction Models with ml-inference processors](/assets/media/blog-images/2025-11-14-boost-search-relevancy-with-late-interaction-models/auto-ml-inference-search-flow.png)

In the following test running against the query "How can the orientation of texture be characterized?" on the same index `multimodal_docs`, on the left side, it's using the `colpali_search` search pipeline and on the right side, it's using the `titan_embedding_search` search pipeline. The expected result is row 7 page, which tells us the answers about the orientation of texture is characterized by a histogram of orientations. This 'row 7 page' ranks no.1 when using the ColPali model (left panel), but is entirely missing in the search results when using the titan_embedding model (right panel).

![search comparison on ml-playground](/assets/media/blog-images/2025-11-14-boost-search-relevancy-with-late-interaction-models/playground-search-comparison.png)

Additionally, for RAG use cases with ColPali, please refer to the [OpenSearch AI demo app](https://huggingface.co/spaces/opensearch-project/OpenSearch-AI) available through Hugging Face.

## Challenges and optimization techniques

While late interaction models offer significant advantages, they come with computational and storage challenges that need consideration. The primary challenge is the explosion in storage requirements and computational cost, as these models generate vectors for each token rather than one embedding per document, potentially creating hundreds or thousands of vectors per document and increasing storage requirements by 10-100x compared to traditional approaches. Recent research has developed several techniques to mitigate these challenges, including PLAID (Performance-optimized Late Interaction Driver) which uses centroids and clustering to reduce the number of vectors while maintaining accuracy, quantization techniques that compress multi-vectors using binary or product quantization to reduce memory footprint, smart chunking through strategic document segmentation before embedding generation, and selective token embedding that skips common stop words or uses attention mechanisms to identify the most important tokens. These optimizations make late interaction models more practical for production deployments while preserving their core advantages of token-level semantic matching.

## Future work in Lucene and OpenSearch

OpenSearch Vector Engine (k-NN plugin) currently supports late interaction multi-vector rescoring using Painless scripting and the implementation is optimized for SIMD instructions. The current multi-vectors are integrated using the object field and float field type of OpenSearch.

Additionally, since the 10.3 release, Lucene also provides native support for rescoring results for a search query using late interaction model multi-vectors. This is enabled through the new `LateInteractionField`, which accepts `float[][]` multi-vector embeddings, encodes them to a binary representation, and indexes them as a `BinaryDocValues` field. The field supports multi-vectors with varying numbers of vectors per document, although each composing token vector is required to have the same number of dimensions. These are standard constraints across late interaction models, required to enable similarity comparisons across query and document multi-vectors.

Lucene exposes a `LateInteractionRescorer` class to rescore search results using multi-vector similarity on this field. Default support is for `sum(max(vectorSimilarity))`, which takes the sum of maximum similarity between a query token vector and all document token vectors. Essentially, it computes the interaction of a piece (token vector) of the query, with every piece (token vector) of the document, combining their similarity into a meaningful score.

As next steps, we are working on adding support for a multi-vector field in OpenSearch Vector Engine using Lucene's `LateInteractionField` (Ref: [1](https://github.com/opensearch-project/k-NN/issues/2934) [2](https://github.com/opensearch-project/k-NN/pull/2972), [3](https://forum.opensearch.org/t/supporting-late-interaction-in-opensearch-vector-engine-as-a-field-type/27463)). It will directly leverage Lucene's vectorization providers under the hood which auto-vectorize instructions and use SIMD intrinsics when available on underlying hardware. This will allow us to directly fold in any optimizations made in upstream Lucene, and implicitly benefit from improvements in this rapidly evolving space. It also makes late interaction model reranking available to setups that cannot leverage Painless scripts. Patches and PRs are welcome.
