---
layout: post
title: "Performance optimizations for the OpenSearch security layer"
category: blog
tags: [performance, opensearch-3-0, opensearch-3-1]
authors:
    - nbandener
date: 2025-07-30
categories:
  - technical-posts
meta_keywords: performance, OpenSearch 3.0, OpenSearch 3.1, OpenSearch performance, OpenSearch security, access control performance
meta_description: Performance improvements in OpenSearch 2.19, 3.0, and 3.1 significantly boost the efficiency of the security layer, including role evaluation, DLS/FLS, and user object handling. We take a look inside.
---



When discussing performance optimizations in OpenSearch, we usually focus on the processing of actual data: we look at algorithms and data structures to improve the amount of time a query takes to run or to improve the indexing throughput.

However, other processes running in an OpenSearch cluster might not be so obvious but can have a significant impact on its performance: a very significant one is the security layer, which is responsible for performing authentication, authorization, and enforcing access controls. As you will see in this post, the evaluation of security roles in order to derive the available privileges can sometimes be surprisingly complex and time consuming. 

Over the past year, we have worked on a number of different optimizations to the OpenSearch security layer; these have been gradually released in OpenSearch 2.19, OpenSearch 3.0, and OpenSearch 3.1. More work is in the pipeline.

## Overview

In this post, we cover the following optimizations:

- [Optimized privilege evaluation](#optimized-privilege-evaluation) uses highly efficient, hash-table-based logic, reducing performance degradation as the number of indexes grows. This is especially important for clusters with 300 or more indexes.
- [Optimized document- and field-level security](#optimized-privilege-evaluation-for-document--and-field-level-security) reduces internal cluster communication traffic by moving privilege evaluation to the shard level. This is relevant whenever document-level security restrictions are in effect for a user.
- Additional [user object optimizations](#user-object-optimizations) provide generally high performance benefits; users with many roles and attributes will especially observe noticeable improvements.

Upgrading to OpenSearch 3.1 ensures that you benefit from all of these optimizations.

## Performance factors in earlier versions of OpenSearch  

Let's first look at the initial state before the performance improvements: one possibly surprising performance characteristic of the OpenSearch security layer was that performance not only depended on the complexity of the security configuration (for example, the number of roles) but also on the number of indexes in a cluster. 

We ran some benchmarks on OpenSearch 2.18 to identify the performance effects of the number of indexes and roles in a cluster. We tested bulk index operations and search operations on clusters with a varying number of indexes (10, 30, 100, 300, 1,000, 3,000, and 10,000 indexes). Additionally, we tested users with full privileges, users with a single limited security role, users with 20 security roles, and users with 40 security roles.

Let's take a look at the first chart---it shows the benchmark results for bulk indexing operations with 10 bulk items per request. The horizontal axis represents the number of indexes in the cluster. The vertical axis represents the measured throughput in documents per second. The complexity of the role configuration is indicated by the line color: green represents users with full privileges, and yellow colors represent users with limited privileges. The darker the yellow, the more roles are assigned to the user. The blue line represents a test run performed with a superadmin TLS certificate; using this certificate will bypass most of the security layer. Thus, it can be interpreted as an upper threshold for the theoretically possible throughput.


![Benchmark for bulk indexing on OpenSearch 2.18](/assets/media/blog-images/2025-07-30-optimized-privilege-evaluation/benchmark-bulk-baseline.svg)


You can see that performance starts to deteriorate after about 100 indexes. On clusters with 300 indexes, the user achieves only 82% of the throughput they achieved on clusters with 100 indexes. It is important to keep in mind that this only relates to the number of indexes in the cluster---it is independent of the number of indexes referred to by the bulk index request. Clusters with 1,000 indexes decrease to 57% of the original throughput. With a growing number of indexes, a nice quadratic decline in throughput can be observed. 

The effect of the number of roles can also be seen in the chart: when comparing a restricted user with one role to an unrestricted user, you can see that the restricted user achieves about 90% of the throughput of the unrestricted user. The user with 20 roles achieves about 88% of the throughput of the single-role user.

You might ask, "Are clusters with 300 or even 3,000 indexes realistic?" Clusters with 300 indexes are easy to achieve---it is common practice to configure ingestion to create a new index every day. Thus, without further index lifecycle management, there will be 300 indexes in a single application in less than a year. Clusters with 3,000 indexes are a more rare thing, but they can still be observed "in the wild." Clusters with even more indexes are very rare, likely because of potential performance issues.

The balance between performance and the number of indexes in a cluster can be challenging: Initially, each cluster starts with only a few indexes, yielding adequate performance. As time progresses, more and more indexes will accumulate in the cluster, leading to gradual performance degradation.

For search operations, the benchmark results shown in the following chart look similar; this chart features an additional line: the purple line represents the throughput for a user with roles that impose document-level security restrictions. Because document-level security is only available for reading operations, we can only consider it here. 

![Benchmark for search operations on a single index on OpenSearch 2.18](/assets/media/blog-images/2025-07-30-optimized-privilege-evaluation/benchmark-search-baseline.svg)

You can see in these benchmarks that in earlier versions of OpenSearch, it's reasonable to have clusters with up to 300 indexes. Adding more indexes to the cluster, however, would significantly affect performance.

## Optimized privilege evaluation

In order to address these performance issues, we initiated the [Optimized Privilege Evaluation project](https://github.com/opensearch-project/security/issues/3870). Analyzing the code responsible for privilege evaluation revealed the use of quite a few nested loops on roles, privileges, and indexes. Speaking mathematically, the code was in the *O(n²)* complexity class, where *n* is the number of indexes.

**Note**: The phrase *O(n²) complexity class* comes from the [Big O notation](https://en.wikipedia.org/wiki/Big_O_notation), which can be used to reason about the computational complexity of algorithms. At a high level, it can be said that *O(1)* is great, *O(log n)* is good, *O(n)* is fair, *O(n²)* is poor, and anything beyond is unacceptable. 

Our goal was to build new privilege evaluation code that achieves a better complexity class; the ideal would be *O(1)*, an algorithm that is independent of factors like the number of indexes. 

To achieve optimal performance, we designed a new data structure that forms the core of the optimized privilege evaluation. When designing the data structure, we applied a number of fundamental strategies in order to ensure optimal results:
- Use of fast data structures: Hash tables provide optimal performance with amortized *O(1)* computational complexity. 
- Use of denormalized data structures: The role configuration allows very compact specification of privileges by using pattern expressions on indexes and actions and by using grouping. However, performing privilege evaluations directly on this data structure is not very efficient. In such cases, denormalization is used to achieve maximum performance. You can expand the role configuration into a large denormalized data structure by resolving index and action patterns to concrete actions and "multiplying out" the index/action grouping.
 - Use of as few loops as possible: Ideal performance would be attained if the privilege evaluation could be performed without any loops, resulting in true *O(1)* complexity. In reality, it is rarely possible to avoid loops altogether, but minimizing them is always a good idea. If a loop cannot be avoided, it is best practice to minimize the total number of iterations spent inside the loops.
- Reduce the problem space as quickly as possible: Identify the most selective criteria and apply them first. This helps to reduce the number of necessary iterations and increase the performance of hash tables.

Finally, one downside of denormalization is that it can create a large amount of data. In order to keep the amount of data manageable, we again had to use techniques that reduced the amount of data to a reasonable degree.

If you are interested in the details, the actual code can be found in the class [`ActionPrivileges`](https://github.com/opensearch-project/security/blob/3c635c9f64ec58be206d9c43a865bd8cfa423fa1/src/main/java/org/opensearch/security/privileges/ActionPrivileges.java). You can also read [this blog post about the implementation details](https://eliatra.com/blog/performance-improvements-for-the-access-control-layer-of-opensearch-2/).

Let's look at the benchmarks for the new code: the following chart compares the bulk indexing throughput of the old code (represented by dashed lines) and the new code (represented by solid lines). 

![Benchmark for bulk indexing with optimized privilege evaluation](/assets/media/blog-images/2025-07-30-optimized-privilege-evaluation/benchmark-bulk-ope.svg)

You can see the strong performance improvement; there are two properties that stand out:

- The solid lines are mostly linear, which means that they do not show a significant change correlated to the number of indexes in the cluster. This is expected because it corresponds to the runtime characteristics of the data structures used in the new implementation. There's still a slight performance decline starting at 3,000 indexes. We additionally performed [microbenchmarks on the privilege evaluation code](https://github.com/opensearch-project/security/pull/4380#issuecomment-2208603824) with up to 100,000 indexes. In these microbenchmarks, this performance behavior was not observed. Thus, the decline must be attributable to another piece of code---we will discuss this in more detail at the end of the post.
- Performance shows a significant improvement. For clusters with up to 100 indexes, this will only be noticeable to users with non-trivial role configurations. For clusters with more than 100 indexes, this will be noticeable to any user. In the case of the cluster with 300 indexes, the user with full privileges (the user with the most trivial role configuration) achieves a throughput improvement of 27%. On the cluster with 1,000 indexes, an improvement of 79% is achieved, which is pretty amazing!

The optimized privilege evaluation code was released in OpenSearch 2.19, so if you keep your OpenSearch version up to date, you are already getting better performance.

## Optimized privilege evaluation for document- and field-level security

The optimizations we've described only address the action access control, that is, the answer to the question, "Is user X allowed to execute action Y (on index Z)?". Document-level security and field-level security, however, offer more fine-grained access controls. These require a separate privilege evaluation and access control implementation.

As a second step, we also applied the techniques developed for the action privileges to document- and field-level security. Additionally, we changed the access control implementation so that privilege evaluation for document- and field-level security is performed in a more distributed manner.

Originally, document- and field-level security privilege evaluation was performed centrally on the node that received the respective request. The evaluated privileges were then passed on to the different cluster nodes that retrieved the documents from the shards. This approach was advantageous in that privilege evaluation only needed to be performed once per search request. However, this also presented a disadvantage: the resulting data structure could be huge, which, again, can incur a significant performance penalty.

We have now moved the document- and field-level security privilege evaluation to the shard level so that it is as distributed as possible. Of course, that means that privileges will be evaluated more often for a single search request. However, because of the optimized privilege evaluation code, this is not a relevant factor.

The benchmarks show significant improvements when using this approach, as shown in the following image.

![Benchmark for search with optimized privilege evaluation](/assets/media/blog-images/2025-07-30-optimized-privilege-evaluation/benchmark-search-ope.svg)

Again, the purple lines represent users with active document-level security restrictions. You can see that in the optimized version, there are virtually no differing performance characteristics between users with and without document-level security restrictions. And compared to the old code, the gains are impressive: on a cluster with just 100 indexes, the new implementation improves the throughput of users with document-level security restrictions by 58%. 

The best news is that the optimized privilege evaluation code for document- and field-level security is already available because it was released in OpenSearch 3.0.

## User object optimizations

After optimizing privilege evaluation, we looked at another central component of the security layer: the user object. Interestingly, the performance of OpenSearch can also depend on the size of the user object. The size of the user object is mostly dependent on the number of roles assigned to the user and the number of user attributes. While in many cases there are very few roles and attributes, there are also some surprising cases: especially in environments using LDAP, users can have large numbers of roles and attributes.

One process strongly affected by large user objects is the exchange of the user object between nodes during inter-node communication. This is especially caused by the necessary serialization and deserialization of the user data. We aimed to minimize these processes through the [Immutable user object project](https://github.com/opensearch-project/security/pull/5212). By making the user object immutable, we gained the possibility to reuse the serialized form regularly, reducing the number of necessary serializations. Caches help to reduce the number of deserialization processes.

We also performed [benchmarks](https://github.com/opensearch-project/security/pull/5212#issuecomment-2804401414) on these optimizations. While the gains are not as large as for the optimized privilege evaluation, we still achieved some good results, as shown in the following image.

![Benchmark for search with user object optimizations](/assets/media/blog-images/2025-07-30-optimized-privilege-evaluation/benchmark-immutable-user-object.svg)

Here you can see the throughput of a search operation on 20 indexes. Again, the dashed line represents the old version, and the solid line represents the optimized version. The horizontal axis now represents the number of user attributes, that is, the size of the user object. You can see that users with 10 attributes achieve a 21% improvement. Users with 100 attributes achieve a throughput that is 39% higher than when using the old version.

The user object optimizations were recently released in OpenSearch 3.1.

## Improved index resolution

We are now working on yet another facet of the security layer: through the [Index pattern resolution improvements project](https://github.com/opensearch-project/security/issues/5367), we are working on code that tells the security layer which indexes an action request is about to access. We believe this will yield further performance improvements.

## Conclusion

The most recent OpenSearch versions include significant performance improvements to the security layer. Especially if you have a cluster with many indexes, upgrading to the most recent OpenSearch version will bring you a higher indexing throughput, a reduced query latency and a generally reduced cluster CPU utilization.

The results show that it takes the right data structures with the right algorithms to maximize the potential of your infrastructure. OpenSearch and Lucene include many such applications of efficient algorithms and data structures, especially in the indexing and search core.

Yet creating efficient and scalable components can be challenging, especially in distributed systems. [Eliatra](https://eliatra.com/), a founding member of the OpenSearch Software Foundation, has the deep expertise and engineering capacity to address such challenges. Eliatra's team actively drives innovation and contributes production-grade improvements to OpenSearch. If you're running large-scale OpenSearch clusters and need advanced tuning, architectural guidance, or custom features, Eliatra is ready to help.

## Resources

- [Performance Improvements for the Access Control Layer of OpenSearch: An In-depth Technical Look - Part 1](https://eliatra.com/blog/performance-improvements-for-the-access-control-layer-of-opensearch/); [Part 2](https://eliatra.com/blog/performance-improvements-for-the-access-control-layer-of-opensearch-2/)
- [Issue: Optimized privilege evaluation](https://github.com/opensearch-project/security/issues/3870)
- [Issue: Make user object immutable](https://github.com/opensearch-project/security/issues/5168)
- [Issue: Index pattern resolution improvements](https://github.com/opensearch-project/security/issues/5367)
- [PR: Optimized privilege evaluation](https://github.com/opensearch-project/security/pull/4380)
- [PR: Immutable user object](https://github.com/opensearch-project/security/pull/5212)
