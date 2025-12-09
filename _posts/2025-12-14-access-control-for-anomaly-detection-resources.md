---
layout: post
title: "Access control for Anomaly Detection resources in OpenSearch"
authors:
  - dchanp
date: 2025-12-14
categories:
  - technical-post
meta_keywords: anomaly-detection, security, resource sharing, access control, plugins, authorization
meta_description: "Learn how the Anomaly Detection plugin in OpenSearch 3.3+ uses the Resource Sharing and Access Control framework to provide fine-grained, document-level authorization for detectors and forecasters."
tags:
  - anomaly-detection
  - security
  - access control
  - resource sharing
  - opensearch 3.3
---

OpenSearch 3.3 introduces a major update to the Anomaly Detection plugin: both **detectors** and **forecasters** now integrate with the Security plugin’s resource-level sharing framework. This gives you document-level control over who can view, edit, or manage these resources.

With this framework, each detector or forecaster has its own centrally managed sharing record. Resource owners—and users with share permissions—can grant access to specific users, roles, or backend roles without adjusting global role mappings.

This unified approach replaces the older `filter_by_backend_roles` settings in both Anomaly Detection and Forecasting.

## Onboarding details

The Anomaly Detection plugin contributes two shareable resource types:

| Resource          | Type name          | System index                    | Introduced |
| ----------------- | ------------------ | ------------------------------- | ---------- |
| Anomaly detectors | `anomaly-detector` | `.opendistro-anomaly-detectors` | 3.3        |
| Forecasters       | `forecaster`       | `.opensearch-forecasters`       | 3.3        |

Once resource sharing is enabled and these types are marked as protected, all access evaluation for detectors and forecasters flows through the Security plugin’s resource-level authorization engine.

## Enabling resource-level access

Cluster administrators enable this feature by adding a resource type to the protected list:

```yaml
plugins.security.experimental.resource_sharing.enabled: true
plugins.security.system_indices.enabled: true
plugins.security.experimental.resource_sharing.protected_types:
  - "anomaly-detector"
  - "forecaster"
```

In OpenSearch 3.4 and later, these settings can also be updated dynamically with `_cluster/settings`.

## Access levels for detectors and forecasters

The plugin defines dedicated access levels for each resource type. These levels express the capabilities a shared user should have.

### Detector access levels

#### ad_read_only

Grants view and search operations on a detector:

```yaml
- cluster:admin/opendistro/ad/detector/info
- cluster:admin/opendistro/ad/detector/validate
- cluster:admin/opendistro/ad/detector/preview
- cluster:admin/opendistro/ad/detectors/get
- cluster:admin/opendistro/ad/result/topAnomalies
```

#### ad_read_write

Allows full detector operations except sharing:

```yaml
- cluster:admin/opendistro/ad/*
- cluster:monitor/*
- cluster:admin/ingest/pipeline/delete
- cluster:admin/ingest/pipeline/put
```

#### ad_full_access

Provides complete access, including the ability to reshare:

```yaml
- cluster:admin/ingest/pipeline/delete
- cluster:admin/ingest/pipeline/put
- cluster:admin/opendistro/ad/*
- cluster:monitor/*
- cluster:admin/security/resource/share
```

### Forecaster access levels

#### forecast_read_only

Grants view and search operations on a forecaster:

```yaml
- cluster:admin/plugin/forecast/forecaster/info
- cluster:admin/plugin/forecast/forecaster/stats
- cluster:admin/plugin/forecast/forecaster/suggest
- cluster:admin/plugin/forecast/forecaster/validate
- cluster:admin/plugin/forecast/forecasters/get
- cluster:admin/plugin/forecast/forecasters/info
- cluster:admin/plugin/forecast/result/topForecasts
```

#### forecast_read_write

Allows full forecaster operations except sharing:

```yaml
- cluster:admin/plugin/forecast/*
- cluster:monitor/*
- cluster:admin/settings/update
```

#### forecast_full_access

Provides complete access, including sharing:

```yaml
- cluster:admin/plugin/forecast/*
- cluster:monitor/*
- cluster:admin/settings/update
- cluster:admin/security/resource/share
```

These access levels are fixed. If you need additional permission tiers, the project recommends opening an issue in the Anomaly Detection repository.

## Migrating from legacy access behavior

If your cluster previously relied on backend roles for visibility, migration is required.

Once a resource type is protected and the feature is enabled, cluster administrators should run the migration API to import owner and backend-role data into the central sharing index.

### Example (3.4+ clusters)

```curl
POST _plugins/_security/api/resources/migrate 
{
  "source_index": ".opendistro-anomaly-detectors",
  "username_path": "/user/name",
  "backend_roles_path": "/user/backend_roles",
  "default_owner": "<existing-user>",
  "default_access_level": {
    "anomaly-detector": "<ad_read_only | ad_read_write | ad_full_access>"
  }
}
```

And for forecasters:

```curl
POST _plugins/_security/api/resources/migrate 
{
  "source_index": ".opensearch-forecasters",
  "username_path": "/user/name",
  "backend_roles_path": "/user/backend_roles",
  "default_owner": "<existing-user>",
  "default_access_level": {
    "forecaster": "<forecast_read_only | forecast_read_write | forecast_full_access>"
  }
}
```

The API reports which resources were migrated, which were skipped, and which required fallback defaults.

## What this means for your workflows

With resource-level access enabled:

* Detector and forecaster visibility no longer depends on backend-role overlap.
* Sharing becomes explicit, fine-grained, and easy to audit.
* Users can collaborate on specific detectors or forecasters without broader cluster permissions.
* OpenSearch Dashboards provides consistent UI controls for sharing and listing accessible resources.

For administrators, it offers clearer oversight and a safer migration path. For developers and data scientists, it makes AD resources first-class collaborative objects.

If your team relies on Anomaly Detection, enabling resource sharing is a straightforward way to modernize your access model and prepare for future features like hierarchical resource grouping.

