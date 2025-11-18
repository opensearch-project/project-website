---
layout: post
title:  "Introducing Resource Sharing: A New Access Control Model for OpenSearch"
authors:
  - cwperks
  - DarshitChanpura
date: 2025-10-17
categories:
  - technical-post
meta_keywords: Security, Distributed Systems, Extensibility, Plugins, Pluggable Architecture
meta_description: "Introducing Resource Sharing - A new access control model for OpenSearch based around ownership"
---

# Resource Sharing and Access Control in OpenSearch Security

Collaboration is at the heart of OpenSearch. Teams often need to share artifacts like **Dashboards** and **Visualizations** along with plugin-defined assets such as **Reports**, **ML models** or **anomaly detectors** across users and roles. At the same time, administrators must ensure access stays controlled, auditable, and consistent with broader security policies.

With the **3.3 release of OpenSearch**, the Security plugin introduces **Resource Sharing and Access Control** — a framework that enables users to share resources with other users or roles while enforcing fine-grained access rules.

---

## Why Resource Sharing and Access Control Matters

Traditional role-based access in OpenSearch controls who can query indices or manage clusters, but higher-level objects like report definitions, ML models, or anomaly detectors lacked a native sharing mechanism.

For example:

* A central data team might create a **report definition** that schedules weekly compliance reports. Other teams need to view and run this report without duplicating it.
* A fraud analytics team could define an **anomaly detector** for transaction data. Security engineers may need to access this detector to build alerts and integrate it with monitoring.
* Data scientists might train a **machine learning model in ML Commons** and want to share it across departments without rebuilding.

Resource Sharing and Access Control provides the missing layer — allowing these resources to be owned, shared, and audited securely.

---

## Key Concepts

* **Resource**: Any higher-level object managed by OpenSearch plugins, such as report definitions, anomaly detectors, or ML models.
* **Ownership**: Every resource has an owner (usually the creator) who can decide how and with whom it is shared.
* **Sharing Targets**: A resource can be shared with specific users or roles.
* **Access Levels**: Recipients may receive different levels of access depending on what the owner specifies.
* **Auditability**: All operations — sharing, revoking, accessing — are logged for transparency and compliance.

---

### Legacy Access Control Model

Historically, many OpenSearch plugins have relied on a **coarse, backend-role–based model** to control access to plugin-defined resources. In this model — commonly referred to as `filter_by_backend_role` — a resource created by one user becomes visible to another **only if both users share at least one backend role**. This ties visibility entirely to role overlap, giving the resource owner **no ability to decide who should or shouldn’t see their resource**.

This approach creates several limitations:

* **No owner-controlled sharing**
  Access is automatic and implicit. If two users share a backend role, they see each other’s detectors, models, or other resources — regardless of intent.

* **Overly broad cluster permissions**
  Because permissions are role-based and not resource-based, administrators must grant **cluster-level privileges** to allow actions on what should be a *single* resource.
  For example, in a Google Docs analogy, granting a user “Delete Document” permission would allow them to delete *any* document they can see, not just the one intended.

* **Storing user identity snapshots**
  Plugins need to persist a snapshot of the creating user’s identity alongside each resource to determine role-based visibility later. This adds complexity and tightly couples resource metadata to user lifecycle.

For anomaly detection, the setting that controls this access control model is `plugins.anomaly_detection.filter_by_backend_roles` and for ML Commons, this setting is `plugins.ml_commons.model_access_control_enabled`.

---

## Access Level

**Access Level** is a group of permissions that are applicable to a single resource. Each plugin that creates sharable resources must specify a list of access levels associated with the sharable resource. Access Levels progressively give more access to what a user can do with the given resource.

A good mental model for Access Levels is the familiar Google Docs sharing model where the owner of a Google doc can share the doc at 4 different levels.

- Viewer - Users at Viewer level can read the Google document
- Commenter - Users at the Commenter level can read the document and leave comments
- Editor - Editors can read, comment and edit the document
- Full Access - Users with Full Access can read, edit, comment and share the document

---

## API Walkthrough

Resource Sharing and Access Control introduces a set of APIs to manage sharing. Let’s look at an example using a **report definition**.

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

This request shares the `resource-123` resource with user `alice` and the role `readers` at the **read_only** access level. It also shares the `resource-123` resource with user `bob` at the `read_write` access level.

### 2. Check sharing status

```json
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
      "users": [
        "alice"
      ]
    },
    "read_write": {
      "users": [
        "bob"
      ]
    }
  }
}
```

---

## Cluster Settings in 3.3

In OpenSearch 3.3, resource sharing is controlled via dynamic cluster settings. Administrators can enable or disable sharing at runtime:

```json
PUT _cluster/settings
{
  "persistent": {
    "plugins.security.experimental.resource_sharing.enabled": "true",
    "plugins.security.experimental.resource_sharing.protected_types": ["anomaly-detector", "forecaster", "ml-model"]
  }
}
```

* `plugins.security.experimental.resource_sharing.enabled`: Enables or disables resource sharing globally.
* `plugins.security.experimental.resource_sharing.protected_types`: List of resource types which resource authorization is enabled on.

By default, sharing is disabled to ensure administrators make an explicit decision to enable it.

Protected types ensure that resource-level authorization is enforced only for resource types that have fully integrated with the Resource Sharing framework.

---

## Current Plugin Support

Resource Sharing and Access Control is being introduced incrementally. Initial support is available in:

* **Anomaly Detection plugin** – share detectors and forecasters across users.
* **ML Commons plugin** – share trained ML models with teams without duplication.

Other plugins, like Reporting, are expected to adopt this framework in future releases.

---

## Migrate API

For clusters with existing resources, the Security plugin provides an API to help migrate to the new owner-based access control model. If ownership information already exists with the resource metadata, security will extract the same ownership information to store in the resource sharing document. If ownership information cannot be found, then Security requires a `default_owner` to assume ownership of the resource. After migration, the resource owner can then use the new `Resource Access Control` page inside of OpenSearch Dashboards to share the migrated resources with others.

**Note**: Migration should be tested in a staging environment before use in production, especially when existing resources span multiple user groups or legacy access models.

```json
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

| Parameter              | Type   | Required | Description                                                                                                                                          |
|------------------------|--------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `source_index`         | string | yes      | Name of the plugin index containing the existing resource documents                                                                                  |
| `username_path`        | string | yes      | JSON Pointer to the username field inside each document                                                                                              |
| `backend_roles_path`   | string | yes      | JSON Pointer to the backend_roles field (must point to a JSON array)                                                                                 |
| `type_path`            | string | no       | JSON Pointer to the resource type field inside each document (required if multiple resource types in same resource index)                            |
| `default_access_level` | object | yes      | Default access level to assign migrated backend_roles. Must be one from the available action-groups for this type. See `resource-action-groups.yml`. |


---

## Best Practices

* **Enable cautiously**: Start with small test environments before rolling out cluster-wide.
* **Follow least privilege**: Share resources with the minimal required permissions (read vs write).

---

## Looking Ahead

As additional plugins adopt this framework, users will gain a consistent, secure, and predictable way to collaborate across the entire OpenSearch ecosystem. At the same time, plugin developers benefit from a simpler security integration model — no more implementing custom access checks or role-based filtering logic for each new resource type.

This foundation opens the door to richer governance, cleaner APIs, and a more unified user experience across OpenSearch Dashboards.

As Dashboards, Visualizations, and Reporting migrate onto this model, users will gain a unified, Google-Docs-style sharing paradigm across the entire OpenSearch experience.

Stay tuned for **Part 2**, where we’ll take a deeper look at the technical design of Resource Sharing and Access Control — including the underlying metadata structures, how access evaluations work at query time, and the key scalability and correctness challenges we had to solve along the way.

---

## Conclusion

With the introduction of Resource Sharing and Access Control in 3.3, OpenSearch provides a secure foundation for collaboration on higher-level resources. Whether you’re managing report definitions, anomaly detectors, or ML models, you can now share them safely with colleagues and teams.

👉 Try it today by enabling the feature in your cluster settings, exploring the APIs, and testing with the Anomaly Detection and ML Commons plugins. As adoption grows, resource sharing will become a core part of how teams collaborate in OpenSearch.

