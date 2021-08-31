---
layout: post
title:  "Building OpenSearch 1.1 Distributions"
authors: 
  - dblock
date: 2021-08-31
categories: 
  - technical-post
twittercard:
  description: "This post details how we produce reliable and repeatable distributions of OpenSearch."
---
The OpenDistro for Elasticsearch (ODFE) was essentially a package containing Elasticsearch OSS and a dozen open-source plugins. Its release process began by picking up a stable version of Elasticsearch OSS, incrementing all the plugin version numbers, and going through a development cycle. Plugins went from `-SNAPSHOT` to `-beta`, then `-rc`, then finally to a release.

This worked well until the [OpenSearch fork](https://aws.amazon.com/blogs/opensource/introducing-opensearch/). It was decided that OpenSearch would be a product with two distributions at launch: a full distribution that includes a dozen plugins, and a minimal distribution without any plugins. This made sense because most customers either wanted a well tested distribution with everything, or are technically savvy enough to assemble their favorite flavor of all the things. 

The full distribution of OpenSearch was similar to ODFE, but with one major difference - the OpenSearch service would be developed in parallel with the plugins. The complete OpenSearch distribution became effectively a monolith spanning multiple GitHub repositories. You just can't both develop all the moving parts simultaneously, and have stable dependencies of [OpenSearch](https://github.com/opensearch-project/OpenSearch), [common-utils](https://github.com/opensearch-project/common-utils), [job-scheduler](https://github.com/opensearch-project/job-scheduler), to name a few, at the same time.

To produce a reliable monolith that can be trusted we decided to build the entire distribution from source. We developed a [manifest-based workflow](https://github.com/opensearch-project/opensearch-build/tree/main/bundle-workflow) to accomplish this, which consists of the following steps.

1. Take an input manifest ([example](https://github.com/opensearch-project/opensearch-build/blob/main/manifests/opensearch-1.1.0.yml)), build all components from source, and generate a build manifest. Today we build x64 and arm64 flavors.
2. Take a build manifest ([example](https://github.com/opensearch-project/opensearch-build/blob/main/bundle-workflow/tests/tests_manifests/data/opensearch-build-1.1.0.yml)) and assemble a distribution.
3. Sign the artifacts.
4. Run integration, backwards-compatibility, performance, and upgrade tests against the assembled distribution.
5. Publish maven artifacts to our snapshot maven repository and the distributions to S3.

Here's all the inputs and outputs for OpenSearch 1.1.

* Maven releases are staged in the [AWS OSS Maven Repository](https://aws.oss.sonatype.org/content/repositories/releases/org/opensearch/) before being promoted to Maven Central. 
* TODO

You can reproduce the build and test process by checking out [opensearch-build](https://github.com/opensearch-project/opensearch-build/) and running it yourself. You will need additional tools, including `maven` and `cmake`, to compile some of the components.

```
./bundle-workflow/build.sh manifests/opensearch-1.1.0.yml
./bundle-workflow/assemble.sh manifests/opensearch-1.1.0.yml

TODO: test
```

We're in the process of reusing this system for OpenSearch Dashboards, see [opensearch-build#158](https://github.com/opensearch-project/opensearch-build/issues/158).

The signing process continues, for now, to rely on an existing signing system and all our jobs run from a private Jenkins setup. This is entirely for historical reasons. We also rely on a significant amount of costly hardware that is donated, procured and managed by AWS (I personally use a c5.18xlarge). We are in the process of making the Jenkins instance public, open-sourcing its CDK setup, and open-sourcing any remaining tools.

The distribution build process runs parallel to development of individual components. It's always challenging to develop against moving depenencies, and we are starting to think about the long term future of these systems. We'd like to untangle the monolith, enable plugins to declare a compatibility matrix, and much more.
