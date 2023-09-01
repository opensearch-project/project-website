---
date: 2023-08-30 00:00:01 -0700
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
G﻿oing from a vanilla install of OpenSearch to having vectorized text stored in an index seemed like a short journey. On paper, it  sounded easy. Upload a model to a node designated as a ML node, load it, and start ingesting text and storing it as a vector. T﻿he herculean amount of probing, asking, experimenting, copying and pasting and smashing my head into my desk quickly made it clear to me that I was mistaken. 

P﻿lease find below the chronicles of my efforts to load a pre-trained model into OpenSearch by hand, using nothing more than the dev console and a heavy dose of copypasta. I hope that it saves you the time spent researching that I needed. 

# Machine learning? I need human learning.

I﻿'ll apologize if my journey takes twists and turns. The toil involved has left me a little shocked and I'd sure like to help improve the journey from zero to something. What are the steps? Where do I start? 

I﻿ started [here](https://opensearch.org/docs/latest/ml-commons-plugin/ml-framework/) at the ml-framework documentation page. It gave me a good start. I apparently needed to register a model. 

W﻿hat's a model? What kinds are there? Do I get them somewhere else? Does OpenSearch come with any? What do I do with it? sha256 hash missing from examples!

Using an example call showed me that I needed to have a node as an "ML node" - I only have one node in my cluster. I decided to disable the requirement for now. 

**Side quest number one**: Learn the settings API. I started [here](https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-settings/) at the cluster settings documentation, which got me the general syntax of the call. Now I just needed the setting names. I embarrassingly had to google "opensearch ml cluster settings" to find the actual setting names. 

I﻿ eventually cobbled together this call.

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

T﻿hat worked! Great. Now I can start!﻿ 



L﻿et's upload a model! 

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

```
GET /_plugins/_ml/tasks/_search
{
    "query": {
     "match": { 

 }
 }
}

GET /_plugins/_ml/models/_search
{
    "query": {
     "match_all": { 
     }
  }
}
```