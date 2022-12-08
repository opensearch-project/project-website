---
layout: post
title:  "OpenSearch 2.3.0 is ready for download!"
authors:
  - jamesmcintyre
date:   2022-09-14 12:15:00 -0700
categories:
  - releases
redirect_from: "/blog/releases/2022/09/opensearch-2-3-is-ready-for-download/"
---

[OpenSearch 2.3.0 is here](https://opensearch.org/downloads.html#opensearch) with new capabilities for you to explore! For this release, we prioritized three new features that OpenSearch users have been asking for and that offer significant advances in performance, data durability, and usability. We’re including them as experimental features so that you have the option to deploy them as you wish or stick with the default approach to these tasks. We hope you will put these features to work and share your feedback on how they perform in your environment, what added functionality you’d like to see, and any opportunities for improvement. Read on for a look at each new feature and where you can share your impressions.

### Segment replication

Segment replication offers a new approach to how OpenSearch replicates data, with performance improvements on high-ingestion workloads. Currently, OpenSearch uses a document replication strategy, which indexes the primary shard and each replica in parallel whenever documents are added to, removed from, or updated within an index. With document replication, each transaction needs to be rerun on each replica shard. With segment replication, you can opt to copy Lucene segment files from the primary shard to its replicas instead of having replicas rerun the operation. Because Lucene uses a write-once segmented architecture, only new segment files need to be copied; the existing ones will never change. This approach offers improved indexing throughput and lower resource utilization at the expense of increased network utilization and refresh times. 

To learn how to enable this feature, see [the documentation](https://opensearch.org/docs/latest/opensearch/segment-replication/index/). You’ll have the option to have some indexes within a cluster that use document replication and others that use segment replication. You can learn more about how this feature is designed, see some preliminary performance metrics, and provide your feedback on [this GitHub issue](https://github.com/opensearch-project/OpenSearch/issues/2194). 

### Remote-backed storage

With the introduction of segment replication, OpenSearch can now enable remote-backed storage as a new way to protect your clusters against data loss. With OpenSearch 2.3.0,  you have the option to automatically back up all transactions on an index to durable remote storage with your choice of cloud storage services. Previously, OpenSearch users could only mitigate hardware failures by backing up with snapshots or by adding replica copies of indexed data. These approaches have limitations: With snapshots, it’s possible to lose any data that was indexed since the last snapshot was taken, while adding and maintaining replicas can consume significant storage and processing resources.

Now this experimental feature lets you deploy remote-backed storage on a per index basis for your OpenSearch clusters using Amazon Simple Storage Service (Amazon S3), Azure Blob Storage, Google Cloud Storage, or Oracle Cloud Infrastructure (OCI) Object Storage. You can choose from a few different approaches to activating remote-backed storage, as detailed in the [feature documentation](http://opensearch.org/docs/latest/opensearch/remote).

We expect OpenSearch users will be excited about the increased data durability afforded by cloud-based backup and restore. We  look forward to your feedback on how this feature works with your clusters, which can be provided [here on GitHub](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2337).

### Drag-and-drop visualization

OpenSearch Dashboards provides a feature-rich set of tools to help you visualize and explore your data. Now we’re making it faster and more intuitive for you to generate visualizations from your data and tweak them on the fly. With this release, you can create visualizations with a drag-and-drop interface within your visualization canvas. You can change visualization types, index patterns, and data fields quickly and see suggestions for other visualizations based on the data features you’ve selected. 

Drag-and-drop visualization is an experimental feature for the 2.3.0 release, and we’re keen to capture your [feedback here](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2280). Give it a try and let us know what else you want to see in your data visualizations. For more information and how to apply it to your data, check out the feature’s [documentation](http://opensearch.org/docs/latest/dashboards/drag-drop-wizard/).

![Image: OpenSearch drag-and-drop]({{ site.baseurl }}/assets/media/blog-images/2022-09-14-opensearch-2-3-is-ready-for-download/opensearch_drag_and_drop.gif){: .img-fluid }

### Explore OpenSearch 2.3.0

OpenSearch 2.3.0 is ready for [download here](https://opensearch.org/downloads.html#opensearch)! This release also includes several updates and fixes to OpenSearch and OpenSearch Dashboards. Please see the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.3.0.md) for a comprehensive view of the latest updates, check out the latest [documentation](https://opensearch.org/docs/latest), and download version 2.3.0 to keep your OpenSearch tools up to date!
