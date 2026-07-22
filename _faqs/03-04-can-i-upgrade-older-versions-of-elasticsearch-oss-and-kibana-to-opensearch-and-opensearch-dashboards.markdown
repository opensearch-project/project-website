---
question: Can I upgrade older versions of Elasticsearch OSS and Kibana OSS to OpenSearch and OpenSearch Dashboards?
category: Upgrading to OpenSearch
---
Elasticsearch OSS and Kibana OSS 5.x up to 6.7.2 can be first upgraded to 6.8.0, then it is recommended to upgrade to Elasticsearch OSS 7.10.2 or ODFE 1.13, before upgrading to OpenSearch and OpenSearch Dashboards.

Note that the minimum supported index version for OpenSearch is 6.0. So, all the 5.x indices have to be re-indexed, before upgrading to OpenSearch.
