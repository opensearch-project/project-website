---
layout: post
title:  "Introducing Extensions for OpenSearch"
authors:
  - vemsarat
  - widdisd
  - kazabdu
  - dblock
  - dagney
  - minalsha
date: 2023-07-10
categories:
  - technical-posts
meta_keywords: OpenSearch, plugins, extensions
meta_description: Introducing Extensions for OpenSearch, a new way to extend features of OpenSearch.
---

This blog post introduces extensions for OpenSearch and the launch of experimental SDK.

# Introducing Extensions for OpenSearch

## Introduction

OpenSearch is a fork of Elasticsearch 7.10, which offered extending features via plugins. Until now, plugins were the best way to extend features in OpenSearch, and we’ve written a [blog post](https://opensearch.org/blog/plugins-intro/) to help you understand how they worked. The OpenSearch project currently maintains 17 plugins, and we have learned a lot developing and operating them at scale over the last two years. In such, we’ve encountered many bottlenecks in the existing plugin architecture.

Plugins are class-loaded into memory during OpenSearch bootstrap and therefore run within the OpenSearch process. This leads to 3 architectural problems.

1. Rigid version compatibility requirements with OpenSearch. Every patch version change in OpenSearch core requires the plugin to be re-compiled and re-released.
2. Plugins are not isolated and can fatally impact the OpenSearch cluster, nor can plugins scale independently.
3. Having to manage dependencies of all components together makes it challenging to include 20+ plugins in a single product distribution.


In this blog post we will introduce Extensions, a new experimental feature in OpenSearch 2.9 that enables extending OpenSearch without impacting cluster availability, and independently scale workloads. We will demonstrate how we have achieved a cost reduction of 33% per data node with the added cost of 1 extension node in a 36-node cluster running a machine learning algorithm that performs high cardinality anomaly detection, with performance matching that of a plugin.

Last, but not the least, unlike plugins, extensions run as a side-car process or on a remote node, are isolated and have cleaner, well-defined interfaces to interact with OpenSearch core. These interfaces are versioned, follow semantic versioning, and are guaranteed to work across minor and patch versions, even opening the future possibility of being compatible with multiple major versions of OpenSearch.

The extensions architecture is illustrated below.

![Extensions for OpenSearch](/assets/media/blog-images/2023-07-10-introducing-extensions-for-opensearch/extensions.png){: .img-fluid}

## Experimental SDK Launch

The first step in our [extensibility roadmap](https://opensearch.org/blog/technical-roadmap-opensearch-extensibility/) is to launch a developer SDK that makes the experience of extending OpenSearch easier than with plugins. Today, we are launching a Java version, [opensearch-sdk-java](https://github.com/opensearch-project/opensearch-sdk-java), which works with OpenSearch 2.9 or above. To turn on the experimental extensibility feature, set `opensearch.experimental.feature.extensions.enabled` to `true` in your `opensearch.yml` .

The extensions interfaces are compatible across minor and patch versions of OpenSearch, therefore there’s no need to recompile, redeploy, or reinstall your extension next time you upgrade to the next version of OpenSearch 2.10. These APIs currently include the capability of exposing a REST interface in your extension, and ship with client libraries to interact with data in your OpenSearch cluster.

The first version of the SDK v0.1.0 is available in Maven under [org.opensearch.sdk](https://aws.oss.sonatype.org/content/repositories/releases/org/opensearch/sdk). Get started with the [developer documentation](https://opensearch-project.github.io/opensearch-sdk-java/) to build your first extension.

## How did we write our first extension?

We selected the Anomaly Detection (AD) as our first extension to migrate from a plugin, because of its combination of complexity, and performance sensitivity.

Technically, AD wasn’t our first extension. Like anyone exploring a new space, we created [a “Hello World” example](https://github.com/opensearch-project/opensearch-sdk-java/blob/main/src/main/java/org/opensearch/sdk/sample/helloworld/HelloWorldExtension.java) to show how easy it was to get started, and to demonstrate the usage of the basic interfaces, without the complexity of a real world application. We then wanted to face the challenges of migrating a full fledged, production-ready plugin, ourselves.

Most plugins make requests to OpenSearch for user data or cluster state. Our extensions needed a REST client to match this functionality. Our initial choice was the[OpenSearch Java Client](https://github.com/opensearch-project/opensearch-java). As a robust, spec-based, auto-generated client, it seemed to be an ideal choice, especially because of our future wish to port the SDK to other programming languages that all have similar clients. This is still the preferred client for new extension development. However, for the experimental release, AD was very dependent on the existing NodeClient API, and we found ourselves rewriting too much code.

The High Level Rest Client, currently part of OpenSearch core, had a nearly identical interface, but has been proposed for deprecation. We chose to use it for the early migration work, and decided to leave the client switching until it’s removed in OpenSearch 3.0 or 4.0.  This allowed us to minimize the amount of work and to quickly migrate all the API uses by adding a handful wrapper classes.

While trying to minimize work, we did end up implementing several inefficient operations. The AD Plugin made frequent use of the OpenSearch cluster state object. As cluster state is always up-to-date in OpenSearch core, it proved useful for fetching information efficiently. However, in an extension environment, retrieving for the entire cluster state [multiple times](https://github.com/opensearch-project/opensearch-sdk-java/issues/674) for the purposes of, for example, finding out whether an index or alias existed, proved to be a waste of bandwidth, and led to many API timeouts (creating a detector in our initial prototype often took nearly 13 seconds). To fix this, we used [existing settings](https://github.com/opensearch-project/opensearch-sdk-java/pull/818), and targeted calls to the [Index API](https://github.com/opensearch-project/anomaly-detection/pull/919) and [Cluster API](https://github.com/opensearch-project/anomaly-detection/pull/921) to bring bootstrap time down to a fraction of a second.

The AD as an extension code can be found here. You can also examine the diff between AD as a plugin and as an extension.

### Performance Testing

To benchmark High Cardinality Anomaly Detection (HCAD) as an Extension (https://github.com/opensearch-project/opensearch-sdk-java/issues/652), we have replicated the setup described in https://opensearch.org/blog/one-million-enitities-in-one-minute/, and replaced 36 r5.2xlarge data nodes with a same-cost 28 r5.2xlarge data nodes, plus a single r5.16xlarge instance running AD extension. We analyzed 1000 historical time periods with 1000 entities to generate 1 million results. The plugin limits these analysis rates to ensure stable cluster performance. After some fine-tuning (we increased simultaneous detector tasks from 10 to 96 and reduced the batch task piece interval from 5 to 3 seconds), the extension version of AD was able to successfully complete this analysis in 55 seconds. This isn’t quite apples-to-apples as the test in the above-mentioned blog post of 1 million smaller models x 1 time slice each to generate 1 million results (we needed more time to implement support for real-time AD in the extension), but we believe that we should be able to support 1M models on a single node, or on a small number of nodes once extensions are capable of running in that environment.

```
GET /_extensions/_ad/detectors/results/_search
{
    "query": {
        "range": {
            "execution_start_time": {
                "gte": 1687456200000,
                "lte": 1687456260000
            }
        }
    },
    "track_total_hits": true
}
```

```
{
    ...
    "hits": {
        "total": {
            "value": 1000000,
            "relation": "eq"
        },
        ...
    ...
}
```


Because our extension ran on a remote node, we did observe an expected increased in API call latency. For example, the start/stop detector call went from 50-100ms to 200-300ms. These calls are marginal CRUD operations that are used to setup anomaly detection. [[all graphs](https://github.com/opensearch-project/opensearch-sdk-java/issues/725#issuecomment-1597874382)].
[Image: image.png]
This proved that upgrading AD from plugin to extension could match existing performance for end users! But could we do better?

#### We can use a cheaper cluster

We found that by rewriting AD as an extension we could reduce the cost of our cluster and still meet the same performance bar. Because AD no longer runs on data nodes, we were able to replace all memory optimized r5.2xlarge nodes with general purpose c5.2xlarge nodes for a 33% cost saving per data node for historical analysis plus the cost of 1 extension node.

We also were able to decrease the number of data nodes further to optimize searching the data and indexing the results. For example, since most data nodes in the original performance benchmark had insignificant usage other than indexing results, we tested a cluster with only 24 c5.2xlarge data nodes along with 1x r5.16xlarge extension node, a further 33% reduction. We believe that one can find an even more optimal mix, which would depend on other resource requirements for the cluster, and require further experimentation and fine tuning.

#### We can increase indexing throughput

While we have not run this experiment, we believe one can further independently fine-tune the cluster by increasing sharding, and achieve better throughput in indexing AD results.

#### We can increase the rate of generating historical results

AD’s historical HCAD limits the rate of historical time period results, limits the use of AD to half the heap, and sets the max for detection at 10 simultaneous threads to protect the cluster from being maxed out. These limits can be raised by either adding more CPUs, RAM or swap space with SSDs, independently from the rest of the cluster, and/or by horizontally scaling extension nodes.

### Conclusion

Extensions can enable cost savings or improved performance by right-sizing all resources to the task being performed. In our test, we did not need memory-optimized servers for the whole cluster to do historical AD, therefore achieving a 33% cost reduction of data nodes.

As a plugin, AD shares CPU and memory with OpenSearch I/O, and must limit its own resource consumption in order to ensure the cluster’s stability. For example, in the AD Plugin HCAD tests, models were limited to use half of the heap, which itself was half of the node’s memory.  In the AD Extension scenario, it was possible to scale the heap up to consume most of the server’s memory, as well as fully leverage 64 vCPUs dedicated only to AD tasks.

Other existing plugins that could similarly benefit from this model include all plugins that have memory or CPU-bound concerns, such as ml-commons, k-nn, reporting, and more. This new technology also enables new resource-heavy extensions to be implemented, such as re-ranking, data transformation, Big Data processing, or video indexing.

### Next Steps

We are thrilled with the progress we have made with Extensibility so far, and the early Performance benchmarking results as shared above. Before we commit to releasing this experimental feature and the SDK as GA, we would like your comments, feedback, and to see some community members implement experimental extensions. We can’t wait to hear from you!
