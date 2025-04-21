---
layout: post
title:  "OpenSearch® version 3.0: New features, breaking changes from Apache Lucene™ 10, and what to expect"
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

In Apache Lucene, you have improvements in both I/O and search parallelism; I/O by adding an API call that allows for asynchronous fetching of data, search by opting for logical partitions within segments over the previous method of segment grouping for parallel searches. 

The JVM being updated to a minimum of 21 also brings about some major benefits like virtual threads, pattern matching for switch statement, sequenced collections, and [more](https://www.oracle.com/java/technologies/javase/21-relnote-issues.html).

### Java Security Manager removal

Another major breaking change is the replacement of the Java Security Manager. Because it will be [disabled in JVM 24 and onward](https://openjdk.org/projects/jdk/24/), the OpenSearch maintainers decided to replace it in 3.0. 

There is a ticket tracking progress; it starts with a few different options, and there is a [meta GitHub ticket](https://github.com/opensearch-project/OpenSearch/issues/16913) that goes over the nuts and bolts of why the Java Security Manager needs to be replaced. 

To see the most current solution proposals, check out [this meta ticket](https://github.com/opensearch-project/OpenSearch/issues/17181). As of this writing the plan is to harden OS security with systemd and the introduction of “[Java Agents](https://docs.oracle.com/javase/8/docs/api/java/lang/instrument/package-summary.html),” which can intercept and manipulate JVM bytecode at runtime. This breaks many features and plugins but is unavoidable as the need to upgrade is imminent.

## Major features

### Apache Lucene 10

The reasons for updating to Apache Lucene 10 are highly related to performance; Lucene 10 is [more performant in many categories](https://github.com/opensearch-project/OpenSearch/issues/16934) than its predecessor in OpenSearch 2.x. There were major changes to I/O performance and performance of parallel-executing tasks, as mentioned previously. But there are other changes Lucene 10 brings:

- Sparse indexing: also known as primary-key indexing, this organizes data into blocks with recorded minimum and maximum sizes. This allows queries to more efficiently skip non-relevant blocks when querying, which increases CPU/storage efficiency. This was made possible through the I/O parallelism improvements mentioned earlier.
- KNN/Neural search improvements: Because of the improvements to parallel searches we covered previously, parallelized execution of KNN and neural searches has improved in Lucene 10. It also adds improvements to indexing vectors; better parallelization of I/O allows for optimizations to how vectors are stored to really shine, creating a much more scalable neural search engine.

You can learn more about Lucene 10 improvements from its [changelog](https://lucene.apache.org/core/10_0_0/changes/Changes.html#v10.0.0).

### Other Performance Improvements

Not only were there improvements from the Lucene 10 upgrade, but the OpenSearch team has been working on performance gains on the BIG5 benchmark, and overall 3.0 proves much more performant than 2.x; a whopping 8.4x more performant than OpenSearch 1.3 on aggregate!

### JavaScript 3.0 client

The OpenSearch JavaScript 3.0 client is already live, and officially supports TypeScript, and it’s much better than previous unofficial methods. The only catch is the new parameter name enforcement and the deprecation of everything below Node.js v14.x; these may have some rippling effects in your OpenSearch projects. There was also an overhaul of the internal architecture to [better align with the OpenSearch project](https://github.com/opensearch-project/opensearch-js/issues/803).

### OpenSearch dashboards

The OpenSearch dashboards code also underwent a lot of internal overhauls. A lot of dead code was removed, and some behaviors were modified in order to more closely align with the rest of the OpenSearch project. There were also UI changes, and the discovery tool has been completely reworked and updated.

![A screenshot of the OpenSearch 3.0 dashboard](assets/media/blog_images/2025-04-22-OpenSearch-version-3-features/Dashboards.png)

### SQL Pplugin changes
Finally, the SQL plugin was updated; the DSL format for queries was deprecated and DELETE statements in SQL are no longer supported. For fans of the DSL format, you have many flexible alternatives:
•	SQL
•	PPL, a pipeline-based query language
•	Create an application against the REST API
•	Use one of the many client libraries
The SparkSQL connector was also removed, affecting projects that use that integration; you can use a JDBC connection or use Spark’s request() library to work with OpenSearch’s REST API instead.
Upgrading to 3.0
The maintainers of the project have been working very hard to ensure that 3.0 is an in-place update, allowing for rolling updates and blue-green deployments. Upgrading plugins, however, may be a bit of a task because of the breaking changes that may have rippled into those plugins. That being said, there is a 2.x to 3.0 breaking changes guide on the OpenSearch [GitHub](https://github.com/opensearch-project/opensearch-build/issues/5243).

## Conclusion

OpenSearch 3.0, true to its semantic versioning, will introduce breaking changes for applications. 

You’ll want to audit your plugins and code as 3.0 rolls out to make sure they work on 3.0. You can even [test with the newly released 3.0 Alpha](https://github.com/opensearch-project/opensearch-build/issues/3747)! If you’d like to spin up an OpenSearch 2.x cluster while you wait, we have a [free trial](https://console2.instaclustr.com/signup) available of our hosted OpenSearch service, and we will be vocal about our own rollouts of 3.0 as 2025 rolls on. I'll also be exploring more into the changes in 3.0 in a later post.
