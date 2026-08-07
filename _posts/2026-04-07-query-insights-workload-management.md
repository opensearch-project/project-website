---
layout: post
title: "Using Query Insights to optimize workload management in OpenSearch"
authors:
   - chenyang
   - kishore
   - david
date: 2026-04-07
categories:
  - technical-posts
meta_keywords: OpenSearch Query Insights, Workload Management, WLM, workload groups, resource limits, query performance, search optimization, CPU throttling, memory management, query monitoring, OpenSearch Dashboards
meta_description: Learn how to use OpenSearch Query Insights together with Workload Management to identify resource-intensive queries, create targeted workload groups, and set optimal resource limits for a balanced and efficient cluster.
---

Running an OpenSearch cluster with multiple teams and workloads often means dealing with resource contention. An expensive analytics query from one team can starve another team's user-facing searches, causing latency spikes and a degraded experience. OpenSearch [Workload Management (WLM)](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/workload-management/wlm-feature-overview/) addresses this by letting you isolate and limit resources for different types of search traffic—but setting the right limits requires understanding your actual query patterns first.

That's where [Query Insights](https://opensearch.org/docs/latest/observing-your-data/query-insights/index/) comes in. By combining Query Insights with WLM, we can move from guessing at resource limits to making data-driven decisions. In this post, we walk through a practical workflow: use Query Insights to identify resource-intensive queries, create workload groups with appropriate limits, and then monitor the results through OpenSearch Dashboards.

## The challenge: Setting WLM limits without visibility

WLM lets you create workload groups with CPU and memory thresholds. Each workload group supports one of three resiliency modes: `enforced` (queries are rejected when thresholds are exceeded), `soft` (queries can burst beyond thresholds if resources are available), or `monitor` (queries are tracked but never rejected or canceled). This gives you flexible control over how strictly resource limits are applied.

The challenge is determining what those limits should be. Set thresholds too low, and you'll face excessive rejections and frustrated users. Set them too high, and you defeat the purpose of resource isolation. Without understanding your actual query workload, you're essentially guessing.

## Understanding your workload with Query Insights

Before configuring WLM, we need a clear picture of how queries consume resources. Enable Query Insights monitoring for the metrics that matter most to your cluster:

```json
PUT _cluster/settings
{
  "persistent": {
    "search.insights.top_queries.latency.enabled": true,
    "search.insights.top_queries.cpu.enabled": true,
    "search.insights.top_queries.memory.enabled": true,
    "search.insights.top_queries.latency.window_size": "30m",
    "search.insights.top_queries.latency.top_n_size": 20
  }
}
```

This configuration tracks the top 20 queries by latency, CPU, and memory within 30-minute windows, giving you a rolling view of the most resource-intensive search activity.

### Enable historical data export

For longer-term trend analysis, configure the local index exporter to persist top N query data:

```json
PUT _cluster/settings
{
  "persistent": {
    "search.insights.top_queries.exporter.type": "local_index",
    "search.insights.top_queries.exporter.delete_after_days": 30
  }
}
```

This stores query records in daily indexes (`top_queries-YYYY.MM.dd-hashcode`), allowing you to query historical data when determining baseline resource usage for your workload groups.

## Identifying workload patterns in the dashboard

Once Query Insights has collected data, open the Query Insights dashboard in OpenSearch Dashboards to analyze your workload.

### Review top N queries

Navigate to the **Top N Queries** tab and sort by CPU or memory to identify the most resource-intensive queries. Look for the following:

- Which indexes are targeted—analytics queries hitting large aggregation indexes? Real-time searches on logging indexes?
- Which queries consume the most resources—sort by CPU or memory to find the heaviest hitters.
- Which workload groups queries belong to—the results table includes a clickable WLM group column. Clicking a group name navigates directly to the Workload Management details page for that group, so you can quickly check its resource limits and usage.

![Placeholder: Screenshot of the Top N Queries dashboard showing queries sorted by CPU usage, with index names and WLM group columns visible](/assets/media/blog-images/2026-04-07-query-insights-workload-management/top-queries-cpu.png)

### Use live queries for real-time assessment

For a real-time view, switch to the **Live Queries** tab. This shows currently executing queries with their resource consumption so far. Like the Top N Queries view, each live query displays its WLM group as a clickable link that navigates to the Workload Management details page. During peak hours, this view helps you observe actual resource contention as it happens and quickly jump to a group's configuration if you need to adjust limits.

![Placeholder: Screenshot of the Live Queries dashboard showing active queries with latency, CPU, and memory columns](/assets/media/blog-images/2026-04-07-query-insights-workload-management/live-queries.png)

## Creating workload groups based on observed patterns

With a solid understanding of your query workload, you can now create WLM workload groups that reflect real usage. You'll typically want to separate workloads by use case:

- Analytics workload group: Heavy aggregation queries that are latency-tolerant but CPU-intensive.
- Real-time search workload group: Low-latency user-facing searches that should be protected from resource starvation.
- Ingestion-related workload group: Queries triggered by ingest pipelines or background processes.

### Create a workload group

Create a workload group using the API (or through the Dashboards UI by navigating to **Workload Management** and selecting **Create workload group**):

```json
PUT _wlm/workload_group
{
  "name": "analytics",
  "resiliency_mode": "enforced",
  "resource_limits": {
    "cpu": 0.4,
    "memory": 0.3
  }
}
```

This creates a workload group named `analytics` with enforced limits: queries assigned to this group are rejected when CPU usage exceeds 40% or memory exceeds 30% of the cluster's resources.

How should you decide on limits? Use the metrics from Query Insights as your guide. If your analytics queries typically consume 30–35% CPU, setting a limit of 40% provides a reasonable buffer while preventing runaway queries from starving other workloads. We recommend looking at P90/P95 usage levels from historical data rather than averages to account for usage spikes.

![Placeholder: Screenshot of the WLM Create page in Dashboards, showing the form with name, resiliency mode, and resource limits fields](/assets/media/blog-images/2026-04-07-query-insights-workload-management/wlm-create.png)

### Set up automatic query routing with rules

Rather than tagging every query manually, use WLM rules to automatically assign queries to workload groups based on username, role, or index pattern:

```json
PUT _rules/workload_group
{
  "description": "Route analytics queries",
  "index_pattern": ["analytics-*", "reports-*"],
  "workload_group": "<analytics-group-id>"
}
```

You can also route by user or role:

```json
PUT _rules/workload_group
{
  "description": "Route analyst team queries",
  "principal": {
    "username": ["analyst-user-1", "analyst-user-2"],
    "role": ["analytics_role"]
  },
  "workload_group": "<analytics-group-id>"
}
```

Rules are evaluated in priority order: `username` rules take precedence over `role` rules, which take precedence over `index_pattern` rules. This allows fine-grained control over query routing.

## Monitoring and iterating with the integrated dashboards

After creating workload groups and rules, the real power of the Query Insights and WLM integration becomes apparent. The dashboards provide a unified view of both query performance and workload group health.

### Monitor workload group resource usage

The Workload Management dashboard displays all workload groups with real-time CPU and memory usage across cluster nodes. Box plot visualizations show usage distribution, and red threshold lines indicate configured limits. Groups exceeding their limits are highlighted, making it easy to spot problems at a glance.

![Placeholder: Screenshot of the WLM main dashboard showing workload groups with CPU/memory box plots and threshold lines](/assets/media/blog-images/2026-04-07-query-insights-workload-management/wlm-dashboard.png)

Key metrics to monitor for each workload group include total completions (queries that finished successfully), total rejections (queries rejected because the group exceeded its threshold), and total cancellations (running queries canceled because resources exceeded the cancellation threshold).

A high rejection rate signals that your limits may be too tight or that the workload has grown beyond its allocation. A high cancellation rate may indicate runaway queries that need optimization.

### Navigate from WLM to Query Insights

The WLM dashboard provides direct links back into Query Insights for each workload group. Each group row in the table includes **View** links for both Top N Queries and Live Queries. Clicking these navigates to the respective Query Insights page, automatically filtered to show only queries belonging to that workload group. This makes it easy to investigate which specific queries are driving a group's resource usage.

You can also use the WLM Group filter on the Query Insights dashboard to narrow down the top N queries view to a specific workload group.

### Monitor live queries by workload group

The Live Queries dashboard includes a workload group selector that filters real-time query activity by group. When a group is selected, the stats panels update to show completions, rejections, and cancellations specific to that group. This is invaluable for real-time troubleshooting—if users report slow queries, you can immediately check whether their workload group is under resource pressure.

## Tuning limits over time

WLM configuration is not a one-time exercise. As your workload evolves, your limits should too. Here's a practical approach to ongoing tuning:

1. Start in monitor mode. Set the cluster-level WLM operating mode to `monitor_only` initially. This collects metrics without enforcing limits, giving you a safe baseline. Note that this is the cluster-level operating mode, separate from the per-group `resiliency_mode` discussed earlier:

   ```json
   PUT _cluster/settings
   {
     "persistent": {
       "wlm.workload_group.mode": "monitor_only"
     }
   }
   ```

2. Analyze historical data. Use the Query Insights local index exporter data to understand resource consumption patterns over days or weeks. Query historical records to find peak usage periods:

   ```json
   GET /_insights/top_queries?type=cpu&from=2026-03-30T00:00:00.000Z&to=2026-04-06T00:00:00.000Z
   ```

3. Set initial limits based on P95 usage. If a workload group's P95 CPU usage is 35%, setting a limit of 0.40–0.45 provides headroom while still protecting other groups.

4. Enable enforcement. Once you're confident in your limits, switch to `enabled` mode:

   ```json
   PUT _cluster/settings
   {
     "persistent": {
       "wlm.workload_group.mode": "enabled"
     }
   }
   ```

5. Monitor rejection rates. After enabling enforcement, watch for spikes in rejections through the WLM dashboard. If a workload group has a consistently high rejection rate, investigate using Query Insights: are the queries genuinely expensive, or are the limits too conservative?

6. Adjust and repeat. Update limits as needed. WLM lets you update workload group settings without downtime:

   ```json
   PUT _wlm/workload_group
   {
     "name": "analytics",
     "resource_limits": {
       "cpu": 0.5,
       "memory": 0.35
     }
   }
   ```

## Conclusion

The combination of Query Insights and Workload Management creates a closed-loop workflow for managing search resources:

| Step | Tool | Purpose |
|------|------|---------|
| Observe | Query Insights Top N | Identify resource-intensive queries |
| Isolate | WLM Workload Groups | Create groups with appropriate resource limits |
| Route | WLM Rules | Automatically assign queries to groups by user, role, or index |
| Monitor | WLM Dashboard + Live Queries | Track resource usage, rejections, and cancellations per group |
| Investigate | Query Insights filtered by WLM group | Drill into specific queries causing issues within a group |
| Tune | Historical Query Data + WLM Settings | Adjust limits based on observed trends and P95 metrics |

This data-driven approach replaces guesswork with evidence-based configuration, helping you balance resource isolation with workload performance.

To get started, make sure both the [Query Insights plugin](https://opensearch.org/docs/latest/observing-your-data/query-insights/index/) and the [Workload Management plugin](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/workload-management/wlm-feature-overview/) are installed on your cluster, along with the [Query Insights Dashboards](https://github.com/opensearch-project/query-insights-dashboards) plugin for the visual experience. The WLM integration features in the Query Insights dashboard are available starting in OpenSearch 3.3. For detailed API references and configuration options, see the [Query Insights documentation](https://opensearch.org/docs/latest/observing-your-data/query-insights/index/) and the [Workload Management documentation](https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/workload-management/wlm-feature-overview/).

We'd love to hear how you're using Query Insights and WLM together. Share your experiences, questions, and feedback on the [OpenSearch forum](https://forum.opensearch.org/).
