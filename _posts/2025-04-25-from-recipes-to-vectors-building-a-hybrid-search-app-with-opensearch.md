---
layout: post
title:  "Recipes to vectors: Building a hybrid search app with OpenSearch"
authors:
   - lizozom
date: 2025-04-25
categories:
  - technical-posts
meta_keywords: hybrid search, vector search, semantic search, OpenSearch
meta_description: Learn how to build a hybrid search application from scratch using a publiclly available recipe data set from Kaggle. This guide explores data preparation, vectorization, and the use of OpenSearch for efficient search and retrieval.
---

Ever wondered if OpenSearch can double as a vector database? Spoiler: it absolutely can. Whether you're building a modern search experience, exploring hybrid retrieval, or just curious about embeddings, OpenSearch makes it surprisingly straightforward to combine traditional relevance with semantic understanding. In this post, we'll explore how to implement vector and hybrid search using a real-world recipe dataset from Kaggle—step by step, and fully in your control.

## Follow along

All the code in this post is available on [GitHub](https://github.com/BigDataBoutique/opensearch-semantic-search-tutorial) for reference.
To follow along, you'll need:
* A Kaggle account and API token.
* A Cohere account and API token.
* An OpenSearch 2.17 cluster. You can easily set it up on [AWS](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/gsg.html).

## Choosing a dataset

Your dataset might already be stored in OpenSearch, be in another database, or you might not have created it yet. In this post, I’ll use a publicly available **recipe** dataset from Kaggle.
We'll be working with the following columns:
* *Name* – A key identifier for search, but also interesting for semantic search.
* *DatePublished* – Useful for filtering and sorting.
* *AuthorName* – Another potential search and filter field.
* *TotalTime* – Useful for filtering out long or short recipes.
* *Ingredients* – Great for keyword-based search, but we also want to search for ingredients semantically.
* *RecipeCategory* – Useful for categorization and filtering.

### Why this dataset?

I chose this dataset because it has both structured and unstructured data, making it a good example for keyword and semantic search. Fields like publish date, ingredients, and category work well for traditional filtering and keyword-based search, while the instructions provide long text, which is useful for testing semantic search.
Another reason I picked this dataset is that it is already clean, so we don't need much preprocessing. In real-world projects, your data may not be this clean and could need extra work before you can use it. How much cleaning is needed depends on your specific data and use case, so keep that in mind when preparing your dataset.

## Choosing an embedding model

Once we have our dataset, the next step is to choose an embedding model for turning our text into vectors. This choice affects search quality and system performance, so it's important to think about pricing, supported languages, input size limits, and output vector size. These things depend on how complex and long your text is. For example, models with larger input limits are better for long documents, while higher-dimensional vectors can improve search accuracy but need more storage and processing power.

Sometimes, you may need to fine-tune an embedding model if the available ones do not understand your specific domain or terminology well. This is useful for technical, medical, or legal texts, where general models may not capture important details. However, fine-tuning requires thousands to hundreds of thousands of labeled examples, as well as additional training costs. It’s often best to first benchmark a pre-trained model on your data before committing to a fine-tuning effort.

For this tutorial, I chose to use Cohere's `embed-english-v3` model because our text is in English, and Cohere offers free tokens for testing, making it easy to try out.

## Preparing the index

Although OpenSearch can automatically infer mappings when data is ingested, it's generally best to define the mapping in advance to avoid inconsistencies and ensure optimal performance. 

Specifically, when using vector fields for semantic search, you must specify the mappings and include a few special properties.
For our dataset, the mapping is as follows:

```
PUT /recipes
{
  "settings": {
    "index.knn": true
  },
  "mappings": {
    "properties": {
      "DatePublished": {
        "type": "date"
      },
      "Name": {
        "type": "text",
        "fields": {
          "keyword": { "type": "keyword" }}
      },
...
      "RecipeCategory": {
        "type": "keyword"
      },
      "RecipeInstructions": {
        "type": "text"
      },
      "embedding": {
        "type": "knn_vector",
        "dimension": 1024
      }
    }
  }
}

```

Most of this should look familiar, but let's take a closer look at the few fields that are unique to OpenSearch and semantic search.

### Understand index settings

First of all, let's take a look at the settings field. It controls index-specific configurations for how OpenSearch stores and manages the index. It is also how you enable the OpenSearch [k-NN plugin](https://github.com/opensearch-project/k-NN) as well as semantic search.

The most basic configuration would look like this:

```
  "settings": {
    "index.knn": true,
  }

```

* `index.knn: true` – The k-NN implementation is built as a plugin. It is enabled by default on most setups, but you still need to enable the k-NN plugin on the index by configuring this setting.
* `index.knn.algo_param.ef_construction` – Controls the number of bi-directional links per node in the HNSW graph. 
Intuition tip: Higher values improve recall but increase memory usage.
* `index.knn.algo_param.m` – Defines how many neighbors are considered during HNSW index construction. 
Intuition tip: Higher values improve search accuracy but slow down indexing.
* `index.knn.algo_param.ef_search` – Controls the accuracy of k-NN queries over HNSW indices. 
Intuition tip: Higher values mean better accuracy but slower search performance.
* `index.knn.space_type` – The default vector space used to calculate the distance between vectors. The two most popular options are `l2 space` (Euclidean distance) and `cosinesimil` (cosine similarity). 
Intuition tip: Cosine similarity is usually great for semantic search and recommendations. Euclidean distance is often better for detecting similarity in images, face recognition, etc.

Now let's explore the `RecipeInstructions_embedding` field, which is where we store vector embeddings for semantic search. By default the only two values you must specify are:

* `type: “knn_vector”` – To let OpenSearch know that this is a vector field.
* `dimension: 1024` – This is the size of the vector, and it would normally be defined by the embedding mode you're using. In our case, `embed-english-v3` creates vectors with 1,024 values.
* 
OpenSearch supports various additional options for overriding the indexing [engine and method space type](https://opensearch.org/docs/latest/field-types/supported-field-types/knn-methods-engines/) and [quantization](https://opensearch.org/docs/latest/field-types/supported-field-types/knn-memory-optimized/). These features let you adjust the index's structure and performance to your needs, but the default configurations are enough for this demo.

## Preparing the data

### Embedding construction

**Embedding construction** refers to the process of building the **most meaningful and information-rich text representation** to be passed into an embedding model. The goal is to create a string that captures the semantic essence of a document, record, or entity—ultimately improving the relevance and effectiveness of downstream tasks like vector search, retrieval, or classification.

**Chunking** is one common form of embedding construction, where large texts are split into smaller overlapping segments to fit within token limits. However, embedding construction can also involve **combining multiple fields, enriching the text, or cleaning and reformatting it** to maximize semantic clarity.

I won't go into detail on every possible method here, but if you're interested in a deeper dive, I highly recommend checking out the [RAG Techniques repository](https://github.com/NirDiamant/RAG_Techniques/tree/main)—it's an excellent resource on chunking and embedding strategies. In practice, experimenting with different embedding construction approaches can have a significant impact on search quality.

For this tutorial, our recipes contain several distinct pieces of information that are all important for semantic search: the recipe name, the list of ingredients, and the preparation steps. These fields are relatively short and equally important, so I'll combine them into a single formatted block of text and embed that as one cohesive unit—for optimal results.

### Embedding

Once we have our text representation ready, we can go ahead and embed it using our chosen embedding model. The goal of this process is to generate and attach an embedding vector to each document that captures the meaning of the text we prepared in the previous step in order to make it searchable once indexed.

To achieve this you would need an API token from your embedding model provider or a connection to an AI platform such as Amazon Bedrock. Note that most providers also offer significant discounts for [batch embedding](https://docs.cohere.com/v2/docs/embed-jobs-api) (vs. real-time embedding). 

In our repo you will find code that takes in a `chunks.jsonl` file, processes it, and outputs a new `embedded.jsonl` file. 

Lets examine an output chunk:

This is the first chunk for a Biryani dish. Note that the `Text` field contains the combination of the name of the dish, the ingredients, and the preparation instructions—this is, in my opinion, a good semantic representation of the text. 

```json
{
  "RecipeInstructions": """Soak saffron in warm milk for 5 minutes and puree in blender., Add chiles, onions, ginger, garlic, cloves, peppercorns, cardamom seeds, cinnamon, coriander and cumin seeds...""",
  "AuthorName": "elly9812",
  "RecipeCategory": "Chicken Breast",
  "Ingredients": "saffron, milk, hot green chili peppers, onions, garlic, clove, peppercorns, cardamom seed, cumin seed, poppy seed, mace, cilantro, mint leaf, fresh lemon juice, plain yogurt, boneless chicken, salt, ghee, onion, tomatoes, basmati rice, long-grain rice, raisins, cashews, eggs",
  "TotalTime": 265,
  "Text": "
      Biryani
      Ingredients: saffron, milk...
      Instructions: Soak saffron in warm...
  ",
  "Name": "Biryani",
  "DatePublished": "1999-08-29T13:12:00Z"
  "embedding": ["float_", [[0.03729248, 0.031402588, … ]]]	
}
```

### Ingestion

The final step in the data preparation process is ingesting the data into OpenSearch. With our index already set up, all that remains is to use the OpenSearch Bulk API to insert the chunks along with their embeddings.

During ingestion, OpenSearch will generate the HNSW graph based on the default configurations. Once the data is ingested, the index will be ready for vector-based queries.

Execute the ingestion script to ingest the documents into OpenSearch. Once completed, you can verify the stored data by fetching a document using the following command in Dev Tools:

```
POST /recipes/_search
{
   "size": 1,
   "query": {
       "match_all": {}
   }
}

```

This will return the stored document, allowing you to inspect its values, including the vector embedding.

With the data successfully ingested, the next step is running queries to test and evaluate our hybrid search system! 

## Searching the index

Now that we've processed and ingested our data, we can move on to the most exciting part—searching the index. OpenSearch allows us to perform different types of searches, including keyword search, semantic search, and hybrid search.

### Keyword search

Keyword search is the traditional method of retrieving documents based on exact matches or full-text relevance scoring. It works well for structured fields like `category` and `ingredients`, so if I were craving chicken, I could search the index using a match query:

```
GET /recipes/_search
{
  "query": {
    "match": {
      "RecipeCategory": "Chicken"
    }
  }
}

-----
Coronation Chicken Salad
Greek Chicken and Rice
Chicken Teriyaki with Cashew Pineapple Rice
Chicken Noodle Soup
Macaroni and Cheese a 'la King
-----

```

### Semantic search

However, if I wanted to find chicken recipes that were Asian inspired and featured noodles and peanuts, a simple keyword search wouldn't be enough. Keyword-based retrieval relies on exact matches, meaning it would only return documents that explicitly contain those words—missing relevant results that describe the same concept in different terms.

To retrieve the most relevant recipes based on meaning rather than exact wording, we need to use semantic search.

First of all, we would need to pass our search query through the same embedding model (for example, Cohere's `embed-english-v3`) so that we can use the resulting vector as the vector in an OpenSearch k-NN query.

Once we have the query embedding, we can use it in a **k-NN query**, which in this case is an additional type of query OpenSearch supports using the k-NN plugin. 

```
POST /recipes/_search
{
   "size": 5,
   "query": {
       "knn": {
           "embedding": {
               "vector": question_embedding,
               "k": 5
           }
       }
   }
}

-----
Curried Peanut Chicken Nibbles
Spicy Chicken Salad
Kung Pao Chicken
Linguine with Chicken and Peanut Sauce
Spicy Thai Noodles
-----
```

Breaking down the parameters of the k-NN query:

* `field: "embedding"` – The vector field where embeddings are stored.
* `vector: [...]` – The embedding of our search query, generated using the same model as our dataset.
* `k: 5` – Retrieve the 5 most similar recipes based on vector similarity.

OpenSearch also allows you to omit k if you specify either `max_distance` or `min_score` as alternative ways to control the number of documents to search semantically.

This approach allows OpenSearch to find recipes that may not contain the exact words "noodles and peanuts" explicitly but definitely fit into the Asian category—such as "Kung Pao Chiken".

### Hybrid search


Lastly, let's say we wanted to cook a low-sugar dessert. If I searched for this semantically, I might get good results, but some other low-sugar dishes might creep in (*Is sweet potato soup a dessert?*). In this case I could use hybrid search and combine the two types of queries.

Here's an example of how to structure this query:

```
POST /recipes/_search 
{
 "size": 5,
 "query": {
   "bool": {
     "must": [
       {
         "knn": {
           "embedding": {
             "vector": question_embedding,
             "k": 5
           }
         }
       }
     ],
     "filter": [
       { "term": { "RecipeCategory": "Dessert" } },
     ]
   }
 }
}

------
No Fat Fruitcake
Vanilla Pudding
Low Fat Carrot Cake
Summer Dessert
Apple Pudding
------

```

In this case OpenSearch filters out only desserts and then looks for the most relevant results **semantically**. We could also use a should query to boost desserts in the search results but not exclude them entirely (*because maybe sweet potato soup IS a dessert after all?*).

## Summary

In this blog post, we explored a hands-on tutorial for using OpenSearch as a vector database. We started by selecting a dataset and an embedding model, then configured an index for semantic search, and reviewed key configuration parameters along the way. Next, we prepared and ingested data, ensuring it was optimized for retrieval. Finally, we executed various search techniques, including keyword search, semantic search, and hybrid search, demonstrating how OpenSearch can combine traditional and AI-driven retrieval methods.
