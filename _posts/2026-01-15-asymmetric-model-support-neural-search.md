---
layout: post
title: "Asymmetric model support: Optimizing neural search for queries and documents"
authors:
    - mfenqin
    - br3no
    - heemin
    - seanzheng
date: 2026-01-25
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

1. Prerequisites: Update the cluster settings to enable model registration:

```json
PUT /_cluster/settings
{
    "persistent": {
        "plugins.ml_commons.allow_registering_model_via_url": true,
        "plugins.ml_commons.only_run_on_ml_node": false,
        "plugins.ml_commons.model_access_control_enabled": true,
        "plugins.ml_commons.native_memory_threshold": 99
    }
}
```   
For more information about ML-related cluster settings, see [ML Commons cluster settings](https://opensearch.org/docs/latest/ml-commons-plugin/cluster-settings/).

2. Register a model group: Create a model group to organize your models:

```json
POST /_plugins/_ml/model_groups/_register
{
    "name": "local_model_group",
     "description": "A model group for local models"
}
```    

OpenSearch responds with a model_group_id:

```json
{
    "model_group_id": "<model_group_id>",
    "status": "CREATED"
}
```    

3. Register and deploy the asymmetric model: Register an asymmetric text embedding model with query and passage prefixes:
   
```json
POST /_plugins/_ml/models/_register
{
    "name": "traced_small_model",
    "version": "1.0.0",
    "model_format": "TORCH_SCRIPT",
    "model_task_type": "text_embedding",
    "model_content_hash_value": "e13b74006290a9d0f58c1376f9629d4ebc05a0f9385f40db837452b167ae9021",
    "model_group_id": "<model_group_id>",
    "model_config": {
        "model_type": "bert",
        "embedding_dimension": 768,
        "framework_type": "sentence_transformers",
        "passage_prefix": "passage: ",
        "query_prefix": "query: "
    },
    "url": "https://github.com/opensearch-project/ml-commons/blob/2.x/ml-algorithms/src/test/resources/org/opensearch/ml/engine/algorithms/text_embedding/traced_small_model.zip?raw=true"
}
```    

Use the returned task_id to check registration status:

```json
GET /_plugins/_ml/tasks/<task_id>
```    

Once complete, deploy the model using the model_id:

```json
POST /_plugins/_ml/models/<model_id>/_deploy
```    

4. Set up ingestion: Create an ingest pipeline that generates passage embeddings using the ml_inference processor. The content_type: passage parameter tells the model to apply the passage prefix:

   
```json
PUT /_ingest/pipeline/asymmetric_embedding_pipeline
{
    "description": "Generate passage embeddings using asymmetric model",
    "processors": [
        {
            "ml_inference": {
                "model_input": "{\"text_docs\":[\"${input_map.text_docs}\"],\"target_response\":[\"sentence_embedding\"],\"parameters\":{\"content_type\":\"passage\"}}",
                "function_name": "text_embedding",
                "model_id": "<model_id>",
                "input_map": [
                     {
                        "text_docs": "description"
                    }
                ],
                "output_map": [
                    {
                        "fact_embedding": "$.inference_results[0].output[0].data"
                    }
                ]
            }
        }
    ]
}
```    

5. Create the index: Create a k-NN index that uses the ingest pipeline:

   
```json
PUT /nyc_facts
{
     "settings": {
         "index.knn": true,
        "default_pipeline": "asymmetric_embedding_pipeline"
    },
     "mappings": {
        "properties": {
            "fact_embedding": {
                "type": "knn_vector",
                "dimension": 768,
                "method": {
                   "name": "hnsw",
                    "space_type": "l2",
                    "engine": "lucene"
                }
            },
            "description": {
                "type": "text"
            }
        }
    }
}
```    


6. Ingest documents: Index your documents. The pipeline automatically generates embeddings:

```json
POST /nyc_facts/_doc
{
    "title": "Central Park",
    "description": "A large public park in the heart of New York City, offering recreational activities."
}
```    

Try your engine with a query

Create a search pipeline that generates query embeddings with content_type: query:

```json
PUT /_search/pipeline/asymmetric_search_pipeline
{
    "request_processors": [
        {
            "ml_inference": {
                "query_template": "{\"size\": 3, \"query\": {\"knn\": {\"fact_embedding\": {\"vector\": ${query_embedding}, \"k\": 4}}}}",
                "function_name": "text_embedding",
                "model_id": "<model_id>",
                "model_input": "{\"text_docs\": [\"${input_map.query}\"], \"target_response\": [\"sentence_embedding\"], \"parameters\": {\"content_type\": \"query\"}}",
                "input_map": [
                    {
                        "query": "query.term.fact_embedding.value"
                    }
                ],
                "output_map": [
                    {
                        "query_embedding": "$.inference_results[0].output[0].data"
                    }
                ]
            }
        }
    ]
}
```

Now run a search query:

```json
GET /nyc_facts/_search?search_pipeline=asymmetric_search_pipeline
{
    "query": {
        "term": {
            "fact_embedding": {
                "value": "What are some places for sports in NYC?"
            }
        }
    }
}
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
