---
layout: post
title:  Boosting OpenSearch Development on MacOS with Apple Silicon
authors:
- zhujiaxiang
- ssingh
date: 2024-09-30
categories:
  - releases
  - technical-posts
excerpt: We are excited to announce that the OpenSearch core snapshot tarball artifact, specifically designed for MacOS Arm64 machines, is now available to the public.
meta_keywords: opensearch open source, MacOS, Arm64, Apple Silicon, developer friendly, architecture support, platform support
meta_description:  Boosting OpenSearch Development on MacOS with Apple Silicon
---

OpenSearch is an Apache-2.0 licensed open-source project supported by an engaging community of users across the globe. Building on its commitment to openness and growth, OpenSearch has recently become part of the newly formed [OpenSearch Software Foundation](https://foundation.opensearch.org/), a community-driven initiative under the [Linux Foundation](https://www.linuxfoundation.org/). As part of this move, we have focused on boosting developer experience with more platform and architecture support, particularly for developers using the MacOS Arm64 machines. Previously, setting up OpenSearch cluster and running integration tests required a Linux environment or via Docker container, which added complexity and overhead to the process. Now, you can run and test OpenSearch plugins natively on MacOS, streamline workflows and reduce development time.

Today, we are excited to announce that the OpenSearch core snapshot tarball artifact, specifically designed for MacOS Arm64 machines, is now available to the public. Developers working on these machines, particularly the latest Mac computers with Apple silicon, are encouraged to try it out.

In this blog post, we will discuss how to access the new snapshot artifact, and a few ways to utilize it to start development with OpenSearch and OpenSearch Dashboards.


### Pre-requisite

You would need to have a [Mac Computer with Apple Silicon](https://support.apple.com/en-us/116943) (Arm64 architecture). For older models with Intel processor, we have published the [OpenSearch core snapshot artifact for MacOS X64 Host](https://github.com/opensearch-project/opensearch-build/issues/2216) back in 2022.


### Directly download the artifact and start OpenSearch cluster

You can download the artifact tarball through one of the following links:

```bash
1.3.19 Snapshot Artifact:
https://artifacts.opensearch.org/snapshots/core/opensearch/1.3.19-SNAPSHOT/opensearch-min-1.3.19-SNAPSHOT-darwin-arm64-latest.tar.gz

2.16.0 Snapshot Artifact:
https://artifacts.opensearch.org/snapshots/core/opensearch/2.16.0-SNAPSHOT/opensearch-min-2.16.0-SNAPSHOT-darwin-arm64-latest.tar.gz

3.0.0 Snapshot Artifact:
https://artifacts.opensearch.org/snapshots/core/opensearch/3.0.0-SNAPSHOT/opensearch-min-3.0.0-SNAPSHOT-darwin-arm64-latest.tar.gz
```

You can use these commands to start the cluster:

```bash
# Download 3.0.0 core snapshot
wget https://artifacts.opensearch.org/snapshots/core/opensearch/3.0.0-SNAPSHOT/opensearch-min-3.0.0-SNAPSHOT-darwin-arm64-latest.tar.gz

# Extract the tarball
tar -xzvf opensearch-min-3.0.0-SNAPSHOT-darwin-arm64-latest.tar.gz

# Start the cluster
cd opensearch-3.0.0-SNAPSHOT
./bin/opensearch
```

Once started, you can make some sample API calls:

```bash
# Check cluster information
curl http://localhost:9200
......
{
  "name" : "macos-arm64-host",
  "cluster_name" : "opensearch",
  "cluster_uuid" : "hOcgbBtrTU-yy48nSvRj5Q",
  "version" : {
    "distribution" : "opensearch",
    "number" : "3.0.0-SNAPSHOT",
    "build_type" : "tar",
    "build_hash" : "3db252541cc843eb405c6dbb7c42712d3d612146",
    "build_date" : "2024-08-12T01:52:54.244207Z",
    "build_snapshot" : true,
    "lucene_version" : "9.12.0",
    "minimum_wire_compatibility_version" : "2.17.0",
    "minimum_index_compatibility_version" : "2.0.0"
  },
  "tagline" : "The OpenSearch Project: https://opensearch.org/"
}
```

Our pipeline will keep publishing new versions whenever they become available.

### Run Integration Tests for OpenSearch Plugins

Here, we are using the [OpenSearch Alerting plugin](https://github.com/opensearch-project/alerting) as an example on a M1 Macbook:

```bash
# Clone alerting repository
git clone https://github.com/opensearch-project/alerting.git
cd alerting
```

We first test on an older version (2.14.0) of OpenSearch that doesn’t have the core snapshot available for MacOS Arm64:

```bash
# Checkout 2.14
git checkout 2.14

# Run integration test
./gradlew integTest
> Task :alerting:integTest FAILED

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':alerting:integTest'.
> Could not resolve all files for configuration ':alerting:opensearch_distro_extracted_testclusters-alerting-integTest-0-2.14.0-SNAPSHOT-'.
   > Could not resolve opensearch-distribution-snapshot:opensearch:2.14.0-SNAPSHOT.
     Required by:
         project :alerting
      > Could not resolve opensearch-distribution-snapshot:opensearch:2.14.0-SNAPSHOT.
         > Could not get resource 'https://artifacts.opensearch.org/snapshots/core/opensearch/2.14.0-SNAPSHOT/opensearch-min-2.14.0-SNAPSHOT-darwin-arm64-latest.tar.gz'.
            > Could not HEAD 'https://artifacts.opensearch.org/snapshots/core/opensearch/2.14.0-SNAPSHOT/opensearch-min-2.14.0-SNAPSHOT-darwin-arm64-latest.tar.gz'. Received status code 403 from server: Forbidden

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.5/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD FAILED in 1m 31s
14 actionable tasks: 13 executed, 1 up-to-date
```

We now switch to version 2.16.0, in which the MacOS Arm64 snapshot has been published, and try again:

```bash
# Checkout 2.16
git checkout 2.16

# Run integration test
./gradlew integTest
> Task :alerting:integTest
<===========--> 88% EXECUTING [1m 15s]
> :alerting:compileTestKotlin
> :alerting-sample-remote-monitor-plugin:integTest 
  > Resolve files of :alerting-sample-remote-monitor-plugin:opensearch_distro_extracted_testclusters-alerting-sample-remote-monitor-plugin-integTest-0-2.16.0-SNAPSHOT- 
  > opensearch-min-2.16.0-SNAPSHOT-darwin-arm64-latest.tar.gz > 80.4 MiB/225.8 MiB downloaded

......

> Task :alerting:integTest
Picked up JAVA_TOOL_OPTIONS: -Dlog4j2.formatMsgNoLookups=true
<============-> 97% EXECUTING [20m 52s]
> :alerting:integTest > 429 tests completed, 81 skipped
> :alerting:integTest > Executing test org...DestinationMigrationUtilServiceIT


> Task :alerting:integTest
Picked up JAVA_TOOL_OPTIONS: -Dlog4j2.formatMsgNoLookups=true

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.5/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD SUCCESSFUL in 22m 48s
28 actionable tasks: 25 executed, 3 up-to-date
```

(Note: this also works for 1.3.19 or 3.0.0 version and above when you switch to 1.3 or main branches respectively)

### Enhanced Development Experience for OpenSearch Dashboards

For developers working on OpenSearch Dashboards, this new release is equally beneficial. OpenSearch Dashboards requires a running copy of OpenSearch to function as the backend. Thanks to this update, you can now correctly setup the cluster with these commands: 

```bash
# Clone OpenSearch-Dashboards repository
git clone https://github.com/opensearch-project/OpenSearch-Dashboards.git
cd OpenSearch-Dashboards

# Bootstrap
yarn osd bootstrap

# Run OpenSearch backend
yarn opensearch snapshot
```

Results:

```bash
yarn run v1.22.22
$ scripts/use_node scripts/opensearch snapshot
 info Installing from snapshot
   │ info version: 3.0.0
   │ info install path: /peterzhuamazon/OpenSearch-Dashboards/.opensearch/3.0.0
   │ info license: oss
   │ info Verifying snapshot URL at https://artifacts.opensearch.org/snapshots/core/opensearch/3.0.0-SNAPSHOT/opensearch-min-3.0.0-SNAPSHOT-darwin-arm64-latest.tar.gz
   │ info downloading artifact from https://artifacts.opensearch.org/snapshots/core/opensearch/3.0.0-SNAPSHOT/opensearch-min-3.0.0-SNAPSHOT-darwin-arm64-latest.tar.gz
   │ info downloading artifact checksum from https://artifacts.opensearch.org/snapshots/core/opensearch/3.0.0-SNAPSHOT/opensearch-min-3.0.0-SNAPSHOT-darwin-arm64-latest.tar.gz.sha512
   │ info checksum verified
   │ info extracting /peterzhuamazon/OpenSearch-Dashboards/.opensearch/cache/opensearch-min-3.0.0-SNAPSHOT-darwin-arm64-latest.tar.gz
   │ info extracted to /peterzhuamazon/OpenSearch-Dashboards/.opensearch/3.0.0
   │ info created /peterzhuamazon/OpenSearch-Dashboards/.opensearch/3.0.0/OPENSEARCH_TMPDIR
 info Starting
   │ debg bin/opensearch

......


   │ info [o.o.c.c.CoordinationState] [macos-arm64-host] cluster UUID set to [B-bhWFUBTK27hoGxCjdhkA]
   │ info [o.o.c.s.ClusterApplierService] [macos-arm64-host] cluster-manager node changed {previous [], current [{macos-arm64-host}{jdix95csSJqLMZCCj6Lt8w}{thqCYSs6QE6mGMwIwuONHQ}{127.0.0.1}{127.0.0.1:9300}{dimr}{shard_indexing_pressure_enabled=true}]}, term: 1, version: 1, reason: Publication{term=1, version=1}
   │ info [o.o.d.PeerFinder] [macos-arm64-host] setting findPeersInterval to [1s] as node commission status = [true] for local node [{macos-arm64-host}{jdix95csSJqLMZCCj6Lt8w}{thqCYSs6QE6mGMwIwuONHQ}{127.0.0.1}{127.0.0.1:9300}{dimr}{shard_indexing_pressure_enabled=true}]
   │ info [o.o.c.r.a.AllocationService] [macos-arm64-host] Falling back to single shard assignment since batch mode disable or multiple custom allocators set
   │ info [o.o.c.r.a.AllocationService] [macos-arm64-host] Falling back to single shard assignment since batch mode disable or multiple custom allocators set
   │ info [o.o.h.AbstractHttpServerTransport] [macos-arm64-host] publish_address {127.0.0.1:9200}, bound_addresses {[::1]:9200}, {127.0.0.1:9200}
   │ info [o.o.n.Node] [macos-arm64-host] started
......
```

You can now start developing OpenSearch Dashboards on your MacOS Arm64 host with OpenSearch running in the background.

### Next Steps

We encourage all developers working on macOS Arm64 machines to test the artifact and provide us with feedback. If you have any questions, join us on our [Public Slack Channel](https://opensearch.org/slack.html) or in the [*GitHub repository*](https://github.com/opensearch-project).

