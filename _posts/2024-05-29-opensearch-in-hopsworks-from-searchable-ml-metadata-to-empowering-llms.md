---
layout: post
title:  "OpenSearch in Hopsworks: From Searchable ML Metadata to Empowering LLMs"
authors:
  - jimdowling
  - lexavstreikh
date: 2024-05-30
categories:
  - technical-post
  - partners
meta_keywords: Hopsworks, OpenSearch, Machine Learning, ML Metadata, Feature Store, AI lakehouse, LLMs, Free-Text Search, RAG, Retrieval-Augmented Generation, Vector Database, ML Asset Governance, k-NN Plugin, Multi-Tenancy
meta_description: Explore how Hopsworks integrates OpenSearch for ML asset search, metadata governance, and LLM capabilities, enhancing ML pipelines with free-text search, vector databases, and multi-tenant security.

---

[Hopsworks](https://www.hopsworks.ai/) is an AI lakehouse; an ML platform for batch and real-time data. In this article, we outline our journey with OpenSearch starting from the search capabilities for ML Assets (features, training data, models) to empowering LLM use cases.

## From Free-Text Search to RAG for LLMs

Hopsworks is an operational platform for ML that enables organizations to easily build and operate ML systems using ML pipelines: feature pipelines, training pipelines and inference pipelines. A key capability of the platform is to enable developers to [discover and reuse available features](https://www.hopsworks.ai/post/feature-store-the-missing-data-layer-in-ml-pipelines), so as not to re-implement a feature pipeline.

To enforce the principles of [FAIR](https://www.hopsworks.ai/post/fair-principles-in-data-for-ai) (Findable Accessible Interoperable Reusable) within the platform we decided early on to empower our users with the ability to search all the metadata and assets in their project, and made the choice to integrate with OpenSearch.

This prove to be a wise decision as the rise of LLMs in the field of AI took hold and the Hopsworks team saw the opportunity to extend OpenSearch to a more central role as part of the feature store; making it the underlying engine for embeddings as features, empowering the new LLM capabilities and coupling them with the rest of the Hopsworks state-of-the-art suite.

## First, There Was Free-Text Search for ML Assets

[Free-text search for the ML assets](https://docs.hopsworks.ai/3.2/user_guides/fs/tags/tags/#step-3-search) in Hopsworks, was one of the first use cases powered by OpenSearch in the platform. As the number of ML assets grows within an organization, free-text search becomes increasingly important to enable developers to easily discover and reuse ML assets. For example, the reuse of features in multiple models can lead to huge cost savings in both the development and operation of ML systems.

<div>
  <img src="https://uploads-ssl.webflow.com/5f6353590bb01cacbcecfbac/6656d6fa6366c6215281e2b4_search_ui_light.gif" alt="Search in Hopsworks" />
  <p><em>Discovering and reusing features across models removes the need to rewrite feature logic, reducing model development time. OpenSearch Engine powers feature and model discovery in Hopsworks.</em></p>
</div>

| ML Asset     | What is it?                          | OpenSearch Metadata                        |
|--------------|--------------------------------------|--------------------------------------------|
| Feature      | Input data for models                | Name, description                          |
| Feature Group| Mutable table of features            | Name, description, version, custom tags    |
| Feature View | Interface for one or more models     | Name, description, version, custom tags    |
| Training Data| Consistent snapshot of feature data  | Name, description, version, custom tags    |
| Models       | File containing serialized ML model  | Name, description, version, custom tags    |

Additionally, [Schematized Tags](https://docs.hopsworks.ai/3.7/user_guides/fs/tags/tags/#tags) are also important for governance in ML systems, and important to be searchable as well. The governance of machine learning assets requires not only strict management policies but also the right tools. With OpenSearch, Hopsworks helps users understand the properties and constraints of their ML assets, making the governance of these ML assets more seamless and efficient. For example, you can use lineage in Hopsworks in combination with tags to find all models that were trained with PII data, and then correctly label all models as having been trained on PII data.

## Enabling RAG for LLMs with OpenSearch

As a ML platform, [Hopsworks also makes OpenSearch k-NN plugin](https://www.youtube.com/watch?v=9vBRjGgdyTY&t=2s) available as a [vector database](https://opensearch.org/platform/search/vector-database.html). ML embedding models encode semantic information in content (documents, images, and audio) into vectors. Those vectors can be stored and indexed in OpenSearch, and then clients can search for similar content, enabling media search and personalized search/recommendations. This capability powered by OpenSearch within the platform makes the feature store a one stop shop for all the AI data within an organization.

Approximate nearest neighbor (ANN) indexing and vector similarity search for vector embeddings stored in the feature store is a keystone to enable LLMs for organizations; combining their enterprise data for AI with similarity search, allowing users to make better recommendation systems, fine-tune datasets and RAG solutions more easily, faster.
div>

<div>
  <img src="https://assets-global.website-files.com/618399cd49d125734c8dec95/65f84052a4d5ee1cbd43ef9f_feature%20group%20shared%20schema.png" alt="Search in Hopsworks" />
  <p><em>Feature Group Shared Schema,<a href="https://www.hopsworks.ai/post/genai-comes-to-hopsworks-with-vector-similarity-search"> from GenAI Capability</a> Blog post at Hopsworks</em></p>
</div>

This addition of OpenSearch as a core component of the feature store allows organizations to build a more open, more flexible and better data for AI infrastructure that can work for a wider range of use cases, may they be real-time or LLMs.

## There is More; The Value Add for Teams and the Platform

In Hopsworks, OpenSearch also allows users to quickly find and repurpose features, reducing the time spent on manual searching and accelerating the model development process. Without OpenSearch, key tasks such as feature discovery, feature auditing, and feature expiration would be considerably more complex or even impossible. OpenSearch efficiently indexes metadata and tags, enabling low-latency, scalable free-text search for ML assets. OpenSearch can also scale out horizontally, and provides Enterprise-grade security and operations, including backup and upgrade.

## Project-level multi-tenancy for OpenSearch Indexes

Hopsworks supports projects as a security domain, implementing [project-level multi-tenancy](https://www.hopsworks.ai/post/how-we-secure-your-data-with-hopsworks#:~:text=Hopsworks%20and%20OpenSearch%20use%20JWT,indexes%20owned%20by%20the%20project.), where jobs run in Hopsworks by a user only have privileges to access resources within that project. This project-level security boundary implements dynamic role-based access control - even if a user is a member of multiple projects, jobs will only have privileges to access the resources with the current project. Hopsworks supports resources such as feature groups, files, directories, and Kafka topics. Hopsworks adds project-level multi-tenancy for OpenSearch indexes by enforcing access control to indexes based on project membership in Hopsworks. This enables indexes that are private to the members of a project. For example, each project can have its own private OpenSearch-KNN vector database or search index that is accessible programmatically by jobs in that project.

## Summary

OpenSearch provides core metadata indexing and search capabilities that are leveraged by Hopsworks to provide ML asset search and governance capabilities. Hopsworks also extends its ML capabilities with OpenSearch as a vector database, and makes OpenSearch available as a multi-tenant resource in Hopsworks projects.
