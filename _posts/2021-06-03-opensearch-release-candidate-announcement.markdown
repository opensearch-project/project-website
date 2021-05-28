---
layout: post
title:  "The OpenSearch Release Candidate is now available on GitHub"
authors: 
  - andhopp
date:   2021-06-02
categories: update
---

Today we are proud to announce the Release Candidate for version 1.0.0 of both OpenSearch (derived from Elasticsearch 7.10.2) and OpenSearch Dashboards (derived from Kibana 7.10.2). The Release Candidate includes downloadable [artifacts](https://opensearch.org/downloads.html) (Linux tars and Docker images) as well as as a number of OpenSearch plugins (see below). 

**What does release candidate mean exactly?**

A Release Candidate is a beta version of a project that is feature complete and passing automated testing with the intent to validate expected functionality before moving to a GA launch. The goal with this Release Candidate is to share the current release with the community and solicit a final round of testing and feedback before the 1.0.0 GA release. Between now and the 1.0.0 release of OpenSearch nad OpenSearch Dashboards, we expect no further changes apart from critical bug fixes (and additional artifacts?). 

**What is included in this Release Candidate?**

Here’s a quick rundown of some of the most exciting stuff that is part of this release;

- Infra /DevOps (link pending)
- [AD](https://github.com/opensearch-project/anomaly-detection/blob/main/release-notes/opensearch-anomaly-detection.release-notes-1.0.0.0-rc1.md)
- [AD Kibana](https://github.com/opensearch-project/anomaly-detection-dashboards-plugin/blob/main/release-notes/opensearch-anomaly-detection-dashboards.release-notes-1.0.0.0-rc1.md)
- [Security](https://github.com/opensearch-project/security-dashboards-plugin/blob/main/release-notes/opensearch-security-dashboards-plugin.release-notes-1.0.0.0-rc1.md)
- [Security Dasboards](https://github.com/opensearch-project/security/blob/main/release-notes/opensearch-security.release-notes-1.0.0.0-rc1.md)
- [Performance Analyzer](https://github.com/opensearch-project/performance-analyzer/blob/main/release-notes/opensearch-performance-analyzer.release-notes-1.0.0.0-rc1.md)
- [PerfTop](https://github.com/opensearch-project/perftop/blob/main/release-notes/opensearch-perftop.release-notes-1.0.0.0-rc1.md)
- [K-NN](https://github.com/opensearch-project/k-NN/blob/main/release-notes/opensearch-knn.release-notes-1.0.0.0-rc1.md)
- [Job Scheduler](https://github.com/opensearch-project/job-scheduler/blob/main/release-notes/opensearch.job-scheduler.release-notes-1.0.0.0-rc1.md)
- [Index Management](https://github.com/opensearch-project/index-management/blob/main/release-notes/opensearch-index-management.release-notes-1.0.0.0-rc1.md )
- [Index Management Dashboard](https://github.com/opensearch-project/index-management-dashboards-plugin/blob/main/release-notes/opensearch-index-management-dashboards-plugin.release-notes-1.0.0.0-rc1.md)
- [Alerting](https://github.com/opensearch-project/alerting/blob/main/release-notes/opensearch-alerting.release-notes-1.0.0.0-rc1.md)
- [Alerting Dashboard](https://github.com/opensearch-project/alerting-dashboards-plugin/blob/main/release-notes/opensearch-alerting-dashboards-plugin.release-notes-1.0.0.0-rc1.md)
- [SQL/PPL OpenSearch Plugin](https://github.com/opensearch-project/sql/blob/main/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [Query Workbench Dashboards Plugin](https://github.com/opensearch-project/sql/blob/main/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [SQL JDBC Driver](https://github.com/opensearch-project/sql/blob/main/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [SQL CLI Client](https://github.com/opensearch-project/sql/blob/main/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [SQL ODBC Driver](https://github.com/opensearch-project/sql/blob/main/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [Notebooks OpenSearch Plugin](https://github.com/opensearch-project/dashboards-notebooks/blob/main/release-notes/opensearch-dashboards-notebooks.release-notes-1.0.0.0-rc1.md)
- [Notebooks Dashboards Plugin](https://github.com/opensearch-project/dashboards-notebooks/blob/main/release-notes/opensearch-dashboards-notebooks.release-notes-1.0.0.0-rc1.md)
- [Reporting Dashboards Plugin](https://github.com/opensearch-project/dashboards-reports/blob/main/release-notes/opensearch-dashboards-reports.release-notes-1.0.0.0-rc1.md)
- [Reporting Opensearch Plugin](https://github.com/opensearch-project/dashboards-reports/blob/main/release-notes/opensearch-dashboards-reports.release-notes-1.0.0.0-rc1.md)
- [Trace Analytics Dashboards Plugin](https://github.com/opensearch-project/trace-analytics/blob/main/release-notes/opensearch-trace-analytics.release-notes-1.0.0.0-rc1.md)
- [Gantt Chards - Dashboards Visualization plugin](https://github.com/opensearch-project/dashboards-visualizations/blob/main/release-notes/opensearch-dashboards-visualizations.release-notes-1.0.0.0-rc1.md)
- [Async-Search](https://github.com/opensearch-project/asynchronous-search/blob/main/release-notes/opensearch-asynchronous-search.release-notes-1.0.0.0-rc1.md)
- [Common-Utils](https://github.com/opensearch-project/common-utils/blob/main/release-notes/opensearch-common-utils.release-notes-1.0.0.0-rc1.md)

**What does this Release Candidate not inlcude?** (Needs Cleanup)

* **Clients** - We are aware of the issues associated with client with license checks and are working on a solution for the community. [Need to clarify and update]
* **Minumum artifacts** - Based on community feedback, we will be releasing a standalone, minimal downloadable artifacts without the OpenSearch plugins (alerting, AD, security, etc…). We're expecting to deliver this by GA. 
* **Additional artifacts** - In additon to the current artificts (Linux tars and Docker images) we are hoping to deliver RPM (X64), Windows (X64), and DEB (X64).

**How can you help?** 

Since the intent of a release candidate is to share the current release with the community to test and validate expected functionality, the best thing you can do is run the release Candidate through it's paces. Every bit of testing or feedback the community can provide helps ensure that the changes are doing what they should and we're building to the best end product. Couple specific places to start;

- Install the Release Candidate by following the instructions given here [TBD].
- Participate in testing by following the testing and reporting instructions here [Do we have this?]. 
- (Placeholder) Run rolling upgrades from existing version to OpenSearch RC1 in a sandbox cluster. 
- (Placeholder) Test clients! We want to know what is working and not working for you. 

Before installing or upgrading to OpenSearch 1.0.0 or OpenSearch Dashboards 1.0.0 please read the [release notes](TBD). While we consider this 1.0.0 release candidate suitable for testing by the community, you should not use a release candidate in a production environment - a release candidate is provided for testing and validation purposes only.

**What’s next?**

We will be working with the community to test for bugs or feature gaps and working towards a GA release. Our plan is to release of final version 1.0.0 is scheduled for July 12, 2021. Stay tuned to the [forums](https://discuss.opendistrocommunity.dev/), GitHub ([OpenSearch Project](https://github.com/opensearch-project)), the community [meeting](https://www.meetup.com/Open-Distro-for-Elasticsearch-Meetup-Group), and our [blog](https://opensearch.org/blog/) for the latest updates and announcements. 

In the meantime join us (if you haven't already)! Feel free to take a look around at what we’ve been up to, check out the public roadmap, and then head over to look at the open issues. Or you could jump right in and start opening issues or contributing. For more details see [here](https://github.com/opensearch-project/OpenSearch/blob/main/CONTRIBUTING.md).
