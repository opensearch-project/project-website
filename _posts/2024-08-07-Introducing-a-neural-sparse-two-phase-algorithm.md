---
layout: post
title:  Introducing a neural sparse two-phase algorithm
authors:
  - zhichaog
  - yych
  - congguan
date: 2024-08-07
categories:
    - technical-posts
has_math: true
meta_keywords: OpenSearch semantic search, neural sparse search, semantic sparse retrieval
meta_description: Introducing a new search pipeline that can reduce the latency of OpenSearch neural sparse search.

excerpt: We are excited to announce the release of a new feature in OpenSearch 2.15, a two-phase search pipeline for neural sparse retrieval. In testing, this feature has achieved significant speed improvements.
featured_blog_post: true 
featured_image: false # /assets/media/blog-images/__example__image__name.jpg
---

## Introductiion of neural sparse search
Neural sparse search is an efficient new method of semantic retrieval that was introduced in OpenSearch 2.11. Like dense semantic matching, neural sparse search can handle terms that the lexical search does not understand because it uses semantic techniques to interpret the query. While dense semantic models can find semantically similar results, they can be insensitive to specific terms, notably exact matches. Neural sparse search introduces sparse representations, allowing it to capture semantic similarities and handle specific terms that the semantic model cannot understand. This capability enables it to explain and present results through text matching, thus addressing the shortcomings of purely semantic matching and providing a more comprehensive retrieval capability.

The basic idea of neural sparse is to expand a text (the query or the document) into a larger number of terms, each weighted by its semantic relevance. It then uses Lucene’s efficient term vector computation to calculate the highest-scoring results. This results in reduced index and memory costs as well as lower computational expenses. Dense encoding uses k-NN retrieval and incurs a 7.9% increase in RAM cost at search time, whereas neural sparse search uses a native Lucene index, so the RAM cost does not increase at search time; and nerual sparse results in a much smaller index size compared to dense encoding, with a document-only model generating an index that is 10.4% of the size of a dense encoding index, and for a bi-encoder, the index size is 7.2% of a dense encoding index.

Given the advantages of neural sparse retrieval, we’ve continued to work on making it even more efficient. OpenSearch 2.15's new feature two-phase search pipeline can splits the neural sparse query into two parts: the high-scoring tokens and the low-scoring tokens. It first selects documents using the high-scoring tokens, and then recalculates the score on those documents including both high- and low-scoring tokens. This reduces the amount of computational significantly while preserving the quality of the final ranking.

## Algorithm process
In the initial phase, the algorithm quickly selects a set of candidate documents using high-scoring tokens inferred by the model from the query. These high-scoring tokens, which constitute a small proportion of the overall tokens in the query, are terms that have significant weight or relevance, allowing for a quick determination of potentially relevant documents. This process significantly reduces the set of documents to be processed, thereby lowering computational costs.

In the second phase, the algorithm recalculates the scores for the candidate documents selected in the first phase. This time, it includes both high-scoring and low-scoring tokens from the query. Although low-scoring tokens individually have lower weights, they provide valuable information in the comprehensive evaluation, especially when long-tail terms contribute significantly to the overall score. This allows the algorithm to determine the final document scores more accurately.

By processing in stages, this approach reduces computational demands while maintaining quality. The rapid selection in the first phase improves efficiency, while the detailed scoring in the second phase ensures accuracy. Even when dealing with a large number of long-tail terms, results remain of high quality, while achieving a significant computational efficiency improvement.

## Metric

We measured the speed and quality of search results using neural sparse.

### Test environment

We measured performance on OpenSearch clusters with 3 m5.4xlarge nodes using the OpenSearch benchmark tool. We tested using 20 simultaneous clients, 50 warmup iterations, and 200 test iterations.

### Test dataset

For search quality, we tested multiple BEIR datasets and measured the relative result quality,  below are some parameter details for these datasets:

| Dataset        | BEIR-Name     | Queries | Corpus | Rel D/Q |
|----------------|---------------|---------|--------|---------|
| NQ             | nq            | 3,452   | 2.68M  | 1.2     |
| HotpotQA       | hotpotqa      | 7,405   | 5.23M  | 2       |
| DBPedia        | dbpedia-entity| 400     | 4.63M  | 38.2    |
| FEVER          | fever         | 6,666   | 5.42M  | 1.2     |
| Climate-FEVER  | climate-fever | 1,535   | 5.42M  | 3       |


### P99 latency

The algorithm has the same time cost of inference as the existing neural sparse search. To provide a clearer comparison of the acceleration in the search phase, we excluded the inference part in latency test, which is significantly affected by hardware, this latency benchmark used raw vector search, excluding any additional impact from inference time.

#### Doc-only mode

In doc-only mode, the two-phase processor can significantly decrease query latency. Analyzing the data:


<img src="/assets/media/blog-images/2024-08-07-Introducing-a-neural-sparse-two-phase-algorithm/two-phase-doc-model-p99-latency.jpg"/>


* Average latency without 2-phase: 198 ms
* Average latency with 2-phase: 124 ms

Depending on the data distribution, the speed up was between 1.22x and 1.78x.

#### Bi-encoder mode
In bi-encoder mode, the two-phase algorithm can significantly decrease query latency. Analyzing the data:

<img src="/assets/media/blog-images/2024-08-07-Introducing-a-neural-sparse-two-phase-algorithm/two-phase-bi-encoder-p99-latency.jpg"/>

* Average latency without 2-phase: 617 ms
* Average latency with 2-phase: 122 ms

Depending on the data distribution, the two phase processor speed up from 4.15x to 6.87x.



## Beginner’s guide

### Set up a neural_sparse_two_phase_processor.
First, we need to build a neural_sparse_two_phase_processor with the default parameters. For more details on the extra parameters, please refer to the full OpenSearch documentation.

```
PUT /_search/pipeline/<custom-pipeline-name>
{
  "request_processors": [
    {
      "neural_sparse_two_phase_processor": {
        "tag": "neural-sparse",
        "description": "This processor is making a neural sparse two-phase processor,
            which can speed up neural sparse query!"
      }
    }
  ]
}
```

### Set the default search pipeline into neural_sparse_two_phase_processor

Assuming that you already have a neural sparse index, set the index’s index.search.default_pipeline to the last step’s pipeline name.

```
PUT /<your-index-name>/_settings 
{
  "index.search.default_pipeline" : "<custom-pipeline-name>"
}
```

