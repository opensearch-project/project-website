---
layout: post
title: "Technical deep dive: Designing resource-level access control in OpenSearch"
authors:
  - dchanp
  - cwperks
date: 2026-09-20
categories:
  - technical-posts
meta_keywords: security, resource sharing, access control, distributed systems, extensibility, plugins, authorization
meta_description: "A deep dive into the architecture, design decisions, and migration path behind OpenSearch’s Resource Sharing and Access Control framework."
---

In [Part 1 of the resource sharing blog series](https://opensearch.org/blog/introducing-resource-sharing/), we introduced resource sharing and access control as a new way to collaborate on plugin-defined resources such as anomaly detectors and machine learning (ML) models.

This post examines the underlying architecture of that feature and demonstrates how you can adopt it in your own plugins:

* The limitations of the legacy `filter_by_backend_roles` model.
* The design of a resource-centric authorization model.
* Plugin integration using the new Security SPI.
* Access check functionality at query time, including subordinate resources that inherit access from a parent.
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
    * Removing access required role-mapping changes, not a change to the resource itself.

2. **Overly broad cluster privileges**

   Because access was controlled at the role level rather than the resource level, the following problems arose:

    * Roles needed powerful cluster permissions just so users could operate on their own resources.
    * It was difficult to grant *read-only access to this one detector* without granting broader capabilities.

3. **Distributed, plugin-specific metadata**

   Each plugin implemented its own access logic, resulting in:

    * Different JSON shapes for storing the owning user and their backend roles on each resource (for example, AD's `user` field on a detector document, ML Commons' own model-group metadata) - there was no shared `share_with`-style concept at all, since that's resource sharing's own vocabulary.
    * Different user experience patterns in OpenSearch Dashboards.
    * No central place to audit *access permissions and resource visibility*.

The new framework is designed to fix all of this.

---

## Design goals

When we started designing resource sharing, we focused on the following core principles:

1. **Resource-centric security**

   Authorization should be driven by who owns this resource and who it is shared with, not by backend-role overlaps that happen to exist.

2. **Centralized, reusable logic**:

    * One framework inside the Security plugin.
    * Plugins declare what is shareable and the actions that exist.
    * The Security plugin handles how access is evaluated.

3. **Minimal changes to plugin APIs**

   Plugins should maintain their existing approach while integrating with the new framework:

    * Keep exposing their existing REST APIs (such as `/detectors`, `/models`, `/reports`).
    * Delegate authorization to the Security plugin framework.
    * Avoid copying and pasting "get current user" boilerplate.

4. **Safe migration**

   Existing clusters cannot lose access patterns overnight. We needed to provide:

    * A way to import legacy sharing data into the new framework.
    * Feature flags and per-type rollout.
    * A reversible, observable migration step.

---

## High-level architecture

At a high level, resource sharing splits responsibility across three elements:

* **Resource plugins**: Own the functional resource (detectors, models, reports, dashboards).
* **Security plugin**: Owns the sharing model and access evaluation.
* **System indexes**: Store resources and the corresponding sharing metadata.

![Resource sharing high-level architecture: the resource plugin and the Dashboards Share UI both reach ResourceAccessHandler.hasPermission, which checks the resource's own sharing record first and, for a resource type that declares a parentType/parentId or belongs to a workspace, falls back to checkContainers before denying](/assets/media/blog-images/2026-09-20-resource-sharing-technical-deep-dive/architecture-diagram.png){: .img-fluid }

Key ideas:

* Each resource index (for example, `.opendistro-anomaly-detectors`) is paired with a sharing index owned by the Security plugin.
* Plugins consult the Resource Sharing SPI instead of performing their own access checks.
* OpenSearch Dashboards uses Security plugin REST endpoints to share, list, and manage resources.

The feature graduated out of experimental in OpenSearch 3.9 and is enabled in the Security plugin through the flag:

```yaml
plugins.security.resource_sharing.enabled: true
```

If you're upgrading a cluster that still has the pre-graduation key (`plugins.security.experimental.resource_sharing.enabled`) in `opensearch.yml` or as a persistent cluster setting, it continues to work as a deprecated alias.

---

## The resource-sharing data model

Resource sharing introduces a dedicated sharing document per resource, stored in a Security-plugin-managed index.

### Sharing document

For each resource, the Security plugin stores a document as follows:

```json
{
  "resource_id": "model-group-123",
  "resource_type": "ml-model-group",
  "tenant": "analytics-tenant",
  "created_by": {
    "user": "darshit"
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

The sharing document always carries `resource_id` and `resource_type`, plus:

* `tenant` - The tenant the resource belongs to, when multi-tenancy is enabled. A top-level field, not nested under `created_by`.
* `created_by` - The logical owner. Holds only a `user` field (the username) - there's no `tenant` here despite it being conceptually about ownership.
* `share_with` - A map of access levels (action groups) to recipients, plus an optional `general_access` field naming one access level granted to every authenticated user (covered in the public-sharing pattern below).
* `parent_type`/`parent_id` - Present when this resource declares a parent (see the subordinate-resources pattern later in this post).

Each access level under `share_with` defines the following scopes:

* `users` - Usernames with this access level
* `roles` - OpenSearch roles with this access level
* `backend_roles` - Backend roles with this access level

### Access levels as action groups

In the plugin, access levels are defined as resource action groups in `resource-access-levels.yml`:

```yaml
resource_types:
  sample-resource:
    sample_read_only:
      default: true
      allowed_actions:
        - "sampleresource:get"

    sample_read_write:
      allowed_actions:
        - "sampleresource:*"

    sample_full_access:
      allowed_actions:
        - "sampleresource:*"
        - "cluster:admin/security/resource/share"
```

`default: true` marks the access level a resource of this type gets when the Migration API isn't told an explicit one - see the Migration section later in this post. Only one level per type should carry it.

The Security plugin reads this file at startup and uses it to answer questions like “Does this user have `sample_read_write` on resource X?”

### Public, private, and restricted sharing patterns

The `share_with` structure lets you express the following common patterns.

**Private (default)**:

```json
{
  "share_with": {}
}
```

The resource is visible only to the owner and superadmins.

**Public**:

```json
{
  "share_with": {
    "general_access": "sample_read_only"
  }
}
```

`general_access` is a dedicated field on `share_with`, not a wildcard recipient - it names one access level (here `sample_read_only`, from the plugin's own `resource-access-levels.yml`) that's granted to every authenticated user, in addition to whatever named recipients the resource may separately have at other access levels.

**Restricted**:

```json
{
  "share_with": {
    "sample_read_only": {
      "users": ["alice"],
      "roles": ["analytics_viewer"],
      "backend_roles": ["fraud-team"]
    }
  }
}
```

Only the listed principals can access this resource at the `sample_read_only` access level. `sample_read_only` is a plugin-defined access-level name, the same kind declared in `resource-access-levels.yml` - there's no reserved or special-cased level name here.

---

## Query-time evaluation: How results are filtered

There are two complementary aspects of runtime evaluation:

1. **Implicit filtering** for List and Search APIs
2. **Explicit checks** for point operations or custom flows

### 1. Implicit filtering through all_shared_principals

When a plugin lists resources, it should operate without needing to know the current user's identity. The system accomplishes this through the following process:

1. The plugin exposes a list or Search API (for example, `GET /_plugins/_reports/definitions`).
2. Within the handler, the plugin issues a search against its system index using a plugin client (a system-level subject).
3. The Security plugin attaches a document-level security (DLS) query behind the scenes.
4. This DLS query checks an `all_shared_principals` field on each resource document.

A resource document might appear as follows:

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
* or the bare `public` sentinel, added whenever the resource has a `general_access` level set (not a `user:*` wildcard - there isn't one)

This is the pattern Anomaly Detection and flow-framework use for search filtering - both implement `IdentityAwarePlugin` and route the search through a `PluginClient`. It's one valid path, not the only one: ml-commons, for example, doesn't implement `IdentityAwarePlugin` at all, and filters its model-group search by calling `getAccessibleResourceIds` and applying a terms filter on the IDs (the same technique covered under "getAccessibleResourceIds: Cross-index flows" later in this section) rather than relying on the automatic DLS injection. Both approaches end up enforcing the same access rules; which one fits depends on whether your plugin already has a plugin-subject client wired up.

The following is a code snippet from the Anomaly Detection plugin that demonstrates the `IdentityAwarePlugin` + `PluginClient` approach for search operations:

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

### 2. Explicit checks using the ResourceSharingClient

Several plugins that adopted resource sharing before automatic evaluation covered their paths call the `ResourceSharingClient` from the SPI directly, for operations that don't go through DLS-filtered search - a get by ID, an update, a delete, or a resource that isn't index-backed.

> **If you are writing a new plugin, you do not need to call this client.** It exists as an interim bridge for plugins that still carry `filter_by_backend_roles` flags and the code paths behind them, so they can adopt resource sharing incrementally rather than in one cut-over. The intent is to retire the client along with those legacy flags: once `filter_by_backend_roles` is gone, the `ResourceSharingClient` goes with it.
>
> The Security plugin's own `sample-resource-plugin`, which is the reference implementation for onboarding, does not call any of these three methods. A plugin starting fresh gets both search filtering and per-resource verification from the Security plugin, including for hierarchical resources. Search is filtered automatically through `all_shared_principals` as described above, and `ResourceAccessEvaluator` intercepts a plugin's transport actions and runs the same `hasPermission` check the client would, parent resolution included. To rely on that, your transport request needs to implement `DocRequest` and return a non-blank `id()`, the resource `type()`, and the resource `index()`; the type has to be listed in `protected_types`; and for a child resource, its `ResourceProvider` needs to declare `parentType()` and `parentIdField()` so the evaluator can walk to the parent on its own. Note that core `GetRequest` and `DocWriteRequest` operations against the resource index are deliberately left to `SystemIndexAccessEvaluator` and system index protection instead.
>
> You do still implement `assignResourceSharingClient`, because it's a method on the `ResourceSharingExtension` interface - the sample plugin implements it and simply stores the client without ever calling it. Implementing the callback and calling the client are separate things.
>
> The rest of this section documents the client for the plugins that currently use it, and because you will encounter these calls when reading their source.

The SPI provides three main methods:

```java
void verifyAccess(String resourceId,
                  String resourceType,
                  String action,
                  ActionListener<Boolean> listener);

void getAccessibleResourceIds(String resourceType,
                              ActionListener<Set<String>> listener);

boolean isFeatureEnabledForType(String resourceType);
```

#### `isFeatureEnabledForType`: Guard rails

Use this method as your top-level guard:

```java
public static boolean shouldUseResourceAuthz(String resourceType) {
    var client = ResourceSharingClientAccessor.getInstance().getResourceSharingClient();
    return client != null && client.isFeatureEnabledForType(resourceType);
}
```

If this method returns `false`, you can safely fall back to your legacy behavior (for example, `filter_by_backend_roles`).

#### `verifyAccess`: Point checks

Use `verifyAccess` when you want to enforce access on one specific resource and a specific action.

**Typical examples**:

* `GET /_plugins/_my_plugin/resources/{id}`
* `DELETE /_plugins/_my_plugin/resources/{id}`
* Custom operations such as `/_plugins/_my_plugin/resources/{id}/_search`

**Implementation example**:

*(`forbidden(id)` and `toErrorResponse(e)` below are illustrative stand-ins for your own REST response helpers, not Security-plugin API - the real `Responses.forbidden(channel, message)` writes to the channel directly rather than returning a response object. The point of these examples is the `ResourceSharingClient` calls, not the REST plumbing around them.)*

```java
public void getResourceById(String id, RestChannel channel) {
    if (!shouldUseResourceAuthz("sample-resource")) {
        // Legacy path
        getResourceLegacy(id, channel);
        return;
    }

    var client = ResourceSharingClientAccessor.getInstance().getResourceSharingClient();
    client.verifyAccess(
        id,
        "sample-resource",
        "sampleresource:get",
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

If the Security plugin is disabled entirely, `ResourceSharingClientAccessor.getResourceSharingClient()` returns `null`, which is exactly what the `shouldUseResourceAuthz` guard from the previous section checks for - your plugin falls back to its legacy path before `verifyAccess` is ever called. Separately, if you call `verifyAccess` for a resource type that's onboarded but not (yet) listed in `protected_types`, the client fails open - it logs a warning and allows the request rather than denying it - so a plugin that skips the guard doesn't get locked out by a type that hasn't been enabled yet.

#### `getAccessibleResourceIds`: Cross-index flows

When you need to filter by ID but cannot rely on DLS, you can retrieve the set of resource IDs that the current user can access and apply your own filters.

**Example implementation**:

```java
public void getResources(RestChannel channel) {
    client.getAccessibleResourceIds("sample-resource", ActionListener.wrap(
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
* You're composing results from multiple resource types - call this once per type and intersect or merge the ID sets yourself, since each call is scoped to a single `resourceType`.

### 3. Subordinate resources: Gate against the parent's ID and type directly

Some resources don't stand on their own - they belong to a parent resource and should inherit its access. An alert's comment, for example, isn't shared directly; access to it should follow access to the alert's monitor. The request that creates a comment has no monitor-shaped identity of its own for the automatic `DocRequest` evaluation to key off, and the comment itself has no separate sharing record - so call `verifyAccess` with the **parent's** ID and type instead of the comment's:

```java
public void createComment(String monitorId, String commentText, RestChannel channel) {
    client.verifyAccess(
        monitorId,
        "monitor",
        "cluster:admin/opensearch/alerting/comments/write",
        ActionListener.wrap(
            allowed -> {
                if (Boolean.FALSE.equals(allowed)) {
                    channel.sendResponse(forbidden(monitorId));
                    return;
                }
                writeComment(monitorId, commentText, channel);
            },
            e -> channel.sendResponse(toErrorResponse(e))
        )
    );
}
```

This is the pattern the Alerting plugin actually uses for comments: it looks up the alert's `monitorId`, then calls `verifyAccess(monitorId, "monitor", action, ...)` directly - the comment-write action is only in the read-write and full-access level groups, so a read-only share (or no share at all) on the monitor is denied. There is no comment-specific `ResourceSharing` record at all.

`ResourceSharing` separately supports an optional `parentType`/`parentId` on a resource's own sharing record: when set, `hasPermission` falls back to checking the declared parent (recursing, so grandparent chains work) if the resource's own `share_with` doesn't grant the action. This is a real mechanism in active use - the Reporting plugin's `ReportsSchedulerExtension` declares `parentType() = "report-definition"` and `parentIdField()` for its report-instance resource type, so a report instance inherits access from the report definition that created it without needing its own separate sharing configuration. It's a different case from Alerting's comments, though: report instances have their own `ResourceProvider`/sharing record to attach `parentType`/`parentIdField` to, while comments don't. Reach for the parent-typed `verifyAccess` call above for a subordinate resource with no sharing record of its own; reach for `parentType`/`parentId` when the resource type has its own `ResourceProvider` and sharing record and should inherit on top of it. For a new plugin, prefer the second: registering the child as its own resource type with a declared parent lets `ResourceAccessEvaluator` walk to the parent for you, so you never call the client at all.

One caveat either way: once access is granted, your transport action's own system-index read or write still runs as the calling user, who typically has no direct index privilege on your system index - `GetRequest`s and plain document writes are deliberately excluded from the automatic `DocRequest` evaluation and handled by index-level authorization instead. Route that read/write through your plugin subject (the same pattern used for the implicit-filtering search earlier in this section).

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

The `compileOnly` SPI dependency and `extendedPlugins` entry are consistent across the plugins that have adopted the framework. The `opensearchPlugin ... @zip` configuration for pulling the Security plugin zip into integration tests is common (Anomaly Detection and ML Commons both use it) but not universal - flow-framework instead uses a `secureIntegTestPluginArchive(...)` helper for the same purpose. Follow whichever convention your plugin's existing integ-test setup already uses.

### 2. Implement the ResourceSharingExtension and register it

Create a class that implements `org.opensearch.security.spi.resources.ResourceSharingExtension`. Its `getResourceProviders()` method returns one `ResourceProvider` per resource type you own, each naming that type's `resourceType()` and `resourceIndexName()` (action-group mapping is declared separately, in `resource-access-levels.yml` from the previous section, not on this interface).

Then register it using Java’s SPI mechanism:

```text
src/main/resources/META-INF/services/org.opensearch.security.spi.resources.ResourceSharingExtension
```

The file contains one fully qualified class name per line, following the standard Java `ServiceLoader` convention - most plugins only need one, but the sample plugin itself registers three separate extension implementations this way:

```text
org.opensearch.sample.SampleResourceExtension
```

### 3. Provide resource-access-levels.yml

Create a configuration file that defines your resource types and action groups:

```yaml
resource_types:
  sample-resource:
    sample_read_only:
      default: true
      allowed_actions:
        - "sampleresource:get"

    sample_read_write:
      allowed_actions:
        - "sampleresource:*"

    sample_full_access:
      allowed_actions:
        - "sampleresource:*"
        - "cluster:admin/security/resource/share"
```

The `resource_types` keys must match the `resourceType()` string each of your `ResourceProvider` instances returns from `getResourceProviders()` - the Security plugin registers a resource type twice under a mismatched name and it won't resolve at evaluation time.

### 4. Use system indexes and a plugin client

* Store resources in system indexes and keep system index protection enabled.
* Use a plugin client when reading or writing those indexes so the Security plugin can apply DLS.
* Avoid accessing system indexes using ad hoc `ThreadContext.stashContext` calls; use identity-aware mechanisms instead.

### 5. Receive the ResourceSharingClient

`ResourceSharingExtension` requires you to implement `assignResourceSharingClient`, so your plugin needs somewhere to hold the client the Security plugin hands it. The usual pattern is a small accessor class (typically a singleton wrapper - the version below uses eager initialization and a `volatile` field for thread-safe visibility; Anomaly Detection's own `ResourceSharingClientAccessor` uses lazy initialization instead, so treat this as one valid implementation rather than a citation of that class):

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

During plugin initialization, the Security plugin automatically injects the `ResourceSharingClient`.

Receiving the client is required; calling it is not. The sample resource plugin stores it exactly like this and never calls it, relying on automatic evaluation instead. If your plugin is bridging existing `filter_by_backend_roles` paths, the three methods are there:

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
        nodeSetting "plugins.security.resource_sharing.enabled", "true"
        nodeSetting "plugins.security.resource_sharing.protected_types",
          "[\"sample-resource\"]"
    }
}
```

This lets you run tests with resource sharing turned on and verify access behavior.

---

## Cluster controls: Feature flags and protected types

Cluster administrators control the rollout using two settings:

```yaml
plugins.security.resource_sharing.enabled: true
plugins.security.resource_sharing.protected_types: ["anomaly-detector", "forecaster", "ml-model-group", "workflow", "workflow_state"]
```

* `enabled` - The feature flag, disabled by default.
* `protected_types` - The list of resource types that should use resource-level auth.

From OpenSearch 3.4 onward these settings are dynamic, so they can be updated at runtime rather than requiring a node restart:

```json
PUT _cluster/settings
{
  "persistent": {
    "plugins.security.resource_sharing.enabled": true,
    "plugins.security.resource_sharing.protected_types": [
      "anomaly-detector",
      "forecaster",
      "ml-model-group",
      "workflow",
      "workflow_state"
    ]
  }
}
```

This approach provides the following capabilities:

* Enabling the framework globally
* Opting in specific resource types gradually
* Rolling back by clearing the protected types list

---

## Migration: From legacy metadata to shared resources

Existing clusters already have detectors, models, and other resources with embedded backend-role-based access control.

To avoid disrupting existing functionality, the Security plugin exposes a Migration API:

```http
POST /_plugins/_security/api/resources/migrate
```

The API requires three parameters and accepts two more that are optional:

* `source_index` - The index in which the existing resources are located (required)
* `username_path` - A JSON pointer to the owner field in each document (required)
* `backend_roles_path` - A JSON pointer to the backend roles array (required)
* `default_owner` - A fallback when ownership cannot be inferred (optional)
* `default_access_level` - A map from resource type to a default access level (optional - each type only needs one if it has no level marked `default: true` in its own `resource-access-levels.yml`)

**Example usage**:

```json
POST /_plugins/_security/api/resources/migrate
{
  "source_index": ".sample_resource",
  "username_path": "/owner",
  "backend_roles_path": "/backend_roles",
  "default_owner": "some_user",
  "default_access_level": {
    "sample-resource": "sample_read_only",
    "sample-resource-group": "sample_group_read_only"
  }
}
```

The migration flow looks like this:

![Migration flow: for each scrolled document, the Security plugin indexes a new sharing record if none exists (migrated) or reconciles workspaces on an existing one (backfilledExisting or skippedExisting), then returns a summary with migrated, backfilledExisting, skippedNoType, skippedExisting, and failed counts](/assets/media/blog-images/2026-09-20-resource-sharing-technical-deep-dive/migration-flow-diagram.png){: .img-fluid }

The response summary reports five counts: `migrated` (newly created sharing records), `backfilledExisting` (already-migrated records whose data changed and were reconciled), `skippedNoType` (documents whose type couldn't be classified), `skippedExisting` (already-migrated records with nothing to reconcile), and `failed` (records that could not be migrated). The response also lists the specific resource IDs that were skipped for missing type and the ones that fell back to `default_owner`.

Only REST admins or superadmin users can run this API.

If you're instead upgrading a cluster that already has resource sharing enabled under the pre-graduation setting names, no separate migration step is needed - those names resolve as deprecated aliases to the current ones, and a persistent cluster setting under an old key is automatically rewritten to the current key during upgrade.

### Why this needed two mechanisms, not one

A `SettingUpgrader` alone doesn't cover `opensearch.yml`: `SettingUpgrader` instances run against cluster state, so a node whose static configuration still uses the pre-graduation key would fail to start with an `unknown setting` error, and a persistent cluster setting under the old key would silently reset the feature to disabled the moment the new key replaced it in the registered settings list. The fix pairs two independent mechanisms:

* Each current setting is declared with the old setting as its **fallback**, resolved at read time against whichever `Settings` instance is supplied. This covers `opensearch.yml`, persistent cluster settings, and dynamic updates alike - a dynamic update to the old key still moves the resolved value and fires the update consumer, exactly as if the current key had been updated.
* A **`SettingUpgrader`** per setting rewrites the old key to the current one during cluster-state recovery and on any cluster settings update that still uses it, so an upgraded cluster stops carrying the deprecated key in `GET _cluster/settings` instead of keeping it indefinitely. The `SettingUpgrader` depends on the old key still being a registered (if deprecated) setting, which is also what lets the fallback resolve it.

Because `Setting.Property.Deprecated`'s built-in warning names only the old key, not its replacement, the setting logs its own explicit warning naming the current key whenever the deprecated one is in use - so a cluster running on the old key keeps working through the upgrade and is told exactly what to change.

---

## Share, list, and manage resources in OpenSearch Dashboards

Once the framework is enabled and plugins have adopted it, OpenSearch Dashboards builds on top of the Security plugin REST APIs:

* `PUT /_plugins/_security/api/resource/share`
* `PATCH /_plugins/_security/api/resource/share`
* `POST /_plugins/_security/api/resource/share`
* `GET /_plugins/_security/api/resource/share`
* `GET /_plugins/_security/api/resource/list`
* `GET /_plugins/_security/api/resource/types`

These APIs enable OpenSearch Dashboards to provide comprehensive resource management capabilities:

* Sharing detectors with specific users and roles
* Displaying accessible resources and whether the current user can share them further
* Listing all available resource types and their corresponding access levels

The Security plugin centralizes the logic; each feature plugin focuses on its own domain (detectors, models, dashboards, or reports).

These APIs back the Resource Access Management page in OpenSearch Dashboards, which has shipped since 3.3 as the built-in surface for reviewing shareable resources and their access levels, and which gained multi-data-source support in 3.5.

OpenSearch Dashboards itself ships a centralized Share button that calls these APIs directly, so plugin UIs don't each build their own sharing dialog - see [Embedding the resource sharing Share button in OpenSearch Dashboards](https://opensearch.org/blog/embedded-resource-sharing-share-button/) for how a plugin page mounts it and how it stays aware of which data source is selected in a multi-data-source (MDS) deployment.

---

## Framework benefits and adoption

The Resource Sharing and Access Control framework moves OpenSearch from:

**Role-centric visibility**:
"If we share a backend role, we see each other's resources."

to:

**Resource-centric control**:
"This detector is owned by X, shared with Y, under access level Z."

For operators, this means:

* A clearer audit trail of who can access what.
* Safer, more incremental rollouts using feature flags and protected types.
* A single, consistent sharing experience in OpenSearch Dashboards.

For plugin authors, it provides:

* Less boilerplate access-control code.
* A standard SPI to plug into.
* Automatic DLS-based filtering for list and search APIs.
* A migration path from legacy `filter_by_backend_roles` and plugin-specific metadata.

---

## What changed between 3.3 and 3.9

The framework shipped as experimental in 3.3 and evolved substantially before graduating. The list below covers both the Security plugin (server side) and the Security Dashboards plugin (UI side), since the two moved together. If you're on an older version, this is roughly what applies to you:

**3.3 - Initial experimental release.** DLS-based automatic filtering via `all_shared_principals`, the Dashboards-facing resource access management APIs, tenant tracking on sharing records, and the `protected_types` list setting. On the UI side, this is also when the Resource Access Management page arrived in OpenSearch Dashboards, giving a single place to review shareable resources and their access levels instead of inspecting sharing records by hand.

**3.4 - Configuration and multi-type support.** The feature-flag settings became dynamic (updatable through the cluster settings API instead of requiring a restart). A single resource index could now host multiple shareable resource types, and sharing documents began carrying `resource_type`. The Migration API tightened up: `default_owner` became required, and `default_access_level` handling was reworked. The standalone `share` and `revoke` Java APIs were removed in favor of the REST APIs, and `ResourceProvider` became an interface. The sharing-update API gained POST support, and the Resource Access Management page moved over to it.

**3.5 - Multi-data-source support in the UI.** No server-side changes, but the Resource Access Management page gained multi-data-source support, so it can manage sharing on a selected remote data source rather than only the local cluster.

**3.6 - Parent-child authorization and defaults.** `ResourceProvider` gained `parentType()`/`parentIdField()`, enabling the parent-inheritance model described earlier in this post. `resource-access-levels.yml` gained the `default: true` key, which is what lets the Migration API's `default_access_level` be optional. Input validation on the sharing APIs was hardened.

**3.7 - Sharing document shape.** The `general_access` field was added, giving public sharing a dedicated field rather than requiring a named recipient entry. `tenant` was elevated to a top-level field on the sharing document (it had previously been nested).

**3.8 - Kotlin interop fix.** `assignResourceSharingClient` gained a `@Nullable` annotation to prevent an NPE in Kotlin consumers.

**3.9 - Graduation and the centralized Share button.** The feature came out of experimental and the settings dropped their `.experimental.` segment, with the old names retained as deprecated aliases. Server side also added: audit logging for sharing authorization events, workspace-aware sharing records, parent-linked sharing entries for child resources written without an authenticated user context, and support for multiple `ResourceProvider` registrations per shared resource index. On the UI side, this is the release that introduced the centralized Share button described earlier, along with a per-data-source availability check exposed through its SPI so a consumer plugin can tell whether resource sharing is actually enabled on the selected data source - see [Embedding the resource sharing Share button in OpenSearch Dashboards](https://opensearch.org/blog/embedded-resource-sharing-share-button/) for details.



Resource sharing and access control is generally available starting in OpenSearch 3.9. If you're developing a plugin and want to adopt resource sharing, start by performing these steps:

1. Implement the `ResourceSharingExtension` and register your plugin as a resource plugin.
2. Define your resource access levels in `resource-access-levels.yml`.
3. Mark your resource indexes as system indexes and use a plugin client for access.
4. Shape the transport actions that operate on a single resource as `DocRequest`s carrying the resource's ID, type, and index, so automatic evaluation applies, and declare `parentType()`/`parentIdField()` on any child resource type that should inherit from its parent.
5. Add your resource type to `protected_types`, enable the feature in a test cluster, and iterate.

After this, your plugin can inherit a complete, centralized sharing model with consistent behavior across OpenSearch.

Have feedback, questions, or a use case the framework doesn't cover yet? Share it on the [OpenSearch forum](https://forum.opensearch.org/).