---
layout: post
title:  "OpenSearch version 3.0: New features, breaking changes from Apache Lucene 10, and what to expect"
authors:
 - kwren
date: 2025-04-22
categories:
 - technical-post
meta_keywords: 
meta_description:
excerpt: 
has_math: false
has_science_table: false
---

# OpenSearch® version 3.0: New features, breaking changes from Apache Lucene™ 10, and what to expect

Three years after the launch of 2.0, OpenSearch has taken the launch of Apache Lucene™ 10 as a chance to develop a new major version.

Why the new development? Well, updating [Lucene to v10](https://github.com/opensearch-project/OpenSearch/issues/11415) and the [JVM to v21](https://github.com/opensearch-project/OpenSearch/issues/14011) create breaking changes for both the core of OpenSearch as well as APIs that affect plugins and other parts of the OpenSearch ecosystem, such as dashboards.

Also, anything below Node.js 14 has been deprecated by the Javascript 3.0 client. These moves are, as the OpenSearch maintainers put it, to make the project more future proof.

## Breaking changes

### Apache Lucene 10 and JVM 21

Apache Lucene is being pulled up to v10. For this and other reasons, the JVM is being updated to a minimum of v21 and will cause some breaking changes in OpenSearch, hence the 3.0 release. 

There were also major changes to the Javascript client, including strict parameter naming (no more CamelCase!) and some typing system introductions that may cause compatibility issues. 

However, these breaking changes also bring powerful new features to the forefront.

In Apache Lucene, there are improvements in both I/O and search parallelism---I/O by adding an API call that allows for asynchronous fetching of data, and search by opting for logical partitions within segments instead of the previous method of segment grouping for parallel searches. 

The JVM being updated to a minimum of 21 also brings some major benefits like virtual threads, pattern matching for switch statement, sequenced collections, and [more](https://www.oracle.com/java/technologies/javase/21-relnote-issues.html).

### Java Security Manager removal

Another major breaking change is the replacement of the Java Security Manager. Because it will be [disabled in JVM 24 and onward](https://openjdk.org/projects/jdk/24/), the OpenSearch maintainers decided to replace it in version 3.0. 

There is an issue tracking progress; it starts with a few different options, and there is a [GitHub meta issue](https://github.com/opensearch-project/OpenSearch/issues/16913) that provides information about why the Java Security Manager needs to be replaced. 

To see the most current solution proposals, check out [this meta issue](https://github.com/opensearch-project/OpenSearch/issues/17181). As of this writing, the plan is to harden OpenSearch security with systemd and the introduction of "[Java Agents](https://docs.oracle.com/javase/8/docs/api/java/lang/instrument/package-summary.html)," which can intercept and manipulate JVM bytecode at runtime. This breaks many features and plugins but is unavoidable because the need to upgrade is imminent.

## Major features

### Apache Lucene 10

The reasons for upgrading to Apache Lucene 10 are highly related to performance; Lucene 10 is [more performant in many categories](https://github.com/opensearch-project/OpenSearch/issues/16934) than its predecessor in OpenSearch 2.x. There were major changes to I/O performance and the performance of parallel task execution, as mentioned previously. But there are also other changes in Lucene 10:

- Sparse indexing: Also known as primary-key indexing, sparse indexing organizes data into blocks with recorded minimum and maximum sizes. This allows queries to more efficiently skip non-relevant blocks when querying, which increases CPU/storage efficiency. This was made possible through the I/O parallelism improvements mentioned earlier.
- k-NN/neural search improvements: Because of the improvements to parallel searches, parallelized execution of k-NN and neural searches has improved in Lucene 10. It also adds improvements to vector indexing---better parallelization of I/O allows for optimizations to how vectors are stored to really shine, creating a much more scalable neural search engine.

You can learn more about Lucene 10 improvements in its [change log](https://lucene.apache.org/core/10_0_0/changes/Changes.html#v10.0.0).

### Other performance improvements

Not only were there improvements in the Lucene 10 upgrade, but the OpenSearch community has been working on performance gains on the Big5 benchmark, and 3.0 proves much more performant overall than 2.x---a whopping 8.4x more performant than OpenSearch 1.3 on aggregate!

### JavaScript 3.0 client

The OpenSearch JavaScript 3.0 client is already live and officially supports TypeScript, and it's much better than previous unofficial methods. The only catch is the new parameter name enforcement and the deprecation of everything below Node.js v14.x; these may have some rippling effects in your OpenSearch projects. There was also an overhaul of the internal architecture to [better align with the OpenSearch Project](https://github.com/opensearch-project/opensearch-js/issues/803).

### OpenSearch dashboards

The OpenSearch Dashboards code also underwent many internal overhauls. A lot of dead code was removed, and some behaviors were modified in order to more closely align with the rest of the OpenSearch Project. There were also UI changes, and the Discovery tool has been completely reworked and updated, as shown in the following screenshot.

![A screenshot of the OpenSearch 3.0 dashboard](assets/media/blog_images/2025-04-22-OpenSearch-version-3-features/Dashboards.png)

### SQL plugin changes
Finally, the SQL plugin was updated; the DSL format for queries was deprecated, and DELETE statements in SQL are no longer supported. For fans of the DSL format, you have many flexible alternatives:
* SQL.
* Piped Processing Language (PPL), a pipeline-based query language.
* Create an application against the REST API.
* Use one of the many client libraries.

The SparkSQL connector was also removed, affecting projects that use that integration; you can use a JDBC connection or use Spark's request library to work with OpenSearch's REST API instead.
Upgrading to 3.0
The maintainers of the project have been working very hard to ensure that version 3.0 is an in-place upgrade, allowing for rolling updates and blue-green deployments. Upgrading plugins, however, may be a bit of a challenge because of the breaking changes that may have rippled into those plugins. That said, [this meta issue](https://github.com/opensearch-project/opensearch-build/issues/5243) provides a 2.x to 3.0 breaking changes guide.

## Conclusion

OpenSearch 3.0, true to its semantic versioning, will introduce breaking changes for applications. 

You'll want to audit your plugins and code as OpenSearch 3.0 rolls out to make sure that they still work with the new version. You can even [test with the newly released 3.0.0-alpha1](https://github.com/opensearch-project/opensearch-build/issues/3747)! If you'd like to spin up an OpenSearch 2.x cluster while you wait, [Instaclustr](https://www.instaclustr.com/) offers a [free trial](https://console2.instaclustr.com/signup) of its hosted OpenSearch service. Finally, look for an upcoming blog post in which we'll dive deeper into the changes in OpenSearch 3.0.
