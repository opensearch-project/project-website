---
layout: post
title:  "OpenSearch 2.0 Clients Released"
authors:
- jdbright
- vachshah
- ssayakci
- xtansia
- ananzh
- vemsarat
- vijay
- dblock
date: 2022-06-07
categories:
 - releases
redirect_from: "/blog/releases/2022/06/opensearch-2-0-clients-released/"
---

On the heels of the OpenSearch 2.0 release, the OpenSearch team is excited to announce that all OpenSearch clients have been released to support version 2.0. Not only were all clients updated, but Vacha Shah went above and beyond to improve each client repo by improving test coverage for multiple versions, support to test against unreleased versions, and adding backport functionality. Vacha made it so easy that the co-maintainer of the PHP repo provided the following quote:

> "The effort required to launch the PHP client was minimal thanks to the great communication on GitHub and contribution by Vacha Shah." - Soner Sayakci

A big thanks to external contributors Soner Sayakci (PHP) and Thomas Farr (Rust), as well as internal contributor Anan Zhuang (NodeJS) for their help as co-maintainers of their respective client repos. In addition, thanks to Sarat Vemulapalli, Vijayan Balasubramanian, and dB who helped with code reviews. Below is the full list of clients which were updated:


* [Java](https://github.com/opensearch-project/opensearch-java)
* [High Level Python](https://github.com/opensearch-project/opensearch-dsl-py)
* [Rust](https://github.com/opensearch-project/opensearch-rs)
* [Node.js](https://github.com/opensearch-project/opensearch-js)
* [Low Level Python](https://github.com/opensearch-project/opensearch-py)
* [Ruby](https://github.com/opensearch-project/opensearch-ruby)
* [Golang](https://github.com/opensearch-project/opensearch-go)
* [PHP](https://github.com/opensearch-project/opensearch-php)


For OpenSearch 3.0, the team has a goal to release clients the same day the rest of the release goes live.

## Get Involved

Do you have a passion for a client listed above? Don’t see a client which you think should be part of the list? Interested in contributing to the project? Open up an issue on [Github](https://github.com/opensearch-project/opensearch-clients) and let’s talk about how you can contribute to the OpenSearch community.
