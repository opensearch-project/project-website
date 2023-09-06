---
layout: post
title: "OpenSearch Dashboards: A usability snapshot"
authors: 
  - apasun
date: 2023-06-08
meta_keywords: OpenSearch Dashboards, user experience, usability study
meta_description: Read on to learn more about our usability study with two OpenSearch Dashboards user groups, Producers and Consumers.
twittercard:
  description: Learn about our usability study with two OpenSearch Dashboards user groups, Producers and Consumers, and how you can get involved in Dashboards redesign efforts.
category:
  - community
excerpt: 
  Creating visual representations from large amounts of data aligns with the fundamental mode of human understanding. To monitor data at scale and make strategic decisions, we need tools that can effectively and intuitively visualize data and support sound business decision-making. OpenSearch gives our users visualization capabilities through OpenSearch Dashboards. Dashboards serves as the user interface for OpenSearch features such as security, alerting, index state management, observability, security analytics, and so forth. 
---

Creating visual representations from large amounts of data aligns with the fundamental mode of human understanding. To monitor data at scale and make strategic decisions, we need tools that can effectively and intuitively visualize data and support sound business decision-making. OpenSearch gives our users visualization capabilities through OpenSearch Dashboards. Dashboards serves as the user interface for OpenSearch features such as security, alerting, index state management, observability, and security analytics. 

Since July 2021, when OpenSearch was forked from Kibana 7.10.2, we have been evolving and differentiating OpenSearch Dashboards to meet the users’ demands, especially those that have migrated from Kibana to OpenSearch Dashboards. One such demand is the capability to search, view, and visualize data indexed in users’ search solutions. Communicating insights visually often involves visualizing data using bar charts, pie charts, tables, histograms, and maps or using the optimal solution that best aids comprehension of numbers. 

In Q1 2023, the OpenSearch Project initiated a baseline usability study of Dashboards. With no prior context to measure against, the current study focused on certain core workflows of two pivotal OpenSearch roles: Producers and Consumers. Key Lime Interactive (KLI) conducted a baseline usability study on Dashboards in hour-long sessions with Producers (n=15) and Consumers (n=15). The study’s methods and results are explained in the following sections.

## Study methodology

KLI conducted a moderated usability study with a curated dashboard. KLI has already conducted a usability study for new experiences on OpenSearch software (for example, the Admin Panel console). For the current study, 60-minute sessions were held with participants navigating through a series of tasks that mimicked common workflows for Producers (n=15, 6 tasks) and Consumers (n=15, 5 tasks). Participants narrated their experiences as they attempted each task in order to explain their thought processes, overall impressions, expectations, and likes/dislikes. Participants were asked open-ended follow-up questions after each task to help us gather more information and clarification about their experiences and perspectives. Performance on each task was measured for success, assisted success (in which the moderator offers participants hints), and failure.

The sessions were conducted from May 16--June 22, 2023. Producer sessions were conducted first. After successful pilots (n=2) were conducted May 16—19, an additional 13 Producer sessions were conducted May 24--June 2, 2023. Consumer sessions were conducted after successful pilots (n=2) and were conducted June 7--22, 2023. The sample size was 30 participants (15 Producers and 15 Consumers), including 4 pilots split evenly between the user groups. Sessions were organized as follows: 5-minute introduction and pre-brief; 5-minute overview of participants’ use cases; 45-minute period for testing tasks; and 5-minute post-test discussion and debrief.

We asked Producers and Consumers to perform the following tasks:

### Producer tasks

The Producer participants were asked to perform the following tasks:

1. Create an index pattern.
2. Create a saved search in Discover and select a few columns from the provided dataset.
3. Create a visualization using any of the visualization tools in Dashboards, including the new experimental VisBuilder app.
4. Create a dashboard and share it.
5. Analyze an existing dashboard and identify an anomaly in the synthetic dataset.
6. Generate a report.

### Consumer tasks

The Consumer participants were asked to perform the following tasks:

1. Analyze an existing dashboard and identify an anomaly in a sample dataset.
2. Clone a dashboard to further analyze the dashboard data.
3. Find the pages responsible for the most 404 error codes in a sample dataset.
4. Find a specific log record.
5. Generate a report.

## Key learnings

Producer and Consumer participants were selected for their deep expertise in dashboard processes and behaviors. Producers and Consumers have different roles: Producers make the dashboards and share them, while Consumers use the dashboards that are shared. 

Let's take a closer look at these two roles:

1. **Dashboard Producers:** Producers experienced a success rate of approximately 33% and an additional 38% with assistance. They had a failure rate of approximately 30%. The most successful task was the creation of a view for log data, and the least successful task was the creation of an index pattern. Dashboard producers did not understand how to select the desired index in order to create a new index. Many expected to add indexes by clicking on the individual index name. Users tried to click on ‘Index pattern’ displayed next to the index names. Other complexities such as using an asterisk to select multiple indexes were not intuitive to the user, further creating obstacles to this critical first step in setting up dashboards. 
2. **Dashboard Consumers:** Consumers succeeded at approximately 17% of the total attempts, but had a higher assisted success rate of 41%. Approximately 41% of tasks were failures. Consumers were most successful when they were asked to share insights. They were least successful when asked to edit a visual without modifying the existing dashboard. Users expected to access editing through settings within an individual visualization. Users clicked around and spent time discovering entry points and explored all the additional steps required to edit the visual. 

Producers and Consumers have a clear idea of how they want to accomplish tasks, and OpenSearch has the capabilities to help them do so. The participants did not, however, know what features were available or how to perform the required actions within OpenSearch Dashboards.
 
The following are some possible ways in which Dashboards could be improved: 

* Providing more guidance: Tooltips, auto-complete, and dropdown assistance would ease or eliminate the challenges faced when creating index patterns, setting filters, and searching available options within specific fields.
* Increasing ease of use: Improving the sorting capabilities and streamlining processes for adding panels to dashboards and creating index patterns would increase ease of use. Further, providing dashboard templates and widening the click radius (that is, the clickable area around an element) for selecting fields would improve overall usability.
* Improving alignment with mental models: Adjusting the entry points for editing panels and downloading content and offering security filters would make the Dashboards interface more consistent with what users expect. 
* Enhancing visibility and discoverability of Dashboards features and products: Making dropdowns, filtering capabilities, and visualization options more accessible and easier to see would improve users' awareness of the available tools.
* Conducting additional research: Baselines for log analytics using duplicative tools, such as log explorer, and for use cases, such as security analytics, observability, or search, would help in evaluating the usability of various tools and workflows. 

## Conclusion

The findings from the Q1 2023 OpenSearch Dashboards study gave us better insight into what both Producers and Consumers require. We now have a better understanding of the current issues, usability gaps, and potential improvements related to overall usability. We are using the key takeaways (provide more user guidance, improve user-friendliness, align better with mental models, make features and tools more visible) can help to prioritize the roadmap of feature improvements while enhancing the user experience for both Producers and Consumers. 

To learn more about our efforts toward the dashboard vision, look and feel and modernization, please see the [Request for Comments (RFC)](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4298) on GitHub. We encourage you to get involved in our user experience studies. You can sign up at this link: [https://amazonmr.au1.qualtrics.com/jfe/form/SV_251DHi1opohhist](https://amazonmr.au1.qualtrics.com/jfe/form/SV_251DHi1opohhist) 

## References

Sundar, A. 2023. [OpenSearch Partners with Key lime Interactive for Usability Studies: Admin Panel Workflows](https://opensearch.org/blog/opensearch-partners-with-key-lime-interactive-for-usability-studies-admin-panel-workflows/).
