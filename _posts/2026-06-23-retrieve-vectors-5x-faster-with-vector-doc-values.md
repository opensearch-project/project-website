---
layout: post
title: "Retrieve vectors 5x faster with docvalue_fields in OpenSearch"
authors:
  - navneev
  - vamshin
date: 2026-06-23
has_science_table: true
categories:
  - technical-posts
meta_keywords: "vector search, doc values, knn_vector, docvalue_fields, OpenSearch performance, vector retrieval, k-NN, binary encoding, base64"
meta_description: "Learn how vector retrieval using doc values in OpenSearch 3.7 bypasses the _source vector reconstruction path to deliver 5.5x faster end-to-end retrieval and 14.7x faster server-side performance at k=1000."
excerpt: "As vector search workloads scale, retrieving vectors from search results becomes a bottleneck. Vector retrieval using doc values in OpenSearch 3.7 bypasses the expensive _source vector reconstruction path, delivering 5.5x faster end-to-end retrieval and 14.7x faster server-side performance."
---

Vector search doesn't end at finding the nearest neighbors. Many real-world applications need the vectors themselves back in the response — RAG pipelines fetching context embeddings for downstream LLM calls, re-ranking systems computing cross-encoder scores, and client-side post-processing for diversity or business-rule filtering. As k grows (k=100, k=500, or even k=1000), the cost of *returning* those vectors starts to dominate total query latency.

In OpenSearch 3.7, we introduce an optimized and performant way to retrieve vectors from their columnar stored format using `docvalue_fields`, bypassing the expensive `_source` vector reconstruction path. The feature requires no reindexing, works on all existing older indexes, and supports all vector data types. The results: **5.5x faster end-to-end latency** and **14.7x faster server-side processing** at k=1000.

## How vector retrieval works today

To understand why this matters, let's trace what happens when you request vectors in search results using the traditional `_source` path.

Starting with OpenSearch 3.0, vectors are no longer stored in the `.fdt` (stored fields) file. Instead, they are stored in a columnar format in the `.vec` file — a structure optimized for sequential vector access. This change was introduced as part of [derived source for vectors](https://opensearch.org/blog/Do-More-with-Less-Save-Up-to-3x-on-Storage-with-Derived-Vector-Source/), which reduced storage costs by up to 3x.

However, when you request vectors through `_source`, OpenSearch still follows a multi-step reconstruction process:

1. **Read** the compressed `_source` (without vectors) from the `.fdt` file on disk.
2. **Decompress** the stored field data.
3. **Deserialize** the bytes into a document map.
4. **Inject** the vector — OpenSearch reads the vector from the `.vec` file and injects it into the deserialized document at the correct field path.
5. **Re-serialize** the entire document back to JSON bytes for the response.

Every one of these steps runs *per document*. At k=1000 with 768-dimensional vectors, that means reading, decompressing, deserializing, injecting, and re-serializing roughly 8 MB of response data per query.

```
Traditional _source path (per document):

  .fdt (disk) ──► Decompress ──► Deserialize ──► Inject vector from .vec ──► Re-serialize
                                                        ▲
                                                        │
                                              Columnar store read
```

In our benchmarks, this reconstruction overhead alone can add up to tens of milliseconds per query at high k values — time spent entirely on marshaling data that already exists in a readily accessible columnar format. The vector is right there, stored in a columnar structure optimized for sequential access. We found that reading it through `_source` is the long way around.

## Solution

Vector retrieval using doc values segregates vectors and non-vector fields in the response. Instead of routing vectors through the `_source` reconstruction pipeline, which requires decompressing `_source`, deserializing it, injecting vectors back into it, and re-serializing the entire payload, we leave `_source` untouched and read vectors directly from the columnar store with a **single seek per document**. The vectors are then returned in a separate `fields` key in the response.

Non-vector fields (title, text, metadata) continue to be served from `_source` as before. By keeping vectors out of the `_source` path entirely, we eliminate the most expensive step in the reconstruction pipeline — vector injection — without modifying or reprocessing the original document source.

```
Doc values path (per document):

  Non-vector fields:  .fdt (disk) ──► Decompress ──► Deserialize ──► Response
  Vector field:       Columnar store ──► Vector bytes ──► Encode ──► Response

  No vector injection into _source. No re-serialization of the full document.
```

### How it works

The `knn_vector` field type now supports the `docvalue_fields` parameter in search requests. When you request a vector field through `docvalue_fields`, OpenSearch:

1. Looks up the document's ordinal in the columnar vector store.
2. Reads the raw vector bytes directly — a single sequential read.
3. Encodes the vector in the requested format (base64 binary or JSON array).

The vector retrieval is completely independent of `_source`. The stored fields file is never touched for vector data — OpenSearch skips the decompression-injection-reserialization pipeline entirely for vectors.

### Output formats

Vector retrieval using doc values supports two output formats:

| Format | Description | Response size (768-dim, k=1000) | Best for |
|:---|:---|:---|:---|
| `binary` (default) | Base64-encoded little-endian float bytes | ~2.5 MB | Programmatic clients, performance-critical paths |
| `array` | JSON numeric array | ~6 MB | Debugging, human inspection, simple clients |

The binary format is the default because it produces responses roughly 60% smaller than JSON arrays for high-dimensional vectors — less data to serialize on the server, less data on the wire, and less data to parse on the client.

### Compatibility

Vector retrieval using doc values works with:

- **All k-NN engines**: Lucene, Faiss, and NMSLIB
- **All vector data types**: `float`, `byte`, and `binary`
- **All compression levels**: no restrictions on quantization settings
- **Existing indexes**: no reindexing required — works on indexes created with any prior OpenSearch version

## How to use it

The following examples show different ways to retrieve vectors using `docvalue_fields`.

### Basic usage (binary format, the default)

```json
POST /my_index/_search
{
  "query": {
    "knn": {
      "my_vector": {
        "vector": [0.1, 0.2, 0.3, ...],
        "k": 100
      }
    }
  },
  "docvalue_fields": ["my_vector"],
  "_source": false
}
```

### Specifying format explicitly

```json
POST /my_index/_search
{
  "query": {
    "knn": {
      "my_vector": {
        "vector": [0.1, 0.2, 0.3, ...],
        "k": 100
      }
    }
  },
  "docvalue_fields": [
    {"field": "my_vector", "format": "binary"}
  ],
  "_source": false
}
```

### Recommended: Exclude vectors from `_source` and use doc values

The recommended approach is to exclude the vector field from `_source` and retrieve it through `docvalue_fields`. This way, you still get the full document metadata from `_source` (title, text, timestamps) without the overhead of vector reconstruction, while the vector comes directly from the columnar store:

```json
POST /my_index/_search
{
  "query": {
    "knn": {
      "my_vector": {
        "vector": [0.1, 0.2, 0.3, ...],
        "k": 100
      }
    }
  },
  "docvalue_fields": [{"field": "my_vector", "format": "binary"}],
  "_source": {
    "excludes": ["my_vector"]
  }
}
```

This gives you the best of both worlds: fast vector retrieval through doc values and the rest of the document from `_source` — without the expensive vector injection step.

### Maximum performance: Vectors only

If you only need the vectors and document IDs (for example, in a re-ranking pipeline), you can eliminate all `_source` and stored field overhead entirely:

```json
POST /my_index/_search
{
  "query": {
    "knn": {
      "my_vector": {
        "vector": [0.1, 0.2, 0.3, ...],
        "k": 1000
      }
    }
  },
  "stored_fields": "_none_",
  "docvalue_fields": ["_id", {"field": "my_vector", "format": "binary"}],
  "_source": false
}
```

This returns only the document ID and vector bytes — nothing else.

### Response format

**Binary format:**

```json
{
  "hits": {
    "hits": [
      {
        "_id": "doc_1",
        "_score": 0.95,
        "fields": {
          "my_vector": ["AACAPwAAAEAAAEBAAACAQA=="]
        }
      }
    ]
  }
}
```

The base64 string decodes to the raw float bytes in little-endian order. Most client libraries (Python's `struct`, Java's `ByteBuffer`, NumPy's `frombuffer`) can decode this directly.

**Array format:**

```json
{
  "hits": {
    "hits": [
      {
        "_id": "doc_1",
        "_score": 0.95,
        "fields": {
          "my_vector": [[1.0, 2.0, 3.0, 4.0]]
        }
      }
    ]
  }
}
```

## Benchmark results

We benchmarked vector retrieval using doc values against traditional `_source` retrieval to measure the real-world improvement across different configurations.

### Setup

- **Dataset**: Cohere-1M (1,000,000 vectors, 768 dimensions)
- **Cluster**: 3× r8id.4xlarge (16 vCPUs, 128 GB RAM each)
- **Index configuration**: 1 shard, 2 replicas, HNSW (Faiss), ef_construction=128, m=16, ef_search=32
- **Force merged** to 1 segment per shard
- **Queries**: 10,000 queries, single-threaded, direct node connection
- **Client**: OpenSearch Python client (`opensearch-py`) with connection pooling

### Results at k=1000

At k=1000, the improvement is dramatic because `_source` overhead dominates:

![Latency comparison at k=1000](/assets/media/blog-images/2026-06-23-retrieve-vectors-5x-faster-with-vector-doc-values/latency-k1000.png){:class="img-centered"}

| Method | E2E p50 | E2E p90 | Server-side (took) p50 | Improvement (E2E p50) | Improvement (server-side p50) |
|:---|:---|:---|:---|:---|:---|
| `_source` (baseline) | 107.2 ms | 133.0 ms | 44.0 ms | — | — |
| Doc values (binary) | 19.3 ms | 31.9 ms | 3.0 ms | **5.5x** | **14.7x** |

Server-side improvement: **44 ms → 3 ms (14.7x faster)**

The entire `_source` overhead — decompression, deserialization, vector injection, re-serialization — is eliminated. The remaining 3 ms is the k-NN graph search itself.

### Results at k=100

At k=100, the improvement is smaller because fixed costs (k-NN search, network RTT) represent a larger share of total latency:

![Latency comparison at k=100](/assets/media/blog-images/2026-06-23-retrieve-vectors-5x-faster-with-vector-doc-values/latency-k100.png){:class="img-centered"}

| Method | E2E p50 | E2E p90 | Server-side (took) p50 | Improvement (E2E p50) |
|:---|:---|:---|:---|:---|
| `_source` (baseline) | 16.5 ms | 17.4 ms | 8.0 ms | — |
| Doc values (binary) | 6.5 ms | 7.3 ms | 3.0 ms | **2.5x** |

Even at moderate k values, you save meaningful latency — especially at the server level where stored field reads drop from 8 ms to 3 ms.

### CBOR transport

For applications using binary transport protocols (CBOR or SMILE), the improvement is even more pronounced because the `_source` path is particularly expensive with these formats:

| Method | Transport | E2E p50 | Improvement compared to `_source` CBOR |
|:---|:---|:---|:---|
| `_source` (baseline) | CBOR | 92.3 ms | — |
| Doc values (binary) | CBOR | 17.8 ms | **5.2x** |

### Where the time goes

To understand why the improvement is so large at k=1000, consider the cost breakdown:

![Cost breakdown at k=1000](/assets/media/blog-images/2026-06-23-retrieve-vectors-5x-faster-with-vector-doc-values/cost-breakdown.png){:class="img-centered"}

| Component | `_source` Path | Doc values path | Scales with k? |
|:---|:---|:---|:---|
| k-NN graph search | ~2–3 ms | ~2–3 ms | No |
| Stored field reads | ~40 ms | 0 ms | Yes (linear) |
| Doc value reads | 0 ms | < 1 ms | Negligible |
| Response transfer | ~15 ms | ~13 ms | Yes (linear) |
| Client JSON parse | ~46 ms | ~3.7 ms | Yes (linear) |
| **Total E2E** | **~107 ms** | **~19 ms** | |

The stored field reads (40 ms) and client-side JSON parsing (46 ms compared to 3.7 ms for compact base64) are where most of the savings come from.

### Response payload comparison

| Method | Response size (k=1000, 768-dim) |
|:---|:---|
![Response payload comparison](/assets/media/blog-images/2026-06-23-retrieve-vectors-5x-faster-with-vector-doc-values/response-payload.png){:class="img-centered"}

| Method | Response size (k=1000, 768-dim) |
|:---|:---|
| `_source` (full document) | ~8 MB |
| Doc values (JSON array) | ~6 MB |
| Doc values (binary/base64) | ~2.5 MB |
| IDs only (no vectors) | ~50 KB |

Binary encoding delivers a **70% reduction** in response payload compared to full `_source` retrieval.

## When to use vector retrieval using doc values

Vector retrieval using doc values is most impactful when:

- **k is large** (k=100+) — `_source` overhead scales linearly with the number of returned documents.
- **RAG pipelines** — fetching context embeddings to pass to an LLM, where you need vectors but not the full document source.
- **Re-ranking workflows** — retrieving vectors for client-side or cross-encoder re-scoring.

For queries where you don't need the vectors in the response (the common case for user-facing search), continue using `_source.excludes` to exclude the vector field — that remains the fastest option since no vector bytes are transferred at all.

## What's next: Binary vector ingestion in OpenSearch 3.8

Vector retrieval using doc values solves the retrieval side. But what about ingestion?

Today, vectors are sent to OpenSearch as JSON numeric arrays — a 768-dimensional float vector becomes a JSON array of 768 numbers, consuming approximately 6 KB on the wire per vector. In [OpenSearch 3.8](https://github.com/opensearch-project/k-NN/issues/3322), we're introducing **base64 binary vector ingestion**, where clients send vectors as compact base64-encoded byte strings instead of JSON arrays.

Combined with vector retrieval using doc values, this will create a complete **binary round-trip**: ingest vectors as base64, store them efficiently, and retrieve them as base64 — no JSON numeric array parsing anywhere in the hot path.

## Conclusion

In OpenSearch 3.0, we introduced [derived source for vectors](https://opensearch.org/blog/Do-More-with-Less-Save-Up-to-3x-on-Storage-with-Derived-Vector-Source/), which reduced storage costs by up to 3x by removing vectors from `_source`. Now in OpenSearch 3.7, vector retrieval using doc values eliminates the most expensive part of reading vectors back: the `_source` decompression and re-serialization pipeline. By reading vectors directly from the columnar stored format and encoding them as compact base64 strings, we deliver **5.5x faster end-to-end latency** at k=1000 with a single query parameter change.

The feature works transparently with all k-NN engines, vector data types, and compression levels — no reindexing, no configuration changes beyond the query itself.

To get started, see the documentation:
- [Retrieve vectors using doc values](https://docs.opensearch.org/vector-search/performance-tuning-search/) (performance tuning guide)
- [Retrieving vector fields using docvalue_fields](https://docs.opensearch.org/search-plugins/searching-data/retrieve-specific-fields/) (retrieve specific fields guide)


We'd love to hear about your experience. Join the conversation on the [OpenSearch forum](https://forum.opensearch.org/) or open an issue on [GitHub](https://github.com/opensearch-project/k-NN).
