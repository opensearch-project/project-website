---
layout: post
title: "Securing query insights data with role-based access control in OpenSearch"
authors:
   - chenyang
   - sidgu
date: 2026-04-07
categories:
  - technical-posts
meta_keywords: Query Insights, RBAC, role-based access control, OpenSearch security, multi-tenant, query monitoring, top queries, data filtering, security plugin
meta_description: Learn how to use RBAC with OpenSearch Query Insights to control who can access query performance data, configure data filtering modes, and set up roles for multi-tenant environments.
---

OpenSearch Query Insights has become a go-to tool for understanding search query performance, offering features like [top N queries](https://opensearch.org/blog/query-insights/), [live queries](https://opensearch.org/blog/query-insights-live-queries/), [visual dashboards](https://opensearch.org/blog/query-insights-updates/), and more. As adoption grows, we've heard a common question from the community: *who should be able to see this data, and how much of it?*

Query performance records can reveal a lot about your users' search behavior---query patterns, accessed indexes, resource consumption. In multi-tenant environments or organizations with strict data governance, sharing this information with everyone isn't an option. That's why we've added **role-based access control (RBAC)** to Query Insights, giving you control over both who can access the APIs and what data they see in the response.

In this post, we'll walk through setting up RBAC for Query Insights---from configuring roles in the Security plugin to enabling data-level filtering---so you can confidently share query monitoring capabilities across your organization.

## Understanding the two-layer RBAC architecture

Before diving into the setup, it helps to understand the design. Query Insights RBAC operates on two independent layers, each serving a distinct purpose:

| Layer | Concern | Mechanism |
|-------|---------|-----------|
| **Security plugin** | Can the user call the API? | Role-based permission check |
| **Query Insights plugin** | What data does the user see? | Application-level filtering via `filter_by_mode` |

The first layer determines whether a user is allowed to access query insights endpoints at all. The second layer controls which query records are visible in the response, based on the user's identity.

This separation lets you grant a user access to the top queries API while ensuring they only see their own queries---or queries from users within the same team. The two layers work together but can be configured independently.

## Setting up roles in the Security plugin

The Security plugin ships with the `query_insights_full_access` predefined role. We also recommend creating a `query_insights_read_access` role for users who only need to view data. Let's look at both.

### Full access role

The `query_insights_full_access` role grants complete access to all query insights APIs, including the ability to view data, manage settings, and read/write historical query data stored in `top_queries-*` indexes:

```yaml
# Predefined role — ships with the Security plugin
query_insights_full_access:
  reserved: true
  cluster_permissions:
    - 'cluster:admin/opensearch/insights/*'
  index_permissions:
    - index_patterns:
        - 'top_queries-*'
      allowed_actions:
        - 'indices_all'
```

This role is suitable for cluster administrators and performance engineers who need unrestricted access to configure and monitor Query Insights.

### Read access role

For users who should view query data but not modify settings, we recommend creating a `query_insights_read_access` role. This role is not yet a predefined role in the Security plugin, but you can create it using the following definition:

```yaml
# Custom role — create this in your Security plugin configuration
query_insights_read_access:
  reserved: true
  cluster_permissions:
    - 'cluster:admin/opensearch/insights/top_queries'
    - 'cluster:admin/opensearch/insights/live_queries'
    - 'cluster:admin/opensearch/insights/health_stats'
  index_permissions:
    - index_patterns:
        - 'top_queries-*'
      allowed_actions:
        - 'read'
```

Key differences from full access:

- **No wildcard permissions**---explicitly lists only the three read APIs (top queries, live queries, health stats).
- **Excludes settings access**---users with this role cannot call `GET /_insights/settings` or `PUT /_insights/settings`.
- **Read-only index access**---users can query historical data in `top_queries-*` indexes but cannot modify or delete it.

This follows the same pattern established by other OpenSearch plugins, such as `alerting_read_access` and `anomaly_read_access`. We plan to add `query_insights_read_access` as a predefined role in a future release.

### Available permissions reference

The following table lists all query insights permissions that you can use when creating custom roles:

| Permission | Description |
|------------|-------------|
| `cluster:admin/opensearch/insights/*` | Full access to all query insights APIs |
| `cluster:admin/opensearch/insights/top_queries` | View top N queries |
| `cluster:admin/opensearch/insights/live_queries` | View live queries |
| `cluster:admin/opensearch/insights/health_stats` | View plugin health statistics |
| `cluster:admin/opensearch/insights/settings/get` | Read query insights configuration |
| `cluster:admin/opensearch/insights/settings/update` | Modify query insights configuration |

## Mapping roles to users

After setting up roles, you need to map them to your users. You can do this through any of the three methods supported by the Security plugin.

### Using the REST API

Create an internal user and map them to the read-access role:

```json
// Create a user with the analytics-team backend role
PUT _plugins/_security/api/internalusers/query-viewer
{
  "password": "a]strong-password123!",
  "backend_roles": ["analytics-team"]
}
```

```json
// Map the backend role to the read-access role
PUT _plugins/_security/api/rolesmapping/query_insights_read_access
{
  "backend_roles": ["analytics-team"],
  "users": ["query-viewer"]
}
```

### Using YAML configuration files

Add the mapping to your `roles_mapping.yml`:

```yaml
query_insights_read_access:
  reserved: false
  backend_roles:
    - "analytics-team"
  users:
    - "query-viewer"
```

### Using OpenSearch Dashboards

Navigate to **Security** > **Roles** > select `query_insights_read_access` > **Mapped users** tab and add users or backend roles.

![Placeholder: Screenshot of OpenSearch Dashboards Security Roles mapping interface](/assets/media/blog-images/2026-04-07-query-insights-rbac/dashboards-role-mapping.png)

## Configuring data-level filtering

Even after granting a user API access, you might want to control which query records they can actually see. Is a developer allowed to see queries from other teams? Should an analyst only see their own activity? Query Insights provides an application-level filtering mechanism through the `filter_by_mode` setting to address exactly these questions.

### Filter modes

Query Insights supports three filter modes:

| Mode | Behavior |
|------|----------|
| `none` (default) | No filtering---all records are visible to all users who have API access. |
| `username` | Users see only queries that they initiated. |
| `backend_roles` | Users see queries from any user who shares at least one backend role with them. |

### Enabling data filtering

To enable filtering, update the cluster setting:

```json
// Enable username-based filtering so users see only their own queries
PUT _cluster/settings
{
  "persistent": {
    "search.insights.top_queries.filter_by_mode": "username"
  }
}
```

Alternatively, if you have access to the [Query Insights Settings API](https://opensearch.org/docs/latest/observing-your-data/query-insights/settings-api/) (introduced in OpenSearch 3.5), you can use that instead. Note that changing this setting requires the `cluster:admin/opensearch/insights/settings/update` permission or cluster settings access.

### Choosing the right filter mode

**Use `none`** when all users with API access are trusted to see the full picture---for example, a dedicated SRE team or a single-tenant cluster.

**Use `username`** for strict isolation where each user should only see their own query activity. This is ideal for multi-tenant environments where individual accountability matters.

**Use `backend_roles`** for team-based visibility. For example, members of the `analytics-team` backend role can view all queries issued by anyone in that team, but not queries from the `engineering-team`.

In many cases, `backend_roles` offers the best balance between collaboration and isolation---teams can share performance insights internally while maintaining boundaries between groups.

## How it all works together

Let's walk through a concrete example to see both RBAC layers in action.

### Example: Multi-tenant cluster with team-based access

Suppose you have two teams---**analytics** and **engineering**---sharing a cluster. You want both teams to monitor their own query performance without seeing each other's data. The cluster admin needs full visibility across all teams.

**1. Create users with backend roles:**

```json
// Alice is on the analytics team
PUT _plugins/_security/api/internalusers/alice
{
  "password": "alice-password123!",
  "backend_roles": ["analytics-team"]
}

// Bob is on the engineering team
PUT _plugins/_security/api/internalusers/bob
{
  "password": "bob-password123!",
  "backend_roles": ["engineering-team"]
}
```

**2. Map backend roles to the read-access role:**

```json
// Both teams get read access to query insights
PUT _plugins/_security/api/rolesmapping/query_insights_read_access
{
  "backend_roles": ["analytics-team", "engineering-team"]
}
```

**3. Enable backend_roles filtering:**

```json
// Team members see only their team's queries
PUT _cluster/settings
{
  "persistent": {
    "search.insights.top_queries.filter_by_mode": "backend_roles"
  }
}
```

**4. Observe the results:**

- **Alice** calls `GET /_insights/top_queries`. She sees only queries issued by users in the `analytics-team` backend role.
- **Bob** calls the same endpoint. He sees only queries from `engineering-team` users.
- **Admin** (with the `all_access` role) calls the endpoint and sees all queries, regardless of the filter mode---admins always bypass application-level filtering.
- If Bob tries `PUT /_insights/settings`, the request is rejected because `query_insights_read_access` does not include settings permissions.

The following diagram illustrates the request flow through both RBAC layers:

![Placeholder: Diagram showing request flow through Security plugin permission check and Query Insights data filtering](/assets/media/blog-images/2026-04-07-query-insights-rbac/rbac-flow-diagram.png)

## Important considerations

There are a few important details to keep in mind when setting up RBAC:

- **Admin bypass**: Users with the `all_access` role always see all query records, regardless of the `filter_by_mode` setting. This ensures cluster administrators always have full visibility.

- **Security plugin required**: Data-level filtering relies on user identity information provided by the Security plugin. If the Security plugin is not installed, the plugin cannot determine user identity. When `filter_by_mode` is set to `username` or `backend_roles`, requests will return empty results because there is no user context to match against.

- **Identity capture at query time**: Query Insights records the username and backend roles of the user who issued each query at the time the query runs. This means that filtering is based on the user's identity when the query was executed, not when the data is viewed.

- **Historical data**: RBAC filtering applies to both in-memory (recent) query data and historical data stored in `top_queries-*` indexes. When querying historical data with `from` and `to` parameters, the same filtering rules are enforced.

- **Settings API access**: The [Query Insights Settings API](https://opensearch.org/docs/latest/observing-your-data/query-insights/settings-api/) (introduced in OpenSearch 3.5) provides dedicated permissions for managing query insights configuration. We recommend using this API with the `query_insights_full_access` role rather than granting broad cluster settings permissions.

## Conclusion

We're excited to bring RBAC support to Query Insights. The two-layer architecture---Security plugin permissions for API access control and application-level filtering for data visibility---gives you the flexibility to tailor access precisely to your organization's needs.

Whether you're running a multi-tenant cluster that requires strict data isolation or simply want to ensure that only authorized personnel can modify monitoring configurations, these tools provide a straightforward path to get there. Set up your roles, choose your filter mode, and let your teams focus on what matters: understanding and optimizing query performance.

To get started, make sure you have the latest OpenSearch version with the Security plugin and Query Insights plugin installed. For more information, see the [Query Insights documentation](https://opensearch.org/docs/latest/observing-your-data/query-insights/index/) and the [Security plugin access control guide](https://opensearch.org/docs/latest/security/access-control/index/).

We encourage you to explore this new functionality and share your experiences and feedback on the [OpenSearch forum](https://forum.opensearch.org/).
