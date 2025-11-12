---
layout: post
title:  "Better observability, deeper insights: OpenSearch's new Piped Processing Language Capabilities"
authors:
- anasalkouz
- ritvibhatt
  date: 2025-10-29
  categories:
- technical-post
  meta_keywords: Piped Processing Language, PPL, observability, log analytics, troubleshoot applications, monitor system performance, analyze security events, CLI tool, Combine datasets within single query, Time-series analysis, Unstructured log processing at query time, Complex data type support.
  meta_description: OpenSearch's Piped Processing Language (PPL) evolves significantly with new and enhanced capabilities that reshape how you handle log analytics and observability workflows. This comprehensive update streamlines how you troubleshoot applications, monitor system performance, and analyze security events, providing essential tools to extract meaningful insights from your observability data. Through enhanced features and refined functionality, teams can navigate complex log analysis with greater precision and clarity.
  has_math: false
  has_science_table: false
---

OpenSearch's Piped Processing Language (PPL) evolved significantly with new and enhanced capabilities that reshape how you handle log analytics and observability workflows. This comprehensive update streamlines how you troubleshoot applications, monitor system performance, and analyze security events, providing essential tools to extract meaningful insights from your observability data. Through enhanced features and refined functionality, teams can navigate complex log analysis with greater precision and clarity.

## What's new in OpenSearch PPL?
Let's explore the new PPL commands and functions through practical examples of common log analytics use cases. These examples demonstrate how PPL enhanced capabilities can help you analyze logs more effectively, from combining multiple data sources to processing unstructured log data and performing time-series analysis. We'll also cover significant performance improvements in this release, including the integration with Apache Calcite as the query engine.

### 1. New commands and functions
The OpenSearch 3.3 (https://opensearch.org/blog/explore-opensearch-3-3/) release marks a substantial expansion of PPL functionality with the introduction of 9 new commands and 15 functions. The syntax of existing commands has also been refined for improved usability, creating a more intuitive experience for users across various analytical scenarios. Below are scenarios where new commands and functions can help you analyze your data:

#### Combine datasets within single queries ####
This release enhances PPL data manipulation capabilities with new commands for flexible data combination and field operations. The `append` command combines results from multiple queries into a unified dataset, enabling users to merge data from different sources or time ranges within a single operation. The `join` command combines two datasets together, the left side could be an index or results from piped commands, the right side could be either an index or a `subsearch`.

The following example combines web log data with geographical IP data. Which allows you to see which countries generate the most traffic using `join` command:
```
PPL> source = web_logs
  | join type=inner client_ip [source=ip_geodata]
  | stats count() as total_requests by country
  
# Result
┏━━━━━━━━━━┳━━━━━━━━━━━━━━┓
┃ country  ┃total_requests┃
┡━━━━━━━━━━╇━━━━━━━━━━━━━━┩
│ USA      │ 5            │
├──────────┼──────────────┤
│ Canada   │ 3            │
├──────────┼──────────────┤
│ UK       │ 1            │
└──────────┴──────────────┘
```

#### Time-series analysis ####
PPL introduces streamlined temporal and distribution analysis with new `timechart`, `bin` and `eventstats` commands. The `timechart` command aggregates data over time intervals with flexible span controls, automatically handling time gap filling and result ordering for time-series analysis. It provides visualization-ready formatting with time as the primary axis and supports grouping by additional fields. The `bin` command automatically groups numeric data into ranges or buckets, facilitating distribution analysis for understanding data spread and frequency patterns. The `eventstats` command, which is essential for generating summary statistics from fields in events while *preserving* the original events.

These commands make temporal pattern analysis and data distribution modeling more accessible within PPL queries, allowing users to identify trends and outliers directly through query operations. The `earliest` and `latest` functions retrieve timestamp-based values, enabling time-series analysis by finding the earliest or latest occurrence of values within groups based on their timestamps.

The following example groups Logs data into 1-hour intervals and count number of logs for each severity level within these intervals using `timechart` command:
```
PPL> source=demo-logs-otel-v1-* 
    | timechart span=1h count() by severityText
```
When running this query in OpenSearch Dashboards, the visualization shows....

![Visualization tab in Discover page](/assets/media/blog-images/2025-10-29-opensearch-new-ppl-capabilities/timechart.png)

#### Unstructured log processing at query time #### 
Text processing features have been included in PPL with the addition of `regex`, `rex`, and `spath` commands. These features enable users to filter, extract, and parse unstructured text directly at query time without requiring data preprocessing. The `regex` command provides pattern-based filtering to isolate relevant log entries, while `rex` extracts structured fields from raw text using regular expressions. The `spath` command extracts fields from JSON data, enabling access to nested objects and arrays. Together, these commands enable instant adaptation to new log formats without requiring reindexing operations, allowing users to analyze previously unstructured data immediately.

The following example extracts structured information from the log message like logLevel,userid and sourceip using `rex` command:

```
PPL> source=app_logs 
    | rex field=message '\[(?<loglevel>\w+)\] (?<action>.*) for userId=(?<userid>\d+).*IP=(?<sourceip>[\d\.]+)' 
    | head 5 
    | fields loglevel, action, userid, sourceip

# Results
┏━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━┳━━━━━━━━━━━━━━━┓
┃ loglevel┃ action                    ┃ userid ┃ sourceip      ┃
┡━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━╇━━━━━━━━━━━━━━━┩
│ ERROR   │User authentication failed │ 12345  │ 192.168.1.100 │
├─────────┼───────────────────────────┼────────┼───────────────┤
│ ERROR   │User authentication failed │ 12346  │ 192.168.1.101 │
├─────────┼───────────────────────────┼────────┼───────────────┤
│ INFO    │ Successful login          │ 12347  │ 192.168.1.102 │
├─────────┼───────────────────────────┼────────┼───────────────┤
│ ERROR   │User authentication failed │ 12345  │ 192.168.1.100 │
├─────────┼───────────────────────────┼────────┼───────────────┤
│ INFO    │ Password reset requested  │ 12346  │ 192.168.1.101 │
└─────────┴───────────────────────────┴────────┴───────────────┘
```


#### Complex data type support
With these latest upgrades, customers have the ability to perform complex data transformations at *search time* rather than *index time*. The existing PPL function set works well for primitive data types (e.g., strings, numbers, timestamps). We increase the support to cover complex data types with multi-value statistics aggregation functions `(list, values)`. The  `list` and `values` functions collect multiple values into structured arrays during aggregation operations with `list` preserving duplicates while `values `return unique values. The `mvjoin` function combines multi-value fields into single strings using specified delimiters, enabling array manipulation within queries.

The following example analyze the User journey while they navigate across pages, and identifying common navigation patterns using `values` function:

```
PPL> source=user_activity 
    | stats 
        values(page_url) as navigation_path,
        max(duration) as max_duration,
        avg(duration) as avg_duration
        by session_id
    | eval path_length = array_length(navigation_path)
    | where path_length > 3
    | sort max_duration desc

# Results
┏━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━━━━━┓
┃session_id┃ navigation_path                                           ┃max_duration┃avg_duration┃path_length┃
┡━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━╇━━━━━━━━━━━━╇━━━━━━━━━━━┩
│sess_005  │ ["/home","/products","/product/789","/cart","/checkout"]  │ 300        │ 186        │ 5         │
├──────────┼───────────────────────────────────────────────────────────┼────────────┼────────────┼───────────┤
│sess_002  │ ["/home","/search","/product/123","/cart"]                │ 300        │ 142.5      │ 4         │
├──────────┼───────────────────────────────────────────────────────────┼────────────┼────────────┼───────────┤
│sess_001  │ ["/home","/products","/product/456","/cart","/checkout"]  │ 240        │ 156        │ 5         │
├──────────┼───────────────────────────────────────────────────────────┼────────────┼────────────┼───────────┤
│sess_003  │ ["/home","/blog","/blog/post-1","/blog/post-2","/contact"]│ 240        │ 129        │ 5         │
└──────────┴───────────────────────────────────────────────────────────┴────────────┴────────────┴───────────┘
```

### 2. Performance enhancements
Historically, we've rolled our own custom query optimizer. In 3.0, we switched the query optimizer to be based on [Apache Calcite](https://opensearch.org/blog/enhanced-log-analysis-with-opensearch-ppl-introducing-lookup-join-and-subsearch/) as an experimental feature. In 3.3, we are using Apache Calcite as the default query optimizer, which brings powerful query optimization capabilities including rule-based and cost-based optimizers. To validate PPL performance capabilities, we've built a robust benchmarking infrastructure. The PPL Big5 datasets provide standardized performance testing across different analytical scenarios, enabling evaluation of PPL queries under various conditions and workload patterns. Automated nightly benchmarks run to ensure consistent quality and help identify any performance regressions. Public dashboards offer transparency into PPL query performance, giving users visibility into how the query engine performs across different scenarios and query types. You can access the nightly benchmarks for Big5 PPL at the OpenSearch Benchmarks page (https://opensearch.org/benchmarks/).

With Calcite, PPL shows significant performance improvements over the previous version. This includes pushing down the majority of the PPL commands and function execution to OpenSearch DSL and avoiding heavy post-processing, implementation of composite aggregations, enhanced support for date histogram aggregations, improved memory management for large result sets, and better handling of high-cardinality fields. For example, the Big5 PPL date_histogram_hourly_agg query is now 160x faster, reducing execution time from 2.5 seconds to just 15 milliseconds. These improvements directly benefit common observability use cases such as log analysis and time-series data exploration. For complete benchmark results and performance metrics, visit our nightly [benchmark dashboard](https://opensearch.org/benchmarks/).

## Getting started with the CLI tool

You can explore new PPL features today without upgrading your existing OpenSearch domain. The OpenSearch CLI tool allows you to test new PPL features on older version domains and this enables you to verify functionality before committing to a full domain upgrade.

Here's how to get started:

1. Install the latest version of the CLI tool: Follow the installation steps outlined in the [CLI tool readme](https://github.com/opensearch-project/sql-cli/blob/main/README.md#installation-steps), which includes the new PPL capabilities.
2. Connect to your OpenSearch cluster: You can connect to a local or remote cluster. Upon connection, you'll see information about your cluster version, SQL/PPL version, and default settings
3. Start exploring new PPL commands.

```
# Connect to your remote OpenSearch cluster
opensearchsql -e https://your-cluster-endpoint:your-port -u username:password
    ____                  _____                      __
  / __ \____  ___  ____ / ___/___  ____ ___________/ /_
 / / / / __ \/ _ \/ __ \\__ \/ _ \/ __ `/ ___/ ___/ __ \
/ /_/ / /_/ /  __/ / / /__/ /  __/ /_/ / /  / /__/ / / /
\____/ .___/\___/_/ /_/____/\___/\__,_/_/   \___/_/ /_/
    /_/

OpenSearch: v3.1.0
Endpoint: https://your-cluster-endpoint:your-port
User: admin
SQL: v3.3.0.0
Language: PPL
Format: TABLE

PPL> source=user_activity | where duration > 200 | head 3
Executing: source=user_activity | where duration > 200 | head 3

Result:
Fetched 3 rows with a total of 3 hits
┏━━━━━━━━━━┳━━━━━━━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┓
┃ duration ┃ page_url     ┃ session_id ┃ @timestamp          ┃ user_id ┃
┡━━━━━━━━━━╇━━━━━━━━━━━━━━╇━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━┩
│ 240      │ /product/456 │ sess_001   │ 2025-10-08 10:05:00 │ user123 │
├──────────┼──────────────┼────────────┼─────────────────────┼─────────┤
│ 240      │ /product/456 │ sess_001   │ 2025-10-08 10:05:00 │ user123 │
├──────────┼──────────────┼────────────┼─────────────────────┼─────────┤
│ 300      │ /product/123 │ sess_002   │ 2025-10-08 10:18:00 │ user456 │
└──────────┴──────────────┴────────────┴─────────────────────┴─────────┘
```



## Get involved with PPL

The future of PPL depends on community involvement and feedback. We encourage users to explore these new features through the CLI tool and share their experiences in the OpenSearch community. Whether you're discovering new use cases or encountering challenges, your input helps shape the future of our observability capabilities. Our [template](https://github.com/opensearch-project/sql/issues/new?template=ppl_bug_report.md) makes reporting simple and effective.

For more information, check out:

* PPL Documentation: https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/index.rst
* PPL Roadmap: https://github.com/opensearch-project/sql/issues/4287
* OpenSearch Slack: https://opensearch.org/slack/