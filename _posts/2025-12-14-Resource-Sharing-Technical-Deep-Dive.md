---
layout: post
title: "Technical deep dive: Designing resource-level access control in OpenSearch"
authors:
  - dchanp
  - cwperks
date: 2025-12-14
categories:
  - technical-post
meta_keywords: security, resource sharing, access control, distributed systems, extensibility, plugins, authorization
meta_description: "A deep dive into the architecture, design decisions, and migration path behind OpenSearch’s Resource Sharing and Access Control framework."
tags:
  - security
  - access control
  - resource sharing
  - dashboards
  - opensearch 3.3
---

In [Part 1 of the resource sharing blog series](https://opensearch.org/blog/introducing-resource-sharing/), we introduced resource sharing and access control as a new way to collaborate on plugin-defined resources such as anomaly detectors and machine learning (ML) models.

This post examines the underlying architecture of that feature and demonstrates how you can adopt it in your own plugins:

* The limitations of the legacy `filter_by_backend_roles` model.
* The design of a resource-centric authorization model.
* Plugin integration using the new Security SPI.
* Access check functionality at query time.
* Safe migration from legacy behavior.
* A practical onboarding path for plugin developers.

If you're building or operating plugins on OpenSearch, this post provides essential information for your development process.

---

## From backend roles to resource owners

Before resource sharing, most OpenSearch plugins used a simple pattern:

* Each resource (for example, detector, model, or report) stored identity metadata (creator, backend roles).
* Visibility was controlled by checking for backend role overlap between creator and viewer.
* In the Anomaly Detection plugin, visibility control was managed by `plugins.anomaly_detection.filter_by_backend_roles`. In the ML Commons plugin, visibility control was managed by `plugins.ml_commons.model_access_control_enabled`.

This approach worked for basic multi-tenancy but had significant limitations.

### Shortcomings of filter_by_backend_roles

The backend role approach created several significant problems:

1. **Implicit, role-coupled sharing**

   If two users shared a backend role, they could see each other's resources. This created the following issues:

    * No way for the owner to specify *share with Alice, but not with Bob* if both users shared a role.
    * Removing access required role-mapping changes, not a change on the resource itself.

2. **Overly broad cluster privileges**

   Because access was controlled at the role level rather than the resource level, the following problems arose:

    * Roles needed powerful cluster permissions just so users could operate on their own resources.
    * It was difficult to grant *read-only access to this one detector* without granting broader capabilities.

3. **Distributed, plugin-specific metadata**

   Each plugin implemented its own access logic, resulting in:

    * Different JSON shapes for `owner` and `shared with`.
    * Different user experience patterns in OpenSearch Dashboards.
    * No central place to audit *access permissions and resource visibility*.

The new framework is designed to fix all of this.

---

## Design goals

When we started designing resource sharing, we focused on the following core principles:

1. **Resource-centric security**

   Authorization should be driven by who owns this resource and who it is shared with, not by backend-role overlaps that happen to exist.

2. **Centralized, reusable logic**:

    * One framework inside the Security plugin
    * Plugins declare what is shareable and the actions that exist
    * The Security plugin handles how access is evaluated

3. **Minimal changes to plugin APIs**

   Plugins should maintain their existing approach while integrating with the new framework:

    * Keep exposing their existing REST APIs (such as `/detectors`, `/models`, `/reports`)
    * Delegate authorization to the Security plugin framework
    * Avoid copying and pasting "get current user" boilerplate

4. **Safe migration**

   Existing clusters cannot lose access patterns overnight. We needed to provide:

    * A way to import legacy sharing data into the new framework
    * Feature flags and per-type rollout
    * A reversible, observable migration step

---

## High-level architecture

At a high level, resource sharing splits responsibility across three parts:

* **Resource plugins**: Own the functional resource (detectors, models, reports, dashboards).
* **Security plugin**: Owns the sharing model and access evaluation.
* **System indexes**: Store resources and the corresponding sharing metadata.

```yaml
flowchart TD
    U[User / OpenSearch Dashboards] -->|Create / Read / Update / Delete| PL[Resource Plugin]

    subgraph Security[Security Plugin]
      API[Security REST APIs - Resource share & list]
      RAE[ResourceAccessEvaluator - query-time authorization]
      MAP[Index Mapping & Routing - resource -> sharing index]
    end

    subgraph Data[System Indexes - per plugin]
      RIDX1[(Resource Index A)]
      RSIDX1[(Sharing Index A)]
      RIDX2[(Resource Index B)]
      RSIDX2[(Sharing Index B)]
    end

    PL --> RIDX1
    PL --> RIDX2

    %% Query-time evaluation
    PL --> RAE
    RAE --> MAP
    MAP -->|resolve| RSIDX1
    MAP -->|resolve| RSIDX2

    %% Dashboards access management flows
    U -->|Share UI - GET/PUT/POST/PATCH| API
    API --> MAP
    MAP --> RSIDX1 & RSIDX2
```

Key ideas:

* Each resource index (for example, `.opendistro-anomaly-detectors`) is paired with a sharing index owned by the Security plugin.
* Plugins consult the Resource Sharing SPI instead of performing their own access checks.
* OpenSearch Dashboards uses Security plugin REST endpoints to share, list, and manage resources.

The feature is introduced in the Security plugin as an experimental capability, behind the flag:

```yaml
plugins.security.experimental.resource_sharing.enabled: true
```

---

## The resource-sharing data model

Resource sharing introduces a dedicated sharing document per resource, stored in a Security-plugin-managed index.

### Sharing document

For each resource, the Security plugin stores a document as follows:

```json
{
  "resource_id": "model-group-123",
  "created_by": {
    "user": "darshit",
    "tenant": "analytics-tenant"
  },
  "share_with": {
    "sample_read_only": {
      "users": ["user1", "user2"],
      "roles": ["viewer_role"],
      "backend_roles": ["data_analyst"]
    },
    "sample_read_write": {
      "users": ["admin_user"],
      "roles": ["editor_role"],
      "backend_roles": ["content_manager"]
    }
  }
}
```

The sharing document contains three key fields:

* `resource_id` — A unique ID within the plugin's resource index.
* `created_by` — The logical owner (user and, optionally, tenant).
* `share_with` — A map of access levels (action groups) to recipients.

Each access level under `share_with` defines the following scopes:

* `users` — usernames with this access level
* `roles` — OpenSearch roles with this access level
* `backend_roles` — backend roles with this access level

### Access levels as action groups

In the plugin, access levels are defined as resource action groups in `resource-action-groups.yml`:

```yaml
resource_types:
  sample-resource:
    sample_read_only:
      allowed_actions:
        - "cluster:admin/sample-resource-plugin/get"

    sample_read_write:
      allowed_actions:
        - "cluster:admin/sample-resource-plugin/*"

    sample_full_access:
      allowed_actions:
        - "cluster:admin/sample-resource-plugin/*"
        - "cluster:admin/security/resource/share"
```

The Security plugin reads this file at startup and uses it to answer questions like “Does this user have `sample_read_write` on resource X?”

### Public, private, and restricted sharing patterns

The `share_with` structure lets you express the following common patterns.

**Private (default)**:

```json
{
  "share_with": {}
}
```

Visible only to the owner and superadmins.

**Public**:

```json
{
  "share_with": {
    "default": {
      "users": ["*"]
    }
  }
}
```

Any authenticated user can access the resource at the `default` access level.

**Restricted**:

```json
{
  "share_with": {
    "default": {
      "users": ["alice"],
      "roles": ["analytics_viewer"],
      "backend_roles": ["fraud-team"]
    }
  }
}
```

Only the listed principals can access this resource via that access level.

---

## Query-time evaluation: how results are filtered

There are two complementary pieces to runtime evaluation:

1. **Implicit filtering** for List and Search APIs.
2. **Explicit checks** for point operations or custom flows.

### 1. Implicit filtering through all_shared_principals

When a plugin lists resources, we want it to operate without needing to know the current user's identity. The system accomplishes this through the following process:

1. The plugin exposes a list or Search API (for example, `GET /_plugins/_reports/definitions`).
2. Within the handler, the plugin issues a search against its system index using a plugin client (a system-level subject).
3. The Security plugin attaches a Document-level security (DLS) query behind the scenes.
4. This DLS query checks an `all_shared_principals` field on each resource document.

A resource document might look as follows:

```json
{
  "name": "sharedDashboard",
  "description": "Shared with multiple principals",
  "type": "dashboard",
  "created_at": "2025-09-02T14:30:00Z",
  "all_shared_principals": [
    "user:resource_sharing_test_user_alice",
    "user:resource_sharing_test_user_bob",
    "role:analytics_team",
    "role:all_access",
    "role:auditor"
  ]
}
```

If the authenticated user is:

* `username: resource_sharing_test_user_alice`
* with role `analytics_team`

then the Security plugin limits the result set to documents where `all_shared_principals` contains:

* `user:resource_sharing_test_user_alice`
* or `role:analytics_team`
* or a wildcard such as `user:*` for public visibility

To make this work in a future-proof way, the implementation follows these principles:

* Plugins declare themselves as `IdentityAwarePlugin` so they can use their plugin subject to access system indexes.
* The plugin uses its plugin client instead of stashing thread context manually.
* The Security plugin injects the DLS filter automatically.

The following is a code snippet from the Anomaly Detection plugin that demonstrates `PluginClient` usage for search operations:

```java
public void search(SearchRequest request, String resourceType, ActionListener<SearchResponse> actionListener) {
    User user = ParseUtils.getUserContext(client);
    boolean shouldUseResourceAuthz = ParseUtils.shouldUseResourceAuthz(resourceType);
    ActionListener<SearchResponse> listener = wrapRestActionListener(actionListener, CommonMessages.FAIL_TO_SEARCH);
    try (ThreadContext.StoredContext context = client.threadPool().getThreadContext().stashContext()) {
        if (pluginClient != null && shouldUseResourceAuthz) {
            // request will be auto-filtered in security plugin
            pluginClient.search(request, actionListener);
        } else {
            validateRole(request, user, listener);
        }
    } catch (Exception e) {
        logger.error(e);
        listener.onFailure(e);
    }
}
```

### 2. Explicit checks using ResourceSharingClient

For operations that cannot rely solely on DLS (for example, get by ID, update, delete, or non-index-backed resources), plugins call the `ResourceSharingClient` from the SPI.

The SPI provides three main methods:

```java
void verifyAccess(String resourceId,
                  String resourceIndex,
                  String action,
                  ActionListener<Boolean> listener);

void getAccessibleResourceIds(String resourceIndex,
                              ActionListener<Set<String>> listener);

boolean isFeatureEnabledForType(String resourceType);
```

#### isFeatureEnabledForType: Guard rails

Use this method as your top-level guard:

```java
public static boolean shouldUseResourceAuthz(String resourceType) {
    var client = ResourceSharingClientAccessor.getInstance().getResourceSharingClient();
    return client != null && client.isFeatureEnabledForType(resourceType);
}
```

If this method returns `false`, you can safely fall back to your legacy behavior (for example, `filter_by_backend_roles`).

#### verifyAccess: Point checks

Use `verifyAccess` when you want to enforce access on one specific resource and a specific action.

**Typical examples**:

* `GET /_plugins/_my_plugin/resources/{id}`
* `DELETE /_plugins/_my_plugin/resources/{id}`
* Custom operations such as `/_plugins/_my_plugin/resources/{id}/_search`

**Implementation example**:

```java
public void getResourceById(String id, RestChannel channel) {
    if (!shouldUseResourceAuthz("sample-resource")) {
        // Legacy path
        getResourceLegacy(id, channel);
        return;
    }

    var client = ResourceSharingClientAccessor.getInstance().getResourceSharingClient();
    // if this is a protected resource request verifyAccess is not required as the resource access will be evaluated directly
    // call verify access only if resource is protected via hierarchy
    client.verifyAccess(
        id,
        ".sample_resource",
        "cluster:admin/sample-resource-plugin/get",
        ActionListener.wrap(
            allowed -> {
                if (Boolean.FALSE.equals(allowed)) {
                    channel.sendResponse(forbidden(id));
                    return;
                }
                // Now safe to read from the index
                fetchAndReturnResource(id, channel);
            },
            e -> channel.sendResponse(toErrorResponse(e))
        )
    );
}
```

If the Security plugin is disabled, the SPI implementation safely becomes a no-op and treats the request as allowed, so your plugin does not have to special-case that.

#### getAccessibleResourceIds: Cross-index flows

When you need to filter by ID but cannot rely on DLS, you can retrieve the set of resource IDs that the current user can access and apply your own filters.

**Example implementation**:

```java
public void getResources(RestChannel channel) {
    client.getAccessibleResourceIds(".sample_resource", ActionListener.wrap(
        accessibleIds -> {
            // Add a terms filter on the resource ID
            SearchSourceBuilder source = new SearchSourceBuilder()
                .query(QueryBuilders.termsQuery("_id", accessibleIds));
            // ...
        },
        e -> channel.sendResponse(toErrorResponse(e))
    ));
}
```

This approach works well for cases where:

* You need a custom query that does not go through the standard DLS filter path.
* You are composing results across multiple indexes and want to intersect with accessible IDs.

---

## Developer integration: Becoming a “resource plugin”

To opt in, a plugin implements the Resource Sharing SPI and follows these conventions.

### 1. Add the SPI dependency and extend the Security plugin

In `build.gradle`, add the following configuration:

```gradle
configurations {
  opensearchPlugin
}

dependencies {
  compileOnly group: 'org.opensearch', name: 'opensearch-security-spi', version: "${opensearch_build}"
  opensearchPlugin "org.opensearch.plugin:opensearch-security:${opensearch_build}@zip"
}

opensearchplugin {
    name '<your-plugin>'
    description '<description>'
    classname '<your-classpath>'
    extendedPlugins = ['opensearch-security;optional=true']
}
```

### 2. Implement ResourceSharingExtension and register it

Create a class that implements `org.opensearch.security.spi.resources.ResourceSharingExtension`. This class informs the Security plugin about:

* The resource indexes you own.
* The resource types that are shareable.
* How those types map to your action groups.

Then register it using Java’s SPI mechanism:

```text
src/main/resources/META-INF/services/org.opensearch.security.spi.ResourceSharingExtension
```

The file must contain exactly one line with the fully qualified class name, for example:

```text
org.opensearch.sample.SampleResourceSharingExtension
```

### 3. Provide resource-action-groups.yml

Create a configuration file that defines your resource types and action groups:

```yaml
resource_types:
  sample-resource:
    sample_read_only:
      allowed_actions:
        - "cluster:admin/sample-resource-plugin/get"

    sample_read_write:
      allowed_actions:
        - "cluster:admin/sample-resource-plugin/*"

    sample_full_access:
      allowed_actions:
        - "cluster:admin/sample-resource-plugin/*"
        - "cluster:admin/security/resource/share"
```

The `resource_types` keys must match the types you declare in `ResourceSharingExtension`.

### 4. Use system indexes and a plugin client

* Store resources in system indexes and keep system index protection enabled.
* Use a plugin client when reading or writing those indexes so the Security plugin can apply DLS.
* Avoid accessing system indexes using ad-hoc `ThreadContext.stashContext` calls; use identity-aware mechanisms instead.

### 5. Wire in the ResourceSharingClient

Create a small accessor class to obtain the SPI client (typically implemented as a singleton wrapper):

```java
public class ResourceSharingClientAccessor {
    private static final ResourceSharingClientAccessor INSTANCE = new ResourceSharingClientAccessor();

    private volatile ResourceSharingClient client;

    public static ResourceSharingClientAccessor getInstance() {
        return INSTANCE;
    }

    public void setResourceSharingClient(ResourceSharingClient client) {
        this.client = client;
    }

    public ResourceSharingClient getResourceSharingClient() {
        return client;
    }
}
```

During plugin initialization, the Security plugin automatically injects the `ResourceSharingClient`. Your handlers then call:

* `isFeatureEnabledForType` to decide whether to use resource-level auth.
* `verifyAccess` to guard point operations.
* `getAccessibleResourceIds` for custom flows.

### 6. Test with resource sharing enabled

Configure your integration test cluster setup as follows:

```gradle
integTest {
    systemProperty "resource_sharing.enabled", System.getProperty("resource_sharing.enabled")
}

testCluster {
    nodeSetting "plugins.security.system_indices.enabled", "true"
    if (System.getProperty("resource_sharing.enabled") == "true") {
        nodeSetting "plugins.security.experimental.resource_sharing.enabled", "true"
        nodeSetting "plugins.security.experimental.resource_sharing.protected_types",
          "[\"sample-resource\"]"
    }
}
```

This lets you run tests with resource sharing turned on and verify access behavior.

---

## Cluster controls: Feature flags and protected types

Cluster administrators control the rollout using two settings:

```yaml
plugins.security.experimental.resource_sharing.enabled: true
plugins.security.experimental.resource_sharing.protected_types: ["anomaly-detector", "forecaster", "ml-model", "workflow", "workflow_state"]
```

* `enabled` — The feature flag, disabled by default.
* `protected_types` — List of resource types that should use resource-level auth.

From OpenSearch 3.4 onward, these can be updated dynamically:

```json
PUT _cluster/settings
{
  "persistent": {
    "plugins.security.experimental.resource_sharing.enabled": true,
    "plugins.security.experimental.resource_sharing.protected_types": [
      "anomaly-detector",
      "forecaster",
      "ml-model",
      "workflow",
      "workflow_state"
    ]
  }
}
```

This approach provides the following capabilities:

* Enabling the framework globally.
* Opting in specific resource types gradually.
* Rolling back by clearing the protected types list.

---

## Migration: From legacy metadata to shared resources

Existing clusters already have detectors, models, and other resources with embedded backend-role–based access control.

To avoid disrupting existing functionality, the Security plugin exposes a Migration API:

```http
POST /_plugins/_security/api/resources/migrate
```

The API requires the following parameters:

* `source_index` — The index in which the existing resources are located.
* `username_path` — A JSON pointer to the owner field in each document.
* `backend_roles_path` — A JSON pointer to the backend roles array.
* `default_owner` — A fallback when ownership cannot be inferred.
* `default_access_level` — A map from resource type to default action group.

**Example usage**:

```json
POST /_plugins/_security/api/resources/migrate
{
  "source_index": ".sample_resource",
  "username_path": "/owner",
  "backend_roles_path": "/backend_roles",
  "default_owner": "some_user",
  "default_access_level": {
    "sample-resource": "read_only",
    "sample-resource-group": "read-only-group"
  }
}
```

The migration flow looks like this:

```yaml
sequenceDiagram
    participant Admin as Cluster Admin
    participant MAPI as Migration API
    participant Core as Security Plugin (Migration)
    participant Src as Resource Index
    participant RSIDX as Sharing Index

    Admin->>MAPI: POST /resources/migrate {...}
    MAPI->>Core: Validate request & resolve sharing index
    Core->>Src: Scroll existing resource documents

    loop each document
        Core->>RSIDX: Upsert sharing doc\n{resource_id, created_by.user,\n share_with[default].backend_roles}
    end

    RSIDX-->>Core: Migration stats
    Core-->>Admin: 200 OK (summary + skipped IDs)
```

The response summary includes the following information:

* How many resources were migrated.
* How many were skipped (for missing type or owner).
* The resources that were assigned `default_owner`.

Only REST admins or superadmin users can run this API.

---

## Share, list, and manage resources in OpenSearch Dashboards

Once the framework is enabled and plugins are onboarded, OpenSearch Dashboards builds on top of the Security plugin REST APIs:

* `PUT /_plugins/_security/api/resource/share`
* `PATCH /_plugins/_security/api/resource/share`
* `POST /_plugins/_security/api/resource/share`
* `GET /_plugins/_security/api/resource/share`
* `GET /_plugins/_security/api/resource/list`
* `GET /_plugins/_security/api/resource/types`

These APIs enable OpenSearch Dashboards to provide comprehensive resource management capabilities:

* Sharing detectors with specific users and roles.
* Displaying accessible resources and resharing permissions for the current user.
* Listing all available resource types and their corresponding access levels.

The Security plugin centralizes the logic; each feature plugin focuses on its own domain (detectors, models, dashboards, or reports).

---

## Framework benefits and adoption

The Resource Sharing and Access Control framework moves OpenSearch from:

**Role-centric visibility**:
"If we share a backend role, we see each other's resources."

to:

**Resource-centric control**:
"This detector is owned by X, shared with Y, under access level Z."

For operators, this means:

* Clearer auditability of who can access what.
* Safer, more incremental rollouts using feature flags and protected types.
* A single, consistent sharing experience in OpenSearch Dashboards.

For plugin authors, it provides:

* Less boilerplate access-control code.
* A standard SPI to plug into.
* Automatic DLS-based filtering for list and search APIs.
* A migration path from legacy `filter_by_backend_roles` and plugin-specific metadata.

---

## Try resource sharing and share your feedback

Resource sharing and access control is available as an experimental feature in OpenSearch 3.3 and later. If you're developing a plugin and want to adopt resource sharing, start with performing these steps:

1. Implement `ResourceSharingExtension` and register your plugin as a resource plugin.
2. Define your resource action groups in `resource-action-groups.yml`.
3. Mark your resource indexes as system indexes and use a plugin client for access.
4. Use `isFeatureEnabledForType` and `verifyAccess` in your handlers.
5. Enable the feature for your resource type in a test cluster and iterate.

After this, your plugin can inherit a complete, centralized sharing model with consistent behavior across the OpenSearch platform.

Your input helps us improve the feature before it becomes generally available. Please share your experiences, questions, and suggestions on the [OpenSearch Forum](https://forum.opensearch.org/). 