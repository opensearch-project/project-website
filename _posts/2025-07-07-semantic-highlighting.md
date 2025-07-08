---
layout: post
title: "Semantic Highlighting in OpenSearch"
authors:
 - Junqiu Lei
 - Alexander Greaves-Tunnell
 - Supriya Nagesh
 - Nina Mishra
 - Heemin Kim
 - Sean Zheng
date: 2025-07-07
categories:
 - technical-post
meta_keywords: "semantic highlighting, OpenSearch, AI search, neural search, search relevance"
meta_description: "Learn about the new semantic highlighting feature in OpenSearch 3.0, how it works, and how to use it in your search queries."
excerpt: "OpenSearch 3.0 introduces semantic highlighting, an AI-powered feature that identifies and returns the most relevant passages in a retrieved document. In this post, we'll share the motivation for this feature, break down the science behind the AI model, and show how you can incorporate semantic highlighting into your search queries."
has_science_table: true
---

OpenSearch 3.0 introduces [semantic highlighting](https://docs.opensearch.org/docs/latest/search-plugins/searching-data/highlight/#the-semantic-highlighter), an AI-powered feature that identifies and returns the most relevant passages in a retrieved document. In this post, we'll share the motivation for this feature, break down the science behind the AI model, and show how you can incorporate semantic highlighting into your search queries.

## What is semantic highlighting?

Highlighting is a search feature that extracts the parts of a retrieved document most relevant to a search query. Semantic highlighting introduces a new highlighter type with two key differences from the existing highlighter options in OpenSearch: it defines relevance in terms of semantic similarity between the passage and query and it highlights *spans* of text instead of individual keywords.  Relevance judgments for each sentence are made by an AI model that incorporates context from the query and surrounding passages in the document.

Semantic highlighting is motivated by the explosion of semantic and hybrid search use-cases designed to return documents that match the high-level meaning of a user's query. In these cases, users are looking for documents that match the query's intent rather than its specific wording. Semantic highlighting extends this capability to the extraction of relevant passages from within each document.

## How is it different from lexical highlighting?

The existing lexical highlighter options in OpenSearch excel in cases where the user knows exactly the string they wish to highlight. They provide a highly efficient means of extracting specific words or phrases on the basis of their lexical similarity to a set of query terms. Semantic highlighting complements these lexical highlighters by providing a highlighting solution when the user would instead prefer highlights that are *conceptually relevant* to the query, even when their content does not match the exact query terms.

## Semantic vs. lexical highlighting: a simple example

As a concrete example, we compare the results for semantic versus lexical highlighting on a corpus of how-to guides from the [WikiSum dataset](https://registry.opendata.aws/wikisum/). We'll search using the query "how long to cook pasta sauce" over the summary field, which contains instructions in paragraph form. Below, we show highlighting results for the top search hit based on this query:

**Lexical Highlighter**


> To make a red <mark>pasta</mark> sauce, start by adding water, tomato paste, and diced tomatoes to a large saucepan. Then, sprinkle in some finely-grated carrots, diced onions, chopped garlic, and some spices like celery salt, dried oregano, and dried basil. Next, bring everything to a boil over medium heat before reducing the temperature to low. Finally, cover the pot and simmer the sauce for 15-30 minutes.


**Semantic highlighter**


> To make a red pasta sauce, start by adding water, tomato paste, and diced tomatoes to a large saucepan. Then, sprinkle in some finely-grated carrots, diced onions, chopped garlic, and some spices like celery salt, dried oregano, and dried basil. Next, bring everything to a boil over medium heat before reducing the temperature to low. <mark>Finally, cover the pot and simmer the sauce for 15-30 minutes.</mark>


In this example, the term extracted by the lexical highlighter matches the query content but does not provide information relevant to the query intent. By contrast, the semantic highlighter identifies the sentence that answers the question.

Semantic highlighting shines in several scenarios:

1. **Legal document search**: Efficiently pinpoint relevant clauses or sections in lengthy contracts or legal texts, even when terminology varies.
2. **Customer support**: Improve customer agent efficiency and self-service portals by highlighting the most pertinent sentences in knowledge base articles or support tickets that address a customer's issue.
3. **E-commerce product search**: Enhance product discovery by highlighting sentences in descriptions or customer reviews that semantically match a user's natural language query about product features or benefits.

## Getting Started: How to Use Semantic Highlighting

Leveraging semantic highlighting is a two-step process. First, you need to deploy a semantic sentence highlighting model to your OpenSearch cluster using the ML Commons plugin. Second, you apply this deployed model during search time by specifying its model_id in the highlight section of your search request.

### Step 1: Deploy the Semantic Highlighting Model

**Option A: Local Deployment (Simple Setup)**

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

This approach is straightforward but runs on your cluster's CPU resources, which may impact performance for high-volume workloads.

**Option B: Remote Deployment (Production Recommended Setup)**

For production workloads requiring optimal performance, we recommend deploying the model on a remote GPU-accelerated endpoint such as AWS SageMaker. Our benchmarks demonstrate that GPU-based deployment delivers approximately 4.5x better performance compared to local CPU deployment. For detailed setup instructions, refer to the [document](https://github.com/opensearch-project/ml-commons/blob/c237c4ea8902e79fce6163ac52650a032e7a78ca/docs/remote_inference_blueprints/standard_blueprints/sagemaker_semantic_highlighter_standard_blueprint.md).

### Step 2: Enable Semantic Highlighting in Your Search

Once your model is deployed (either locally or remotely), you enable the feature by setting the type to semantic for the desired field in your highlight configuration:

Here's an example of how to use semantic highlighting with a neural search query, taken from our official tutorial. This query searches for "treatments for neurodegenerative diseases" in an index named `neural-search-index` which contains a `text_embedding` field for the document vectors and a `text` field for the original document content:


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


In this query:

*   The `neural` query part performs a semantic search using your deployed text embedding model (`<your-text-embedding-model-id>`).
*   The `highlight` part configures semantic highlighting on the `text` field, using your deployed semantic highlighting model (`<your-semantic-highlighting-model-id>`).
*   `_source` excludes the `text_embedding` field from the results to keep them concise.

Here's an example of what the search results might look like (shortened for brevity, highlighted sentences may differ based on the exact models used):


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


The `semantic` highlighter identifies the sentences determined by the model to be most semantically relevant to the query within the context of each retrieved document. By default, these sentences are wrapped in `<em>` tags.

Semantic highlighting offers flexibility for different search strategies. It works with various query types, including:

1.  **Match queries**: Standard text queries
2.  **Term queries**: Exact term matching
3.  **Boolean queries**: Logical combinations of queries
4.  **Query string queries**: Advanced query syntax
5.  **Neural queries**: Vector-based semantic search
6.  **Hybrid queries**: Combinations of traditional and neural search

## The semantic highlighting model

Semantic highlighting uses a trained AI model to automatically detect passages in the retrieved documents that are relevant to the highlighting query. Specifically, the model is a sentence-level classifier trained on a wide selection of public-domain datasets for extractive question answering. Highlighting at the sentence level ensures that the results are semantically meaningful and enables the model to be trained on diverse data sources while maintaining a unified prediction framework. 

The model employs a transformer-based architecture based on [BERT](https://huggingface.co/docs/transformers/en/model_doc/bert) (Bidirectional Encoder Representations from Transformers). We jointly encode both the document and query text to generate a representation for each sentence that incorporates context from both the surrounding text in the document and from the query itself. In training the model on a diverse set of data sources, we encourage it to learn highlighting rules that apply across a wide variety of domains and use-cases. We evaluated model performance primarily in terms of highlight precision and recall on *out-of-distribution* data, with the goal of selecting a highlighting model that has robust performance beyond standard training corpora.

## Performance Insights

We evaluate the latency and accuracy of semantic highlighting on the [MultiSpanQA dataset](https://multi-span.github.io/). Details on the test environment are provided below.

**Test environment**

|**OpenSearch Cluster**|Version 3.1.0 deployed via opensearch-cluster-cdk|
|---|---|
|**Data Nodes**|3 × r6g.2xlarge (8 vCPUs, 64 GB memory each)|
|**Coordinator Nodes**|3 × c6g.xlarge (4 vCPUs, 8 GB memory each)|
|Semantic Highlighting Model*|`opensearch-semantic-highlighter-v1` deployed remotely at AWS SageMaker Endpoint with GPU based ml.g5.xlarge (scalable 1-3 instances)|
|Embedding Model|`sentence-transformers/all-MiniLM-L6-v2` deployed within OpenSearch cluster|
|**Benchmark Client**|ARM64, 16 cores, 61GB RAM|
|**Test Configuration**|10 warmup iterations, 50 test iterations, 1 shard, 0 replicas|
|**Dataset**|MultiSpanQA (1,959 documents)|
|**Document Stats**|Mean: 1,213 chars, P50: 1,111, P90: 2,050, Max: 6,689|
|**Relevant Sentences**|1,541 (9.51% of total)|

(* Note: The benchmark utilized AWS SageMaker's ml.g5.xlarge GPU instances for the semantic highlighting model, which provided significant performance improvements over OpenSearch ML local deployed model. The GPU acceleration reduced P50 latency by approximately 4.5x (from 180ms to 40ms for k=1) compared to running the same model on a locally deployed model within OpenSearch. The auto-scaling configuration (1-3 instances) ensures the endpoint can handle varying workload demands while maintaining consistent performance. For the model deployment on AWS SageMaker, see reference document and scripts at [here](https://github.com/opensearch-project/opensearch-py-ml/tree/main/docs/source/examples/aws_sagemaker_sentence_highlighter_model).)

### Latency Summary

We measure the latency of semantic search with semantic highlighting over a range of documents retrieved (k-value) and search clients. For comparison, we include the latency of the semantic search only, where no highlighting is performed.

|K-Value|Search Clients|Semantic Search Only P50 Latency (ms)|Semantic Search With Semantic Highlighting P50 Latency (ms)|Semantic Search Only P90 Latency (ms)|Semantic Search With Semantic Highlighting P90 Latency (ms)|Semantic Search Only P100 Latency (ms)|Semantic Search With Semantic Highlighting P100 Latency (ms)|
|---|---|---|---|---|---|---|---|
|1|1|21|38|23|42|24|59|
|1|4|24|37|25|45|27|78|
|1|8|24|40|26|52|28|81|
|10|1|26|180|27|199|28|237|
|10|4|25|209|27|240|29|312|
|10|8|26|267|28|323|31|407|
|20|1|24|348|25|383|25|410|
|20|4|24|401|28|449|30|530|
gi|20|8|26|545|28|625|32|770|
|50|1|24|806|25|861|26|954|
|50|4|25|987|26|1,074|29|1,162|
|50|8|26|1,358|28|1,490|32|1,687|

The comprehensive benchmarking demonstrates that the feature performs well for typical search scenarios (k≤10), providing sub-200ms responses that meet the requirements of interactive applications. Latency increases with the number of documents returned, reflecting the additional costs of inference for the semantic highlighter model.

### Accuracy Summary

We measure the accuracy of the highlighter by computing the precision, recall, and F1 score of the sentence-level highlights on the MultiSpanQA validation set.

|Metric|Value|Description|
|---|---|---|
|**Precision**|66.40%|Percentage of highlighted sentences that are actually relevant|
|**Recall**|79.20%|Percentage of relevant sentences that were successfully highlighted|
|**F1 Score**|72.20%|Harmonic mean balancing precision and recall|

The highlighter demonstrates strong recall (79.2%) while maintaining good precision (66.4%), resulting in a solid F1 score of 72.2%. This performance profile is well-suited for search applications where capturing most relevant content is important while keeping false positives manageable.

In practice, the accuracy of the highlighter may vary depending on the user's data. We trained the highlighter model on a diverse selection of datasets to encourage good performance in many domains, but accuracy may still take a hit if the data is sufficiently different from this training set.

## Advanced Customization

While the pre-trained model `semantic-sentence-highlighter-model-v1` (referred to as `amazon/sentence-highlighting/opensearch-semantic-highlighter-v1` in the tutorial, and available on Hugging Face as [opensearch-project/opensearch-semantic-highlighter-v1](https://huggingface.co/opensearch-project/opensearch-semantic-highlighter-v1)) offers great general-purpose performance, OpenSearch provides flexibility for advanced users.

The OpenSearch semantic highlighting feature is designed to work with different sentence highlighting models deployed via the OpenSearch ML Commons plugin. If you have a specific domain or task, you can train and deploy your own sentence highlighting model compatible with the ML Commons framework.

For users interested in the specifics of preparing a custom model, including model tracing and the CI processes involved, the [opensearch-py-ml GitHub repository](https://github.com/opensearch-project/opensearch-py-ml/tree/main) serves as a valuable resource. This repository provides tools and examples that can help guide you in bringing your own models to OpenSearch. Once your custom model is prepared and deployed, you would then reference your custom `model_id` in the highlight options.


## Summary and Community Engagement

Semantic highlighting in OpenSearch represents a significant advancement in search result presentation. By highlighting content based on semantic relevance rather than just keyword matches, it provides users with more meaningful, context-aware search results.

This feature offers an enhanced user experience whether you're searching through product catalogs, research papers, legal documents, or any text-based content. We invite you to try semantic highlighting and share your feedback with the OpenSearch community.

What's Next:

Several potential enhancements could further improve semantic highlighting:

1. Batch Support: Support for batch processing in semantic highlighting, which can reduce the latency especially for multiple hits with highlighting.
2. Custom Highlight Phrases: The ability to specify exact sentences for highlighting, rather than relying on automatic extraction from complex queries. This would give users more control over their highlighting experience.
3. Global Model Configuration: A way to configure model IDs at a global level, eliminating the need to specify the model ID in each query clause.

We welcome community feedback on these potential features and encourage you to share your use cases and requirements in our GitHub discussions or community forums. 