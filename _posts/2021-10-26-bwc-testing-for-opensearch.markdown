---
layout: post
title:  "Backwards Compatibility Testing for OpenSearch"
authors: 
  - vachshah
  - vemsarat
date: 2021-10-26 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "This post provides details on the framework in OpenSearch for backwards compatibility testing"
---

Backwards Compatibility (BWC) testing is used to test and determine the safe upgrade paths from a supported BWC version to the current version. The framework in OpenSearch allows to run these BWC tests for all supported BWC versions in OpenSearch allowing safe upgrade paths between versions. This framework is now extended to work for plugins and they can introduce their BWC tests without creating individual frameworks of their own. This post provides details on the framework in OpenSearch for backwards compatibility.

## The Framework

As a general idea for BWC tests, the framework supports to spin up a test cluster with a supported BWC version, then upgrade the nodes to the current version and test various features and functionalities as a result of the upgrade. This allows to test the compatibility of the code between versions.

## Test cluster setup

The test clusters are available via  `opensearch.testclusters` gradle plugin. A cluster is an instance of `OpenSearchCluster` and it contains a list of nodes which are instances of the `OpenSearchNode` class which provides the methods to start, stop, restart, upgrade, install plugins etc. The version of the nodes can be set by providing a list of versions to the `testclusters`. The node can then be upgraded to a newer version provided by using the `nextNodeToNextVersion` method on the concerned testcluster or by using `goToNextVersion` method which upgrades all the nodes in a cluster.

An example testcluster initialization is given below. Here the testcluster is named `mycluster` with 4 nodes. Two versions are provided and the first version is the version that gets installed by default when a node starts. It upgrades to the next version using the method mentioned above.

```
testClusters {
    "mycluster" {
        versions = ["7.10.2", project.version]
        numberOfNodes = 4
    }
}
```

## Types of BWC tests

All the BWC tests in OpenSearch are located inside the `qa` module. The following types of tests are available for BWC:

* **Mixed Cluster:** For a mixed cluster scenario, a test cluster is spun up with multiple nodes of a supported BWC version, then one node upgraded to the current version of OpenSearch using the [`nextNodeToNextVersion`](https://github.com/opensearch-project/OpenSearch/blob/main/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java#L408) method resulting in a cluster with a few nodes still on the older version. The corresponding tests are run for the old cluster and for the newly created mixed cluster automating the mixed cluster upgrade path. 
    * Located in  `qa/mixed-cluster` 
    * Run using  `./gradlew :qa:mixed-cluster:vM.N.b#mixedClusterTest`
* **Rolling Upgrade:** For a rolling upgrade scenario, a test cluster is spun up with multiple nodes of a supported BWC version and each node is upgraded one by one to a newer version of OpenSearch using the `nextNodeToNextVersion` method resulting in a fulling upgraded cluster achieved via sequential upgrade. The corresponding tests are run for the old cluster and for each node after it undergoes the upgrade.
    * Located in `qa/rolling-upgrade`
    * Run using `./gradlew :qa:rolling-upgrade:vM.N.b#upgradedClusterTest`
* **Full Cluster Restart:** For a full cluster restart, a test cluster is spun up with multiple nodes of a supported BWC version and all the nodes are upgraded using the [`goToNextVersion`](https://github.com/opensearch-project/OpenSearch/blob/main/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java#L388) method resulting in a fully upgrade cluster by restarting. The corresponding tests are run for the old cluster and for the upgraded cluster.
    * Located in `qa/full-cluster-restart`
    * Run using `./gradlew :qa:full-cluster-restart:vM.N.b#upgradedClusterTest`
* **Snapshot Upgrade**: For a snapshot upgrade, two test clusters are created (one with the older version and one with a newer version) and the snapshot restoration is tested between the clusters. Each step tests the creation of repository and snapshot and restoring the snapshot.
    * Located in `qa/repository-multi-version`
    * Run using `./gradlew :qa:repository-multi-version:vM.N.b#Step4NewClusterTest`

To run all the backwards compatibility tests:
 `./gradlew bwcTest`
A specific version can be tested as well. For example, to test bwc with version 7.10.2 run:
`./gradlew v7.10.2#bwcTest`

## BWC tests for plugins

The framework for BWC from OpenSearch has been extended to be used for plugins as part of an effort to increase test automation for various upgrade paths. The plugins can use the `testclusters` plugin from OpenSearch for a test cluster setup and provide the plugin to be installed on the nodes of the cluster. 

For the [example](https://github.com/opensearch-project/anomaly-detection/blob/main/build.gradle) given below, the test cluster consists of 4 nodes which are initialized with `7.10.2` version when started with the BWC version `1.13.0.0` of plugin `anomaly-detection` installed on all the nodes.

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

Mixed cluster, rolling upgrade and full restart upgrade scenarios are supported for the BWC tests in plugins and the nodes in the cluster can be upgraded using the methods on the testcluster:  [`upgradeNodeAndPluginToNextVersion`](https://github.com/opensearch-project/OpenSearch/blob/main/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java#L413) for a single node upgrade at a time and [`upgradeAllNodesAndPluginsToNextVersion`](https://github.com/opensearch-project/OpenSearch/blob/main/buildSrc/src/main/java/org/opensearch/gradle/testclusters/OpenSearchCluster.java#L395) for upgrading all the nodes at the same time. The tests corresponding to each step can be configured to run similar to explained above according to each upgrade scenario.

## Summary

Backwards compatibility specially for plugins has been a major concern during releases since it involved manual testing to determine safe upgrade paths. With the extended framework for BWC, plugins can now implement their BWC tests thus alleviating the need for manual efforts. All pull requests in OpenSearch now run the BWC tests making sure all the changes adhere to the backwards compatibility standards. 

For more information on BWC testing, please check out [OpenSearch/TESTING.md](https://github.com/opensearch-project/OpenSearch/blob/main/TESTING.md#testing-backwards-compatibility) and [opensearch-plugins/TESTING.md](https://github.com/opensearch-project/opensearch-plugins/blob/main/TESTING.md#backwards-compatibility-testing).

Closing on a high note, we hope this blog post adds light to the backwards compatibility framework and we are continuing to invest efforts in automating backwards compatibility for OpenSearch.
