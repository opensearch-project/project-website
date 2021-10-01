---
layout: post
title:  "Automated testing for OpenSearch releases"
authors: 
  - setiah
date: 2021-10-01
categories: 
  - technical-post
twittercard:
  description: "This post details the automated testing process for OpenSearch releases"
---

# Automated testing for OpenSearch releases

OpenSearch releases many distributions across multiple platform flavors as part of a new version release. These distributions are fundamentally of two kinds - the full distribution that includes all OpenSearch plugins packaged with OpenSearch core, and the min distribution which is just the core without any plugins. These release distributions go through a rigorous testing process across multiple teams, before they are signed off as release ready. This includes validating unit test coverage, integration testing across all components to validate the behavior, backward compatibility testing to ensure upgrade compatibility with previous versions, and stress testing to validate the performance metrics. Once these distributions are successfully tested and hardened, they are marked ready for the release.

The rigorous release process provides good confidence in the quality of the release. However, for the most part it has been largely manual and non-standardized across plugins so far. Each plugin team used to validate their component by running tests on the distribution and provide their sign off. With dozens of OpenSearch plugins released as part of full distribution, the turn around time for testing was high. Also, lack of a continuous integration and testing process, would lead to finding new bugs at the time of release, which would further add to release times. 

To overcome these problems, we built an automated testing framework for OpenSearch releases that should simplify and standardize the testing process across all components of a release distribution. 

The way it works is once a new bundle is ready, the `build-workflow`, that builds the release bundle (explained [here](https://github.com/opensearch-project/project-website/pull/293/files)), kicks off the `test-orchestrator-pipeline` with parameters that uniquely identify the bundle in S3. The test orchestrator-pipeline, is a jenkins pipeline based on this [JenkinsFile](https://github.com/opensearch-project/opensearch-build/blob/main/bundle-workflow/jenkins_workflow/test/orchestrator/Jenkinsfile). It orchestrates the test workflow, which consists of three test suites - `integ-test, bwc-test, perf-test`, to run in parallel. Each of these test suites is a [jenkins pipeline](https://github.com/opensearch-project/opensearch-build/blob/main/bundle-workflow/jenkins_workflow/test/testsuite/Jenkinsfile) that executes the respective test type. 

Like build-workflow, these test workflows are manifest file based. `integ-test` workflow, reads bundle manifest file to identify the type and components of a bundle under test. It pulls all maven and build dependencies for running integration tests on the bundle from s3. These dependencies are built as part of build-workflow and re-used while testing. After pulling the dependencies, it runs integration tests for each component in the distribution, based on the component test config defined in a [manifest file](https://github.com/opensearch-project/opensearch-build/blob/main/bundle-workflow/src/test_workflow/config/test_manifest.yml). It spins a new dedicated local cluster to test each test config and tears down the cluster after the test run completes. The test and the cluster logs are published to S3 after the test suite is complete. `bwc-test` suite runs similar to `integ-test` suite but it supports only the OpenSearch core testing at present. `perf-test` suite runs rally tracks on a dedicated external cluster. This piece is currently in development.

Once all test suites complete, the notifications job sends out notifications to all subscribed channels. Below figure illustrates how different components of the test workflow interact with each other. 

![Figure 1: Automated test workflow]({{ site.baseurl }}/assets/media/blog-images/assets/media/blog-images/2021-10-01-automated-testing-for-opensearch-releases/figure1.png){: .img-fluid }

This automated testing workflow will be used to test snapshot builds as well. It will enable continuous integration and testing on OpenSearch artifacts, which should help make the release process faster. It will provide a quick feedback loop which would help surface issues sooner. It will enable us to run nightly benchmarks to quickly detect and isolate commits that cause regression. It will standardize the testing and release process across all plugins and enforce strong quality control checks. This would also help users, who have upstream dependency on OpenSearch, upgrade to newer version quickly by using frequent release candidate builds.

The code is entirely [open source](https://github.com/opensearch-project/opensearch-build) and development work is being tracked on this [project board](https://github.com/opensearch-project/opensearch-build/projects/3). Currently, the `test workflow` requires the artifacts to be available in S3. We plan to extend this to allow the `test workflow` to read artifacts from local file system as well, which would enable developers to build and test everything locally. We also plan to extend backward compatibility testing and performance testing to support more components and configurations. We welcome your comments and contributions to make this system better and more useful for everyone.

