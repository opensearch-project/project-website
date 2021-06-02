---
question: Can I upgrade from Elasticsearch to OpenSearch?
category: General
---
Yes. You can upgrade using a rolling upgrade (one node at a time) process when upgrading from Elasticsearch versions 7.0 - 7.10 to OpenSearch. For Elasticsearch versions 6.x you will be required to perform a cluster restart upgrade. OpenSearch can use indices from Elasticsearch versions 6.0 up to 7.10. Indices on versions prior to Elasticsearch 6.0 or after 7.10 will need to be removed from a cluster being upgraded to OpenSearch or reindexed into a compatible version of Elasticsearch then upgraded to OpenSearch.