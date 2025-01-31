---
layout: post
title:  "Instant DeepSeek: One-Click Activation with OpenSearch"
authors:
   - kazabdu
   - minalsha
   - seanzheng
   - amitgalitz
date: 2025-01-30
categories:
  - technical-posts
meta_keywords: OpenSearch DeepSeek integration, LLM integration, RAG, AI search, Flow Framework, machine learning, natural language processing, open-source LLM
meta_description: Learn how to enable DeepSeek LLM integration in OpenSearch with just one API call using the Flow Framework plugin, simplifying the setup process for conversational search and RAG.
---


In the ([previous blog](https://opensearch.org/blog/OpenSearch-Now-Supports-DeepSeek-Chat-Models/)) post we shared that OpenSearch supports DeepSeek LLM. This blogpost talks about bringing simplicity in provisioning DeepSeek LLM integration with just one API call using OpenSearch Flow Framework plugin.  We’ve provided automated templates, enabling you to create connectors, register models, deploy them, and register agents and tools through a single API call. This eliminates the complexity of calling multiple APIs and orchestrating setups based on the responses.


### Without Flow Framework plugin

In the ([previous blog](https://opensearch.org/blog/OpenSearch-Now-Supports-DeepSeek-Chat-Models/)) blog post, setting up DeepSeek model or any LLM model involves four separate API calls:

1. Create a connector for DeepSeek model
2. Create a model group
3. Register the model using the connector ID
4. Create a search pipeline for RAG


Via OpenSearch Flow Framework plugin, we are simplifying this experience by enabling you to make a single API call. Let’s demonstrate how the plugin simplifies this process using the preceding conversational search example.


### With the Flow Framework plugin

In the following example, you will configure the `conversational_search_with_llm_deploy` workflow template to implement RAG with DeepSeek in OpenSearch. The workflow created using this template performs following configuration steps:

* Deploys an externally hosted DeepSeek model
* Registers and deploys the model
* Creates a search pipeline with RAG processor


### Step 1: Create and provision the workflow

Using the `conversational_search_with_llm_deploy` workflow template, you can provision the workflow with required fields—the API key for the DeepSeek model:

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

The ([default](https://github.com/opensearch-project/flow-framework/blob/6d6116d1bb688787f06a58fc0f6c2d9b09854007/src/main/resources/defaults/conversational-search-defaults.json)) values can be changed based on the requirement in the request body above.

OpenSearch responds with a unique workflow ID, simplifying the tracking and management of the setup process:

```json
{
    "workflow_id": "204SuZQB3ZvYMDlU9PQh"
}
```

Use the GET status API to verify the resources has been created.

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

### [Optional] Step 2: Create a conversation memory

[NOTE]: A new conversation is automatically created if conversation memory is not established in this step.

Assuming that you created a k-NN index and ingested the data to use vector search, you can now create a conversation memory. For more information about creating a k-NN index, see k-NN index. For more information about vector search, see Vector search. For more information about ingesting data, see Ingest RAG data into an index.
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


Send a query to OpenSearch and provide additional parameters in the ext.generative_qa_parameters object:

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

With the Flow Framework plugin, we’ve simplified this complex setup process to deploy not just DeepSeek but any LLM model like Cohere or OpenAI.


### Additional default use cases

You can explore more default use cases by viewing [substitution templates](https://github.com/opensearch-project/flow-framework/tree/2.13/src/main/resources/substitutionTemplates) and their corresponding [defaults](https://github.com/opensearch-project/flow-framework/tree/2.13/src/main/resources/defaults).
