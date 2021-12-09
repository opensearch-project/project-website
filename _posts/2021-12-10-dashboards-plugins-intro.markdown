---
layout: post
title: "Introduction to OpenSearch Dashboard Plugins"
authors:
  - ashwinpc
  - vemsarat
date: 2021-12-08
categories:
  - technical-post
twittercard:
  description: "Plugins are fundamental to how Opensearch works, and that similarity extends to OpenSearch Dashboards too..."
---

Plugins are fundamental to how Opensearch works, and that similarity extends to OpenSearch Dashboards too. All major components and services used within Dashboards is a plugin. Similar to OpenSearch, additional functionality can also be added using external plugins. As a follow up the blog post on how plugins work for Opensearch, in this post we will explore how plugins work for OpenSearch Dashboards.

### What is a plugin

First lets understand what an Opensearch Dashboards plugin is. In Opensearch Dashboards, plugins are classes that can be loaded via the [Dashboards plugin api](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/src/core/CONVENTIONS.md#plugin-structure) to integrate with the core system via lifecycle events. They can consist of a client side code (public), server side code (server), or both. Plugins can also interact on each other and core from both places. Plugins must also contain a manifest file that describes a set of properties, both required and optional that core system can use to load and initialize the plugin correctly.

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

More details on a plugin structure can be found in the [Conventions readme under the core](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/src/core/CONVENTIONS.md#plugin-structure).

### Manifest file

The role of the manifest file is to describe the set of required and optional properties of a plugin such as plugin name version, other required plugins.

The manifest file signature is defined by the interface `[PluginManifiest](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/src/core/server/plugins/types.ts#L126-L196)`

e.g. manifest file

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

All the remaining plugin logic is exposed via a single class that implements the `Plugin` interface. This is done so that it is easy for other plugins and the core system to discover and use a plugins features using a well defined api.

Every plugin has 3 life cycle methods that the core system calls during the lifecycle of a plugin.

- Setup: when the plugin is registered and initialized
- Start: is where any "running" logic for your plugin would live. This only applies if you need to start listening for outside events (polling for work, listening on a port, etc.)
- Stop: Used to cleanup runtime.

e.g.

```js
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

Now that we’ve talked about what makes up a plugin, let’s take a look at how it all works. The job of discovering, initializing and running plugins within OSD is handled by the [plugin service](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/server/plugins/plugins_service.ts) within the core system. It begins when we start OpenSearch Dashboards using `yarn start`. This kicks off the core workflow as follows:

- Read the config file `opensearch_dashboards.yml`
- Discover the plugins and construct a dependency tree. Both [core plugins](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/1.2/src/plugins) (plugins in the projects source that come with Opensearch Dashboards) and external plugins
- Load plugin specific config (if present)
- Run the `osd:bootstrap` script within each plugin if its public code is not yet built.
- Completes setup for each plugin loaded and starts the plugins

The core system also manages each plugins lifecycle.

## How to use them?

Understanding the specifics of how the core system sets up and handles these plugins can get a little confusing. Thankfully working with plugins does not require an in depth understanding of its inner workings. With the help of some useful packages, the process of creating, loading, distributing plugins is made much simpler.

### Creating a plugin

To create a plugin, we can use the `[@osd/plugin-generator](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/packages/osd-plugin-generator/README.md)` package to bootstrap a plugin template for us. To use it you can run in your terminal the command

```sh
node scripts/generate_plugin.js my_plugin_name # replace "my_plugin_name" with your desired plugin name
```

It will ask you a few questions about the plugin you want to generate and scaffold a plugin template that is ready to run in the appropriate plugin directory.

### Loading a plugin

To load a plugin into our instance of Opensearch Dashboards, all we need to do is place the plugin in one of the configured paths that the core system will search during its plugin discovery phase. There are 3 default paths from which plugins can be discovered:

- `./src/plugins`
- `./plugins`
- `../opensearch-dashboards-extra`

Placing our plugin in one of these paths will ensure that they are discovered by the core system. The default paths are defined by the [env](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/packages/osd-config/src/env.ts#L133-L138) class within the `@osd-config` package and discovered using the plugin service’s [discover method](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.2/src/core/server/plugins/discovery/plugins_discovery.ts#L65). Alternatively we can also define an additional config parameter `additionalPluginPaths` to define other explicit plugin paths. This is however not recommended for production use and will throw a warning when used outside of dev mode.

### Example plugins

Sometimes it’s also useful to see some example plugins that solve a specific problem following the recommended practices. Opensearch Dashboards comes with some example plugins that we can use to better understand how plugins work, what are some the core plugins offered by OpenSearch Dashboards and how to use them. To run them we need to pass an additional flag `--run-examples` during startup.

```sh
yarn start --run-examples
```

You can find examples and their documentation in the [examples](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/1.2/examples) folder.

Note: setting the `--run-examples` flag also adds the examples folder to the list of paths used for plugin discovery

## Closing notes

We hope that this post was useful in understanding how plugins work in Opensearch Dashboards, and hopefully this makes working with them less daunting. Let us know if you have any feedback or would like new features in plugin architecture.
