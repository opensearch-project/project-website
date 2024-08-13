---
layout: post
title:  Advancing Search Quality and Inference Speed with v2 Series Neural Sparse Models
authors:
  - zhichaog
  - congguan
  - yych
  - dylantong
date: 2024-08-19
categories:
    - technical-posts
has_math: true
meta_keywords: OpenSearch semantic search, neural sparse search, semantic sparse retrieval
meta_description: Introducing the neural sparse v2 series model, and demonstrate the benchmark result on ingestion performance, search performance and search relevance.

excerpt: Introducing the neural sparse v2 series model, and demonstrate the benchmark result on ingestion performance, search performance and search relevance.
featured_blog_post: true 
featured_image: false # /assets/media/blog-images/__example__image__name.jpg
---

Neural sparse search is a novel, efficient method of semantic retrieval that was [introduced in OpenSearch 2.11](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders/). The sparse encoding models encode text into (token, weight) entries, and OpenSearch builds indexes and perform searches using Lucene's inverted index. Neural sparse search is efficient and have strong generalization ability in out-of-domain(OOD) scenarios. We are thrilled to announce the release of our v2 series neural sparse models: 

- v2-distill model: this model **reduces the model parameters to 0.5x** and reduce cost as a result of proportionally less memory requirements. It increases the ingestion throughput **1.39x** on GPU and **1.74x** on CPU. v2-distill arch is supported on both doc-only and bi-encoder modes.
- v2-mini model: this model **reduces the model parameters to 0.25x** and reduce cost as a result of proportionally less memory requirements. It increases the ingestion throughput **1.74x** on GPU and **4.18x** on CPU. v2-mini arch is supported on doc-only mode.

Besides, all v2 models achieve **better search relevance**. The overall comparison between them and the v1 models is shown in the table below. All v2 models are now available at both [OpenSearch](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/#sparse-encoding-models) and [Hugging Face](https://huggingface.co/opensearch-project).

| Model | Inference-free for Retrieval | Model Parameters | AVG NDCG@10 | 
|-------|------------------------------|------------------|-------------|
| [opensearch-neural-sparse-encoding-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v1) |  | 133M | 0.524 | 
| [opensearch-neural-sparse-encoding-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v2-distill) |  | 67M | 0.528 | 
| [opensearch-neural-sparse-encoding-doc-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v1) | ✔️ | 133M | 0.490 |
| [opensearch-neural-sparse-encoding-doc-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-distill) | ✔️ | 67M | 0.504 |
| [opensearch-neural-sparse-encoding-doc-v2-mini](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-mini) | ✔️ | 23M | 0.497 |

## The Evolution from v1 Series to v2 Series of Models

### Limitations for v1 Models

For neural sparse search, the sparse encoding model is a critical component as it influences how documents are scored and rank. In other words, it directly influences the relevancy of your search results. Moreover, the inference speed of the model also directly affects the ingestion throughput and the client-side search latency of bi-encoder mode. When we released the neural sparse feature in OpenSearch, we also launched two neural sparse models, supporting doc-only and bi-encoder modes respectively.

The biggest challenge for v1 models is the large model size. The v1 series models are tuned from the BERT-base model, which is a 12-layer transformer model with 133 million parameters.  Compared with popular dense embedding models like [tas-b](https://huggingface.co/sentence-transformers/msmarco-distilbert-base-tas-b) and [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), the inference cost of the v1 models is 2x even 4x higher. As a result, for the v2 series models, there is an urgent need to reduce the number of model parameters without compromising search accuracy.

### Knowledge Distillation from Ensemble Heterogeneous Teacher Models

For neural models, performance is tightly coupled with the number of parameters. When using smaller backbone, we need to enhance the training algorithm to compensate for the performance drop. For the retrieval task, the common technique is to **pre-training** and **knowledge distillation**:

- Pre-training: Training models using massive amount of data, which is usually constructed by rules. For example, (title, body) pairs in news articles or (question, answer) pairs on Q&A websites. Pre-training enhances the model’s search relevance and generalization ability.
- Knowledge distillation: Some models have strong performance but are inefficient in the form of large model size or inefficient structure(e.g. cross-encoder rerankers). Distillation is a technique that transfers knowledge from these teacher models to smaller ones with the aim to preserve high performance while discarding the inefficiencies.

For existing dense retrievers, pre-training was usually conducted with the infoNCE loss, which was proved to improve the alignment and uniformity of dense representations. However, for sparse embeddings especially doc-only mode, we find that infoNCE loss doesn't enhance the model as it does for dense models. In contrast, knowledge distillation loss is a more effective optimization objective. The challenge is to find a teacher model which are strong enough(where siamese encoders fail) and efficient enough to predict on the large-scale pre-training dataset(where cross-encoders fail). Inspired by the drastic performance boost from the [hybrid search of dense and lexical(sparse) approach](https://opensearch.org/blog/hybrid-search/),  we innovatively propose to ensemble bi-encoder learned sparse retriever with Siamese dense models to construct a strong teacher model. It combines the strength of heterogenous retrievers, and is efficient enough to apply on pre-training. We plan to publish a paper about the training procedure and will discuss more details in it. The pre-training with knowledge distillation allow us to safely reduce the number of model parameters without compromising performance.


Overall, thanks to pre-training on massive corpus[^1], the **v2 series models** have further **improved search relevance** while significantly **reducing the number of model parameters**. We have released distill-BERT-based models for both doc-only and bi-encoder modes (same size as  [tas-b](https://huggingface.co/sentence-transformers/msmarco-distilbert-base-tas-b)), and a miniLM-based model for the doc-only mode (same size as [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)). 

## Model Inference Speed Up

The v2 model continues to use the transformer architecture. It reduces the number of parameters by decreasing the number of layers and the hidden dimension. Therefore, we can get higher ingestion throughput and lower search latency with the smaller v2 models. We benchmark the v2 models at the scenarios of ingestion and search. We use the MS MARCO passage retrieval dataset. We use a OpenSearch 2.16 cluster with 3 nodes of r7a.8xlarge EC2 instances.

**GPU deployment.** We use a SageMaker GPU endpoint to host the neural sparse model and use it as a remote connector ([code script](https://github.com/zhichao-aws/neural-search/tree/neural_sparse_sagemaker/neural_sparse_sagemaker_example)). We use a **g5.xlarge** GPU instance to host the model. 
**CPU deployment.** The model is deployed on **all 3 nodes** in the cluster.

### Ingestion

In this experiments, we set the `batch_size` of `sparse_encoding` ingestion processor to 2. We record the mean ingestion throughput and the P99 client-side latency for the bulk API. We use 20 clients to do ingestion in this section.

#### Remote deployment using GPU 

Bulk size is set to 24. The experiment results is listed below. Compared with the v1 model, the **v2-distill** model increase the mean throughput **1.39x** and the **v2-mini** model increase the mean throughput **1.74x**. 

<img src="/assets/media/blog-images/2024-08-19-neural-sparse-v2-models/gpu_ingest.png"/>

#### Local deployment using CPU

Bulk size is set to 8. Compared with the v1 model, the **v2-distill** model increase the mean throughput **1.58x** and the **v2-mini** model increase the mean throughput **4.18x**. 

<img src="/assets/media/blog-images/2024-08-19-neural-sparse-v2-models/cpu_ingest.png"/>

### Search

In this experiments, we ingest 1 million documents into the index, and use 20 clients to search in concurrent. We record the search client-side P99 latency and model inference P99 latency. We test the search performance for the **bi-encoder** mode.

#### Remote deployment using GPU 

Compared with the v1 model, the **v2-distill** model decrease the search client-side latency by **11.7%** and model inference latency by **23%**.

<img src="/assets/media/blog-images/2024-08-19-neural-sparse-v2-models/gpu_search.png"/>

#### Local deployment using CPU

Compared with the v1 model, the **v2-distill** model decrease the search client-side latency by **30.2%** and model inference latency by **33.3%**.

<img src="/assets/media/blog-images/2024-08-19-neural-sparse-v2-models/cpu_search.png"/>

## Search Relevance Benchmark

Consistent with our previous [blog](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders/), we benchmark the model search relevance on subset of BEIR benchmark. The detailed search relevance is shown in the table below. All v2-series models outperform the v1 model with the same architecture.

<div style="overflow-x: auto;">
    
| Model | Average | Trec Covid | NFCorpus | NQ | HotpotQA | FiQA | ArguAna | Touche | DBPedia | SCIDOCS | FEVER | Climate FEVER | SciFact | Quora |
|-------|---------|------------|----------|----|----------|------|---------|--------|---------|---------|-------|---------------|---------|-------|
| [opensearch-neural-sparse-encoding-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v1) | 0.524 | 0.771 | 0.360 | 0.553 | 0.697 | 0.376 | 0.508 | 0.278 | 0.447 | 0.164 | 0.821 | 0.263 | 0.723 | 0.856 |
| [opensearch-neural-sparse-encoding-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v2-distill) | 0.528 | 0.775 | 0.347 | 0.561 | 0.685 | 0.374 | 0.551 | 0.278 | 0.435 | 0.173 | 0.849 | 0.249 | 0.722 | 0.863 |
| [opensearch-neural-sparse-encoding-doc-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v1) | 0.490 | 0.707 | 0.352 | 0.521 | 0.677 | 0.344 | 0.461 | 0.294 | 0.412 | 0.154 | 0.743 | 0.202 | 0.716 | 0.788 |
| [opensearch-neural-sparse-encoding-doc-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-distill) | 0.504 | 0.690 | 0.343 | 0.528 | 0.675 | 0.357 | 0.496 | 0.287 | 0.418 | 0.166 | 0.818 | 0.224 | 0.715 | 0.841 |
| [opensearch-neural-sparse-encoding-doc-v2-mini](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-mini) | 0.497 | 0.709 | 0.336 | 0.510 | 0.666 | 0.338 | 0.480 | 0.285 | 0.407 | 0.164 | 0.812 | 0.216 | 0.699 | 0.837 |

</div>

## Register and Deploy V2 Models

The v2 series sparse encoding models can be registered as OpenSearch-provided pretrained models supported by ml-commons plugin. The register APIs are listed as follows.

For ingestion and search with sparse model deployed, please check the [documentation](https://opensearch.org/docs/latest/search-plugins/neural-sparse-search/).

### Register&Deploy models of doc-only mode

```json
## register sparse_encoding model for ingestion
POST /_plugins/_ml/models/_register?deploy=true
{
    "name": "amazon/neural-sparse/opensearch-neural-sparse-encoding-doc-v2-distill",
    "version": "1.0.0",
    "model_format": "TORCH_SCRIPT"
}

## register sparse_tokenize model for search
POST /_plugins/_ml/models/_register?deploy=true
{
    "name": "amazon/neural-sparse/opensearch-neural-sparse-tokenizer-v1",
    "version": "1.0.1",
    "model_format": "TORCH_SCRIPT"
}

## get model_id from task_ids returned by register model API
GET /_plugins/_ml/tasks/{task_id}
```

### Register&Deploy models of bi-encoder mode

```json
## register sparse_encoding model for ingestion and search
POST /_plugins/_ml/models/_register?deploy=true
{
    "name": "amazon/neural-sparse/opensearch-neural-sparse-encoding-v2-distill",
    "version": "1.0.0",
    "model_format": "TORCH_SCRIPT"
}

## get model_id from task_ids returned by register model API
GET /_plugins/_ml/tasks/{task_id}
```

[^1]: We pick a subset of [training data](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2#training-data) collected by sentence-transformers. All datasets overlapped with BEIR are excluded to keep a zero-shot setting for the evaluation.