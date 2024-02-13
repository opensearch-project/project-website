---
layout: post
title:  "OpenSearch Project's 2023 wrapped: a year in review"
authors:
  - dtaivpp
date: 2024-02-14
categories:
  - community
meta_keywords: OpenSearch 2023, year in review, new in opensearch, observability features, 2023 recap, 2024 plan
meta_description: OpenSearch had a great year in 2023! Lets take a look over what released last year. Afterwards we will take a look over what is currently planned for OpenSearch in 2024.
excerpt: You did it! You have all helped the OpenSearch Project to have a phenomenal year. Let’s take a look at what we accomplished together in 2023, because it was truly something special.
opensearchAssistant: VTiJtGI2Sr4
---

<img src="/assets/media/blog-images/2024-02-15-OpenSearchs-2023-Wrapped/OS_Wrapped_Hero.png" alt="OpenSearch's 2023 Wrapped: a year in review" class="img_bound"/>

You did it! You have all helped the OpenSearch Project to have a phenomenal year. Let’s take a look at what we accomplished together in 2023, because it was truly something special. If you are interested in detailed information about the machine learning (ML) features we released in 2023, check out [this blog post](https://opensearch.org/blog/opensearch-ai-retrospective/).


There were seven major versions of OpenSearch released last year. They covered a number of areas, from search and analytics to observability. We’ve also taken significant strides regarding [performance](https://opensearch.org/blog/opensearch-performance-improvements/). Check out how we’ve progressed below!

<img src="/assets/media/blog-images/2024-01-03-opensearch-performance-improvements/opensearch-performance.png" alt="OpenSearch performance improvements since launch" class="img_bound" id="infographic"/>{:style="width: 100%; max-width: 750px; height: auto;"}

## Unsung Heroes

Before we look at the features released in 2023, we'd first like to take a moment to appreciate some of the unsung heroes of OpenSearch. These are people who work tirelessly behind the scenes and don’t always get the credit they deserve.

We are going to start of with the people working on OpenSearch’s user experience (UX). Over the past year there has been a great deal of work on OpenSearch’s UI framework called [OUI](https://oui.opensearch.org/). This framework allows our users to have a native way to customize and extend the UX in OpenSearch. This work enabled dark mode and custom theming in OpenSearch. You can also contribute directly to OUI on GitHub: https://github.com/opensearch-project/oui. Along with OUI the UX group is working to improve the discover experience, build drag and drop visualizations, and many other things. One place we could use help is with the autocomplete experience. Check out [this issue](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1176) if you’d be interested in contributing!


> “We need to focus on making straightforward workflows that turn our new users into experts” - Kevin Garcia OpenSearch UX Manager


Documentation has been one of the things that is commented on a lot and has been changing rapidly. In the last year alone there have been 446,682 lines added to our documentation website. This means in the last year alone our documentation website has nearly doubled in size! This work has been primarily to help us document the newest work going into OpenSearch. There have been truckloads of new features rolling out from ML to search utilities. These features are unique to OpenSearch which is why we’ve taken care to ensure they are thoroughly documented. The work never ends though. If you come across any documentation that you feel is missing or incorrect please either open an issue or contribute a fix on the [documentation-website](https://github.com/opensearch-project/documentation-website).

One often overlooked part of open source projects is their build systems. There have been a great deal of changes to how OpenSearch has been built and released over the course of the last year. At the beginning of the year the release process took nearly 3 hours to complete and was a very manual process. Now that work has been automated and release artifacts can be generated in under 30 minutes. As if this wasn’t enough the team that releases OpenSearch has documented the entire process in intricate detail [here](https://github.com/opensearch-project/opensearch-build/blob/main/RELEASE_PROCESS_OPENSEARCH.md) which has allowed us to move our release meetings into the public. Additionally, we now have [nightly benchmarks](https://opensearch.org/benchmarks) that track the performance of OpenSearch to make sure regressions are not accidentally introduced. Because these benchmarks are being run nightly on an in-development project the build team [created a process](https://github.com/opensearch-project/opensearch-devops/issues/114) to identify plugins that were breaking the build and excludes them. This workflow also notifies the plugin that their build is broken by creating an issue on their repo.

## Running OpenSearch

At the beginning of this year we started work on a project to make configuring OpenSearch possible through OpenSearch Dashboards. We started small by allowing users to create index templates and perform a few common admin operations such as open, close, shrink, re-index, and splitting indexes. The work didn’t stop there however, it’s gone on to assist with so many more operations such as snapshotting, stream management, transformations, and the list goes on.

In [2.7](https://opensearch.org/blog/get-started-opensearch-2-7-0/) this year we released [segment replication](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/segment-replication/index/). This new replication strategy allows you to replicate by copying Lucene segments instead of individual documents. This has significantly reduced the CPU utilization for our users that ingest large volumes of data and don’t need documents updated in near real time.

Along with updating the way that OpenSearch replicates there have been a number of significant changes to OpenSearch’s storage layer. Searchable snapshots, released in OpenSearch [2.7](https://opensearch.org/blog/get-started-opensearch-2-7-0/). With these you are now able to search indexes that have been snapshotted and are only available in remote data stores without needing to define a manual process to re-load them into indexes just. to query. With Zstandard compression, released in 2.9, compression is now tunable. This means that admins can determine to a very fine level whether they need data that is more compressed or compressed faster. Along with this, Zstandard is a much more stable compression algorithm than the previous. Finally, we’ve published our storage roadmap for OpenSearch. Here you will be able to find what work is being planned and released related to how it stores data.

## Search

Over the course of 2023 we have dramatically improved the experience for people using OpenSearch as a search database. We started with adding search pipelines in 2.8 as experimental and upgraded the feature to generally available (GA) in our 2.9 release. These pipelines allow search relevance engineers to encapsulate their search processing steps in OpenSearch. This way developers can interact with OpenSearch without needing to worry about the implementation details to build a relevant search experience.

There are several new features that compliment the release of search pipelines. With hybrid search and our normalization processor you can add a pipeline step to combine two result sets that were retrieved with different methods. With the experimental conversational memory and retrieval augmented generation (RAG) processors you can build an entire chat experience around your data.

OpenSearch also has had significant updates in the areas of vector search over the last year. Starting with our ML framework which was made GA in 2.9 which allows users to deploy their own Pytorch and ONNX based text embedding models. Alongside ML framework we introduced our ML extensibility framework which creates connections between OpenSearch and other common embedding platforms such as Sagemaker, Bedrock, OpenAI, and Cohere. This will let you move the work of embedding text into OpenSearch further simplifying the vector search experience. Finally, added several new vector search functionalities such as sparse search and multi-modal search! To see a more in-depth view of the features added in the area of ML check out our [recap blog](https://opensearch.org/blog/opensearch-ai-retrospective/).

## Observability

One of the things we have been working at hard this last year has literally transformed the way that people interact with their data. The new OpenSearch assistant takes questions about your data and is able to transform them into queries and visualizations. Launched in 2.11 this assistant is the first step on our roadmap to re-imagine how we can interact with our data. Check it out below and check out [this blog](https://opensearch.org/blog/get-started-opensearch-2-11/) to learn how to get started!

{% include youtube-player.html id=page.opensearchAssistant %}

Additionally, to make it more straightforward to ingest your observability data, we released Simple Schema for Observability in OpenSearch 2.6. With this schema, users can import their normalized log data from known sources, such as NGINX, and get out-of-the box dashboards, saved queries, and index templates. Over the course of 2023, we added several other integrations, leading to the development of our [integrations dashboard](https://opensearch.org/docs/latest/integrations/).

## Security Analytics

OpenSearch Security Analytics, released as generally available in OpenSearch 2.6, now features significant advancements in security monitoring and threat detection. It now includes over 2,000 prepackaged Sigma security rules and supports a wide array of log sources, such as Windows, Netflow, DNS, and AWS CloudTrail. This comprehensive tool set is essential for efficiently detecting and monitoring security threats and ensuring operational stability across various environments.

We also introduced a new log data ingestion schema that is compliant with the Open Cybersecurity Schema Framework (OCSF), enabling integration with logs from Amazon Route 53, AWS CloudTrail, and Amazon Virtual Private Cloud (Amazon VPC). A major highlight is the general availability of the correlation engine in Security Analytics. With this engine, you can create custom correlation rules and generate a visual knowledge graph from diverse log sources. This facilitates rapid identification of and response to security threats, underlining our commitment to enhancing Security Analytics and addressing community feedback, including feedback requesting support for custom log types.


## Looking ahead to 2024

Given a remarkable 2023, it's clear that the journey ahead in 2024 is full of exciting opportunities. With seven major versions released last year, covering areas from search and analytics to observability, the OpenSearch Project has shown tremendous growth. It's clear we couldn't have gotten here without our amazing community. Whether it's enhancing the UX, contributing to the ever-expanding documentation, or engaging with the latest features, we need your help to make 2024 as successful as last year. Let's continue to collaborate, innovate, and drive the OpenSearch Project forward together!
