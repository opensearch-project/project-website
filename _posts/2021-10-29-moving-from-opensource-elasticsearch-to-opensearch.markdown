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
---
*Blog refreshed for technical accuracy on 11 Nov 2022*

The process of upgrading from open-source Elasticsearch to OpenSearch varies depending on your current version of Elasticsearch, installation type, tolerance for downtime, and cost sensitivity. Rather than recommended steps for every situation, we provide general guidance on the process.

This blog post is a refresh of the upgrade process. 
### What is an open source Elasticsearch to OpenSearch Upgrade? 

An *upgrade* is moving a cluster to either a new minor version or new major version. Major version upgrades come with breaking changes which is why it should be carefully upgraded via recommended paths. Minor version upgrades are relatively simple.

When talking about upgrades, settings and indices are upgraded:

* Cluster Settings - All dynamic settings which are supported in the new cluster will be migrated and the ones which were deprecated will be *archived*.
* Indices - All compatible indices (i.e. all your data) will be readable/writable by the new software version.

Static settings defined in `elasticsearch.yml` / `opensearch.yml` are not moved automatically during an upgrade.
OpenSearch 1.1.0 is bundled with a new [upgrade tool](https://opensearch.org/docs/latest/upgrade-to/upgrade-to/#upgrade-tool) which connects to an Elasticsearch cluster and moves static settings which are defined in `elasticsearch.yml` to `opensearch.yml` automatically.

Yay! Now you know what an upgrade is, lets buckle up for the upgrade.

### Preparing for the upgrade

If you run open source Elasticsearch or older minor versions of OpenSearch and you would like to upgrade to the latest OpenSearch (1.1.0), below are a few things you should take care of.

First, **always** take a backup of your data. Take a snapshot of your existing cluster, you could follow the guidance from the earlier [blog post](https://opensearch.org/blog/technical-posts/2021/07/how-to-upgrade-from-opendistro-to-opensearch/).
Second, understand the version compatibility between the existing cluster to the version you are moving into. As OpenSearch was a fork from the last open source version of Elasticsearch, 7.10.2:

* Indices are compatible with current and previous major versions (i.e. OpenSearch 1.x could read/write indices from open source Elasticsearch 6.x and 7.x). 
* Wire compatibility works with all versions of current major and last minor of the previous major version (i.e. OpenSearch 1.x could join an open source Elasticsearch 6.8.x and 7.x cluster).

Indices that were created prior to open source Elasticsearch 6.x will have to be either re-indexed or deleted in order to upgrade the cluster to OpenSearch. Having incompatible indices will cause a failure of the cluster to start.

Use [Reindex API](https://opensearch.org/docs/latest/opensearch/rest-api/document-apis/reindex/) to migrate your data from indices created in versions prior to 6.x to a new version. Here is an example:

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

### Support Matrix for open source Elasticsearch to OpenSearch

|Open Source Elasticsearch|Recommended Upgrade Path	|
|---	|---	|
|7.0 to 7.10.2	|Restart/Rolling upgrade to OpenSearch 1.x	|
|6.8	|Restart/Rolling upgrade to 7.10.2	|
|6.0 to 6.7	|Restart/Rolling upgrade to 6.8	|
|5.6	|Restart/Rolling upgrade to 6.8	|
|5.0 to 5.5	|Restart/Rolling upgrade to 5.6	|

Finally, now that you are ready for the upgrade, you can download the latest version of OpenSearch from the [OpenSearch downloads page](https://opensearch.org/downloads.html), and if you need help with installation instructions follow the install and [configure guide](https://opensearch.org/docs/opensearch/install/index/) on the documentation website.

As outlined in the earlier [blog post](https://opensearch.org/blog/technical-posts/2021/07/how-to-upgrade-from-opendistro-to-opensearch/), open source Elasticsearch is the foundation for Open Distro and it has the same upgrade paths. You can follow through the steps for the path you choose to upgrade your cluster.

### Clients and Tools

As you are moving your workloads to OpenSearch, there are probably a few tools like Beats, Logstash, Fluentd, and Fluent Bit you have used with open source Elasticsearch and would like to use them with OpenSearch. Unfortunately some clients and tools have version checks builtin and do not work out of the box.

To work around this, OpenSearch is built with a compatibility flag which will respond back with the version field as `7.10.2`. It is a cluster setting and you can set it via:

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

OpenSearch [documentation](https://opensearch.org/docs/latest/clients/agents-and-ingestion-tools/index/) provides links to download and compatibility matrices for each tool.

As many users use Logstash to ingest data into the cluster, the OpenSearch project has built a [Logstash output plugin](https://opensearch.org/downloads.html) to work specifically with OpenSearch.

Since the project announced [native client support](https://opensearch.org/blog/community/2021/08/community-clients/) a few clients like [Python, NodeJS, and Go](https://opensearch.org/blog/community/2021/09/opensearch-py-js-go/) are now ready for production use.

### Going Forward

Now that you are empowered with this knowledge, choose the right path which is suitable for your workload and always remember to take a backup.

In the coming days, look for a partner spotlight post that goes into more detail about migrating from open source Elasticsearch to OpenSearch.

