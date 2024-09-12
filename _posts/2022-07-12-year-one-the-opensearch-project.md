---
layout: post
title:  "Year One: The OpenSearch Project"
authors:
- carlmeadows
date: 2022-07-12
categories:
 - community
redirect_from: "/blog/community/2022/07/year-one-the-opensearch-project/"
---


I know its cliché, but what a difference a year makes. We launched the [OpenSearch project a year ago today](https://aws.amazon.com/blogs/opensource/opensearch-1-0-launches/) to help ensure that the community of open-source Elasticsearch users had a path forward. We wanted to be sure users continue to have a secure, high-quality, fully open-source search and analytics suite with a rich roadmap of new and innovative functionality. 

## What is the OpenSearch project? 

All along, the mission of the OpenSearch project has been to promote the long-term success of a thriving, feature-rich, broadly adopted, community-driven open-source search and analytics software suite. We strive to make OpenSearch easy to use for as many people and organizations as possible. Whether you are an independent developer, an enterprise IT department, a software vendor, or a managed service provider, the ALv2 license grants you well-understood usage rights for OpenSearch. You can use, modify, extend, embed, monetize, resell, and offer OpenSearch as part of your products and services—broad adoption benefits the entire community.   

With OpenSearch, you’re able to easily ingest, secure, search, aggregate, view, and analyze data for a number of use cases, such as log analytics, application search, enterprise search, and more. Because of its incredible utility and wide range of features (full-text search, time series, geospatial, aggregations, etc.), I often compare it to a Swiss Army knife.

As a search engine, OpenSearch is robust enough to support all kinds of applications, including everything from business-critical e-commerce to massive-scale document search, full-text search, natural language capabilities, inverted index data structures for fast response times, broad language support, and built-in, highly tunable relevance scoring. 

For streaming data, OpenSearch provides high-volume data ingest, near real-time processing at scale, and distributed infrastructure that can scale horizontally and vertically to support large workloads. This makes a great foundation for use cases like log analytics and observability, for which OpenSearch provides rich visualization tools with OpenSearch Dashboards that make it easy for your users to explore and find meaning in vast troves of data. And that’s just scratching the surface! I am surprised on an almost daily basis by the new and exciting ways OpenSearch users are leveraging these capabilities to provide new experiences for their users.


## What have we accomplished in the last year?

Like a lot of technology leaders, I spend more time thinking about what’s ahead than dwelling on what’s been done. However, this milestone represnts a unique moment to pause and take stock of what the [OpenSearch community](https://forum.opensearch.org/) has accomplished in such a short amount of time. And when I do, I am amazed and humbled. These are a few of the achievements I’d invite the community to celebrate:

* 47M+ downloads of OpenSearch in 2022
* [33 OpenSearch partners](https://opensearch.org/partners/), and more being added weekly 
* 6 production releases driven by community feedback
* [18 community projects](https://opensearch.org/community_projects) supported
* 303+ external contributions to the project in 2022

I'm also particularly impressed with the cadence and scope of the project's product releases. Since OpenSearch 1.0 launched 365 days ago, we’ve followed that with 3 minor releases on the 1.x line, pulling in features like cross-cluster replication, bucket-level alerting, a new observability interface, shard-level indexing back-pressure, and several new anomaly detection features. We also added ML Commons, a dedicated plugin for machine learning (ML) applications, plus support for ML and other functions in Piped Processing Language (PPL). 

In May, we released our next major version, [OpenSearch 2.0](https://opensearch.org/blog/releases/2022/05/opensearch-2-0-is-now-available/), which upgraded the project to Lucene 9.1, introduced document-level alerting and a new Notifications plugin, delivered significant enhancements to ML Commons, and more. Just last week, [OpenSearch 2.1](https://opensearch.org/blog/releases/2022/07/opensearch-2-1-is-available-now/) went live with new dedicated node types for ML workloads, automated Snapshot Management, and multi-terms aggregation functionality. We’ve also added a number of clients so that the project now supports Java, High Level Python, Rust, Node.js, Low Level Python, Ruby, Golang, and PHP. 

## What’s next for the OpenSearch Project?

What I find perhaps most exciting is how the pace of innovation behind the project continues to accelerate. Our [project roadmap](https://github.com/orgs/opensearch-project/projects/206) is public, so anyone can follow along, contribute or provide feedback, and you’re able to see the comprehensive slate of high-impact features and enhancements we plan to release throughout the year on the 2.x line and into 2023 with the release of OpenSearch 3.0. This includes significant new capabilities we’ll be rolling out next month with OpenSearch 2.2, like upgrades for security analytics, real-time observability tools, anomaly detection, memory management, and more. 

An open-source project’s roadmap reflects its priorities, and in the case of OpenSearch, those priorities reflect the feedback registered by our growing community of users, contributors, and partners. A thorough review of the roadmap and the [discussions across our forum](https://forum.opensearch.org/) reveals the biggest priorities for the project in 2022 and beyond:


* **Cost, performance, and reliability**: The project aims to deliver significant value to users; new functionalities that drive down costs and improve performance and reliability are always top of mind.
* **Ease of use**: The project team is prioritizing many ways to make the project easier to use For example, a simple drag-and-drop editor for creating visualizations is on the roadmap for the 2.2 release.
* **Log analytics**: As a key use case for OpenSearch, users can expect the project to add several features that make it easier to get more from your logs. An event explorer and PPL-based visualizations are just two examples of upcoming features.
* **Extensibility**: Making the code base more modular through extensions—and in so doing, making the project easier to maintain—is another top priority. This will simplify management of plugins as versions are decoupled and enable secure sandboxing, among many other benefits.
* **ML**: Users are doing more and more to incorporate ML into their workloads. This has been and continues to be a key priority, as shown with upcoming enhancements to anomaly detection, k-NN vectors, and more. 

## How can you get started with the OpenSearch project?

I hope you’ll join me in taking a moment to acknowledge the momentum the OpenSearch project has built over the course of its first year and to give thanks for the tireless work of the OpenSearch community has made it possible. And if you haven’t already done so, I invite you to join the effort to build the world-class, truly open-source search and analytics solution that users deserve, in whatever way interests you the most. 

We’d love to see you add your voice to the project’s [community meetings](https://www.meetup.com/OpenSearch/) and [forum discussions](https://forum.opensearch.org/) or find opportunities to add features, conduct tests, fix bugs, or improve documentation through our [GitHub repository](https://github.com/opensearch-project). You can also [register to attend OpenSearchCon](https://opensearchcon.splashthat.com/), our one-day conference for the people and organizations that are shaping the future of the OpenSearch project. We hope to see you at the conference or online contributing to the future of the open-source community!

