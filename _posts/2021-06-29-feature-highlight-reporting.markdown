---
layout: post
title:  "OpenSearch Reporting 101"
authors: 
  - jadhanir
  - elifish
date:   2021-06-29 01:01:01 -0700
categories: feature
redirect_from: "/blog/feature/2021/06/feature-highlight-reporting/"
---

The OpenSearch [Reporting](https://github.com/opensearch-project/dashboards-reports) feature helps users generate reports from Dashboards, Visualizations, and the Discover panel and export them to PDF, PNG, and CSV file formats to easily share. In this blog post we talk about how to use the reporting feature, how it is implemented and how it was built with numerous contributions from the open source community. Last, we discuss future plans to improve it.

**What is Reporting in OpenSearch ?**
Reporting is a form of organizing data into formal summaries; to make reports visually appealing Reporting also supports charts and graphs. Reports are classified into two primary types, visual reports (i.e. PDF and PNG) and data reports (CSVs). 

**How can reports be generated ?**
Reports are generated manually on OpenSearch Dashboards, via scheduled triggers, or through system triggers like alerts or API calls.

**Anatomy of the Reporting feature on OpenSearch**
The reporting feature is composed of two plugins; an [OpenSearch Dashboards plugin](https://github.com/opensearch-project/dashboards-reports/tree/main/dashboards-reports) which controls most of the [user experience](https://github.com/opensearch-project/dashboards-reports/blob/main/docs/dashboards-reports/ux/OpenSearch-Dashboards-Reporting-UX-documentation.md) and the [OpenSearch plugin](https://github.com/opensearch-project/dashboards-reports/tree/main/reports-scheduler) which provides scheduling features and secures access to user data with OpenSearch Security policies. The initial request for comments (RFC) for Reporting can be found [here](https://github.com/opensearch-project/dashboards-reports/blob/main/docs/dashboards-reports/dev/OpenSearch-Dashboards-Reporting-Design-Proposal.md).

![Report Anatomy](/assets/media/blog-images/2021-06-29-feature-highlight-reporting/report-anatomy.png){: .img-fluid}

## Quick Start User Guide

### Installation

Reporting comes packaged with the OpenSearch and OpenSearch Dashboards downloads. You can follow the installation instructions on [opensearch.org/downloads](https://opensearch.org/downloads.html) 

### How do I create a report?

**Visual reports** are created inside Visualizations or Dashboards. 

![visual reports](/assets/media/blog-images/2021-06-29-feature-highlight-reporting/visual-reports.gif){: .img-fluid}

**CSV reports** are created from the Discover tab.

![csv reports](/assets/media/blog-images/2021-06-29-feature-highlight-reporting/csv-reports.gif){: .img-fluid}

**Scheduled reports** are configured from inside the Reporting UI under OpenSearch Plugins.

![scheduled reports](/assets/media/blog-images/2021-06-29-feature-highlight-reporting/create-report-definition.gif){: .img-fluid}

## Development internals

The reporting feature uses a custom [minimal build](https://github.com/opensearch-project/dashboards-reports/tree/main/dashboards-reports/rendering-engine/headless-chrome) of headless-chromium. Chromium is used as the rendering engine to generate visual reports. Below is are multiple flow diagrams for the various actions of Reporting. 

**Creating a report definition**: When a user defines a report in OpenSearch Dashboards, the Reporting Dashboards plugin saves that definition in an index in OpenSearch. 

**Downloading a report:** When a user downloads a report, the OpenSearch Dashboards Reporting plugin fetches the data from OpenSearch. After the data is fetched, the report is generated and downloaded to the users browser.

**Running a reporting job:** When a schedule report begins, data is fetched from OpenSearch, next the OpenSearch Dashboards Reporting plugin generates the report. Once the report is generated, it is sent to the configured destination in the reporting policy and the job status is updated and stored back in OpenSearch.

![flow diagram](/assets/media/blog-images/2021-06-29-feature-highlight-reporting/flow-diagram.png){: .img-fluid}

## Community contributions

Reporting was built by multiple contributors from the community (some PRs listed below). Our team presented the initial Reporting contributions in a community meeting with the [Reports RFC](https://github.com/opendistro-for-elasticsearch/kibana-reports/blob/master/docs/dev/Kibana-Reporting-Design-Proposal.md). Our team went over the initial design and requirements, and our high level plan to develop the feature. After the community meeting, some of the attendees expressed interest in contributing and helped build the CSV functionality. Since the initial release, there have been numerous other community contributions to improve and customize the project (see below). We thank all the contributors who have helped build the Reporting feature!

* [CSV APIs endpoints for data reports. #50](https://github.com/opendistro-for-elasticsearch/kibana-reports/pull/50)
* [Improve quality of rendered PDFs #354](https://github.com/opendistro-for-elasticsearch/kibana-reports/pull/354)
* [passing default proxy-authentication headers #329](https://github.com/opendistro-for-elasticsearch/kibana-reports/pull/329)
* [Ignore custom commented areas. #314](https://github.com/opendistro-for-elasticsearch/kibana-reports/pull/314)
* [Add dynamic wait to allow page content to render #331](https://github.com/opendistro-for-elasticsearch/kibana-reports/pull/331)
* [Use commonlyUsedRanges from Settings instead of a constant value #352](https://github.com/opendistro-for-elasticsearch/kibana-reports/pull/352)
* [Add i18n translation support #362](https://github.com/opendistro-for-elasticsearch/kibana-reports/pull/362)
* [Improve sanity tests #361](https://github.com/opendistro-for-elasticsearch/kibana-reports/pull/361)

and more...

If you’re interested in contributing please reach out on [GitHub issues](https://github.com/opensearch-project/dashboards-reports/issues) or [the community forum](https://discuss.opendistrocommunity.dev/). The more formal contribution guidelines are documented [here](https://github.com/opensearch-project/dashboards-reports/blob/main/CONTRIBUTING.md). 

## Future project goals

* Create integrations with Alerting, Notebooks and other plugins
* Enable support for slack, chime, webhooks, pager-duty, and other destinations via the [Notifications plugin](https://github.com/opensearch-project/notifications).
* Remove the hard dependency on headless-chromium by enabling support for a Java-based rendering engine.
* Enable APIs for programatic reporting

