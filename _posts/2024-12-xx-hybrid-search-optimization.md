---
layout: post
title: "Optimizing Hybrid Search in OpenSearch"
authors:
   - dwrigley
date: 2024-12-xx
categories: 
    - technical-posts
    - community
meta_keywords: hybrid query, hybrid search, neural query, keyword search, search relevancy, search result quality optimization 
meta_description: Tackle the optimization of hybrid search in a systematic way and train models that dynamically predict the best way to run hybrid search in your search application.
---

# Introduction

[Hybrid search combines keyword and neural search to improve search relevance](https://opensearch.org/docs/latest/search-plugins/hybrid-search) and this combination shows promising results across industries and [in benchmarks](https://opensearch.org/blog/semantic-science-benchmarks/).

As of [OpenSearch 2.18 hybrid search](https://opensearch.org/docs/latest/search-plugins/hybrid-search/) is linearly combining keyword search (e.g. match queries) with neural search (transforming queries to vector embeddings by using machine learning models). This combination is configured in a search pipeline. It defines the post processing of the result sets for keyword and neural search by normalizing the scores of each and then combining them with one of currently three available techniques (arithmetic, harmonic or geometric mean).

This search pipeline configuration lets OpenSearch users define how to normalize the scores and how to weigh the result sets.

# Finding the right hybrid search configuration is hard

As an OpenSearch user this leads to the ultimate question: which parameter set is the best for me and my application(s)? Or more concretely: what best normalization technique should I use and how much neural/keyword is ideal?

Unfortunately, there exists no one-size-fits-all solution. If there was the one best configuration there wouldn’t be a need to provide any options, right? The best configuration depends on a plethora of factors related to any given search application’s data, users, or domain.

However, there is a systematic way to arrive at this ideal set of parameters and even go beyond that. We call identifying the best set of parameters *global hybrid search optimization*: we identify the best parameter set *globally* for all incoming queries. We will cover this approach first before moving on to a dynamic approach that identifies hybrid query parameters individually per query.

# Global hybrid search optimizer

To identify the best hybrid search configuration we treat this as a parameter optimization challenge. We know the values parameters can have, so we know what combinations exist:

* There are two [normalization techniques: l2 and min_max](https://opensearch.org/blog/How-does-the-rank-normalization-work-in-hybrid-search/)  
* There are three combination techniques: arithmetic mean, harmonic mean, geometric mean  
* The keyword and neural search weights are values in the range from 0 to 1.


With this knowledge we can define a collection of parameter combinations to try out and compare to each other. To follow this path we need three things:

1. Query set: a collection of queries.  
2. Judgments: a collection of ratings that tell how relevant a result for a given query is.  
3. Search Metrics: a numeric expression of how well the search system does in returning relevant documents for queries

## Query set

A query set is a collection of queries. Ideally, query sets contain a representative set of queries. Representative means that different query classes are included in this query set:

* Very frequent queries (head queries), but also queries that are used rarely (tail queries)  
* Queries that are important to the business   
* Queries that express different user intent classes (e.g. searching for a product category, searching for product category + color, searching for a brand)  
* Other classes depending on the individual search application

These different queries are best sourced from a query log that captures all queries your users send to your system. One way of sampling these efficiently is [Probability-Proportional-to-Size Sampling](https://opensourceconnections.com/blog/2022/10/13/how-to-succeed-with-explicit-relevance-evaluation-using-probability-proportional-to-size-sampling/) (PPTSS). This method can generate a frequency weighted sample.

We will run each query in the query set against a baseline first to see how our search result quality is at the beginning of this experimentation phase.

## Judgments

Once a query set is available judgments come next. A judgment describes how relevant a particular document is for a given query. A judgment consists of three parts: the query, the document, and a (typically) numerical rating.

Ratings can be binary (0 or 1, i.e. irrelevant or relevant) or graded (e.g. 0 to 3, definitely irrelevant to definitely relevant). In the case of explicit judgments, there are human raters going through query-document pairs and assigning these ratings according to some rules. On the other hand there are implicit judgments. Implicit judgments are derived from user behavior: user queries, viewed and clicked documents. Implicit judgments can be modeled with [click models that emerged from web search](https://clickmodels.weebly.com/) in the early 2010s and range from simple clickthrough rates to more [complex approaches](https://www.youtube.com/watch?v=wa88XShl7hs). All come with limitations and/or deal differently with biases like position bias.

Recently, a third category of generating judgments emerged: LLM-as-a-judge. Here you use large language models like GPT-4o to judge query-doc pairs.

All three categories have different strengths and weaknesses. Whichever you choose, make sure you have a decent amount of judgments. Twice the depth of your default search result page per query is usually a good starting point for explicit judgments. So if you show your users 24 results per result page you should rate the first 48 results for each query.

Implicit judgments have the advantage of scale: when already collecting user events (like queries, viewed documents and clicked documents) this is an enabling step for calculating 1,000s of judgments by modeling these events into judgments.

## Search metrics

With a query set and the corresponding judgments we can calculate search metrics. Widely used [search metrics are Precision, DCG or NDCG](https://opensourceconnections.com/blog/2020/02/28/choosing-your-search-relevance-metric/).

Search metrics provide a way of measuring the search result quality of a search system numerically. We calculate search metrics for each configuration and this enables us to compare them objectively against each other. As a result we know which configuration scored best.

If you’re looking for guidance and support to generate a query set, create implicit judgments based on user behavior signals or calculate metrics based on these, feel free to [check out the search result quality evaluation framework](https://github.com/o19s/opensearch-search-quality-evaluation/).

## Create a baseline with the ESCI Dataset

Let’s put all pieces together and calculate search metrics for one particular example: in the [hybrid search optimizer repository](https://github.com/o19s/opensearch-hybrid-search-optimization/) we use the [ESCI dataset](https://github.com/amazon-science/esci-data) and in [notebooks 1-3](https://github.com/o19s/opensearch-hybrid-search-optimization/tree/main/notebooks) we configure OpenSearch to run hybrid queries, index the products of the ESCI dataset, create a query set and execute each of the queries in a keyword search setting that we assume to be our baseline. The search metrics can be calculated as the ESCI dataset comes not only with products and queries but also with judgments.

We chose a `multi_match` query of the type `best_fields` as our baseline. We search in the different fields of the dataset with “best guess” fields weights. In a real-world scenario we recommend techniques like learning to boost based on Bayesian optimization to figure out the best field and field weight combination.

```
{  
  "_source": {  
    "excludes": [  
      "title_embedding"  
    ]  
  },  
  "query": {  
    "multi_match" : {  
      "type": "best_fields",  
      "fields": [  
        "product_id^100",  
        "product_bullet_point^3",  
        "product_color^2",  
        "product_brand^5",  
        "product_description",  
        "product_title^10"  
      ],  
      "operator":   "and",  
      "query":      query[2]  
    }  
  }  
}
```

To arrive at a query set we went with two random samples: a small one containing 250 queries, and a large one containing 5,000 queries. Unfortunately, the ESCI dataset does not have any information about the frequency of queries, which excludes frequency weighted approaches like the above mentioned PPTSS.

These are the results running the test set of both query sets independently:

| Metric | Baseline BM25 - Small | Baseline BM25 - Large |
| :---: | :---: | :---: |
| DCG@10 | 9.65 | 8.82 |
| NDCG@10 | 0.24 | 0.23 |
| Precision@10 | 0.27 | 0.24 |

We applied an 80/20 split on the query sets to arrange for a training and test dataset. Every optimization step uses the queries of the training set whereas search metrics are calculated and compared for the test set. For the baseline, we calculated the metrics for the test set only since there is no actual training going on.

These numbers are now the starting point for our optimization journey. We want to maximize these metrics and see how far we get when looking for the best global hybrid search configuration in the next step.

## Identifying the best hybrid search configuration

With that starting point we can set off to explore the parameter space that hybrid search offers us. Our global hybrid search optimization notebook tries out 66 parameter combinations for hybrid search with the following set:

* Normalization technique: [`l2`, `min_max`]  
* Combination technique: [`arithmetic_mean`, `harmonic_mean`, `geometric_mean`]  
* Keyword search weight: [`0.0`, `0.1`, `0.2`, `0.3`, `0.4`, `0.5`, `0.6`, `0.7`, `0.8`, `0.9`, `1.0`]  
* Neural search weight: [`1.0`, `0.9`, `0.8`, `0.7`, `0.6`, `0.5`, `0.4`, `0.3`, `0.2`, `0.1`, `0.0`]

Neural and keyword search weights always add up to 1.0, so a keyword search weight of 0.1 automatically comes with a neural search weight of 0.9, a keyword search weight of 0.2 comes with a neural search weight of 0.8, etc.

This leaves us with 66 combinations to test: 2 normalization techniques * 3 combination techniques * 11 keyword/neural search weight combinations.

For each of these combinations we run the queries of the training set. To do so we use OpenSearch’s [temporary search pipeline capability](https://opensearch.org/docs/latest/search-plugins/search-pipelines/using-search-pipeline/#using-a-temporary-search-pipeline-for-a-request) that saves us from pre-creating all pipelines for the 66 parameter combinations.

Here is a template of the temporary search pipelines we use for our hybrid search queries:

```
"search_pipeline": {  
  "request_processors": [  
    {  
      "neural_query_enricher" : {  
        "description": "one of many search pipelines for experimentation",  
        "default_model_id": model_id,  
        "neural_field_default_id": {  
          "title_embeddings": model_id  
        }  
      }  
    }  
  ],  
  "phase_results_processors": [  
    {  
      "normalization-processor": {  
        "normalization": {  
          "technique": norm  
        },  
        "combination": {  
          "technique": combi,  
          "parameters": {  
            "weights": [  
              keywordness,  
              neuralness  
            ]  
          }  
        }  
      }  
    }  
  ]  
}
```

`norm` is the variable for the normalization technique, `combi` the variable for the combination technique, `keywordness` is the keyword search weight and `neuralness` is the neural search weight.

The neural part of the hybrid query is searching in a field with embeddings that were created based on the title of a product with the model `all-MiniLM-L6-v2`:

```
{  
  "neural": {  
    "title_embedding": {  
      "query_text": query[2],  
      "k": 100  
    }  
  }  
}
```

Using the queries of the training dataset and retrieving the results we calculate the three search metrics DCG@10, NDCG@10 and Precision@10,. For the small dataset there is one pipeline configuration that scores best for all three metrics. The pipeline uses the l2 norm, arithmetic mean, a keyword search weight of 0.4 and a neural search weight of 0.6.

The following metrics are calculated:

* DCG: 9.99  
* NDCG: 0.26  
* Precision: 0.29

Applying the potentially best hybrid search parameter combination to the test set and calculating the metrics for these queries results in the following numbers:

| Metric | Baseline BM25 - Small | Global Hybrid Search Optimizer - Small | Baseline BM25 - Large | Global Hybrid Search Optimizer - Large |
| :---: | :---: | :---: | :---: | :---: |
| DCG@10 | 9.65 | 9.99 | 8.82 | 9.30 |
| NDCG@10 | 0.24 | 0.26 | 0.23 | 0.25 |
| Precision@10 | 0.27 | 0.29 | 0.24 | 0.27 |

Looking at these numbers we can see improvements across all metrics for both datasets. To recap, at this point we did the following steps:

* Create a query set by randomly sampling  
* Generate judgments (to be precise, we only used the existing judgments of the ESCI dataset)  
* Calculate search metrics for a baseline  
* Try out several hybrid search combinations  
* Compare search metrics

Two things are important to note:

* While the systematic approach can be transferred to other applications, the experiment results cannot! It is necessary to always evaluate and experiment with your own data.  
* The ESCI dataset does not have 100% coverage of the judgments. On average we saw roughly 35% judgment coverage among the top 10 retrieved results per query. This leaves us with some uncertainty.

The improvements tell us that we optimize our metrics on average when switching to hybrid search with the above mentioned parameter values. But of course there are queries that are winners and queries that are losers when doing this switch. This is something we can virtually always observe when comparing two search configurations with each other. While one configuration outperforms the other on average not every query will profit from the configuration.

The following chart shows the DCG@10 values of the training queries of the small query set. The x-axis represents the search pipeline with l2 norm, arithmetic mean, 0.1 keyword search weight and 0.9 neural search weight (configuration A). The y-axis represents the search pipeline with identical normalization and combination technique but switched weights: 0.9 keyword search weight, 0.1 neural search weight (configuration B).  

<img src="/assets/media/blog-images/2024-12-xx-optimizing-hybrid-search/1_search_config_comparison.png" alt="Scatter Plot of DCG values for Keyword-heavy search configuration and Neural-heavy search configuration" class="center"/>{:style="width: 100%; max-width: 800px; height: auto; text-align: center"}

The clearest winners of configuration B are those that are located on the y-axis: they have a DCG score of 0 for this configuration. And for configuration A some even score above 15.

As we strive for having winners only this now leads us to the question: improvements on average are fine but how can we tackle this even more targeted and come up with an approach that provides us the best configuration per-query instead of one good configuration for all queries?  

# Dynamic hybrid search optimizer

We call this approach to identify a suitable configuration individually per hybrid search query *dynamic hybrid search optimization*. To move in that direction we treat hybrid search as a query understanding challenge: by understanding certain features of the query we develop an approach to predict the “neuralness” of a query. “Neuralness” is used as the term describing the neural search weight for the hybrid search queries.

You may ask: why predict only the “neuralness” and none of the other parameter values? The results of the global hybrid search optimizer (large query set) showed us that the majority of search configurations share two parameter values: the l2 normalization technique and the arithmetic mean as the combination technique.

Looking at the top 5 configurations per search metric (DCG@10, NDCG@10 and Precision@10) only five out of the 15 pipelines have min_max as an alternative normalization technique and none of these configurations has another combination technique.

With that knowledge we assume the l2 normalization and the arithmetic mean combination technique to be best suited throughout the whole dataset.

That leaves us with the parameter values for the neural search weight and the keyword search weight. By predicting one we can calculate the other by subtracting the prediction from 1: by predicting the “neuralness” we can calculate the “keywordness” by 1 - “neuralness”.

To validate our hypothesis that we came up with a couple of feature groups and features within these groups. Afterwards we trained machine learning models to predict an expected NDCG value for a given “neuralness” of a query.

## Feature groups and features

We divide the features into three groups: query features, keyword search result features and neural search result features:

* Query features: these features describe the user query string.  
* Keyword search result features: these features describe the results that the user query retrieves when executed as a keyword search.  
* Neural search result features: these features describe the results that the user query retrieves as a neural search.

### Query features

* Number of terms: how many terms does the user query have?  
* Query length: how long is the user query (measured in characters)?  
* Contains number: does the query contain one or more numbers?  
* Contains special character: does the query contain one or more special characters (non-alphanumeric characters)?

### Keyword search result features

* Number of results: the number of results for the keyword query.  
* Maximum title score: the maximum score of the titles of the retrieved top 10 documents. The scores are BM25 scores calculated individually per result set. That means that the BM25 score is not calculated on the whole index but only on the retrieved subset for the query, making the scores more comparable to each other and less prone to outliers that could result from high IDF values for very rare query terms.  
* Sum of title scores: the sum of the title scores of the top 10 documents, again calculated per-result set. We use the sum of the scores (and no average value) as an aggregate to have a measure of how relevant all retrieved top 10 titles are. BM25 scores are not normalized so using the sum instead of the average seemed reasonable.

### Neural search result features

* Maximum semantic score: the maximum semantic score of the retrieved top 10 documents. This is the score we receive for a neural query based on the query’s similarity to the title.  
* Average semantic score: By contrast to BM 25 scores the semantic scores are normalized and in the range of 0 to 1. Using the average score seems more reasonable than going for the sum here.

## Feature engineering

As training data we used the output of the global hybrid search optimizer. As part of this process we ran every query 66 times: once per hybrid search configuration. For each query we calculated the search metrics and as a result we know per query which pipeline worked best, thus also which “neuralness” (neural search weight) worked best. We used the best NDCG@10 value per query as the metric deciding what the ideal “neuralness” was.

That leaves us with 250 queries (small query set) or 5,000 queries (large query set) together with their “neuralness” values for which they achieved best NDCG@10 values. Next, we engineered the nine features for each query. This constitutes the training and test data.

## Model training and evaluation

With the appropriate data at hand we explored different algorithms and experimented with different model fitting settings to identify patterns and evaluate if we’re on the right track with that approach.  
We went for two relatively simple algorithms: linear regression and random forest regression.  
We applied cross validation, regularization, and tried out all different feature combinations. This resulted in interesting findings that are summarized in the following section.

**Dataset size matters**: Working with the differently sized datasets revealed that the amount of data matters when training and evaluating the models. The larger dataset reported a smaller Root Mean Squared Error compared to the smaller dataset. It also results in less variation of the RMSE scores within the cross-validation runs (i.e. when comparing the RMSE scores within one cross validation run for one feature combination).

**Model performance differs among the different algorithms**: the best RMSE score for the random forest regressor was 0.18 vs. 0.22 for the best linear regression model (large dataset) - both with different feature combinations though. The more complex model (random forest) is the one that performs better. However, better performance comes with the trade-off of longer training times for this more complex model.

**Feature combinations of all groups have the lowest RMSE**: the lowest error scores can be achieved when combining features from all three feature groups (query, keyword search result, neural search result). Looking at RMSE scores for feature combinations within the feature groups shows that working with keyword search result feature combinations only serves as the best alternative.

This is particularly interesting when thinking about productionizing this: putting an approach like this in production means that features need to be calculated per query during query time. Getting keyword search result features and neural search result features requires running these queries which would add significant latency to the overall query even prior to inference time.

The following picture shows the distribution of RMSE scores within one cross validation run when fitting random forest regression models with feature combinations within one group (blue: neural search features, red: keyword result features, green: query features) and across the groups (purple: features from all groups). The feature mix (purple) scores lowest (best), followed by training on keyword search result features only (red).   
<img src="/assets/media/blog-images/2024-12-xx-optimizing-hybrid-search/2_random_forest_best_feature_combinations.png" alt="Box plot showing the distribution of RMSE scores within one cross validation run when fitting the random forest regression model" class="center"/>{:style="width: 100%; max-width: 800px; height: auto; text-align: center"}

The overall picture does not change when looking at the numbers for the linear model:  
<img src="/assets/media/blog-images/2024-12-xx-optimizing-hybrid-search/3_linear_model_best_feature_combinations.png" alt="Box plot showing the distribution of RMSE scores within one cross validation run when fitting the linear regression model"  class="center"/>

## Model testing

Let’s look how the trained models perform when applying them dynamically on our test set.  
For each query of the test set we engineer the features and let the model make the inference for the “neuralness” values between 0.0 and 1.0, since “neuralness” also is a feature that we pass into the model. We then take the neuralness value that resulted in the highest prediction which is the best NDCG value. By knowing the “neuralness” we can calculate the “keywordness” by subtracting the “neuralness” from 1.

We again use the l2 norm and arithmetic mean as our hybrid search normalization and combination parameter values as they scored best in the global hybrid search optimizer experiment. With that we build the hybrid query, execute it, retrieve the results and calculate the search metrics like in the baseline and global hybrid search optimizer. 

Metrics for the small dataset:

| Metric | Baseline BM25 | Global Hybrid Search Optimizer | Dynamic Hybrid Search Optimizer - Linear Model | Dynamic Hybrid Search Optimizer - Random Forest Model |
| :---: | :---: | :---: | :---: | :---: |
| DCG@10 | 9.65 | 9.99 | 10.92 | 10.92 |
| NDCG@10 | 0.24 | 0.26 | 0.28 | 0.28 |
| Precision@10 | 0.27 | 0.29 | 0.32 | 0.32 |

Metrics for the large dataset:

| Metric | Baseline BM25 | Global Hybrid Search Optimizer | Dynamic Hybrid Search Optimizer - Linear Model | Dynamic Hybrid Search Optimizer - Random Forest Model |
| :---: | :---: | :---: | :---: | :---: |
| DCG@10 | 8.82 | 9.30 | 10.13 | 10.13 |
| NDCG@10 | 0.23 | 0.25 | 0.27 | 0.27 |
| Precision@10 | 0.24 | 0.27 | 0.29 | 0.29 |

Looking at these numbers shows us a steady positive trend starting from the baseline going all the way to the dynamic predictions of keywordness and neuralness per query. The large dataset shows a DCG increase of 8.9% rising from 9.3 to 10.13, the small dataset shows an increase of 9.3%. The other metrics increase as well: NDCG shows an improvement of 7.4%for the large dataset, 10.3% for the small dataset, Precision shows an improvement of 8% for the large dataset and 7.7% for the small dataset.

Interestingly, both models score exactly equally. The reason for this is that while they both predict different NDCG values, they predict the best ones with the same “neuralness” as an input feature. So while the models may differ in RMSE scores during the evaluation phase they provide equal results when applied to the test set.

Despite the low judgement coverage we see improvements for all metrics. This gives us confidence that this approach can provide value for search systems not only switching from keyword to hybrid search but also those who already are in production but have never used any systematic process to evaluate and identify the best settings.

# Conclusion

We provide a systematic approach to optimizing hybrid search in OpenSearch based on its current state and capabilities (normalization & combination techniques). The results look promising especially given the low judgment coverage that the ESCI dataset has.

We encourage everyone to adopt the approach and explore its usefulness in their domain with their dataset. We are looking forward to hearing about the experimentation results the community has with the provided approach.

# Future work

The currently planned next steps include replicating the approach with a dataset that has a higher judgment coverage and covers a different domain to see its generalizability.

Optimizing hybrid search typically is not the first step in search result quality optimization. Optimizing keyword search results first is especially important as the keyword search query is part of the hybrid search query. Bayesian optimization is an efficient technique to efficiently identify the best set of fields and field weights, sometimes also referred to as learning to boost.

The straight forward approach of trying out 66 different combinations can be created more elegantly by applying a technique like Bayesian optimization as well. In particular for large search indexes and a large amount of queries we expect this to result in a performance improvement.

Reciprocal rank fusion is another way of combining keyword search and neural search, currently under active development:

* [https://github.com/opensearch-project/neural-search/issues/865](https://github.com/opensearch-project/neural-search/issues/865)  
* [https://github.com/opensearch-project/neural-search/issues/659](https://github.com/opensearch-project/neural-search/issues/659) 

We also plan to include this technique, as well to identify the best way of running hybrid search dynamically per query.
