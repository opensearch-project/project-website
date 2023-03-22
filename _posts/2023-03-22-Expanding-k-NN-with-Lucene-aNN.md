---
layout: post
title:  "Expanding k-NN with Lucene approximate nearest neighbor search"
authors:
- macrakis
date: 2023-03-22
categories:
 - technical-post
meta_keywords: approximate k-NN, OpenSearch k-NN search, k-nearest neighbor, Lucene 9.0 k-NN
meta_description: Learn how approximate k-NN in OpenSearch with faiss, nmslib, and Lucene, can produce results tens of milliseconds faster than with exact K-NN
excerpt: OpenSearch pioneered k-nearest neighbor (k-NN) within search engines in 2019, and developers have adopted it enthusiastically on sets of millions or even billions of vectors. OpenSearch continues to innovate in the area of k-NN support. OpenSearch 2.2 added the Lucene 9.0 implementation of k-NN, and OpenSearch 2.4 added adaptive filtering.
---

OpenSearch pioneered k-nearest neighbor (k-NN) within search engines in 2019, and developers have adopted it enthusiastically on sets of millions or even billions of vectors. OpenSearch continues to innovate in the area of k-NN support. [OpenSearch 2.2](https://opensearch.org/blog/opensearch-2-2-is-now-available/) added the Lucene 9.0 implementation of k-NN, and OpenSearch 2.4 added adaptive filtering.

OpenSearch supports both exact k-NN and approximate k-NN (ANN). Approximate k-NN, based on the [HNSW algorithm](https://arxiv.org/abs/1603.09320), is implemented in OpenSearch by faiss, nmslib, and Lucene. Approximate k-NN can produce results in tens of milliseconds, [even for collections of hundreds of millions of vectors](https://aws.amazon.com/blogs/big-data/choose-the-k-nn-algorithm-for-your-billion-scale-use-case-with-opensearch/), orders of magnitude faster than exact k-NN.

## Advantages of Lucene 9.0 k-NN

At the end of 2021, Lucene 9.0 added support for dense vector indexes and approximate k-NN search. It uses a new codec format for the indexes and takes advantage of the HNSW algorithm.

HNSW uses a hierarchical set of proximity graphs in multiple layers to improve performance when searching large datasets. This helps to overcome the scaling problems that usually occur when searching high-dimensional datasets.

The Lucene codec encodes and decodes numeric vector fields. It creates two separate segment files: one for the vectors and one for the HNSW graph structure, which serves as a sort of index. This allows the vectors to exist outside Java’s heap memory, reducing the memory load.

The Lucene library is written in Java, like the rest of OpenSearch, so the system is platform independent and easier to build.

## When to use the Lucene library

Each of the three approximate k-NN engines has its advantages. The Lucene functionality doesn’t displace faiss or nmslib but simply provides more options and thus more control over the results.

For datasets of up to a few million vectors, the Lucene engine has better latency and recall than the other two. Its indexes are also the smallest. Benchmarks show that the Lucene 9.2 solution is comparable to HNSW implementations based on nmslib, although there are some tradeoffs. In particular, Lucene 9.2 does not support very high recall. But with comparable recall values, the Lucene 9.2 solution consumes fewer resources and has better query latency.

Another functionality available in the Lucene library is efficient filtering of k-NN results. Until OpenSearch 2.4, only post-filtering was available, which can be inefficient and inaccurate. Starting with version 2.4, OpenSearch  [supports adaptive filtering](https://opensearch.org/docs/latest/search-plugins/knn/filter-search-knn/), choosing pre- or post-filtering in order to provide the best speed and accuracy, thanks to improvements in Lucene.

## Summary

OpenSearch provides a variety of options for implementing exact and approximate k-NN search. You may wish to experiment with more than one solution, tuning the various parameters to optimize result quality, resource usage, and performance for your application.

For more information about the approximate k-NN capabilities of OpenSearch, see [Approximate k-NN search](https://opensearch.org/docs/latest/search-plugins/knn/approximate-knn/) in the OpenSearch technical documentation.
