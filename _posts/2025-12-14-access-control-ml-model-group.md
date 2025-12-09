---
layout: post
title: "Access control for ML model groups in OpenSearch"
authors:
  - dchanp
date: 2025-12-14
categories:
  - technical-post
meta_keywords: ml-model, ml-model-group, ml commons, security, resource sharing, access control, plugins, authorization
meta_description: "Learn how ML Commons integrates with the OpenSearch Resource Sharing and Access Control framework to provide document-level authorization for ML model groups."
tags:
  - ml commons
  - security
  - access control
  - resource sharing
  - opensearch 3.3
---

Starting in OpenSearch 3.3, ML Commons integrates with the Security plugin’s resource sharing framework to provide document-level authorization for ML model groups. This replaces the older `plugins.ml_commons.model_access_control_enabled` setting and introduces a clearer, centralized way to manage visibility and sharing.

With resource sharing enabled, each model group has a dedicated sharing record that determines which users, roles, and backend roles can access it. Owners and users with share permission can grant or revoke access without modifying role mappings or cluster-wide permissions.

## Onboarding details

ML Commons exposes one shareable resource type:

| Resource        | Type name        | System index              | Introduced |
| --------------- | ---------------- | ------------------------- | ---------- |
| ML model groups | `ml-model-group` | `.plugins-ml-model-group` | 3.3        |

When this type is protected, model group visibility is evaluated by the Security plugin at the document level. Because model groups control access to the models inside them, sharing a model group implicitly grants access to its associated models.

## Enabling resource-level access

Cluster administrators enable the feature by marking the resource type as protected:

```yaml
plugins.security.experimental.resource_sharing.enabled: true
plugins.security.system_indices.enabled: true
plugins.security.experimental.resource_sharing.protected_types:
  - "ml-model-group"
```

In OpenSearch 3.4 and later, these settings can also be updated at runtime using `_cluster/settings`.

## Access levels for ML model groups

ML Commons defines three access levels for controlling access to a model group:

### ml_read_only

Grants view and search-only access to the shared model group:

```yaml
- cluster:admin/opensearch/ml/model_groups/get
- cluster:admin/opensearch/ml/models/get
```

### ml_read_write

Grants full access to a model group except sharing:

```yaml
- cluster:admin/opensearch/ml/*
```

### ml_full_access

Grants complete access, including permission to manage sharing:

```yaml
- cluster:admin/opensearch/ml/*
- cluster:admin/security/resource/share
```

These access levels are fixed. If you need additional tiers, the ML Commons project recommends filing an issue in the GitHub repository.

## Migrating from legacy access behavior

Clusters that previously relied on `model_access_control_enabled` need to migrate to the new framework. After enabling the feature and marking the type as protected, cluster administrators should run the migration API to import existing ownership and backend-role access into the centralized sharing index.

### Example (3.4+ clusters)

```curl
POST _plugins/_security/api/resources/migrate 
{
  "source_index": ".plugins-ml-model-group",
  "username_path": "/owner/name",
  "backend_roles_path": "/owner/backend_roles",
  "default_owner": "<replace-with-existing-user>",
  "default_access_level": {
    "ml-model-group": "<ml_read_only | ml_read_write | ml_full_access>"
  }
}
```

The response reports how many model groups were migrated, which ones required fallback defaults, and which were skipped because of missing metadata.

## What this means for ML workflows

Model groups become collaborative, shareable assets. You can grant read-only access to allow inference calls, full access for teams managing training pipelines, or share permissions with operational users who manage deployments.

For administrators, the new framework provides clearer auditing and explicit access records, while preserving backward compatibility through migration. For developers and data scientists, it introduces a straightforward way to manage who can use and modify model groups.

If your workloads rely on ML Commons, enabling resource sharing for model groups brings more control, clarity, and safety to your access model.

