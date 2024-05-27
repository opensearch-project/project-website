---
layout: post
title:  A deep dive into faster semantic sparse retrieval in OpenSearch 2.12
authors:
  - zhichaog
  - yych
  - dylantong
date: 2024-05-27 01:00:00 -0700
categories:
    - technical-posts
meta_keywords: search relevance, neural sparse search, semantic search, semantic search with sparse encoders
meta_description: We're going to first deep dive on the fundamental of Neural Sparse, while giving the quantitative study on the total workload amount. Then we will illustrate two benchmarks about accelerating Neural Sparse.
---

In our last [blog post](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders/), we introduced neural sparse search, a new efficient method of semantic retrieval made generally available in [OpenSearch 2.11](https://opensearch.org/versions/opensearch-2-11-0.html). We released two sparse encoding models on OpenSearch [modelhub](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/#sparse-encoding-models) and Hugging Face [modelhub](https://huggingface.co/opensearch-project). Both models have leading search relevance among sparse encoding models with the same architecture. With a Lucene inverted index, users can perform high-quality semantic search with low resource consumption.

In this blog, we are going to first deep dive on the fundamental of Neural Sparse, while giving the quantitative study on the total workload amount. Then we will illustrate two benchmarks about accelerating Neural Sparse, one is based on Lucene upgrade and the other is using GPU. With Lucene upgrade, the **P99 search latency** for doc-only and bi-encoder modes **get reduced by 72% and 76%**. With GPU endpoint,  the **P99 search latency** for bi-encoder **get reduced by 73%**, and the neural sparse **ingestion throughput** get **increased by 234%**.

## Deep Diving the Fundamental of Neural Sparse

Let’s take a brief overview of how BM25 works first. In OpenSearch, the basic search functionality is built on the top of Lucene inverted index. Lucene inverted index maintains a posting list for each term in the index. The posting list stores all documents containing the term, and the documents are sorted with the order of internal doc ID. When we use a basic match query in OpenSearch, the query text will be tokenized and transformed into Lucene disjunctive term queries like `TermQuery(termA) OR TermQuery(termB) OR TermQuery(termC) ...` Like the figure below, Lucene will go through posting lists for all query terms. It will merge the selected posting lists and calculates scores on the fly using BM25 algorithm. The overall time complexity is determined by the count and length of the hit posting lists. Although Lucene implements many optimizations like block scoring, MaxScore, WAND, this is how the search works at a high level.

<img src="/assets/media/blog-images/2024-05-27-A-deep-dive-into-faster-semantic-sparse-retrieval-in-OS-2.12/lucene-inverted-index-overview.png"/>

For Neural Sparse, the fundamental workflow is very similar to BM25. We can consider its workload from the perspective of ingestion and query. 

For ingestion, the most significant difference is we use neural models to transform the raw text into tokens and corresponding weights, i.e. the sparse vectors. The neural model expands the tokens with synonym and generate token weight based on semantics importance.  What happens next inside Lucene is quite similar to BM25. There will be a posing list for each token. The only difference is we use Lucene [FeatureField](https://github.com/apache/lucene/blob/main/lucene/core/src/java/org/apache/lucene/document/FeatureField.java) for Neural Sparse, and use Lucene [Field](https://github.com/apache/lucene/blob/main/lucene/core/src/java/org/apache/lucene/document/Field.java) for OpenSearch normal text field. And its impact for total workload is negligible here. **The bottleneck for ingestion throughput is model inference in most cases.**


**For query, the workload consists of two parts: build the sparse vector and do search on inverted index.** There are 2 working modes for Neural Sparse. For doc-only mode, we use a tokenizer and pre-defined lookup table to build the sparse vector. This tokenize process is usually shorter than 1 millisecond. And this mode won’t expand the query tokens, i.e. all tokens must occurred in origin query text. For bi-encoder mode, we use neural model to generate sparse vector, just like what we do during ingestion. We need one model inference for each query. After we obtain the sparse vector, we’ll transform it into Lucene disjunctive feature queries like `FeatureQuery(termA) OR FeatureQuery(termB) OR FeatureQuery(termC) ...` Each `FeatureQuery` will go through the corresponding token's posting list. **Same as BM25, the search time complexity depends on the counts and length of hit tokens’ posting lists.** But for Neural Sparse,  posting lists are longer(document expansion),  and bi-encoder needs to go through more posting lists(query expansion). For a given dataset, we can consider all documents follow the same distribution, which means the length of all posting lists scales linearly on the count of documents. As a result, **the workload for doing search on inverted index scales linearly on document counts.**

Horizontal scaling is a common strategy to speeds up the search on inverted index. OpenSearch distributes documents of index to multiple shards, and each shard is a self-contained Lucene index. During the query phase, OpenSearch dispatches one search thread for each shard. With more data nodes and evenly distributed shards, we have sufficient working threads and the search workload for each search thread get smaller.  Therefore, we can speeds up the inverted index based search like BM25 and neural sparse by horizontal scaling the data nodes and increase the shard numbers.

### Experiments and Quantitative analysis

Now we’ve understood the fundamental working pattern for Neural Sparse search. A following question is how fast is Neural Sparse search, especially compared to BM25? Is it possible to give a quantitative study here? 

Since the workload for Neural Sparse search scales linearly with the document counts, we can formulate their relationship as `y=kx+b`, where `y` stands for total workloads and `x` stands for doc counts. In this formula, `b` is the **constant term** in linear functions, which stands for workload not related to inverted index, e.g. network I/O, tokenization or model inference. `k` is often referred as **slope** in linear functions. In this case it stands for the time complexity for searching on inverted index. By sampling different document count(`x`) and measure the client-side latency(`y`), we can get an the approximated value of k and b using [least squares approximation](https://en.wikipedia.org/wiki/Least_squares).

We use a cluster containing **3 r5.8xlarge** data nodes and **1 r5.12xlarge** leader/machine learning (ML) node. The OpenSearch version is 2.12. We sampled document counts from 1 to 8M with the step of 1M on MSMarco dataset. And we fixed the target throughput to make model inference time stable in different experiments. We can paint a figure to get an intuitive overview on experiment results:

> **_NOTE:_**  We measure the client-side latency in this blog. The client-side latency consists of sparse model/sparse tokenizer inference time, retrieval time and network latency.

<img src="/assets/media/blog-images/2024-05-27-A-deep-dive-into-faster-semantic-sparse-retrieval-in-OS-2.12/quantitive-analysis.png"/>

The figure fits the theory perfectly, both methods scale linearly on doc counts. The approximated fixed terms for bm25 and doc-only are **5.4** and **8.7**(ms). The number are very closed, indicating the extra workload for tokenizer inference is very small. The approximated slope for bm25 and doc-only are 2.80 and 5.15(ms/1M docs). Based on this, we can get the conclusion that on MSMarco dataset **the retrieval workload for Neural Sparse doc-only mode is about 1.8x that of BM25**, which is very close now.

For bi-encoder mode, the fixed term is 265.4(ms) and slope is 20.58(ms/1M docs). The fixed term is much larger due to model inference(in section [Speed Up Model Inference using GPU](#speed-up-model-inference-using-gpu) we show to to speeds up the model inference by GPU endpoint). And due to the query expansion, **retrieval workload for bi-encoder mode is about 4x that of doc-only mode**.

Please note that the concrete slope value depends on the distribution of the data. That means for different datasets, we may get different slopes. Although the multiple relationship between these slopes can also change, the range of variation is rather small. Because the root factor for slopes multiplier is token expansion rate, which is determined by the semantics association ability of models. And this ability should be stable. The experiment results on MSMarco is a very representative case and can support us estimate the workload for Neural Sparse.

For millions of documents to tens of millions of documents, neural sparse is very efficient, with smaller client-side latency and much less resource consumed compared to dense vectors search([ref](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders/)).  The client-side search latency for doc-only mode is even smaller than ML inference time. It also saves much cost by avoid hosting a strong ML service supporting high QPS. However, for extremely large data amount e.g. billion-sized dataset, the latency of neural sparse will also grow linearly as data scales. In this case dense vectors search would be a better choice for low latency, as the latency for ANN algorithm grows at log speed. And we’re also trying to improve neural sparse from this perspective.

## Acceleration by Lucene Upgrades

In the past over 20 years,  Lucene has conducted tons of optimizations, from index file I/O to the algorithm for merging posting lists faster. The most exciting part of building Neural Sparse based on Lucene is that we can benefit from all these gems of wisdom. And these optimizations are far from over. In OpenSearch 2.12, we upgraded to Lucene 9.9. Compared to Lucene 9.7 used in OpenSearch 2.11, bunches of fresh optimizations making it the fastest release(details can be found at Lucene [release notes](https://cwiki.apache.org/confluence/display/LUCENE/Release+Notes)). As an instance of top-k hits disjunctive boolean query, **Neural Sparse search also benefits from the new Lucene**. Below is the performance comparison between OpenSearch 2.11 and 2.12 on MS MARCO dataset, with our pretrained sparse encoding [models](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/#sparse-encoding-models). We use the same cluster mentioned before. All indexes have 3 primary shards and 1 replica shards. And we force merge the index before search.

#### Experiment results on 1M documents

<img src="/assets/media/blog-images/2024-05-27-A-deep-dive-into-faster-semantic-sparse-retrieval-in-OS-2.12/experiments-on-1m.png"/>

#### Experiment results on 8.8M documents

<img src="/assets/media/blog-images/2024-05-27-A-deep-dive-into-faster-semantic-sparse-retrieval-in-OS-2.12/experiments-on-1m.png"/>

From the above experiment results, we have these observations:

1. **With 8.8M documents, all search methods have very significant speed up.** The performance boost on 8.8M data is a better metric to measure the Lucene optimization. As we mentioned, the query workload consists of model inference and do search on inverted index. With more documents in index, the search part workload scales linearly, and takes a higher proportion in the overall response time. For bi-encoder mode, although the model inference time get longer due to higher throughput, we can still find its latency get reduced with large margin.
2. **With 8.8M documents, neural sparse search gets more benefits on than BM25.** The reason is pruning algorithm like WAND and MAXScore doesn’t do well on learned sparse weights compared to BM25. With older Lucene version, the overhead for neural sparse to sort query clauses to compute the minimum competitive score is too heavy. It actually harms the performance. Luckily this issue get [fixed](https://github.com/apache/lucene/pull/12490) in Lucene now.
3. With 1M documents, we can still see satisfying performance boost on BM25 and doc-only mode. It’s not as significant as the 8.8M documents, because the overall latency is small.  Some nearly-fixed cost takes a nonnegligible proportion, e.g. network I/O, tokenizer inference.  **The overall improvement for bi-encoder is rather limited.** We can find the model inference time get much longer. **Because the query throughput is restricted by the model inference throughput.** We’ve reached this limit, and these search requests get queued for the model inference.

## Speed Up Model Inference using GPU

In the last experiment we find that model inference is a critical bottleneck for high query throughput. If we can’t speed up the model inference, the query throughput can’t get improved no matter how fast we are at the inverted index.

The model inference process consists of a bunch of matrix operations, which bring heavy CPU workload for the cluster nodes. Fortunately, we can take the power of GPU, which is designed in a SIMD architecture and deeply optimized for matrix operations. For pure model inference workloads, GPU usually offers better price-performance. With mixed-precision and batch inference, the GPU model inference throughput can be even higher. We use a SageMaker GPU endpoint to host the Neural Sparse model and use it as a remote connector ([code script](https://github.com/zhichao-aws/neural-search/tree/neural_sparse_sagemaker/neural_sparse_sagemaker_example)). We choose the **ml.g4dn.xlarge** instance type, it is **much cheaper** than the ML node(r5.12xlarge) used in the last experiment. We benchmarked many popular instances on SageMaker and found the g4dn instance offers the best price performance in our experiment settings. Here is the detailed experiment results on 1 million documents. 

> **_NOTE:_**   In this blog we are using torchserve auto batching for GPU endpoint. It will aggregate the requests and do batch inference with the batch size 16.

<img src="/assets/media/blog-images/2024-05-27-A-deep-dive-into-faster-semantic-sparse-retrieval-in-OS-2.12/gpu-search-performance.png"/>

We can find that GPU reduces the model inference latency at large margin. The performance boost is further reflected in the client-side search latency and throughput. This is a quite critical improvement to apply bi-encoder mode in production settings. 

Another benefits from GPU is higher ingestion throughput, which consists of huge amount of model inference. We use the same GPU endpoint for this experiment. We use a bulk size of 10 and use 6 clients to do ingestion. The experiment result is as follows:

<img src="/assets/media/blog-images/2024-05-27-A-deep-dive-into-faster-semantic-sparse-retrieval-in-OS-2.12/gpu-ingestion-performance.png"/>

The GPU endpoint speeds up the ingestion, making throughput 3 times larger with a much lower price. It is very essential if there is heavy ingestion workload. No matter we’re using bi-encoder mode or doc-only mode.

## Conclusion

In this blog, we deep dive the workload for Neural Sparse. We use experiments to further elaborate it and obtain more insights about it. Here are some key takeaways:

1. The Neural Sparse search workload consists of tokenizer/model inference and inverted index search. The inverted index search workload scales linearly on document counts.
2. In our quantitative study on MSMarco, the inverted index search workload of doc-only mode is about 1.8x that of BM25, and bi-encoder mode is about 4x that of doc-only.
3. After OpenSearch 2.12, the new Lucene version greatly speeds up BM25 and Neural Sparse search on inverted index. Neural sparse search benefits more from the upgrade than BM25.
4. Model inference is a throughput bottleneck for Neural Sparse ingestion and bi-encoder search. We can use GPU to accelerate the model inference, which offers higher throughput and better price-performance.

With these conclusions, if you want to build a new cluster to migrate from BM25 to Neural Sparse search, you can take the quantitative study part in this blog for reference, and scale the resources based on the workload. If you need high query throughput for bi-encoder query or high ingestion throughput, GPU is a good choice. To build your Neural Sparse search experience on your OpenSearch cluster, please check this [documentation](https://opensearch.org/docs/latest/search-plugins/neural-sparse-search/).
