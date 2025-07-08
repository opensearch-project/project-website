---
layout: post
title:  "Building a multi-modal search engine in OpenSearch"
authors:
 - mingshl
date: 2025-07-07
categories:
 - technical-post
meta_keywords: "multi-modal search, opensearch, semantic search, vector search, image search"
meta_description: "Learn how to build a multi-modal search engine in OpenSearch using the ML inference ingest and search request processors to search across text and images."
excerpt: "Go beyond keyword search and learn how to build a multi-modal search engine in OpenSearch. This post will show you how to implement it in OpenSearch using the ML inference ingest and search request processors."
has_science_table: true
---

In today's data-rich world, information isn't just text anymore. It's images, videos, audio, and more. To truly understand and retrieve relevant information, search engines need to go beyond keywords and even beyond single-modality semantic understanding. This is where multi-modal search comes in.

Building on the foundation of semantic search, which understands the meaning behind queries rather than just literal keywords, multi-modal search takes this a step further by processing and understanding information from multiple data types simultaneously. Imagine searching for "Wild West" and not only getting relevant text documents but also images and videos of cowboys and rodeos, even if the keywords aren't explicitly present in the visual metadata.

In this post, we'll explore the power of multi-modal search and show you how to implement it in OpenSearch using the ML inference ingest and search request processors.

## The Evolution of Search: From keywords to multi-modality

Let's quickly recap the journey of search:

**Keyword Search**: Traditional search engines rely on matching exact keywords. While effective for precise queries, they often miss relevant results that use different phrasing or where the context isn't explicitly textual.

**Semantic Search**: As discussed in our previous blog post, "Building a semantic search engine in OpenSearch," semantic search leverages deep neural networks (DNNs) to understand the meaning and context of queries. This allows for more human-like search experiences, returning results even if there's no direct keyword overlap. The concept of embeddings is central here, where text (and other data) is transformed into high-dimensional vectors, and similar items are mapped closer together in this embedding space.

However, a purely semantic text search still has limitations when dealing with diverse datasets containing images, audio, or video. Consider a dataset of public images with captions. A query for "historic landmarks" might return text documents about them, but what if you want to see images of those landmarks directly, regardless of their captions? This is where multi-modal search becomes indispensable.

## Search in Multi-Modal Embedding Space

Just as a DNN represents text as vectors in a high-dimensional space for semantic search, multi-modal models extend this concept to other data types. A multi-modal DNN learns to create unified vector embeddings for different modalities—text, images, and potentially more—in the same shared embedding space.

This means that a text description of "Central Park" and an actual image of Central Park, when processed by a multi-modal model, will result in vectors that are close to each other in the embedding space. This allows for:

* Text-to-Image Search: Querying with text and finding relevant images.
* Image-to-Text Search: Querying with an image and finding relevant text documents.
* Multi-Modal Query Search: Combining text and image (or other modalities) in a single query to find the most relevant results across different data types.

The quality of this multi-modal search hinges on the ability of the underlying model to learn rich, expressive embeddings that capture the relationships between different data modalities. Models like Amazon Bedrock Titan Multimodal Embedding are specifically designed for this purpose.

## Building Multi-Modal Search in OpenSearch

OpenSearch, with its powerful ML Commons and k-NN capabilities, provides a robust platform for implementing multi-modal search. The key components are the ML inference ingest processor and the ML inference search request processor. These processors allow you to integrate multi-modal embedding models directly into your indexing and search workflows.

Here's a step-by-step guide to setting up multi-modal search in OpenSearch:

### 1. Create and Deploy Your Multi-Modal Embedding Model

First, you need to set up your multi-modal embedding model. For this tutorial, we'll use the Bedrock Titan Multimodal Embedding model.

#### Create a Connector

A connector facilitates communication between OpenSearch and your external ML model.


```json
POST _plugins/_ml/connectors/_create
{
  "name": "Amazon Bedrock Connector: bedrock Titan multi-modal embedding model",
  "description": "Test connector for Amazon Bedrockbedrock Titan multi-modal embedding model",
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

Register and Deploy the Model:
Once the connector is created, you can register and deploy the Bedrock Titan model in OpenSearch. This makes the model available for inference operations.

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

Test Model Prediction:
You can test the model to see how it generates embeddings for text, images, or both. Remember that multi-modal models like Titan can take both text and image inputs to create a unified embedding.
Get Text and Image Embedding:

```json
POST /_plugins/_ml/models/ncdJJZUB7judm8f4HN3P/_predict // Replace with your model_id
{
  "parameters": {
    "inputText": "Say this is a test",
    "inputImage": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIB..." // Base64 encoded image
  }
}
```

Get Text Embedding:

```json
POST /_plugins/_ml/models/ncdJJZUB7judm8f4HN3P/_predict // Replace with your model_id
{
  "parameters": {
    "inputText": "Say this is a test"
  }
}
```

Get Image Embedding:

```json
POST /_plugins/_ml/models/ncdJJZUB7judm8f4HN3P/_predict // Replace with your model_id
{
  "parameters": {
    "inputImage": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw..." // Base64 encoded image
  }
}
```

2. Create an Ingest Pipeline for Multi-Modal Embeddings

The ingest pipeline is crucial for generating embeddings for your documents as they are indexed into OpenSearch. The ml_inference processor in this pipeline will call your deployed model to create the multi-modal embedding.

```json
PUT _ingest/pipeline/ml_inference_pipeline_multi_modal
{
  "processors": [
    {
      "ml_inference": {
        "tag": "ml_inference",
        "description": "This processor is going to run ml inference during ingest to create multi-modal embeddings",
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

This ingest pipeline will automatically generate a multimodal_embedding vector for documents that have either a name field (for text), an image field (for base64 encoded images), or both. If neither is present, the processor will be skipped.

3. Create a k-NN Index

Now, create an index with knn enabled and define a knn_vector field for your multi-modal embeddings. This field will store the vectors generated by the ingest pipeline.

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

4. Load Your Multi-Modal Data

You can now start ingesting your data into the index. The ingest pipeline will automatically process the name (text) and image (base64 encoded image) fields to generate the multimodal_embedding.
Load a document with text only:


```json
PUT test-index-area/_doc/1
{
  "name": "Central Park",
  "category": "Park"
}
```

Load a document with text and an image:


```json
PUT test-index-area/_doc/2
{
  "name": "Times Square",
  "category": "Square",
  "image":"iVBORw0KGgoAAAANSUhEUgAAAFcAAAAdCAYAAADfC/BmAAAAAXNSR0IArs4c6QAAAGJlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAABJKGAAcAAAASAAAAUKABAAMAAAABAAEAAKACAAQAAAABAAAAV6ADAAQAAAABAAAAHQAAAABBU0NJSQAAAFNjcmVlbnNob3QnedEpAAAB1GlUWHRYTUw6Y29tLmad...[truncated Base64 image]..."
}
```

Load a document with no text or image (processor will be skipped):


```json
PUT test-index-area/_doc/3
{
  "category": "Bridge"
}
```

You can verify that the documents now contain the multimodal_embedding field by using GET test-index-area/_doc/[id].

5. Search with the ML Inference Search Request Processor

Finally, create a search pipeline with an ml_inference request processor. This processor will take your text and/or image queries, generate an embedding using your multi-modal model, and then rewrite the query into a k-NN search against the multimodal_embedding field.


```json
PUT _search/pipeline/multimodal_semantic_search_pipeline
{
  "request_processors": [
    {
      "ml_inference": {
        "tag": "ml_inference",
        "description": "This processor runs k-NN query using multi-modal embeddings generated from search request input",
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

Now, you can perform multi-modal searches!
Search with text using the search pipeline:
The following query will take the text "place where recreational activities are done, picnics happen there", generate an embedding, and then find documents with similar multi-modal embeddings.

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

This will return documents where the multimodal_embedding is closest to the embedding of your text query, effectively finding relevant documents whether they contain matching text or visually similar content.

## Conclusion

Multi-modal search represents the next frontier in information retrieval, allowing users to find what they're looking for regardless of the input modality. By leveraging the ML Commons framework, k-NN capabilities, and powerful multi-modal embedding models in OpenSearch, you can build highly intelligent and flexible search experiences.

This approach opens up a wealth of possibilities for applications dealing with rich, diverse datasets, from e-commerce product search (searching by image) to digital asset management (finding images based on text descriptions) and beyond.
We encourage you to experiment with different multi-modal models and datasets to unlock the full potential of multi-modal search in OpenSearch.



## Next Steps:
- Try explore multi-modal with python notebook: [Multi-Modal Product Search with OpenSearch
](https://github.com/opensearch-project/ml-commons/blob/main/docs/tutorials/ml_inference/ecommerce_demo.ipynb) 
- Explore other multi-modal models available for integration with OpenSearch.
- Consider advanced use cases for multi-modal search in your specific domain.
- Share your feedback and experiences on the OpenSearch forum!
