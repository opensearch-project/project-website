---
layout: post
authors: 
  - andhopp
  - henkle
  - elifish
  - kyledvs
date: 2021-10-05 01:01:01 -0700
title: "OpenSearch 1.1.0 is here!"
category:
- releases
twittercard:
  description: "We are excited to announce the 1.1.0 release of OpenSearch, OpenSearch Dashboards, and the OpenSearch Project plugins"
redirect_from: "/blog/releases/2021/10/Launch-Announcement-1-1/"
---

We are excited to announce the 1.1.0 release of OpenSearch, OpenSearch Dashboards, and the OpenSearch Project plugins (available to [download](https://opensearch.org/versions/opensearch-1-1-0.html) today). 

**What’s Included in OpenSearch 1.1.0?**

This release includes dozens of new features and hundreds of improvements ([release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-1.1.0.md)), and we wanted to highlight some of the most exciting new features in this release:

* Cross-Cluster Replication (CCR): With this feature, you will be able to deploy OpenSearch clusters across different servers, data centers, or even regions and setup a more fault-tolerant configuration. CCR provides low latency replication for indices with sequential consistency. 
* Lucene 8.9 Upgrade: Lucene 8.9 includes sorting improvements when building [BKD](https://lucene.apache.org/core/8_2_0/core/org/apache/lucene/util/bkd/package-summary.html#package.description) indexes that can boost index building by 35x and speed up merging sorted fields and term vectors for smaller segments. It also includes a fix for a performance regression in boolean queries that was introduced in 8.8. Full details are available in the [Lucene 8.9 change log](https://lucene.apache.org/core/8_9_0/changes/Changes.html). 
* CLI OpenSearch Upgrade Tool: While upgrading to OpenSearch from a compatible version of Elasticsearch, there are some manual tasks that need to be performed. The `opensearch-upgrade` tool included in the distribution automates those tasks by importing the existing configurations and applying them to the new installation of OpenSearch. For more information see the [readme](https://github.com/opensearch-project/opensearch-cli/blob/main/README.md). 
* Anomaly Detection Upgrades: OpenSearch now has a unified workflow for realtime and historical anomaly detection within the same detector. You can now click through a single workflow to perform all of the necessary steps to create and run anomaly detection jobs. Anomaly Detection has also been upgraded to use an updated [Random Cut Forest (RCF) algorithm](https://opensearch.org/blog/feature/2021/08/streaming-analytics/) and saw improvements to high cardinality anomaly detection. 
* Bucket Level Alerting: With Bucket Level Alerting, you can configure alerting policies that evaluate against aggregations grouped by a unique field value. For example, if you have an index that is ingesting health logs a number of different hosts, with Bucket Level Alerting, you could configure a monitor to alert when any host has a metric, like CPU or memory, that exceeds a defined threshold. 

**What’s next?**

With the launch of 1.1.0, OpenSearch is already racing forward. There are a number of upcoming feature and enhancements including:

* A [shard level back pressure framework](https://github.com/opensearch-project/OpenSearch/issues/478) is being added to improve OpenSearch indexing reliability.
* A number of new [observability features](https://github.com/opensearch-project/trace-analytics/issues/63) are being added to help you analyze trace and log data. 
* OpenSearch’s k-NN plugin will add support for the updated [FAISS](https://github.com/facebookresearch/faiss) algorithm that improves performance.
* Anomaly detection will add visibility to which signals contributed to specific anomalies. 

See additional active features on the [project roadmap](https://github.com/orgs/opensearch-project/projects/220).

**How can you contribute?**

The OpenSearch community continues to grow and we invite new users and members to contribute! For almost any type of contribution, the first step is opening an issue ([OpenSearch](https://github.com/opensearch-project/OpenSearch/issues), [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/issues)). Even if you think you already know what the solution is, writing down a description of the problem you’re trying to solve will help everyone get context when they review your pull request. If it’s truly a trivial change (e.g. spelling error), you can skip this step – but when in doubt, open an issue. If you’re excited to jump in, check out the [“help wanted”](https://github.com/opensearch-project/OpenSearch/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) tag in issues.

**Do you have questions or feedback?**

If you’re interested in learning more, have a specific question, or just want to provide feedback and thoughts, please visit OpenSearch.org (https://opensearch.org/), open an issue on [GitHub](https://github.com/opensearch-project/OpenSearch/issues), or post in the [forums](https://discuss.opendistrocommunity.dev/). There are also regular [Community Meetings](https://opensearch.org/events/) that include progress updates at every session and include time for Q&A.

**Thank you!** 

We knew OpenSearch would need to build a great open source community to succeed and we’re so excited about the progress! Not only is OpenSearch seeing some awesome contributions across the project but the [community partners](https://opensearch.org/partners/) continue to grow (5 more partners have joined since 1.0.0). As always, everyone should be incredibly proud of the accomplishment of reaching 1.1.0 together. 

Thank you for your continued support.
