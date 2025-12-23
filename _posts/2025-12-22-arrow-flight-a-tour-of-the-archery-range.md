---
layout: post
title: "OpenSearch and Apache Arrow: A tour of the archery range"
category: blog
authors:
    - nateboot
date: 2025-12-27
categories:
  - technical-posts
meta_keywords: 
meta_description: 
---

Scalability and efficiency improvements that still allow for innovation are important in software projects. There’s always more information to be exchanged, and there’s always a need to do it faster.

It’s clear that the OpenSearch community understands this, as I’ve recently noticed that OpenSearch has begun using the [Apache Arrow](https://arrow.apache.org/) standard for various points of data transfer within a cluster as an opt-in experimental feature. Despite being experimental at the moment, this experiment is already proving to be fruitful. I’d love for everyone to know about it. I’ll even show you how to enable it!

## What is it?

Apache Arrow consists of two distinct innovations. One stores information in memory in a way that is agnostic to the program or client that is accessing it. This is what is called a “zero copy” optimization technique. These techniques are important—often when transmitting data, it is stored in memory in a specific way and requires transformation before storage. If a client written in another language were given a bookmark to that memory, it wouldn’t be able to make sense of the data. But Arrow clients can. This pattern of having data in memory but needing a duplicate in order for it to be read and then used by something else is called “serialization and deserialization.” Apache Arrow lets you skip this.

Apache Arrow also has a component called Arrow Flight, an RPC framework that exchanges data using the Arrow format. I’m sure you won’t be surprised to hear that they are meant to be used together. Arrow is meant to be used over RPC. Flight is the RPC framework that enables the “volley."

## Where is it used in OpenSearch?

OpenSearch has had a working gRPC framework for a while, using protocol buffers for in-memory storage. In its experimental state, Arrow Flight sits between data nodes and coordinator nodes. When a data node is queried, the result is constructed record by record on that node. The response remains in memory on the data node until it is fully assembled and returned.

By giving data nodes the ability to return partial results, they can handle more queries simultaneously. This improves their actual transfer speed due to efficient memory storage for large datasets. The partial results are passed to the coordinator node as they become available, removing the memory burden from the data node.

## Why is this important to the community?

For those of you moving large amounts of data, this could be a great entry point for two reasons:

* Computation against data stored in the Arrow format is fast, and the memory space can be shared easily with programs written in other languages.
* If your solution needs the power of search but with elevated record throughput (I’m looking at you, telemetry, analytics, and observability folks), you now have another point of integration with OpenSearch.

If you have a high-throughput solution but are encountering issues with data transfer speed in your cluster, it’s worth an experiment or two to see what you can gain.

## How do I enable it?

There are two required plugins: `transport-reactor-netty4` and `arrow-flight-rpc`. You’ll have to install them using the command line:

```
bin/opensearch-plugin install transport-reactor-netty4
bin/opensearch-plugin install arrow-flight-rpc
```

Then a few lines need to be added to your `opensearch.yml` file or Docker Compose configuration:

```
opensearch.experimental.feature.transport.stream.enabled: true

# Choose one based on your security settings
http.type: reactor-netty4        # security disabled
http.type: reactor-netty4-secure # security enabled

# Multi-node cluster settings (if applicable)
# Use network.host IP for opensearch.yml or node name for Docker
arrow.flight.publish_host: <ip>
arrow.flight.bind_host: <ip>

# Security-enabled cluster settings (if applicable)
transport.stream.type.default: FLIGHT-SECURE
flight.ssl.enable: true
transport.ssl.enforce_hostname_verification: false
```

Then add settings to your `jvm.options` file:

```
-Dio.netty.allocator.numDirectArenas=1
-Dio.netty.noUnsafe=false
-Dio.netty.tryUnsafe=true
-Dio.netty.tryReflectionSetAccessible=true
--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED
```

Finally, make one last API call to the node:

```
PUT /_cluster/settings
{
    "persistent": {
        "plugins.ml_commons.stream_enabled": true
    }
}
```

Your cluster should now be using Arrow Flight streaming between coordinator and data nodes. If you need help interacting with OpenSearch using an Arrow library, see [Install Apache Arrow](https://arrow.apache.org/install/) to find the library that’s right for you.

## Summary

OpenSearch has an implementation of Apache Arrow hidden behind a feature flag. Considering the extremely large workloads supported by OpenSearch, there are several good reasons to try it out:

* Serialization and deserialization cause a lot of overhead when transmitting data over the network.
* It eliminates the need for data nodes to accumulate large result sets with their own resources. With Arrow enabled, results are delivered as a stream of partial responses rather than as a single monolithic result.
* For those familiar with RPC frameworks, it provides a point of integration.

We are [seeking feedback](https://github.com/opensearch-project/OpenSearch/issues/18725) on our implementation of Arrow Flight. As always, our direction and effort are decided by the community, so feel free to make your voice heard!
