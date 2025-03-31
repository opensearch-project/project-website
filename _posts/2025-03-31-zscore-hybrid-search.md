---
layout: post
title:  Z Score Normalization Technique for Hybrid Search
authors:
  - kazabdu
  - gaievski
  - minalsha
date: 2025-04-22
has_science_table: true
categories:
  - technical-posts
meta_keywords: z score normalization, OpenSearch 3.0-beta1, neural search plugin, hybrid search, relevance ranking, search normalization, k-nn search, L2 normalization, how reciprocal rank fusion works
meta_description: Learn about z score normalization using the Neural Search plugin in OpenSearch 3.0-beta1. Discover how this new approach to hybrid search merges results from multiple query sources for improved relevance.
---

In the world of search engines and machine learning, data normalization plays a crucial role in ensuring fair and accurate comparisons between different features or scores. 
Hybrid query uses multiple normalization techniques for preparing final results, main two types are score based normalization and rank base combination. In score base normalization, min-max normalization(default normalization technique) doesn’t work well with outliers (Outliers are data points that significantly differ from other observations in a dataset. 
In the context of normalization techniques like Min-Max scaling and Z-score (Standard Score) normalization, outliers can have a substantial impact on the results). In this blogpost we would introduce another normalization technique called as z-score which was added in OpenSearch 3.0-beta1 release. 
Let's dive into what Z-score normalization is, why it's important, and how it's being used in OpenSearch.

## What is Z-Score Normalization?

Z-score normalization, also known as standardization, is a method of scaling data using mean and standard deviation. The formula for calculating the Z-score is:
Z = (X - μ) / σ
Where:

* X is the original value
* μ is the mean of the population
* σ is the standard deviation of the population

## When to use Z Score?

Considering your index’s structure can help you decide which one to choose since each has advantages of its own. If your documents are more similar to one another and the top-k results of a typical query return documents that are very similar to one another and clustered together within the index, as seen in the graph below, Min-Max may be a better option.

![Image for min max distribution](/assets/media/blog-images/2025-03-31-zscore-hybrid-search/blogpost1.jpg){: .img-fluid}

However, Z-Score is more suited if the results are more evenly distributed and have some characteristics of a normal distribution, as shown in the example below.

![Image for zscore distribution](/assets/media/blog-images/2025-03-31-zscore-hybrid-search/blogpost2.jpg){: .img-fluid}

The basic flow to use between min max and z score looks like below:

![Image for flow](/assets/media/blog-images/2025-03-31-zscore-hybrid-search/blogpost3.png){: .img-fluid}

### How to use Z Score?

To use z_score, create a search pipeline and specify `z_score` as the `technique`:

```
PUT /_search/pipeline/z_score-pipeline
{
    "description": "Zscore processor for hybrid search",
    "phase_results_processors": [
        {
            "normalization-processor": {
                "normalization": {
                    "technique": "z_score"
                }
            }
        }
    ]
}
```

Next, create a hybrid query and apply the pipeline to it

```


POST my_index/_search?search_pipeline=z_score-pipeline
{
   "query": {
     "hybrid": [
         {}, // First Query
         {}, // Second Query
         ... // Other Queries
     ] 
   }
}
```



## Benchmarking Z Score performance

Benchmark experiments were conducted using an OpenSearch cluster consisting of a single r6g.8xlarge instance as the coordinator node, along with three r6g.8xlarge instances as data nodes. To assess Z Score’s performance comprehensively, we measured two key metrics across five distinct datasets. For information about the datasets used, see [Datasets](https://public.ukp.informatik.tu-darmstadt.de/thakur/BEIR/datasets/).

### Sample queries and passages

The following table provides sample queries and passages for each dataset.

|Dataset	|Sample query	|Sample passage	|
|:---	|:---	|:---	|
|Scidocs	|CFD Analysis of Convective Heat Transfer Coefficient on External Surfaces of Buildings	|`This paper provides an overview of the application of CFD in building performance simulation for the outdoor environment, focused on four topics...`	|
|FiQA	|“Business day” and “due date” for bills	|`I don't believe Saturday is a business day either. When I deposit a check at a bank's drive-in after 4pm Friday, the receipt tells me it will credit as if I deposited on Monday. If a business' computer doesn't adjust their billing to have a weekday due date ...	`|
|nq |what is non controlling interest on balance sheet |`In accounting, minority interest (or non-controlling interest) is the portion of a subsidiary corporation's stock that is not owned by the parent corporation. The magnitude of the minority interest in the subsidiary company is generally less than 50% of outstanding shares, or the corporation would generally cease to be a subsidiary of the parent`|
|ArguAna	|Poaching is becoming more advanced A stronger, militarised approach is needed as poaching is becoming ...	|`Tougher protection of Africa\u2019s nature reserves will only result in more bloodshed. Every time the military upgrade their weaponry, tactics and logistic, the poachers improve their own methods to counter ...`	|
|touche2020	|Is a college education worth it?	|`The resolution used by Pro *assumes* that Australia isn't already a 'significant' country - however, in actual reality, it is. Firstly we should clarify what significance means: 1.a the state or quality of being significant1.b of consequence or..`	|


Search relevance was quantified using the industry-standard Normalized Discounted Cumulative Gain at rank 10 (NDCG@10). We also tracked system performance using search latency measurements. This setup provided a strong foundation for evaluating both search quality and operational efficiency.


### NDCG@10

|dataset	|Hybrid (min max)	|Hybrid (z score)	|Percent diff	|
|---	|---	|---	|---	|
|scidocs	|0.1591	|0.1633	|+2.45%	|
|fiqa	|0.2747	|0.2768	|+0.77%	|
|nq	|0.3665	|0.374	|+2.05%	|
|arguana	|0.4507	|0.467	|+3.62%	|
|touche2020	|0.841	|0.8542	|+1.54%	|
|	|	|Average	|2.08%	|

### Search latency


The following table presents search latency measurements in milliseconds at different percentiles (p50, p90, and p99) for both the Hybrid with min max and z score approaches. The *Percent difference* columns show the relative performance impact between these methods.

<table> <tr> <th></th> <th colspan="3"><b>p50</b></th> <th colspan="3"><b>p90</b></th> <th colspan="3"><b>p99</b></th> </tr> <tr> <td></td> <td><b>Hybrid (min max)</b></td> <td><b>Hybrid (z score)</b></td> <td><b>Percent difference</b></td> <td><b>Hybrid (min max)</b></td> <td><b>Hybrid (z score)</b></td> <td><b>Percent difference</b></td> <td><b>Hybrid (min max)</b></td> <td><b>Hybrid (z score)</b></td> <td><b>Percent difference</b></td> </tr> <tr> <td>scidocs</td> <td>76.25</td> <td>77.5</td> <td>1.64%</td> <td>99</td> <td>100.5</td> <td>1.52%</td> <td>129.54</td> <td>133.04</td> <td>2.70%</td> </tr> <tr> <td>fiqa</td> <td>80</td> <td>81</td> <td>1.25%</td> <td>104.5</td> <td>105</td> <td>0.48%</td> <td>123.236</td> <td>124</td> <td>0.62%</td> </tr> <tr> <td>nq</td> <td>117</td> <td>117</td> <td>0%</td> <td>140</td> <td>140</td> <td>0%</td> <td>166.74</td> <td>165.24</td> <td>-0.90%</td> </tr> <tr> <td>arguana</td> <td>349</td> <td>349</td> <td>0%</td> <td>382</td> <td>382</td> <td>0%</td> <td>417.975</td> <td>418.475</td> <td>0.12%</td> </tr> <tr> <td>touche2020</td> <td>77</td> <td>77.5</td> <td>0.64%</td> <td>100</td> <td>100.5</td> <td>0.50%</td> <td>140</td> <td>140</td> <td>0%</td> </tr> <tr> <td></td> <td></td> <td><b>Average:</b></td> <td>0.70%</td> <td></td> <td><b>Average:</b></td> <td>0.50%</td> <td></td> <td><b>Average:</b></td> <td>0.50%</td> </tr> </table>

### Conclusions


Our benchmark experiments highlight the following advantages and trade-offs of Z-score normalization compared to min-max normalization in hybrid search approaches:

**Search quality (measured using NDCG@10 across four datasets)**:

* Z-score normalization shows a modest improvement in search quality, with an average increase of 2.08% in NDCG@10 scores.
* This suggests that Z-score normalization may provide slightly better relevance in search results compared to the default normalization technique min-max.


**Latency impact**:

* Z-score normalization shows a small increase in latency across different percentiles, as shown in the following table:

|Latency percentile	|Percent difference	|
|---	|---	|
|p50	|0.70%	|
|p90	|0.50%	|
|p99	|0.50%	|

* The positive percentages indicate that Z-score normalization has slightly higher latency compared to min-max normalization, but the differences are minimal (less than 1% on average).

**Trade-offs**:

* There's a slight trade-off between search quality and latency. Z-score normalization offers a improvement in search relevance (2.08% increase in NDCG@10) at the cost of a marginal increase in latency (0.50% to 0.72% across different percentiles).

**Overall assessment**:

* Z-score normalization provides a modest improvement in search quality with a negligible impact on latency.
* The choice between Z-score and min-max normalization may depend on specific use cases, with Z-score potentially being preferred where improvements in search relevance are valuable and the slight latency increase is acceptable.

These findings suggest that Z-score normalization could be a viable alternative to min-max normalization in hybrid search approaches, particularly in scenarios where optimizing search relevance is a priority and the system can tolerate minimal latency increases



## What’s next?

We are also expanding OpenSearch’s hybrid search capabilities beyond z score by planning the following enhancements to our normalization framework:

**Custom normalization functions**: Enables you to define your own normalization logic and allows fine-tuning of search result rankings. For more information, see [this issue](https://github.com/opensearch-project/neural-search/issues/994).

These enhancements will provide more control over search result ranking while ensuring reliable and consistent hybrid search outcomes. Stay tuned for more information!



### References

1. [Normalization](https://www.codecademy.com/article/normalization)
2. [Hybrid Search 2.0: The Pursuit of Better Search](https://towardsdatascience.com/hybrid-search-2-0-the-pursuit-of-better-search-ce44d6f20c08/)
3. [[RFC] Z Score Normalization Technique for Normalization Processor](https://github.com/opensearch-project/neural-search/issues/1209)
