---
layout: post
title: "Develop guideline: Multiple Data Sources in OpenSearch Dashboards and Plugins"
authors:
 - zhyuanqi
date: 2024-05-01
categories:
 - technical-post
meta_keyword: OpenSearch multiple data sources, OpenSearch Dashboards
meta_description: This blog provides a guideline on how to integrate multiple data sources with Dashboards plugins
---  

OpenSearch introduced Multiple Data Sources feature in 2.4 release. The feature enables user to explore, visualize, discover, manage data by connecting to multiple data sources (self-managed clusters, Amazon OpenSearch Service). Staring in the 2.14 release,  OpenSearch Dashboards plugins integrated to support Multiple Data Sources. Now users can enjoy the benefit of accessing data from remote clusters not only within OpenSearch Dashboards core but also within dashboard plugins. For a list of plugins that have integrated with Dashboards, please refer to Section 5. This expansion broadens the range of available data sources, enhancing users' capabilities to work with diverse data sources.

For developers, this blog post offers a concise introduction to integrating OpenSearch Dashboards plugins with multiple data sources. If you're new to the concept of multiple data sources, consider starting with the article [Configuring and using multiple data sources](https://opensearch.org/docs/latest/dashboards/management/multi-data-sources/) to gain a solid understanding before diving into plugin integration.


## 1. Getting Started

As a developer, you can integrate multiple data sources into Dashboards using plugins in just a few steps. In this tutorial, we will provide you with the necessary steps and examples to help you successfully implement, configure, and get started using multiple data sources in OpenSearch Dashboards. 

### 1.1 Step 1: Set up local development

Before getting started, ensure you have set up a local development environment for OpenSearch Dashboards following our [developer guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/DEVELOPER_GUIDE.md). Once your Dashboards instance is up and running, you can generate your own Dashboards plugin using the OpenSearch Dashboards Plugin Generator by running the CLI command below:
```
node scripts/generate_plugin --name my_plugin_name
```
After the plugin is generated successfully, you should be able to see following folder structure
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
For more information about the OpenSearch Dashboards Plugin Generator, please refer to the documentation on the [plugin generator](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/packages/osd-plugin-generator/README.md). Before utilizing multiple data sources, it's necessary to enable the data_source.enabled setting, which is disabled by default. To do this, open the `opensearch_dashboards.yml` file and set `data_source.enabled: true`, then save the YAML file. Now you have your local development environment ready, we can start to integrate Dashboards plugin with multiple data sources. 

### 1.2 Step 2: Configure plugin to add dependencies

In the opensarch_dashboards.json file of your Dashboards plugin, add data source and data source management in optional plugins section. The data source plugin provides the clients to connect with multiple data sources. Data source management plugin provides generic interfaces to consume data source components such as data source menu and/or data source selector to be used on pages depending on specific use case. 
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

### 1.3 Step 3: Add datasource parameter to plugins on server side

**Server side: Verify if multiple data sources is enabled and register plugin API schema accordingly**

If your Dashboards plugin depends on a new API provided by your new server side plugin other than OpenSearch APIs, you can register the schema for the API or pass the request path as parameters when initializing the request. 
To register the custom API schema, uses the interface provided by data source plugin during plugin initialization inside the plugin module under server folder, see the following snippet as an example.
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

### 1.4 Step 4:  Register Server-Side APIs with OpenSearch and Multiple Data Sources Client.

Each connected OpenSearch cluster will get a data source id which is UUID and this data source id is used in OSD to uniquely identify the connected cluster. 
In order to register server side APIs, we can first setup the API route as below with `dataSourceId` as a optional query parameter. This route handler will be invoked when a GET request is made to a URL matching the path below. If `dataSourceId` is not empty, then we use multiple data sources client to query the remote cluster based on `dataSourceId`. Otherwise, we should use the OpenSearch client to query from local cluster. For more information about multiple data sources client, please refer to Multi Data Source Client Management. 
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

### 1.5 Step 5: Register datasource management plugin under public folder

*1.5.1 Extract dataSourceManagement object in plugin module under public folder*

Data source management plugin offers various react components via generic interface for use by your Dashboards plugin. To utilize data source UI component interfaces, extract `dataSourceManagement` object at the plugin module under public folder, and pass to the main application. 
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

*1.5.2 How to use UI component interfaces provide by dataSourceManagement plugin*

Now that we've initialized the `dataSourceManagement` plugin, it is time to use the component interfaces it provides.  Using selector as an example below, it used OUI combobox as base component and provides a user interface for selecting data sources. It is stateful and contains the logic to fetch available data sources, return user selection back to user via callback function, and update the UI elements accordingly.
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

### 1.6 Step 6: run and see a working example

Now that we have everything ready. Let’s combine it to a working example plugins! Let’s first added a datasource selector in app.tsx.
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
Then adds an `onClickHandler` to retrieve indices based on the selected datasource.
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
Now combine the above function and react component.
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

Congratulations for completing above steps! Now you can run your plugins and utilize the pickers to select the desired data source. 
Get indices from remote cluster call datasource1:
<img src="/assets/media/blog-images/2024-05-01-develop-guideline-multiple-data-source-in-opensearch-and-plugins/blog_example_remote_cluster.png">

Get indices from local cluster:
<img src="/assets/media/blog-images/2024-05-01-develop-guideline-multiple-data-source-in-opensearch-and-plugins/blog_example_local_cluster.png">

For additional details on the example plugin code, please refer to this [repo](https://github.com/zhyuanqi/OpenSearch-Dashboards/tree/blog_example/examples/blog_example_plugin). 

## 2 Developing, testing and debugging

Now that we've learned how to integrate multiple data sources with Dashboards plugin, let's move on to the next section and explore some advanced knowledge and skills.

### 2.1 Example Plugins for MDS

To help developers get a quick start with the components, we've included an example plugin for a more intuitive and direct experience. You can run Dashboards with CLI below to enable the example plugins. 
```
yarn start --run-examples
```

Once Dashboards are up and running, navigate to the page and click on the left-side menu. From there, open the Developer examples under OpenSearch Dashboards. Then click on Multiple Data Sources Integration. On the right side of the page, you'll find a comprehensive list of pickers, each accompanied by a brief introduction and a set of properties listed below. Feel free to explore and experiment with the example plugin. 

<img src="/assets/media/blog-images/2024-05-01-develop-guideline-multiple-data-source-in-opensearch-and-plugins/multi_selectable.png">

### 2.2 Data source as a saved object

The data source is persisted as a saved object in the Dashboards system index. At the time of creation, an UUID is assigned as its unique identifier, meta data of the data source is also gathered including remote cluster version, and associated plugins. These autogenerated data as well as user provided information including its title, endpoint, authentication methods, are stored as attributes of the data source object. For current schema of the object, refer to related [code](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/data_source/common/data_sources/types.ts#L8). 

## 3 FAQ 

Is any UI component provided by dataSourceManagemet used in core?
Data source selector is now used in devtools, tutorial, saved object management page. You can see the component after setting `data_source.enabled` to true in `opensearch_dashbards.yml`.

Given that a dashboard is a saved object itself, I assume it will not have a data connection associated with it?
A data source, represented as a saved object, is identified by its unique saved object ID. For saved objects created from data sources, it has a references section with ID, name and type. This reference helps us to identify the associated data source for the saved object. Here is an example of a index-pattern reference.
```
"references": [
    {
        "id": "9dc4e190-08a0-11ef-901b-bb0301313422",
        "type": "data-source",
        "name": "dataSource"
    }
]
```
The visualization reference is slightly different as it points to the related index-pattern and use the index-pattern id to find corresponding data source. 
```
"references": [
    {
        "name": "kibanaSavedObjectMeta.searchSourceJSON.index",
        "type": "index-pattern",
        "id": "f1613e10-08a6-11ef-901b-bb0301313422"
        }
]
```


## 4 List of supported Plugins/Feature

Besides native multiple datasource support for Discover App, Dashboards, Visualization, Dev Tool, Example Data. Starting 2.14, we have enabled multiple datasource in 9 external Dashboards plugins: 

* index management
* machine learning
* search relevance
* anomaly detection
* maps
* security
* notification
* query workbench
* trace-analytics 

Additionally, we've extended this functionality to 2 core visualizations: Time Series Visual Builder (TSVB) and Region Map as part of Map Plugin. We are also thrilled about further expanding support for multiple data sources across additional plugins and incorporate more features in the future!


## 5 Conclusion

In this blog, we've covered the process of integrating OpenSearch Dashboards plugins with multiple data sources. We strongly encourage you to explore and experiment with multiple data sources using the example plugins provided above. Thanks to Lu Yu  for developing the example plugin! This exploration will enable you to experience the benefits of accessing multiple data sources within a single dashboard, as well as allow your plugin to expose a wider range of data from remote clusters.