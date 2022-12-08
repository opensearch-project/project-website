---
layout: post
title:  "Partner Highlight: How to Offer OpenSearch as a Service using Virtuozzo DevOps PaaS"
authors: 
  - tetianaftv
date: 2022-01-24
categories: 
  - partners
twittercard:
  description: "OpenSearch is now available as a certified container with auto-clustering inside Virtuozzo DevOps PaaS. Start offering OpenSearch Cluster as a service"
redirect_from: "/blog/partners/2022/01/opensearch-as-a-service/"
---

## How to Offer OpenSearch as a Service using Virtuozzo DevOps PaaS  

One of the great things about Platform as a Service is the flexibility it brings to service providers and end users. Really it’s a way to provide anything as a service, any application, and we’re pleased to announce that [OpenSearch](https://opensearch.org/) is the latest certified container available in the [Virtuozzo DevOps PaaS](https://www.virtuozzo.com/devops-platform-as-a-service/) solution.  

OpenSearch is a community-driven, open-source search engine for website search, application monitoring, data aggregation and analysis.  

It provides a secure, high-quality search and analytics suite that can be easily modified and extended with additional functionality, and now it’s easy to deploy with automatic clustering using Virtuozzo DevOps PaaS.  

Virtuozzo DevOps PaaS is powered by Jelastic, a division of Virtuozzo. Read on to learn more about OpenSearch, how to deploy it with auto-clustering, and how to get started!

### OpenSearch Cluster Components  

Virtuozzo DevOps PaaS provides an OpenSearch Cluster using the following components united into a single auto-clustering solution:  

 * **[OpenSearch](https://docs.jelastic.com/opensearch-cluster/#opensearch)** - an open-source search engine that provides a distributed, multitenant-capable full-text search  
 * **[OpenSearch Dashboards](https://docs.jelastic.com/opensearch-cluster/#opensearch-dashboards)** (optional) - visualization for data stored inside the OpenSearch nodes (derived from Kibana 7.10.2)  
 * **[Logstash](https://docs.jelastic.com/opensearch-cluster/#logstash)** (optional) - data processing  
 * **[Beats](https://docs.jelastic.com/opensearch-cluster/#beats-add-on)** (optional) - can be installed as add-on for single-purpose data shippers that send data from the client nodes to Logstash or OpenSearch  

In such a solution, data is gathered on client nodes by **Beats** Data Shippers, sent to **Logstash** for the required transformation, and stored in **OpenSearch**. **OpenSearch Dashboard** is the supplementary visualization tool.  

![OpenSearch Cluster Data Acquisition](/assets/media/blog-images/2022-01-20-opensearch-as-a-service/data-flow.png){: .img-fluid}

### OpenSearch Cluster Installation

The OpenSearch Cluster creation within Virtuozzo DevOps PaaS is a straightforward and fully automated process that can be performed directly from the [topology wizard](https://docs.jelastic.com/setting-up-environment/).  

Select the **OpenSearch** stack at the **NoSQL database** section. [Auto-clustering](https://docs.jelastic.com/auto-clustering/) will be enabled by default and provide the required configurations.

![Virtuozzo-OpenSearch Cluster Dashboard](/assets/media/blog-images/2022-01-20-opensearch-as-a-service/dashboard.png){: .img-fluid}

You can also add the **OpenSearch Dashboards** and **Logstash** components by activating the respective options.  

More detail on the OpenSearch components available in DevOps PaaS can be found in our [OpenSearch Cluster documentation](https://docs.jelastic.com/opensearch-cluster/).

### Ready to Get Started?  

If you need a high-performance and easy-to-manage OpenSearch Cluster, give it a try at one of the Virtuozzo DevOps PaaS service providers [Virtuozzo DevOps PaaS service providers](https://jelastic.cloud/). 


If you are interested in offering OpenSearch Cluster as a service to your customers – or any other flavor of PaaS – we’d love to help. [Get in touch to learn more](https://www.virtuozzo.com/company/contact/)!

