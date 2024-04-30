---
layout: post
title:  "A comprehensive guide to setup and connect self-managed dashboards with Amazon OpenSearch domain"
authors:
 - mkbn
date: 2024-04-30
categories:
 - technical-post
meta_keywords: OpenSearch dashboards, Amazon OpenSearch service, self-managed, downtime issues, Mitigation
meta_description: In OpenSearch Managed service, Blue-Green deployment often results in downtime for managed service dashboards, impacting availability. Given the critical reliance of our customers on these dashboards for log analytics and other use cases, I've devised a workaround. By setting up self-managed dashboards and connecting them with the managed service domain, downtime issues during Blue-Green deployment are effectively mitigated. This guide walks through the setup process for self-managed dashboards, covering options such as no authentication, basic authentication, and SAML authentication. Customer to follow along with this blog to implement the solution at their end and ensure uninterrupted access to dashboards.
has_math: true
has_science_table: true
---

[OpenSearch](https://opensearch.org/) is a scalable, flexible, and extensible open-source software suite for search, analytics, security monitoring, and observability applications, licensed under Apache 2.0. [OpenSearch Dashboards](https://opensearch.org/docs/latest/dashboards/) is a powerful and flexible data visualization and exploration platform that enables users to analyze and visualize large volumes of data. It is an open-source project that provides a user-friendly interface for creating interactive dashboards, charts, and graphs, allowing users to gain valuable insights from their data.

In managed service, a blue/green deployment establishes a standby environment for domain updates by replicating the production environment. After completing the updates, users are directed to the new environment. The blue environment represents the current production setup, while the green environment serves as the standby. OpenSearch Service then switches the environments, promoting the green environment to become the new production environment without any data loss. However, due to the current code configuration, access to OpenSearch dashboards is interrupted during the "Creating a new environment" phase of blue/green deployment. This results in a significant downtime for the dashboards, which presents substantial challenges to customers as it restricts their ability to visualize and explore data during this period.



