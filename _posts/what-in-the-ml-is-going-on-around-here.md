---
date: YYYY-MM-DD HH:MM:SS -NNNN
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
G﻿oing from a vanilla install of OpenSearch to having vectorized text stored in an index seemed like a short journey . On paper, it almost sounded easy. Upload a model to a node designated as a ML node, load it, and start ingesting text and storing it as a vector. T﻿he herculean amount of probing, asking, experimenting, copying and pasting and smashing my head into my desk quickly made it clear to me that I was mistaken. 

P﻿lease find below the chronicles of my efforts to load a pre-trained model into OpenSearch by hand, using nothing more than the dev console and a heavy dose of copypasta. I hope that it saves you the time spent researching that I needed.

# Machine learning? I need human learning.

I﻿'ll apologize if my journey takes twists and turns. The toil involved has left me a little shocked and I'd sure like to help improve the journey from zero to something. What are the steps? Where do I start? 

I﻿ started [here](https://opensearch.org/docs/latest/ml-commons-plugin/ml-framework/) at the ml-framework documentation page. It gave me a good start. 

I needed to learn how to make a node in my cluster an ml-node. I only had one node in my cluster, so that was right out. I disabled the requirement via a post to settings.  

PUT _cluster/settings
{
  "persistent": {
      "plugins.ml_commons.allow_registering_model_via_url": true,
      "plugins.ml_commons.only_run_on_ml_node": false
  }
}


﻿ 
