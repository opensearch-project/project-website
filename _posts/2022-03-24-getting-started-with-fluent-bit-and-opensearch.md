---
layout: post
title:  "Getting started with Fluent Bit and OpenSearch"
authors:
- anurag_gup
date: 2022-03-24
categories:
- technical
twittercard:
    description: "We recently announced the release of Fluent Bit 1.9, and while there are a number of new features and enhancements to its already impressive speed, scale, and efficiency, one feature we are really excited about is the OpenSearch plugin for Fluent Bit. Fluent Bit is an Apache 2.0 open source lightweight log and metric processor that can gather data from many sources, while the OpenSearch project is a community-driven open-source search and analytics suite derived from Elasticsearch 7.10.2 and Kibana 7.10.2."
redirect_from: "/blog/technical/2022/03/getting-started-with-fluent-bit-and-opensearch/"
---

We recently announced the release of Fluent Bit 1.9, and while there are a number of new features and enhancements to its already impressive speed, scale, and efficiency, one feature we are really excited about is the OpenSearch plugin for Fluent Bit. Fluent Bit is an Apache 2.0 open source lightweight log and metric processor that can gather data from many sources, while the OpenSearch project is a community-driven open-source search and analytics suite derived from Elasticsearch 7.10.2 and Kibana 7.10.2.

In this Getting Started Guide we cover:
1. The new plugin with integration to OpenSearch.
2. A deployment scenario on top of Kubernetes.
3. Bonus! Using some of Fluent Bit’s new 1.9 features.

## Use Cases for Fluent Bit
Fluent Bit is a graduated sub-project under the Cloud Native Computing Foundation (CNCF) Fluentd project umbrella. Similar to the parent project, Fluent Bit has hundreds of integrations to common tools such as Kafka, Syslog, Loki, as well as to services like Datadog, Splunk, and New Relic. Now with Fluent Bit 1.9, OpenSearch is included as part of the binary package.

The main difference between Fluent Bit and Fluentd is that Fluent Bit is lightweight, written in C, and generally has higher performance, especially in container-based environments. However, both projects integrate well with each other depending on your architecture and observability pipeline requirements.

A few popular use cases supported with Fluent Bit:

1. Avoiding vendor lock-in from vendor focused agents (Splunk forwarder, Datadog agent, Elastic Beats) - Fluent Bit is completely vendor agnostic.
2. Collecting container logs from Kubernetes applications and sending them to multiple locations - Fluent Bit integrates with all major back-ends and can direct data to multiple locations.
3. Retrieving data from syslog or network devices and performing lookups for the indicator if compromise scenarios.


## Sending data to OpenSearch
To make use of the latest OpenSearch output plugin we will first need to get the latest version of Fluent Bit - version 1.9. There are a couple of ways to run Fluent Bit that are covered in Fluent Bit’s [Getting Started Guide], and in this tutorial, we will focus on two methods:

1. Install as a package on Linux.
2. Kubernetes deployment.


## Install as a package on Linux
We can grab the latest version of Fluent Bit by running the following one line install script on top of our Linux OS. In my case, I am using Ubuntu 20.04 LTS:

```
curl https://raw.githubusercontent.com/fluent/fluent-bit/master/install.sh | sh
```

Once installed we can modify the configuration under `/etc/td-agent-bit/conf/td-agent-bit.conf` to the following:

```
[INPUT]
   Name cpu
   Tag cpu

[OUTPUT]
   Name opensearch
   Match *
   Host 192.168.2.3
   Port 9200
   Index my_index
   Type my_type
```
In this scenario, we use the CPU log metric input plugin to retrieve CPU metrics and send them to OpenSearch.

Within a few minutes we should be able to see the CPU metrics under the `my_index` index within OpenSearch.

## Kubernetes deployment
Another extremely popular method of deploying Fluent Bit is on top of Kubernetes. Many cloud providers already bundle Fluent Bit as part of their Kubernetes services, however, you can run Fluent Bit as a daemonset to collect application logs, events, and route them to whichever backend you need such as OpenSearch. A DaemonSet in Kubernetes ensures that a single instance of Fluent Bit is present on each Kubernetes node such that it can collect all the container application logs. Additionally, users generally deploy with the Kubernetes filter which allows all container application logs to be enriched with Kubernetes metadata (e.g. namespace, pod, container_id), which can help with debugging and troubleshooting.

The simplest way to deploy a DaemonSet is by leveraging the [Fluent helm chart](https://docs.fluentbit.io/manual/installation/kubernetes#installing-with-helm-chart). Helm is a package manager for Kubernetes and makes deploying flexible, repeatable, and easy to maintain.

We can first grab the source code for the chart:

```
git clone
```

Then we can modify the values.yaml file and change the output section:

```
[OUTPUT]
   Name opensearch
   Match *
   Host 192.168.2.3
   Port 9200
   Index my_index
   Type my_type
```

Once completed we can run the following helm command, with the current directory being fluent-bit helm chart:

```
helm deploy fluent-bit
```

After deploying we can then check OpenSearch to see all our incoming logs as well as all the enrichment performed with the Kubernetes filter.

## Conclusion and Getting Involved
With this Getting Started Guide we covered how you can start using Fluent Bit 1.9 to start sending logs to OpenSearch immediately from your Windows, Linux, Container, Mac, or Kubernetes environments. There are many other scenarios to explore and we welcome users to join the conversation on the [Fluent Slack Channel](https://fluent-all.slack.com) or the [OpenSearch forums](https://discuss.opendistrocommunity.dev).
