---
layout: post
title:  OpenSearch Benchmark - An Update
authors:
- govkamat
date: 2025-04-21 12:30:00 -0600
categories:
  - community
excerpt: OpenSearch Benchmark is the de-facto performance benchmarking tool for OpenSearch.
meta_keywords: OpenSearch Benchmark, OSB, workloads, KNN, big5
meta_description: OpenSearch Benchmark has come a long way and there is so much more ahead.
---


## Synopsis

If you are an [OpenSearch](https://opensearch.org/) user, or associated with OpenSearch in some way, you probably have some idea about [OpenSearch Benchmark](https://opensearch.org/docs/latest/benchmark/), the de-facto performance benchmarking tool for OpenSearch. OpenSearch Benchmark, often referred to as OSB, is widely used by developers, users and organizations to measure, track and improve OpenSearch performance in a variety of contexts. This blog post is an update on the current state of the project and provides a glimpse into what's coming down the pike.


## The OSB Project

At the same time that OpenSearch was forked off from Elasticsearch, OSB was published as a fork of Rally. The project was quiescent for a short while, but starting a couple of years ago, it took off with a large number of improvements being added and bugs getting fixed, and a regular release cadence. The tool has since become significantly more robust, reliable and easy to use. New workloads have been added such as [`big5`](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/big5) for comparing search performance, and others in domains such as [vector search](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/vectorsearch), [neural search](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/neural_search) and hybrid search, which are relevant for generative AI and machine learning applications.

The OSB team is also responsible for publishing [authoritative benchmark results](https://benchmarks.opensearch.org) that are relied upon by the community to track OpenSearch performance.


### Why Use OSB?

Because it the best option to performance-test OpenSearch, developed by the same people who work on OpenSearch.  If you are operating an OpenSearch deployment for instance, the easiest and quickest way to carry out an end-to-end system test would be to run an OSB workload.

You can use OSB in basic testing, all the way through proof-of-concepts, and to production. OSB is great if you want to test search, logs, or vector workloads. You can test OpenSearch performance on queries like aggregations, date histograms, AI-powered search with the Neural plugin, and k-Nearest-Neighbor algorithms. In some ways, OSB is an application that evokes the functionality of the Swiss army knife. It can be used to size clusters, tune for the appropriate shard count, gain assurance that upgrading to a new version will not degrade performance and even encapsulate production workloads.

Independent third parties such as [_Trail of Bits_](https://www.trailofbits.com/) have used OSB as their preferred benchmarking tool to carry out [comparative performance tests of OpenSearch against Elasticsearch](https://blog.trailofbits.com/2025/03/06/benchmarking-opensearch-and-elasticsearch/).


### How Does One Use OSB?

The easiest way to get started with OSB is to begin with the [Quick Start](https://docs.opensearch.org/docs/latest/benchmark/quickstart/) guide. Although the reference sections are currently yet being enhanced, the [User's Guide](https://docs.opensearch.org/docs/latest/benchmark/user-guide/index/) is currently under development, but still a useful reference to get started.


### The Road Ahead

As noted above, a number of enhancements and several new features are in the pipeline. A sampling of these include:

  * New workloads in the area of generative AI
  * The ability to encapsulate production workloads into representative custom OSB workloads
  * Support for large data corpora with data streaming
  * The ability to generate synthetic data for testing specific business use-cases
  * Features to ease load testing of OpenSearch at scale, including red-line testing with graduated ramp-up
  * Longevity and chaos testing

The best way to be informed of new developments is to track the [RFCs and GitHub issues](https://github.com/opensearch-project/opensearch-benchmark/issues) associated with the project and take a look periodically at the [OSB roadmap](https://github.com/orgs/opensearch-project/projects/219).


### Interested in Helping?

The OSB project has covered a tremendous amount of ground in the last two years. However, there is so much more ahead of us that anyone interested in benchmarking technology can help by participating in the project. Developers, users, reviewers and maintainers can all contribute to making OSB the pre-eminent benchmarking application for OpenSearch and beyond.


### Summary

If you are an OpenSearch user, you will find it useful, essential even, to get more familiar with OSB. Whether your needs involve sizing cluster, benchmarking performance or load testing, OSB will help you so much more productive with OpenSearch.
