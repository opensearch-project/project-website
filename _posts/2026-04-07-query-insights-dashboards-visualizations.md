---
layout: post
title: "A visual guide to troubleshooting search performance with Query Insights dashboards"
authors:
   - chenyang
   - emilyguo
   - kishore
date: 2026-04-07
categories:
  - technical-posts
meta_keywords: OpenSearch Query Insights, query insights dashboards, query performance visualization, live queries monitoring, top N queries, search performance troubleshooting, query latency heatmap, OpenSearch Dashboards
meta_description: Learn how to use OpenSearch Query Insights dashboards to monitor live queries, analyze top N query performance, and troubleshoot search issues.
excerpt: OpenSearch Query Insights dashboards provide interactive visualizations for monitoring live queries, analyzing top N query performance, and drilling down into individual query details. This post walks through each visualization and shows how to use them to troubleshoot search performance issues.
---

When your users report slow searches or your cluster shows unexpected resource spikes, you need to quickly understand *what's happening* and *why*. OpenSearch Query Insights now provides a full visual experience within OpenSearch Dashboards, with interactive charts, heatmaps, and drill-down views that make it easier to identify and resolve query performance issues.

In this post, we'll walk through the visualizations available on the **Live Queries** and **Top N Queries** pages and show you how to use them to diagnose and troubleshoot real-world performance issues.

## Getting started

To access Query Insights dashboards, make sure the Query Insights and Query Insights Dashboards plugins are installed on your OpenSearch cluster. You can navigate to the Query Insights page from the OpenSearch Dashboards side menu.

Top N query monitoring is enabled by default for latency, CPU, and memory. You can verify or adjust the configuration---for example, setting a longer monitoring window and tracking the top 20 queries---by using the following request:

```json
PUT _cluster/settings
{
  "persistent": {
    "search.insights.top_queries.latency.window_size": "30m",
    "search.insights.top_queries.latency.top_n_size": 20
  }
}
```

With monitoring active, the dashboards automatically populate with query performance data. Let's explore what each page offers.

## Live queries: Real-time visibility into active search operations

The Live Queries page gives you an immediate view of every search query currently running on your cluster. This is your go-to starting point when users report slowness or you notice unusual resource consumption.

### Metric overview panels

At the top of the page, five metric panels provide an at-a-glance summary of your cluster's current search activity:

- **Active Queries**: The total count of currently running queries.
- **Avg. Elapsed Time**: The average time that all active queries have been running.
- **Longest Running Query**: The duration of the single longest-running query, along with its task ID.
- **Total CPU Usage**: The combined CPU time consumed across all active queries.
- **Total Memory Usage**: The combined memory used across all active queries.

<!-- TODO: Screenshot of the Live Queries metric overview panels -->
![Live Queries metric overview panels](/assets/media/blog-images/2026-04-07-query-insights-dashboards-visualizations/live-queries-metric-panels.png)

When you receive alerts about cluster performance, these panels give you an instant health check. A high **Active Queries** count combined with a long **Avg. Elapsed Time** often signals that queries are queuing up or contending for resources. If the **Longest Running Query** shows a duration far above your expected query times, that single query could be the root cause of broader slowness.

### Distribution charts: Queries by node and index

Below the metric panels, two distribution charts break down your active queries by **node** and **index**. Each chart can be toggled between a donut chart and a horizontal bar chart, depending on your preference.

<!-- TODO: Screenshot of the Queries by Node and Queries by Index charts -->
![Live Queries distribution charts](/assets/media/blog-images/2026-04-07-query-insights-dashboards-visualizations/live-queries-distribution-charts.png)

- **Queries by Node**: Shows how queries are distributed across your cluster's coordinator nodes. A color-coded legend maps each node to its query count.
- **Queries by Index**: Shows which indexes are receiving the most search traffic right now.

An uneven distribution in the **Queries by Node** chart may indicate a hot node---one node handling a disproportionate share of queries, potentially due to client-side routing configuration or an unbalanced workload. If the **Queries by Index** chart shows one index dominating, you've identified where to focus your optimization efforts, whether that means improving the index's mapping, adding replicas, or investigating the query patterns targeting it.

### Live queries table

The interactive table at the bottom lists every active query with full details, including timestamp, task ID, target indexes, coordinator node, elapsed time, CPU usage, memory usage, search type, and the query's current status (running or cancelled).

<!-- TODO: Screenshot of the Live Queries table -->
![Live Queries table](/assets/media/blog-images/2026-04-07-query-insights-dashboards-visualizations/live-queries-table.png)

You can narrow results by index, search type, or coordinator node to focus on specific workloads. Click any numeric column header to sort by that metric---for example, sort by elapsed time to surface the slowest queries. The table also supports query cancellation: select one or more queries and cancel them directly from the dashboard, which is useful for stopping runaway queries that are consuming excessive resources. The page supports configurable auto-refresh intervals, so you can monitor the query stream continuously during incident response.

For deeper investigation, you can complement the dashboard with the Live Queries API. For example, to retrieve the five most CPU-intensive queries with their full query source:

```json
GET /_insights/live_queries?verbose=true&sort=cpu&size=5
```

## Top N queries: Understanding query performance patterns

While Live Queries shows you *what's happening now*, the Top N Queries page helps you understand *what has been happening* over a configurable time range. This is where we analyze patterns, identify recurring problematic queries, and track performance trends.

### Percentile metric panels

At the top of the page, six panels display key percentile metrics across your top queries:

- **P90 Latency**: 90th percentile query latency (ms)
- **P90 CPU Time**: 90th percentile CPU consumption (ms)
- **P90 Memory**: 90th percentile memory usage (MB)
- **P99 Latency**: 99th percentile query latency (ms)
- **P99 CPU Time**: 99th percentile CPU consumption (ms)
- **P99 Memory**: 99th percentile memory usage (MB)

<!-- TODO: Screenshot of the Top N Queries percentile panels -->
![Top N Queries percentile panels](/assets/media/blog-images/2026-04-07-query-insights-dashboards-visualizations/top-queries-percentile-panels.png)

These percentile metrics help you distinguish between occasional outliers and systemic issues. If the P90 latency is within acceptable bounds but the P99 is extremely high, you're dealing with tail latency---a small percentage of queries taking significantly longer. Conversely, if even the P90 is elevated, you likely have a widespread performance problem affecting the majority of queries.

### Queries distribution chart

The distribution chart uses an interactive pie (donut) chart to show how queries are distributed across a dimension you choose: **node**, **index**, **username**, or **workload management (WLM) group**. The chart is accompanied by a data table showing each segment's name, query count, and percentage of the total. Hovering over a segment displays a tooltip with the exact count and percentage.

<!-- TODO: Screenshot of the Queries Distribution pie chart with the accompanying data table -->
![Top N Queries distribution chart](/assets/media/blog-images/2026-04-07-query-insights-dashboards-visualizations/top-queries-distribution-chart.png)

Group by **index** to see which indexes generate the most top queries---these are the indexes where query optimization will have the greatest impact. Group by **username** to identify whether a specific user or application is responsible for a disproportionate share of expensive queries. If you're using workload management, group by **WLM group** to understand how different workload classes contribute to the top query list.

### Performance analysis: Line chart and heatmap

The performance analysis section offers two chart types that you can switch between, depending on what you're investigating.

#### Line chart: Performance trends over time

The line chart tracks three series over your selected time range:

- **Max** (red): The maximum metric value per time bucket.
- **Average** (blue): The average metric value per time bucket.
- **Min** (green): The minimum metric value per time bucket.

You can toggle the Y-axis metric between **latency**, **CPU**, and **memory**.

<!-- TODO: Screenshot of the Performance Analysis line chart -->
![Performance analysis line chart](/assets/media/blog-images/2026-04-07-query-insights-dashboards-visualizations/top-queries-line-chart.png)

The line chart is ideal for spotting performance regressions or correlating query behavior with external events. If you see the max latency spike at a specific time, cross-reference that with deployment logs, index operations, or changes in query patterns. A widening gap between the max and average lines suggests increasing variability---some queries are degrading while others remain normal.

#### Heatmap: Multi-dimensional performance analysis

The heatmap provides a dense visualization of query performance across two dimensions: **time** (X-axis) and a grouping dimension (Y-axis) such as index, node, username, user roles, or WLM group. Each cell is color-coded based on a metric value, with lighter colors representing lower values and darker colors representing higher values. You can choose from several metrics---**latency**, **CPU**, or **memory** (with average, max, or min aggregation) as well as **count** (the number of top queries in each cell).

<!-- TODO: Screenshot of the Performance Analysis heatmap -->
![Performance analysis heatmap](/assets/media/blog-images/2026-04-07-query-insights-dashboards-visualizations/top-queries-heatmap.png)

The heatmap excels at revealing patterns that are hard to spot in tables or line charts. Look for "hot" rows---indexes or nodes that are consistently dark across time---to identify persistent bottlenecks. Look for "hot" columns---time periods where multiple rows show dark cells---to identify cluster-wide performance degradation events. The combination of time and grouping dimensions lets you answer questions like "Is the latency spike limited to one index, or is it affecting the whole cluster?"

Once you've identified a problematic time window in the heatmap, you can drill into the specific period through the API:

```json
GET /_insights/top_queries?type=latency&from=2026-04-01T14:00:00.000Z&to=2026-04-01T16:00:00.000Z
```

### Top queries data table

The data table lists all top queries or query groups within your selected time range in a sortable, filterable view.

<!-- TODO: Screenshot of the Top N Queries data table -->
![Top N Queries data table](/assets/media/blog-images/2026-04-07-query-insights-dashboards-visualizations/top-queries-data-table.png)

Key columns include the query **ID** (clickable to the details page), **type** (query or group, when [grouping by similarity](https://opensearch.org/docs/latest/observing-your-data/query-insights/grouping-top-n-queries/) is enabled), **query count**, **timestamp**, **indexes**, **search type**, **coordinator node ID**, **total shards**, and the core performance metrics: **latency**, **CPU time**, and **memory usage**. You can filter by type, indexes, search type, coordinator node, and WLM group to narrow results.

When investigating a specific performance issue, start by sorting the table by the relevant metric (for example, latency for slow queries or CPU for resource-intensive queries). If grouping by similarity is enabled, pay attention to groups with high **Query Count** values---these represent recurring query patterns where even a small per-query improvement will multiply into significant resource savings.

## Query details: Drilling down into individual queries and groups

Clicking a query ID in either the Live Queries or Top N Queries table takes you to a detailed view of that specific query.

### Query summary and source

The summary panel displays all available metadata: timestamp, latency, CPU time, memory usage, indexes, search type, coordinator node ID, and total shards. Below the summary, the full query source (the DSL body) is displayed in a code block, making it easy to review and copy for further analysis.

<!-- TODO: Screenshot of the Query Details summary panel -->
![Query details summary](/assets/media/blog-images/2026-04-07-query-insights-dashboards-visualizations/query-details-summary.png)

### Latency breakdown chart

One of the most valuable visualizations for troubleshooting is the **latency breakdown chart**. This waterfall-style chart displays each execution phase as a separate horizontal bar, showing how a query's total latency is distributed across three phases:

- **Query phase** (blue): Time spent executing the query across shards.
- **Fetch phase** (pink): Time spent fetching the actual documents after the query phase identifies matches.
- **Expand phase** (teal): Time spent on any expand operations.

<!-- TODO: Screenshot of the Latency Breakdown chart -->
![Latency breakdown chart](/assets/media/blog-images/2026-04-07-query-insights-dashboards-visualizations/query-details-latency-breakdown.png)

This breakdown reveals *where* a query spends its time. If the query phase dominates, the issue is likely in the query structure itself---perhaps an expensive aggregation or a wildcard query scanning too many terms. If the fetch phase dominates, the query may be retrieving too many large documents, suggesting that you should reduce the result size or use source filtering. This distinction is critical for choosing the right optimization strategy.

### Query group details

When you have [grouping by similarity](https://opensearch.org/docs/latest/observing-your-data/query-insights/grouping-top-n-queries/) enabled, clicking a group ID opens the group details page instead. This page presents aggregate metrics---average latency, CPU time, and memory usage across all queries in the group---along with the total query count and the grouping method. A representative sample query is shown with its full source and latency breakdown, giving you a concrete starting point for analysis.

Group details help you focus on query *patterns* rather than individual instances. If a group shows high average latency with a high query count, optimizing that single query pattern could improve performance for hundreds or thousands of queries.

## Putting it all together: A troubleshooting workflow

To show how these visualizations work together, let's walk through a typical troubleshooting scenario. Imagine you receive an alert that search latency has spiked across your cluster.

You start on the **Live Queries** page and immediately see a high active query count. The **Queries by Node** chart shows an even distribution, ruling out a hot-node issue. But the **Queries by Index** chart reveals that the `user-activity` index accounts for most of the traffic. Sorting the live queries table by elapsed time, you spot several long-running queries against that index and cancel them to stabilize the cluster.

Next, you switch to the **Top N Queries** page and set the time range to the past two hours. The **P99 latency** panel shows a sharp increase starting 45 minutes ago. The **heatmap**, grouped by index with latency (max) as the metric, confirms the issue is isolated to the `user-activity` index---dark cells appear only in that row.

You click the highest-latency query ID to open the **query details** page. The **latency breakdown** chart shows the query phase consuming 95% of the total time. Reviewing the query source, you discover a wildcard query on a high-cardinality field. With [grouping by similarity](https://opensearch.org/docs/latest/observing-your-data/query-insights/grouping-top-n-queries/) enabled, you check the group details and find that this query pattern has been executed over 500 times in the past hour---a clear optimization target.

## Conclusion

The Query Insights dashboards bring together real-time monitoring, historical analysis, and detailed query-level diagnostics in a single visual interface. Whether you're responding to a live incident using the Live Queries page, identifying recurring patterns with the Top N Queries heatmap, or pinpointing a bottleneck through the latency breakdown chart, these tools help you move from symptom to root cause more efficiently.

To get started, make sure you have the latest Query Insights and Query Insights Dashboards plugins installed. For detailed configuration options and API references, see the [Query Insights documentation](https://opensearch.org/docs/latest/observing-your-data/query-insights/index/).

We'd love to hear how you're using these visualizations in your own troubleshooting workflows. Share your experiences and feedback on the [OpenSearch forum](https://forum.opensearch.org/).
