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
meta_description: Integrating alerts and anomalies with OpenSearch Dashboard visualizations.
twittercard:
  description: Learn about integrating alerts and anomalies with OpenSearch Dashboard visualizationss.
category:
  - community
excerpt: 
---

# Introduction

Prior to OpenSearch 2.9, users maintain state between the data they were viewing in the Discover and Dashboard interfaces and the data needed to create a new anomaly detector or alert monitor. Users provided feedback that creating new detectors or monitors was difficult because of context switching. Now, users can create anomaly detectors and alerting monitors directly from their OpenSearch Dashboards line chart visualizations, with select aggregations. After creating the new detector or monitor/alert, users can view anomalies or alerts overlaying the configured visualization. For users who have defined detectors or monitors, they can associate their existing detectors or monitors to the visualization, which helps track services that are not specific to the visualization, such as a dependent service.

In this blog, you'll learn how to create a new anomaly detector or alerting monitor from a visualization and add existing monitors and detectors to a visualization instead of through the Alerting or Anomaly Detection plugin pages.

## Terms to know

Here are terms you need to know:

- _OpenSearch Dashboards visualizations_ are visualizations defined within a dashboard.
- _Anomaly Detection plugin_ is the free OpenSearch plugin using the [Random Cut Forest algorithm](https://github.com/aws/random-cut-forest-by-aws) (that is, an unsupervised algorithm for detecting anomalous data points within a dataset) to detect anomalies in aggregated data.
- _Alerting plugin_ is the free OpenSearch plugin used to monitor and trigger alerts on OpenSearch's health and machine-generated logs.

## Getting started

This feature is automatically enabled. You can turn it off by going to **OpenSearch Dashboards** > **Stack Management** > **Advanced Settings** and toggling off **Enable plugin augmentation**, which is in the **Visualization** pane. Before getting started with this feature, make sure you have:

* Installed OpenSearch and OpenSearch Dashboards version 2.9 or later. See [Installing OpenSearch]({{site.url}}{{site.baseurl}}/install-and-configure/install-opensearch/index/).
* Installed Anomaly Detector or Alerting plugins. See [Managing OpenSearch Dashboards plugins]({{site.url}}{{site.baseurl}}/install-and-configure/install-dashboards/plugins/) for more information.
* Started your local environment. Because OpenSearch Playground is read-only, use your local environment to perform the steps in the following tutorials.

Note that currently only y-axis metric (count, average, max, and so forth) aggregations and x-axis date histogram aggregations are supported. 

### Creating a monitor or detector through a visualization

To create a new monitor or detector by way of a visualization, first [save your dashboard]({{site.url}}{{site.baseurl}}/dashboards/dashboard/index/#saving-dashboards). Then select **Alerting** or **Anomaly Detection** from the **Options** context menu dropdown. The following image gives you a snapshot of the interface. Tip: If you are using static thresholds (for example, metrics to monitor CPU spikes, memory usage, or disk usage), create an alerting monitor; otherwise, create an anomaly detector.

![Options context menu]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/dashboard-options-context-menu.png)
##### Figure 1. Interface showing dashboard panel with **Options** context menu 

Regardless of whether you choose Alerting or Anomaly Detection, certain information, based on the visualization's data, about alerts and anomalies is automatically populated. Optionally, instead of creating a new monitor or detector, you can associate existing monitors or detectors. Learn more about the workflow in the respective OpenSearch documentation, [Alerting visualizations and dashboards]({{site.url}}{{site.baseurl}}/observing-your-data/alerting/dashboards-alerting/) and [Anomaly detection visualizations and dashboards]({{site.url}}{{site.baseurl}}/observing-your-data/ad/dashboards-anomaly-detection/). 

### Adding a detector through a visualization 

To add a detector by way of a visualization, you have two options: creating a new detector or associating an existing detector. Choose the option that meets your use case.

1. On your visualization, select **Anomaly Detection** from the Options context menu dropdown, as shown in the following image. 

[Anomaly Detection context menu interface]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/anomaly-options-context-menu.jpg)
##### Figure 2. Visualization showing Anomaly Detection context menu 

2. Select **Add anomaly detector** from the **Anomaly Detection** context menu dropdown, as shown in the following image.

![Add anomaly detector context menu interface]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/add-detector.jpg)
##### Figure 3. Visualization showing Add anomaly detector context menu 

3. Choose **Create new detector** or **Associate existing detector**.
- If you choose to create a new detector, input the required information under **Detector details** and **Model Features**.
- If you choose to associate an existing detector, select from the dropdown list of detectors under **Select detector to associate**.

4. Select **Create detector** or **Associate detector**, as applicable, to add the detector to your visualization, as shown in the following images.

| Create detector                   | Associate detector           |
|:---------------------------------:|:----------------------------:|
| ![Create detector interface]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/save-new-detector.jpg) | ![Associate existing detector interface]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/save-associated-detector.jpg) |

Note that if the Alerting plugin is enabled in your cluster, you'll have the option to create a monitor on top of the anomaly detector. To do this, select **Set up alerts** from the success notification popup you receive upon successfully creating the detector. The anomaly detector is prepopulated as a definition method for the alerting monitor. 

### Adding a monitor through a visualization  

To create a monitor by way of a visualization, you have two options: creating a new monitor or associating an existing monitor. Choose the option that meets your use case.

1. On your visualization, select **Alerting** from the Options context menu, as shown in the following image. 

![Alerting context menu interface]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/alerting-options-context-menu.png)
##### Figure 4. Visualization showing Alerting context menu 

2. Select **Add alerting monitor** from the **Alerting** context menu dropdown, as shown in the following image.

![Add Alerting monitor context menu interface]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/add-monitor.png)
##### Figure 5. Visualization showing Add alerting monitor context menu

3. Choose **Create new monitor** or **Associate existing monitor**.
- If you choose to create a new monitor, input the required information under **Monitor details**.
- If you choose to associate an existing monitor, select a monitor from the dropdown list under **Select monitor to associate**.

4. Select **Create monitor** or **Associate monitor**, as applicable, to add the monitor to your visualization, as shown in the following images.

| Create monitor | Associate monitor |
|:--------------:|:-----------------:|
| ![Create monitor interface]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/save-new-monitor.png) | ![Associate monitor interface]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/save-associated-monitor.png) |

### Viewing events

Regardless of whether you choose to create a new monitor or detector or to associate an existing monitor or detector, events on your dashboard are triggered based on the criteria you set up. For a detailed view of the trigger criteria, go to the **View Events** page. You have two options for accessing the **View Events** menu: Select an event on the visualization itself or select **View Events** from the visualization’s context menu, as shown in the following image.

![View events context menu interface]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/view-events-context-menu.png)
##### Figure 6. Visualization showing View events context menu

As shown in the following image, the events flyout has two sections. The top section is the visualization displaying the same aggregate view of events and time range as the visualization on the dashboard. The events flyout can be refreshed to fetch any new data. The bottom section displays the specific event details. This section is arranged by plugin (Anomaly Detection or Alerting), then by the individual plugin resources within that plugin (anomaly detectors or alerting monitors). In this view, you can see which plugin resources are producing events and when those events were produced. An overall event count for each plugin resource is displayed next to the resource name. To display more information about a specific plugin resource or the event it has produced, select the resource name. This opens a new tab that displays the resource details about that plugin. A time range is also fixed at the bottom of the flyout to help visually correlate individual events.

![View events flyout interface]({{site.url}}{{site.baseurl}}/assets/media/blog-images/2023-07-20-alert-anomaly-visual.md/events-flyout.png)
##### Figure 7. Events flyout showing alerting and anomaly detectors details and a line chart visualization

## Limitations

Currently, this feature has following limitations:

- The number of objects associated with visualizations defaults to 10. You can change this in **Advanced settings** > **Visualization** > **<insert-field**.
- Only line chart visuals containing time-series data is supported.

## Community feedback

The OpenSearch Project team seeks your input about this feature. We're continuously working to improve the feature, and we'd love to hear from you about how we can improve the functionality and capability of the alerting and anomaly detection visualizations workflows. Leave your feedback by [creating an issue](https://github.com/opensearch-project/OpenSearch/issues) in the OpenSearch Project GitHub repository.
