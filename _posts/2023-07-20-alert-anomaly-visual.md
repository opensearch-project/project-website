---
layout: post
title: "Visualizing alerts and anomalies using OpenSearch Dashboards visualization tools and applications"
authors: 
  - jdbright
  - ashisagr
  - 
date: 2023-07-20
meta_keywords: alerting, anomaly detection, alert, anomaly, observabilty, dashboard, dashboards, visualizations, visualize
meta_description: Learn about visualizing alerts and anomalies using OpenSearch Dashboards visualization tools and applications.
twittercard:
  description: Learn about visualizing alerts and anomalies using OpenSearch Dashboards visualization tools and applications.
category:
  - community
excerpt: 
---

# Introduction

Prior to OpenSearch 2.9, users maintain state between the data they were viewing in the Discover and Dashboard interfaces and the data needed to create a new anomaly detector or alert monitor. Users provided feedback that creating new detectors or monitors was difficult because of context switching. With OpenSearch 2.9, users who use anomaly detection and alerting can create anomaly detectors and alerting monitors directly from their OpenSearch Dashboards Vizlib chart or line visualizations with select aggregations. After creating the new detector or monitor/alert, users can view anomalies or alerts overlaying the configured visualization. For users who have defined detectors or monitors, they can associate their existing detectors or monitors to the visualization. Associating a detector or monitor is helpful for tracking services that are not specific to the visualization, such as a dependent service.

## Terms to know

Here are the terms you need to know:

- _OpenSearch Dashboards visualizations_ are visualizations defined within a dashboard.
- _Anomaly Detection plugin_ is the free OpenSearch plugin using the Random Cut Forest algorithm (that is, an unsupervised algorithm for detecting anomalous data points within a data set) to detect anomalies in aggregated data.
- _Alerting plugin_ is the free OpenSearch plugin used to monitor and trigger alerts on OpenSearch's health and machine-generated logs.

## Getting started

This feature is automatically enabled. You can turn it off in Stack Management > Advanced Settings by toggling Enable plugin augmentation to the off position. Before getting started, make sure you have:

* Installed OpenSearch and OpenSearch Dashboards version 2.9 or later. See [Installing OpenSearch]({{site.url}}{{site.baseurl}}/install-and-configure/install-opensearch/index/).
* Installed Anomaly Detector or Alerting plugins. See [Managing OpenSearch Dashboards plugins]({{site.url}}{{site.baseurl}}/install-and-configure/install-dashboards/plugins/) to get started.

Because OpenSearch Playground is read-only, you need to spin up a local environment to try out this feature.

Create a new visualization based on a line chart in an existing dashboard or create a new line chart. The only supported metric aggregations are y-axis aggregations, and only date histogram x-axis aggregations are supported.  After saving your dashboard, you can create a new detector or monitor. From the Options dropdown list, select Alerting or Anomaly Detection. If you are using static thresholds, create an alerting monitor. Otherwise, use anomaly detection to detect if your data is moving out of the normal.


