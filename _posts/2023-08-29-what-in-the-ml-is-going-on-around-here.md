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

Going from a vanilla install of OpenSearch to having vectorized text stored in a KNN enabled index seemed like a quick learning exercise. On paper, it almost looked easy. Upload a model to a node designated as a ML node, load it, and start ingesting text and storing it as a vector. The amount of probing, asking, experimenting, copying and pasting  made it clear to me that I was mistaken.

I humbly beg of you all to learn from my toil. Please find below the chronicles of my efforts to load a pre-trained model into OpenSearch by hand, using nothing more than the dev console and a heavy dose of copypasta. I hope that it saves you the time spent researching that I needed.

# Machine learning? I need human learning.

I apologize if my journey takes twists and turns. The effort involved has left me a little winded (from excitement, I promise!) and I'd sure like to help improve the journey from zero to something. What are the steps? Where do I start?

I started [here](https://opensearch.org/docs/latest/ml-commons-plugin/ml-framework/) at the ml-framework documentation page. It gave me a good start. I apparently needed to register a model.  

What's a model? What kinds are there? Do I get them somewhere else? Does OpenSearch come with any? What do I do with it? sha256 hash missing from examples!

Using an example call showed me that I needed to have a node as an "ML node" - I only have one node in my cluster. I decided to disable the requirement for now.


### Side Quest: The Settings API

I started [here](https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-settings/) at the cluster settings documentation, which got me the general syntax of the call. Now I just needed the setting names. I embarrassingly had to google "opensearch ml cluster settings" to find the actual setting names.

### Side Quest: The Tasks API

It's a bit of a misnomer. Many API operations return a task id that you have to then look up. To become proficient with the tools out of the box, using the dev console in the dashboards UI to create, find and delete



For this one, I started [here](https://opensearch.org/docs/2.9/ml-commons-plugin/api/).  
aPi for tasks, models, and model groups. If you upload a model twice with the same name, it will say it is being used by a certain model ID, but what the message *should* say is that it's being used by a model *group.*



I eventually cobbled together this call.

```
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

```
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

The response was as expected - a new task id. I hope you followed **Side Quest Number 2**!

```
{
  "task_id": "GeLGTIoBKue4OlrZmck7",
  "status": "CREATED"
}
```

Let's see how the task is going.

```
GET /_plugins/_ml/tasks/GeLGTIoBKue4OlrZmck7
```

The response? Not quite what I expected.

```
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

### Lesson Learned 1: Model Content Hash Value Field

Well crap. It clearly failed, but `model content changed` isn't very helpful of an error message. I was missing something. 

...*fast forward montage through hours of scanning through `MLModel.java` and pleading for help on our [public slack channel](...)*...

It turns out the example was bad. I was missing a field called `model_content_hash_value`. It's the `sha256` checksum of the zipfile. If you ever want to use a model that's not in the documentation examples, you'll need to calculate the `sha256` checksum of the zipfile and provide that as the `model_content_hash_value` field. Unfortunately there wasn't any documentation for this field. I filed **[Issue 4966](https://github.com/opensearch-project/documentation-website/issues/4966)**.

After downloading the model zip file, I was able to calculate it on my own like so: 

```shell
nateboot@6c7e67babb2c ~ % shasum -a 256 all-MiniLM-L6-v2_torchscript_sentence-transformer.zip
9376c2ebd7c83f99ec2526323786c348d2382e6d86576f750c89ea544d6bbb14  all-MiniLM-L6-v2_torchscript_sentence-transformer.zip
```










```
GET /_plugins/_ml/models/_search
{ "query": { "match_all": {} } }

GET /_plugins/_ml/model_groups/_search
{ "query": { "match_all": {} } }

GET /_plugins/_ml/tasks/_search
{ "query": { "match_all": {} } }

Example Request Doesn't Work: https://github.com/opensearch-project/documentation-website/issues/4966


```