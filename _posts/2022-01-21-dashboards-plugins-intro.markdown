---
layout: post
title: "Introduction to OpenSearch Dashboard Plugins"
authors:
  - ashwinpc
date: 2022-01-21
categories:
  - technical-post
twittercard:
  description: "Plugins are fundamental to how OpenSearch works, and that similarity extends to OpenSearch Dashboards too..."
redirect_from: "/blog/technical-post/2022/01/dashboards-plugins-intro/"
---

Plugins are fundamental to how OpenSearch works, and the similarity extends to OpenSearch Dashboards too. Infact almost everything that you see inside OpenSearch Dashboards is built inside a plugin. As a follow up to the blog post on how plugins work for OpenSearch, this post will explore how plugins work for OpenSearch Dashboards.

### What is a plugin

To understand what a plugin in OpenSearch Dashboards is, first it's important to understand what makes up OpenSearch Dashboards.

![DashboardsOverview](/assets/media/blog-images/2022-01-21-dashboards-plugin-intro/dashboards_overview.png){: .img-fluid}

It has 3 main components:

1. Core: The main runtime responsible for managing the lifecycle of the application and all its main services
2. Packages: A set of static utilities that can be imported and used throughout the application (Both by core and plugins).
3. Plugins: All other major functionality within OpenSearch Dashboards.

Plugins are a way to extend and customize the core functionality of OpenSearch Dashboards. They do not need to be a part of the Dashboards repository, though many are! They makeup some of the core applications and services within it.

Plugins are classes that can be loaded via the [Dashboards plugin API](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/src/core/CONVENTIONS.md#plugin-structure) to integrate with the core system via [lifecycle methods](#lifecycle-methods). Plugins can consist of either client side code (public), server side code (server), or both. Plugins can also interact with each other and core from both client and server. Plugins must also contain a manifest file that describes a set of properties, both required and optional that core system can use to load and initialize the plugin correctly.

A plugin is usually made up of two parts:

- Manifest file (`opensearch_dashboards.json`)
- Plugin definition that implements an instance of the [Plugin](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/src/core/public/plugins/plugin.ts#L45-L54) class

If a plugin has a server and client side code, each section needs to describe the class separately. The interface for each remains the same. A typical plugin has the following folder structure:

```sh
my_plugin/
├── opensearch_dashboards.json
├── public
│   ├── applications
│   │   ├── my_app
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── services
│   │   ├── my_service
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── index.ts
│   └── plugin.ts
└── server
    ├── routes
    │   └── index.ts
    ├── collectors
    │   └── register.ts
    ├── saved_objects
    │   ├── index.ts
    │   └── my_type.ts
    ├── services
    │   ├── my_service
    │   │   └── index.ts
    │   └── index.ts
    ├── index.ts
    └── plugin.ts
```

More details on the plugin structure can be found in the [Conventions readme under the core](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/src/core/CONVENTIONS.md#plugin-structure).

### Manifest file

The role of the manifest file is to describe the set of required and optional properties of a plugin such as plugin name version and other required plugins.

The manifest file signature is defined by the interface [`PluginManifest`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/src/core/server/plugins/types.ts#L126-L196)

```json
{
  "id": "plugin_id",
  "version": "1.0.0",
  "opensearchDashboardsVersion": "opensearchDashboards",
  "server": true,
  "ui": true,
  "requiredPlugins": ["data", "savedObjects"],
  "optionalPlugins": []
}
```

### Plugin definition

All the remaining plugin logic is exposed via a single class that implements the `Plugin` interface. This is done so that it is easy for other plugins and the core system to discover and use a plugins features using a well defined API.

#### Lifecycle methods

Every plugin has 3 life cycle methods that the core system calls during the lifecycle of a plugin.

- Setup: when the plugin is registered and initialized
- Start: is where any "running" logic for your plugin would live. This only applies if you need to start listening for outside events (polling for work, listening on a port, etc.)
- Stop: Used to cleanup runtime.

```ts
// my_plugin/public/index.ts

import { PluginInitializer } from '../../src/core/public';
import { MyPlugin, MyPluginSetup, MyPluginStart } from './plugin';

export const plugin: PluginInitializer<MyPluginSetup, MyPluginStart> = () => new MyPlugin();
export {
  MyPluginSetup,
  MyPluginStart
}


// my_plugin/public/plugin.ts

import { CoreSetup, CoreStart, Plugin } from '../../src/core/public';
import { OtherPluginSetup, OtherPluginStart } from '../other_plugin';
import { ThirdPluginSetup, ThirdPluginStart } from '../third_plugin';

export interface MyPluginSetup {
  registerThing(...);
}

export interface MyPluginStart {
  getThing(): Thing;
}

export interface MyPluginSetupDeps {
  otherPlugin: OtherPluginSetup;
  thirdPlugin?: ThirdPluginSetup;  // Optional dependency
}

export interface MyPluginStartDeps {
  otherPlugin: OtherPluginStart;
  thirdPlugin?: ThirdPluginStart;  // Optional dependency
}

export class MyPlugin implements Plugin<
  // All of these types are optional. If your plugin does not expose anything
  // or depend on other plugins, these can be omitted.
  MyPluginSetup,
  MyPluginStart,
  MyPluginSetupDeps,
  MyPluginStartDeps,
> {

  public setup(core: CoreSetup, plugins: MyPluginSetupDeps) {
    // should return a value that matches `MyPluginSetup`
  }

  public start(core: CoreStart, plugins: MyPluginStartDeps) {
    // should return a value that matches `MyPluginStart`
  }

  public stop() { ... }
}
```

## How does all this work?

Now that I've talked about what makes up a plugin, let’s take a look at how it all works. The job of discovering, initializing and running plugins within OpenSearch Dashboards is handled by the [plugin service](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/server/plugins/plugins_service.ts) within the core system. It begins when you start OpenSearch Dashboards using `yarn start`. The core performs the following actions:

- Read the config file `opensearch_dashboards.yml`
- Discover the plugins and construct a dependency tree. Both [core plugins](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/1.2/src/plugins) (plugins in the projects source that come with OpenSearch Dashboards) and external plugins
- Load plugin specific config (if present)
- Run the `osd:bootstrap` script within each plugin if its public code is not yet built.
- Completes setup for each plugin loaded and starts the plugins

The core system also manages each plugins lifecycle.

## How to use them?

Understanding the specifics of how the core system sets up and handles these plugins can get a little confusing. Thankfully working with plugins does not require an in depth understanding of its inner workings. With the help of some useful packages, the process of creating, loading, distributing plugins is made much simpler.

### Creating a plugin

To create a plugin, we can use the [`@osd/plugin-generator`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/packages/osd-plugin-generator/README.md) package to bootstrap a plugin template for us. To use it you can run in your terminal the command

```sh
node scripts/generate_plugin.js my_plugin_name # replace "my_plugin_name" with your desired plugin name
```

It will ask you a few questions about the plugin you want to generate and scaffold a plugin template that is ready to run in the appropriate plugin directory.

### Loading a plugin

To load a plugin into an instance of OpenSearch Dashboards, the plugin must be placed in one of the configured paths that the core system will search during its plugin discovery phase. There are 3 default paths from which plugins can be discovered:

- `./src/plugins`
- `./plugins`
- `../opensearch-dashboards-extra`

Placing the plugin in one of these paths will ensure that they are discovered by the core system. The default paths are defined by the [env](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/packages/osd-config/src/env.ts#L133-L138) class within the `@osd-config` package and discovered using the plugin service’s [discover method](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/src/core/server/plugins/discovery/plugins_discovery.ts#L65). Alternatively, we can also define an additional config parameter `additionalPluginPaths` to define other explicit plugin paths. This is however not recommended and will throw a warning in production.

### Building and distributing your plugin

To build the distributable archive of your plugin run

```sh
yarn build
```

Generated plugins receive a handful of scripts that can be used during development. Those scripts are detailed in the `README.md` file in each newly generated plugin, and expose the scripts provided by the [OpenSearch Dashboards plugin helpers](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2.0/packages/osd-plugin-helpers/README.md). It also contains a script to build a distributable archive of your plugin.

### Example plugins

Sometimes it’s also useful to see some example plugins that solve a specific problem following the recommended practices. OpenSearch Dashboards comes with some example plugins that help us better understand how plugins work, what are some the core plugins offered by OpenSearch Dashboards and how to use them. Passing an additional flag `--run-examples` during startup loads these plugins. Setting the `--run-examples` flag also adds the examples folder to the list of paths used for plugin discovery

```sh
yarn start --run-examples
```

You can find examples and their documentation in the [examples](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/1.2/examples) folder.

## Closing notes

I hope that this post was useful in understanding how plugins work in OpenSearch Dashboards, and hopefully this makes working with them less daunting. Let me or the team know if you have any feedback or would like new features in plugin architecture.
