---
layout: post
title: "Use Late Interaction Models in Search"
authors:
  - mingshl
  - vigyas
  - navneev
date: 2025-11-14
categories:
  - technical-posts
meta_keywords: late interaction models, vector search, ColBERT, semantic search, multi-vector embeddings, multi-modal search
meta_description: Learn how late interaction models like ColBERT can improve search accuracy by preserving token-level information while maintaining efficiency in vector search systems.
---

Vector search has become the foundation of modern semantic search systems. Today's most common approach uses single vector embeddings. Recent state-of-the-art research has discovered that multi-vector representations created by late interaction models can significantly improve search accuracy by preserving fine-grained, token-level information throughout the matching process. This blog post will explore what late interaction models are, why they're becoming increasingly important in search applications, and how they can benefit both users and search system developers.

## What is a late interaction model?

To understand late interaction models, it's helpful to first understand the spectrum of query-document interaction approaches in neural search.

Interaction is the process of evaluating the relevance between a query and a document by comparing their representations at a fine-grained level. Based on interactions, we explain three main types of interaction models as follows:

![Interaction](/assets/media/blog-images/2025-11-14-use-late-interaction-models-in-search/interaction.png)
### Bi-Encoder Models (No Interaction)

The most common approach today uses bi-encoder models, which encode queries and documents completely independently. Imagine a search engine processing your query "best hiking trails near Seattle." A bi-encoder would pass this query through an encoder model to produce a single vector representation. Similarly, each document is independently encoded into its own single vector. These encodings happen in isolation—the query encoder never "sees" the document, and vice versa. Relevance is then determined by comparing these pre-computed single vectors using simple similarity metrics like cosine similarity or dot product. This approach is highly efficient because document vectors can be computed offline and stored, but it sacrifices accuracy because there's no interaction between query and document during the encoding process. No interaction models, such as `amazon.titan-embed-text-v2:0`, are great for fast first stage retrieval in vector search, especially for large datasets.

![Bi-Encoder Models](/assets/media/blog-images/2025-11-14-use-late-interaction-models-in-search/bi-encoders.png)
### Cross-Encoder Models (Early/Full Interaction)

At the opposite end of the spectrum are cross-encoder models, which achieve the highest accuracy by enabling full interaction between query and document. For our "best hiking trails near Seattle" query, a cross-encoder would concatenate the query with each candidate document and feed this combined text through a transformer model. The model's attention mechanism allows every query token to attend to every document token during encoding, capturing highly nuanced relationships between them. The model then outputs a single relevance score directly. While this deep interaction produces excellent results, it's computationally expensive—you cannot pre-compute anything, and each query-document pair requires a full forward pass through a large model. Early/Full interaction models are ideal for second phase reranking. OpenSearch supports reranking with cross-encoder models in search pipelines.

![Cross-Encoder Models](/assets/media/blog-images/2025-11-14-use-late-interaction-models-in-search/cross encoders.png)
### Late Interaction Models (Balanced Approach)

Late interaction models like ColBERT (which stands for Contextualized Late Interaction over BERT) strike a balance between these two extremes. They process the query and document independently (like bi-encoders), but instead of producing single vectors, they generate multiple contextualized embeddings—typically one for each token. For our "best hiking trails near Seattle" query, the model creates individual embeddings for "best," "hiking," "trails," "near," and "Seattle," where each embedding is contextualized by the surrounding words. Similarly, documents are encoded into multi-vector representations at the token level. The key innovation is that the interaction between query and document happens after encoding, through fine-grained token-level similarity computations.

![Late Interaction Models](/assets/media/blog-images/2025-11-14-use-late-interaction-models-in-search/late interactions.png)
For example, ColBERT, a popular late interaction model, demonstrates this approach clearly. After generating contextualized token embeddings for both query and document, it calculates the maximum similarity between each query token embedding and all document token embeddings. These maximum similarities are then summed to produce a final relevance score. This "late interaction" preserves the efficiency benefits of independent encoding (document embeddings can be pre-computed) while enabling more granular and nuanced matching than simple single-vector comparison.

### The Trade-off Spectrum

* **Bi-encoders**: Most efficient, least accurate, no interaction
* **Late interaction models**: Balanced efficiency and accuracy, token-level interaction after encoding
* **Cross-encoders**: Most accurate, least efficient, full interaction during encoding

## Why use late interaction models in search?

Using late interaction models in search is driven by several compelling advantages:

**Enhanced Semantic Understanding**: Unlike traditional approaches that compress documents into single vectors, late interaction models preserve token-level information until the final matching stage. This enables precise semantic connections—for example, matching "heart attack symptoms" with "myocardial infarction indicators" even without exact keywords. This granular approach is particularly valuable in specialized domains like medical, legal, or technical content where precision is critical.

**Optimal Efficiency-Accuracy Balance**: Late interaction models combine the efficiency of bi-encoders (pre-computed embeddings) with accuracy approaching cross-encoders (early/full interactions).

**Multimodal Capabilities**: Recent advances like ColPali and ColQwen extend late interaction to images and other media through patch-level embeddings. This enables searches like "charts illustrating quarterly revenue" to pinpoint specific sections within PDFs—a capability difficult for traditional single-vector models.

## How to use the late interaction model in OpenSearch?

The prevailing pattern in the search industry leverages late interaction models through a two-phase search strategy that balances speed and accuracy. First, the system performs a fast approximate k-NN search using single-vector embeddings from a bi-encoder model to identify candidate documents from the larger corpus. This initial retrieval phase quickly narrows down the search space without the computational overhead of multi-vector processing. Then, in the reranking phase, late interaction scoring uses multi-vectors to calculate precise token-level relevance for only the candidate set. The final results are documents ranked by these fine-grained similarity scores, capturing nuanced query-document relationships while maintaining high scalability.

OpenSearch 3.3 introduced native support for reranking through the `lateInteractionScore` function that calculates document relevance using token-level vector matching. It compares each query vector against all document vectors, finds the maximum similarity for each query vector, and sums these maximum scores to produce the final document score.

The following example demonstrates using the `lateInteractionScore` function with cosine similarity to measure vector similarity based on direction rather than distance. In this example, it compares vector similarity between the document vectors named `my_vector` and the query vectors under params, named `query_vectors`. To test the function with `lateInteractionScore`, you need multi-vectors generated offline in documents and multi-vectors computed online during the search for queries.

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

OpenSearch supports the entire workflow for connecting late interaction models, ingestion, and search. The implementation requires configuring two key components: the ml-inference ingest processor, which generates both single-vector and multi-vector embeddings from text, PDFs, or images during document ingestion, and the ml-inference search request processor, which rewrites queries into k-NN queries with the `lateInteractionScore` function at search time. This configuration enables multimodal search with improved relevance across different content types. For detailed setup instructions, refer to the [tutorial on reranking with externally hosted late interaction models](https://opensearch.org/docs/latest/search-plugins/search-pipelines/rerank-processor/).

To demonstrate the search performance using late interaction models, the [ml-playground](https://playground.opensearch.org/) provides a comparison using the vidore dataset. You can compare search results between a two-phase approach using the ColPali model for late interaction reranking versus a single-phase baseline using `amazon.titan-embed-image-v1` with no interaction. Try different search queries to see how late interaction models improve relevance ranking for multimodal content.

![Late Interaction Models with ml-inference processors](/assets/media/blog-images/2025-11-14-use-late-interaction-models-in-search/auto-ml-inference-search-flow.png)

In the following test running against the query "How can the orientation of texture be characterized?", on the left side, it's using the `colpali_search` search pipeline and on the right side, it's using the `titan_embedding` search pipeline. The expected result is row 7 page, which is ranking no.1 when using the colpali model on the left panel.

![search comparison on ml-playground](/assets/media/blog-images/2025-11-14-use-late-interaction-models-in-search/playground-search-comparison.png)

Additionally, for RAG use cases with ColPali, please refer to the [OpenSearch AI demo app](https://github.com/opensearch-project/opensearch-ai), also available through [Hugging Face](https://huggingface.co/spaces/opensearch-project/opensearch-ai).

## Future Work in Lucene and OpenSearch

OpenSearch Vector Engine (k-NN plugin) currently supports late interaction multi-vector rescoring using painless scripting and the implementation is optimized for SIMD instructions. The current multi-vectors are integrated using the object field and float field type of OpenSearch.

Additionally, since the 10.3 release, Lucene also provides native support for rescoring results for a search query using late interaction model multi-vectors. This is enabled through the new `LateInteractionField`, which accepts `float[][]` multi-vector embeddings, encodes them to a binary representation, and indexes them as a `BinaryDocValues` field. The field supports multi-vectors with varying numbers of vectors per document, although each composing token vector is required to have the same number of dimensions. These are standard constraints across late interaction models, required to enable similarity comparisons across query and document multi-vectors.

Lucene exposes a `LateInteractionRescorer` class to rescore search results using multi-vector similarity on this field. Default support is for `sum(max(vectorSimilarity))`, which takes the sum of maximum similarity between a query token vector and all document token vectors. Essentially, it computes the interaction of a piece (token vector) of the query, with every piece (token vector) of the document, combining their similarity into a meaningful score.

As next steps, we are working on adding support for a multi-vector field in OpenSearch Vector Engine using Lucene's `LateInteractionField` (Ref: [1](https://github.com/opensearch-project/k-NN/issues/2062) [2](https://github.com/opensearch-project/k-NN/issues/2063), [3](https://github.com/opensearch-project/k-NN/issues/2064)). It will directly leverage Lucene's vectorization providers under the hood which auto-vectorize instructions and use SIMD intrinsics when available on underlying hardware. This will allow us to directly fold in any optimizations made in upstream Lucene, and implicitly benefit from improvements in this rapidly evolving space. It also makes late interaction model reranking available to setups that cannot leverage painless scripts. Patches and PRs are welcome.
