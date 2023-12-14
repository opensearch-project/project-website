---
layout: post
title: Configuring LDAP Authentication in OpenSearch
authors:
  - smortex
date: 2023-12-14 14:20:00 -1000
category:
  - technical-posts
meta_keywords: ldap, authentication, authorization
meta_description: Learn how to set up OpenSearch for LDAP authentication
---

The OpenSearch Security plugin has support multiple authentication backends.
In this article, we dive into the LDAP backend to authenticate and authorize users form an external directory such as OpenLDAP or Active Directory.


## Manage configuration

The LDAP configuration of OpenSearch is stored in its indexes.
It is seeded from the `opensearch-security/config.yml` configuration file on first start, but it is not updated automatically when the file is changed later on.
In this guide we will use the `securityadmin.sh` script to update the configuration in OpenSearch, using the demo certificates.
Please exercise caution when updating, doing a backup first is advised.

> **NOTE:**
> The `securityadmin.sh` script is currently deprecated, but at the time of writing its successor is not available.
> For this reason, this guide rely on this legacy script.


### Backup configuration

Backup the currently active configuration to the `/tmp/config` directory with this command (assuming an installation on a Debian system):

```
OPENSEARCH_JAVA_HOME=/usr/share/opensearch/jdk /usr/share/opensearch/plugins/opensearch-security/tools/securityadmin.sh \
  -cacert /etc/opensearch/root-ca.pem \
  -cert /etc/opensearch/kirk.pem \
  -key /etc/opensearch/kirk-key.pem \
  -backup /tmp/config
```

### Update configuration

After editing the `opensearch-security/config.yml` configuration file, it must be injected into OpenSearch using the `securityadmin.sh` script:

```
OPENSEARCH_JAVA_HOME=/usr/share/opensearch/jdk /usr/share/opensearch/plugins/opensearch-security/tools/securityadmin.sh \
  -cacert /etc/opensearch/root-ca.pem \
  -cert /etc/opensearch/kirk.pem \
  -key /etc/opensearch/kirk-key.pem \
  -cd /etc/opensearch/opensearch-security
```

## Setup users in LDAP

The complete configuration of a directory is way beyond the scope of this article.
Here we will focus on the structure of the directory used in this example and how it was set up using OpenLDAP.
Other LDAP implementation can be used instead of OpenLDAP and they probably support similar features, so please refer to your particular LDAP software documentation to set up a directory that match your needs.

In this example, our directory has the following structure:

```
dc=example,dc=com
|-> ou=groups
|   |-> cn=users
|   `-> cn=admins
|-> ou=people
|   |-> uid=alice
|   `-> uid=bob
`-> ou=services
    `-> cn=opensearch
```

Both *alice* and *bob* are in the *users* group, and only *alice* is in the *admins* group.
Anonymous bind is not allowed, so we also have a service account *opensearch* which will be used to find users before authentication.

## Configure OpenSearch authentication

In order to authenticate users using our directory (verifying that users are who they say they are), we add a new entry in the `config.dynamic.authc` section of the `opensearch-security/config.yml` file:

```yaml
config:
  # [...]
  dynamic:
    # [...]
    authc:
      # [...]
      example_ldap:
        description: "Authenticate using example.com LDAP"
        http_enabled: true
        transport_enabled: false
        order: 4
        http_authenticator:
          type: basic
          challenge: false
        authentication_backend:
          type: ldap
          config:
            # enable ldaps
            enable_ssl: false
            # enable start tls, enable_ssl should be false
            enable_start_tls: true
            # send client certificate
            enable_ssl_client_auth: false
            # verify ldap hostname
            verify_hostnames: true
            hosts:
            - ldap.example.com
            # Anonymous binding is not allowed, bind as opensearch
            bind_dn: cn=opensearch,ou=services,dc=example,dc=com
            password: secret
            # Base DN to search for users
            userbase: 'ou=people,dc=example,dc=com'
            # Filter to search for users (currently in the whole subtree beneath userbase)
            # {0} is substituted with the username
            usersearch: '(uid={0})'
            # Use this attribute from the user as username (if not set then DN is used)
            username_attribute: cn
```

Refer to the [Active Directory and LDAP](https://opensearch.org/docs/latest/security/authentication-backends/ldap/) page of the Security plugin for details about the configuration.
Here we connect to a directory using STARTTLS, bind as a specific user with a password, and find users by their *uid* and use their *cn* attribute as username.

After updating the configuration with `securityadmin.sh` (see above), you should be able to sign-in with any user of the LDAP directory.

For now, once signed-in, almost any action will result in a *permission denied* error because we have not configured permissions yet.
If you cannot sign-in, check the OpenSearch logs for errors, update the configuration and retry.
There is no point in continuing if you cannot sign-in at this stage.

## Inspect current permissions

When signed-in, you can check your roles and backend roles by clicking on your avatar in the top-right corner, and clicking on *View roles and identities*.
A pop-up display *roles* and *backend roles*.

![Screenshot showing the "View roles and identities" link](/assets/media/blog-images/2023-12-14-configure-ldap-authentication/view_roles_and_identities.png){:class="img-centered"}

![Screenshot of the pop-up displaying roles (own\_index) and backend roles (none)](/assets/media/blog-images/2023-12-14-configure-ldap-authentication/roles_backend_roles.png){:class="img-centered"}

*Roles* give actual permissions.
These permissions are managed using the Security plugin under Management, Security, Roles.
There, *roles* are also mapped to *backend roles*, that is users belonging to a *backend role* belong to the mapped *role* and have the associated permissions.

*Backend roles* correspond to LDAP groups.

For now, we have not configured authorization in the Security plugin, as a consequence the user does not belong to any *backend role* and only belong to a single role: *own_index* which is automatically added to all users in the default configuration.

## Link roles and backend roles

We have two groups in our directory, *users*, and *admins*.
All users are members of the *users* group, and administrators are also members of the *admins* group.
For this simple example, we want all authenticated users to have a read-only access to everything, and administrators to have a read-write access to everything.

In order to do this, we must map the *users* backend role to the *readall* and *kibana\_users* roles, and the *admins* backend role to the *all_access* role.

While this can be conveniently done using the OpenSearch Dashboards user interface, changes will be lost if you update the configuration with `securityadmin.sh` in the future (what we will be doing in a next step).
We will therefore edit `opensearch-security/roles_mapping.yml` to update the mappings to fit our needs:

```yaml
all_access:
  reserved: false
  backend_roles:
  - "admin"
  - "admins" # <--- added
  description: "Maps admin to all_access"

kibana_user:
  reserved: false
  backend_roles:
  - "kibanauser"
  - "users" # <--- added
  description: "Maps kibanauser to kibana_user"

readall:
  reserved: false
  backend_roles:
  - "readall"
  - "users" # <--- added
```

## Configure OpenSearch authorization

The last step consist in configuring OpenSearch authorization (verifying that users are permitted to do what they are trying to do).

In OpenSearch, this is done by looking-up the *backend roles* of users from the LDAP groups they belong to.
For *authentication* we added a `config.dynamic.authc` entry above, now for *authorization* we will add a `config.dynamic.authz` entry into `opensearch-security/config.yml`.

The `config.dynamic.authc` and `config.dynamic.authz` entries have a lot in common (we use the same directory, so the connection settings are the same), and only differ in how the groups of an user must be gathered:

```yaml
config:
  # [...]
  dynamic:
    # [...]
    authz:
      # [...]
      roles_from_exapmle_ldap:
        description: "Authorize using example.com LDAP"
        http_enabled: true
        transport_enabled: false
        authorization_backend:
          type: ldap
          config:
            # enable ldaps
            enable_ssl: false
            # enable start tls, enable_ssl should be false
            enable_start_tls: true
            # send client certificate
            enable_ssl_client_auth: false
            # verify ldap hostname
            verify_hostnames: true
            hosts:
            - ldap.example.com
            # Anonymous binding is not allowed, bind as opensearch
            bind_dn: cn=opensearch,ou=services,dc=example,dc=com
            password: secret
            # Base DN to search for roles
            rolebase: 'ou=groups,dc=example,dc=com'
            # Filter to search for roles (currently in the whole subtree beneath rolebase)
            # {0} is substituted with the DN of the user
            # {1} is substituted with the username
            # {2} is substituted with an attribute value from user's directory entry, of the authenticated user. Use userroleattribute to specify the name of the attribute
            rolesearch: '(uniqueMember={0})'
            # Specify the name of the attribute which value should be substituted with {2} above
            userroleattribute: null
            # Roles as an attribute of the user entry
            userrolename: disabled
            #userrolename: memberOf
            # The attribute in a role entry containing the name of that role, Default is "name".
            # Can also be "dn" to use the full DN as rolename.
            rolename: cn
            # Resolve nested roles transitive (roles which are members of other roles and so on ...)
            resolve_nested_roles: true
            # Base DN to search for users
            userbase: 'ou=people,dc=example,dc=com'
            # Filter to search for users (currently in the whole subtree beneath userbase)
            # {0} is substituted with the username
            usersearch: '(uid={0})'
```

After updating the configuration with `securityadmin.sh` (see above), signed-in users should have the expected roles and backend roles:

![Screenshot of the pop-up displaying roles (own\_index, kibana\_user, readall) and backend roles (users)](/assets/media/blog-images/2023-12-14-configure-ldap-authentication/roles_backend_roles2.png){:class="img-centered"}


## Conclusion

In this article, we saw how to proceed to configure step by step LDAP authentication and authorization, checking it is working at each stage.

Now that this basic configuration is in place, you can set up your own roles with permissions that match your site policies, and map them to your own LDAP groups through role backends.
