---
layout: post
title: "OpenSearch’s Hidden Powers - Experimental Features"
category: blog
authors:
    - nateboot
date: 2026-01-30
categories:
  - technical-posts
meta_keywords: 
meta_description: 
---

I was recently writing about our latest experimental features - the implementation of "Apache Arrow Flight." I thought about some ot the other features that we have that are technically "experimental" features that may not be getting the attention they deserve. I thought I'd take the chance and tell you about some of them. 

I've learned that something we take very seriously here at OpenSearch is our ability to innovate and explore new ways of breaking down problems into smaller, more easily digestible steps. Sometimes doing so requires a bit of experimentation. We have a number of features that are marked as experimental so you can test tomorrow’s innovation today. Of course they’re cool and exciting, but border on risky in their experimental form. This frontier between stability and risk is exactly where innovation lives. We need your help to bring them into the forefront. 

**What Are They?**

These are features that aren’t quite production ready, but represent significant innovation. They are best used in development environments, as not all of them have been in the oven long enough to be considered fully baked.

**Why try something that isn’t done yet?**

For one, early access to innovation. New algorithms, UI changes, performance optimizations, and bleeding edge ML features are some things that tend to get hidden behind feature flags. This is also an area in which the feedback of the community literally shapes OpenSearch’s future. Your contribution in testing these is driving development and innovation forward. The light bulb did not come about via continuous improvement of the candle.

**Where are you hiding these things?**

When features are hiding behind a feature flag, what we’re talking about is a config option inside of either `opensearch.yml` or `opensearch_dashboards.yml`.  How about a few examples?

**Here are some suggestions on what to try out!**

**The “Workspace” feature** reconfigures the UI so that you’re able to tailor the on-screen elements in a way that is specifically targeted towards the use case you’re implementing.  Observability use case will rely heavily on visualizing health and performance through logs and metrics.

[Image: Image.jpg]

To enable the workspace feature, drop a few lines into your `opensearch_dashboards.yml` file.

```workspace.enabled: true
uiSettings:
    overrides:
        "home:useNewHomePage": true
```
If your cluster has the security plugin installed, multi-tenancy must be disabled. Drop this into your dashboards configuration also.

```
opensearch_security.multitenancy.enabled: false
```
**The “Distributed Tracing” feature**

This feature has been experimental since version 2.10, and is a great experiment for people with application tracing use cases. Watch the full journey of a request from its inception to completion in a distributed environment. There’s a couple of edits needed to enable this one.

To your `opensearch.yml` file, add `opensaerch.experimental.feature.telemetry.enabled=true.`
Also, add `telemetry.feature.tracer.enabled=true` as well as `telemetry.tracer.enabled=true` .

There’s one last piece, and that is to install the OpenSearch OpenTelemetry plugin (`telemetry-otel`). For more information, check out the [distributed tracing documentation.](https://docs.opensearch.org/latest/observing-your-data/trace/distributed-tracing/)

**Are there more?**

There are several features that are considered to be experimental. Our documentation will very clearly state that “This is an experimental feature and is not recommended for use in a production environment.”

One experimental is  “[Index context](https://docs.opensearch.org/latest/im-plugin/index-context/)”, which declares the use case for an index. This allows OpenSearch to apply a series of preconfigured settings and mappings.

Also up for experimentation is the “[Security Configuration Versioning and Rollback API](https://docs.opensearch.org/latest/security/configuration/versioning/)” which provides a means of version control for your security configuration. Changes are tracked, audit trails are created, and previous configurations can be restored if needed.

Perhaps one of my more favorite ones is the [Search API over gRPC.](https://docs.opensearch.org/latest/api-reference/grpc-apis/search/) This will allow you to query over gRPC while making use of protobuf for the purposes of transport. A very performant means of querying your data.

I’m very excited about the Pull-based Ingestion API. Instead of having a client or small sidecar app pushing data into OpenSearch, OpenSearch reaches out and pulls data, ensuring that the data is pulled at an acceptable rate and isn’t going to bring your cluster to its knees by ingesting documents too fast. There are only two ingestion plugins at the moment, one for kafka, and one for kinesis. Read about it [here](https://docs.opensearch.org/latest/api-reference/document-apis/pull-based-ingestion/).

**Experiment Responsibly!**

Do not use experimental features in production. No cap. They are subject to change without warning. Such changes may render them incompatible or unalive them entirely. After all, it **is** an experiment.  You should confine your experimentation to development environments, testing clusters, POC efforts, and most importantly to me,  learning and exploration.

**One last piece of advice**

Keep a close eye on your cluster after enabling these features. There very well may be noticeable performance changes, unexpected crashes, increased resource consumption as well as potentially introducing compatibility issues.

**Go play!**

There’s a lot of innovation happening here at OpenSearch to improve all of your search, analytics, and observability needs. Your feedback on what is working and what is invaluable. 


