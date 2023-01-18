---
layout: post
title:  "Introducing identity and access control for OpenSearch"
authors:
  - peternied
date:   2023-01-18 00:00:00 -0700
categories:
  - technical-post
meta_keywords: "access control, OpenSearch identity, OpenSearch security, least privilege access"
meta_description: "Learn about OpenSearch Identity and how this suite of features provides users with comprehensive access control and creates a better defense-in-depth posture."
---

The existing OpenSearch[^1] access control features included in the Security plugin let administrators apply access control to indexes and cluster actions so that users have the right permissions[^2] and the cluster is protected from unwanted activity. However, the current access control features do have certain limitations that can make it difficult to use them with other plugins.

As the core OpenSearch Project begins its shift away from a plugin[^3] model to a platform model that utilizes extensions[^4], those extensions, its legacy plugins, and the administrators who manage them will need mechanisms for controlling access that are more granular and able to manage a broader range of scenarios where effective access control is critical. We are developing a new suite of features that are designed to provide comprehensive identity and access control to the OpenSearch ecosystem. 

The main objectives are to:

- Provide mechanisms for OpenSearch and its plugins and extensions that can check permissions before attempting an action.
- Restrict plugins and extensions from performing actions unless they have been granted access.
- Introduce functionality that allows background tasks to run with the same access controls as interactive user requests.
- Add new security boundaries inside OpenSearch that create conditions for a better defense-in-depth posture.

## Detailed objectives

Let’s look at some of the ways we plan to meet these objectives.

### Permission checks 

To work effectively, application developers need to know what users can and cannot do in OpenSearch based on the permissions assigned to them. Likewise, administrators responsible for setting up users and the permissions assigned to users require a reliable way to make sure the permissions are configured correctly. Given the degree of complexity that these configurations can reach in large systems, there needs to be a way to verify which users have what permissions. At this time, a mechanism that would allow administrators and developers to check these mappings doesn’t exist.

Our approach to closing this gap is to provide a robust set of APIs that will allow these checks on permissions. Furthermore, these APIs should have the capacity to work not only in core OpenSearch but across all plugins and extensions as well.

### Plugin and extension restrictions

Just as downloading an app to your smartphone includes restrictions intended to prevent surprises and risk, downloading a plugin to OpenSearch should be just as safe and predictable a process. To create this kind of experience for all actions involving plugins and extensions, we intend to introduce certain restrictions that will allow administrators to handle tasks confidently and avoid having to second-guess whether an action might involve any risk.

To ensure that these kinds of limitations are enforced, we plan to leverage the same structures used to grant users access and map permissions for all plugin and extension management activities. As a result, we will reduce the complexity and risk involved in managing these tasks.

### Background task permissions

There are many tasks that run in the background of an OpenSearch cluster, such as deletion of old indexes and generation of monitoring data and reports. When these tasks run, each should have only the minimum number of permissions needed to protect against task errors and any unintended results and their consequences.

Associating identity to tasks will ensure that permissions applied to these tasks are well defined and effective at preventing errors and unexpected results.

### Security isolation 

Following the principle of least privilege, using a minimum number of permissions to run tasks is key to preventing execution errors or software flaws from impacting the stability of an OpenSearch cluster. We will launch features that can protect all of the separate elements in OpenSearch by isolating the potential impact a problem in one element may have on another element. This will reduce the spread of errors and keep them from affecting other areas of OpenSearch.

## Get involved

These features present a significant departure from the current security model by making it easier for OpenSearch developers to access and build assets and for administrators to carry out tasks in a stable environment. Over the last several months, we’ve been busy defining new features and building tools to prepare for the integration of identity and access control into core OpenSearch. We’ve struck out on this path in an effort to make OpenSearch security features more efficient, more reliable, and simply easier and more enjoyable to work with.

And since we operate in the open-source community, we’d like to learn about your ideas and benefit from your contributions as we make progress.

Watch for further blog posts on specific identity and access control features, and join us for community meetings. Furthermore, you can stay informed of development by visiting the following resources in the OpenSearch repository:

- [OpenSearch events](https://opensearch.org/events/)
- [Support for native authentication and authorization in OpenSearch](https://github.com/opensearch-project/OpenSearch/issues/4514)
- [Feature branch for Identity](https://github.com/opensearch-project/OpenSearch/pulls?q=is%3Apr+base%3Afeature%2Fidentity)
- [Current issues for Identity](https://github.com/opensearch-project/OpenSearch/issues?q=label%3AIdentity+)

If you have any feedback, feel free to comment on [[Feedback] Identity and access control for OpenSearch](https://github.com/opensearch-project/OpenSearch/issues/5920).

We look forward to your participation!

## Terms in this blog post

[^1]: OpenSearch – A community-driven, open-source (Apache 2.0–licensed) search engine.

[^2]: Permissions – Rights and privileges granted to a user that allow the user to perform specified tasks within a software application or platform. Permissions are typically managed by administrators responsible for overseeing who can access different parts of the platform.

[^3]: Plugin – A piece of software designed to customize a larger software application. Plugins do not modify the core functionality of the larger application; they only add to the core functionality.

[^4]: Extension – A software program designed to enhance and extend the functionality of a larger software application. Extensions involve some integration with the core of the larger application to meet the aims of the extra functionality they introduce.
