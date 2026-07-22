---
layout: post
title: "Moving from open source Elasticsearch to OpenSearch"
authors: 
  - vemsarat
date: 2021-10-29
categories:
  - technical-posts
twittercard:
  description: "Learn how to move from open source Elasticsearch to OpenSearch, and why you want to move now."
redirect_from: "/blog/technical-posts/2021/10/moving-from-opensource-elasticsearch-to-opensearch/"
---
*Blog refreshed for technical accuracy on 16 Nov 2022*

The process of upgrading from open source Elasticsearch to OpenSearch varies depending on your current version of Elasticsearch, installation type, tolerance for downtime, and cost sensitivity. Rather than recommended steps for every situation, we provide general guidance on the process.

This blog post is a refresh of the upgrade process. 
## What is an open source Elasticsearch to OpenSearch upgrade? 

An *upgrade* means moving a cluster to either a new major or latest minor version of the major version. Major version upgrades come with breaking changes, and the upgrade should follow the recommended migration path. Minor version upgrades are relatively simple.

When upgrading from Elasticsearch to OpenSearch, settings and indexes are upgraded:

* Cluster settings: All dynamic settings that are supported in the new cluster will be migrated, and the ones that were deprecated will be archived.
* Indexes: All compatible indexes (that is, all your data) will be readable/writable by the new software version.

Static settings defined in the  `opensearch.yml` or `elasticsearch.yml` files are not moved automatically during an upgrade. Each version of OpenSearch is bundled with the [`opensearch-upgrade`](https://opensearch.org/docs/latest/upgrade-to/upgrade-to/#upgrade-tool) tool. The tool connects to an Elasticsearch cluster and moves the static settings, and the cluster and the settings are defined in the `elasticsearch.yml` to `opensearch.yml` files automatically. If you use ElasticSearch keystore to store secret values, you also can use the `opensearch-upgrade` tool to automate the migration.

## Preparing for the upgrade

If you run open source Elasticsearch or older minor versions of OpenSearch and want to upgrade to the latest OpenSearch version, you’ll need to take the following actions.

First, back up your data by taking a snapshot of your existing cluster (You can follow the approach outlined in [Upgrade to OpenSearch](https://opensearch.org/docs/latest/upgrade-to/index/).

Second, verify version compatibility between the existing cluster and the version to which you are migrating. OpenSearch was forked from the last open source version of Elasticsearch, 7.10.2.

* Indexes are compatible with current and previous major versions (OpenSearch 1.x or later can read/write indexes from open source Elasticsearch 6.x and 7.x).
* Wire compatibility works with all major versions and the minor verison(s) of the latest major version. OpenSearch 1.x or later can join an open source Elasticsearch 6.8.x and 7.x cluster.

Indexes that were created prior to open source Elasticsearch 6.x must be reindexed or deleted in order to upgrade the cluster to OpenSearch. The cluster will fail to start if you have incompatible indexes.

Use the [Reindex API](https://opensearch.org/docs/latest/api-reference/document-apis/reindex/) to migrate your data from indexes created in versions prior to 6.x to a new version. Here’s an example:

```
POST /_reindex
{
   "source":{
      "index":"my-old-index"
   },
   "dest":{
      "index":"my-new-index"
   }
}
```
Lastly, download the latest version of OpenSearch from the [OpenSearch downloads page](https://opensearch.org/downloads.html). If you need help with installation, see the guidance in [Install and Configure OpenSearch](https://opensearch.org/docs/latest/opensearch/install/index/).

As described in a [previous blog post](https://opensearch.org/blog/technical-posts/2021/07/how-to-upgrade-from-opendistro-to-opensearch/), open source Elasticsearch is the foundation for Open Distro, and it has the same upgrade paths. You can follow through the steps for the path you choose to upgrade your cluster.

## Support matrix for open source Elasticsearch to OpenSearch

|Open Source Elasticsearch|Recommended Upgrade Path	|
|---	|---	|
|7.0 to 7.10.2	|Restart/Rolling upgrade to OpenSearch 1.x	|
|6.8	|Restart/Rolling upgrade to 7.10.2	|
|6.0 to 6.7	|Restart/Rolling upgrade to 6.8	|
|5.6	|Restart/Rolling upgrade to 6.8	|
|5.0 to 5.5	|Restart/Rolling upgrade to 5.6	|

## Clients and tools

If you are using tools like Beats, Logstash, Fluentd, and Fluent Bit and you want to continue using them, see [Agents and Ingestion Tools](https://opensearch.org/docs/latest/clients/agents-and-ingestion-tools/index/). Some clients and tools have version checks built in and do not work out of the box. OpenSearch has an intermediate solution. It is built with a compatibility flag that returns to version 7.10.2, and you’ll need to set the cluster setting as follows:

```
PUT _cluster/settings
{
  "persistent": {
    "compatibility": {
      "override_main_response_version": true
    }
  }
}
```
OpenSearch also provides [clients](https://opensearch.org/docs/latest/clients/index/) for several popular programming languages, including Python, NodeJS, and Go.

### Going forward

Now that you have the necessary information about migrating from open source Elasticsearch to OpenSearch, you can decide the suitable path for your workload. Again, remember to take a backup before starting the upgrade process.
