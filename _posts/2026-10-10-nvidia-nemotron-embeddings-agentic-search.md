---
layout: post
title:  "NVIDIA Nemotron embeddings for agentic search in OpenSearch"
authors:
  - beauzong
  - yych
date: 2026-10-10
has_science_table: true
has_math: true
categories:
  - technical-posts
meta_keywords: agentic search, embeddings, NVIDIA Nemotron, neural search, hybrid search, BRIGHT benchmark, search relevance
meta_description: Learn how NVIDIA Nemotron-3.5-Embed-1B embeddings improve neural, hybrid, and agentic search relevance in OpenSearch on the BRIGHT benchmark, and how a stronger retriever affects agent search steps and latency.
---

In our previous blog post, [Evaluating agentic search in OpenSearch](https://opensearch.org/blog/evaluating-agentic-search-in-opensearch/), we showed that with proper rewrites, reformulated queries deliver large relevance gains on reasoning-intensive benchmarks such as [BRIGHT](https://brightbenchmark.github.io/).

In this post, we look at the retriever underneath the agent. We evaluate the state-of-the-art **NVIDIA Nemotron-3.5-Embed-1B**, a 1.55B-parameter multilingual embedding model that produces 2,048-dimensional vectors, as the embedding model for OpenSearch neural and hybrid search, and compare it against a widely used open baseline. As in the previous post, our primary focus is **search relevance**. Because agentic search trades extra searches and LLM calls for better results, we also measure two costs that matter in production: **the number of search steps (hops) the agent takes** and **end-to-end latency per query**.

We answer three questions:

1. How much does a stronger embedding model improve retrieval on BRIGHT on its own, without any LLM rewrite?
2. Does that improvement carry over to agentic multi-step search, and does a stronger retriever change how many searches the agent needs?
3. How much context should the agent see at each step?

## Evaluation setup

### Datasets

We use the same six BRIGHT datasets as the previous post (biology, earth science, economics, LeetCode, psychology, and StackOverflow).

### Embedding models

- [**BAAI/bge-m3**](https://huggingface.co/BAAI/bge-m3) (baseline): 1,024-dimensional embeddings, 568M parameters.
- **Nemotron-3.5-Embed-1B**: 2,048-dimensional embeddings, 1.55B parameters.

We note that bge-m3 is a considerably stronger baseline than the [**msmarco-distilbert-base-tas-b**](https://huggingface.co/sentence-transformers/msmarco-distilbert-base-tas-b) model used in the previous post.

We use the same settings for both models except that we use CLS pooling for bge-m3 and mean pooling for Nemotron-3.5-Embed-1B, following each model's recommended settings.

### Retrieval methods

We compare two retrieval methods for each embedding model:

- **Neural:** dense vector search on the document embeddings, using a Lucene HNSW index with cosine similarity.
- **Hybrid:** neural search combined with BM25 keyword search on the document text. Scores are combined by an OpenSearch search pipeline with a normalization processor (min-max normalization, arithmetic-mean combination).

Combined with the two embedding models, this gives four configurations: **Neural · bge-m3**, **Hybrid · bge-m3**, **Neural · Nemotron**, and **Hybrid · Nemotron**. Following common practice, we report nDCG@10 against BRIGHT's gold labels.

## Search relevance on the original query

To isolate the quality of the embedding model itself, we first search each question exactly as written, without any agent rewrite.

| Configuration | Econ. | Psy. | Bio. | Earth. | Stack. | Leet. | **Avg.** | Latency / query |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Neural · bge-m3 | 0.117 | 0.135 | 0.089 | 0.153 | 0.099 | 0.221 | **0.136** | 0.10 s |
| Hybrid · bge-m3 | 0.119 | 0.119 | 0.101 | 0.154 | 0.138 | 0.251 | **0.147** | 0.14 s |
| Neural · Nemotron | 0.157 | 0.192 | 0.195 | 0.313 | 0.102 | 0.278 | **0.206** | 0.20 s |
| Hybrid · Nemotron | 0.145 | 0.157 | 0.172 | 0.258 | 0.135 | 0.287 | **0.192** | 0.25 s |

**Overall, Nemotron is the stronger retriever.** Averaged over the six datasets, Nemotron improves nDCG@10 by **52%** for neural search (0.136 → 0.206) and by **31%** for hybrid search (0.147 → 0.192).

In detail, first, **the gain is largest where retrieval requires understanding the question.** Nemotron more than doubles bge-m3's score on biology (+119%) and earth science (+105%), and improves psychology (+42%), economics (+34%), and LeetCode (+26%). On StackOverflow, the two models are essentially tied (+3% for neural search), and bge-m3 is slightly ahead for hybrid search (0.138 vs. 0.135). We argue that StackOverflow posts are long and rich in exact technical terms, so keyword overlap already carries much of the relevance signal.

Second, **whether BM25 helps depends on the embedding model.** For bge-m3, adding keyword search improves results (hybrid 0.147 vs. neural 0.136) while for Nemotron, neural search alone is best (0.206 vs. 0.192). We argue that BM25 compensates for weaker vectors, but strong embeddings already capture what keyword matching would add, so mixing in BM25 scores dilutes a strong ranking.

Third, **the better relevance comes with a slightly higher latency.** Nemotron is almost three times larger than bge-m3, so encoding a query takes longer. Meanwhile, a larger embedding dimension could result in a slightly longer latency in kNN search. As a result, a single search takes about 0.20 s with Nemotron versus 0.10 s with bge-m3 for neural search, and 0.25 s versus 0.14 s for hybrid search. At billions of searches, a 0.1 s overhead compounds quickly — but the effect on agentic search is negligible, as we show in the next section.

## Search relevance with agentic query rewriting

### How the agent works and how we score multi-step results

The agentic search described in the previous post issues one rewrite for evaluation. Although it achieves good empirical results, it ignores the agent's ability to reason about whether it has enough information to answer the original query. To achieve this, we prompt our agent to do:

1. **First search:** the original question is searched exactly as written. This step is identical to the single-search results in the previous section.
2. **Rewrite or stop:** an LLM (Anthropic Claude Sonnet 5.5 on Amazon Bedrock) receives the original question, the queries issued so far, and the top-K documents from the latest search. It either writes a new search query or decides to stop.
3. The new query is searched and step 2 repeats.

The search agent issues multiple queries and each query produces its own ranked list. To score these multi-step results, we merge the lists using [**Reciprocal Rank Fusion (RRF)**](https://dl.acm.org/doi/10.1145/1571941.1572114). It makes sure that documents that rank highly across several searches rise to the top.

### Setup and metrics

In order to control the resource usage, we set a limit of **10 searches per question** (max $$N$$ = 10). In this section, we provide the top 5 documents to the LLM for reasoning at each step. We discuss the effect of this value in a later section.

In addition to nDCG@10, we also investigate whether the efficiency of a query rewrite agent could benefit from a better embedding model. More specifically, we report the:

- **Hops:** the number of OpenSearch search requests issued per query.
- **Latency:** end-to-end wall-clock time per query.

### Results

| Configuration | Econ. | Psy. | Bio. | Earth. | Stack. | Leet. | **Avg.** | Hops / query | Latency / query |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Neural · bge-m3 | 0.154 | 0.213 | 0.203 | 0.184 | 0.140 | 0.214 | **0.185** | 5.61 | 8.1 s |
| Hybrid · bge-m3 | 0.184 | 0.250 | 0.306 | 0.263 | 0.252 | 0.246 | **0.250** | 5.23 | 7.8 s |
| Neural · Nemotron | 0.247 | 0.334 | 0.377 | 0.432 | 0.156 | 0.284 | **0.305** | 5.10 | 8.0 s |
| Hybrid · Nemotron | 0.271 | 0.341 | 0.400 | 0.431 | 0.244 | 0.287 | **0.329** | 5.05 | 7.9 s |

#### Effectiveness

Regarding effectiveness, we found the following.

**Agentic search improves every configuration.** Rewriting the query raises nDCG@10 by 36% to 71% over a single search. This confirms that when answering a query requires reasoning beyond surface-level keywords, rewriting and decomposing the query leads to dramatically better retrieval. LeetCode remains the outlier: it is the only dataset where agentic rewriting provides only marginal improvements, consistent with findings from the previous post.

**A better retriever still matters with an agent on top.** With agentic search, Nemotron outperforms bge-m3 by **65%** for neural search (0.185 → 0.305) and by **31%** for hybrid search (0.250 → 0.329), winning 11 of 12 dataset comparisons. The only exception is hybrid search on StackOverflow (bge-m3 0.252 vs. Nemotron 0.244). Without query rewriting, the two models already performed almost identically on this dataset, so the agent's rewrites start from similar retrieval results and end up with similar scores. StackOverflow is also keyword-heavy: its posts contain many exact technical terms, so adding BM25 brings an unusually large gain under agentic search (from 0.140 to 0.252 for bge-m3 and from 0.156 to 0.244 for Nemotron, hybrid vs. neural), which makes the choice of retrieval method matter more than the choice of embedding model.

**With an agent, hybrid search becomes the best method for both models.** Without an LLM, Nemotron performed best with neural search alone. With agentic search, hybrid wins for both embedding models (Nemotron 0.329 vs. 0.305; bge-m3 0.250 vs. 0.185). We argue that rewritten queries tend to contain precise domain terms that BM25 matches well, so query rewriting and keyword search reinforce each other.

#### Hops and latency

Besides search relevance, efficiency is also an important aspect to compare.

**A stronger retriever lets the agent stop slightly earlier.** With the same LLM and the same prompt, the agent issues fewer searches when backed by Nemotron: 5.10 vs. 5.61 hops per query for neural search, and 5.05 vs. 5.23 for hybrid search. The difference is statistically significant (*p<0.05*) for both methods. When the first searches already return relevant documents, the LLM sees good evidence sooner and decides to stop.

**Latency stays about the same.** As shown in the previous section, each Nemotron search costs about 0.1 s more than a bge-m3 search because of the larger model and bigger embedding size. In agentic search, the cost is paid at every search step. However, Nemotron's stronger retrieval lets the agent stop earlier, offsetting the slower per-step search. Our experimental results confirm this: end-to-end latency is virtually identical across all four configurations (8.0 s vs. 8.1 s for neural search, 7.9 s vs. 7.8 s for hybrid search).

## How does agentic reasoning improve query quality?

To investigate how the agent's reasoning ability improves the quality of the query, we also report the performance of the merged results after several intermediate rewriting steps. In the following figure, we illustrate the per-dataset evolution for the Neural · Nemotron setting at different reasoning steps. A vertical line marks the mean number of hops for each dataset:

![Per-dataset nDCG@10 by search step for Neural · Nemotron](/assets/media/blog-images/2026-10-10-nvidia-nemotron-embeddings-agentic-search/agentic_hopcurve_all.png){:class="img-centered"}

From the results, we find the following:

- **The first rewrite delivers most of the gain.** Going from the original query to the first rewrite improves nDCG@10 by 28% to 67% on the reasoning datasets. Additional searches keep finding relevant documents with diminishing returns, leveling off around the seventh search.
- **The agent searches more where reasoning matters most.** Economics, psychology, biology, and earth science average six to seven searches per query, and these datasets also show the largest gains.
- **LeetCode is the exception.** The agent rarely rewrites LeetCode queries (1.15 searches per query on average) and relevance barely changes. A programming problem statement already contains the precise terms that match the right documents, so natural-language rewrites add little. The LLM recognizes this and stops early, which also makes LeetCode the cheapest dataset at 1.5 seconds per query. This mirrors the previous post, in which LeetCode was the one BRIGHT dataset where agentic search did not help.

Along another axis, we compare the evolution across the embedding and search configurations, averaged over all six datasets:

![Average nDCG@10 by search step for all four configurations](/assets/media/blog-images/2026-10-10-nvidia-nemotron-embeddings-agentic-search/agentic_hopcurve_combos.png){:class="img-centered"}

In general, all four configurations show the same pattern for all four configurations: a large jump after the first rewrite, followed by a plateau. The Nemotron curves stay well above the bge-m3 curves at every step, and the Nemotron configurations stop slightly earlier on average. We also observe that the first jump for the Nemotron models is larger than for the bge-m3 models and that Nemotron reaches the plateau earlier, which also illustrates that a better embedding model could achieve better agentic search effectiveness even with shorter reasoning steps.

## How much context should the agent see?

In the experiments above, each search agent sees the top 5 retrieved results to reason and issue the next search query. A natural question is whether giving the agent more context helps. In the following table, we vary the number of documents shown to the LLM, denoted as $$k$$, and illustrate the performance on the economics dataset with Neural · Nemotron:

| k | **nDCG@10** | Hops / query | Latency / query |
| --- | --- | --- | --- |
| 5 | 0.247 | 6.34 | 9.0 s |
| 10 | **0.257** | 6.09 | 10.1 s |
| 20 | 0.241 | 5.80 | 11.4 s |
| 50 | 0.224 | 5.30 | 11.1 s |
| 100 | 0.205 | 4.73 | 9.9 s |
| 1000 | 0.222 | 4.13 | 13.1 s |

From the results, we find that **more context does not help**: showing the agent 5 or 10 documents per step works best (0.247–0.257, a difference within run-to-run noise). Beyond that, relevance declines steadily as $$k$$ grows. Showing 1,000 documents recovers only partially (0.222) while being the slowest setting (13.1 s per query). Furthermore, **with more context, the agent stops earlier** with fewer reasoning steps, but the latency is not necessarily lower because more time is needed for encoding the context.

We attribute this mainly to how the agent decides to stop: at each step, the LLM is asked whether it needs another search. With many loosely related documents in view, the agent becomes confident, often overconfident, that the results already cover the information need. The agent therefore stops before issuing the rewrites that would retrieve the truly relevant documents. However, documents that look relevant somewhere in a long context are often ranked well below the top 10, or are not actually among the gold documents, so they do little to improve nDCG@10. This matters especially on BRIGHT, where relevant documents are connected to the question through reasoning and typically appear only after the query has been well reformulated.

## Summary

- **Nemotron-3.5-Embed-1B is a substantially stronger retriever than bge-m3 on BRIGHT.** Without an LLM, it improves nDCG@10 by 52% for neural search and 31% for hybrid search, with the largest gains on reasoning-heavy datasets.
- **Agentic search improves every configuration, and the stronger embedding model keeps its advantage under the agent.** The best configuration, **hybrid search with Nemotron and agentic search**, reaches an average nDCG@10 of 0.329, compared with 0.136 for a single neural search with bge-m3.
- **A stronger retriever lets the agent stop slightly earlier at no extra latency.** Although a better embedding model has higher latency for a single search, end-to-end latency with agentic rewriting remains similar because the agent requires fewer reasoning steps, which is the main bottleneck.

## What's next

These results point to several directions for future work:

1. **Retrieval-oriented agent prompts.** Our current prompt asks the agent whether it needs another search to answer the question, which encourages it to stop as soon as the results look sufficient. We plan to design prompts that instead ask the agent to keep refining its query until it believes the query places the most relevant documents at the top of the ranking. We would then evaluate the effectiveness of the agent's final query directly, rather than the fused results of all its searches.
2. **Letting the agent choose the retrieval method.** Datasets differ in which retrieval method works best: keyword-heavy datasets such as StackOverflow benefit strongly from hybrid search, while neural search alone is often sufficient elsewhere. We plan to let the agent decide, for each query, whether to use neural or hybrid search.
3. **Generalizing beyond BRIGHT.** We plan to evaluate the same setup on agentic question-answering benchmarks such as [BrowseComp-Plus](https://arxiv.org/abs/2508.06600) to test whether our conclusions hold when retrieval serves a downstream answer rather than a ranked list.

If you have feedback or questions, join the discussion on the [OpenSearch forum](https://forum.opensearch.org/) or the [OpenSearch Slack workspace](https://opensearch.org/slack/).

## Acknowledgments

We thank Ben Gardner and Farshad Movahed from NVIDIA for organizing this collaboration and for providing access to the **Nemotron-3.5-Embed-1B** checkpoint. Our evaluation framework extends the one introduced in [Evaluating agentic search in OpenSearch](https://opensearch.org/blog/evaluating-agentic-search-in-opensearch/), and we thank its authors, Josh Palis et al., and the OpenSearch team for that foundational work. We also thank the authors of [BRIGHT](https://brightbenchmark.github.io/) for making their benchmark publicly available.
