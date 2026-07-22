---
layout: post
title:  "Launch Highlight: Multiple Data Sources"
authors:
  - tyarong
  - zengyan
  - kroosh
date:   2022-11-16 00:00:00 -0700
categories:
  - community
redirect_from: "/blog/community/2022/11/multiple-data-source/"
---

OpenSearch Dashboards' current architecture works only with a single OpenSearch cluster, and to view data in different OpenSearch clusters and to navigate between Dashboards endpoints, users must have a complete OpenSearch with Dashboards stack setup. To solve this challenge, we are excited to announce for release 2.4 the Multiple Data Sources feature. This experimental feature supports multiple data source connections in OpenSearch Dashboards.

## Benefits
The Multiple Data Sources feature provides users the following benefits:
* **Cost Savings**: Users with hundreds of OpenSearch or compatible clusters (such as enterprise customers) don't need to create or maintain an equal number of Dashboards servers.
* **Performance**: OpenSearch Dashboards runs a health check against OpenSearch, and in a shared-node architecture (that is, OpenSearch and Dashboards run on the same node), CPU and system memory usage can reach 10%, which can cause CPU, memory, and network overhead on OpenSearch clusters. Multiple Data Sources can reduce the number of total running Dashboards instances and trigger a health check only for Dashboards' dedicated metadata storage.
* **Usability**: Administrators who manage users' access to sensitive data no longer need to manage explicit user credentials across several clusters or configure, install, provision, and administer multiple OpenSearch Dashboards. Users also don't have to navigate across several OpenSearch Dashboards applications to analyze data, combine data, and build reports.
* **Flexibility**: Users can add, connect, and remove any compatible data sources.

## How can you use the Multiple Data Sources experimental feature?

Multiple Data Sources enables Dashboards to query data from multiple compatible OpenSearch endpoints:

* Add or remove data sources that are compatible with OpenSearch DSL, such as OpenSearch domains, and customer-managed OpenSearch clusters.
* Create visualizations comparing time-series data from different index patterns and combine that data in a single dashboard.

![Use case by persona](/assets/media/blog-images/2022-10-28-multiple-data-source/usecase-by-persona.png){: .img-fluid}


## How does the Multiple Data Sources feature work?


**High-level architecture diagram**

![Legacy architecture](/assets/media/blog-images/2022-10-28-multiple-data-source/legacy.png){: .img-fluid}
![Evolution architecture](/assets/media/blog-images/2022-10-28-multiple-data-source/evolution.png){: .img-fluid}

The Multiple Data Sources feature introduces a new saved object, `data-source`, that provides information about a data source connection, such as endpoint or authentication information. Users can dynamically add the data source in Dashboards via the UI or API.

When using the Multiple Data Sources feature, the data source's associated index pattern will have a reference field like the following:

![IndexPattern with dataSource](/assets/media/blog-images/2022-10-28-multiple-data-source/indexpattern-with-ds.png){: .img-fluid}

The following pseudocode shows the current supported data source attributes:

```
DataSourceAttributes extends SavedObjectAttributes {
    title,
    description,
    endpoint,
    auth: {
      type,
      credentials,
    }
}
```

To enable other Dashboards components to interact with a user data source cluster, this feature forked and repurposed the existing `opensearch_service` to create a data source connection. When Dashboards needs to access data sources, it will fetch the data source information from its metadata storage by data source ID and then send the request to the corresponding data source endpoint.

The following example code shows how to use the `dataSource` client:
```ts
client: OpenSearchClient = await context.dataSource.opensearch.getClient(dataSourceId);
//Support for legacy client
apiCaller: LegacyAPICaller = context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI;
```
In this first development phase, several Dashboards plugins are integrated with the data source feature (for example, data, index pattern management, discover, and visualize) to enable users to specify a data source when using their functions.

**High-level sequence diagram**

![High level sequence diagram](/assets/media/blog-images/2022-10-28-multiple-data-source/highlevel-sequence.png){: .img-fluid}

A comprehensive design breakdown will be added to the [Dashboards repository](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/docs/multi-datasource).

## What’s next?

The OpenSearch Project team continues to enhance the Multiple Data Sources feature. Here are a few enhancements the team is working on:

* Dashboards plugin support: The Multiple Data Sources feature currently works with index-pattern-based visualizations. The team is working on support with other plugins and data source capability within other plugins.
* OpenSearch client's support for more authN approaches, such as AWS Sigv4 and JWT.
* Improved version compatibility between Dashboards and data sources.

## Get started with the Multiple Data Sources feature

For more information on setting up and exploring this feature, see the OpenSearch [documentation](https://opensearch.org/docs/latest/dashboards/discover/multi-data-sources/). You can try out this feature in your local environment or the [OpenSearch playground](https://playground.opensearch.org/app/home#/). To leave feedback, visit the [OpenSearch Forum](https://forum.opensearch.org/t/feedback-experimental-feature-connect-to-external-data-sources/11144). If you're interested in contributing to this experimental feature, consider contributing to the OpenSearch Dashboards [repository](https://github.com/opensearch-project/OpenSearch-Dashboards).
