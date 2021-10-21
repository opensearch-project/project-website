---
layout: post
title: "Moving from Elasticsearch OSS to OpenSearch"
authors: 
  - vemsarat
date: 2021-10-21
categories:
  - technical-posts
twittercard:
  description: "As OpenSearch is now shipping out generally available releases, we wanted to provide an overview of how moving from Elasticsearch OSS to OpenSearch looks like and help you prepare for the move... "
---
As OpenSearch is now shipping out generally available releases, we wanted to provide an overview of how moving from Elasticsearch OSS to OpenSearch looks like and help you prepare for the move. 

### What is Elasticsearch OSS/OpenSearch Upgrade? 

Elasticsearch OSS and OpenSearch inherently follow [SemVer](https://opensearch.org/blog/technical-post/2021/08/what-is-semver/). An *upgrade* is moving a cluster to either new minor version or new major version. Major version upgrades come with breaking changes which is why it should be carefully upgraded via recommended paths. Minor version upgrades are relatively simpler and is safe. 

When we talk about upgrades, these resources are upgraded:

* Cluster Settings - All dynamic settings which are supported in the new cluster will be migrated and the ones which were deprecated will be *archived*.
* Indices - All indices(i.e all your data) which are compatible will be readable/writable by the new software version. 

Static settings defined in `elasticsearch.yml/opensearch.yml` are not moved automatically during an upgrade.
With the release of OpenSearch 1.1.0, it is bundled with a new [upgrade tool](https://opensearch.org/docs/latest/upgrade-to/upgrade-to/#upgrade-tool) which connects to Elasticsearch cluster and move static settings which are defined in `elasticsearch.yml/opensearch.yml`  automatically.

Yay now you know what an upgrade is, lets buckle up for the upgrade!

### Preparing for the upgrade

If you have Elasticsearch OSS or older minor versions of OpenSearch and you would like to upgrade to the latest OpenSearch (1.1.0), here are few things you should take care of.

First, **always** take a backup of your data. Take a snapshot of your existing cluster, you could follow the guidance from the earlier [blog post](https://opensearch.org/blog/technical-posts/2021/07/how-to-upgrade-from-opendistro-to-opensearch/).
Second, understand the version compatibility between the existing cluster to the version you are moving into. As OpenSearch was a fork from Elasticsearch OSS 7.10.2:

* Indices are compatible with current and previous major versions. i.e OpenSearch 1.x could read/write indices from Elasticsearch OSS 6.x and 7.x (until 7.10.2 which was the last ALv2 OSS version). 
* Wire compatibility works with all versions of current major and last minor of the previous major version. i.e OpenSearch 1.x could join a Elasticsearch OSS 6.8.x and 7.x cluster.

Finally, for indices which were created prior to Elasticsearch OSS 6.x, they have to be either reindexed or deleted in order to upgrade the cluster to OpenSearch. Having indices created in old incompatible versions will fail the cluster to start.

You could use [Reindex API](https://opensearch.org/docs/latest/opensearch/rest-api/document-apis/reindex/) to migrate your data to a new version of the index. Here is an example:

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

### Support Matrix for Elasticsearch OSS to OpenSearch

|Elasticsearch OSS	|Recommended Upgrade Path	|
|---	|---	|
|7.0 to 7.10.2	|Restart/Rolling upgrade to OpenSearch 1.x	|
|6.8	|Restart/Rolling upgrade to 7.10.2	|
|6.0 to 6.7	|Restart/Rolling upgrade to 6.8	|
|5.6	|Restart/Rolling upgrade to 6.8	|
|5.0 to 5.5	|Restart/Rolling upgrade to 5.6	|

And finally, now that you are ready for the upgrade, you could download the latest version of OpenSearch from the [OpenSearch downloads page](https://opensearch.org/downloads.html), and if you need help with installation instructions follow the install and [configure guide](https://opensearch.org/docs/opensearch/install/index/) on the documentation website.

As outlined in earlier [blog post](https://opensearch.org/blog/technical-posts/2021/07/how-to-upgrade-from-opendistro-to-opensearch/),  as Elasticsearch OSS is the foundation for OpenDistro and it has the same upgrade paths. You could follow through the steps for the path you choose to upgrade your cluster.

### Clients and Tools

As you are moving your workloads to OpenSearch, there are probably few tools like Beats, Logstash, Fluentd, FluentBit, and OpenTelemetry you have used with Elasticsearch OSS and would like to use them with OpenSearch. Unfortunately few clients and tools have version checks builtin and do not work out of the box.

To work around this, OpenSearch is built with a compatibility flag which will respond back with version field as `7.10.2`. It is a simple cluster setting and you could set it via:

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

OpenSearch [documentation](https://opensearch.org/docs/latest/clients/agents-and-ingestion-tools/index/) lists down compatibility matrix for each tool and pointers to downloads. 

As most users use Logstash to ingest data into the cluster, opensearch-project has built a [Logstash output plugin](https://opensearch.org/downloads.html) to work with OpenSearch or Elasticsearch OSS (7.10.2 or under). 

Clients help automate communicating with OpenSearch clusters and it supports a variety of clients. As the project announced [native client support](https://opensearch.org/blog/community/2021/08/community-clients/), few native clients like [Python, NodeJS and JS](https://opensearch.org/blog/community/2021/09/opensearch-py-js-go/) contributed by the community are now ready for production use.

### Going Forward

Now you are empowered with the moving knowledge, choose the right path which is suitable for your workloads and always remember to take a backup.

We hope this helps in choosing the right path and let us know if you any feedback or suggestions.
We plan to follow up with another blog post on how we make sure backward compatibility works across the project.


