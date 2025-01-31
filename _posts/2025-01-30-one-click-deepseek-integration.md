---
layout: post
title:  "Instant DeepSeek: One-click activation with OpenSearch"
authors:
   - kazabdu
   - minalsha
   - seanzheng
   - amitgalitz
   - kolchfa
date: 2025-01-31
categories:
  - technical-posts
meta_keywords: OpenSearch DeepSeek integration, LLM integration, RAG, AI search, Flow Framework, machine learning, natural language processing, open-source LLM
meta_description: Learn how to enable DeepSeek LLM integration in OpenSearch with just one API call using the Flow Framework plugin, simplifying the setup process for conversational search and RAG.
---

In an [earlier blog post](https://opensearch.org/blog/OpenSearch-Now-Supports-DeepSeek-Chat-Models/), we introduced OpenSearch's support for the DeepSeek large language model (LLM). This post focuses on simplifying DeepSeek LLM integration using the OpenSearch Flow Framework plugin. With just one API call, you can provision the entire integration—creating connectors, registering models, deploying them, and setting up agents and tools. Automated templates handle the setup, eliminating the need to call multiple APIs or manage complex orchestration.


## Manual setup

In our [earlier blog post](https://opensearch.org/blog/OpenSearch-Now-Supports-DeepSeek-Chat-Models/), setting up the DeepSeek model—or any LLM—required four separate API calls:  

1. Creating a connector for the DeepSeek model  
2. Creating a model group  
3. Registering the model using the connector ID  
4. Creating a search pipeline for retrieval-augmented generation (RAG)  

With the OpenSearch Flow Framework plugin, this process is now streamlined into a single API call. In the following example, we'll present a simplified setup using the conversational search example from the earlier blog post.


## One-click deployment

In the following example, you will configure the `conversational_search_with_llm_deploy` workflow template to implement RAG with DeepSeek in OpenSearch. The workflow created using this template performs the following configuration steps:

* Deploys an externally hosted DeepSeek model
* Registers and deploys the model
* Creates a search pipeline with a RAG processor


### Step 1: Create and provision the workflow

Using the `conversational_search_with_llm_deploy` workflow template, you can provision the workflow by specifying the required fields. Specify your API key for the DeepSeek model in the `create_connector.credential.key`:

```json
POST _plugins/_flow_framework/workflow?use_case=conversational_search_with_llm_deploy&provision=true
{
    "create_connector.credential.key" : "<PLEASE ADD YOUR DEEPSEEK API KEY HERE>",
    "create_connector.endpoint": "api.deepseek.com",
    "create_connector.model": "deepseek-chat",
    "create_connector.actions.url": "https://${parameters.endpoint}/v1/chat/completions",
    "create_connector.actions.request_body": "{ \"model\": \"${parameters.model}\", \"messages\": ${parameters.messages} }",
    "register_remote_model.name": "DeepSeek Chat model",
    "register_remote_model.description": "DeepSeek Chat",
    "create_search_pipeline.pipeline_id": "rag_pipeline",
    "create_search_pipeline.retrieval_augmented_generation.tag": "deepseek_pipeline_demo",
    "create_search_pipeline.retrieval_augmented_generation.description": "Demo pipeline Using DeepSeek Connector"
}
```

You can change the [default values](https://github.com/opensearch-project/flow-framework/blob/6d6116d1bb688787f06a58fc0f6c2d9b09854007/src/main/resources/defaults/conversational-search-defaults.json) in the preceding request body based on your requirements.

OpenSearch responds with a unique workflow ID, simplifying the tracking and management of the setup process:

```json
{
    "workflow_id": "204SuZQB3ZvYMDlU9PQh"
}
```

Use the GET Status API to verify that all resources were created successfully:

```json
GET _plugins/_flow_framework/workflow/204SuZQB3ZvYMDlU9PQh/_status
{
    "workflow_id": "204SuZQB3ZvYMDlU9PQh",
    "state": "COMPLETED",
    "resources_created": [
        {
            "resource_id": "3E4SuZQB3ZvYMDlU9PRz",
            "workflow_step_name": "create_connector",
            "workflow_step_id": "create_connector",
            "resource_type": "connector_id"
        },
        {
            "resource_id": "3k4SuZQB3ZvYMDlU9PTJ",
            "workflow_step_name": "register_remote_model",
            "workflow_step_id": "register_model",
            "resource_type": "model_id"
        },
        {
            "resource_id": "3k4SuZQB3ZvYMDlU9PTJ",
            "workflow_step_name": "deploy_model",
            "workflow_step_id": "register_model",
            "resource_type": "model_id"
        },
        {
            "resource_id": "rag_pipeline",
            "workflow_step_name": "create_search_pipeline",
            "workflow_step_id": "create_search_pipeline",
            "resource_type": "pipeline_id"
        }
    ]
}
```

### (Optional) Step 2: Create a conversation memory

**Note**: If you skip this step and don't create a conversation memory, a new conversation will be created automatically.

Assuming that you created a k-NN index and ingested the data to use vector search, you can now create a conversation memory. For more information about creating a k-NN index, see [k-NN index](https://opensearch.org/docs/latest/search-plugins/knn/knn-index/). For more information about vector search, see [Vector search](https://opensearch.org/docs/latest/search-plugins/vector-search/). For more information about ingesting data, see [Ingest RAG data into an index](https://opensearch.org/docs/latest/search-plugins/conversational-search/#step-4-ingest-rag-data-into-an-index).

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


### Step 3: Use the pipeline for RAG


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
      "memory_id": "znCqcI0BfUsSoeNTntd7", <can skip memory_id if skipped step2>
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
      "answer": "The population of the New York City metro area in 2023 was 18,867,000.",
      "message_id": "p3CvcI0BfUsSoeNTj9iH"
    }
  }
}
```

## Additional use cases

The preceding example represents just one of many possible workflows. The Flow Framework plugin comes with a variety of prebuilt templates designed for different scenarios. You can explore our [substitution templates](https://github.com/opensearch-project/flow-framework/tree/2.13/src/main/resources/substitutionTemplates) for various workflows and review their corresponding [default configurations](https://github.com/opensearch-project/flow-framework/tree/2.13/src/main/resources/defaults).

These resources will help you discover and implement other automated workflows that best suit your needs.

## Conclusion

By using the Flow Framework plugin, we've transformed a complex, multi-step setup process into a single, simple API call. This simplification isn't limited to DeepSeek—you can use the same streamlined approach to deploy models from other leading LLM providers like Cohere and OpenAI. Whether you're experimenting with different models or setting up production environments, the Flow Framework plugin makes LLM integration faster and more reliable.