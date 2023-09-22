---
layout: post
title: "How To: Upgrade from Open Distro to OpenSearch"
authors: 
  - vemsarat
  - andhopp
date: 2021-07-08
categories:
  - technical-posts
twittercard:
  description: "As general availability for OpenSearch and OpenSearch Dashboards is fast approaching, we wanted to provide some guidance on upgrading Open Distro for Elasticsearch (Open Distro) 1.13 to the OpenSearch 1.0 as well as some step to help you prepare.\"... "
redirect_from: "/blog/technical-posts/2021/07/how-to-upgrade-from-opendistro-to-opensearch/"
---
As general availability for OpenSearch and OpenSearch Dashboards is fast approaching, we wanted to provide some guidance on upgrading Open Distro for Elasticsearch (Open Distro) 1.13 to OpenSearch 1.0, along with some steps to help you prepare for the upgrade. While most of you will already have the experience of upgrading Elasticsearch clusters, we wanted to provide a refresher on the upgrade process, and make some specific call-outs regard the upgrade to OpenSearch from Open Distro.

### Preparing for the Upgrade

If you have an Open Distro for Elasticsearch cluster and want to upgrade to OpenSearch, there are a few things you should do to prepare for the upgrade. Preparing for your upgrade ahead of time ensures that you can enjoy the new features and improved usability of OpenSearch as efficiently as possible.

First, it is recommended to take a snapshot before you continue to the actual upgrade, since all versions of Open Distro support taking snapshots of the cluster. This is especially important in the snapshot upgrade we’ll cover later. To take a snapshot, use the following command:

```
# via Dev Tools on Kibana
PUT /_snapshot/my_backup/opendistro_backup?wait_for_completion=true

# via curl, assuming the cluster is on 9200 port
curl -XPUT "localhost:9200/_snapshot/my_backup/opendistro_backup?wait_for_completion=true"

# via curl, assuming the cluster is on 9200 and security is enabled
curl -XPUT -k -u 'admin:admin' 'https://localhost:9200/_snapshot/my_backup/opendistro_backup?wait_for_completion=true"
```

**Note**: For rest of the blog post we will have commands represented for Dev Tools on Kibana/OpenSearch Dashboards for simplicity, but all the above formats will work for all the commands.

Second, you should verify the version of your existing cluster, and follow the recommended upgrade path for version compatibility (see table below). While all Open Distro 1.x versions can be upgraded to OpenSearch, you may need to upgrade to Open Distro 1.13.2 first. All the Open Distro plugins are upgrade compatible to their OpenSearch equivalent.

**Upgrade support from Open Distro 1.x to OpenSearch**

|Open Distro	|ES	|Recommended Upgrade Path	|
|---	|---	|---	|
|1.0	    |7.0.1	|Restart/Rolling Upgrade to Open Distro 1.13 	|
|1.1	|7.1.1	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.2	|7.2.1	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.3	|7.3.2	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.4	|7.4.2	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.5	|7.5.2	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.6	|7.6.1	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.7	|7.6.1	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.8	|7.7.1	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.9	|7.8.0	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.10.0	|7.9.1	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.11.0	|7.9.1	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.12.0	|7.10.0	|Restart/Rolling Upgrade to Open Distro 1.13	|
|1.13.2	|7.10.2	|Restart/Rolling Upgrade to OpenSearch 1.0	|

And finally, now that you are ready for the upgrade, you should download the latest version of OpenSearch from the [OpenSearch downloads page](https://opensearch.org/downloads.html), and if you need help with installation instructions follow the install and [configure guide](https://opensearch.org/docs/opensearch/install/index/) on the documentation website.

### Types of Upgrade

Now that you have taken your snapshot, and validated the recommended upgrade path for your existing cluster, we can move on the the upgrade itself. We are going to provide instructions on 3 types of upgrades.

1. **Snapshot Upgrade**: A snapshot upgrade involves taking a snapshot of the current cluster, spinning up a new cluster, and then restoring from the snapshot. Depending on how you do this, there may or may not be downtime. 
2. **Restart Upgrade**: A restart upgrade involves taking down the whole cluster, upgrading it, and then starting it back up. This will include downtime.
3. **Rolling Upgrade**: A rolling upgrade involves taking down a cluster node by node, upgrading incrementally, and then starting them back up. This method will not incur downtime. 

### Approach #1: Snapshot Upgrade

The first approach to upgrading from Open Distro to OpenSearch is to take a [snapshot](https://opensearch.org/docs/opensearch/snapshot-restore/) of your data (indices), [create an OpenSearch cluster](https://opensearch.org/docs/opensearch/install/), restore the snapshot on the new cluster, and point your clients to the new host. While this approach means running two clusters in parallel, it provides you with an opportunity to validate that the OpenSearch cluster is working in a way that meets your needs prior to modifying the current Open Distro cluster. 

1. Verify that the existing cluster is green and healthy. See the [Validation](#Validation) section below for additional guidance.
2. Take a snapshot in Open Distro.

    ```
    PUT /_snapshot/my_backup/opendistro_backup?wait_for_completion=true
    ```

3. Spin up a new cluster using OpenSearch.
4. Restore from the snapshot taken in step 2.

    ```
    POST /_snapshot/my_backup/opendistro_backup/_restore
    ```

5. Verify the indices are searchable and indexable in OpenSearch after restore.

And that’s it! Your snapshot upgrade is complete.

### Approach #2: Restart Upgrade

Another approach is restarting your whole cluster while upgrading it to OpenSearch. This method incurs downtime, and traffic from clients should be stalled until the new cluster is up. 

1. Verify that the existing cluster is green and healthy. See the [Validation](#Validation) section below for additional guidance.
2. Disable shard allocation: during upgrade we do not want any shard movement as the cluster will be taken down.

    ```
    PUT _cluster/settings
    {
      "persistent": {
        "cluster.routing.allocation.enable": "primaries"
      }
    }
    ```

3. Stop indexing, and perform a flush: as the cluster will be taken down, indexing/searching should be stopped and `_flush` can be used to permanently store information into the index which will prevent any data loss during upgrade.

    ```
    POST /_flush
    ```

4. Shutdown all the nodes. 

    ```
    # if you are running Elasticsearch using systemd run:
    sudo systemctl stop elasticsearch.service
    
    # if you are running Elasticsearch using SysV init:
    sudo -i service elasticsearch stop
    
    # if you are running Elasticsearch as daemon:
    kill $(cat pid)
    ```

5. Upgrade all the nodes (install OpenSearch):
    1. Extract the zip in a new directory.
    2. Copy over the data directory from Elasticsearch to OpenSearch, or set `path.data` in `config/opensearch.yml` pointing to that directory.
    3. Set `path.logs` in `config/opensearch.yml`, pointing to a directory where you want to store logs.

6. Verify that the existing cluster is still green and healthy.
7. Start each upgraded node: if the cluster has dedicated master nodes, start them first, and make sure the master is elected before data nodes are started. You can monitor the health of the cluster as follows.

    ```
    GET _cluster/health
    ```
   
8. Re-enable shard allocation: 
    ```
    PUT _cluster/settings
    {
      "persistent": {
        "cluster.routing.allocation.enable": null
      }
    }
    ```

9. Verify that the indexed data in Open Distro is now searchable and indexable in OpenSearch.

You did it! Your cluster is now upgraded via a Restart Upgrade.

### Approach #3: Rolling Upgrade

This last approach upgrades an existing cluster node by node to OpenSearch 1.0.0, while keeping the cluster active during the upgrade. It is important to note that while search operations during rolling upgrades are supported, indexing operations are not recommended.

1. Verify that the existing cluster is green and healthy. See the [Validation](#Validation) section below for additional guidance.
2. Disable shard allocation: during upgrade we do not want any shard movement as the cluster will be taken down.
    ```
    PUT _cluster/settings
        {
          "persistent": {
            "cluster.routing.allocation.enable": "primaries"
          }
        }
    ```
3. Stop indexing, and perform a flush: as the cluster will be taken down, indexing/searching should be stopped and `_flush` can be used to permanently store information into the index which will prevent any data loss during upgrade.

    ```
    POST /_flush
    ```

4. Shutdown a single node: first data nodes and later master nodes.

    ```
    # if you are running Elasticsearch using systemd run:
    sudo systemctl stop elasticsearch.service
    
    # if you are running Elasticsearch using SysV init:
    sudo -i service elasticsearch stop
    
    # if you are running Elasticsearch as daemon:
    kill $(cat pid)
    ```

5. Upgrade the node which was shutdown: i.e install OpenSearch.
    1. Extract the zip in a new directory.
    2. Copy over the data directory from Elasticsearch to OpenSearch or set `path.data` in `config/opensearch.yml`, pointing to that directory.
    3. Set `path.logs` in `config/opensearch.yml`, pointing to a directory where you want to store logs.
6. Verify that the existing cluster is still green and healthy.
7. Wait for the node to recover: before upgrading the next node, wait for the cluster to finish shard allocation and the cluster to be `green`:

   ```
   GET _cat/health?v=true
   ```

8. Re-enable shard allocation: once all the data nodes are upgraded you can re-enable the shard allocation.

    ```
    PUT _cluster/settings
        {
          "persistent": {
            "cluster.routing.allocation.enable": null
          }
        }
    ```
   
9. Verify that the indexed data in Open Distro is now searchable and indexable in OpenSearch.
10. Repeat: repeat steps 4-7 until all the nodes are upgraded (data nodes first and then master nodes).
    1. **Note**: Old master nodes can communicate with new data nodes but new masters cannot communicate with old data nodes. 

Phew! You have upgraded to OpenSearch via a Rolling Upgrade.

### Validation 

OpenSearch plugins based on the Open Distro for Elasticsearch plugins are included in OpenSearch 1.0, and are functionally backwards compatible with their predecessors. 

Verify all the cluster health, indices, settings etc are seamlessly migrated and working in OpenSearch.
You can verify via these APIs, which are just few of many different ways:

```
# get cluster health
GET _cluster/health

# get nodes in a cluster
GET _cat/nodes

# get node health
GET _cat/health?v=true
```

As with all software, upgrade is a critical path for the community and customers. If you need help as always open an issue and label them `backwards-compatibility`, `1.0.0`:

1. For OpenSearch: [OpenSearch issues](https://github.com/opensearch-project/OpenSearch/issues).
2. For a plugin: use the individual plugin repository.
3. For all the plugins: [OpenSearch plugins issues](https://github.com/opensearch-project/opensearch-plugins/issues).

If you must rollback your upgrade for any reason, the simplest path is to spin up an Open Distro cluster and restore it using the snapshot you took earlier. You could follow the same process listed in the snapshot upgrade path above. 

### Recommendations

Now that you read through most of the good stuff, we have some additional recommendations to ease your upgrade:

1. Snapshot Upgrade: this is the safest approach if you can spin up multiple clusters, and move your customers to the new endpoint after the upgrade. We recommend this approach for beginners. 
2. Restart Upgrade: this is a moderately difficult approach, as it takes down the whole cluster. Ensuring everything works is performed at the very end. We recommend this approach for intermediate users.
3. Rolling Upgrade: This is the most complex approach, but requires no downtime and provides cluster health feedback at every step of the process. This method takes down one node at a time for an upgrade. We recommend this approach for advanced users.

### Upgrading OpenSearch Dashboards 

Similarly to Kibana OSS, OpenSearch Dashboards currently does not support rolling upgrades, requiring a Restart Upgrade. To upgrade to OpenSearch Dashboards, stop all Open Distro Kibana instances, deploy a new OpenSearch Dashboards instance, and direct traffic to it.

### Going Forward

OpenSearch can be upgraded using a Rolling Upgrade for most minor and major versions, thus upgrading going forward will not usually interrupt your service.

For more information on upgrading please see our [Upgrading FAQs](https://opensearch.org/faq/#c3). If you have questions about backward compatibility, check out the [Backwards Compatibility FAQ blog post](https://opensearch.org/blog/technical-posts/2021/06/opensearch-backwards-compatibility-faq/). If you’re looking for a great "Getting Started" guide, I highly recommend Gedalyah’s [Install and Configure OpenSearch](https://logz.io/blog/opensearch-tutorial-installation-configuration/).

Hope this blog post is helpful! We plan to have a follow-up post on upgrading from Elasticsearch OSS to OpenSearch, next. If you have any feedback/suggestions on new topics please don't hesitate to open issues or [post to the forums](https://discuss.opendistrocommunity.dev/).

Thanks to the OpenSearch team for making seamless upgrades happen.
