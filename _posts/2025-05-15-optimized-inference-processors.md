---
layout: post
title: "Optimizing Inference Processors for Cost Efficiency and Performance"
authors:
  - will-hwang
  - heemin
date: 2025-05-15
categories:
  - technical-posts
meta_keywords: Ingestion, Embedding, Inference, Update, Pipeline
meta_description: Learn about OpenSearch 3.0's Optimized Inference Processors and utilize the plan-execute-reflect agent to resolve an observability use case
---
Inference processors (Text Embedding, Text/Image Embedding, and Sparse Encoding) are defined in ingest pipelines to generate vector embeddings when documents are ingested or updated. Currently, these processors run model inference calls every time a document is ingested or updated, even when embedding fields remain unchanged. This can unnecessarily increase computational overhead and costs for customers.

This blog highlights an optimization to inference processors designed to avoid redundant inference calls, thereby reducing costs and improving overall performance.


## Optimization Methodology

The optimization intelligently leverages previously ingested documents as a cache for embedding comparison. If the embedding fields remain unchanged, the update flow skips inference and directly copies the existing embeddings into the updated document. If changes are found, embeddings are regenerated via ML inference as usual. This approach minimizes redundant inference calls, significantly improving efficiency.

![Optimization Workflow](/assets/media/blog-images/2025-05-15-optimized-inference-processors/diagram.png)

## Enable Optimization in Inference Processors

To enable optimization, create an ingest pipeline and specify **`skip_existing`** field as **`true`** at the processor level. The feature can be specified for `text_embedding`, `text_image_embedding`, and `sparse_encoding` processors. By default, the feature is set to **`false`**.

### Text Embedding Processor

**Feature Description:** Text Embedding Processor is used to generate vector embedding fields for semantic search. If **`skip_existing`**  is set to **`true`**, the text fields with vector field mappings in the `field_map`, will be compared for skipping inference when remain unchanged. 

**Pipeline Configuration:**

```
PUT /_ingest/pipeline/optimized-ingest-pipeline
{
    "description": "Optimized Ingest Pipeline",
    "processors": [
        {
            "text_embedding": {
                "model_id": "<model_id>",
                "field_map": {
                    "text":"<vector_field>"
                },
                "skip_existing": true
            }
        }
    ]
}

```

### Text/Image Embedding Processor

**Feature Description:** Text/Image Embedding Processor is used to generate combined vector embedding from text and image fields for multi-modal search. If **`skip_existing`**  is set to **`true`**, both the text and image fields in the `field_map` will be compared for skipping inference when remain unchanged. Since embeddings are generated for combined text and image fields, inference will only be skipped if both fields match. 

**Pipeline Configuration:**

```
PUT /_ingest/pipeline/optimized-ingest-pipeline
{
    "description": "Optimized Ingest Pipeline",
    "processors": [
        {
            "text_image_embedding": {
                "model_id": "<model_id>",
                "embedding": "<vector_field>"
                "field_map": {
                    "text":"<input_text_field>",
                    "image":"<input_image_field>"
                },
                "skip_existing": true
            }
        }
    ]
}
```

### Sparse Encoding Processor

**Feature Description:** Sparse Encoding Processor is used to generate a sparse vector/token and weights from text fields for neural sparse search. If **`skip_existing`**  is set to **`true`**, both the text field in the `field_map` will be compared for skipping inference when remain unchanged. 

**Pipeline Configuration:**

```
PUT /_ingest/pipeline/optimized-ingest-pipeline
{
    "description": "Optimized Ingest Pipeline",
    "processors": [
        {
            "sparse_encoding": {
                "model_id": "<model_id>",
                "prune_type": "max_ratio",
                "prune_ratio": "0.1",
                "field_map": {
                    "text":"<vector_field>"
                },
                "skip_existing": true
            }
        }
    ]
}
```

## Performance Comparison

In addition to potential cost savings with skipped inference calls, the feature can also significantly improve latency.
The below tables show latency improvements when the optimization is enabled, compared to the baseline performance.

### Test Environment

* **Cluster Setup**

![Optimization Workflow](/assets/media/blog-images/2025-05-15-optimized-inference-processors/cluster_setup.png)

### Text Embedding Processor

* **Model:** `huggingface/sentence-transformers/msmarco-distilbert-base-tas-b`
* **Dataset:** [Trec-Covid](https://public.ukp.informatik.tu-darmstadt.de/thakur/BEIR/datasets/trec-covid.zip)

* **Single Update Request Example**

```
PUT /test_index/_doc/1
{
    "text": "Hello World",
}
```

* **Batch Update Request Example**

```
POST _bulk
{ 
    "index": { 
        "_index": "test_index", "text": "hello world" 
    },
    "index": { 
        "_index": "test_index", "text": "Hi World" 
    }
}
```

|**Operation Type**	|**Document Size**	|**Batch Size**	|Baseline **Time** (Skip Existing = False)	|**Updated Embedding **Time**** (SkipExisting=True) 	|Δ Updated vs. Baseline	|**Same Embedding **Time**** (SkipExisting=True) 	|Δ Same vs. Baseline	|
|---	|---	|---	|---	|---	|---	|---	|---	|
|Single Update	|3000	|1	|1,400,710 ms	|1401,216 ms	|0.04%	|292,020	|-79.15%	|
|Batch Update	|171,332	|200	|2,247,191 ms	|2,192,883 ms	|-2.42%	|352,767	|-84.30%	|

### Text/Image Embedding Processor

* **Model:** `amazon.titan-embed-image-v1`
* **Dataset:** [Flickr Images](https://www.kaggle.com/datasets/hsankesara/flickr-image-dataset)

* **Single Update Request Example**

```
PUT /test_index/_doc/1
{
    "text": "Orange table",
    "image": "bGlkaHQtd29rfx43..."
}
```

* **Batch Update Request Example**

```
POST _bulk
{ 
    "index": { 
        "_index": "test_index", "text": "Orange table", "image": "bGlkaHQtd29rfx43..."
    },
    "index": { 
        "_index": "test_index", "text": "Red chair", "image": "aFlkaHQtd29rfx43..."
    }
}
```

|**Operation Type**	|**Document Size**	|**Batch Size**	|Baseline **Time** (Skip Existing = False)	|**Updated Embedding **Time**** (SkipExisting=True) 	|Δ Updated vs. Baseline	|**Same Embedding **Time**** (SkipExisting=True) 	|Δ Same vs. Baseline	|
|---	|---	|---	|---	|---	|---	|---	|---	|
|Single Update	|3000	|1	|1,060,339 ms	|1060785 ms	|0.04%	|465,771	|-56.07%	|
|Batch Update	|31,783	|200	|1,809,299 ms	|1662389 ms	|-8.12%	|1,571,012	|-13.17%	|

### Sparse Encoding Processor

* **Model:** `huggingface/sentence-transformers/msmarco-distilbert-base-tas-b`
* **Dataset:** [Trec-Covid](https://public.ukp.informatik.tu-darmstadt.de/thakur/BEIR/datasets/trec-covid.zip)
* **Pruning Method:** `max_ratio`, **Ratio:** `0.1`

* **Single Update Request Example**

```
PUT /test_index/_doc/1
{
    "text": "Hello World",
}
```

* **Batch Update Request Example**

```
POST _bulk
{ 
    "index": { 
        "_index": "test_index", "text": "hello world" 
    },
    "index": { 
        "_index": "test_index", "text": "Hi World" 
    }
}
```

|**Operation Type**	|**Document Size**	|**Batch Size**	|Baseline **Time** (Skip Existing = False)	|**Updated Embedding **Time**** (SkipExisting=True) 	|Δ Updated vs. Baseline	|**Same Embedding **Time**** (SkipExisting=True) 	|Δ Same vs. Baseline	|
|---	|---	|---	|---	|---	|---	|---	|---	|
|Single Update	|3000	|1	|1,942,907ms	|1,965,918 ms 	|1.18%	|306,766	|-84.21%	|
|Batch Update	|171,332	|200	|3,077,040 ms	|3,101,697 ms	|0.80%	|475,197	|-84.56%	|

## Conclusion

As demonstrated by the cost and performance results, eliminating redundant inference calls is a highly effective optimization. It significantly reduces computational overhead and operational expenses with minimal impact on the initial ingestion process. By reusing existing embeddings when applicable, it streamlines document updates, making them faster and more efficient. Overall, this strategy improves system performance, enhances scalability, and delivers more cost-effective embedding retrieval at scale.


## What’s Next

When utilizing the bulk API, you can perform either an index or an update operation. The index operation will replace the entire document, whereas the update operation will only modify the fields specified in the request. It's important to note that ingest pipelines are not currently triggered when the update operation is used within the bulk API. If you desire this functionality, please indicate your support by adding a +1 to the [this](https://github.com/opensearch-project/OpenSearch/issues/17494) GitHub issue.

