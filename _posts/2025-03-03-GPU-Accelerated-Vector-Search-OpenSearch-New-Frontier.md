---
layout: post
title:  GPU Accelerated Vector Search Opensearch New Frontier 
authors:
  - navneev
  - cnolet
  - kshitizgupta21
  - dylantong
  - nwstephens
  - vamshin
date: 2025-03-03
has_science_table: false
categories:
  - technical-posts
meta_keywords: Vector Database, Vector Engine, k-NN plugin,  OpenSearch 3.0, k-nn search, Vector Search, Semantics Search, Index Build
meta_description: Learn about how OpenSearch Vector Engine is going to use GPU for accelerating its Vector Index Builds
---

## Overview
OpenSearch's adoption as a vector database has grown significantly with the rise of generative AI applications. Vector search workloads are scaling from millions to billions of vectors, making traditional CPU-based indexing both time-consuming and cost-intensive. To address this challenge, OpenSearch is introducing GPU acceleration as a [preview feature](https://github.com/opensearch-project/k-NN/issues/2293) for its Vector Engine in the upcoming 3.0 release by using [NVIDIA cuVS](https://github.com/rapidsai/cuvs). By leveraging the massive parallel processing capabilities of GPUs, this new feature dramatically reduces index building time, significantly lowering operational costs while delivering superior performance for large-scale vector workloads.

### Why GPU Acceleration?
The OpenSearch Vector Engine has made [significant strides](https://github.com/opensearch-project/k-NN/issues/1599) in 2024, implementing various optimizations including [AVX512 SIMD support](https://github.com/opensearch-project/k-NN/issues/2056), segment replication, [efficient vector formats](https://github.com/opensearch-project/k-NN/issues/1853) for reading and writing vectors, [iterative index builds](https://github.com/opensearch-project/k-NN/issues/1938), [intelligent graph builds](https://github.com/opensearch-project/k-NN/issues/1942), and [derived source](https://github.com/opensearch-project/k-NN/issues/2377) for vectors. While these features and optimizations delivered incremental improvements in indexing times, they primarily enhanced the peripheral components of vector search rather than addressing the fundamental performance bottleneck in core vector operations.
Vector operations, particularly distance calculations, are computationally intensive tasks that are ideally suited for parallel processing. GPUs excel in this domain due to their massively parallel architecture, capable of performing thousands of calculations simultaneously. By leveraging GPU acceleration for these compute-heavy vector operations, OpenSearch can dramatically reduce index build times. This not only improves performance but also translates to significant cost savings, as shorter processing times mean reduced resource utilization and lower operational expenses. The GPUs ability to efficiently handle these parallel computations makes it a natural fit for accelerating vector search operations, offering a compelling solution for organizations dealing with large-scale vector datasets.

## New Architecture
The architecture introduces a streamlined, decoupled system with three core components:
1. Vector Index Build Service: A dedicated GPU-powered fleet that specializes in high-performance vector index construction. This service operates independently, allowing for optimal GPU resource utilization.
2. OpenSearch Vector Engine: The battle-tested k-NN plugin that orchestrates all vector-related operations, from ingestion to search, seamlessly integrating with both CPU and GPU-accelerated workflows.
3. Object Store: A fault-tolerant intermediate storage layer that leverages OpenSearch's existing Repository abstractions for secure and efficient vector data handling.

![High Level Architecture](/assets/media/blog-images/2025-03-03-GPU-Accelerated-Vector-Search-OpenSearch-New-Frontier/high-level-arch.png){: .img-fluid}

The workflow operates as follows:

* Documents containing vectors are ingested to OpenSearch using standard bulk api.
* During flush/merge operations, the Vector Engine:
  * Uploads vectors to the object store
  * Initiates GPU-accelerated index build request to GPU fleet
  * Monitors the build progress
* The Vector Build Service:
  * Constructs the index using GPU acceleration
  * Converts the index to a CPU-compatible format
  * Uploads the completed index to the object store
* Finally, the Vector Engine:
  * Downloads the optimized index
  * Integrates it with existing segment files
  * Completes the segment creation process

For fault tolerance, the system automatically falls back to local CPU-based index building if any step encounters an error, ensuring continuous operation.
For detailed implementation specifics and architecture diagrams, please refer the following two GitHub issues: [technical design1](https://github.com/opensearch-project/k-NN/issues/2293) and [technical design2](https://github.com/opensearch-project/k-NN/issues/2294)

### Vector Index Builds using CAGRA Algorithm
The GPU workers leverage [NVIDIA cuVS](https://github.com/rapidsai/cuvs) CAGRA algorithm integrated through the [Faiss](https://github.com/facebookresearch/faiss) library. [CAGRA](https://arxiv.org/abs/2308.15136), or (C)UDA (A)NNS (GRA)ph-based, is a novel approach for graph-based indexing that was built from the ground up for GPU acceleration. CAGRA constructs a graph representation by first building a k-NN graph using either [IVF-PQ](https://developer.nvidia.com/blog/accelerating-vector-search-nvidia-cuvs-ivf-pq-deep-dive-part-1/) or [NN-DESCENT](https://docs.rapids.ai/api/cuvs/nightly/cpp_api/neighbors_nn_descent/) and then removing redundant paths between neighbors.

When a Vector Index Build request arrives at the GPU workers, it carries all necessary parameters for constructing the segment-specific vector index. The Vector Index Build component initiates the process by retrieving the vector file from the object store and loading it into CPU memory. These vectors are then inserted in the CAGRA index through Faiss. Upon completion of the index construction, the system automatically converts the CAGRA index into an HNSW-based format, ensuring compatibility with CPU-based search operations. The converted index is then uploaded to the object store, marking the successful completion of the build request. This ensures that indexes built on GPUs can be efficiently searched on CPU machines while maintaining index building performance benefits.

![CAGRA-ALGO](/assets/media/blog-images/2025-03-03-GPU-Accelerated-Vector-Search-OpenSearch-New-Frontier/cagra-algo-explained.png){: .img-fluid}

**_Source: CAGRA paper https://arxiv.org/pdf/2308.15136_**

## Preliminary Benchmarks
We did preliminary benchmarks and obtained the following results. The experiments are performed using a [10M 768D dataset](https://github.com/opensearch-project/opensearch-benchmark-workloads/blob/main/vectorsearch/workload.json#L54-L64) using [OpenSearchBenchmarks](https://opensearch.org/docs/latest/benchmark/). OpenSearch distribution can be found [here](https://github.com/navneet1v/k-NN/releases/download/stagging-remote-index-build-v3/opensearch-2.19.0-SNAPSHOT-linux-arm64.tar.gz).

### Setup

| Key                   | Value       |
|-----------------------|-------------|
| Number of data Nodes  | 3           |
| Data Node Type        | r6g.4xlarge |
| Number of GPU Workers | 3           |
| GPU Workers Type      | g5.2xlarge  |
| OpenSearch Version    | 2.19.0      |

### Index Setup

| Key                      | Value |
|--------------------------|-------|
| Number of Primary Shards | 6     |
| Number of Replicas       | 1     |

### Results
Below are the results of the experiments which were conducted.

| Key                                 | Baseline  | GPU based index builds | Improvements |
|-------------------------------------|-----------|------------------------|--------------|
| Optimized Index Build time (in min) | 273.78333 | 29.13                  | 9.3976       |
| Max CPU utilization                 | 100       | 40                     | 2.5          |
| Cluster cost (3 x r6g.4xlarge)      | 11.03894  | 1.17466                |              |
| GPU cost (3 x g5.2xlarge)           | 0         | 1.76548                |              |
| Total Cost                          | 11.03894  | 2.94014                | 3.75457      |
| Mean Indexing Throughput            | 8202.98   | 16796.2                | 2.04757      |
| Index size(in GB without replicas)  | 58.7      | 58.7                   |              |


The above results provides a significant evidence that:
1. We are able to achieve a 9.3x improvement in indexing performance with 3.75x less cost.
2. The CPU utilization is 2.5x less than the baseline with 2x improvement in indexing traffic since no vector index builds are happening on CPUs, ensuring that OpenSearch cluster can take more indexing traffic or the need to scale OpenSearch cluster for heavy indexing traffic.

## Key Benefits
* Decoupled Architecture: With OpenSearch and GPU workers operating independently, both components can evolve separately, allowing for continuous optimization of price-performance ratios without interdependency constraints. Decoupled architecture allows multiple OpenSearch clusters to leverage the same GPU resources in a time-shared manner.
* Efficient Resource Usage: GPU nodes focus exclusively on vector index building at the segment level, bypassing text index construction. This targeted approach allows for shorter, more efficient GPU utilization periods, maximizing resource allocation and cost-effectiveness.
* Enhanced Fault Tolerance: The intermediate storage layer acts as a buffer, providing robust error handling. If a GPU worker fails mid-process, index build jobs can be seamlessly restarted without the need to re-upload vectors, significantly reducing downtime and data transfer overhead.

## Conclusion
The introduction of GPU-accelerated vector indexing marks a significant milestone in OpenSearch's evolution to meet the demands of modern large scale AI workloads. Our preliminary benchmarks demonstrate 9.3x faster index build times with 3.75x less cost compared to CPU-based solutions with OpenSearch. This dramatic improvement reduces the build time for billion-scale vector indexes from days to hours. Despite GPU instances being roughly 1.5x more expensive than CPU counterparts, the significant performance gains result in a compelling price-performance ratio which is further enhanced by the shared GPU fleet model enabling multi-tenant usage.

The decoupled design provides flexibility for independent evolution of components, allowing OpenSearch to readily adopt future hardware accelerators and algorithmic improvements. The deployment model ensures easy adoption across cloud and on-premises environments. By leveraging the CAGRA algorithm, part of NVIDIA cuVS library, and its seamless GPU-CPU index interoperability, we've created a solution that's both powerful and practical, with robust error handling and fallback mechanisms ensuring reliability in production environments.

## What’s next?
The initial release for GPU based index acceleration focuses on building indexes with fp32, but in the upcoming releases the support for fp16, byte will be added to further improve the price performance. The OpenSearch community continues enhancing Vector Engine capabilities, with our next phase focused on enabling low-latency, high-throughput GPU-accelerated search.

## References
1. CAGRA paper https://arxiv.org/pdf/2308.15136
2. [Meta issue](https://github.com/opensearch-project/k-NN/issues/1599) for improving the index performance of OpenSearch Vector Engine.
3. Accelerating Vector Index Builds using GPUs [RFC](https://github.com/opensearch-project/k-NN/issues/2293).
4. [Faiss Library](https://github.com/facebookresearch/faiss) used for integrating with CAGRA Index.
5. Worker images for the setting up of the cluster can be found [here](https://github.com/navneet1v/VectorSearchForge/tree/main/remote-index-build-service).
6. [Vector Engine code](https://github.com/navneet1v/k-NN/tree/remote-vector-staging-2.19) for integrating the index builds with remote index build workers.
7. [OpenSearch cluster CDK](https://github.com/opensearch-project/opensearch-cluster-cdk) for setting up the OpenSearch cluster.