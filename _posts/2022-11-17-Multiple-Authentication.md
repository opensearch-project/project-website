---
layout: post
title:  "Launch Highlight: Multiple Authentication Options for OpenSearch Dashboards"
authors: 
  - aoguan
  - kvngar
  - zengyan
date: 2022-11-17 00:00:00 -0700
categories: 
  - community
---

We’re excited to announce support for concurrent multiple authentication methods in OpenSearch Dashboards. This enhancement to the Dashboards security plugin, provides a more unified and user-friendly login experience to Dashboards users, who are now able to choose their preferred login option from the integrated Login UI, including basic authentication (username and password), or multiple single sign-on providers integrating OIDC or SAML.

## Benefits

Previously, OpenSearch Dashboards limited users to a single login authentication option. Users could either use basic authentication (username and password), or single sign-on with a single external SAML/OIDC identity provider (IDP). Starting in **2.4**, the Dashboards security admin can enable multiple authentication options. Some of the benefits of enabling this are:

1. OpenSearch Dashboards users can login with basic authentication (username and password) and single sign-on options simultaneously
2. Integrated Login/Logout experience regardless of your authentication methodology
3. Flexibility for OpenSearch Dashboards security admins to customize the login page options
4. Support identity redundancy across multiple IDPs to ensure high availability
5. Simplify troubleshooting external IDP related issues

## Use cases

Customers using dedicated third-party enterprise-based IDPs to manage OpenSearch Dashboards user identities can now use OpenSearch as an Internal IDP for **admin, security, and privileged accounts**, and a single enterprise-based external IDP to maintain authentication information for **general Dashboards user accounts**. For larger enterprises that may have redundancy needs, they can enable multiple enterprise-based IDPs, for example, an enterprise OIDC IDP, and an enterprise SAML IDP.

An additional use case for this that hasn’t been possible before is to add multiple external IDPs to mix and match needs. For example, OpenSearch can serve as an Internal IDP to maintain authentication information for **admin, and security accounts**, an Enterprise based IDP for **privileged and analyst accounts**, and a Social-based IDP for **limited read-only accounts** that can only view specific data.

We would love to hear any additional use-cases you have that this feature can meet!

## How can you use this feature?

OpenSearch Dashboards admins can enable single or multiple authentication options on demand and customize the integrated Login UI by editing opensearch_dashboards.yml. For the essential settings required to setup multiple authentication, see [**Multiple Authentication Options**]({{site.url}}{{site.baseurl}}/security-plugin/configuration/multi-auth/). Once these options are configured, the Login UI will be automatically updated. For example, the login UI below shows both basic authentication and SSO enabled:

![Default Login UI](/assets/media/blog-images/2022-11-14-multiple-authentication/default-login-ui.png){: .img-fluid}

## How can you use this feature?

When Dashboards bootstraps and loads security settings from `opensearch-dashboards.yml`, the Dashboards client can tell whether Single-Authentication Mode or Multiple-Authentication Mode is enabled by evaluating the Multiple Authentication feature flag and authentication type setting.

* If **Single-Authentication Mode** is detected, only authentication handler for corresponding authentication type defined by *`attribute:opensearch_security.auth.type`* will be registered with the client. All the login requests flow to the dedicated IDP to complete identification and authentication.
* If **Multiple-Authentication Mode** is detected, OSD will evaluate authentication handlers required for each individual authentication type defined by *`attribute:opensearch_security.auth.type`* and form a compound authentication handler, which will be registered with OSD client instead. This compound authentication handler is named as multi-auth handler. Multi-auth handler is able to redirect the authentication request to various IDP endpoints for authentication interchangeably based on the authentication type defined within Login request. 

**High Level Diagram:**
![High Level Diagram](/assets/media/blog-images/2022-11-14-multiple-authentication/high-level-diagram.png){: .img-fluid}

## Getting started

For more information on setting up and exploring this feature, see the OpenSearch [documentation]({{site.url}}{{site.baseurl}}/security-plugin/configuration/multi-auth/). To leave feedback, visit the [OpenSearch Forum](https://forum.opensearch.org/t/feedback-experimental-feature-connect-to-external-data-sources/11144). If you're interested in contributing to this feature, consider contributing to the OpenSearch Dashboards [repository](https://github.com/opensearch-project/security-dashboards-plugin).