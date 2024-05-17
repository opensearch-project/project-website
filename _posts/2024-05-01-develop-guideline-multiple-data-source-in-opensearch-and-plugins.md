---
layout: post
title: "Developer guideline: Multiple data sources in OpenSearch Dashboards and plugins"
authors:
 - zhyuanqi
date: 2024-05-01
categories:
 - technical-post
meta_keyword: OpenSearch multiple data sources, OpenSearch Dashboards
meta_description: This blog provides a guideline on how to integrate multiple data sources with Dashboards plugins
---  

OpenSearch introduced support for multiple data sources in version 2.4. The feature allows users to explore, visualize, discover, and manage data by connecting to multiple data sources (self-managed clusters, Amazon OpenSearch Service). Starting in version 2.14, OpenSearch Dashboards plugins have been integrated to support multiple data sources. Now users can enjoy the benefit of accessing data from remote clusters not only within OpenSearch Dashboards core but also within Dashboards plugins. For a list of plugins that have been integrated with Dashboards, please refer to [Section 4](#4-list-of-supported-pluginsfeatures). This expansion broadens the range of available data sources, enhancing users' capabilities to work with diverse data sources.

This blog post offers developers a concise introduction to integrating OpenSearch Dashboards plugins with multiple data sources. If you're new to the concept of multiple data sources, consider starting with the article [Configuring and using multiple data sources](https://opensearch.org/docs/latest/dashboards/management/multi-data-sources/) to gain a solid understanding before diving into plugin integration.


## 1. Getting started

You can integrate multiple data sources with Dashboards plugins in just a few steps. In this tutorial, we will provide you with the necessary steps and examples to help you successfully implement, configure, and get started using multiple data sources in OpenSearch Dashboards. 

### 1.1 Step 1: Set up a local development environment

Before getting started, ensure you have set up a local development environment for OpenSearch Dashboards following our [developer guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/DEVELOPER_GUIDE.md). Once your Dashboards instance is up and running, you can generate your own Dashboards plugin using the OpenSearch Dashboards Plugin Generator by running the following CLI command:
```
node scripts/generate_plugin --name my_plugin_name
```
After the plugin has been successfully generated, you should be able to see the following folder structure:
```
⋊> ~/OpenSearch-Dashboards/plugin/my_plugin_name                                                                                                                                                                                  (base) 00:33:34
.
├── README.md
├── common
│   └── index.ts
├── opensearch_dashboards.json
├── package.json
├── public
│   ├── application.tsx
│   ├── components
│   │   └── app.tsx
│   ├── index.scss
│   ├── index.ts
│   ├── plugin.ts
│   └── types.ts
├── server
│   ├── index.ts
│   ├── plugin.ts
│   ├── routes
│   │   └── index.ts
│   └── types.ts
├── translations
│   └── ja-JP.json
└── tsconfig.json
```
For more information about the OpenSearch Dashboards Plugin Generator, please refer to [the documentation](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/packages/osd-plugin-generator/README.md). Before using multiple data sources, you must enable the `data_source.enabled` setting, which is disabled by default. To do this, open the `opensearch_dashboards.yml` file, set `data_source.enabled: true`, and then save the YAML file.

### 1.2 Step 2: Configure plugin to add dependencies

In the `opensarch_dashboards.json` file of your Dashboards plugin, add the Data Source and Data Source Management plugins in the optionalPlugins section. The Data Source plugin provides the clients required in order to connect to multiple data sources. The Data Source Management plugin provides generic interfaces for consuming data source components, such as a data source menu and/or data source selector. 
```
{
  "id": "blogExamplePlugin",
  "version": "1.0.0",
  "opensearchDashboardsVersion": "opensearchDashboards",
  "server": true,
  "ui": true,
  "requiredPlugins": ["navigation"],
  "optionalPlugins": ["dataSource", "dataSourceManagement"]
}
```

### 1.3 Step 3: Add the data source parameter to plugins on the server side

**Server side: Verify whether multiple data sources is enabled and register the plugin API schema accordingly**

If your Dashboards plugin depends on a new API provided by your new server-side plugin, you can register the schema for the API or pass the request path as a parameter when initializing the request. 
To register the custom API schema, use the interface provided by the Data Source plugin during plugin initialization. See the following snippet as an example:
```
// server/plugin.ts
import { DataSourcePluginSetup } from '../../../src/plugins/data_source/server';

export interface pluginDependencies {
  dataSource: DataSourcePluginSetup;
}

export class BlogExamplePluginPlugin
  implements Plugin<BlogExamplePluginPluginSetup, BlogExamplePluginPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup, { dataSource }: pluginDependencies) {
    const router = core.http.createRouter();

    const dataSourceEnabled = !!dataSource;
    if (dataSourceEnabled) {
        dataSource.registerCustomApiSchema(BlogExamplePluginPlugin);
    }
    // Register server side APIs. It will be introduced in the next section. 
    defineRoutes(router, dataSourceEnabled);
    return {};
  }
  ....
}
```   

### 1.4 Step 4: Register server-side APIs with OpenSearch and the multiple data sources client

Each connected OpenSearch cluster will receive a data source ID (a UUID), and this data source ID is used in Dashboards to uniquely identify the connected cluster. 
In order to register server-side APIs, you can first set up the API route, as shown below, with `dataSourceId` as an optional query parameter. This route handler will be invoked when a GET request is made to a URL matching the path below. If `dataSourceId` is not empty, then you can use the multiple data sources client to query the remote cluster based on the `dataSourceId`. Otherwise, you should use the OpenSearch client to query from the local cluster. For more information about the multiple data sources client, please refer to [Multi Data Source Client Management](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/docs/multi-datasource/client_management_design.md). 
```
import { IRouter } from '../../../../src/core/server';
import { schema } from '@osd/config-schema';

export function defineRoutes(router: IRouter, dataSourceEnabled: boolean) {
  router.get(
    {
      path: `/api/blog_example_plugin/example`,
      validate: {
        query: schema.object({
          dataSourceId: schema.maybe(schema.string({ defaultValue: '' }))
        }),
      },
    },
    async (context, request, response) => {
      let resp;
      if (dataSourceEnabled && request.query.dataSourceId) {
        const dataSourceId = request.query.dataSourceId;
        const client = await context.dataSource.opensearch.getClient(dataSourceId)
        resp = await client.cat.indices();
      } else {
        resp = await context.core.opensearch.client.asCurrentUser.transport.request({
          method: 'GET',
          path: `_cat/indices`,
        });
      }
      return response.ok({
        body: resp.body,
      });
  });
}
```

### 1.5 Step 5: Register the Data Source Management plugin in a public folder

#### 1.5.1 Extract the `dataSourceManagement` object in the plugin module in a public folder

The Data Source Management plugin offers various react components through a generic interface for use by your Dashboards plugin. To use data source UI component interfaces, extract the `dataSourceManagement` object in the plugin module in a public folder and pass it to the main application: 
```
# public/plugin.ts
import { DataSourceManagementPluginSetup } from '../../../src/plugins/data_source_management/public';

export interface PluginSetupDependencies {
  dataSourceManagement: DataSourceManagementPluginSetup;
}

export class BlogExamplePluginPlugin
  implements Plugin<BlogExamplePluginPluginSetup, BlogExamplePluginPluginStart> {
  public setup(
    core: CoreSetup,
    { dataSourceManagement }: PluginSetupDependencies
  ): BlogExamplePluginPluginSetup {
    core.application.register({
      id: 'blogExamplePlugin',
      title: PLUGIN_NAME,
      async mount(params: AppMountParameters) {
        const { renderApp } = await import('./application');
        const [coreStart, depsStart] = await core.getStartServices();
        return renderApp(
          coreStart,
          depsStart as AppPluginStartDependencies,
          params,
          dataSourceManagement
        );
      },
    });
    .....
}
```

#### 1.5.2 How to use UI component interfaces provide by the `dataSourceManagement` plugin

Now that you've initialized the `dataSourceManagement` plugin, you can use the component interfaces it provides.  The example selector below uses OUI combobox as a base component and provides a UI for selecting data sources. It is stateful and contains the logic to fetch available data sources, return the user selection back to the user through a callback function, and update the UI elements accordingly.
```
const DataSourceSelector = dataSourceManagement.ui.DataSourceSelector;
const DataSourceSelectorComponent = (
  <DataSourceSelector
    savedObjectsClient={savedObjects.client}
    notifications={notifications.toasts}
    fullWidth={false}
    onSelectedDataSource={(ds) => setSelectedDataSources(ds)}
    disabled={false}
  />
);
```
To retrieve the id of the selected remote data source, developers can utilize the `onSelectedDataSource` callback function. This function is triggered whenever there is a change in the data source selection. Developers can utilize the useState hook to retrieve the selected data source ID and use it to get related information and update the remaining page.
```
const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
```

### 1.6 Step 6: Run a working example

Now that everything is ready, you can combine it into a working example plugin! First add a data source selector in app.tsx:
```
 # public/components/app.tsx
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);

  const DataSourceSelector = dataSourceManagement.ui.DataSourceSelector;
  const DataSourceSelectorComponent = (
    <DataSourceSelector
      savedObjectsClient={savedObjects.client}
      notifications={notifications.toasts}
      fullWidth={false}
      onSelectedDataSource={(ds) => setSelectedDataSources(ds)}
      disabled={false}
    />
  );
```
Then add an `onClickHandler` to retrieve indexes based on the selected data source:
```
 # public/components/app.tsx   
   const [indices, setIndices] = useState<string[]>([]);
   const onClickHandler = async () => {
     if (selectedDataSources.length === 0) {
       const resp = await http.get(`/api/blog_example_plugin/example`, { query: {} } );
       setIndices(resp);
    } else {
      const dataSourceID =selectedDataSources[0].id;
      // Use the core http service to make a response to the server API.
      const resp = await http.get(`/api/blog_example_plugin/example`, {
        query: {
          dataSourceId: dataSourceID,
        }
      });
      setIndices(resp);
    }
  };
```
Now combine the above function and react component:
```
retrun (
    ...
   <EuiHorizontalRule />
   {DataSourceSelectorComponent}
   <EuiHorizontalRule />
     <EuiTextColor>
       Selected: {selectedDataSources.map((ds) => ds.label).join(', ')}
   </EuiTextColor>
   <EuiHorizontalRule />
   <EuiButton type="primary" size="s" onClick={onClickHandler}>
     <FormattedMessage id="mayTest.buttonText" defaultMessage="Get Indices" />
   </EuiButton>
   <p>
     <FormattedMessage
       id="blogTest.indicesText"
       defaultMessage="Get indices: {data}"
       values={{ data: indices ? indices : 'Unknown' }}
     />
   </p>
  ...
)
```

Congratulations! Now you can run your plugins and use the pickers to select the desired data source. 
Get indexes from remote cluster call datasource1:
<img src="/assets/media/blog-images/2024-05-01-develop-guideline-multiple-data-source-in-opensearch-and-plugins/blog_example_remote_cluster.png">

Get indexes from a local cluster:
<img src="/assets/media/blog-images/2024-05-01-develop-guideline-multiple-data-source-in-opensearch-and-plugins/blog_example_local_cluster.png">

For additional details on the example plugin code, please refer to [this repo](https://github.com/zhyuanqi/OpenSearch-Dashboards/tree/blog_example/examples/blog_example_plugin). 

## 2 Developing, testing, and debugging

Now that you've learned how to integrate multiple data sources with Dashboards plugins, let's explore some advanced knowledge and skills.

### 2.1 Example plugins for MDS

To help developers get started quickly with the components, we've included an example plugin for a more intuitive and direct experience. You can run Dashboards with the CLI below to enable the example plugins: 
```
yarn start --run-examples
```

Once Dashboards is up and running, navigate to the page and click on the menu on the left. From there, open the **developer examples** under OpenSearch Dashboards. Then click on **Multiple Data Sources Integration**. On the right side of the page, you'll find a comprehensive list of pickers, each accompanied by a brief introduction and a set of properties, listed below. Feel free to experiment with the example plugin. 

<img src="/assets/media/blog-images/2024-05-01-develop-guideline-multiple-data-source-in-opensearch-and-plugins/multi_selectable.png">

### 2.2 The data source as a saved object

The data source is persisted as a saved object in the Dashboards system index. At the time of creation, a UUID is assigned as its unique identifier and data source metadata is also gathered, including the remote cluster version and associated plugins. This automatically generated data, as well as user-provided information including the title, endpoint, and authentication methods, are stored as attributes of the data source object. For the current schema of the object, refer to the [related code](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/data_source/common/data_sources/types.ts#L8). 

## 3 FAQ 

Q: Is any UI component provided by `dataSourceManagemet` used in core OpenSearch?
A: A data source selector is now used in Dev Tools, the tutorial, and on the saved object management page. You can see the component after setting `data_source.enabled` to true in `opensearch_dashbards.yml`.

Q: Given that a dashboard is a saved object itself, will it not have a data connection associated with it?
A: A data source, represented as a saved object, is identified by its unique saved object ID. Saved objects created from data sources have a references section containing the ID, name, and type. This reference helps you to identify the associated data source for the saved object. Here is an example of a index pattern reference:
```
"references": [
    {
        "id": "9dc4e190-08a0-11ef-901b-bb0301313422",
        "type": "data-source",
        "name": "dataSource"
    }
]
```
The visualization reference is slightly different because it points to the related index pattern and uses the index pattern ID to find the corresponding data source: 
```
"references": [
    {
        "name": "kibanaSavedObjectMeta.searchSourceJSON.index",
        "type": "index-pattern",
        "id": "f1613e10-08a6-11ef-901b-bb0301313422"
        }
]
```


## 4 List of supported plugins/features

Starting in version 2.14, multiple data sources are supported in nine external Dashboards plugins: 

* Index Management
* Machine Learning
* Search Relevance
* Anomaly Detection
* Maps
* Security
* Notification
* Query Workbench
* Trace Analytics 

Additionally, we've extended this functionality to two core visualizations: Time Series Visual Builder (TSVB) and Region Map.


## 5 Conclusion

In this blog post, we've covered the process of integrating OpenSearch Dashboards plugins with multiple data sources. We strongly encourage you to experiment with multiple data sources using the example plugins provided above. Thanks to Lu Yu for developing the example plugin! This exploration will enable you to experience the benefits of accessing multiple data sources within a single dashboard as well as allow your plugin to expose a wider range of data from remote clusters.