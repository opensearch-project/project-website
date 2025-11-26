---
layout: post
title: "Introducing resource sharing: A new access control model for OpenSearch"
authors:
  - cwperks
  - dchanp
date: 2025-11-25
categories:
  - technical-post
meta_keywords: security, resource sharing, access control, distributed systems, extensibility, plugins, authorization
meta_description: "Learn how OpenSearch 3.3 introduces resource sharing and access control, a new framework for fine-grained collaboration on plugin-defined resources such as ML models and anomaly detectors."
tags:
  - security
  - access control
  - resource sharing
  - anomaly detection
  - ml commons
  - dashboards
  - opensearch 3.3
---

Collaboration is at the heart of OpenSearch. Teams often need to share artifacts such as dashboards and visualizations, along with plugin-defined resources such as reports, machine learning (ML) models, and anomaly detectors, across users and roles. At the same time, administrators must ensure that access remains controlled, auditable, and consistent with broader security policies.

Starting in OpenSearch 3.3, the Security plugin introduces **resource sharing and access control**, a framework that enables users to share resources with other users or roles while enforcing fine-grained access rules. This model brings resource-level authorization to higher-level objects defined by plugins and creates a consistent collaboration experience across OpenSearch.

---

## Why resource sharing and access control matter

Traditional role-based access control defines who can query indexes or manage clusters but does not provide a native mechanism for sharing higher-level objects such as ML models, report definitions, and anomaly detectors.

You may need to share higher-level objects across teams to avoid duplication, ensure consistency, and streamline collaboration, for example:

* A central data team might create a report definition that schedules weekly compliance reports. Other teams need to view and run this report without duplicating it.
* A fraud analytics team could define an anomaly detector for transaction data. Security engineers may need to view the detector configuration in order to build alerts or integrate monitoring.
* Data scientists might train an ML Commons model and want to share it across departments without rebuilding or exporting it.

Resource sharing and access control provide the missing layer by allowing these resources to be owned, shared, and audited with fine-grained control.

---

## Key concepts

To use resource sharing effectively, it's important to understand the key concepts that define how resources are managed and accessed:

* **Resource**: Any higher-level object managed by an OpenSearch plugin, such as a report definition, anomaly detector, or ML model.
* **Ownership**: Every resource has an owner (usually, the creator) who can decide how and with whom it is shared.
* **Sharing targets**: A resource can be shared with specific users or roles.
* **Access levels**: Access levels, also known as action groups, define the specific actions a user or role can take on a resource.
* **Auditability**: All sharing operations are logged for transparency and compliance.

---

## Legacy access control model

Historically, many OpenSearch plugins have relied on a coarse, backend-role–based model to control access to plugin-defined resources. In this model---commonly referred to as `filter_by_backend_role`---a resource created by one user becomes visible to another user only if both users share at least one backend role. In practice, this means that when two users share a backend role, they automatically gain access to each other’s resources, and the resource owner cannot control who can view, modify, or use those resources.

This model introduces several limitations:

* **No owner-controlled sharing**: Access is automatic and implicit. If two users share a backend role, they see one another’s detectors, models, or other resources—regardless of intent.

* **Overly broad cluster permissions**: Because permissions are role based rather than resource based, administrators must grant large cluster-level privileges to allow operations that only involve a single resource.

* **Storing user identity snapshots**: Plugins need to persist identity metadata alongside each resource, which adds complexity and tightly couples resource metadata to the user lifecycle.

For the Anomaly Detection plugin, the setting that controls this model is `plugins.anomaly_detection.filter_by_backend_roles`. For the ML Commons plugin, this setting is `plugins.ml_commons.model_access_control_enabled`.

---

## Access levels

An **access level** is a group of permissions that are applicable to a single resource. Each plugin that creates sharable resources must specify a list of access levels associated with the sharable resource. Access levels define the actions a user can perform on a resource, with each increasing level granting additional capabilities.

A good mental model for access levels is the familiar Google Docs sharing model, where the owner of a Google Doc can share the document at these levels:

- **Viewer**: Users at the viewer level can read the document.
- **Commenter**: Users at the commenter level can read the document and leave comments.
- **Editor**: Editors can read, comment on, and edit the document.
- **Full Access**: Users with full access can read, edit, comment on, and share the document.

---

## API walkthrough

You can manage resource sharing using REST APIs. The following examples demonstrate common operations, such as sharing a resource, viewing its status, and updating who has access. These APIs work across supported plugins such as Anomaly Detection and ML Commons.

### 1. Share a resource

```json
PUT /_plugins/_security/api/resource/share
{
  "resource_id": "resource-123",
  "resource_type": "my-type",
  "share_with": {
    "read_only": {
      "users": ["alice"],
      "roles": ["readers"]
    },
    "read_write": {
      "users": ["bob"]
    }
  }
}
```

### 2. Check sharing status

```
GET /_plugins/_security/api/resource/share?resource_id=<id>&resource_type=<type>
```

**Response:**

```json
{
  "sharing_info": {
    "resource_id": "resource-123",
    "created_by": { "username": "admin" },
    "share_with": {
      "read_only": {
        "users": ["alice"],
        "roles": ["readers"]
      },
      "read_write": {
        "users": ["bob"]
      }
    }
  }
}
```

### 3. Patch sharing (add or revoke)

```json
PATCH /_plugins/_security/api/resource/share
{
  "resource_id": "resource-123",
  "resource_type": "my-type",
  "add": {
    "read_only": {
      "users": ["charlie"]
    }
  },
  "revoke": {
    "read_only": {
      "users": ["alice"]
    },
    "read_write": {
      "users": ["bob"]
    }
  }
}
```

---

## Cluster settings

You can enable resource sharing using cluster settings.

In **OpenSearch 3.3**, you can only change resource sharing settings by updating `opensearch.yml` and restarting the cluster:

```yaml
plugins.security.experimental.resource_sharing.enabled: true
plugins.security.experimental.resource_sharing.protected_types: ["anomaly-detector", "forecaster", "ml-model"]
```

Starting with **OpenSearch 3.4**, these settings will be able to be updated dynamically at runtime by using the `_cluster/settings` API:

```json
PUT _cluster/settings
{
  "persistent": {
    "plugins.security.experimental.resource_sharing.enabled": "true",
    "plugins.security.experimental.resource_sharing.protected_types": [
      "anomaly-detector",
      "forecaster",
      "ml-model"
    ]
  }
}
```

`plugins.security.experimental.resource_sharing.enabled` enables or disables resource sharing globally. `plugins.security.experimental.resource_sharing.protected_types` marks the resource types that should use resource-level authorization when the feature is enabled.

By default, resource sharing is **disabled** so that administrators can opt in intentionally.

---

## Current plugin support

Initial support for resource sharing is available in the following plugins:

* **Anomaly Detection**: Share detectors and forecasters across users.
* **ML Commons**: Share trained models across teams without duplication.

Additional plugins, including Reporting, are expected to adopt this framework in future releases.

---

## Migration API

For clusters with existing resources, the Security plugin provides a migration API to help move from legacy backend-role-based visibility to the new owner-based model. When possible, the migration process uses `username_path` and `backend_roles_path` to extract ownership and access data from existing metadata. When ownership cannot be determined, you must specify a `default_owner` for the resource.

After migrating, the owner can use the **Resource Access Control** page in OpenSearch Dashboards to manage sharing:

```json
POST /_plugins/_security/api/resources/migrate
{
  "source_index": ".sample_resource",
  "username_path": "/owner",
  "backend_roles_path": "/backend_roles",
  "default_access_level": {
    "sample-resource": "read_only",
    "sample-resource-group": "read-only-group"
  }
}
```

---

## Best practices

When implementing resource sharing in your OpenSearch cluster, consider the following recommendations to ensure secure and effective collaboration:

* **Enable cautiously**: Test in a staging environment before enabling resource sharing across a production cluster.
* **Follow the least privilege model**: Share resources with the lowest required access level.

---

## Looking ahead

As additional plugins adopt this framework, users will gain a consistent, secure, and predictable way to collaborate across the entire OpenSearch experience. Plugin developers will benefit from simpler security integrations and reduced reliance on custom access checks.

As the Dashboards, Visualizations, and Reporting plugins adopt the resource sharing model, users will gain a unified, collaboration-friendly sharing model throughout OpenSearch.

Stay tuned for Part 2 of this blog post, in which we will review the underlying metadata model, explore how access evaluations work at query time, and discuss the scalability considerations that shape the framework.

---

## Conclusion

With the introduction of resource sharing and access control in OpenSearch 3.3, teams can collaborate on higher-level resources with greater flexibility and security. Whether you manage report definitions, anomaly detectors, or ML models, you can now share them safely with colleagues and teams.

You can try this feature today by enabling it in your cluster settings and exploring the APIs. If you use the Anomaly Detection or ML Commons plugins, consider sharing a detector or model to see how this framework simplifies collaboration and security in your environment.

