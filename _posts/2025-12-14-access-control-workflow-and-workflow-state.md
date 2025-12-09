---
layout: post
title: "Access control for Flow-framework resources in OpenSearch"
authors:
  - dchanp
date: 2025-12-14
categories:
  - technical-post
meta_keywords: flow framework, workflow, access control, resource sharing, security, plugins, extensibility, authorization
meta_description: Learn how Flow Framework integrates with the OpenSearch Resource Sharing and Access Control framework to provide document-level authorization for workflow templates and workflow state documents.
tags:
  - security
  - access control
  - resource sharing
  - flow framework
  - opensearch 3.4
---

The Flow Framework plugin now integrates with the OpenSearch Security plugin’s Resource Sharing and Access Control framework, providing document-level authorization for both workflow templates and workflow state documents. This unifies access behavior across the plugin and replaces the legacy `filter_by_backend_roles` mechanism.

With this integration, access to workflows and workflow states is driven by centrally stored sharing records. Resource owners can decide exactly who can read, update, or administer a workflow and its state by granting access to specific users, roles, or backend roles. This makes the Flow Framework consistent with anomaly detectors, forecasters, ML model groups, and other plugins that have adopted resource-level authorization.

Flow Framework exposes three built-in access levels for each resource type: read-only, read-write, and full access. These levels map to the OpenSearch actions required by Flow Framework APIs and cannot be customized. Full access also enables resharing using the Security plugin’s resource-sharing API.

Clusters upgrading from earlier releases can migrate existing workflow metadata into the new framework using the Resource Sharing migrate API. This is a one-time administrative step that ensures previously accessible workflows remain available under the new model.

Below are the onboarding details for each resource type.

---

## Workflow (templates)

* Resource type: `workflow`
* System index: `.plugins-flow-framework-templates`
* Introduced in: 3.4

### Access levels

**workflow_read_only**
Allows retrieval and search operations:

```yaml
- "cluster:admin/opensearch/flow_framework/workflow/get"
- "cluster:admin/opensearch/flow_framework/workflow/search"
```

**workflow_read_write**
Allows full workflow access except sharing:

```yaml
- "cluster:admin/opensearch/flow_framework/workflow/*"
- "cluster:monitor/*"
```

**workflow_full_access**
Grants complete access and allows resharing:

```yaml
- "cluster:admin/opensearch/flow_framework/workflow/*"
- "cluster:monitor/*"
- "cluster:admin/security/resource/share"
```

---

## Workflow state

* Resource type: `workflow-state`
* System index: `.plugins-flow-framework-state`
* Introduced in: 3.4

### Access levels

**workflow_state_read_only**
Allows retrieval and search operations:

```yaml
- "cluster:admin/opensearch/flow_framework/workflow_state/get"
- "cluster:admin/opensearch/flow_framework/workflow_state/search"
```

**workflow_state_read_write**
Allows full workflow state modification except sharing:

```yaml
- "cluster:admin/opensearch/flow_framework/workflow_state/*"
- "cluster:monitor/*"
```

**workflow_state_full_access**
Grants complete access and allows resharing:

```yaml
- "cluster:admin/opensearch/flow_framework/workflow_state/*"
- "cluster:monitor/*"
- "cluster:admin/security/resource/share"
```

---

## Enabling resource-level authorization

Cluster administrators can enable the framework and protect resource types in `opensearch.yml` or dynamically through the cluster settings API:

```yaml
plugins.security.experimental.resource_sharing.enabled: true
plugins.security.system_indices.enabled: true
plugins.security.experimental.resource_sharing.protected_types:
  - "workflow"
  - "workflow-state"
```

---

## Migration from legacy behavior

Administrators must migrate legacy sharing metadata using the Resource Sharing migrate API once the feature is enabled and the types are marked as protected. The API reads owner and backend role information from existing documents and creates corresponding sharing records in the Security-managed index.

Example for 3.4+ clusters:

```curl
POST _plugins/_security/api/resources/migrate
{
  "source_index": ".plugins-flow-framework-templates",
  "username_path": "/user/name",
  "backend_roles_path": "/user/backend_roles",
  "default_owner": "<existing-user>",
  "default_access_level": {
    "workflow": "<pick-one-access-level>"
  }
}
```

```curl
POST _plugins/_security/api/resources/migrate
{
  "source_index": ".plugins-flow-framework-state",
  "username_path": "/user/name",
  "backend_roles_path": "/user/backend_roles",
  "default_owner": "<existing-user>",
  "default_access_level": {
    "workflow-state": "<pick-one-access-level>"
  }
}
```

