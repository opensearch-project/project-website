---
layout: post
title:  "Lower Your Cost on OpenSearch Using Binary Vectors"
authors:
- heemin
- junqiu
- vamshin
- dylantong
date: 2024-10-30 00:00:00 -0700
categories:
- technical-posts
meta_keywords: binary vectors, vector search, efficient vector storage, binary vector performance, large-scale search, cost-effective vector scaling, memory-efficient vectors
meta_description: Binary vectors significantly reduce memory and storage demands by over 90% compared to FP32 vectors, making them a powerful choice for large-scale vector search applications. Binary vectors help manage massive datasets efficiently, improving performance and cutting costs.
excerpt: Binary vectors offer a powerful, efficient alternative to FP32 vectors, reducing memory and storage by over 90% without compromising performance. They provide a cost-effective way to scale large datasets while boosting resource efficiency.
---

Imagine searching through hundreds of millions of high-dimensional vectors in just a split second, using less storage and memory than ever before. Sounds impossible? Meet binary vectors, the latest innovation for large-scale vector search! In today’s world of exploding data volumes, being able to handle massive datasets with less memory is crucial—whether you’re building recommendation systems or advanced search engines. In this post, we’ll explore how binary vectors performs compared to traditional FP32 vectors, especially with large datasets like our 768-dimensional, 100-million vector dataset. We’ll dive into how they compare in terms of storage, memory usage, and search speed, potentially changing the way you think about vector search.

## What’s the Difference Between FP32 and Binary Vectors?
<img src="/assets/media/blog-images/2024-10-30-lower-your-cost-on-opensearch-using-binary-vectors/pic1.png" alt="fp32-binary-comparison" class="img-centered"/>

FP32 vectors have been the standard for vector search because they offer high precision and integrate easily with many large language models (LLMs), which often generate vectors in floating-point formats. But this precision comes at a cost: more storage and more memory. As data needs grow, this trade-off becomes harder to justify. Instead of storing high-precision values, binary vectors use 1s and 0s, making them much lighter and faster to process. More and more LLMs are generating binary embeddings because they’re efficient on large datasets, saving storage, memory, and latency.

## Using Binary Vectors in OpenSearch

### Data preparation
To get started, you’ll need binary vector data. Fortunately, many models now generate embeddings directly in binary format; for example, the Cohere Embed V3 model produces binary vectors.

Binary vectors often come as arrays of zeros and ones, such as [0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0]. However, OpenSearch requires binary vectors packed into an int8 byte format, meaning this example would need to be converted to [108, -116].


<img src="/assets/media/blog-images/2024-10-30-lower-your-cost-on-opensearch-using-binary-vectors/pic2.png" alt="binary-vector-packing" class="img-centered"/>

The good news is that many embedding models already generate binary vectors in int8 byte format, so extra packing is usually unnecessary. But if you do have a bit array of zeros and ones, it’s easy to convert it into a byte array using the `numpy` library:

```python
import numpy as np
bit_array = [0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0] 
bit_array_np = np.array(bit_array, dtype=np.uint8) 
byte_array = np.packbits(bit_array_np).astype(np.int8).tolist()
```

### Ingestion and search
Getting started with binary vectors in OpenSearch is simple. First, set the data type to binary in your index mapping (just make sure the vector dimensions are a multiple of 8—otherwise, pad with zeros!). Note that binary vectors in OpenSearch uses Hamming distance for indexing and search.

```json
PUT /test-binary-hnsw
{
  "settings": {
    "index": {
      "knn": true
    }
  },
  "mappings": {
    "properties": {
      "my_vector": {
        "type": "knn_vector",
        "dimension": 16,
        "data_type": "binary",
        "space_type": "hamming",
        "method": {
          "name": "hnsw",
          "engine": "faiss"
        }
      }
    }
  }
}
```
The second step is to pack the binary vector into a byte format, a step needed for both indexing and searching. Other than that, working with binary vectors is just like using FP32 vectors.
The example below shows how we can index two documents with vector values of [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0] and [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1].

```json
PUT _bulk
{"index": {"_index": "test-binary-hnsw", "_id": "1"}}
{"my_vector": [7, 8]}
{"index": {"_index": "test-binary-hnsw", "_id": "2"}}
{"my_vector": [10, 11]}
```

Then we search for the vector closest to a query vector of [0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0].

```json
GET /test-binary-hnsw/_search
{
  "size": 1,
  "query": {
    "knn": {
      "my_vector": {
        "vector": [108, -116],
        "k": 1
      }
    }
  }
}
```

## Performance Comparison

Now, let’s see the resource savings we can achieve with binary vectors. Overall, we observed similar ingestion speeds and query times between FP32 and binary vectors—even while using 8x less powerful hardware for binary vectors.

<img src="/assets/media/blog-images/2024-10-30-lower-your-cost-on-opensearch-using-binary-vectors/pic3.png" alt="performance" class="img-centered"/>

### Cluster setup
We benchmarked with a 100M randomly generated vector dataset of 768 dimensions, comparing FP32 and binary vectors. The clusters were identical, except for the type and number of data nodes: binary vectors used data nodes 2x smaller and in 4x fewer numbers, resulting in an 86% cost reduction. The table below outlines the detailed setup.

<img src="/assets/media/blog-images/2024-10-30-lower-your-cost-on-opensearch-using-binary-vectors/table1.png" alt="performance" class="img-centered"/>

### Performance Result
Even with 8x smaller hardware, binary vectors had comparable indexing speeds and query times to FP32 vectors using more powerful machines. Memory usage was reduced by 92%, and storage by 97%—significant savings.

<img src="/assets/media/blog-images/2024-10-30-lower-your-cost-on-opensearch-using-binary-vectors/table2.png" alt="performance" class="img-centered"/>

### Accuracy
In terms of recall, you can achieve around 0.97 compared to exact search since OpenSearch utilizes the HNSW algorithm for approximate nearest neighbor searches. The actual accuracy, however, will depend on your dataset. Some embedding models generate binary vectors with high accuracy; for instance, [Cohere Embed v3](https://cohere.com/blog/int8-binary-embeddings) reports a 94.7% match in search quality compared to full-precision FP32 embeddings. So, with a model that produces quality binary embeddings, binary vectors can deliver accuracy close to that of FP32 vectors.


## Challenges with Binary Vectors: When They Fall Short

When your model only produces FP32 vectors and you want to leverage binary vectors in OpenSearch, things can get tricky. Here, we’ll explore how to perform binary vector search in OpenSearch using FP32 vectors, along with the challenges involved.

For this example, we used the [Cohere Simple dataset](https://huggingface.co/datasets/nreimers/wikipedia-22-12-large/tree/main) (available on Hugging Face). Since the data was in FP32, we converted it to binary by setting values zero and below to zero, and values above zero to one.

<img src="/assets/media/blog-images/2024-10-30-lower-your-cost-on-opensearch-using-binary-vectors/pic4.png" alt="binary-quantization" class="img-centered"/>

In terms of recall, binary vectors achieved a score of 0.73196. To reach 0.93865 recall, we needed 3x oversampling. Also, re-scoring requires storing the original vector format, which adds disk usage unless the original vector is kept outside the OpenSearch cluster. Keep in mind that recall rates may vary by dataset.
<img src="/assets/media/blog-images/2024-10-30-lower-your-cost-on-opensearch-using-binary-vectors/pic5.png" alt="oversampling-re-scoring" class="img-centered"/>
With all this—quantization, oversampling, and re-scoring—binary vectors can achieve recall similar to FP32 while using significantly less memory. However, managing these steps outside OpenSearch can be cumbersome. That’s where [disk-based vector search](https://opensearch.org/docs/latest/search-plugins/knn/disk-based-vector-search/) comes in, handling all these steps automatically with advanced quantization techniques. Give it a try and see the difference!

## Conclusion
Binary vectors offer a powerful, efficient alternative to FP32 vectors, cutting memory and storage usage by over 90% while maintaining strong performance on smaller hardware. This efficiency makes binary vectors ideal for large-scale vector search applications like recommendation systems or search engines, where speed and resource savings are critical. If you’re handling massive datasets, binary vectors provide a practical way to scale search capabilities without escalating costs—try them on your data to experience the difference.

## What's next?
Binary vector support is now available with OpenSearch 2.16! Check out the OpenSearch [binary-vector](https://opensearch.org/docs/latest/field-types/supported-field-types/knn-vector#binary-vectors) documentation to explore it yourself. There’s more: if you’re working with floating-point vectors and want the memory efficiency of binary vectors without losing recall, [disk-based vector search](https://opensearch.org/docs/latest/search-plugins/knn/disk-based-vector-search/) is here to help. It takes care of binary quantization, oversampling, and re-scoring automatically, all while keeping memory usage as low as binary vectors. Ready to dive in? Visit the disk-based vector search documentation and see how easy it is to get started! Keep an eye out for an upcoming blog on disk-based vector search.