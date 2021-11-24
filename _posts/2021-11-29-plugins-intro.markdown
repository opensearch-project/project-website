---
layout: post
title: "Introduction to OpenSearch Plugins"
authors: 
  - vemsarat
  - kazabdu
date: 2021-11-22
categories:
  - technical-post
twittercard:
  description: "This post contains an overview of how OpenSearch plugins are loaded and interact with Java Security Manager."
---


OpenSearch enables extending core features via plugins. Plugins are empowered to access all extensible features of OpenSearch and extend them. In this blog post we wanted to unbox the plugin architecture, and help understand how they work.


## Pluggable Architecture

Plugins in OpenSearch bring in modular architecture and enable developing/managing a large code base easier. The [blog post](https://logz.io/blog/opensearch-plugins/) from our partner [Logz.io](http://logz.io/) helps understand why pluggable architecture is important, and how the architecture works. 

The Plugin architecture is designed to enable solving specific problems and extending generic features. For example, [Anomaly Detection](https://github.com/opensearch-project/anomaly-detection) plugin reads time stream data ingested and finds anomalies. Another example is [Job Scheduler](https://github.com/opensearch-project/job-scheduler) plugin which schedules and runs generic jobs. 

Plugins are of various types, generally could be categorized as:


* Analysis: Used for analysis of data available within the cluster. 
* Discovery: Used for easy discovery of nodes in various platforms.
* Ingest: Used for pre/post-processing data during ingestion.
* Mappers: Helps extend/create data fields to OpenSearch.
* Snapshot/Restore: Used to create a snapshot and restore data

To develop these plugins, the code base has well defined [interfaces](https://github.com/opensearch-project/OpenSearch/tree/main/server/src/main/java/org/opensearch/plugins) to solve specific sub-set of problems. 


## Extension Points

The architecture is built for plugins to hook onto various extension points within the code base and subscribe to notifications/events they are interested in. There are bunch of extension points defined by Plugin.java and are available by default to all plugins. Plugins implementing custom interfaces have additional extension points.  

Extension points enable plugins to hook into various events within the lifecycle of the OpenSearch cluster. 
The default extension points are defined by [Plugin.java](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/plugins/Plugin.java#L90) abstract class:


* `getFeature` - Could be used to implement a custom feature and respond to cluster state API.
* `createGuiceModules` - Implement node level dependency injection modules via Guice.
* `getGuiceServiceClasses` - Node level services which will be automatically called with node state changes.
* `createComponents` - Custom component implemented and its lifecycle being managed by OpenSearch.
* `additionalSettings` - Implement additional node level settings.
* `getNamedWriteables` - Custom parsers the plugin would use for transport messaging.
* `getNamedXContent` - Custom parsers the plugin would use for NamedObjects.
* `onIndexModule` - Index level extension point, called before an index is created.
* `getSettings` - Implement additional cluster level settings.
* `getSettingsFilter` - Implement additional cluster level settings filter. 
* `getSettingUpgraders` - Implement setting upgraders. 
* `getIndexTemplateMetadataUpgrader` - An extension to modify index template metadata on startup.
* `getExecutorBuilders` - Implement custom thread pools for executions.
* `getBootstrapChecks` - Add additional bootstrap checks when OpenSearch node initializes.
* `getRoles` - Implement additional DiscoveryNodeRole’s.
* `getAdditionalIndexSettingProviders` - Implement additional index level settings for newly created indices.

Custom plugin interfaces define their new extension points for plugins to hook onto. For example, [Engine Plugin](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/plugins/EnginePlugin.java) interface which could be used to provide additional implementations to the core engine exposes a hook to [node bootstrap](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/node/Node.java#L577) after the plugin is loaded to load the custom `engineFactory` and [Index Service](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/indices/IndicesService.java#L763) overrides it if plugin chooses to override. 


## How do Plugins work?

As you might have used plugins in the OpenSearch bundle. There are two parts for plugins to work with OpenSearch. 
a. Installing a plugin.
b. Loading a plugin

### Installing a plugin

The OpenSearch bundle comes with a tool `./bin/opensearch-plugin` which helps to install a plugin. [PluginCli](https://github.com/opensearch-project/OpenSearch/blob/main/distribution/tools/plugin-cli/src/main/java/org/opensearch/plugins/PluginCli.java) reads and validates `plugin-descriptor.properties` file packaged with every plugin. For example, the OpenSearch security plugin defines [plugin-descriptor.properties](https://github.com/opensearch-project/security/blob/main/plugin-descriptor.properties) file which defines a bunch of parameters, and the tool verifies if it is using the compatible version of OpenSearch, and the dependencies are present. 

Also, the tool verifies `plugin-security.policy` file, which is defined by the plugin which needs additional security permissions. For example, the OpenSearch security plugin defines many permissions like file read/write, classloading or networking that it needs through [plugin-security.policy](https://github.com/opensearch-project/security/blob/main/plugin-security.policy) file. These permissions are managed via Java Security Manager and have more details later in this post.

After the tool validates the plugin, it copies all jars into `plugins` directory.
By default, opensearch-min artifact does not package any plugins including the [native plugins](https://github.com/opensearch-project/OpenSearch/tree/main/plugins) which exist in the OpenSearch code base.


### Loading a plugin

Plugins run within the same process as OpenSearch. As OpenSearch process is bootstraps, it initializes [PluginService](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/plugins/PluginsService.java#L124) via [Node.java](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/node/Node.java#L392). All plugins are class-loaded via [loadPlugin](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/plugins/PluginsService.java#L765:20) during the bootstrapped of PluginService. 
It checks the  `plugins` directory and loads the classpath where all the plugin jars and their dependencies are already installed by the `opensearch-plugin` install tool.

```
~/opensearch-1.1.0/plugins$ ls
opensearch-alerting  opensearch-asynchronous-search opensearch-index-management opensearch-knn opensearch-performance-analyzer opensearch-security
opensearch-anomaly-detection opensearch-cross-cluster-replication opensearch-job-scheduler opensearch-notebooks opensearch-reports-scheduler opensearch-sql
```

During the bootstrap, each plugin is initialized and they hook up to various extension points through the interfaces they choose to implement. 

As the plugins are class-loaded during the node bootstrap, the extension points initialize the data structures and this design prevents plugins to be loaded on the fly and cannot hot-swap when the node is up. (i.e. after the node bootstrap is complete). 

### Plugins vs Modules

As you might have noticed, OpenSearch defines [plugins](https://github.com/opensearch-project/OpenSearch/tree/main/plugins) and [modules](https://github.com/opensearch-project/OpenSearch/tree/main/modules) differently. The main difference is modules are [automatically loaded](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/plugins/PluginsService.java#L163) in an OpenSearch node and are packaged with `opensearch-min` artifact. On the flipside, plugins are not automatically packaged and have to be manually installed.


```
~/opensearch-1.1.0/modules$ ls
aggs-matrix-stats geo ingest-geoip lang-expression lang-painless opensearch-dashboards percolator reindex transport-netty4
analysis-common ingest-common ingest-user-agent lang-mustache mapper-extras parent-join rank-eval repository-url
```

Modules essentially are plugins and they implement plugin interfaces, but the only logical difference is that they are loaded by default which makes them special. All core extendible features are built via modules for extensibility.


## Java Security Manager

Java applications are prone to have vulnerabilities on a remote cluster or by a DDoS attack. To prevent this, JVM can be run in a sandbox mode which will prevent, for example: access to the local hard disk or the network. All of these are handled by the Security Manager.

### How is it used in OpenSearch?

1. As OpenSearch bundles a few plugins, every plugin can define its own custom security policy file which will be installed at the same time when OpenSearch is installing the plugin.
2. Security Manager is initialized in [Opensearch.java](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/bootstrap/OpenSearch.java#L91) and every plugin has a custom policy file called [plugin-secruity.policy](https://github.com/opensearch-project/anomaly-detection/blob/main/src/main/plugin-metadata/plugin-security.policy).
3. The [getPolicy()](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/bootstrap/OpenSearchPolicy.java#L77-L79) method will take care of assigning the initial default policies required for the plugins and [setPolicy()](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/bootstrap/Security.java#L134) method will assign the custom policies of the plugins present in `plugin-secruity.policy`. 
4. Each custom security policy file is signed and has a codebase which is a signed key between OpenSearch and the plugin.
5. Each security policy can be attached via gradle plugin [opensearch.opensearchplugin](https://github.com/opensearch-project/anomaly-detection/blob/main/build.gradle#L94) in the `build.gradle` file of the plugin. 

```
opensearchplugin {
  description 'The HDFS repository plugin adds support for Hadoop Distributed File-System (HDFS) repositories.'
  classname 'org.opensearch.repositories.hdfs.HdfsPlugin'
}
```

![security-manager](/assets/media/blog-images/2021-11-29-plugins-intro/security_manager.jpg){: .img-fluid}  


The security policy has a notion of per-user policies and it is useful in the context of manually configuring the application deployment on a single specific computer, but it is hard to use in the generic case.

### **Benefits of Security Manager in OpenSearch**

* Prevent access to OpenSearch cluster with all permissions. Any intruder can add new classes, change private members or access the ClassLoaders. The Security Manager takes care of it by creating a sandbox environment.
* `exitVM` permission is allowed for a few special classes, for other classes the process will kill and exit the cluster. This method calls [checkPermission](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/bootstrap/OpenSearch.java#L94) with the RuntimePermission and throws a SecurityException.
* Security Manager Policy allows installing a plugin through `plugin-secruity.policy` which consists of dynamic configuration and dependencies required for a plugin to run.
* Plugins can ask for `AllPermission` of the OpenSearch cluster. The Security Manager takes care of `AllPermission` and makes sure to check it as a part of Bootstrap.

### **Benefit of Security Manager for Plugins**

* Plugins can create a `plugin-secruity.policy` file and write dynamic configuration and permissions required to run from OpenSearch Cluster.

## Closing Notes

We hope this post helps unbox the mystery of how plugins work within OpenSearch. Now that you learnt how plugins work and what their limitations are, let us know if you have any feedback or would like new features in plugin architecture.

In the coming days, lookout for a follow-up post soon on how plugins work with OpenSearch Dashboards. 
