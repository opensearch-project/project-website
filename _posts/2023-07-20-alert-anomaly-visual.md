---
layout: post
title: "Visualizing alerts and anomalies using OpenSearch Dashboards visualization tools and applications"
authors: 
  - jdbright
  - ashisagr
  - ohltyler
  - amgalitz
  - hnyng
  - xeniatup
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

Prior to OpenSearch 2.9, users maintain state between the data they were viewing in the Discover and Dashboard interfaces and the data needed to create a new anomaly detector or alert monitor. Users provided feedback that creating new detectors or monitors was difficult because of context switching. Now, users can create anomaly detectors and alerting monitors directly from their OpenSearch Dashboards line chart visualizations, with select aggregations. After creating the new detector or monitor/alert, users can view anomalies or alerts overlaying the configured visualization. For users who have defined detectors or monitors, they can associate their existing detectors or monitors to the visualization, which helps track services that are not specific to the visualization, such as a dependent service.

In this blog, you'll learn to create a new detector or monitor and add monitors and detectors to a visualization by way of the visualization, instead of through the Alerting or Anomaly Detection plugin pages.

## Terms to know

Here are terms you need to know:

- _OpenSearch Dashboards visualizations_ are visualizations defined within a dashboard.
- _Anomaly Detection plugin_ is the free OpenSearch plugin using the [Random Cut Forest algorithm](https://github.com/aws/random-cut-forest-by-aws) (that is, an unsupervised algorithm for detecting anomalous data points within a dataset) to detect anomalies in aggregated data.
- _Alerting plugin_ is the free OpenSearch plugin used to monitor and trigger alerts on OpenSearch's health and machine-generated logs.

## Getting started

The alerting and anomaly detection visualizations feature is automatically enabled. You can turn it off by going to **OpenSearch Dashboards** > **Stack Management** > **Advanced Settings** and toggling off **Enable plugin augmentation**, which is in the **Visualization** pane. Before getting started with this feature, make sure you have:

* Installed OpenSearch and OpenSearch Dashboards version 2.9 or later. See [Installing OpenSearch]({{site.url}}{{site.baseurl}}/install-and-configure/install-opensearch/index/).
* Installed Anomaly Detector or Alerting plugins. See [Managing OpenSearch Dashboards plugins]({{site.url}}{{site.baseurl}}/install-and-configure/install-dashboards/plugins/) for more information.
* Started your local environment. Because OpenSearch Playground is read-only, use your local environment to perform the steps in the following tutorials.

Note that currently only y-axis metric (count, average, max, etc.) aggregations and x-axis date histogram aggregations are supported. 

### Creating a monitor or detector through a visualization

To create a new monitor or detector by way of a visualization, first [save your dashboard]({{site.url}}{{site.baseurl}}/dashboards/dashboard/index/#saving-dashboards). Then select **Alerting** or **Anomaly Detection** from the **Options** context menu dropdown. The following image gives you a snapshot of the interface. Tip: If you are using static thresholds (for example, metrics to monitor CPU spikes, memory usage, or disk usage), create an alerting monitor; otherwise, create an anomaly detector.

<img width="720" alt="dashboard-options-context-menu" src="https://github.com/vagimeli/project-website/assets/105296784/bee46a40-f674-482c-bd21-b288981f1d52">
##### Figure 1. Interface showing dashboard panel with **Options** context menu 

Regardless of whether you choose Alerting or Anomaly Detection, certain information, based on the visualization's data, about alerts and anomalies is automatically populated. Optionally, instead of creating a new monitor or detector, you can associate existing monitors or detectors. Learn more about this workflow in the respective OpenSearch documentation, [Alerting visualizations and dashboards](<insert-link>) and [Anomaly detection visualizations and dashboards](<insert-link>). 

### Adding a detector through a visualization 

To add a detector by way of a visualization, you have two options: creating a new detector or associating an existing detector. Choose the option that meets your use case.

1. On your visualization, select **Anomaly Detection** from the Options context menu dropdown, as shown in the following image. 

![anomaly-options-context-menu](https://github.com/vagimeli/project-website/assets/105296784/9212abe7-1bb9-4892-9b4e-4116ce2ac079)
##### Figure 2. Visualization showing Anomaly Detection context menu 

2. Select **Add anomaly detector** from the **Anomaly Detection** context menu dropdown, as shown in the following image.

![add-detector](https://github.com/vagimeli/project-website/assets/105296784/92dede31-0eb2-4534-b91e-510333713067)
##### Figure 3. Visualization showing Add anomaly detector context menu 

3. Choose **Create new detector** or **Associate existing detector**.
- If you choose to create a new detector, input the required information under **Detector details** and **Model Features**.
- If you choose to associate an ing detector, select from the dropdown list of detectors under **Select detector to associate**.

4. Select **Create detector** or **Associate detector**, as applicable, to add the detector to your visualization, as shown in the following images.

| Create detector                   | Associate detector           |
|:---------------------------------:|:----------------------------:|
| ![save-new-detector](https://github.com/vagimeli/project-website/assets/105296784/c1a5cf74-05a4-4292-8118-89eb4fe56f33) | ![save-associated-detector](https://github.com/vagimeli/project-website/assets/105296784/8f30c93d-c87b-48b6-9b17-1e8cd227647b) |

Note that if the Alerting plugin is enabled in your cluster, you'll have the option to create a monitor on top of the anomaly detector. To do this, select **Set up alerts** from the success notification popup you receive upon successfully creating the detector. The anomaly detector is prepopulated as a definition method for the alerting monitor. 

### Adding a monitor through a visualization  

To create a monitor by way of a visualization, you have two options: creating a new monitor or associating an existing monitor. Choose the option that meets your use case.

1. On your visualization, select **Alerting** from the Options context menu, as shown in the following image. 

<img width="896" alt="alerting-options-context-menu" src="https://github.com/vagimeli/project-website/assets/105296784/f4a1c87a-c834-4a4f-a01f-4bb0da38c41d">
##### Figure 4. Visualization showing Alerting context menu 

2. Select **Add alerting monitor** from the **Alerting** context menu dropdown, as shown in the following image.

<img width="884" alt="add-monitor" src="https://github.com/vagimeli/project-website/assets/105296784/0a11b123-779c-4336-b28c-ba61b2983b5b">
##### Figure 5. Visualization showing Add alerting monitor context menu

3. Choose **Create new monitor** or **Associate existing monitor**.
- If you choose to create a new monitor, input the required information under **Monitor details**.
- If you choose to associate an existing monitor, select a monitor from the dropdown list under **Select monitor to associate**.

4. Select **Create monitor** or **Associate monitor**, as applicable, to add the monitor to your visualization, as shown in the following images.

| Create monitor | Associate monitor |
|:--------------:|:-----------------:|
| <img width="1780" alt="save-new-monitor" src="https://github.com/vagimeli/project-website/assets/105296784/53d0dd80-724d-4f56-bd41-4dad7fcdb4ea"> | <img width="1778" alt="save-associated-monitor" src="https://github.com/vagimeli/project-website/assets/105296784/4ab14032-085a-4383-bfd9-07eddeb58e5e"> |

### Viewing events

Regardless of whether you choose to create a new monitor or detector or to associate an existing monitor or detector, events on your dashboard are triggered based on the criteria you set up. For a detailed view of the tirgger criteria, go to the **View Events** page. You have two options for accessing the **View Events** menu: Select an event on the visualization itself or select **View Events** from the visualization’s context menu, as shown in the following image.

<img width="719" alt="view-events-context-menu" src="https://github.com/vagimeli/project-website/assets/105296784/98cbb0ce-374c-40ff-bd2c-d6dbf2c36da1">
##### Figure 6. Visualization showing View events context menu

As shown in the following image, the events flyout has two sections. The top section is the visualization displaying the same aggregate view of events and time range as the visualization on the dashboard. The events flyout can be refreshed to fetch any new data. The bottom section displays the specific event details. This section is arranged by plugin (Anomaly Detection or Alerting), then by the individual plugin resources within that plugin (anomaly detectors or alerting monitors). In this view, you can see which plugin resources are producing events and when those events were produced. An overall event count for each plugin resource is displayed next to the resource name. To display more information about a specific plugin resource or the event it has produced, select the resource name. This opens a new tab that displays the resource details about that plugin. A time range is also fixed at the bottom of the flyout to help visually correlate individual events.

![events-flyout](https://github.com/vagimeli/project-website/assets/105296784/4f1af73b-39dd-4472-813e-406322b8df89)
##### Figure 7. Events flyout showing alerting and anomaly detectors details and a line chart visualization

## Limitations

Currently, this feature has following limitiations:

- The number of objects associated with visualizations defaults to 10. You can change this in **Advanced settings** > **Visualization** > **<insert-field**.
- Only line chart visuals containing time series data are supported.

## Community  feedback

The OpenSearch Project team seeks your input about this feature. We're continuously working to improve the feature, and we'd love to hear from you about how we can improve the functionality and capability of the alerting and anomaly detection visualizations workflows. Leave your feedback on the [<OpenSearch Forum/GitHub issue>](<insert-link).
