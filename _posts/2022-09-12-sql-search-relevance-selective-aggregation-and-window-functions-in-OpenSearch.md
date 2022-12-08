---
layout: post
title:  "SQL search relevance, selective aggregation, and window functions in OpenSearch"
authors:
- daichen
- jdbright
date: 2022-09-12
categories:
 - technical-post
redirect_from: "/blog/technical-post/2022/09/sql-search-relevance-selective-aggregation-and-window-functions-in-OpenSearch/"
---

According to a [review by IEEE Spectrum in 2022](https://spectrum.ieee.org/top-programming-languages-2022), SQL is the sixth most popular programming language. IEEE came to this conclusion by pulling and weighting data across GitHub, Google, Stack Overflow, Twitter, and IEEE Xplore. Did you know that OpenSearch offers a way to [query OpenSearch using SQL](https://opensearch.org/blog/feature/2022/02/feature-deep-dive-opensearch-sql-basic-queries/)? In recent releases, the SQL plugin included support for search relevance, selective aggregation, and window functions. You can use the REST API or use the OpenSearch Query Workbench to query OpenSearch using the SQL plugin. Today, we will use the Query Workbench inside the OpenSearch Playground environment to walk through search relevance, selective aggregation, and window functions.

We’ll use [sample data](https://playground.opensearch.org/app/home#/tutorial_directory) that everyone can access through the [playground environment](http://openseach.playground.com/) or the [demo Docker install](https://opensearch.org/docs/latest/opensearch/install/docker/). First, add “Sample web logs” if they aren’t already added. Next, open the [Query Workbench](https://playground.opensearch.org/app/opensearch-query-workbench). Now let’s dive in. Let’s say that you were a security researcher and wanted to keep track of your system activity. You can use search relevance, selective aggregation, and window functions to monitor this activity.

### Search relevance

Search relevance is a powerful tool that allows you to search through data, such as logs, to find specific documents. In the example below you can use count to determine how many logs fit your selected criteria.

Search through logs by client IP addresses and error counts for GET requests resulting in a 503 server error:

```
SELECT clientip, COUNT(*) AS cnt
FROM opensearch_dashboards_sample_data_logs
WHERE MATCH(message, "GET 503", operator="AND")
GROUP BY clientip
ORDER BY cnt DESC
```

Additionally, the highlight function returns text with matched terms highlighted:

```
SELECT clientip, HIGHLIGHT(message)
FROM opensearch_dashboards_sample_data_logs
WHERE MATCH_PHRASE(message, "Linux x86_64")
```



### Selective aggregation

Selective aggregation is useful when you want to understand a total of something across an entire dataset. The SQL plugin will also allow you to filter with certain criteria. Say you want to keep track of large file transfers in your system in order to react to someone moving sensitive data outside of your place of work. In the example below, [selective aggregation](https://github.com/opensearch-project/sql/blob/main/docs/user/dql/aggregations.rst#filter-clause) is used to determine how many HTTP requests were submitted where the bytes count was higher than 10,000:

```
SELECT
    COUNT(*) AS totalReq,
    COUNT(*) FILTER(WHERE bytes > 10000) AS totalLargeReq
FROM opensearch_dashboards_sample_data_logs
```



### Window functions

[Aggregate window functions](https://github.com/opensearch-project/sql/blob/main/docs/user/dql/window.rst#aggregate-functions) provide users an easy way to calculate aggregate results over a custom window of time. For example, if you wanted to understand how many web calls occurred each day in order to identify abnormal traffic patterns, you could use the following statement:

```
SELECT
    date,
    SUM(dailyCnt) OVER(ORDER BY date) AS cumulative
FROM (
    SELECT
     DATE_FORMAT(timestamp, '%Y/%m/%d') AS date,
     COUNT(*) AS dailyCnt
    FROM opensearch_dashboards_sample_data_logs
    GROUP BY date
) AS tmp
ORDER BY date
```

But what if you wanted to monitor the top 10 websites visited by employees of your company? You could use a classic top-K elements per group problem. The following statement queries the top 10 most visited URLs for each day by using the [ranking window function](https://github.com/opensearch-project/sql/blob/main/docs/user/dql/window.rst#ranking-functions):

```
SELECT date, url, cnt
FROM (
    SELECT
     date, url, cnt,
     RANK() OVER(PARTITION BY date ORDER BY cnt DESC) AS rnk
    FROM (
      SELECT
        DATE_FORMAT(timestamp, '%Y/%m/%d') AS date,
        url AS url,
        COUNT(*) AS cnt
      FROM opensearch_dashboards_sample_data_logs
      GROUP BY date, url
    ) AS a
) AS r
WHERE rnk <= 10
ORDER BY date, rnk
```

How are you using OpenSearch’s SQL in your environment? Do you have use cases that have worked for you? We would love to hear about it! As always, if you don’t see functionality you would like or want to get involved, please visit the [SQL Github repository](https://github.com/opensearch-project/sql) to file an issue.
