---
layout: post
title:  "OpenSearch 2.0 is now available!"
authors:
  - henkle
  - nknize
  - jamesmcintyre
  - mqureshi
  - seanzheng
date:   2022-05-26 09:45:00 -0700
categories:
  - releases
redirect_from: "/blog/releases/2022/05/opensearch-2-0-is-now-available/"
---
 
OpenSearch 2.0 is now generally available! This release incorporates user feedback and contributions from across the OpenSearch community to deliver a wealth of new capabilities and performance enhancements. We’re grateful for the collaborative effort of the community to build a distributed search and analytics toolset with the features, usability, and open-source flexibility that developers can rely on to create their most innovative solutions yet.

Here’s a look at some of the new features and enhancements you can benefit from with OpenSearch 2.0. You’ll find the full [release notes here](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.0.0.md). 

### **Lucene 9.1**

With the 2.0 release, OpenSearch has upgraded to Lucene 9.1 ([Lucene 9.1 documentation](https://lucene.apache.org/core/9_1_0/index.html)). The move to the latest version of Lucene affords a number of exciting advancements for this release and will continue to offer more value in future releases. For 2.0, this upgrade enables the following enhancements:

* **Performance optimizations** delivered with Lucene 9.1 include [10–15% faster indexing](https://lucene.apache.org/core/corenews.html#apache-lucenetm-900-available) of multi-dimensional points and sorting on fields indexed with points that is [now several times faster](https://lucene.apache.org/core/corenews.html#apache-lucenetm-900-available). Lucene 9’s ConcurrentMergeScheduler now assumes fast I/O, which likely improves indexing speed in cases where heuristics would incorrectly detect whether or not the system had modern I/O. Lucene 9 also changed all file formats from big-endian order to little-endian order, [speeding up decoding of postings lists](https://issues.apache.org/jira/browse/LUCENE-9027).
* **Java Jigsaw module support** means that with version 9.1, Lucene JARs are now proper Java modules, with module descriptors and dependency information. This aligns with the continuing evolution of OpenSearch to make the toolset more modular and extensible.  

### **Document-level Alerting**

**Document-level alerting** ([see GitHub issue](https://github.com/opensearch-project/alerting/issues/238)) allows users to create monitors that can generate alerts per document. Commonly used in security detection, these monitors use a similar approach as other types of alerting monitors available in OpenSearch: query level and bucket level. While those alerts use a summarized view of the data, document-level alerting can issue alerts on each document in the index, spotlighting which specific documents or records are triggering an alert in the monitor and avoiding monitoring gaps or data overlaps based on timestamps.

![Image: Document-level alerting]({{ site.baseurl }}/assets/media/blog-images/2022-05-26-opensearch-2-0-is-now-available/docLevelMonitor.gif){: .img-fluid }

### **Notifications**

A new **Notifications plugin** ([see GitHub issue](https://github.com/opensearch-project/notifications/issues/181)) adds a unified notifications system to OpenSearch. Users no longer need to configure and manage notification channels for each plugin independently; with version 2.0, the Notifications plugin provides a centralized location to set up and manage notifications for relevant OpenSearch plugins. For example, in addition to managing notifications for the Alerting plugin, this plugin can generate a notification when a scheduled action is completed in the [Index State Management](https://opensearch.org/docs/latest/im-plugin/ism/index/) (ISM) plugin.

![Image: Notifications plugin]({{ site.baseurl }}/assets/media/blog-images/2022-05-26-opensearch-2-0-is-now-available/notifications-short.gif){: .img-fluid }

### **ML Commons Upgrades**

Introduced with version 1.3, the **ML Commons plugin** ([see GitHub repo](https://github.com/opensearch-project/ml-commons) gains two new algorithms in version 2.0 to extend OpenSearch’s machine learning (ML) functionality to additional workloads, reduce the effort required to build ML features, and centralize computation, resource management, and security for ML processes. New algorithms for linear regression and localization join existing algorithms for kmeans and [Random Cut Forests](https://opensearch.org/blog/odfe-updates/2019/11/random-cut-forests/) to provide a comprehensive foundation for building and training ML models. The addition of linear regression aims to simplify development of ML models for predictive analysis; with localization, users can get a head start on developing ML approaches that reveal the key contributors to anomalies or any events that are detected, facilitating analyses and visualizations for root cause analysis and other use cases. 

### Replacing Non-inclusive Terminology

This release replaces non-inclusive terminology (such as master, blacklist) throughout OpenSearch with inclusive terminology (such as cluster manager, allowlist). ([See issue in GitHub](https://github.com/opensearch-project/OpenSearch/issues/2589)).

### RPM Package Manager

Version 2.0 follows version 1.3.2 to include the availability of **RPM Package Manager** distribution ([see GitHub issue](https://github.com/opensearch-project/opensearch-build/issues/27)). This simplifies installation of the OpenSearch distribution for Red Hat Linux-based operating systems. You can view compatible Linux versions [here](https://opensearch.org/docs/latest/opensearch/install/compatibility/).

### Breaking Changes and Continuing Support

OpenSearch follows Semantic Versioning, or [SemVer](https://semver.org/), so breaking changes are only included in major version releases, like this one. For version 2.0, the list of incompatible changes includes updates like the Lucene upgrades and inclusive terminology mentioned above as well as breaking changes in the Destination API that follow from the addition of the Notifications plugin, along with others. For a comprehensive list of breaking changes in version 2.0, refer to the [documentation](https://github.com/opensearch-project/OpenSearch/issues/2480).

Please note that we are continuing to support the OpenSearch 1.x release line. For more information about deprecation support, see [section 3.28 of our FAQ](https://opensearch.org/faq#q3.28).

### Contributing to the Project

Your thoughts and contributions make a real impact on the OpenSearch project! From Lucene upgrades to new plugins to ML advancements, this release includes many valuable contributions from the OpenSearch community. We extend our deepest thanks to everyone who contributed to OpenSearch 2.0.

If you’re interested in learning more, have a specific question, or just want to offer your feedback, please visit [OpenSearch.org](https://opensearch.org/), open an issue on GitHub for [OpenSearch](https://github.com/opensearch-project/OpenSearch/issues) or [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/issues), or post in the [forums](https://forum.opensearch.org/). There are also regular [Community Meetings](https://www.meetup.com/OpenSearch/) that include updates and time for Q&A in every session.

For almost any type of contribution, opening an issue is the first step. If you’re eager to jump in, check out issues with the “[help wanted](https://github.com/issues?q=is%3Aopen+is%3Aissue+user%3Aopensearch-project+label%3A%22help+wanted%22)” label.

### **Get Started**

You can download [OpenSearch 2.0 here](https://opensearch.org/versions/opensearch-2-0-0.html)! Be sure to take a look at the [release notes](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.0.0.md) and updated [documentation](https://opensearch.org/docs/2.0/) as you get started.



