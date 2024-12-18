# OpenSearch Simplified: The Power of Application-Based Configuration Templates


OpenSearch supports a wide variety of use-cases, ranging from logs, metrics, traces, website search, vectors, etc., and enables users to build solutions for various applications based on their use cases. As the use cases for OpenSearch continue to grow, managing indices and configuring them with the right settings can become a daunting task, both for experienced and new users. OpenSearch provides numerous knobs and settings to fine-tune indices for different performance and usability dimensions, such as throughput, latency, disk utilization, and more. However, for new users, finding the optimal configuration often requires extensive experimentation and developer effort, creating friction during the on-boarding process. As new features are developed and released, experienced users of OpenSearch may miss out on them as well.

To address this challenge, OpenSearch 2.17 introduced the concept of Application Based Configuration templates as an experimental feature. This feature allows users to easily configure their indices based on the specific use case they are building it for, reducing the need for manual tweaking and promoting a seamless on-boarding experience and managing the lifecycle of the index and its settings/mappings as new features are introduced.


## What are Application-Based Configuration (ABC) Templates?

Application-Based Configuration (ABC) templates in OpenSearch are predefined system templates designed to simplify the process of configuring indices for various use cases by providing predefined settings and configurations out of the box. These templates encapsulate various optimized settings, mappings, and configurations tailored for different use cases, eliminating the need for users to manually handle each setting or knob individually.

These templates can be applied on users’ indices or index templates using the `context` field while creating the respective resources. This associates the index/index-template with the specified use case (e.g., logs, metrics), and OpenSearch automatically applies the corresponding settings and mappings from the ABC template.

The primary issue that was being addressed was the reduction of friction in OpenSearch onboarding and usage for users. Due to the wide variety of use-cases supported through OpenSearch, the solution was desired to be introduced which could make the indices use-case aware and apply the best configuration applicable in terms of performance and end-to-end support from index creation till data visualization (e.g. SS4O). Currently, for any such case-by-case defaults, composable index templates and component templates are relied upon by users to provide the basic building blocks for configurations. Component templates are used by ABC templates as a resource to expose the use-case specific configurations. The solution is designed to work well with existing index definitions, while the available optimizations are provided straight out of the box


## Why to use ABC Templates?

Using ABC templates in OpenSearch offers several advantages:

1. **Simplified Configuration**: ABC templates eliminate the need for users to navigate through numerous settings and knobs, reducing the complexity of index configuration.
2. **Optimized Performance**: The predefined settings and mappings in the templates are optimized for specific use cases, ensuring better performance out of the box.
3. **Automatic Updates**: As OpenSearch introduces new optimizations and features, they are added in the ABC template, and users can start leveraging them with minimal effort for their newly created indices.


To understand the optimized settings by ABC templates and their performance benefits, a comparison exercise was performed using an index which relies on the `logs` template using the http logs data-set (at same refresh interval), and found the following:

1. Storage improves by 20% (Using ZSTD no dict against the default LZ4 compression for stored fields).
2. Indexing P99 latency saw an improvement of 6% due to lesser merges owing to lesser size of segments generated.
3. The template enforces that the index uses log byte size merge policy, thus ensuring that the data ingested together is kept together even after merging of segments, resulting in improved performance for time range filter queries.

![img](/assets/media/blog-images/2024-12-20-OpenSearch-Simplified-The-Power-of-Application-Based-Templates/perf-comparison.png)
## How to use ABC Templates?

The feature is currently available as experimental. For more information on how to get started on using the feature, refer to OpenSearch docs [link here].

Following animation shows how you can create an index leveraging ABC templates, which attach the required mappings, and settings to the index, and also unlocks direct integration with OpenSearch dashboards for the data which is ingested thereafter.

![img](/assets/media/blog-images/2024-12-20-OpenSearch-Simplified-The-Power-of-Application-Based-Templates/demo.gif)

### Available templates

With the first version of `opensearch-system-templates`, the following templates have been available to be used through the `context` parameter as of OpenSearch 2.17:

* `logs`
* `metrics`
* `nginx-logs`
* `amazon-cloudtrail-logs`
* `amazon-elb-logs`
* `amazon-s3-logs`
* `apache-web-logs`
* `k8s-logs`

### Limitations

While ABC templates brings a lot of values, it does has some limitations:

* When using ABC templates for an index, users cannot include any settings declared in the template backing the index context used during index creation or dynamic settings updates.
* The context becomes permanent once set on an index and cannot be removed.

## Conclusion

As OpenSearch continues to evolve, users can expect to benefit from new optimizations and features seamlessly integrated into their existing ABC templates, ensuring a consistent and optimized experience across various use cases. By providing predefined, optimized settings and configurations out of the box, this feature reduces the friction and developer effort required during the onboarding process. We look forward to your feedback around this, and work together to make the OpenSearch easier to use with every release. 
