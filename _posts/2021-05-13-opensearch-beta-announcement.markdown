---
layout: post
title:  "OpenSearch Beta 1"
authors: 
  - andhopp
  - kyledvs
date:   2021-05-13 01:01:01 -0700
categories: update
redirect_from: "/blog/update/2021/05/opensearch-beta-announcement/"
---

We are excited to release the OpenSearch Beta 1.0 (derived from Elasticsearch 7.10.2) and OpenSearch Dashboards Beta 1.0 (derived from Kibana 7.10.2). With this beta release, we have refactored all the Open Distro for Elasticsearch plugins to work with OpenSearch and provide the community with [downloadable artifacts (Linux tars and Docker images)](/downloads.html) to run OpenSearch and OpenSearch Dashboards with these plugins installed. Features released with this beta include;

- Advanced Security
- SQL Query Syntax
- Anomaly Detection
- Alerting
- Piped Processing Language

...and more ([OpenSearch](https://github.com/opensearch-project/OpenSearch) and [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards)). 

We would like to get your feedback from this beta release - please let us know if there are any features you would like or bugs you identify. You can submit pull requests, write documentation, open issues (either on [OpenSearch](https://github.com/opensearch-project/OpenSearch/issues) or [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/issues)), or simply read the [news](https://opensearch.org/blog/). If you would like to install or run this project please see the Developer Guide ([OpenSearch](https://github.com/opensearch-project/OpenSearch/blob/main/DEVELOPER_GUIDE.md) and [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/DEVELOPER_GUIDE.md)) to get started.

#### Plugins and Components Available in Beta are:

- [Anomaly Detection](https://github.com/opensearch-project/anomaly-detection)
- [Anomaly Detection Dashboards](https://github.com/opensearch-project/anomaly-detection-dashboards-plugin)
- [Security Dashboards (FE)](https://github.com/opensearch-project/security-dashboards-plugin)
- [Security (BE)](https://github.com/opensearch-project/security)
- [Performance Analyzer](https://github.com/opensearch-project/performance-analyzer)
- [PerfTop](https://github.com/opensearch-project/perftop)
- [K-NN](https://github.com/opensearch-project/k-NN)
- [Job Scheduler](https://github.com/opensearch-project/job-scheduler)
- [Index Management](https://github.com/opensearch-project/index-management)
- [Index Management Dashboards](https://github.com/opensearch-project/index-management-dashboards-plugin)
- [Alerting](https://github.com/opensearch-project/alerting)
- [Alerting Dashboard](https://github.com/opensearch-project/alerting-dashboards-plugin)
- [SQL/PPL OpenSearch Plugin](https://github.com/opensearch-project/sql)
- [Query Workbench Dashboards Plugin](https://github.com/opensearch-project/sql)
- [SQL JDBC Driver](https://github.com/opensearch-project/sql)
- [SQL CLI Client](https://github.com/opensearch-project/sql)
- [SQL ODBC Driver](https://github.com/opensearch-project/sql)
- [Notebooks OpenSearch Plugin](https://github.com/opensearch-project/dashboards-notebooks)
- [Notebooks Dashboards Plugin](https://github.com/opensearch-project/dashboards-notebooks)
- [Reporting Dashboards Plugin](https://github.com/opensearch-project/dashboards-reports)
- [Reporting Opensearch Plugin](https://github.com/opensearch-project/dashboards-reports)
- [Trace Analytics Dashboards Plugin](https://github.com/opensearch-project/trace-analytics)
- [Gantt Charts - Dashboards Visualization plugin](https://github.com/opensearch-project/dashboards-visualizations)
- [Asynchronous Search](https://github.com/opensearch-project/asynchronous-search)
- [OpenSearch CLI](https://github.com/opensearch-project/opensearch-cli)
- [Common Utils](https://github.com/opensearch-project/common-utils)
- [Data Prepper](https://github.com/opensearch-project/data-prepper)

## Special Thanks
We would also like to extend a special thanks to the people already contributing to the project. We appreciate the additional support for this project from;

- [AmiStrn](https://github.com/AmiStrn)
- [Conan-Kudo](https://github.com/Conan-Kudo)
- [rmuir](https://github.com/rmuir)
- [sharp-pixel](https://github.com/sharp-pixel)
- [Hakky54](https://github.com/Hakky54)
- [kyleconroy](https://github.com/kyleconroy)
- [geekygirldawn](https://github.com/geekygirldawn)
- [jkowall](https://github.com/jkowall)
- [ace03uec](https://github.com/ace03uec)
- [denysvitali](https://github.com/denysvitali)
- [jkowall](https://github.com/jkowall)
- [galangel](https://github.com/galangel)
- [FreCap](https://github.com/FreCap)
- [anthonylouisbsb](https://github.com/anthonylouisbsb)
- [aadrien](https://discuss.opendistrocommunity.dev/u/aadrien)
- [accat](https://discuss.opendistrocommunity.dev/u/accat)
- [adkalavadia](https://discuss.opendistrocommunity.dev/u/adkalavadia)
- [alexz00](https://discuss.opendistrocommunity.dev/u/alexz00)
- [amitai](https://discuss.opendistrocommunity.dev/u/amitai)
- [aparo](https://discuss.opendistrocommunity.dev/u/aparo)
- [asfoorial](https://discuss.opendistrocommunity.dev/u/asfoorial)
- [BlackMetalz](https://discuss.opendistrocommunity.dev/u/BlackMetalz)
- [Bobpartb](https://discuss.opendistrocommunity.dev/u/Bobpartb)
- [bradlee](https://discuss.opendistrocommunity.dev/u/bradlee)
- [dawnfoster](https://discuss.opendistrocommunity.dev/u/dawnfoster)
- [dirkhh](https://discuss.opendistrocommunity.dev/u/dirkhh)
- [erhan](https://discuss.opendistrocommunity.dev/u/erhan)
- [fabide](https://discuss.opendistrocommunity.dev/u/fabide)
- [frotsch](https://discuss.opendistrocommunity.dev/u/frotsch)
- [GezimSejdiu](https://discuss.opendistrocommunity.dev/u/GezimSejdiu)
- [GoodMirek](https://discuss.opendistrocommunity.dev/u/GoodMirek)
- [hagayg](https://discuss.opendistrocommunity.dev/u/hagayg)
- [horizondave](https://discuss.opendistrocommunity.dev/u/horizondave)
- [horovits](https://discuss.opendistrocommunity.dev/u/horovits)
- [igorid70](https://discuss.opendistrocommunity.dev/u/igorid70)
- [janhoy](https://discuss.opendistrocommunity.dev/u/janhoy)
- [jkeirstead](https://discuss.opendistrocommunity.dev/u/jkeirstead)
- [jkowall](https://discuss.opendistrocommunity.dev/u/jkowall)
- [Katulus](https://discuss.opendistrocommunity.dev/u/Katulus)
- [lornajane](https://discuss.opendistrocommunity.dev/u/lornajane)
- [Malini](https://discuss.opendistrocommunity.dev/u/Malini)
- [mattwelke](https://discuss.opendistrocommunity.dev/u/mattwelke)
- [mosajjal](https://discuss.opendistrocommunity.dev/u/mosajjal)
- [nickytd](https://discuss.opendistrocommunity.dev/u/nickytd)
- [nknize](https://discuss.opendistrocommunity.dev/u/nknize)
- [Northern](https://discuss.opendistrocommunity.dev/u/Northern)
- [opensorcerer89](https://discuss.opendistrocommunity.dev/u/opensorcerer89)
- [otisg](https://discuss.opendistrocommunity.dev/u/otisg)
- [ralph](https://discuss.opendistrocommunity.dev/u/ralph)
- [retzkek](https://discuss.opendistrocommunity.dev/u/retzkek)
- [robcowart](https://discuss.opendistrocommunity.dev/u/robcowart)
- [santiagobassett](https://discuss.opendistrocommunity.dev/u/santiagobassett)
- [SergioFG](https://discuss.opendistrocommunity.dev/u/SergioFG)
- [shamil](https://discuss.opendistrocommunity.dev/u/shamil)
- [sksamuel](https://discuss.opendistrocommunity.dev/u/sksamuel)
- [spapadop](https://discuss.opendistrocommunity.dev/u/spapadop)
- [sunilchadha](https://discuss.opendistrocommunity.dev/u/sunilchadha)
- [tardyp](https://discuss.opendistrocommunity.dev/u/tardyp)
- [Tom1](https://discuss.opendistrocommunity.dev/u/Tom1)
- [ttx](https://discuss.opendistrocommunity.dev/u/ttx)
- [tvc_apisani](https://discuss.opendistrocommunity.dev/u/tvc_apisani)
- [willyb](https://discuss.opendistrocommunity.dev/u/willyb)

## How can you help?
The biggest thing you can do to help is join us! You can install ([OpenSearch](https://github.com/opensearch-project/OpenSearch/blob/main/DEVELOPER_GUIDE.md) and [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/DEVELOPER_GUIDE.md)) and start diving in! Feel free to take a look around at what we've been up to, and then head over to look at the open issues. Or you could jump right in and start opening issues or contributing. For more details see [here](https://github.com/opensearch-project/OpenSearch/blob/main/CONTRIBUTING.md).

**When in doubt, open an issue**

For almost any type of contribution, the first step is opening an issue ([OpenSearch](https://github.com/opensearch-project/OpenSearch/issues), [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/issues)). Even if you think you already know what the solution is, writing down a description of the problem you're trying to solve will help everyone get context when they review your pull request. If it's truly a trivial change (e.g. spelling error), you can skip this step -- but as the subject says, when it doubt, open an issue. 

**Look for the tag "help wanted"**

If you're excited to jump in, we've marked a few issues that would be really helpful (["Help Wanted"](https://github.com/opensearch-project/OpenSearch/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)).

**Questions? Feedback?**

Let us know in by opening an [issue](https://github.com/opensearch-project/OpenSearch/issues) or posting in the [forums](https://discuss.opendistrocommunity.dev/). We are also having biweekly [Community Meetings](https://www.meetup.com/OpenSearch/). The community meetings will include progress updates at every session as well as leaving time for Q&A. The next community meeting is on [May 18, 2021 at
9:00 AM PDT](/events/2021-may-late/).
