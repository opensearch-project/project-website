---
layout: post
title:  "From chaos to clarity: Revolutionizing OpenSearch clients and documentation using a unified API specification"
authors:
 - xtansia
 - dblock
 - theotr
 - wbeckler
 - saimedhi
 - vachshah
 - kolchfa
 - nbower
date: 2025-01-20
categories:
 - newsletter
meta_keywords: API Specification, OpenSearch Clients, OpenSearch Documentation, Code Generation, Automation
meta_description: The OpenSearch API Specification has become the authoritative reference, bridging the gaps between clients, documentation, and the server. By adopting and extending the OpenAPI Specification, we've achieved modularity, testability, and automation, transforming how APIs are described, tested, and implemented. This unified approach has revolutionized client development and documentation, ensuring consistency, accuracy, and rapid adaptability across OpenSearch.
has_math: false
has_science_table: false
---

In February 2024, we decided to revamp the OpenSearch API Specification repository by adopting the OpenAPI Specification. While this change offered significant benefits, we encountered some challenges during implementation. Most notably, although OpenAPI Specification supports multiple files, its built-in modularity features weren't sufficient for effectively organizing OpenSearch's extensive API documentation into smaller, manageable sections. Despite these initial obstacles, we successfully addressed these challenges over the past year:

- The OpenSearch API comprises 1,021 routes, making it impractical to specify within a single OpenAPI YAML file. To address this, we adopted a modular structure that divides the API into _namespaces_ and _schema_ files. Each namespace represents a domain of the OpenSearch APIs, making the specification easier to manage and update. This approach, while not standard in OpenAPI Specification, led us to develop a merger tool that generates a unified OpenAPI Specification file compatible with most existing OpenAPI Specification tools.  

- The OpenSearch API was developed using several custom conventions that don't conform to OpenAPI Specification standards. To address this, we created extensions such as `x-operation-group`, which groups operations performing similar tasks into a single client API function. To ensure compliance with both OpenAPI Specification and our custom extensions, we built a custom OpenAPI Specification linter that checks the specification for consistency.  

- Testing the specification at scale---required to ensure generation of valid clients---posed a significant challenge. Existing OpenAPI Specification testing frameworks were often language-specific and lacked the required flexibility. To overcome this, we developed a data-driven test framework that uses tests written in YAML, making it accessible to contributors regardless of their programming expertise or programming language knowledge. With this framework, we can confidently claim the accuracy of our specification across multiple OpenSearch versions.  

## Key achievements

These efforts have resulted in a modular, maintainable, and testable OpenSearch API specification. With help of OpenSearch contributors, we have reached the following important milestones over the past year:  

- **Complete coverage** of all core OpenSearch APIs.  
- **60% coverage** of plugin APIs, including Index Management, Security, and ML Commons, with plans to reach full coverage by the end of 2025.
- **100% test coverage** for all APIs in the specification, covering OpenSearch 1.x and 2.x.    

## Using the specification to improve OpenSearch clients  

Historically, maintaining OpenSearch clients was a tedious and error-prone process. In the past two years, more than half of the GitHub issues created in the OpenSearch client repositories were related to missing or outdated API functions. The rapid addition of new features and APIs to OpenSearch exceeded our maintainers' capacity to add them to the specification. This constant need to update the specification also prevented us from focusing on other important aspects of client development, such as performance improvements.

With the unified OpenSearch API specification, we've begun generating API functions directly from the specification. This approach eliminates manual updates, improves consistency, and ensures all clients stay synchronized with the latest server capabilities.  

Here are the key milestones:  

- We updated legacy API generators for [PHP](https://github.com/opensearch-project/opensearch-php/pull/203), [.NET](https://github.com/opensearch-project/opensearch-net/pull/228), and [Python](https://github.com/opensearch-project/opensearch-py/pull/721) clients to read and parse the OpenAPI specification.  
- In December, we released a new major version of the JavaScript client. This JavaScript client version's API functions  aregenerated entirely from the specification. The client also includes a complete set of request and response types for each API function, which was the most requested feature from our TypeScript users. For more information, see [this blog post](https://opensearch.org/blog/Introducing-OpenSearch-JS-Client-3.0/). 
- We [overhauled the Ruby client](https://github.com/opensearch-project/opensearch-ruby/pull/261) to use the OpenSearch API specification as the source for its API implementation. The newly generated API functions provide greater consistency and predictability compared to their handwritten predecessors. For example, all input arguments are now cloned into a new hash before any operations are performed on them---the step that was missing during manually writing the functions. The new major version of the Ruby client, featuring these generated API functions, is currently in beta testing and will be released in the coming months.
- We completely revamped the Java client, our most verbose and feature-rich high-level client with strongly typed request and response objects. We replaced [hundreds of thousands lines of legacy code](https://github.com/opensearch-project/opensearch-java/pulls?q=sort%3Aupdated-desc+is%3Apr+is%3Amerged+%5EGenerate+author%3AXtansia) in this client. Additionally, while working on an API generator for this client, we uncovered many errors in the spec that we have since fixed.

The implementation of API generators has transformed our client development process. Instead of manually updating API functions, we can now focus on enhancing client performance, stability, and usability. Using the OpenSearch API specification as the single reference ensures all clients remain synchronized with each other. When developers add a new API to OpenSearch or its plugins, they simply update the specification, and the functionality becomes immediately available across all OpenSearch clients. Similarly, when an API bug is discovered in one client, fixing it in the specification automatically resolves the issue across all clients. The generated API functions also provide much greater consistency in features and behavior compared to their previous handwritten counterparts.

Looking ahead, having a complete specification will enable us to rapidly develop new clients in additional programming languages!

## Generating documentation from the specification  

Like the clients, OpenSearch documentation faced challenges keeping pace with rapid development. The process of manually writing and updating descriptions for each API's parameters, requests, and responses was time-consuming and error-prone. Documentation would occasionally become inconsistent with both the clients and the server, causing user confusion. These inconsistencies created a poor experience for our users made it more difficult for new applications to adopt OpenSearch.

We've begun addressing this by generating documentation components directly from the OpenSearch API specification. For example, [path and query parameter tables are now generated from the spec](https://github.com/opensearch-project/documentation-website/pull/8692), replacing handwritten tables. This process has also helped uncover and correct spec errors.  

In the near future, the following components will also be generated from the spec:  

- Request and response body fields and their descriptions.  
- Examples of requests and responses, derived from tests in the spec repository.  
- Usage examples for each client language.  

These changes ensure the documentation remains accurate and consistent with the server and clients, creating a better experience for developers and reducing barriers to OpenSearch adoption.  

## Thank you

Over the past year, it has been rewarding to witness the evolution and improvement of the OpenSearch API specification. The specification now serves as the authoritative reference for OpenSearch clients, documentation, and server, ensuring consistency across all components. We look forward to seeing how the OpenSearch project will continue to grow with the OpenSearch API specification as its foundation.

We couldn't have achieved this without the dedication of our contributors. Their feedback, suggestions, and contributions have been invaluable to the project. The Amazon OpenSearch team would like to give a special thanks to the following contributors for their outstanding work on the OpenSearch API specification:

* [Niyazbek Torekeldi](https://github.com/Tokesh): For his work on completing the OpenSearch API specification by adding missing APIs and fixing numerous spec errors. Tokesh also helped us reach 100% test coverage for the spec.
* [Andriy Redko](https://github.com/reta): For his many contributions to the OpenSearch project, especially for sharing his expertise during many discussions about the spec repository.

## Looking ahead  

We look forward to continuing this journey with you. If you have feedback or suggestions for the OpenSearch API specification, please open an issue in the [OpenSearch API Specification repository](https://github.com/opensearch-project/opensearch-api-specification/issues). Your contributions help shape the future of OpenSearch.  
