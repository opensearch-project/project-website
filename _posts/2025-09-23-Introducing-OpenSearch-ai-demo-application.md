---
layout: post
title:  "Introducing OpenSearch AI Demos in Hugging Face: Your All-in-One AI Search Playground"
authors:
 - prasadnu
 - bouhajer
 - handler
date: 2025-09-22
categories:
 - technical-post
meta_keywords: AI search, Agentic search, Semantic search,  AI agents, RAG, Conversational search, Agentic search assistant, Colpali
meta_description: OpenSearch project in Hugging Face now offers a suite of AI search demos hosted in OpenSearch space. OpenSearch AI Search is a comprehensive demo platform that showcases the full spectrum of AI search capabilities using OpenSearch with 3 main modules: AI search, Multimodal RAG and Agentic Shopping assistant.
---

  ## 🚀 Introducing OpenSearch AI Demos in Hugging Face: Your All-in-One AI Search Playground
  
  We're thrilled to announce the launch of [OpenSearch AI demos](https://huggingface.co/spaces/opensearch-project/OpenSearch-AI) on [Hugging Face space](https://huggingface.co/opensearch-project), a cutting-edge demo application that puts the power of advanced AI search capabilities right at your fingertips. Whether you're an ML engineer, search expert, data wizard, or product owner diving into the world of Gen AI, OpenSearch AI demos is your new go-to playground for exploring and understanding the latest in search technology.

  ![OpenSearch AI demo application](/assets/media/blog-images/2025-09-22-Introducing OpenSearch AI Demo application/Home-screen.png){: .img-fluid}
  
  OpenSearch AI Search is a comprehensive demo platform that showcases the full spectrum of AI search capabilities using OpenSearch. We've packed it with 3 main modules:
  
  
  * **AI Search**: Demonstrates AI search capabilities with OpenSearch (Lexical search, Neural sparse search, dense vector search, hybrid search, multimodal search). The AI search module also demonstrates how to leverage LLMs to improve search. The solution uses LLMs in two key ways: to rewrite queries with metadata filters for better retrieval, and to judge relevance, helping compare the impact of different search types on quality. Additionally, this section covers tuning hybrid search weightage per sub-query and demonstrates how reranking helps to improve the relevancy of your search. In this demo, we use [a dataset](https://github.com/aws-samples/retail-demo-store) that contains 2,465 retail product samples that belong to different categories such as accessories, home decor, apparel, housewares, books, and instruments. Each product contains metadata including the ID, current stock, name, category, style, description, price, image URL, and gender affinity of the product.
  
  ![OpenSearch AI demo application](/assets/media/blog-images/2025-09-22-Introducing OpenSearch AI Demo application/AI-search-module.png){: .img-fluid}
  
  * **Multimodal RAG (Retrieval-Augmented Generation)**: Unlock the insights hidden within unstructured PDF documents. Many PDFs contain multimodal elements like text, tables, and images, and relying solely on text-based processing risks overlooking critical information. This section addresses this challenge by 2 approaches: 1- Grounding multi-modalities to text. 2- leveraging cutting-edge Vision-Language Models like ColPali for information retrieval.
      * In the first approach, sample PDFs are parsed using multimodal parsers like the [Unstructured Python module](https://pypi.org/project/unstructured/), where images and tables are summarized into text and stored as both sparse and dense vectors. Metadata links each chunk to its source (text, image, or table), enabling retrieval for question answering.
  
  ![OpenSearch AI demo application](/assets/media/blog-images/2025-09-22-Introducing OpenSearch AI Demo application/RAG-module.png){: .img-fluid}


      * Leveraging Vision-Language Models like ColPaLIfor PDF retrieval: Multi-vector late interaction models like [ColPaLI](https://arxiv.org/abs/2407.01449) avoids the need for complex pipelines to process multimodal PDFs by generating multiple page-level vectors that capture all modalities. These localized representations enable fine-grained interactions between query tokens and image patches of PDF pages, allowing ColPaLI to compute high-resolution relevance scores across spatial layouts. A key advantage is interpretability: similarity scores can be visualized as heat maps over PDF pages, highlighting which segments — such as text blocks, tables, or figure captions — contributed most to retrieval. This solution uses a [dataset](https://huggingface.co/datasets/vespa-engine/gpfg-QA) consisting of images of 6692 pdf pages (with text, tables and charts) of public reports retrieved from [Norwegian Government Pension Fund Global](https://www.nbim.no/en/news-and-insights/reports/).

![OpenSearch AI demo application](/assets/media/blog-images/2025-09-22-Introducing OpenSearch AI Demo application/RAG-Colpali.png){: .img-fluid}

  * **Agentic Shopping assistant**: While Retrieval-Augmented Generation (RAG) is widely known for building QA systems over unstructured data, its application in e-commerce product search opens up new possibilities for transforming the user experience. In this solution, we explore how combining RAG with AI agents on top of your OpenSearch product catalog creates an agentic shopping assistant capable of delivering a conversational shopping experience. By equipping the agent with capabilities such as user intent understanding, query rewriting, dynamic selection of search strategies, search result evaluation, feedback-based retries, and personalization, we enable adaptive, high-quality retrieval over product catalogs. This approach not only improves relevance but also allows users to interact naturally with the search system. In this module, we use a [dataset](https://github.com/shuttie/esci-s) derived from the original [Amazon ESCI](https://github.com/amazon-science/esci-data) e-commerce dataset, we use a subset of items under ‘apparel’ and ‘footwear’ product categories with a total of 59.3k products.

![OpenSearch AI demo application](/assets/media/blog-images/2025-09-22-Introducing OpenSearch AI Demo application/AI-shopping-agent-assistant.png){: .img-fluid}

![OpenSearch AI demo application](/assets/media/blog-images/2025-09-22-Introducing OpenSearch AI Demo application/AI-shopping-agent-assistant-2.png){: .img-fluid}

![OpenSearch AI demo application](/assets/media/blog-images/2025-09-22-Introducing OpenSearch AI Demo application/AI-shopping-agent-assistant-3.png){: .img-fluid}

  
  The AI agent in this demo has the following defined tools:
  
  * get_relevant_items_for_image: Retrieves relevant products based on the provided image and text query by running a multimodal search.
  * generate_image: Generates images based on the provided text description.
  * get_product_details: Retrieves details about a specific product by looking up the opensearch index.
  * get_relevant_items_for_text: Retrieves relevant products based on the provided text query by running a semantic search.
  * get_any_general_recommendation: Provide fashion related recommendations related to a specific product or in general.
  * retrieve_with_keyword_search: Retrieves relevant products based on the provided text query by running a lexical search
  
  
  
  ## Under the Hood: OpenSearch AI search demo architecture
  
  
  Machine Learning (ML) integration in search systems significantly enhances user experience throughout the entire lifecycle, from ingesting documents to delivering highly relevant results. OpenSearch facilitates this integration through a [list of supported ML connectors](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/connectors/), enabling seamless interaction with ML and Large Language Models deployed on ML platforms such as [Amazon SageMaker AI](https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html) and [Amazon Bedrock](https://aws.amazon.com/bedrock/).


![OpenSearch AI demo application](/assets/media/blog-images/blog-images/2025-09-22-Introducing OpenSearch AI Demo application/ML-integrations-opensearch){: .img-fluid}


  OpenSearch supports dual-pipeline architecture—comprising [ingest](https://docs.opensearch.org/latest/ingest-pipelines/) and [search pipelines](https://docs.opensearch.org/latest/search-plugins/search-pipelines/index/) provides a robust framework for ML-driven search optimization.

  At ingestion, documents undergo ML-powered processing, using a combination of [ingest processors](https://docs.opensearch.org/latest/ingest-pipelines/processors/index-processors/#supported-processors) within the ingest pipeline to chunk long text documents and generate text embeddings. 
  During search, search pipelines with the power of [search processors](https://docs.opensearch.org/latest/search-plugins/search-pipelines/search-processors/), can transform queries, normalize hybrid search scores, and leverage Large Language Models for text generation.
  
  OpenSearch ML integrations, enable advanced search functionalities such as hybrid search, query rewriting, and Retrieval-Augmented Generation (RAG), effectively bridging the gap between traditional information retrieval and state-of-the-art ML techniques.
  
  
  ## Key Benefits:
  
  In the rapidly evolving landscape of AI and search technologies, it's crucial to understand which approaches work best for different use cases. OpenSearch AI demos allows you to:
  
  
  1. Compare and Contrast: Test different AI search types side-by-side to see how they perform for your specific needs.
  2. Explore Cutting-Edge Techniques: Get hands-on experience with state-of-the-art methods like query rewriting using LLMs and multi-vector search with ColPali in RAG.
  3. Witness Agents in Action: See how intelligent agents can enhance the search experience in real-time.
  4. One-Stop Shop: Access all these advanced search techniques integrated with ML and LLMs in a single, user-friendly platform.
  
  ## Start Exploring
  
  OpenSearch AI demos is built for practical experimentation and learning. Here's how to get started:
  
  
  1. Head over to [OpenSearch AI search Demo application](https://huggingface.co/spaces/opensearch-project/OpenSearch-AI) and start experimenting with different AI search use cases.
  2. Try out various queries per use case, compare results, and see which techniques work best for your use cases.
  3. Got ideas for improvements? Check out our [GitHub repo](https://huggingface.co/spaces/opensearch-project/OpenSearch-AI/tree/main) to request features, report bug or contribute to OpenSearch AI demos.
  4. You are an AWS builder? Check out [this hands-on experience](https://catalog.workshops.aws/opensearch-ml-search/en-US) to build Next-gen search demo in your own AWS accounts.
  
  
  
  Ready to revolutionize your approach to AI search? Dive into OpenSearch AI demos today and discover the future of search technology! 
  
  Happy searching, folks! 🔍✨
