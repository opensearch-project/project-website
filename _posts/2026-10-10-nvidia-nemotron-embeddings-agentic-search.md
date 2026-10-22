---
layout: post
title:  "NVIDIA Nemotron embeddings for agentic search in OpenSearch"
authors:
  - beauzong
  - yych
  - farshadsm
date: 2026-10-10
has_science_table: true
has_math: true
categories:
  - technical-posts
meta_keywords: agentic search, embeddings, NVIDIA Nemotron, neural search, hybrid search, BRIGHT benchmark, search relevance
meta_description: Learn how NVIDIA Nemotron-3.5-Embed-1B embeddings improve neural, hybrid, and agentic search relevance in OpenSearch on the BRIGHT benchmark, and how a stronger retriever affects agent search steps and latency.
excerpt: NVIDIA Nemotron-3.5-Embed-1B improves nDCG@10 on the BRIGHT benchmark by up to 65 percent compared with bge-m3, and agentic search with Nemotron issues fewer search steps with no increase in end-to-end latency.
---

<!-- Choosing a strong embedding model can benefit agentic search by increasing the number of relevant documents that each search returns and reducing the number of searches that the agent issues. In this post, we evaluate **NVIDIA Nemotron-3.5-Embed-1B** as the embedding model for OpenSearch neural and hybrid search. We compared the Nemotron model with the widely used bge-m3 model, focusing primarily on search relevance. Because agentic search trades additional searches and large language model (LLM) calls for better results, we also measured two production costs: the number of search steps (hops) that the agent takes and end-to-end latency per query. -->

How can OpenSearch retrieve more relevant documents for complex questions without increasing end-to-end agentic search latency? We evaluated neural and hybrid search using NVIDIA Nemotron 3.5 Embed 1B and bge-m3 across six datasets from the BRIGHT benchmark, both with and without multi-step query rewriting.

In our agentic search experiments, replacing bge-m3 with Nemotron improved average nDCG@10 by 65 percent for neural search and 31 percent for hybrid search. Agents also issued fewer search requests, while measured end-to-end latency remained similar. We examine where these gains come from, when hybrid search helps, and how much retrieved context to pass to the language model.

Our evaluation used the [BRIGHT benchmark](https://brightbenchmark.github.io/), which tests retrieval for reasoning-intensive queries. In [our previous blog post](https://opensearch.org/blog/evaluating-agentic-search-in-opensearch/), we showed that query reformulation can produce substantial relevance gains on the BRIGHT benchmark. In this post, we examine how the choice of the embedding model affects retrieval both before and within an agentic search workflow.

We answer three questions:

1. How much does a stronger embedding model improve retrieval on the BRIGHT benchmark without an LLM rewrite?
2. Does the improvement persist in agentic multi-step search, and does a stronger retriever change the number of searches that the agent issues?
3. How many retrieved documents should the LLM receive at each step?

## Evaluation setup

Each experiment paired one of two embedding models with one of two retrieval methods and ran on six BRIGHT datasets.

### Datasets

We used the same six BRIGHT datasets as in [the previous blog post](https://opensearch.org/blog/evaluating-agentic-search-in-opensearch/): biology, earth science, economics, LeetCode, psychology, and Stack Overflow.

### Embedding models

We compared the following embedding models:

- [**BAAI/bge-m3**](https://huggingface.co/BAAI/bge-m3) (baseline): A model from the Beijing Academy of Artificial Intelligence (BAAI) with 568 million parameters that produces 1,024-dimensional embeddings.
- [**Nemotron-3.5-Embed-1B**](https://huggingface.co/nvidia/Nemotron-3.5-Embed-1B-BF16): A multilingual model from NVIDIA with 1.55 billion parameters that produces 2,048-dimensional embeddings, that is part of the NVIDIA [Nemotron Retriever](https://huggingface.co/collections/nvidia/nemotron-retriever) collection and supported in the [NVIDIA Agent Knowledge Foundation](https://blogs.nvidia.com/blog/enterprise-platforms-agent-toolkit). <!-- This is a blog will be availble the 21st October -->

Note that the bge-m3 model provides a stronger baseline than the [msmarco-distilbert-base-tas-b](https://huggingface.co/sentence-transformers/msmarco-distilbert-base-tas-b) model used in the previous post.

We used identical settings for both models, except for pooling: following each model's recommendations, we used [CLS] token pooling for bge-m3 and mean pooling for Nemotron-3.5-Embed-1B.

### Retrieval methods

We compared two retrieval methods for each embedding model:

- **Neural**: Dense vector search on the document embeddings using a Lucene Hierarchical Navigable Small World (HNSW) index with cosine similarity.
- **Hybrid**: Neural search combined with BM25 keyword search on the document text. A search pipeline with a [normalization processor](https://docs.opensearch.org/latest/search-plugins/search-pipelines/normalization-processor/) combined the scores using min-max normalization and arithmetic mean combination.

The two embedding models and two retrieval methods produce four configurations: **neural · bge-m3**, **hybrid · bge-m3**, **neural · Nemotron**, and **hybrid · Nemotron**. We measured relevance using normalized discounted cumulative gain at rank 10 (nDCG@10) against the BRIGHT relevance labels.

## Search relevance without query rewriting

To isolate the quality of the embedding model itself, we first searched each question exactly as written. The following table shows nDCG@10 values for each BRIGHT dataset, the average nDCG@10 across the six datasets, and the latency per query.

| Configuration | Economics | Psychology | Biology | Earth science | Stack Overflow | LeetCode | Average nDCG@10 | Latency per query (seconds) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| neural · bge-m3 | 0.117 | 0.135 | 0.089 | 0.153 | 0.099 | 0.221 | **0.136** | 0.10 |
| hybrid · bge-m3 | 0.119 | 0.119 | 0.101 | 0.154 | 0.138 | 0.251 | **0.147** | 0.14 |
| neural · Nemotron | 0.157 | 0.192 | 0.195 | 0.313 | 0.102 | 0.278 | **0.206** | 0.20 |
| hybrid · Nemotron | 0.145 | 0.157 | 0.172 | 0.258 | 0.135 | 0.287 | **0.192** | 0.25 |

The results show that **Nemotron is the stronger retriever overall**. Averaged over the six datasets, Nemotron improves nDCG@10 by 52 percent for neural search (0.136 → 0.206) and by 31 percent for hybrid search (0.147 → 0.192).

**The gain is largest on datasets in which relevant documents share few terms with the question**. Nemotron more than doubles the bge-m3 score on biology (+119 percent) and earth science (+105 percent) and improves psychology (+42 percent), economics (+34 percent), and LeetCode (+26 percent). On Stack Overflow, the two models score within 3 percent of each other for neural search, and bge-m3 is slightly ahead for hybrid search (0.138 compared with 0.135). These results suggest that keyword overlap already provides much of the relevance signal for Stack Overflow, whose posts are long and contain many exact technical terms.

**Whether BM25 helps depends on the embedding model**. For bge-m3, adding keyword search improves average nDCG@10 from 0.136 to 0.147. For Nemotron, neural search alone scores higher than hybrid search (0.206 compared with 0.192). Our results suggest that BM25 compensates for weaker embeddings. Nemotron's embeddings already capture the term matches that BM25 would add, so adding BM25 scores lowers the ranking quality.

**Nemotron's higher relevance slightly increases search latency**. Nemotron is almost three times larger than bge-m3, so encoding a query takes a longer time. A higher embedding dimension can also slightly increase k-NN search latency. As a result, a single neural search takes about 0.20 seconds using Nemotron compared with 0.10 seconds using bge-m3, and a single hybrid search takes 0.25 compared with 0.14 seconds. For billions of searches, a 0.1-second overhead can add significant latency, but its effect on agentic search is negligible, as shown in the next section.

## Search relevance with agentic query rewriting

Next, we added LLM query rewriting over multiple search steps and measured relevance, the number of search steps, and latency for the same four configurations.

### Agent loop and scoring of multi-step results

The agentic search configuration in [the previous blog post](https://opensearch.org/blog/evaluating-agentic-search-in-opensearch/) rewrites the query once per evaluation. Although this approach produced good results, it doesn't let the agent search again when the first results are insufficient. In our experiments, the agent ran the following loop:

1. **First search**: The agent uses the original question as the search query, without modification. The search returns the same results as the single search described in the previous section.

2. **Rewrite or stop**: An LLM (Anthropic Claude Sonnet 5.5 on Amazon Bedrock) receives the original question, all search queries issued so far, and the top $$k$$ documents returned by the latest search. The LLM either generates a new search query or decides to stop.

3. **Repeat**: If the LLM generates a new query, the agent searches using that query and repeats step 2.


The agent issues multiple queries, and each query produces its own ranked list. To score these multi-step results, we merged the lists using [**Reciprocal Rank Fusion (RRF)**](https://dl.acm.org/doi/10.1145/1571941.1572114). RRF ranks documents that appear near the top of several lists above documents that rank highly in only one list.

### Setup and metrics

To reduce resource use, we set a limit of **10 searches per question** (max $$N$$ = 10). In this setup, the LLM received the top five documents from the latest search at each step ($$k$$ = 5). We varied this value in [the next experiment](#how-much-context-should-the-llm-receive).

In addition to nDCG@10, we measured whether a better embedding model makes the agent more efficient, using the following metrics:

- **Hops**: The number of OpenSearch search requests issued per query.
- **Latency**: The end-to-end wall-clock time per query.

### Results

The following table shows nDCG@10 for each BRIGHT dataset, the average nDCG@10 across the six datasets, and the number of hops and latency per query with agentic search.

| Configuration | Economics | Psychology | Biology | Earth science | Stack Overflow | LeetCode | Average nDCG@10 | Hops per query | Latency per query (seconds) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| neural · bge-m3 | 0.154 | 0.213 | 0.203 | 0.184 | 0.140 | 0.214 | **0.185** | 5.61 | 8.1 |
| hybrid · bge-m3 | 0.184 | 0.250 | 0.306 | 0.263 | 0.252 | 0.246 | **0.250** | 5.23 | 7.8 |
| neural · Nemotron | 0.247 | 0.334 | 0.377 | 0.432 | 0.156 | 0.284 | **0.305** | 5.10 | 8.0 |
| hybrid · Nemotron | 0.271 | 0.341 | 0.400 | 0.431 | 0.244 | 0.287 | **0.329** | 5.05 | 7.9 |

#### Agentic search performance

**Agentic search improves every configuration on average**. Across the six datasets, query rewriting increases the average nDCG@10 by 36--71 percent compared with a single search. These results show that multi-step query rewriting can improve retrieval for reasoning-intensive questions. LeetCode remains the outlier: it is the only dataset for which agentic rewriting provides only marginal improvements, consistent with the findings outlined in the previous post.

**Retriever quality still affects agentic search performance**. With agentic search, Nemotron Retriever outperforms bge-m3 by 65 percent for neural search (0.185 → 0.305) and by 31 percent for hybrid search (0.250 → 0.329), scoring higher than bge-m3 on 11 of 12 datasets. The only exception is hybrid search on Stack Overflow (0.252 for bge-m3 compared with 0.244 for Nemotron). Without query rewriting, the two models already perform almost identically on this dataset, so the agent rewrites start from similar retrieval results and produce similar scores. Stack Overflow posts also contain many exact technical terms, so in agentic search, adding BM25 produces a larger gain on Stack Overflow than on any other dataset (from 0.140 to 0.252 for bge-m3 and from 0.156 to 0.244 for Nemotron, comparing hybrid with neural search). As a result, the choice of retrieval method affects the Stack Overflow results more than the choice of embedding model.

**When combined with agentic search, hybrid search scores highest for both models**. Without an LLM, Nemotron performed best with neural search alone. With agentic search, hybrid search scores higher for both embedding models (0.329 compared with 0.305 for Nemotron and 0.250 compared with 0.185 for bge-m3). We attribute this difference to the precise domain terms that rewritten queries tend to contain, which BM25 matches well. As a result, BM25 benefits more from the rewritten queries than from the original questions.

#### Hops and latency

The following results compare the number of search steps and end-to-end latency.

**When using a stronger retriever, the agent stops slightly earlier**. With the same LLM and the same prompt, the agent issues fewer searches when it uses Nemotron: 5.10 compared with 5.61 hops per query for neural search, and 5.05 compared with 5.23 for hybrid search. The difference is statistically significant (*p* < 0.05) for both methods. When the first searches return relevant documents, the LLM receives useful information earlier and decides to stop searching.

**Latency stays about the same**. As shown in [Search relevance without query rewriting](#search-relevance-without-query-rewriting), each Nemotron search takes about 0.1 seconds longer than a bge-m3 search because of the larger model and higher embedding dimension. In agentic search, this cost applies to every search step. However, the agent stops after fewer steps when it uses Nemotron, which offsets the slower search at each step.  As shown in our results, the end-to-end latency is within 0.1 seconds across all four configurations (8.0 compared with 8.1 seconds for neural search and 7.9 compared with 7.8 seconds for hybrid search).

## How does agentic reasoning improve query quality?

To investigate how the agent's reasoning ability improves the quality of the query, we measured the relevance of the merged results after each intermediate rewriting step. The following figure shows nDCG@10 at each search step for neural search using Nemotron, with one line for each dataset. A vertical line marks the mean number of hops for each dataset.

![Per-dataset nDCG@10 by search step for neural · Nemotron](/assets/media/blog-images/2026-10-10-nvidia-nemotron-embeddings-agentic-search/agentic_hopcurve_all.png){:class="img-centered"}

From the results, we can conclude the following:

- **The first rewrite produces most of the gain**. Going from the original query to the first rewrite improves nDCG@10 by 28--67 percent on reasoning datasets (economics, psychology, biology, and earth science). Each subsequent search adds fewer relevant documents, and nDCG@10 stops increasing at approximately the seventh search.
- **The agent issues more searches on datasets that require reasoning**. Economics, psychology, biology, and earth science datasets average 6--7 searches per query, and these datasets also show the largest gains.
- **LeetCode is the exception**. The agent rarely rewrites LeetCode queries (1.15 searches per query on average), and relevance barely changes. A programming problem statement already contains the precise terms that match the right documents, so natural language rewrites add little value. Recognizing this, the LLM stops early, which also makes LeetCode the cheapest dataset, at 1.5 seconds per query. This mirrors the findings we provided in the previous post: LeetCode was the only BRIGHT dataset for which agentic search did not improve relevance.

We also compare how results change across embedding and search configurations. The following figure shows nDCG@10 at each search step for all four configurations, averaged over the six datasets.

![Average nDCG@10 by search step for all four configurations](/assets/media/blog-images/2026-10-10-nvidia-nemotron-embeddings-agentic-search/agentic_hopcurve_combos.png){:class="img-centered"}

In general, all four configurations show the same pattern: a large increase after the first rewrite, followed by a plateau. The Nemotron curves stay well above the bge-m3 curves at every step, and the Nemotron configurations stop slightly earlier on average. The first increase is also larger for the Nemotron models than for the bge-m3 models, and Nemotron reaches the plateau earlier. These results show that a stronger embedding model can produce higher agentic search relevance with fewer search steps.

## How much context should the LLM receive?

In the preceding experiments, the LLM received the top five documents from each search. To test whether more context improves the rewrites, we varied the number of documents passed to the LLM, $$k$$, on the economics dataset with the neural · Nemotron configuration. The following table shows the results.

| k | nDCG@10 | Hops per query | Latency per query (seconds) |
| --- | --- | --- | --- |
| 5 | 0.247 | 6.34 | 9.0 |
| 10 | **0.257** | 6.09 | 10.1 |
| 20 | 0.241 | 5.80 | 11.4 |
| 50 | 0.224 | 5.30 | 11.1 |
| 100 | 0.205 | 4.73 | 9.9 |
| 1000 | 0.222 | 4.13 | 13.1 |

**Increasing $$k$$ beyond 10 reduces relevance**. Passing 5 or 10 documents per step to the LLM produces the highest scores (0.247–0.257, a difference within run-to-run noise). Beyond 10 documents, relevance declines steadily as $$k$$ grows. Passing 1,000 documents recovers only partially (0.222) and is the slowest setting (13.1 seconds per query). Furthermore, **with more context, the agent stops earlier**, with fewer reasoning steps, but the latency is not necessarily lower because more time is needed for encoding the context.

We attribute this mainly to how the agent decides when to stop searching. At each step, the LLM is asked whether another search is necessary. When the context contains many loosely related documents, the agent may conclude that the available results are sufficient, even when more relevant documents remain undiscovered. The agent then stops before issuing the query rewrites needed to retrieve those documents.

Documents that appear relevant in a long context may still rank below the top 10 or may not belong to the gold set, so they contribute little to nDCG@10. This limitation is especially important on the BRIGHT benchmark, where finding relevant documents requires reasoning beyond surface-level keyword matches. Those documents often appear only after the query has been reformulated effectively.

## Summary

Our experiments produced the following findings:

- **Stronger embeddings improve retrieval in OpenSearch.** Across the six BRIGHT datasets evaluated, replacing bge-m3 with Nemotron 3.5 Embed 1B increases average nDCG@10 by 52 percent for neural search and 31 percent for hybrid search without LLM query rewriting.
- **Agentic query rewriting improves average relevance for all four configurations.** With agentic search, Nemotron Retriever retains its advantage over bge-m3, improving average nDCG@10 by 65 percent for neural search and 31 percent for hybrid search. Hybrid search with Nemotron achieves the highest average score, at 0.329.
- **Higher relevance comes with fewer search requests and similar measured latency.** Agents using Nemotron Retriever average 5.10 searches per query compared with 5.61 for bge-m3 in neural search, and 5.05 compared with 5.23 in hybrid search. End-to-end latency differs by only 0.1 seconds between models within each retrieval method.

## What's next

The results suggest several areas for future work:

* **Retrieval-oriented agent prompts**: Our current prompt asks the agent whether it needs another search to answer the question, encouraging it to stop when the retrieved documents appear sufficient. We plan to design prompts that encourage the agent to refine its query until it expects the highest-ranked documents to be the most relevant. We will then evaluate retrieval using the agent's final query directly, rather than combining results from all intermediate searches.

* **Agent selection of the retrieval method**: The best retrieval method varies by dataset. Keyword-heavy datasets such as Stack Overflow benefit substantially from hybrid search, while neural search alone performs well on other datasets. We plan to have the agent choose between neural and hybrid search for each query.

* **Evaluation beyond BRIGHT**: We plan to evaluate the same setup on agentic question-answering benchmarks such as [BrowseComp-Plus](https://arxiv.org/abs/2508.06600). This will help determine whether our conclusions hold when retrieval supports answering a question rather than producing a ranked list of documents.


## Try it

To try agentic search, see [the agentic search documentation](https://docs.opensearch.org/latest/vector-search/ai-search/agentic-search/). If you have feedback or questions, join the discussion on the [OpenSearch forum](https://forum.opensearch.org/) or the [OpenSearch Slack workspace](https://opensearch.org/slack/).

## Acknowledgments

We thank Ben Gardner and Farshad Movahed from NVIDIA for organizing this collaboration and for providing access to the **Nemotron-3.5-Embed-1B** checkpoint. Our evaluation framework extends the one introduced in [Evaluating agentic search in OpenSearch](https://opensearch.org/blog/evaluating-agentic-search-in-opensearch/), and we thank its authors, Josh Palis et al., and the OpenSearch team for that foundational work. We also thank the authors of the [BRIGHT benchmark](https://brightbenchmark.github.io/) for making their benchmark publicly available.
