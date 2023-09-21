---
layout: post
title:  "Introducing LiveTrafficBridge: A traffic capture and replay solution for OpenSearch Migrations and Upgrades"
authors: 
  - setiah
  - mikaylathompson
date: 2023-09-21 00:00:01 -0700
categories: 
    - technical-post
twittercard:
  description: "Explore the benefits of utilizing this tool for conducting tests on migrations and upgrades under actual workload conditions."
meta_keywords: migrations, upgrades, change data capture, traffic replay
meta_description: "Explore the benefits of utilizing this tool for conducting tests on migrations and upgrades under actual workload conditions."

---

[Introduction]
We are thrilled to introduce the beta release of LiveTrafficBridge, a solution to assist users with data migration to OpenSearch and comparative A/B analysis between source and target clusters. This tool equips users to effortlessly capture live traffic on their source cluster and replay it simultaneously or offline to a designated shadow cluster for testing and analysis. It provides performance and behavioral insights by comparing source and target clusters under real workload conditions, thereby enabling the early identification of potential migration or version upgrade issues. The tool offers out-of-the-box key performance indicators (KPIs) for a straightforward comparative analysis between clusters, while also providing users with the flexibility to customize and compare metrics according to their specific needs. It aims to serve a multitude of purposes. Users can leverage it to execute live migrations to a target OpenSearch cluster, record and replay traffic offline to conduct comprehensive hardware assessments to identify optimal hardware configurations, and perform comparative analyses across different Elasticsearch and OpenSearch versions, all driven by their real workload data. This tool is invaluable for navigating the intricacies of cluster migration and version upgrades, offering insightful assistance every step of the way.

[todo: Getting Started/How to use - Mikayla ]
To get started, ___ you can choose a self-deployable docker based solution or an automated AWS based solution. You also need to install a proxy in your source to capture the traffic. With a few simple commands, you can setup the tool on a machine and configure it to connect with your source and target environments....

After setting up, ____ users can configure their source and target clusters.

[Support matrix]
The tool currently offers support for versions within the Elasticsearch 7.x range, up to and including 7.10, and OpenSearch 1.x, 2.x, and OpenSearch Serverless. It is Apache 2.0 licensed, fully open-source and free to use. At its current stage, the tool is well-suited for small to medium-scale workloads. We're dedicated to enhancing the tool's capabilities, with ongoing efforts to expand version support and optimize scalability, ensuring it performs well even in large workload scenarios.

[CTA]
We've recently released a beta version of this tool for testing purposes, and are eager to hear your valuable feedback here. Please do not hesitate to file a github issue if you encounter any problems. 
