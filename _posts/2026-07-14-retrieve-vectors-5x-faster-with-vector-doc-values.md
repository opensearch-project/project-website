---
layout: post
title: "Retrieve vectors 5x faster with docvalue_fields in OpenSearch"
authors:
  - navneev
  - vamshin
date: 2026-07-14
has_science_table: true
categories:
  - technical-posts
meta_keywords: "OpenSearch vector retrieval, docvalue_fields, OpenSearch 3.7, k-NN vector performance, RAG pipeline optimization, vector search latency, columnar vector store, Base64 vector encoding, OpenSearch benchmark"
meta_description: "Retrieve vectors 5x faster in OpenSearch 3.7 using docvalue_fields. Bypass _source reconstruction for 5.5x lower latency and 14.7x faster server-side processing at k=1000"
excerpt: "As vector search workloads scale, retrieving vectors from search results becomes a bottleneck. Vector retrieval using doc values in OpenSearch 3.7 bypasses the expensive _source vector reconstruction path, delivering 5.5x faster end-to-end retrieval and 14.7x faster server-side performance."
---

Vector search doesn't end at finding nearest neighbors. Many real-world applications need the vectors themselves returned in the response. For example, retrieval-augmented generation (RAG) pipelines fetch context embeddings for downstream large language model (LLM) calls, reranking systems compute cross-encoder scores, and client-side post-processing applies diversity or business-rule filtering. As k grows (k=100, k=500, or even k=1000), the cost of returning those vectors starts to dominate total query latency.

OpenSearch 3.7 introduces an optimized way to retrieve vectors from their columnar stored format using `docvalue_fields`, bypassing the expensive `_source` vector reconstruction path. The feature requires no reindexing, works on all existing older indexes, and supports all vector data types. The results: **5.5x faster end-to-end latency** and **14.7x faster server-side processing** at k=1000.

## The traditional `_source` retrieval path

To understand why this matters, consider what happens when you request vectors in search results using the traditional `_source` path.

Starting with OpenSearch 3.0, vectors are no longer stored in the `.fdt` (stored fields) file. Instead, they are stored in a columnar format in the `.vec` file—a structure optimized for sequential vector access. This change was introduced as part of [derived source for vectors](https://opensearch.org/blog/Do-More-with-Less-Save-Up-to-3x-on-Storage-with-Derived-Vector-Source/), which reduced storage costs by up to 3x.

However, when you request vectors using `_source`, OpenSearch still follows the following multi-step reconstruction process:

1. **Read** the compressed `_source` (without vectors) from the `.fdt` file on disk.
2. **Decompress** the stored field data.
3. **Deserialize** the raw bytes into a document map.
4. **Read** the vector from the `.vec` file and **inject** it into the deserialized document at the correct field path.
5. **Reserialize** the entire document back to JSON bytes in order to return it in the response.

Every one of these steps runs *per document*. At k=1000 with 768-dimensional vectors, that means reading, decompressing, deserializing, injecting, and re-serializing roughly 8 MB of response data per query.

In our benchmarks, this reconstruction overhead alone can add up to tens of milliseconds per query at high k values—time spent entirely on marshaling data that already exists in a readily accessible columnar format. The vector is right there, stored in a columnar structure optimized for sequential access. Reading it through `_source` is unnecessarily indirect.

## Retrieving vectors directly from the columnar store

Vector retrieval using doc values separates vectors from non-vector fields in the response. Instead of routing vectors through the `_source` reconstruction pipeline described in the preceding section, OpenSearch leaves `_source` untouched and reads vectors directly from the columnar store with a **single seek per document**. The vectors are then returned in a separate `fields` key in the response.

Non-vector fields (title, text, metadata) continue to be served from `_source` as before. By keeping vectors out of the `_source` path entirely, vector injection (the most expensive step in the reconstruction pipeline) is eliminated without modifying or reprocessing the original document source.

The following diagram compares the two retrieval paths:

```
Doc values path (per document):

  Non-vector fields:  .fdt (disk) ──► Decompress ──► Deserialize ──► Response
  Vector field:       Columnar store ──► Vector bytes ──► Encode ──► Response

  No vector injection into _source. No re-serialization of the full document.
```

### The doc values retrieval process

The `knn_vector` field type now supports the `docvalue_fields` parameter in search requests. When you request a vector field through `docvalue_fields`, OpenSearch performs the following steps:

1. Looks up the document's ordinal in the columnar vector store.
2. Reads the raw vector bytes directly in a single, sequential read.
3. Encodes the vector in the requested format (Base64 binary or JSON array).

The vector retrieval is completely independent of `_source`. The stored fields file is never accessed for vector data. OpenSearch skips the decompression-injection-reserialization pipeline entirely for vectors.

### Output formats

Vector retrieval using doc values supports the following output formats.

| Format | Description | Response size (768-dim, k=1000) | Best for |
|:---|:---|:---|:---|
| `binary` (default) | Base64-encoded little-endian float bytes | ~2.5 MB | Programmatic clients, performance-critical paths |
| `array` | JSON numeric array | ~6 MB | Debugging, human inspection, simple clients |

The binary format is the default because it produces responses roughly 60% smaller than JSON arrays for high-dimensional vectors. This reduces the amount of data to serialize on the server, transfer over the network, and parse on the client.

### Compatibility

Vector retrieval using doc values works with:

- **All k-NN engines**: Lucene, Faiss, and NMSLIB
- **All vector data types**: `float`, `byte`, and `binary`
- **All compression levels**: No restrictions on quantization settings
- **Existing indexes**: No reindexing required—works on indexes created with any prior OpenSearch version

## Using doc values for vector retrieval

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

### Excluding vectors from `_source` and use doc values

We recommend excluding the vector field from `_source` and retrieving it through `docvalue_fields`. This way, you still get the full document metadata from `_source` (title, text, timestamps) without the overhead of vector reconstruction, while the vector comes directly from the columnar store:

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

### Using vectors only for maximum performance

If you only need the vectors and document IDs (for example, in a reranking pipeline), you can eliminate all `_source` and stored field overhead entirely. This request returns only the document ID and vector bytes:

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

In this response, the Base64 string decodes to the raw float bytes in little-endian order. Most client libraries (Python's `struct`, Java's `ByteBuffer`, NumPy's `frombuffer`) can decode this directly.

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

The benchmarks used the following configuration:

- **Dataset**: Cohere-1M (1,000,000 vectors, 768 dimensions)
- **Cluster**: 3× r8id.4xlarge (16 vCPUs, 128 GB RAM each)
- **Index configuration**: 1 shard, 2 replicas, Hierarchical Navigable Small World (HNSW) with Faiss, `ef_construction`=128, `m`=16, `ef_search`=32
- **Force merged** to 1 segment per shard
- **Queries**: 10,000 queries, single-threaded, direct node connection
- **Client**: OpenSearch Python client (`opensearch-py`) with connection pooling

### Results at k=1000

At k=1000, the improvement is dramatic because `_source` overhead dominates, as shown in the following image.

![Latency comparison at k=1000](/assets/media/blog-images/2026-06-23-retrieve-vectors-5x-faster-with-vector-doc-values/latency-k1000.png){:class="img-centered"}

The following table shows the latency comparison at k=1000.

| Method | E2E p50 | E2E p90 | Server-side (took) p50 | Improvement (E2E p50) | Improvement (server-side p50) |
|:---|:---|:---|:---|:---|:---|
| `_source` (baseline) | 107.2 ms | 133.0 ms | 44.0 ms |—|—|
| Doc values (binary) | 19.3 ms | 31.9 ms | 3.0 ms | **5.5x** | **14.7x** |

Server-side improvement: **44 ms → 3 ms (14.7x faster)**

The entire `_source` overhead (decompression, deserialization, vector injection, re-serialization) is eliminated. The remaining 3 ms is the k-NN graph search itself.

### Results at k=100

At k=100, the improvement is smaller because fixed costs (k-NN search, network round-trip time) represent a larger share of total latency, as shown in the following image.

![Latency comparison at k=100](/assets/media/blog-images/2026-06-23-retrieve-vectors-5x-faster-with-vector-doc-values/latency-k100.png){:class="img-centered"}

The following table shows the latency comparison at k=100.

| Method | E2E p50 | E2E p90 | Server-side (took) p50 | Improvement (E2E p50) |
|:---|:---|:---|:---|:---|
| `_source` (baseline) | 16.5 ms | 17.4 ms | 8.0 ms |—|
| Doc values (binary) | 6.5 ms | 7.3 ms | 3.0 ms | **2.5x** |

Even at moderate k values, you save meaningful latency—especially at the server level, where stored field reads drop from 8 ms to 3 ms.

### CBOR transport

For applications using binary transport protocols such as Concise Binary Object Representation (CBOR) or Smile, the improvement is even more pronounced because the `_source` path is particularly expensive with these formats, as shown in the following table.

| Method | Transport | E2E p50 | Improvement compared to `_source` CBOR |
|:---|:---|:---|:---|
| `_source` (baseline) | CBOR | 92.3 ms |—|
| Doc values (binary) | CBOR | 17.8 ms | **5.2x** |

### Latency breakdown by component

To understand why the improvement is so large at k=1000, consider the cost breakdown shown in the following image.

![Cost breakdown at k=1000](/assets/media/blog-images/2026-06-23-retrieve-vectors-5x-faster-with-vector-doc-values/cost-breakdown.png){:class="img-centered"}

The following table presents the time spent in each component.

| Component | `_source` Path | Doc values path | Scales with k? |
|:---|:---|:---|:---|
| k-NN graph search | ~2–3 ms | ~2–3 ms | No |
| Stored field reads | ~40 ms | 0 ms | Yes (linear) |
| Doc value reads | 0 ms | < 1 ms | Negligible |
| Response transfer | ~15 ms | ~13 ms | Yes (linear) |
| Client JSON parse | ~46 ms | ~3.7 ms | Yes (linear) |
| **Total E2E** | **~107 ms** | **~19 ms** | |

The stored field reads (40 ms) and client-side JSON parsing (46 ms compared to 3.7 ms for compact Base64 encoding) account for most of the latency reduction.

### Response payload comparison

The following image compares response payload sizes across retrieval methods.

![Response payload comparison](/assets/media/blog-images/2026-06-23-retrieve-vectors-5x-faster-with-vector-doc-values/response-payload.png){:class="img-centered"}

The following table lists the response sizes for each method.

| Method | Response size (k=1000, 768-dim) |
|:---|:---|
| `_source` (full document) | ~8 MB |
| Doc values (JSON array) | ~6 MB |
| Doc values (binary/Base64) | ~2.5 MB |
| IDs only (no vectors) | ~50 KB |

Binary encoding delivers a **70% reduction** in response payload compared to full `_source` retrieval.

## When to use vector retrieval using doc values

Vector retrieval using doc values is most impactful when:

- **k is large** (k=100+) -- `_source` overhead scales linearly with the number of returned documents.
- **RAG pipelines** -- fetching context embeddings to pass to an LLM, where you need vectors but not the full document source.
- **Re-ranking workflows** -- retrieving vectors for client-side or cross-encoder rescoring.

For queries in which you don't need the vectors in the response (the common case for user-facing search), continue using `_source.excludes` to exclude the vector field. This remains the fastest option because no vector bytes are transferred at all.

## What's next: Binary vector ingestion in OpenSearch 3.8

Vector retrieval using doc values solves the performance problem on the retrieval side. But what about ingestion?

Today, vectors are sent to OpenSearch as JSON numeric arrays. A 768-dimensional float vector becomes a JSON array of 768 numbers, consuming approximately 6 KB on the wire per vector. [OpenSearch 3.8](https://github.com/opensearch-project/k-NN/issues/3322) will introduce **Base64 binary vector ingestion**, in which clients send vectors as compact Base64-encoded byte strings instead of JSON arrays.

Combined with vector retrieval using doc values, this will create a complete **binary round trip**: ingest vectors as Base64 values, store them efficiently, and retrieve them as Base64 values; no JSON numeric array parsing at any point in the request lifecycle.

## Conclusion

OpenSearch 3.0 introduced [derived source for vectors](https://opensearch.org/blog/Do-More-with-Less-Save-Up-to-3x-on-Storage-with-Derived-Vector-Source/), which reduced storage costs by up to 3x by removing vectors from `_source`. In OpenSearch 3.7, vector retrieval using doc values eliminates the most expensive part of reading vectors: the `_source` decompression and reserialization pipeline. By reading vectors directly from the columnar stored format and encoding them as compact Base64 strings, OpenSearch delivers **5.5x faster end-to-end latency** at k=1000 with a single query parameter change.

To get started, see the documentation:
- [Retrieve vectors using doc values](https://docs.opensearch.org/vector-search/performance-tuning-search/) -- Performance tuning guide
- [Retrieving vector fields using docvalue_fields](https://docs.opensearch.org/search-plugins/searching-data/retrieve-specific-fields/) -- Guide for retrieving specific fields


We'd love to hear about your experience. Join the conversation on the [OpenSearch forum](https://forum.opensearch.org/) or open an issue on [GitHub](https://github.com/opensearch-project/k-NN).
