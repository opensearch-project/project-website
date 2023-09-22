---
layout: post
title:  OpenSearch 1.0 Backwards Compatibility FAQ
authors: 
  - dblock
date: 2021-06-09
categories:
  - technical-posts
twittercard:
  description: "In introducing OpenSearch we said: \"The Amazon OpenSearch Service APIs will be backwards compatible with the existing service APIs to eliminate any need for customers to update their current client code or applications. Additionally, just as we did for previous versions of Elasticsearch, we will provide a seamless upgrade path from existing Elasticsearch 6.x and 7.x managed clusters to OpenSearch.\"... "
redirect_from: "/blog/technical-posts/2021/06/opensearch-backwards-compatibility-faq/"
---
In [introducing OpenSearch](https://aws.amazon.com/blogs/opensource/introducing-opensearch/) we said:
> The Amazon OpenSearch Service APIs will be backwards compatible with the existing service APIs to eliminate any need for customers to update their current client code or applications. Additionally, just as we did for previous versions of Elasticsearch, we will provide a seamless upgrade path from existing Elasticsearch 6.x and 7.x managed clusters to OpenSearch.

Today we would like to provide mode detail, and clarify what the above statement, and compatibility in general, mean.

**Upgrading from Elasticsearch OSS and Kibana OSS or Open Distro for Elasticsearch (ODFE) to OpenSearch and OpenSearch Dashboards is like upgrading between versions of Elasticsearch OSS and Kibana OSS.**

**Specifically:**

* **OpenSearch supports rolling upgrades and restart upgrades from Elasticsearch OSS 6.8.0 through Elasticsearch OSS 7.10.2 to OpenSearch 1.0.**
* **OpenSearch Dashboards supports restart upgrades from Kibana OSS 6.8.0 through Kibana OSS 7.10.2 to OpenSearch Dashboards 1.0.**
* **All 1.x versions of ODFE similarly support upgrades to OpenSearch and OpenSearch Dashboards 1.0.**

We've also added an [Upgrading section to OpenSearch FAQs](/faq/#c3), and are [updating the OpenSearch docs](https://github.com/opensearch-project/documentation-website/issues/39). Additional questions are welcome [on the forums](https://discuss.opendistrocommunity.dev/). Please also do open backwards compatibility bugs in [GitHub issues](https://github.com/opensearch-project/OpenSearch/issues).

Finally, we would like to note that both spellings of _backward**s** compatibility_ and _backward compatibility_ are allowed, but we prefer _backwards_ because we created GitHub labels as _backwards-compatibility_ and don’t want to go change everything.

