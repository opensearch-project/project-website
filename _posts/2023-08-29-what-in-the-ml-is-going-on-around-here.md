---
date: 2023-08-30 00:00:00 -0700
meta_description: getting started with the neural search plugin for opensearch
meta_keywords: neural search, guide, getting started
has_math: false
authors:
  - nateboot
layout: post
title: What in the ML is going on around here?
categories:
  - technical
twittercard:
  creator: "@nateboot"
  description: "From zero to vectorizing text with the neural search plugin. "
---

Going from a vanilla install of OpenSearch to having vectorized text stored in a k-NN--enabled index seemed like a quick learning exercise. On paper, it almost looked easy. Upload a model to a node designated as a ML node, load it, and start ingesting text and storing it as a vector. The amount of probing, asking, experimenting, and copying and pasting made it clear to me that I was mistaken. I humbly beg of you all to learn from my toil. The following blog chronicles my efforts in loading a pre-trained model into OpenSearch by hand, using nothing more than the dev console and a heavy dose of copypasta. I hope that it saves you the time spent researching that I needed.

Being able to ingest text and store it as a vector will be the stopping point here. It was all I wanted.

# Machine learning? I need human learning.

I apologize if my journey takes twists and turns. The effort involved has left me a little winded (from excitement, I promise!), and I'd sure like to help improve the journey from zero to something. What are the steps? Where do I start? I started [here](https://opensearch.org/docs/latest/ml-commons-plugin/ml-framework/) at the ml-framework documentation page. I apparently needed to register a model. Using an example call showed me that I needed to have a node as an "ML node"---I only have one node in my cluster. I decided to disable the requirement for now.

### Side quest: The Settings API

I started [here](https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-settings/) at the cluster settings documentation, which got me to the general syntax of the call. Now I just needed the setting names. I embarrassingly had to google "opensearch ml cluster settings" to find the actual setting names ([they're here] (https://opensearch.org/docs/latest/ml-commons-plugin/cluster-settings/)) in this OpenSearch cluster settings documentation. I eventually was able to cobble together this call.

```json
# I want to be able to register a model via url as well as perform ML tasks
# on any node in the cluster regardless of its role. 

PUT _cluster/settings
{
  "persistent": {
      "plugins.ml_commons.allow_registering_model_via_url": true,
      "plugins.ml_commons.only_run_on_ml_node": false
  }
}
```

That worked! Great. Now I can start, I hope. Let's upload a model!

```json
POST /_plugins/_ml/models/_upload
{
  "name": "all-MiniLM-L6-v2",
  "version": "1.0.0",
  "description": "test model",
  "model_format": "TORCH_SCRIPT",
  "model_config": {
    "model_type": "bert",
    "embedding_dimension": 384,
    "framework_type": "sentence_transformers"
  },
  "url": "https://github.com/opensearch-project/ml-commons/raw/2.x/ml-algorithms/src/test/resources/org/opensearch/ml/engine/algorithms/text_embedding/all-MiniLM-L6-v2_torchscript_sentence-transformer.zip?raw=true"
}
```

The response was as expected---a new task id. 

```json
{
  "task_id": "GeLGTIoBKue4OlrZmck7",
  "status": "CREATED"
}
```

Let's see how the task is going.

```json
GET /_plugins/_ml/tasks/GeLGTIoBKue4OlrZmck7
```

The response was not quite what I expected.

```json
{
  "task_type": "REGISTER_MODEL",
  "function_name": "TEXT_EMBEDDING",
  "state": "FAILED",
  "worker_node": [
    "_QJb--HRS2-7lfq5DCWMiQ"
  ],
  "create_time": 1693505198395,
  "last_update_time": 1693505199947,
  "error": "model content changed",
  "is_async": true
}
```

Crap on a crap cracker. 

### Lesson Learned 1: Model Content Hash Value Field

It clearly failed, but `model content changed` isn't very helpful of an error message. I was missing something. 

...*fast forward montage through hours of scanning through `MLModel.java` and pleading for help on our [public slack channel](...)*...

It turns out the example was bad. I was missing a field called `model_content_hash_value`. It's the `sha256` checksum of the zipfile. If you ever want to use a model that's not in the documentation examples, you'll need to calculate the `sha256` checksum of the zipfile and provide that as the `model_content_hash_value` field. Unfortunately there wasn't any documentation for this field. I filed **[Issue 4966](https://github.com/opensearch-project/documentation-website/issues/4966)**.

After downloading the model zip file, I was able to calculate it on my own like so: 

```shell
$ shasum -a 256 all-MiniLM-L6-v2_torchscript_sentence-transformer.zip
9376c2ebd7c83f99ec2526323786c348d2382e6d86576f750c89ea544d6bbb14  all-MiniLM-L6-v2_torchscript_sentence-transformer.zip
```

The lesson? Your API calls to register models via URL require some assembly. This field does not seem to be required when registering a ["pre-trained" model.  ](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/#supported-pretrained-models).

### Lesson Learned 2: Model Groups

I had attempted to upload a model without passing in a model group id. OpenSearch does something for you when this happens. A model group is created for you, with the same name that you provided in your call. In my case, it was `all-MiniLM-L6-v2`. So, the next time I tried to upload that model, it kept telling me the name was taken by a particular model id, so I used the API to search for all of the models available. It wasn't there. What *was* there was a model group that I was able to delete. I used the API to delete all the tasks, models, and model groups I just made so I could start with a fresh slate. Make sure you follow the Tasks, Models and Model Groups side quest to make sure you can organize to your own level of comfort.

The error message was confusing, so I filed [issue 1289](https://github.com/opensearch-project/ml-commons/issues/1289).


### Side Quest: Tasks, Models, and Model Groups

Many of the API operations we'll end up using return a task id, model id, or model group id that you have to then look up. Since we're only using the tools that come out of the box, here are the dev console examples that are likely of most help.

```json
# To see what models exist.
GET /_plugins/_ml/models/_search
{ "query": { "match_all": {} } }

# To delete a model
DELETE /_plugins/_ml/models/`model_id`

# To see the model groups that exist. 
GET /_plugins/_ml/model_groups/_search
{ "query": { "match_all": {} } }

# To delete a model group
DELETE /_plugins/_ml/model_groups/`model_group_id`

# To see the tasks that exist.
GET /_plugins/_ml/tasks/_search
{ "query": { "match_all": {} } }

# To delete a task
DELETE /_plugins/_ml/tasks/`task_id`
```

----

Something serendipitous happened as I was trying to teach myself the API for ml-commons when following my tasks, models, and model groups side quest. I found an API call example
[here](https://opensearch.org/docs/latest/ml-commons-plugin/api/) on the ml-commons api reference page. It was perfectly formed, and included all of the stuff that I was missing. Here it is: 

```json
POST /_plugins/_ml/models/_register
{
    "name": "all-MiniLM-L6-v2",
    "version": "1.0.0",
    "description": "test model",
    "model_format": "TORCH_SCRIPT",
    "model_group_id": "FTNlQ4gBYW0Qyy5ZoxfR",
    "model_content_hash_value": "c15f0d2e62d872be5b5bc6c84d2e0f4921541e29fefbef51d59cc10a8ae30e0f",
    "model_config": {
        "model_type": "bert",
        "embedding_dimension": 384,
        "framework_type": "sentence_transformers",
       "all_config": "{\"_name_or_path\":\"nreimers/MiniLM-L6-H384-uncased\",\"architectures\":[\"BertModel\"],\"attention_probs_dropout_prob\":0.1,\"gradient_checkpointing\":false,\"hidden_act\":\"gelu\",\"hidden_dropout_prob\":0.1,\"hidden_size\":384,\"initializer_range\":0.02,\"intermediate_size\":1536,\"layer_norm_eps\":1e-12,\"max_position_embeddings\":512,\"model_type\":\"bert\",\"num_attention_heads\":12,\"num_hidden_layers\":6,\"pad_token_id\":0,\"position_embedding_type\":\"absolute\",\"transformers_version\":\"4.8.2\",\"type_vocab_size\":2,\"use_cache\":true,\"vocab_size\":30522}"
    },
    "url": "https://artifacts.opensearch.org/models/ml-models/huggingface/sentence-transformers/all-MiniLM-L6-v2/1.0.1/torch_script/sentence-transformers_all-MiniLM-L6-v2-1.0.1-torch_script.zip"
}
```

It still raised the question, "How do I know what values to put under model_config if I'm using some other model?" Then I came across *another* example call referring to something called a "Pretrained model" - look at this call: 

```json
POST /_plugins/_ml/models/_upload
{
  "name": "huggingface/sentence-transformers/all-MiniLM-L12-v2",
  "version": "1.0.1",
  "model_format": "TORCH_SCRIPT"
}
```

Why did this call have to be so short and the other ones so long? The answer is that while we refer to these as "pre-trained models", there's a lot of those out there and they're not specific to OpenSearch.  OpenSearch happens to have a handful of models that it supports out of the box, so if one of these fits your requirements you can probably save a lot of time using one of these. Check out our list of [supported pre-trained models](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/#supported-pretrained-models).

Moving forward I think I'll stick with a pre-trained model. I'm going to delete all my tasks and models and model groups and start again now that we've learned a few lessons. 

---

## Scene 1 Act 2: Create a Model Group and Register a Model

Let's try again. This time I want to create a model group for all of the models I upload to live under. Check this out: 

```json
POST /_plugins/_ml/model_groups/_register
{
    "name": "i_eat_pieces_of_ml_model_groups_like_you_for_breakfast",
    "description": "This is Nate trying to make sense of the world."
}

# Response
{
  "model_group_id": "HeO3j4oBKue4OlrZrAL4",
  "status": "CREATED"
}
```

Ok, let's try to register a pre-trained model in that model group by passing the `model_group_id`.
```json
POST /_plugins/_ml/models/_register
{
    "name": "huggingface/sentence-transformers/all-MiniLM-L12-v2",
    "model_group_id":"HeO3j4oBKue4OlrZrAL4",
    "version": "1.0.1",
    "model_format": "TORCH_SCRIPT"
}

# Response
{
  "task_id": "Q-PAj4oBKue4OlrZ-gLf",
  "status": "CREATED"
}

# Task Status
{
    "model_id": "R-PAj4oBKue4OlrZ_QJ_",
    "task_type": "REGISTER_MODEL",
    "function_name": "TEXT_EMBEDDING",
    "state": "COMPLETED",
    "worker_node": [
    "_QJb--HRS2-7lfq5DCWMiQ"
    ],
    "create_time": 1694628903647,
    "last_update_time": 1694628916260,
    "is_async": true
}
```

I would consider that a great success. We've registered a model with OpenSearch (that is to say, the model exists in the OpenSearch model index), but according to the [ml-framework](https://opensearch.org/docs/latest/ml-commons-plugin/ml-framework/) docs we still need to load the model. This is the process of loading the model into memory.  I've got a model id - let's try it. 

```json
POST /_plugins/_ml/models/R-PAj4oBKue4OlrZ_QJ_/_load

# Response
{
    "task_id": "yeOukIoBKue4OlrZ6gMO",
    "status": "CREATED"
}

# Task Details
{
    "model_id": "R-PAj4oBKue4OlrZ_QJ_",
    "task_type": "DEPLOY_MODEL",
    "function_name": "TEXT_EMBEDDING",
    "state": "COMPLETED",
    "worker_node": [
    "_QJb--HRS2-7lfq5DCWMiQ"
    ],
    "create_time": 1694644496910,
    "last_update_time": 1694644503323,
    "is_async": true
}
```

Success again. Now, the million dollar question. How do we take our own text and documents and have them vectorized when we ingest? 

## The Neural Search Plugin

The [Neural Search Plugin](https://opensearch.org/docs/latest/search-plugins/neural-search/) is the solution. It will translate between vectors and text during ingestion and search time. As our goal is to ingest our own source of text and that's it, it looks like we're getting close to our goal. 


```json
PUT _ingest/pipeline/i-eat-pieces-of-nlp-pipelines-for-breakfast
{
  "description": "An example neural search pipeline",
  "processors" : [
    {
      "text_embedding": {
        "model_id": "R-PAj4oBKue4OlrZ_QJ_",
        "field_map": {
          "passage_text": "passage_embedding"
        }
      }
    }
  ]
}

# Response
{
"acknowledged": true
}
```

Now, the part I'm mostly familiar with. Ingested docs have to go into an actual index, so let's make one akin to the example given. 

```json
PUT /super-awesome-nlp-index
{
  "settings": {
    "index.knn": true,
    "default_pipeline": "i-eat-pieces-of-nlp-pipelines-for-breakfast"
  },
  "mappings": {
    "properties": {
      "passage_embedding": {
        "type": "knn_vector",
        "dimension": int,
        "method": {
          "name": "string",
          "space_type": "string",
          "engine": "string",
          "parameters": json_object
        }
      },
      "passage_text": {
        "type": "text"
      },
    }
  }
}
```

The response? 

```json
{
  "error": {
    "root_cause": [
      {
        "type": "parse_exception",
        "reason": "Failed to parse content to map"
      }
    ],
    "type": "parse_exception",
    "reason": "Failed to parse content to map",
    "caused_by": {
      "type": "json_parse_exception",
      "reason": "Unrecognized token 'int': was expecting (JSON String, Number, Array, Object or token 'null', 'true' or 'false')\n at [Source: (byte[])\"{\n    \"settings\": {\n        \"index.knn\": true,\n        \"default_pipeline\": \"i-eat-pieces-of-nlp-pipelines-for-breakfast\"\n    },\n    \"mappings\": {\n        \"properties\": {\n            \"passage_embedding\": {\n                \"type\": \"knn_vector\",\n                \"dimension\": int,\n                \"method\": {\n                    \"name\": \"string\",\n                    \"space_type\": \"string\",\n                    \"engine\": \"string\",\n                    \"parameters\": json_object\n                }\n         \"[truncated 113 bytes]; line: 10, column: 34]"
    }
  },
  "status": 400
}
```

Crap again. Fortunately, I was quick to receive a response on Slack about these calls. Once again, some assembly was required. 


## Side Quest 3: Creating a KNN index properly. 

The example call was meant to have some pieces filled in. Specifically, the `dimension` value, as well as the values inside of the `method` object. Let's fill them in. 

```json
        "dimension": int,
        "method": {
          "name": "string",
          "space_type": "string",
          "engine": "string",
          "parameters": json_object
        }
```

According to the [pre-trained models](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/) page, my model has a dimensionality of 384. I'll replace `int` with `384`. 

Now for the KNN `method`, I had a really hard time understanding what to put here. The only **required** field is the name. I'll take the defaults for the sake of simplicity in my examples. I'll try to boil down the docs into something a bit easier to skim. 

* The engine is one of three: `nmslib`, `faiss`, and `lucene`.
* The `nmslib` engine supports `hnsw`, which is the default if you supply a name but no engine. 
* The `faiss` engine supports the methods `hnsw` and `ivf`. 
* The `lucene` engine supports the method `hnsw`.

I'm going to just specify a method name of `hnsw`, which will provide the default engine of `nmslib`. Here's the call to create my k-NN index now.
```json
PUT /super-awesome-nlp-index
{
  "settings": {
    "index.knn": true,
    "default_pipeline": "i-eat-pieces-of-nlp-pipelines-for-breakfast"
  },
  "mappings": {
    "properties": {
      "passage_embedding": {
        "type": "knn_vector",
        "dimension": 384,
        "method": {
          "name": "hnsw"
        }
      },
      "passage_text": {
        "type": "text"
      }
    }
  }
}

# The Response
{
    "acknowledged": true,
    "shards_acknowledged": true,
    "index": "super-awesome-nlp-index"
}
```

Double rad! I made a k-NN index attached to my neural search pipeline! NOW where was I? Oh right! I just want to ingest and vectorize some text, and that's it. I feel like I'm getting close. 

```json
POST /super-awesome-nlp-index/_doc
{
   "passage_text": "Why did the chicken cross the road? To get to the other side."
}

# The Response
{
    "_index": "super-awesome-nlp-index",
    "_id": "SOPsmYoBKue4OlrZShCY",
    "_version": 1,
    "result": "created",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 0,
    "_primary_term": 1
}
```

Looks like it ingested my joke. Just to see it with my own eyes I'm going to do a quick search and see if the vector comes back. I'll point out again that the "dimensionality" of our vector is 384, so there's going to be 384 values. I'm going to cut some of them out. 

```json
{
  "took": 0,
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
    "max_score": 1,
    "hits": [
      {
        "_index": "super-awesome-nlp-index",
        "_id": "SOPsmYoBKue4OlrZShCY",
        "_score": 1,
        "_source": {
          "passage_embedding": [
            0.09026472,
            0.022673616,
            -0.027812438,
            0.09684542,
            0.083259515,
            0.04510128,
            0.05745254,
            # SNIP!
          ],
          "passage_text": "Why did the chicken cross the road? To get to the other side."
        }
      }
    ]
  }
}
```
This is where I stop. The goal has been achieved---a k-NN index associated with a neural search pipeline and an ML model. Please stay tuned - I have no big plans for now, but where dad jokes are concerned, the sky is the limit. 









