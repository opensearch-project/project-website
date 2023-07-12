---
layout: post
title:  "Semantic search in OpenSearch: Ingestion and query throughput"
authors:
- navneev
- nmishra
- mshyani
- zaniu
- ylwu
- yych
- seanzheng
- kolchfa
date: 2023-07-10
categories:
 - technical-post
has_science_table: true
has_math: true
meta_keywords: 
meta_description: 
excerpt: 
---

Are you interested in trying [semantic search in OpenSearch](https://opensearch.org/blog/semantic-search-solutions/) but curious about the impact on storage size, ingestion throughput and query throughput? This post provides answers to your questions. In a [previous blog post](https://opensearch.org/blog/semantic-science-benchmarks/), we quantified the impact of semantic search on search relevance. To better understand the impact, let's review the three steps of the semantic search process:

* **Embed**: Choose a model for embedding documents. For this post, we chose `msmarco-distilbert-base-tas-b`, which is 250MB in size and has 66M parameters. To learn more about the embeddings and model choice, see the [previous blog post](https://opensearch.org/blog/semantic-science-benchmarks/).
* **Ingest**: Ingest the documents by embedding them in a vector space and indexing them into OpenSearch.
* **Query**: Embed the query in the vector space at run-time and use approximate k-NN to find the closest documents to the query in vector space.

The impact of semantic search on throughput depends on the size of your document collection and your cluster configuration. To quantify this impact, we chose a publicly available MS-MARCO [1] dataset as a running example. In the following sections, we provide general formulas for a dataset of this size with the msmarco-distilbert-base-tas-b ML model. You can use these formulas with your storage size and throughput requirements. MS-MARCO has 12M documents with an average length of ~1500 words and is ~100 GB large, though only the first 512 tokens of each document are used.  (A *token* is a sequence of characters that are grouped together as a useful semantic unit for processing.)

A [previous blog post](https://opensearch.org/blog/semantic-science-benchmarks/) demonstrated that the best relevance results (measured using Normalized Discounted Cumulative Gain [2]) are obtained when transformers are combined with keyword search. Thus, we quantify the performance impact (primarily latency and throughput) assuming this combination.

## Summary of findings

The following table provides an overview of the performance benchmarks for the architectural choices made in the next section. The first row lists benchmarks for BM25, or basic keyword search. The second row lists benchmarks for an off-the-shelf neural embedding model from Hugging Face. The last row corresponds to a model that was fine-tuned or trained on synthetic queries using the methodology described in the [previous blog post](https://opensearch.org/blog/semantic-science-benchmarks/).

|Ranking method	|\|Parameters\|	| Number of input, output dimensions	|[NDCG@10 lift over BM25](https://opensearch.org/blog/semantic-science-benchmarks/)	|Time to ingest MS-MARCO (100GB)	|Average ingestion throughput (docs/sec)	|p99 query latency (ms) |Max throughput (answered search, queries/sec)	|
|---	|---	|---	|---	|---	|---	|---	|---	|
|BM25	|N/A	|N/A	|N/A	|84 min	|2380	|69	|715	|
|TAS-B + BM25	|66M	|(512, 768)	|6.4%	|~34 hours	|78	|142	|187	|
|Fine-tuned TAS-B + BM-25	|66M	|(512 ,768)	|14.9%	|~34 hours	|78	|142	|187	|

The fine-tuned TAS-B + BM25 shows the same ingestion/query throughput as TAS-B + BM25 because the models have the same number of input/output dimensions and the same number of parameters. Fine-tuned TAS-B + BM25 benchmarks are included to emphasize the improvement in search relevance, as measured by nDCG without additional latency costs. A previous blog post describes [how this search improvement was attained](https://opensearch.org/blog/semantic-science-benchmarks/).

**_Large language embedding models offer improved relevance gains but do decrease ingestion throughput and query throughput. Upsizing the cluster can expedite both, but comes with a resource cost._**

## Architecture

The choice of architecture has a significant impact on throughput and cost. For example, with additional compute power, more documents can be ingested per second, but this comes with a resource cost. In the following sections, we describe the impact of different architecture choices on both ingestion and querying. Note that it is customary to use a different architecture for ingestion and querying. This custom is followed in this post.  OpenSearch offers multiple types of nodes including *data nodes and* *ML nodes. Coordinator nodes* are also available, though these are in fact data ** nodes that serve the purpose of coordinating traffic*.* Moreover, the roles of data and ML nodes change during ingestion as opposed to querying.

**Ingestion.** During ingestion, a data node receives documents (1) and sends them to ML nodes in order to compute an embedding (2).  The ML node sends the embedding back to the data node for indexing (3). Ingestion is an embedding-intensive process because one embedding is computed per ingested document and the ML model used to compute an embedding can be quite large (for example, the TAS-B model [3] used in this post has 66M parameters and is 250 MB in size). Having multiple ML nodes can expedite the ingestion process, and with multiple ML nodes, adding more data nodes can increase ingestion throughput. For this post, we chose an ingestion configuration with one data node and 10 ML nodes. 

![Ingestion architecture](/assets/media/blog-images/2023-07-10-semantic-search-performance/ingestion-architecture-coord.png){: .img-fluid}
*Figure 1. Ingestion Architecture: One data node and 10 ML nodes.*

**Querying.**  During querying, a coordinator node receives a search query (1) and sends the search query to an ML node (2) to compute an embedding. The ML node sends the embedding back to the coordinator node (3). Next, the coordinator node sends the embedded version of the query to the data nodes (4) to identify nearest neighbors (5). Nearest neighbor calculations dominate the querying step, and having multiple data nodes expedites the identification of closest documents.  (A coordinator node is just a data node.)

![Querying architecture](/assets/media/blog-images/2023-07-10-semantic-search-performance/querying-architecture.png){: .img-fluid}
*Figure 2. Querying architecture: One coordinator node, one ML node and multiple data nodes.*


## Impact on throughput and storage

Given these architecture choices, we can quantify the impact on throughput and storage. For embeddings, as mentioned, we used the publicly available model TAS-B [3] to report performance results. TAS-B is a dense retrieval model, that is, it converts a text document into a dense vector in 768 dimensions.

![Ingestion throughput and storage size](/assets/media/blog-images/2023-07-10-semantic-search-performance/ingestion-throughput.png){: .img-fluid}
*Figure 3. Ingestion throughput and storage size for MS-MARCO in OpenSearch's semantic search solution. Semantic search combines keyword search (BM25) and transformers (embeddings). Throughput and size comparisons are made between keyword-based (BM25 only) and embedding-based search.*

**Ingestion Throughput.** Ingestion throughput is measured by the number of documents that can be indexed per second. Figure 3 shows how quickly an index can be created to support both keyword search and embedding-based search. It takes ~36 hours to ingest embeddings when one data node (r6g.4xlarge : 16 vCPU, 128G memory) and 10 ML nodes  (c6g.4xlarge : 16 vCPU, 32G memory) are chosen for the architecture. On average, 78 documents can be ingested per second for this configuration. With more ML nodes, ingestion can be further expedited. Note that creating an embedding-based index is slower than creating a keyword-search index because it is more computationally expensive to pass a document through a large ML model. There is also a corresponding difference in cost between creating an index to support keyword search as opposed to embedding-based search. The cost can be estimated using ingestion time and the cost of each type of node for that duration. Current costs are available in [4].

If your document collection does not change over time, ingestion is a one-time operation and consequently may not be as important as query latency in terms of cost. However, if your collection changes, for example, new documents are continuously arriving, then ingestion throughput and cost may be a larger consideration.

**Storage Size**. Once ingested, the index itself occupies storage that must be maintained in order to quickly answer queries. The size of the combined indexes for MS-MARCO is 240GB (note that adding more fields increases the size of an index). You can find EBS storage costs in GB/month in [7].  The total cost of storing the index can be estimated by multiplying the storage size in GB by the corresponding EBS storage cost per month. Saving embeddings requires more storage than saving an inverted index. For this dataset, the embeddings are 40% larger than the inverted index (see Figure 3).
 
**Query Throughput.**  Next, we compare query latency and throughput under three different querying architecture configurations: (A) 1 data node, 1 ML node (B) 3 data nodes, 1 ML node and (C) 3 data nodes and 1 less powerful ML node. We used the following node configuration:

* Data Node: r6g.4xlarge: 16 vCPUs, 128 GB Memory (we compared 1 data node to  3 data nodes).
* ML Nodes: r6g.12xlarge compared to c6g.4xlarge (we compared 48 CPU cores to 16 CPU cores).

In this experiment, 20 hypothetical users are simultaneously posing queries to an OpenSearch cluster. These users operate in parallel. After posing a query, a user cannot pose another query until search results are received from the previous query.

Query latency and throughput are reported in Table 1. The following are the key findings:

* Configuration A and B: Increasing the number of data nodes from 1 to 3 reduces search latency by ~60 ms and increases throughput by ~60 searches/second for our experiments on this dataset.
* Configuration B and C: A less powerful (C type/48 cores, as opposed to R type/16 cores) ML Node with 1/3rd of the CPU cores suffices for obtaining the same latency/throughput. 
* A lower-cost ML node Configuration C has better (93%) CPU utilization than Configuration B (53%).
* Column E: Independent of cluster configuration, the time required for an ML node to compute an embedding is essentially unchanged.
* Column D and E: A rough partitioning of how much time is spent in data as opposed to ML nodes can be deduced from columns D and E. For example, with configuration A, out of the 200 ms it took to return an answer to a search query, 40% of the time (80ms) was spent in an ML node computing an embedding. 

|Configuration	|Data nodes \|cores\|	|ML node \|cores\|	|p99 latency to answer an OpenSearch query (ms)	|p99 latency---time for an ML node to output an embedding (ms)	|Max throughput (answered search, queries/sec)	|Max CPU utilization of ML nodes (%)	|
|---	|---	|---	|---	|---	|---	|---	|
|A	|1 r6g.4xlarge, 16 cores	|1 r6g.12xlarge, 48 cores	|208.9	|81.5	|117.9	|41	|
|B	|3 r6g.4xlarge, 16 cores	|1 r6g.12xlarge, 48 cores	|142.3	|82.2	|187.9	|53	|
|C	|3 r6g.4xlarge, 16 cores	|1 c6g.4xlarge, 16 cores	|142.4	|80.7	|183.6	|93	|

*Table 1. Quantification of query latency and throughput under three different architecture configurations. Latency improves with additional data nodes (configuration A compared with B).  Latency is unaffected with a reduced ML node (configuration B compared with C).*


## Cluster configuration for the required query throughput 

How can you choose a maximally utilized configuration that is high-performing at minimum cost? Many articles have been written on how to choose the type and number of data nodes [4,5].  Here we provide a recommendation for choosing the number of cores for ML Nodes, $$c$$, required to achieve the desired throughput in queries per second, $$q$$.

First, you need to estimate $$e$$---the time needed to compute an embedding on a single core in milliseconds. In the preceding example, $$e$$ was about 80 milliseconds. To measure $$e$$ for the ML embedding model of your choice, we suggest spinning up the smallest possible cluster that has a single ML node with the minimum possible number of cores (for example, c6g.2xl in AWS). Load the ML embedding model on the node and then run the predict API on a few hundred typical queries. Set $$e$$ to the p99 time in milliseconds it takes to compute an embedding using the [ML Profile API](https://opensearch.org/docs/latest/ml-commons-plugin/api/#profile).

In the best case, $$\frac{1000}{e}$$ embeddings can be computed on one thread in one second (because $$e$$ is in milliseconds). In the worst case, a core can work on just one thread at a given time. Thus, the total number of embeddings $$n$$ that can be computed with $$c$$ cores is

$$
\begin{align}
n = c \cdot \frac{1000}{e}
\end{align}
$$

This value is equal to the number of queries that can be answered per second: $$q = c \cdot \frac{1000}{e}$$.  Solving for $$c$$, we obtain

$$
\begin{align}
c = \frac{q \cdot e}{1000}
\end{align}
$$

Translating back to our example, if we want to answer 180 queries per second then we need

$$
\begin{align}
c = \lceil 180 \cdot 80 / 1000 \rceil = \lceil 14.4 \rceil = 16 \text{ cores}
\end{align}
$$

This explains why we were able to drop the number of cores from 48 to 16 (Configuration B compared with Configuration C) without taking a performance hit on queries per second. 

Note that our recommendations are in terms of the number of cores. It is up to you decide how to split the cores. You can choose one ML node with $$c$$ cores or $$k$$ ML nodes with $$c/k$$ cores — the calculation remains the same. Also, keep in mind that the above calculation works given that the inference call to ML Model is the most time-consuming operation. If the k-NN search latency in the Neural Search plugin becomes the most time-consuming, then you will not be able to achieve the required throughput. This will require configuring your data nodes according to best practices [5, 6]. 

## Cluster configuration for the required indexing throughput

Similarly, we can calculate the number of cores required during ingestion to achieve the desired ingestion throughput. The average number of documents, $$i$$, that can be vectorized, is given by

$$
\begin{align}
i = c \cdot \frac{1000}{e} \cdot 2
\end{align}
$$

Solving for $$c$$, we obtain

$$
\begin{align}
c = \lfloor (i \cdot e) / (2 \cdot 1000) \rfloor 
\end{align}
$$

Note that the Predict API latency $$e$$ needs to be measured again because it is different for documents and queries as documents tend to be longer for ingestion. For MS Marco, the p99 predict API latency was measured to be ~4100ms with `msmarco-distilbert-base-tas-b`. For 10 ML nodes with 16 cores each, we have $$c = 160$$. Using the preceding formula, we get the average ingestion throughput of ~78 docs/second. Also, keep in mind that the above calculation works given that the inference call to the ML Model is the most time-consuming operation for indexing.

The preceding formula provides general guidance for the number of ML cores required to achieve the desired throughput. Ingestion is much more complex than query and depends on various factors. The following is a list of some (but not all) of those factors:

1. Total number of shards of the index and data nodes present in the cluster.
2. Total number of documents to be ingested in the cluster.
3. Refresh Interval set for the index. We set refresh interval to -1 in our experiments, to improve the indexing time.
4. The algorithm you are using for the vector field. For a list of algorithms supported in by the OpenSearch k-NN plugin, see [8].
5. Number of dimensions for the vector field.
6. Size of the text fields getting ingested with vector fields.
7. The CPU utilization of the data nodes during ingestion, the number of cores of data nodes.
8. Number of connections that can be made with ML Nodes to do make the predict API calls.

## Storage requirements

The index used for semantic search stores both text and embeddings in one OpenSearch Index. The exact storage requirement for text fields is dependent on the number and types of fields in the document. Thus, for this section we will focus on the embeddings storage.

Estimating storage is easier for vector fields (embeddings) than for text fields. For vector fields, storage mainly consists of the k-NN algorithm file and the OpenSearch bookkeeping files. Assuming we are using HNSW algorithm for k-NN search, the graph storage (in bytes/vector) can be calculated using the following formula [6]:

graph storage = $$1.1 \cdot (4 \cdot dimensions + 8 \cdot M)$$,

where $$M$$ defines the number of bidirectional links created for every new element during construction[10].

The OpenSearch bookkeeping file storage (in bytes/vector) can be approximated using the following formula:

bookkeeping file storage = $$20 \cdot dimensions$$

This formula assumes 16-bit floating-point numbers as vector values, where each value has on an average 16 digits. Additionally, this formula assumes that the OpenSearch index is configured for `BEST_SPEED`. 

Applying both of the preceding formulas(with default values) to the experiment, the storage required for storing a 768-dimensional 10 Million vector is:

storage = $$((20 \cdot 768) + (1.1 \cdot (4 \cdot 768 + 8 \cdot 16))) \cdot 10000000=175.8$$ GB

## FAQ

**_How is ingestion throughput affected by document length?_** Note that only the first 512 tokens are used to compute embeddings. Document length beyond the first 512 tokens has no impact on ingestion throughput. However, there is variability in ingestion throughput for documents that contain less than 512 tokens. In the following experiment, we selected the first k tokens of a document and we report the corresponding ingestion throughput for k = 128, 256, and 512.  As expected, throughput declines as document length increases. 

![Graph of throughput decline as a function of document length](/assets/media/blog-images/2023-07-10-semantic-search-performance/throughput-graph.png){: .img-fluid}

**_How is ingestion throughput affected by ML model size?_**   We considered three ML models---small, medium, and large--- described in the following table.

|Type	|Embedding model	|Size of ML model, \|parameters\|	|(\|Input dimensions\|, \|Output Dimensions\|)	|
|---	|---	|---	|---	|
|Small	|`all-MiniLM-L6-v2`	|22.7M	|(256, 384)	|
|Medium	|`msmarco-distilbert-base-tas-b-pt`	|66M	|(512, 768)	|
|Large	|`all-mpnet-base-v2`	|110M	|(384, 768)	|

We estimate the impact of ML model size on index throughput. As expected, as the size of the ML model increases, the index throughput declines. The following table shows p50 and p100 ingestion throughput.

|ML model size	|p50 ingestion throughput (docs/sec)	|p100 ingestion throughput (docs/sec)	|
|---	|---	|---	|
|Small	|1100.66	|1187.86	|
|Medium 	|305.32	|309.78	|
|Large	|161.76	|229.7	|

**_How I can tune my OpenSearch index to obtain the best results for both indexing and search?_** There are various blog posts that describe how to get the best performance. For general guidance, see [5]. For vector-related performance tuning, see [9].

## References

[1] Tri Nguyen, Mir Rosenberg, Xia Song, Jianfeng Gao, Saurabh Tiwary, Rangan Majumder, Li Deng: MS MARCO: A Human Generated MAchine Reading COmprehension Dataset. CoCo@NIPS 2016.

[2] Järvelin, Kalervo, and Jaana Kekäläinen. "Cumulated gain-based evaluation of IR techniques." *ACM Transactions on Information Systems (TOIS)* 20.4 (2002): 422-446.

[3] Hofstätter, Sebastian, et al. "Efficiently teaching an effective dense retriever with balanced topic aware sampling." *Proceedings of the 44th International ACM SIGIR Conference on Research and Development in Information Retrieval*. 2021.

[4]  https://aws.amazon.com/opensearch-service/pricing/  

[5] https://docs.aws.amazon.com/opensearch-service/latest/developerguide/bp.html

[6] https://opensearch.org/docs/latest/search-plugins/knn/knn-index/#memory-estimation

[7] https://aws.amazon.com/ebs/pricing/

[8] https://opensearch.org/docs/latest/search-plugins/knn/knn-index

[9] https://opensearch.org/docs/latest/search-plugins/knn/performance-tuning/


