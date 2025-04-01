---
layout: post
title:  "Boost OpenSearch Vector Search performance with Intel® AVX-512"
authors:
  - assanedi
  - ashankaran
  - mulugetam
  - noahstavely
  - navtat
  - vamshin
  - dylantong
date: 2025-03-27
has_science_table: true
categories:
  - technical-posts
meta_keywords: OpenSearch vector search, Intel AVX-512, Faiss library optimization, vector search performance, vector search benchmarks, vectorization in OpenSearch, COHERE-1M with fp32, gist-1m dataset is 
meta_description: Discover how Intel AVX-512 accelerates OpenSearch vector search performance with up to 18% faster search operations and 15% improved indexing throughput compared to AVX2.
---

# Introduction

Intel® Advanced Vector Extensions 512 (Intel AVX-512) is a set of new instructions that can accelerate performance of vector workloads, and was introduced in OpenSearch 2.18. Vector search benchmarks using OpenSearch showed performance boosts up to 15% for indexing and up to 18% for search tasks, when compared to performance of the same workloads using AVX2, a predecessor of the technology. 

Increasingly, application builders are using vector search to improve the search quality of their applications. This modern technique involves encoding content into numerical representations (vectors) that can be used to find similarities between content. With the rise in usage of Large Language Models (LLMs) and Generative AI (GenAI), the workloads have increased from millions to billions of vectors. With the rise in vector data, maintaining ingestion and query performance on such huge workloads becomes critical.

In this blog, we will share some results of some popular OpenSearch workloads using Intel AVX-512 vs AVX2, and compare their performance. The benchmarks were ran using  [OpenSearch Benchmark (OSB)](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/vectorsearch) and showcase how Intel AVX-512 provides a performance boost over AVX2, for fp32 and fp16 quantization uing the Faiss library. The hardware accelerators are widely available on AWS, and 4th Generation Intel Xeon Scalable processors available as r7i were used for these benchmarks. 

# Importance of vectorization in OpenSearch vector search

Vector search uses advanced techniques like cosine similarity, euclidean distance etc. to quickly and efficiently find similar items. This is especially useful in large datasets where traditional search methods would be slower. Furthermore vectorized data can be processed in parallel, making it highly scalable and ensuring that as the dataset grows, the search performance remains optimal. Intel AVX-512 can further improve the vector search throughput by processing more vectors. 

#  **Why Intel AVX-512 performs better** 

The techniques used in vector search are computationally intensive, and Intel AVX-512 is well positioned to tackle these challenges. The accelerator can be directly leveraged in several ways: 1) writing native code using intrinsics, or 2) by compilers using advanced features such as enabling auto-vectorization.
The corresponding optimized assembly instructions are generated when the accelerator is correctly utilized. AVX2 generates instructions using YMM registers, and AVX512 generates instructions using ZMM registers. Performance gets enhanced by allowing ZMM registers to handle 32 double-precision and 64 single-precision floating-point operations per clock cycle within 512-bit vectors. Additionally, these registers can process eight 64-bit and sixteen 32-bit integers. With up to two 512-bit fused-multiply add (FMA) units, AVX-512 effectively doubles the width of data registers, the number of registers, and the width of FMA units compared to Intel AVX2 YMM registers. Beyond these improvements, Intel AVX-512 offers increased parallelism, which leads to faster data processing and improved performance in compute-intensive applications such as scientific simulations, analytics, and machine learning. It also provides enhanced support for complex number calculations and accelerates tasks like cryptography and data compression. Furthermore, AVX-512 includes new instructions that improve the efficiency of certain algorithms, reduce power consumption, and optimize resource utilization, making it a powerful tool for modern computing needs.
By registering double width to 512 bits, the use of ZMM registers over YMM registers can potentially double the data throughput and computational power. When AVX-512 extension is detected, the Faiss distance and scalar quantizer functions  process 16 vectors per loop compared to 8 vectors per loop for AVX2 extension. 
Hence in Vector Search with k-NN, index build times and vector search performance can be enhanced with the use of these new hardware extensions.

#  **What is the hotspot in vector search using OpenSearch?** 

AVX-512, due to Single Input Multiple Data (SIMD) processing, helps reduce cycles spent in hot functions during indexing and search for both inner product and L2 (euclidean) space types, especially notable in the FP32 encoding indexing. The next section describes the hot functions observed during an OpenSearch benchmark execution, and the corresponding improvements observed when they are vectorized using AVX-512. The baseline used is the AVX2 version of Faiss library. The **% cycles spent** is the percentage of time spent by the CPU on the particular function during the benchmark run.

### **Inner Product Space Type**

* **FP32 Encoding:**  
  * Hot functions:  
    * *faiss::fvec\_inner\_product*   
    * *faiss::fvec\_inner\_product\_batch\_4*.  
  * Benefits of AVX-512:  
    * Indexing: Up to 75% reduction in cycles.  
    * Search: Up to 8% reduction in cycles.  
* **SQFP16 Encoding:**  
  * Hot function: *faiss::query\_to\_code*.  
  * Benefits of AVX-512:  
    * Indexing: Up to 39% reduction in cycles.  
    * Search: Up to 11% reduction in cycles.

### **L2 (euclidean) Space Type**

* **FP32 Encoding:**  
  * Hot functions:   
    * *faiss::fvec\_L2sqr*   
    * *faiss::fvec\_L2sqrt\_batch\_4*.  
  * Benefits of AVX-512:  
    * Indexing: Up to 54% reduction in cycles.  
    * Search: Up to 11% reduction in cycles.  
* **SQFP16 Encoding:**  
  * Hot function: *faiss::query\_to\_code*.  
  * Benefits of AVX-512:  
    * Indexing: Up to 17% reduction in cycles.  
    * Search: Up to 6% reduction in cycles.

| Inner Product space type |  |  |  |  |
| ----- | :---- | :---- | :---- | :---- |
|  | Encoding | Function | %Cycle Spent (AVX2) | %Cycle Spent (AVX512) |
| Indexing | fp32 | fvec\_inner\_product | 28.86 | 7.32 |
| Indexing | SQfp16 | query\_to\_code | 17.95 | 10.94 |
| Search | fp32 | fvec\_inner\_product\_batch\_4 | 34.66 | 31.74 |
| Search | SQfp16 | query\_to\_code | 42.24 | 37.73 |

| L2 space type |  |  |  |  |
| ----- | :---- | :---- | :---- | :---- |
|  | Encoding | Function | %Cycle Spent (AVX2) | %Cycle Spent (AVX512) |
| Indexing | fp32 | fvec\_L2sqr | 36.76 | 16.75 |
| Indexing | SQfp16 | query\_to\_code | 26.18 | 21.61 |
| Search | fp32 | fvec\_L2sqr\_bactch\_4 | 31.80 | 28.32 |
| Search | SQfp16 | query\_to\_code | 36.99 | 34.72 |

Starting with OpenSearch version 2.18, AVX-512 is enabled by default. As of March 2025, OpenSearch has shown best performance for AVX-512 on AWS r7i instances. 

The next section describes benchmark results that were run with AVX2 and AVX-512 versions of the Faiss library shipped for x64 architecture ([Documentation](https://opensearch.org/docs/latest/search-plugins/knn/knn-index/#supported-lucene-methods:~:text=multiple%20of%208.-,x64%20architecture,libopensearchknn_faiss.so%3A%20The%20non%2Doptimized%20Faiss%20library%20without%20SIMD%20instructions.,-When%20using%20the)). These benchmarks were run using [OpenSearch Benchmark (OSB) vector search workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/vectorsearch) using configuration in appendix1.

## **Results**

The results show that the time spent in hot functions of the distance calculation is significantly reduced due to AVX-512, and the OpenSearch cluster shows higher throughput on search and indexing. 

SQfp16 encoding provided by the Faiss library further helps with faster computation and efficient storage by compressing the 32-bit floating point vectors into 16-bit floating point format. The smaller memory footprints allows for more vectors to be stored in the same amount of memory while the operations on the 16-bits floats are typically faster than those on 32-bit floats, leading to quicker similarity searches. 

A higher performance improvement is observed between AVX512 and AVX2 on fp16, due to code optimizations and the use of AVX-512 intrinsics in Faiss, which are not present on AVX2. 

A general observation across all benchmarks is that AVX-512 improves performance due to significant reduction in [pathlength](https://en.wikipedia.org/wiki/Instruction_path_length), which is the number of machine instructions needed to execute a workload. 

### **COHERE-1M WITH fp32**

Indexing operations see a 9% boost, while search throughput and latencies show respectively a 7% and 6% improvement compared to AVX2.

![Search QPS fp32 for cohere-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-1m-search-qps-fp32.png){: .img-fluid}

![Search latencies fp32 for cohere-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-1m-search-latencies-fp32.png){: .img-fluid}

![Indexing throughput fp32 for cohere-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-1m-indexing-fp32.png){: .img-fluid}

### **COHERE-1M WITH SQfp16**

Indexing operations see an 11% boost, while search operations and latencies both show a 10% improvement due to AVX-512 compared to AVX2. 

![Search QPS fp16 for cohere-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-1m-search-qps-fp16.png){: .img-fluid}

![Search latencies fp16 for cohere-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-1m-search-latencies-fp16.png){: .img-fluid}

![Indexing throughput fp16 for cohere-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-1m-indexing-fp16.png){: .img-fluid}

### **GIST-1M WITH fp32**

Indexing operations see a 5% boost, while search throughput and latencies show respectively a 2% and 6% improvement compared to AVX2. While search throughput with the gist-1m dataset is not comparable to cohere-1m dataset, the latency boost is maintained.

![Search QPS fp32 for gist-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/gist-1m-search-qps-fp32.png){: .img-fluid}

![Search latencies fp32 for gist-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/gist-1m-search-latencies-fp32.png){: .img-fluid}

![Indexing throughput fp32 for gist-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/gist-1m-indexing-fp32.png){: .img-fluid}

### **GIST-1M WITH SQfp16**

Indexing operations see a 15% boost, while search throughput and latencies both show a 7% improvement compared to AVX2.

![Search QPS fp16 for gist-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/gist-1m-search-qps-fp16.png){: .img-fluid}

![Search latencies fp16 for gist-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/gist-1m-search-latencies-fp16.png){: .img-fluid}

![Indexing throughput fp16 for gist-1m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/gist-1m-indexing-fp16.png){: .img-fluid}

### **COHERE-10M WITH fp32**

Indexing operations see a 8% boost, while search latencies show 5% improvement compared to AVX2. Scaling search clients from 20-280 shows up to 12% QPS boost with AVX-512.

![Scaling search QPS fp32 for cohere-10m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-10m-search-scaling-fp32.png){: .img-fluid}

![Indexing throughput fp32 for cohere-10m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-10m-indexing-fp32.png){: .img-fluid}

### **COHERE-10M WITH SQfp16**

SQfp16 encoding with AVX-512 delivers a 6% performance boost in indexing and a 5% improvement in search latencies. Scaling search clients from 20-280 clients for throughput analysis shows up to an 18% QPS boost, with 10% lower latencies on average due to AVX-512.

![Search latencies fp16 for cohere-10m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-10m-search-latencies-fp16.png){: .img-fluid}

![Scaling search QPS fp16 for cohere-10m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-10m-search-scaling-fp16.png){: .img-fluid}

![Scaling search latencies fp16 for cohere-10m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-10m-search-latencies-scaling-fp16.png){: .img-fluid}

![Indexing throughput fp16 for cohere-10m dataset](/assets/media/blog-images/2025-03-24-Boost-OpenSearch-VectorSearch-Performance-With-Intel-AVX512/cohere-10m-indexing-fp16.png){: .img-fluid}

These results show how the Intel AVX-512 optimizations in the Faiss library can help improve the performance of vector search in multiple OpenSearch workloads, with different dimensions and space types.

# **Conclusion**

We highlighted some hot functions that show up when performing vector search using Faiss, and how Intel AVX-512 accelerator provides a significant performance boost to OpenSearch by optimizing them.  

Our experiments showed a performance boost to throughput of up to 15% for indexing and up to 18% for vector search in OpenSearch, when compared to previous generation AVX2 accelerators. Gains are seen across multiple vector dimensions and vector space types, and also improves query latencies by up to 12%. These accelerators are present on Intel instances in most cloud environments including AWS, and can be used seamlessly with OpenSearch. 

To get the most out of your OpenSearch cluster in AWS, consider using the Intel [C7i, M7i, R7i instances](https://aws.amazon.com/ec2/instance-types/) which contain the latest AVX-512 accelerators making them a great choice for vector search workloads. 

# **Future Scope**

To take this work further, we plan to use advanced features available on Intel 4th Generation Xeon Scalable and newer server processors. One of them will be leveraging [AVX512-fp16](https://www.intel.com/content/www/us/en/content-details/669773/intel-avx-512-fp16-instruction-set-for-intel-xeon-processor-based-products-technology-guide.html) arithmetic for the scalar quantizer which is expected to further reduce search latencies and improve indexing throughput of Faiss SQfp16 (or 2x compression with `on_disk` mode). 

# **Appendix1**

[https://github.com/opensearch-project/project-website/issues/3697](https://github.com/opensearch-project/project-website/issues/3697)

Benchmark setup configuration is listed below: 

## Configuration

| Dataset | COHERE-1M | GIST1M | COHERE-10M |
| :---- | ----- | :---- | :---- |
| OpenSearch version <td colspan=3>  2.18 |
| Engine <td colspan=3>  faiss |
| Vector dimension | 768 | 960 | 768 |
| Ingest vectors | 1M |  | 10M |
| Query vectors | 10K | 1K | 10K |
| Primary shards | 4 |  | 6 |
| Replica shards <td colspan=3>  1 |
| Data nodes | 2 |  | 3 |
| Cluster manager nodes <td colspan=3> 1 |
| Data node instance type <td colspan=3> r7i.2xlarge |
| Client instance <td colspan=3> m6id.16xlarge |
| Indexing clients<td colspan=3> 20 |
| Query clients <td colspan=3> 20 |
| Force merge segments <td colspan=3> 1 |

## 

**Notices and disclaimers**

Performance varies by use, configuration, and other factors. Learn more on the [Performance Index site](https://edc.intel.com/content/www/us/en/products/performance/benchmarks/overview/). Performance results are based on testing as of dates shown in configurations and may not reflect all publicly available updates.

Intel technologies may require enabled hardware, software, or service activation.

Disclosure:

Remember that performance can be highly dependent on factors like data structure, query patterns, indexes, and more. It's a good practice to test your application with different instance types and configurations to find the optimal setup that balances performance and cost for your specific use case.
