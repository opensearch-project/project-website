---
authors:
    - dtaivpp
    - tuanacelik

category:
  - partner-highlight

date: 2023-08-25 00:00:01 -0700

# An excerpt of the blog post. It is used in the blog post list view, and in the home page what's new list of N most recent blog posts. It is also used as a fallback value for the twittercard:description field if not explictly defined in the front matter.
excerpt: "Here we will show how to build an end-to-end generative AI application for enterprise search with Retrieval Augmented Generation (RAG) using Haystack, OpenSearch, and Sagemaker JumpStart."

# Used as a fallback for the Twitter Card image, otherwise not currently used. Is only present in content up to June 3, 2021.
feature_image: /assets/media/blog-images/2023-08-25-sagemaker-haystack-opensearch/Architecture.png

has_math: false
has_science_table: false

# The layout template to use for rendering the content.
# Options are default, fullwidth, homepage, and post.
layout: post

# Value used for the meta description tag. Also used as a final fallback value for the Twitter Card description field after the excerpt property.
meta_description: "Amazon Personalize launches a new integration with self-managed OpenSearch that enables customers to personalize search results for each user and predict their needs."

# Value used for the meta keywords tag.
meta_keywords: "SageMaker Jumpstart, OpenSearch, OpenSearch Dashboards, RAG, retrieval augmented generation, generative ai"

# Set to true to indicate content that was imported from the Open Distro For Elasticsearch blog.
odfeimport: false

# The title of the post.
title: "Partner Highlight: Build production-ready generative AI applications for enterprise search using Haystack pipelines and Amazon SageMaker JumpStart with LLMs"

# Meta data for the twitter card. The twitter card is used when a link to the blog post is shared on twitter. The twitter card is also used by other social media sites when a link to the blog post is shared on those sites. The twitter card is also used by search engines when a link to the blog post is shared on those sites.
twittercard:
  image_alt: "Haystack, Sagemaker, and OpenSearch Architecture for Retreval Augmented Generation"
  site: '@OpenSearchProj'

  # The type of the twitter card. The value of summary_large_image is used if there is an image defined in the front matter. Otherwise the value of summary is used. However, an explicit type can be defined here for example if a player type is needed for a video.
  type: summary_large_image

---

<img src="/assets/media/blog-images/2023-08-25-sagemaker-haystack-opensearch/Architecture.png
" alt="Haystack, Sagemaker, and OpenSearch Architecture for Retreval Augmented Generation"/>{: .img-fluid}

Ever wanted to get started with generative AI but didn't know where to start? Check out the AWS Machine Learning blog post "Build production-ready generative AI applications for enterprise search using Haystack pipelines and Amazon SageMaker JumpStart with LLMs". In this article we discuss how retrieval augmented generation (RAG) works and how to set up a RAG pipeline with Haystack, OpenSearch, and SageMaker JumpStart.

The article first provides a bit of background on RAG and how these pipelines typically work. Next, it walks through deploying OpenSearch and models on Amazon SageMaker JumpStart. Then it walks through ingesting documents into OpenSearch using the Haystack Python library. Finally, it shows how to use the data in a RAG pipeline. Check out the [full blog post](https://aws.amazon.com/blogs/machine-learning/build-production-ready-generative-ai-applications-for-enterprise-search-using-haystack-pipelines-and-amazon-sagemaker-jumpstart-with-llms/), which includes a GitHub repo with code so you can follow along yourself.
