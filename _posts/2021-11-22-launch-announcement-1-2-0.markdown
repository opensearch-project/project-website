---
layout: post
title:  "OpenSearch 1.2.0 is out now!"
authors:
  - andhopp
date: 2021-11-23 08:50:01
categories:
  - releases
twittercard:
    description: "With this latest version of the OpenSearch distribution (OpenSearch, OpenSearch Dashboards, as well as plugins and tools) you can enjoy a number of new features and enhancements as well as improvements to stability and efficiency."
redirect_from: "/blog/releases/2021/11/launch-announcement-1-2-0/"
---


With this latest version of the OpenSearch distribution (OpenSearch, OpenSearch Dashboards, as well as plugins and tools) you can enjoy a [number of new features and enhancements](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-1.2.0.md) as well as improvements to stability and efficiency. A few highlights include:

* **New Observability Interface**: A new interface design for Observability in OpenSearch Dashboards that makes it easier to analyze and manage log and trace data. This new design includes an event explorer that makes it easy to search through log data across indexes with support for Piped Processing Language (PPL) querying. Additionally, there is a new PPL-based chart builder to construct visualizations from your log queries. Lastly, the new interface allows you to correlate your log and trace data: ![New Observability Interface]({{ site.baseurl }}/assets/media/blog-images/2021-11-22-Launch-Announcement-1-2-0/observ-screenshots.png){: .img-fluid }

* **Feature Attribution in Anomaly Detection**: A new API is available to provide an attribution ratio for each input feature to help you understand how they contributed to the anomaly. With this data, you can more quickly identify the cause of the anomaly.
* **Shard-level indexing back-pressure**: Optimize indexing back-pressure with new shard-level memory accounting as well as throughput, and last successful request factors.
* **'Match' query support in SQL and PPL**:  The [match query type](https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/#match) returns documents that match a provided text, number, date, or Boolean value for a specified field. The [Match](https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/#match) search query type is now supported in both query languages.
* **More efficient k-NN dense vectors**: k-NN now has support for the [Faiss](https://github.com/facebookresearch/faiss) library, allowing you to expand the size of feature vectors. The Faiss library brings efficient similarity search and clustering of dense vectors and allows for search in data sets of vectors in sizes larger than what fits in memory. 
* **Custom Dashboards Branding**: Align the look and feel of OpenSearch Dashboards to your own brand by providing a configurable logo, favicon, title, and more. 

![Custom Dashboard Branding]({{ site.baseurl }}/assets/media/blog-images/2021-11-22-Launch-Announcement-1-2-0/CustomBrandingSideBySide.png){: .img-fluid }

## What’s next?

With 1.2.0 launched, OpenSearch 1.3.0 is already in development! There are a number of upcoming feature and enhancements being worked on. A few highlights include:

* Custom GeoJson support in region maps
* Support for [additional input types](https://github.com/opendistro-for-elasticsearch/alerting/issues/47) in alerting
* [Drag and drop visualization creation](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/379) 
* A new [application analytics view](https://github.com/opensearch-project/trace-analytics/issues/131)

If you are curious, feel free to take a look at the [project roadmap](https://github.com/orgs/opensearch-project/projects/206) where you can find out the planned features and fixes with linked issues where you can provide feedback. 

## How can you contribute?

We would love to see you contribute to OpenSearch! For almost any type of contribution, the first step is opening an issue. Even if you think you already know what the solution is, writing a description of the problem you’re trying to solve will help everyone get context when they review your pull request. If it’s truly a trivial change (e.g. spelling error), you can skip this step – but when in doubt, open an issue. If you’re excited to jump in, check out the [“help wanted”](https://github.com/opensearch-project/OpenSearch/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) tag in issues.

## Do you have questions or feedback?

If you’re interested in learning more, have a specific question, or just want to provide feedback and thoughts, please visit [OpenSearch.org](https://opensearch.org/), open an issue on [GitHub](https://github.com/opensearch-project/OpenSearch/issues), or post in the [forums](https://discuss.opendistrocommunity.dev/). There are also regular [Community Meetings](https://opensearch.org/events/) that include progress updates at every session and include time for Q&A.

## Thank you!

We knew OpenSearch would need to build a great open source community to succeed and we’re so excited about the progress! Not only is OpenSearch seeing some awesome contributions across the project but the [community partners](https://opensearch.org/partners/) continue to grow (with 8 new partners since 1.0.0) and the recent launch of the [testimonials page](https://opensearch.org/testimonials/) that includes Dow Jones, Goldman Sachs, Quantiphi, Rackspace Technology, SAP, Wipro and Zoom. As always, everyone should be incredibly proud of the accomplishment of reaching 1.2.0 together.
