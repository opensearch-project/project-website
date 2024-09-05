---
layout: post
title:  "OpenSearch Release Candidate (RC1) is now available"
authors: 
  - andhopp
date:   2021-06-07
categories: update
redirect_from: "/blog/update/2021/06/opensearch-release-candidate-announcement/"
---

Today I am excited to announce the Release Candidate (RC1) for version 1.0.0 of both OpenSearch (derived from Elasticsearch 7.10.2) and OpenSearch Dashboards (derived from Kibana 7.10.2). The Release Candidate includes downloadable [artifacts](https://opensearch.org/downloads.html) (Linux tars and Docker images) as well as a number of OpenSearch plugins (listed below). 

**So what does a release candidate mean exactly?**

This Release Candidate is a version of the project that is feature complete and passing automated testing with the intent to validate expected functionality before moving to a General Availability (GA) launch. The goal with this Release Candidate is to share the current release with the community and solicit a final round of testing and feedback before the GA release. Between now and the 1.0.0 release of OpenSearch and OpenSearch Dashboards, you should expect no further changes apart from critical bug fixes and the release of additional artifacts (see below). 

**What is included in this Release Candidate?**

There is a long list of enhancements and fixes that are part of this release including span filtering support in Trace Analytics, tenant support in Notebooks, K-NN field level algorithm selection, support for index management transforms, and support for scheduling and tenants in reporting. Below you'll find the detailed highlights for this release:

- [OpenSearch](https://github.com/opensearch-project/OpenSearch/blob/main/release-notes/opensearch.release-notes-1.0.0-rc1.md)
- [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.x/release-notes/opensearch-dashboards.release-notes-1.0.0-rc1.md)
- [Anomaly Detection](https://github.com/opensearch-project/anomaly-detection/blob/1.x/release-notes/opensearch-anomaly-detection.release-notes-1.0.0.0-rc1.md)
- [Anomaly Detection Dashboards](https://github.com/opensearch-project/anomaly-detection-dashboards-plugin/blob/1.x/release-notes/opensearch-anomaly-detection-dashboards.release-notes-1.0.0.0-rc1.md)
- [Security](https://github.com/opensearch-project/security-dashboards-plugin/blob/1.x/release-notes/opensearch-security-dashboards-plugin.release-notes-1.0.0.0-rc1.md)
- [Security Dashboards](https://github.com/opensearch-project/security/blob/1.x/release-notes/opensearch-security.release-notes-1.0.0.0-rc1.md)
- [Performance Analyzer](https://github.com/opensearch-project/performance-analyzer/blob/1.x/release-notes/opensearch-performance-analyzer.release-notes-1.0.0.0-rc1.md)
- [PerfTop](https://github.com/opensearch-project/perftop/blob/1.x/release-notes/opensearch-perftop.release-notes-1.0.0.0-rc1.md)
- [K-NN](https://github.com/opensearch-project/k-NN/blob/1.x/release-notes/opensearch-knn.release-notes-1.0.0.0-rc1.md)
- [Job Scheduler](https://github.com/opensearch-project/job-scheduler/blob/1.x/release-notes/opensearch.job-scheduler.release-notes-1.0.0.0-rc1.md)
- [Index Management](https://github.com/opensearch-project/index-management/blob/1.x/release-notes/opensearch-index-management.release-notes-1.0.0.0-rc1.md)
- [Index Management Dashboards](https://github.com/opensearch-project/index-management-dashboards-plugin/blob/1.x/release-notes/opensearch-index-management-dashboards-plugin.release-notes-1.0.0.0-rc1.md)
- [Alerting](https://github.com/opensearch-project/alerting/blob/1.x/release-notes/opensearch-alerting.release-notes-1.0.0.0-rc1.md)
- [Alerting Dashboards](https://github.com/opensearch-project/alerting-dashboards-plugin/blob/1.x/release-notes/opensearch-alerting-dashboards-plugin.release-notes-1.0.0.0-rc1.md)
- [SQL/PPL OpenSearch Plugin](https://github.com/opensearch-project/sql/blob/1.x/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [Query Workbench Dashboards Plugin](https://github.com/opensearch-project/sql/blob/1.x/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [SQL JDBC Driver](https://github.com/opensearch-project/sql/blob/1.x/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [SQL CLI Client](https://github.com/opensearch-project/sql/blob/1.x/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [SQL ODBC Driver](https://github.com/opensearch-project/sql/blob/1.x/release-notes/opensearch-sql.release-notes-1.0.0.0-rc1.md)
- [Notebooks OpenSearch Plugin](https://github.com/opensearch-project/dashboards-notebooks/blob/1.x/release-notes/opensearch-dashboards-notebooks.release-notes-1.0.0.0-rc1.md)
- [Notebooks Dashboards Plugin](https://github.com/opensearch-project/dashboards-notebooks/blob/1.x/release-notes/opensearch-dashboards-notebooks.release-notes-1.0.0.0-rc1.md)
- [Reporting Opensearch Plugin](https://github.com/opensearch-project/dashboards-reports/blob/1.x/release-notes/opensearch-dashboards-reports.release-notes-1.0.0.0-rc1.md)
- [Reporting Dashboards Plugin](https://github.com/opensearch-project/dashboards-reports/blob/1.x/release-notes/opensearch-dashboards-reports.release-notes-1.0.0.0-rc1.md)
- [Trace Analytics Dashboards Plugin](https://github.com/opensearch-project/trace-analytics/blob/1.x/release-notes/opensearch-trace-analytics.release-notes-1.0.0.0-rc1.md)
- [Gantt Charts Dashboards Visualization Plugin](https://github.com/opensearch-project/dashboards-visualizations/blob/1.x/release-notes/opensearch-dashboards-visualizations.release-notes-1.0.0.0-rc1.md)
- [Async-Search](https://github.com/opensearch-project/asynchronous-search/blob/1.x/release-notes/opensearch-asynchronous-search.release-notes-1.0.0.0-rc1.md)
- [Common-Utils](https://github.com/opensearch-project/common-utils/blob/1.x/release-notes/opensearch-common-utils.release-notes-1.0.0.0-rc1.md)

You can find all the changes across the project in the [consolidated release notes](https://github.com/opensearch-project/opensearch-build/blob/opensearch-1.0.0-rc1/release-notes/opensearch-release-notes-1.0.0-rc1.md). 

**What does this Release Candidate not include?** 

* *Minimum Artifacts* - Based on community [feedback](https://github.com/opensearch-project/opensearch-build/issues/31), GA will include the release of standalone, minimal downloadable artifacts without OpenSearch plugins (alerting, AD, security, etc.).
* *Additional Artifacts* - This release candidate will only include the current artifacts (Linux tars and Docker images). GA will additionally include RPM (X64), Windows (X64), and DEB (X64). OpenSearch 1.1 will add Tar (ARM64), DEB (ARM64), RPM (ARM64), MacOS (M1 ARM), and MacOS (X64). 
* *Clients with License Checks* - There are known issues with license checks which are causing incompatibilities (e.g. Beats 7.13). A solution for the OpenSearch community is targeted for GA.

**How can you help?** 

The best thing you can do is run the Release Candidate through its paces. Every bit of testing and/or feedback the community can provide helps ensure that this Release Candidate is performing as expected and the GA release includes the best possible product. Couple specific places to start;

- Install the Release Candidate and open an [issue](https://github.com/opensearch-project/OpenSearch/issues) to report any bugs you discover. 
- Test rolling upgrades from existing Elasticsearch and ODFE versions to OpenSearch RC1 in a sandbox cluster.
- Test clients! This will help identify what is working (and not working) so issues can be opened and prioritized. 
- Use our [docs](https://opensearch.org/docs/) and highlight any additional content you'd like to see! Submit a [PR](https://github.com/opensearch-project/documentation-website/pulls) or open an [issue](https://github.com/opensearch-project/documentation-website/issues) for any content you think would be valuable.

Before installing or upgrading to OpenSearch 1.0.0 or OpenSearch Dashboards 1.0.0, please read the release notes ([OpenSearch](https://github.com/opensearch-project/OpenSearch/blob/main/release-notes/opensearch.release-notes-1.0.0-rc1.md) and [OpenSearch Dashboard](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.x/release-notes/opensearch-dashboards.release-notes-1.0.0-rc1.md)). While this 1.0.0 Release Candidate is suitable for testing by the community, you should not use a release candidate in a production environment - this Release Candidate is provided for testing and validation purposes only.

**Speaking of help...**

I would like to pass our thanks to those currently contributing to OpenSearch! 

[aadrien](https://discuss.opendistrocommunity.dev/u/aadrien), [accat](https://discuss.opendistrocommunity.dev/u/accat), [ace03uec](https://github.com/ace03uec), [adkalavadia](https://discuss.opendistrocommunity.dev/u/adkalavadia), [alexz00](https://discuss.opendistrocommunity.dev/u/alexz00), [AmiStrn](https://github.com/AmiStrn), [amitai](https://discuss.opendistrocommunity.dev/u/amitai), [anthonylouisbsb](https://github.com/anthonylouisbsb), [aparo](https://discuss.opendistrocommunity.dev/u/aparo), [asfoorial](https://discuss.opendistrocommunity.dev/u/asfoorial), [astateofmind](https://discuss.opendistrocommunity.dev/u/astateofmind), [Bhupendra](https://discuss.opendistrocommunity.dev/u/Bhupendra), [BlackMetalz](https://discuss.opendistrocommunity.dev/u/BlackMetalz), [Bobpartb](https://discuss.opendistrocommunity.dev/u/Bobpartb), [bradlee](https://discuss.opendistrocommunity.dev/u/bradlee), [brandtj](https://discuss.opendistrocommunity.dev/u/brandtj), [Conan-Kudo](https://github.com/Conan-Kudo), [dawnfoster](https://discuss.opendistrocommunity.dev/u/dawnfoster), [denysvitali](https://github.com/denysvitali), [dirkhh](https://discuss.opendistrocommunity.dev/u/dirkhh), [erhan](https://discuss.opendistrocommunity.dev/u/erhan), [erickg](https://discuss.opendistrocommunity.dev/u/erickg), [fabide](https://discuss.opendistrocommunity.dev/u/fabide), [FreCap](https://github.com/FreCap), [frotsch](https://discuss.opendistrocommunity.dev/u/frotsch), [galangel](https://github.com/galangel), [geekygirldawn](https://github.com/geekygirldawn), [GezimSejdiu](https://discuss.opendistrocommunity.dev/u/GezimSejdiu), [ginger](https://discuss.opendistrocommunity.dev/u/ginger), [GoodMirek](https://discuss.opendistrocommunity.dev/u/GoodMirek), [hagayg](https://discuss.opendistrocommunity.dev/u/hagayg), [Hakky54](https://github.com/Hakky54), [horizondave](https://discuss.opendistrocommunity.dev/u/horizondave), [horovits](https://discuss.opendistrocommunity.dev/u/horovits), [igorid70](https://discuss.opendistrocommunity.dev/u/igorid70), [janhoy](https://discuss.opendistrocommunity.dev/u/janhoy), [jkeirstead](https://discuss.opendistrocommunity.dev/u/jkeirstead), [jkowall](https://discuss.opendistrocommunity.dev/u/jkowall), [jkowall](https://github.com/jkowall), [justme](https://discuss.opendistrocommunity.dev/u/justme), [Katulus](https://discuss.opendistrocommunity.dev/u/Katulus), [kyleconroy](https://github.com/kyleconroy), [lornajane](https://discuss.opendistrocommunity.dev/u/lornajane), [Malini](https://discuss.opendistrocommunity.dev/u/Malini), [mattwelke](https://discuss.opendistrocommunity.dev/u/mattwelke), [mosajjal](https://discuss.opendistrocommunity.dev/u/mosajjal), [nickytd](https://discuss.opendistrocommunity.dev/u/nickytd), [Northern](https://discuss.opendistrocommunity.dev/u/Northern), [opensorcerer89](https://discuss.opendistrocommunity.dev/u/opensorcerer89), [oscark](https://discuss.opendistrocommunity.dev/u/oscark), [otisg](https://discuss.opendistrocommunity.dev/u/otisg), [ralph](https://discuss.opendistrocommunity.dev/u/ralph), [retzkek](https://discuss.opendistrocommunity.dev/u/retzkek), [rmuir](https://github.com/rmuir), [robcowart](https://discuss.opendistrocommunity.dev/u/robcowart), [santiagobassett](https://discuss.opendistrocommunity.dev/u/santiagobassett), [SergioFG](https://discuss.opendistrocommunity.dev/u/SergioFG), [shamil](https://discuss.opendistrocommunity.dev/u/shamil), [sharp-pixel](https://github.com/sharp-pixel), [sksamuel](https://discuss.opendistrocommunity.dev/u/sksamuel), [spapadop](https://discuss.opendistrocommunity.dev/u/spapadop), [sunilchadha](https://discuss.opendistrocommunity.dev/u/sunilchadha), [tardyp](https://discuss.opendistrocommunity.dev/u/tardyp), [Tom1](https://discuss.opendistrocommunity.dev/u/Tom1), [ttx](https://discuss.opendistrocommunity.dev/u/ttx), [tvc_apisani](https://discuss.opendistrocommunity.dev/u/tvc_apisani), and [willyb](https://discuss.opendistrocommunity.dev/u/willyb)

If I have missed anyone on this list, please reach out and I will very gratefully make an addition!

**What’s next?**

Let's work together to test for bugs and identify feature gaps while working towards a GA release. The goal is to release the GA version of 1.0.0 on July 12, 2021 (check out the public [roadmap](https://github.com/orgs/opensearch-project/projects/220)). Stay tuned to the [forums](https://discuss.opendistrocommunity.dev/), [GitHub](https://github.com/opensearch-project), the community [meeting](https://www.meetup.com/Open-Distro-for-Elasticsearch-Meetup-Group), and our [blog](https://opensearch.org/blog/) for the latest updates and announcements. 

In the meantime, join us building OpenSearch (if you haven't already)! Feel free to take a look around at what the community has been up to, check out the public [roadmap](https://github.com/orgs/opensearch-project/projects/220), and then head over to look at the open issues. Or you could jump right in and start opening issues or contributing. For more details see [here](https://github.com/opensearch-project/OpenSearch/blob/1.x/CONTRIBUTING.md).
