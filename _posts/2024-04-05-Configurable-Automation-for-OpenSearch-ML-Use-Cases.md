---
layout: post
title: "Configurable Automation for OpenSearch ML Use Cases"
authors:
    - kazabdu
    - amitgalitz
    - dwiddis
    - jpalis
date: 2024-04-05
categories:
  - technical-posts
meta_keywords: Flow Framework, OpenSearch plugins, Machine Learning
meta_description: Explore the simplicity of integrating Machine Learning capabilities within OpenSearch through an innovative and groundbreaking framework designed to simplify complex setup tasks.
---

The current process of utilizing ML offerings in OpenSearch, such as Semantic Search, Hybrid Search, and Multimodal Search, often involves users grappling with complex setup and preprocessing tasks. Additionally, users must contend with verbose user queries, both of which can consume time and introduce errors.

In this blog post, we introduce the OpenSearch Flow Framework plugin, released in version 2.13, designed to streamline this cumbersome process. By leveraging this plugin, users can simplify complex setups with just one click. Automated templates are provided, enabling users to create connectors, register models, deploy them, and register agents and tools through a single API call. This eliminates the need for users to navigate the complexities of calling multiple APIs and waiting for their responses.

## Before Flow Framework

Traditionally, setting up Semantic Search involved the following steps as outlined [here](https://opensearch.org/docs/latest/search-plugins/semantic-search/):

a) Create a connector for a remote model with pre and post functions.
b) Register an embedding model using the connectorID obtained from the previous step.
c) Configure an ingest pipeline to generate vector embeddings using the modelID of the registered model.
d) Create a k-NN index and add the pipeline created above.

The aforementioned complex setup would typically demand users to acquire familiarity with the ML-Commons APIs of OpenSearch. However, we are simplifying this experience through the Flow Framework. Allow us to demonstrate this using the same example mentioned above, but this time leveraging the capabilities of the Flow Framework.

## With Flow Framework

In this example, we will configure the `semantic_search_with_cohere_embedding_query_enricher` workflow template. The workflow created using this template performs the following configuration steps:

* Deploys an externally hosted Cohere model
* Creates an ingest pipeline using the model
* Creates a sample k-NN index and configures a search pipeline to define the default model ID for that index

### Step 1: Create and Provision the workflow

Using the `semantic_search_with_cohere_embedding_query_enricher` workflow template, we provision the workflow with just one required field - the API key for the Cohere Embed model.

```
POST /_plugins/_flow_framework/workflow?use_case=semantic_search_with_cohere_embedding_query_enricher&provision=true
{
    "create_connector.credential.key" : "<YOUR API KEY>"
}
```

OpenSearch responds with a unique workflow ID, simplifying the tracking and management of the setup process:

```
{
  "workflow_id" : "8xL8bowB8y25Tqfenm50"
}
```

Note: The workflow in the previous step creates a default k-NN index. The default index name is `my-nlp-index`:

```
{
  "create_index.name": "my-nlp-index"
}
```


However, these defaults can be customized according to the values provided in the request body. For a comprehensive list of default parameter values for this workflow template, see [Cohere Embed semantic search defaults](https://github.com/opensearch-project/flow-framework/blob/2.13/src/main/resources/defaults/cohere-embedding-semantic-search-defaults.json).

### Step 2: Ingest documents into the index

Once the workflow is provisioned, documents can be ingested into the index created by the workflow:

```
PUT /my-nlp-index/_doc/1
{
  "passage_text": "Hello world",
  "id": "s1"
}
```

### Step 3: Perform vector search

Performing a vector search on the index is equally straightforward. Using a neural query clause, users can easily retrieve relevant results.

```
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
        "k": 100
      }
    }
  }
}
```

With Flow Framework, we've simplified such complex setup process, enabling users to focus on their tasks without the burden of navigating complex APIs. Our goal is to empower users to leverage the power of OpenSearch seamlessly, unlocking new possibilities in their projects

## Viewing workflow resources

The workflow you created provisioned all the necessary resources for semantic search. To view the provisioned resources, call the Get Workflow Status API and provide the `workflowID` for your workflow:

```
GET /_plugins/_flow_framework/workflow/8xL8bowB8y25Tqfenm50/_status
```

## Additional Default Use Cases

Explore more default use cases at [here](https://github.com/opensearch-project/flow-framework/tree/2.13/src/main/resources/substitutionTemplates), with their corresponding defaults stored [here](https://github.com/opensearch-project/flow-framework/tree/2.13/src/main/resources/defaults).

## Creating Custom Use Cases

Tailor templates according to your requirements. Sample templates are available [here](https://github.com/opensearch-project/flow-framework/tree/main/sample-templates), and refer to our documentation [here](https://opensearch.org/docs/latest/automating-configurations/index/) for further guidance.

## Next Steps

In our ongoing efforts to enhance user experience and streamline the process of provisioning the ML offerings of OpenSearch, we have an exciting plan in the pipeline. We aim to develop a user-friendly drag-and-drop frontend interface. This interface will simplify complex steps involved in provisioning ML capabilities, thereby allowing users to seamlessly configure and deploy their workflows with ease. Stay tuned for updates on this exciting development!
If you have any comments or suggestions please comment on the RFCs:

1. Backend: https://github.com/opensearch-project/OpenSearch/issues/9213
2. Frontend: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4755
3. Github Repository: https://github.com/opensearch-project/flow-framework and https://github.com/opensearch-project/dashboards-flow-framework
