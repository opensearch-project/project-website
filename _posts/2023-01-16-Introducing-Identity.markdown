# Introducing Identity for OpenSearch

OpenSearch's[^1] existing access control features included in the Security plugin let administrators apply access control to indexes and cluster actions so that users have the right permissions[^2] to do their work and the cluster is protected from unwanted activity. However, the features for access control that are currently in place do have certain limitations that can make it hard to use them with other plugins.

As the core OpenSearch Project begins its shift away from a plugin[^3] model to a platform that utilizes extensions[^4], those extensions, its legacy plugins, and the administrators who manage them will need mechanisms for controlling access that are more granular and able to cover a broader range of scenarios where effective access control is critical. We are developing a new suite of features that are designed to provide comprehensive access control to OpenSearch’s ecosystem, and we collectively call these new features "Identity". 

Identity’s main objectives aim to:

- Provide mechanisms for OpenSearch, plugins, and extensions that can check permissions before attempting an action.
- Restrict plugins or extensions from performing actions unless they have been granted access.
- Introduce functionality that allows background tasks to run with the same access controls as interactive user requests.
- Add new security boundaries inside OpenSearch that create conditions for a better defense-in-depth posture.

Let’s look at some ways we plan to meet these objectives.

### Permission checks 

To work effectively, application developers need to know what users can and cannot do in OpenSearch based on the permissions assigned to them. Likewise, administrators responsible for setting up the users and the permissions assigned to users require a reliable way to make sure the permissions are configured correctly. Given the degree of complexity that these configurations can reach in large systems, there must be a way to verify which users have what permissions. At this time, a mechanism that would allow administrators and developers to check these mappings doesn’t exist.

Identity’s approach to filling this gap is to develop a robust set of APIs that will allow these checks on permissions. Furthermore, these APIs should have the capacity to work not only in core OpenSearch but across all plugins and extensions as well.

### Plugin and extension restrictions

Just as downloading an app to your smartphone includes restrictions that ensure the experience comes without surprises and happens free of risk, downloading a plugin to OpenSearch should match those same expectations and be just as safe and predictable a process. To create this same kind of experience for all actions involving plugins and extensions, we intend to introduce certain restrictions that will allow administrators to handle tasks confidently and avoid having to second guess whether an action might involve any risk.

To ensure that these kinds of limitations are enforced, we plan to leverage the same structures used to grant users access and map permissions to all activities around managing plugins and extensions. As a result, we will reduce the complexity and risk for administrators who are responsible for managing these tasks.

### Background task permissions

There are many tasks that run in the background of an OpenSearch cluster, such as deletion of old indexes and generation of monitoring data and reports. When these tasks execute, each should have only the minimum number of permissions needed to protect against task errors and any unintended results and their consequences.

Identity will ensure that permissions applied to these tasks are well defined and effective at preventing errors from happening or administrators seeing unexpected results.

### Security isolation 

Following the principle of least privilege, using a minimum number of permissions to run tasks is key to preventing execution errors or software flaws from having an impact on the stability of an OpenSearch cluster. Identity will launch features that can protect all of the separate elements in OpenSearch by isolating the potential impact a problem with one part may exert on another. As a consequence, this will reduce the reach of errors and keep them from affecting other areas of OpenSearch.

## Get involved

"Identity presents a significant departure from the current security model. It does so to provide features that make it easier for OpenSearch developers to access and build assets and for administrators to carry out tasks in a stable environment. Over the last several months we’ve been busy defining new features and building out the tools to prepare for the integration of Security into core OpenSearch. We’ve struck out on this path in an effort to make security features for OpenSearch more efficient, more reliable, and simply easier and more enjoyable to work with.

And since we operate in the open source community, we’d like to learn about your ideas and benefit from your contributions as we make progress and move development along.

Keep an eye out for further blog posts on specific features for Identity, and join us for presentations during the community meetings. Furthermore, you can stay on top of development by visiting the following resources in the OpenSearch repository:

- [OpenSearch meetup group events](https://www.meetup.com/opensearch/events/)
- [Support for native authentication and authorization in OpenSearch](https://github.com/opensearch-project/OpenSearch/issues/4514)
- [Feature branch for Identity](https://github.com/opensearch-project/OpenSearch/pulls?q=is%3Apr+base%3Afeature%2Fidentity)
- [Current issues for Identity](https://github.com/opensearch-project/OpenSearch/issues?q=label%3AIdentity+)

We look forward to your participation.

#### Terms in this blog

[^1]: OpenSearch — a community-driven and open source (Apache 2.0 licensed) search engine.

[^2]: Permissions — rights and privileges granted to a user that allow the user to perform specified tasks within a software application or platform. Permissions are typically managed by administrators responsible for overseeing who gets access to different parts of the platform.

[^3]: Plugin — a small piece of software designed to customize a larger software application. Plugins do not modify the core functionality of the larger application, they only add to the core functionality.

[^4]: Extension — a software program designed to enhance and extend functionality of a larger software application. Extensions do involve some integration with the core of the larger application to meet the aims of the extra functionality it introduces.
