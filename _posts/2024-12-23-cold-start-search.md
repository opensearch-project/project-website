---
layout: post
title:  "Solving the cold start search problem in OpenSearch"
authors:
 - aswath
 - kolchfa
date: 2024-12-23
categories:
 - technical-posts
meta_keywords:   
meta_description: 
has_math: false
has_science_table: true
---

When helping customers upgrade their workloads from older Elasticsearch versions to OpenSearch, we encountered a recurring issue: Customers complaint about slow initial searches that did not occur in their previous Elasticsearch clusters. This post explores the root cause and provides potential solutions.


## The Problem

After upgrading from Elasticsearch 6.x to higher versions of Elasticsearch and eventually to OpenSearch, customers report a pattern where the first search after a period of inactivity is slow but the subsequent searches are far more performant. After another period of search-inactivity, the cycle repeats. This issue is more prevalent in pre-production environments and not so much in a Live production environment which usually has continuous search activity. The SearchRate metric would look something like below
[Image: Image.jpg]

## What It's Not

Initially, this might seem like a cache warming problem. However, the pattern persists even for uncacheable queries. Both simple and complex queries are equally affected, so to the query complexity also doesn't seem to be a factor. Slow logs do not record these as slow queries. Therefore we can rule out this to be a cache warming problem.


## The Root Cause

After investigating [search slow logs](https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/logs/#shard-slow-logs), other related settings and [profiling the query](https://opensearch.org/docs/latest/api-reference/profile/), we identified the issue to be related to the following settings.


1. `refresh_interval` — In OpenSearch, indexing places documents in a memory buffer where they are not yet searchable. A refresh operation transfers these documents to segments, making them searchable. The default `refresh_interval` of 1s which is how OpenSearch achieves NTR search (Near Real Time). If this is not explicitly set, idle shards (as determined by `index.search.idle.after`) won't refresh until they receive a search request.
2. `index.search.idle.after` defines how long a shard can go without search or get requests before being considered idle. Default is `30s`. Idle shards pause automatic refreshes, potentially improving bulk indexing performance by reducing refresh frequency. This setting was introduced in Elasticsearch 7.0


Tying this back to the problem, after a workload is upgraded from Elasticsearch 6.x to OpenSearch (or a higher version of Elasticsearch), a search request that comes in after a period of inactivity is not processed immediately but rather triggers the index refresh and waits for the refresh to be completed before the search request is executed. This is due to the `index.search.idle.after` pausing the refresh as described previously. Immediate subsequent searches are processed immediately since the refresh is now occurring every second. This provides an explanation as to why customers did not experience this problem with older Elasticsearch versions (pre-7.0) but did encounter it with Elasticsearch 7.0-7.10 and OpenSearch. The intensity of the slowness of the initial search would depend upon when the last refresh happened and how much data was ingested since then, since the amount of time to complete the refresh will depend upon how much data there is to be refreshed. This problem is also prevalent in non-live/non-prod environments which usually do not receive continuous search traffic.

## Potential Solutions

Explicitly setting `refresh_interval` to 1s would fix the problem but by doing so, the purpose of `index.search.idle.after` is defeated. It is therefore important to understand the type of search workload and the NRT requirements for a suitable solution. Below are some of the scenarios and recommendations for each. 


* Search activity is heavy during 9 to 5 and indexing is done during non-business hours, then its better to leave the default behaviour as it is and perform a [manual refresh](https://opensearch.org/docs/latest/api-reference/index-apis/refresh/) right before the business hour begins or as soon as the nightly index is finished.
* A write heavy use case such as Observability/Log Analytics where search latency and NTR search requirements are generally not as strict as in an eCommerce search use case, increasing `refresh_interval` to 30s or 60s would make sense. Setting the `refresh_interval` explicitly would remove the interference from the i`ndex.search.idle.after` setting.
* For a read heavy use case with sporadic writes, setting the `refresh_interval` explicitly to 1s would remove the interference from i`ndex.search.idle.after` setting and achieve NRT searchability.
* A use case where the search latency, NTR search, indexing throughput are all equally important, it is once again recommended to keep the default settings unchanged. Decision on the `refresh_interval` setting should not be based off the behaviour seen in non-live system since the search inactivity rate between a live and a non-live system are different.
* You can also consider increasing the `index.search.idle.after` (e.g., to 5 or 10 minutes). In cases where search pattern is predictable and the frequency of searches is known, it may be beneficial to increase the `index.search.idle.after` setting to a higher value.

## Conclusion

While setting the refresh interval explicitly can fix the issue, it's essential to consider your specific use case and workload patterns. The optimal solution depends on whether your priority is write performance or consistent search responsiveness or find a sweet spot between both of them.

For more information on optimizing refresh intervals, check out the blog post on [how to optimize OpenSearch Refresh Interval](https://opensearch.org/blog/optimize-refresh-interval/).

Remember, in production environments with continuous search activity, this issue is less likely to occur. Always test thoroughly in your specific environment to find the best configuration for your needs.







