---
layout: solution
title: Using OpenSearch as a Vector Database
categories:
  - search
primary_title: Using OpenSearch as a Vector Database
---

## An open-source, all-in-one vector database for building flexible, scalable, and future-proof AI applications

Traditional term-based search, based on term frequency models like BM25, is widely used and effective for many search applications. However, these term-based search techniques require significant investment in time and expertise to tune them to account for the meaning or relevance of the terms searched.  Today, more and more developers want to embed semantic understanding into their search applications. Enter machine learning embedding models that can encode the meaning and context of documents, images, and audio into vectors for similarity search. These embedded meanings can, in turn, be searched using the [k-nearest neighbors (k-NN)](https://opensearch.org/docs/latest/search-plugins/knn/index/ "k-nearest neighbors (k-NN)") functionality provided by OpenSearch.  

Using OpenSearch as a vector database brings together the power of traditional search, analytics, and vector search in one complete package. OpenSearch’s vector database capabilities can accelerate artificial intelligence (AI) application development by reducing the effort for builders to operationalize, manage, and integrate AI-generated assets. Bring your models, vectors, and metadata into OpenSearch to power vector, term-based, and hybrid search and analytics, with performance and scalability built in.

Use the vector database functionality built into OpenSearch to:

- Power AI applications on a mature search and analytics engine trusted in production by tens of thousands of users.
- Build stable, scalable applications with a data platform proven by users to scale to up to tens of billions of vectors in production, with the low latency and high availability required by mission-critical systems.
- Choose open-source tools and avoid lock-in with Apache 2.0-licensed software and integrations with popular open frameworks like LangChain and LlamaIndex, with the option to use managed services from major cloud providers.
- Future-proof your next-generation AI applications with vector, term-based, and hybrid search, analytics, and observability capabilities, all in one software suite.

## What is a vector database?

Information comes in many forms: unstructured data, like text documents, rich media, and audio, and structured data, like geospatial coordinates, tables, and graphs. Innovations in AI have enabled the use of models, or embeddings, to encode all types of data into vectors. These vectors are data points in a high-dimensional space that capture the meaning and context of an asset, allowing search tools to find similar assets by searching for neighboring data points.

Vector databases allow you to store and index vectors and metadata, unlocking the ability to use low-latency queries to discover assets by degree of similarity. Typically powered by k-NN indexes built using algorithms like Hierarchical Navigable Small Worlds (HNSW) and Inverted File (IVF) System, vector databases augment k-NN functionality by providing a foundation for applications like data management, fault tolerance, resource access controls, and a query engine.

OpenSearch provides an integrated  vector database that can support AI systems by serving as a knowledge base. This benefits AI applications like generative AI and natural language search by providing a long-term memory of AI-generated outputs. These outputs can be used to enhance information retrieval and analytics, improve efficiency and stability, and give generative AI models a broader and deeper pool of data from which to draw more accurate and truthful responses to queries.

## Vector Database Use Cases

OpenSearch as a vector database supports a range of applications. Following are a few examples of solutions you can build.

### Search

Visual search
: Create applications that allow users to take a photograph and search for similar images without having to manually tag images.

Semantic search
: Enhance search relevancy by powering vector search with text embedding models that capture semantic meaning and use hybrid scoring to blend term frequency models (BM25) for improved results.

Multimodal search
: Use state-of-the-art models that can fuse and encode text, image, and audio inputs to generate more accurate digital fingerprints of rich media and enable more relevant search and insights.

Generative AI agents
: Build intelligent agents with the power of generative AI while minimizing [hallucinations](https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)#:~:text=AI%20hallucination%20gained%20prominence%20around,falsehoods%20within%20their%20generated%20content.){:target="_blank"} by using OpenSearch to power retrieval augmented generation (RAG) workflows . (Whether you refer to them as chatbots, automated conversation entities, question answering bots, or something else, OpenSearch’s vector database functionality can help them deliver better results).

### Personalization

Recommendation engine
: Generate product and user embeddings using collaborative filtering techniques and use OpenSearch to power your recommendation engine.

User-level content targeting
: Personalize web pages by using OpenSearch to retrieve content ranked by user propensities using embeddings trained on user interactions.

### Data Quality

Automate pattern matching and de-duplication
: Use similarity search for automating pattern matching and duplicates in data to facilitate data quality processes.

### Vector database engine

Data and machine learning platforms
: Build your platform with an integrated, Apache 2.0-licensed vector database that provides a reliable and scalable solution to operationalize embeddings and power vector search.

### Getting Started

You can begin exploring OpenSearch’s vector database functionality by [downloading](/downloads.html) your preferred distribution and installing the [k-NN plugin](https://opensearch.org/docs/latest/search-plugins/knn/index/). To learn more or start a discussion, join the [Slack channel](https://opensearch.slack.com/archives/C05BGJ1N264){:target="_blank"} or check out our [user forum](https://forum.opensearch.org/){:target="_blank"} and follow [our blog](/blog/) for the latest on OpenSearch tools.

## Resources

Following are links to documents from users, application developers, and other members of the OpenSearch community that explore the ways OpenSearch can be deployed as a vector database solution.

### Integrations

- [Haystack integration with OpenSearc](https://www.deepset.ai/opensearch-integration){:target="_blank"}
- [Hopsworks integration with OpenSearch](https://docs.hopsworks.ai/3.0/user_guides/mlops/vector_database/#introduction){:target="_blank}
- [LangChain integration with OpenSearch](https://python.langchain.com/en/latest/modules/indexes/vectorstores/examples/opensearch.html){:target="_blank"}
- [LlamaIndex integration with OpenSearch](https://gpt-index.readthedocs.io/en/latest/reference/storage/vector_store.html#llama_index.vector_stores.OpensearchVectorClient){:target="_blank}

### Blog Posts

- [Augmenting Large Language Models with Verified Information Sources](https://medium.com/@shankar.arunp/augmenting-large-language-models-with-verified-information-sources-leveraging-aws-sagemaker-and-f6be17fb10a8){:target="_blank"}
- [The ABCs of semantic search in OpenSearch](/blog/semantic-science-benchmarks/)
- [Augmenting ChatGPT with Amazon OpenSearch](https://www.stratusgrid.com/open-space/augmenting-chatgpt-with-amazon-opensearch?locale=en){:target="_blank"}
- [Build a powerful question answering bot](https://aws.amazon.com/blogs/machine-learning/build-a-powerful-question-answering-bot-with-amazon-sagemaker-amazon-opensearch-service-streamlit-and-langchain/){:target="_blank"}
- [Implement unified text and image search with a CLIP model](https://aws.amazon.com/blogs/machine-learning/implement-unified-text-and-image-search-with-a-clip-model-using-amazon-sagemaker-and-amazon-opensearch-service/){:target="_blank"}
- [Building an NLU-powered search application with Amazon SageMaker and the Amazon OpenSearch Service](https://aws.amazon.com/blogs/machine-learning/building-an-nlu-powered-search-application-with-amazon-sagemaker-and-the-amazon-es-knn-feature/){:target="_blank"}
- [Building a visual search application with Amazon SageMaker and Amazon ES](https://aws.amazon.com/blogs/machine-learning/building-a-visual-search-application-with-amazon-sagemaker-and-amazon-es/){:target="_blank"}
- [Choose the k-NN algorithm for your billion-scale use case with OpenSearch](https://aws.amazon.com/blogs/big-data/choose-the-k-nn-algorithm-for-your-billion-scale-use-case-with-opensearch/){:target="_blank"}