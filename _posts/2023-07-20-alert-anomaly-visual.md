---
layout: post
title: "Visualizing alerts and anomalies using OpenSearch Dashboards visualization tools and applications"
authors: 
  - jdbright
  - ashisagr
  - tyler ohlsen
  - amit galitzsky
  - jackie han
  - vagimeli
date: 2023-07-20
meta_keywords: alerting, anomaly detection, alert, anomaly, observabilty, dashboard, dashboards, visualizations, visualize
meta_description: Integrating alerts and anomalies visualizations across OpenSearch Dashboards applications.
twittercard:
  description: Learn about integrating alerts and anomalies visualizations across OpenSearch Dashboards applications.
category:
  - community
excerpt: 
---

# Introduction

Prior to OpenSearch 2.9, users maintain state between the data they were viewing in the Discover and Dashboard interfaces and the data needed to create a new anomaly detector or alert monitor. Users provided feedback that creating new detectors or monitors was difficult because of context switching. With OpenSearch 2.9, users who use anomaly detection and alerting can create anomaly detectors and alerting monitors directly from their OpenSearch Dashboards Vizlib chart or line visualizations with select aggregations. After creating the new detector or monitor/alert, users can view anomalies or alerts overlaying the configured visualization. For users who have defined detectors or monitors, they can associate their existing detectors or monitors to the visualization, which helps track services that are not specific to the visualization, such as a dependent service.

## Terms to know

Here are terms you need to know:

- _OpenSearch Dashboards visualizations_ are visualizations defined within a dashboard.
- _Anomaly Detection plugin_ is the free OpenSearch plugin using the [Random Cut Forest algorithm](https://github.com/aws/random-cut-forest-by-aws) (that is, an unsupervised algorithm for detecting anomalous data points within a data set) to detect anomalies in aggregated data.
- _Alerting plugin_ is the free OpenSearch plugin used to monitor and trigger alerts on OpenSearch's health and machine-generated logs.

## Getting started

The alerting and anomaly detection visualizations feature is automatically enabled. You can turn it off by going to **OpenSearch Dashboards** > **Stack Management** > **Advanced Settings** and toggling off **Enable plugin augmentation**, which is in the **Visualization** pane. Before getting started with this feature, make sure you have:

* Installed OpenSearch and OpenSearch Dashboards version 2.9 or later. See [Installing OpenSearch]({{site.url}}{{site.baseurl}}/install-and-configure/install-opensearch/index/).
* Installed Anomaly Detector or Alerting plugins. See [Managing OpenSearch Dashboards plugins]({{site.url}}{{site.baseurl}}/install-and-configure/install-dashboards/plugins/) for more information.
* Started your local environment. Becasue OpenSearch Playground is read-only, the tutorials that follow aren't available in the playground.

In this blog, you'll learn to:

- Create a new visualization based on a line chart.
- Create a new detector or monitor.
- Add a detector from a visualization workflow.
- Add a monitor from a visualiztiona workflow.

Note that currently only y-axis metric aggregations and x-axis date histogram aggregations are supported. 

### Creating a monitor or detector

To create a new monitor or detector, first [save your dashboard]({{site.url}}{{site.baseurl}}/dashboards/dashboard/index/#saving-dashboards). Then select **Alerting** or **Anomaly Detection** from the **Options** dropdown list. 

If you are using static thresholds (for example, metrics to monitor CPU spikes, memory usage, or disk usage), create an alerting monitor. Otherwise, use anomaly detection to observe any outliers.

<insert-image-1>
#### </insert-caption>

Regardless of the flow you choose, certain information about the anomalies and alerts is automatically populated. This information is based on the visualization's data. Additionally, if you have existing detectors or monitors, you can associate them from within their respective context menu. 

### Add detector from the visualization workflow

<insert-image-2>
<insert-image-3>

After clicking “Add anomaly detector” you have the option to either create a new detector that will be associated to the visualization as shown below or choose to associate an existing detector to the visualization. 

Create new detector option:

<insert-image-4>

Associate Existing detector option:

<insert-image-5>

Advanced Use Case:

After creating a new detector, if the alerting plugin is enabled in your cluster then you will have the option to create a monitor on top of the anomaly detector by clicking “Set up alerts” on the success notification. The anomaly detector will be pre-populated as a definition method for the alerting monitor. 

Now that we’ve finished with the detector workflow, let’s take a look at the monitor workflow..

### Add monitor from visualization workflow

<insert-image-6>
<insert-image-7>

Associate existing monitor

<insert-image-8>

No matter which workflow you chose above (or both), you will see events being triggered on your dashboard based on the criteria you setup. If you want a more detailed view, head over to the view events screen to understand dive deep into what is triggering across the monitors and/or detectors you’ve created.

<insert-image-9>

### View Events on dashboards and the view events screen

You can access the View Events flyout two different ways. You can click on an event in the visualization itself, or click on the View Events option within the visualization’s context menu.

This flyout consists of two basic sections. The top portion is the original visualization showing the same aggregate view of events, as well as the time range that is consistent with the dashboard. This can be refreshed to fetch any new data as well. The bottom portion shows a detailed breakdown of the events. It is organized first by plugin (anomaly detection or alerting), and then by the individual plugin resources within that plugin (anomaly detectors or alerting monitors). You can see which plugin resources are producing the events, and at what time. An overall event count for each plugin resource is also shown beside the resource name. If you would like more information about a particular plugin resource, or about the events it has produced, you can click on the resource name which will open a new tab displaying the resource details within the respective plugin. The time range is also fixed at the bottom of the flyout to help visually correlate individual events.

<insert-image-10>

## Limitations

Currently, this feature has following limitiations:

- The number of objects associated with visualizations is <insert>.
- <Any other limitations?> 

## Community  feedback

The OpenSearch Project team seeks your input about this feature. We're continuously working to improve the feature, and we'd love to hear from you about how we can improve the functionality and capability of the alerting and anomaly detection visualizations workflows. Leave your feedback on the <OpenSearch Forum/GitHub issue>.
