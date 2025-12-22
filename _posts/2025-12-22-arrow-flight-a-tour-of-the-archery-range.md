---
layout: post
title: "OpenSearch and Apache Arrow - a tour of the archery range"
category: blog
authors:
    - nateboot
date: 2025-12-27
categories:
  - technical-posts
meta_keywords: 
meta_description: 
---

# OpenSearch and Apache Arrow - A tour of our archery range.

Scalability and efficiency improvements that still leave place for innovation are important things to come by in software projects. When juxtaposed with the world’s use of microservice architectures as an infrastructure design paradigm is also growing, it isn’t a giant leap of the imagination to think that there are ongoing innovations in that area, especially ones regarding throughput and speed. There’s always more information to be exchanged, and there’s always a need to do it faster.

It’s clear that the OpenSearch community understands that need as I’ve recently noticed that OpenSearch has begun using the [Apache Arrow](https://arrow.apache.org/) standard for various points of data transfer within a cluster as an opt-in experimental feature. Despite being experimental at the moment, this experiment is already proving to be fruitful. I’d love for everyone to know about it. I’ll even show you how to enable it!

_**What is it?**_

Apache Arrow consists of two distinct innovations. One, a way of storing information in memory, in a way that is agnostic to the program or client that is accessing it. This is what is called a “zero copy” optimization technique. These techniques are important - often when transmitting data, it is stored in memory in a specific way and requires transformation before storing it. If another language were to be given a bookmark to that information, it wouldn’t be able to make sense of it. But Arrow clients can.  This pattern of having data in memory, but needing a completely new copy made in order for it to be read and then used by something else is called “serialization and deserialization.”  Sometimes called “Ser/De” overhead. Apache Arrow lets you skip this.

The Arrow project also has a component called “Flight” - an RPC framework that exchanges data  using the Arrow format. I’m sure you won’t be surprised to hear that they are meant to be used together. Arrow is meant to be used over RPC. Flight is the RPC framework that enables the “volley”.

_**Where is it used in OpenSearch?**_

OpenSearch has had a working gRPC framework for a while using profobuf for in memory storage.  In its experimental state the use of Arrow Flight is right between data nodes and coordinator nodes.  Normally when a data node is queried, the result is built up record by record there on the data node. The response lives there and accumulates, taking up more and more memory, until it is assembled and then returned in its entirety.

By giving data nodes the ability to return partial results, they can handle more queries at the same time. It improves their actual speed of transfer due to the efficient memory storage for large data sets. The partial results are passed off to the coordinator node as they become available, taking the memory burden off of the data node.

_**Why is this important to builders and/or the community?**_

For you innovators out there moving large amounts of data, this could be a great entry point for two reasons.


* Computation against data stored in Arrow format is fast, and the memory space can be shared easily amongst programs written in other languages.
* If your solution needs the power of search but with elevated record throughput (I’m looking at you, telemetry, analytics and observability folks) you now have another point of integration with OpenSearch.
* If you have a high throughput solution and you find yourself with some complaints about data transfer speed within your cluster, it’s worth an experiment or two to see what you can gain.



_**How do I enable it?** _

There’s two required plugins. `transport-reactor-netty4` and `arrow-flight-rpc`. You’ll have to install them via the command line.


```
bin/opensearch-plugin install transport-reactor-netty4
bin/opensearch-plugin install arrow-flight-rpc
```

And then a few lines need to be added to your `opensearch.yml` file or docker compose config.

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

Add settings to your `jvm.options` file:

```
-Dio.netty.allocator.numDirectArenas=1
-Dio.netty.noUnsafe=false
-Dio.netty.tryUnsafe=true
-Dio.netty.tryReflectionSetAccessible=true
--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED
```

And one last little API call to the node:

```
PUT /_cluster/settings
{
    "persistent": {
        "plugins.ml_commons.stream_enabled": true
    }
}
```

Your cluster should now be making use of Arrow Flight streaming between coordinators and data nodes. If you need some help interacting with OpenSearch via an Arrow library, check out the [install page](https://arrow.apache.org/install/) to find the library that’s right for you.

_**A not-quite-so-AI summary.**_

OpenSearch has an implementation of Apache Arrow hidden behind a feature flag. Considering the extremely large workloads being supported by OpenSearch, we have several good reasons to try it out.

* Serialization and deserialization cause a lot of overhead when transmitting data over the network.
* It eliminates the need for data nodes to accumulate large result sets with their own resources. Enabling Arrow changes this conversation from a monolithic result to a streaming result that sends partial results as they become available.
* For those familiar with RPC frameworks, it provides a point of integration.

_**A selfish admission...**_

We just happen to be [seeking feedback](https://github.com/opensearch-project/OpenSearch/issues/18725) on our implementation of Arrow Flight. As always, our direction and effort are decided by the community. Your voice is important. Join us on this particular stretch towards innovation and efficiency!


