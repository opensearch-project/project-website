---

layout: post
title: "Enhancing Query Analysis Capabilities within OpenSearch Query Insights"
authors:
   - chenyang
   - kolchfa
date: 2025-03-31
categories:
  - technical-posts
meta_keywords: OpenSearch query insights, query grouping, query similarity, query dashboards, search performance, query optimization, query latency, search analytics, resource monitoring, OpenSearch Dashboards
meta_description: Explore recent advancements in OpenSearch Query Insights, featuring query grouping by similarity, a dedicated Dashboards plugin for visualization and configuration, a local index exporter for historical analysis, and new plugin health monitoring capabilities.
---

OpenSearch Query Insights provides essential visibility into search query performance, helping teams understand how queries execute and consume resources within their clusters. Since introducing [Query Insights](https://opensearch.org/blog/query-insights/), our goal has been to equip users with tools to identify performance bottlenecks and optimize queries, ultimately improving the end-user search experience. Effective query analysis is fundamental to maintaining efficient search operations.

Building on that foundation and incorporating user feedback, we have continued to develop Query Insights. This post highlights several significant new features designed to deliver deeper analytical capabilities through advanced grouping, improve usability via a dedicated dashboard interface, enable historical analysis with new export options, and provide better operational monitoring for the Query Insights system itself.

### Refining Analysis with Query Grouping by Similarity

A common observation when analyzing Top N query lists (ranked by latency, CPU, or memory usage) is the prevalence of multiple entries representing structurally similar queries that differ only in literal parameter values. This can obscure other distinct, resource-intensive queries deserving attention.

To address this, Query Insights now supports **Query Grouping by Similarity**. This feature allows the system to aggregate queries based on their fundamental structure, abstracting away variations in specific search terms or filter values.

**Mechanism:** When enabled, Query Insights parses incoming queries to identify their core operational structure. For instance, consider these two queries targeting the `user_id` field:

```json
// Query 1
{ "query": { "term": { "user_id": "valueA" } } }

// Query 2
{ "query": { "term": { "user_id": "valueB" } } }
```

With similarity grouping activated, both would be categorized under the same group defined by the `query -> term -> user_id` structure. Query Insights then reports aggregate metrics for this group, such as the average latency, total execution count, and combined resource usage, alongside a representative example query from the group.

**Configuration:** To enable this feature, update the cluster settings. The default behavior (`none`) performs no grouping.

```json
// Enable grouping by similarity
PUT _cluster/settings
{
  "persistent" : {
    "search.insights.top_queries.group_by" : "similarity"
  }
}
```

Optionally, you can also configure attributes like whether field names or types contribute to the similarity structure, providing finer control over grouping behavior. Refer to the [Grouping top N queries documentation](https://opensearch.org/docs/latest/observing-your-data/query-insights/grouping-top-n-queries/) for advanced configuration.

**Benefit:** This approach shifts the focus from individual query instances to underlying query patterns, facilitating more effective root cause analysis and optimization of common, high-impact query structures.

### Visualization and Interaction: The Query Insights Dashboards Plugin

While the Query Insights API provides programmatic access to performance data, a visual interface often simplifies exploration and configuration. We are pleased to introduce the **Query Insights Dashboards plugin**, a dedicated interface within OpenSearch Dashboards.

This plugin offers several key functionalities:

1.  **Top N Queries View:** Presents a sortable and filterable list of the top N queries or query groups based on selected metrics (latency, CPU, memory). Users can filter by time range, indexes, search type, and coordinator node ID. Key performance indicators are displayed clearly in a tabular format.
![Query Insights Dashboards - Top Queries Overview](/assets/media/blog-images/2025-03-31-query-insights-updates/top-queries-overview.png)
2.  **Query Details Page:** Selecting a query ID navigates to a detailed view. For individual queries, this includes the full query body, specific execution timestamps, resource consumption breakdowns (CPU, memory), phase latencies, and associated metadata (index, node, shards). For query groups, it displays aggregate statistics (e.g., average latency, total count) and provides details for a sample query representative of the group.
![Query Insights Dashboards - Details Page](/assets/media/blog-images/2025-03-31-query-insights-updates/top-queries-details.png)
3.  **Configuration Interface:** Offers a user interface within the dashboard as an alternative to API-based configuration. Users can enable/disable Top N monitoring per metric, define the monitoring window size (`window_size`) and the number of queries to track (`top_n_size`), select the grouping strategy (`group_by`), and configure data export settings – all through intuitive controls.
![Query Insights Dashboards - Configuration Page](/assets/media/blog-images/2025-03-31-query-insights-updates/query-insights-dashboards-config.png)


**Benefit:** The Dashboards plugin significantly lowers the barrier to entry for utilizing Query Insights, offering an accessible way for administrators and developers to monitor performance, diagnose issues, and manage settings without relying solely on API interactions. Check out the [Query insights dashboards documentation](https://opensearch.org/docs/latest/observing-your-data/query-insights/query-insights-dashboard/) for setup and usage guidance.

### Enabling Historical Analysis: The Local Index Exporter

Real-time monitoring addresses immediate performance concerns, but understanding trends and investigating past incidents requires historical data. The **Local Index Exporter** capability addresses this need.

When configured, Query Insights persists Top N query records (individual or grouped) into dedicated OpenSearch indexes within the same cluster.

**Mechanism:** Set the exporter type to `local_index` via cluster settings. The system then automatically creates daily indexes using a standardized naming convention (e.g., `top_queries-YYYY.MM.dd-hashcode`). Data lifecycle management is supported through the `delete_after_days` setting, which configures automatic deletion of these indexes after a specified retention period (defaulting to 7 days).

```json
// Configure the local index exporter (example for latency data)
PUT _cluster/settings
{
  "persistent" : {
    "search.insights.top_queries.exporter.type" : "local_index",
    // Optional: Set retention period to 30 days
    "search.insights.top_queries.exporter.delete_after_days" : 30
  }
}
```

**Benefit:** Storing performance data locally allows for retrospective analysis. Historical Top N data can be queried using the standard `/_insights/top_queries` API endpoint by specifying `from` and `to` timestamp parameters. For example, to retrieve the top latency queries recorded between 10:00 AM and 12:00 PM UTC on November 5th, 2024, you would send a request like this:
```
GET /_insights/top_queries?type=latency&from=2024-11-05T10:00:00.000Z&to=2024-11-05T12:00:00.000Z
```
This capability to query specific historical windows is crucial for trend analysis over time, conducting post-mortem investigations into past performance degradations, and informing capacity planning based on historical load patterns. Further details on configuration and querying are available in the [Exporting top N query data section](https://opensearch.org/docs/latest/observing-your-data/query-insights/top-n-queries/#exporting-top-n-query-data).

### Monitoring Plugin Health and Performance

As Query Insights performs its data collection, aggregation, and export functions, it consumes cluster resources. To ensure its own operational health and diagnose potential issues related to the plugin itself, we have introduced dedicated monitoring capabilities:

1.  **Health Stats API:** The `GET /_insights/health_stats` endpoint returns operational metrics for the Query Insights plugin instance on each node. This data includes the status and configuration of its internal thread pool (`query_insights_executor`), the current size of the queue buffering incoming query records (`QueryRecordsQueueSize`), performance statistics for internal caches (e.g., `FieldTypeCacheStats` used during grouping), and resource usage details specific to the Top N collectors.
2.  **OpenTelemetry Error Metrics:** When OpenTelemetry metric collection is enabled in the cluster, Query Insights emits specific error counters. These metrics track operational failures within the plugin, such as `LOCAL_INDEX_READER_PARSING_EXCEPTIONS`, `DATA_INGEST_EXCEPTIONS`, `LOCAL_INDEX_EXPORTER_BULK_FAILURES`, and `QUERY_CATEGORIZE_EXCEPTIONS`.

**Benefit:** These monitoring points provide transparency into the plugin's internal state and resource footprint. They are valuable diagnostic tools if insights data seems incomplete or delayed, or if the plugin itself is suspected of contributing to cluster load. The [Query Insights plugin health documentation](https://opensearch.org/docs/latest/observing-your-data/query-insights/health/) provides a full list of metrics and API fields.


### Conclusion: A More Cohesive Query Analysis Workflow

OpenSearch Query Insights continues to evolve, driven by the goal of providing clear, actionable visibility into search query performance. The recent enhancements—**Query Grouping by Similarity**, the **Query Insights Dashboard**, the **Local Index Exporter**, and **Plugin Health Monitoring**—represent significant steps toward achieving this goal.

More importantly, these features are designed to function cohesively, creating a more integrated and effective workflow. The dashboard now serves as a central point for both visualizing Top N queries (or groups) and intuitively configuring features like grouping and the local exporter. This exporter, in turn, enables powerful historical analysis, allowing you to query specific time ranges via the enhanced API using data persisted directly within your cluster. Throughout this process, the health monitoring tools provide confidence that the insights system itself is operating reliably.

Together, these advancements provide a more complete and user-friendly toolkit for understanding and optimizing query behavior. Whether you are diagnosing a sudden latency spike using historical data, identifying common inefficient query patterns through grouping, or simply configuring monitoring via the new dashboard interface, Query Insights offers enhanced capabilities to maintain performant and efficient search operations.

We encourage you to explore these new features by updating to the latest OpenSearch versions and installing or updating the Query Insights and Query Insights Dashboards plugins. Detailed usage instructions and configuration options are available in the [OpenSearch Query Insights documentation](https://opensearch.org/docs/latest/observing-your-data/query-insights/index/). Your feedback on these enhancements is invaluable as we continue to refine search observability within OpenSearch.
