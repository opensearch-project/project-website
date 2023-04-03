---
layout: post
title:  "Technical roadmap: OpenSearch extensibility"
authors:
  - dblock
date:   2023-04-03
categories:
  - technical-post
meta_keywords: OpenSearch extensibility, extensions framework, OpenSearch plugins, OpenSearch Dashboards
meta_description: Learn how the OpenSearch Project is replacing its plugin framework with a new catalog of extensions to help users and developers overcome extensibility challenges.
excerpt: The OpenSearch plugin framework presents a number of challenges for users and developers. To solve these, we've embarked on a journey to replace the plugin mechanism with extensions.
---

The primary reason users choose OpenSearch is the wide range of use cases they can address with its features, such as search or log analytics. Thus, we aim to make the OpenSearch Project the preferred platform for builders by creating a vibrant and deeply integrated ecosystem of projects, features, content packs, integrations, and tools that can be found quickly, installed securely, combined to solve problems, and monetized by many participants. 

The existing mechanism used to extend OpenSearch and OpenSearch Dashboards is a plugin framework. It provides a useful way to extend functionality, particularly when the new functionality needs access to a significant number of internal APIs. However, the plugin framework presents a number of challenges for users and developers in the areas of administration, dependency management, security, availability, scalability, and developer velocity. To begin solving these, we've embarked on a journey to replace the OpenSearch plugin mechanism with a new catalog of _extensions_. We plan to ship two new SDKs for OpenSearch and OpenSearch Dashboards and then launch a catalog of extensions.

In this blog post, we'll introduce the concept of extensions and outline some proposed projects in this area.

## Introducing extensions

From the product point of view, extensions are a new mechanism that provides a way to break up a monolithic, tightly coupled model for building new features in OpenSearch. Technically, extensions are a simple evolution of plugins---or plugins decoupled from their OpenSearch/Dashboards hosts. In practice, an extension is only different from a plugin in that it only depends on the OpenSearch/Dashboards SDK and works with multiple versions of OpenSearch/Dashboards. We aim for the existence of many more extensions than there are plugins today, written by many more developers. Then we will sunset plugins.

We want for extensions to become the preferred mechanism for providing functionality in OpenSearch/Dashboards. Having multiple competing implementations will produce extensions with high performance, improved security, and versatile features for all categories of users, administrators, and developers.

## Extensions roadmap

The following proposed projects are in chronological order, but many of them can be accomplished in parallel.

### Provide experimental SDKs and move extensibility concerns out of the cores

First, we plan to introduce an OpenSearch SDK and an OpenSearch Dashboards SDK and refactor the OpenSearch/Dashboards cores to support them as needed. This creates both a logical and a physical separation between extensions and their hosts. You should be able to author an extension that is compatible with all minor versions of an OpenSearch/Dashboards release and to upgrade OpenSearch/Dashboards without having to upgrade an installed extension.

The SDK assumes current and future extensibility concerns from OpenSearch/Dashboards. It will contain the set of APIs that need to follow semver, significantly reducing the number of APIs that OpenSearch/Dashboards needs to worry about, because plugins only take a dependency on the SDK. With a semver-stable SDK, plugins can confidently declare that they work with, for example, `OpenSearch/Dashboards >= 2.3.0` (2.3, 2.4, ... 3.0, and so on) or `~> 2.5` (any 2.x after 2.5). The SDK will provide support for integration testing against broad ranges of OpenSearch/Dashboards versions. It can begin selecting common functionality that all plugins may need, such as storing credentials or saving objects, and be strongly opinionated about what constitutes a semver-compatible extension point for OpenSearch/Dashboards. Instead of importing a transitive dependency (for example, `oui`), developers import an SDK namespace (for example, `sdk/ui`).

The SDK will be much smaller in size than OpenSearch/Dashboards. To develop an extension on top of an SDK, you will not need to check out and build OpenSearch/Dashboards. We will publish the SDKs to maven/npm; they will follow their own semver and will have documentation of public interfaces. The SDK can also choose to implement wrappers for multiple major versions of OpenSearch/Dashboards, extending compatibility much further and enabling developers to write extensions once for several major versions of OpenSearch. Finally, extension testing can be performed against a released, downloaded, and stable version of OpenSearch/Dashboards.

This project is currently in progress. The SDK for OpenSearch exists, the SDK repo for OpenSearch Dashboards has been created, and some POCs for plugins as extensions exist. See [OpenSearch #2447](https://github.com/opensearch-project/OpenSearch/issues/2447), [opensearch-sdk-java #139](https://github.com/opensearch-project/opensearch-sdk-java/issues/139), [OpenSearch-Dashboards #2608](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2608), and [OpenSearch-Dashboards #3095](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3095).

### Add security support for extensions in the OpenSearch/Dashboards cores

In the plugin model, security is also a plugin. This means security can be optional, which makes it difficult for plugins to build features such as field- and document-level security (FLS/DLS), which perform data access securely. Each plugin must implement data access checks independently and correctly, which has proven to be difficult (see [security #1895](https://github.com/opensearch-project/security/issues/1895) for some examples). A simpler and more secure implementation would make all operations inside OpenSearch permissible, no matter the source, syncing access checks to the lower levels. The SDKs move extensibility concerns out of the cores. They will have brand-new APIs, presenting the most opportune time to require a security context in all OpenSearch API calls. It should, of course, still be possible to disable security as needed.

We plan to add authentication mechanisms to the OpenSearch core (every API call or new thread/process will carry an identity) and perform authorization when accessing data at the level of these APIs in a way that is backward compatible with the Security plugin. Authorization checks will be enabled using the Security plugin for core APIs exposed in the SDK, and there will be no changes required in plugins to ensure backward compatibility.

We currently have an active feature branch for adding security support for extensions in OpenSearch. See [OpenSearch #5834](https://github.com/opensearch-project/OpenSearch/issues/5834).

### Replace plugins in the OpenSearch/Dashboards distribution

One of the main reasons for the existence of the default OpenSearch distribution is that it provides a set of secure, signed binaries along with a rich set of features (plugins). We have invested in a large automation effort in the open-source distribution to make this process safe and repeatable. However, producing this distribution still requires significant logistical and technical coordination, plus the semi-automated labor of incrementing versions, adding components to manifests, and tracking unstable upstreams. The toughest challenge to overcome is developers having to develop, build, and test plugins against moving targets of non-stable versions of the OpenSearch/Dashboards cores.

We aim for extensions to ship independently, either more or less often than the official distribution. Users should be able to upgrade OpenSearch clusters much more easily because they won’t need to upgrade installed extensions. Additionally, with fewer versions of released extensions containing no new features, there will be less security patching.

For each existing plugin that ships with the OpenSearch distribution, we will need to design a technical path forward, but this phase will present no change in user experience for the default OpenSearch/Dashboards distribution. First, we will design and implement interfaces that need to be exported via the OpenSearch/Dashboards SDK. This presents an opportunity to redesign extension points to be simpler and more coherent and an opportunity to refactor classes in OpenSearch/Dashboards. Plugins remove the dependency on OpenSearch/Dashboards and add a dependency on the SDK, reimplement the calls, and are then available as extensions. Second, to migrate the entire Security plugin into the core, we will need to add support for authorization in REST handlers, implement authorized request forwarding in the REST layer, add support for asynchronous operations and background tasks, and add system index support to allow extensions to reserve system indexes. Finally, the distribution mechanisms can begin picking up the latest available version of an extension, and releasing those artifacts as a bundle instead of rebuilding everything.

### OpenSearch Dashboards cohesion through interfaces

OpenSearch Dashboards is a single product that includes the core platform (for example, the application chrome, data, and saved objects APIs), native plugins (for example, Home, Discover, Dev Tools, and Stack Management), and feature plugins (for example, Observability, Anomaly Detection, Maps, and Alerting).

The current Dashboards experience is not cohesive. As you move between core experiences and feature plugins, there are visual inconsistencies in the fonts, colors, layouts, and charts. Feature plugins are mostly siloed experiences and don’t render on dashboard pages. Feature plugins are built differently than the native plugins. For example, they often don’t leverage existing interfaces, such as saved objects, to store UI-configured metadata, or render embedded components on dashboard pages. Additionally, Dashboards currently uses six libraries for rendering visualizations and offers six visualization authoring experiences with overlapping functionality, each with its own implementation.

Consolidating UI component and visualization rendering libraries into an SDK will reduce maintenance and cognitive burden. We’ll introduce a configuration and template system and a style integrator so that common default preferences can be set once instead of on every visualization. We’ll standardize and modularize configuration options so that UI components are consistent and saved visualizations are cross-compatible. We’ll clearly separate data source configurations and fetching from visualization configurations. We’ll define capabilities and behavior that visualizations should satisfy so that it’s quicker and easier to build new visualization type definitions that are still fully featured.

For more information, see [OpenSearch-Dashboards #2840](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2840) and [OpenSearch-Dashboards #2880](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2880).

### In-proc support for OpenSearch extensions

We designed extensions to have a clear API boundary, yet lost the ability to host extensions on the same JVM, adding about 10% serialization overhead to the process. We want to give extension developers the ability to remove that overhead, at the same time providing cluster administrators with more control and improving safety and security.

A number of extensions, such as language analyzers or storage extensions, live on the critical path of high throughput and may not be able to achieve high performance due to the overhead of additional inter-process communication. Furthermore, for any non-trivial number of extensions (about 10 or more), these extensions will be unlikely to run effectively in separate JVM or Node.js processes without negatively impacting nodes. To satisfy high performance requirements, we will need to reintroduce a way for extensions to run on the same JVM as OpenSearch or to share Node.js processes for OpenSearch Dashboards while giving administrators a way to gain performance in exchange for security isolation, support for extensions written in multiple languages, and multiple major version compatibility.

Practically speaking, we will need to provide the ability for a subset of OpenSearch extensions to run on the same JVM, and operate on data structures without serialization or deserialization, all without the need to change anything in the implementation of the extension itself.

### Support dependencies between extensions

In the current state, all dependencies are implicit, and all versions across cores and plugins must match. Therefore, we heavily rely on testing a distribution bundle. There’s no mechanism for knowing what the dependencies are, and all dependency errors are found at runtime. Any update to the dependencies requires rebuilding other plugins, even when there are no changes within the current plugin. Thus, everything is always rebuilt from scratch for every release. To solve this problem, we will add the ability for extensions to depend on other extensions, similar to the ability of an extension to depend on a semver-compatible version of OpenSearch/Dashboards.

### Public catalog

We’ll augment the previously built rudimentary schema for an extension’s metadata to provide additional fields beyond name, version, and compatibility. These will include such fields as well-defined categories and additional vendor/sponsor information. We will build a minimal catalog website with search functionality and deploy and maintain a public version of it. We’ll ensure that the catalog system can also be run by any enterprise internally, building signing and trust into the system, but will not perform any validation beyond metadata correctness at this stage. An internal catalog will be able to sync with a public catalog with appropriate administrative controls. Alternatively, existing third-party catalog systems will use an API to import extensions. Developers will be able to sign up to publish extensions on the public instance, and we will build mechanisms that help users trust publishers. An API in OpenSearch will support installing extensions from catalogs. A view in OpenSearch Dashboards will allow browsing of available catalogs and extensions.

Developers will be able to publish extensions to a public catalog; users will be able to find extensions in this catalog with a taxonomy and search functions. We'll provide detail pages with meaningful metadata and vendor information, and administrators will be able to install extensions from public or private catalogs and import a subset of a public catalog into their enterprise. Finally, we'll add a way for publishers to verify themselves, add quality controls, and possibly include publisher approvals.

### Supporting extensions in OpenSearch high-level language clients

We are in the process of improving support for existing plugins in clients by publishing REST interfaces in the form of OpenAPI specs. A generator will consume the spec and output parts of a complete high-level thin client for the OpenSearch distribution.

We will similarly support extensions in the clients by creating thin clients for each extension that will be composable with the core client in every supported programming language. Extensions will publish REST interfaces in the form of OpenAPI specs, and a generator will consume the spec and output a complete high-level thin client. The burden of m * n extensions and languages will be alleviated by automating as much of the process as possible, and providing build and test tooling such as CI workflows, so that both project-owned extensions and third-party-developed extensions benefit from uniform support. The extension owner can then take the generated clients and publish them to their package repositories of choice. The core clients will define stable low-level/raw interfaces with their transport layer such that the thin clients compose as expected and follow semver compatibility rules.

See [opensearch-clients #19](https://github.com/opensearch-project/opensearch-clients/issues/19) for more information.

### Rewrite most plugins as extensions

We will provide a way to deprecate plugins by implementing all corresponding plugin features in extensions, with the goal of minimizing the effort required to migrate. We will write a migration guide that clearly specifies the effort required to perform the initial migration and follow-up deprecated feature replacement so that you can integrate it into your own task planning, offer code that makes the migration from plugins to extensions easier, implement samples that provide one-to-one analogs with the existing plugin framework, and create assurances that external behavior in the migration has not changed. Code permitting this quick bridge may be marked deprecated but will allow you to methodically remove the deprecated code over time.

For more information, see [opensearch-sdk-java #315](https://github.com/opensearch-project/opensearch-sdk-java/issues/315).

### Deprecate plugins and unbundle distributions

Assuming extensions have been widely adopted, we can deprecate the plugin APIs and remove them from the next major version of OpenSearch. We don't expect this to happen earlier than OpenSearch 4.0. Older plugin versions will continue to work with older versions of OpenSearch and receive security patches.

We will replace the two distribution flavors of OpenSearch/Dashboards (currently a -min distribution without security or plugins) with a set of distribution manifests tailored for such purposes as log analytics and search. Each distribution will be represented by a manifest that can be assembled by downloading the artifacts from the public catalog for packaging purposes. We want to enable single-click installation of a collection of extensions, provide recommended distributions of OpenSearch for tailored purposes, let vendors create their favorite flavor of OpenSearch/Dashboards distribution easily, and add the capability to create enterprise-tailored distributions.

## Future

Extensions will make a lot of new, big ideas possible! Here are some of our favorites.

### Hot swap extensions 

OpenSearch/Dashboards bootstrap plugins at start time, and various parts of the system assume that plugins do not change at runtime. Requiring a cluster restart for all extensions is a severely crippling limitation on the path of ecosystem adoption of any significant number of extensions, primarily because cluster restarts mean stopping inbound traffic. We will ensure that any extension point can be loaded or unloaded at runtime by making settings in the OpenSearch core dynamic and adding tools to support loading and unloading extensions at runtime without restarting OpenSearch/Dashboards nodes or the entire cluster. This creates the ability to add, upgrade, or remove an extension without the need to restart OpenSearch/Dashboards or connect a remote extension to an existing OpenSearch/Dashboards cluster.

### Extensible document parsing

JSON is, by far, the most popular input format for OpenSearch. JSON is humanly readable, so it is fairly easy to test and use for development. Additionally, the OpenSearch ecosystem is built around JSON, with most benchmarks written in JSON and ingest connectors supporting JSON. However, JSON is much slower and more space-consuming than most binary formats, thus swapping JSON for another type may yield significant performance gains. We would like to make OpenSearch input formats extensible so that it is easier to add and test more formats. This was proposed in [OpenSearch #4559](https://github.com/opensearch-project/OpenSearch/issues/4559).

### Security isolation

With extensions being designed to run on a separate virtual machine (VM), we can introduce multiple options for isolating extensions, such as containers and Java runtimes (for example, Firecracker, GraalVM, and EBPF). We can also provide a new secure default runtime and solve the problem of Java Security Manager (JSM) deprecation. We can further extend security across new boundaries, ensuring all messages are encrypted in transit and all data is encrypted at rest.

### Search processors become extensions

In [search-processor #80](https://github.com/opensearch-project/search-processor/issues/80), we proposed a new search processor pipeline. Search processors are plugins that can become extensions before plugins are deprecated.

### Storage plugins become extensions

The storage API in OpenSearch has proven to be quite stable. There may be no need to change storage extensions across OpenSearch versions. New features and improvements in the respective remote storage clients (for example, Microsoft Azure or Amazon Simple Storage Service (Amazon S3)) happen separately from OpenSearch distributions, so these extensions can be upgraded and improved without needing to wait for a new OpenSearch release. We also want partners to maintain their own storage, removing the idea of "first-class storage."

With the addition of features like remote-backed indexes and searchable snapshots, the storage plugins (for example, Amazon S3, Azure, GCP, and HDFS) are on the critical path for both indexing and search operations. These plugins will not be able to ship with any performance penalty because it is likely to make for an unacceptable user experience. We’ll use the in-process support for extensions to move these plugins to the extensions model. We could abstract just reading or writing, support multiple versions of Lucene side by side, or use different storage engines and initialize one engine per index.

### Replication as an extension

With the introduction of segment replication (segrep), node resources need to be allocated to perform file copy. Today there are settings that define limits on data transfer rates (for segrep and recovery) to prevent these functions from consuming valuable resources required for indexing and search. Moving this functionality to a separate node-local JVM allows us to control maximum resource consumption (CPU/memory) and avoid unnecessary throttling and any impact on read and write performance. We can therefore define new extension points on the engine to support segrep implementations that can run as a sidecar and provide the opportunity to plug in an implementation based on storage requirement (remote, node-node). This will be either in process or in a separate node-local process and will be integrated with the storage plugins to support remote store as a replication source.

### Extensions in other programming languages

With extensions designed to operate remotely, we can support out-of-process extensions written in other languages running on the JVM and remote extensions written in any other language hosted externally. By enabling polyglot applications or porting the extension SDKs to other programming languages, we will also lower the barrier to entry for authoring extensions in languages such as Ruby with a JRuby SDK or add support for in-proc extensions written in TypeScript running on GraalVM.

### Extensions in other technologies

An extension cannot be entirely implemented in an Azure Function or AWS Lambda because it must maintain a network connection with OpenSearch and share some state information. It is possible to create a client for this purpose with an internal Lambda implementation to enable Lambda extensions.

### Aggregations as an extension

As we work toward separating search aggregations and compute, we will refactor and extract interface and SDK components for compute separately from the search phase lifecycle. Simple search aggregations, which default to the current single-pass data aggregation implementation, may still be supported for basic search use cases. Separating the compute framework through extensions and a developer SDK enables drop-in replacements from more evolved data analytics systems, such as Spark. By separating the search aggregation framework through extensions and a developer SDK, third-party contributors can leverage new kinds of search aggregation support, such as principal component analysis (PCA) or stratified sampling pipeline aggregations.

### Cluster manager as an extension

We would like to refactor and extract cluster management interfaces to remove the existing cluster manager node limit of ~200. For large deployments, we believe we can provide alternate cluster manager implementations that have a different scalability and availability model.

### Offloading background tasks to extensions

A number of background operations currently run asynchronously in an OpenSearch cluster, including Lucene segment merges, data tier migrations (for example, hot to warm to cold), and most operations performed by Index State Management (ISM). These can be offloaded to dedicated or isolated compute instances through the extensions mechanism, improving cluster scalability and availability.

### Communication protocols as extensions

By making communication protocols extensible, we can experiment with more performant implementations such as [GRPC](https://grpc.io/) or no- or low-garbage-collection implementations (for example, [Netty](https://netty.io/)) without having to modify the core engine. Check out [opensearch-sdk-java #414](https://github.com/opensearch-project/opensearch-sdk-java/issues/414#issuecomment-1471010441), which prototypes protobuf serialization.

## Help wanted

This blog post reflects some of our current project plans. Like all plans, they may change as we make progress, and we would love your help! The best way to start is by checking out [opensearch-sdk-java](https://github.com/opensearch-project/opensearch-sdk-java). Try to implement a trivial extension on top of it, or help us port an existing plugin. You could also pick up one of the issues labeled "[good first issue](https://github.com/opensearch-project/opensearch-sdk-java/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)" in that project or start with one of the ideas we mentioned above. As always, please let us know how we can help by opening new issues or posting to [the forums](https://forum.opensearch.org/).
