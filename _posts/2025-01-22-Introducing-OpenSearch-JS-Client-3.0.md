---
layout: post
title:  "Introducing OpenSearch JavaScript client 3.0"
authors:
 - theotr
 - kolchfa
date: 2025-01-22
categories:
 - release
meta_keywords: OpenSearch JavaScript client 3.0, node.js client, typescript support, api generator, OpenSearch API
meta_description: Upgrade your OpenSearch development with JavaScript Client 3.0, featuring enhanced TypeScript support and consistency, automated updates, and an intuitive API interface for faster, more reliable applications.
has_math: false
has_science_table: false
---

We're excited to announce the release of OpenSearch JavaScript client 3.0.0. This version introduces significant improvements, including enhanced readability and consistency and a more accurate interface for interacting with OpenSearch clusters.

The new [API generator](https://github.com/opensearch-project/opensearch-js/tree/main/api_generator) enables frequent and accurate updates to the client, ensuring it reflects the latest changes in OpenSearch.

## Improved API coverage using automated updates  

Version 3.0.0 introduces over 100 new API functions compared to version 2.13.0, all generated from the [OpenSearch API specification](https://github.com/opensearch-project/opensearch-api-specification), which currently covers about 60% of the OpenSearch API. All existing API functions have been updated to align with the latest API spec.  

To keep things current, we've added a GitHub workflow that automatically updates the client every week, ensuring that the client is always up to date with the latest OpenSearch API. This means that you always have access to the latest OpenSearch features through the client.  

For the client repository maintainers, this automation reduces the manual effort required to sync the client with the API spec. It allows us to focus on improving the client's performance, stability, and functionality while addressing API function gaps by [adding the missing APIs to the API specification](https://github.com/opensearch-project/opensearch-api-specification?tab=readme-ov-file#welcome). With the new API generator, you'll encounter fewer issues related to outdated API functions, creating a smoother experience whether you're a maintainer or a user.  

## Enhanced TypeScript support  

In previous versions, the client relied on incomplete and outdated types for requests and responses, which were manually written. Version 3.0.0 resolves this problem by generating types directly from the OpenSearch API specification.  

These new type definitions make it easier for your IDE or AI coding assistants to provide accurate autocomplete suggestions and perform type checks. If you use TypeScript, you'll notice faster development and fewer bugs, significantly improving your experience.  

## Removing support for outdated features  

This major update also removes features that are no longer needed or have been replaced by better alternatives:  

- **No more HTTP method overrides:** Previously, some API functions allowed you to override the HTTP method using a `method` parameter. Now `method` is treated as a query string parameter, and using it may cause errors. To send custom requests, use the `client.http` namespace.  
- **No camelCase parameters:** API functions now only accept parameters matching the OpenSearch API specification. These parameters align with what the OpenSearch server expects.  
- **Dropped support for older Node.js versions:** The client now requires Node.js 14 or later. If you're still using Node.js 10 or 12, we recommend upgrading to the latest LTS version.  

As with any major update, these updates, along with the new typing system, may introduce breaking changes. For a detailed list of changes and deprecations, see the [UPGRADING guide](https://github.com/opensearch-project/opensearch-js/blob/main/UPGRADING.md).  

## Share your feedback  

We're excited to see the applications you build using the new OpenSearch JavaScript client 3.0.0. If you have questions or feedback, feel free to create an issue in the [JavaScript client GitHub repository](https://github.com/opensearch-project/opensearch-js). Your input helps us improve the client, making it easier for you to interact with OpenSearch clusters.  