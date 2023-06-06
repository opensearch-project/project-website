---
layout: post
title: "Announcing the general availability of the OpenSearch Hadoop client"
authors:
  - hvamsi
  - nknize
date: 2023-05-06 12:15:00 -0700
categories:
  - releases
meta_keywords: opensearch hadoop, apache spark, apache hive, apache hadoop, openseearch, mapreduce, hdfs
meta_description: OpenSearch Hadoop is now generally available with support for multiple versions of OpenSearch to run on Spark and Hive.
twittercard:
  description: OpenSearch-Hadoop is now generally available with support for multiple versions of OpenSearch to run on Spark and Hive.
excerpt: We are excited to announce the release of the new OpenSearch-Hadoop connector. This tool enables efficient interaction between your Hadoop-based Big Data operations and OpenSearch clusters, supporting all versions of OpenSearch.
---

We are excited to announce the release of the new OpenSearch-Hadoop connector. This tool enables efficient interaction between your Hadoop-based Big Data operations and OpenSearch clusters, supporting all versions of OpenSearch.

## OpenSearch-Hadoop connector features

- **Versatility**: Compatible with Scala up to version 2.13.x and Spark up to version 3.2.x, the connector facilitates data processing and analysis operations across different environments.
- **Memory and Input/Output (I/O) Efficient**: The connector is designed with a focus on performance. It uses pull-based parsing and supports bulk updates to and direct conversion of native types, resulting in efficient memory and network I/O usage.
- **Adaptive I/O**: The connector can detect transport errors and retry automatically. In case of node failures, it can reroute requests to available nodes. If OpenSearch is overloaded, the connector can detect data rejection and resend it.
- **Data Co-location Integration**: The connector integrates with Hadoop to expose network access information, enabling co-located OpenSearch and Hadoop clusters to be aware of each other, thus reducing network I/O.
- **Secure Access**: Supports identity and access management (IAM) for AWS-managed OpenSearch, ensuring secure access to your AWS resources.

## Compatibility with OpenSearch

The following matrix shows the compatibility of [`opensearch-hadoop`](https://central.sonatype.com/artifact/org.opensearch.client/opensearch-hadoop) with versions of [`OpenSearch`](https://opensearch.org/downloads.html#opensearch).

| Client version | OpenSearch version | Elasticsearch version |
| -------------- | ------------------ | --------------------- |
| 1.0.1          | 1.0.0-2.8.0        | 7.10                  |

## Compatibility with Spark and Scala

| Client version | Spark version | Scala version(s) |
| -------------- | ------------- | ---------------- |
| 1.0.1          | 2.2.3         | 2.10             |
| 1.0.1          | 2.4.4         | 2.11/2.12        |
| 1.0.1          | 3.2.4         | 2.12/2.13        |

## Compatibility with AWS Glue

| Client version | Spark version | Glue version(s) |
| -------------- | ------------- | --------------- |
| 1.0.1          | 2.4.4         | 2               |
| 1.0.1          | 3.2.4         | 3/4             |

## Get started today!

The OpenSearch-Hadoop connector is a must-have tool for anyone looking to leverage the full power of OpenSearch alongside their Hadoop ecosystem. Download and get started today, available on the OpenSearch Downloads page.
