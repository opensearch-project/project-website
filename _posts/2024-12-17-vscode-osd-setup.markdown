---
layout: post
title:  "VSCode setup for OpenSearch Dashboards development"
authors:
 - wronghuy
date: 2024-12-17
categories:
 - technical-post
meta_keywords: opensearch dashboards, vs code, jest
meta_description: Learn how to setup OpenSearch Dashboards with VS Code
excerpt: OpenSearch Dashboards can be a challenge to setup. This blog post shows how you can leverage VS Code with OpenSearch Dashboards to make development easier
---

## Introduction

Developing on OpenSearch Dashboards (OSD) can be a daunting task, whether you are setting up your dev environment for the first time or laying the groundwork after getting your large RFC approved. This blog highlights some developer tools that can make OSD development a bit easier and faster with [VS Code](https://code.visualstudio.com/).

Among VS Code's out of the box capabilities, including Intellisense, code search, and Git integration, here are a few useful features leveraging both VS Code's built in feature set and extensions:

* Setup easy-to-run unit tests, including the ability to debug tests up to the individual test level
* Run a linter using OSD rules for you on save so you don't need to run it at commit time and re-commit changes (some linting errors will still need to be addressed manually)
* Setup OSD server startup with one click + enable server side debugging
* Setup multi-root workspaces for development on *both* individual plugins *and* OSD Core

## Setting up Jest integration

![jest-integration](/assets/media/blog-images/2024-12-17-vscode-osd-setup/jest-integration.gif)

OSD leverages [Jest](https://jestjs.io/) as the testing framework of choice. With over 2,000 test suites in OSD alone, finding and running specific tests can be a hassle.

[vscode-jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest) extension provides a quick and easy Jest integration in VSCode. Here are a few sample features:

* Configure what tests to run via GUI: you can run all project tests, tests inside a specific directory, specific test files, individual test suites, or even individual test methods!
* UI icon to display passed/failed tests
* Inline `Test Run` button inside your test files. You don't have to touch the command line to run tests
* Ability to run a test with debug options

![test-suites](/assets/media/blog-images/2024-12-17-vscode-osd-setup/test-suites.png)
![inline-tests](/assets/media/blog-images/2024-12-17-vscode-osd-setup/inline-tests.png)
![debug-tests](/assets/media/blog-images/2024-12-17-vscode-osd-setup/debug-tests.png)

**Note:** Do not try and run all tests under `src/plugins*`. There are over 2000 test cases and will consume lots of resources. Instead, run subdirectories of tests. I recommend running tests on-demand instead

### Setup

1. Install extension
2. Type in `Cmd` (or `Ctrl`) + `Shift` + `P` and select `Open Workspace Settings (JSON)`. Alternatively, select `Open User Settings (JSON)` if you want the settings to persist globally across all your projects. Since the following step will only apply to the `OpenSearch-Dashboards` repo, it's recommended to make this a `Workspace Setting` (under the hood, VSCode will create a `.vscode` directory in the workspace root and place a `settings.json` file inside `.vscode`).
3. Add these lines to the `settings.json` file:

```json
{
  "jest.jestCommandLine": "yarn test:jest",
  "jest.runMode": "on-demand"
}
```

1. The first line will use the custom OSD script `jest.js` to load in the custom `config.js` file and pass in any arguments directly to `jest`. The second line prevents the test runner to run every test on file save, which helps save on computing resources.
2. You should see a `Test Explorer` 🧪 icon in the left Extensions sidebar. Click on it. This will contain all the detected test files.

3. ![test-icon](/assets/media/blog-images/2024-12-17-vscode-osd-setup/test-icon.png)

## Setting up Prettier + ESLint integration

![linting-integration](/assets/media/blog-images/2024-12-17-vscode-osd-setup/linting-integration.gif)

While OSD repo comes packaged with [Husky](https://typicode.github.io/husky/), a precommit hook that will run scripts before commits are made (like linting, running unit tests, etc.), it can still be a hassle to re-run the linter and re-commit changes. VS Code provides the ability to lint on save but OSD has specific linting rules that may not work out of the box.

[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) VS Code plugins remove this friction entirely (un-fixable rules may still need to be manually fixed). Prettier plugin takes in the `.prettierrc` config file and will execute the Prettier rules in VS Code. ESLint will take the workspace's ESLInt config and run the rules as well.

### Pre-requisites

Before starting, its good practice to lint on save. Type in `Cmd` (or `Ctrl`) + `Shift` + `P` and select `Open User Settings (JSON)` so you can have this setting across all your projects:

```json
{
    "editor.formatOnSave": true
}
```

### Setup

1. Install extensions
2. Type in `Cmd` + `Shift` + `P` and select `Open Workspace Settings (JSON)`.
3. Add in these lines to the `settings.json` file (note: you may already have some settings in `editor.codeActionsOnSave`; just append the inner line):

```json
{
  "prettier.configPath": ".prettierrc",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
}
```

1. Now, when you save a file, the file is linted automatically

## Setting up run configurations

![run-configurations](/assets/media/blog-images/2024-12-17-vscode-osd-setup/run-configurations.gif)

To start OSD normally, in terminal you would do the following

* In terminal 1, run `yarn opensearch snapshot`
* Wait several seconds, and then In terminal 2, run `yarn run start --no-base-path`

This works for many use cases but provides no way to debug any changes server side. Instead of running this every time, we can convert this process into a series of launch tasks to make server startup a one-click process. Specifically there are two commands at hand:

1. Start the OpenSearch server
2. Start the Dashboards server
    1. Starting the Dashboards server requires a pre-requisite waiting period to wait for server to boot up, so there must be some sort of VS Code task to wait for a period of time

There are some advantages to making this a VS Code run configuration:

* One-click OSD development server startup. No need to run in CLI over and over again
* Ability to debug server-side code (`public` side code can be debugged on your browser of choice using your browser's developer tools)

### Pre-requisites

* Make sure [NVM](https://github.com/nvm-sh/nvm) is installed and Node 18.9.0 is installed:

```sh
# With Homebrew
brew install nvm

# Normal
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install 18.9.0
nvm install 18.9.0
```

### Setup

1. Under `.vscode` directory (project root), create or append to the `launch.json` file (make sure you have Node 18.9.0 and `nvm`):

```json
{
  "version": "0.2.0",
  "configurations": [
	/**
	* This starts the Dashboards server
	* - Will wait 13 seconds before starting so OpenSearch server can run
	*/
    {
      "name": "Start Dashboards Server",
      "type": "node",
      "request": "launch",
      // Alternatively, run "which yarn" and change the path of yarn
      "program": "~/.nvm/versions/node/v18.19.0/bin/yarn",
      "args": ["run", "start", "--no-base-path"],
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": null,
      "runtimeArgs": [],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "openOnSessionStart",
      "preLaunchTask": "13 Second Delay Command"
    },
	/**
	* This starts the OpenSearch snapshot server
	* - This will be ran first
	* - Everytime the server is stopped, data will NOT be persisted. Thus, if you need to persist data, you can configure this to run your own local OpenSearch server
	*/
    {
      "name": "Start OpenSearch Snapshot",
      "type": "node",
      "request": "launch",
      // Alternatively, run "which yarn" and change the path of yarn
      "program": "~/.nvm/versions/node/v18.19.0/bin/yarn",
      "args": ["run", "opensearch", "snapshot"],
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": null,
      "runtimeArgs": [],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "openOnSessionStart"
    }
  ],
  "compounds": [
	/**
	* This is the run configuration to startup OSD
	* 1. Starts up OpenSearch server
	* 2. Waits 13 seconds
	* 3. Starts up Dashboards server
	*/
    {
      "name": "Start Dashboards",
      "configurations": ["Start OpenSearch Snapshot", "Start Dashboards Server"],
      // If either Dashboards or OpenSearch server is stopped, both servers will be stopped (set this to false to individually turn off a server without turning all off)
      "stopAll": true
    }
  ]
}
```

1. Under `.vscode` directory (project root), create or append to the `tasks.json` file:

```json
{
  "version": "2.0.0",
  "tasks": [
	// Silent task to sleep for 13 seconds; this is the upper limit on the time taken for OpenSearch to boot up
    {
      "label": "13 Second Delay Command",
      "type": "shell",
      "command": "sleep 13",
      "group": "none",
      "presentation": {
        "reveal": "silent",
        "panel": "new",
        "close": true
      }
    }
  ]
}
```

1. Now, under `Run and Debug` tab, select `Start Dashboards` from the dropdown menu and press play. OSD should startup after some time
    1. Now you can set any breakpoint in `server` side code!
    2. Debug toolbar should appear under the `CALL STACK`, in a specific worker node. There you can resume breakpoints, step into code, and execute the next instruction

    3. ![debug-toolbar](/assets/media/blog-images/2024-12-17-vscode-osd-setup/debug-toolbar.png)

## Setting up multi-root workspace integration

![multi-root-workspaces](/assets/media/blog-images/2024-12-17-vscode-osd-setup/multi-root-workspaces.gif)

For most use cases, simply opening the OSD Core will suffice for development. However, if you need to develop for a plugin as well, then [multi-root workspaces feature](https://code.visualstudio.com/docs/editor/multi-root-workspaces) may be a fitting tool as well. Plugin setup for Jest, Linting, and Run Configurations should be similar as OSD core so we won't be diving into that.

To recap, for OSD to pickup plugins during development, the plugin project root has to be within `OpenSearch-Dashboards/plugins/` directory

### Setup

Let's assume we are dealing with the [anomaly-detection-dashboards-plugin](https://github.com/opensearch-project/anomaly-detection-dashboards-plugin) and the project has been checked out inside the `plugins` directory

1. Navigate one directory above the `OpenSearch-Dashboards` project folder and create a file called `OpenSearch-Dashboards.code-workspace`. Inside this file add the following:

```json
{
  "folders": [
    {
      // Names are configurable; they will show up in the EXPLORER tab
      "name": "OSD Core",
	  // Path to the project root
      "path": "OpenSearch-Dashboards"
    },
    {
      "name": "Anomaly Detection Plugin",
      "path": "OpenSearch-Dashboards/plugins/anomaly-detection-dashboards-plugin"
    }
  ],
  // Define workspace-specific settings here
  "settings": {},
  "launch": {
    // Specify workspace-specific launch configurations
    "configurations": [],
    // Specify workspace-specific launch compounds
    "compounds": []
  }
}
```

1. There should be a button marked `Open Workspace`. Click it to view your new workspace

2. ![open-workspace](/assets/media/blog-images/2024-12-17-vscode-osd-setup/open-workspace.png)
3. Launch configurations, Jest test suites, code search, file search, and many more features will be available to this workspace

## Closing

While these tools aren't a replacement for deep diving into OSD's codebase, these tools can make development -> raising PR workflow just a little faster.
