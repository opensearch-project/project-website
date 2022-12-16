---
layout: post
title:  "OpenSearch clients in Python, Go, and Node.js"
authors: 
  - kyledvs
date:   2021-09-30 01:01:01 -0700
categories: 
  - community
twittercard:
  description: "Last month, the project announced the intention to release OpenSearch specific clients and today the first batch are ready for production use. You can get opensearch-py from PyPI, install opensearch-js from npm and start using opensearch-go."
redirect_from: "/blog/community/2021/09/opensearch-py-js-go/"
---

Last month, the [project announced the intention to release OpenSearch specific clients](https://opensearch.org/blog/community/2021/08/community-clients/) and today the first batch are ready for production use. You can get [opensearch-py from PyPI](https://pypi.org/project/opensearch-py/), install [opensearch-js from npm](https://www.npmjs.com/package/@opensearch-project/opensearch) and start using [opensearch-go](https://github.com/opensearch-project/opensearch-go).

Let’s take a brief look at how to get going on these client libraries. You can find more info on the README file for each repo.

### Python

To install opensearch-py, you can use [pip](https://packaging.python.org/key_projects/#pip):

```
$ pip install opensearch-py
```

From there you can import it into your code:

```
from opensearchpy import OpenSearch
```

### Node.js

Installing the JavaScript client in Node.js is through [npm](https://www.npmjs.com/package/@opensearch-project/opensearch):

```
$ npm i @opensearch-project/opensearch
```

You can use it in your script by requiring the module:

```
const { Client } = require('@opensearch-project/opensearch')
```

### Golang

You can install opensearch-go as a dependency with `go get`:

```
$ go get github.com/opensearch-project/opensearch-go@1.0
```

The golang implementation is separated into distinct packages (`opensearchapi`  for the OpenSearch API, `opensearchtransport` for transport and connection, and `opensearchutil` for helper functions):


```
import (
    ...
    opensearch "github.com/opensearch-project/opensearch-go"
    opensearchapi "github.com/opensearch-project/opensearch-go/opensearchapi"
    opensearchtransport "github.com/opensearch-project/opensearch-go/opensearchtransport"
    opensearchutil "github.com/opensearch-project/opensearch-go/opensearchutil"
    ...
)
```

## How do these clients fit in?

[opensearch-py](https://github.com/opensearch-project/opensearch-py), [opensearch-js](https://github.com/opensearch-project/opensearch-js), and [opensearch-go](https://github.com/opensearch-project/opensearch-go) are derived from [elasticsearch-py](https://github.com/elastic/elasticsearch-py), [elasticsearch-js](https://github.com/elastic/elasticsearch-js), and [go-elasticsearch](https://github.com/elastic/go-elasticsearch) respectively and will work with OpenSearch and open source Elasticsearch. Each of these clients follows syntax of the previous projects closely and moving your custom code over should be a matter of changing over the naming.

## What’s next?

The project team is moving forward in the public for the [Java](https://github.com/opensearch-project/opensearch-java) client and will soon make public repos available for .NET, Ruby, Rust, Perl, and PHP clients as well as the Hadoop and HDFS connectors. Additionally, the Python DSL query builder library has been identified as a target for OpenSearch.

## How can you help?

OpenSearch is a community-driven project and your input is always valued and appreciated - feel free to add an issue or pull request on GitHub or[post in the forum category on clients](https://discuss.opendistrocommunity.dev/c/clients/60). If these clients are important to you or your work, consider taking on a maintainer role where you can have a real impact on the ongoing direction and implementations. Together, let’s build a great set of clients!

### Acknowledgements

The following people contributed to opensearch-py, opensearch-js, or opensearch-go: [rushiagr](https://github.com/rushiagr), [axeoman](https://github.com/axeoman), [vchrombie](https://github.com/vchrombie), [deztructor](https://github.com/deztructor), [VijayanB](https://github.com/VijayanB), [peternied](https://github.com/peternied), [peterzhuamazon](https://github.com/peterzhuamazon), [ananzh](https://github.com/ananzh), [boktorbb-amzn](https://github.com/boktorbb-amzn), [hansott](https://github.com/hansott), and [henvic](https://github.com/henvic).





