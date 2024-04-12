---
layout: post
title: "Configurable automation for OpenSearch ML use cases"
authors:
    - kazabdu
    - amitgalitz
    - widdisd
    - jpalis
    - jackiehanyang
    - ohltyler
    - minalsha
date: 2024-04-08
categories:
  - technical-posts
meta_keywords: Flow Framework, OpenSearch plugins, Machine Learning
meta_description: Explore the simplicity of integrating Machine Learning capabilities within OpenSearch through an innovative and groundbreaking framework designed to simplify complex setup tasks.
---

In OpenSearch, to use machine learning (ML) offerings, such as semantic, hybrid, and multimodal search, you often have to grapple with complex setup and preprocessing tasks. Additionally, you must write verbose queries, which can be a time-consuming and error-prone process.

In this blog post, we introduce the OpenSearch Flow Framework plugin, [released in version 2.13](https://opensearch.org/blog/2.13-is-ready-for-download/) and designed to streamline this cumbersome process. By using this plugin, you can simplify complex setups with just one simple API call. We've provided automated templates, enabling you to create connectors, register models, deploy them, and register agents and tools through a single API call. This eliminates the complexity of calling multiple APIs and orchestrating setups based on the responses.

## Before the Flow Framework plugin

Previously, setting up semantic search involves *four separate API calls*, outlined in the [semantic search documentation](https://opensearch.org/docs/latest/search-plugins/semantic-search/):

1. Create a connector for a remote model, specifying pre- and post-processing functions.
2. Register an embedding model using the connector ID obtained in the previous step.
3. Configure an ingest pipeline to generate vector embeddings using the model ID of the registered model.
4. Create a k-NN index and add the pipeline created in the previous step.

This complex setup required you to be familiar with the OpenSearch ML Commons APIs. However, we are simplifying this experience through the Flow Framework plugin. Let's demonstrate how the plugin simplifies this process using the preceding semantic search example.

## With the Flow Framework plugin

In this example, you will configure the `semantic_search_with_cohere_embedding_query_enricher` workflow template. The workflow created using this template performs the following configuration steps:

* Deploys an externally hosted Cohere model
* Creates an ingest pipeline using the model
* Creates a sample k-NN index and configures a search pipeline to define the default model ID for that index

### Step 1: Create and provision the workflow

Using the `semantic_search_with_cohere_embedding_query_enricher` workflow template, you provision the workflow with just one required field---the API key for the Cohere Embed model:

```json
POST /_plugins/_flow_framework/workflow?use_case=semantic_search_with_cohere_embedding_query_enricher&provision=true
{
    "create_connector.credential.key" : "<YOUR API KEY>"
}
```

OpenSearch responds with a unique workflow ID, simplifying the tracking and management of the setup process:

```json
{
  "workflow_id" : "8xL8bowB8y25Tqfenm50"
}
```

Note: The workflow in the previous step creates a default k-NN index. The default index name is `my-nlp-index`.

You can customize the template default values by providing the new values in the request body. For a comprehensive list of default parameter values for this workflow template, see [Cohere Embed semantic search defaults](https://github.com/opensearch-project/flow-framework/blob/2.13/src/main/resources/defaults/cohere-embedding-semantic-search-defaults.json).

### Step 2: Ingest documents into the index

Once the workflow is provisioned, you can ingest documents into the index created by the workflow:

```json
POST /my-nlp-index/_doc
{
  "passage_text": "Hello world",
  "id": "s1"
}
```

### Step 3: Perform vector search

Performing a vector search on the index is equally straightforward. Using a neural query clause, you can easily retrieve relevant results:

```json
GET /my-nlp-index/_search
{
  "_source": {
    "excludes": [
      "passage_embedding"
    ]
  },
  "query": {
    "neural": {
      "passage_embedding": {
        "query_text": "Hi world",
        "k": 10
      }
    }
  }
}
```

With the Flow Framework plugin, we've simplified this complex setup process, enabling you to focus on your tasks without the burden of navigating complex APIs. Our goal is for you to use OpenSearch seamlessly, uncovering new possibilities in your projects.

## Viewing workflow resources

The workflow you created provisioned all the necessary resources for semantic search. To view the provisioned resources, call the Get Workflow Status API and provide the `workflowID` for your workflow:

```
GET /_plugins/_flow_framework/workflow/8xL8bowB8y25Tqfenm50/_status
```

## Additional default use cases

You can explore more default use cases by viewing [substitution templates](https://github.com/opensearch-project/flow-framework/tree/2.13/src/main/resources/substitutionTemplates) and their corresponding [defaults](https://github.com/opensearch-project/flow-framework/tree/2.13/src/main/resources/defaults).

## Creating custom use cases

You can tailor templates according to your requirements. For more information, see [these sample templates](https://github.com/opensearch-project/flow-framework/tree/main/sample-templates) and the [Automating configurations](https://opensearch.org/docs/latest/automating-configurations/index/) documentation.

## Next steps

In our ongoing efforts to enhance the user experience and streamline the process of provisioning OpenSearch ML offerings, we have some exciting plans on our roadmap. We aim to develop a user-friendly drag-and-drop frontend interface. This interface will simplify the complex steps involved in provisioning ML features, thereby allowing you to seamlessly configure and deploy your workflows. Stay tuned for updates on this exciting development!

If you have any comments or suggestions, you can comment on the following RFCs:

- [Backend RFC](https://github.com/opensearch-project/OpenSearch/issues/9213)
- [Frontend RFC](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4755)
- [Flow Framework GitHub repository](https://github.com/opensearch-project/flow-framework)
- [Flow Framework Dashboards GitHub repository](https://github.com/opensearch-project/dashboards-flow-framework)
