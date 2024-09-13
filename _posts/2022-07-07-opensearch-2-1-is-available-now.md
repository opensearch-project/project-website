---
layout: post
title:  "OpenSearch 2.1 is available now!"
authors:
  - dtaivpp
  - jamesmcintyre
date:   2022-07-07 11:59:00 -0700
categories:
  - releases
redirect_from: "/blog/releases/2022/07/opensearch-2-1-is-available-now/"
---

OpenSearch 2.1 is now [available for download](https://opensearch.org/downloads.html)! This release includes new features and significant enhancements aimed at boosting performance and expanding functionality for search, analytics, and observability use cases. OpenSearch 2.1 delivers a number of capabilities that have come up consistently in the OpenSearch community, including a dedicated node type for running machine learning (ML) workloads at scale, enhanced data protection capabilities, more flexible search options, and user interface upgrades.

This release builds on recently launched [OpenSearch 2.0](https://opensearch.org/blog/releases/2022/05/opensearch-2-0-is-now-available/), which brought new features and performance upgrades with Lucene 9 support, expanded ML tools, new monitoring and notifications capabilities, and more.

Check out the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.1.0.md) for a full view of what’s new in version 2.1, and read on for the highlights!

### **Dedicated resources for ML workloads**

Since we launched the ML Commons plugin with [OpenSearch 1.3](https://opensearch.org/blog/releases/2022/03/launch-announcement-1-3-0/), more and more users have been using OpenSearch to train and deploy large ML models on their data. These workloads, which use ML Commons, can demand a lot of processing resources, running the risk of negatively impacting the performance of critical tasks like search and ingestion when distributed across data nodes.

We heard from users that they’d like a way to isolate those ML tasks from their production indexes. Now, with [ML Nodes](https://github.com/opensearch-project/ml-commons/issues/79), you can configure a dedicated node type to host your ML workloads and go as big as you want with your ML models without worrying about the performance implications for your cluster. Setting up a dedicated ML Node is simple—you can configure the node to your specifications and add it to your cluster via the YAML file.

### **Automate snapshots with Snapshot Management**

OpenSearch provides [snapshots](https://opensearch.org/docs/latest/opensearch/snapshots/index/) to enable you to back up and restore a cluster’s indexes and state. In previous versions, you would need to manage your snapshots manually or with an external management tool. Community feedback has indicated a lot of interest in an automated process that can be managed within the OpenSearch suite.

With 2.1, you can now use the [Index Management (IM) plugin](https://opensearch.org/docs/latest/im-plugin/index/) to automate and manage your snapshots through the [Snapshot Management feature](https://opensearch.org/docs/latest/opensearch/snapshots/snapshot-management/). You can create a time-based Snapshot Management policy to specify the time interval or schedule for creating snapshots for a group of indexes and define how many of the snapshots to retain and for how long. You also get a nice UI to manage all Snapshots and Snapshot policies easily via Dashboards.

![Image: Notifications plugin]({{ site.baseurl }}/assets/media/blog-images/2022-07-07-opensearch-2-1-is-available-now/snapshot-management_80.gif){: .img-fluid }

Other notable upgrades in the 2.1 release include multi-terms aggregation, user interface updates, and increased zoom levels.

**Multi-terms aggregation** lets you create dynamic buckets from multiple term sources, with the ability to return a top number of results in a desired order. For example, you may want to support an analysis by searching the most recent 1,000 documents for the number of servers by location where the average CPU usage is greater than 90%, in descending order. Previously, this kind of search would only be available through OpenSearch Dashboards; with 2.1, [multi-terms aggregation](https://github.com/opensearch-project/OpenSearch/issues/1629) is part of OpenSearch core, enabling greater efficiency by distributing the search workload to all relevant OpenSearch nodes and then returning only the specified data to the dashboard.

**User interface updates** include a redesigned and reorganized header and menus across [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1583) to conserve visual space, simplify navigation, and give you more flexibility to organize custom menus.

**Increased zoom levels** offer OpenSearch Dashboards users deeper visualizations when viewing maps. You will be able to zoom in to maps at up to 14x on existing raster tiles, up from 10x. [This upgrade](https://github.com/opensearch-project/maps/issues/4) is now available across all versions of OpenSearch Dashboards, and because changes are enabled on the backend from the maps server, no cluster upgrade is required.

In closing, we want to extend our heartfelt thanks to the OpenSearch community for your feedback on—and contributions to—features that can make a big impact on OpenSearch builders. Stay tuned for more exciting developments on the [roadmap](https://github.com/orgs/opensearch-project/projects/206) from the 2.x release line, starting in August 2022 with OpenSearch 2.2. This release will include significant updates for security analytics, real-time observability tools, anomaly detection, memory management, and more. As always, we invite you to make your voice heard as part of the OpenSearch community through our [community meetings](https://www.meetup.com/OpenSearch/), [forum discussions](https://forum.opensearch.org/), and [GitHub repository](https://github.com/opensearch-project).

### Get started

You can download [OpenSearch 2.1 here](https://opensearch.org/downloads.html) ! Make sure to look over the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.1.0.md) and updated [documentation](https://opensearch.org/docs/latest) as you dive in.

