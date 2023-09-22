---
layout: post
title:  Hybrid search is generally available in OpenSearch 2.10
authors:
  - gaievski
  - navneev
  - kolchfa
date: 2023-09-21
categories:
  - technical-posts
meta_keywords: 
meta_description: 
has_science_table: true
---

In an earlier [blog post](https://opensearch.org/blog/semantic-science-benchmarks), a group of Amazon scientists and engineers described methods of combining keyword-based search with dense vector search in order to improve search relevance. With OpenSearch 2.10, you can tune your search relevance by using hybrid search, which combines and normalizes query relevance scores. In this post, we’ll describe what hybrid search is and how to use it and demonstrate how it improves relevance.


## Combining lexical and semantic search

The OpenSearch search engine supports both lexical and semantic search. Each of these techniques has its advantages and disadvantages, so it is natural to try to combine them so that they complement each other.

The naive approach to combination---an arithmetic combination of the scores returned by each system---doesn’t work:

* Different query types provide scores on different scales. For instance, a full-text `match` query score can be any positive number, while a `knn` or `neural-search` query score is typically between 0.0 and 1.0. 
* OpenSearch normally calculates scores at the shard level. However, there still needs to be a global normalization of scores coming from all shards. 

## The naive approach

Before OpenSearch 2.10, you could attempt combining text search and neural search results by using one of the [compound query types](https://opensearch.org/docs/latest/query-dsl/compound/index/). However, this approach does not work well.

To demonstrate why that is, consider searching a database of images for the [Washington/Wells station](https://en.wikipedia.org/wiki/Washington/Wells_station), a train station on the Chicago "L" system. You may start by searching for the text "Washington Wells station" and combining `neural` and `match` queries as Boolean query clauses:

```json
"query": {
    "bool": {
      "should": [
        {
          "match": {
            "text": {
              "query": "Washington Wells station"
            }
          }
        },
        {
          "neural": {
            "passage_embedding": {
              "query_text": "Washington Wells station",
              "model_id": "3JjYbIoBkdmQ3A_J4qB6",
              "k": 100
            }
          }
        }
      ]
    }
  }
```

In this example, the `match` query scores are in the [8.002, 11.999] range and the `neural` query scores are in the [0.014, 0.016] range, so the `match` query scores dominate the `neural` query scores. As a result, the `neural` query has little to no effect on the final scores, which are in the [8.019, 11.999] range. In the following image, note that the Boolean query results (right) are the same as the BM25 `match` query results (center) and do not include any matches from the `neural` query (left).

![Comparison of search results for semantic search, text search, and Boolean query](/assets/media/blog-images/2023-09-21-hybrid-search/boolean-comparison.png){: .img-fluid}

Combining a neural query with other compound queries suffers from the same problem because of the difference in the scales.

Ideally, search results would prioritize the first match from the BM25 query (the Washington/Wells station) followed by other train stations.

## Combining query clauses with hybrid search

Let's recall the problems with the naive approach: scores being on different scales and a shard being unaware of another shard’s results. The first problem can be solved by normalizing scores and the second, by combining scores from all shards. We need a query type that should execute queries (in our example, the text search and neural query) separately and collect shard-level query results. Query results from all shards should be collected in one place, normalized for each query separately, and then combined into a final list. This is exactly what we proposed in the  [hybrid query search RFC](https://github.com/opensearch-project/neural-search/issues/126).

At a high level, hybrid search consists of two main elements:

    * The **hybrid query** provides a way to define multiple individual queries, execute those queries and collect results from each shard.
    * The **normalization processor**, which is part of a search pipeline, collects the results from all shards at the coordinator node level, normalizes scores for each of the queries, and combines scores into the final result. 

The following diagram shows how hybrid search works at a high level. During the query phase, the coordinator node sends queries to multiple data nodes, where the results are collected. When the query phase finishes, the normalization processor normalizes and combines the results from all queries and all nodes. The overall results are sent to a fetch phase, which retrieves the document content. 

![Score normalization and combination flow diagram](/assets/media/blog-images/2023-09-21-hybrid-search/normalization-combination-diagram.png){: .img-fluid}

You can observe hybrid search in action by using it to search for images of the Washington/Wells station:

```json
"query": {
    "hybrid": {
      "queries": [
        {
          "match": {
            "text": {
              "query": "Washington Wells station"
            }
          }
        },
        {
          "neural": {
            "passage_embedding": {
              "query_text": "Washington Wells station",
              "model_id": "3JjYbIoBkdmQ3A_J4qB6",
              "k": 5
            }
          }
        }
      ]
    }
  }
``` 
 
The following image shows the results generated by the hybrid query, which combine the most relevant matches from both the BM25 query (featuring an image of the Washington/Wells station) and the neural query (showcasing other train stations).

![Hybrid search results](/assets/media/blog-images/2023-09-21-hybrid-search/hybrid-search.png){: .img-fluid}

## Benchmarking score accuracy and performance

To benchmark score accuracy and performance of hybrid search, we chose 7 datasets that cover different domains and vary in the main dataset parameters, such as query number and document length. Running benchmarks on the same datasets as in the [earlier blog post](https://opensearch.org/blog/semantic-science-benchmarks) allowed us to use the previous data as a baseline. 

We built the hybrid query as a combination of two queries: a neural search query and a text search `match` query. 

For the neural query, we generated text embeddings using [neural search data ingestion](https://opensearch.org/docs/latest/search-plugins/neural-search/#ingest-data-with-neural-search). We used pretrained and fine-tuned transformers to generate embeddings and run search queries. For the HNSW algorithm in k-NN search we used k = 100.

For text search, we used a text field with one analyzer (`english`). 

The cluster configuration consisted of 3 `r5.8xlarge` data nodes and 1 `c4.2xlarge` leader node. All scripts that we used for benchmarks can be found in [this repository](https://github.com/martin-gaievski/info-retrieval-test/tree/score-normalization-combination-testing).

### Score accuracy results

To benchmark score accuracy, we chose the [nDCG@10](https://en.wikipedia.org/wiki/Discounted_cumulative_gain) metric because it’s widely used to measure search relevance. The following table displays the benchmarking results. 

|	|BM25	|**TAS-B**	|Theoretical baseline	|Hybrid query	|Fine-tuned transformer	|Theoretical baseline, fine-tuned	|Hybrid query, fine-tuned	|
|---	|---	|---	|---	|---	|---	|---	|---	|
|nfcorpus	|0.3208	|0.3155	|0.357	|0.3293	|0.301	|0.37	|0.3433	|
|trec-covid	|0.6789	|0.4986	|0.731	|0.7376	|0.577	|0.79	|0.765	|
|scidocs	|0.165	|0.149	|0.17	|0.173	|0.154	|0.184	|0.1808	|
|quora	|0.789	|0.835	|0.847	|0.8649	|0.855	|0.874	|0.8742	|
|amazon esci	|0.081	|0.071	|0.088	|0.088	|0.074	|0.091	|0.0913	|
|dbpedia	|0.313	|0.384	|0.395	|0.391	|0.342	|0.392	|0.3742	|
|fiqa	|0.254	|0.3	|0.289	|0.3054	|0.314	|0.364	|0.3383	|
|**average % change vs. BM25**	|	|**-6.97%**	|**7.85%**|**8.12%**	|**-2.34%**	|**14.77%**	|**12.08%**	|

### Score performance results

For performance benchmarks, we measured the time it took to process a query on the server, in milliseconds. The following table displays the benchmarking results. 

<table>
    <tr>
        <td></td>
        <td colspan="3"><b>p50</b></td>
        <td colspan="3"><b>p90</b></td>
        <td colspan="3"><b>p99</b></td>
    </tr>
    <tr>
        <td></td>
        <td><b>Boolean query (baseline)</b></td>
        <td><b>Hybrid query</b></td>
        <td><b>Difference, ms</b></td>
        <td><b>Boolean query (baseline)</b></td>
        <td><b>Hybrid query</b></td>
        <td><b>Difference, ms</b></td>
        <td><b>Boolean query (baseline)</b></td>
        <td><b>Hybrid query</b></td>
        <td><b>Difference, ms</b></td>
    </tr>
    <tr>
        <td>nfcorpus</td>
        <td>35.1</td>
        <td>37</td>
        <td>1.9</td>
        <td>53</td>
        <td>54</td>
        <td>1</td>
        <td>60.8</td>
        <td>62.3</td>
        <td>1.5</td>
    </tr>
    <tr>
        <td>trec-covid</td>
        <td>58.1</td>
        <td>61.6</td>
        <td>3.5</td>
        <td>66.4</td>
        <td>70</td>
        <td>3.6</td>
        <td>70.5</td>
        <td>74.6</td>
        <td>4.1</td>
    </tr>
    <tr>
        <td>scidocs</td>
        <td>54.9</td>
        <td>57</td>
        <td>2.1</td>
        <td>66.4</td>
        <td>68.6</td>
        <td>2.2</td>
        <td>81.3</td>
        <td>83.2</td>
        <td>1.9</td>
    </tr>
    <tr>
        <td>quora</td>
        <td>61</td>
        <td>69</td>
        <td>8</td>
        <td>69</td>
        <td>78</td>
        <td>9</td>
        <td>73.4</td>
        <td>84</td>
        <td>10.6</td>
    </tr>
    <tr>
        <td>amazon esci</td>
        <td>49</td>
        <td>50</td>
        <td>1</td>
        <td>58</td>
        <td>59.4</td>
        <td>1.4</td>
        <td>67</td>
        <td>70</td>
        <td>3</td>
    </tr>
    <tr>
        <td>dbpedia</td>
        <td>100.8</td>
        <td>107.7</td>
        <td>6.9</td>
        <td>117</td>
        <td>130.9</td>
        <td>13.9</td>
        <td>129.8</td>
        <td>150.2</td>
        <td>20.4</td>
    </tr>
    <tr>
        <td>fiqa</td>
        <td>53.9</td>
        <td>56.9</td>
        <td>3</td>
        <td>61.9</td>
        <td>65</td>
        <td>3.1</td>
        <td>64</td>
        <td>67.7</td>
        <td>3.7</td>
    </tr>
    <tr>
        <td><b>% change vs. Boolean</b></td>
        <td colspan="3"><b>6.40%</b></td>
        <td colspan="3"><b>6.96%</b></td>
        <td colspan="3"><b>8.27%</b></td>
    </tr>
</table>

As shown in the preceding table, hybrid search improves the result quality by 8&ndash;12% compared to keyword search and by 15% compared to natural language search. Simultaneously, a hybrid query exhibits a 6&ndash;8% increase in latency compared to a Boolean query when executing the same inner queries. 

Our experimental findings indicate that the extent of improvement in score relevance is contingent upon the size of the sampled data. For instance, the most favorable results are observed when `size` is in the [100 .. 200] range, whereas larger values of `size` do not enhance relevance but adversely affect latency.

## How to use hybrid query 

Hybrid search is generally available starting with OpenSearch 2.10, no additional settings are required.

Before you can use hybrid search, create a search pipeline with the normalization processor:

```json
PUT /_search/pipeline/norm-pipeline
{
  "description": "Post-processor for hybrid search",
  "phase_results_processors": [
    {
      "normalization-processor": {
        "normalization": {
          "technique": "l2"
        },
        "combination": {
          "technique": "arithmetic_mean"
        }
      }
    }
  ]
}
```

The normalization processor supports the followings techniques:

* `min-max` and `l2` for score normalization
* `arithmetic mean` , `geometric mean`, and `harmonic mean` for score combination

You can set additional parameters for score combination to define weights for each query clause. Additionally, you can create multiple search pipelines, each featuring distinct normalization processor configurations, as dictated by your specific needs. For more details on supported techniques and their definitions, see and [Normalization processor](https://opensearch.org/docs/latest/search-plugins/search-pipelines/normalization-processor/).

To run a hybrid query, use the following syntax:

```json
POST my_index/_search?search_pipeline=<search_pipeline>
{
   "query": {
     "hybrid": [
         {},// First Query
         {} // Second Query
         ..... // Other Queries
     ] 
   }
}
```

For example, the following hybrid query combines a `match` query with a `neural` query to search for the same text: 

```json
POST my_index/_search?search_pipeline=norm-pipeline
{
  "_source": {
    "exclude": [
      "passage_embedding"
    ]
  },
  "query": {
    "hybrid": {
      "queries": [
        {
          "match": {
            "title_key": {
              "query": "Do Cholesterol Statin Drugs Cause Breast Cancer"
            }
          }
        },
        {
          "neural": {
            "passage_embedding": {
              "query_text": "Do Cholesterol Statin Drugs Cause Breast Cancer",
              "model_id": "1234567890",
              "k": 100
            }
          }
        }
      ]
    }
  },
  "size": 10
}
```

For more details and examples of hybrid search, see [Hybrid query](https://opensearch.org/docs/latest/query-dsl/compound/hybrid/).

## Conclusion

In this blog, we have included series of experiments that show that hybrid search produces results that are very close to theoretical expectations and in most cases are better than the results of individual queries alone. Hybrid search comes with a certain increase in latency, which will be addressed in future versions (you can track the progress of this enhancement in [this Github issue](https://github.com/opensearch-project/neural-search/issues/279)).

It’s important to remember that datasets have different parameters and for some datasets hybrid search may not consistently improve results. Additionally, experiments with different parameters&mdash;for instance, setting higher values of `k` or use different `space type` for neural search&mdash;may produce better results. 

We’ve seen that some of the conclusions may be applied to most datasets:

* For semantic search, hybrid query with normalization produces better results compared to neural search or text search alone.
* The combination of `min-max` score normalization and `arithmetic_mean` score combination achieves the best results, compared to other techniques.
* In most cases, increasing the value of `k` in k-NN data type leads to better results up to a certain point, but after that there is no increase in relevance. At the same time, high values of `k` increase search latency, so from our observations, it’s better to choose the value of `k` between 100 and 200. 
* We have seen best results when `innerproduct` is specified as a space type for k-NN vector fields. This may be because our models were trained using the inner product similarity function.
* An increase in search relevance comes with a cost of a 6&ndash;8% increase in latency, which should be acceptable in most cases.

In general, as our experiments demonstrated, hybrid search produces results that are very close to the ones described by the science team, so [all their conclusions](https://opensearch.org/blog/semantic-science-benchmarks/#section-5-strengths-and-limitations) are applicable to hybrid search. 

## Next steps

We have identified several areas of improvement for hybrid search, and we’re planning to work on them for the future OpenSearch releases. In the short term, a good starting point is to improve performance by running individual queries of the main hybrid query in parallel instead of sequentially. This should significantly improve latency, especially when all inner queries have similar running times. We are considering the following improvements for the future releases:

* Executing individual queries in parallel.
* Adding more configuration options and parameters to the normalization processor to allow more control over combined results. For instance, we can add the ability to specify a minimal score for documents to be returned in the results, which will avoid returning non-competitive hits. 
* Supporting results pagination
* Supporting filters in the hybrid query clause. It’s possible to define a filter for each inner query individually, but it’s not optimal if a filter condition is the same for all inner queries.
* Adding more benchmark results for larger datasets so we can provide recommendations for using hybrid search in various configurations. 

## Dataset statistics

The following table provides further details of the test datasets used for benchmarking. 

|Dataset	|Average query length	|Average query length	|Average query length	|Average query length	|Average query length	|Average query length	|
|---	|---	|---	|---	|---	|---	|---	|
|NFCorpus	|3.29	|2	|22.098	|224	|3633	|323	|
|Trec-Covid	|10.6	|10	|148.64	|155	|171332	|50	|
|Scidocs	|9.44	|9	|167.24	|151	|25657	|1000	|
|Quora	|9.531	|9	|11.46	|10	|522931	|10000	|
|Amazon ESCI	|3.89	|4	|179.87	|137	|482105	|8956	|
|DBPedia	|5.54	|5	|46.89	|47	|4635922	|400	|
|FiQA	|10.94	|10	|132.9	|90	|57638	|648	|

## References

1. The ABCs of semantic search in OpenSearch: Architectures, benchmarks, and combination strategies, https://opensearch.org/blog/semantic-science-benchmarks.
2. [RFC] High Level Approach and Design For Normalization and Score Combination, https://github.com/opensearch-project/neural-search/issues/126.
3. Building a semantic search engine in OpenSearch, https://opensearch.org/blog/semantic-search-solutions/.
4. An Analysis of Fusion Functions for Hybrid Retrieval, https://arxiv.org/abs/2210.11934.
5. Beir benchmarking for Information Retrieval https://github.com/beir-cellar/beir.

