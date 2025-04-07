---

layout: post
title: "What's new in OpenSearch Query Insights: Advanced grouping, dashboards, and historical analysis"
authors:
   - chenyang
   - kolchfa
date: 2025-03-31
categories:
  - technical-posts
meta_keywords: OpenSearch query insights, query grouping, query similarity, query dashboards, search performance, query optimization, query latency, search analytics, resource monitoring, OpenSearch Dashboards
meta_description: Explore recent advancements in OpenSearch Query Insights, featuring query grouping by similarity, a dedicated Dashboards plugin for visualization and configuration, a local index exporter for historical analysis, and new plugin health monitoring capabilities.
---

OpenSearch Query Insights gives you essential visibility into how search queries perform, helping you understand how queries run and how they use cluster resources. Since introducing [Query Insights](https://opensearch.org/blog/query-insights/), we've aimed to provide tools that help you identify performance bottlenecks and optimize your queries---ultimately improving the search experience for your users. Analyzing queries effectively is key to maintaining fast, efficient search operations.

Based on that foundation and shaped by your feedback, we've continued to develop Query Insights. This post introduces several new features that bring deeper analytical capabilities through advanced query grouping, improved usability with a dedicated dashboard, historical analysis using export options, and better operational monitoring of the Query Insights system itself.

## Grouping similar queries to improve analysis

When reviewing top N query lists---ranked by latency, CPU usage, or memory---you might notice that many entries represent queries that are structurally similar but differ only in literal parameter values. These repeated patterns can make it harder to spot other unique, resource-intensive queries that need attention.

To address this, Query Insights now supports **query grouping by similarity**. This feature lets the system group queries based on their core structure, ignoring variations in specific values like search terms or filters.

**How it works:** When enabled, Query Insights analyzes incoming queries to extract their core structure. For example, these two queries target the same field but use different values:

```json
// Query 1
{ "query": { "term": { "user_id": "valueA" } } }

// Query 2
{ "query": { "term": { "user_id": "valueB" } } }
```

With similarity grouping enabled, both queries are placed in the same group, defined by the structure `query → term → user_id`. Query Insights then shows aggregate metrics for the group, such as average latency, total execution count, and combined resource usage, along with a representative query example.

**How to enable it:** You can turn on similarity grouping by updating your cluster settings. The default value (`none`) disables grouping:

```json
PUT _cluster/settings
{
  "persistent" : {
    "search.insights.top_queries.group_by" : "similarity"
  }
}
```

You can also fine-tune grouping behavior by configuring whether field names or types influence the similarity structure. For more information, see [Grouping top N queries](https://opensearch.org/docs/latest/observing-your-data/query-insights/grouping-top-n-queries/).

**Why it matters:** This feature shifts the focus from individual queries to shared query patterns. It helps you find and improve high-impact query structures more effectively, making root cause analysis and performance tuning easier.

## Explore query insights using a visual dashboard

The Query Insights API gives you direct access to performance data, but a visual interface can make it easier to spot patterns and fine-tune settings. That’s why we’ve added **Query Insights to OpenSearch Dashboards**---a dedicated experience built into the Dashboards interface.

This view includes several key features:

- **Top N queries view:** See a sortable, filterable list of the top N queries or query groups, ranked by metrics like latency, CPU usage, or memory. You can filter results by time range, index, search type, and coordinator node ID. Key performance data is displayed in a clear table layout, as shown in the following image.  
   ![Query Insights Dashboards - Top Queries Overview](/assets/media/blog-images/2025-03-31-query-insights-updates/top-queries-overview.png)

- **Query details page:** Click a query ID to view detailed information. For individual queries, you'll see the full query body, execution timestamps, CPU and memory usage, phase-level latency, and metadata such as index, node, and shards. For grouped queries, the page presents aggregate metrics like average latency and total count, along with a representative query example, as shown in the following image.  
   ![Query Insights Dashboards - Details Page](/assets/media/blog-images/2025-03-31-query-insights-updates/top-queries-details.png)

- **Configuration interface:** Adjust settings directly from the dashboard instead of using the API. You can enable or disable monitoring for specific metrics, set the monitoring window (`window_size`), control how many queries to track (`top_n_size`), choose the grouping strategy (`group_by`), and configure export settings—all through simple, interactive controls, as shown in the following image.  
   ![Query Insights Dashboards - Configuration Page](/assets/media/blog-images/2025-03-31-query-insights-updates/query-insights-dashboards-config.png)

**Why it matters:** Query Insights in OpenSearch Dashboards makes it easier to monitor search performance---whether you're an administrator monitoring query performance or a developer investigating specific query issues. You can quickly visualize data, explore individual queries, and adjust settings without needing to interact with the API. For setup instructions and usage tips, see [Query Insights dashboards](https://opensearch.org/docs/latest/observing-your-data/query-insights/query-insights-dashboard/).

## Analyze historical trends using the local index exporter

Real-time monitoring helps you address performance issues as they happen. However, to understand long-term trends or investigate past incidents, you need access to historical data. The **local index exporter** helps you achieve this.

When configured to persist historical data, Query Insights stores Top N query records---either individual queries or grouped ones---in dedicated OpenSearch indexes within your cluster.

**How it works:** Set the exporter type to `local_index` in your cluster settings. OpenSearch then creates a new index each day using a standardized naming format, such as `top_queries-YYYY.MM.dd-hashcode`. You can control data retention using the `delete_after_days` setting, which removes older indexes after a defined number of days (default is `7`). For example, to configure the local index exporter to store latency data, use the following request. Optionally, you can set the retention period to a custom value (in this example, 30 days):

```json
PUT _cluster/settings
{
  "persistent" : {
    "search.insights.top_queries.exporter.type" : "local_index",
    "search.insights.top_queries.exporter.delete_after_days" : 30
  }
}
```

**Why it matters:** By storing data locally, you can query historical Top N data through the same `/_insights/top_queries` API—just add `from` and `to` timestamp parameters. For example, to get latency-related queries between 10:00 AM and 12:00 PM UTC on November 5, 2024, run the following request:

```
GET /_insights/top_queries?type=latency&from=2024-11-05T10:00:00.000Z&to=2024-11-05T12:00:00.000Z
```

This makes it easy to track performance over time, conduct post-incident reviews, and make data-driven decisions about scaling and capacity planning. For more information, see [Exporting top N query data](https://opensearch.org/docs/latest/observing-your-data/query-insights/top-n-queries/#exporting-top-n-query-data).

## Monitor plugin health and resource usage

The query monitoring functionality is provided by the Query Insights plugin. As Query Insights collects, aggregates, and exports data, it naturally uses some cluster resources. To help you monitor its internal health and identify issues early, Query Insights now includes dedicated monitoring features:

1. **Health Stats API:** Use the `GET /_insights/health_stats` endpoint to retrieve operational metrics from each node running the plugin. This includes:
   - Status and settings for the internal thread pool (`query_insights_executor`)
   - Current size of the queue that buffers incoming query records (`QueryRecordsQueueSize`)
   - Cache performance stats, such as `FieldTypeCacheStats` used during query grouping
   - Resource usage for Top N query collectors

2. **OpenTelemetry error metrics:** If OpenTelemetry is enabled in your cluster, Query Insights reports plugin-specific error counters. These metrics track operational failures within the plugin, such as
   - `LOCAL_INDEX_READER_PARSING_EXCEPTIONS`
   - `DATA_INGEST_EXCEPTIONS`
   - `LOCAL_INDEX_EXPORTER_BULK_FAILURES`
   - `QUERY_CATEGORIZE_EXCEPTIONS`

**Why it matters:** These monitoring tools provide visibility into the plugin's behavior and resource impact. They're especially useful if you notice missing insights data, delays in reporting, or suspect that Query Insights might be affecting overall cluster performance.

To explore all available metrics and fields, see  [Query Insights plugin health](https://opensearch.org/docs/latest/observing-your-data/query-insights/health/).

## Conclusion: A more cohesive query analysis workflow

Query Insights continues to evolve, driven by one clear goal: providing actionable visibility into search query performance. The latest enhancements---**query grouping by similarity**, the **Query Insights in OpenSearch Dashboards**, the **local index exporter**, and **plugin health monitoring**---represent major steps toward that goal.

These features are designed to function cohesively, creating a more integrated and effective workflow. The dashboard provides a central place to visualize top N queries or query groups and to configure monitoring settings with just a few clicks. The local index exporter enables historical analysis, letting you explore trends or investigate past issues through persisted data. Throughout this process, the health monitoring tools provide confidence that the insights system itself is operating reliably.

Together, these improvements give you a more complete and user-friendly workflow for understanding and optimizing query behavior. Whether you're investigating a latency spike using historical data, identifying recurring patterns in inefficient queries using grouping, or configuring monitoring parameters in OpenSearch Dashboards, Query Insights now makes it easier and more intuitive to tune your search.

To get started, update to the latest OpenSearch version, which provides the newest Query Insights and Query Insights Dashboards plugins. For setup guides, API references, and examples, check out the [Query Insights documentation](https://opensearch.org/docs/latest/observing-your-data/query-insights/index/). 

As always, your feedback helps us continue improving observability in OpenSearch. We encourage you to explore this new functionality and share your thoughts on the [OpenSearch forum](https://forum.opensearch.org/).
