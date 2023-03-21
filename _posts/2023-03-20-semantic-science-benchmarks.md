---
layout: post
title:  "The ABCs of semantic search in OpenSearch: Architectures, benchmarks, and combination strategies"
authors:
- mshyani
- nmishra
- dhrubo
- ylwu
- seanzheng
- kolchfa
date: 2023-03-20
categories:
 - technical-post
meta_keywords: 
meta_description: 

excerpt: In an earlier blog post, we described different ways of building a semantic search engine in OpenSearch. In this post, we'll dive further into the science behind it. We'll discuss the benefits of combining keyword-based search with neural search, the choice of architectures and models, and benchmarking tests and results. First, we'll provide an overview of our proposed solutions and a summary of the main results. Next, we'll outline the steps for creating a solution and fine-tuning it for your own document corpus. Finally, we'll discuss the effects of different combination strategies and normalization protocols on search relevance. 
---

<script type="text/javascript"
  src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML">
</script>

In an earlier [blog post](https://opensearch.org/blog/semantic-search-solutions/), we described different ways of building a semantic search engine in OpenSearch. In this post, we'll dive further into the science behind it. We'll discuss the benefits of combining keyword-based search with neural search, the choice of architectures and models, and benchmarking tests and results:
- In [Section 1](#section-1-overview), we provide an overview of our proposed solutions and a summary of the main results. 
- In [Section 2](#section-2-obtaining-a-fine-tuned-transformer), we outline the steps needed to create a solution and fine-tune it for your own document corpus. 
- In [Section 3](#section-3-combination-methods) and [Section 4](#section-4-normalization-and-other-combination-methods), we discuss the effects of different combination strategies and normalization protocols on search relevance. 
- In [Section 5](#section-5-strengths-and-limitations), we present the conclusions of our experiments.
- In the [Appendix](#appendix-details-of-test-datasets), we provide more information about the test datasets used for benchmarking.

## Section 1: Overview 

A search engine should work well for both **keyword** and **natural language** searches. 

BM25 excels at providing relevant search results when a query contains **keywords**. Keyword-based searches are extremely fast and robust but have natural drawbacks because keywords do not encapsulate natural language. 

Large neural networks, such as transformers, perform better when a query requires **natural language** understanding (for example, using synonyms). However, even the largest transformer models show performance degradation on data that does not belong to their train-data distribution. 

Both search methods have complimentary strengths, so it is natural to investigate a solution that combines them. In addition, most document corpora contain documents that require keyword matching as well as semantic understanding. For example, an e-commerce shoe dataset should be searchable using highly specific keywords, such as `“12 US Men”`, and natural language phrases, such as `“fashionable comfortable running shoes”`. 

### A metric and test datasets for benchmarking

To benchmark solutions, you have to select a **metric** for measuring search relevance and the **test datasets**. 

We chose [nDCG@10](https://en.wikipedia.org/wiki/Discounted_cumulative_gain), a widely used information retrieval **metric**, for measuring search relevance. 

For the **test datasets**, we selected 10 different datasets covering a wide variety of domains, query lengths, document lengths, and corpus sizes. Each test dataset contains a list of queries, documents, and relevancy judgements. The relevancy judgements are annotated by human experts (see the [Appendix](#appendix-details-of-test-datasets) for more details) and are usually represented by binary labels (`1` for relevant and `0` for irrelevant). Nine of these datasets belong to the[BEIR](https://arxiv.org/abs/2104.08663) challenge---a popular collection of test datasets used to benchmark search engines. The tenth dataset is the [Amazon ESCI](https://github.com/amazon-science/esci-data) challenge dataset for product search. These 10 datasets cover multiple domains, including e-commerce, Covid statistics, personal finance, and quantum physics. 

### The zero-shot regime

Because most search systems are deployed on datasets outside of their training data, we needed to benchmark our solutions on data that they have never encountered before, that is, in *zero-shot regime*. Our models were trained exclusively on data distributions that do not overlap with the data distributions of the 10 test datasets. Note that this is different from doing a train-dev-test split while training models. There, the model is trained on the train split and evaluated on the held-out dev and test splits. In this experiment, the test dataset comes from a different distribution than the training set.

### Results summary

In an earlier [blog post](https://opensearch.org/blog/semantic-search-solutions/), we proposed two semantic search solutions: a pretrained transformer + BM25 and a fine-tuned transformer + BM25. In the following sections, we discuss the details of combining transformers with BM25. The following table summarizes the benchmarking results. 

<style>
table{
    border:2px solid #e6e6e6;
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
| |BM25 | Pretrained transformer<br>+ BM25 (harmonic) | Fine-tuned transformer<br>+ BM25 (arithmetic) |
| :--- | ---------: | ---------: | ---------: |
|nfcorpus | 0.343 | 0.346 | **0.369** |
|trec-covid | 0.688 | 0.731 | **0.752**	|
|arguana	|0.472	|0.482	| **0.527**	|
|fiqa	|0.254	|0.281	|**0.364**	|
|scifact	|0.691	|0.673	|**0.728**	|
|dbpedia	|0.313	|**0.395**	|0.373	|
|quora	|0.789	|0.847	|**0.874**	|
|scidocs	|0.165	|0.173	|**0.184**	|
|cqadupstack	|0.325	|0.333	|**0.3673**	|
|Amazon ESCI	|0.081	|0.088	|**0.091**	|
|Average performance <br>against BM25	|N/A	|6.66%	|**14.39%**	|

Table: nDCG@10 for 10 test datasets for the pre-trained and fine-tuned transformer (TAS-B) when combined with BM25. For the definition of the combination strategies (harmonic mean) and (arithmetic mean), see Section 3.

In [Section 2](#section-2-obtaining-a-fine-tuned-transformer) we discuss the details of obtaining a fine-tuned transformer. If you’re interested in the result details, skip to [Sections 3](#section-3-combination-methods) and [Section 4](#section-4-normalization-and-other-combination-methods).

## Section 2: Obtaining a fine-tuned transformer

To understand the fine-tuned solution, we first need to explore the pretrained solution along with its strengths and limitations. Our pretrained solution consists of a state-of-the-art neural retriever model combined with BM25. We experimentally compared different ways of combining the neural retriever model with BM25 to produce the best results.

A neural retriever model first creates a vector index of all the documents in the corpus and then at run time conducts a search using a k-NN query. The model has been trained to map relevant documents close to each other and irrelevant documents farther apart by reading the labeled `(query, passage)` pairs. Recall that in zero-shot regime training data is different from the test datasets. [TAS-B](https://huggingface.co/sentence-transformers/msmarco-distilbert-base-tas-b)  is a popular state-of-the-art model that is trained on the [MS Marco](https://huggingface.co/datasets/ms_marco) dataset; it has been shown to have non-trivial zero-shot performance [BEIR]. There are other models, such as [MPNet](https://huggingface.co/docs/transformers/model_doc/mpnet), that show equivalent or better performance, but we do not recommend them over TAS-B. These models are trained on a lot of data, which includes some of the test datasets, therefore it is difficult to benchmark them in terms of zero-shot performance. 

Note that we work in the zero-shot regime because we often do not have access to supervised data from the domain of choice. To be precise, we have passages from the domain of choice but do not have access to queries or `(query, relevant passage)` pairs. If such data existed, the ideal solution would have been to fine-tune a model such as TAS-B on it. The fine-tuned TAS-B model would most certainly perform better than pure TAS-B [cite]. 

However, in the absence of domain-specific data, we can leverage the power of large language models to create artificial queries given a passage. In the rest of the section we discuss generating synthetic queries and using them to obtain a model fine-tuned to your corpus. As shown in the preceding table, fine-tuned models perform better than pretrained models. 

Creating a fine-tuned model consists of three steps: 

1. [Obtain an LLM for query generation](#21-obtaining-a-query-generator-model).
2. [Use the query generator model to create synthetic queries given a corpus](#22-create-synthetic-corpus).
3. [Train a small model (such as TAS-B) on the synthetic corpus](#23-fine-tune-tas-b-on-the-synthetic-corpus).

The [Demo Notebook for Sentence Transformer Model Training, Saving and Uploading to OpenSearch](https://opensearch-project.github.io/opensearch-py-ml/examples/demo_transformer_model_train_save_upload_to_openSearch.html) automatically executes all of the above steps for the corpus of your choice. 

**_Over time, we plan to release newer, more powerful LLMs for query generation, which will produce better synthetic queries and lead to an improved downstream search performance._** 


### 2.1. Obtaining a query generator model

There are many publicly available LLMs that can be used for free-form text generation. However, there are very few models that are trained to generate queries. To the best of our knowledge, there is no public GPT-style (that is, decoder only) LLM for query generation. 

We fine-tuned and released the [1.5B GPT2-XL](https://huggingface.co/gpt2-xl?text=My+name+is+Merve+and+my+favorite) model for synthetic query generation. This model is automatically downloaded by the demo notebook. The model is fine-tuned using the MS Marco and [Natural Questions](https://huggingface.co/datasets/natural_questions) (NQ) datasets. These datasets are famous, high quality datasets in the field of information retrieval. They consist of human-generated queries and corresponding passages or documents that answer each query. For every `(query, passage)` pair we created the following training sample:

`<startoftext> passage <QRY> query <endoftext>`

In the preceding expression, the special tokens enclosed in angle brackets denote the start of text, start of query and end of text, respectively. The loss function is the [autoregressive](https://s3-us-west-2.amazonaws.com/openai-assets/research-covers/language-unsupervised/language_understanding_paper.pdf) [cross-entropy](https://pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html) loss, that is, the model tries to predict the next word given previous words. We used the [AdamW](https://pytorch.org/docs/stable/generated/torch.optim.AdamW.html) optimizer with a learning rate of 2e-5 and a [linear schedule](https://huggingface.co/docs/transformers/main_classes/optimizer_schedules#transformers.get_linear_schedule_with_warmup) with 5,500 warmup steps. Training was done on 8 Tesla V100 GPUs with a batch size of 24 for 4 epochs.

We only used those samples from NQ that have long answers and do not contain tables, producing approximately 110K `(passage, query)` pairs with a median passage length of 104 words. For MS Marco, we used the train and validation splits to obtain  559K `(passage, query)` pairs with a median passage length of 52 words. 

### 2.2. Creating a synthetic corpus

After downloading the model, the demo notebook uses it to generate synthetic data. 

We recommend running the notebook on a GPU-powered machine; we used a p3.x16large EC2 instance that has eight 16GB GPUs. 

The total time required to generate 16 queries per document for 1M documents is about 48 hours. The generation time scales linearly with the number of documents and can be improved by using larger batch sizes.

During the generation phase we sampled tokens with a default temperature of 1, top-p value of 0.95, and top-k value of 50. For more information about these hyperparameters and how they affect text generation, see a [Huggingface blog](https://huggingface.co/blog/how-to-generate). Intuitively, higher temperature, top-k, or top-p values yield more diverse samples. We specified the maximum length of the generated query as 25 tokens. Additionally, we set the `repetition_penalty` to 1.2, thus incentivizing the model to create queries with no repeating tokens. Once the queries are generated, the notebook automatically applies a query filtering model to remove toxic queries using the publicly available [Detoxify](https://pypi.org/project/detoxify/) package. 

### 2.3. Fine-tuning TAS-B on the synthetic corpus

The synthetic corpus created in the previous step is used to fine-tune a pre-trained small language model for search. The demo notebook downloads the pre-trained TAS-B model and executes the remaining steps automatically.

The model is trained to maximize the dot product between relevant queries and passages while at the same time minimizing the dot product between queries and irrelevant passages. This is known in the literature as *contrastive learning.* We implement contrastive learning using in-batch negatives and a symmetric loss. Specifically, for a given batch of size B, the loss is defined as

<style>
    .center {
        display: block;
        margin-left: auto;
        margin-right: auto;
        width: 50%;
    }
</style>

<span class="center">
$$Loss = C(q​, p) + C(p​, q)$$,
</span>

<span class="center">
$$C(q​, p) = −\sum_{i=1}^{i=B}​log \left(\frac{exp(q_i​,\ p_i​)}{\sum_{j=1}^{j=B}​exp(q_i​,\ p_j​)}​\right)$$,
</span>

where $$p$$ is a passage and $$q$$ is a query.

The model is trained using the AdamW optimizer for 10 epochs with a learning rate of 2e-5 and a scheduler that uses a linear schedule with 10K warmup steps. Larger batch sizes lead to more in-batch negatives, which in turn lead to better models. On the other hand, larger batch sizes also may cause GPU out of memory issues and should be selected based on GPU memory. We also found that increasing the number of synthetic queries per passage produces better fine-tuned models. However, having a large number of synthetic queries comes with the cost of longer generation and training times, therefore diminishing the returns. On average, we created 24 queries per document in our experiments. 

## Section 3: Combination methods

We combined transformers with BM25 using three main methods: arithmetic mean, geometric mean and harmonic mean. For each of these combination methods we retrieved the top 9,999 documents for BM25 and the top 250 documents for [neural query](https://opensearch.org/docs/latest/search-plugins/neural-search/). Each set of scores was normalized by the L2 norm. To be precise, given a list of scores $$b=[b_1​, b_2​, …]$$, we normalized them using the following formula:

<span class="center">
$$\tilde{b_i}​=\frac{b_i}{​{\lVert b \rVert}}$$.
</span>

Given a list of scores $$b$$ for BM25 and $$n$$ for neural search, we can combine them into the combination score $$s$$ as follows:

<span class="center">
$$s_i​=\left\{
\begin{array}{ll}
      \frac{\tilde{b_i}+\tilde{n_i}}{2}, & arithmetic\ mean \\
      \sqrt{\tilde{b_i}\tilde{n_i}}, & geometric\ mean \\
      \frac{2\tilde{b_i}\tilde{n_i}}{\tilde{b_i}+\tilde{n_i}}, & harmonic\ mean. \\
\end{array} 
\right.$$
</span>

The fine-tuned models have been trained for 10 epochs on the synthetic queries created by the query generator. For smaller datasets, such as nfcorpus, arguana and fiqa, we created 32 queries per passage, while for larger datasets we created fewer queries per passage. In particular, we created 26 queries per passage for cqadupstack and 16 for Amazon ESCI.

The following table contains the results for combining these scores on the 10 test datasets. 


|	|BM25	|TAS-B	|TAS-B <br> with <br>L2 norm <br>(arithmetic mean)	|TAS-B <br>with <br>L2 norm <br>(harmonic mean)	|TAS-B <br>with <br>L2 norm <br>(geometric mean)	|Custom	|Custom <br>with <br>L2 norm <br>(arithmetic mean)	|Custom <br>with <br>L2 norm <br>(harmonic mean)	|Custom<br> with <br>L2 norm <br>(geometric mean)	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|nfcorpus	|0.34281	|0.31886	|0.34607	|0.35046	|0.34845	|0.3014	|0.36919	|0.36458	|0.36727	|
|trec-covid	|0.68803	|0.48115	|0.73248	|0.73094	|0.73533	|0.57726	|0.75211	|0.78825	|0.79013	|
|arguana	|0.47163	|0.42704	|0.48523	|0.48167	|0.4838	|0.492	|0.52722	|0.51076	|0.52572	|
|fiqa	|0.25364	|0.30024	|0.28911	|0.2812	|0.28243	|0.31413	|0.36422	|0.32627	|0.34961	|
|scifact	|0.69064	|0.64276	|0.68598	|0.69132	|0.68722	|0.62275	|0.72845	|0.72227	|0.72749	|
|dbpedia	|0.32016	|0.38423	|0.34081	|0.39482	|0.3586	|0.34194	|0.37337	|0.39159	|0.39235	|
|quora	|0.80771	|0.83516	|0.83587	|0.84714	|0.84105	|0.85524	|0.87396	|0.86943	|0.8719	|
|scidocs	|0.16468	|0.14859	|0.16956	|0.16945	|0.16969	|0.15415	|0.18382	|0.1805	|0.18351	|
|cqadupstack	|0.3253	|0.3144	|0.3434	|0.3374	|0.34	|0.3566	|0.3673	|0.3518	|0.3766	|
|Amazon ESCI	|0.08111	|0.07061	|0.08525	|0.08761	|0.08662	|0.07418	|0.09082	|0.09033	|0.09079	|
|Average performance against BM25 (in %)	|n/a	|-3.77257	|4.71726	|6.43925	|5.24445	|-0.24703	|13.91945	|12.15005	|14.62501	|



We found that harmonic combination works best for the pretrained TAS-B model, while arithmetic combination works better for the fine-tuned custom model.  Note that for a given query there could be documents that are only present in the dense results and not the BM25 results. In such cases, we assume the BM25 score for those documents is zero. Conversely, if there are documents that are only present in the BM25 results, we assume the neural query score for those documents is zero. 

## Section 4: Normalization and other combination methods

BM25 and neural scores use different scales, so there is no unique strategy to normalize both of them. In this section, we document the effects of normalization on nDCG@10 empirically to build intuition for the most useful and robust strategy. 

### 4.1. No normalization compared with L2 normalization

We compared the effects of having min-max normalization against not applying any normalization at all, as shown in the following table. 

|	|BM25	|TASB Harmonic with norm	|TASB Harmonic without norm	|Custom Arithmetic with norm	|Custom Arithmetic without norm	|
|---	|---	|---	|---	|---	|---	|
|nfcorpus	|0.34281	|0.35046	|0.34506	|0.36919	|0.3531	|
|trec-covid	|0.68803	|0.73094	|0.72986	|0.752	|0.66565	|
|arguana	|0.47163	|0.48167	|0.48302	|0.527	|0.5188	|
|fiqa	|0.25364	|0.2812	|0.27361	|0.364	|0.32633	|
|scifact	|0.69064	|0.69132	|0.68145	|0.728	|0.66509	|
|dbpedia	|0.32016	|0.39482	|0.33772	|0.373	|0.36273	|
|quora	|0.80771	|0.84714	|0.82	|0.874	|0.86404	|
|scidocs	|0.16468	|0.16956	|0.16768	|0.184	|0.16529	|
|cqadupstack	|0.3253	|0.3374	|0.3328	|0.367	|0.3312	|
|Amazon ESCI	|0.08111	|0.08761	|0.08343	|0.091	|0.07897	|
|Average performance against BM25	|n/a	|6.44593	|2.96877	|13.91084	|5.45259	|



### 4.2. Comparing normalization strategies

We investigated different normalization strategies. In addition to L2, we tried sklearn’s [minmax scaler](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.MinMaxScaler.html), which normalizes the scores as 

{% raw %}
<span class="center">
$$\tilde{b_i} = \frac{{b_i}-min(b)}{max(b) - min(b)}$$.
</span>
{% endraw %}

The results are summarized in the following table.

|	|nfcorpus	|trec-covid	|fiqa	|arguana	|Amazon ESCI	|Average peformance	|
|---	|---	|---	|---	|---	|---	|---	|
|BM25	|0.34281	|0.68803	|0.25364	|0.47163	|0.08111	|n/a	|
|TASB Harmonic with min-max norm	|0.35749	|0.73725	|0.31975	|0.47618	|0.08724	|9.20458	|
|TASB Harmonic with L2 norm	|0.35046	|0.73094	|0.2812	|0.48167	|0.08761	|5.89532	|
|Custom Arithmetic with min-max norm	|0.36523	|0.7271	|0.35882	|0.53098	|0.09071	|15.62132	|
|Custom Arithmetic with L2 norm	|0.36919	|0.7268	|0.36422	|0.52722	|0.09082	|16.13711	|

### 4.3. Combining scores differently

We experimented with different techniques of combining the scores. One such method is linear combination, where scores are calculated as

<span class="center">
$${s_i} = \tilde{b_i} + f \cdot \tilde{n_i}$$,
</span>

where $$f$$ is a float that ranges from 0.1 to 1,024 in powers of two and $$b_i$$ ​and $$n_i$$ ​are the min-max normalized BM25 and neural scores, respectively. 

The following table contains the results of these experiments.

|	|nfcorpus	|Fiqa	|arguana	|Amazon ESCI	|Average peformance	|
|---	|---	|---	|---	|---	|---	|
|BM25	|0.34281	|0.25364	|0.47163	|0.08111	|n/a	|
|TASB with factors 0.1	|0.3294	|0.27266	|0.47592	|0.08239	|1.51869	|
|TASB with factor 1 (arithmetic mean)	|0.34607	|0.28911	|0.48523	|0.08525	|5.73079	|
|TASB with factors 2	|0.33387	|0.30029	|0.48919	|0.08722	|6.76015	|
|TASB with factors 8	|0.34314	|0.32659	|0.48474	|0.08727	|9.80796	|
|TASB with factors 128	|0.33454	|0.30346	|0.4371	|0.07503	|0.60305	|
|TASB with factors 1024	|0.32371	|0.30046	|0.42763	|0.07124	|-2.15259	|
|custom model with factors 0.1	|0.33607	|0.31094	|0.49702	|0.08501	|7.70418	|
|custom model with factor 1 (arithmetic mean)	|0.369	|0.36422	|0.527	|0.09082	|18.73714	|
|custom model  with factors 2	|0.34032	|0.3523	|0.51615	|0.08906	|14.3531	|
|custom model  with factors 8	|0.32186	|0.32856	|0.49369	|0.08194	|7.28184	|
|custom model  with factors 128	|0.30351	|0.31436	|0.47946	|0.07486	|1.6075	|
|custom model  with factors 1024	|0.30134	|0.31438	|0.47892	|0.07423	|1.22841	|

### 4.4. Other comparisons

We explored using [cosine similarity](https://pytorch.org/docs/stable/generated/torch.nn.CosineSimilarity.html) instead of dot product for the neural retriever, however it led to worse results. 

Among other neural models, we tried the [ANCE](https://huggingface.co/sentence-transformers/msmarco-roberta-base-ance-firstp) model but it lead to substantially poorer results than TAS-B. We did not benchmark the [MiniLM](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) or [mpnet](https://huggingface.co/sentence-transformers/all-mpnet-base-v2) model because both were tuned on the 1B sentence pair data and thus could not be evaluated zero shot. Nevertheless, we evaluated them after fine-tuning on synthetic data using private test datasets and found the performance to be almost as good as TAS-B. 


## Section 5: Strengths and limitations

There are two ways of incorporating transformers in search: as **cross-encoders** and **neural retrievers**. 

**Cross-encoders** work in series with keyword search and can be thought of as rerankers. Once BM25 fetches the top $$N$$ results for a given query, a cross-encoder reranks these $$N$$ results given the query $$q$$. This approach generally produces better results than using neural retrievers. However, it is computationally expensive (high-latency), because the transformer needs to compute $$N$$ different scores, one for each `(query, document)` pair. The cross-encoder is also limited by the result quality of the BM25 retrieval. 

In contrast, **neural retrievers** just have to make one computation: create a vector for the query. The actual retrieval is accomplished by finding the top $$N$$ nearest neighbors of this query vector. This is a very fast operation that is implemented using [k-NN](https://opensearch.org/docs/latest/search-plugins/knn/index/). Note that neural retrievers do not rely on keyword results but rather are used in combination with keyword search. Indeed, neural retrievers combined with BM25 yield better results than cross-encoders. 

In this blog, we have included several experiments that can help build intuition about how and when to combine BM25 with neural retrievers. It is important to remember that because every dataset is different, so there is a chance that the configurations used here are not optimal for your dataset. Nevertheless, we believe that there are some **global conclusions** that apply to most datasets: 

1. Neural retrievers with BM25 work better than neural retrievers or BM25 alone.
2. Neural retrievers with BM25 deliver the same (or better) results as cross-encoders at a fraction of the cost and latency.
3. If a dataset is heavy on keyword usage, BM25 works much better than neural retrievers. An example of such dataset is factory part numbers.
4. If a dataset is heavy on natural language, neural retrievers work much better than BM25. An example of such dataset is a community forum.
5. For datasets that contain both natural language and keywords, a combination of BM25 and neural retrievers works better. An example of such dataset is a clothing website that describes the product in natural language (product description) and numbers (product length, size, or weight).
6. The optimal combination method depends on the dataset, however in general we have found harmonic mean to perform best for pretrained models and arithmetic mean to perform best for fine-tuned models.



## Appendix: Details of test datasets

In this appendix, we provide further details on the test datasets used for benchmarking. Our primary data sources were the BEIR challenge and the Amazon ESCI datasets. 


### The BEIR dataset

The BEIR challenge dataset was introduced in [a 2021 paper presented at NeurIPS](https://arxiv.org/abs/2104.08663)[.](https://arxiv.org/abs/2104.08663) It consists of 18 test datasets that cover several domains, from personal advice on Yahoo Answers to Stack Exchange questions about quantum physics. The datasets also come in different evaluation formats, for example, fact checking, question answering, and news retrieval. We used nine of the 19 datasets from the BEIR challenge. We did not use the MS Marco and NQ datasets because the query generator was trained on this data and thus it is not zero-shot. We did not benchmark on datasets that are not publicly available without registering (BioASQ, Signal-1M, Trec-News and Robust04). In the future, we plan to benchmark large (more than 5M documents each) datasets, such as fever, climate-fever and HotpotQA.

### The Amazon ESCI dataset

The [Amazon ESCI](https://github.com/amazon-science/esci-data) is a shopping query dataset from Amazon. It contains difficult search queries and was released with the goal of fostering research in the area of semantic matching of queries and products. We restricted the data to queries and documents in English. We focused on the task of query-product ranking: given a user-specified query and a list of matched products, the goal is to rank the products by relevance. We used `Task 1 (Query-Product Ranking)` with product_locale = US and set the following relevancy ratings: E = 100, S = 10, C = 1, and I = 0. Note that the relevancy ratings in the [Amazon ESCI paper](https://arxiv.org/abs/2206.06588) are E = 1, S = 0.1, C = 0.01, and I = 0. Consequently, you cannot compare our nDCG scores with the ones mentioned in the Amazon paper directly. However, the percent improvement between different models (such as the one shown in the preceding tables) is still a meaningful comparison.


### Sample queries and passages

The following table provides sample queries and passages for each dataset.

|Dataset	|Sample query	|Sample passage	|
|---	|---	|---	|
|DBPedia	|Szechwan dish food cuisine	|Mapo doufu (or \"mapo tofu\") is a popular Chinese dish from China's Sichuan province. It consists of tofu set in a spicy chili- and bean-based sauce, typically a thin, oily, and ....	|
|FiQA	|“Business day” and “due date” for bills	|I don't believe Saturday is a business day either. When I deposit a check at a bank's drive-in after 4pm Friday, the receipt tells me it will credit as if I deposited on Monday. If a business' computer doesn't adjust their billing to have a weekday due date ...	|
|CQADupStack	|Why does Simplify[b-a] give -a+b and not b-a?	|`Simplify[b - a]` results in `-a + b`. I prefer `b - a`, which is a bit simpler (3 symbols instead of 4). Can I make _Mathematica_ to think the same way? I believe one needs ...	|
|Nfcorpus	|How Doctors Responded to Being Named a Leading Killer	|By the end of graduate medical training, novice internists (collectively known as the housestaff) were initiated into the experience of either having done something to a patient which had a deleterious consequence or else having witnessed colleagues do the same. When these events occurred ...	|
|Scifact	|β-sheet opening occurs during pleurotolysin pore formation.	|Membrane attack complex/perforin-like (MACPF) proteins comprise the largest superfamily of pore-forming proteins, playing crucial roles in immunity and pathogenesis. Soluble monomers assemble into large transmembrane ...	|
|Trec-Covid	|what is the origin of COVID-19	|Although primary genomic analysis has revealed that severe acute respiratory syndrome coronavirus (SARS CoV) is a new type of coronavirus, the different protein trees published in previous reports have provided ....	|
|ArguAna	|Poaching is becoming more advanced A stronger, militarised approach is needed as poaching is becoming ...	|Tougher protection of Africa\u2019s nature reserves will only result in more bloodshed. Every time the military upgrade their weaponry, tactics and logistic, the poachers improve their own methods to counter ...	|
|Quora	|Is heaven a really nice place?	|What do you think heaven will be like?	|
|Scidocs	|CFD Analysis of Convective Heat Transfer Coefficient on External Surfaces of Buildings	|This paper provides an overview of the application of CFD in building performance simulation for the outdoor environment, focused on four topics...	|
|Amazon ESCI	|#1 black natural hair dye without ammonia or peroxide	|6N - Sagebrush BrownNaturcolor Haircolor Hair Dye - Sagebrush Brown, 4 Fl Oz (6N)contains no ammonia, resorcinol or parabens\navailable in 31 colors, each color ... 	|



### Dataset details

The following table provides statistics about passages and queries for each dataset.

|Dataset	|Average query length	|Median Query Length	|Average passage length	|Median Passage Length	|No. of passages	|No. of test queries	|
|---	|---	|---	|---	|---	|---	|---	|
|DBPedia	|5.54	|5	|46.89	|47	|4635922	|400	|
|Quora	|9.531	|9	|11.46	|10	|522931	|10000	|
|FiQA	|10.94	|10	|132.9	|90	|57638	|648	|
|CQADupStack	|8.53	|8	|126.59	|68	|457199	|13145	|
|[NFCorpus](https://www.cl.uni-heidelberg.de/statnlpgroup/nfcorpus/)	|3.29	|2	|22.098	|224	|3633	|323	|
|Scifact	|12.51	|12	|201.81	|192	|300	|5183	|
|Trec-Covid	|10.6	|10	|148.64	|155	|171332	|50	|
|ArguAna	|193.55	|174	|164.19	|147	|8674	|1406	|
|[NQ](https://ai.google.com/research/NaturalQuestions)	|9.16	|9	|76.03	|65	|2681468	|3452	|
|scidocs	|9.44	|9	|167.24	|151	|25657	|1000	|
|Amazon ESCI	|3.89	|4	|179.87	|137	|482105	|8956	|

