---
layout: post
title: "Advanced usage of the `semantic` field in OpenSearch"
layout: post
authors:
    - bzhangam
    - kolchfa
date: 2025-07-11
categories:
  - technical-posts
meta_keywords: `semantic` field, semantic search, chunking, custom models, remote models, cross-cluster search, update model ID, OpenSearch 3.1
meta_description: Explore advanced `semantic` field features in OpenSearch, including text chunking, support for remote and custom models, cross-cluster usage, and updating model references.
---

In our [previous blog post](https://opensearch.org/blog/semantic-field-basics-simplifying-semantic-search-in-opensearch/), we introduced the new `semantic` field in OpenSearch and went over its basic setup. In this post, we'll explore advanced configurations of the `semantic` field, including how to enable text chunking, work with remote clusters, use custom or externally hosted models, and update the model ID associated with a field. We'll also provide more details about the field's current limitations. 

## How to use semantic fields with text chunking

In real-world use cases, input text may exceed the model's maximum length, which can lead to truncation and degraded relevance. To address this, you can enable automatic text chunking.

By default, chunking is disabled to avoid the search overhead associated with nested fields. To enable it, use the `chunking` flag:

```json
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
        "model_id": "No0hhZcBnsM8JstbBkjQ",
        "chunking": true
      }
    }
  }
}
```

To verify that chunking is enabled, check the index mapping:

```json
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
                    "raw_field_type": "text",
                    "chunking": true
                },
                "text_semantic_info": {
                    "properties": {
                        "chunks": {
                            "type": "nested",
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
                                "text": {
                                    "type": "text"
                                }
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

The response includes a `nested` field under `text_semantic_info.chunks`, with each chunk containing its own `embedding` and corresponding text.

### Indexing documents with chunking

When you index a long document, OpenSearch splits the text into chunks and generates embeddings for each:

```json
PUT /my-nlp-index/_doc/1
{
    "text": "Nestled high in the heart...stretches up the slopes...",
    "id": "4319130149.jpg"
}
```

```json
GET /my-nlp-index/_doc/1
{
    "_index": "my-nlp-index",
    "_id": "1",
    "_version": 2,
    "_seq_no": 2,
    "_primary_term": 1,
    "found": true,
    "_source": {
        "text": "Nestled high in the heart...stretches up the slopes...",
        "id": "1775029934.jpg",
        "text_semantic_info": {
            "chunks": [
                {
                    "text": "Nestled high in the heart... ",
                    "embedding": [
                        0.011091858,
                        ...
                    ]
                },
                {
                    "text": "stretches up the slopes...",
                    "embedding": [
                        0.012340585,
                        ...
                    ]
                }
            ],
            "model": {
                "name": "huggingface/sentence-transformers/all-MiniLM-L6-v2",
                "id": "No0hhZcBnsM8JstbBkjQ",
                "type": "TEXT_EMBEDDING"
            }
        }
    }
}
```

Each chunk will appear under `text_semantic_info.chunks` with its own embedding vector.

## Using `semantic` fields in remote clusters

Even though OpenSearch supports cross-cluster search, `neural` queries do not currently support automatic resolution of the `semantic` field's configuration from a remote cluster. As a workaround, you can explicitly target the underlying embedding field in your query.

For a sparse model, use the following request:

```json
GET /my-nlp-index/_search
{
  "_source": {
    "excludes": [
      "text_semantic_info"
    ]
  },
  "query": {
    "neural_sparse": {
      "text_semantic_info.embedding": {
        "query_text": "wild west",
        "analyzer": "bert-uncased"
      }
    }
  }
}
```

If chunking is enabled, use a nested query:

```json
GET /my-nlp-index/_search
{
  "_source": {
    "excludes": [
      "text_semantic_info"
    ]
  },
  "query": {
    "nested": {
      "path": "text_semantic_info.chunks",
      "neural_sparse": {
        "text_semantic_info.chunks.embedding": {
            "query_text": "wild west",
            "model_id": "No0hhZcBnsM8JstbBkjQ"
        }
      }
    }
  }
}
```

## Using semantic fields with a neural sparse two-phase processor

When working with sparse embeddings, the `semantic` field allows you to use the `neural` query without manually specifying the model or analyzer. In this case, OpenSearch automatically resolves them based on the field mapping. However, this convenience comes with a limitation: the [neural_sparse_two_phase_processor](https://docs.opensearch.org/docs/latest/search-plugins/search-pipelines/neural-sparse-query-two-phase-processor/), which can improve search latency, is not currently supported when querying the `semantic` field directly.

As a workaround, you can bypass the `semantic` field and run a `neural_sparse` query directly against the underlying `embedding` field (for example, `text_semantic_info.embedding`). Similarly to the approach used for cross-cluster search, this approach allows you to use the `neural_sparse_two_phase_processor` while still benefiting from automatic embedding generation during indexing.


## Using semantic fields with custom or externally hosted models

To use a [custom](https://docs.opensearch.org/docs/latest/ml-commons-plugin/custom-local-models/) or [externally hosted](https://docs.opensearch.org/docs/latest/ml-commons-plugin/remote-models/index/) model, provide the required model configuration when registering the model. OpenSearch uses this metadata to construct the appropriate `knn_vector` or `rank_features` field.

### Register a custom model

You must set the `function_name` to `TEXT_EMBEDDING` for dense models or to `SPARSE_ENCODING` or `SPARSE_TOKENIZE` for sparse models, depending on the model's functionality.

**Example: Registering a dense model**

```json
POST /_plugins/_ml/models/_register
{
    "name": "huggingface/sentence-transformers/msmarco-distilbert-base-tas-b",
    "version": "1.0.1",
    "model_group_id": "wlcnb4kBJ1eYAeTMHlV6",
    "description": "This is a port of the DistilBert TAS-B Model to sentence-transformers model: It maps sentences & paragraphs to a 768 dimensional dense vector space and is optimized for the task of semantic search.",
    "function_name": "TEXT_EMBEDDING",
    "model_format": "TORCH_SCRIPT",
    "model_content_size_in_bytes": 266352827,
    "model_content_hash_value": "acdc81b652b83121f914c5912ae27c0fca8fabf270e6f191ace6979a19830413",
    "model_config": {
        "model_type": "distilbert",
        "embedding_dimension": 768,
        "framework_type": "sentence_transformers",
        "all_config": "{\"_name_or_path\":\"old_models/msmarco-distilbert-base-tas-b/0_Transformer\",\"activation\":\"gelu\",\"architectures\":[\"DistilBertModel\"],\"attention_dropout\":0.1,\"dim\":768,\"dropout\":0.1,\"hidden_dim\":3072,\"initializer_range\":0.02,\"max_position_embeddings\":512,\"model_type\":\"distilbert\",\"n_heads\":12,\"n_layers\":6,\"pad_token_id\":0,\"qa_dropout\":0.1,\"seq_classif_dropout\":0.2,\"sinusoidal_pos_embds\":false,\"tie_weights_\":true,\"transformers_version\":\"4.7.0\",\"vocab_size\":30522}"
        "additional_config": {
            "space_type": "l2"
        }
    },
    "created_time": 1676073973126,
    "url": "https://artifacts.opensearch.org/models/ml-models/huggingface/sentence-transformers/msmarco-distilbert-base-tas-b/1.0.1/torch_script/sentence-transformers_msmarco-distilbert-base-tas-b-1.0.1-torch_script.zip"
}
```

### Register an externally hosted model

Externally hosted models must use `remote` as the `function_name`. Define the `model_type` explicitly in `model_config`.

**Example: Registering an externally hosted dense model**

```json
POST /_plugins/_ml/models/_register
{
    "name": "remote-dense-model",
    "function_name": "remote",
    "model_group_id": "1jriBYsBq7EKuKzZX131",
    "description": "test model",
    "connector_id": "a1eMb4kBJ1eYAeTMAljY",
    "model_config": {
        "model_type": "TEXT_EMBEDDING",
        "embedding_dimension": 768,
        "additional_config": {
            "space_type": "l2"
        }
    }
}
```

**Example: Registering an externally hosted sparse model**

```json
POST /_plugins/_ml/models/_register
{
    "name": "remote-sparse-model",
    "function_name": "remote",
    "model_group_id": "1jriBYsBq7EKuKzZX131",
    "description": "test model",
    "connector_id": "a1eMb4kBJ1eYAeTMAljY",
    "model_config": {
        "model_type": "SPARSE_ENCODING",
    }
}
```

## Updating the model ID for a semantic field

You can update the model ID used by a `semantic` field. This is useful when:

* You want to switch to a newer version of the model.
* A redeployed model generates a new model ID.

To update the model ID, use the Update Mapping API. For dense models, ensure that the new model has the same `embedding_dimension` and `space_type`, because these parameters are fixed in the `knn_vector` field and cannot be changed after index creation.

## Limitations

The `semantic` field is designed to simplify semantic search, but it currently has several limitations that may affect advanced use cases:

* **Dense model configuration**: When using a dense model, OpenSearch automatically creates a `knn_vector` field based on the model's `embedding_dimension` and `space_type`. These values must be defined at model registration time. Other `knn_vector` parameters are not configurable and use default values.
* **Chunking strategy**: To enable text chunking, set `chunking: true` in the `semantic` field mapping. Note that the chunking behavior uses a fixed token-length algorithm with a [default configuration](https://docs.opensearch.org/docs/latest/ingest-pipelines/processors/text-chunking/#the-fixed-token-length-algorithm) and does not support alternative strategies or customization.
* **Sparse model pruning**: For sparse models, OpenSearch applies a default prune ratio of `0.1` during embedding generation. This value is not currently configurable. Additionally, the `neural_sparse_two_phase_processor` is not supported with `semantic` fields, which limits sparse query optimization.
* **Remote cluster support**: Neural queries on `semantic` fields are not supported in cross-cluster search. While documents can be retrieved from remote indexes, semantic queries require access to local model configuration and index mappings.
* **Repeated inference behavior**: When updating a document, OpenSearch will rerun inference for the `semantic` field even if the field's content has not changed. Currently, there is no support for reusing existing embeddings to avoid redundant inference.
* **Mapping constraints**: The `semantic` field does not support dynamic mapping. You must define it explicitly in the index mapping. Additionally, you cannot use a `semantic` field in the `fields` section of another field, meaning that multi-field configurations are not supported.

## Summary

The `semantic` field in OpenSearch streamlines the development of neural search applications by handling model inference, embedding generation, and field mapping in a single, declarative step. It supports both dense and sparse models and removes the need for custom ingest pipelines. In this post, we explored advanced features such as text chunking, cross-cluster search, and custom or remote model integration. While the feature has some limitations, it significantly lowers the barrier to implementing semantic search. We look forward to continued improvements based on community feedback.

## What's next?

To address the current limitations, we are working on several improvements to the existing semantic search capabilities:

* [Configurable embedding field parameters](https://github.com/opensearch-project/neural-search/issues/1356): Enable customization of `knn_vector` parameters beyond `dimension` and `space_type`.
* [Configurable chunking strategies](https://github.com/opensearch-project/neural-search/issues/1340): Provide options to customize the way text is chunked, such as the chunking algorithm and controlling the chunk size and overlap.
* [Custom sparse vector generation](https://github.com/opensearch-project/neural-search/issues/1351): Add support for configuring how sparse embeddings are generated from models, including the pruning strategies.
* [Improved support for remote querying](https://github.com/opensearch-project/neural-search/issues/1353): Allow `neural` queries on `semantic` fields in remote clusters by retrieving and resolving model configuration across clusters.
* [Support for two-phase sparse queries](https://github.com/opensearch-project/neural-search/issues/1352): Enable compatibility of the `semantic` field with the `neural_sparse_two_phase_processor` to reduce latency and improve sparse search performance.
* [Embedding reuse on document updates](https://github.com/opensearch-project/neural-search/issues/1350): Avoid redundant model inference when the `semantic` field value has not changed, enabling more efficient indexing and lower resource usage.



