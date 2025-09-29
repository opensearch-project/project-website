---
layout: post
title: Advancing search with OpenSearch v3 neural sparse models and a multilingual retrieval model
authors: 
    - wanyiwe
    - zhichaog
    - yych

category:
  - technical-posts

date: 2025-08-25
meta_keywords: search relevance, neural sparse search, OpenSearch semantic search
meta_description: Enhancing OpenSearch neural sparse models with GTE and LLM teachers.

has_science_table: true
---

Neural sparse search is a powerful and efficient method for semantic retrieval in OpenSearch. It encodes text into (token, weight) entries, allowing OpenSearch to index and search efficiently using Lucene's inverted index. Since its introduction in [OpenSearch 2.11](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders/) and the improvements brought by the [v2 series](https://opensearch.org/blog/neural-sparse-v2-models/), neural sparse search has delivered strong search relevance alongside the efficiency benefits of inference‑free retrieval.
Today, we're excited to share two major advancements:

* **The v3 series of neural sparse models** – Our most accurate sparse retrieval models to date, delivering substantial gains in search relevance while maintaining lightweight, inference‑free efficiency.
* **A new multilingual retrieval model** – The first multilingual neural sparse retrieval model in OpenSearch.


## Neural sparse search v3 models: Advancing search relevance

We are excited to announce the release of our v3 neural sparse models:

* **v3-distill**: Building on the success of the v2-distill model, v3-distill delivers higher search relevance (0.517 NDCG@10 vs. 0.504 for v2-distill) through improved training while retaining its lightweight architecture for fast ingestion and low memory usage.
* **v3-gte**: Our most accurate v3 model, offering the best search relevance across all benchmarks (0.546 NDCG@10 vs. 0.517 for v3-distill) while maintaining the high efficiency and low-latency performance of doc-only sparse retrieval.

The v3 models are now available in both [OpenSearch](https://docs.opensearch.org/latest/ml-commons-plugin/pretrained-models/) and [Hugging Face](https://huggingface.co/opensearch-projecthttps://huggingface.co/opensearch-project).

All v3 models achieve **better search relevance** than their v2 counterparts. The following table compares search relevance across model generations. 

| Model                            | [v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v1)   | [v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v2-distill) | [doc-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v1) | [doc-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-distill) | [doc-v2-mini](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-mini) | [doc-v3-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-distill) | [doc-v3-gte](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte) |
|----------------------------------|------|------------|--------|----------------|-------------|----------------|------------|
| Inference-free                   |      |            | ✔️     | ✔️             | ✔️          | ✔️             | ✔️         |
| Model Parameters                 | 133M | 67M        | 133M   | 67M            | 23M         | 67M            | 133M       |
| AVG NDCG@10                      | 0.524| 0.528      | 0.490  | 0.504          | 0.497       | 0.517          | 0.546      |
| AVG FLOPS                        | 11.4 | 8.3        | 2.3    | 1.8            | 1.7         | 1.8            | 1.7        |

## From v2 to v3 series models

The transition from v2 to v3 models in OpenSearch represents a significant leap forward in neural sparse search relevance while maintaining the hallmark efficiency of the v2 series.

### Limitations of v2 models

The v2 series models made neural sparse search widely accessible by significantly reducing the number of model parameters and improving ingestion throughput while maintaining nearly the same search relevance. However, as search workloads and datasets grew in complexity, certain challenges emerged:

* **Relevance bottleneck**: While v2 models delivered strong efficiency and solid performance, their inference-free design still trailed behind well-trained Siamese dense or sparse retrievers in retrieval quality.
* **Limited teacher guidance**: v2 models relied primarily on heterogeneous bi-encoder teachers for distillation, without using the richer ranking signals from stronger models, such as large language models (LLMs).

These limitations motivated us to rethink both training strategies and model architecture for the next-generation models.

### Advancements in v3 models

For the v3 series, our primary goal was to push search relevance to a new level while retaining the lightweight and low-latency characteristics of v2 models. Key advancements include the following:

* **v3-distill**: Builds on v2-distill by incorporating [ℓ0-based sparsification techniques](https://arxiv.org/abs/2504.14839) and training on a larger and more diverse dataset. This combination improves search relevance while maintaining the same lightweight architecture for fast ingestion and low memory usage.
* **v3-gte**: Replaces the v3-distill backbone with a General Text Embedding (GTE) architecture, providing stronger semantic representation and support for 8192-token context windows. This model employs LLM teacher models, capturing richer semantic nuances and setting a new benchmark for sparse retrieval relevance in OpenSearch.

## The technology behind v3 models

Two core techniques drive the technology improvements in v3 models: ℓ0-based sparsification for efficient document representation and GTE architecture with LLM teachers for enhanced training quality.

With these advancements, the v3 series delivers substantial improvements in search relevance while preserving the hallmark speed, efficiency, and inference-free advantages of previous generations. This ensures that you can achieve state-of-the-art retrieval performance without compromising scalability or latency.

### ℓ0-based sparsification

The ℓ0-based approach selectively sparsifies document-side representations to balance efficiency and ranking quality:

* **ℓ0 mask loss**: Regularizes only document vectors exceeding the desired sparsity threshold.
* **ℓ0 approximation activation**: Provides a differentiable approximation for ℓ0, enabling precise sparsity control during training.

Combined with expanded training data, this enables v3-distill to achieve higher relevance without sacrificing efficiency.

### GTE architecture with LLM teachers

The GTE architecture strengthens semantic representation and handles much longer inputs, while LLM-based teacher signals offer richer ranking guidance. This combination allows v3-gte to deliver the highest relevance scores among all OpenSearch sparse retrievers.

## Search relevance benchmarks

Similarly to the tests described in our [previous blog post](https://opensearch.org/blog/neural-sparse-v2-models/), we evaluated the search relevance of the models on the BEIR benchmark. The search relevance results are shown in the following table. All v3 series models outperform their v2 and v1 counterparts, with v3‑gte achieving the highest relevance scores across all tests and setting a new record for OpenSearch neural sparse retrieval models. 


| Model                                      | Average | Trec-Covid | NFCorpus | NQ    | HotpotQA | FiQA  | ArguAna | Touche | DBPedia | SciDocs | FEVER | ClimateFEVER | SciFact | Quora |
|-------------------------------------------|---------|------------|----------|-------|----------|-------|----------|--------|---------|---------|--------|----------------|---------|--------|
| [v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v1) | 0.524   | 0.771      | 0.360    | 0.553 | 0.697    | 0.376 | 0.508    | 0.278  | 0.447   | 0.164   | 0.821  | 0.263          | 0.723   | 0.856  |
| [v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v2-distill) | 0.528 | 0.775      | 0.347    | 0.561 | 0.685    | 0.374 | 0.551    | 0.278  | 0.435   | 0.173   | 0.849  | 0.249          | 0.722   | 0.863  |
| [doc-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v1)  | 0.490   | 0.707      | 0.352    | 0.521 | 0.677    | 0.344 | 0.461    | 0.294  | 0.412   | 0.154   | 0.743  | 0.202          | 0.716   | 0.788  |
| [doc-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-distill) | 0.504 | 0.690 | 0.343    | 0.528 | 0.675    | 0.357 | 0.496    | 0.287  | 0.418   | 0.166   | 0.818  | 0.224          | 0.715   | 0.841  |
| [doc-v2-mini](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-mini) | 0.497 | 0.709    | 0.336    | 0.510 | 0.666    | 0.338 | 0.480    | 0.285  | 0.407   | 0.164   | 0.812  | 0.216          | 0.699   | 0.837  |
| [doc-v3-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-distill) | 0.517 | 0.724 | 0.345    | 0.544 | 0.694    | 0.356 | 0.520    | 0.294  | 0.424   | 0.163   | 0.845  | 0.239          | 0.708   | 0.863  |
| [doc-v3-gte](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte) | **0.546** | **0.734** | **0.360** | **0.582** | **0.716** | **0.407** | **0.520** | **0.389** | **0.455** | **0.167** | **0.860** | **0.312** | **0.725** | **0.873** |


## Multilingual sparse retrieval

We are also excited to announce **multilingual-v1**, the first multilingual neural sparse retrieval model in OpenSearch. Using the same proven training techniques as the English-language v2 series, multilingual-v1 brings high‑quality sparse retrieval to a wide range of languages, achieving strong relevance across multilingual benchmarks while maintaining the same efficiency as our English-language models.

The following table shows the detailed search relevance evaluation of **multilingual-v1** across different languages, compared to BM25. Results are reported using the MIRACL benchmark. **multilingual-v1** delivers substantial improvements over BM25 in all languages, demonstrating the effectiveness of applying our neural sparse retrieval techniques beyond the English language. The table also presents results for a pruned version of multilingual-v1 (using a prune ratio of 0.1), which maintains competitive relevance while reducing index size.



| Model                                                  | Average | bn   | te   | es   | fr   | id   | hi   | ru   | ar   | zh   | fa   | ja   | fi   | sw   | ko   | en   |
|--------------------------------------------------------|---------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|
| BM25                                                 | 0.305   | 0.482| 0.383| 0.077| 0.115| 0.297| 0.350| 0.256| 0.395| 0.175| 0.287| 0.312| 0.458| 0.351| 0.371| 0.267 |
| [multilingual-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-multilingual-v1)    | **0.629** | **0.670** | **0.740** | **0.542** | **0.558** | **0.582** | **0.486** | **0.658** | **0.740** | **0.562** | **0.514** | **0.669** | **0.767** | **0.768** | **0.607** | **0.575** |
| [multilingual-v1; prune_ratio 0.1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-multilingual-v1)                     | 0.626   | 0.667| 0.740| 0.537| 0.555| 0.576| 0.481| 0.655| 0.737| 0.558| 0.511| 0.664| 0.761| 0.766| 0.604| 0.572 |

## Further reading

For more information about neural sparse search, see these previous blog posts:

* [Neural sparse models are now available in Hugging Face Sentence Transformers](https://opensearch.org/blog/neural-sparse-models-are-now-available-in-hugging-face-sentence-transformers/)
* [Improving search efficiency and accuracy with the newest v2 neural sparse models](https://opensearch.org/blog/neural-sparse-v2-models/)
* [Improving document retrieval with sparse semantic encoders](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders)
* [A deep dive into faster semantic sparse retrieval in OpenSearch 2.12](https://opensearch.org/blog/A-deep-dive-into-faster-semantic-sparse-retrieval-in-OS-2.12)
* [Introducing the neural sparse two-phase algorithm](https://opensearch.org/blog/Introducing-a-neural-sparse-two-phase-algorithm)

## Next steps

Try our newest v3 neural sparse models in your OpenSearch cluster and share your experience with us on the [OpenSearch forum](https://forum.opensearch.org/). Your feedback helps us improve future versions.