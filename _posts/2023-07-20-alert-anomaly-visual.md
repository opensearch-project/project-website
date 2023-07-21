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

Prior to OpenSearch 2.9, users maintain state between the data they were viewing in the Discover and Dashboard interfaces and the data needed to create a new anomaly detector or alert monitor. Users provided feedback that creating new detectors or monitors was difficult because of context switching. With OpenSearch 2.9, users who use anomaly detection and alerting can create anomaly detectors and alerting monitors directly from their OpenSearch Dashboards [Vizlib](https://home.vizlib.com/) chart or line visualizations with select aggregations. After creating the new detector or monitor/alert, users can view anomalies or alerts overlaying the configured visualization. For users who have defined detectors or monitors, they can associate their existing detectors or monitors to the visualization, which helps track services that are not specific to the visualization, such as a dependent service.

Learn how this feature works by trying it out today! Follow the steps under [Getting started](<insert-link>) and let us know how the feature works for you by leaving feedback in the [<OpenSearch Dashboards Forum>](insert-link).

## Terms to know

Here are terms you need to know:

- _OpenSearch Dashboards visualizations_ are visualizations defined within a dashboard.
- _Anomaly Detection plugin_ is the free OpenSearch plugin using the [Random Cut Forest algorithm](https://github.com/aws/random-cut-forest-by-aws) (that is, an unsupervised algorithm for detecting anomalous data points within a data set) to detect anomalies in aggregated data.
- _Alerting plugin_ is the free OpenSearch plugin used to monitor and trigger alerts on OpenSearch's health and machine-generated logs.

## Getting started

The alerting and anomaly detection visualizations feature is automatically enabled. You can turn it off by going to **OpenSearch Dashboards** > **Stack Management** > **Advanced Settings** and toggling off **Enable plugin augmentation**, which is in the **Visualization** pane. Before getting started with this feature, make sure you have:

* Installed OpenSearch and OpenSearch Dashboards version 2.9 or later. See [Installing OpenSearch]({{site.url}}{{site.baseurl}}/install-and-configure/install-opensearch/index/).
* Installed Anomaly Detector or Alerting plugins. See [Managing OpenSearch Dashboards plugins]({{site.url}}{{site.baseurl}}/install-and-configure/install-dashboards/plugins/) for more information.
* Started your local environment. Because OpenSearch Playground is read-only, use your local environment to perform the steps in the following tutorials.

In this blog, you'll learn to:

- Create a new visualization based on a line chart.
- Create a new detector or monitor.
- Add a detector from a visualization workflow.
- Add a monitor from a visualiztiona workflow.

Note that currently only y-axis metric (count, average, max, etc.) aggregations and x-axis date histogram aggregations are supported. 

### Creating a monitor or detector via a visualization

To create a new monitor or detector by way of a visualization, first [save your dashboard]({{site.url}}{{site.baseurl}}/dashboards/dashboard/index/#saving-dashboards). Then select **Alerting** or **Anomaly Detection** from the **Options** context menu dropdown. The following image gives you a snapshot of the interface. Tip: If you are using static thresholds (for example, metrics to monitor CPU spikes, memory usage, or disk usage), create an alerting monitor; otherwise, create an anomaly detector.

<img width="720" alt="dashboard-options-context-menu" src="https://github.com/vagimeli/project-website/assets/105296784/bee46a40-f674-482c-bd21-b288981f1d52">
##### Figure 1. Interface showing dashboard panel with **Options** context menu dropdown. 

Regardless of whether you choose Alerting or Anomaly Detection, certain information, based on the visualization's data, about alerts and anomalies is automatically populated. Optionally, instead of creating a new monitor or detector, you can associate existing monitors or detectors. Learn more about this workflow in the respective OpenSearch documentation, [Alerting visualizations and dashboards](<insert-link>) and [Anomaly detection visualizations and dashboards](<insert-link>). 

### Adding a detector via a visualization 

To add a detector by way of a visualization, you have two options: **Create new detector** or **Associate exisiting detector**. Choose the option that meets your use case.

1. On your visualization, select **Anomaly Detection** from the Options content menu dropdown, as shown in the following image. 

![anomaly-options-context-menu](https://github.com/vagimeli/project-website/assets/105296784/9212abe7-1bb9-4892-9b4e-4116ce2ac079)
##### Figure 2. Visualization showing Add anomaly detector context menu dropdown. 

2. Select **Add anomaly detector** from the **Anomaly Detection** context menu dropdown, as shown in the following image.

![add-detector](https://github.com/vagimeli/project-website/assets/105296784/92dede31-0eb2-4534-b91e-510333713067)
##### Figure 3. Visualization showing Anomaly Detection context menu dropdown. 

3. Choose **Create new detector** or **Associate existing detector**.
- If you choose to create a new detector, input the required information under **Detector details** and **Model Features**.
- If you choose to associate an existing detector, select from the dropdown list of detectors under **Select detector to associate**.

4. Select **Create detector** or **Associate detector**, as applicable, to add the detector to your visualization, as shown in the following images.

| Create new detector                   | Associate existing detector           |
|:-------------------------------------:|:-------------------------------------:|
| ![save-new-detector](https://github.com/vagimeli/project-website/assets/105296784/c1a5cf74-05a4-4292-8118-89eb4fe56f33) | ![save-associated-detector](https://github.com/vagimeli/project-website/assets/105296784/8f30c93d-c87b-48b6-9b17-1e8cd227647b) |

Note that if the Alerting plugin is enabled in your cluster, you will have the option to create a monitor on top of the anomaly detector. To do this, select **Set up alerts** from the success notification popup you receive upon successfully creating the detector. The anomaly detector is prepopulated as a definition method for the alerting monitor. 

### Adding a monitor via the visualization  

To add a monitor to a visualization

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
