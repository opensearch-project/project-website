---
layout: post
title: "Launch highlight: Multiple authentication options for OpenSearch Dashboards"
authors: 
  - aoguan
  - kvngar
  - zengyan
date: 2022-11-17 00:00:00 -0700
categories: 
  - community
redirect_from: "/blog/community/2022/11/Multiple-Authentication/"
---

We’re excited to announce support for concurrent multiple authentication methods in OpenSearch Dashboards. This enhancement to the Dashboards security plugin provides a more unified and user-friendly login experience to Dashboards users, who are now able to choose a preferred option from a login UI that integrates basic authentication (username and password) and multiple single sign-on (SSO) providers for OpenID Connect (OIDC) and SAML.

## Benefits

Previously, Dashboards limited users to a single login authentication option. Users could either use basic authentication (username and password) or SSO with a single external SAML/OIDC identity provider (IdP). Starting in **OpenSearch 2.4.0**, the Dashboards security admin can enable multiple authentication options. The following are some of the benefits of enabling this feature:

* Simultaneous login with basic authentication (username and password) and SSO
* An integrated login/logout experience regardless of your authentication methodology
* Flexibility for Dashboards security admins to customize the login page options
* Support for identity redundancy across multiple IdPs to ensure high availability
* Simplified troubleshooting of external IdP-related issues

## Use cases

Customers using dedicated third-party enterprise-based IdPs to manage Dashboards user identities can now use OpenSearch as an internal IdP for admin, security, and privileged accounts and a single enterprise-based external IdP to maintain authentication information for general Dashboards user accounts. Larger enterprises that have redundancy needs can enable multiple enterprise-based IdPs, for example, an enterprise OIDC IdP and an enterprise SAML IdP.

Additionally, you can now add multiple external IdPs to meet different needs. For example, OpenSearch can serve as an internal IdP to maintain authentication information for admin and security accounts, an enterprise-based IdP for privileged and analyst accounts, and a social-based IdP for limited read-only accounts that can only view specific data.

If you have any additional use cases you think this feature can meet, we would love to hear about them! Please visit the [OpenSearch Forum](https://forum.opensearch.org/t/feedback-multiple-authentication-options-for-opensearch-dashboards/11508) to leave feedbacks for us.

## How can you use this feature?

OpenSearch Dashboards admins can enable single or multiple authentication options on demand and customize the integrated login UI by editing opensearch_dashboards.yml. For the essential settings required to set up multiple authentication, see [**Multiple Authentication Options**](https://opensearch.org/docs/latest/security-plugin/configuration/multi-auth/). Once these options are configured, the login UI will be automatically updated. For example, the login UI below shows both basic authentication and SSO enabled.

![Default Login UI](/assets/media/blog-images/2022-11-14-multiple-authentication/default-login-ui.png){: .img-fluid}

## How does this feature work?

When Dashboards bootstraps and loads security settings from `opensearch-dashboards.yml`, the Dashboards client can detect whether Single-Authentication Mode or Multiple-Authentication Mode is enabled by evaluating the Multiple Authentication feature flag and authentication type setting:

* If **Single-Authentication Mode** is detected, Dashboards registers a single authentication handler with the client based on the authentication type defined by the **opensearch_security.auth.type** setting. When Dashboards users log in, all requests flow to the dedicated IdP to complete identification and authentication.

* If **Multiple-Authentication Mode** is detected, Dashboards evaluates all authentication handlers required for the multiple authentication types defined by the **opensearch_security.auth.type** setting and forms a compound authentication handler. Dashboards then registers this compound authentication handler with the client. The compound authentication handler is able to redirect the authentication request to various IdP endpoints for authentication interchangeably based on the authentication type defined within the login request.

The following image shows a high-level diagram of the multiple authentication options for OpenSearch Dashboards.

![High Level Diagram](/assets/media/blog-images/2022-11-14-multiple-authentication/high-level-diagram.png){: .img-fluid}

## Getting started

For more information on setting up and exploring this feature, see the OpenSearch [documentation](https://opensearch.org/docs/latest/security-plugin/configuration/multi-auth/). To leave feedback, visit the [OpenSearch Forum](https://forum.opensearch.org/t/feedback-multiple-authentication-options-for-opensearch-dashboards/11508). If you're interested in contributing to this feature, please check the OpenSearch Dashboards [repository](https://github.com/opensearch-project/security-dashboards-plugin) for more details.
