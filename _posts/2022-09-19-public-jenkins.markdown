---
layout: post
title:  "OpenSearch automated build system is now live"
authors: 
  - sayaligaikawad
date: 2022-09-14 01:01:01 -0700
categories: 
  - community
---

OpenSearch project deployed automated build, test, and release infrastructure that supports the end-to-end lifecycle of public distributions along with the launch of 2.3.0 version. This includes the migration of OpenSearch Gradle check workflows that are executed on every PR merge, to the public infrastructure. Community users can now view logs by accessing the [build infrastructure](https://build.ci.opensearch.org/) to understand the current state of their workflows and monitor runs as needed.

This build system will act as a continuous integration and continuous deployment (CI / CD) system that triggers the generation of distribution builds along with automated execution of integration, backward compatibility and performance tests for every build. The enhanced process will also automatically publish the artifacts to target distribution channels including but not limited to Docker, S3, cloud front, Maven etc. The plugin developers can on-board their plugin artifacts in to OpenSearch distributions by adding the component to the distribution input manifest file. The onboarding plugin will need to provide information such as GitHub repository url, the branch which needs to be built, what platforms does the plugin support and checks to run on the component such as version check, dependency check, etc. See [example](https://github.com/opensearch-project/opensearch-build/blob/main/manifests/1.3.0/opensearch-1.3.0.yml#L29-L34). The end to end build process will use the information on the file to build, assemble, test and publish the artifacts to corresponding distribution targets.

The build system is deployed using infrastructure as code that uses AWS CDK. The build infrastructure is completely reproducible and consumes [opensearch-ci](https://github.com/opensearch-project/opensearch-ci) repository as its source. The[readme.md](https://github.com/opensearch-project/opensearch-ci/blob/main/README.md) file in [opensearch-ci](https://github.com/opensearch-project/opensearch-ci) repo provides the instructions to reproduce this infrastructure. External contributors can contribute to the build ecosystem by raising the PR on [this](https://github.com/opensearch-project/opensearch-ci) GitHub repository for any future enhancements, bug fixes and new features. 

## Motivation

Before now, setting up the test and build infrastructure was a tedious process that required a lot of manual intervention and development effort to make changes and updates. Also, the infrastructure used for building and releasing the artifacts was not reproducible, and teams were finding it hard to track the status of builds due to limited visibility into the build process. This created discrepancies between the development team in terms of building, testing, and debugging the artifact builds during every release. 

The manual processes also added additional overhead for the development teams to create, own and maintain their own automation build process mimicking our process. The new system automates all the manual steps involved in creating, managing, maintaining and monitoring the DevOps stack for OpenSearch distribution builds to improve reproducibility along with developer and release velocity.

### OpenSearch CI / CD infrastructure design:

![Figure 1: Jenkins Infrastructure Overview]({{ site.baseurl }}assets/media/blog-images/2022-09-19-public-jenkins.markdown/jenkins.png){: .img-fluid }**Figure 1**: Jenkins Infrastructure Overview

### Overview of the Jenkins workflow(s):

All the workflows are managed via source controlled code located in the [GitHub](https://github.com/opensearch-project/opensearch-build/tree/main/jenkins).

* [Distribution-build-opensearch](https://build.ci.opensearch.org/job/distribution-build-opensearch/): The all-in-one pipeline to clone, build, assemble, store OpenSearch and its related plugin artifacts in one click. It currently supports LINUX tarball, Linux RPM artifacts. We are in the process of adding MacOS tarball, Windows Zip.
* [Distribution-build-opensearch-dashboards](https://build.ci.opensearch.org/job/distribution-build-opensearch-dashboards/): The all-in-one pipeline to clone, build, assemble, store OpenSearch Dashboards and its related plugin artifacts in one click. It currently supports LINUX tarball, Linux RPM artifacts. We are in the process of adding MacOS tarball, Windows Zip.
* [Check-for-build](https://build.ci.opensearch.org/job/check-for-build/): This workflow will periodically check out latest changes/commits in opensearch-project repositories and trigger the above distribution-build workflows.
* [Integ-test](https://build.ci.opensearch.org/job/integ-test/): The integration tests for OpenSearch plugins are triggered and run here.
* [Integ-test-opensearch-dashboards:](https://build.ci.opensearch.org/job/integ-test-opensearch-dashboards/) The integration tests for OpenSearch-Dashboards plugins are triggered and run here.
* [Distribution-promote-artifacts](https://build.ci.opensearch.org/job/distribution-promote-artifacts/): The one click workflow to pull, sign, and push OpenSearch/Dashboards related artifacts from staging to production, including Linux tarball, Linux RPM, etc.
* [Distribution-promote-yum-repos](https://build.ci.opensearch.org/job/distribution-promote-yum-repos/): Similar to above, but for YUM repository promotion specifically.
* [Docker-build](https://build.ci.opensearch.org/job/docker-build/): The workflow to build both ci runner docker images as well as docker images for OpenSearch/Dashboards and others.
* [Docker-copy:](https://build.ci.opensearch.org/job/docker-copy/) The workflow to copy docker images between different repos, the foundation of docker-promotion workflow.
* [Docker-promotion:](https://build.ci.opensearch.org/job/docker-promotion/) The workflow to promote docker images from staging registry to both production docker hub and AWS ECR.
* [Whitesource-scan](https://build.ci.opensearch.org/job/whitesource-scan/): The workflow to trigger CVE scanning on a daily basis using whitesource/mend toolchain.
* [Gradle-check:](https://build.ci.opensearch.org/job/gradle-check/) The heavy-weight gradle check workflow that serves the PR checks for OpenSearch repository.

## Benefits:

Manually executing the build, test and release steps is a time consuming process as it adds a lot of manual overhead, human errors in executing, monitoring and reporting the outcome of each of the above steps. This is also not sustainable and scalable for frequent builds (i.e. hourly, nightly builds). The enhanced end to end distribution generation system helps us to overcome these gaps by automating the steps to build, test and publish the distribution artifact on a regular cadence. The automation process will not only surface the issues, gaps, blockers on time but will also help us to move faster by producing builds at a faster pace. This will reduce the resource bottle neck as we have limited manual overhead in generating distribution builds. This process will allow us to release the major, minor and patch versions quickly and frequently on time.

With the build, test and release infrastructure being ready and public, community can now access, view and contribute to the infrastructure as well as workflows that builds the OpenSearch and OpenSearch dashboards distributions. As a user with **_anonymous_** role, you can view all the available jobs, logs, packaged artifacts and Gradle checks related to OpenSearch and OpenSearch Dashboards workflows.


## Wrapping it up

Our primary goal of this project is to improve the reproducibility and transparency of OpenSearch build infrastructure with the open source community. The build, release and test infrastructure used by OpenSearch project can be easily reproduced by following the steps documented in [readme.md](https://github.com/opensearch-project/opensearch-ci/blob/main/README.md) file that uses “infrastructure as a code” to reproduce the infrastructure. Contributors can now contribute to this infrastructure by submitting their code via PR to https://github.com/opensearch-project/opensearch-ci repository. The community can also contribute to the build, release and test workflows deployed on this infrastructure by submitting their code via PR  to https://github.com/opensearch-project/opensearch-build repository.  To learn more be sure to check out the [getting started page](https://github.com/opensearch-project/opensearch-ci#getting-started). Additionally, if you find any issues or have questions, feel free to either create an [issue](https://github.com/opensearch-project/opensearch-ci/issues) on GitHub or ask a question on the [forum](https://forum.opensearch.org/c/build/12)!


