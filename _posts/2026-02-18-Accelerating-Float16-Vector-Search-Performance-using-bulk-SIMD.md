---
layout: post
title:  "Accelerating Float16 Vector Search Performance using bulk SIMD in 3.5"
authors:
   - kdooyong
   - vamshin
date: 2026-02-18
has_science_table: true
categories:
  - technical-posts
meta_keywords: fp16 vector search, vector search, vector quantization techniques, OpenSearch 3.5, natural language embedding models
meta_description: Learn how OpenSearch could improve further FP16 vector search performance by having bulk SIMD approach.
---

# Accelerating Float16 Vector Search Performance using bulk SIMD in 3.5

In OpenSearch 3.1, we introduced Memory Optimized Search, which leverages Lucene’s search algorithm on a Faiss index. This feature opens the door for users to run vector searches even in environments with tight memory constraints.

However, FP16 remained as unoptimized area. Encoding all elements in FP16 before distance calculation became a performance bottleneck, mainly because the JVM doesn’t support FP16 as a native type.

With version 3.4, we brought SIMD into FP16 distance calculation. This improvement allowed Memory Optimized Search to achieve up to 70–110% better QPS compared to default (where using Faiss C++ library internally) when searching FP16 vector indexes.
But we didn’t stop there. We believed there was still room for improvement. By pushing further with bulk SIMD for FP16, we were able to significantly accelerate search performance.

Memory-optimized search allows the Faiss engine to run efficiently without loading the entire vector index into off-heap memory. Without this optimization, Faiss typically loads the full index into memory, which can become unsustainable if the index size exceeds available physical memory. With memory-optimized search, the engine memory-maps the index file and relies on the operating system’s file cache to serve search requests.
For more information, please refer to https://docs.opensearch.org/latest/vector-search/optimizing-storage/memory-optimized-search/

## Pushing FP16 Performance to the Edge

Let’s start by recapping how we’ve improved FP16 over time.


### OpenSearch 3.1. Memory Optimized Search

In OpenSearch 3.1, we introduced Memory Optimized Search, opening the door to using Faiss indexes in environments with tight memory constraints where available memory is even smaller than the index size. This was made possible by a clever strategy: combining Lucene’s search algorithm with a Faiss index. Thanks to Lucene’s early termination optimization, almost all vector types—except FP16—showed improved search QPS in multi-segment scenarios when the index was fully loaded in memory.
FP16 was more challenging. Conversion from FP16 to FP32 was done in Java, which meant that even if a CPU could handle FP16-to-FP32 conversion in hardware, the JVM relied on software based conversion instead. Because the JVM lacks native FP16 support, we had to encode FP16 vectors to FP32 before performing distance calculations.
This became a major performance bottleneck: searches with FP16 ended up being almost twice as slow compared to default.


### OpenSearch 3.4. SIMD FP16 Distance Calculation

In OpenSearch 3.4, we tackled the FP16 performance limitation by intercepting the distance calculation and delegating it to C++ SIMD. From an implementation perspective, we use the optimized SIMD code already defined in Faiss library, which made the implementation much more simpler.
Faiss C++ SIMD uses SIMD registers to encode multiple FP16 values into FP32 and then performs operations on them simultaneously. While this approach is already efficient, it only applies SIMD between a query and a single vector at a time. This means that the same portion of the query vector has to be reloaded into the register for every vector comparison.
We improved this by reusing loaded query values across multiple vectors as possible. For example, imagine we have 768 dimension vector. When the first 8 FP32 values in 768 dimension vector are loaded into a register, they can be used against multiple vectors at once. This approach is faster than Faiss SIMD’s method, because performing operations between registers in bulk is much quicker than repeatedly loading values and operating on them individually.



### OpenSearch 3.5. Bulk SIMD FP16 Distance Calculation

In OpenSearch 3.5, we introduced Bulk SIMD FP16 distance calculation. The key insight was that if we already know the candidate vectors to evaluate, we can perform distance calculations in bulk rather than repeatedly comparing the query with each vector one by one.
This is the core idea behind Bulk SIMD: we load the corresponding float values from multiple vectors into registers and compute distances and accumulate results all at once. By leveraging multiple registers simultaneously, we can perform many operations in parallel, resulting in significantly faster performance.



#### InnerProduct Example

![Bulk SIMD Iteration-1](/assets/media/blog-images/2026-02-18-Accelerating-Float16-Vector-Search-Performance-using-bulk-SIMD/bulk_simd_iter1.png){:class="img-centered"}
![Bulk SIMD Iteration-2](/assets/media/blog-images/2026-02-18-Accelerating-Float16-Vector-Search-Performance-using-bulk-SIMD/bulk_simd_iter2.png){:class="img-centered"}

Bulk SIMD processes multiple vector elements at once instead of one by one. For example, the CPU can load 4 elements from the query vector and 4 from the data vector into a SIMD register, then compute their distance in parallel. On wider SIMD architectures (e.g., AVX2 or AVX-512), even more elements can be processed per instruction. Because the computation happens in registers and the data is accessed sequentially: L1 cache hit rate is high The CPU’s hardware prefetcher can automatically load upcoming elements Memory latency is effectively hidden In short, bulk SIMD improves throughput by combining parallel computation with efficient cache-friendly memory access.
(For ARM Neon implementation please refer to https://github.com/opensearch-project/k-NN/blob/main/jni/src/simd/similarity_function/arm_neon_simd_similarity_function.cpp)

Below is the pseudocode for the Bulk SIMD approach.
```
// We know query and 4 candidate vectors
uint8_t* Query_Vector <- Prepare Query Vector
uint8_t* Vector1 <- Get Vector1's Pointer
uint8_t* Vector2 <- Get Vector2's Pointer
uint8_t* Vector3 <- Get Vector3's Pointer
uint8_t* Vector4 <- Get Vector4's Pointer

// Registers for accumulation
// FMA represents for fused multiply-add, FMA(a, b, c) = a * b + c
FP32_Register fmpSum1
FP32_Register fmpSum2
FP32_Register fmpSum3
FP32_Register fmpSum4

// For all values, we do bulk SIMD Inner product.
// In this example, the dimension is assumed to be a multiple of 8 for simplicity.
for (int i = 0 ; i < Dimension ; i += 8) {
    // Load 8 FP32 values into a register
    FP32_Register queryFloats <- Query_Vector[i:i+8]

    // Load 8 FP16 values into registers
    FP16_Register1 vec1Float16s <- Vector1[i:i+8]
    FP16_Register2 vec2Float16s <- Vector2[i:i+8]
    FP16_Register3 vec3Float16s <- Vector3[i:i+8]
    FP16_Register4 vec4Float16s <- Vector4[i:i+8]

    // Convert FP16 values to FP32
    FP32_Register vec1Float32s <- ConvertToFP32(FP16_Register1)
    FP32_Register vec2Float32s <- ConvertToFP32(FP16_Register2)
    FP32_Register vec3Float32s <- ConvertToFP32(FP16_Register3)
    FP32_Register vec4Float32s <- ConvertToFP32(FP16_Register4)

    // Inner Product : SIMD FMA, accumulate = accumulate + q[i] * v[i]
    fmpSum1 = SIMD_FMA(fmpSum1, queryFloats, vec1Float32s)
    fmpSum2 = SIMD_FMA(fmpSum2, queryFloats, vec2Float32s)
    fmpSum3 = SIMD_FMA(fmpSum3, queryFloats, vec3Float32s)
    fmpSum4 = SIMD_FMA(fmpSum4, queryFloats, vec4Float32s)
}

// Set score values
SCORE[0] = SUM(fmpSum1)
SCORE[1] = SUM(fmpSum2)
SCORE[2] = SUM(fmpSum3)
SCORE[3] = SUM(fmpSum4)
```



## Performance Benchmarks

The following sections present performance benchmark results.


#### Benchmark Environment

* Data set : Cohere-10M, 768 Dimension
* Node : r7i.4xlarge, r7g.4xlarge
* Shards : 3 nodes 1 replica
* Index type : FP16
* Number of segments : 80



### Benchmark Results
![FP16 Max Throughput QPS](/assets/media/blog-images/2026-02-18-Accelerating-Float16-Vector-Search-Performance-using-bulk-SIMD/fp16-max-throughput.png){:class="img-centered"}

Upgrading from version 3.1 to 3.4 shows roughly 230% QPS improvement and cut average latency in half, shifting p99 latency from a sluggish 300ms range down to a sharp 120ms. 
The move from 3.4 to 3.5 added another 30% boost in throughput while shaving the p99 latency down to its best-ever 91ms. 
Comparing 3.1 to 3.5 directly shows a total evolution: throughput increased by 310% while latency dropped by nearly 300%. Bulk SIMD transformed from a slow baseline handling 450 req/s into a high-performance engine capable of nearly 1,500 req/s with almost instant response times.


|Version	|CPU Architecture	|Max throughput	|Avg Latency	|Latency 90pct	|Latency 99pct	|	|
|---	|---	|---	|---	|---	|---	|---	|
|3.1	|r7i	|398.87	|209.66	|300	|330	|	|
|3.1	|r7g	|495.49	|168.64	|235	|253	|	|
|3.4	|r7i	|1025.45	|81.42	|124	|136	|	|
|3.4	|r7g	|1112.13	|75.09	|111	|120	|	|
|3.5	|r7i	|1303.76	|63.99	|95	|105	|	|
|3.5	|r7g	|1477.88	|56.42	|82	|91	|	|
|	|	|	|	|	|	|	|

## What’s Next?

Technically, this optimization can also be applied to byte and FP32 indexes. Those are our main targets, and we’re excited to see how far we can push their performance further. For binary indexes, however, we don’t see any performance improvement from bulk SIMD. We believe the XOR operation is already heavily optimized in the JVM. If we find a way to further benefit from SIMD in this case, we will definitely pursue it.

