---
layout: post
title:  "Introducing OpenSearch JS Client 3.0"
authors:
 - theotr
date: 2025-01-22
categories:
 - release
meta_keywords: javascript, typescript, client, api, opensearch, release, codegen, api generator
meta_description: Release announcement for OpenSearch JS Client 3.0.0, a major overhaul of the client's API for better readability, consistency, and a more complete and accurate interface to interact with OpenSearch clusters.
has_math: false
has_science_table: false
---

We are excited to announce the release of OpenSearch JS Client 3.0.0. Through an [API generator](https://github.com/opensearch-project/opensearch-js/tree/main/api_generator), the client has received a major overhaul for better readability, consistency, and most importantly a more complete and accurate interface to interact with OpenSearch clusters.

## Automatically Updated API Functions:

Right off the bat, version 3.0.0 comes loaded with over a hundred new API functions compared to the previous 2.13.0 version, all generated from the [OpenSearch API specification](https://github.com/opensearch-project/opensearch-api-specification) which currently covers about 60% of the OpenSearch API. All existing API functions have also been updated to match the latest spec. We also include a GitHub workflow that automatically updates the client every week, ensuring that the client is always up-to-date with the latest OpenSearch API. That means you don't have to wait long to try new OpenSearch features through this client.

For client maintainers, this means less tedious work to keep the client up-to-date with the spec. We now can focus on improving the client's performance, stability, adding new features, and filling in the missing APIs by [adding them to the API specification](https://github.com/opensearch-project/opensearch-api-specification?tab=readme-ov-file#welcome). This also results in fewer issues related to outdated API functions, reducing headaches for both maintainers and users.

## TypeScript support:

Previous versions of the client came with an incomplete and outdated set of request and response types that were written by hand. This issue has been resolved with 3.0.0 as these handwritten types have been replaced with types generated from the OpenSearch API specification. The new type definitions are written in a way that makes it a lot easier for IDEs and AI/ML assistants to provide autocomplete and type checking. This greatly improves the developer experience for TypeScript users: faster development and fewer bugs.

## Removing Support for Outdated Features:

A major update is also an opportunity to remove outdated features that are no longer necessary or have been replaced by better alternatives:

* The client no longer allows overriding the HTTP method for API functions. In previous versions, some API functions let you pass method as a parameter to the API functions to override the default HTTP method. Now, method will be considered a querystring param, and using it will likely result in an error. If you need to send a custom request, you should use the client.http namespace.
* The client no longer supports camelCase parameters. Every API function now only accepts parameters matching the OpenSearch API Spec, which are also what the OpenSearch server expects.
* Support of Node.js 10 and 12 has been dropped. The client now requires Node.js 14 or higher. We strongly encourage users to upgrade to the latest LTS version of Node.js.

As with many major upgrades, the above-mentioned changes and the new comprehensive, precise and stricter typing system introduce some unavoidable breaking changes. For a complete list of changes and deprecations, please refer to the [upgrading guide](https://github.com/opensearch-project/opensearch-js/blob/main/UPGRADING.md).


---

We hope you enjoy the new OpenSearch JS Client 3.0. We are excited to see what you build with it. If you have any questions or feedback, please don't hesitate to open an issue on the [GitHub repository](https://github.com/opensearch-project/opensearch-js). We are always looking to improve the client and make it easier for you to interact with OpenSearch clusters.