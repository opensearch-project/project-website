---
layout: post
title: "Introducing opensearch-neural-sparse-encoding-asym-v1 and opensearch-neural-embed-v1: New sparse and dense retrieval models from OpenSearch"
authors:
  - kanexing
  - beauzong
  - shualee
  - yych
date: 2026-11-04
has_science_table: true
categories:
  - technical-posts
meta_keywords: neural sparse search, asymmetric sparse model, SPLADE, dense embedding model, text embeddings, knowledge distillation, BEIR, MTEB, OpenSearch semantic search
meta_description: Learn about two new OpenSearch retrieval models, an asymmetric neural sparse model with a lightweight CPU query encoder and the first OpenSearch dense embedding model trained without labeled data, including BEIR and MTEB results.
---

OpenSearch supports two different approaches in semantic retrieval: **Dense vector search** encodes text into fixed-length embeddings and retrieves documents using [k-NN indexes](https://opensearch.org/docs/latest/vector-search/). **Neural sparse search** encodes text into (token, weight) entries, allowing OpenSearch to index and search efficiently using Lucene's inverted index.

Since neural sparse search launched in [OpenSearch 2.11](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders/), we have trained and released our own sparse models, and each generation, from the [v2 series](https://opensearch.org/blog/neural-sparse-v2-models/) to the [v3 series](https://opensearch.org/blog/advancing-search-with-opensearch-v3-neural-sparse-models-and-mulitilingual-retrieval-model/), has made them more efficient and more relevant. For dense vector search, however, OpenSearch users have so far relied on [pretrained embedding models](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/) from the broader open-source community.

Today, we're excited to share two new retrieval models, one for each approach, available on [Hugging Face](https://huggingface.co/opensearch-project):

* **opensearch-neural-sparse-encoding-asym-v1** – An inference-light asymmetric neural sparse model that pairs a small query encoder with a large document encoder. It ranks #2 among sparse models under 256M parameters on the MTEB BEIR benchmark, has the lowest retrieval FLOPS among sparse models that run a query encoder, and encodes a query in 26.9 ms on a single CPU thread.
* **opensearch-neural-embed-v1** – The first open-source dense embedding model trained by the OpenSearch Project. Trained without any labeled data, it ranks #1 among single-vector dense models under 1B parameters on the MTEB BEIR benchmark and #2 among models under 1B parameters on MTEB(eng, v2).

The following table summarizes the two models.

| Model | Type | Model parameters | BEIR-13 NDCG@10 |
|-------|------|------------------|-----------------|
| [opensearch-neural-sparse-encoding-asym-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-asym-v1) | Sparse (asymmetric) | 41M (query) + 137M (document) | 0.555 |
| [opensearch-neural-embed-v1](https://huggingface.co/opensearch-project/opensearch-neural-embed-v1) | Dense (2,048 dimensions) | 598M | 0.608 |

## opensearch-neural-sparse-encoding-asym-v1: An asymmetric neural sparse model

### Doc-only, bi-encoder, and asymmetric modes

Until now, OpenSearch neural sparse models have supported two modes:

* **Bi-encoder mode**: Documents and queries are encoded by the same model. This mode provides strong search relevance but requires running a full-size model at search time.
* **Doc-only mode**: Documents are encoded by a model, while queries are only tokenized. This mode is inference-free at search time, so search latency is comparable to BM25, but search relevance is generally lower than in bi-encoder mode.

The asym-v1 model takes a third approach and moves neural sparse search from inference-free to **inference-light**. It is an **asymmetric (two-tower)** model: a **small query encoder** based on bert-medium (41M parameters) is paired with a **large document encoder** based on GTE (137M parameters). The document encoder runs offline at index time, so its size does not affect search latency. The query encoder keeps the full semantics of the query while staying affordable: it encodes a query in **26.9 ms** (p50) on a single CPU thread, so no GPU is needed at search time.

Both towers map text to a sparse vector over the 30,522-entry BERT WordPiece vocabulary, and relevance is computed as the sparse dot product, served by an inverted index, just like other OpenSearch neural sparse models.

### Comparison with other OpenSearch neural sparse models

| Model | Inference-free for retrieval | Model parameters | AVG NDCG@10 |
|-------|------------------------------|------------------|-------------|
| [opensearch-neural-sparse-encoding-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v1) |   | 137M | 0.524 |
| [opensearch-neural-sparse-encoding-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v2-distill) |   | 67M | 0.528 |
| [**opensearch-neural-sparse-encoding-asym-v1**](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-asym-v1) |   | 41M (query) + 137M (document) | **0.555** |
| [opensearch-neural-sparse-encoding-doc-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v1) | ✔️ | 137M | 0.490 |
| [opensearch-neural-sparse-encoding-doc-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-distill) | ✔️ | 67M | 0.504 |
| [opensearch-neural-sparse-encoding-doc-v2-mini](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-mini) | ✔️ | 23M | 0.497 |
| [opensearch-neural-sparse-encoding-doc-v3-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-distill) | ✔️ | 67M | 0.517 |
| [opensearch-neural-sparse-encoding-doc-v3-gte](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte) | ✔️ | 137M | 0.546 |

### Search relevance and query cost

The following table compares asym-v1 with other sparse retrievers. The query encoder is the model that runs at search time; inference-free models only tokenize the query.

| Model | Query encoder | BEIR-13 NDCG@10 ↑ | Retrieval FLOPS ↓ | Query encoding time, p50 ↓ |
|-------|---------------|-------------------|-------------------|----------------------------|
| [granite-embedding-30m-sparse](https://huggingface.co/ibm-granite/granite-embedding-30m-sparse) | 30M | 0.506 | 10.06 | 26.1 ms |
| [opensearch-neural-sparse-encoding-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v2-distill) | 67M | 0.528 | 5.73 | 38.9 ms |
| [opensearch-neural-sparse-encoding-doc-v3-gte](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte) | Tokenizer only | 0.546 | 0.92 | 2.0 ms |
| [linkup-sparseup-embed-v1](https://huggingface.co/Linkup-Platform/linkup-sparseup-embed-v1) | 149M | 0.564 | 7.02 | 78.8 ms |
| **opensearch-neural-sparse-encoding-asym-v1** | **41M** | **0.555** | **4.42** | **26.9 ms** |

asym-v1 has the lowest retrieval FLOPS among the models that run a query encoder; only inference-free models are lower. Query encoding time is the p50 latency of encoding one query at a time with `encode_query` on a single thread of an Intel Xeon 8275CL, over 200 BEIR test queries.

For detailed BEIR results on each dataset, see the [asym-v1 model card](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-asym-v1).

## opensearch-neural-embed-v1: The first OpenSearch dense embedding model

We also introduce **opensearch-neural-embed-v1**, the first open-source dense embedding model trained by the OpenSearch Project. It is a 598M-parameter model that encodes queries and documents independently into 2,048-dimensional, L2-normalized vectors; relevance is their cosine similarity (equivalently, their inner product).

On the [MTEB](https://huggingface.co/spaces/mteb/leaderboard) leaderboard, embed-v1 ranks **#1 among single-vector dense models under 1B parameters on the BEIR benchmark**, with 58.37 average NDCG@10 over 15 tasks, ahead of stella_en_400M_v5 (57.86), jina-embeddings-v5-text-small (56.67), and its base model, Qwen3-Embedding-0.6B (55.52). It also ranks **#2 among models under 1B parameters on MTEB(eng, v2)**, with 73.76 Mean (Task), within 1.5 points of the nearly 13x larger Qwen3-Embedding-8B.

### Training without labeled data

We initialize the student model with [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) and distill two strong embedding models, which excel at retrieval and text similarity, into it. The student learns a 2,048-dimensional teacher space, built by concatenating the leading 1,024 dimensions of each teacher's embedding. Training uses the following objectives, each of which transfers a different aspect of the teachers' knowledge:

* **Absolute representation alignment**: A cosine loss pulls each student vector toward the teacher vector of the same text.
* **Pairwise similarity alignment**: A similarity-matrix loss makes the student reproduce the teachers' in-batch similarity structure, without forcing an exact match of the outputs. This objective lets the student inherit the teachers' strong text-similarity capability.
* **Relative ranking alignment**: A ranking loss uses the teachers' similarity scores as soft labels, so the student preserves which text pairs the teachers consider more related than others. This objective lets the student inherit the teachers' strong retrieval ability.

The whole pipeline needs no labeled data. Training uses only about 17M unlabeled English texts and the teachers' embeddings, with no relevance labels, no hard-negative mining, and no contrastive retrieval fine-tuning.

For detailed MTEB(eng, v2) and BEIR (15 tasks) results, see the [embed-v1 model card](https://huggingface.co/opensearch-project/opensearch-neural-embed-v1).

## Further reading

For more information about neural sparse search, see these previous blog posts:

* [Advancing search with OpenSearch v3 neural sparse models and a multilingual retrieval model](https://opensearch.org/blog/advancing-search-with-opensearch-v3-neural-sparse-models-and-mulitilingual-retrieval-model/)
* [Improving search efficiency and accuracy with the newest v2 neural sparse models](https://opensearch.org/blog/neural-sparse-v2-models/)
* [Improving document retrieval with sparse semantic encoders](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders/)
* [Neural sparse models are now available in Hugging Face Sentence Transformers](https://opensearch.org/blog/neural-sparse-sentence-transformers/)

## Next steps

Try the new models from [Hugging Face](https://huggingface.co/opensearch-project) and share your experience with us on the [OpenSearch forum](https://forum.opensearch.org/). Your feedback helps us improve future versions.
