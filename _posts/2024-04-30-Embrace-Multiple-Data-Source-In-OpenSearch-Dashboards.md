---
layout: post
title: "Embrace multiple data source in OpenSearch Dashboards"
authors:
 - nluyu
date: 2024-04-30
categories:
 - feature
meta_keyword: OpenSearch multiple data source, OpenSearch Dashboards
meta_description: This blog provides a quick glance at the accumulated features of multi-data sources from version 2.4 to 2.14 and how these features empower your productivity with unified experience. 
---  

Before 2.4 release, OpenSearch Dashboards only works with a single OpenSearch cluster, and it is impossible to view data from different clusters within the dashboards. 

In 2.4, multiple data source feature was introduced together with data source management UI portal to allow users to add new data source to the dashboards, create index patterns based on those data sources, and execute queries against a specific connected data source. In 2.6 release, AWS signature Version 4 was added as one authentication type supported by multi data source in addition to basic auth. Onwards, multi data source support at core plugin including dev tools was added in 2.7 release, sample data support was added in 2.9 release, then added in for Vega visualization in 2.13. File based saved objects import sourced from multi data source was added into OpenSearch Dashboards in 2.12.  

In this release, to ensure users that have been using the multiple data source feature to have a consistent experience in the dashboards, we enabled multiple data source at 8 OpenSearch Dashboards plugins including index management, machine learning, search relevance, anomaly detection, maps, security, notification, etc, and enabled multiple data source at 2 core plugins including TSVB and Region Map. In addition, we introduced default data source feature which will be the default option chosen for all plugins pages that support multi data source. 

This blog provides a quick glance at the accumulated features of multi-data sources from version 2.4 to 2.14 and how these features empower your productivity with unified experience. 

## User scenario - Single panel of glass of data
Use one OpenSearch Dashboards to present data from multiple OpenSearch Cluster

### Case 1
In large corporation, user’s data has been distributed in different datasource, before multiple datasource was introduced. User has to put data into centralized storage before they could analyze it. With the build-in support of multiple datasource, OpenSearch dashboards could present data from multiple data sources within a single dashboard. Starting 2.14, we support additional visualization type including Vega, TSVB, Region Map, in addition to index pattern based visualizations.
<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/dashboards_overall.png"/>

### Case 2 
Apply map layer based on data from different data source. 
Starting 2.13 release, we added the referenced data source as a prefix to the index pattern name which allows easy identification during creation as below.
<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/maps_1.png"/>
Also, the referenced data sources from the current map layers are indicated by clicking on the icon on the top navigation bar.
<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/maps_2.png"/>

## User scenario - Centralized Data Management and Governance
Use one OpenSearch Dashboards as admin tool to manage resource on multiple OpenSearch Cluster

### Case 1 Manage indices, streams, aliases, in a centralized place
Before 2.14, index management within the dashboards allows to perform management operations on indexes within one OpenSearch cluster. With multi data source support added for the plugin in 2.14, all operations include create, read, update, delete (CRUD), mapping operations for indexes, index templates, and aliases living in different data sources can be completed in one dashboard. Using indexes as an example, indexes from different data sources can be displayed by switching source at the top navigation bar, and operations can be done by selecting a specific index then choose the desired option. 
<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/indexes_overview.png"/>

Detailed information about the selected index can be viewed by clicking on the index name.
<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/detailed_index.png"/>

Note that id of the data source which is UUID is embedded into the url, thus specific page can be bookmarked and shared.

### Case 2 Manage roles, internal users at one central place 
Together with 2.14 release, dashboards security plugin has enabled multi data source support allowing admin users to manage roles and internal users from different data sources in one central place. Use roles as example, existing role from selected data source is displayed. 

<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/roles_overview.png"/>

Click on create role will take to the create page, after filling the information and select create, a new role will be created inside the selected data source.

<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/create_role.png"/>

The created role can also be edited from the dashboards.
<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/role_detail.png"/>

### Case 3 Manage notification channels from one place
Start 2.14 release, notification channels created from connected data sources can be managed in one place with multi data source support. By switching to a data source with notification configured, users would be able to view and/or modify the notification settings.

<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/channels_overview.png"/>

### Case 4 Manage machine learning models running inside OpenSearch clusters at one place
Starting 2.14 , machine learning plugin enabled multi data source support, and by adding a data source with machine learning models, we can manage the models within the added data sources as below. Note that the selection happens by using the selector from the navigation bar.

<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/models_overview.png"/>

Also note that the pre-trained models were deployed to the selected cluster via developer tools page. 

### Case 5 use dev tools to query/modify data via API against specific data source at one place
Starting 2.7, dev tool is integrated with multi data source, and by selecting the target data source to execute the command on, users can query/modify the backend data directly at one central place.

<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/devtool.png"/>

## User scenario - Productivity for observability and search
User one OpenSearch Dashboards to monitor and analyze the system on multiple OpenSearch cluster.

### Case 1 Extract insights and get value out of data from different data sources in Discover
Since 2.4 release, Discover supports multi data source by default, and by selecting the index pattern created based on different data sources, users can explore data from different data sources.

<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/discover.png"/>

### Case 2 Manage anomaly detectors across data sources
With multi data source support added in 2.14 release, anomaly detectors created from different OpenSearch clusters can be viewed in one central place in the dashboards. By switching among connected data sources with detectors, the list of detectors created from the data source are displayed, see below as example.

<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/ad_overview.png"/>

Detectors can be created, viewed, and modified in one dashboard. 

<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/detector_detail.png"/>

### Case 3 Compare query results from different data sources
Before 2.14, dashboards only allow comparison of search results from indices within one cluster. Starting 2.14, Search relevance plugin enabled multi data source support, and we can compare the search results from indices within 2 different clusters. Note that the data source selector within the page pre-populates the available data sources to choose from.

<img src="/assets/media/blog-images/2024-04-30-embrace-multiple-data-source-in-opensearch-dashboards/compare_queries.png"/>

## Summary
OpenSearch Dashboards provides direct visualization interface of user’s data located in the OpenSearch cluster, with multiple data source feature, OpenSearch Dashboards serves as the one dashboard for all connected OpenSearch clusters, allowing to find the right information, analyze log data, build report, etc.  

Special thanks to Ramakrishna Chilaka, Prabhat Sharma, Derek Ho, Junqiu Lei, Jackie Han, Riya Saxena, Sumukh Hanumantha Swamy, Lin Wang, Ella Zhu, Emma Jin, Huy Nguyen, Zhongnan Su for their work to enable multi data source support in the OpenSearch Dashboards and plugins! 


