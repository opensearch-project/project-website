---
layout: post
title:  Understanding vector radial search in OpenSearch
authors:
  - junqiu
  - vamshin
  - dylantong
date: 2024-06-20
categories:
    - technical-posts
meta_keywords: vector radial search, OpenSearch k-NN plugin, k-NN search, neural search
meta_description: Discover how vector radial search enhances the capabilities of the OpenSearch k-NN plugin and increases flexibility and utility in search operations.
has_science_table: true
featured_blog_post: true 
featured_image: false # /assets/media/blog-images/__example__image__name.jpg
---

Before OpenSearch version 2.14, the OpenSearch k-NN plugin only provided top K queries for approximate vector similarity search. OpenSearch 2.14 introduced a new type of vector search---_radial search_. Radial search is now supported in both [k-NN search]((https://opensearch.org/docs/latest/search-plugins/knn/radial-search-knn/)) and [neural search](https://opensearch.org/docs/latest/query-dsl/specialized/neural/).

Radial search enhances the capabilities of the OpenSearch k-NN plugin beyond approximate top K searches. With radial search, you can search for all points in a vector space that are within a specified maximum distance or minimum score threshold from a query point. This provides increased flexibility and utility in search operations. 

For instance, if you want to search for documents most similar to a given document, you can run a query to retrieve the top K most similar documents (where K = top N). However, if K is not chosen optimally, you might receive irrelevant results or miss relevant ones. With vector radial search, you can run a query to retrieve all highly similar documents by using a threshold (for example, similarity score > 0.95).

## Defining the search radius

You can define the search radius in the following ways:

- **Maximum distance**: Specify a physical distance threshold within the vector space, identifying all points that are within this distance from the query point. This approach is particularly useful for applications requiring spatial proximity or absolute distance measurements.

    The following image shows an example of radial search with the [L2 space type](https://opensearch.org/docs/latest/search-plugins/knn/radial-search-knn/#spaces) and `max_distance` = 25.0. The number within each circle represents the distance of the point from the query target. All points within the `max_distance` of 25.0 are included in the results.

    <img src="/assets/media/blog-images/2024-06-20-vector-radial-search/radial-search-with-max-distance.png" alt="Radial search with max distance" class="center"/>{:style="width: 100%; max-width: 800px; height: auto; text-align: center"}

- **Minimum score**: Define a similarity score threshold, retrieving all points that meet or exceed that score in relation to your query point. This is useful when relative similarity, based on a specific metric, is more critical than physical proximity. 
   
    The following image shows an example of radial search with `min_score`= 0.90. The number within each circle represents the point's OpenSearch score relative to the query target. All points whose score is 0.90 or above are included in the results.

    <img src="/assets/media/blog-images/2024-06-20-vector-radial-search/radial-search-with-min-score.png" alt="Radial search with min score" class="center"/>{:style="width: 100%; max-width: 800px; height: auto; text-align: center"}

## When to use radial search

Use radial search instead of top K vector search in the following scenarios:

* **Proximity-based filtering**: When you need to find all items within a specific distance from a query point. Unlike traditional k-NN searches that return a fixed number of top results,
radial search allows you to find all items that fall within a specified distance threshold.
* **Threshold-specific queries**: When you need to make sure that only items that meet your criteria are included in the results. Radial search lets you define specific similarity or distance thresholds, which is essential for tasks like anomaly detection and geospatial searches.
* **Dynamic range adjustments:** When the acceptable similarity or distance range can vary. Radial search offers more flexible search results.

## Supported configurations

Starting in OpenSearch 2.14, you can perform radial search with either the Lucene or Faiss engines using the OpenSearch k-NN plugin. The following table summarizes radial search use cases by engine.

|Engine	|Filter supported	|Nested field supported	|Search type	|
|---	|---	|---	|---	|
|Lucene	|Yes	|No	|Approximate	|
|Faiss	|Yes	|Yes	|Approximate	|

## Spaces

A space corresponds to the function used to measure the distance between two points in order to determine the k-nearest neighbors. For more information about how distance and score are calculated for various spaces, see [Spaces](https://opensearch.org/docs/latest/search-plugins/knn/radial-search-knn/#spaces).

## Start using vector radial search

The following examples can help you get started with radial search.

### Prerequisites

To use a k-NN index with radial search, create a k-NN index by setting `index.knn` to `true`. Specify one or more fields of the `knn_vector` data type:

```json
PUT knn-index-test
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "index.knn": true
  },
  "mappings": {
    "properties": {
      "my_vector": {
        "type": "knn_vector",
        "dimension": 2,
        "method": {
            "name": "hnsw",
            "space_type": "l2",
            "engine": "faiss",
            "parameters": {
              "ef_construction": 100,
              "m": 16,
              "ef_search": 100
            }
          }
      }
    }
  }
}
```

After you create the index, add some data to it:

```json
PUT _bulk?refresh=true
{"index": {"_index": "knn-index-test", "_id": "1"}}
{"my_vector": [7.0, 8.2], "price": 4.4}
{"index": {"_index": "knn-index-test", "_id": "2"}}
{"my_vector": [7.1, 7.4], "price": 14.2}
{"index": {"_index": "knn-index-test", "_id": "3"}}
{"my_vector": [7.3, 8.3], "price": 19.1}
{"index": {"_index": "knn-index-test", "_id": "4"}}
{"my_vector": [6.5, 8.8], "price": 1.2}
{"index": {"_index": "knn-index-test", "_id": "5"}}
{"my_vector": [5.7, 7.9], "price": 16.5}
```

### Radial search with a max distance and a filter

The following example shows a radial search with a `max_distance` and a filter:

```json
GET knn-index-test/_search
{
  "query": {
    "knn": {
      "my_vector": {
        "vector": [7.1, 8.3],
        "max_distance": 2,
        "filter": {
          "range": {
            "price": {
              "gte": 1,
              "lte": 5
            }
          }
        }
      }
    }
  }
}
```

All documents that fall within the squared Euclidean distance (L2<sup>2</sup>) of 2 and whose price is within the 1--5 range are returned in the results:

```json
{
    ...
    "hits": {
        "total": {
            "value": 2,
            "relation": "eq"
        },
        "max_score": 0.98039204,
        "hits": [
            {
                "_index": "knn-index-test",
                "_id": "1",
                "_score": 0.98039204,
                "_source": {
                    "my_vector": [7.0,8.2],
                    "price": 4.4
                }
            },
            {
                "_index": "knn-index-test",
                "_id": "4",
                "_score": 0.62111807,
                "_source": {
                    "my_vector": [6.5,8.8],
                    "price": 1.2
                }
            }
        ]
    }
}
```

### Radial search with a min score and a filter

The following example shows a radial search with a `min_score` and a response filter:

```json
GET knn-index-test/_search
{
    "query": {
        "knn": {
            "my_vector": {
                "vector": [7.1, 8.3],
                "min_score": 0.95,
                "filter": {
                    "range": {
                        "price": {
                            "gte": 1,
                            "lte": 5
                        }
                    }
                }
            }
        }
    }
}
```

All documents with a score of 0.9 or higher and whose price is within the 1--5 range are returned in the results:

```json
{
    ...
    "hits": {
        "total": {
            "value": 1,
            "relation": "eq"
        },
        "max_score": 0.98039204,
        "hits": [
            {
                "_index": "knn-index-test",
                "_id": "1",
                "_score": 0.98039204,
                "_source": {
                    "my_vector": [7.0, 8.2],
                    "price": 4.4
                }
            }
        ]
    }
}
```

## Neural search with vector radial search

Neural search also supports radial search. Here are some radial search neural query examples.

The following example shows a search with a `k` value of `100` and a filter that includes a range query and a term query:

```json
GET /my-nlp-index/_search
{
  "query": {
    "neural": {
      "passage_embedding": {
        "query_text": "Hi world",
        "query_image": "iVBORw0KGgoAAAAN...",
        "k": 100,
        "filter": {
          "bool": {
            "must": [
              {
                "range": {
                  "rating": {
                    "gte": 8,
                    "lte": 10
                  }
                }
              },
              {
                "term": {
                  "parking": "true"
                }
              }
            ]
          }
        }
      }
    }
  }
}
```

The following example shows a k-NN radial search with a `min_score` of `0.95` and the same filter as the preceding query:

```json
GET /my-nlp-index/_search
{
  "query": {
    "neural": {
      "passage_embedding": {
        "query_text": "Hi world",
        "query_image": "iVBORw0KGgoAAAAN...",
        "min_score": 0.95,
        "filter": {
          "bool": {
            "must": [
              {
                "range": {
                  "rating": {
                    "gte": 8,
                    "lte": 10
                  }
                }
              },
              {
                "term": {
                  "parking": "true"
                }
              }
            ]
          }
        }
      }
    }
  }
}
```

## Benchmarks

We ran radial search benchmarks using the following cluster configuration.

|OpenSearch version	|Leader nodes	|Leader node type	|Leader node disk space	|Data nodes	|Data node type	|Data node disk space	|Primary shard count	|Replica count	|Availability Zone	|Test client type	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|2.14	|3	|c6g.xlarge	|50 GB	|3	|r6g.2xlarge	|100 GB	|3	|1	|us-east-1	|m5.2xlarge	|

### Benchmark tool

For benchmarking, we used [OpenSearch Benchmark](https://opensearch.org/docs/latest/benchmark/).

### Dataset

We used the following dataset for benchmarking.

|Name	|Dimension	|Doc size	|Query size	|Space type	|
|---	|---	|---	|---	|---	|
|cohere-wikipedia-22-12-en-embeddings	|768	|1M	|10k	|Inner product	|

The dataset was updated to include the top K threshold values and true neighbors for the radial threshold. In our benchmarks, top K refers to the number of nearest neighbors considered when setting the minimum score and maximum distance thresholds for radial search. For instance, a top K 100 setting means that we used the 100th closest document to a query point to determine these thresholds. The following table summarizes the threshold configuration.

|Threshold name	|Min score threshold	|Median num of true neighbors	|Average num of true neighbors	|Num of query targets with 0 neighbors	|
|---	|---	|---	|---	|---	|
|threshold1	|161	|118	|83.1888	|4048	|
|threshold2	|156	|1186	|421.8486	|1661	|
|threshold3	|154	|2959	|778.0673	|941	|

### Algorithm

The algorithm used was configured as follows.

|Algorithm name	|ef construction	|ef search	|hnsw m	|
|---	|---	|---	|---	|
|HNSW	|256	|256	|16	|

### Results

The following table presents the benchmarking results.

|Query threshold	|Engine type	|Query type	|Search: 50th percentile service time (ms)	|Search: 90th percentile service time (ms)	|Search: 99th percentile service time (ms)	|Recall	|
|---	|---	|---	|---	|---	|---	|---	|
|min score threshold1	|Faiss	|min_score	|6.24	|7.33	|11.11	|0.99	|
|min score threshold2	|Faiss	|min_score	|7.76	|13.58	|26.83	|0.98	|
|min score threshold3	|Faiss	|min_score	|6.89	|12.13	|25.59	|0.98	|
|min score threshold1	|Lucene	|min_score	|4.42	|17.01	|50.14	|0.85	|
|min score threshold2	|Lucene	|min_score	|13.02	|54.16	|118.65	|0.90	|
|min score threshold3	|Lucene	|min_score	|22.56	|84.5	|161.62	|0.92	|


## Summary

OpenSearch 2.14 introduced vector radial search, significantly expanding the capabilities of the k-NN plugin. This powerful feature allows searches based on distance or score thresholds, offering greater flexibility for various applications. Supported by both the Lucene and Faiss engines, radial search caters to diverse use cases. 

Try the examples in this blog post to improve your searches and boost performance using vector radial search. For more information about vector radial search, see the [Radial search documentation](https://opensearch.org/docs/latest/search-plugins/knn/radial-search-knn/).
