---
layout: post
authors: 
  - arubin
date: 2021-10-26 01:01:01 -0700
title: "Partner Highlight: Eliatra presents OpenSearch Security Concepts"
description: "OpenSearch provides a strong and reliable security model out-of-the-box. This post explains some of the core concepts of OpenSearch security."
category:
- technical-posts
canonical: "https://eliatra.com/blog/security-opensearch-concepts/"
twittercard:
  account: "@eliatra_ire"
  description: "OpenSearch provides a strong and reliable security model out-of-the-box. This post explains some of the core concepts of OpenSearch security."
  image: "/assets/media/blog-images/2021-10-11-opensearch-security-concepts/tls_encryption.png"
redirect_from: "/blog/technical-posts/2021/10/opensearch-security-concepts/"
---

[Eliatra](https://eliatra.com/){:target="_blank"} provides OpenSearch Support, Professional Services and Custom Feature Development. Our team has been working with open source search engine technology like Lucene and Elastic products since the very beginning. We have extensive ecosystem knowledge. This makes us the perfect partner for AWS and OpenSearch, not only as a contributor but also to offer full support and professional services.

---

For many years Elasticsearch had no built-in security. This led to numerous security breaches with millions of sensitive data leaked. Luckily, OpenSearch provides a strong and reliable security model out-of-the-box.

In this article, we will first explain some of the core concepts of OpenSearch security. Additional parts of this article can be found on the [Eliatra blog](https://eliatra.com/blog/opensearch-security-part-2-basic-setup/){:target="_blank"}, we walk you through a basic OpenSearch security setup using the demo configuration and the internal user database.

## OpenSearch Security Basic Concepts

The security model of OpenSearch is based on the following core concepts:

* __TLS encryption__ makes sure that no one can sniff or modify any data in motion.
* __Users__ define who has access to an OpenSearch cluster. Before interacting with the cluster, any user has to *authenticate* first.
* __Roles__ are used to implement *authorisation*. Any authenticated user can have one or more roles. Roles define what permissions a user has for particular indices.
* __Permissions__ define what a user is allowed to do. For example,  the permissions of a user may grant READ access to data, but do not allow WRITE or DELETE operations.

Apart from these basic security controls, OpenSearch also supports advanced features like LDAP authentication. You can find articles about it on the [Eliatra blog](https://eliatra.com/blog/opensearch-security-part-5-ldap-authentication/){:target="_blank"} too.

### TLS Encryption - REST Layer

OpenSearch uses TLS to secure and encrypt traffic between users and OpenSearch on the REST layer. This is much like accessing your online bank account with a browser using HTTPS: All traffic between your browser and the online banking server is encrypted. In addition, the browser checks and validates the server's TLS certificate. By validating the TLS certificate you can be sure you are sending the data to the right entity, and not a malicious website.

The same happens when you send a request to OpenSearch, for example by using a browser or tools like curl. The HTTP traffic is encrypted, so no one can sniff or modify your data while it is being transmitted. 

### TLS Encryption - Transport Layer

Besides the REST layer which uses the HTTP protocol for communication, there is another internal layer where data is exchanged. This is the so-called *transport layer*. The transport layer is responsible for any traffic that is exchanged between the nodes in the cluster (*"inter-node traffic"*). 

OpenSearch is a distributed system, so most operations like indexing data or querying for data affect multiple nodes in the cluster. As with the REST layer, OpenSearch uses TLS on the transport layer to encrypt and secure traffic, and to make sure only that trusted nodes are allowed to join your cluster.

By combining TLS encryption on both layers, all data in motion is end-to-end encrypted.

![OpenSearch Security end-to-end encryption](/assets/media/blog-images/2021-10-11-opensearch-security-concepts/tls_encryption.png){: .img-fluid}

## Users, Roles, and Permissions

### Request Flow

OpenSearch implements a role-based security model and supports multiple types of authentication and authorisation backends. The specific details on how a request is handled may vary depending on what technology you use, e.g. Active Directory, LDAP, OIDC, SAML, etc. However, the general request flow always follows the same pattern: 

Any request that hits OpenSearch has to carry some sort of user credentials. For example, username and password as HTTP Basic Authentication header, a JSON web token or a Kerberos ticket.
OpenSearch extracts this information from the request and validates it using an *authentication domain*. For example, the internal user database, an LDAP server, or Active Directory.
If the credentials are valid, OpenSearch fetches the so-called *backend roles* of the user from an *authorisation domain*. Again, this could be LDAP roles, JWT claims, SAML assertions, or roles from the internal user database. This step is optional.
Based on the user name and/or the backend roles, the user is assigned one or more security roles 
The security roles finally define what the user is allowed to do. You can set up access permissions for each index separately, or use wildcards and regular expressions to apply permissions to multiple indices at once.

![OpenSearch Authentication Request Flow](/assets/media/blog-images/2021-10-11-opensearch-security-concepts/auth_auth_sequence.png){: .img-fluid} 

### User Management

OpenSearch supports multiple ways of managing users. Probably the easiest way is to use the built-in *internal user database*. The internal user database stores users and hashed passwords directly in a protected OpenSearch index. You can use the OpenSearch [*securityadmin*](https://opensearch.org/docs/security-plugin/configuration/security-admin/) CLI or the REST API to directly create, modify and delete users. 

OpenSearch also supports a wide variety of other authentication domains, like:

* LDAP / Active Directory
* Kerberos
* JSON web tokens
* OIDC / SAML
* Proxy authentication
* TLS client certificates

OpenSearch also provides the capability of *chaining* or *combining* authentication domains. For example, you can configure LDAP as first authentication domain, and the internal user database as second authentication domain. In this case, if the LDAP user authentication fails, OpenSearch will try the internal user database next. This provides for great flexibility, making it possible to implement most basic to very complex use-cases.

Authentication and authorization domains are configured in the file [config.yml](https://opensearch.org/docs/security-plugin/configuration/configuration/). After making changes here, do not forget to apply the changes by using the [securityadmin](https://opensearch.org/docs/security-plugin/configuration/security-admin/) CLI to upload changes.

### Defining Security Roles

A security role defines what the bearer of this role is allowed to do. A role can grant access permissions for:

* Cluster actions
* Indices
* Dashboard tenants  

Cluster actions are actions that are not tied to specific indices, but rather operate on the cluster level. For example, health checks, cluster monitor actions, or cluster admin actions. They also include msearch and bulk actions.

Index-level permissions can be granted by index or by index pattern. For example, you can assign READ permissions for all indices starting with logstash like:

```
my-role:
  ...
  index_permissions:
  - index_patterns:
    - "logstash-*"
    allowed_actions:
    - "READ"
```

OpenSearch comes with a number of pre-defined sets of permissions, like READ, WRITE, CRUD, etc. These permission sets are called [action groups](https://opensearch.org/docs/security-plugin/access-control/default-action-groups/) and should cover most use cases.  

If required, you can also use [single actions](https://opensearch.org/docs/security-plugin/access-control/permissions/) and even define your own action groups for re-use across roles.

Security roles are configured in the file [roles.yml](https://opensearch.org/docs/security-plugin/configuration/yaml/#rolesyml). After making changes here, do not forget to apply them by using the [securityadmin](https://opensearch.org/docs/security-plugin/configuration/security-admin/) CLI.

### Mapping Security Roles to Users

We have now discussed user management and role management. The last question is how to assign our roles to users.

If you use the internal user database, then you can directly assign security roles to users. Again, you can use the securityadmin CLI or the REST API. For example:

```
new-user:
  hash: "..."
  opensearch_security_roles:
  - "my-role"
  - "my-other-role"  
```

Here, user *myuser* has two roles, *my-role* and *my-other-role*.

This is nice and straightforward. However, if your user base grows, or if you use LDAP or Active Directory, you may want to leverage the user mapping feature of OpenSearch.

Think of it like adding users to groups first, and then assign one or more security roles to those groups. This introduces a layer of indirection but provides more flexibility when changing permissions. Let's say you have an LDAP and all employees that work in DevOps are members of this group:

```
cn=devops,ou=it,dc=example,dc=com
```

You can use the name of this group to automatically assign security roles to all members. To do so, add an entry in the *role_mapping.yml* configuration file like:

```
my-devops-security-role:
  - "cn=devops,ou=it,dc=example,dc=com"
```

Now all members of the LDAP group *cn=devops,ou=it,dc=example,dc=com* will be assigned to the security role my-devops-security-role.

## Admin TLS Certificates

The last concept we want to cover is *admin TLS certificates*. In contrast to other security solutions, OpenSearch does not have the notion of a root user that has unlimited permissions. Instead, OpenSearch uses a client TLS certificate, the so-called admin TLS certificate.

This is a normal TLS certificate, signed by your root CA or intermediate CA. If a request to OpenSearch sends an admin TLS certificate, all permissions to the cluster are granted. 

Using a TLS certificate for granting full access to the cluster provides a higher level of security than using a username/password combination.

--- 

This post is contributed by Anton Rubin from Elitra and is co-published on the [Eliatra blog](https://eliatra.com/blog/security-opensearch-concepts/){:target="_blank"}
