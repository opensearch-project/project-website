---
layout: post
title:  "Introducing a traffic capture and replay solution for OpenSearch migrations and upgrades"
authors: 
  - setiah
  - mikaylathompson
date: 2023-10-26
categories: 
    - technical-post
twittercard:
  description: "Discover the advantages of live traffic capture and replay solution to streamline your migration and upgrade process to OpenSearch."
meta_keywords: live traffic capture, OpenSearch migration, OpenSearch version upgrade, traffic replay in OpenSearch
meta_description: "Streamline your transition to OpenSearch with the live traffic capture and replay solution."

---

We are thrilled to introduce the beta release of a live traffic capture and replay solution designed to assist users in migrating to OpenSearch. This tool equips users to capture live traffic from their source cluster and replay it, either simultaneously or offline, on a specified shadow cluster for rigorous testing and analysis. By comparing the performance and behavior of the source and target clusters under real workload conditions, users can gain valuable insights. This enables the early detection of potential migration or version upgrade issues, facilitating a seamless transition to OpenSearch.

The tool aims to serve a multitude of purposes. Users can leverage it to execute live migrations to a target OpenSearch cluster, record and replay traffic offline to conduct comprehensive assessments in order to identify optimal sharding strategies or hardware configurations, and/or perform comparative analyses across different versions. All of this is driven by their real workload data. This tool is invaluable for navigating the intricacies of cluster migration and version upgrades, offering insightful assistance every step of the way.

We’ve provided a demo setup that allows you to get started quickly and explore the tools. There are two ways to deploy the solution: locally with Docker containers or on AWS. To begin with either option, clone the [GitHub repository](https://github.com/opensearch-project/opensearch-migrations/tree/capture-and-replay-v0.1.0) or download a signed tarball from the [releases page](https://github.com/opensearch-project/opensearch-migrations/releases/tag/0.1.0).

To deploy locally with Docker, `cd TrafficCapture` and `./gradlew :dockerSolution:composeUp`. This will build and set up a number of containers: an Elasticsearch 7.10 node with the Capture Proxy installed on it, a Kafka node to store captured data, the Traffic Replayer, an OpenSearch node running the latest released version, and the Migration Console. You can exec into any of the containers to inspect them more closely. The Migration Console, in particular, is designed as the user-facing CLI interface and comes preloaded with scripts, including `./runTestBenchmarks.sh`, that allow you to easily run a set of OpenSearch Benchmark workloads. The workloads will run directly against the Elasticsearch node, the traffic will be recorded by the Capture Proxy and replayed against the OpenSearch node by the Traffic Replayer, and the original and replayed responses are stored in a shared drive available on the Migration Console. You can also deploy this solution natively on AWS to take advantage of Amazon Managed Streaming for Apache Kafka (Amazon MSK), AWS Fargate, and Amazon Elastic File System (Amazon EFS). For more information, refer to [this README](https://github.com/opensearch-project/opensearch-migrations/blob/capture-and-replay-v0.1.0/TrafficCapture/README.md) file for setup and configuration or [Architecture.md](https://github.com/opensearch-project/opensearch-migrations/blob/capture-and-replay-v0.1.0/docs/Architecture.md) for a detailed design of the solution.

The tool currently offers support for versions within the Elasticsearch 7.x range, up to and including 7.10, and OpenSearch 1.x, 2.x, and Amazon OpenSearch Serverless. It is Apache 2.0 licensed, open source, and free to use. Currently, the tool is well suited for small- to medium-scale workloads. We're dedicated to enhancing the tool's capabilities, with ongoing efforts to expand version support and optimize scalability, ensuring it performs well even with large workloads.

We invite you to try this solution and provide your valuable feedback. Your insights and experiences are essential to helping us refine and enhance this tool to better meet your needs. If you encounter any challenges or have suggestions for improvements, please don't hesitate to [file a GitHub issue](https://github.com/opensearch-project/opensearch-migrations/issues/new/choose). Your feedback is greatly appreciated.

