---
layout: post
title:  "Partner Highlight: AWS explores different k-NN algorithms and workload optimizations"
authors:
  - vamshin
date: 2022-10-19
categories:
  - partners
redirect_from: "/blog/partners/2022/10/aws-knn-algorithms-workload-optimizations/"
---

OpenSearch partner and contributor [AWS](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/gsg.html) recently [published a blog](https://aws.amazon.com/blogs/big-data/choose-the-k-nn-algorithm-for-your-billion-scale-use-case-with-opensearch/) that focuses on the different algorithms and techniques used to perform approximate k-NN search at scales of more than a billion data points within OpenSearch. In the blog, Othmane Hamzaoui, AI/ML Specialist Solutions Architect with AWS, and Jack Mazanec, Software Dev Engineer and OpenSearch committer, explain algorithms including Hierarchical Navigable Small Worlds (HNSW), Inverted File System(IVF), and Product Quantization (PQ), and share the techniques and the memory footprint to support each of these algorithms, with examples. The post also includes the metrics and trade-offs between recall and performance, so you can choose the right algorithm for your k-NN workload at scale.  Explore the [AWS blog](https://aws.amazon.com/blogs/big-data/choose-the-k-nn-algorithm-for-your-billion-scale-use-case-with-opensearch/) and be sure to check out the benchmarking codebase for yourself in [GitHub](https://github.com/opensearch-project/k-NN/tree/1.3.1.0/benchmarks/perf-tool). 
