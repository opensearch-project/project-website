---
layout: post
title: "Build multimodal RAG with OpenSearch and Amazon Nova Multimodal Embeddings"
authors:
    - nathhjo
date: 2026-11-24
categories:
  - technical-posts
meta_keywords: OpenSearch ML Commons, Amazon Nova Multimodal Embeddings, multimodal search, multimodal RAG, retrieval-augmented generation, Amazon Bedrock, vector search, image embeddings, video embeddings, audio embeddings, neural search, connectors
meta_description: Use Amazon Nova Multimodal Embeddings with OpenSearch to generate and search embeddings for text, images, video, and audio in a single semantic space, then build a multimodal RAG pipeline with ML Commons connectors.
---

OpenSearch integrates with the Amazon Nova Multimodal Embeddings model, which generates vector embeddings for text, document images, images, video, and audio in a single, unified semantic space. Because every modality is embedded into the same vector space, you can compare content across types: find a product image using a text description, find videos similar to a reference image, or retrieve the most relevant mix of text and media as context for a generated answer.

With this integration, you can use OpenSearch to:

* Generate embeddings for text, images, video, and audio using a single Amazon Bedrock model
* Perform semantic and cross-modal search over mixed-media content
* Build retrieval-augmented generation (RAG) applications that retrieve context across multiple modalities

RAG is one of the most powerful applications of multimodal embeddings. By combining OpenSearch's search infrastructure with Nova's embedding capabilities, you can build RAG applications that find relevant context in text and media alike. In this post, we'll walk you through an end-to-end multimodal RAG workflow using the Nova Multimodal Embeddings model in OpenSearch.

## Prerequisites

Before getting started, make sure you have the following:

* An Amazon OpenSearch Service domain running version 2.17 or later. Audio embedding with the dedicated `audio_embedding` pre-processing function requires version 3.3 or later.
* Access to the `amazon.nova-2-multimodal-embeddings-v1:0` model in Amazon Bedrock.
* An AWS Identity and Access Management (IAM) role that grants Amazon OpenSearch Service permission to invoke the model. For setup instructions, see [Creating connectors for third-party ML platforms](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/ml-external-connector.html).
* An API key for the large language model (LLM) that will generate answers. This post uses OpenAI, but you can use any [supported LLM connector](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/connectors/).

If you're running self-managed OpenSearch, replace `roleArn` in the connector `credential` blocks with `access_key`, `secret_key`, and `session_token`. For details, see the [Nova Multimodal Embeddings connector blueprint](https://github.com/opensearch-project/ml-commons/blob/main/docs/remote_inference_blueprints/bedrock_connector_nova_multimodal_model_blueprint.md).

## Step 1: Register and deploy the Nova Multimodal Embeddings models

The Nova model takes a different request format for each modality, so in this walkthrough you'll create one connector and one model for each modality: text, image, video, and audio. Each connector uses a modality-specific pre-processing function that maps OpenSearch inputs to the Nova request format, and they all share the same post-processing function.

**Note**: Starting with OpenSearch 3.5, you can instead use a single unified connector with the `connector.pre_process.bedrock.nova.embedding` pre-processing function, which detects the input modality automatically. See the [connector blueprint](https://github.com/opensearch-project/ml-commons/blob/main/docs/remote_inference_blueprints/bedrock_connector_nova_multimodal_model_blueprint.md#option-a-unified-multimodal-connector-supported-in-opensearch-35-version) for details.

### Text embedding model

Register and deploy the text embedding model in one step by providing the connector inline and setting `deploy=true`:

```json
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "Amazon Nova Multimodal Embeddings - text",
  "function_name": "remote",
  "description": "Nova text embedding model",
  "connector": {
    "name": "Amazon Bedrock connector: Nova text embedding",
    "description": "Connector to the Amazon Nova Multimodal Embeddings model for text",
    "version": 1,
    "protocol": "aws_sigv4",
    "credential": {
      "roleArn": "<YOUR_IAM_ROLE_ARN>"
    },
    "parameters": {
      "region": "<YOUR_AWS_REGION>",
      "service_name": "bedrock",
      "model": "amazon.nova-2-multimodal-embeddings-v1:0",
      "input_docs_processed_step_size": 1,
      "dimensions": 1024,
      "normalize": true,
      "embeddingTypes": ["float"],
      "truncationMode": "END"
    },
    "actions": [
      {
        "action_type": "predict",
        "method": "POST",
        "url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/invoke",
        "headers": {
          "content-type": "application/json",
          "x-amz-content-sha256": "required"
        },
        "request_body": "{ \"taskType\": \"SINGLE_EMBEDDING\", \"singleEmbeddingParams\": { \"embeddingPurpose\": \"GENERIC_INDEX\", \"embeddingDimension\": ${parameters.dimensions}, \"text\": { \"truncationMode\": \"${parameters.truncationMode}\", \"value\": \"${parameters.inputText}\" } } }",
        "pre_process_function": "connector.pre_process.bedrock.nova.text_embedding",
        "post_process_function": "connector.post_process.bedrock.nova.embedding"
      }
    ]
  }
}
```

The response contains a `task_id`. Use the [Get Task API](https://docs.opensearch.org/latest/ml-commons-plugin/api/tasks-apis/get-task/) to retrieve the `model_id` once the task completes. Note the model ID; you'll use it in later steps.

Test the model:

```json
POST /_plugins/_ml/models/<TEXT_MODEL_ID>/_predict
{
  "parameters": {
    "inputText": "hello world"
  }
}
```

The response contains a 1,024-dimensional embedding:

```json
{
  "inference_results": [
    {
      "output": [
        {
          "name": "sentence_embedding",
          "data_type": "FLOAT32",
          "shape": [1024],
          "data": [-0.014445321, 0.029572023, ...]
        }
      ],
      "status_code": 200
    }
  ]
}
```

### Image embedding model

```json
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "Amazon Nova Multimodal Embeddings - image",
  "function_name": "remote",
  "description": "Nova image embedding model",
  "connector": {
    "name": "Amazon Bedrock connector: Nova image embedding",
    "description": "Connector to the Amazon Nova Multimodal Embeddings model for images",
    "version": 1,
    "protocol": "aws_sigv4",
    "credential": {
      "roleArn": "<YOUR_IAM_ROLE_ARN>"
    },
    "parameters": {
      "region": "<YOUR_AWS_REGION>",
      "service_name": "bedrock",
      "model": "amazon.nova-2-multimodal-embeddings-v1:0",
      "input_docs_processed_step_size": 1,
      "dimensions": 1024,
      "normalize": true,
      "embeddingTypes": ["float"],
      "imageFormat": "jpeg",
      "detailLevel": "STANDARD_IMAGE"
    },
    "actions": [
      {
        "action_type": "predict",
        "method": "POST",
        "url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/invoke",
        "headers": {
          "content-type": "application/json",
          "x-amz-content-sha256": "required"
        },
        "request_body": "{ \"taskType\": \"SINGLE_EMBEDDING\", \"singleEmbeddingParams\": { \"embeddingPurpose\": \"GENERIC_INDEX\", \"embeddingDimension\": ${parameters.dimensions}, \"image\": { \"format\": \"${parameters.imageFormat}\", \"detailLevel\": \"${parameters.detailLevel}\", \"source\": { \"bytes\": \"${parameters.inputImage}\" } } } }",
        "pre_process_function": "connector.pre_process.bedrock.nova.image_embedding",
        "post_process_function": "connector.post_process.bedrock.nova.embedding"
      }
    ]
  }
}
```

Set `imageFormat` to match your images (`png`, `jpeg`, `gif`, or `webp`). Use `DOCUMENT_IMAGE` as the `detailLevel` for images of documents, such as scanned pages or charts.

Test the model by passing a Base64-encoded image:

```json
POST /_plugins/_ml/models/<IMAGE_MODEL_ID>/_predict
{
  "parameters": {
    "inputImage": "<BASE64_ENCODED_IMAGE>"
  }
}
```

### Video embedding model

```json
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "Amazon Nova Multimodal Embeddings - video",
  "function_name": "remote",
  "description": "Nova video embedding model",
  "connector": {
    "name": "Amazon Bedrock connector: Nova video embedding",
    "description": "Connector to the Amazon Nova Multimodal Embeddings model for video",
    "version": 1,
    "protocol": "aws_sigv4",
    "credential": {
      "roleArn": "<YOUR_IAM_ROLE_ARN>"
    },
    "parameters": {
      "region": "<YOUR_AWS_REGION>",
      "service_name": "bedrock",
      "model": "amazon.nova-2-multimodal-embeddings-v1:0",
      "input_docs_processed_step_size": 1,
      "dimensions": 1024,
      "normalize": true,
      "embeddingTypes": ["float"],
      "videoFormat": "mp4",
      "embeddingMode": "AUDIO_VIDEO_COMBINED"
    },
    "actions": [
      {
        "action_type": "predict",
        "method": "POST",
        "url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/invoke",
        "headers": {
          "content-type": "application/json",
          "x-amz-content-sha256": "required"
        },
        "request_body": "{ \"taskType\": \"SINGLE_EMBEDDING\", \"singleEmbeddingParams\": { \"embeddingPurpose\": \"GENERIC_INDEX\", \"embeddingDimension\": ${parameters.dimensions}, \"video\": { \"format\": \"${parameters.videoFormat}\", \"embeddingMode\": \"${parameters.embeddingMode}\", \"source\": { \"bytes\": \"${parameters.inputVideo}\" } } } }",
        "pre_process_function": "connector.pre_process.bedrock.nova.video_embedding",
        "post_process_function": "connector.post_process.bedrock.nova.embedding"
      }
    ]
  }
}
```

The `AUDIO_VIDEO_COMBINED` embedding mode produces a single embedding that captures both the visual and audio tracks of the video.

Test the model:

```json
POST /_plugins/_ml/models/<VIDEO_MODEL_ID>/_predict
{
  "parameters": {
    "inputVideo": "<BASE64_ENCODED_VIDEO>"
  }
}
```

### Audio embedding model

```json
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "Amazon Nova Multimodal Embeddings - audio",
  "function_name": "remote",
  "description": "Nova audio embedding model",
  "connector": {
    "name": "Amazon Bedrock connector: Nova audio embedding",
    "description": "Connector to the Amazon Nova Multimodal Embeddings model for audio",
    "version": 1,
    "protocol": "aws_sigv4",
    "credential": {
      "roleArn": "<YOUR_IAM_ROLE_ARN>"
    },
    "parameters": {
      "region": "<YOUR_AWS_REGION>",
      "service_name": "bedrock",
      "model": "amazon.nova-2-multimodal-embeddings-v1:0",
      "input_docs_processed_step_size": 1,
      "dimensions": 1024,
      "normalize": true,
      "embeddingTypes": ["float"],
      "audioFormat": "mp3"
    },
    "actions": [
      {
        "action_type": "predict",
        "method": "POST",
        "url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/invoke",
        "headers": {
          "content-type": "application/json",
          "x-amz-content-sha256": "required"
        },
        "request_body": "{ \"taskType\": \"SINGLE_EMBEDDING\", \"singleEmbeddingParams\": { \"embeddingPurpose\": \"GENERIC_INDEX\", \"embeddingDimension\": ${parameters.dimensions}, \"audio\": { \"format\": \"${parameters.audioFormat}\", \"source\": { \"bytes\": \"${parameters.inputAudio}\" } } } }",
        "pre_process_function": "connector.pre_process.bedrock.nova.audio_embedding",
        "post_process_function": "connector.post_process.bedrock.nova.embedding"
      }
    ]
  }
}
```

**Note**: On Amazon OpenSearch Service versions earlier than 3.3, the `audio_embedding` pre-processing function isn't available. Instead, use `connector.pre_process.bedrock.nova.video_embedding` and use `inputVideo` instead of `inputAudio` in both the connector request body and the `_predict` request.

Test the model:

```json
POST /_plugins/_ml/models/<AUDIO_MODEL_ID>/_predict
{
  "parameters": {
    "inputAudio": "<BASE64_ENCODED_AUDIO>"
  }
}
```

## Step 2: Configure multimodal RAG

With the embedding models in place, you'll now register an LLM, create pipelines that generate embeddings at ingestion time and produce answers at search time, and then create an index that ties them together.

### Register an LLM

Register an OpenAI chat model that will generate answers from the retrieved context:

```json
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "OpenAI GPT-3.5 Turbo",
  "function_name": "remote",
  "description": "OpenAI chat model for RAG",
  "connector": {
    "name": "OpenAI chat connector",
    "description": "Connector to the OpenAI chat completions API",
    "version": 1,
    "protocol": "http",
    "parameters": {
      "endpoint": "api.openai.com",
      "model": "gpt-3.5-turbo"
    },
    "credential": {
      "openAI_key": "<YOUR_OPENAI_API_KEY>"
    },
    "actions": [
      {
        "action_type": "predict",
        "method": "POST",
        "url": "https://${parameters.endpoint}/v1/chat/completions",
        "headers": {
          "Authorization": "Bearer ${credential.openAI_key}"
        },
        "request_body": "{ \"model\": \"${parameters.model}\", \"messages\": ${parameters.messages} }"
      }
    ]
  }
}
```

### Create a search pipeline with a RAG processor

The [`retrieval_augmented_generation`](https://docs.opensearch.org/latest/search-plugins/search-pipelines/rag-processor/) response processor sends the top search results to the LLM as context, along with the user's question:

```json
PUT /_search/pipeline/rag_search_pipeline
{
  "response_processors": [
    {
      "retrieval_augmented_generation": {
        "tag": "multimodal_rag",
        "description": "Multimodal RAG pipeline",
        "model_id": "<LLM_MODEL_ID>",
        "context_field_list": ["text"],
        "system_prompt": "You are a helpful multimodal assistant.",
        "user_instructions": "Answer the question based on the provided context, which is retrieved from text, image, video, and audio content."
      }
    }
  ]
}
```

The LLM receives the fields listed in `context_field_list` as context. Because this example removes raw media from documents after generating embeddings, include a text field, such as a caption, description, or transcript, in your image, video, and audio documents so that the LLM has context to work with for every match.

### Create an ingest pipeline

The ingest pipeline uses a `text_embedding` processor for each modality. Each processor sends a field to the corresponding Nova model and stores the result in a vector field. A final `remove` processor drops the raw Base64 media so that it isn't stored in the index:

```json
PUT /_ingest/pipeline/rag_ingest_pipeline
{
  "description": "Generate Nova embeddings for text, images, video, and audio",
  "processors": [
    {
      "text_embedding": {
        "model_id": "<TEXT_MODEL_ID>",
        "field_map": {
          "text": "text_embedding"
        }
      }
    },
    {
      "text_embedding": {
        "model_id": "<IMAGE_MODEL_ID>",
        "field_map": {
          "image": "image_embedding"
        }
      }
    },
    {
      "text_embedding": {
        "model_id": "<VIDEO_MODEL_ID>",
        "field_map": {
          "video": "video_embedding"
        }
      }
    },
    {
      "text_embedding": {
        "model_id": "<AUDIO_MODEL_ID>",
        "field_map": {
          "audio": "audio_embedding"
        }
      }
    },
    {
      "remove": {
        "field": ["image", "video", "audio"],
        "ignore_missing": true,
        "description": "Remove the raw image, video, and audio fields after generating embeddings"
      }
    }
  ]
}
```

A document doesn't need to contain every field. If a field is missing, the corresponding processor skips it.

### Create a vector index

Create an index that uses the ingest pipeline and search pipeline by default. All four connectors request 1,024-dimensional embeddings, so every vector field uses the same dimension. Matching dimensions also make cross-modal search possible, for example, searching the image vector field using a text query:

```json
PUT /multimodal_rag_index
{
  "settings": {
    "index": {
      "knn": true,
      "default_pipeline": "rag_ingest_pipeline",
      "search.default_pipeline": "rag_search_pipeline"
    }
  },
  "mappings": {
    "properties": {
      "text": { "type": "text" },
      "image": { "type": "binary" },
      "video": { "type": "binary" },
      "audio": { "type": "binary" },
      "text_embedding": { "type": "knn_vector", "dimension": 1024 },
      "image_embedding": { "type": "knn_vector", "dimension": 1024 },
      "video_embedding": { "type": "knn_vector", "dimension": 1024 },
      "audio_embedding": { "type": "knn_vector", "dimension": 1024 }
    }
  }
}
```

## Step 3: Ingest multimodal data

When you index documents into `multimodal_rag_index`, the default ingest pipeline generates their embeddings automatically.

### Ingest text documents

```json
POST /_bulk
{ "index": { "_index": "multimodal_rag_index", "_id": "text1" } }
{ "text": "Oval Sapphire Cocktail Ring. A beautiful grand blue spinel cut in an oval shape sits north-south in the center of an opulent setting. A series of marquise and round cubic zirconia circumnavigate the center stone to show off the extravagance of the piece. Such a large blue cocktail ring is a rare find!" }
{ "index": { "_index": "multimodal_rag_index", "_id": "text2" } }
{ "text": "Canari Men's Cyclewear Core Tank Top, Killer Yellow, Large. The CORE Tank has all the same great features as the CORE Jersey but comes in a tank version. The super-fast-wicking DriPRO fabric helps keep you dry and regulates your body temperature, keeping you cool." }
{ "index": { "_index": "multimodal_rag_index", "_id": "text3" } }
{ "text": "Nine West Women's Carved Pump. Nine West offers a quick edit of the runways, pinpointing the must-have looks of the season and translating what is fun, hip, and of the moment. It is trend-right footwear that you will reach for in your closet again and again." }
```

### Ingest images, video, and audio

Media documents use the same bulk format. Provide the media as a Base64-encoded string in the `image`, `video`, or `audio` field, along with a short `text` description that the LLM can use as context:

```json
POST /_bulk
{ "index": { "_index": "multimodal_rag_index", "_id": "image1" } }
{ "text": "Product photo of a wide-brim straw sun hat", "image": "/9j/4AAQSkZJRgABAQAAAQABAAD..." }
{ "index": { "_index": "multimodal_rag_index", "_id": "video1" } }
{ "text": "Short video showing an oval sapphire ring rotating under studio lighting", "video": "AAAAIGZ0eXBpc29tAAACAGlzb21p..." }
{ "index": { "_index": "multimodal_rag_index", "_id": "audio1" } }
{ "text": "Audio product review of a cycling tank top", "audio": "SUQzBAAAAAAAI1RTU0UAAAAPAAAD..." }
```

**Note**: Base64 strings for video and audio can be large. Keep bulk requests within your domain's maximum HTTP request payload size, and ingest large files in smaller batches.

## Step 4: Run a multimodal RAG query

Now you can search across all modalities and generate an answer in a single request. The following query combines several [neural queries](https://docs.opensearch.org/latest/query-dsl/specialized/neural/) in a `bool` query. Each neural query uses the model that matches its target vector field: the text query is embedded using the text model, the reference image using the image model, and the reference video using the video model. The `generative_qa_parameters` in the `ext` block pass the user's question to the RAG processor:

```json
GET /multimodal_rag_index/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "neural": {
            "text_embedding": {
              "query_text": "Oval ring",
              "model_id": "<TEXT_MODEL_ID>",
              "k": 5
            }
          }
        },
        {
          "neural": {
            "image_embedding": {
              "query_text": "<BASE64_ENCODED_QUERY_IMAGE>",
              "model_id": "<IMAGE_MODEL_ID>",
              "k": 5
            }
          }
        },
        {
          "neural": {
            "video_embedding": {
              "query_text": "<BASE64_ENCODED_QUERY_VIDEO>",
              "model_id": "<VIDEO_MODEL_ID>",
              "k": 5
            }
          }
        }
      ]
    }
  },
  "ext": {
    "generative_qa_parameters": {
      "llm_model": "gpt-3.5-turbo",
      "llm_question": "What is an oval ring?",
      "context_size": 5,
      "message_size": 5,
      "timeout": 15
    }
  },
  "_source": {
    "excludes": ["text_embedding", "image_embedding", "video_embedding", "audio_embedding"]
  }
}
```

The response contains the matching documents in `hits` and the LLM's answer in `ext.retrieval_augmented_generation.answer`.

Because all embeddings share one semantic space, you can also search across modalities. For example, you can run a text neural query using the text model against the `image_embedding` field to find images that match a text description.

## Conclusion

Integrating Amazon Nova Multimodal Embeddings with OpenSearch lets you embed text, images, video, and audio into a single semantic space and search across all of them using familiar OpenSearch tools: ML Commons connectors, ingest pipelines, neural queries, and search pipelines. Combined with the RAG processor, this gives you a straightforward path to building applications that generate answers from all of your content, not just text.

To learn more, see the following resources:

* [Nova Multimodal Embeddings connector blueprint](https://github.com/opensearch-project/ml-commons/blob/main/docs/remote_inference_blueprints/bedrock_connector_nova_multimodal_model_blueprint.md)
* [OpenSearch RAG tutorials](https://docs.opensearch.org/latest/tutorials/gen-ai/rag/index/)
* [Amazon Nova Multimodal Embeddings documentation](https://docs.aws.amazon.com/nova/latest/nova2-userguide/embeddings.html)

Have feedback or questions? Join the conversation on the [OpenSearch forum](https://forum.opensearch.org/).
