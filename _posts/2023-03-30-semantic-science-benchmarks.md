---
layout: post
title:  "The ABCs of semantic search in OpenSearch: Architectures, benchmarks, and combination strategies"
authors:
- mshyani
- dhrubo
- nmishra
- kolchfa
date: 2023-03-30
categories:
 - technical-post
meta_keywords: semantic search engine, neural search engine, keyword and natural language search, search relevance, benchmarking tests
meta_description: Learn how to create a semantic search engine in OpenSearch, including architecture and model options, benchmarking tests, and effects of different combination strategies and normalization protocols.

excerpt: In an earlier blog post, we described different ways of building a semantic search engine in OpenSearch. In this post, we'll dive further into the science behind it. We'll discuss the benefits of combining keyword-based search with neural search, the architecture and model options, and benchmarking tests and results. First, we'll provide an overview of our proposed solutions and a summary of the main results. Next, we'll outline the steps for creating a solution and fine-tuning it for your own document corpus. Finally, we'll discuss the effects of different combination strategies and normalization protocols on search relevance. 
---

<script type="text/javascript" async
  src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML">
</script>

<style>
table{
    border:2px solid #e6e6e6;
    display: block;
    max-width: -moz-fit-content;
    max-width: fit-content;
    margin: 0 auto;
    overflow-x: auto;
}

th{
    border:2px solid #e6e6e6;
    padding: 5px;
    text-align: center;
}

td{
    border:1px solid #e6e6e6;
    padding: 10px;
    text-align: center;
}
</style>

In an earlier [blog post](https://opensearch.org/blog/semantic-search-solutions/), we described different ways of building a semantic search engine in OpenSearch. In this post, we'll dive further into the science behind it. We'll discuss the benefits of combining keyword-based search with neural search, the architecture and model options, and benchmarking tests and results:
- In [Section 1](#section-1-overview), we provide an overview of our proposed solutions and a summary of the main results. 
- In [Section 2](#section-2-obtaining-a-fine-tuned-transformer), we outline the steps needed to create a solution and fine-tune it for your own document corpus. 
- In [Section 3](#section-3-combination-methods) and [Section 4](#section-4-normalization-and-other-combination-methods), we discuss the effects of different combination strategies and normalization protocols on search relevance. 
- In [Section 5](#section-5-strengths-and-limitations), we present the conclusions of our experiments.
- In the [Appendix](#appendix), we provide more information about the test datasets used for benchmarking.

## Section 1: Overview 

A search engine should work well for both **keyword** and **natural language** searches. 

BM25 excels at providing relevant search results when a query contains **keywords**. Keyword-based searches are extremely fast and robust but have natural drawbacks because keywords do not encapsulate natural language. 

Large neural networks, such as transformers, perform better when a query requires **natural language** understanding (for example, using synonyms). However, even the largest transformer models show performance degradation on data that does not belong to their train-data distribution. 

Both search methods have complementary strengths, so it is natural to investigate a solution that combines them. In addition, most document corpora contain documents that require keyword matching as well as semantic understanding. For example, an e-commerce shoe dataset should be searchable using highly specific keywords, such as `“12 US Men”`, and natural language phrases, such as `“fashionable comfortable running shoes”`. 

### A metric and test datasets for benchmarking

To benchmark solutions, you must select a **metric** for measuring search relevance and the **test datasets**. 

We chose [nDCG@10](https://en.wikipedia.org/wiki/Discounted_cumulative_gain), a widely used information retrieval **metric**, for measuring search relevance. 

For the **test datasets**, we selected 10 different datasets covering a wide variety of domains, query lengths, document lengths, and corpus sizes. Each test dataset contains a list of queries, documents, and relevancy judgments. The relevancy judgments are annotated by human experts (see the [Appendix](#appendix-details-of-test-datasets) for more information) and are usually represented by binary labels (`1` for relevant and `0` for irrelevant). Nine of these datasets belong to the [BEIR](https://arxiv.org/abs/2104.08663) challenge---a popular collection of test datasets used to benchmark search engines. The tenth dataset is the [Amazon ESCI](https://github.com/amazon-science/esci-data) challenge dataset for product search. These 10 datasets cover multiple domains, including e-commerce, COVID-19 statistics, personal finance, and quantum physics. 

### The zero-shot regime

Because most search systems are deployed on datasets outside of their training data, we needed to benchmark our solutions on data that they have never encountered before, that is, in a *zero-shot regime*. Our models were trained exclusively on data distributions that do not overlap with the data distributions of the 10 test datasets. Note that this is different from training models using a train-dev-test split. There, the model is trained on the train split and evaluated on the held-out dev and test splits. In this experiment, the test dataset comes from a different distribution than the training set.

### Results summary

In an earlier [blog post](https://opensearch.org/blog/semantic-search-solutions/), we proposed two semantic search solutions: a pretrained transformer + BM25 and a fine-tuned transformer + BM25. In the following sections, we discuss the details of combining transformers with BM25. The following table summarizes the nDCG@10 benchmarking results on the 10 test datasets for the pretrained and fine-tuned transformer (TAS-B) when combined with BM25. For the definition of the combination strategies (harmonic mean, arithmetic mean, and geometric mean), see [Section 3](#section-3-combination-methods).

| |BM25 | Pretrained transformer + BM25 (harmonic) | Fine-tuned transformer + BM25 (arithmetic) | Fine-tuned transformer + BM25 (geometric) |
| :--- | --- | --- | --- | --- |
|NFCorpus | 0.343 | 0.346 | **0.369** | 0.367 |
|Trec-Covid | 0.688 | 0.731 | 0.752	| **0.79** |
|ArguAna	|0.472	|0.482	| **0.527**	| 0.526 |
|FiQA	|0.254	|0.281	|**0.364**	| 0.350 |
|Scifact	|0.691	|0.673	|**0.728**	| 0.727 |
|DBPedia	|0.313	|**0.395**	|0.373	| 0.392 |
|Quora	|0.789	|0.847	|**0.874**	| 0.872 |
|Scidocs	|0.165	|0.173	|**0.184**	| **0.184** |
|CQADupStack	|0.325	|0.333	| 0.3673	| **0.377** |
|Amazon ESCI	|0.081	|0.088	|**0.091**	| **0.091** |
|**Average performance <br>against BM25**	|**N/A**	|**6.42%**	| **14.14%**	| **14.93%** |

In [Section 2](#section-2-obtaining-a-fine-tuned-transformer) we discuss the details of obtaining a fine-tuned transformer. If you’re interested in the result details, skip to [Section 3](#section-3-combination-methods) and [Section 4](#section-4-normalization-and-other-combination-methods).

## Section 2: Obtaining a fine-tuned transformer

To understand the fine-tuned solution, we first need to explore the pretrained solution along with its strengths and limitations. Our pretrained solution consists of a state-of-the-art neural retriever model combined with BM25. We experimentally compared different ways of combining the neural retriever model with BM25 to produce the best results.

A neural retriever model first creates a vector index of all the documents in the corpus and then at runtime conducts a search using a k-NN query. The model has been trained to map relevant documents close to each other and irrelevant documents farther apart by reading the labeled `(query, passage)` pairs. Recall that in a zero-shot regime, training data is different from the test datasets. [TAS-B](https://huggingface.co/sentence-transformers/msmarco-distilbert-base-tas-b) is a popular state-of-the-art model that is trained on the [MS Marco](https://huggingface.co/datasets/ms_marco) dataset; it has been shown to have non-trivial zero-shot performance [2]. It uses the [DistilBert](https://huggingface.co/docs/transformers/model_doc/distilbert) checkpoint and has 66 million parameters and an embedding dimension of 768. 

There are other models, such as [MPNet](https://huggingface.co/docs/transformers/model_doc/mpnet), that show equivalent or better performance. These models are trained on a lot of data, which includes some of the test datasets, so it is difficult to benchmark them in terms of zero-shot performance. 

Note that one of the reasons we work in a zero-shot regime is that we often do not have access to supervised data from the domain of choice. To be precise, we have passages from the domain of choice but do not have access to queries or `(query, relevant passage)` pairs. If such data existed, the ideal solution would have been to use it to fine-tune a transformer model. A fine-tuned transformer would certainly perform better than a pretrained transformer [2]. 

However, in the absence of domain-specific data, we can leverage the power of large language models (LLMs) to create artificial queries when given a passage. In the rest of this section, we discuss generating synthetic queries and using them to obtain a model fine-tuned to your corpus. As shown in the preceding table, fine-tuned models perform better than pretrained models.

Creating a fine-tuned model consists of three steps:

1. Obtain an LLM for query generation.
2. Use the query generator model to create synthetic queries given a corpus.
3. Train a small model (such as TAS-B) on the synthetic corpus.

The [Demo Notebook for Sentence Transformer Model Training, Saving and Uploading to OpenSearch](https://opensearch-project.github.io/opensearch-py-ml/examples/demo_transformer_model_train_save_upload_to_openSearch.html) automatically performs all of these steps for the corpus of your choice.

***Over time, we plan to release newer, more powerful LLMs for query generation that will produce better synthetic queries and lead to improved downstream search performance.***

### 2.1. Obtaining a query generator model

There are many publicly available LLMs that can be used for free-form text generation. However, there are very few models that are trained to generate queries. To the best of our knowledge, there is no public GPT-style (that is, decoder only) LLM for query generation.

We fine-tuned and released the [1.5B GPT2-XL](https://huggingface.co/gpt2-xl?text=My+name+is+Merve+and+my+favorite) model for synthetic query generation. This model is automatically downloaded by the demo notebook. The model is fine-tuned using the MS Marco and [Natural Questions](https://huggingface.co/datasets/natural_questions) (NQ) datasets. These datasets are famous, high-quality datasets in the field of information retrieval. They consist of human-generated queries and corresponding passages or documents that answer each query. For every `(query, passage)` pair, we created the following training sample:

`<startoftext> passage <QRY> query <endoftext>`

In the preceding expression, the special tokens enclosed in angle brackets denote the start of text, start of query, and end of text, respectively. The loss function is the [autoregressive](https://s3-us-west-2.amazonaws.com/openai-assets/research-covers/language-unsupervised/language_understanding_paper.pdf) [cross-entropy](https://pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html) loss, that is, the model tries to predict the next word given previous words. We used the [AdamW](https://pytorch.org/docs/stable/generated/torch.optim.AdamW.html) optimizer with a learning rate of 2e-5 and a [linear schedule](https://huggingface.co/docs/transformers/main_classes/optimizer_schedules#transformers.get_linear_schedule_with_warmup) with 5,500 warmup steps. Training was performed on 8 Tesla V100 GPUs with a batch size of 24 for 4 epochs.

We only used those samples from NQ that have long answers and do not contain tables, producing approximately 110K `(passage, query)` pairs with a median passage length of 104 words. For MS Marco, we used the train and validation splits to obtain 559K `(passage, query)` pairs with a median passage length of 52 words.

### 2.2. Creating a synthetic corpus

After downloading the model, the demo notebook uses it to generate synthetic data.

We recommend running the notebook on a GPU-powered machine; we used a p3.x16large EC2 instance that has 8 16 GB GPUs.

The total time required to generate 16 queries per document for 1M documents is about 48 hours. The generation time scales linearly with the number of documents and can be improved by using larger batch sizes.

During the generation phase we sampled tokens with a default temperature of 1, top-p value of 0.95, and top-k value of 50. From the model's perspective, tokens are the atomic elements of a sentence. They are similar to words, except a word can be split into multiple tokens. Splitting words into tokens ensures that the vocabulary size does not grow very large. For instance, if a language consists of only four words---“internet”, “international”, “net”, and “national”---we can save space by splitting these words into three tokens: “inter”, “national”, and “net”. 

For more information about these hyperparameters and how they affect text generation, see [this Hugging Face blog post](https://huggingface.co/blog/how-to-generate). Intuitively, higher temperature, top-k, or top-p values yield more diverse samples. We specified the maximum length of the generated query as 25 tokens. Additionally, we set the `repetition_penalty` to 1.2, thus incentivizing the model to create queries with no repeating tokens. Once the queries are generated, the notebook automatically applies a query filtering model to remove toxic queries using the publicly available [Detoxify](https://pypi.org/project/detoxify/) package.

### 2.3. Fine-tuning TAS-B on the synthetic corpus

The synthetic corpus created in the previous step is used to fine-tune a pretrained small language model for search. The demo notebook downloads the pretrained TAS-B model and performs the remaining steps automatically. The model is trained to maximize the dot product between relevant queries and passages while at the same time minimizing the dot product between queries and irrelevant passages. This is known in the literature as *contrastive learning.* 

We implemented contrastive learning using in-batch negatives and a symmetric loss. The loss is defined for a given batch $$B$$, where a *batch* is a subset of query-passage pairs. Let $$p$$ be a vector representation of a passage and $$q$$ be a vector representation of a query. Let $$Q$$ be a collection of queries in a batch $$B$$, such that $$Q = \{q_1​,q_2​,\dots,q_{∣B∣​}\}$$. Further, let $$P$$ be a collection of passages, such that $$P = \{p_1​,p_2,\dots,p_{∣B∣​}\}$$. The loss $$\mathcal L$$ for a batch $$B$$ is given by

$$
\begin{align}
\mathcal L = C(Q, P) + C(P​, Q) \tag{1} \label{1},
\end{align}
$$

where

$$
\begin{align}
C(Q​, P) = −\sum_{i=1}^{|B|}​log \left(\frac{sim(q_i​,p_i​)}{sim(q_i​,p_i​) + \sum_{j \neq i}^{|B|}sim(q_i​,p_j​)}​\right) \tag{2} \label{2}
\end{align}
$$

and 

$$
\begin{align}
sim(q​, p) =  q^T \cdot p. \tag{3}
\end{align}
$$

The total loss is the sum of the losses across all batches. 

Note that many models are trained using the dot product similarity (not cosine similarity), so the query and passage vectors are not necessarily normalized. For a given batch, the loss consists of the two terms $$C(Q,P)$$ and $$C(P,Q)$$. In equation $$(\ref{2})$$, $$C(Q,P)$$ is not symmetric in $$Q$$ and $$P$$ because the sums over $$i$$ and $$j$$ do not commute. Combining the two terms in equation $$(\ref{1})$$ makes the loss symmetric. 

The loss is minimized as the argument of the logarithm in equation $$(\ref{2})$$ approaches 1. In other words, minimizing $$C(Q,P)$$ is equivalent to maximizing $$sim(q_i​,p_i​)$$ and minimizing $$sim(q_i​,p_j​)$$ for $$i\neq​j$$. Here we are assuming that if the data is shuffled randomly, the queries $$q_i$$​ and passages $$p_j$$​ within a batch $$B$$ are unrelated to each other for $$i\neq​j$$. To achieve this goal, the model will learn to map the relevant query and passage pairs $$(q_i​,p_i​)$$ close to each other and irrelevant pairs $$(q_i​,p_j​)$$ farther apart. This technique, known as _in-batch negative sampling_, is widely used for training dense retrievers [7]. 

The model is trained using the AdamW optimizer for 10 epochs with a learning rate of 2e-5 and a scheduler that uses a linear schedule with 10K warmup steps. Larger batch sizes lead to more in-batch negatives, which in turn lead to better models. On the other hand, larger batch sizes also may cause GPU out-of-memory issues and should be selected based on GPU memory. We also found that increasing the number of synthetic queries per passage produces better fine-tuned models. However, having a large number of synthetic queries comes with the cost of longer generation and training times, to the point of diminishing returns. On average, we created 24 queries per document in our experiments.

## Section 3: Combination methods

We combined transformers with BM25 using three main methods: arithmetic mean, geometric mean, and harmonic mean. For each of these combination methods, we retrieved the top 9,999 documents for BM25 and the top 250 documents for [neural query](https://opensearch.org/docs/latest/search-plugins/neural-search/). Each set of scores was normalized by the L2 norm. To be precise, given a list of scores $$b=[b_1​, b_2​, \dots]$$, we normalized them using the following formula:

$$
\begin{align}
\tilde{b_i}​=\frac{b_i}{​{\lVert b \rVert}_2}.
\end{align}
$$

Given a list of scores $$b$$ for BM25 and $$n$$ for neural search, we can calculate their combined score $$s$$ as follows:

$$
\begin{align}
s_i​=\left\{
\begin{array}{ll}
      \frac{\tilde{b_i}+\tilde{n_i}}{2}, & arithmetic\ mean \\
      \sqrt{\tilde{b_i}\tilde{n_i}}, & geometric\ mean \\
      \frac{2\tilde{b_i}\tilde{n_i}}{\tilde{b_i}+\tilde{n_i}}, & harmonic\ mean. \\
\end{array} 
\right.
\end{align}
$$

The fine-tuned models have been trained for 10 epochs on the synthetic queries created by the query generator. For smaller datasets, such as NFCorpus, ArguAna, and FiQA, we created 32 queries per passage, while for larger datasets we created fewer queries per passage. In particular, we created 26 queries per passage for CQADupStack and 16 for Amazon ESCI.

The following table contains the results of combining these scores on the 10 test datasets. 

|                                    	|BM25	|TAS-B	|TAS-B with L2 norm (arithmetic mean)	|TAS-B with L2 norm (harmonic mean)	|TAS-B with L2 norm (geometric mean)	|Fine-tuned	|Fine-tuned with L2 norm (arithmetic mean)	|Fine-tuned with L2 norm (harmonic mean)	|Fine-tuned with L2 norm (geometric mean)	|
|:---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|NFCorpus	|0.343	|0.319	|0.346	|0.35	|0.348	|0.301	|0.37	|0.365	|**0.367**	|
|Trec-Covid	|0.688	|0.481	|0.732	|0.731	|0.735	|0.577	|0.752	|0.788	|**0.79**	|
|ArguAna	|0.473	|0.427	|0.485	|0.482	|0.484	|0.492	|**0.527**	|0.511	|0.526	|
|FiQA	|0.254	|0.3	|0.289	|0.281	|0.282	|0.314	|**0.364**	|0.326	|0.35	|
|Scifact	|0.691	|0.643	|0.686	|0.691	|0.687	|0.623	|**0.728**	|0.722	|0.728	|
|DBPedia	|0.32	|0.384	|0.341	|**0.395**	|0.359	|0.342	|0.373	|0.392	|0.392	|
|Quora	|0.789	|0.835	|0.836	|0.847	|0.841	|0.855	|**0.874**	|0.87	|0.872	|
|Scidocs	|0.165	|0.149	|0.17	|0.17	|0.17	|0.154	|**0.184**	|0.181	|**0.184**	|
|CQADupStack	|0.325	|0.314	|0.343	|0.337	|0.34	|0.357	|0.367	|0.352	|**0.377**	|
|Amazon ESCI	|0.081	|0.071	|0.085	|0.088	|0.087	|0.074	|**0.091**	|0.09	|**0.091**	|
|**Average % change vs. BM25**	|N/A	|-3.52	|4.89	|6.7	|5.49	|-0.08	|14.14	|12.37	|**14.91**	|

Overall, a fine-tuned model with an arithmetic or geometric combination provides state-of-the-art results. 

We found that harmonic combination works best for the pretrained TAS-B model, while arithmetic and geometric combinations work best for the fine-tuned custom model. Note that for a given query, there could be documents that are only present in the dense results and not in the BM25 results. In such cases, we assume that the BM25 score for those documents is zero. Conversely, if there are documents that are only present in the BM25 results, we assume that the neural query score for those documents is zero.

## Section 4: Normalization and other combination methods

BM25 and neural scores use different scales, so there is no unique strategy for normalizing both of them. In this section, we empirically demonstrate the effects of normalization on nDCG@10 to build intuition for the most useful and robust strategy.

### 4.1. No normalization compared to L2 normalization

We compared the effects of applying min-max normalization against not applying any normalization at all, as shown in the following table.  

|     	|BM25	|TAS-B harmonic with norm	|TAS-B harmonic without norm	|Fine-tuned arithmetic with norm	|Fine-tuned arithmetic without norm	|
|:---	|---	|---	|---	|---	|---	|
|NFCorpus	|0.343	|0.35	|0.345	|**0.37**	|0.353	|
|Trec-Covid	|0.688	|0.731	|0.73	|**0.752**	|0.666	|
|ArguAna	|0.472	|0.482	|0.483	|**0.527**	|0.519	|
|FiQA	|0.254	|0.281	|0.274	|**0.364**	|0.326	|
|Scifact	|0.691	|0.691	|0.681	|**0.728**	|0.665	|
|DBPedia	|0.32	|**0.395**	|0.338	|0.373	|0.363	|
|Quora	|0.789	|0.847	|0.82	|**0.874**	|0.864	|
|Scidocs	|0.165	|0.17	|0.168	|**0.184**	|0.165	|
|CQADupStack	|0.325	|0.337	|0.333	|**0.367**	|0.331	|
|Amazon ESCI	|0.081	|0.088	|0.083	|**0.091**	|0.079	|
|**Average % change vs. BM25**	|N/A	|6.72	|3.17	|**14.16**	|5.66	|

We found that in all cases, normalizing the scores before combining them leads to better results, possibly because BM25 and dense models usually have scores that belong to different scales. Not normalizing the scores may lead to BM25 overwhelming dense models or vice versa during the combination phase. Both BM25 and dense models are impressive retrievers and have complementary strengths. Normalizing the scores calibrates the two retrievers and thus leads to better results.

### 4.2. Comparing normalization strategies

We investigated different normalization strategies. In addition to L2, we tried sklearn’s [minmax scaler](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.MinMaxScaler.html), which normalizes the scores as

{% raw %}
$$
\begin{align}
\tilde{b_i} = \frac{{b_i}-min(b)}{max(b) - min(b)}.
\end{align}
$$
{% endraw %}

The results are presented in the following table. 

|	|BM25	|TAS-B harmonic with min-max norm	|TAS-B harmonic with L2 norm	|Fine-tuned arithmetic with min-max norm	|Fine-tuned  arithmetic with L2 norm	|
|:---	|---	|---	|---	|---	|---	|
|NFCorpus	|0.343	|0.357	|0.35	|0.365	|**0.37**	|
|Trec-Covid	|0.688	|0.737	|0.731	|**0.727**	|**0.727**	|
|FiQA	|0.254	|0.32	|0.281	|0.359	|**0.364**	|
|ArguAna	|0.472	|0.476	|0.482	|**0.531**	|0.527	|
|Scifact	|0.691	|0.688	|0.691	|0.722	|**0.728**	|
|Scidocs	|0.165	|0.168	|0.17	|0.182	|**0.184**	|
|Quora	|0.789	|0.861	|0.847	|**0.877**	|0.874	|
|Amazon ESCI	|0.081	|0.087	|0.088	|**0.091**	|**0.091**	|
|**Average % change vs. BM25**	|N/A	|6.99	|5.01	|13.03	|**13.56**	|

For the pretrained harmonic combination model, on average, the min-max norm works better than L2. However, for the fine-tuned arithmetic combination model, we did not find a conclusive difference between the two normalization strategies.

### 4.3. Combining scores differently

We experimented with different score combination methods. One such method is linear combination, where scores are calculated as

$$
\begin{align}
{s_i} = \tilde{b_i} + f \cdot \tilde{n_i},
\end{align}
$$

where $$f$$ is a float that ranges from 0.1 to 1,024 in powers of 2 and $$b_i$$ ​and $$n_i$$ ​are the min-max normalized BM25 and neural scores, respectively. We found that for the fine-tuned models, f=1 works best. Note that this is identical to the arithmetic combination. For the pretrained models, we found that f=8 works better. For more information, see the [linear combination experiment results](#linear-combination-experiment-results). 

### 4.4. Other comparisons

We explored using [cosine similarity](https://pytorch.org/docs/stable/generated/torch.nn.CosineSimilarity.html) instead of dot product for the neural retriever, but it led to worse results. This is probably because TAS-B was trained using dot product similarity instead of cosine similarity. 

Among other neural models, we tried the [ANCE](https://huggingface.co/sentence-transformers/msmarco-roberta-base-ance-firstp) model, but it lead to substantially worse results than TAS-B. We did not benchmark the [MiniLM](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) or [MPNet](https://huggingface.co/sentence-transformers/all-mpnet-base-v2) models because both were tuned on the 1B sentence pair data and thus could not be evaluated in a zero-shot regime. Nevertheless, we evaluated them after fine-tuning on synthetic data using private test datasets and found the performance to be almost as good as TAS-B.

## Section 5: Strengths and limitations

There are two ways of incorporating transformers in search: as **cross-encoders** and **neural retrievers**.

**Cross-encoders** work in series with keyword search and can be thought of as rerankers. Once BM25 fetches the top $$N$$ results for a given query, a cross-encoder reranks these $$N$$ results given the query $$q$$. This approach generally produces better results than using neural retrievers alone. However, it is computationally expensive (high latency) because the transformer needs to compute $$N$$ different scores, one for each `(query, document)` pair. The cross-encoder is also limited by the result quality of the BM25 retrieval.

In contrast, **neural retrievers** have to perform only one computation that creates a vector for the query. The actual retrieval is accomplished by finding the top $$N$$ nearest neighbors of this query vector. This is a very fast operation that is implemented using [k-NN](https://opensearch.org/docs/latest/search-plugins/knn/index/). Note that neural retrievers do not rely on keyword results but rather are used in combination with keyword search. Indeed, neural retrievers combined with BM25 yield better results than cross-encoders, as shown by our experiments. It is also worth noting that cross-encoders work in the reranker paradigm and rely on first-stage retrieval. They greatly benefit from combining BM25 and dense retrievers, discussed earlier in this post, for their first-stage retrieval. 

In this blog post, we have included several experiments that can help build intuition about how and when to combine BM25 with neural retrievers. It is important to remember that because every dataset is different, there is a chance that the configurations used here are not optimal for your dataset. Nevertheless, we believe that there are some **global conclusions** that apply to most datasets:

1. Neural retrievers with BM25 work better than neural retrievers or BM25 alone.
2. Neural retrievers with BM25 deliver the same (or better) results as cross-encoders at a fraction of the cost and latency.
3. If a dataset contains a lot of keyword usage, BM25 works much better than neural retrievers. An example of such a dataset is one containing factory part numbers.
4. If a dataset contains a lot of natural language, neural retrievers work much better than BM25. An example is data from a community forum.
5. For datasets that contain both natural language and keywords, a combination of BM25 and neural retrievers works better. An example of such a dataset is one containing data for a clothing website that describes products using both natural language (product description) and numbers (product length, size, or weight).
6. The optimal combination method depends on the dataset. In general, we have found that harmonic mean performs best for pretrained models, while arithmetic mean and geometric mean perform best for fine-tuned models.
7. Most small transformer models, such as TAS-B, have a context length of 512 tokens (about 350 words), and they ignore all words after that limit. If a document is long and the first few hundred words are not representative of its content, it is useful to split the document into multiple sections. Note that the index size will increase accordingly because each section corresponds to its own vector. 

## Appendix

In this appendix, we provide further details of the test datasets used for benchmarking. Our primary data sources were the BEIR challenge and the Amazon ESCI datasets.

### The BEIR dataset

The BEIR challenge dataset was introduced in [a 2021 paper presented at NeurIPS](https://arxiv.org/abs/2104.08663). It consists of 18 test datasets that cover several domains, from personal advice on Yahoo Answers to Stack Exchange questions about quantum physics. The datasets also come in different evaluation formats, for example, fact checking, question answering, and news retrieval. We used nine of the 19 datasets from the BEIR challenge. We did not use the MS Marco and NQ datasets because the query generator was trained on this data, so it is not zero shot. We did not benchmark on datasets that are not publicly available without registration (BioASQ, Signal-1M, Trec-News, and Robust04). In the future, we plan to benchmark large (more than 5M documents each) datasets, such as fever, climate-fever, and HotpotQA.

### The Amazon ESCI dataset

[Amazon ESCI](https://github.com/amazon-science/esci-data) is a shopping query dataset from Amazon. It contains difficult search queries and was released with the goal of fostering research in the area of semantic matching of queries and products. We restricted the data to queries and documents in English. We focused on the task of query-product ranking: given a user-specified query and a list of matched products, the goal is to rank the products by relevance. We used `Task 1 (Query-Product Ranking)` with product_locale = US and set the following relevancy ratings: E = 100, S = 10, C = 1, and I = 0. Note that the relevancy ratings in the [Amazon ESCI paper by Reddy et al.](https://arxiv.org/abs/2206.06588) are E = 1, S = 0.1, C = 0.01, and I = 0. Consequently, we cannot directly compare our nDCG scores with the ones mentioned in the Amazon paper. However, the percentage improvement between different models (such as the one shown in the preceding tables) is still a meaningful comparison.

### Sample queries and passages

The following table provides sample queries and passages for each dataset.

|Dataset	|Sample query	|Sample passage	|
|:---	|:---	|:---	|
|DBPedia	|Szechwan dish food cuisine	|`Mapo doufu (or \"mapo tofu\") is a popular Chinese dish from China's Sichuan province. It consists of tofu set in a spicy chili- and bean-based sauce, typically a thin, oily, and ....`	|
|FiQA	|“Business day” and “due date” for bills	|`I don't believe Saturday is a business day either. When I deposit a check at a bank's drive-in after 4pm Friday, the receipt tells me it will credit as if I deposited on Monday. If a business' computer doesn't adjust their billing to have a weekday due date ...	`|
|CQADupStack	|Why does Simplify[b-a] give -a+b and not b-a?	|```` `Simplify[b - a]` results in `-a + b`. I prefer `b - a`, which is a bit simpler (3 symbols instead of 4). Can I make _Mathematica_ to think the same way? I believe one needs ...````	|
|NFCorpus	|How Doctors Responded to Being Named a Leading Killer	|`By the end of graduate medical training, novice internists (collectively known as the housestaff) were initiated into the experience of either having done something to a patient which had a deleterious consequence or else having witnessed colleagues do the same. When these events occurred ...`	|
|Scifact	|β-sheet opening occurs during pleurotolysin pore formation.	|`Membrane attack complex/perforin-like (MACPF) proteins comprise the largest superfamily of pore-forming proteins, playing crucial roles in immunity and pathogenesis. Soluble monomers assemble into large transmembrane ...`	|
|Trec-Covid	|what is the origin of COVID-19	|`Although primary genomic analysis has revealed that severe acute respiratory syndrome coronavirus (SARS CoV) is a new type of coronavirus, the different protein trees published in previous reports have provided ....`	|
|ArguAna	|Poaching is becoming more advanced A stronger, militarised approach is needed as poaching is becoming ...	|`Tougher protection of Africa\u2019s nature reserves will only result in more bloodshed. Every time the military upgrade their weaponry, tactics and logistic, the poachers improve their own methods to counter ...`	|
|Quora	|Is heaven a really nice place?	|`What do you think heaven will be like?`	|
|Scidocs	|CFD Analysis of Convective Heat Transfer Coefficient on External Surfaces of Buildings	|`This paper provides an overview of the application of CFD in building performance simulation for the outdoor environment, focused on four topics...`	|
|Amazon ESCI	|#1 black natural hair dye without ammonia or peroxide	|`6N - Sagebrush BrownNaturcolor Haircolor Hair Dye - Sagebrush Brown, 4 Fl Oz (6N)contains no ammonia, resorcinol or parabens\navailable in 31 colors, each color ... `	|

### Dataset statistics

The following table provides statistics about passages and queries for each dataset.

|Dataset	|Average query length	|Median query Length	|Average passage length	|Median passage Length	|Number of passages	|Number of test queries	|
|:---	|---	|---	|---	|---	|---	|---	|
|DBPedia	|5.54	|5	|46.89	|47	|4635922	|400	|
|---	|---	|---	|---	|---	|---	|---	|
|Quora	|9.531	|9	|11.46	|10	|522931	|10000	|
|FiQA	|10.94	|10	|132.9	|90	|57638	|648	|
|CQADupStack	|8.53	|8	|126.59	|68	|457199	|13145	|
|NFCorpus	|3.29	|2	|22.098	|224	|3633	|323	|
|Scifact	|12.51	|12	|201.81	|192	|300	|5183	|
|Trec-Covid	|10.6	|10	|148.64	|155	|171332	|50	|
|ArguAna	|193.55	|174	|164.19	|147	|8674	|1406	|
|Scidocs	|9.44	|9	|167.24	|151	|25657	|1000	|
|Amazon ESCI	|3.89	|4	|179.87	|137	|482105	|8956	|

### Linear combination experiment results

The following table contains the results of the experiments for different linear combinations $$s_i​=\tilde{b_i}​+f\cdot \tilde{n_i}$$​.

|    	|BM25	|TASB with factors 0.1	|TASB with factor 1 (arithmetic mean)	|TASB with factors 2	|TASB with factors 8	|TASB with factors 128	|TASB with factors 1024	|Fine-tuned with factors 0.1	|Fine-tuned with factor 1 (arithmetic mean)	|Fine-tuned with factors 2	|Fine-tuned with factors 8	|Fine-tuned with factors 128	|Fine-tuned with factors 1024	|
|:---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|NFCorpus	|0.343	|0.329	|0.346	|0.334	|0.343	|0.335	|0.324	|0.336	|0.369	|0.34	|0.322	|0.304	|0.301	|
|FiQA	|0.254	|0.273	|0.289	|0.3	|0.327	|0.303	|0.3	|0.311	|0.364	|0.352	|0.329	|0.314	|0.314	|
|ArguAna	|0.472	|0.476	|0.485	|0.49	|0.485	|0.437	|0.428	|0.497	|0.527	|0.516	|0.494	|0.48	|0.479	|
|Amazon ESCI	|0.081	|0.082	|0.085	|0.087	|0.087	|0.075	|0.071	|0.085	|0.091	|0.089	|0.0819	|0.075	|0.074	|
|Scifact	|0.691	|0.681	|0.686	|0.693	|0.7	|0.672	|0.65	|0.706	|0.728	|0.728	|0.671	|0.628	|0.623	|
|Scidocs	|0.165	|0.168	|0.17	|0.172	|0.176	|0.154	|0.15	|0.175	|0.184	|0.179	|0.163	|0.155	|0.154	|
|trec-covid	|0.688	|0.729	|0.732	|0.74	|0.718	|0.514	|0.486	|0.744	|0.752	|0.665	|0.542	|0.501	|0.503	|
|Quora	|0.789	|0.816	|0.836	|0.849	|0.867	|0.843	|0.836	|0.829	|0.874	|0.881	|0.874	|0.857	|0.855	|
|**Average peformance**	|N/A	|1.9	|4.63	|5.8	|7.64	|-3.22	|-5.94	|6.51	|13.98	|9.88	|1.83	|-3.4	|-3.85	|

## References

1. Hofstätter, Sebastian, et al. “Efficiently Teaching an Effective Dense Retriever with Balanced Topic Aware Sampling.” ArXiv.org, 26 May 2021, [https://arxiv.org/abs/2104.06967](https://arxiv.org/abs/2104.06967). 
2. Thakur, Nandan, et al. “BEIR: A Heterogenous Benchmark for Zero-Shot Evaluation of Information Retrieval Models.” ArXiv.org, 21 Oct. 2021, [https://arxiv.org/abs/2104.08663](https://arxiv.org/abs/2104.08663). 
3. Reddy, Chandan K., et al. “Shopping Queries Dataset: A Large-Scale ESCI Benchmark for Improving Product Search.” ArXiv.org, 14 June 2022, [https://arxiv.org/abs/2206.06588](https://arxiv.org/abs/2206.06588). 
4. Alberti, Chris, et al. “Synthetic QA Corpora Generation with Roundtrip Consistency.” ACL Anthology, [https://aclanthology.org/P19-1620/](https://aclanthology.org/P19-1620/). 
5. Liang, Davis, et al. “Embedding-Based Zero-Shot Retrieval through Query Generation.” ArXiv.org, 22 Sept. 2020, [https://arxiv.org/abs/2009.10270](https://arxiv.org/abs/2009.10270). 
6. Bajaj, Payal, et al. “MS Marco: A Human Generated Machine Reading Comprehension Dataset.” ArXiv.org, 31 Oct. 2018, [https://arxiv.org/abs/1611.09268](https://arxiv.org/abs/1611.09268). 
7. Karpukhin, Vladimir, et al. “Dense Passage Retrieval for Open-Domain Question Answering - Arxiv.” ArXiv.org, 30 Sept. 2020, [https://arxiv.org/pdf/2004.04906.pdf](https://arxiv.org/pdf/2004.04906.pdf). 