---
layout: post
title:  "OpenSearch Now Supports DeepSeek Chat Models"
authors:
 - seanzheng
 - ylwu
 - nathhjo
 - kolchfa
date: 2025-01-28
categories:
  - technical-posts
meta_keywords: OpenSearch DeepSeek integration, LLM integration, RAG, AI search, machine learning, natural language processing, open-source LLM
meta_description: Explore how OpenSearch's integration with DeepSeek R1 LLM models enables cost-effective Retrieval-Augmented Generation (RAG) while maintaining high performance comparable to leading LLMs.
---

We’re excited to announce that OpenSearch now supports DeepSeek integration, bringing this powerful and cost-effective AI capabilities to our users. Deepseek R1 is a recently released open source LLM model. It provides **similar benchmarking performance** with other main stream LLMs like OpenAI O1 ([report](https://github.com/deepseek-ai/DeepSeek-R1/blob/main/DeepSeek_R1.pdf)) at a significantly **lower cost** ([DeepSeek API Pricing](https://api-docs.deepseek.com/quick_start/pricing)). And on top of that, it’s also offered as open source so can be downloaded and served in infrastructure of users’ choice. This creates an opportunity for OpenSearch users to implement more cost-effective and sustainable Retrieval-Augmented Generation (RAG).

OpenSearch provides high flexibility to let users connect to any remote inference services like DeepSeek or OpenAI through ML connectors. User can use [pre-built connector blueprints](https://github.com/opensearch-project/ml-commons/tree/main/docs/remote_inference_blueprints) or customize connectors based on their requirements (read more details about [blueprints](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/blueprints/)).

We added a new connector [blueprint](https://github.com/opensearch-project/ml-commons/blob/main/docs/remote_inference_blueprints/deepseek_connector_chat_blueprint.md) for DeepSeek R1 model. This integration, along with OpenSearch’s built-in vector database capability, makes it a lot easier and cheaper to build [RAG applications](https://opensearch.org/docs/latest/search-plugins/conversational-search) in OpenSearch.

Following is an example of implementing RAG with DeepSeek in OpenSearch Vector Database. This example walks you through the process of creating connector for the [DeepSeek Chat Model](https://api-docs.deepseek.com/api/create-chat-completion) and [RAG pipeline](https://opensearch.org/docs/latest/search-plugins/search-pipelines/rag-processor/) in OpenSearch.

### 1. Create connector for DeepSeek Chat
Create a connector for DeepSeek Chat Model, don’t forget to provide your own DeepSeek API key. Read more [details](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/index/).

```
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
Sample response
```
{
  "connector_id": "n0dOqZQBQwAL8-GO1pYI"
}
```

### 2. Create model group
Create a model group for remote model.
```
POST /_plugins/_ml/model_groups/_register
{
    "name": "remote_model_group_chat",
    "description": "This is an example description"
}
```
Sample response
```
{
  "model_group_id": "b0cjqZQBQwAL8-GOVJZ4",
  "status": "CREATED"
}
```

### 3. Register model to model group & deploy model
Register and deploy the model with the model ID and connector ID that is created in the previous steps.
```
POST /_plugins/_ml/models/_register?deploy=true
{
  "name": "DeepSeek Chat model",
  "function_name": "remote",
  "model_group_id": "b0cjqZQBQwAL8-GOVJZ4",
  "description": "DeepSeek Chat",
  "connector_id": "n0dOqZQBQwAL8-GO1pYI"
}
```
Sample response
```
{
  "task_id": "oEdPqZQBQwAL8-GOCJbw",
  "status": "CREATED",
  "model_id": "oUdPqZQBQwAL8-GOCZYL"
}
```
Test model to make sure the connector works as expected.
```
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
  },
  "stream": false
}
```
Sample response
```
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
Create a search pipeline with a `retrieval_augmented_generation` processor. Read more [details](https://opensearch.org/docs/latest/search-plugins/conversational-search).
```
PUT /_search/pipeline/rag_pipeline
{
  "response_processors": [
    {
      "retrieval_augmented_generation": {
        "tag": "openai_pipeline_demo",
        "description": "Demo pipeline Using OpenAI Connector",
        "model_id": "oUdPqZQBQwAL8-GOCZY",
        "context_field_list": ["text"],
        "system_prompt": "You are a helpful assistant",
        "user_instructions": "Generate a concise and informative answer in less than 100 words for the given question"
      }
    }
  ]
}
```

Assuming we created a k-NN index and ingested the supplementary data, we can now create a conversation memory. Read more [details](https://opensearch.org/docs/latest/search-plugins/knn/knn-index/).

### 5. Create a conversation memory
Create a conversation memory to store all messages from a conversation.
```
POST /_plugins/_ml/memory/
{
  "name": "Conversation about NYC population"
}
```
Sample response
```
{
  "memory_id": "znCqcI0BfUsSoeNTntd7"
}
```

### 6. Use the pipeline for RAG
Send a query to OpenSearch and provide additional parameters in the `ext.generative_qa_parameters` object.
```
GET /my_rag_test_data/_search
{
  "query": {
    "match": {
      "text": "What's the population of NYC metro area in 2023"
    }
  },
  "ext": {
    "generative_qa_parameters": {
      "llm_model": "gpt-3.5-turbo",
      "llm_question": "What's the population of NYC metro area in 2023",
      "memory_id": "znCqcI0BfUsSoeNTntd7",
      "context_size": 5,
      "message_size": 5,
      "timeout": 15
    }
  }
}
```
Sample response
```
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

By integrating DeepSeek R1, OpenSearch continues its mission to democratize AI-powered search and analytics—offering developers **more choice, flexibility, and cost savings**.

**Try DeepSeek R1 now!**
