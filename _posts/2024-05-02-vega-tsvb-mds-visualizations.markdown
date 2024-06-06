---
layout: post
title:  "Visualizing data from multiple data sources with TSVB and Vega"
authors:
 - wronghuy
date: 2024-06-06
categories:
 - technical-post
meta_keywords: multiple data source, vega, tsvb, opensearch dashboards
meta_description: Learn how to create TSVB and Vega visualizations with the multiple data sources feature.
excerpt: OpenSearch versions 2.13 and 2.14 now support multiple data sources for Vega and TSVB visualization types. This blog post shows you how to use this feature.
---

## Introduction

[Multiple data sources](https://opensearch.org/blog/multiple-data-source/) gives users the capability to visualize data from various OpenSearch clusters. To date, only certain visualization types have been available. With the release of OpenSearch Dashboards 2.13 and 2.14, multiple data sources is now compatible with [Vega](https://opensearch.org/docs/latest/dashboards/visualize/vega/) and [Time-Series Visual Builder (TSVB)](https://opensearch.org/docs/latest/dashboards/visualize/viz-index/#tsvb) visualizations types.

Read on to learn how you can visualize your data from multiple data sources using these visualization types with OpenSearch Dashboards.

## What are TSVB and Vega?

TSVB is a data visualization tool for creating detailed time-series visualizations. Its key feature is the ability to add annotations or markers at specific time points based on index data, enabling associations between multiple indexes. In addition to time-series visualizations, TSVB offers area, line, metric, gauge, markdown, and data table panels. As of OpenSearch Dashboards version 2.14, users can choose the data source for their visualizations.

[Vega](https://vega.github.io/vega/) and [Vega-Lite](https://vega.github.io/vega-lite/) are open-source, declarative visualization tools for creating custom data visualizations using OpenSearch data and [Vega data](https://vega.github.io/vega/docs/data/). These tools are suitable for advanced users comfortable with writing OpenSearch queries directly. As of OpenSearch Dashboards version 2.13, users can specify a `data_source_name` for each OpenSearch query.


## Creating TSVB visualizations from multiple data sources

Before proceeding, ensure that the following configurations are enabled in your `opensearch_dashboards.yml` file:

```
data_source.enabled: true
vis_type_timeseries.enabled: true
```

### Step 1: Set up and connect data sources

Open OpenSearch Dashboards and follow these steps:

1. Select **Dashboards Management** from the menu on the left.
2. Select **Data sources** and then select the **Create data source** button.
3. From the **Create data source** page, enter the connection details and endpoint URL, as shown in the following GIF.

![create-datasource](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/create-datasource.gif)
4. From the **Home page**, select **Add sample data**. Under **Data source**, select your newly created data source, and then select the **Add data button** for the **Sample web logs** dataset, as shown in the following GIF.

![add-sample-data](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/add-sample-data.gif)
Now that you have completed the setup, you can start visualizing your data.

### Step 2: Create the visualization

Follow these steps to create the visualization:

1. From the menu on the left, select **Visualize**.
2. From the **Visualizations** page, select **Create Visualization** and then select **TSVB** in the pop-up window, as shown in the following images.

![create-visualization-button](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/create-visualization-button.jpg)
![create-tsvb-button](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/tsvb-create-visualization-button.jpg)
3. Proceed with specifying your data source.



### Step 3: Specify your data

After creating a TSVB visualization, data may appear based on your default index pattern. To change the index pattern or configure additional settings, follow these steps to customize your visualization:

1. Select **Panel options**.
2. From **Data source**, select the OpenSearch cluster from which to pull data. In this case, choose your newly created data source.
3. From **Index name**, enter `opensearch_dashboards_sample_data_logs`.
4. Under **Time field**, select `@timestamp`. This setting specifies the time range for rendering the visualization.

The following GIF shows these steps in action.
![configure-tsvb](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/configure-tsvb.gif)
The following image shows the TSVB visualization output.
![tsvb-visualization](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/tsvb.png)

### Step 4:  Add annotations

Annotations allow you to place markers on your time-series visualization data. Follow these steps to annotate your visualization:

1. On the upper-left of the page, select **Time Series**.
2. Select the **Annotations** tab and then **Add data source**.
3. In the **Index name** field, specify the appropriate index. In this case, continue using the same index from the previous steps, that is, `opensearch_dashboards_sample_data_logs`.
4. From **Time field**, select `@timestamp`.
5. In **Fields**, enter `timestamp`.
6. In **Row template**, enter ``timestamp``.

The automatically updates to display your annotations, as shown in the following image.
![tsvb-annotations](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/tsvb-with-annotations.png)

## Creating Vega visualizations from multiple data sources

Before proceeding, ensure that the following configurations are enabled in your `opensearch_dashboards.yml` file:

```
data_source.enabled: true
vis_type_vega.enabled: true
```

### Step 1: Set up and connect data sources

Open OpenSearch Dashboards and follow these steps:

1. Select **Dashboards Management** from the left-side menu.
2. Select **Data sources** from the left-side menu and then select the **Create data source** button.
3. From the Create data source page, enter the connection details and endpoint URL, as shown in the following GIF.

![create-datasource](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/create-datasource.gif)
4. From the **Home page**, select **Add sample data**. Under **Data source**, select your newly created data source, and then select the **Add data button** for the **Sample web logs** dataset, as shown in the following GIF.

![add-sample-data](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/add-sample-data.gif)
Now that you have completed the setup, you can start visualizing your data.


### Step 2: Create the visualization

1. From the left-side menu, select **Visualize**.
2. From the **Visualizations** page, select **Create Visualization** and then select **Vega** from the pop-up window, as shown in the following images.

![create-visualizations-button](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/create-visualization-button.jpg)
![create-vega-button](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/vega-create-visualization-button.jpg)

### Step 3: Add the Vega specification

1. Verify that the data source you created is specified under `data_source_name`.
2. Copy the following Vega specification.

```
{
  $schema: https://vega.github.io/schema/vega-lite/v5.json
  data: {
    url: {
      %context%: true
      %timefield%: @timestamp
      index: opensearch_dashboards_sample_data_logs
      data_source_name: YOUR_DATA_SOURCE_TITLE
      body: {
        aggs: {
          1: {
            date_histogram: {
              field: @timestamp
              fixed_interval: 3h
              time_zone: America/Los_Angeles
              min_doc_count: 1
            }
            aggs: {
              2: {
                avg: {
                  field: bytes
                }
              }
            }
          }
        }
        size: 0
      }
    }
    format: {
      property: aggregations.1.buckets
    }
  }
  transform: [
    {
      calculate: datum.key
      as: timestamp
    }
    {
      calculate: datum[2].value
      as: bytes
    }
  ]
  layer: [
    {
      mark: {
        type: line
      }
    }
    {
      mark: {
        type: circle
        tooltip: true
      }
    }
  ]
  encoding: {
    x: {
      field: timestamp
      type: temporal
      axis: {
        title: @timestamp
      }
    }
    y: {
      field: bytes
      type: quantitative
      axis: {
        title: Average bytes
      }
    }
    color: {
      datum: Average bytes
      type: nominal
    }
  }
}
```

3. Select the **Update** button in the lower-right corner to visualize your data, as shown in the following GIF.

![configure-vega](/assets/media/blog-images/2024-05-02-vega-tsvb-mds-visualizations/configure-vega.gif)
## Conclusion

In this blog, we created TSVB and Vega visualizations with multiple data sources in mind. Creating visualizations for your data has never been more versatile! Connect with the OpenSearch Project multiple data sources team to give feedback about how this capability is working for you. You can reach the team at https://forum.opensearch.org/t/feedback-multiple-data-sources-support-for-tsvb-and-vega/19598.
