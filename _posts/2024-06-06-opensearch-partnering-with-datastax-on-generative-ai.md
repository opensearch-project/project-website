---
layout: post
title:  "Announcing an OpenSearch and DataStax generative AI partnership"
authors:
  - zznate 
date: 2024-06-06
categories:
  - community
  - partners
meta_keywords: 
meta_description: 
excerpt: 
has_math: false
has_science_table: false
---

DataStax and the OpenSearch Project are announcing a series of integration efforts to support generative AI developers. Retrieval-augmented generation (RAG) is a key design pattern in generative AI. RAG applications work by assembling context from a variety of sources, which is then processed by a large language model (LLM) to provide an intelligent and relevant response. Serving these applications requires a mix of data retrieval and storage capabilities, and we, OpenSearch and DataStax, are committed to working together to serve the broad needs of generative AI developers.   

To power the explosive growth within the generative AI space, we need to keep innovating on the tooling available to developers. These tools require access to a variety of enterprise data, and we want to be there to provide that access in whatever common format is required. Being able to retrieve data in the most flexible ways possible is a necessary catalyst for getting RAG and generative AI knowledge applications to production. 

Amazon sponsors the OpenSearch Project to ensure the continuing existence of an open-source search engine that users can use, modify, and extend however they wish. In addition to AWS, the OpenSearch community is full of active contributors, maintainers, and partners. For generative AI specifically, OpenSearch offers the following benefits:

* **Ease of use**: OpenSearch provides easy-to-use indexing and search capabilities and has built in features for text analysis, tokenization, and relevance scoring
* **Optimized for text retrieval**: OpenSearch makes it easy to find and rank documents based on keyword queries
* **Versatility**: OpenSearch can handle a wide variety of data types and formats
* **AI/ML integration**: OpenSearch supports semantic search with vector embeddings, multi-modal search, hybrid search with score normalization, and sparse vector search

DataStax is a leading contributor to a range of open source projects, including [Langflow](https://langflow.org/), [Apache Cassandra](https://cassandra.apache.org/_/index.html), and [JVector](https://github.com/jbellis/jvector), which provides vector search through DiskANN and advanced GenAI techniques like COLBert. Generative AI developers seek this database and vector combination to provide: 

* **Context assembly**: Langflow delivers a UI to discover ecosystem components and compose the workflows that back Generative AI applications
* **Similarity search**: JVector offers high-performance vector similarity search and can handle embedding-based queries which require low latency and high relevance
* **Scalability**: Cassandra offers scalable persistence for structured and semi-structured data

The combination of these technologies enable semantic and keyword searches as well as hybrid query processing. Context is assembled using: 
* Keyword queries which are directed to OpenSearch to retrieve relevant documents
* Semantic queries use JVector and Cassandra to find the most relevant data points based on vector similarity
* Database queries which provide known personalization, profile, and transactional data

### **Moving Forward**
DataStax will maintain a JVector integration for OpenSearch, and offer OpenSearch as part of their self-managed offering platform, HCDP (Hyper Converged Data Platform) and as integration to their cloud service, Astra. 

Enterprises have spent years investing in search infrastructure. With the inclusion of OpenSearch, DataStax can give developers the most flexible information retrieval possible with applications already familiar to many enterprises. OpenSearch bridges the gap between single document Q&A and open domain Q&A: essentially providing the ability to reason across multiple, diverse documents and texts by tying keyword searching in OpenSearch alongside dense vector search of JVector in Astra and HCDP. 

For generative AI, relevance wins, and through this partnership we will ensure that your enterprise data estate can act as context for RAG and generative AI workflows to provide as much data to the context as possible. For more information, see the [HCDP announcement](https://www.datastax.com/fr/blog/introducing-vector-search-for-self-managed-modern-architecture).




