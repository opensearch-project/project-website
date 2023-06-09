---
layout: post
title:  "Carrying forward the OpenSearch client libraries as a community"
authors: 
  - elifish
date:   2021-08-11 01:01:01 -0700
categories: 
  - community
redirect_from: "/blog/community/2021/08/community-clients/"
---

_Note: This post was updated in Dec 2021 to reflect the current status of the new clients._

Software projects often provide language specific client libraries to make it easy to integrate applications. OpenSearch is built to be wire compatible with open source Elasticsearch 7.10.2 so that anyone can leverage the existing clients, connectors, and tools with minimal modifications to their deployments.

Starting with version 7.14, multiple of the [clients maintained by Elastic](https://www.elastic.co/guide/en/elasticsearch/client/index.html) contain [new logic](https://github.com/elastic/elasticsearch-py/pull/1623) that rejects connections to OpenSearch clusters or to clusters running open source distributions of Elasticsearch 7. This includes the [Apache-licensed distribution](https://www.elastic.co/downloads/past-releases/elasticsearch-oss-7-10-2) provided by Elastic, as well as community distributions like [Open Distro for Elasticsearch](https://opendistro.github.io/for-elasticsearch/).

For the time being, people who use open source Elasticsearch, Open Distro, or OpenSearch should avoid upgrading to version 7.14 of these client libraries as this may break applications. Please see [this documentation](https://opensearch.org/docs/clients/index/) for recommended versions of client libraries that have been tested to work with open source Elasticsearch, Open Distro, and OpenSearch.

Over the next few weeks, the OpenSearch project will add new open source clients for connecting applications to any OpenSearch or Elasticsearch version 7 cluster. These clients will be derived from the last compatible version of the corresponding Elastic-maintained client before product checks were added. The list of clients includes:

  1. [elasticsearch-py](https://github.com/elastic/elasticsearch-py) &#8594; [opensearch-py](https://github.com/opensearch-project/opensearch-py)
  2. [elasticsearch-java](https://github.com/elastic/elasticsearch-java) &#8594; [opensearch-java](https://github.com/opensearch-project/opensearch-java)
  3. [elasticsearch-net](https://github.com/elastic/elasticsearch-net)
  4. [go-elasticsearch](https://github.com/elastic/go-elasticsearch) &#8594; [opensearch-go](https://github.com/opensearch-project/opensearch-go)
  5. [elasticsearch-js](https://github.com/elastic/elasticsearch-js) &#8594; [opensearch-js](https://github.com/opensearch-project/opensearch-js)
  6. [elasticsearch-ruby](https://github.com/elastic/elasticsearch-ruby) &#8594; [opensearch-ruby](https://github.com/opensearch-project/opensearch-ruby)
  7. [eland](https://github.com/elastic/eland) 
  8. [elasticsearch-php](https://github.com/elastic/elasticsearch-php) &#8594; [opensearch-php](https://github.com/opensearch-project/opensearch-php)
  9. [elasticsearch-rs](https://github.com/elastic/elasticsearch-rs) &#8594; [opensearch-rs](https://github.com/opensearch-project/opensearch-rs)
  10. [elasticsearch-perl](https://github.com/elastic/elasticsearch-perl) 
  11. [elasticsearch-specification](https://github.com/elastic/elasticsearch-specification) 
  12. [elasticsearch-hadoop](https://github.com/elastic/elasticsearch-hadoop)

If there is a client library that you do not see, but would like to contribute to or maintain, please post a request in [the forums](https://discuss.opendistrocommunity.dev/c/clients/60).
 
As stated in OpenSearch’s 6th [principle of development](https://opensearch.org/#principles) “Great open source software is built together, with a diverse community of contributors,” and so we are seeking co-maintainers for each of these client libraries. 

[Maintainers](https://github.com/opensearch-project/.github/blob/main/MAINTAINERS.md#maintainer-responsibilities) are active and visible members of the community, and have [maintain-level permissions](https://docs.github.com/en/organizations/managing-access-to-your-organizations-repositories/repository-permission-levels-for-an-organization) on a repository. They use those privileges to serve the community and evolve the software in the repository they maintain. As an OpenSearch project maintainer, you agree to advance the mission of the project and their repo, and to uphold the project's [Code of Conduct](https://opensearch.org/codeofconduct.html). It's up to you.

Should you take on this responsibility, you won’t be alone—AWS will contribute engineers to support each library as well. In addition, AWS will ensure there is continuity should any maintainers step down in the future. If you’re interested in maintaining a client library, you’ll find an open issue in each repo where volunteers are being solicited. 

I’d like to give a big thanks to the people who have already stepped up to help progress and maintain the forks of the clients:

* [madhusudhankonda](https://github.com/madhusudhankonda)
* [robcowart](https://github.com/robcowart)
* [svencowart](https://github.com/svencowart)
* [robsears](https://github.com/robsears)
* [deztructor](https://github.com/deztructor)
* [axeoman](https://github.com/axeoman)
* [paulborgermans](https://github.com/paulborgermans)
* [Shyim](https://github.com/shyim)
