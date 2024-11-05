---
layout: post
title: "Introducing OpenSearch nightly playgrounds: Preview new OpenSearch features live"
authors:
   - sayaligaikawad
   - kolchfa
date: 2024-11-05
categories:
  - community
meta_keywords: OpenSearch nightly playgrounds, OpenSearch Dashboards, demo environment, OpenSearch features, live preview, feedback, GitHub integration, open source, community
meta_description: Explore OpenSearch's nightly playgrounds—a live demo environment with early access to the latest OpenSearch and OpenSearch Dashboards features. Experiment with new updates, provide feedback, and contribute to an evolving OpenSearch experience.
---

We're excited to introduce [nightly playgrounds](https://playground.nightly.opensearch.org/)—a dynamic environment where you can explore upcoming versions of OpenSearch and OpenSearch Dashboards in a fully deployed distribution cluster. This live demo environment hosts clusters running the latest validated nightly build artifacts, giving you preview access to the latest features in the 2.x and 3.x versions of [OpenSearch](https://build.ci.opensearch.org/view/Build/job/distribution-build-opensearch/) and [OpenSearch Dashboards](https://build.ci.opensearch.org/view/Build/job/distribution-build-opensearch-dashboards/).

The goal of nightly playgrounds is to let you experiment with new features as they're developed, provide feedback early, and see improvements as they're integrated into the distribution.

## What you can do in nightly playgrounds

Just like the current [OpenSearch Playground](https://playground.opensearch.org/app/home), nightly playgrounds give you anonymous, read-only access to try out new features and explore preconfigured sample data:

* **Preview new features**
    - Interact with sample dashboards, visualizations, and data sources—no installation or configuration of OpenSearch or OpenSearch Dashboards required. You can explore newly built features overnight and provide feedback that contributes to the final release.

* **Speed up debugging**
    - Nightly playgrounds proved valuable during the 2.16 release, helping to quickly spot issues with the Alerting Dashboards plugin. These clusters are ready to use at any time for everyday debugging, including during release cycles.

* **Support documentation efforts**
    - OpenSearch technical writers use nightly playgrounds to verify technical aspects of new documentation submitted to the [documentation repo](https://opensearch.org/docs/latest/). This includes documentation for upcoming features, enhancements, and fixes. With GitHub integration as an OpenID Connect (OIDC) provider, the documentation team has improved access, which streamlines documentation development by removing the need for separate clusters for verification.

## How nightly playgrounds are set up

Nightly playgrounds are deployed daily on Amazon Elastic Compute Cloud (Amazon EC2) instances using x64 Linux tarballs of OpenSearch and OpenSearch Dashboards that are managed through the AWS Cloud Development Kit (AWS CDK). GitHub Actions automates deployment, ensuring smooth integration with cloud infrastructure. In addition to the default configurations, security settings enable GitHub as an OIDC provider, allowing for controlled access. The nightly playgrounds rely on [opensearch-cluster-cdk](https://github.com/opensearch-project/opensearch-cluster-cdk) for deploying highly customizable clusters.

The following diagram shows the high-level architecture of the nightly playgrounds.

![High-Level Architecture Diagram](/assets/media/blog-images/2024-10-21-Introducing-the-nightly-playgrounds/nightly_playground.png){:class="img-centered"}

## FAQs

* **Where can I access nightly playgrounds?**
    - Nightly playgrounds are available at [the nightly playground website](https://playground.nightly.opensearch.org/) and are currently supporting the upcoming 2.x and 3.x releases. You can select the version(s) that you want to explore.

* **How can I find the commit used to build the deployed distribution?**
    - Every user has read-only access to these clusters. The distribution manifest containing details such as component name, repository, GitHub reference, and commit ID is automatically indexed in the cluster. To retrieve it, use the following steps:
    
    1. On the top menu bar of OpenSearch Dashboards for your selected nightly playground version, go to **Management > Dev Tools**.

    1. To retrieve the manifest, run the following command:

        - For OpenSearch components:
            ```bash
            GET opensearch/_doc/1
            ```

        - For OpenSearch Dashboards components:
            ```bash
            GET opensearch-dashboards/_doc/1
            ```

        The response will show the components in the deployed cluster along with commit IDs and artifact locations:

        ```json
        "build": {
            "name": "OpenSearch",
            "version": "2.18.0",
            "platform": "linux",
            "architecture": "x64",
            "distribution": "tar",
            "location": "https://ci.opensearch.org/ci/dbc/distribution-build-opensearch/2.18.0/10479/linux/x64/tar/dist/opensearch/opensearch-2.18.0-linux-x64.tar.gz",
            "id": "10479"
            },
            "components": [
            {
                "name": "OpenSearch",
                "repository": "https://github.com/opensearch-project/OpenSearch.git",
                "ref": "99a9a81da366173b0c2b963b26ea92e15ef34547",
                "commit_id": "99a9a81da366173b0c2b963b26ea92e15ef34547",
                "location": "https://ci.opensearch.org/ci/dbc/distribution-build-opensearch/2.18.0/10479/linux/x64/tar/builds/opensearch/dist/opensearch-min-2.18.0-linux-x64.tar.gz"
            },
            ...
            ]
        }
        ```

* **Why might certain components or plugins be missing?**
    - If a component is missing from the distribution, it likely failed to build. Nightly builds continue even if some components encounter issues, ensuring that the overall build process remains unaffected by individual component failures and allowing for uninterrupted progress. To check for component build errors, visit the component's repository and search for build failure autocut issues, such as [this one](https://github.com/opensearch-project/security-analytics/issues/904).

* **How can I add more data to these clusters?**
    - You can open a GitHub [issue](https://github.com/opensearch-project/opensearch-devops/issues) or submit a pull request containing the data you need. The maintainers will review the data for security and sensitive information before indexing it into the cluster.

* **What if I need additional permissions for testing?**
    - We recently integrated nightly playgrounds with GitHub as an OIDC provider. Currently, all logged-in users have read-only access to the cluster. We plan to enhance these permissions in the future by supporting GitHub handles. To request additional permissions, create a GitHub [issue](https://github.com/opensearch-project/opensearch-devops/issues) and include your GitHub handle in the request.

## Wrapping up

We're continually enhancing nightly playgrounds to make them even more useful for the community and developers, giving you the ability to explore new features as soon as they're available. Check out the infrastructure-as-code on [GitHub](https://github.com/opensearch-project/opensearch-devops/tree/main/nightly-playground) and follow the [meta issue](https://github.com/opensearch-project/opensearch-devops/issues/129) for more information.

You're always welcome to share feedback, request features, and contribute to making nightly playgrounds even more valuable. We appreciate your involvement and support!