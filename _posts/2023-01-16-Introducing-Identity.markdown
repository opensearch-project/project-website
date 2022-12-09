# Introducing Identity for OpenSearch

OpenSearch's existing access control system through the security plugin lets administrators apply access control on for indices and cluster actions. These features are limited, making it hard for access control systems to be used by plugins.

As OpenSearch focuses on extensibility, administrators, plugins, and extensions need mechanisms to control access that are more granular and cover more scenarios. We are naming this suite of features Identity, which will offer comprehensive access control to OpenSearch's ecosystem.

- Mechanisms for OpenSearch, plugins, and extensions to check permissions before attempting an action 
- Restricting plugins or extensions from performing actions unless they have been granted access 
- Background task to run with the same access controls as interactive user requests 
- Add new security boundaries inside the OpenSearch for better defense-in-depth posture. 

### Enable permissions checks 

Knowing what permissions a user has is a hallmark for showing great user experiences. This is not possible with the current security plugin and we know this is a great feature.  Additional giving plugins and extensions the knowledge that features and functionality are missing permissions allows advocating to the user/administrator for additional access.

### Plugins and Extensions restrictions

Being able to protect parts of an OpenSearch cluster from plugins or extensions is critical to build confidence in these tools. Configuring a plugin or extension permission grants using the same mechanisms as configuring user permissions grants provides a clear framework for understanding and inspecting permissions.

### Background tasks permissions

Lots of things can happen in the background when operating a cluster such as deleting old indices, producing monitoring data, and generating reports. When these different tasks execute each task should have only the kinds of permissions it needs to protect against mistakes or unintended consequences.

### Security Isolation 

Using the lowest level of privileges when any task is executed is a key to prevent mistakes or software defects from impacting the stability of an OpenSearch cluster. By enforcing protections everywhere inside OpenSearch, the blast radius of these incidences will be drastically reduced.

## Interested in being involved?

These are bold changes and they are going to require doing things differently that has been done. We are in the process of defining and building the Identity systems into the core of open search. 

As Identity impacts many facets of the OpenSearch ecosystem we would like your ideas and contributions to be engaged during the development process [link](https://github.com/opensearch-project/OpenSearch/issues/4514) and watch this [feature branch](https://github.com/opensearch-project/OpenSearch/pulls?q=is%3Apr+base%3Afeature%2Fidentity) or [label](https://github.com/opensearch-project/OpenSearch/issues?q=label%3AIdentity+) in OpenSearch.

Expect more blog posts on Identity features and presentations during the community meetings.
