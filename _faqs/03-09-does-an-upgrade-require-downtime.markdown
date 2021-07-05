---
question: Does an upgrade to OpenSearch require downtime?
category: Upgrading to OpenSearch
---
You can perform rolling upgrades from Elasticsearch OSS to OpenSearch, which does not require downtime. Kibana OSS upgrades require a restart which will cause downtime for Kibana OSS and OpenSearch Dashboards. If you have a single-node deployment and wish to upgrade it in-place, you will incur downtime.
