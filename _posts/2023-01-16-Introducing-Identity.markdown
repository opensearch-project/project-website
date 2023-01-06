# Introducing Identity for OpenSearch

OpenSearch's existing access control features included in the Security plugin let administrators apply access control to indexes and cluster actions so that users have the right permissions to do their work and the cluster is protected from unwanted activity. However, the features for access control that are currently in place do have certain limitations that can make it hard to use them with other plugins.

As the core OpenSearch project begins its shift away from a plugin model to a framework that utilizes [extensions](https://github.com/opensearch-project/OpenSearch/issues/2447), those extensions, its legacy plugins, and the administrators who manage them will need mechanisms for controlling access that are more granular and able to cover a broader range of scenarios where effective access control is critical. We are developing a new suite of features that are designed to provide comprehensive access control to OpenSearch’s ecosystem, and we collectively call these new features "Identity". 

Identity’s main objectives include:

- Provide mechanisms for OpenSearch, plugins, and extensions that can check permissions before attempting an action.
- Restrict plugins or extensions from performing actions unless they have been granted access.
- Introduce functionality that allows background tasks to run with the same access controls as interactive user requests.
- Add new security boundaries inside OpenSearch that create conditions for a better defense-in-depth posture.

Let’s look at some ways we plan to meet these objectives.

### Permission checks 

Application developers need to know what the current user is capable of doing and not capable of doing.  OpenSearch doesn't have a way to communicate these capabilities today.

Similar to knowing what the actions the current user can perform - administrators set permissions on users in OpenSearch.  These permissions can be complex and administrators need a way to know those permissions are set correctly.

Identity’s approach to filling this gap is to develop a series of APIs that will allow checks on permissions, whether those permissions have to do with a plugin, an extension, or core OpenSearch itself.

### Plugins and Extensions restrictions

Feeling confident installing apps on mobile phone is in part because there are limits on what apps can do. OpenSearch's plugins have had few limits making them risky for Administrators to install.

By associating the plugin/extension activities with permissions checks on OpenSearch, we can ensure that limits are enforced.  These permissions will be the same as those used to grant users access - reducing the complexity and risk for Administrators.

### Background tasks permissions

Many tasks run in the background of an OpenSearch cluster such as deleting old indices, producing monitoring data, and generating reports. When these different tasks execute, each should only have minimal set of permissions it needs to protect against mistakes or unintended consequences.

### Security Isolation 

Using the lowest level of privileges when any task is executed is a key to prevent mistakes or software defects from impacting the stability of an OpenSearch cluster. By enforcing protections everywhere inside OpenSearch, the blast radius of these incidents will be drastically reduced.

## Get Involved

This is a paradigm shift, security features will be easier for OpenSearch developers to access and rely on. We are in the process of defining and building the Identity systems into the core of OpenSearch. 

As Identity impacts many facets of the OpenSearch ecosystem we would like your ideas and contributions to be engaged during the development process [link](https://github.com/opensearch-project/OpenSearch/issues/4514) and watch this [feature branch](https://github.com/opensearch-project/OpenSearch/pulls?q=is%3Apr+base%3Afeature%2Fidentity) or [label](https://github.com/opensearch-project/OpenSearch/issues?q=label%3AIdentity+) in OpenSearch.

Expect more blog posts on Identity features and presentations during the community meetings.
