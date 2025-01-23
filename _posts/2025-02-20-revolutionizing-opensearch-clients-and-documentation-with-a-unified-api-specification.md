---
layout: post
title:  "From Chaos to Clarity: Revolutionizing OpenSearch Clients and Documentation with a Unified API Specification"
authors:
 - xtansia
 - dblock
 - theotr
 - wbeckler
 - saimedhi
 - vachshah
 - kolchfa
 - nbower
date: 2025-02-20
categories:
 - newsletter
meta_keywords: API Specification, OpenSearch Clients, OpenSearch Documentation, Code Generation, Automation
meta_description: The OpenSearch API Specification has become the single source of truth, bridging the gaps between clients, documentation, and the server. By adopting and extending the OpenAPI Specification, we’ve achieved modularity, testability, and automation, transforming how APIs are described, tested, and implemented. This unified approach has revolutionized client development and documentation, ensuring consistency, accuracy, and rapid adaptability across the OpenSearch ecosystem.
has_math: false
has_science_table: false
---

In February 2024, we decided to reboot the OpenSearch Specification repository and adopt the OpenAPI Specification (OAS). Describing OpenSearch APIs in OAS was not without its challenges, however. For example, while the standard OAS did support multi-file specifications, it did not provide the level of modularity required to break down the OpenSearch APIs into manageable pieces. We have overcome these challenges over the past year:

* The OpenSearch API consists of 1,021 routes, making it impractical to develop in a single OpenAPI YAML file. We chose to break up the API into namespaces and schema files, where each namespace represents a domain of the OpenSearch APIs, making it more modular and easier to maintain. Since this file structure is not standard in OAS, we created a merger to generate the final OAS file compatible with most OAS tools on the internet.
* The OpenSearch API was developed with several custom conventions not covered by OAS standards. To represent these, we developed several extensions. For example, the `x-operation-group` extension was added to group operations that perform identical tasks and should be routed to a single API function on the clients. To ensure that these extensions are properly applied, we also created a custom OAS linter that checks the spec file for compliance with the OpenSearch Specification and our custom extensions.
* Incorrect specs lead to broken clients; therefore, testing the spec at the scale of OpenSearch was a significant challenge. Most existing OAS test frameworks required contributors to know a specific programming language and were very limited in functionality. We decided to innovate by authoring a data-driven test framework that allows contributors to write tests in YAML, removing the language barrier and making it easier for contributors to write tests. We run these tests against many versions of OpenSearch and have been able to claim correctness in the spec with confidence.

Today, we have a modular, maintainable, and testable OpenSearch API Specification. With help from contributors, we have reached important milestones over the past year:

* 100% test coverage for all APIs described in the spec, covering OpenSearch 1.x and 2.x.
* 100% of core OpenSearch APIs described in the API specification.
* 60% of plugin APIs, including Index Management, Security, ML Commons, and more. We aim to achieve 100% coverage by the end of 2025.

## Leveraging the OpenSearch Specification in the OpenSearch Clients

In the past two years, more than half of the GitHub issues created in the OpenSearch client repositories were related to outdated API functions or the lack thereof. Keeping each client up-to-date with the OpenSearch server was a tedious and error-prone process. The number of new features and APIs added to OpenSearch quickly outpaced our maintainers' ability to keep up and distracted us from improving other aspects of the clients, such as performance.

With more APIs being covered by the spec, we began writing API generators that read the OpenSearch Specification and generate API functions for the clients:

* We started by retrofitting the [PHP](https://github.com/opensearch-project/opensearch-php/pull/203), [.NET](https://github.com/opensearch-project/opensearch-net/pull/228), and [Python](https://github.com/opensearch-project/opensearch-py/pull/721) clients’ legacy generators to read and parse the OpenAPI spec.


* Last month, we released a new major version of the JavaScript client with all API functions, old and new, generated from the OpenSearch Specification. It also includes a complete set of request and response types for each API function, which was the most requested feature from our TypeScript users. You can read more about this release in this [blog post](https://opensearch.org/blog/Introducing-OpenSearch-JS-Client-3.0/).


* We [overhauled the Ruby client](https://github.com/opensearch-project/opensearch-ruby/pull/261) to use the OpenSearch Specification as the source of truth for its API implementation. The generated API functions are much more consistent than the handwritten functions they replace in terms of functionality and predictability. For example, all input arguments are now cloned into a new hash before any operations are performed on them, unlike the handwritten counterparts where this step was sometimes missed. The new major version of the Ruby client, with generated API functions, is currently in beta and will be released in the coming months.


* We overhauled the Java client, our most verbose and feature-rich high-level client with strongly typed request and response objects. [Hundreds of thousands lines of legacy code have been replaced](https://github.com/opensearch-project/opensearch-java/pulls?q=sort%3Aupdated-desc+is%3Apr+is%3Amerged+%5EGenerate+author%3AXtansia), and the work on an API generator for this client unveiled many errors in the spec that we have since fixed.

The API generators have been a game-changer for the clients. They allow us to focus on improving clients' performance, stability, and usability, rather than spending time manually updating API functions. With the OpenSearch Specification as the single source of truth for the clients, we ensure that the clients are always in sync with one another. Developers adding an API to OpenSearch or one of its plugins add it to the spec, and it becomes immediately available in all OpenSearch clients. An API bug found in one client is fixed in the spec and then propagated to all clients. Finally, the generated API functions in each client are much more consistent in features and behavior compared to the handwritten versions they replaced.

Looking ahead, a complete spec will enable us to quickly write new clients in additional programming languages!

## Improving the OpenSearch Documentation with the OpenSearch Specification

Similar to the clients, the OpenSearch documentation also struggled to keep up with the rapid pace of OpenSearch development. Writing and updating the description of each API’s parameters, requests, and responses was a painstaking, manual process prone to errors. Sometimes, the documentation would be out of sync with the clients and the server, leading to confusion. This not only created a bad experience for our users but also made it harder for new applications to adopt OpenSearch.

The OpenSearch documentation team has started using the OpenSearch Specification to generate many components of the documentation, [starting with the path and query parameters](https://github.com/opensearch-project/documentation-website/pull/8692) of each API function. The handwritten parameter tables in the documentation repository are being replaced by those generated from the spec. Our experts compare the generated tables with the handwritten ones to ensure accuracy and completeness. This process has also helped us correct many overlooked details in the spec.

In the near future, the team plans to replace the following components with those generated from the spec:

* Request and response body shapes and descriptions
* Request and response examples (from tests in the spec repository)
* Usage examples for each language client

---

It has been a joy to watch the OpenSearch Specification evolve and improve over the past year. The specification has become the single source of truth for the OpenSearch clients, documentation, and server, bridging the gaps between them. We are excited to see what the future holds for the OpenSearch project with the OpenSearch Specification as its foundation.

Last but not least, we could not have reached this point without our contributors. Your feedback, suggestions, and contributions have been invaluable to the project. The Amazon OpenSearch team would like to give a special shout-out to the following contributors for their outstanding work on the OpenSearch Specification:

* [Niyazbek Torekeldi](https://github.com/Tokesh): for his work on back-filling the OpenSearch Specification with missing APIs and fixing many errors in the spec. Tokesh also helped us reach 100% test coverage for the spec.
* [Andriy Redko](https://github.com/reta): for his many contributions to the OpenSearch project, especially for his expertise in numerous discussions regarding the spec repository.

We look forward to working with you all in the future! If you have any feedback or suggestions for the OpenSearch Specification, please feel free to open an issue on the [OpenSearch API Specification repository](https://github.com/opensearch-project/opensearch-api-specification/issues). We are always looking for ways to improve the spec and make it more useful for the community.
