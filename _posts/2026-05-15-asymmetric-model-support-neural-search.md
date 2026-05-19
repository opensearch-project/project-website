---
layout: post
title: "Asymmetric model support: Optimizing semantic search for queries and documents"
authors:
    - mfenqin
    - bzhangam
    - heemin
date: 2026-05-15
categories:
  - technical-posts
meta_keywords: asymmetric embeddings, neural search, semantic search, E5 model, text embeddings, query optimization, OpenSearch semantic search
meta_description: Learn how asymmetric embedding models in OpenSearch improve search relevance by using different embeddings for queries and documents. Includes benchmarks, setup guide, and best practices.
has_science_table: true
---

Semantic search in OpenSearch has traditionally used symmetric embedding models, which encode queries and documents identically. While effective, this approach doesn't reflect how search actually works: queries are typically short and question-like, while documents are longer and information-rich. Asymmetric embedding models address this mismatch by optimizing embeddings differently for queries and documents, leading to significant improvements in search relevance.

Starting in OpenSearch 3.5, semantic search supports asymmetric embedding models through the [semantic field type](https://docs.opensearch.org/latest/mappings/supported-field-types/semantic/) and the [text embedding processor](https://docs.opensearch.org/latest/ingest-pipelines/processors/text-embedding/). This includes state-of-the-art models such as E5 that rank highly on the [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard). In this post, you'll learn how asymmetric models work, review comprehensive benchmark results, and follow a step-by-step guide to implement asymmetric semantic search in your OpenSearch cluster.

## What are asymmetric embeddings?

Asymmetric embedding models use different encoding strategies for queries and documents. The key difference is in how text is processed:

- **Passage embeddings** are generated during document indexing. They use a `passage:` prefix and are optimized to be found and retrieved.
- **Query embeddings** are generated at search time. They use a `query:` prefix and are optimized to find relevant content.

This distinction allows the model to learn specialized representations for queries and documents. For example, when a user searches for *"What are some parks in NYC?"*, the E5 model prepends `query:` to produce `query: What are some parks in NYC?`. When indexing, it prepends `passage:` to the document text, producing `passage: Central Park is a large public park...`. This asymmetry improves matching between short queries and longer documents.

## When asymmetric models outperform symmetric models

Asymmetric models excel when there's a clear distinction between query and document characteristics, particularly, when queries are short and passages are long. To evaluate the performance advantage, we measured search relevance across selected BEIR datasets using three complementary metrics, all at cutoff `10`: Normalized Discounted Cumulative Gain (NDCG), Mean Average Precision (MAP), and recall.

The following table illustrates the influence of dataset characteristics on the expected performance advantage of asymmetric models. When query length and passage length differ significantly, asymmetric models show strong advantages. When lengths are similar, the performance gap narrows considerably.

| Dataset | Avg query length | Median query length | Avg passage length | Median passage length | Passages | Test queries | Expected advantage |
|:---|:----------------:|:-------------------:|:------------------:|:---------------------:|:---:|:------------:|:-------------:|
| `NFCorpus` |       3.29       |          2          |       232.10       |          224          | 3,633 |     323      |     GOOD      |
| `TREC-COVID` |      10.60       |         10          |       148.64       |          155          | 171,332 |      50      |   EXCELLENT   |
| `SciFact` |      12.51       |         12          |       201.81       |          192          | 5,183 |     300      |     GOOD      |
| `ArguAna` |      193.55      |         174         |       164.19       |          147          | 8,674 |    1,406     |     POOR      |


## Benchmarking results

We evaluated symmetric and asymmetric models across four BEIR datasets with varying query to passage length ratios. The results highlight three patterns:

- Asymmetric models show dramatic improvements (up to 125% on the `TREC-COVID` dataset with 50 test queries) when queries are much shorter than passages.
- Even for datasets with a moderate expected advantage (labeled `GOOD` in the preceding table), NDCG improves by 15–37% over symmetric models.
- When query and passage lengths are similar, asymmetric models offer no advantage. In this case, sparse search may even outperform both model types.

The following table shows the full comparison across all four datasets and metrics.

<table>
   <tr>
       <th>Dataset</th>
       <th>Expected advantage</th>
       <th>Metrics</th>
       <th>Symmetric</th>
       <th>Asymmetric</th>
       <th>Asymmetric vs symmetric</th>
   </tr>
   <tr>
       <td rowspan="3"><code>TREC-COVID</code></td>
       <td rowspan="3">EXCELLENT</td>
       <td>NDCG@10</td>
       <td>0.342</td>
       <td>0.771</td>
       <td>+125.2%</td>
   </tr>
   <tr>
       <td>MAP@10</td>
       <td>0.005</td>
       <td>0.015</td>
       <td>+213.8%</td>
   </tr>
   <tr>
       <td>Recall@10</td>
       <td>0.008</td>
       <td>0.018</td>
       <td>+131.0%</td>
   </tr>
   <tr>
       <td rowspan="3"><code>SciFact</code></td>
       <td rowspan="3">GOOD</td>
       <td>NDCG@10</td>
       <td>0.458</td>
       <td>0.629</td>
       <td>+37.4%</td>
   </tr>
   <tr>
       <td>MAP@10</td>
       <td>0.451</td>
       <td>0.625</td>
       <td>+38.5%</td>
   </tr>
   <tr>
       <td>Recall@10</td>
       <td>0.650</td>
       <td>0.777</td>
       <td>+19.5%</td>
   </tr>
   <tr>
       <td rowspan="3"><code>NFCorpus</code></td>
       <td rowspan="3">GOOD</td>
       <td>NDCG@10</td>
       <td>0.278</td>
       <td>0.322</td>
       <td>+15.5%</td>
   </tr>
   <tr>
       <td>MAP@10</td>
       <td>0.086</td>
       <td>0.106</td>
       <td>+23.5%</td>
   </tr>
   <tr>
       <td>Recall@10</td>
       <td>0.120</td>
       <td>0.139</td>
       <td>+16.0%</td>
   </tr>
   <tr>
       <td rowspan="3"><code>ArguAna</code></td>
       <td rowspan="3">POOR</td>
       <td>NDCG@10</td>
       <td>0.224</td>
       <td>0.220</td>
       <td>-1.9%</td>
   </tr>
   <tr>
       <td>MAP@10</td>
       <td>0.224</td>
       <td>0.220</td>
       <td>-1.9%</td>
   </tr>
   <tr>
       <td>Recall@10</td>
       <td>0.699</td>
       <td>0.666</td>
       <td>-4.7%</td>
   </tr>
</table>

## Running semantic search using asymmetric models

You can configure asymmetric models through the `semantic` field type with no changes to your existing search workflows. Follow these steps to run a semantic search using an asymmetric model in your OpenSearch cluster.

This example uses a remote Amazon SageMaker endpoint. If you prefer to run a model locally without AWS dependencies, see [Semantic search using asymmetric models](https://docs.opensearch.org/latest/tutorials/vector-search/semantic-search/semantic-search-asymmetric/).

### Prerequisites: Deploy a SageMaker endpoint

To deploy a SageMaker endpoint, use these steps:

1. Clone the [`opensearch-py-ml`](https://github.com/opensearch-project/opensearch-py-ml) repository and install the requirements:

  ```bash
  git clone https://github.com/opensearch-project/opensearch-py-ml.git
  cd opensearch-py-ml
  pip install -r docs/source/examples/common/requirements.txt
  ```

2. Configure your AWS credentials for SageMaker access and configure your region:

  ```bash
  export AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY>
  export AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_KEY>
  export AWS_SESSION_TOKEN=<YOUR_AWS_SESSION_TOKEN>
  export AWS_REGION=<YOUR_AWS_REGION>
  ```

3. Deploy the asymmetric E5 model to a SageMaker endpoint:

  ```bash
  python3 docs/source/examples/common/deploy.py --model asymmetric_e5 --instance-type ml.m5.large
  ```

4. Validate the deployment using the endpoint name returned in the previous step:

  ```bash
  bash docs/source/examples/embedding_models/validate.sh <YOUR_SAGEMAKER_ENDPOINT>
  ```

### Step 1: Create a remote connector

Create a remote connector with a SageMaker endpoint. The connector's `content_type` parameter controls whether the model applies the `query:` or `passage:` prefix. OpenSearch automatically sets this parameter to `query` at search time and `passage` at indexing time:

```json
POST /_plugins/_ml/connectors/_create
{
  "name": "sagemaker-e5-asymmetric-connector",
  "description": "Connector for multilingual-e5-small asymmetric model",
  "version": "1",
  "protocol": "aws_sigv4",
  "parameters": {
    "region": "<YOUR_AWS_REGION>",
    "service_name": "sagemaker"
  },
  "credential": {
    "access_key": "<YOUR_AWS_ACCESS_KEY>",
    "secret_key": "<YOUR_AWS_SECRET_KEY>",
    "session_token": "<YOUR_AWS_SESSION_TOKEN>"
  },
  "actions": [
    {
      "action_type": "predict",
      "method": "POST",
      "url": "https://runtime.sagemaker.<YOUR_AWS_REGION>.amazonaws.com/endpoints/<YOUR_SAGEMAKER_ENDPOINT>/invocations",
      "headers": {
        "content-type": "application/json"
      },
      "request_body": "{ \"texts\": ${parameters.texts}, \"content_type\": \"${parameters.content_type}\" }"
    }
  ]
}
```

### Step 2: Register the asymmetric model

Register the model and configure its `query_prefix` and `passage_prefix` fields:

```json
POST /_plugins/_ml/models/_register
{
  "name": "e5-asymmetric-remote",
  "function_name": "remote",
  "description": "Asymmetric E5 embedding model for semantic search",
  "connector_id": "<YOUR_CONNECTOR_ID>",
  "model_config": {
    "model_type": "text_embedding",
    "embedding_dimension": 384,
    "framework_type": "SENTENCE_TRANSFORMERS",
    "additional_config": {
      "space_type": "cosinesimil",
      "is_asymmetric": true,
      "model_family": "e5",
      "query_prefix": "query: ",
      "passage_prefix": "passage: "
    }
  }
}
```

### Step 3: Deploy the model

Deploy the registered model to make it available for inference:

```json
POST /_plugins/_ml/models/<YOUR_MODEL_ID>/_deploy
```

### Step 4: Create an index that uses the asymmetric model

The `semantic` field type automatically enables semantic indexing and querying based on the configured model. Create an index that maps `passage_text` as a `semantic` field linked to your model:

```json
PUT /my-nlp-index
{
  "settings": {
    "index.knn": true
  },
  "mappings": {
    "properties": {
      "id": {
        "type": "text"
      },
      "passage_text": {
        "type": "semantic",
        "model_id": "<YOUR_MODEL_ID>"
      }
    }
  }
}
```

For more information, see [Semantic field type](https://docs.opensearch.org/latest/mappings/supported-field-types/semantic/).

### Step 5: Ingest a document into the index

Add a sample document to the index:

```json
PUT /my-nlp-index/_doc/1
{
  "passage_text": "OpenSearch is a community-driven, open-source search and analytics suite. It provides a distributed, multitenant-capable full-text search engine with an HTTP web interface and schema-free JSON documents.",
  "id": "s1"
}
```

### Step 6: Search the index

Run a `neural` query using the asymmetric model:

```json
GET /my-nlp-index/_search
{
  "_source": {
    "excludes": [
      "passage_text_semantic_info"
    ]
  },
  "query": {
    "neural": {
      "passage_text": {
        "query_text": "What is OpenSearch?"
      }
    }
  }
}
```

OpenSearch returns the following response. Notice how a short question-style query matches the longer informational passage:

```json
{
  "took": 317,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 1,
      "relation": "eq"
    },
    "max_score": 0.95654845,
    "hits": [
      {
        "_index": "my-nlp-index",
        "_id": "1",
        "_score": 0.95654845,
        "_source": {
          "passage_text": "OpenSearch is a community-driven, open-source search and analytics suite. It provides a distributed, multitenant-capable full-text search engine with an HTTP web interface and schema-free JSON documents.",
          "id": "s1"
        }
      }
    ]
  }
}
```

## Summary

Asymmetric models improve search relevance when queries are shorter than documents, which describes most search applications. As the benchmarks show, the improvement can reach 125% NDCG over symmetric models on datasets with high length asymmetry. 

## Next steps

For more information about asymmetric models, see the following resources:

- [Semantic search using asymmetric models](https://docs.opensearch.org/latest/tutorials/vector-search/semantic-search/semantic-search-asymmetric/) -- A tutorial for running asymmetric models locally without AWS dependencies.
- [Pretrained multilingual-e5-small model](https://huggingface.co/intfloat/multilingual-e5-small) on Hugging Face
- [`opensearch-py-ml` repository](https://github.com/opensearch-project/opensearch-py-ml) -- Scripts for deploying custom asymmetric models on SageMaker.
- [Hybrid search](https://docs.opensearch.org/latest/search-plugins/hybrid-search/) -- Combining asymmetric semantic search with keyword matching for improved recall.

Share your experiences with asymmetric models on the [OpenSearch Forum](https://forum.opensearch.org/), and let us know what improvements you observe in your search applications.

## Appendix

### Sample queries and passages

The following table provides sample queries and passages for each dataset, illustrating the length asymmetry between short queries and longer document passages.

| Dataset | Sample Query | Sample Passage |
|:---|:---|:---|
| `NFCorpus` | How Doctors Responded to Being Named a Leading Killer | By the end of graduate medical training, novice internists (collectively known as the housestaff) were initiated into the experience of either having done something to a patient which had a deleterious consequence or else having witnessed colleagues do the same. When these events occurred ... |
| `TREC-COVID` | what is the origin of COVID-19 | Although primary genomic analysis has revealed that severe acute respiratory syndrome coronavirus (SARS CoV) is a new type of coronavirus, the different protein trees published in previous reports have provided ... |
| `SciFact` | β-sheet opening occurs during pleurotolysin pore formation. | Membrane attack complex/perforin-like (MACPF) proteins comprise the largest superfamily of pore-forming proteins, playing crucial roles in immunity and pathogenesis. Soluble monomers assemble into large transmembrane ... |
| `ArguAna` | Poaching is becoming more advanced A stronger, militarised approach is needed as poaching is becoming ... | Tougher protection of Africa's nature reserves will only result in more bloodshed. Every time the military upgrade their weaponry, tactics and logistic, the poachers improve their own methods to counter ... |
