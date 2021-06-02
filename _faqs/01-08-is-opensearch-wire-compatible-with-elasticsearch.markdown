---
category: General
question: Is OpenSearch wire-compatible with Elasticsearch?
---
Yes. OpenSearch is a fork of open source Elasticsearch 7.10. As such, it provides backwards REST APIs for ingest, search, and management. The query syntax and responses are also the same. In addition, OpenSearch can use indices from Elasticsearch versions 6.0 up to 7.10. We also aim to support the existing Elasticsearch clients that work with Elasticsearch 7.10.

Note that while the OpenSearch API is backwards compatible, some clients or tools may include code, such as version checks, that may cause the client or tool to not work with OpenSearch. 

For more information on backwards compatibility, see [upgrading FAQs](#c3).