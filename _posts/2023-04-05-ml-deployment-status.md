---
layout: post
title:  "You can now see ML model status in OpenSearch Dashboards"
authors:
- naarcha
date: 2023-04-05
categories:
 - technical-post
meta_keywords: machine learning, ML Commons for OpenSearch, deployed models dashboard
meta_description: Test the experimental deployed model dashboard functionality of OpenSearch Dashboards to view the responsiveness of ML nodes in your cluster.
excerpt: Before OpenSearch 2.6, checking the status of a deployed machine learning (ML) model in OpenSearch could only be done by using the ML Commons Profile API. Although the Profile API returned data organized by ML nodes, it could not tell you the status of a specific model deployed on that node. 
---

Before [OpenSearch 2.6](https://opensearch.org/blog/introducing-opensearch-2-6/), checking the status of a deployed machine learning (ML) model in OpenSearch could only be done by using the [ML Commons Profile API](https://opensearch.org/docs/latest/ml-commons-plugin/api/#profile). Although the Profile API returned data organized by ML nodes, the response could not tell you the status of a specific model deployed on an ML node. 

The ML team is happy to announce the first piece of ML functionality in OpenSearch Dashboards, the [deployed models dashboard](https://opensearch.org/docs/latest/ml-commons-plugin/ml-dashboard/#deployed-models-dashboard), as an experimental feature. The deployed models dashboard gives you a view into the responsiveness of each deployed model on each ML node in your cluster.

## Viewing deployed ML status at the model level

The deployed model dashboard shows the following information about your deployed models:

- **Name**: The name of the model given upon upload.
- **Status**: The number of nodes for which the model is responsive. 
   - When all nodes are responsive, the status is **Green**.
   - When some nodes are responsive,the status is **Yellow**.
   - When all nodes are unresponsive, the status is **Red**.
- **Model ID**: The model ID.

<img src="/assets/media/blog-images/2023-04-05-ml-deployment-status/ml-deployed-model-dashboard.png" alt="ML deployed model dashboard"/>{: .img-fluid }

If you want to see even more details about your model's responsiveness, select **View status details** to see a detailed view of your model on each of its ML nodes. The detailed view prevents you from having to manually call the Profile API and parse through complex return results to see which ML nodes are responsive. Instead, the detailed view tells you which ML nodes, by Node ID, are responding or not responding, which is very useful when troubleshooting deployment issues with your model.

<img src="/assets/media/blog-images/2023-04-05-ml-deployment-status/ml-model-status.png" alt="See the responsiveness of each ML node your model is deployed on"/>{: .img-fluid }

## Simplifying model filtering and searching

If you deploy a large number of models, you might it hard to locate to model you need with the Profile API. Luckily, you can search and filter through all deployed models using:

- Model name
- Model ID
- Model status

Furthermore, the deployed model dashboard can automatically refresh data according to a selected time cycle. To set the refresh cycle, select the **Clock** icon, set the refresh time, and then select **Start**.

<img src="/assets/media/blog-images/2023-04-05-ml-deployment-status/ml-model-search.gif" alt="Search and filter through deployed models"/>{: .img-fluid }

## Next steps


The machine learning (ML) functionality in OpenSearch Dashboards is experimental, it shouldn't be used in a production environment. If you want to test out the functionality, see [Enabling ML in Dashboards](https://opensearch.org/docs/latest/ml-commons-plugin/ml-dashboard/#enabling-ml-in-dashboards) or visit the [ML OpenSearch Dashboard Playground](https://ml.playground.opensearch.org/app/ml-commons-dashboards/overview).

For additional updates on the ML Dashboard or to leave feedback, see the [OpenSearch Forum discussion](https://forum.opensearch.org/t/feedback-ml-commons-ml-model-health-dashboard-for-admins-experimental-release/12494).
{: .warning }






