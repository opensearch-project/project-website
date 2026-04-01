---
layout: post
title: "Benchmarking Multimodal Document Search in OpenSearch: Three Approaches Compared"
authors:
  - pohongl
date: 2026-04-01
categories:
  - technical-post
meta_keywords: multimodal search, OpenSearch vector search, ColPali, Amazon Bedrock Data Automation, BDA, Titan multimodal embeddings, document search, neural search, benchmarking
meta_description: We benchmarked three approaches to multimodal document search in OpenSearch — ColPali late interaction reranking, BDA modality-aware embedding, and text-only chunking — to help you choose the right tradeoff between search quality and latency.
excerpt: Many real-world documents contain more than just text. We benchmarked three approaches to multimodal document search in OpenSearch on 1,000 government report pages to help you decide which fits your use case.
has_science_table: true
---

Many real-world documents — government reports, financial filings, research papers — contain more than just text. They include tables, charts, diagrams, and images that carry critical information. Traditional text-based search misses this visual content entirely.

OpenSearch supports vector search and neural search pipelines, which opens the door to multimodal document search. But there are multiple ways to approach it, each with different tradeoffs in search quality, latency, and complexity.

We benchmarked three approaches on the same dataset of 1,000 government report pages to help you decide which one fits your use case.

## The Dataset

We used the [vidore/syntheticDocQA_government_reports_test](https://huggingface.co/datasets/vidore/syntheticDocQA_government_reports_test) dataset from Hugging Face — 1,000 scanned government report pages with 100 query-answer pairs. Each query has a single relevant document, making it a clean retrieval benchmark.

## The Three Approaches

### Approach 1: ColPali Late Interaction Reranking

ColPali is a vision-language model that treats each document page as an image and produces multiple patch-level embeddings (a "late interaction" approach). At search time, the query is also encoded into multiple token embeddings, and relevance is computed by comparing every query token against every document patch — similar to how ColBERT works for text, but extended to visual content.

**Pipeline:** Document image → SageMaker GPU endpoint (ColPali model) → multiple patch embeddings stored in OpenSearch → at search time, query embeddings compared against all patch embeddings via late interaction scoring.

This approach sees the entire page as a human would — text, tables, charts, layout — without needing any text extraction or parsing.

### Approach 2: BDA Modality-Aware Embedding

This approach uses Amazon Bedrock Data Automation (BDA) to parse each document into typed elements — paragraphs, tables, and figures. Each element is then embedded separately using Amazon Titan Multimodal Embeddings: text elements via the text modality, and figures via the image modality (cropped from the original page using bounding box coordinates). All embeddings live in the same 1,024-dimensional vector space.

**Pipeline:** Document → BDA parsing → element extraction (PARAGRAPH, TABLE, FIGURE) → Titan text embedding for text elements, Titan image embedding for figure elements → all stored as nested documents in OpenSearch → neural search at query time.

This approach preserves modality-specific information — a chart is embedded as an image, not as OCR text.

### Approach 3: Text-Only Chunking

This is the simplest approach and represents a common pattern in practice. BDA extracts raw text from the document, the text is chunked into ~200-word segments with 30-word overlap, and each chunk is embedded using Titan text embeddings.

**Pipeline:** Document image → BDA text extraction → chunk into ~200-word segments → Titan text embedding per chunk → stored as nested documents in OpenSearch → neural search at query time.

This approach is straightforward to implement but discards all visual information — tables become flattened text, and images and charts are ignored entirely.

## Benchmark Setup

To ensure a fair comparison, we controlled the following variables:

| Variable | Value |
|---|---|
| Dataset | Same 1,000 government report pages |
| Queries | Same 100 queries with ground-truth relevance |
| OpenSearch cluster | Same local cluster (OpenSearch 3.5.0) |
| Evaluation metrics | NDCG, MRR, Recall, Precision at k=5 and k=10 |
| Execution | Interleaved (queries rotated across approaches to avoid ordering bias) |
| Warmup | 3 warmup queries per approach before measurement |

## Search Quality Results

| Approach | NDCG@5 | NDCG@10 | MRR@5 | Recall@5 | Recall@10 | Latency (ms) | P95 (ms) |
|---|---|---|---|---|---|---|---|
| ColPali (Late Interaction) | 0.77 | 0.77 | 0.72 | 0.92 | 0.92 | 1,683 | 1,969 |
| BDA + Titan Modality | 0.51 | 0.54 | 0.45 | 0.69 | 0.77 | 257 | 306 |
| Text-Only Chunking | 0.38 | 0.42 | 0.33 | 0.52 | 0.64 | 294 | 370 |

ColPali leads across every quality metric. With an NDCG@10 of 0.77 and Recall@10 of 0.92, it finds the correct document 92% of the time within the top 10 results — and ranks it near the top. The tradeoff is latency: at ~1,683ms per query, it's roughly 6–7x slower than the other two approaches, because late interaction scoring requires comparing query token embeddings against all stored patch embeddings, with the reranking step running on a SageMaker GPU endpoint.

The BDA + Titan Modality approach sits in the middle — decent quality (NDCG@10 = 0.54) with fast search latency (~257ms). By preserving images and tables as separate modalities, it captures information that text-only approaches miss.

Text-Only Chunking is the fastest to implement but scores lowest (NDCG@10 = 0.42). When documents contain tables, charts, or diagrams that carry the answer, a text-only approach simply can't find them.

## Ingest Latency Results

We also measured how long it takes to ingest each document (50-document sample):

| Approach | Mean (s/doc) | Median (s/doc) | P95 (s/doc) |
|---|---|---|---|
| ColPali (Late Interaction) | 9.0 | 9.1 | 10.0 |
| BDA + Titan Modality | 5.1 | 5.0 | 6.9 |
| Text-Only Chunking | 11.0 | 6.5 | 21.7 |

The BDA + Titan Modality approach has the most consistent and fastest ingest times. ColPali ingest is steady at ~9 seconds per document, driven by the SageMaker GPU inference time. Text-Only Chunking has the highest variance — median is 6.5 seconds, but the P95 spikes to 21.7 seconds because some documents produce many text chunks, each requiring a separate embedding call.

## Which Approach Should You Choose?

**Choose ColPali** if search quality is your top priority and you can tolerate higher search latency. It's the best option when documents are visually rich (charts, diagrams, complex layouts) and accuracy matters more than speed. Requires a GPU endpoint (e.g., SageMaker).

**Choose BDA + Titan Modality** if you want a balanced approach — good quality with fast latency. It handles mixed-content documents well by treating text and images as separate modalities. A solid middle ground for most use cases.

**Choose Text-Only Chunking** if your documents are primarily text-based, or if simplicity and fast implementation are priorities. It's the easiest to set up but will underperform on documents where visual elements carry important information.

## Metric Definitions

- **NDCG@k (Normalized Discounted Cumulative Gain):** Measures how well the correct results are ranked toward the top. A score of 1.0 means all relevant documents are ranked perfectly. @5 and @10 indicate the evaluation considers the top 5 or 10 results.
- **MRR@k (Mean Reciprocal Rank):** How quickly the first correct result appears. A score of 1.0 means the correct document is always the first result.
- **Recall@k:** What percentage of all relevant documents were found in the top k results.
- **Precision@k:** What percentage of the returned top k results are actually relevant.
- **Latency (ms):** Average search response time per query in milliseconds.
- **P95 (ms):** 95th percentile latency — 95% of queries were faster than this value.
