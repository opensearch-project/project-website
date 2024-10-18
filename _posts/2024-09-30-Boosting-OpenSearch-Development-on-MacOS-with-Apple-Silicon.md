---
layout: post
title:  Streamline your OpenSearch development workflow on macOS with Apple silicon
authors:
- zhujiaxiang
- sisurab
- kolchfa
date: 2024-09-30
categories:
  - releases
  - technical-posts
excerpt: We're excited to announce that the OpenSearch core snapshot tarball artifact, built specifically for macOS ARM64 machines, is now publicly available. If you're developing on the latest Mac computers with Apple silicon, we encourage you to give it a try and experience the streamlined workflow.
meta_keywords: opensearch open source, MacOS, ARM64, Apple Silicon, developer friendly, architecture support, platform support
meta_description: Learn how to simplify your OpenSearch development workflow on macOS with Apple silicon
---

OpenSearch is an Apache 2.0--licensed open-source project supported by an engaged community of users across the globe. Building on its commitment to openness and growth, OpenSearch recently became part of the newly formed [OpenSearch Software Foundation](https://foundation.opensearch.org/), a community-driven initiative under the [Linux Foundation](https://www.linuxfoundation.org/). This shift has allowed us to enhance the developer experience by expanding platform and architecture support, especially for developers using macOS ARM64 machines. Previously, setting up an OpenSearch cluster and running integration tests required a Linux environment or Docker containers, adding complexity and overhead to the process. Now you can run and test OpenSearch plugins natively on macOS, simplifying workflows and reducing development time.

We're excited to announce that the OpenSearch core snapshot tarball artifact, built specifically for macOS ARM64 machines, is now publicly available. If you're developing on these machines, especially the latest Mac computers with Apple silicon, we encourage you to give it a try.

In this blog post, we'll discuss accessing the new snapshot artifact and using it to streamline your OpenSearch and OpenSearch Dashboards development workflow.


## Prerequisite

You can use the artifact described in this post on a [Mac computer with Apple silicon](https://support.apple.com/en-us/116943) (ARM64 architecture). For older models with an Intel processor, you can use the [OpenSearch core snapshot artifact for macOS X64 Host](https://github.com/opensearch-project/opensearch-build/issues/2216).


## Download the artifact and start an OpenSearch cluster

You can download the artifact tarball through one of the following links:

- [1.3.19 snapshot artifact](https://artifacts.opensearch.org/snapshots/core/opensearch/1.3.19-SNAPSHOT/opensearch-min-1.3.19-SNAPSHOT-darwin-arm64-latest.tar.gz)

- [2.16.0 snapshot artifact](https://artifacts.opensearch.org/snapshots/core/opensearch/2.16.0-SNAPSHOT/opensearch-min-2.16.0-SNAPSHOT-darwin-arm64-latest.tar.gz)

- [3.0.0 snapshot artifact](https://artifacts.opensearch.org/snapshots/core/opensearch/3.0.0-SNAPSHOT/opensearch-min-3.0.0-SNAPSHOT-darwin-arm64-latest.tar.gz)

Our pipeline is configured to publish new artifact versions whenever they become available.

To start the cluster, run the following commands:

```bash
# Download 3.0.0 core snapshot
wget https://artifacts.opensearch.org/snapshots/core/opensearch/3.0.0-SNAPSHOT/opensearch-min-3.0.0-SNAPSHOT-darwin-arm64-latest.tar.gz

# Extract the tarball
tar -xzvf opensearch-min-3.0.0-SNAPSHOT-darwin-arm64-latest.tar.gz

# Start the cluster
cd opensearch-3.0.0-SNAPSHOT
./bin/opensearch
```

Once the cluster is started, you can make a test API call to verify that the cluster is working:

```bash
curl http://localhost:9200
```

The response should appear similar to the following:

```json
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

## Run OpenSearch plugin integration tests 

Follow this procedure to run integration tests for an OpenSearch plugin. In this example, you'll run tests for the [OpenSearch Alerting plugin](https://github.com/opensearch-project/alerting) on an M1 MacBook.

Clone the alerting repository and change directory to the repository root:

```bash
git clone https://github.com/opensearch-project/alerting.git
cd alerting
```

First, try running integration tests on an older version of OpenSearch that doesn't contain the core snapshot for macOS ARM64 (in this example, 2.14.0):

```bash
# Check out 2.14
git checkout 2.14

# Run integration test
./gradlew integTest
```

The tests fail with the following error:

```bash
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

Then switch to the 2.16.0 version, in which the macOS ARM64 snapshot is available, and try again:

```bash
# Check out 2.16
git checkout 2.16

# Run integration test
./gradlew integTest
```

Integration tests are running:

```bash
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

**Note**: Running integration tests with the new artifact also works for OpenSearch version 1.3.19 (when you switch to the 1.3 branch) or version 3.0.0 and later (when you switch to the main branch).

## Simplify your OpenSearch Dashboards development experience

If you're developing for OpenSearch Dashboards, this release brings significant benefits. OpenSearch Dashboards relies on a running instance of OpenSearch as its backend. With this update, you can now easily configure the cluster using the following commands:

```bash
# Clone OpenSearch-Dashboards repository
git clone https://github.com/opensearch-project/OpenSearch-Dashboards.git
cd OpenSearch-Dashboards

# Bootstrap
yarn osd bootstrap

# Run OpenSearch backend
yarn opensearch snapshot
```

The output verifies that the latest 3.0.0 snapshot version of OpenSearch is installed and started:

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

Now that OpenSearch is running in the background, you can start developing OpenSearch Dashboards on your macOS ARM64 host.

## Next steps

If you're a developer working on a macOS ARM64 machine, we encourage you to test the artifact and share your feedback. If you have any questions, feel free to join us on our [public Slack channel](https://opensearch.org/slack.html) or in the [GitHub repository](https://github.com/opensearch-project).

