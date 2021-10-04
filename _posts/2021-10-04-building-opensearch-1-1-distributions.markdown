---
layout: post
title:  "Building OpenSearch 1.1 Distributions using Automation"
authors: 
  - dblock
date: 2021-10-04 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "This post details how the OpenSearch project produces reliable and repeatable distributions."
---
The Open Distro for Elasticsearch was a package containing open source Elasticsearch and a dozen open source plugins. Open Distro's release process began by picking up a stable version of Elasticsearch OSS, incrementing all the plugin version numbers, and going through a development cycle. Plugins went from `-SNAPSHOT` to `-beta`, then `-rc`, then finally to a release.

This worked well until the [OpenSearch fork](https://aws.amazon.com/blogs/opensource/introducing-opensearch/). It was decided that OpenSearch would be a product with two distributions at launch: a full distribution that includes a dozen plugins, and a minimal distribution without any plugins. This made sense because most users either wanted a well-tested distribution with everything, or preferred to assemble their favorite flavor of all the parts.

The full distribution of OpenSearch 1.0 was similar to Open Distro, but with one major difference - the OpenSearch fork of Elasticsearch OSS would be developed in parallel with its plugins. The complete distribution of OpenSearch and OpenSearch Dashboards effectively became two monoliths that span multiple GitHub repositories. Using OpenSearch as an example, one cannot develop all the moving parts simultaneously, while having stable dependencies of [OpenSearch](https://github.com/opensearch-project/OpenSearch), [common-utils](https://github.com/opensearch-project/common-utils), or [job-scheduler](https://github.com/opensearch-project/job-scheduler), to name a few.

Starting with OpenSearch 1.1, the entire distribution is built from source, end-to-end, orchestrated in [this Jenkinsfile](https://github.com/opensearch-project/opensearch-build/blob/0ac7e2bfcf6adbbd49d7a2b3fff59bb9eea28a61/bundle-workflow/Jenkinsfile) by invoking [a manifest-based workflow](https://github.com/opensearch-project/opensearch-build/tree/main/bundle-workflow). This includes a release and a snapshot build for x64 and arm64 CPU architectures, executed as follows.

1. Given an [input manifest](https://github.com/opensearch-project/opensearch-build/blob/main/manifests/opensearch-1.1.0.yml) committed to GitHub, build all components from source, and generate a build manifest.
   ```
   bundle-workflow/build.sh manifests/1.1.0/opensearch-1.1.0.yml
   ```
2. Use the [build manifest produced above](https://ci.opensearch.org/ci/dbc/builds/1.1.0/313/x64/manifest.yml) to assemble a distribution.
   ```
   bundle-workflow/assemble.sh artifacts/manifest.yml
   ```

Artifacts are [published to ci.opensearch.org](https://github.com/opensearch-project/opensearch-build/blob/0ac7e2bfcf6adbbd49d7a2b3fff59bb9eea28a61/bundle-workflow/Jenkinsfile#L115). For example, [here's an x64 build manifest](https://ci.opensearch.org/ci/dbc/builds/1.1.0/313/x64/manifest.yml) and a [distribution manifest](https://ci.opensearch.org/ci/dbc/bundles/1.1.0/313/x64/manifest.yml) from build #313. If you examine the latter, you'll find [a link to opensearch-1.1.0-linux-x64.tar.gz](https://ci.opensearch.org/ci/bundles/1.1.0/313/opensearch-1.1.0-linux-x64.tar.gz) and [opensearch-min-1.1.0-linux-x64.tar.gz](https://ci.opensearch.org/ci/builds/1.1.0/313/bundle/opensearch-min-1.1.0-linux-x64.tar.gz).

In parallel, a snapshot build builds and pushes `-SNAPSHOT` maven artifacts to [aws.oss.sonatype.org](https://aws.oss.sonatype.org/content/repositories/snapshots/org/opensearch/). 

Unlike snapshots, release artifacts are signed. The signing step takes the manifest file created from the build step, and signs all its component artifacts using a tool called `opensearch-signer-client` (in progress of being open sourced). These release candidate artifacts are staged, tested, and final releases are promoted to [Maven Central](https://repo1.maven.org/maven2/org/opensearch/) manually.

A [test workflow](https://github.com/opensearch-project/opensearch-build/blob/0ac7e2bfcf6adbbd49d7a2b3fff59bb9eea28a61/bundle-workflow/README.md#test-the-bundle) is executed for each build, and consisting of integration, backwards compatibility and performance tests. The [test orchestrator pipeline](https://github.com/opensearch-project/opensearch-build/tree/main/bundle-workflow/jenkins_workflow/test) and how to run tests locally will be a topic for a future blog post.

Here's a quick cheat-sheet for reproducing the build process for a complete distribution of OpenSearch. You will need additional tools, including `maven` and `cmake`, to compile some of the components.

```sh
git clone https://github.com/opensearch-project/opensearch-build
cd opensearch-build
./bundle-workflow/build.sh manifests/opensearch-1.1.0.yml
./bundle-workflow/assemble.sh manifests/opensearch-1.1.0.yml
```

This system will be reused for OpenSearch Dashboards in 1.2, see [opensearch-build#158](https://github.com/opensearch-project/opensearch-build/issues/158).

The signing process continues, for now, to rely on an existing signing system and all our jobs run from a private Jenkins setup. This is entirely for historical reasons. The OpenSearch team at AWS relies on a significant amount of costly hardware procured and managed by AWS (e.g. I use a c5.18xlarge instance for development). We are in the process of making the Jenkins instance public, open-sourcing its CDK setup, and open-sourcing all remaining tools.

The build process described above runs parallel to development of individual components. It's always challenging to code against moving dependencies, and we are starting to think about the long term future of these systems. We'd like to untangle the monolith, enable plugins to declare a compatibility matrix, and much more. In the meantime, we welcome anyone who would like to brush up their Python skills by contributing to [the opensearch-build scripts](https://github.com/opensearch-project/opensearch-build), and could use some help bringing OpenSearch and OpenSearch Dashboards to various OS-specific distribution mechanisms similar to [this community port to FreeBSD](https://github.com/opensearch-project/opensearch-build/issues/101).
