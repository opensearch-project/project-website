---
layout: post
title:  "Launch highlight: The Saved Objects import feature improves information transfer for multiple data sources"
authors:
 - nluyu
 - amznyja
date: 2024-02-08
categories:
 - feature
---

OpenSearch Dashboards launched support for multiple data sources in OpenSearch 2.4, empowering Dashboards to retrieve data from various compatible OpenSearch endpoints. With this feature enabled, you gain the ability to connect multiple data sources while adding sample data or querying data through the OpenSearch Dashboards Dev Tools console. However, a limitation arises when attempting to import saved objects by uploading a local file. This blog post describes how the OpenSearch Project has solved that challenge.

When `data_source.enabled` is `true`, the multiple data sources functionality is active and exported objects include data source information. Consequently, when visualizing these objects on a dashboard, the visualization tool seamlessly recognizes their origin. Conversely, importing saved objects without enabling multiple data sources or from dashboards lacking data source information results in imported objects missing crucial data source information. This omission poses challenges for accurate visualization within dashboards using the multiple data sources functionality.  

To address this issue, you now have the option to specify a data source when importing saved objects. Objects without any data source information will have the specified dataSourceId attached to the `objectId`. In cases where saved objects contain different data source information, such as when importing from various sources, the `objectId` will already include the relevant data source information, ensuring consistent behavior. For example, if connecting to dataSource1 and importing from dataSource2, the `objectId` already contains the relevant data source information. In this case, dataSourceId is replaced. Also, the ID schema remains consistent with how you use sample data and Dev Tools with multiple data sources enabled. 


## Benefits
Benefits of this enhancement include: 
We want to provide user the ability to specify a data source when importing saved objects. When user import saved object without any data source information, the imported saved objects will attach the specified dataSourceId with the o`bjectId`; while user import saved objects different data source information, for example, user can connect with dataSource1 and some exported saved objects from dataSource2), then the `objectId` would already contains data source info ( dataSource2 ), for this case, we will replace the dataSourceId. The id schema are exactly same as when user add sample data and Dev Tools with multiple data source enabled. The behavior will keep consistent for users.
* Providing imported saved objects with proper data source information, enhancing data visualization accuracy.
* Facilitating data migration by enabling the transfer of saved objects between dashboards, even across different clusters.
## Configuring and using saved objects importing
Follow these steps to import saved objects from a connected data source:

1. Locate your `opensearch_dashboards.yml` file and open it in your preferred text editor. 
2. Set `data_source.enabled` to `true`.
3. Connect to OpenSearch Dashboards and go to **Dashboards Management** > **Saved objects**.
4. Select **Import** > **Select file** and upload the file acquired from the connected data source.
5. Choose the appropriate **Data source** from the dropdown menu, set your **Conflict management** option, and then select the **Import** button.


## Use cases
The following demos provide examples of different use cases for using saved objects with multiple data sources.


<img src="/assets/media/blog-images/2024-02-08-enhancement-multiple-data-source-import-saved-object/test2_create_new.gif" alt="Create New Copy">

<img src="/assets/media/blog-images/2024-02-08-enhancement-multiple-data-source-import-saved-object/test2_check_conflict_auto_override_ds_conflict.gif" alt="Check existing objects">

