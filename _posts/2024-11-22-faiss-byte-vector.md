---
layout: post
title: Introducing byte vector support for Faiss in the OpenSearch vector engine
authors:
   - naveen
   - navneev
   - vamshin
   - dylantong
   - kolchfa
date: 2024-11-22
categories: 
    - technical-posts
has_science_table: true
meta_keywords: Faiss byte vectors in OpenSearch, similarity search, vector search, large-scale applications, memory efficiency, quantization techniques, benchmarking results, signed byte range
meta_description: Learn how byte vectors improve memory efficiency and performance in large-scale similarity search applications. Discover benchmarking results, quantization techniques, and use cases for Faiss byte vectors in OpenSearch.
---

The growing popularity of generative AI and large language models (LLMs) has led to an increased demand for efficient vector search and similarity operations. These models often rely on high-dimensional vector representations of text, images, or other data. Performing similarity searches or nearest neighbor queries on these vectors becomes computationally expensive, especially as vector databases grow in size. OpenSearch's support for Faiss byte vectors offers a promising solution to these challenges.

Using byte vectors instead of float vectors for vector search provides significant improvements in memory efficiency and performance. This is especially beneficial for large-scale vector databases or environments with limited resources. Faiss byte vectors enable you to store quantized embeddings, significantly reducing memory consumption and lowering costs. This approach typically results in only minimal recall loss compared to using full-precision (float) vectors.


## How to use a Faiss byte vector

A byte vector is a compact vector representation in which each dimension is a signed 8-bit integer ranging from -128 to 127. To use byte vectors, you must convert your input vectors, typically in `float` format, into the `byte` type before ingestion. This process requires quantization techniques, which compress float vectors while maintaining essential data characteristics. For more information, see [Quantization techniques](https://opensearch.org/docs/latest/field-types/supported-field-types/knn-vector#quantization-techniques).

To use a `byte` vector, set the `data_type` parameter to `byte` when creating a k-NN index (the default value of the `data_type` parameter is `float`):


```json
PUT test-index
{
  "settings": {
    "index": {
      "knn": true
    }
  },
  "mappings": {
    "properties": {
      "my_vector1": {
        "type": "knn_vector",
        "dimension": 8,
        "data_type": "byte",
        "method": {
          "name": "hnsw",
          "space_type": "l2",
          "engine": "faiss",
          "parameters": {
            "ef_construction": 100,
            "m": 16
          }
        }
      }
    }
  }
} 
```

During ingestion, make sure that each dimension of the vector is within the supported [-128, 127] range:

```json
PUT test-index/_doc/1
{
"my_vector": [-126, 28, 127, 0, 10, -45, 12, -110]
} 
```

```json
PUT test-index/_doc/2
{
"my_vector": [100, -25, 4, -67, -2, 127, 99, 0]
} 
```

During querying, make sure that the query vector is also within the byte range:

```json
GET test-index/_search
{
  "size": 2,
  "query": {
    "knn": {
      "my_vector1": {
        "vector": [-1, 45, -100, 125, -128, -8, 5, 10],
        "k": 2
      }
    }
  }
}
```

**Note**: When using `byte` vectors, expect some loss of recall precision as compared to using `float` vectors. Byte vectors are useful for large-scale applications and use cases that prioritize reducing memory usage in exchange for a minimal loss in recall.


## Benchmarking results

We used OpenSearch Benchmark to run benchmarking tests on popular datasets to compare recall, indexing, and search performance between float vectors and byte vectors using Faiss HNSW.

**Note**: Without SIMD optimization (such as AVX2 or NEON) or when AVX2 is disabled (on x86 architectures), the quantization process introduces additional latency. For more information about AVX2-compatible processors, see [CPUs with AVX2](https://en.wikipedia.org/wiki/Advanced_Vector_Extensions#CPUs_with_AVX2). In an AWS environment, all community Amazon Machine Images (AMIs) with [HVM](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/virtualization_types.html) support AVX2 optimization.

These tests were conducted on a single-node cluster, except for the cohere-10m dataset, which used two `r5.2xlarge` instances. 

### Configuration

The following table lists the cluster configuration for the benchmarking tests.

|`m`	|`ef_construction`	|`ef_search`	|Replicas	|Primary shards	|Indexing clients	|
|---	|---	|---	|---	|---	|---	|
|16	|100	|100	|0	|8	|16	|

The following table lists the dataset configuration for the benchmarking tests.

|Dataset ID	|Dataset	|Vector dimension	|Data size	|Number of queries	|Training data range	|Query data range	|Space type	|
|---	|---	|---	|---	|---	|---	|---	|---	|
|**Dataset 1**	|gist-960-euclidean	|960	|1,000,000	|1,000	|[0.0, 1.48]	|[0.0, 0.729]	|L2	|
|**Dataset 2**	|cohere-ip-10m	|768	|10,000,000	|10,000	|[-4.142334, 5.5211477]	|[-4.109505, 5.4809895]	|innerproduct	|
|**Dataset 3**	|cohere-ip-1m	|768	|1,000,000	|10,000	|[-4.1073565, 5.504557]	|[-4.109505, 5.4809895]	|innerproduct	|
|**Dataset 4**	|sift-128-euclidean	|128	|1,000,000	|10,000	|[0.0, 218.0]	|[0.0, 184.0]	|L2	|

### Recall, memory, and indexing results

|Dataset ID	|Faiss HNSW recall@100	|Faiss HNSW byte recall@100	|% Reduction in recall	|Faiss HNSW memory usage (GB)	|Faiss HNSW byte memory usage (GB)	|% Reduction in memory	|Faiss HNSW mean indexing throughput (docs/sec)	|Faiss HNSW byte mean indexing throughput (docs/sec)	|% Gain in indexing throughput	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|**Dataset 1**	|0.91	|0.89	|2.20	|3.72	|1.04	|72.00	|4673	|9686	|107.28	|
|**Dataset 2**	|0.91	|0.83	|8.79	|30.03	|8.57	|71.46	|4911	|10207	|107.84	|
|**Dataset 3**	|0.94	|0.86	|8.51	|3.00	|0.86	|71.33	|6112	|11673	|90.98	|
|**Dataset 4**	|0.99	|0.98	|1.01	|0.62	|0.26	|58.06	|38273	|43267	|13.05	|

### Query results

|Dataset ID	|Query clients	|Faiss HNSW p90 (ms)	|Faiss HNSW byte p90 (ms)	|Faiss HNSW p99 (ms)	|Faiss HNSW byte p99 (ms)	|
|---	|---	|---	|---	|---	|---	|
|**Dataset 1**	|**1**	|5.35	|5.34	|5.95	|5.59	|
|**Dataset 1**	|**8**	|6.68	|6.64	|10.23	|9.14	|
|**Dataset 1**	|**16**	|10.59	|7.38	|12.94	|11.47	|
|	|	|	|	|	|	|
|**Dataset 2**	|**1**	|7.39	|7.14	|8.35	|7.59	|
|**Dataset 2**|**8**	|15.47	|14.83	|21.38	|16.20	|
|**Dataset 2**	|**16**	|25.01	|25.32	|31.98	|29.42	|
|	|	|	|	|	|	|
|**Dataset 3**	|**1**	|4.97	|4.72	|5.62	|5.02	|
|**Dataset 3**	|**8**	|6.75	|5.98	|7.69	|7.7	|
|**Dataset 3**	|**16**	|10.51	|6.94	|13.87	|12.4	|
|	|	|	|	|	|	|
|**Dataset 4**	|**1**	|2.91	|3.03	|3.16	|3.15	|
|**Dataset 4**|**8**	|3.38	|3.30	|6.30	|4.75	|
|**Dataset 4**	|**16**	|4.35	|3.80	|8.76	|8.83	|

### Key findings

The following are the key findings derived from comparing the benchmarking results:

- **Memory savings**: Byte vectors reduced memory usage by up to **72%**, with higher-dimensional vectors achieving greater reductions.
- **Indexing performance**: The mean indexing throughput for byte vectors was **2x to 107.84%** higher than for float vectors, especially with larger vector dimensions.
- **Search performance**: Search latencies were similar, with byte vectors occasionally performing better.
- **Recall**: For byte vectors, there was a slight (up to **8.8%**) reduction in recall as compared to float vectors, depending on the dataset and the quantization technique used.

## How does Faiss work with byte vectors internally?

Faiss doesn't directly support the `byte` data type for vector storage. To achieve this, OpenSearch uses a  [`QT_8bit_direct_signed` scalar quantizer](https://faiss.ai/cpp_api/struct/structfaiss_1_1ScalarQuantizer.html). This quantizer accepts float vectors within the signed 8-bit value range and encodes them as unsigned 8-bit integer vectors. During indexing and search, these encoded unsigned 8-bit integer vectors are decoded back into signed 8-bit original vectors for distance computation.

This quantization approach reduces the memory footprint by a factor of four. However, encoding and decoding during scalar quantization introduce additional latency. To mitigate this, you can use [SIMD optimization](https://opensearch.org/docs/latest/search-plugins/knn/knn-index#simd-optimization-for-the-faiss-engine) with the `QT_8bit_direct_signed` quantizer to reduce search latencies and improve indexing throughput.

### Example

The following example shows how an input vector is encoded and decoded using the `QT_8bit_direct_signed` scalar quantizer:

```c
// Input vector:
[-126, 28, 127, 0, 10, -45, 12, -110]

// Encoded vector generated by adding 128 to each dimension of the input vector to convert signed int8 to unsigned int8:
[2, 156, 255, 128, 138, 83, 140, 18]

// Encoded vector is decoded back into the original signed int8 vector by subtracting 128 from each dimension for distance computation:
[-126, 28, 127, 0, 10, -45, 12, -110]
```

## Conclusion

OpenSearch 2.17 introduced support for Faiss byte vectors, allowing you to efficiently store quantized byte vector embeddings. This reduces memory consumption by up to 75%, lowers costs, and maintains high performance. These advantages make byte vectors an excellent choice for large-scale similarity search applications, especially when memory resources are limited, and applications that handle large volumes of data within the signed byte value range.

## Future enhancements

In future versions, we plan to enhance this feature by adding an `on_disk` mode with a `4x` Faiss compression level. This mode will accept `fp32` vectors as input, perform online training, and quantize the data into byte-sized vectors, eliminating the need to perform external quantization.

## References

* [Benchmarking datasets](https://github.com/erikbern/ann-benchmarks?tab=readme-ov-file#data-sets)
* [Cohere/wikipedia-22-12-simple-embeddings](https://huggingface.co/datasets/Cohere/wikipedia-22-12-simple-embeddings)
* Matthijs Douze, Alexandr Guzhva, Chengqi Deng, Jeff Johnson, Gergely Szilvasy, Pierre-Emmanuel Mazar’e, Maria Lomeli, Lucas Hosseini and Herv’e J’egou. The Faiss library. [https://arxiv.org/abs/2401.08281](https://arxiv.org/abs/2401.08281)

