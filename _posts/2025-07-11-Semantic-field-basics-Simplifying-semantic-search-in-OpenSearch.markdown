---
layout: post
title: "Semantic field basics: Simplifying semantic search in OpenSearch"
layout: post
authors:
    - bzhangam
    - kolchfa
date: 2025-07-11
categories:
  - technical-posts
meta_keywords: semantic field, neural search, semantic search, dense embeddings, sparse embeddings, semantic vector search, OpenSearch 3.1
meta_description: Learn how to use the new semantic field in OpenSearch to simplify semantic search with pre-trained dense and sparse models. Automatically generate embeddings, index documents, and run neural search queries without a custom ingest pipeline.
---
The new `semantic` field type in OpenSearch 3.1 simplifies semantic search by automating vector embedding field creation and embedding generation at ingestion time.

Semantic search improves result relevance by using a machine learning (ML) model to generate dense or sparse vector embeddings from unstructured text. Traditionally, enabling semantic search has required several manual steps: defining an embedding field, setting up an ingest pipeline, and including the model ID in every query.

OpenSearch 3.1 streamlines this process with the `semantic` field type. Now, you only need to register and deploy your ML model, then reference its ID in the index mapping. OpenSearch handles the rest—automatically creating the necessary embedding field, generating embeddings during ingestion, and resolving the model during query execution.

![Diff of using semantic field](/assets/media/blog-images/2025-07-11-Semantic-field-basics-Simplifying-semantic-search-in-OpenSearch/semantic_field_future_state.png)

## How to use the semantic field

Here's a high-level overview of how to use it:

1. **Register and deploy a model.** Register and deploy a ML model, such as one from Hugging Face, in OpenSearch.
2. **Create an index with a semantic field.** Define an index mapping that includes a semantic field and link it to the model using its ID.
3. **Index documents.** Index raw text documents directly—OpenSearch will automatically generate and store the embeddings.
4. **Run a semantic search query.** Use a neural query to search semantically over your data without manually handling embeddings.

Each of these steps is detailed below.

### Step 1: Register and deploy a model

Begin by registering and deploying a text embedding model. For example, the following request registers a pre-trained sentence-transformers model from Hugging Face:

```http request
PUT _plugins/_ml/models/_register?deploy=true
{
  "name": "huggingface/sentence-transformers/all-MiniLM-L6-v2",
  "version": "1.0.2",
  "model_format": "TORCH_SCRIPT"
}
```

After deployment, retrieve the model's configuration to verify key details:

```http request
GET /_plugins/_ml/models/No0hhZcBnsM8JstbBkjQ
{
    "name": "huggingface/sentence-transformers/all-MiniLM-L6-v2",
    "model_group_id": "Lo0hhZcBnsM8JstbA0hg",
    "algorithm": "TEXT_EMBEDDING",
    "model_version": "1",
    "model_format": "TORCH_SCRIPT",
    "model_state": "DEPLOYED",
    "model_config": {
        "model_type": "bert",
        "embedding_dimension": 384,
        "additional_config": {
            "space_type": "l2"
        },
        ...
    },
    ...
}
```

The response includes metadata such as the `embedding_dimension` and `space_type`. OpenSearch uses this information to automatically create the underlying embedding field when you define the `semantic` field in your index mapping.

### Step 2: Create an index with a semantic field

To use the model for indexing and search, create an index with a `semantic` field and specify the model ID:

```http request
PUT /my-nlp-index

{
  "settings": {
    "index.knn": true
  },
  "mappings": {
    "properties": {
      "id": {
        "type": "text"
      },
      "text": {
        "type": "semantic"
        "model_id": "No0hhZcBnsM8JstbBkjQ"
      }
    }
  }
}
```

OpenSearch automatically adds a `knn_vector` field and stores relevant model metadata under the `text_semantic_info` field. To verify the mapping:

```http request
GET /my-nlp-index/_mappings
{
    "my-nlp-index": {
        "mappings": {
            "properties": {
                "id": {
                    "type": "text"
                },
                "text": {
                    "type": "semantic",
                    "model_id": "No0hhZcBnsM8JstbBkjQ",
                    "raw_field_type": "text"
                },
                "text_semantic_info": {
                    "properties": {
                        "embedding": {
                            "type": "knn_vector",
                            "dimension": 384,
                            "method": {
                                "engine": "faiss",
                                "space_type": "l2",
                                "name": "hnsw",
                                "parameters": {}
                            }
                        },
                        "model": {
                            "properties": {
                                "id": {
                                    "type": "text",
                                    "index": false
                                },
                                "name": {
                                    "type": "text",
                                    "index": false
                                },
                                "type": {
                                    "type": "text",
                                    "index": false
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

### Step 3: Index documents without an ingest pipeline

With the `semantic` field, there’s no need to define a custom ingest pipeline. You can index documents directly. The following examples use data from the [Flickr image dataset](https://www.kaggle.com/datasets/hsankesara/flickr-image-dataset), where each document includes a text field with an image description and an `id` field for the image ID:

```http request
PUT /my-nlp-index/_doc/1
{
    "text": "A West Virginia university women 's basketball team , officials , and a small gathering of fans are in a West Virginia arena .",
    "id": "4319130149.jpg"
}
```

```http request
PUT /my-nlp-index/_doc/2
{
    "text": "A wild animal races across an uncut field with a minimal amount of trees .",
    "id": "1775029934.jpg"
}

```

OpenSearch automatically generates embeddings using the associated model. You can confirm this by retrieving a document:

```http request
GET /my-nlp-index/_doc/1
{
    "_index": "my-nlp-index",
    "_id": "1",
    "_version": 1,
    "_seq_no": 0,
    "_primary_term": 1,
    "found": true,
    "_source": {
        "text": "A West Virginia university women 's basketball team , officials , and a small gathering of fans are in a West Virginia arena .",
        "id": "4319130149.jpg",
        "text_semantic_info": {
            "model": {
                "name": "huggingface/sentence-transformers/all-MiniLM-L6-v2",
                "id": "No0hhZcBnsM8JstbBkjQ",
                "type": "TEXT_EMBEDDING"
            },
            "embedding": [
                -0.086742505
                ...
            ]
        }
    }
}
```

The response includes the embedding and model metadata in the text_semantic_info field.

### Step 4: Run a neural search query

To perform semantic search, use a [neural query](https://docs.opensearch.org/docs/latest/query-dsl/specialized/neural/) with the `semantic` field. OpenSearch uses the model defined in the mapping to generate the query embedding:

```http request
GET /my-nlp-index/_search
{
  "_source": {
    "excludes": [
      "text_semantic_info"
    ]
  },
  "query": {
    "neural": {
      "text": {
        "query_text": "wild west",
        "k": 1
      }
    }
  }
}
```

query results:


```http request
{
    "took": 15,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 1,
            "relation": "eq"
        },
        "max_score": 0.42294958,
        "hits": [
            {
                "_index": "my-nlp-index",
                "_id": "2",
                "_score": 0.42294958,
                "_source": {
                    "text": "A wild animal races across an uncut field with a minimal amount of trees .",
                    "id": "1775029934.jpg"
                }
            }
        ]
    }
}
```

## Using the semantic field with sparse models

Using a sparse model with a semantic field is similar to using a dense model, with a few differences.
Sparse models support two modes:

* **Bi-encoder mode**: The same model is used for both document and query embeddings.
* **Doc-only mode**: One model is used to generate document embeddings at ingestion time, and another is used at query time.

To use bi-encoder mode, define the `semantic` field as usual:

```http request
PUT /my-nlp-index

{
  "mappings": {
    "properties": {
      "id": {
        "type": "text"
      },
      "text": {
        "type": "semantic"
        "model_id": "No0hhZcBnsM8JstbBkjQ"
      }
    }
  }
}
```

To use doc-only mode, add a `search_model_id` to the mapping:

```http request
PUT /my-nlp-index

{
  "mappings": {
    "properties": {
      "id": {
        "type": "text"
      },
      "text": {
        "type": "semantic"
        "model_id": "No0hhZcBnsM8JstbBkjQ",
        "search_model_id": "TY2piZcBnsM8Jstb-Uhv"
      }
    }
  }
}
```

Sparse embeddings use the `rank_features` field type. This field does not require configuration for dimension or distance space:

```http request
GET /my-nlp-index
{
    "my-nlp-index": {
        "mappings": {
            "properties": {
                "id": {
                    "type": "text"
                },
                "text": {
                    "type": "semantic",
                    "model_id": "R42oiZcBnsM8JstbUUgc",
                    "search_model_id": "TY2piZcBnsM8Jstb-Uhv",
                    "raw_field_type": "text"
                },
                "text_semantic_info": {
                    "properties": {
                        "embedding": {
                            "type": "rank_features"
                        },
                        "model": {
                            "properties": {
                                "id": {
                                    "type": "text",
                                    "index": false
                                },
                                "name": {
                                    "type": "text",
                                    "index": false
                                },
                                "type": {
                                    "type": "text",
                                    "index": false
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

### Using built-in analyzers

You also can optionally specify a built-in search [analyzer](https://docs.opensearch.org/docs/latest/vector-search/ai-search/neural-sparse-with-pipelines/#sparse-encoding-modelanalyzer-compatibility) for sparse queries. This approach provides faster retrieval at the cost of a slight decrease in search relevance.

```http request
{
  "mappings": {
    "properties": {
      "id": {
        "type": "text"
      },
      "text": {
       "type": "semantic",
        "model_id": "R42oiZcBnsM8JstbUUgc",
        "semantic_field_search_analyzer": "bert-uncased"
      }
    }
  }
}
```

## Summary

The `semantic` field makes it easier than ever to bring semantic search into your OpenSearch workflows. By supporting both dense and sparse models with automatic embedding and indexing, it removes the need for custom pipelines or manual field management. Try it out with a pre-trained model to streamline your document search experience—and stay tuned for Advanced usage of the semantic field in OpenSearch, where we’ll dive into advanced capabilities like chunking, remote clusters, and custom models.

## What’s next

In [Advanced semantic field usage in OpenSearch](https://opensearch.org/blog/advanced-usage-of-the-semantic-field-in-opensearch/), we’ll cover advanced semantic field features, including chunking long text, using remote or custom models, cross-cluster support, and updating the model ID. Check it out to deepen your understanding and unlock more powerful search capabilities.
