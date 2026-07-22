---
layout: post
title:  "Solving the cold start search problem in OpenSearch"
authors:
 - aswath
 - allan
 - kolchfa
date: 2025-01-07
categories:
 - technical-posts
meta_keywords: cold start search, OpenSearch refresh interval, search latency, search performance optimization  
meta_description: Explore the cold start search problem in OpenSearch after upgrading from older Elasticsearch versions. Learn about the root causes and discover practical solutions to optimize search performance for various workload scenarios.
has_math: false
has_science_table: true
---

Upgrading to OpenSearch offers many advantages, but it can also introduce unexpected challenges. One such issue we've encountered while assisting with upgrades from older Elasticsearch versions is the "cold start search" problem. You might notice that the first search after a period of inactivity is unusually slow, even though subsequent searches perform as expected. This blog post will explore the root cause of this behavior and offer potential solutions tailored to your needs.

## Understanding the cold start search problem

After upgrading from Elasticsearch 6.x to OpenSearch (or even to later Elasticsearch versions), you may see a pattern: the first search after some inactivity is slow, while subsequent searches run much faster. After another idle period, the slow search recurs. This issue is particularly noticeable in non-production environments, where search activity isn't as constant as in live systems. The following image presents a typical search rate metric illustrating this behavior.

![Search rate metric](/assets/media/blog-images/2024-12-23-cold-start-search/search-metric.png)

At first glance, this might look like a cache-warming issue. However, the pattern persists even for queries that don't use caching. Both simple and complex queries are affected equally, and slow logs don't identify these as slow queries. This means that caching or query complexity isn't the cause of the problem.

## Uncovering the root cause

Through detailed investigation using [search slow logs](https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/logs/#shard-slow-logs) and [query profiling](https://opensearch.org/docs/latest/api-reference/profile/), we traced the root cause to two key settings in OpenSearch:  

- **`refresh_interval`**: OpenSearch buffers newly indexed documents in memory until a refresh operation transfers them to searchable segments. By default, `refresh_interval` is set to 1 second for near real-time (NRT) search. However, if a shard becomes idle (determined by the `index.search.idle.after` time period), it stops refreshing until a search request triggers a refresh.

- **`index.search.idle.after`**: This setting defines how long a shard can stay idle before it stops automatic refreshes. Its default value is 30 seconds. While this improves bulk indexing performance by reducing refresh frequency, it introduces a delay for the first search after a period of inactivity.

When upgrading from Elasticsearch 6.x to OpenSearch or Elasticsearch 7.x, this behavior can cause the first search after a long idle period to wait for the refresh to complete before executing. Older Elasticsearch versions didn't exhibit this behavior because `index.search.idle.after` didn't exist. The severity of the delay depends on how much data needs to be refreshed, which in turn depends on how much indexing occurred during the idle period.

## Practical solutions for cold start searches

The best way to address this issue depends on your workload. Below are some common scenarios and recommended solutions:

- **Predictable business hours with idle periods**  
  If your search activity is heavy during specific times (for example, during typical 9--5 work hours) and indexing happens off-hours, you can leave the default settings in place. Perform a [manual refresh](https://opensearch.org/docs/latest/api-reference/index-apis/refresh/) before the busy period begins or right after nightly indexing completes.

- **Write-heavy use cases (for example, observability or log analytics)**: For workloads where search latency isn't as critical, increasing `refresh_interval` to 30 or 60 seconds can improve indexing performance. Explicitly setting `refresh_interval` avoids interference from `index.search.idle.after`.

- **Read-heavy use cases with sporadic writes**: Setting `refresh_interval` to 1 second ensures NRT search and eliminates delays caused by idle shards.

- **Balanced workloads (where search latency, indexing, and NRT results are equally important)**: Retain the default settings. Don't base your decision on behavior in non-production systems because live systems typically have more consistent search activity.

- **Predictable but infrequent searches**: Consider increasing `index.search.idle.after` to 5 or 10 minutes if search patterns are predictable. This reduces refresh overhead without affecting responsiveness during active periods.

## Conclusion

Addressing the cold start search problem requires understanding your specific workload and priorities. Explicitly setting `refresh_interval` or adjusting `index.search.idle.after` can help, but each solution comes with trade-offs. For most production systems, this issue is less likely to occur because of continuous search activity.

Always test these configurations in your environment to find the right balance for your needs. For more tips on optimizing refresh intervals, check out our [blog post on optimizing OpenSearch refresh intervals](https://opensearch.org/blog/optimize-refresh-interval/).
