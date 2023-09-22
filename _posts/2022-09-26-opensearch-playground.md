---
layout: post
title:  "Launch Highlight: OpenSearch Playground"
authors:
  - liutaoaz
  - andhopp
date:   2022-10-03 00:00:00 -0700
categories:
  - community
redirect_from: "/blog/community/2022/10/opensearch-playground/"
---

We are excited to announce the live demo environment of OpenSearch and OpenSearch Dashboards. OpenSearch Playground provides a central location for existing and evaluating users to explore features in OpenSearch and OpenSearch Dashboards without installing or downloading anything. You can access OpenSearch Playground at [playground.opensearch.org](https://playground.opensearch.org).

### What can you do in OpenSearch Playground environment?

The first version of OpenSearch Playground provides you with anonymous, read-only access, allowing you to try new features and explore preconfigured sample data. You can interact with sample dashboards, data visualizations, and data sources without installing and configuring OpenSearch or OpenSearch Dashboards in your own environment. You also can query demo data and evaluate plugin features, such as anomaly detection and observability, without installing or configuring in your instance.

**Example: Anomaly detection dashboard**

![Anomaly Detection](/assets/media/blog-images/2022-09-26-opensearch-playground/anomaly-detection.png){: .img-fluid}

**Example: Observability dashboard**

![Observability](/assets/media/blog-images/2022-09-26-opensearch-playground/observability.png){: .img-fluid}

### How does OpenSearch Playground work?

At a high level, OpenSearch Playground is a deployment of OpenSearch and OpenSearch Dashboards hosted in AWS EKS (Elastic Kubernetes Service), deployed by [OpenSearch-helm-charts](https://github.com/opensearch-project/helm-charts), and made publicly accessible at [playground.opensearch.org](https://playground.opensearch.org/app/home). We use [fluent bit](https://github.com/opensearch-project/dashboards-anywhere/blob/main/config/playground/metrics/fluent-bit/fluent-bit.yaml) to ingest OpenSearch and OpenSearch Dashboards logs and use the [Alerting plugin](https://opensearch.org/docs/latest/monitoring-plugins/alerting/index/) to monitor the site's heartbeat and trigger an alert if the site goes down. We update OpenSearch Playground with each new release of OpenSearch.

**High-level architecture diagram**

![High-level architecture diagram](/assets/media/blog-images/2022-09-26-opensearch-playground/playground-high-level-diagram.png){: .img-fluid}

We plan to provide a more specific design breakdown in a subsequent blog to highlight how the team built OpenSearch Playground. In the meantime, more details can be found on the [GitHub proposal](https://github.com/opensearch-project/dashboards-anywhere/issues/9).

### What’s next?

While this launch of OpenSearch Playground completes a short-term goal to build a demo site providing real-time user experience with read-only permissions, we aren't stopping here. The following are longer-termer goals we are working on:

* User specific sessions: We want to add user authentication via GitHub login to support more exploration and experimentation for individual users. This will enable more capabilities for evaluating users such as persistent editing and saving to allow users to explore the entire user journey.
* Improved landing experience: We want to add a landing experience that guides users through new features, specific use cases, and ongoing experimental features. This will provide new users a more guided demonstration experience.
* More curated demos, data, and use cases: We want to add additional demo data, dashboards, visualization, and curated experiences to better demonstrate the range of use cases supported by the OpenSearch Project.
* Partner highlights: We want to provide direct partner highlights and links within OpenSearch Playground similar to the [Partners page](https://opensearch.org/partners) on OpenSearch.org. Providing this information further highlights community and partner projects to evaluating users and community members.

We have created a public backlog for OpenSearch Playground on [GitHub](https://github.com/opensearch-project/dashboards-anywhere/projects/1). If you're interested in this topic and want to put your knowledge to further practice, consider contributing to the [**dashboards-anywhere**](https://github.com/opensearch-project/dashboards-anywhere) repo!

### What requests do you have?

We’re happy to add more features to the environment. Just let us know!

<img src="/assets/media/blog-images/2022-09-26-opensearch-playground/playground-static-qr-code.png" width="200" height="200" />{: .img-fluid}
