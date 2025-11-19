---
layout: post
title: "Introducing resource sharing: A new access control model for OpenSearch"
authors:
  - cwperks
  - DarshitChanpura
date: 2025-11-25
categories:
  - technical-post
meta_keywords: security, resource sharing, access control, distributed systems, extensibility, plugins, authorization
meta_description: "Learn how OpenSearch 3.4 introduces resource sharing and access control, a new framework for fine-grained collaboration on plugin-defined resources such as ML models and anomaly detectors."
tags:
  - security
  - access control
  - resource sharing
  - anomaly detection
  - ml commons
  - dashboards
  - opensearch 3.4
---

# Introducing resource sharing: A new access control model for OpenSearch

Collaboration is at the heart of OpenSearch. Teams often need to share artifacts such as dashboards and visualizations, along with plugin-defined resources such as reports, machine learning (ML) models, and anomaly detectors, across users and roles. At the same time, administrators must ensure that access remains controlled, auditable, and consistent with broader security policies.

Starting in OpenSearch 3.4, the Security plugin introduces **resource sharing and access control**, a framework that enables users to share resources with other users or roles while enforcing fine-grained access rules. This model brings resource-level authorization to higher-level objects defined by plugins and creates a consistent collaboration experience across the OpenSearch ecosystem.

---

## Why resource sharing and access control matters

Traditional role-based access control determines who can query indices or manage clusters, but higher-level objects such as ML models, report definitions, and anomaly detectors have not previously had a native sharing mechanism.

For example:

* A central data team might create a report definition that schedules weekly compliance reports. Other teams need to view and run this report without duplicating it.
* A fraud analytics team could define an anomaly detector for transaction data. Security engineers may need to look at the detector configuration to build alerts or integrate monitoring.
* Data scientists might train an ML Commons model and want to share it across departments without rebuilding or exporting it.

Resource sharing and access control provides the missing layer—allowing these resources to be owned, shared, and audited with fine-grained control.

---

## Key concepts

* **Resource**: Any higher-level object managed by an OpenSearch plugin, such as report definitions, anomaly detectors, or ML models.
* **Ownership**: Every resource has an owner (usually the creator) who can decide how and with whom it is shared.
* **Sharing targets**: A resource can be shared with specific users or roles.
* **Access levels**: Access levels, also known as action groups, define the specific actions a user or role can take on a resource.
* **Auditability**: All sharing operations are logged for transparency and compliance.

---

### Legacy access control model

Historically, many OpenSearch plugins have relied on a coarse, backend-role–based model to control access to plugin-defined resources. In this model—commonly referred to as `filter_by_backend_role`—a resource created by one user becomes visible to another only if both users share at least one backend role. This ties visibility entirely to role overlap, giving the resource owner no ability to control who can or cannot see their resource.

This model introduces several limitations:

* **No owner-controlled sharing**
  Access is automatic and implicit. If two users share a backend role, they see one another’s detectors, models, or other resources—regardless of intent.

* **Overly broad cluster permissions**
  Because permissions are role based rather than resource based, administrators must grant large cluster-level privileges to allow operations on what should be a single resource.

* **Storing user identity snapshots**
  Plugins need to persist identity metadata alongside each resource, which adds complexity and tightly couples resource metadata to user lifecycle.

For anomaly detection, the setting that controls this model is `plugins.anomaly_detection.filter_by_backend_roles`. For ML Commons, this setting is `plugins.ml_commons.model_access_control_enabled`.

---

## Access levels

An **access level** defines a set of permissions that apply to an individual resource. Plugins that create sharable resources must declare the access levels associated with each type. Access levels build progressively on one another.

A helpful mental model is the sharing experience in a common collaboration tool:

* **Viewer** – Users can view the resource.
* **Commenter** – Users can view the resource and leave comments.
* **Editor** – Users can view, comment on, and edit the resource.
* **Full access** – Users can view, edit, comment on, and share the resource.

In resource sharing, these capabilities map to action groups, which the plugin defines.

---

## API walkthrough

You can manage resource sharing using REST APIs. The following examples demonstrate common operations, such as sharing a resource, viewing its status, and updating who has access. These APIs work across supported plugins such as Anomaly Detection and ML Commons.

### 1. Share a resource

```curl
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

```curl
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

```curl
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
      ]
    },
    "read_write": {
      "users": ["bob"]
    }
  }
}
```

---

## Cluster settings in 3.4

Administrators can enable or disable resource sharing at runtime using dynamic cluster settings:

```curl
PUT _cluster/settings
{
  "persistent": {
    "plugins.security.experimental.resource_sharing.enabled": "true",
    "plugins.security.experimental.resource_sharing.protected_types": ["anomaly-detector", "forecaster", "ml-model"]
  }
}
```

* `plugins.security.experimental.resource_sharing.enabled`: Enables or disables resource sharing globally.
* `plugins.security.experimental.resource_sharing.protected_types`: Lists the resource types that use resource-level authorization.

By default, resource sharing is disabled so that administrators can opt in intentionally.

---

## Current plugin support

Initial support for resource sharing is available in:

* **Anomaly Detection** – share detectors and forecasters across users.
* **ML Commons** – share trained models across teams without duplication.

Additional plugins, including Reporting, are expected to adopt this framework in future releases.

---

## Migration API

For clusters with existing resources, the Security plugin provides a migration API to help move from legacy backend-role-based visibility to the new owner-based model. When possible, the migration process uses `username_path` and `backend_roles_path` to extract ownership and access data from existing metadata. When ownership cannot be determined, you must specify a `default_owner` for the resource.

After migrating, the owner can use the Resource Access Control page in OpenSearch Dashboards to manage sharing.

```curl
POST /_plugins/_security/api/resources/migrate
{
  "source_index": ".sample_resource",
  "username_path": "/owner",
  "backend_roles_path": "/backend_roles",
  "type_path": "/type",
  "default_access_level": {
    "sample-resource": "read_only",
    "sample-resource-group": "read-only-group"
  }
}
```

---

## Best practices

* **Enable cautiously**: Test in a staging environment before enabling resource sharing across a production cluster.
* **Follow the least privilege model**: Share resources with the minimum required access level.

---

## Looking ahead

As additional plugins adopt this framework, users will gain a consistent, secure, and predictable way to collaborate across the entire OpenSearch experience. Plugin developers will benefit from simpler security integrations and reduced reliance on custom access checks.

As Dashboards, visualizations, and Reporting adopt the resource sharing model, users will gain a unified, collaboration-friendly sharing model throughout OpenSearch.

Stay tuned for Part 2, where we will look at the underlying metadata model, how access evaluations work at query time, and the scalability considerations that shape the framework.

---

## Conclusion

With the introduction of resource sharing and access control in OpenSearch 3.4, teams can collaborate on higher-level resources with greater flexibility and security. Whether you manage report definitions, anomaly detectors, or ML models, you can now share them safely with colleagues and teams.

You can try this feature today by enabling it in your cluster settings and exploring the APIs. If you use the Anomaly Detection or ML Commons plugins, consider sharing a detector or model to see how this model simplifies collaboration and security in your environment.

