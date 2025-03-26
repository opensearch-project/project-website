---
layout: post
title: Configuring Anonymous Authentication in OpenSearch
authors:
  - smortex
date: 2023-12-28 16:20:00 -1000
category:
  - technical-posts
meta_keywords: anonymous, authentication, authorization
meta_description: Learn how to set up OpenSearch for anonymous authentication
---

The OpenSearch Security plugin has support multiple authentication backends.
It is also possible to enable anonymous authentication to allow access to OpenSearch without prior identification.
In this article, we configure anonymous authentication which is disabled by default.

## Enable anonymous authentication in OpenSearch

Anonymous access to OpenSearch is done in the Security plugin by modifying `opensearch-security/config.yml` and reloading the configuration with `securityadmin.sh`.

Ensure `anonymous_auth_enabled` is set to true:

```yaml
config:
  # [...]
  dynamic:
    # [...]
    http:
      # [...]
      anonymous_auth_enabled: true
```

Then inject the new configuration (this will replace the configuration, exercise caution if you have changed OpenSearch configuration outside of these files):

```
OPENSEARCH_JAVA_HOME=/usr/share/opensearch/jdk /usr/share/opensearch/plugins/opensearch-security/tools/securityadmin.sh \
  -cacert /etc/opensearch/root-ca.pem \
  -cert /etc/opensearch/kirk.pem \
  -key /etc/opensearch/kirk-key.pem \
  -cd /etc/opensearch/opensearch-security
```

## Enable anonymous authentication in OpenSearch Dashboards


Now that OpenSearch anonymous access is enabled, we must enable it in OpenSearch Dashboards by modifying `opensearch_dashboards.yml` and adding the following line:

```yaml
opensearch_security.auth.anonymous_auth_enabled: true
```

When done, we restart the `opensearch-dashboards` service.

When accessing OpenSearch Dashboards from a browser, you will automatically log in as the **opendistro_security_anonymous** user. It is possible to authenticate as another user after logging out: the usual log in screen will be presented, with a new "Log in as anonymous" button.

## Adjust permissions of anonymous users

With the default OpenSearch configuration, the **opendistro_security_anonymous** user has the *backend role* `opendistro_security_anonymous_backendrole` and the *role* `own_index`.
This is not sufficient to access OpenSearch data and roles must be mapped to the `opendistro_security_anonymous_backendrole` *backend role* to grant access.

There is no one-size-fit-all configuration, so we will consider some simple use cases.

Configuration can be done using the OpenSearch Dashboards user interface as an administrator, or by modifying the Security plugin configuration in `opensearch-security/roles_mapping.yml` and applying changes with `securityadmin.sh`.

### Provide read-only access to anonymous users

Map the `readall` and `kibana_user` roles to the `opendistro_security_anonymous_backendrole` backend role:

```yaml
kibana_user:
  reserved: false
  backend_roles:
  - "kibanauser"
  - "opendistro_security_anonymous_backendrole" # <--- added
  description: "Maps kibanauser to kibana_user"

readall:
  reserved: false
  backend_roles:
  - "readall"
  - "opendistro_security_anonymous_backendrole" # <--- added
```

### Provide full access to anonymous users

Map the `all_access` role to the `opendistro_security_anonymous_backendrole` backend role:

```yaml
all_access:
  reserved: false
  backend_roles:
  - "admin"
  - "opendistro_security_anonymous_backendrole" # <--- added
  description: "Maps admin to all_access"
```

## Conclusion

In this article, we saw how to enable anonymous access to OpenSearch Dashboards.

In your deployment, you will likely create custom roles to give access to a subset of your data through [document-level](https://opensearch.org/docs/latest/security/access-control/document-level-security/) or [field-level](https://opensearch.org/docs/latest/security/access-control/field-level-security/) security.
