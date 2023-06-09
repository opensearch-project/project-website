---
layout: post
title:  "OpenSearch Project 2022 recap and what's next"
authors:
  - dtaivpp
  - elifish
date:   2023-01-25 00:00:00 -0700
categories:
  - technical-post
meta_keywords: "OpenSearch roadmap, OpenSearch dashboards, open-source solution for search and analytics, OpenSearch migrations"
meta_description: "OpenSearch's community has grown significantly during 2022. Take a look at what we are doing in 2023 to make building with OpenSearch better!"
---

What an amazing year for the OpenSearch community! As we head into 2023, we wanted to take a look back at what we were able to accomplish in 2022 as well as a look forward at what the next year will bring. 

While the numbers aren’t everything, they are a big part of our story. There were over 100 million downloads of OpenSearch, OpenSearch Dashboards, and our client libraries, and there were 8,760 pull requests created by 496 contributors. This community has really come together to make some amazing things happen. 

![OpenSearch Stats, 9357 Stars, 8760 Pull Requests, 496 Contributors, 100M+ Downloads]({{ site.baseurl }}/assets/media/blog-images/2023-01-19-opensearch-project-2022-recap-and-whats-next/OpenSearch_Stats.png){: .img-fluid}

Here’s what several of our partners have to say about OpenSearch:


>“In 2022 we saw OpenSearch establish itself as a viable, [Apache 2.0–licensed] open-source solution for search and analytics. After proof of concepts and careful monitoring of the progress of OpenSearch, we think customers will be ready to migrate to OpenSearch for production applications in 2023 and beyond.” —Phil Lewis, CTO, [PureInsights](https://pureinsights.com/)


>“OpenSearch's value propositions are a win/win combination of open-source license, many new features that were previously hidden by paid subscription, and an amazing community supporting it. As experts in open-source software, Aiven is able to take the cognitive load off of our users and customers so they can focus on growing their businesses.” —Hannu Valtonen, Chief Product Officer and Co-founder, [Aiven](https://aiven.io/)


>“Our adoption and implementation of OpenSearch was smooth and straightforward. We quickly took advantage of new capabilities to enhance our Graylog platform.” —Robert Rhea, CTO, [Graylog](https://www.graylog.org/)

## What’s next?

In support of our mission to be the search and analytics suite for builders, we have a lot of great things planned for 2023!  

### Decoupling

Since we started the OpenSearch Project, we have been working to decouple many of its components. The first step was to split the original repository, consisting of plugins, documentation, and build pipelines, into distinct repos. This physical separation of code moves us closer to logically separating the components.

The [extensibility project](https://github.com/opensearch-project/OpenSearch/issues/2447) will help to decouple plugins in three ways. First, we will provide a standard API for the new extensions that will enable them to be released independently of OpenSearch and OpenSearch Dashboards (for example, extension version 2.3.1 could work with OpenSearch 2.4.2). Second, we will have extensions load in a sandboxed environment. This will allow them to be loaded without needing to restart the OpenSearch server. Additionally, it will add a layer of security to plugins, as they will no longer share the same runtime environment as OpenSearch. Third, we will create a catalog so that plugins can be easily found and installed.

We are also working on [decoupling OpenSearch Dashboards from OpenSearch](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3095). One part of this work will allow users to connect to multiple OpenSearch clusters even if they are running different versions of OpenSearch. The second part will allow for OpenSearch Dashboards to connect to data stores other than OpenSearch. In the 2.4 release, we enabled users to connect to Prometheus so that they can visualize metrics on their dashboards.

### Performance and cost savings

One area we are focusing on in order to enable increased performance is replication. The segment replication feature will allow users to perform replication on a per-segment rather than a per-document basis. This will reduce the amount of processing needed on the replicas, as shards are just copied after processing is complete. Smaller node sizes can be used with this replication strategy. The tradeoff is that this strategy requires more network bandwidth and adds a slight delay to replication latency.

Our second area of focus is [remote data stores](https://github.com/opensearch-project/OpenSearch/issues/1968). We will be working to support remote data stores along with local data. In this setup, a remote store will be used for storing translogs and segments for the replica nodes. Overall, this will help to reduce storage costs, scale compute/storage separately, and increase durability by supporting restore points and continuous backup. The end goal is to allow users to spin up a cluster with just remote storage. 

### Integrations

In the world of search, it is common to use a secondary re-ranker to improve the relevance of a set of results. Because of this, we are working on a re-ranking plugin that will allow users to integrate natively with external re-rankers. An example of an external ranker is [Metarank](https://github.com/metarank/metarank) for personalization ranking. If you have a ranking service you would like to see integrated, suggest it on [GitHub](https://github.com/opensearch-project/search-processor/issues/36).

Additionally, we are working on client libraries to help with integration into many common data lakes. Apache released its [Flink connector for OpenSearch](https://github.com/apache/flink-connector-opensearch) with help from [Andriy Redko](https://github.com/reta), OpenSearch maintainer. We are also working on a [connector for Hadoop](https://github.com/opensearch-project/opensearch-hadoop) for fans of MapReduce. Both of these were frequently requested by the community. If you have something you would like to see integrated into OpenSearch, [propose it here](https://github.com/opensearch-project/opensearch-clients/issues/new?assignees=&labels=proposal&template=PROPOSAL_TEMPLATE.md&title=%5BPROPOSAL%5D).

### More tooling

To make cluster management simpler, there are several tools planned for 2023. To kick things off, we are implementing several index management UI enhancements in OpenSearch Dashboards. We are providing an interface for some common cluster management operations (force merge, shard reroute, snapshot, and more), and the UI will also provide intelligent recommendations regarding sizing, security, and more. This interface can then be extended to include components like Data Prepper, providing a central location for full stack administration.

We are also working to simplify upgrades and migrations. This work is still in the early stages, so if you have ideas or challenges you would like to share, feel free to provide some feedback on an issue in the [OpenSearch-Migrations repo](https://github.com/opensearch-project/opensearch-migrations/issues).

For search, we have recently added a search comparison tool. This tool allows users to apply two different search strategies on the same query and see the results side by side. It’s currently a simple tool, but it has a lot of potential for search relevance use cases. Check it out [here](https://opensearch.org/docs/latest/search-plugins/search-relevance/index/) and let us know what additional functionality you would find useful!

### Wrapping it up

We plan to spend 2023 making your experience with OpenSearch an even better one. Whether you are building an observability platform, search backend, or security analytics suite, we want OpenSearch to work for you. Decoupling components will help us to release features faster and allow Dashboards to visualize data from several data stores. With segment replication and remote data stores, you’ll be able to reduce the cost of your clusters and increase your overall performance, and new integrations will allow you to build with the tools you already have deployed. If there is anything else that would improve your OpenSearch experience, let us know about it by opening a [thread on our forum](https://forum.opensearch.org/c/feedback/6). We look forward to discussing your ideas and collaborating with you to make 2023 another great year for the OpenSearch community! 
