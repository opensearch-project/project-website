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
meta_description: Explore how OpenSearch's integration with DeepSeek-R1 LLM models enables cost-effective Retrieval-Augmented Generation (RAG) while maintaining high performance comparable to leading LLMs.
---

We're excited to announce that OpenSearch now supports DeepSeek integration, providing powerful and cost-effective AI capabilities. DeepSeek-R1 is a recently released open-source large language model (LLM) that delivers **similar benchmarking performance** to leading LLMs like OpenAI O1 ([report](https://github.com/deepseek-ai/DeepSeek-R1/blob/main/DeepSeek_R1.pdf)) at a significantly **lower cost** ([DeepSeek API pricing](https://api-docs.deepseek.com/quick_start/pricing)). Because DeepSeek-R1 is open source, you can download and deploy it to your preferred infrastructure. This enables you to build more cost-effective and sustainable retrieval-augmented generation (RAG) solutions in OpenSearch's vector database.

OpenSearch gives you the flexibility to connect to any inference service, such as DeepSeek or OpenAI, using machine learning (ML) connectors. You can use [prebuilt connector blueprints](https://github.com/opensearch-project/ml-commons/tree/main/docs/remote_inference_blueprints) or customize connectors based on your requirements. For more information about connector blueprints, see [Blueprints](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/blueprints/).  

We've added a new [connector blueprint](https://github.com/opensearch-project/ml-commons/blob/main/docs/remote_inference_blueprints/deepseek_connector_chat_blueprint.md) for the DeepSeek-R1 model. This integration, combined with OpenSearch's built-in vector database capabilities, makes it easier and more cost effective to build [RAG applications](https://opensearch.org/docs/latest/search-plugins/conversational-search) in OpenSearch.  

The following example shows you how to implement RAG with DeepSeek in OpenSearch's vector database. This example guides you through creating a connector for the [DeepSeek chat model](https://api-docs.deepseek.com/api/create-chat-completion) and setting up a [RAG pipeline](https://opensearch.org/docs/latest/search-plugins/search-pipelines/rag-processor/) in OpenSearch.

### Setup

For a simplified setup, you can follow this [blog post](https://opensearch.org/blog/one-click-deepseek-integration/), which allows you to create a connector for the DeepSeek model, create a model group, register the model, and create a search pipeline with a single API call.

After completing the setup, follow these steps:

### 1. Create a vector database
Follow the [neural search tutorial](https://opensearch.org/docs/latest/search-plugins/neural-search-tutorial/) to create an embedding model and a k-NN index. Then ingest data into the index:
```json
POST _bulk
{"index": {"_index": "my_rag_test_data", "_id": "1"}}
{"text": "Abraham Lincoln was born on February 12, 1809, the second child of Thomas Lincoln and Nancy Hanks Lincoln, in a log cabin on Sinking Spring Farm near Hodgenville, Kentucky.[2] He was a descendant of Samuel Lincoln, an Englishman who migrated from Hingham, Norfolk, to its namesake, Hingham, Massachusetts, in 1638. The family then migrated west, passing through New Jersey, Pennsylvania, and Virginia.[3] Lincoln was also a descendant of the Harrison family of Virginia; his paternal grandfather and namesake, Captain Abraham Lincoln and wife Bathsheba (née Herring) moved the family from Virginia to Jefferson County, Kentucky.[b] The captain was killed in an Indian raid in 1786.[5] His children, including eight-year-old Thomas, Abraham's father, witnessed the attack.[6][c] Thomas then worked at odd jobs in Kentucky and Tennessee before the family settled in Hardin County, Kentucky, in the early 1800s."}
{"index": {"_index": "my_rag_test_data", "_id": "2"}}
{"text": "Chart and table of population level and growth rate for the New York City metro area from 1950 to 2023. United Nations population projections are also included through the year 2035.\\nThe current metro area population of New York City in 2023 is 18,937,000, a 0.37% increase from 2022.\\nThe metro area population of New York City in 2022 was 18,867,000, a 0.23% increase from 2021.\\nThe metro area population of New York City in 2021 was 18,823,000, a 0.1% increase from 2020.\\nThe metro area population of New York City in 2020 was 18,804,000, a 0.01% decline from 2019."}
```

### 2. Create a conversation memory
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

### 3. Use the pipeline for RAG

Send a query to OpenSearch and provide additional parameters in the `ext.generative_qa_parameters` object:

```json
GET /my_rag_test_data/_search
{
  "query": {
    "neural": {
      "passage_embedding": {
        "query_text": "What's the population of NYC metro area in 2023?",
        "model_id": "USkHsZQBts7fa6bybx3G",
        "k": 5
      }
    }
  },
  "size": 2,
  "_source": [
    "text"
  ],
  "ext": {
    "generative_qa_parameters": {
      "llm_model": "deepseek-chat",
      "llm_question": "What's the population of NYC metro area in 2023?",
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
      "answer": "The population of the New York City metro area in 2023 was 18,867,000.",
      "message_id": "p3CvcI0BfUsSoeNTj9iH"
    }
  }
}
```
## Tutorials

The following tutorials guide you through integrating RAG in OpenSearch with the [DeepSeek chat model](https://api-docs.deepseek.com/api/create-chat-completion) and [DeepSeek-R1 model](https://huggingface.co/deepseek-ai/DeepSeek-R1):

- [OpenSearch + DeepSeek demo notebook](https://github.com/opensearch-project/ml-commons/blob/main/docs/tutorials/aws/DeepSeek_demo_notebook_for_RAG.ipynb)
- [OpenSearch + DeepSeek Chat Service API](https://github.com/opensearch-project/ml-commons/blob/main/docs/tutorials/aws/RAG_with_DeepSeek_Chat_model.md)
- [OpenSearch + DeepSeek-R1 on Amazon Bedrock](https://github.com/opensearch-project/ml-commons/blob/main/docs/tutorials/aws/RAG_with_DeepSeek_R1_model_on_Bedrock.md)
- [OpenSearch + DeepSeek-R1 on Amazon SageMaker](https://github.com/opensearch-project/ml-commons/blob/main/docs/tutorials/aws/RAG_with_DeepSeek_R1_model_on_Sagemaker.md)

## Wrapping up

By integrating DeepSeek-R1, OpenSearch continues its mission to democratize AI-powered search and analytics—offering developers **more choice, greater flexibility, and lower costs**.

**Try DeepSeek-R1 now!**

As always, we welcome your feedback, and we'd love to hear from you on the [OpenSearch forum](https://forum.opensearch.org/).