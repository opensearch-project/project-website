---
layout: post
title:  "Multilingual search with OpenSearch"
authors:
- roigam
date: 2024-04-25
categories:
  - technical-post
meta_keywords: OpenSearch semantic search, multilingual search, multilingual embedding models, natural language and search
meta_description: Learn how OpenSearch semantic search can help you understand the intent of a search query and conduct multilingual search with models that support multilingual embeddings.
---

In traditional lexical search we often use text analysis to improve search results. 
OpenSearch uses [analyzers](https://opensearch.org/docs/latest/analyzers/) to refine, tokenize, and convert text fields before storing them in an index. 
As an example, indexing `<p><b>Actions</b> speak louder than <em>words</em></p>` can result in the following indexed tokens: [`action`, `speak`, `loud`, `word`]. 
The behavior depends on the analyzers you define for your text fields.

In recent years, additional approaches have emerged. Semantic search considers the context and intent of a search query. It does so by converting text to vectors through `embeddings`. 
This allows you to find documents that are semantically similar and don't necessarily match word for word.  

How can semantic search help not only with understanding the intent of a search query but also with multilingual search? 
Imagine you have an e-commerce site and a product catalog. Traditional lexical search presents several challenges:
* What happens if the catalog is in one language and my users search in other languages?
* What if my catalog items are defined in different languages?
* How can I handle search requests or catalog items in languages that are not supported out-of-the-box by [OpenSearch language analyzers](https://opensearch.org/docs/latest/analyzers/language-analyzers/) (for example, Hebrew)? 

Some of these challenges could be solved using schema changes, custom code, and extract, transform, and load (ETL) pipelines, but these solutions would greatly complicate the code base and require labor and maintenance.
In this blog post we discuss how you can use semantic search with multilingual embedding models to overcome these challenges. 


## Multilingual models
Transforming text into a vector is at the heart of semantic search. 
Embedding models are trained on vast amounts of data and are able to convert text into vectors in a way that captures inherent properties and relationships in real-world data.
Some embedding models are trained on more than one language and therefore can be used to search across multiple languages. 
Examples of such models are [Cohere’s multilingual embedding model](https://docs.cohere.com/docs/multilingual-language-models) and [Amazon Titan Embeddings G1 - Text G1](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html).

OpenSearch allows you to integrate multilingual embedding models into your search workflow using the following approaches:
* Local models that are uploaded to your cluster locally, such as `huggingface/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
* Externally hosted models on third-party platforms such as [Cohere](https://cohere.com/) or [Amazon Bedrock](https://aws.amazon.com/bedrock/).

For an explanation of the tradeoffs between these approaches, see [Choosing a model](https://opensearch.org/docs/latest/ml-commons-plugin/integrating-ml-models/#choosing-a-model).

## Using multilingual embedding models in OpenSearch
We will now go over the steps required to allow multilingual search using a model externally hosted on Cohere. 
For a tutorial showing how to use a local model, please see [this guide](https://repost.aws/articles/ARwaKLdzGDShq-O2OMU2Nnhg/multilingual-search-with-amazon-opensearch).

You can connect to externally hosted models through [connectors](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/connectors/). 
OpenSearch provides [connector blueprints](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/connectors/#supported-connectors) for various third-party platforms.

### Creating the Cohere connector
Start by following the instructions in the [Cohere Embedding Connector Blueprint](https://github.com/opensearch-project/ml-commons/blob/2.x/docs/remote_inference_blueprints/cohere_connector_embedding_blueprint.md#cohere-embedding-connector-blueprint).
Make sure you pass one of Cohere's [multilingual embedding models](https://docs.cohere.com/reference/embed), such as `embed-multilingual-v3.0`, when creating your connector:
```json
POST /_plugins/_ml/connectors/_create
{
  "name": "Cohere Embed Model",
  "description": "The connector to Cohere's public embed API",
  "version": "1",
  "protocol": "http",
  "credential": {
    "cohere_key": "<ENTER_COHERE_API_KEY_HERE>"
  },
  "parameters": {
    "model": "<ENTER_MODEL_NAME_HERE>", // Choose a multilingual Model
    "input_type":"search_document",
    "truncate": "END"
  },
  "actions": [
    {
      "action_type": "predict",
      "method": "POST",
      "url": "https://api.cohere.ai/v1/embed",
      "headers": {
        "Authorization": "Bearer ${credential.cohere_key}",
        "Request-Source": "unspecified:opensearch"
      },
      "request_body": "{ \"texts\": ${parameters.texts}, \"truncate\": \"${parameters.truncate}\", \"model\": \"${parameters.model}\", \"input_type\": \"${parameters.input_type}\" }",
      "pre_process_function": "connector.pre_process.cohere.embedding",
      "post_process_function": "connector.post_process.cohere.embedding"
    }
  ]
}
```
### Creating an ingest pipeline
Once you have created the connector and model, you can now create an [ingest pipeline](https://opensearch.org/docs/latest/api-reference/ingest-apis/index/). 
This pipeline will convert the text in a document field into embeddings. 
The following example creates a pipeline named `cohere_multilingual_pipeline`. It also specifies that the text from `description` will be converted into text embeddings and that the embeddings will be stored in `description_vector`:
```json
PUT _ingest/pipeline/cohere_multilingual_pipeline
{
  "description": "Cohere multilingual embedding pipeline",
  "processors" : [
    {
      "text_embedding": {
        "model_id": "<MODEL_ID>",
        "field_map": {
          "description": "description_vector"
        }
      }
    }
  ]
}
```

### Creating an index
You can now create a k-NN index with the pipeline created in the previous step. Note that the `dimension` for `description_vector` must match the model dimension:
```json
PUT /cohere_multilingual_english_catalog
{
  "settings": {
      "index": {
        "number_of_shards": 1,
        "number_of_replicas": 1
      },
      "index.knn": true,
      "index.knn.space_type": "cosinesimil",
      "default_pipeline": "cohere_multilingual_pipeline"
  },
  "mappings": {
      "properties": {
          "description_vector": {
              "type": "knn_vector",
              "dimension": 1024,
              "method": {
                  "name": "hnsw",
                  "space_type": "l2",
                  "engine": "faiss"
              },
              "store": true
          },
          "description": {
              "type": "text",
              "store": true
          }
      }
  }
}
```

For more information on creating a k-NN index, see [k-NN index](https://opensearch.org/docs/latest/search-plugins/knn/knn-index/).

### Ingesting data 
You are now ready to ingest your catalog. The following example uses the `_bulk` API and shows only a subset of the data. Note that the full data corpus holds 2,000 documents.
```json
POST cohere_multilingual_english_catalog/_bulk/
{"index": {"_index": "cohere_multilingual_english_catalog", "_id": 0}}
{"gender": "Men", "masterCategory": "Apparel", "subCategory": "Topwear", "articleType": "Shirts", "baseColour": "Navy Blue", "season": "Fall", "year": "2011", "usage": "Casual", "productDisplayName": "Turtle Check Men Navy Blue Shirt", "description": "Men Apparel Topwear Shirts Navy Blue Fall 2011 Casual Turtle Check Men Navy Blue Shirt"}
{"index": {"_index": "cohere_multilingual_english_catalog", "_id": 1}}
{"gender": "Men", "masterCategory": "Apparel", "subCategory": "Bottomwear", "articleType": "Jeans", "baseColour": "Blue", "season": "Summer", "year": "2012", "usage": "Casual", "productDisplayName": "Peter England Men Party Blue Jeans", "description": "Men Apparel Bottomwear Jeans Blue Summer 2012 Casual Peter England Men Party Blue Jeans"}
{"index": {"_index": "cohere_multilingual_english_catalog", "_id": 2}}
{"gender": "Women", "masterCategory": "Accessories", "subCategory": "Watches", "articleType": "Watches", "baseColour": "Silver", "season": "Winter", "year": "2016", "usage": "Casual", "productDisplayName": "Titan Women Silver Watch", "description": "Women Accessories Watches Watches Silver Winter 2016 Casual Titan Women Silver Watch"}
{"index": {"_index": "cohere_multilingual_english_catalog", "_id": 3}}
{"gender": "Men", "masterCategory": "Apparel", "subCategory": "Bottomwear", "articleType": "Track Pants", "baseColour": "Black", "season": "Fall", "year": "2011", "usage": "Casual", "productDisplayName": "Manchester United Men Solid Black Track Pants", "description": "Men Apparel Bottomwear Track Pants Black Fall 2011 Casual Manchester United Men Solid Black Track Pants"}
{"index": {"_index": "cohere_multilingual_english_catalog", "_id": 4}}
{"gender": "Men", "masterCategory": "Apparel", "subCategory": "Topwear", "articleType": "Tshirts", "baseColour": "Grey", "season": "Summer", "year": "2012", "usage": "Casual", "productDisplayName": "Puma Men Grey T-shirt", "description": "Men Apparel Topwear Tshirts Grey Summer 2012 Casual Puma Men Grey T-shirt"}
{"index": {"_index": "cohere_multilingual_english_catalog", "_id": 5}}
{"gender": "Men", "masterCategory": "Apparel", "subCategory": "Topwear", "articleType": "Tshirts", "baseColour": "Grey", "season": "Summer", "year": "2011", "usage": "Casual", "productDisplayName": "Inkfruit Mens Chain Reaction T-shirt", "description": "Men Apparel Topwear Tshirts Grey Summer 2011 Casual Inkfruit Mens Chain Reaction T-shirt"}
{"index": {"_index": "cohere_multilingual_english_catalog", "_id": 6}}
{"gender": "Men", "masterCategory": "Apparel", "subCategory": "Topwear", "articleType": "Shirts", "baseColour": "Green", "season": "Summer", "year": "2012", "usage": "Ethnic", "productDisplayName": "Fabindia Men Striped Green Shirt", "description": "Men Apparel Topwear Shirts Green Summer 2012 Ethnic Fabindia Men Striped Green Shirt"}
{"index": {"_index": "cohere_multilingual_english_catalog", "_id": 7}}
{"gender": "Women", "masterCategory": "Apparel", "subCategory": "Topwear", "articleType": "Shirts", "baseColour": "Purple", "season": "Summer", "year": "2012", "usage": "Casual", "productDisplayName": "Jealous 21 Women Purple Shirt", "description": "Women Apparel Topwear Shirts Purple Summer 2012 Casual Jealous 21 Women Purple Shirt"}
{"index": {"_index": "cohere_multilingual_english_catalog", "_id": 8}}
{"gender": "Men", "masterCategory": "Accessories", "subCategory": "Socks", "articleType": "Socks", "baseColour": "Navy Blue", "season": "Summer", "year": "2012", "usage": "Casual", "productDisplayName": "Puma Men Pack of 3 Socks", "description": "Men Accessories Socks Socks Navy Blue Summer 2012 Casual Puma Men Pack of 3 Socks"}
{"index": {"_index": "cohere_multilingual_english_catalog", "_id": 9}}
{"gender": "Men", "masterCategory": "Accessories", "subCategory": "Watches", "articleType": "Watches", "baseColour": "Black", "season": "Winter", "year": "2016", "usage": "Casual", "productDisplayName": "Skagen Men Black Watch", "description": "Men Accessories Watches Watches Black Winter 2016 Casual Skagen Men Black Watch"}
...
```
Once the data is ingested, the `description` field is converted into text embeddings and the embeddings are stored in `description_vector` using the ingest pipeline and connector created in the previous steps.

### Performing multilingual search requests
You can now search your catalog. Semantic search can be performed in English or in any of the model's [supported languages](https://docs.cohere.com/docs/supported-languages).  

#### Searching in English
The following is an example semantic search in English:
```json
GET /cohere_multilingual_english_catalog/_search
{
  "_source": [ "description", "subCategory"],
  "size": 5,
  "query": {
    "neural": {
      "description_vector": {
        "query_text": "man birthday gift",
        "model_id": "<MODEL_ID>",
        "k": 5
      }
    }
  }
}
```
The search query is `man birthday gift`, but notice that the results do not necessarily match the words `birthday` or `gift`:
```json
{
  ...
    "hits": [
      {
        ...
        "_score": 0.5146248,
        "_source": {
          "subCategory": "Fragrance",
          "description": "Men Personal Care Fragrance Deodorant Blue Spring 2017 Casual Rasasi Men Deserve Deo"
        }
      },
      {
        ...
        "_score": 0.5110825,
        "_source": {
          "subCategory": "Jewellery",
          "description": "Men Accessories Jewellery Ring Steel Summer 2013 Casual Revv Men Steel Ring"
        }
      },
      {
        ...
        "_score": 0.5016889,
        "_source": {
          "subCategory": "Sandal",
          "description": "Men Footwear Sandal Sandals Olive Summer 2012 Casual Bata Men Hummer Grey Sandals"
        }
      },
      {
        ...
        "_score": 0.50156057,
        "_source": {
          "subCategory": "Fragrance",
          "description": "Men Personal Care Fragrance Fragrance Gift Set Red Spring 2017 Casual Reebok Men Reeplay Perfume & Deodorant Set"
        }
      },
      {
        ...
        "_score": 0.50010604,
        "_source": {
          "subCategory": "Sandal",
          "description": "Men Footwear Sandal Sandals Brown Summer 2013 Casual Gas Men Aventura Sandal"
        }
      }
    ]
}
```
#### Searching in other languages
Because the embedding was performed using a multilingual embedding model, you can search in any of the languages supported by the model. 
As an example, this includes Hebrew, which is not supported out-of-the-box in OpenSearch:
```json
GET /cohere_multilingual_english_catalog/_search
{
  "_source": [ "description", "subCategory"],
  "size": 5,
  "query": {
    "neural": {
      "description_vector": {
        "query_text": "נעלי גבר לקיץ",
        "model_id": "<MODEL_ID>",
        "k": 5
      }
    }
  }
}
```

The search query is `נעלי גבר לקיץ`, which translates to `man summer shoes`. Note that the results include the "Sandal" category in addition to the "Shoes" category:
```json
{
  ...
    "hits": [
      {
        ...
        "_score": 0.62954986,
        "_source": {
          "subCategory": "Sandal",
          "description": "Men Footwear Sandal Sandals Black Summer 2012 Casual Coolers Men Black Sandals"
        }
      },
      {
       ...
        "_score": 0.62954986,
        "_source": {
          "subCategory": "Sandal",
          "description": "Men Footwear Sandal Sandals Black Summer 2012 Casual Coolers Men Black Sandals"
        }
      },
      {
        ...
        "_score": 0.62518847,
        "_source": {
          "subCategory": "Shoes",
          "description": "Men Footwear Shoes Sports Shoes Black Summer 2012 Casual Nike Men Air Twilight Black Shoes"
        }
      },
      {
        ...
        "_score": 0.62431824,
        "_source": {
          "subCategory": "Shoes",
          "description": "Men Footwear Shoes Sports Shoes Black Summer 2011 Sports Nike Men's Elite Black Shoe"
        }
      },
      {
        ...
        "_score": 0.6242107,
        "_source": {
          "subCategory": "Sandal",
          "description": "Men Footwear Sandal Sandals Olive Summer 2012 Casual Bata Men Hummer Grey Sandals"
        }
      }
    ]
}
```

The same approach could be used if the catalog itself were in Hebrew or if the items in the catalog were described in different languages. 
It is important to note that lexical search can still be performed on the index, and OpenSearch also allows you to combine lexical and semantic search by using [hybrid search](https://opensearch.org/docs/latest/search-plugins/hybrid-search/).

## Summary
Multilingual embedding models have presented new capabilities for multilingual search. 
Connectors, connectors blueprints, and ingest pipelines simplify the ingestion and query process in OpenSearch.
Additional considerations that were not covered in this blog post include the quality of the embedding model and the ability to fine-tune it, the k-NN engine used, and hybrid search approaches. You can find more information about these subjects in the resources provided in the following section.

## Further reading
* [k-NN search](https://opensearch.org/docs/latest/search-plugins/knn/index/)
* [Building a semantic search engine in OpenSearch](https://opensearch.org/blog/semantic-search-solutions/)
* [The ABCs of semantic search in OpenSearch: Architectures, benchmarks, and combination strategies](https://opensearch.org/blog/semantic-science-benchmarks/)
* [Natural Language and Search: Large Language Models (LLMs) for Semantic Search and Generative AI](https://d1.awsstatic.com/aws-analytics-content/OReilly_book_Natural-Language-and-Search_web.pdf)
