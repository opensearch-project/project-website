---
layout: post
title:  "Introduction to Cross-Cluster Replication"
authors: 
  - rohin
  - gopalak
  - sai
date:   2021-10-12 10:00:00 -0700
categories: 
  - cross-cluster
twittercard:
  description: "Cross-cluster replication allows you to replicate indices from one cluster to another. This post provides a brief overview of the feature and the thought process behind the design and implementation."
redirect_from: "/blog/cross-cluster/2021/10/cross-cluster-replication-intro/"
---

Earlier this year while working on Open Distro the team announced the [experimental release of cross-cluster replication](https://opendistro.github.io/for-elasticsearch/blog/releases/2021/02/announcing-ccr/). I am happy to announce the general availability of cross-cluster replication for OpenSearch. This post provides a brief overview of the feature and the thought process behind the design and implementation.

## Overview

Today, OpenSearch is often used in mission-critical applications which require replication across clusters. Scenarios where you might need cross-cluster replication:

* **Disaster Recovery (DR) / High Availability (HA)** - To build tolerance for outages or complete failure of OpenSearch clusters, cross-cluster replication is an important building block. With cross-cluster replication, you can create an alternate clusters that continuously replicates indices from the primary cluster without the need of any third-party technologies.
* **Data Proximity** - OpenSearch is also widely used as a search engine for product/service search by organizations with global end user base. Having a centralized cluster can add to the query latency for end users far from the cluster and thus impact end user experience. With cross-cluster replication you can now replicate indices to another cluster in a location closer to the end user for data proximity. These secondary clusters can reduce latency for search requests enhancing customer experience.

Historically, you have been solving for these use cases by creating a second cluster, fork their input data streams to the two clusters, and place a load balancer in front of the two domains to balance incoming search requests.. However, this adds complexity and costs as it requires multiple third-party technologies to monitor and make corrections for data discrepancy between the two clusters. Often requiring manual intervention that adds to the operational burden. Native support for cross-cluster replication reduces cost and also removes complexities and operational overhead.

Some important terminologies before diving deeper.

* **Leader Index** - Index which is being replicated is called a leader index.
* **Leader Cluster** - Cluster where the leader index resides.
* **Follower Index** - Index which replicates leader index
* **Follower Cluster** - Cluster where the follower index resides.
* **Sequential consistency** - Query performed on the leader and the follower index after the same number of operations applied in the same order will yield the same result.
* **Global Checkpoint** - is a sequence number for which all active shards histories are aligned till this point.

The cross-cluster replication team was guided by the following principles while designing and implementing the feaure.

* **Secure**: Cross-cluster replication should offer strong security controls for all flows and APIs.
* **Accuracy**: There must be no difference between the intended contents of the follower index and the leader index.
* **Performance**: Replication should not impact indexing rate of the leader cluster.
* **Eventual Consistency**: The replication lag between the leader and the follower cluster should be under a few seconds.
* **Resource usage**: Replication should use minimal resources. 

Cross-cluster replication on OpenSearch supports an active-passive model for replication. The leader index is active as it can receive both writes and read requests. The follower index is passive as it can only receive read or search requests. Cross-cluster replication provides granular control, allowing you to choose the index you want to replicate. The granular control also makes it possible to replicate selected indices from one cluster to another and some indices in the opposite direction.

The cross-cluster replication feature is implemented as an OpenSearch plugin that exposes APIs to control replication, spawns background persistent tasks to asynchronously replicate indices, and utilizes snapshot repository abstraction to facilitate bootstrap. Replication relies on cross-cluster connection setup from the follower cluster to the leader cluster for connectivity. The cross-cluster replication plugin also optionally offers seamless integration with the OpenSearch Security plugin. You can encrypt cross-cluster traffic via the node-to-node encryption feature and control access for replication activities via the security plugin.

Cross-cluster replication provides granular control so that you can choose which index you want to replicate. While starting replication, apart from the index details, you can also specify specific settings for the follower index that you want to override from the leader index, for example the number of replicas. Once initiated documents, settings and mappings from the leader index are replicated to the follower index. At the start of replication, the follower index goes through a bootstrapping phase where the data from the leader index is copied over (akin to how replicas are created). After the bootstrapping phase, replication enters the syncing phase where all changes to the leader index are replicated on the follower. The plugin also provides auto-follow, which lets you automatically replicate indices from the leader to the follower cluster if they match a specific pattern. While replication is ongoing, there could be scenarios where it encounters intermittent issues. Cross-cluster replication has inbuilt retry mechanism in case of errors. However, there could be scenarios when it is unable to recover and throws exception. 

During the implementation the team consciously tried to minimize the impact of replication activities on the leader cluster while also trying to minimize the lag between the two indices. The lag can be monitored with the help of the status API that gives both a high level view (index level) and a detailed view (shard level) of the ongoing replication. Cross-cluster replication is designed to support sequential consistency. This in a way guarantees the consistency between the leader index and the follower index. In plain speak, if you are to perform 1,000 operations on the leader index in a particular oder and you perform the same set of operations on the follower index in the same order, any search request executed on both the indices will provide the same result. While there is no easy way to monitor the operations and its sequences for an index in OpenSearch, the closest you have is the Global Checkpoint which provides a sort of marker that guarantees that all operations up to the checkpoint has been processed by all active shards (both primary and replicas). The status API also provides metrics aggregated at the index level to give a sense of the replication lag. 

## Summary

With the release of cross-cluster replication as part of OpenSearch 1.1.0, the team hopes to establish the foundation for the use cases mentioned in the beginning of the post. As you can imagine, cross-cluster replication is both critical and complex and this is just the beginning of the cross-cluster replication journey. The intention is to create the springboard for future enhancements like automatic failover, full-cluster replication, active-active replication, and many more. You are invited to evaluate, provide feedback and also collaborate to make cross-cluster replication better.  
