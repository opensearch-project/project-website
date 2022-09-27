---
layout: post
title:  "Launch Highlight: OpenSearch Playground"
authors:
  - liutaoaz
  - andhopp
date:   2022-09-26 00:00:00 -0700
categories:
  - community
---

We are excited to announce the live demo environment of OpenSearch and OpenSearch Dashboards. OpenSearch Playground provides a central location for existing and evaluating users to explore OpenSearch and OpenSearch Dashboards’ new and existing features without installation or download. Access it now here: [playground.opensearch.org](https://playground.opensearch.org).

### So, what can you do with this environment?

The first version of OpenSearch Playground provides users anonymous, read-only access, allowing you to try the new features and see the preconfigured sample data. You can explore the sample dashboards, visualizations, and data sources without installing and configuring OpenSearch and OpenSearch Dashboards in your own environment. You can also query the demo data and evaluate plugin features without installing or configuring in your instance, including the anomaly detection and observability plugins (see below).

**Anomaly Detection**
![Anomaly Detection](/assets/media/blog-images/2022-09-26-opensearch-playground/anomaly-detection.png)

**Observability**
![Observability](/assets/media/blog-images/2022-09-26-opensearch-playground/observability.png)

### How does it work?

At a high-level, OpenSearch Playground is a deployment of OpenSearch and OpenSearch Dashboards hosted in AWS EKS (Elastic Kubernetes Service), deployed by [OpenSearch-helm-charts](https://github.com/opensearch-project/helm-charts), and made publicly accessible via [playground.opensearch.org](https://playground.opensearch.org/app/home). We leverage [fluent bit](https://github.com/opensearch-project/dashboards-anywhere/blob/main/config/playground/metrics/fluent-bit/fluent-bit.yaml) to ingest OpenSearch and OpenSearch Dashboards logs and use the Alerting plugin to monitor the heartbeat of OpenSearch Playground site, which then triggers an alert if the site is down. We will update OpenSearch Playground on the same day of each new release.

**High level architecture diagram**
![High level architecture diagram](/assets/media/blog-images/2022-09-26-opensearch-playground/playground-high-level-diagram.png)

We plan to provide a more specific design breakdown in a subsequent blog to highlight how the team built the OpenSearch Playground. In the meantime, more details can be found on the [GitHub proposal](https://github.com/opensearch-project/dashboards-anywhere/issues/9).

### What’s Next?

While this launch is the completion of a short-term goal to provide a demo website that provides a real user experiences with read-only permissions, we aren’t stopping here. Couple of the items we would like to implement long-term:

* User Specific Sessions: We want to add user authentication via GitHub login to enable more exploration and experimentation for individual users. This will enable more capabilities for evaluating users such as persistent editing and saving to allow users to explore the entire user journey.
* Improved Landing Experience: We want to add a landing experience that guides users through new features, specific use cases, and ongoing experimental features. This will provide new users a more guided demonstration experience.
* More Curated Demos, Data, and Use Cases: We want to add additional demo data, dashboards, visualization, and curated experiences to better demonstrate the breadth of use cases supported by the OpenSearch Project.
* Partner Highlights: We want to provide direct partner highlights and links within OpenSearch Playground similar to the [partners page](https://opensearch.org/partners) on OpenSearch.org. We see this as another opportunity to highlight community and partner projects to evaluating users and community members.

We have created a public backlog for OpenSearch Playground on [GitHub](https://github.com/opensearch-project/dashboards-anywhere/projects/1). If you enjoy this topic and want to put your knowledge into practice, please consider contributing to [**dashboards-anywhere**](https://github.com/opensearch-project/dashboards-anywhere) repo!

### Got any requests?

We’re happy to add more features to the environment – just let us know!

<img src="../assets/media/blog-images/2022-09-26-opensearch-playground/playground-static-qr-code.png" width="200" height="200" />