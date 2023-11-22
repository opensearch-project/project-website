---
layout: post
title:  "Estimating throughput of OpenSearch-powered semantic search"
authors:
- navneev
- nmishra
- mshyani
- zaniu
- ylwu
- yych
- seanzheng
- kolchfa
date: 2023-11-19
categories:
 - technical-post
has_science_table: true
has_math: true
meta_keywords: 
meta_description: 
excerpt: 
---

Are you interested in trying [semantic search in OpenSearch](https://opensearch.org/blog/semantic-search-solutions/) but unsure how to configure an OpenSearch cluster? Are you curious about how cluster configuration impacts ingestion throughput and query throughput? This post explains the semantic search process through a running example, which includes ingesting and then querying the publicly available [MS Marco](https://huggingface.co/datasets/ms_marco) dataset.  

At a high level, the semantic search process in OpenSearch includes the following steps:

1. **Choose a machine learning (ML) model:** Choose a model for embedding documents and upload it to OpenSearch. You can either choose from a set of [pretrained models provided by OpenSearch](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/), [upload your own model](https://opensearch.org/docs/latest/ml-commons-plugin/custom-local-models/) into the OpenSearch cluster, or [connect to a model](https://opensearch.org/docs/latest/ml-commons-plugin/extensibility/index/) that is hosted on a third-party platform. To learn more about embeddings and model choice, see the [previous blog post](https://opensearch.org/blog/semantic-science-benchmarks/).
2. **Ingest data**: Ingest your documents using an ingest pipeline set up with the model from the previous step. The pipeline will first generate embeddings for the documents using the model and then ingest both the embeddings and the documents into an OpenSearch index.
3. **Query data**: Query for your search term using the `neural` query clause. The query term is embedded in the vector space at run time and the documents closest to the query in the vector space are retrieved using approximate k-NN.

Creating a cluster for semantic search is qualitatively different than creating one for keyword search. During the document ingestion phase, semantic search uses a large ML model to create vectors and thus requires far more computational resources than keyword search. At query time, semantic search employs k-NN search, which is fundamentally different from keyword search that uses an inverted index. We can thus no longer rely on our intuition for keyword search to guide cluster configuration for semantic search. Rather, we need to understand the parameters involved in the problem, the intricacies of throughput and latency, and the interplay between them. The goal of this post is to first present theoretical principles and then experiments so you can develop semantic search intuition. So let's begin!

## 1. Document ingestion

[Figure 1](#figure-1-ingestion-architecture-one-data-node-and-10-ml-nodes) illustrates document ingestion. During ingestion, a data node receives documents (1) and sends them to ML nodes in order to compute an embedding (2).  The ML node sends the embedding back to the data node for indexing (3). 

#### Figure 1. Ingestion Architecture: One data node and 10 ML nodes.
![Ingestion architecture](/assets/media/blog-images/2023-11-22-semantic-search-performance/ingestion-architecture.png){: .img-fluid}

Ingestion is a compute-intensive process because one embedding is computed for each ingested document and the ML model used to compute an embedding can be quite large. For example, the [TAS-B model](https://huggingface.co/sentence-transformers/msmarco-distilbert-base-tas-b) used in this post has 66M parameters and is 250 MB in size. Moreover, embedding models are getting larger by the day. Thus, having multiple ML nodes in your cluster can expedite throughput. However, at a certain point, adding more ML nodes without adding more data nodes (or more shards) does not increase ingestion throughput. This is because data nodes are responsible for sending and ingesting the documents, which takes a non-trivial amount of time. We will address this with more detail in the following section.

For this post, we chose an ingestion configuration with one data node and 10 ML nodes. The ingestion process requires documents to be first embedded and then ingested into an index. Hence, the total time required to ingest a single document is the sum of the time required to compute the embedding $$t_{embed}$$​ and the time required to index the embedding $$t_{index}$$​. Realistically, there is also a third component---the time a document sits idly at the ML node or the time the data node is waiting for its turn---we'll call this time $$t_{idle}$$​.  To sum up, the total ingest time is given by

$$
\begin{align}
t_{ingest}​= t_{embed} + t_{index} + t_{idle}.
\end{align}
$$

Note that the time it takes to embed or index a document depends on several factors, such as the document length, ML model size, and type of CPU core. Thus, $$t_{embed}$$, $$t_{index}$$,​ and $$t_{idle}​$$ are not constants.

On the left-hand side of the preceding equation, $$t_{ingest}$$ is the time that is measured by the latency of a request. However, you'll see that the *throughput does not equal the inverse of latency.* Let's study a simple example to understand why this is the case. 


### throughput $$\neq$$ 1 / latency

Consider a bakery with 5 different bakers serving customers concurrently at the counter. Let's assume that each baker takes 5 minutes to serve a customer. The total time spent by a customer at the bakery (that is, the latency) is the sum of the time spent waiting to be served $$t_{idle}$$​ and the time being served by the baker $$t_{baker}​=5\ min$$: 

$$
\begin{align}
latency=t_{idle}+t_{baker}​=t_{idle}+5\ min.
\end{align}
$$

If the bakery is not busy, there is a baker available immediately and there is no waiting time, so $$t_{idle} = 0$$. 

Now let’s calculate the throughput. The throughput is defined by the number of requests processed per some unit of time. In our example, throughput corresponds to the number of customers served in a given unit of time. This number depends on three quantities:

1. The number of customers arriving at the bakery
1. The number of bakers working at the bakery 
1. The time it takes a baker to serve the customer 

Let's assume for a moment that there are many customers arriving at the bakery and so no baker is ever free and every customer has to spent some time waiting, that is, $$t_{idle} \neq 0$$. 

Each baker takes 5 minutes to serve a customer, so a single baker processes 12 customer requests in 1 hour. Thus, 5 bakers together can serve 60 customers in 1 hour or, equivalently, 1 customer in 1 minute. The throughput of the bakery is thus 1 customer per minute. The throughput does not depend on the idle time simply because the rate at which requests are processed is independent of the time a customer has to wait! The throughput is not equal to the inverse of latency. Instead, the throughput is given by the number of customers served by a baker per unit of time multiplied by the number of concurrent bakers:

$$
\begin{align}
throughput=\frac{1\ customer​}{5\  min}\times5=1\ customer/min.
\end{align}
$$

Note that in our example we assume that there are always enough customers waiting so each baker is always busy. There is one important situation where this is not the case; we will discuss it in the [following section](#estimating-throughput-of-the-ml-nodes). For now, equipped with the intuition of this simple example, let's dive into estimating document ingestion throughput.

### Back to document ingestion

For document ingestion, throughput is the rate at which documents are processed. In our pipeline, both the data nodes and ML nodes are working serially (not in parallel). Thus, a document must first be vectorized by the ML node and then indexed by the data node. However, the ML node and data node can work at the same time on different data. In terms of the bakery analogy, imagine that each customer has to be served by two employees in series. First, a customer by a baker at the counter and then by a cashier at checkout. The baker and the cashier can work concurrently on different customers. How can we calculate the throughput for such a system?

Say that a baker and a cashier take the same amount of time to process a request and this amount is 5 minutes per customer. The throughput at the bakery counter with 5 bakers, as before, is 1 customer/min. The throughput at the checkout with 5 cashiers is also 1 customer/min. But what is the throughput of the entire bakery? The throughput of the entire system is also 1 customer/min! To understand this, imagine you are observing the exit door of the bakery. The rate at which customers come out of the exit door is the rate at which the last step of the sequence (cashiers at the checkout) processes requests. 

What if a cashier takes far less time than the baker? Say the cashier takes 2.5 minutes per customer while the baker takes 5 minutes per customer. In this case, the throughput at the bakery counter is, as before, 1 customer/min. But what is the throughput at the checkout? It might seem that since each cashier serves 60 minutes / 2.5 minutes = 24 customers per hour, and there are 5 cashiers in total, the throughput should be 24 * 5 = 120 customers per hour (or 2 customers per minute). But this calculation is wrong. Do you see why?

The error comes from assuming that there are always customers that the cashier can attend to. In fact, this is not the case because for every batch of customers that were just served by the bakers, the cashiers can serve them *before* the next batch of customers are served by the bakers. So there are times when the cashiers are just waiting! The throughput of the cashiers is limited by the throughput of the bakers. In other words, the cashiers can process 2 customers/min but since they receive only 1 customer/min from the bakers, they can only process 1 customer per minute. More precisely, the throughput $$I$$ is

$$
\begin{align}
I_{bakery}​=min(I_{bakers}​,I_{cashiers​}).
\end{align}
$$

Our document ingestion process is identical to the bakery process. Instead of bakers, we have ML nodes that create vectors and instead of cashiers, we have data nodes that index the vectors. The ingestion throughput $$I$$ of the cluster is then given by

$$
\begin{align}
I_{documents}​ = min(I_{ML\ nodes}​,I_{data\ nodes}​).
\end{align}
$$

The problem now reduces to identifying the bottleneck component and estimating its throughput. 


### Who are the bakers?

In the bakery analogy, the bakers work slower than the cashiers. Similarly, for our real scenario, we need to identify the bakers (bottlenecks) in our cluster. To do that, let's look at a typical cluster shown in [Figure 1](#figure-1-ingestion-architecture-one-data-node-and-10-ml-nodes). In this cluster, there are several ML nodes, which create vectors, and a data node, which indexes the vectors. 

To determine which process takes longer, we can look at the nodes' CPU utilization during document ingestion. The nodes that have higher CPU utilization are the bakers of the system! The nodes that have lower utilization aren’t working at full capacity, just like the cashiers in our analogy. 

**For our configuration, we found that the ML nodes have a much higher CPU utilization than the data nodes during document ingestion.** Thus, the throughput of our cluster for document ingestion is given by 

$$
\begin{align}
I_{documents}​​=min(I_{ML\ nodes}​,I_{data\ nodes}​) = I_{ML\ nodes}.
\end{align}
$$

Note that this might not be the case for all configurations. For instance, if the ML model is small, the documents are short, or the ML node is very powerful, it is possible for the data node to become the bottleneck. In this case, the throughput will be 

$$
\begin{align}
I_{documents}​​=min(I_{ML\ nodes}​,I_{data\ nodes}​) = I_{data\ nodes}.​
\end{align}
$$

### Estimating throughput of the ML nodes

Similarly to the bakery analogy, we must find our OpenSearch cluster equivalent of the number of bakers who work at the counter and the time it takes to serve one request. For our cluster, the number of bakers is equivalent to

$$
\begin{align}
number\ of\ workers=Mc_M​k_M​
\end{align}
$$

where $$M$$ is the number of ML nodes, $$c_M$$ is the number of cores per node,​ and $$k_M$$​ is the number of threads per core. In other words, each thread working on a CPU core is the equivalent of one baker. Thus, the number of workers is simply the number of threads working concurrently in our cluster. We next need to find the time it takes for one worker to serve one request. This time is almost impossible to estimate theoretically. But thankfully, the OpenSearch [ML Profile API](https://opensearch.org/docs/latest/ml-commons-plugin/api/profile/) can help us here. The Profile API precisely measures the time it takes for the model to create a vector for one document using one thread. Let's call this time $$t_{embed}$$​. Equipped with this information, we can define the following formula for estimating the ingestion throughput:

$$
\begin{align}
I_{documents}​​=\frac{number\ of\ workers}{time\ taken\ by\ each\ worker}​=\frac{​Mc_M​k_M​​}{t_{embed}} \tag{1} \label{1}
\end{align}
$$

Note that our formula makes an implicit assumption that all bakers are always working, that is, the CPU utilization of ML nodes is close to 100% at all times. In our experiments, we found that this was indeed the case.

### How do I use the ingestion formula?

To use the formula $$(\ref{1})$$, we need to know the four quantities on its right-hand side. The numerator is easy to obtain for a given cluster. For the cluster in [Figure 1](#figure-1-ingestion-architecture-one-data-node-and-10-ml-nodes), $$M=10\ ML\ nodes$$. Each node is a `12xlarge`, and thus has $$c_M​=48\ cores\ per\ node$$. For each core, we used $$k_M​=2\ threads\ per\ core$$. 

The time taken to create a vector $$t_{embed}$$​ depends on factors like the ML embedding model, type of CPU core, and lengths of documents. You can estimate $$t_{embed}$$ by loading the ML embedding model of your choice to your OpenSearch cluster, ingesting a few hundred typical documents, and running the Profile API. It is crucial that the documents used are representative of the actual documents in terms of length and that the type of ML node used for this experiment is identical to the node type of the actual production ML node. For instance, do not test ingestion on `r6` and then use it on a `c6` in production.

For our experiment, we found that for the ML node of a `c6g` type, the latency is $$t_{embed}​=3.878\ seconds$$. Using formula $$(\ref{1})$$, we can estimate the ingestion throughput for our cluster as

$$
\begin{align}
I_{documents}​​ \approx {48 \cdot 2 \cdot 10 \over 3.878}​=247\ docs/second.
\end{align}
$$

This estimate is quite close to the actual results of 261 docs/second, which we obtained by ingesting 12M documents of MS Marco into our cluster. Because we used the p50 latency in our formula, we compared the estimated throughput with the p50 value of the actual throughput.

For reference, the same experiment using just the data node and BM25 ingestion achieves a p50 throughput of 7000 docs/second. This is not surprising because running BM25 is not nearly as compute intensive as creating vectors using a large neural network. We tested our formula using a variety of clusters and instance types and found that our predictions are quite close to the actual throughput. The results are summarized in the following table. 


|Data node	|ML node	|p50 -- Profile API latency (seconds)	|p50 -- CPU utilization (data node, ML node)	|Actual throughput (p50)	|Estimated throughput	|
|---	|---	|---	|---	|---	|---	|
|1 r6g.4xlarge: 16 vCPU	|10 c6g.12xlarge: 48 vCPU	|3.878	|(7, 99)	|261 docs/sec	|247 docs/sec	|
|1 r6g.4xlarge: 16 vCPU	|1 c6g.12xlarge: 48 vCPU	|3.878	|(16, 99)	|27 docs/sec	|24.7 docs/sec	|
|1 m5.2xlarge: 8vCPU	|5 m5.2xlarge: 8vCPU	|1.965	|(8, 99)	|39.62 docs/sec	|40.7 docs/sec	|
|1 m5.2xlarge: 8vCPU	|20 m5.2xlarge: 8vCPU	|1.914	|(56, 95)	|154.24 docs/sec	|167.2 docs/sec	|
|1 m5.2xlarge: 8vCPU	|20 m5.2xlarge: 8vCPU	|2.007	|(6, 97)	|159.2 docs/sec	|159.4 docs/sec	|

_Comparison of the actual throughput with the estimated throughput for different cluster settings (ingestion throughput $$I$$ is calculated using formula $$(\ref{1})$$ and latency $$t_{embed}$$ is measured using the Profile API)​._

### Ingestion results summary

We can summarize the results as follows:

1. If the ML node CPU utilization is near 100%, we can use formula $$(\ref{1})$$ to estimate the ingestion throughput. If the CPU utilization for both the data and ML node is low, we are not using the ML node optimally. In that case, we should increase the number of documents for ingestion (bulk size), while ensuring that the data node CPU utilization stays low.
2. To use the formula $$(\ref{1})$$, we need to obtain $$t_{embed}$$​ by running a small cluster and ingesting a few hundred documents as mentioned previously. Make sure that these documents are randomly sampled from the dataset (and thus are representative of the dataset in terms of document length).
3. Exercise caution when extrapolating the formula to very large datasets. Most importantly, monitor the data node CPU utilization. As the index size gets larger, the data node CPU utilization can increase during the later parts of ingestion and could become the bottleneck. In that case, $$min(I_{ML\ nodes}​,I_{data\ nodes}​) = I_{data\ nodes}​$$ and the throughput can be drastically different from formula $$(\ref{1})$$, where we assumed that $$min(I_{ML\ nodes}​,I_{data\ nodes}​) = I_{ML\ nodes}$$​.
4. Because the ingestion formula is given by the minimum ingestion of the different nodes, it can at least help us estimate the minimum ML node requirements for the desired throughput.


## 2. Querying data

[Figure 2](#figure-2-querying-architecture-one-coordinator-node-one-ml-node-and-multiple-data-nodes) illustrates the querying process. During querying, the coordinator node receives a search query (1) and sends the search query to a ML node (2) to compute an embedding. The ML node sends the embedding back to the coordinator node (3). Next, the coordinator node sends the embedded version of the query to the data nodes (4) to identify nearest neighbors (5). 

### Figure 2. Querying Architecture: One coordinator node, one ML node and multiple data nodes.

![Querying architecture](/assets/media/blog-images/2023-11-22-semantic-search-performance/querying-architecture.png){: .img-fluid}

As before, the total time taken to answer a query is the sum of the time taken to embed a query, the time k-NN search takes (similar to the indexing time in ingestion), and the time spent idly waiting at the data node or ML node. 

$$
\begin{align}
t_{query}​​=t_{embed}​ + t_{k-NN} + t_{idle}​.
\end{align}
$$

Again, the throughput is not given by the inverse of the latency. Like in the case of document ingestion, answering a query consists of two distinct processes: embedding generation and k-NN search. Every query has to finish the two processes one after the other. As before, the two processes can work concurrently on different data. However, there is one difference between ingestion and querying. For ingestion, we imagined that the rate at which documents are being sent to the system is far greater than the throughput of the data or ML nodes. In other words, there were always enough customers waiting to be served at the bakery. For querying, this is not the case. 

Typically, query throughput is measured with respect to a fixed number of search clients $$S$$. A single search client sends a query and waits until it obtains the result before sending the next query. How can we model the throughput of an OpenSearch cluster for such a setting? Let's again use the bakery analogy. 

### Popular bakeries have security guards

Imagine the bakery scenario with one additional constraint: we now have a security guard who controls the number of people entering the bakery. The guard only allows $$S$$ customers inside the bakery, letting a new customer enter the bakery only when an old customer exits the bakery. Such a setup is identical to the query throughput case with $$S$$ search clients.

If $$S$$ is very large, we are back to the original scenario where $$I_{bakery}=min(I_{bakers}​,I_{cashiers}​)$$. But for small $$S$$, we need to change this formula. Let's say that $$S=4$$ in our bakery of 5 bakers and 5 cashiers. Each baker takes 5 minutes to process a request while each cashier takes 3 minutes. The guard allows 4 customers to enter the bakery. These 4 customers will have to be served by the bakers and the cashiers in series. Thus, each customer can be served in a total of 8 minutes. Because both the number of bakers and the number of cashiers are more than 4, all the customers can be served concurrently. The total throughput therefore is

$$
\begin{align}
I_{bakery}​ = \frac{S}{t_{bakers}​+t_{cashiers}}​=\frac{4\ customers}{5\ min + 3\ min​}= \frac{1}{2}\ ​customer/min.
\end{align}
$$

What if the guard allows more customers in the bakery, say $$S=10$$? In that case, 10 customers arrive inside the bakery, but there are only 5 bakers, each of whom takes 5 minutes to serve a customer. The bakery counter releases 5 customers after the first 5 minutes. It releases the next 5 customers after another 5 minutes. So although $$S$$ is not very large, we realize that the bakery department is the bottleneck. Indeed, the throughput of the bakery is 10 customers per 10 minutes. In other words,

$$
\begin{align}
I_{bakery}​ = min \left(\frac{10}{5+3}​,\frac{10}{5+5}\right)=1\ customer/min.
\end{align}
$$

A similar logic applies if we have too many (or fast) bakers but too few (or slow) cashiers. In that case, the checkout would be the bottleneck. Putting everything together, we thus have 

$$
\begin{align}
I_{bakery}​ = min \left( \frac{S}{t_{baker}​+t_{cashier​}}​​, I_{bakers}​,I_{cashiers}​ \right)
\end{align}
$$

### Back to queries

For our OpenSearch cluster, we correspondingly obtain

$$
\begin{align}
I_{queries}​ = min \left( \frac{S}{t_{k-NN}​+t_{embed}}​​, I_{k-NN}​,I_{embed}​ \right)
\end{align}
$$

The only thing that remains is to estimate the k-NN and embed throughput. As before, we must find the number of bakers who work at the counter and the time it takes to serve one request. The bakers are the analogs of our ML nodes. Unlike in document ingestion, where the data nodes had low CPU utilization and ML nodes had close to 100% utilization, for queries, the CPU utilization of both node types is comparable. In other words, we also need to know the number of cashiers in the system.

For an ML node, we have

$$
\begin{align}
number\ of\ ML\ node\ workers​ = Mc_M​k_M,
\end{align}
$$

where $$M$$ is the number of ML nodes, $$c_M$$ is the number of cores per node,​ and $$k_M$$​ is the number of threads per core. 

For data nodes, we have

$$
\begin{align}
number\ of\ data\ node\ workers​ = c_D​k_D,
\end{align}
$$

where $$c_D$$​ is the number of cores per node and $$k_D$$ is the number of threads per core. Note the conspicuous absence of the number of data nodes D in the formula. This is because every k-NN query is run on *each* data node (assuming that each data node possesses a k-NN index shard) and so having more data nodes does not change the throughput. Having more replicas can circumvent this limitation and allow us to benefit from adding more data nodes. In all our formulas and experiments, we set the number of replicas to zero. Putting all this together, we have the formula for query throughput

$$
\begin{align}
I_{queries}​ = min \left( \frac{S}{t_{k-NN}​+t_{embed}}​​, \frac{Mc_M​k_M}{t_{embed}}​, \frac{c_D​k_D}{t_{k-NN}}​ \right).
\end{align}
$$


### How do I use the query throughput formula?

Now let's briefly discuss how to use this formula. We know the value of every variable on the right-hand side based on our cluster settings, except the times $$t_{k-NN}$$ and $$t_{embed}$$. These times are almost impossible to estimate theoretically. As before, the OpenSearch [ML Profile API](https://opensearch.org/docs/latest/ml-commons-plugin/api/#profile) can help us with this task. The Profile API precisely measures the time it takes for the model to create a vector for one document using one thread. This provides us with $$t_{embed}$$. The API also measures the end-to-end OpenSearch latency. Recall that the total latency is given by $$t_{embed}​+t_{k-NN}​+t_{idle}$$​. If the ML and data node CPU utilization is much less than 100%, most queries do not have to wait to be processed by the data or ML node, that is, $$t_{idle}​ \approx 0$$. In that case, we can simply subtract $$t_{embed}$$ from the end-to-end latency to calculate the $$t_{k-NN}$$​ latency. 

To obtain these numbers from the ML Profile API, as before, you can send a few hundred queries to your OpenSearch cluster and run the API. Note that the sample queries should be representative of the actual queries in terms of the query length to get a fair estimate. We tested our formula using a variety of clusters and instance types and found that our predictions are quite close to the actual throughput. The results are summarized in the following table. 


| Configuration 	| Search clients S	| Data nodes: D 	|  ML nodes: M  	| OpenSearch end to end latency (p50) in ms 	| Embedding latency: e  (p50) in ms	|Max CPU utilization of (data, ML) node	| Mean throughput (answered search queries/sec)  	|Estimated throughput	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|
| **A**	|20	| 1 r6g.4xlarge, 16 cores	| 1 r6g.12xlarge, 48 cores	|170.9	|53.64	|(85,35)	|116.9	|117.0	|
|	|25	|1 r6g.4xlarge, 16 cores	|1 r6g.12xlarge, 48 cores	|188.1	|53.75	|(98,41)	|132.1	|132.9	|
| **B**	|20	|3 r6g.4xlarge, 16 cores	|1 r6g.12xlarge, 48 cores	|108.8	|54.16	|(60,50)	|183.4	|183.8	|
|	|25	|3 r6g.4xlarge, 16 cores	|1 r6g.12xlarge, 48 cores	|118.4	|58.76	|(64,55)	|212.2	|211.2	|
| **C**	|20	|3 r6g.4xlarge, 16 cores	|1 c6g.4xlarge, 16 cores	|108.7	|53.11	|(58,88)	|182.2	|183.9	|
|	|25	|3 r6g.4xlarge, 16 cores	|1 c6g.4xlarge, 16 cores	|112.9	|54.3	|(63,93)	|218.2	|221.4	|

We used standard OpenSearch settings for deciding the number of threads: $$k_M​=2$$ for an ML node and $$k_D​=1.5$$ for a data node. Note that the number of cores on a data node is always even, so the number of total threads on a data node is a whole number (and not fractional). We also learned some valuable insights from our experiments that corroborate our intuitive understanding. For instance, we noticed that the CPU utilization of ML nodes was well below 90% for configurations A and B, which means that the data nodes are the bottleneck. There is room for decreasing the number of ML nodes without affecting the throughput. **For configuration C, we kept the same data nodes but reduced the number of ML node cores from 48 to 16.** The CPU utilization hit 90+%, while the overall throughput remained unchanged from B. In other words, configuration C made optimal use of data and ML nodes. Thus, ML nodes and data nodes (and shards) should be scaled in tandem to make the optimal use of your cluster for increased throughput.

### Querying results summary

We can summarize the results as follows:

1. The query throughput can change because of many factors, such as the number of search clients $$S$$, data node CPU utilization, and ML node CPU utilization. 
2. Increasing the throughput is not necessarily the most accurate performance criterion during querying. For instance, increasing $$S$$ can lead to a higher throughput but also to a higher latency because each request will now have a large $$t_{idle}$$​. Thus, the end user will have to wait longer for each query. 
3. Increasing the number of data nodes without increasing the number of replicas does not improve throughput.
4. Unlike passage ingestion, the CPU utilization of both the ML and data nodes is quite comparable; neither of them can be neglected. If either of them is close to 100%, $$t_{idle}​ \neq 0$$ and our formulas cannot be used. To be precise, we would no longer be able to estimate $$t_{k-NN}$$​ as the difference between the end-to-end OpenSearch latency and inference latency. 
5. In a live environment, $$S$$ is dynamic. It also changes drastically based on the type of user or time of the year. Our formulas can provide guidance about scaling the cluster configuration up (or down) based on the throughput requirements and $$S$$.

## Final remarks

Overall, we found that estimating the throughput of an OpenSearch cluster involves several parameters and that it is difficult to make concrete predictions without making a few simplifying assumptions. We discussed the criteria when our assumptions hold true and derived simple formulas that you can use to reliably estimate the throughput under those conditions. While our formulas should be used with caution and only when the assumptions hold true, we identified different parameters of a cluster that can affect the throughput.

This blog is primarily focused on throughput and not latency. At query time, latency is a very important criterion and one needs to carefully ration the time and resources spent on ML inference and k-NN search based on the specific latency requirements. Refer to [this AWS blog](https://aws.amazon.com/blogs/big-data/choose-the-k-nn-algorithm-for-your-billion-scale-use-case-with-opensearch/) for k-NN resource estimation.

A final word of caution: We conducted these experiments on separate test clusters, where we had the luxury of using peak CPU utilization on the ML and data nodes. In a live production environment, it might not be advisable to max out the utilization on the data (and possibly ML) nodes.
