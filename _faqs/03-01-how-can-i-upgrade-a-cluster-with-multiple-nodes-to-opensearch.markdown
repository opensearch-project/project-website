---
question: How can I upgrade an Elasticsearch OSS and Kibana OSS cluster with multiple nodes to OpenSearch and OpenSearch Dashboards?
category: Upgrading to OpenSearch
---
OpenSearch supports rolling upgrades in the same way as Elasticsearch OSS. You can deploy OpenSearch into a mixed cluster with Elasticsearch OSS or Open Distro for Elasticsearch nodes. One by one you can replace the legacy nodes with little to no additional manual work.
 
In the same way as Kibana OSS, OpenSearch Dashboards does not support rolling upgrades, but it supports restart upgrades. You are able to stop all Kibana OSS instances, deploy a new OpenSearch Dashboards instance and direct traffic to it.
