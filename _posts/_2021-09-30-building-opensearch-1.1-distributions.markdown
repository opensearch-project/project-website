---
layout: post
title:  "Building OpenSearch 1.1 Distributions"
authors: 
  - dblock
date: 2021-09-30
categories: 
  - technical-post
twittercard:
  description: "This post details how the OpenSearch project produces reliable and repeatable distributions."
---
The Open Distro for Elasticsearch was a package containing open source Elasticsearch and a dozen open source plugins. Open Distro's release process began by picking up a stable version of Elasticsearch OSS, incrementing all the plugin version numbers, and going through a development cycle. Plugins went from `-SNAPSHOT` to `-beta`, then `-rc`, then finally to a release.

This worked well until the [OpenSearch fork](https://aws.amazon.com/blogs/opensource/introducing-opensearch/). It was decided that OpenSearch would be a product with two distributions at launch: a full distribution that includes a dozen plugins, and a minimal distribution without any plugins. This made sense because most users either wanted a well-tested distribution with everything, or preferred to assemble their favorite flavor of all the parts.

The full distribution of OpenSearch 1.0 was similar to Open Distro, but with one major difference - the OpenSearch fork of Elasticsearch OSS would be developed in parallel with their plugins. The complete distribution of OpenSearch became effectively monoliths spanning multiple GitHub repositories. One cannot develop all the moving parts simultaneously, while having stable dependencies of [OpenSearch](https://github.com/opensearch-project/OpenSearch), [common-utils](https://github.com/opensearch-project/common-utils), [job-scheduler](https://github.com/opensearch-project/job-scheduler), to name a few.

The entire distribution is built from source end-to-end in [this Jenkinsfile](https://github.com/opensearch-project/opensearch-build/blob/0ac7e2bfcf6adbbd49d7a2b3fff59bb9eea28a61/bundle-workflow/Jenkinsfile) by invoking [this manifest-based workflow](https://github.com/opensearch-project/opensearch-build/tree/main/bundle-workflow). This includes a release and a snapshot build for x64 and arm64 CPU architectures. 

1. Take an input manifest, build all components from source, and generate a build manifest, e.g. `bundle-workflow/build.sh [manifests/1.1.0/opensearch-1.1.0.yml](https://github.com/opensearch-project/opensearch-build/blob/main/manifests/opensearch-1.1.0.yml)`.
2. Use the build manifest produced above, and assemble a distribution, e.g. `bundle-workflow/assemble.sh [artifacts/manifest.yml](https://github.com/opensearch-project/opensearch-build/blob/main/bundle-workflow/tests/tests_manifests/data/opensearch-build-1.1.0.yml)`.

Artifacts are published to S3, and a snapshot build pushes `-SNAPSHOT` maven artifacts to [aws.oss.sonatype.org](https://aws.oss.sonatype.org/content/repositories/snapshots/org/opensearch/).

Release artifacts are signed. The signing step takes the manifest file created from the build step, and signs all its component artifacts using a tool called `opensearch-signer-client` (in progress of being open sourced), e.g. `bundle-workflow/sign.sh [bundle/manifest.yml](https://github.com/opensearch-project/opensearch-build/blob/main/bundle-workflow/tests/tests_manifests/data/opensearch-bundle-1.1.0.yml)`.

A [test workflow](https://github.com/opensearch-project/opensearch-build/blob/0ac7e2bfcf6adbbd49d7a2b3fff59bb9eea28a61/bundle-workflow/README.md#test-the-bundle) consisting of integration, backwards compatibility and performance tests is executed against each distribution.

Non-snapshot artifacts are staged, tested, and final releases are promoted to [Maven Central](https://repo1.maven.org/maven2/org/opensearch/).

Here's a quick cheat-sheet for reproducing the build and test process. You will need additional tools, including `maven` and `cmake`, to compile some of the components.

```sh
git clone https://github.com/opensearch-project/opensearch-build
cd opensearch-build
./bundle-workflow/build.sh manifests/opensearch-1.1.0.yml
./bundle-workflow/assemble.sh manifests/opensearch-1.1.0.yml
```

This system is being reused for OpenSearch Dashboards, see [opensearch-build#158](https://github.com/opensearch-project/opensearch-build/issues/158).

The signing process continues, for now, to rely on an existing signing system and all our jobs run from a private Jenkins setup. This is entirely for historical reasons. The OpenSearch team at AWS relies on a significant amount of costly hardware procured and managed by AWS (I personally use a c5.18xlarge). We are in the process of making the Jenkins instance public, open-sourcing its CDK setup, and open-sourcing any remaining tools.

The build process described above runs parallel to development of individual components. It's always challenging to code against moving dependencies, and we are starting to think about the long term future of these systems. We'd like to untangle the monolith, enable plugins to declare a compatibility matrix, and much more. In the meantime, we welcome anyone who would like to brush up their Python skills by contributing to [the opensearch-build scripts](https://github.com/opensearch-project/opensearch-build), and could use some help bringing OpenSearch and OpenSearch Dashboards to various OS-specific distribution mechanisms similar to [this community port to FreeBSD](https://github.com/opensearch-project/opensearch-build/issues/101).
