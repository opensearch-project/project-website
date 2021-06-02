---
category: General
question: Is OpenSearch wire-compatible with Elasticsearch?
ref: q1.8
---
Yes. OpenSearch is a fork of open source Elasticsearch 7.10. As such, it provides backwards REST APIs for ingest, search, and management. The query syntax and responses are also the same. In addition, OpenSearch can use indices from Elasticsearch versions 6.0 up to 7.10. We also aim to support the existing Elasticsearch clients that work with Elasticsearch 7.10.

For more information on backwards compatibility, see [upgrading FAQs](#c3).