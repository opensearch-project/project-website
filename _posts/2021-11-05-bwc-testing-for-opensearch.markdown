---
layout: post
title:  "Backwards Compatibility Testing for OpenSearch"
authors: 
  - vachshah
  - vemsarat
date: 2021-11-05 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "This post provides details on the framework in OpenSearch for backwards compatibility testing."
redirect_from: "/blog/technical-post/2021/11/bwc-testing-for-opensearch/"
---

Backwards Compatibility (BWC) testing is used to test and determine the safe upgrade paths from a supported BWC version to the current version. The framework in OpenSearch allows you to run these BWC tests for all supported BWC versions in OpenSearch allowing safe upgrade paths between versions. This framework is now extended to work for plugins which can introduce their BWC tests without creating individual frameworks of their own. This post provides details on the framework in OpenSearch for backwards compatibility.

OpenSearch 1.1.0 was tested with versions 7.10.2 and 1.0.0 for backwards compatibility using the framework described in this post.

## The Framework

As a general idea for BWC tests, the framework supports spinning up a test cluster with a supported BWC version, then upgrade the nodes to the current version and test various features and functionalities as a result of the upgrade. This allows for testing the compatibility of the code between versions.

## Test Cluster Setup

The test clusters are available via  [`opensearch.testclusters`](https://github.com/opensearch-project/OpenSearch/blob/f54cc382d53f76b4edefc919cc69192dee456b33/buildSrc/src/main/java/org/opensearch/gradle/testclusters/TestClustersPlugin.java) gradle plugin. A cluster is an instance of [`OpenSearchCluster`](https://github.com/opensearch-project/OpenSearch/blob/f54cc382d53f76b4edefc919cc69192dee456b33/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java) and it contains a list of nodes which are instances of the [`OpenSearchNode`](https://github.com/opensearch-project/OpenSearch/blob/f54cc382d53f76b4edefc919cc69192dee456b33/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchNode.java) class which provides the methods to start, stop, restart, upgrade, install plugins etc. The version of the nodes can be set by providing a list of versions to the `testclusters`. The node can then be upgraded to a newer version provided by using the [`nextNodeToNextVersion`](https://github.com/opensearch-project/OpenSearch/blob/f54cc382d53f76b4edefc919cc69192dee456b33/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java#L412) method on the concerned `testcluster` or by using [`goToNextVersion`](https://github.com/opensearch-project/OpenSearch/blob/f54cc382d53f76b4edefc919cc69192dee456b33/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java#L392) method which upgrades all the nodes in a cluster.

```
testClusters {
    "mycluster" {
        versions = ["7.10.2", project.version]
        numberOfNodes = 4
    }
}
```

An example `testcluster` initialization is given above. Here the `testcluster` is named `mycluster` with 4 nodes. Two versions are provided and the first version is the version that gets installed by default when a node starts. It upgrades to the next version using the method mentioned above.

## Types Of BWC Tests

All the BWC tests in OpenSearch are located inside the `qa` module. The following types of tests are available for BWC:

* **Mixed Cluster:** For a mixed cluster scenario, a test cluster is spun up with multiple nodes of a supported BWC version, then one node upgraded to the current version of OpenSearch using the [`nextNodeToNextVersion`](https://github.com/opensearch-project/OpenSearch/blob/f54cc382d53f76b4edefc919cc69192dee456b33/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java#L412) method resulting in a cluster with a few nodes still on the older version. The corresponding tests are run for the old cluster and for the newly created mixed cluster automating the mixed cluster upgrade path. 
    * Located in  `qa/mixed-cluster` 
    * Run using  `./gradlew :qa:mixed-cluster:vM.N.b#mixedClusterTest`
* **Rolling Upgrade:** For a rolling upgrade scenario, a test cluster is spun up with multiple nodes of a supported BWC version and each node is upgraded one by one to a newer version of OpenSearch using the `nextNodeToNextVersion` method resulting in a fulling upgraded cluster achieved via sequential upgrade. The corresponding tests are run for the old cluster and for each node after it undergoes the upgrade.
    * Located in `qa/rolling-upgrade`
    * Run using `./gradlew :qa:rolling-upgrade:vM.N.b#upgradedClusterTest`
* **Full Cluster Restart:** For a full cluster restart, a test cluster is spun up with multiple nodes of a supported BWC version and all the nodes are upgraded using the [`goToNextVersion`](https://github.com/opensearch-project/OpenSearch/blob/f54cc382d53f76b4edefc919cc69192dee456b33/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java#L392) method resulting in a fully upgraded cluster by restarting. The corresponding tests are run for the old cluster and for the upgraded cluster.
    * Located in `qa/full-cluster-restart`
    * Run using `./gradlew :qa:full-cluster-restart:vM.N.b#upgradedClusterTest`
* **Snapshot Upgrade**: For a snapshot upgrade, two test clusters are created (one with the older version and one with a newer version) and the snapshot restoration is tested between the clusters. Each step tests the creation of repository and snapshot and restoring the snapshot.
    * Located in `qa/repository-multi-version`
    * Run using `./gradlew :qa:repository-multi-version:vM.N.b#Step4NewClusterTest`

The backwards compatibility tests in OpenSearch can be run for versions ranging from 7.10.0 to the current project version.

To run all the backwards compatibility tests:
 `./gradlew bwcTest`

A specific version can be tested as well. For example, to test bwc with version 7.10.2 run:
`./gradlew v7.10.2#bwcTest`

## BWC Tests For Plugins

The framework for BWC from OpenSearch has been extended to be used for plugins as part of an effort to increase test automation for various upgrade paths. The plugins can use the `testclusters` plugin from OpenSearch for a test cluster setup and provide the plugin to be installed on the nodes of the cluster. 

```
testClusters {
    "mycluster" {
        versions = ["7.10.2", project.version]
        numberOfNodes = 4
        plugin(provider(new Callable<RegularFile>(){
            @Override
            RegularFile call() throws Exception {
                return new RegularFile() {
                    @Override
                    File getAsFile() {
                        return fileTree("`src/test/resources/org/opensearch/ad/bwc/anomaly-detection`/1.13.0.0/").getSingleFile()
                    }
                }
            }
        }))
    }
}
```

For the [example](https://github.com/opensearch-project/anomaly-detection/blob/44baa818f8cdc7bc44e98781c3716b98a83b2986/build.gradle) given above, the test cluster consists of 4 nodes which are initialized with `7.10.2` version when started with the BWC version `1.13.0.0` of plugin `anomaly-detection` installed on all the nodes. For anomaly-detection, the backwards compatibility tests run for testing the upgrade from 7.10.2 versioned test cluster with 1.13.0.0 plugin to 1.1.0 versioned test cluster with 1.1.0.0 plugin.

Mixed cluster, rolling upgrade and full restart upgrade scenarios are supported for the BWC tests in plugins and the nodes in the cluster can be upgraded using the methods on the test cluster:  [`upgradeNodeAndPluginToNextVersion`](https://github.com/opensearch-project/OpenSearch/blob/f54cc382d53f76b4edefc919cc69192dee456b33/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java#L417) for a single node upgrade at a time and [`upgradeAllNodesAndPluginsToNextVersion`](https://github.com/opensearch-project/OpenSearch/blob/f54cc382d53f76b4edefc919cc69192dee456b33/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java#L399) for upgrading all the nodes at the same time. The tests corresponding to each step can be configured to run similarly as explained above according to each upgrade scenario.

## Summary

Backwards compatibility especially for plugins has been a major concern during releases since it involved manual testing to determine safe upgrade paths. With the extended framework for BWC, plugins can now implement their BWC tests thus alleviating the need for manual efforts. All pull requests in OpenSearch now run the BWC tests making sure all the changes adhere to the backwards compatibility standards. For more information on the CI runs, please check out an example [`anomaly-detection CI run`](https://github.com/opensearch-project/anomaly-detection/runs/4083627403).

For more information on BWC testing, please check out [OpenSearch/TESTING.md](https://github.com/opensearch-project/OpenSearch/blob/f54cc382d53f76b4edefc919cc69192dee456b33/TESTING.md#testing-backwards-compatibility) and [opensearch-plugins/TESTING.md](https://github.com/opensearch-project/opensearch-plugins/blob/b606c9e17163311ce2dee05a7a5d6f557e5fc197/TESTING.md#backwards-compatibility-testing).

Closing on a high note, we hope this blog post adds light to the backwards compatibility framework and we are continuing to invest efforts in automating backwards compatibility for OpenSearch. The release automation currently built as part of [opensearch-project/opensearch-build#90](https://github.com/opensearch-project/opensearch-build/issues/90) runs the bwc tests for OpenSearch as part of the release process. Going further, we are working to add bwc tests for all plugins ([opensearch-project/opensearch-plugins#77](https://github.com/opensearch-project/opensearch-plugins/issues/77)), automate running the plugin bwc tests and run bwc tests for the bundle as part of the release process. Please refer to [opensearch-project/opensearch-build#90](https://github.com/opensearch-project/opensearch-build/issues/90) for the next steps.
