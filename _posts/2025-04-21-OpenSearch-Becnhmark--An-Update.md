---
layout: post
title: OpenSearch Benchmark: An update
authors:
- govkamat
date: 2025-04-21 12:30:00 -0600
categories:
  - community
excerpt: OpenSearch Benchmark is the performance benchmarking tool for OpenSearch.
meta_keywords: OpenSearch Benchmark, workloads, k-NN, big5
meta_description: OpenSearch Benchmark has come a long way, and there is so much more ahead.
---


## Synopsis

If you are an [OpenSearch](https://opensearch.org/) user or contributor, you may be familiar with [OpenSearch Benchmark](https://opensearch.org/docs/latest/benchmark/), the performance benchmarking tool for OpenSearch. OpenSearch Benchmark is widely used by developers and organizations to measure, track, and improve OpenSearch performance in a variety of contexts. This blog post provides an update on the current state of the project and a look at upcoming enhancements and features.


## The OpenSearch Benchmark project

At the same time that OpenSearch was forked from Elasticsearch, OpenSearch Benchmark was published as a fork of Rally. Starting a couple of years ago, a large number of improvements were added, bugs were fixed, and a regular release cadence was established. The tool has since become significantly more robust, reliable, and easy to use. New workloads have also been added, such as [`big5`](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/big5) for comparing search performance and others in domains such as [vector search](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/vectorsearch) and [neural search](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/neural_search), which are relevant for generative AI and machine learning applications.

The OpenSearch Benchmark team is also responsible for publishing [authoritative benchmark results](https://benchmarks.opensearch.org) that the community relies on to track OpenSearch performance.


### Why use OpenSearch Benchmark?

OpenSearch Benchmark is the best option for performance testing OpenSearch because it was developed by the same people who work on the software. If you are operating an OpenSearch deployment, the easiest and quickest way to perform an end-to-end system test is to run an OpenSearch Benchmark workload.

You can use OpenSearch Benchmark for basic testing, proofs of concept, or even in production. It is ideal for testing search, log, or vector workloads. You can test OpenSearch performance on queries like aggregations, date histograms, AI-powered search with the Neural plugin, and k-NN algorithms. In some ways, OpenSearch Benchmark is an application that evokes the functionality of the Swiss Army Knife. It can be used to size clusters, tune for the appropriate shard count, gain assurance that upgrading to a new version will not degrade performance, and even encapsulate production workloads.

Independent third parties, such as [Trail of Bits](https://www.trailofbits.com/), have used OpenSearch Benchmark as their preferred benchmarking tool to run [comparative performance tests of OpenSearch against Elasticsearch](https://blog.trailofbits.com/2025/03/06/benchmarking-opensearch-and-elasticsearch/).


### How to use OpenSearch Benchmark

The easiest way to get started with OpenSearch Benchmark is to follow the [quickstart](https://docs.opensearch.org/docs/latest/benchmark/quickstart/) guide. If you want to dive deeper, see the OpenSearch Benchmark [user guide](https://docs.opensearch.org/docs/latest/benchmark/user-guide/index/) and [reference](https://docs.opensearch.org/docs/latest/benchmark/reference/index/) sections.

If you would like to suggest feedback and enhancements to the OpenSearch Benchmark documentation, [create an issue](https://github.com/opensearch-project/documentation-website/).

### Upcoming enhancements and features

A number of new enhancements and features are on the project roadmap. These include:

* New generative AI workloads.
* The ability to encapsulate production workloads into representative custom OpenSearch Benchmark workloads.
* Support for large data corpora with data streaming.
* The ability to generate synthetic data for testing specific business use cases.
* Features that ease load testing of OpenSearch at scale, including red-line testing with graduated ramp-up.
* Longevity and chaos testing.

The best way to stay informed of new developments is to track the [RFCs and GitHub issues](https://github.com/opensearch-project/opensearch-benchmark/issues) associated with the project and to periodically review the [OpenSearch Benchmark Roadmap](https://github.com/orgs/opensearch-project/projects/219).


### Interested in contributing?

The OpenSearch Benchmark project has covered a tremendous amount of ground in the last two years, but we could use your help! Developers, users, reviewers, and maintainers can all contribute to making OpenSearch Benchmark the preeminent benchmarking application for OpenSearch. If you would like to contribute, see the OpenSearch Benchmark [contribution guide](https://github.com/opensearch-project/opensearch-benchmark/blob/main/CONTRIBUTING.md) or attend the [OpenSearch Benchmark community meetup](https://www.meetup.com/opensearch/events/307446531/?eventOrigin=group_upcoming_events).
