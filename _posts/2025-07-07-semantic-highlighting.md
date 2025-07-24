---
layout: post
title: "Introducing semantic highlighting in OpenSearch"
authors:
 - junqiu
 - agtunnell
 - nsupriy
 - nmishra
 - heemin
 - seanzheng
date: 2025-07-07
categories:
 - technical-post
meta_keywords: "semantic highlighting, OpenSearch, AI search, neural search, search relevance"
meta_description: "Learn about the new semantic highlighting feature in OpenSearch 3.0, how it works, and how to use it in your search queries."
excerpt: "OpenSearch 3.0 introduces semantic highlighting, an AI-powered feature that identifies and returns the most relevant passages in a retrieved document. In this post, we'll break down the science behind the AI model and show you how to incorporate semantic highlighting into your search queries."
has_science_table: true
---

OpenSearch 3.0 introduced [semantic highlighting](https://docs.opensearch.org/docs/latest/search-plugins/searching-data/highlight/#the-semantic-highlighter), an AI-powered feature that identifies and returns the most relevant passages in a retrieved document. In this post, we'll explain the science behind the AI model and show you how to incorporate semantic highlighting into your search queries.

## What is semantic highlighting?

Highlighting is a search feature that extracts the parts of a document most relevant to a query. Semantic highlighting introduces a new highlighter in OpenSearch that works differently from the existing ones in two key ways: it measures relevance based on semantic similarity between the query and the text, and it highlights spans of text rather than exact keyword matches. An AI model evaluates each sentence, using context from both the query and surrounding text to determine relevance.

This feature is designed for AI search use cases, where users care more about the meaning of their query than the exact words. Semantic highlighting extends that idea by surfacing the most meaningful passages within documents.

## How is semantic highlighting different from lexical highlighting?

Lexical highlighters in OpenSearch work well when users want to highlight exact words or phrases. They quickly identify text based on direct matches to query terms. Semantic highlighting, on the other hand, is useful when users are interested in passages that are conceptually relevant to the query—even if the wording is different. It complements lexical highlighting by focusing on meaning rather than exact matches.

## Semantic and lexical highlighting compared: A simple example

To show the difference between semantic and lexical highlighting, let's look at an example using how-to guides from the [WikiSum dataset](https://registry.opendata.aws/wikisum/). In this dataset, the `summary` field contains instructions in paragraph form. We'll search the `summary` field using the query "how long to cook pasta sauce". Here's how the top result is highlighted by each method.

**Lexical highlighter**


> To make a red <mark>pasta</mark> sauce, start by adding water, tomato paste, and diced tomatoes to a large saucepan. Then, sprinkle in some finely-grated carrots, diced onions, chopped garlic, and some spices like celery salt, dried oregano, and dried basil. Next, bring everything to a boil over medium heat before reducing the temperature to low. Finally, cover the pot and simmer the sauce for 15-30 minutes.


**Semantic highlighter**


> To make a red pasta sauce, start by adding water, tomato paste, and diced tomatoes to a large saucepan. Then, sprinkle in some finely-grated carrots, diced onions, chopped garlic, and some spices like celery salt, dried oregano, and dried basil. Next, bring everything to a boil over medium heat before reducing the temperature to low. <mark>Finally, cover the pot and simmer the sauce for 15-30 minutes.</mark>


In this example, the lexical highlighter finds a direct word match ("pasta") but misses the sentence that actually answers the query. By contrast, the semantic highlighter identifies the answer that corresponds to the intent behind the question.

## When to use semantic highlighting

Semantic highlighting is useful in a wide variety of scenarios. Some examples include:

1. **Legal document search**: Efficiently pinpoint relevant clauses or sections in lengthy contracts or legal texts, even when terminology varies.
2. **Customer support**: Improve customer agent efficiency and self-service portals by highlighting the most relevant sentences in knowledge base articles or support tickets that address a customer's issue.
3. **E-commerce product search**: Enhance product discovery by highlighting sentences in descriptions or customer reviews that semantically match a user's natural language query about product features or benefits.

## Getting started: How to use semantic highlighting

To use semantic highlighting in OpenSearch, follow these steps:

- **Deploy a model**: Deploy a semantic sentence highlighting model to your OpenSearch cluster.

- **Enable semantic highlighting in your search**: Run a search, providing the `model_id` in the `highlight` object to apply semantic highlighting to the results.

### Step 1: Deploy a semantic highlighting model

First, deploy a semantic highlighting model.

**Option A: Local deployment (simple setup)**

For quick setup and testing, you can deploy the model directly within your OpenSearch cluster:

```json
POST /_plugins/_ml/models/_register?deploy=true
{
    "name": "amazon/sentence-highlighting/opensearch-semantic-highlighter-v1",
    "version": "1.0.0",
    "model_format": "TORCH_SCRIPT",
    "function_name": "QUESTION_ANSWERING"
}
```

This approach is straightforward but runs on your cluster's CPU resources, which may impact the performance of high-volume workloads.

**Option B: External deployment (recommended for production)**

For production workloads that require high performance, we recommend deploying the model on a remote GPU-accelerated endpoint, such as Amazon SageMaker. Benchmarks show that GPU-based deployments are about 4.5 times faster than local CPU deployments. For detailed setup instructions, see [the blueprint](https://github.com/opensearch-project/ml-commons/blob/main/docs/remote_inference_blueprints/standard_blueprints/sagemaker_semantic_highlighter_standard_blueprint.md).

### Step 2: Enable semantic highlighting in your search

Once your model is deployed (either locally or externally), enable semantic highlighting by setting the `type` to `semantic` in the `highlight` object for the field you want to highlight.

The following example (from our [tutorial](https://docs.opensearch.org/docs/latest/tutorials/vector-search/semantic-highlighting-tutorial/)) shows you how to use semantic highlighting in a neural search query. The query searches for "treatments for neurodegenerative diseases" in an index named `neural-search-index`. Documents in the index include a `text_embedding` field containing the vector embeddings and a `text` field containing the original document content:


```json
POST /neural-search-index/_search
{
  "_source": {
    "excludes": ["text_embedding"] 
  },
  "query": {
    "neural": {
      "text_embedding": {
        "query_text": "treatments for neurodegenerative diseases",
        "model_id": "<your-text-embedding-model-id>", 
        "k": 1
      }
    }
  },
  "highlight": {
    "fields": {
      "text": {
        "type": "semantic"
      }
    },
    "options": {
      "model_id": "<your-semantic-highlighting-model-id>" 
    }
  }
}
```

This query contains the following objects:

- The `neural` object performs a semantic search using your deployed text embedding model (<your-text-embedding-model-id>).

- The `highlight` object applies semantic highlighting to the text field using your deployed semantic highlighting model (<your-semantic-highlighting-model-id>).

- The `_source` filter excludes the `text_embedding` field from the response to keep the results concise.

Here's an example of what the search results might look like. This example is shortened for brevity---your highlighted sentences may differ based on the model used:


```json
{
  "took": 38,
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
    "max_score": 0.52716815,
    "hits": [
      {
        "_index": "neural-search-index",
        "_id": "1",
        "_score": 0.52716815,
        "_source": {
            "text": "Alzheimer's disease is a progressive neurodegenerative disorder ..."
        },
        "highlight": {
          "text": [
            "Alzheimer's disease is a progressive neurodegenerative disorder characterized by accumulation of amyloid-beta plaques and neurofibrillary tangles in the brain. Early symptoms include short-term memory impairment, followed by language difficulties, disorientation, and behavioral changes. While traditional treatments such as cholinesterase inhibitors and memantine provide modest symptomatic relief, they do not alter disease progression. \
            <em>Recent clinical trials investigating monoclonal antibodies targeting amyloid-beta, including aducanumab, lecanemab, and donanemab, have shown promise in reducing plaque burden and slowing cognitive decline.</em> \
            Early diagnosis using biomarkers such as cerebrospinal fluid analysis and PET imaging may facilitate timely intervention and improved outcomes."
          ]
        }
      }
    ]
  }
}
```


The `semantic` highlighter identifies the sentences determined by the model to be most semantically relevant to the query within the context of each retrieved document. By default, the highlighted sentences are wrapped in `<em>` tags.

## Supported queries

Semantic highlighting offers flexibility for different search strategies. It works with various query types:

- **Match queries**: Standard text queries
- **Term queries**: Exact term matching
- **Boolean queries**: Logical combinations of queries
- **Query string queries**: Advanced query syntax
- **Neural queries**: Vector-based semantic search
- **Hybrid queries**: Combinations of traditional and neural search

## The semantic highlighting model

Semantic highlighting uses a trained AI model to automatically detect passages in the retrieved documents that are relevant to the highlighting query. Specifically, the model is a sentence-level classifier trained on a wide selection of public-domain datasets for extractive question answering. Highlighting at the sentence level ensures that the results are semantically meaningful and enables the model to be trained on diverse data sources while maintaining a unified prediction framework. 

The model employs a transformer-based architecture based on [Bidirectional Encoder Representations from Transformers (BERT)](https://huggingface.co/docs/transformers/en/model_doc/bert). We jointly encode both the document and query text to generate a representation for each sentence that incorporates context from both the surrounding text in the document and the query itself. We trained the model on a diverse set of data sources, encouraging it to learn highlighting rules that apply across a wide variety of domains and use cases. We evaluated model performance primarily in terms of highlighting precision and recall on *out-of-distribution* data, with the goal of selecting a highlighting model that has robust performance beyond standard training corpora.

## Performance benchmarks

We evaluated the latency and accuracy of semantic highlighting on the [MultiSpanQA dataset](https://multi-span.github.io/). The test environment was configured as follows.

|**OpenSearch cluster**|Version 3.1.0 deployed using `opensearch-cluster-cdk`|
|---|---|
|**Data nodes**|3 × r6g.2xlarge (8 vCPUs, 64 GB memory each)|
|**Coordinator nodes**|3 × c6g.xlarge (4 vCPUs, 8 GB memory each)|
|**Semantic highlighting model**|`opensearch-semantic-highlighter-v1` deployed remotely at Amazon SageMaker endpoint with GPU-based ml.g5.xlarge (scalable 1--3 instances)|
|**Embedding model**|`sentence-transformers/all-MiniLM-L6-v2` deployed within OpenSearch cluster|
|**Benchmark client**|ARM64, 16 cores, 61 GB RAM|
|**Test configuration**|10 warmup iterations, 50 test iterations, 1 shard, 0 replicas|
|**Dataset**|MultiSpanQA (1,959 documents)|
|**Document stats**|Mean: 1,213 chars; P50: 1,111; P90: 2,050; Max: 6,689|
|**Relevant sentences**|1,541 (9.51% of total)|

**Note**: The benchmark used Amazon SageMaker's ml.g5.xlarge GPU instances for the semantic highlighting model, which provided significant performance improvements compared to the locally deployed OpenSearch machine learning model. The GPU acceleration reduced P50 latency by approximately 4.5x (from 180ms to 40ms for k=1) compared to running the same model on a locally deployed model within OpenSearch. The auto-scaling configuration (1--3 instances) ensures the endpoint can handle varying workload demands while maintaining consistent performance. For the model deployment on Amazon SageMaker, see the [documentation and scripts](https://github.com/opensearch-project/opensearch-py-ml/tree/main/docs/source/examples/aws_sagemaker_sentence_highlighter_model).

### Latency

We measured the latency of semantic search with semantic highlighting over a range of search clients and retrieved documents (k-value). For comparison, we included the latency of the semantic search with no highlighting. The results are presented in the following table.

|K-value|Search clients|Semantic search only P50 latency (ms)|Semantic search with semantic highlighting P50 latency (ms)|Semantic search only P90 latency (ms)|Semantic search with semantic highlighting P90 latency (ms)|Semantic search only P100 latency (ms)|Semantic search with semantic highlighting P100 latency (ms)|
|---|---|---|---|---|---|---|---|
|1|1|21|38|23|42|24|59|
|1|4|24|37|25|45|27|78|
|1|8|24|40|26|52|28|81|
|10|1|26|180|27|199|28|237|
|10|4|25|209|27|240|29|312|
|10|8|26|267|28|323|31|407|
|20|1|24|348|25|383|25|410|
|20|4|24|401|28|449|30|530|
|20|8|26|545|28|625|32|770|
|50|1|24|806|25|861|26|954|
|50|4|25|987|26|1,074|29|1,162|
|50|8|26|1,358|28|1,490|32|1,687|

Our comprehensive benchmarking demonstrates that the feature performs well for typical search scenarios (k≤10), providing sub-200ms responses that meet the requirements of interactive applications. Latency increases with the number of documents returned, reflecting the additional costs of inference for the semantic highlighting model.

### Accuracy

We measured the accuracy of the highlighter by computing the precision, recall, and F1 score of the sentence-level highlights on the MultiSpanQA validation set. The results are presented in the following table.

|Metric|Value|Description|
|---|---|---|
|**Precision**|66.40%| The percentage of highlighted sentences that are actually relevant.|
|**Recall**|79.20%|The percentage of relevant sentences that were successfully highlighted.|
|**F1 score**|72.20%|The harmonic mean balancing precision and recall.|

The highlighter demonstrated strong recall (79.2%) while maintaining robust precision (66.4%), resulting in a solid F1 score of 72.2%. This performance profile is well suited for search applications where it is important to capture the most relevant content while keeping false positives manageable.

In practice, the accuracy of the highlighter may vary depending on your data. We trained the highlighting model on a diverse selection of datasets to encourage high performance in many domains, but accuracy may still decrease if your data is substantially different from this training set.

## Advanced customization

While the pretrained model `semantic-sentence-highlighter-model-v1` (referred to as `amazon/sentence-highlighting/opensearch-semantic-highlighter-v1` in the tutorial and available on Hugging Face as [`opensearch-project/opensearch-semantic-highlighter-v1`](https://huggingface.co/opensearch-project/opensearch-semantic-highlighter-v1)) offers great general-purpose performance, OpenSearch provides flexibility for advanced users.

The OpenSearch semantic highlighting feature is designed to work with different sentence highlighting models deployed in the OpenSearch ML Commons plugin. If you have a specific domain or task, you can train and deploy your own sentence highlighting model compatible with the ML Commons framework.

If you're interested in the specifics of preparing a custom model, including model tracing and the CI processes involved, explore the [`opensearch-py-ml` GitHub repository](https://github.com/opensearch-project/opensearch-py-ml/tree/main). This repository provides tools and examples that can help guide you in bringing your own models to OpenSearch. Once your custom model is prepared and deployed, you can reference your custom `model_id` in the highlight options.


## What's next?

Semantic highlighting in OpenSearch represents a significant advancement in search result presentation. Highlighting content based on semantic relevance rather than just keyword matches provides more meaningful, context-aware search results.

This feature offers an enhanced user experience, whether you're searching through product catalogs, research papers, legal documents, or any text-based content. We invite you to try semantic highlighting and share your feedback with the OpenSearch community.

We are considering several improvements to the semantic highlighting feature:

- **Batch support**: Batch processing can reduce latency, especially when highlighting multiple hits.
- **Custom highlight phrases**: The ability to specify exact sentences for highlighting, rather than relying on automatic extraction from complex queries, will provide more control over how highlights appear.
- **Global model configuration**: Providing a way to configure model IDs globally will eliminate the need to specify the model ID in each query clause.

We welcome community feedback on these potential features and encourage you to share your use cases and requirements in our GitHub discussions or on the [OpenSearch forum](https://forum.opensearch.org/). 