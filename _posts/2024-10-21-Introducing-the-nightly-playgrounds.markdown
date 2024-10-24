---
layout: post
title: Introducing the Nightly Playgrounds
authors:
   - sayaligaikawad
date: 2024-10-21
categories:
  - technical-posts
excerpt: 
meta_keywords: 
meta_description: 
---

We are pleased to announce the launch of  [Nightly Playgrounds](https://playground.nightly.opensearch.org/). This environment provides a dynamic preview of your work within a fully deployed distribution cluster for the upcoming versions of OpenSearch and OpenSearch Dashboards. As the name suggest, this live demo environment hosts clusters deployed using the latest successful and validated nightly build artifacts of both OpenSearch and OpenSearch Dashboards. The [OpenSearch](https://build.ci.opensearch.org/view/Build/job/distribution-build-opensearch/) and [OpenSearch Dashboards](https://build.ci.opensearch.org/view/Build/job/distribution-build-opensearch-dashboards/) distributions are built daily that includes actively developed features for upcoming 2.x and 3.0 version.


### What can you do in Nightly Playground environment?

Similar to current [playground](https://playground.opensearch.org/app/home), every user has anonymous, read-only access, allowing you to try new features and explore preconfigured sample data. You can interact with sample dashboards, data visualizations, and data sources without installing and configuring OpenSearch or OpenSearch Dashboards in your own environment. In order to enhance the permissions in future, the nightly playgrounds are integrated with GitHub as an OpenID Connect.


### High Level Architecture Diagram:

Nightly playground environments are provisioned utilizing daily-built x64 Linux tarballs of OpenSearch and OpenSearch Dashboards on AWS EC2 instances, orchestrated through the AWS Cloud Development Kit (CDK). The deployment process is facilitated by GitHub Actions, ensuring seamless integration with cloud infrastructure. In addition to the default configurations, the security settings have been meticulously tailored to enable GitHub as an OpenID Connect (OIDC) provider. The nightly playgrounds use [opensearch-cluster-cdk](https://github.com/opensearch-project/opensearch-cluster-cdk) as the upstream dependency to deploy the highly customizable cluster. 

![High-Level-Architecture-Diagram](/assets/media/blog-images/2024-10-21-Introducing-the-nightly-playgrounds/nightly_playground.png){:class="img-centered"}

### Frequently Asked Questions

* **Where can we access the nightly playgrounds?**
    Nightly playgrounds can be accessed at https://playground.nightly.opensearch.org/. You can select the version you wish to explore, with current support for the upcoming 2.x and 3.0 releases.



* **Which commit was used to build this distribution that is current deployed?**
    Every user by default has the read-only access to these clusters. The entire distribution manifest containing details such as component name, repository, GitHub reference and commit_id is indexed in the cluster as a part of the automation. Simply go to the `dev-tools` and run the below query:
    
    For OpenSearch components’ details:

```
  GET opensearch/_doc/1
```

For OpenSearch Dashboards components' details:

```
  GET opensearch-dashboards/_doc/1
```

This will give you components present in the deployed cluster along with the commit_id and the artifact location.

* **Why are certain components/plugins missing from the cluster/distribution?**
    If a component is absent from the distribution, it indicates that it failed to build during the distribution process. However, the nightly builds will continue even if a component encounters an error. This ensures that the overall build process remains unaffected by individual component failures, allowing for uninterrupted progress. Please visit the corresponding component repository and search for build failure autocut issues. Example: https://github.com/opensearch-project/security-analytics/issues/904
    
* **What if we need more data indexed into these cluster?**
    Please feel free to create a GitHub [issue](https://github.com/opensearch-project/opensearch-devops/issues) or pull request with the required data that you need in these clusters. The maintainers will review the data for security and sensitive information and help it index into the cluster.



* **What if we need more permissions to test different features on these clusters?**
    We recently integrated nightly playgrounds with GitHub as an OIDC. As of now, all logged in users have read-only access to the cluster. We plan to enhance these permissions using their GitHub handles in future. Please create a GitHub [issue](https://github.com/opensearch-project/opensearch-devops/issues) to request required permissions along with your GitHub handle.
    

### Wrapping it up!

The primary motivation of this project is to facilitate experimentation with new and forthcoming features, gather early feedback and allow users to witness enhancements in real-time as they are integrated into the distribution. One of the future objectives for the nightly playgrounds is to utilize them during release cycles to facilitate efficient debugging of the release candidates.
Check out the reproducible infrastructure as a code in [GitHub](https://github.com/opensearch-project/opensearch-devops/tree/main/nightly-playground). More details can be found in the meta [issue](https://github.com/opensearch-project/opensearch-devops/issues/129).
Please feel free to provide us feedback, request features and contribute to make nightly playgrounds better. 

