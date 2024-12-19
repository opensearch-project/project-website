---
layout: post
title: "OpenSearch simplified: The power of Application-Based Configuration (ABC) templates"
authors:
   - mgodwani
   - kolchfa
date: 2024-12-19
categories: 
    - technical-post
meta_keywords: Application-Based Configuration templates, ABC templates, index templates, index configuration, OpenSearch performance optimization
meta_description: 
---

OpenSearch supports a wide variety of use cases---such as [logs](https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/logs/), [metrics](https://opensearch.org/docs/latest/monitoring-your-cluster/metrics/getting-started/), [traces](https://opensearch.org/docs/latest/data-prepper/common-use-cases/trace-analytics/), [website search](https://opensearch.org/docs/latest/search-plugins/), and [vectors](https://opensearch.org/docs/latest/search-plugins/vector-search/)---and enables you to build solutions for various applications based on your use case. As the use cases for OpenSearch continue to grow, managing indexes and configuring them with the right settings can become a daunting task, both for experienced and new users. OpenSearch provides numerous settings that you can use to fine-tune indexes for various performance and usability dimensions, such as throughput, latency, and disk utilization. However, for new users, finding the optimal configuration often requires extensive experimentation and developer effort, creating friction during the onboarding process. As new features are developed and released, experienced OpenSearch users may overlook them as well.

To address this challenge, [OpenSearch 2.17](https://opensearch.org/blog/introducing-opensearch-2-17/) introduced the concept of _Application-Based Configuration (ABC) templates_ as an experimental feature. This feature allows you to easily configure your indexes based on your specific use case, reducing the need for manual updates while promoting a seamless onboarding experience and managing the lifecycle of the index and its settings and mappings as new features are introduced.


## What are ABC templates?

In OpenSearch, ABC templates are predefined system templates designed to simplify the process of configuring indexes for various use cases by providing predefined settings and configurations out of the box. These templates encapsulate various optimized settings, mappings, and configurations tailored for different use cases, eliminating the need to manually handle each setting individually.

ABC templates can be applied to your indexes or index templates by providing the `context` field in a request when creating an index or index template. This associates the index or index template with the specified use case (for example, logs or metrics), automatically applying the corresponding settings and mappings from the ABC template to the index or index template.

ABC templates make the indexes use-case-aware and apply the best applicable configuration in terms of performance and end-to-end support at all stages, from index creation to data visualization (for example, Simple Schema for Observability). You can rely on composable index templates and component templates for providing the basic building blocks for the applicable configurations. ABC templates use component templates as a resource in order to expose use-case-specific configurations. The solution is designed to work well with existing index definitions, while the available optimizations are provided straight out of the box.


## Why use ABC templates?

OpenSearch ABC templates offer the following advantages:

- **Simplified configuration**: ABC templates eliminate the need to navigate through numerous settings, reducing the complexity of index configuration.
- **Optimized performance**: The predefined settings and mappings in the templates are optimized for specific use cases, ensuring better performance out of the box.
- **Automatic updates**: As OpenSearch introduces new optimizations and features, they are added to the ABC templates, and you can start using them for newly created indexes with minimal effort.


To understand the optimized ABC template settings and their performance benefits, we performed a comparison exercise using an index that relies on the `logs` template, which uses the HTTP logs dataset (at the same refresh interval), and found the following:

- Storage improved by 20% (when using `zstd_no_dict` compared to the default `qat_lz4` compression for stored fields).
- Indexing p99 latency improved by 6% because the generated segments are smaller and thus require fewer merges.
- The template requires the index to use the `log_byte_size` merge policy, thus ensuring that data ingested together is kept together even after segment merges, resulting in improved performance of time range filter queries.

The following diagram compares storage and p99 latency performance.

![Application-based template performance comparison](/assets/media/blog-images/2024-12-20-OpenSearch-Simplified-The-Power-of-Application-Based-Templates/perf-comparison.png)

## How to use ABC templates

To get started with ABC templates, see [Index context](https://opensearch.org/docs/latest/im-plugin/index-context/).

The following animation illustrates creating an index using an ABC template. The template sets the required index mappings and settings. Additionally, it configures direct integration with OpenSearch Dashboards for subsequently ingested data.

![Illustration of an index using ABC templates](/assets/media/blog-images/2024-12-20-OpenSearch-Simplified-The-Power-of-Application-Based-Templates/demo.gif)

### Available templates

In the first version of `opensearch-system-templates`, the following templates are available to use in the `context` parameter as of OpenSearch 2.17:

* `logs`
* `metrics`
* `nginx-logs`
* `amazon-cloudtrail-logs`
* `amazon-elb-logs`
* `amazon-s3-logs`
* `apache-web-logs`
* `k8s-logs`

### Limitations

While providing a lot of benefits, ABC templates have the following limitations:

* When using ABC templates for an index, you cannot include any settings defined in the template that supports the index context during its creation or during dynamic setting updates.
* Once configured for an index, the context becomes permanent and cannot be removed.

## Conclusion

As OpenSearch continues to evolve, you can expect to benefit from new optimizations and features seamlessly integrated into your existing ABC templates, ensuring a consistent and optimized experience across various use cases. By providing predefined, optimized settings and configurations out of the box, this feature reduces the friction and developer effort required during the onboarding process. We look forward to your feedback on the [OpenSearch forum](https://forum.opensearch.org/) and to working together to make OpenSearch easier to use with every version release. 
