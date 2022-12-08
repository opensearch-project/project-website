---
layout: post
title:  "OpenSearch automated build system is now live"
authors: 
  - sayaligaikawad
date: 2022-10-24 01:01:01 -0700
categories: 
  - community
redirect_from: "/blog/community/2022/10/public-jenkins/"
---

The OpenSearch Project deployed automated build, test, and release infrastructure that supports the end-to-end lifecycle of public distributions with the launch of [OpenSearch 2.3.0](https://opensearch.org/blog/releases/2022/09/opensearch-2-3-is-ready-for-download/). This includes the migration of OpenSearch Gradle check workflows that are run on every PR merge to the public infrastructure. Community members can now view logs by accessing the [build infrastructure](https://build.ci.opensearch.org/) to understand the current state of their workflows and monitor runs as needed.

This build system act as a continuous integration and continuous deployment (CI/CD) system that triggers the generation of distribution builds along with automated execution of integration, backward compatibility, and performance tests for every build. The enhanced process also automatically publishes the artifacts to target distribution channels, including Docker, Amazon Simple Storage Service (Amazon S3), Amazon CloudFront, and Maven. Plugin developers can onboard their plugin artifacts into OpenSearch distributions by adding the component to the distribution input manifest file. The onboarding plugin will need to provide information such as the GitHub repository URL, the branch that needs to be built, the platforms the plugin supports, and the checks to run on the component, such as a version check and dependency check. See [example](https://github.com/opensearch-project/opensearch-build/blob/main/manifests/1.3.0/opensearch-1.3.0.yml#L29-L34) for information on how to add the onboarding plugin to the manifest. The end-to-end build process uses the information in the file to build, assemble, test, and publish the artifacts to the corresponding distribution targets.

The build system is deployed using infrastructure as code (IaC) that uses AWS Cloud Development Kit (AWS CDK). The build infrastructure is completely reproducible and consumes the [opensearch-ci](https://github.com/opensearch-project/opensearch-ci) repository as its source. The [readme.md](https://github.com/opensearch-project/opensearch-ci/blob/main/README.md) file in the [opensearch-ci](https://github.com/opensearch-project/opensearch-ci) repository provides the instructions for reproducing this infrastructure. External contributors can contribute to the build ecosystem by creating a pull request in [this](https://github.com/opensearch-project/opensearch-ci) GitHub repository for any future enhancements, bug fixes, or new features.  

## Motivation

Before now, setting up the test and build infrastructure was a tedious process that required a lot of manual intervention and development effort in order to make changes and updates. Also, the infrastructure used for building and releasing the artifacts was not reproducible, and teams were finding it difficult to track the status of builds due to limited visibility into the build process. This created discrepancies among the development teams in terms of building, testing, and debugging the artifact builds during every release.

The manual processes also required development teams to create, own, and maintain their own automation build process, mimicking the manual build process. The new system automates all the manual steps involved in creating, managing, maintaining, and monitoring the DevOps stack for OpenSearch distribution builds in order to improve reproducibility and developer and release velocity.

### OpenSearch CI/CD infrastructure design
Figure 1 depicts a high-level overview of the CI system architecture.

![Figure 1: Jenkins Infrastructure Overview]({{ site.baseurl }}/assets/media/blog-images/2022-10-24-public-jenkins.markdown/jenkins.png){: .img-fluid }**Figure 1**: Jenkins Infrastructure Overview

### Overview of the Jenkins workflow(s)

All the workflows are managed through source-controlled code located in the [GitHub repository](https://github.com/opensearch-project/opensearch-build/tree/main/jenkins):

* [Distribution-build-opensearch](https://build.ci.opensearch.org/job/distribution-build-opensearch/): The all-in-one pipeline used to clone, build, assemble, and store OpenSearch and its related plugin artifacts with one click. It currently supports Linux tarball and Linux RPM artifacts. We are in the process of adding MacOS tarball and Windows zip.
* [Distribution-build-opensearch-dashboards](https://build.ci.opensearch.org/job/distribution-build-opensearch-dashboards/): The all-in-one pipeline used to clone, build, assemble, and store OpenSearch Dashboards and its related plugin artifacts with one click. It currently supports LINUX tarball and Linux RPM artifacts. We are in the process of adding MacOS tarball and Windows zip.
* [Check-for-build](https://build.ci.opensearch.org/job/check-for-build/): This workflow will periodically check out the latest changes/commits in opensearch-project repositories and trigger the above distribution-build workflows.
* [Integ-test](https://build.ci.opensearch.org/job/integ-test/): The integration tests for OpenSearch plugins are initiated and run here.
* [Integ-test-opensearch-dashboards](https://build.ci.opensearch.org/job/integ-test-opensearch-dashboards/): The integration tests for OpenSearch Dashboards plugins are initiated and run here.
* [Distribution-promote-artifacts](https://build.ci.opensearch.org/job/distribution-promote-artifacts/): The one-click workflow used to pull, sign, and push OpenSearch and OpenSearch Dashboards artifacts from staging to production, including Linux tarball and Linux RPM.
* [Distribution-promote-yum-repos](https://build.ci.opensearch.org/job/distribution-promote-yum-repos/): This workflow is similar to the [Distribution-promote-artifacts](https://build.ci.opensearch.org/job/distribution-promote-artifacts/) workflow but is for YUM repository promotion specifically.
* [Docker-build](https://build.ci.opensearch.org/job/docker-build/): The workflow used to build both CI runner Docker images and Docker images for OpenSearch, OpenSearch Dashboards, and others.
* [Docker-copy](https://build.ci.opensearch.org/job/docker-copy/): The workflow used to copy Docker images between different repositories and the foundation of the [Docker-promotion](https://build.ci.opensearch.org/job/docker-promotion/) workflow.
* [Docker-promotion](https://build.ci.opensearch.org/job/docker-promotion/): The workflow used to promote Docker images from the staging registry to both production Docker Hub and Amazon Elastic Container Registry (Amazon ECR).
* [Whitesource-scan](https://build.ci.opensearch.org/job/whitesource-scan/): The workflow used to trigger CVE scanning on a daily basis using the whitesource/Mend toolchain.
* [Gradle-check](https://build.ci.opensearch.org/job/gradle-check/): The heavyweight Gradle check workflow that serves the PR checks for the OpenSearch repository.

## Benefits

Manually running the build, test, and release steps is a time-consuming process that adds a lot of manual overhead and human error in running, monitoring, and reporting the outcome of each build. This is not sustainable or scalable for frequent builds (that is, hourly, nightly builds). The enhanced end-to-end distribution generation system helps us to overcome these gaps by automating the steps required to build, test, and publish the distribution artifact on a regular cadence. The automation process not only surfaces issues, gaps, and blockers on time but also helps us move faster by producing builds at a faster pace. This reduces the resource congestion, as we have limited manual overhead in generating distribution builds. This process allows us to release the major, minor, and patch versions quickly, frequently, and on time.

Now that the build, test, and release infrastructure is public, the community can access, view, and contribute to the infrastructure as well as workflows that build the OpenSearch and OpenSearch Dashboards distributions. As a user with the **_anonymous_** role, you can view all the available jobs, logs, packaged artifacts, and Gradle checks related to OpenSearch and OpenSearch Dashboards workflows.


## Wrapping it up

The primary goal of this project is to improve the reproducibility and transparency of the OpenSearch build infrastructure. The build, release, and test infrastructure used by the OpenSearch Project is easily reproduced by following the steps documented in the [readme.md](https://github.com/opensearch-project/opensearch-ci/blob/main/README.md) file, which uses IaC to reproduce the infrastructure. Contributors can now contribute to this infrastructure by submitting their code in a pull request to the [opensearch-ci](https://github.com/opensearch-project/opensearch-ci) repository. The community can also contribute to the build, release, and test workflows deployed on this infrastructure by submitting their code in a pull request to the [opensearch-build](https://github.com/opensearch-project/opensearch-build) repository. To learn more, check out the [Getting Started page](https://github.com/opensearch-project/opensearch-ci#getting-started). Additionally, if you find any issues or have questions, feel free to either create an [issue](https://github.com/opensearch-project/opensearch-ci/issues) on GitHub or ask a question on the [forum](https://forum.opensearch.org/c/build/12)!
