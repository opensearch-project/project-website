---
layout: post
title: "Benchmarking Multimodal Document Search in OpenSearch: Three Approaches Compared"
authors:
  - pohongl
date: 2026-04-01
categories:
  - technical-post
meta_keywords: OpenSearch benchmarks, multimodal search, vector search, ColPali, BDA, Amazon Titan, late interaction reranking, neural search, document retrieval, benchmarking
meta_description: Compare ColPali, BDA modality-aware embedding, and text-only chunking for multimodal document search in OpenSearch, benchmarked on quality, latency, and complexity.
excerpt: Documents with tables, charts, and diagrams need more than text-based search. We benchmarked three multimodal document search approaches in OpenSearch on 1,000 report pages. ColPali late interaction reranking achieved the highest search quality (92% recall) but with higher latency, BDA modality-aware embedding offered a balanced middle ground, and text-only chunking was simplest to implement but scored lowest on visually rich content.
has_science_table: true
---

Many real-world documents---financial filings, research papers, technical reports---contain more than just text. They include tables, charts, diagrams, and images that carry critical information. Traditional text-based search does not capture this visual content.

To solve this problem, OpenSearch supports multimodal document search, which is implemented using vector search and neural search pipelines. However, there are multiple approaches to indexing and querying multimodal data, each with different trade-offs in search quality, latency, and complexity.

To help you find the approach that best fits your use case, we benchmarked three approaches on the same dataset of 1,000 report pages. This blog post describes each approach, presents the benchmarking results, and explains when to use each one.

## Dataset

We used the [vidore/syntheticDocQA_government_reports_test](https://huggingface.co/datasets/vidore/syntheticDocQA_government_reports_test) dataset from Hugging Face for benchmarking. This dataset contains 1,000 scanned report pages with 100 query-answer pairs. Each query has a single relevant document, making it a clean retrieval benchmark.

## Three approaches compared

We evaluated the following three approaches, each representing a different point on the quality-latency spectrum.

### Approach 1: ColPali late interaction reranking

ColPali is a vision-language model that treats each document page as an image and produces multiple patch-level embeddings (a _late interaction_ approach). At search time, the query is also encoded into multiple token embeddings and relevance is computed by comparing every query token against every document patch. This is similar to how ColBERT works for text, but extended to visual content.

The following diagram shows the ColPali process:

```
Document image → SageMaker GPU endpoint (ColPali model) → multiple patch embeddings stored in OpenSearch → at search time, query embeddings compared against all patch embeddings via late interaction scoring.
```

This approach processes the entire page (including text, tables, charts, and layout) as a single image, without requiring any text extraction or parsing.

### Approach 2: BDA modality-aware embedding

This approach uses Amazon Bedrock Data Automation (BDA) to parse each document into typed elements: paragraphs, tables, and figures. Each element is then embedded separately using Amazon Titan Multimodal Embeddings: text elements use the text modality and figures use the image modality (cropped from the original page using bounding box coordinates). All embeddings are stored in the same 1,024-dimensional vector space.

The following diagram shows the BDA process:

```
Document → BDA parsing → element extraction (PARAGRAPH, TABLE, FIGURE) → Titan text embedding for text elements, Titan image embedding for figure elements → all stored as nested documents in OpenSearch → neural search at query time.
```

This approach preserves modality-specific information. For example, a chart is embedded as an image, not as Optical Character Recognition (OCR) text.

### Approach 3: Text-only chunking

Text-only chunking is the simplest approach, which represents a common pattern in practice. First, BDA extracts raw text from the document. Then the text is chunked into ~200-word segments with 30-word overlap and each chunk is embedded using Amazon Titan Text Embeddings models.

The following diagram shows the text-only chunking process:

```
Document image → BDA text extraction → chunk into ~200-word segments → Titan text embedding per chunk → stored as nested documents in OpenSearch → neural search at query time.
```

This approach is straightforward to implement but discards all visual information: tables become flattened text while charts, diagrams, and other visual elements are ignored entirely.

## Benchmarking configuration

To ensure a fair comparison, we controlled the following variables during benchmarking.

| Variable | Value |
|---|---|
| Dataset | Same 1,000 report pages |
| Queries | Same 100 queries with ground-truth relevance |
| OpenSearch cluster | Same local cluster (OpenSearch 3.5.0) |
| Evaluation metrics | NDCG, MRR, Recall at k=5 and k=10 |
| Execution | Interleaved (queries rotated across approaches to avoid ordering bias) |
| Warmup | 3 warmup queries per approach before measurement |

## Metric definitions

We used the following metrics to evaluate search quality and performance:

* **NDCG@k (Normalized Discounted Cumulative Gain)**: Measures how well relevant results are ranked near the top. A score of 1.0 indicates perfect ranking. @5 and @10 indicate evaluation over the top 5 or 10 results.
* **MRR@k (Mean Reciprocal Rank)**: Measures how quickly the first relevant result appears. A score of 1.0 means the correct document is always ranked first.
* **Recall@k**: Measures the percentage of relevant documents retrieved in the top *k* results.
* **Latency (ms)**: Indicates the average search response time per query, in milliseconds.
* **P95 latency (ms)**: Indicates the 95th percentile response time: 95% of queries complete faster than this value.

## Search quality results

The following table compares the three approaches across search quality metrics and query latency.

| Approach | NDCG@5 | NDCG@10 | MRR@5 | Recall@5 | Recall@10 | Latency (ms) | P95 (ms) |
|---|---|---|---|---|---|---|---|
| ColPali late interaction reranking | 0.77 | 0.77 | 0.72 | 0.92 | 0.92 | 1,683 | 1,969 |
| BDA modality-aware embedding | 0.51 | 0.54 | 0.45 | 0.69 | 0.77 | 257 | 306 |
| Text-only chunking | 0.38 | 0.42 | 0.33 | 0.52 | 0.64 | 294 | 370 |

ColPali leads across every quality metric. With an NDCG@10 of 0.77 and Recall@10 of 0.92, it finds the correct document 92% of the time within the top 10 results, and the high NDCG@10 score indicates that relevant documents tend to appear in the higher positions. The trade-off is latency: at ~1,683 ms per query, ColPali is roughly 6–7x slower than the other two approaches because late interaction scoring compares query token embeddings against all stored patch embeddings and the reranking step runs on a SageMaker GPU endpoint.

The BDA modality-aware embedding approach falls between the other two, offering moderate search quality (NDCG@10 = 0.54) with low latency (~257 ms). By preserving images and tables as separate modalities, it captures information that text-only approaches miss.

Text-only chunking is the fastest to implement but scores lowest (NDCG@10 = 0.42). When documents contain tables, charts, or diagrams that carry the answer, a text-only approach cannot retrieve them.

## Ingest latency results

We also measured how long it takes to ingest each document (50-document sample). The following table shows the results of the benchmarking tests.

| Approach | Mean (s/doc) | Median (s/doc) | P95 (s/doc) |
|---|---|---|---|
| ColPali late interaction reranking | 9.0 | 9.1 | 10.0 |
| BDA modality-aware embedding | 5.1 | 5.0 | 6.9 |
| Text-only chunking | 11.0 | 6.5 | 21.7 |

The BDA modality-aware embedding approach has the most consistent and fastest ingest times. ColPali late interaction reranking is steady at ~9 seconds per document, driven by the Amazon SageMaker GPU inference time. Text-only chunking has the highest variance: the median is 6.5 seconds, but the P95 increases to 21.7 seconds because some documents produce many text chunks, each requiring a separate embedding call.

## Which approach should you choose?

The best approach depends on your documents and your priorities:

* **ColPali late interaction reranking**: Choose this approach if search quality is your top priority and you can tolerate higher search latency. It's the best option when documents are visually rich (charts, diagrams, complex layouts) and accuracy matters more than speed. This approach requires a GPU endpoint (for example, Amazon SageMaker).

* **BDA modality-aware embedding**: Choose this approach if you want a balance of quality and low latency. It handles mixed-content documents well by treating text and images as separate modalities. This approach provides a suitable balance for most use cases.

* **Text-only chunking**: Choose this approach if your documents are primarily text-based, or if simplicity and fast implementation are priorities. It's the easiest to set up but will underperform on documents where visual elements carry important information.

## Next steps

To learn more about vector search and neural search in OpenSearch, see the following resources:

* [Multimodal search](https://docs.opensearch.org/latest/search-plugins/neural-multimodal-search/)
* [Reranking by a field using an externally hosted late interaction model](https://docs.opensearch.org/latest/search-plugins/search-relevance/rerank-by-field-late-interaction/)

Have questions or want to share your own benchmarking results? Join the conversation on the [OpenSearch forum](https://forum.opensearch.org/).
