---
layout: post
title:  "OpenSearch now supports DeepSeek chat models"
authors:
 - seanzheng
 - ylwu
 - nathhjo
 - kolchfa
date: 2025-01-29
categories:
  - technical-posts
meta_keywords: OpenSearch DeepSeek integration, LLM integration, RAG, AI search, machine learning, natural language processing, open-source LLM
meta_description: Explore how OpenSearch's integration with DeepSeek R1 LLM models enables cost-effective Retrieval-Augmented Generation (RAG) while maintaining high performance comparable to leading LLMs.
---

We're excited to announce that OpenSearch now supports DeepSeek integration, providing powerful and cost-effective AI capabilities. DeepSeek R1 is a recently released open-source large language model (LLM) that delivers **similar benchmarking performance** to leading LLMs like OpenAI O1 ([report](https://github.com/deepseek-ai/DeepSeek-R1/blob/main/DeepSeek_R1.pdf)) at a significantly **lower cost** ([DeepSeek API pricing](https://api-docs.deepseek.com/quick_start/pricing)). Because DeepSeek R1 is open source, you can download and deploy it to your preferred infrastructure. This enables you to build more cost-effective and sustainable retrieval-augmented generation (RAG) solutions build on top of OpenSearch Vector Database.

OpenSearch gives you the flexibility to connect to any remote inference service, such as DeepSeek or OpenAI, using machine learning (ML) connectors. You can use [prebuilt connector blueprints](https://github.com/opensearch-project/ml-commons/tree/main/docs/remote_inference_blueprints) or customize connectors based on your requirements. For more information about connector blueprints, see [Blueprints](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/blueprints/).  

We've added a new [connector blueprint](https://github.com/opensearch-project/ml-commons/blob/main/docs/remote_inference_blueprints/deepseek_connector_chat_blueprint.md) for the DeepSeek R1 model. This integration, combined with OpenSearch's built-in vector database capabilities, makes it easier and more cost effective to build [RAG applications](https://opensearch.org/docs/latest/search-plugins/conversational-search) in OpenSearch.  

The following example shows you how to implement RAG with DeepSeek in OpenSearch's vector database. This example guides you through creating a connector for the [DeepSeek chat model](https://api-docs.deepseek.com/api/create-chat-completion) and setting up a [RAG pipeline](https://opensearch.org/docs/latest/search-plugins/search-pipelines/rag-processor/) in OpenSearch.

### 1. Create a connector for DeepSeek

First, create a connector for the DeepSeek chat model, providing your own DeepSeek API key:

```json
POST /_plugins/_ml/connectors/_create
{
  "name": "DeepSeek Chat",
  "description": "Test connector for DeepSeek Chat",
  "version": "1",
  "protocol": "http",
  "parameters": {
    "endpoint": "api.deepseek.com",
    "model": "deepseek-chat"
  },
  "credential": {
    "deepSeek_key": "<PLEASE ADD YOUR DEEPSEEK API KEY HERE>"
  },
  "actions": [
    {
      "action_type": "predict",
      "method": "POST",
      "url": "https://${parameters.endpoint}/v1/chat/completions",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer ${credential.deepSeek_key}"
      },
      "request_body": "{ \"model\": \"${parameters.model}\", \"messages\": ${parameters.messages} }"
    }
  ]
}
```

The response contains a connector ID for the newly created connector:

```json
{
  "connector_id": "n0dOqZQBQwAL8-GO1pYI"
}
```

For more information, see [Connecting to externally hosted models](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/index/).

### 2. Create a model group

Create a model group for the DeepSeek chat model:

```json
POST /_plugins/_ml/model_groups/_register
{
    "name": "remote_model_group_chat",
    "description": "This is an example description"
}
```

The response contains a model group ID:

```json
{
  "model_group_id": "b0cjqZQBQwAL8-GOVJZ4",
  "status": "CREATED"
}
```

For more information about model groups, see [Model access control](https://opensearch.org/docs/latest/ml-commons-plugin/model-access-control/).

### 3. Register and deploy the model

Register the model to the model group and deploy the model using the model group ID and connector ID created in the previous steps:

```json
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "DeepSeek Chat model",
  "function_name": "remote",
  "model_group_id": "b0cjqZQBQwAL8-GOVJZ4",
  "description": "DeepSeek Chat",
  "connector_id": "n0dOqZQBQwAL8-GO1pYI"
}
```

The response contains the model ID:

```json
{
  "task_id": "oEdPqZQBQwAL8-GOCJbw",
  "status": "CREATED",
  "model_id": "oUdPqZQBQwAL8-GOCZYL"
}
```

To ensure that the connector is working as expected, test the model:

```json
POST /_plugins/_ml/models/oUdPqZQBQwAL8-GOCZYL/_predict
{
  "parameters": {
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }
}
```

The response verifies that the connector is working as expected:

```json
{
  "inference_results": [
    {
      "output": [
        {
          "name": "response",
          "dataAsMap": {
            "id": "9d9bd689-88a5-44b0-b73f-2daa92518761",
            "object": "chat.completion",
            "created": 1.738011126E9,
            "model": "deepseek-chat",
            "choices": [
              {
                "index": 0.0,
                "message": {
                  "role": "assistant",
                  "content": "Hello! How can I assist you today? 😊"
                },
                "finish_reason": "stop"
              }
            ],
            "usage": {
              "prompt_tokens": 11.0,
              "completion_tokens": 11.0,
              "total_tokens": 22.0,
              "prompt_tokens_details": {
                "cached_tokens": 0.0
              },
              "prompt_cache_hit_tokens": 0.0,
              "prompt_cache_miss_tokens": 11.0
            },
            "system_fingerprint": "fp_3a5770e1b4"
          }
        }
      ],
      "status_code": 200
    }
  ]
}
```

### 4. Create a search pipeline

Create a search pipeline with a `retrieval_augmented_generation` processor:

```json
PUT /_search/pipeline/rag_pipeline
{
  "response_processors": [
    {
      "retrieval_augmented_generation": {
        "tag": "deepseek_pipeline_demo",
        "description": "Demo pipeline Using DeepSeek Connector",
        "model_id": "oUdPqZQBQwAL8-GOCZYL",
        "context_field_list": ["text"],
        "system_prompt": "You are a helpful assistant",
        "user_instructions": "Generate a concise and informative answer in less than 100 words for the given question"
      }
    }
  ]
}
```

For more information, see [Conversational search](https://opensearch.org/docs/latest/search-plugins/conversational-search).

### 5. Create a conversation memory

Assuming that you created a k-NN index and ingested the data to use vector search, you can now create a conversation memory. For more information about creating a k-NN index, see [k-NN index](https://opensearch.org/docs/latest/search-plugins/knn/knn-index/). For more information about vector search, see [vector search](https://opensearch.org/docs/latest/search-plugins/vector-search/). For more information about ingesting data, see [Ingest RAG data into an index](https://opensearch.org/docs/latest/search-plugins/conversational-search/#step-4-ingest-rag-data-into-an-index).

Create a conversation memory to store all messages from a conversation:

```json
POST /_plugins/_ml/memory/
{
  "name": "Conversation about NYC population"
}
```

The response contains a memory ID for the created memory:

```json
{
  "memory_id": "znCqcI0BfUsSoeNTntd7"
}
```

### 6. Use the pipeline for RAG

Send a query to OpenSearch and provide additional parameters in the `ext.generative_qa_parameters` object:

```json
GET /my_rag_test_data/_search
{
  "query": {
    "match": {
      "text": "What's the population of NYC metro area in 2023"
    }
  },
  "ext": {
    "generative_qa_parameters": {
      "llm_model": "deepseek-chat",
      "llm_question": "What's the population of NYC metro area in 2023",
      "memory_id": "znCqcI0BfUsSoeNTntd7",
      "context_size": 5,
      "message_size": 5,
      "timeout": 15
    }
  }
}
```

The response contains the model output:

```json
{
  ...
  "ext": {
    "retrieval_augmented_generation": {
      "answer": "The population of the New York City metro area in 2022 was 18,867,000.",
      "message_id": "p3CvcI0BfUsSoeNTj9iH"
    }
  }
}
```

## Wrapping up

By integrating DeepSeek R1, OpenSearch continues its mission to democratize AI-powered search and analytics—offering developers **more choice, greater flexibility, and lower costs**.

**Try DeepSeek R1 now!**

As always, we welcome your feedback, and we'd love to hear from you on the [OpenSearch forum](https://forum.opensearch.org/).