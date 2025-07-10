---
layout: post
title:  "Building a multimodal search engine in OpenSearch"
authors:
 - mingshl
 - kolchfa
date: 2025-07-07
categories:
 - technical-post
meta_keywords: "multimodal search, opensearch, semantic search, vector search, image search"
meta_description: "Learn how to build a multimodal search engine in OpenSearch using the ML inference ingest and search request processors to search across text and images."
excerpt: "Go beyond keyword search and learn how to build a multimodal search engine in OpenSearch. This post will show you how to implement it in OpenSearch using the ML inference ingest and search request processors."
has_science_table: true
---

In today's data-rich world, information isn't just text anymore. It's images, videos, audio, and more. To truly understand and retrieve relevant information, search engines need to go beyond keywords and even beyond single-modality semantic understanding. This is where multimodal search comes in.

Building on the foundation of semantic search, which understands the meaning behind queries rather than just literal keywords, multimodal search takes this a step further by processing and understanding information from multiple data types simultaneously. Imagine searching for "Wild West" and not only getting relevant text documents but also images and videos of cowboys and rodeos, even if the keywords aren't explicitly present in the visual metadata.

In this post, we'll explore the power of multimodal search and show you how to implement it in OpenSearch using the ML inference ingest and search request processors.

## The evolution of search: From keywords to multimodality

Let's quickly recap the journey of search:

**Keyword Search**: Traditional search engines rely on matching exact keywords. While effective for precise queries, they often miss relevant results that use different phrasing or where the context isn't explicitly textual.

**Semantic Search**: As discussed in our [previous blog post](https://opensearch.org/blog/semantic-search-solutions/), semantic search uses deep neural networks (DNNs) to understand the meaning and context of queries. This allows for more human-like search experiences, returning results even if there's no direct keyword overlap. The concept of embeddings is central here, where text (and other data) is transformed into high-dimensional vectors, and similar items are mapped closer together in this embedding space.

However, a purely semantic text search still has limitations when dealing with diverse datasets containing images, audio, or video. Consider a dataset of public images with captions. A query for "historic landmarks" might return text documents about them, but what if you want to see images of those landmarks directly, regardless of their captions? This is where multimodal search becomes indispensable.

## Search in multimodal embedding space

Just as a DNN represents text as vectors in a high-dimensional space for semantic search, multimodal models extend this concept to other data types. A multimodal DNN learns to create unified vector embeddings for different modalities—text, images, and potentially more—in the same shared embedding space.

This means that a text description of "Central Park" and an actual image of Central Park, when processed by a multimodal model, returns vectors that are close to each other in the embedding space. This allows for the following functionality:

* **Text-to-image search**: Querying using text and finding relevant images.
* **Image-to-text search**: Querying using an image and finding relevant text documents.
* **Multimodal search**: Combining text and image (or other modalities) into a single query in order to find the most relevant results across different data types.

The quality of this multimodal search depends on the ability of the underlying model to learn rich, expressive embeddings that capture the relationships between different data modalities. Models like Amazon Bedrock Titan Multimodal Embedding are specifically designed for this purpose.

## Building multimodal search in OpenSearch

OpenSearch provides a robust platform for implementing multimodal search. The key components of multimodal search are the ML inference ingest processor and the ML inference search request processor. These processors allow you to integrate multimodal embedding models directly into your indexing and search workflows.

Here's a step-by-step guide to setting up multimodal search in OpenSearch.

### 1. Create and deploy your multimodal embedding model

First, set up your multimodal embedding model. For this tutorial, we'll use the Bedrock Titan Multimodal Embedding model.

#### Create a connector

A connector facilitates communication between OpenSearch and your external ML model. To create a connector, use the following request:

```json
POST _plugins/_ml/connectors/_create
{
  "name": "Amazon Bedrock Connector: bedrock Titan multimodal embedding model",
  "description": "Test connector for Amazon Bedrockbedrock Titan multimodal embedding model",
  "version": 1,
  "protocol": "aws_sigv4",
  "credential": {
    "access_key": "{{access_key}}",
    "secret_key": "{{secret_key}}",
    "session_token": "{{session_token}}"
  },
  "parameters": {
    "region": "{{region}}", // e.g., us-east-1
"service_name": "bedrock",
    "model": "amazon.titan-embed-image-v1",
    "input_docs_processed_step_size": 2
  },
  "actions": [
    {
      "action_type": "predict",
      "method": "POST",
      "headers": {
        "content-type": "application/json"
      },
      "url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/invoke",
      "request_body": "{\"inputText\": \"${parameters.inputText:-null}\", \"inputImage\": \"${parameters.inputImage:-null}\"}"
    }
  ]
}
```

#### Register and deploy the model

Once the connector is created, you can register and deploy the Bedrock Titan model in OpenSearch. This makes the model available for inference operations:

```json
POST _plugins/_ml/models/_register?deploy=true
{
  "name": "amazon.titan-embed-image-v1",
  "version": "1.0",
  "function_name": "remote",
  "description": "test amazon.titan-embed-image-v1",
  "connector_id": "P8c_JZUB7judm8f4591w", // Replace with your connector_id
"interface": {
    "input": "{\n    \"type\": \"object\",\n    \"properties\": {\n        \"parameters\": {\n            \"type\": \"object\",\n            \"properties\": {\n                \"inputText\": {\n                    \"type\": \"string\"\n                },\n                \"inputImage\": {\n                    \"type\": \"string\"\n                }\n            }\n        }\n    }\n}",
    "output": "{\n    \"inference_results\": [\n        {\n            \"output\": [\n                {\n                    \"name\": {\n                        \"type\": \"string\"\n                    },\n                    \"dataAsMap\": {\n                        \"type\": \"object\",\n                        \"properties\": {\n                            \"embedding\": {\n                                \"type\": \"array\",\n                                \"items\": {\n                                    \"type\": \"number\"\n                                }\n                            },\                            \"inputTextTokenCount\": {\n                                \"type\": \"number\"\n                            }\                        }\n                    }\                }\n            ],\            \"status_code\": {\n                \"type\": \"integer\"\n            }\        }\n    ]\n}"
  }
}
```

#### Test the model

You can test the model to see how it generates embeddings for text, images, or both. Remember that multimodal models like Titan can take both text and image inputs to create a unified embedding. To generate both text and image embeddings, send the following request:

```json
POST /_plugins/_ml/models/ncdJJZUB7judm8f4HN3P/_predict // Replace with your model_id
{
  "parameters": {
    "inputText": "Say this is a test",
    "inputImage": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIB..." // Base64 encoded image
  }
}
```

If you want to generate only text embeddings, send the following request:

```json
POST /_plugins/_ml/models/ncdJJZUB7judm8f4HN3P/_predict // Replace with your model_id
{
  "parameters": {
    "inputText": "Say this is a test"
  }
}
```

If you want to generate only image embeddings, send the following request:

```json
POST /_plugins/_ml/models/ncdJJZUB7judm8f4HN3P/_predict // Replace with your model_id
{
  "parameters": {
    "inputImage": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw..." // Base64 encoded image
  }
}
```

### 2. Create an ingest pipeline for multimodal embeddings

The ingest pipeline is crucial for generating embeddings for your documents as they are indexed into OpenSearch. The `ml_inference` processor in this pipeline calls your deployed model to create the multimodal embeddings:

```json
PUT _ingest/pipeline/ml_inference_pipeline_multi_modal
{
  "processors": [
    {
      "ml_inference": {
        "tag": "ml_inference",
        "description": "This processor is going to run ml inference during ingest to create multimodal embeddings",
        "model_id": "ncdJJZUB7judm8f4HN3P", // Replace with your model_id
"input_map": [
          {
            "inputText": "name",  // Map document's 'name' field to model's 'inputText'
            "inputImage":"image"   // Map document's 'image' field to model's 'inputImage'
          }
        ],
        "output_map": [
          {
            "multimodal_embedding": "embedding" // Map model's 'embedding' output to document's 'multimodal_embedding' field
          }
        ],
        "ignore_missing":true,
        "ignore_failure": true
      }
    }
  ]
}
```

This ingest pipeline automatically generates a `multimodal_embedding` vector for documents that have either a `name` field (for text), an `image` field (for Base64-encoded images), or both. If neither is present, the processor is skipped.

### 3. Create a vector index

Now, create a vector index and define a `knn_vector` field for your multimodal embeddings. This field will store the vectors generated by the ingest pipeline:

```json
PUT test-index-area
{
  "settings": {
    "index": {
      "default_pipeline": "ml_inference_pipeline_multi_modal", // Associate the ingest pipeline with this index
"knn": true,
      "knn.algo_param.ef_search": 100
    }
  },
  "mappings": {
    "properties": {
      "multimodal_embedding": {
        "type": "knn_vector",
        "dimension": 1024 // Set the dimension according to your model's output
      }
    }
  }
}
```

### 4. Load your multimodal data

You can now start ingesting your data into the index. The ingest pipeline automatically processes the `name` (text) and `image` (Base64-encoded image) fields to generate the `multimodal_embedding`. To ingest a document containing text only, use the following request:


```json
PUT test-index-area/_doc/1
{
  "name": "Central Park",
  "category": "Park"
}
```

To ingest a document containing text and an image, send the following request:


```json
PUT test-index-area/_doc/2
{
  "name": "Times Square",
  "category": "Square",
  "image":"iVBORw0KGgoAAAANSUhEUgAAAFcAAAAdCAYAAADfC/BmAAAAAXNSR0IArs4c6QAAAGJlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAABJKGAAcAAAASAAAAUKABAAMAAAABAAEAAKACAAQAAAABAAAAV6ADAAQAAAABAAAAHQAAAABBU0NJSQAAAFNjcmVlbnNob3QnedEpAAAB1GlUWHRYTUw6Y29tLmad...[truncated Base64 image]..."
}
```

If you ingest a document with no text or image, the processor is skipped:


```json
PUT test-index-area/_doc/3
{
  "category": "Bridge"
}
```

You can verify that the documents now contain the `multimodal_embedding` field by calling `GET test-index-area/_doc/<document-id>`.

### 5. Search using the ML inference search request processor

Finally, create a search pipeline with an `ml_inference` request processor. This processor takes your text and/or image query, generates an embedding using your multimodal model, and then rewrites the query into a vector search against the `multimodal_embedding` field:

```json
PUT _search/pipeline/multimodal_semantic_search_pipeline
{
  "request_processors": [
    {
      "ml_inference": {
        "tag": "ml_inference",
        "description": "This processor runs k-NN query using multimodal embeddings generated from search request input",
        "model_id": "ncdJJZUB7judm8f4HN3P", // Replace with your model_id
        "query_template": "{\"query\": {\"knn\": {\"multimodal_embedding\": {\"vector\": ${multimodal_embedding},\"k\": 3}}}}",
        "optional_input_map": [
          {
            "inputText": "ext.ml_inference.text",  // Map query's 'ext.ml_inference.text' to model's 'inputText'
            "inputImage": "ext.ml_inference.image" // Map query's 'ext.ml_inference.image' to model's 'inputImage'
          }
        ],
        "output_map": [
          {
            "multimodal_embedding": "embedding" // Map model's 'embedding' output to a variable for the k-NN query
          }
        ],
        "model_config":{},
        "ignore_missing":false,
        "ignore_failure": false
      }
    }
  ]
}
```

Now you can perform multimodal searches!

#### Search using text

The following query takes the text "place where recreational activities are done, picnics happen there", generates an embedding, and then finds documents containing similar multimodal embeddings:

```json
GET test-index-area/_search?search_pipeline=multimodal_semantic_search_pipeline
{
  "query": {
    "match_all": {}
  },
  "ext": {
    "ml_inference": {
      "text": "place where recreational activities are done, picnics happen there"
    }
  }
}
```

This query returns documents, in which the `multimodal_embedding` is closest to the embedding of your text query, effectively finding relevant documents whether they contain matching text or visually similar content.

## Conclusion

Multimodal search enables more flexible ways to retrieve information, especially when working with diverse types of data, from e-commerce products to digital assets. Using OpenSearch, you can build highly intelligent and flexible search experiences, useful in a range of applications—from searching for products using images to organizing digital assets using text-based queries. 

We encourage you to experiment with different multimodal models and datasets to unlock the full potential of multimodal search in OpenSearch.


## Next steps

- Try multimodal search using [an example Python notebook](https://github.com/opensearch-project/ml-commons/blob/main/docs/tutorials/ml_inference/ecommerce_demo.ipynb) 
- Explore multimodal [models](https://docs.opensearch.org/docs/latest/ml-commons-plugin/integrating-ml-models/#choosing-a-model) available for integration with OpenSearch
- Share your feedback and experiences on the [OpenSearch forum](https://forum.opensearch.org/)
