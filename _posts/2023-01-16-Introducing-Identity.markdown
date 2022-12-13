# Introducing Identity for OpenSearch

OpenSearch's existing access control features included in the Security plugin let administrators apply access control to indexes and cluster actions so that users have the right permissions to do their work and the cluster is protected from unwanted activity. However, the features for access control that are currently in place do have certain limitations that can make it hard to use them with other plugins.

As the core OpenSearch project begins its shift away from a plugin model to a framework that utilizes extensions, those extensions, its legacy plugins, and the administrators who manage them will need mechanisms for controlling access that are more granular and able to cover a broader range of scenarios where effective access control is critical. We are creating/building out/developing a new suite of features that are designed to provide comprehensive access control to OpenSearch’s ecosystem, and we collectively call these new features Identity. 

The main objectives for Identity include:

- Mechanisms for OpenSearch, plugins, and extensions that can check permissions before attempting an action.
- The ability to restrict plugins or extensions from performing actions unless they have been granted access.
- Functionality that allows background tasks to run with the same access controls as interactive user requests.
- The addition of new security boundaries inside OpenSearch that create conditions for a better defense-in-depth posture.

Let’s look at these objectives one by one.

### Enabling permissions checks 

With any Using OpenSearch Dashboards your permissions you can start editing a Dashboard,and after hitting 'Save' seeing an error message "Dashboard ... was not saved. Error: Forbidden".  This scenario exists because Dashboards can not check if these commands are allowed or denied.

There is a blind spot for OpenSearch Administrators where after they make a change to permissions of a user or group it is unclear if those were applied as expected.

Identity will add APIs that Dashboards, plugins, and extensions can use to check.  Administrators will be able to make requests to these same APIs to check permissions.

### Plugins and Extensions restrictions

Feeling confidant installating apps on mobile phone is in part because there are limits on what apps can do.  OpenSearch's plugins have had few limits making them risky for Administrators to install.

By associating the plugin/extension to activities on OpenSearch permissions checks can ensure limits are enforced.  These permissions will be the same as those used to grant users access - reducing the complexity and risk for Administrators.

### Background tasks permissions

Lots of things can happen in the background when operating a cluster such as deleting old indices, producing monitoring data, and generating reports. When these different tasks execute each task should have only the kinds of permissions it needs to protect against mistakes or unintended consequences.

### Security Isolation 

Using the lowest level of privileges when any task is executed is a key to prevent mistakes or software defects from impacting the stability of an OpenSearch cluster. By enforcing protections everywhere inside OpenSearch, the blast radius of these incidences will be drastically reduced.

## Interested in being involved?

These are bold changes and they are going to require doing things differently that has been done. We are in the process of defining and building the Identity systems into the core of open search. 

As Identity impacts many facets of the OpenSearch ecosystem we would like your ideas and contributions to be engaged during the development process [link](https://github.com/opensearch-project/OpenSearch/issues/4514) and watch this [feature branch](https://github.com/opensearch-project/OpenSearch/pulls?q=is%3Apr+base%3Afeature%2Fidentity) or [label](https://github.com/opensearch-project/OpenSearch/issues?q=label%3AIdentity+) in OpenSearch.

Expect more blog posts on Identity features and presentations during the community meetings.
