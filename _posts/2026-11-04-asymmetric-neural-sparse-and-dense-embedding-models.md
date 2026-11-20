---
layout: post
title: "Introducing new OpenSearch sparse and dense retrieval models"
authors:
  - kanexing
  - beauzong
  - shualee
  - yych
date: 2026-11-04
has_science_table: true
excerpt: "OpenSearch introduces two new open-source retrieval models: an asymmetric neural sparse model with a small query encoder for inference-light search, and the first dense embedding model trained by the OpenSearch Project."
categories:
  - technical-posts
meta_keywords: neural sparse search, asymmetric sparse model, SPLADE, dense embedding model, text embeddings, knowledge distillation, BEIR, MTEB, OpenSearch semantic search
meta_description: Learn about two new OpenSearch retrieval models, an asymmetric neural sparse model with a lightweight CPU query encoder and the first OpenSearch dense embedding model trained without labeled data.
---

OpenSearch is expanding its semantic retrieval capabilities by introducing two new open-source models: `opensearch-neural-sparse-encoding-asym-v1`, an inference-light neural sparse model, and `opensearch-neural-embed-v1`, the first dense embedding model trained by the OpenSearch Project. Both models are available on [Hugging Face](https://huggingface.co/opensearch-project).

These models advance two complementary approaches to semantic retrieval:

- **Dense vector search** encodes text into fixed-length embeddings and retrieves documents using [k-NN indexes](https://opensearch.org/docs/latest/vector-search/).
- **Neural sparse search** encodes text into token-weight pairs, allowing OpenSearch to index and search efficiently using Lucene's inverted index.

Since neural sparse search launched in [OpenSearch 2.11](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders/), we have developed and released several generations of sparse models, from the [v2 series](https://opensearch.org/blog/neural-sparse-v2-models/) to the [v3 series](https://opensearch.org/blog/advancing-search-with-opensearch-v3-neural-sparse-models-and-mulitilingual-retrieval-model/). Each generation has improved model efficiency and search relevance. Until now, however, OpenSearch users have relied on [pretrained embedding models](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/) from the broader open source community for dense vector search.

The two new models extend the OpenSearch Project's work into both retrieval approaches:

- [`opensearch-neural-sparse-encoding-asym-v1`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-asym-v1) – An inference-light asymmetric neural sparse model that pairs a small query encoder with a large document encoder. It ranks #2 among sparse models with fewer than 256M parameters on the MTEB BEIR benchmark. Among sparse models that run a query encoder, it has the lowest retrieval FLOPS. It encodes a query in 26.9 ms on a single CPU thread.
- [`opensearch-neural-embed-v1`](https://huggingface.co/opensearch-project/opensearch-neural-embed-v1) – The first open-source dense embedding model trained by the OpenSearch Project. Trained without labeled data, it ranks #1 among single-vector dense models with fewer than 1 billion parameters on the MTEB BEIR benchmark and #2 among models with fewer than 1 billion parameters on MTEB(eng, v2).

The following table summarizes the two models.

| Model | Type | Model parameters | BEIR-13 NDCG@10 |
|-------|------|------------------|-----------------|
| [`opensearch-neural-sparse-encoding-asym-v1`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-asym-v1) | Sparse (asymmetric) | 41M (query) + 137M (document) | 0.555 |
| [`opensearch-neural-embed-v1`](https://huggingface.co/opensearch-project/opensearch-neural-embed-v1) | Dense (2,048 dimensions) | 598M | 0.608 |

## opensearch-neural-sparse-encoding-asym-v1

The `opensearch-neural-sparse-encoding-asym-v1` (`asym-v1`) model uses a small query encoder for low-latency search and a large document encoder for indexing.

### From doc-only and bi-encoder to asymmetric encoding

Until now, OpenSearch neural sparse models have supported two encoding modes:

- **Bi-encoder mode**: The same model encodes both documents and queries. This mode provides strong search relevance but requires running a full-size model at search time.
- **Doc-only mode**: A model encodes documents, while queries are only tokenized. Because this mode requires no model inference at search time, search latency is comparable to BM25. However, search relevance is generally lower than in bi-encoder mode.

The new `asym-v1` model introduces a third approach: **asymmetric encoding**, which provides inference-light retrieval.

The `asym-v1` model uses a two-tower architecture that pairs a **small query encoder** with a **large document encoder**:

- The query encoder is based on `bert-medium` and has 41M parameters.
- The document encoder is based on `GTE` and has 137M parameters.

The document encoder runs offline at index time, so its size does not affect search latency. At search time, only the smaller query encoder runs. It preserves the full semantics of the query while keeping inference costs low: query encoding takes **26.9 ms (p50)** on a single CPU thread, without requiring a GPU.

Both encoders map text to sparse vectors in the 30,522-entry BERT WordPiece vocabulary. OpenSearch calculates relevance using the sparse dot product and serves retrieval through an inverted index, just as it does with other neural sparse models.

### Comparing `asym-v1` with other OpenSearch neural sparse models

The following table compares `asym-v1` with previous OpenSearch neural sparse models.

| Model | Inference-free for retrieval | Model parameters | AVG NDCG@10 |
|-------|------------------------------|------------------|-------------|
| [`opensearch-neural-sparse-encoding-v1`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v1) | | 137M | 0.524 |
| [`opensearch-neural-sparse-encoding-v2-distill`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v2-distill) | | 67M | 0.528 |
| [`opensearch-neural-sparse-encoding-asym-v1`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-asym-v1) | | 41M (query) + 137M (document) | **0.555** |
| [`opensearch-neural-sparse-encoding-doc-v1`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v1) | ✔️ | 137M | 0.490 |
| [`opensearch-neural-sparse-encoding-doc-v2-distill`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-distill) | ✔️ | 67M | 0.504 |
| [`opensearch-neural-sparse-encoding-doc-v2-mini`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-mini) | ✔️ | 23M | 0.497 |
| [`opensearch-neural-sparse-encoding-doc-v3-distill`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-distill) | ✔️ | 67M | 0.517 |
| [`opensearch-neural-sparse-encoding-doc-v3-gte`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte) | ✔️ | 137M | 0.546 |

### Search relevance and query cost

The following table compares `asym-v1` with other sparse retrievers. The query encoder column shows the model used at search time. Inference-free models only tokenize the query.

| Model | Query encoder | BEIR-13 NDCG@10 ↑ | Retrieval FLOPS ↓ | Query encoding time, p50 ↓ |
|-------|---------------|-------------------|-------------------|----------------------------|
| [`granite-embedding-30m-sparse`](https://huggingface.co/ibm-granite/granite-embedding-30m-sparse) | 30M | 0.506 | 10.06 | 26.1 ms |
| [`opensearch-neural-sparse-encoding-v2-distill`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v2-distill) | 67M | 0.528 | 5.73 | 38.9 ms |
| [`opensearch-neural-sparse-encoding-doc-v3-gte`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte) | Tokenizer only | 0.546 | 0.92 | 2.0 ms |
| [`linkup-sparseup-embed-v1`](https://huggingface.co/Linkup-Platform/linkup-sparseup-embed-v1) | 149M | 0.564 | 7.02 | 78.8 ms |
| `opensearch-neural-sparse-encoding-asym-v1` | **41M** | **0.555** | **4.42** | **26.9 ms** |

The `asym-v1` model has the lowest retrieval FLOPS among the models that run a query encoder. Only inference-free models have lower retrieval FLOPS.

Query encoding time represents the p50 latency of encoding one query at a time using `encode_query` on a single thread of an Intel Xeon 8275CL. The measurement uses 200 BEIR test queries.

For detailed BEIR results on each dataset, see the [asym-v1 model card](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-asym-v1).

## opensearch-neural-embed-v1

The `opensearch-neural-embed-v1` (`embed-v1`) model is the first open-source dense embedding model trained by the OpenSearch Project.

The model has 598M parameters and independently encodes queries and documents into 2,048-dimensional, L2-normalized vectors. OpenSearch calculates relevance using cosine similarity, which is equivalent to the inner product for these normalized vectors.

On the [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard), `embed-v1` achieves the following rankings:

- **#1 among single-vector dense models with fewer than 1 billion parameters on the BEIR benchmark**, with an average NDCG@10 of 58.37 across 15 tasks. It outperforms `stella_en_400M_v5` (57.86), `jina-embeddings-v5-text-small` (56.67), and its base model, `Qwen3-Embedding-0.6B` (55.52).
- **#2 among models with fewer than 1 billion parameters on MTEB(eng, v2)**, with a Mean (Task) score of 73.76. It is within 1.5 points of `Qwen3-Embedding-8B`, a model nearly 13 times larger.

### Training without labeled data

We initialized `embed-v1` with [`Qwen3-Embedding-0.6B`](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) and distilled knowledge from two strong embedding models specializing in retrieval and text similarity.

The student model learns a 2,048-dimensional teacher space created by concatenating the first 1,024 dimensions of each teacher's embedding. Training uses the following objectives, each transferring a different aspect of the teachers' knowledge:

- **Absolute representation alignment**: A cosine loss brings each student vector closer to the corresponding teacher vector for the same text.
- **Pairwise similarity alignment**: A similarity-matrix loss trains the student to reproduce the teachers' in-batch similarity structure without requiring an exact match between their outputs. This transfers the teachers' text-similarity capabilities.
- **Relative ranking alignment**: A ranking loss uses the teachers' similarity scores as soft labels. This helps the student preserve the relative relevance of text pairs and inherit the teachers' retrieval capabilities.

The entire training pipeline requires no labeled data. It uses approximately 17M unlabeled English texts and the teachers' embeddings, without relevance labels, hard-negative mining, or contrastive retrieval fine-tuning.

For detailed MTEB(eng, v2) and BEIR (15 tasks) results, see the [embed-v1 model card](https://huggingface.co/opensearch-project/opensearch-neural-embed-v1).

## Further reading

For more information about neural sparse search, see these previous blog posts:

- [Advancing search with OpenSearch v3 neural sparse models and a multilingual retrieval model](https://opensearch.org/blog/advancing-search-with-opensearch-v3-neural-sparse-models-and-mulitilingual-retrieval-model/)
- [Improving search efficiency and accuracy with the newest v2 neural sparse models](https://opensearch.org/blog/neural-sparse-v2-models/)
- [Improving document retrieval with sparse semantic encoders](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders/)
- [Neural sparse models are now available in Hugging Face Sentence Transformers](https://opensearch.org/blog/neural-sparse-sentence-transformers/)

## Next steps

Try the new models from [Hugging Face](https://huggingface.co/opensearch-project) and share your experience on the [OpenSearch forum](https://forum.opensearch.org/). Your feedback helps us improve future versions.