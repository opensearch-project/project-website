---
layout: post
title:  "What’s new: Document-level monitors"
authors:
- ashiasgr
- jdbright
date: 2022-07-13
categories:
 - technical-post
redirect_from: "/blog/technical-post/2022/07/whatsnew-document-level-monitors/" 
---

In OpenSearch 2.0, OpenSearch released document-level monitors. With document-level monitors, alert creators can monitor documents as they are indexed in OpenSearch. If an alert is configured on a document-level monitor, the alert returns a reference to the document that triggered the alert. In this blog post, we will provide the following:

* A quick review of query—and bucket-level monitors
* An introduction to document-level monitors

### Quick review

For those who want to get up to speed on the OpenSearch alerting offering, refer to the [“Introduction to OpenSearch Alerting”](https://opensearch.org/blog/partners/2021/10/alerting-intro/) blog post. Before we jump into document-level monitors, let’s take a quick look at the monitors OpenSearch already offers:

* With query-level monitors, you specify a query, and the monitor uses that query to review documents based on a timestamp of when they were indexed. If an alert is configured on a monitor, the results of the alert are returned in aggregate (e.g., one alert was triggered in the last review of newly indexed documents). This type of alert is used when you need an alert set up quickly. Since query-level monitors are so easy to setup, it is recommended to review query-level monitors regularly to see if they be combined or migrated to bucket-level to save on performance.
* With bucket-level monitors, you can set up an aggregate of something (e.g., hosts) and run multiple queries against that aggregate (e.g., host CPU usage, host memory usage, hostname). Bucket-level monitors make it easier to manage what would take many query-level monitors to accomplish. Like query-level monitors, bucket-level monitors  use a scheduled time to review what has been indexed as part of the monitor, and those results are provided in aggregate. Bucket-level monitors can be used to help with maintainability of alerting rules (e.g., rules for hosts, rules for IP addresses, rules for errors).

### Introducing document-level monitors

Instead of an aggregate report, what if you want to see which documents are triggering an alert? That’s where document-level monitors come in. Document-level monitors allow for multiple queries and will tell you which documents triggered an alert when an alert is configured. Knowing which documents triggered an alert means you can dive deep into an analysis, whether of a service outage or a security incident. Document-level monitors feature a new concept called a [findings index](https://opensearch.org/docs/latest/monitoring-plugins/alerting/monitors/#document-findings). When a document-level monitor executes a query that matches a document in an index, a finding is created. A finding will store the document ID, index name, matching query, and timestamp indicating when it was found. OpenSearch provides a findings index(.opensearch-alerting-finding) that contains findings data for all document-level monitor queries. You can search the findings index with the [Alerting API search operation](https://opensearch.org/docs/latest/monitoring-plugins/alerting/api/#search-for-monitor-findings). This means you can look at all of the findings at a later date for audit purposes. Additionally, query-level and bucket-level monitors can be used to monitor the findings index to alert on the data at a less granular level.

*With granularity comes great responsibility*

Document-level monitors, when configured with an alert, will alert on each document they find. That means someone will have to acknowledge each document that triggers an alert. Alerts should be written precisely so as to avoid the fatigue of acknowledging numerous alerts that do not require attention/action. If your use case doesn’t require document-level granularity or if you have performance concerns, query- or bucket-level alerts are better suited.

### Summary

With OpenSearch 2.0, document-level monitors were released, adding document-level traceability and a new findings index that make it easy to dive deep into the details of what caused an alert. For those who don’t need a granular view, OpenSearch offers query- and bucket-level monitors to provide an aggregate view. Do you see a use case for using document-level monitors in your organization not covered by this blog post? The team and community would benefit from hearing about it, so feel free to submit a [blog proposal on Github](https://github.com/opensearch-project/project-website/issues/new?assignees=&labels=new+blog%2C+enhancement&template=blog_post.md&title=).

To learn more about using document-level monitors in OpenSearch Dashboards, see [Monitors](https://opensearch.org/docs/latest/monitoring-plugins/alerting/monitors/#per-document-monitors). If you find an issue with document-level monitors, submit an issue in [Github](https://github.com/opensearch-project/alerting/issues).
