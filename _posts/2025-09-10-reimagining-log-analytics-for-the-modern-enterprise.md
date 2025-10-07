---
layout: post
title:  "Reimagining log analytics for the modern enterprise"
authors:
 - jdbright
date: 2025-09-10
categories:
 - technical-post
meta_keywords: observability, log analytics, splunk
meta_description: A comprehensive exploration of OpenSearch's evolution in log analytics, highlighting its approach to addressing enterprise observability challenges through open-source innovation, cost-effectiveness, and advanced processing capabilities.
excerpt:
has_math: false
has_science_table: false
---

In an era of explosive data growth, organizations are facing a critical challenge: how to manage, analyze, and derive value from their logs without breaking the bank. Traditional proprietary solutions like Splunk have become increasingly expensive, leaving teams searching for a more sustainable approach to observability.


## The rising cost of log management

As data volumes surge, so do the licensing fees for legacy log analytics platforms. Organizations are caught in a painful cycle of escalating costs that threaten to consume IT budgets without delivering proportional value. Enter OpenSearch---an open-source alternative that's changing the game.


## Piped Processing Language: The heart of modern log analysis

For site reliability engineers (SREs) and DevOps teams, log analysis is about more than just searching and filtering. It's also about uncovering deep insights, detecting anomalies, and maintaining system reliability. [OpenSearch's Piped Processing Language (PPL)](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/index.rst) is designed to meet these sophisticated needs.


### Beyond basic search

Dashboards Query Language (DQL) in OpenSearch can be restrictive. PPL expands on its capabilities by offering the following features:

* Sequential filtering
* Advanced analytics capabilities
* More powerful data exploration with [joins, lookups, and subsearch](https://opensearch.org/blog/enhanced-log-analysis-with-opensearch-ppl-introducing-lookup-join-and-subsearch/)



## A commitment to seamless migration

We understand that switching log analytics platforms is a challenging task. That's why OpenSearch is making significant investments to:

* Make PPL syntax more familiar.
* Add missing commands and functions.
* Simplify the migration process.



### Enterprise-grade performance with Apache Calcite

Launched in OpenSearch 3.0, [Apache Calcite](https://calcite.apache.org/) represents a breakthrough in log analytics scalability. The platform can now handle enterprise-level data volumes of up to 150 TB per day, ensuring performance doesn't compromise insight.


## Unifying the observability experience

If you are an SRE or part of a DevOps team, you know how fragmented the log analytics experience can be. You query your data using **Discover** in OpenSearch Dashboards and then use **Visualize** in order to build a visualization for your dashboard or **Alerting** in order to create an alert. Different languages are used in each case, resulting in a disjointed experience. Now, with the new observability experience for logs, you can query, build visualizations, and create alerts ([RFC](https://github.com/opensearch-project/alerting/issues/1880)) without leaving your core PPL query experience in **Discover**. No more learning multiple languages depending on where you are in OpenSearch---now there is one language across the log analytics experience.


## Getting started

Implementing the new observability experience is straightforward. Simply update your configuration file with these key attributes in OpenSearch 3.x:


```yaml
data_source.enabled: true
workspace.enabled: true
explore.enabled: true
uiSettings:
  overrides:
    "theme:version": v9
    "home:useNewHomePage": true
    "enhancements:enabled": true
opensearch.ignoreVersionMismatch: true
data.savedQueriesNewUI.enabled: true
```








## The future of log analytics

OpenSearch is more than a tool---it's a vision for how organizations can transform their observability strategy. By prioritizing user needs, performance, and accessibility, we're creating a platform that grows with your challenges.

*Are you ready to reimagine log analytics?* Explore OpenSearch, check out our [roadmap](https://github.com/orgs/opensearch-project/projects/206), and join the community discussion on the [OpenSearch forum](https://forum.opensearch.org/).
