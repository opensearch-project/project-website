---
question: Can I use tools that require a particular version of Elasticsearch?
category: Upgrading to OpenSearch
---

By default, OpenSearch reports its version number, however OpenSearch can be [configured to report 7.10.2 for compatibility](https://opensearch.org/docs/latest/clients/agents-and-ingestion-tools/index/) with existing tools designed for Elasticsearch versioning. This configuration option is deprecated and will log a deprecation message and will be removed in the future in a major version of OpenSearch (3.0.0 or later).