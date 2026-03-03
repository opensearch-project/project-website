---
layout: post
title: "Asymmetric model support: Optimizing neural search for queries and documents"
authors:
    - mfenqin
    - br3no
    - heemin
    - seanzheng
date: 2026-01-15
categories:
  - technical-posts
meta_keywords: asymmetric embeddings, neural search, semantic search, E5 model, text embeddings, query optimization, OpenSearch neural search
meta_description: Learn how asymmetric embedding models in OpenSearch improve search relevance by using different embeddings for queries and documents. Includes benchmarks, setup guide, and best practices.
has_science_table: true
---

Neural search in OpenSearch has traditionally used symmetric embedding models, where queries and documents are encoded identically. While effective, this approach doesn't reflect how search actually works: queries are typically short and question-like, while documents are longer and information-rich. Asymmetric embedding models address this mismatch by optimizing embeddings differently for queries versus documents, leading to significant improvements in search relevance.

OpenSearch now supports asymmetric embedding models, including state-of-the-art models like E5 that dominate the [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard). In this post, you'll learn how asymmetric models work, see comprehensive benchmark results, and follow a step-by-step guide to implement asymmetric neural search in your OpenSearch cluster.

## What are asymmetric embeddings?

Asymmetric embedding models use different encoding strategies for queries and documents. The key difference is in how text is processed:

**Passage embeddings (for documents)**:
- Add a `passage:` prefix to the text
- Optimized to be found and retrieved
- Generated during document indexing

**Query embeddings (for search)**:
- Add a `query:` prefix to the text  
- Optimized to find relevant content
- Generated at search time

This distinction allows the model to learn specialized representations. For example, the E5 model internally processes "What are some parks in NYC?" as `query: What are some parks in NYC?` during search, while indexing "Central Park is a large public park..." as `passage: Central Park is a large public park...`. This asymmetry helps the model better match short queries to longer documents.

## Why asymmetric models outperform symmetric models
Asymmetric models excel when there's a clear distinction between query and document characteristics—particularly when queries are short and passages are long. To evaluate this, we measured search relevance using three complementary metrics at cutoff 10: NDCG (ranking quality), MAP (precision), and Recall (coverage) across selected BEIR datasets.

The table below illustrates how dataset characteristics influence the expected performance advantage of asymmetric models. When query length and passage length differ significantly, asymmetric 
models show strong advantages. When lengths are similar, the performance gap narrows considerably.

| Dataset | Avg Query Length | Median Query Length | Avg Passage Length | Median Passage Length | Passages | Test Queries | Expected Bias |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| NFCorpus | 3.29 | 2 | 232.10 | 224 | 3,633 | 323 | GOOD |
| TREC-COVID | 10.60 | 10 | 148.64 | 155 | 171,332 | 50 | EXCELLENT |
| SciFact | 12.51 | 12 | 201.81 | 192 | 5,183 | 300 | GOOD |
| ArguAna | 193.55 | 174 | 164.19 | 147 | 8,674 | 1,406 | POOR |


## Benchmarking results

We evaluated symmetric and asymmetric models across four BEIR datasets with varying query-passage length ratios. Results confirm that asymmetric models deliver substantial gains when length asymmetry exists.

Here are the key takeaways:

- Asymmetric models show dramatic improvements (up to 125%) when query-passage length asymmetry is high.
- Even in "GOOD" bias scenarios, expect 15-37% NDCG improvements over symmetric models.
- When lengths are similar, asymmetric models offer no advantage—sparse search may even outperform.

<table>
   <tr>
       <td><b>Dataset</b></td>
       <td><b>Bias</b></td>
       <td><b>Metrics</b></td>
       <td><b>Symmetric</b></td>
       <td><b>Asymmetric</b></td>
       <td><b>Asymmetric vs Symmetric</b></td>
   </tr>
   <tr>
       <td rowspan="3">TREC-COVID</td>
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
       <td rowspan="3">SciFact</td>
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
       <td rowspan="3">NFCorpus</td>
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
       <td rowspan="3">ArguAna</td>
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

## Setting up asymmetric neural search
Follow these steps to implement asymmetric neural search in your OpenSearch cluster. This example uses a remote SageMaker endpoint, but you can also deploy models locally.

1. Prerequisites: Deploy a sagemaker endpoint
check out the deployment scripts: https://github.com/opensearch-project/opensearch-py-ml/pull/587

```
cd opensearch-py-ml/docs/source/example/common

## deploy
python3 deploy.py --model asymmetric_e5 --instance-type ml.m5.large

## validate
./validate.sh <YOUR_SAGEMAKER_ENDPOINT>

```

For more information about how to deploy a sagemaker endpoint, see [Amazon Sagamaker](https://docs.aws.amazon.com/sagemaker/latest/dg/canvas-deploy-model.html).

2. Register a model group: Create a model group to organize your models:

```json
POST /_plugins/_ml/model_groups/_register
{
    "name": "remote_model_group",
     "description": "A model group for remote models"
}
```    

3. Create a remote connector: Create a remote connector with sagemaker endpoint:
   
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

4. Register and deploy the asymmetric model: Register an asymmetric text embedding model with query and passage prefixes:

```json
POST /_plugins/_ml/model_groups/_register
{
  "name": "e5-asymmetric-remote",
  "function_name": "remote",
  "model_group_id": "<YOUR_MODEL_GROUP_ID>",
  "description": "Asymmetric E5 embedding model for semantic search",
  "connector_id": "<YOUR_CONNECTOR_ID>",
  "model_config": {
    "model_type": "text_embedding",
    "embedding_dimension": 384,
    "framework_type": "SENTENCE_TRANSFORMERS",
    "additional_config": {
      "space_type": "l2",
      "is_asymmetric": true,
      "model_family": "e5",
      "query_prefix": "query: ",
      "passage_prefix": "passage: "
    }
  }
}
```


5. Create an index with asymmetric model: semantic field type automatically enables semantic indexing and querying based on the configured machine learning (ML) model. More details can be found [OpenSearch Semantic Field Type](https://docs.opensearch.org/latest/mappings/supported-field-types/semantic/)


```json
POST /my-nlp-index 
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
        "model_id": "<YOUR_MODEL_ID>",
        "dense_embedding_config": {
          "type": "knn_vector",
          "method": {
            "name": "hnsw",
            "engine": "lucene"
          }
        }
      }
    }
  }
}
```

Check the index mapping
```json
GET /my-nlp-index/_mapping
```

OpenSearch returns response:

```
{
    "my-nlp-index": {
        "mappings": {
            "properties": {
                "id": {
                    "type":"text"
                },
                "passage_text": {
                    "type":"semantic",
                    "model_id":"<YOUR_MODEL_ID>",
                    "raw_field_type":"text",
                    "dense_embedding_config": {
                        "method": {
                            "engine":"lucene",
                            "name":"hnsw"
                        },
                        "type":"knn_vector"
                    }
                },
                "passage_text_semantic_info": {
                    "properties": {
                        "embedding": {
                            "type":"knn_vector",
                            "dimension":384,
                            "method": {
                                "engine":"lucene",
                                "space_type":"l2",
                                "name":"hnsw",
                                "parameters": {
                                }
                            }
                        },
                        "model": {
                            "properties": {
                                "id": {
                                    "type":"text",
                                    "index":false
                                },
                                "name": {
                                    "type":"text",
                                    "index":false
                                },
                                "type": {
                                    "type":"text",
                                    "index":false
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

```

6. ingest doc into the index

```json
PUT /my-nlp-index/_doc/1
{
  "passage_text": "Hello world",
  "id": "s1"
}
```

7. neural-search with asymmetric model

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
        "query_text": "Hi world"
      }
    }
  }
}
```

OpenSearch returns response:

```json
{"took":317,"timed_out":false,"_shards":{"total":1,"successful":1,"skipped":0,"failed":0},"hits":{"total":{"value":1,"relation":"eq"},"max_score":0.25255635,"hits":[{"_index":"my-nlp-index","_id":"1","_score":0.25255635,"_source":{"passage_text":"Hello world","id":"s1"}}]}}%     
```



## Summary

Asymmetric embedding models represent a significant advancement in neural search, offering substantial quality improvements for common search scenarios. With support now available in OpenSearch, you can:

- Achieve up to 125% improvement in search relevance on technical content
- Maintain fast query latency with document-only encoding
- Use state-of-the-art models like E5 through remote or local deployment
- Seamlessly integrate with existing neural search workflows

The benchmarks demonstrate that asymmetric models excel when queries and documents differ in nature—which describes most real-world search applications. By optimizing embeddings for their specific roles in the search process, asymmetric models deliver more relevant results without sacrificing performance.

## Next steps

- Review the [asymmetric model documentation](https://opensearch.org/docs/latest/tutorials/vector-search/semantic-search/semantic-search-asymmetric/) for detailed configuration options
- Explore [pretrained asymmetric models](https://huggingface.co/intfloat/multilingual-e5-small) available on Hugging Face
- Learn about [deploying models on SageMaker](https://github.com/opensearch-project/opensearch-py-ml) for scalable inference
- Try [hybrid search](https://opensearch.org/docs/latest/search-plugins/hybrid-search/) combining asymmetric neural search with keyword matching

Share your experiences with asymmetric models on the [OpenSearch Forum](https://forum.opensearch.org/), and let us know what improvements you see in your search applications!

## Appendix

### Sample queries and passages

The following table provides sample queries and passages for each dataset, illustrating the length asymmetry between short queries and longer document passages.

| Dataset | Sample Query | Sample Passage |
|:---|:---|:---|
| NFCorpus | How Doctors Responded to Being Named a Leading Killer | By the end of graduate medical training, novice internists (collectively known as the housestaff) were initiated into the experience of either having done something to a patient which had a deleterious consequence or else having witnessed colleagues do the same. When these events occurred ... |
| TREC-COVID | what is the origin of COVID-19 | Although primary genomic analysis has revealed that severe acute respiratory syndrome coronavirus (SARS CoV) is a new type of coronavirus, the different protein trees published in previous reports have provided ... |
| SciFact | β-sheet opening occurs during pleurotolysin pore formation. | Membrane attack complex/perforin-like (MACPF) proteins comprise the largest superfamily of pore-forming proteins, playing crucial roles in immunity and pathogenesis. Soluble monomers assemble into large transmembrane ... |
| ArguAna | Poaching is becoming more advanced A stronger, militarised approach is needed as poaching is becoming ... | Tougher protection of Africa's nature reserves will only result in more bloodshed. Every time the military upgrade their weaponry, tactics and logistic, the poachers improve their own methods to counter ... |
