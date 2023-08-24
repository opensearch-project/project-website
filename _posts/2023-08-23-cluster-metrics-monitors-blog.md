---
layout: post
title:  Monitoring your cluster with cluster metrics monitors
authors:
  - hurneyt
date: 2023-08-23
categories:
  - technical-posts
meta_keywords: 
meta_description: 
---

In OpenSearch version 1.3, we added cluster metrics monitors to the Alerting plugin. Cluster metrics monitors allow you to execute popular CAT and cluster API calls against the local cluster and generate alerts based on the metrics reported by those APIs. Cluster metrics monitors support calling the following APIs:

1. [_cluster/health](https://opensearch.org/docs/2.9/api-reference/cluster-health/)
2. [_cluster/stats](https://opensearch.org/docs/2.9/api-reference/cluster-stats/)
3. [_cluster/settings](https://opensearch.org/docs/2.9/api-reference/cluster-settings/)
4. [_nodes/stats](https://opensearch.org/docs/2.9/opensearch/popular-api/#get-node-statistics)
5. [_cat/indices](https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-indices/) - new with v2.9.0!
6. [_cat/pending_tasks](https://opensearch.org/docs/2.9/api-reference/cat/cat-pending-tasks/)
7. [_cat/recovery](https://opensearch.org/docs/2.9/api-reference/cat/cat-recovery/)
8. [_cat/shards](https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-shards/) - new with v2.9.0!
9. [_cat/snapshots](https://opensearch.org/docs/2.9/api-reference/cat/cat-snapshots/)
10. [_cat/tasks](https://opensearch.org/docs/2.9/api-reference/cat/cat-tasks/)


In this blog post, we’ll walk through two common use cases for this monitor type: [monitoring CPU utilization](#monitoring-cluster-cpu-utilization) and [monitoring JVM memory pressure](#monitoring-cluster-jvm-memory-pressure). Additionally, we’ll present use cases for the newly-supported APIs, [`_cat/indices`](#_catindices) and [`_cat/shards`](#_catshards). 

## Monitoring cluster CPU utilization

By creating a cluster metrics monitor that calls the `_cluster/stats` API, you can receive alerts when the CPU utilization of the cluster reaches a certain threshold. To generate an alert when the CPU utilization reaches or exceeds 60%, use the following steps:

1. From the top menu, select **OpenSearch Plugins** > **Alerting**.
1. In the **Monitors** tab, select **Create monitor**.
1. Select the **Per cluster metrics monitor** option. For demonstration purposes, you’ll configure this monitor to run every minute by leaving the default values under **Schedule**.
1. Under **Query** > **Request type**, select **Cluster stats**. In the response preview, you can see that the current CPU utilization for this cluster is 0%.
    ![Configuring the request type](/assets/media/blog-images/2023-08-23-cluster-metrics-monitors-blog/cluster-metrics-v29-cpu2-request-type.png){: .img-fluid }
1. Configure a trigger condition that compares the CPU percent to your desired threshold: 
    ```bash
    ctx.results[0].nodes.process.cpu.percent >= 60
    ```
    In this example, you can see that the trigger condition response is `false` because the CPU utilization for the cluster is currently `0%`.
    ![Configuring a trigger](/assets/media/blog-images/2023-08-23-cluster-metrics-monitors-blog/cluster-metrics-v29-cpu3-trigger.png){: .img-fluid }
1. Configure notification actions as desired. This example uses a dummy channel for demonstration purposes. 
    ![Configuring notifications](/assets/media/blog-images/2023-08-23-cluster-metrics-monitors-blog/cluster-metrics-v29-cpu4-notification.png){: .img-fluid }
    As you can see in the example, you can include `ctx.results.0.nodes.process.cpu.percent` to print the CPU utilization in the notification message:
   
    ```plaintext
    The current CPU usage for the cluster is {% raw %}{{ctx.results.0.nodes.process.cpu.percent}}%{% endraw %}`.

    Monitor {% raw %}{{ctx.monitor.name}}{% endraw %} just entered alert status. Please investigate the issue.
    - Trigger: {% raw %}{{ctx.trigger.name}}{% endraw %}
    - Severity: {% raw %}{{ctx.trigger.severity}}{% endraw %}
    - Period start: {% raw %}{{ctx.periodStart}}{% endraw %}
    - Period end: {% raw %}{{ctx.periodEnd}}{% endraw %}
    ```
1. Select **Create** to create your monitor!

## Monitoring cluster JVM memory pressure

You can also use the `_cluster/stats` API to receive alerts when the JVM memory pressure of the cluster reaches a certain threshold. Let’s say you want to generate an alert when the JVM memory pressure reaches or exceeds 75%. This example requires a little more understanding of trigger conditions to configure, because the `_cluster/stats` API doesn’t return the percentage of the heap that’s used; it returns `heap_used_in_bytes` and `heap_max_in_bytes`.

1. From the top menu, select **OpenSearch Plugins** > **Alerting**.
1. In the **Monitors** tab, select **Create monitor**.
1. Select the **Per cluster metrics monitor** option. For demonstration purposes, you’ll configure this monitor to run every minute by leaving the default values under **Schedule**.
1. Under **Query** > **Request type**, select **Cluster stats**. In the response preview, you can see that the current `heap_max_in_bytes` is `536870912`, and `heap_used_in_bytes` is `96278576`; which is about 17.93% of the max.
    ![Configuring the request type](/assets/media/blog-images/2023-08-23-cluster-metrics-monitors-blog/cluster-metrics-v29-jvm2-request-type.png){: .img-fluid }
1. Configure a trigger condition that calculates the JVM memory pressure percentage and compares it to the desired threshold:
    ```bash
    ctx.results[0].nodes.jvm.mem.heap_used_in_bytes / ctx.results[0].nodes.jvm.mem.heap_max_in_bytes >= 0.75
    ```
1. Configure notification actions as desired. This example uses a dummy channel for demonstration purposes. 
    ![Configuring notifications](/assets/media/blog-images/2023-08-23-cluster-metrics-monitors-blog/cluster-metrics-v29-jvm4-notification.png){: .img-fluid }

    Mustache template does not currently support performing calculations, but you can print the current `heap_used_in_bytes` and `heap_max_in_bytes` in the message:

    ```plaintext
    JVM memory pressure breached 75%.
    {% raw %}{{ctx.results.0.nodes.jvm.mem.heap_used_in_bytes}} bytes used of {{ctx.results.0.nodes.jvm.mem.heap_max_in_bytes}} {% endraw %}total bytes available.

    Monitor {% raw %}{{ctx.monitor.name}} {% endraw %}just entered alert status. Please investigate the issue.
    - Trigger: {% raw %}{{ctx.trigger.name}}{% endraw %}
    - Severity: {% raw %}{{ctx.trigger.severity}}{% endraw %}
    - Period start: {% raw %}{{ctx.periodStart}}{% endraw %}
    - Period end: {% raw %}{{ctx.periodEnd}}{% endraw %}
    ```
1. Select **Create** to create your monitor!

## Monitoring `_cat/indices` and `_cat/shards` responses

With the release of OpenSearch version 2.9, cluster metrics monitors now support calling the `_cat/indices` and `_cat/shards` APIs! The output from those APIs consist of a list of indexes and a list of shards, respectively. The following are some examples of trigger conditions that iterate through the list returned by the API to check whether any entry matches the desired condition.

### `_cat/indices`

This example trigger condition generates an alert when the API response contains a `red` index. 

![Trigger condition for red index](/assets/media/blog-images/2023-08-23-cluster-metrics-monitors-blog/cluster-metrics-v29-indices3-trigger.png){: .img-fluid }

The trigger condition is configured as follows:

```bash
for (int i = 0; i < ctx.results[0].indices.size(); ++i)
  if (ctx.results[0].indices[i].health == "red") return true
```

Under **Action**, you can set up a message that will be sent when the trigger condition is met.

![Cat indices notification](/assets/media/blog-images/2023-08-23-cluster-metrics-monitors-blog/cluster-metrics-v29-indices4-notification.png){: .img-fluid }

You can use the following Mustache template to print each entry in the list of indexes returned by the API call, along with information from each entry:

```plaintext
Some indices are "red."
{% raw %}{{#ctx.results.0.indices}}
- {{index}}     health: {{health}}
{{/ctx.results.0.indices}}{% endraw %}

Monitor {% raw %}{{ctx.monitor.name}}{% endraw %} just entered alert status. Please investigate the issue.
  - Trigger: {% raw %}{{ctx.trigger.name}}{% endraw %}
  - Severity: {% raw %}{{ctx.trigger.severity}}{% endraw %}
  - Period start: {% raw %}{{ctx.periodStart}}{% endraw %}
  - Period end: {% raw %}{{ctx.periodEnd}}{% endraw %}
```

Note that Mustache templates do not currently support conditional statements, so the template cannot be configured to print only indexes with a `red` `health` value. Instead, all of the returned indexes will be printed.

### `_cat/shards`

This example trigger condition generates an alert when the API response contains an `UNASSIGNED` shard.

![Trigger condition for unassigned shard](/assets/media/blog-images/2023-08-23-cluster-metrics-monitors-blog/cluster-metrics-v29-shards3-trigger.png){: .img-fluid }

The trigger condition is configured as follows:

```bash
for (int i = 0; i < ctx.results[0].shards.size(); ++i)
  if (ctx.results[0].shards[i].state == "UNASSIGNED") return true
```

Under **Action**, you can set up a message that will be sent when the trigger condition is met. 

![Cat shards notification](/assets/media/blog-images/2023-08-23-cluster-metrics-monitors-blog/cluster-metrics-v29-shards4-notification.png){: .img-fluid }

You can use the following Mustache template to print each entry in the list of shards returned by the API call, along with information from each entry:

```plaintext
Some shards are "UNASSIGNED."
{% raw %}{{#ctx.results.0.shards}}
- {{index}}     shard #{{shard}} ({{primaryOrReplica}}) state: {{state}}
{{/ctx.results.0.shards}}{% endraw %}

Monitor {% raw %}{{ctx.monitor.name}}{% endraw %} just entered alert status. Please investigate the issue.
  - Trigger: {% raw %}{{ctx.trigger.name}}{% endraw %}
  - Severity: {% raw %}{{ctx.trigger.severity}}{% endraw %}
  - Period start: {% raw %}{{ctx.periodStart}}{% endraw %}
  - Period end: {% raw %}{{ctx.periodEnd}}{% endraw %}
```

Note that Mustache templates do not currently support conditional statements, so the template cannot be configured to print only shards with an `UNASSIGNED` `state` value. Instead, all of the returned indexes will be printed.

* * *

## Next steps

To learn more about cluster metrics monitors and the Alerting plugin as a whole, visit the [cluster metrics monitor documentation](https://opensearch.org/docs/latest/observing-your-data/alerting/monitors/#create-cluster-metrics-monitor).


If you have any feedback, or would like to request an enhancement to cluster metrics monitors, create an [issue](https://github.com/opensearch-project/alerting/issues/new/choose) in our GitHub repository!
