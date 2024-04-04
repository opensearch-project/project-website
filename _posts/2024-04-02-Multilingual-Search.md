---
layout: post
title:  "Multilingual search with OpenSearch"
authors:
- roigam
date: 2024-04-01 13:30:00 -0600
categories:
  - technical-post
meta_keywords: semantic search engine, multilingual search, keyword and natural language search, search relevance, embeddings
meta_description: Learn how to use OpenSearch to conduct multilingual search with models that support multilingual embeddings.
---

In traditional lexical search we often use text analysis to improve search results. 
OpenSearch uses [analyzers](https://opensearch.org/docs/latest/analyzers/) to refine, tokenize and convert text fields before storing them in an index. 
As an example, indexing `<p><b>Actions</b> speak louder than <em>words</em></p>` can result in the following tokens indexed: [`action`, `speak`, `loud`, `word`]. 
The behaviour depends on the analyzers you defined for your text fields.

In recent years other approaches besides lexical search arose. Semantic search considers the context and intent of a search query. It does so by converting text to vectors in a process called `embeddings`. 
This allows finding documents that are semantically similar and don't necessarily match word by word.  

How can semantic search help us not only with understanding an intent of a search query, but also with multilingual search? 
Imagine you have an e-commerce site, and a product catalog. Using traditional lexical search brings several challenges:
* What happens if the catalog is in one language, and my users search in other languages?
* What if my catalog items are defined in different languages?
* How can I handle search requests or catalog items in languages that are not supported out-of-the-box in [OpenSearch language analyzers](https://opensearch.org/docs/latest/analyzers/language-analyzers/) (e.g., Hebrew)? 

Some of the above challenges could be solved using schema changes, custom code and ETL pipelines, but would greatly complicate the code base, require maintenance and labor time.
In this blog post we discuss how can we use semantic search with multilingual embedding models to overcome the challenges above. 


## Multilingual models
Transforming text into a vector is in the heart of semantic search. 
Embedding models are trained on vast amounts of data and are able to convert text into vectors in a way that capture inherent properties and relationships in real-world data.
Some embedding models are trained on more than one language and therefore can be used to search within a language or across languages. 
Examples for such models are [Cohere’s multilingual embedding model](https://docs.cohere.com/docs/multilingual-language-models) and [Amazon Titan Embeddings G1 - Text G1](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html)

OpenSearch allows you to integrate multilingual embedding models into your search workflow with the following approaches:
* Local models that are uploaded to your cluster locally, such as `huggingface/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
* Externally hosted models on third-party platform such as [Cohere](https://cohere.com/) and [Amazon Bedrock](https://aws.amazon.com/bedrock/).

For an explanation on the tradeoffs between the approaches see [choosing a model](https://opensearch.org/docs/latest/ml-commons-plugin/integrating-ml-models/#choosing-a-model)

## Using multilingual embedding models in OpenSearch
We will now go over the steps required to allow multilingual search using an externally hosted model on Cohere. 
For a tutorial showing how to use a local model please follow [this guide](https://repost.aws/articles/ARwaKLdzGDShq-O2OMU2Nnhg/multilingual-search-with-amazon-opensearch).

Connecting to externally hosted models is done through [Connectors](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/connectors/). 
OpenSearch provides [connector blueprints](https://opensearch.org/docs/latest/ml-commons-plugin/remote-models/connectors/#supported-connectors) for various third-party platforms.

### Creating the Cohere Connector
We will start by following the instructions for [Cohere Embedding Connector Blueprint](https://github.com/opensearch-project/ml-commons/blob/2.x/docs/remote_inference_blueprints/cohere_connector_embedding_blueprint.md#cohere-embedding-connector-blueprint).
Make sure you pass one of Cohere's [multilingual embedding models](https://docs.cohere.com/reference/embed) such as `embed-multilingual-v3.0` when creating your connector:
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
### Creating an ingestion pipeline
Once we created the connector and model, we now create an [ingest pipeline](https://opensearch.org/docs/latest/api-reference/ingest-apis/index/). 
This pipeline will convert the text in a document field to embeddings. 
In the following example we create a pipeline named `cohere_multilingual_pipeline`. We also specify that the text from `description` will be converted into text embeddings and the embeddings will be stored in `description_vector`
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
We now create a k-NN index with the pipeline created in the previous step. Note the `dimension` for `description_vector` must match the model dimension you use.
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

More information on creating a k-NN index can be found [here](https://opensearch.org/docs/latest/search-plugins/knn/knn-index/).

### Ingesting data 
We are ready to ingest our catalog. In the example below we will use the `_bulk` API, and show just a sub set of the data. Note that the full corpus of data holds 2000 documents.
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
Once the data is ingested, the `description` field is converted into text embeddings and the embeddings are stored in `description_vector` using the ingestion pipeline and connector we created in earlier stages.

### Performing multilingual search requests
We can now search our catalog. Semantic search can be done in English, or all languages the [model supports](https://docs.cohere.com/docs/supported-languages).  

#### Searching in English
We can still run a semantic search in the English.
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
Our search query is `man birthday gift`, and notice that the results do not necessarily match the words `birthday` or `gift`:
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
Since the embedding was done using a multilingual embedding model, we can search in any of the languages supported by said model. 
As an example, this includes Hebrew that is not supported out-of-the-box in OpenSearch:
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

Our search query is `נעלי גבר לקיץ`, which translates to `man summer shoes`. Note the results includes the sandal category and not only the shoes category:
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

The same approach as above can be used if the catalog itself was in Hebrew, or the items in the catalog where in different languages. 
Important to note that lexical search can still be done on the index, and OpenSearch also allows us to combine lexical and semantic search with [hybrid search](https://opensearch.org/docs/latest/search-plugins/hybrid-search/)

## Summary
Multilingual embedding models have opened a new door for multilingual search. 
Using connectors, connectors blueprints, and ingest pipelines simplifies the ingestion and query process in OpenSearch.
There are more considerations to be taken that we have not covered in this blog, such as the quality of the embedding model and the ability to fine tune it, the k-NN engine used, and hybrid search approaches. 
I have added a section below for further reading.

## Further reading
* [k-NN search](https://opensearch.org/docs/latest/search-plugins/knn/index/)
* [Building a semantic search engine in OpenSearch](https://opensearch.org/blog/semantic-search-solutions/)
* [The ABCs of semantic search in OpenSearch: Architectures, benchmarks, and combination strategies](https://opensearch.org/blog/semantic-science-benchmarks/)
* [Natural Language and Search - Large Language Models (LLMs) for Semantic Search and Generative AI](https://d1.awsstatic.com/aws-analytics-content/OReilly_book_Natural-Language-and-Search_web.pdf)
