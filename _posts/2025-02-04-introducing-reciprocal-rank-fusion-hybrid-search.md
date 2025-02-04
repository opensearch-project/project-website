---
layout: post
title:  Introducing Reciprocal Rank Fusion for Hybrid Search
authors:
  - rbogan
  - gaievski
  - minalsha
  - kolchfa
date:
categories:
  - technical-posts
meta_keywords:
meta_description:
---

OpenSearch 2.19 introduces reciprocal rank fusion (RRF), a new feature in the neural-search plugin designed to enhance Hybrid search. RRF merges ranked results from diverse query sources like neural, k-NN, and boolean, into a single unified relevance-optimized set. By prioritizing documents consistently ranked highly across multiple sources, RRF ensures the most relevant items appear prominently in the final results, addressing limitations of traditional score normalization techniques.

## Applicability and advantages of RRF in hybrid search
RRF is particularly advantageous for aggregating ranked results from diverse query methods. Unlike traditional score, normalization techniques like Min-max or L2 normalization, RRF employs a rank-based aggregation strategy that inherently addresses several limitations of score-centric methods.

### Addressing limitations of score normalization methods
1. #### Score distribution sensitivity:
   Techniques like Min-max normalization map scores to a common range, but when combining results from different query methods, their varying score patterns can lead to unbalanced final rankings. Such unbalanced rankings can compromise search quality by allowing one query method’s scoring pattern to dominate the results, regardless of actual relevance. L2 normalization scales scores proportionally, yet remains influenced by score distribution within individual queries. RRF bypasses these limitations by focusing exclusively on rank positions, enabling consistent treatment of results across disparate data sources.
2. #### Outlier robustness:
   Both Min-max and L2 normalization are susceptible to outliers, where extreme scores disproportionately affect normalized rankings. By aggregating rankings rather than scores, RRF ensures that relevance is determined by positional consistency, not anomalous values.
3. #### Relevance consistency:
   L2 normalization aligns scores to a shared scale but lacks a mechanism to reward documents appearing consistently across multiple queries. RRF excels by prioritizing items ranked highly across diverse queries, ensuring robust handling of multidimensional relevance signals.

### Real-world applications
RRF demonstrates advantages over existing normalization techniques in scenarios where datasets exhibit specific challenges:
#### Score variability across query methods
Query methods like BM25, neural search, and k-NN often produce scores on incompatible scales. Techniques like L2 or Min-max normalization are sensitive to these differences, leading to suboptimal rankings. RRF sidesteps this issue by emphasizing rank consistency rather than absolute score alignment.

* **Example:** In multimodal search pipelines, where text-based queries generate wide score ranges, and visual features produce narrower ranges, RRF prevents smaller-scale signals from being overshadowed.

#### Sparse behavioral signals in e-commerce
E-commerce datasets often include sparse behavioral signals, such as user clicks or purchases, which disproportionately benefit from rank-based aggregation.
* **Example:** Merging behavioral data with metadata, RRF highlights niche products ranked highly in semantic or metadata relevance, even with limited engagement data—an area where L2 and Min-max struggle to balance sparse signals.

#### Noisy or outlier-prone data
Datasets with high variance or outliers—such as scientific research or log data—challenge score-based methods like Min-max or L2 normalization. By focusing solely on rank positions, RRF avoids distortions introduced by outliers.
* **Example:** In scientific datasets, where metadata from top-tier journals often skews scores, RRF integrates these results without overemphasizing outliers, ensuring more balanced and relevant rankings.

#### Dynamic or evolving data
Streaming data or rapidly changing datasets often necessitate recalibration for L2 and Min-max normalization, which can introduce latency or instability. RRF maintains stable rankings by aggregating based on static rank positions.
* **Example:** In log search pipelines, RRF ensures consistent prioritization of frequently occurring patterns, even as scoring distributions evolve.

### Example Scores
These scores were calculated from the same query using a standard hybrid search pipeline with min_max and arithmetic_mean compared against an RRF hybrid search pipeline. The top three and bottom three results from the query were selected.  The RRF scores show greater consistency across all documents because they are based on document position rather than raw scoring values.

| Min_Max and Arithmetic Mean | RRF      |
|-----------------------------|----------|
| 0.5	                        | 0.01639  |
| 0.29481                     | 	0.01613 |
| 0.28132                     | 	0.01587 |
| 0.01396                     | 	0.01471 |
| 0.00386                     | 	0.01449 |
| 0.0005	                     | 0.01429  |

## How does RRF work?
First, the documents are sorted on each shard by score for every query within the hybrid search:

![Initial document scores on each shard](/assets/media/blog-images/2025-02-04-introducing-reciprocal-rank-fusion-hybrid-search/RRFInitialShardScores.png){: .img-fluid}

Next, the documents are ranked by score for each query:

![Document rankings for each query](/assets/media/blog-images/2025-02-04-introducing-reciprocal-rank-fusion-hybrid-search/RRFQueryDocRankings.png){: .img-fluid}

The general formula for RRF, where k = rank constant and query_j_rank is the ranking for a document when it is returned in a query method in hybrid query, is as follows:
```
rankScore(document_i) = sum((1/(k + query_1_rank), (1/(k + query_2_rank), ..., (1/(k + query_j_rank))
```

The inner calculation of this formula is applied with the rankings displayed in the diagram above.  In this case, we will use the default rank constant of 60.

![Application of the inner calculation of the RRF formula](/assets/media/blog-images/2025-02-04-introducing-reciprocal-rank-fusion-hybrid-search/RRFNormalization.png){: .img-fluid}

Finally, we combine the rank calculations and execute the sum function in the formula above, sorting by rank score in decreasing order.

![Final rank score calculations](/assets/media/blog-images/2025-02-04-introducing-reciprocal-rank-fusion-hybrid-search/RRFFinalScoreCalculations.png){: .img-fluid}

The top results are then returned based on the size of the query.

## How to use RRF?
The only change necessary to use RRF is to create a search pipeline with RRF as the specified technique:
```json
PUT /_search/pipeline/rrf-pipeline
{
  "description": "Post processor for hybrid RRF search",
  "phase_results_processors": [
    {
      "score-ranker-processor": {
        "combination": {
          "technique": "rrf"
        }
      }
    }
  ]
}
```
The rank constant can be specified as part of the pipeline but cannot be less than 1.  Larger rank constants make the scores more uniform, reducing the impact of top ranks. Smaller rank constants create steeper differences between ranks, giving much more weight to top-ranked items. By default, rank constant is set to 60 if not specified. 
```json
PUT /_search/pipeline/rrf-pipeline
{
  "description": "Post processor for hybrid RRF search",
  "phase_results_processors": [
    {
      "score-ranker-processor": {
        "combination": {
          "technique": "rrf",
          "rank_constant": 40
        }
      }
    }
  ]
}
```
Next, create a standard hybrid query:
```json
POST my_index/_search?search_pipeline=rrf-pipeline
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
## Benchmarks
Benchmark experiments were conducted using an OpenSearch cluster, consisting of a single r6g.8xlarge instance serving as the coordinator node, complemented by three r6g.8xlarge instances functioning as data nodes. To comprehensively assess RRF performance, we measured three critical metrics across six distinct datasets.  The exact datasets used can be found [here](https://public.ukp.informatik.tu-darmstadt.de/thakur/BEIR/datasets/). Search relevance was quantified using the industry-standard Normalized Discounted Cumulative Gain at rank 10 (NDCG@10), while system performance was tracked through search latency measurements. Additionally, we monitored CPU utilization to understand resource consumption patterns during the experiments. This configuration provided a robust foundation for evaluating both search quality and operational efficiency.

### NDCG@10:
|            | BM25     | Neural  | Hybrid  | Hybrid with RRF | Percent Difference |
|------------|----------|---------|---------|-----------------|--------------------|
| Nfcorpus   | 	0.3065  | 	0.2174 | 	0.3076 | 	0.2977         | 	3.22%             |
| Arguana    | 	0.4258  | 	0.4239 | 	0.4507 | 	0.4476         | 	0.69%             |
| fiqa	      | 0.2389	  | 0.2004	 | 0.2693  | 	0.2474         | 	8.13%             |
| Trec-covid | 	0.6087	 | 0.2718  | 	0.5905 | 	0.5877         | 	0.47%             |
| Scidocs    | 	0.155   | 	0.1075 | 	0.1602 | 	0.1525         | 	4.81%             |
| Quora	     | 0.7424	  | 0.8256	 | 0.8452	 | 0.796	          | 5.82%              |
|            |          |         |         | **Average:**	   | 3.86%              |

### Search latency (ms):
<table>
  <tr>
    <th></th>
    <th colspan="3"><b>P50</b></th>
    <th colspan="3"><b>P90</b></th>
    <th colspan="3"><b>P99</b></th>
  </tr>
  <tr>
    <td></td>
    <td><b>Hybrid</b></td>
    <td><b>RRF</b></td>
    <td><b>Percent Difference</b></td>
    <td><b>Hybrid</b></td>
    <td><b>RRF</b></td>
    <td><b>Percent Difference</b></td>
    <td><b>Hybrid</b></td>
    <td><b>RRF</b></td>
    <td><b>Percent Difference</b></td>
  </tr>
  <tr>
    <td>NFCorpus</td>
    <td>71</td>
    <td>67.5</td>
    <td>4.93%</td>
    <td>95</td>
    <td>89.9</td>
    <td>5.37%</td>
    <td>112.84</td>
    <td>109.56</td>
    <td>2.91%</td>
  </tr>
  <tr>
    <td>Arguana</td>
    <td>390.5</td>
    <td>390</td>
    <td>0.13%</td>
    <td>423.5</td>
    <td>424</td>
    <td>-0.12%</td>
    <td>459.475</td>
    <td>458.5</td>
    <td>0.21%</td>
  </tr>
  <tr>
    <td>Fiqa</td>
    <td>109</td>
    <td>105.25</td>
    <td>3.44%</td>
    <td>139.65</td>
    <td>137.5</td>
    <td>1.54%</td>
    <td>165.76</td>
    <td>160.79</td>
    <td>3.00%</td>
  </tr>
  <tr>
    <td>Trec-covid</td>
    <td>165.5</td>
    <td>159.75</td>
    <td>3.47%</td>
    <td>209.5</td>
    <td>203.6</td>
    <td>2.82%</td>
    <td>240.73</td>
    <td>237.78</td>
    <td>1.23%</td>
  </tr>
  <tr>
    <td>Scidocs</td>
    <td>103</td>
    <td>103.5</td>
    <td>-0.49%</td>
    <td>126.5</td>
    <td>126.05</td>
    <td>0.36%</td>
    <td>156.02</td>
    <td>159.015</td>
    <td>-1.92%</td>
  </tr>
  <tr>
    <td>Quora</td>
    <td>167</td>
    <td>170</td>
    <td>-1.80%</td>
    <td>209.5</td>
    <td>212.55</td>
    <td>-1.46%</td>
    <td>264.5</td>
    <td>266.51</td>
    <td>-0.76%</td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td><b>Average:</b></td>
    <td>1.62%</td>
    <td></td>
    <td><b>Average:</b></td>
    <td>1.42%</td>
    <td></td>
    <td><b>Average:</b></td>
    <td>0.78%</td>
  </tr>
</table>

### CPU utilization on coordinator node
|            | Hybrid  | RRF          | Percent Difference |
|------------|---------|--------------|--------------------|
| NFCorpus	  | 0.783%  | 	0.838%      | 	0.055%            |
| ArguAna	   | 0.844%	 | 0.853%       | 	0.008%            |
| Fiqa	      | 0.835%	 | 0.851%       | 	0.016%            |
| Trec-covid | 	1.406% | 	0.979%      | 	-0.427%           |
| Scidocs	   | 0.745%	 | 0.873%       | 	0.128%            |
| Quora	     | 1.054%	 | 1.076%       | 	0.022%            |
|            |         | **Average:** | -0.033%            |

## Conclusions
Our benchmark experiments reveal insight into RRF's trade-offs and advantages compared to conventional hybrid search approaches:
* Search Quality 
  * Measured across six datasets using NDCG@10 metrics
  * RRF scores 3.86% lower than traditional score-centric methods
* Latency
  * RRF consistently outperforms traditional normalization techniques\
  
|     | **Percent Faster** |
|-----|--------------------|
| P50 | 1.62%              |
| P90 | 1.42%              |
| P99 | 0.78%              |

* Resource Efficiency
  * Coordinator Node: Similar CPU usage
  * All node types: More efficient resource distribution across the system

RRF emerges as a compelling alternative to traditional hybrid search methods, offering enhanced performance and resource efficiency with only a marginal impact on search quality. The significant latency improvements make it particularly suitable for high-throughput search applications.

## Next Steps for Hybrid Search
With the introduction of this new feature, our roadmap for RRF includes several important enhancements:
* **Customizable Weights**
  * We plan to implement weight support similar to score-based ranking techniques, allowing more nuanced control over the ranking algorithm.
  * https://github.com/opensearch-project/neural-search/issues/1152
* **Better Handling of Missing Items**
  * Currently, missing items default to a score of 0.0, but this may not be optimal for all use cases. We're exploring multiple approaches for handling missing items, such as configurable default values, the option to use `max_rank + 1` for missing items, or the ability to completely ignore missing items in calculations
  * https://github.com/opensearch-project/neural-search/issues/1153

We are also working to enhance OpenSearch's hybrid search capabilities beyond RRF with two significant improvements to our normalization framework:

* **Z-Score Normalization Implementation**
  * Adds the popular z-score normalization technique
  * [View Implementation Details](https://github.com/opensearch-project/neural-search/pull/470)
* **Custom Normalization Functions**
  * Enables users to define their own normalization logic
  * Allows fine-tuning of search result ranking
  * [Track Development Progress](https://github.com/opensearch-project/neural-search/issues/994)

These improvements will give developers more control over search result ranking while ensuring reliable and consistent hybrid search outcomes. Stay tuned for more information!

## References

1. [[RFC] Design for Incorporating Reciprocal Rank Fusion into Neural Search](https://github.com/opensearch-project/neural-search/issues/865)
2. [Beir benchmarking for Information Retrieval](https://github.com/beir-cellar/beir)
3. [Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
4. [Risk-Reward Trade-offs in Rank Fusion](https://rodgerbenham.github.io/bc17-adcs.pdf)
5. [The ABCs of semantic search in OpenSearch: Architectures, benchmarks, and combination strategies](https://opensearch.org/blog/semantic-science-benchmarks)
6. [Improve search relevance with hybrid search, generally available in OpenSearch 2.10](https://opensearch.org/blog/hybrid-search/)
7. [[RFC] High Level Approach and Design For Normalization and Score Combination](https://github.com/opensearch-project/neural-search/issues/126)
