---
layout: post
authors: 
  - henkle
  - ahopp
comments: true
title: "OpenSearch 1.1 is here!"
category:
- releases
---

To the OpenSearch community everywhere, 

We are excited to announce the 1.1 release of the OpenSearch project (available to [download](https://opensearch.org/downloads.html) today). Not only are we excited that this release marks the first minor version release on the OpenSearch project, it also comes with a number of new and exciting features. And, best of all, we continue to see the community grow and contribute to OpenSearch!

So, what’s in 1.1? This release includes dozens of new features and hundreds of improvements (Release Notes) but we wanted to highlight some of the most exciting new features in this release;

- Cross Cluster Replication: This is one we are personally really excited about. Being able to deploy OpenSearch clusters across different servers, data centers, or even regions will help anyone setup a more fault-tolerant configuration. Further, you can now store different indices on different clusters and query data across all of them  with a single request.
- Lucene 8.9 Upgrade: OpenSearch 1.1 supports Lucene 8.9!  Highlights include sorting improvements when building BKD indexes that can boost index building by 35x and speed up  merging sorted fields and term vectors for smaller segments. It also includes a fix for a performance regression that was introduced in 8.8 for Boolean Queries. Full details are available in the Lucene [release notes](https://lucene.apache.org/core/8_9_0/changes/Changes.html). 
- CLI OpenSearch Upgrade Tool: While upgrading to OpenSearch from a compatible version of Elasticsearch, there are some manual tasks that need to be performed. The opensearch-upgrade tool included in the distribution automates those tasks by importing the existing configurations and applying them to the new installation of OpenSearch. This is the first version of the tool, so we welcome your feedback for future enhancements! For more information see the [readme](). We’re also planning a blogpost that highlights how to best use this feature. 
- Anomaly Detection Upgrades: OpenSearch now has a unified workflow for realtime and historical anomaly detection within the same detector. OpenSearch users can now click through a single workflow to perform all of the necessary steps to create and run anomaly detection jobs! Anomaly Detection has also been upgraded to use an updated Random Cut Forest (RCF) algorithm and saw improvements to high cardinality anomaly detection. 
- Bucket Level Alerting: TODO

With the launch of 1.1, OpenSearch is already racing toward 1.2 ([Roadmap](https://github.com/orgs/opensearch-project/projects/1)). There are a number of feature and enhancements we’re particularly excited for, including;

- A shard level back pressure framework is being added to improve OpenSearch’s ability to restrict the number of bytes available for outstanding indexing requests at the shard level. This allows users to have rejections based on the memory accounting at shard level along with other key performance factors such as throughput and last successful requests. This will allow for granular tracking of indexing performance and smarter rejections of requests intended only for problematic index or shard. For more information, see the Github [issue](https://github.com/opensearch-project/OpenSearch/issues/478). 
- The observability plugin coming in 1.2 provides a unified view of the health of complex distributed applications from trace and log collected from various services and components of an application. This will empower developers, IT admins, and DevOps engineers to easily monitor application performance and availability, and provide the insights they need to diagnose issues faster, reducing application downtime. 
- OpenSearch 1.2 will include a centralized notification framework and notification plugin, which consolidates notifications functionality into a single plugin to enable central administration of notifications across all OpenSearch features. Alerting, Index Management and Reporting plugins will also be integrated with the Notification plugin.
- OpenSearch’s k-NN plugin will add support for the updated FAISS algorithm that provides better memory efficiency and improves the performance in large index generation.
- Within anomaly detection, users will now have visibility on how metrics/features contributes to an anomaly. With the attribution ratio from each input feature, users can understand the importance of input features.
- To ensure using OpenSearch is as easy to use as possible the intention is to release additional artifacts including MacOS x64, Deb x64, and RPM x64. 
- CCR! Yes, we are releasing it in 1.1, but for 1.2 the CCR specific index settings will be refactored from the core to the plugin to ensure plugin specific settings do not overcrowd the core. Why release it in 1.1 when we know we're going to come right back to it? Progress, not perfection. We wanted to get the feature out first and then refine the implementation in a subsequent release.

In addition to the OpenSearch work, we are also excited to share progress on a few related projects;

- Data Prepper: Data Prepper is a component of the OpenSearch project that accepts, filters, transforms, enriches, and routes data at scale. The [roadmap](https://github.com/opensearch-project/data-prepper/projects/1) for Data Prepper is now publicly available, as outlined in this [post](https://opensearch.org/blog/releases/2021/09/data-prepper-roadmap/). The plan is to enable Data Prepper to also ingest logs (and eventually metrics) in addition to trace data that it already supports from telemetry data collection agents, such as [Fluent Bit](https://fluentbit.io/), to the [Open Telemetry Collector](https://opentelemetry.io/docs/collector/). When Data Prepper 1.2 becomes available, it can become a single data ingestion component for log and trace data pipelines that can scale to handle stateful processing of complex events such as trace data, aggregation transforms, and log-to-metric calculations.
- Clients: Last week, we shared a [blog](https://opensearch.org/blog/community/2021/09/opensearch-py-js-go/) that the [Python](https://pypi.org/project/opensearch-py/), [JavaScript](https://www.npmjs.com/package/opensearch-js), and [Go](https://github.com/opensearch-project/opensearch-go) clients are public and ready for production use. The project team is moving forward in the public for the [Java](https://github.com/opensearch-project/opensearch-java) client and will soon make public repos available for .NET, Ruby, Rust, Perl, and PHP clients as well as the Hadoop and HDFS connectors. 

We knew OpenSearch would need to build a great open source community to succeed and we’re so excited about the progress! Not only is OpenSearch seeing some awesome contributions across the project but the [community partners](https://opensearch.org/partners/) continue to grow (5 more partners have joined since 1.0). As always, everyone should be incredibly proud of the accomplishment of reaching 1.1 together. Thank you for your continued support. 

As OpenSearch community continues to grow, we invite new users and members to contribute! If you’re interested in learning more, have a specific question, or just want to provide feedback and thoughts, please visit [OpenSearch.org](http://opensearch.org/), open an [issue on GitHub](https://github.com/opensearch-project/OpenSearch/issues), or post in the [forums](https://discuss.opendistrocommunity.dev/). There are also biweekly [Community Meetings](https://www.meetup.com/Open-Distro-for-Elasticsearch-Meetup-Group/) that include progress updates at every session and include time for Q&A.

That’s it. Until 1.2, thank you so much! 

Best wishes, 


Charlotte Henkle 
Senior Manager, Software Development
OpenSearch Project

Andrew Hopp
Senior Technical Product Manager
OpenSearch Project
