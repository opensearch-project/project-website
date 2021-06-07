---
layout: post
title:  "OpenSearch Release Candidate (RC1) is now available"
authors: 
  - andhopp
date:   2021-06-07
categories: update
---

Today we are excited to announce the Release Candidate (RC1) for version 1.0.0 of both OpenSearch (derived from Elasticsearch 7.10.2) and OpenSearch Dashboards (derived from Kibana 7.10.2). The Release Candidate includes downloadable [artifacts](https://opensearch.org/downloads.html) (Linux tars and Docker images) as well as a number of OpenSearch plugins (listed below). 

**So what does a release candidate mean exactly?**

This Release Candidate is a version of the project that is feature complete and passing automated testing with the intent to validate expected functionality before moving to a GA launch. The goal with this Release Candidate is to share the current release with the community and solicit a final round of testing and feedback before the GA release. Between now and the 1.0.0 release of OpenSearch and OpenSearch Dashboards, we expect no further changes apart from critical bug fixes and the release of additional artifacts (see below). 

**What is included in this Release Candidate?**

There is a long list of enhancements and fixes include with this release including span filtering support in Trace Analytics, tenant support in Notebooks, K-NN field level algorithm selection, support for index management transforms, and support for scheduling and tenants in reporting. Below you'll find the detailed highlights that are part of this release;

- [OpenSearch](https://github.com/opensearch-project/OpenSearch/blob/main/release-notes/opensearch.release-notes-1.0.0-rc1.md)
- [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/release-notes/opensearch-dashboards.release-notes-1.0.0-rc1.md)
- [Anomaly Detection](https://github.com/opensearch-project/anomaly-detection/blob/main/release-notes/opensearch-anomaly-detection.release-notes-1.0.0.0-rc1.md)
- [Anomaly Detection Dashboards](https://github.com/opensearch-project/anomaly-detection-dashboards-plugin/blob/main/release-notes/opensearch-anomaly-detection-dashboards.release-notes-1.0.0.0-rc1.md)
- [Security](https://github.com/opensearch-project/security-dashboards-plugin/blob/main/release-notes/opensearch-security-dashboards-plugin.release-notes-1.0.0.0-rc1.md)
- [Security Dashboards](https://github.com/opensearch-project/security/blob/main/release-notes/opensearch-security.release-notes-1.0.0.0-rc1.md)
- [Performance Analyzer](https://github.com/opensearch-project/performance-analyzer/blob/main/release-notes/opensearch-performance-analyzer.release-notes-1.0.0.0-rc1.md)
- [PerfTop](https://github.com/opensearch-project/perftop/blob/main/release-notes/opensearch-perftop.release-notes-1.0.0.0-rc1.md)
- [K-NN](https://github.com/opensearch-project/k-NN/blob/main/release-notes/opensearch-knn.release-notes-1.0.0.0-rc1.md)
- [Job Scheduler](https://github.com/opensearch-project/job-scheduler/blob/main/release-notes/opensearch.job-scheduler.release-notes-1.0.0.0-rc1.md)
- [Index Management](https://github.com/opensearch-project/index-management/blob/main/release-notes/opensearch-index-management.release-notes-1.0.0.0-rc1.md )
- [Index Management Dashboards](https://github.com/opensearch-project/index-management-dashboards-plugin/blob/main/release-notes/opensearch-index-management-dashboards-plugin.release-notes-1.0.0.0-rc1.md)
- [Alerting](https://github.com/opensearch-project/alerting/blob/main/release-notes/opensearch-alerting.release-notes-1.0.0.0-rc1.md)
- [Alerting Dashboards](https://github.com/opensearch-project/alerting-dashboards-plugin/blob/main/release-notes/opensearch-alerting-dashboards-plugin.release-notes-1.0.0.0-rc1.md)
- [SQL/PPL OpenSearch Plugin](https://github.com/opensearch-project/sql/blob/main/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [Query Workbench Dashboards Plugin](https://github.com/opensearch-project/sql/blob/main/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [SQL JDBC Driver](https://github.com/opensearch-project/sql/blob/main/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [SQL CLI Client](https://github.com/opensearch-project/sql/blob/main/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [SQL ODBC Driver](https://github.com/opensearch-project/sql/blob/main/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [Notebooks OpenSearch Plugin](https://github.com/opensearch-project/dashboards-notebooks/blob/main/release-notes/opensearch-dashboards-notebooks.release-notes-1.0.0.0-rc1.md)
- [Notebooks Dashboards Plugin](https://github.com/opensearch-project/dashboards-notebooks/blob/main/release-notes/opensearch-dashboards-notebooks.release-notes-1.0.0.0-rc1.md)
- [Reporting Opensearch Plugin](https://github.com/opensearch-project/dashboards-reports/blob/main/release-notes/opensearch-dashboards-reports.release-notes-1.0.0.0-rc1.md)
- [Reporting Dashboards Plugin](https://github.com/opensearch-project/dashboards-reports/blob/main/release-notes/opensearch-dashboards-reports.release-notes-1.0.0.0-rc1.md)
- [Trace Analytics Dashboards Plugin](https://github.com/opensearch-project/trace-analytics/blob/main/release-notes/opensearch-trace-analytics.release-notes-1.0.0.0-rc1.md)
- [Gantt Charts Dashboards Visualization Plugin](https://github.com/opensearch-project/dashboards-visualizations/blob/main/release-notes/opensearch-dashboards-visualizations.release-notes-1.0.0.0-rc1.md)
- [Async-Search](https://github.com/opensearch-project/asynchronous-search/blob/main/release-notes/opensearch-asynchronous-search.release-notes-1.0.0.0-rc1.md)
- [Common-Utils](https://github.com/opensearch-project/common-utils/blob/main/release-notes/opensearch-common-utils.release-notes-1.0.0.0-rc1.md)

Consolidated release notes can be found [here](https://github.com/opensearch-project/OpenSearch/tree/main/release-notes). 

**What does this Release Candidate not include?** 

* *Minimum Artifacts* - Based on community [feedback](https://github.com/opensearch-project/opensearch-build/issues/31), we plan on releasing a standalone, minimal downloadable artifacts without the OpenSearch plugins (alerting, AD, security, etc.). We are expecting to deliver these artifacts by GA.
* *Additional Artifacts* - In addition to the current artifacts (Linux tars and Docker images) we are aiming to deliver RPM (X64), Windows (X64), and DEB (X64) by GA and Tar (ARM64), DEB (ARM64), RPM (ARM64), MacOS (M1 ARM), and MacOS (X64) by OpenSearch 1.1. 
* *Clients with License Checks* - We are aware of the issue with license checks which are causing incompatibilities (i.e. the recent release of Logstash & Beats 7.13) and are working on a solution for the community before GA.

**How can you help?** 

The best thing you can do is run the Release Candidate through its paces. Every bit of testing or feedback the community can provide helps ensure that the changes are doing what they should and we are building to the best end product. Couple specific places to start;

- Install the Release Candidate and open an [issue](https://github.com/opensearch-project/OpenSearch/issues) to report any bugs you discover. 
- Run rolling upgrades from existing version to OpenSearch RC1 in a sandbox cluster. 
- Test clients! We want to know what is working (and not working) for you. 
- Use our [docs](https://docs-beta.opensearch.org/) and highlight any additional content you'd like to see! Or submit a PR and add any content you think would be valuable.

Before installing or upgrading to OpenSearch 1.0.0 or OpenSearch Dashboards 1.0.0, please read the release notes ([OpenSearch](https://github.com/opensearch-project/OpenSearch/blob/main/release-notes/opensearch.release-notes-1.0.0-rc1.md) and [OpenSearch Dashboard](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/release-notes/opensearch-dashboards.release-notes-1.0.0-rc1.md)). While we consider this 1.0.0 release candidate suitable for testing by the community, you should not use a release candidate in a production environment - this release candidate is provided for testing and validation purposes only.

**Speaking of help...**

We would like to pass our thanks to those currently contributing to OpenSearch! 

[aadrien](https://discuss.opendistrocommunity.dev/u/aadrien), [accat](https://discuss.opendistrocommunity.dev/u/acca), [ace03uec](https://github.com/ace03uec), [adkalavadia](https://discuss.opendistrocommunity.dev/u/adkalavadia), [alexz00](https://discuss.opendistrocommunity.dev/u/alexz00), [AmiStrn](https://github.com/AmiStrn), [amitai](https://discuss.opendistrocommunity.dev/u/amitai), [anthonylouisbsb](https://github.com/anthonylouisbsb), [aparo](https://discuss.opendistrocommunity.dev/u/aparo), [asfoorial](https://discuss.opendistrocommunity.dev/u/asfoorial), [astateofmind](https://discuss.opendistrocommunity.dev/u/astateofmind), [Bhupendra](https://discuss.opendistrocommunity.dev/u/Bhupendra), [BlackMetalz](https://discuss.opendistrocommunity.dev/u/BlackMetalz), [Bobpartb](https://discuss.opendistrocommunity.dev/u/Bobpartb), [bradlee](https://discuss.opendistrocommunity.dev/u/bradlee), [brandtj](https://discuss.opendistrocommunity.dev/u/brandtj), [Conan-Kudo](https://github.com/Conan-Kudo), [dawnfoster](https://discuss.opendistrocommunity.dev/u/dawnfoster), [denysvitali](https://github.com/denysvitali), [dirkhh](https://discuss.opendistrocommunity.dev/u/dirkhh), [erhan](https://discuss.opendistrocommunity.dev/u/erhan), [erickg](https://discuss.opendistrocommunity.dev/u/erickg), [fabide](https://discuss.opendistrocommunity.dev/u/fabide), [FreCap](https://github.com/FreCap), [frotsch](https://discuss.opendistrocommunity.dev/u/frotsch), [galangel](https://github.com/galangel), [geekygirldawn](https://github.com/geekygirldawn), [GezimSejdiu](https://discuss.opendistrocommunity.dev/u/GezimSejdiu), [ginger](https://discuss.opendistrocommunity.dev/u/ginger), [GoodMirek](https://discuss.opendistrocommunity.dev/u/GoodMirek), [hagayg](https://discuss.opendistrocommunity.dev/u/hagayg), [Hakky54](https://github.com/Hakky54), [horizondave](https://discuss.opendistrocommunity.dev/u/horizondave), [horovits](https://discuss.opendistrocommunity.dev/u/horovits), [igorid70](https://discuss.opendistrocommunity.dev/u/igorid70), [janhoy](https://discuss.opendistrocommunity.dev/u/janhoy), [jkeirstead](https://discuss.opendistrocommunity.dev/u/jkeirstead), [jkowall](https://discuss.opendistrocommunity.dev/u/jkowall), [jkowall](https://github.com/jkowall), [justme](https://discuss.opendistrocommunity.dev/u/justme), [Katulus](https://discuss.opendistrocommunity.dev/u/Katulus), [kyleconroy](https://github.com/kyleconroy), [lornajane](https://discuss.opendistrocommunity.dev/u/lornajane), [Malini](https://discuss.opendistrocommunity.dev/u/Malini), [mattwelke](https://discuss.opendistrocommunity.dev/u/mattwelke), [mosajjal](https://discuss.opendistrocommunity.dev/u/mosajjal), [nickytd](https://discuss.opendistrocommunity.dev/u/nickytd), [Northern](https://discuss.opendistrocommunity.dev/u/Northern), [opensorcerer89](https://discuss.opendistrocommunity.dev/u/opensorcerer89), [oscark](https://discuss.opendistrocommunity.dev/u/oscark), [otisg](https://discuss.opendistrocommunity.dev/u/otisg), [ralph](https://discuss.opendistrocommunity.dev/u/ralph), [retzkek](https://discuss.opendistrocommunity.dev/u/retzkek), [rmuir](https://github.com/rmuir), [robcowart](https://discuss.opendistrocommunity.dev/u/robcowart), [santiagobassett](https://discuss.opendistrocommunity.dev/u/santiagobassett), [SergioFG](https://discuss.opendistrocommunity.dev/u/SergioFG), [shamil](https://discuss.opendistrocommunity.dev/u/shamil), [sharp-pixel](https://github.com/sharp-pixel), [sksamuel](https://discuss.opendistrocommunity.dev/u/sksamuel), [spapadop](https://discuss.opendistrocommunity.dev/u/spapadop), [sunilchadha](https://discuss.opendistrocommunity.dev/u/sunilchadha), [tardyp](https://discuss.opendistrocommunity.dev/u/tardyp), [Tom1](https://discuss.opendistrocommunity.dev/u/Tom1), [ttx](https://discuss.opendistrocommunity.dev/u/ttx), [tvc_apisani](https://discuss.opendistrocommunity.dev/u/tvc_apisani), and [willyb](https://discuss.opendistrocommunity.dev/u/willyb)

If we have missed anyone on this list, please reach out and we will very gratefully add you!

**What’s next?**

Let's work together to test for bugs and identify feature gaps while working towards a GA release. Our goal is to release of final version 1.0.0 is scheduled for July 12, 2021 (check out the public [roadmap](https://github.com/orgs/opensearch-project/projects/1)). Stay tuned to the [forums](https://discuss.opendistrocommunity.dev/), [GitHub](https://github.com/opensearch-project), the community [meeting](https://www.meetup.com/Open-Distro-for-Elasticsearch-Meetup-Group), and our [blog](https://opensearch.org/blog/) for the latest updates and announcements. 

In the meantime, join us (if you haven't already)! Feel free to take a look around at what the community has been up to, check out the public [roadmap](https://github.com/orgs/opensearch-project/projects/1), and then head over to look at the open issues. Or you could jump right in and start opening issues or contributing. For more details see [here](https://github.com/opensearch-project/OpenSearch/blob/main/CONTRIBUTING.md).
