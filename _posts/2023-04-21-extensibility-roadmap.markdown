---
layout: post
title:  "OpenSearch Extensibility Technical Roadmap"
authors:
  - dblock
date:   2023-03-21
categories:
  - technical-post
meta_keywords: OpenSearch extensibility, plugins, extensions
meta_description: The OpenSearch plugin framework presents a number of challenges for users and developers. To solve these, we've embarked on a journey to replace this plugin mechanism with a new concept of "extensions”.
excerpt: The OpenSearch plugin framework presents a number of challenges for users and developers. To solve these, we've embarked on a journey to replace this plugin mechanism with a new concept of "extensions”.
---

A core reason users choose OpenSearch is for the wide range of use-cases they can address with its features, such as search, or log analytics. Thus, we aim to make OpenSearch Project the preferred platform for builders by creating a vibrant and deeply integrated ecosystem of projects, features, content packs, integrations, and tools that can be quickly found, installed securely, combined to solve problems, and monetized by many participants. The existing mechanism to extend OpenSearch and OpenSearch Dashboards is a plugin framework. It provides a useful mechanism for extending functionality, particularly when the new functionality needed access to a significant number of cluster internal APIs. However, the plugin framework presents a number of challenges for users and developers in areas of administration, dependency management, security, availability, scalability, and developer velocity. To begin solving these, we've embarked on a journey to replace the OpenSearch plugin mechanism with a new concept of _extensions_. We plan to ship two new software development kits (SDKs) for OpenSearch and OpenSearch Dashboards, and then launch a catalog of extensions.

In this blog post we'll introduce extensions, and outline some projects in this area.

## Introducing Extensions

From the product point of view, _extensions_ are a new mechanism that provides a way to break up a monolithic, tightly coupled way of building new features in OpenSearch Project. Technically, extensions are a simple evolution of plugins, or plugins decoupled from their OpenSearch/Dashboards host. In practice, an extension is only different from a plugin in such that it only depends on the OpenSearch/Dashboards SDK, and works with multiple versions of OpenSearch/Dashboards. We aim for the existence of magnitudes more extensions than plugins today, written by many more developers, then we will sunset plugins.

We aim for extensions to become the preferred mechanism for providing functionality in OpenSearch/Dashboards for which multiple implementations may compete, make them useful to all categories of users, administrators and developers, high performance, and secure.

## Extensions Roadmap 

### Experimental SDKs, move extensibility concerns out of the monoliths 

First, we plan to introduce an OpenSearch SDK and an OpenSearch Dashboards SDK and refactor OpenSearch/Dashboards cores to support that as needed. This creates both a logical and a physical separation between extensions and their hosts. You should be able to author an extension that is compatible with all minor versions of an OpenSearch/Dashboards release, and upgrade OpenSearch/Dashboards without having to upgrade an installed extension.

The SDK takes on current and future extensibility concerns from OpenSearch/Dashboards. It will contain the set of APIs that need to follow semver, significantly reducing the surface of APIs that OpenSearch/Dashboards needs to worry about, since plugins only take a dependency on the SDK. With a semver-stable SDK plugins can confidently declare that they work with, for example, `OpenSearch/Dashboards >= 2.3.0` (2.3, 2.4, ... 3.0, etc.) or `~> 2.5` (any 2.x after 2.5). It will provide support for integration testing against broad ranges of OpenSearch/Dashboards versions, and can begin selecting common functionality that all plugins may need, such as storing credentials or saving objects, and be strongly opinionated about what constitutes a semver-compatible extension point for OpenSearch/Dashboards. Instead of importing a transitive dependency (e.g. `oui`), developers import an SDK namespace (e.g. `sdk/ui`).

The SDK will also be much smaller in size than OpenSearch/Dashboards. So to develop an extension on top of an SDK, no need to check out and build OpenSearch/Dashboards. We will publish the SDKs to maven/npm, they will follow their own semver, and have documentation of public interfaces. The SDK can also choose to implement wrappers that translate for multiple major versions of OpenSearch/Dashboards, extending compatibility much further, enabling developers to write extensions once for several major versions of OpenSearch. Finally, testing an extension can be done against a released, downloaded, and stable version of OpenSearch/Dashboards.

We are currently in the middle of this, the SDK for OpenSearch exists, and the SDK repo for OpenSearch Dashboards has been created; some POCs for plugins as extensions exist. See [OpenSearch#2447](https://github.com/opensearch-project/OpenSearch/issues/2447), [opensearch-sdk-java#139](https://github.com/opensearch-project/opensearch-sdk-java/issues/139), [OpenSearch-Dashboards#2608](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2608), and [OpenSearch-Dashboards#3095](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3095).

### Add security support for extensions in core

In the plugin model, security is also a plugin, which can be optional, which makes it difficult for plugins to build features that perform data access securely, such as field/document level security (FLS/DLS). Each plugin must implement data access checks independently, and correctly, which has proven itself difficult (see [security#1895](https://github.com/opensearch-project/security/issues/1895) for some examples). A simpler, and more secure implementation would make all operations inside OpenSearch permissible, no matter the source, syncing access checks to the lower levels. The SDKs move extensibility concerns out of the monoliths have brand new APIs, therefore it’s the most opportune time to require a security context in all API calls in OpenSearch. It should, of course, still be possible to disable security as needed.

We plan to add authentication mechanisms to OpenSearch core (every API call or new thread/process will carry an identity), and perform authorization when accessing data at the level of these APIs in a way that is backwards compatible with the security plugin. We will always enable authorization checks using the security plugin when called from extensions, and there will be no changes in plugins for backwards compatibility.

See [OpenSearch#5834](https://github.com/opensearch-project/OpenSearch/issues/5834), we currently have an active feature branch for identity in OpenSearch core.

### Replace plugins in the OpenSearch/Dashboards distribution

One of the major reasons for the existence of the default distribution of OpenSearch is to provide a set of secure, signed binaries along with a rich set of features (plugins). We have invested into a large automation effort in both the open-source distribution to make this process safe and repeatable, but producing this distribution still requires significant logistical and technical coordination, plus semi-automated labor of incrementing versions, adding components to manifests, or tracking unstable upstreams. The toughest challenge to overcome is that developers have to develop, build, and test plugins against moving targets of non-stable versions of OpenSearch/Dashboards cores.

We aim for extensions to ship independently, more, or less often than the official distribution. Users should be able to upgrade OpenSearch clusters much more easily because they don’t need to upgrade installed extensions, and with fewer versions released of extensions with no net new features the amount of security patching will be reduced.

For each existing plugin that ships with the OpenSearch distribution we will need to design a technical path forward, but this phase will have no change in user experience for the default distribution of OpenSearch/Dashboards. First, we will identify the shape of, and implement interfaces that need to be exported via the OpenSearch/Dashboards SDK. This is an opportunity to redesign extension points to be simpler and more coherent, and an opportunity to refactor classes in OpenSearch/Dashboards. Plugins cut the dependency on OpenSearch/Dashboards and add a dependency on the SDK, reimplement the calls, and are now available as extensions. Second, to migrate all of security plugin into core, we will need to add support for authorization in REST handlers, implement authorized request forwarding in REST layer, add support for async operations and background tasks, and  add system, index support to allow extensions to reserve system indices. Finally, the distribution mechanisms can begin picking up the latest available version of an extension, instead of rebuilding everything, and releasing together.

### OpenSearch Dashboards cohesion through interfaces

OpenSearch Dashboards is a single product that includes the core platform (e.g. application chrome, data and saved objects APIs, etc), native plugins (e.g. home, discover, dev tools, stack management, etc.), and feature plugins (e.g. observability, anomaly detection, maps, alerting, etc.).

The experiences in Dashboards today are not cohesive. As you move between core experiences and feature plugins there are visual inconsistencies in the fonts, colors, layouts, and charts. Feature plugins are mostly silo’ed experiences, and don’t render on the dashboard page. Feature plugins are built differently than the native plugins. For example, they often don’t leverage existing interfaces like saved objects to store UI-configured metadata or embeddables to render on dashboard pages. Additionally, Dashboards currently uses 6 libraries for rendering visualizations and offers 6 visualization authoring experiences with overlapping functionality, each with their own implementations.

Consolidation of UI component and visualization rendering libraries into an SDK reduces maintenance and cognitive burden. We’ll introduce a configuration and template system and a style integrator so that common default preferences can be set once, instead of on every visualization. We’ll standardize and modularize configuration options so that UI components are consistent and saved visualizations are cross-compatible. We’ll clearly separate data source configurations and fetching from visualization configurations. We’ll define capabilities and behavior that visualizations should satisfy, so that it’s quicker and easier to build new visualization type definitions that are still fully featured.

This is [OpenSearch-Dashboards#2840](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2840) and [OpenSearch-Dashboards#2880](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2880).

### In-proc support for OpenSearch extensions

We designed extensions to have a clear API boundary by using the SDK mechanism, but lost the ability to run on the same JVM, adding about 10% of serialization overhead in the process. We want to give extension developers the ability to remove that overhead, but this time with providing cluster administrators with more controls, improving safety and security.

A number of extensions, such as language analyzers or storage extensions, live on the critical path of high throughput and may not be able to achieve high performance due to the overhead of additional inter-process communication. Furthermore, any non-trivial (~10+) number of extensions are unlikely to run effectively in separate JVM or Node.js processes without negatively impacting nodes. To satisfy high performance requirements we will need to re-add a way for extensions to run on the same JVM as OpenSearch, or to share Node.js processes for OpenSearch Dashboards, but giving administrators a way to gain performance in exchange for security isolation, support for extensions written in multiple languages, and multiple major version compatibility.

Practically speaking, in OpenSearch, we will need to solve for the ability for a subset of extensions to run in the same JVM, and operate on data structures without serialization or deserialization, all without the need to change anything in the implementation of the extension itself. 

### Support dependencies between extensions

In the current state all dependencies are implicit and all versions must match, and we heavily rely on testing a distribution bundle. There’s no mechanism to know what the dependencies are, and any dependency errors are found at runtime. Any update to the dependencies requires rebuilding another plugin, even when there are no changes within the current plugin. Thus, everything is always rebuilt from scratch for every release. To solve this, we will extend the ability for extensions to depend on other extensions, similar to the ability of an extension to depend on a semver-compatible version of OpenSearch/Dashboards.

### Public catalog

We’ll augment the previously built rudimentary schema for extension’s metadata to provide additional fields beyond name, version or compatibility. These will include such fields as well-defined categories, or additional vendor/sponsor information. We will build a minimal catalog website with search functionality, deploy and maintain a public version of it. We’ll ensure that the catalog system can also be run by any enterprise internally and build signing and trust into the system, but will not do any validation beyond metadata correctness at this stage. An internal catalog will be able to sync with a public catalog with appropriate administrative controls, or existing third party catalog systems can use an API to import extensions. Developers will be able to sign up to publish extensions on the public instance and we will build mechanisms that help users trust publishers. An API in OpenSearch will supporting installing extensions from catalogs. A view in OpenSearch Dashboards will allow browsing available catalogs and extensions.

Developers will be able to publish an extension into a public catalog, users can find extensions in a catalog via a taxonomy and search functions, detail pages with meaningful metadata and vendor information, administrators can install extensions from public or private catalogs, and import a subset of a public catalog in their Enterprise. Finally, we'll add a way for publishers to verify themselves, add quality controls, and possibly publisher approvals.

### Supporting extensions in OpenSearch high level language clients

We are in the process (see [opensearch-clients#19](https://github.com/opensearch-project/opensearch-clients/issues/19)) of improving support for existing plugins in clients by publishing REST interfaces in the shape of OpenAPI specs, a generator will consume the spec and output parts of a complete high level thin client for the OpenSearch distribution. 

We will similarly support extensions in the clients, and creating thin-clients per extension which will be composable with the core client in every supported programming language. Extensions will publish REST interfaces in the shape of OpenAPI specs, a generator will consume the spec and output a complete high level thin client. The burden of m * n extensions and languages will be alleviated by automating as much of the process as possible, providing build and test tooling such as CI workflows, so that both project owned extensions, and third party developed extensions alike, can benefit with uniform support. The extension owner can then take the generated clients and publish them to their package repositories of choice as desired. The core clients will define stable low-level/raw interface with its transport layer such that the thin-clients compose as expected and follow semver compatibility rules.

### Rewrite most plugins as extensions

We will provide a line of sight for deprecating plugins by enabling extension migration with as close to one-to-one correspondence with plugin features as possible with the aim of making the effort required to migrate to extensions minimal. We will write a migration guide clearly specifying the needed effort to perform initial migration and follow-up deprecated feature replacement so that they can work it into their own task planning, offer code that makes the migration from plugins to extensions easier, implement samples that provide one-to-one analogues with the existing plugin framework, and create assurances that external behavior in the migration has not changed. Code permitting this quick bridge may be marked deprecated, but will allow users to methodically remove the deprecated code over time.

This is [opensearch-sdk-java#315](https://github.com/opensearch-project/opensearch-sdk-java/issues/315).

### Deprecate plugins, unbundle distributions

Assuming extensions have been widely adopted, we can deprecate the plugin APIs to be removed in the next major version of OpenSearch. We don't expect this to happen earlier than OpenSearch 4.0. Older versions of plugins continue to work with older versions of OpenSearch and continue receiving security patches.

We will replace the two distribution flavors of OpenSearch/Dashboards (currently a -min distribution without security or plugins) by a set of distribution manifests tailored for purposes such as log analytics vs. search. Each distribution will be represented by a manifest that can be assembled “on-the-fly” by downloading the artifacts from the public catalog for packaging purposes. We want to enable single-click installation of a collection of extensions, recommended distributions of OpenSearch for tailored purposes, the ability for vendors to create their favorite flavor of OpenSearch/Dashboards distribution easily, and the capability to create enterprise-tailored distributions.

## Future

Extensions will make a lot of new, big ideas possible! Below are some of our favorites.

### Hot swap extensions 

OpenSearch/Dashboards bootstrap plugins at start time and various parts of the system assume that plugins do not change at runtime. Requiring a cluster restart for all extensions is a severely crippling limitation on the path of ecosystem adoption of any significant number of extensions, primarily because cluster restarts mean stopping inbound traffic. We ensure that any extension point can be loaded or unloaded at runtime, starting with making settings in OpenSearch core dynamic, and add tooling to support loading and unloading extensions at runtime without restarting OpenSearch/Dashboards nodes or the entire cluster. This creates the ability to add, upgrade, or remove an extension without the need to restart OpenSearch/Dashboards, or connect a remote extension to an existing OpenSearch/Dashboards cluster.

### Extensible document parsing

JSON is, by far, the most popular input format for OpenSearch. JSON is humanly readable, so it is pretty easy to test and develop with. Additionally, the OpenSearch ecosystem is built around JSON with most benchmarks written in JSON and ingest connectors supporting JSON. However, JSON is much slower and more space consuming than most binary formats, thus swapping JSON for another type may yield significant performance gains. We would like to make OpenSearch input formats extensible, so that it is easier to add and test more formats. This was proposed in [OpenSearch#4559](https://github.com/opensearch-project/OpenSearch/issues/4559).

### Security isolation

With extensions being designed to run in a separate VM we can introduce multiple options for isolating extensions, such as containers and java runtimes (e.g. firecracker, GraalVM, or EBPF). We also can provide a new secure default, and solve for the deprecation of JSM. We can further secure across new boundaries ensuring all messages are encrypted in transit and all data is encrypted at rest.

### Search processors become extensions

In [search-processor#80](https://github.com/opensearch-project/search-processor/issues/80) we proposed a new search processor pipeline. Search processors are plugins that can become extensions before plugins are deprecated.

### Storage plugins become extensions

The storage API in OpenSearch has proven to be quite stable. There may be no need to change these extensions across OpenSearch versions. New features and improvements in the respective remote storage clients (e.g. S3 or Azure) happen out of band from OpenSearch distributions, so these extensions can be upgraded and improved without needing to wait for a new OpenSearch release. We also want partners to maintain their own storage and remove the idea of "first class storage".

With the addition of features like remote-backed indexes and searchable snapshots, the storage plugins (e.g. S3, Azure, GCP, HDFS) are on the critical path for both indexing and search operations. These plugins will not be able to tradeoff any performance penalty as that is likely to make for an unacceptable user experience. We’ll use the in-process support for extensions to move these plugins to the extensions model. We could abstract just reading or writing, or even support multiple versions of Lucene side-by-side, or even different storage engines and initialize one engine per index.

### Replication as an extension

With the introduction of segment replication (segrep) node resources need to be allocated to perform file copy. Today, there are settings to define limits on data transfer rates (for segrep & recovery) to prevent these functions from consuming valuable resources required for indexing & search. Moving this functionality to a separate node local JVM allows us to control maximum resource consumption (cpu/memory), avoid unnecessary throttling, and have no impact on read & write performance. We can therefore define new extension points on the engine to support segrep implementations that can run as a sidecar, and provide the opportunity to plug in an implementation based on storage requirement (remote, node-node). This would be either in process or a separate node local process and be integrated with storage plugins to support remote store as replication source.

### Extensions in other programming languages

With extensions designed to operate remotely we can support out of process extensions written in other languages running on the JVM, and remote extensions written in any other language hosted externally. By enabling polyglot applications, or porting the extension SDKs to other programming languages, we would also lower the barrier of entry for authoring extensions in languages such as Ruby with a JRuby SDK, or add support for in-proc extensions written in TypeScript running on GraalVM.

### Extensions in other technologies

An extension can not be entirely implemented in a Lambda, as it must maintain a network connection with OpenSearch and shares some state information. It would be possible to create a client for this purpose with Lambda implementation internally to enable Lambda extensions.

### Aggregations as an extension

As we work towards separating search aggregations and compute, we will refactor and extract interface and SDK components for compute separate from the search phase lifecycle. Simple search aggregations, which default to the current single pass data aggregation implementation, may still be supported for basic search use cases. By separating the compute framework through extensions and a developer SDK enables drop-in replacements with more evolved data analytics systems such as Spark. By separating the search aggregation framework through extensions and a developer SDK third party contributors can bring in new kinds of search aggregation support such as Principal Component Analysis (PCA), or stratified sampling pipeline aggregations.

### Cluster Manager as an extension

We would like to refactor and extract interfaces for cluster manager responsibilities to remove the existing cluster manager node limit of about 200. For large deployments we believe we can provide alternate cluster manager implementations that have a different scalability and availability model.

### Offloading background tasks to extensions

A number of background operations are currently run asynchronously in an OpenSearch cluster, including Lucene segment merges, data tier migrations (e.g. hot to warm to cold), and most operations performed by ISM. These could be offloaded to dedicated or isolated compute via the extensions mechanism improving cluster scalability and availability.

### Communication protocols as extensions

By making communication protocols extensible, we can experiment with more performant implementations such as GRPC or no-GC implementations such as Netty, without having to modify the core engine. Check out [opensearch-sdk-java#414](https://github.com/opensearch-project/opensearch-sdk-java/issues/414#issuecomment-1471010441), which prototypes protobuf serialization.

## Help Wanted

We would love your help with these projects and ideas! The best place to start is to check out [opensearch-sdk-java](https://github.com/opensearch-project/opensearch-sdk-java) and trying to implement a trivial extension on top of it.
