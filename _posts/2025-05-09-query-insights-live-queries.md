---
layout: post
title: "Real-Time Query Monitoring with Live Queries in OpenSearch 3.0"
authors:
   - chenyang
date: 2025-05-09
categories:
  - technical-posts
meta_keywords: OpenSearch Query Insights, Live Queries, real-time query monitoring, query performance, OpenSearch 3.0, search analytics, resource monitoring, query debugging
meta_description: Discover the new Live Queries API in OpenSearch Query Insights 3.0, enabling real-time visibility into currently executing search queries to identify and debug performance issues as they happen.
---

OpenSearch Query Insights has become an important tool for understanding search query performance, offering visibility into how queries execute and consume cluster resources. Building on our commitment to help you identify performance bottlenecks and optimize search operations, we're excited to introduce a powerful new capability in OpenSearch 3.0: **live queries**.

While historical analysis of top N queries helps you understand trends and past issues, there are times when you need to see exactly what's happening *right now*. Is a particular query taking too long? Is a sudden surge in resource consumption linked to specific search activity? You can gain this immediate insight using live queries.

## What are Live Queries?

Introduced in OpenSearch 3.0, live queries allow you to look into the current state of your cluster's search workload. The Live Queries API retrieves a list of search queries that are currently running across your cluster or on specific nodes. This capability provides real-time visibility into query behavior, which is especially useful for performing the following tasks:

*   **Identifying problematic queries**: Quickly spot queries that are running for an unexpectedly long time.
*   **Debugging resource hogs**: Pinpoint searches consuming significant CPU or memory *at this very moment*.
*   **Understanding immediate cluster load**: Get a snapshot of current search activity impacting your cluster.

The API returns key details for each live query, including its source, search type, the indexes involved, the node ID it's running on, its start time, current latency, and resource usage (on the coordinator node) up to that point.

## How live queries work

You can access live query information using the following REST API endpoint:

```json
GET /_insights/live_queries
```

By default, the API returns a list of currently executing search queries, sorted by `latency` in descending order.

### Key information returned

For each live query, you'll receive a rich set of data:

*   `timestamp`: The time the query task started, in milliseconds since epoch.
*   `id`: The unique search task ID.
*   `description`: Details about the query, including target indexes, search type, and the query source itself (if `verbose` is true).
*   `node_id`: The ID of the coordinator node on which the query task is running.
*   `measurements`: An object containing performance metrics gathered so far:
    *   `latency`: The current running time, in nanoseconds.
    *   `cpu`: The CPU time consumed so far, in nanoseconds.
    *   `memory`: The amount of heap memory used so far, in bytes.

## Getting started with live queries

Interacting with the Live Queries API is straightforward. The API supports the following operations.

### Basic request

To get a list of currently running queries sorted by latency, send the following request:

```json
GET /_insights/live_queries
```

### Customizing your view using query parameters

You can tailor the output using several optional query parameters.

| Parameter | Data type | Description                                                                                                |
| :-------- | :-------- | :--------------------------------------------------------------------------------------------------------- |
| `verbose` | Boolean   | Whether to include detailed query information (like the query source) in the output. Default is `true`.    |
| `nodeId`  | String    | A comma-separated list of node IDs to filter results. If omitted, queries from all nodes are returned.     |
| `sort`    | String    | The metric to sort results by. Valid values: `latency`, `cpu`, or `memory`. Default is `latency`.          |
| `size`    | Integer   | The number of query records to return. Default is `100`.                                                     |

### Example: Finding CPU-intensive live queries

To find the top 5 queries currently consuming the most CPU, you can provide the following query parameters:

```json
GET /_insights/live_queries?verbose=false&sort=cpu&size=5
```
{% include copy-curl.html %}

### Understanding the response

Here’s an example of what the response might look like (showing one query for brevity, taken from the [documentation example](https://docs.opensearch.org/docs/latest/observing-your-data/query-insights/live-queries/#example-response)):

```json
{
  "live_queries" : [
    {
      "timestamp" : 1745359226777,
      "id" : "troGHNGUShqDj3wK_K5ZIw:512",
      "description" : "indices[my-index-*], search_type[QUERY_THEN_FETCH], source[{\"size\":20,\"query\":{\"term\":{\"user.id\":{\"value\":\"userId\",\"boost\":1.0}}}}]",
      "node_id" : "troGHNGUShqDj3wK_K5ZIw",
      "measurements" : {
        "latency" : {
          "number" : 13959364458,
          "count" : 1,
          "aggregationType" : "NONE"
        },
        "memory" : {
          "number" : 3104,
          "count" : 1,
          "aggregationType" : "NONE"
        },
        "cpu" : {
          "number" : 405000,
          "count" : 1,
          "aggregationType" : "NONE"
        }
      }
    }
    // ... other live queries
  ]
}
```

This response provides the following information:

*   The query started at timestamp `1745359226777`.
*   It's running on node `troGHNGUShqDj3wK_K5ZIw`.
*   So far, it has been running for over 13.9 seconds (`latency.number` in nanoseconds).
*   It has consumed `405000` nanoseconds of CPU time and `3104` bytes of memory.
*   The `description` (provided because `verbose=true` in the request) shows the query targets `my-index-*` and includes the actual query structure.

## Why live queries matter

The ability to monitor live queries offers significant advantages:

*   **Immediate troubleshooting**: When users report slowness or dashboards indicate high load, using live queries provides an instant view of active searches. This allows you to quickly identify if a specific query or a pattern of queries is the culprit.
*   **Proactive performance management**: By occasionally checking live queries, especially during peak times, you can spot potentially problematic queries before they cause widespread issues.
*   **Resource consumption insights**: Understanding which live queries are consuming the most CPU or memory helps in real-time resource assessment and can guide immediate actions, like canceling a runaway query if necessary (though the cancelation itself is a separate OpenSearch Task Management API feature).

## Conclusion

The new live queries feature in OpenSearch 3.0 adds a critical dimension to query performance monitoring by providing real-time visibility into your cluster's current search workload. This empowers you to diagnose and address performance issues more rapidly, ensuring a smoother and more efficient search experience for your users.

Combined with the existing capabilities of query insights, such as top N query analysis and historical data export, live queries offer a comprehensive toolkit for managing and optimizing your OpenSearch environment.

To get started with live queries, upgrade to OpenSearch 3.0. For more information, see [Live queries](https://opensearch.org/docs/latest/observing-your-data/query-insights/live-queries/) and the broader [query insights documentation](https://opensearch.org/docs/latest/observing-your-data/query-insights/index/).

We encourage you to explore this new functionality and share your experiences and feedback on the [OpenSearch forum](https://forum.opensearch.org/).