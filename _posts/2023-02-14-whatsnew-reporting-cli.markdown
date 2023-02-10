---
layout: post
title:  "What’s new: OpenSearch Reporting CLI"
authors:
- maharup
- jdbright
- jadhanir
- lijshu
- alicejw
date: 2023-02-14 00:00:00 -0700
categories:
 - technical-post
 meta_keywords: "Reporting CLI, automate reports"
 meta_description: "The Reporting CLI makes it convenient to generate reports externally without logging in to OpenSearch Dashboards."
---

The OpenSearch Project is happy to announce the release of the Reporting CLI, making it convenient to generate reports externally without logging in to OpenSearch Dashboards. This gives you the flexibility to programmatically generate reports and connect them to your preferred messaging system. You can now schedule and transport reports efficiently through email.

In this post we’ll show you a few examples of how to leverage the capabilities of the Reporting CLI, such as:  

* Generating a PDF from an eCommerce dashboard that shows data visualizations and scheduling the report to run at a specific time using cron.
* Incorporating report generation into your workflow with email or notifications.
* Generating a CSV from tabular data in the Dashboards **Discover** application

### What is the Reporting CLI?

The Reporting CLI is a package you can install separately from the Reporting plugin that allows you to specify an OpenSearch Dashboards **Discover** URL and generate a report in PDF or PNG format. You can download reports you generate locally or send reports programmatically to downstream messaging systems. You can also leverage the capabilities of the Reporting CLI to email CSV reports, but that requires the Reporting plugin.

### What can you do with the Reporting CLI?

The Reporting CLI can save you time by automating report generation and distribution across messaging systems and provides access to the report data through several authentication options.

If you want more flexibility in how you can distribute reports throughout your organization through multiple messaging systems, such as Slack or SES email systems, you can conveniently schedule and deliver those Dashboard **Discover** reports with the Reporting CLI.

If you want to use an AWS service event to trigger a report, you can configure a trigger using AWS Lambda.

### Example: Generating a PDF from a Dashboard

You can generate an eCommerce revenue Dashboard PDF report to show all of the data visualizations, and schedule the report to run at a specific day and time with the cron utility.

![Image: An example Dashboard visualization PDF]({{site.baseurl}}/assets/media/blog-images/2023-02-14-whatsnew-reporting-cli/cli-pdf-report.png){:.img-fluid }

### Example: Using advanced options to add Reporting CLI into your workflow*

The Reporting CLI allows engineering and builder-focused people to configure and connect their generated reports with messaging systems by specifying the advanced CLI options. Out of the box, the Reporting CLI will download the report locally, but what if you want to send the report to someone? Below are a few ideas on how you would go about doing that.

* **Email** – Send the report to stakeholders using [Amazon SES](https://aws.amazon.com/ses/) or Oracle Cloud Infrastructure (OCI) Email Delivery service.

* **Schedule a report using notifications** – Use [Amazon Simple Notification Service (Amazon SNS)](https://aws.amazon.com/sns/) or Oracle Notification Service (ONS) to trigger a report and send a message to Slack, PagerDuty, or ServiceNow.

### Example: Generating a CSV report from tabular data

If you have tabular data in a **Discover** view, you can generate a CSV report to capture all the data and send to stakeholders. This is the one exception that requires you to log into the Dashboards and use the Reporting Plugin.

![Image: An example tabular Dashboard to create a CSV report]({{site.baseurl}}/assets/media/blog-images/2023-02-14-whatsnew-reporting-cli/tab-csv.png){:.img-fluid }

### Summary

We encourage you to try out the Reporting CLI and let us know what you think! How do you incorporate the Reporting CLI into your workflows? We would love to hear from you! If you encounter any challenges with this feature, please let us know by creating a [GitHub issue](https://github.com/opensearch-project/reporting-cli/issues).

To get started using the Reporting CLI, see [Creating reports with the Reporting CLI](https://opensearch.org/docs/latest/dashboards/reporting-cli/rep-cli-index/) in the OpenSearch documentation.