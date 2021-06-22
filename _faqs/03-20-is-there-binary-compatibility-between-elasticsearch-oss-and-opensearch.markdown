---
question: Is there binary compatibility between Elasticsearch-OSS and OpenSearch?
category: Upgrading to OpenSearch
---
While an OpenSearch node is able to join an Elasticsearch OSS cluster, namespaces and class names in OpenSearch have been changed. If your plugin code depends on Elasticsearch OSS JARs, you will need to upgrade those dependencies to OpenSearch JARs.
