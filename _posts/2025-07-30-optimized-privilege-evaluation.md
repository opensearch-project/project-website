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



When we are discussing performance optimizations in OpenSearch, we are usually focused on the processing of the actual data: we are looking at algorithms and data structures to improve the time a query takes; or to improve the indexing throughput.

However, there are also other processes going on in an OpenSearch cluster which might not be so obvious, but which can have a significant impact on its performance: a very significant one is the security layer, which is responsible for performing authentication, authorization and enforcing access controls. As we will see in this article, especially the evaluation of security roles in order to derive the available privileges can sometimes be surprisingly complex and CPU time consuming. 

Thus, we have worked in the past year on a number of different optimizations in the OpenSearch security layer; these have been gradually released in OpenSearch 2.19, OpenSearch 3.0 and OpenSearch 3.1. More work is in the pipeline.

## Performance influencing factors in older versions of OpenSearch  

Let’s first look at the initial state that existed before the performance improvements: one possibly surprising property of the performance characteristics of the OpenSearch security layer was that the performance does not only depend on the complexity of the security configuration (for example, the number of roles), but also on the number of indexes on a cluster. 

We did some benchmarks on OpenSearch 2.18 to find out about the performance effects of the number of indexes on a cluster and the number of roles cluster. We tested bulk index operations and search operations on clusters with a varying number of indexes (10, 30, 100, 300, 1000, 3000 and 10000 indexes). Additionally, we tested users with full privileges, users with a single limited security role, users with 20 security roles and users with 40 security roles.

Let’s have a look at the first chart - it shows the benchmark results for bulk indexing operations with 10 bulk items per request. The horizontal axis represents the number of indexes present on the cluster. The vertical axis represents the measured throughput in documents per second. The complexity of the role configuration is indicated by the line color; green represents the user with full privileges. Yellow colors represent users with limited privileges; the darker the yellow, the more roles are assigned to the user. The blue line on the top represents a test run performed with a super admin TLS certificate; using this certificate will by-pass most of the security layer. Thus, it can be interpreted as an upper threshold for the theoretically possible throughput.


![Benchmark for bulk indexing on OpenSearch 2.18](/assets/media/blog-images/2025-07-30-optimized-privilege-evaluation/benchmark-bulk-baseline.svg)


We can see that performance starts to deteriorate after about 100 indexes. On clusters with 300 indexes, the user achieves only 82% of the throughput they achieved on clusters with 100 indexes. It is important to keep in mind: This is only about the number of indexes present of the cluster - it is independent of the number of indexes the bulk index request actually refers to. Clusters with 1000 indexes are down to 57% of the original throughput. With a growing number of indexes, a nice quadratic decline in throughput can be observed. 

Also, the number of roles can be nicely seen in the chart: When comparing a restricted user with one role to the unrestricted user, one can see that the restricted user achieves about 90% of the throughput of the unrestricted user. The user with 20 roles achieves about 88% of the throughput of the single role user.

Of course, one needs to ask the question: Are clusters with 300 or even 3000 indexes a realistic thing? Clusters with 300 indexes are easy to achieve - it is common practice to configure ingestion to start a new index every day. Thus, without further index life-cycle management, you’ll have 300 indexes with a single application after less than a year. Clusters with 3000 indexes are a more rare thing, but they still are a thing that can be observed “in the wild”. Clusters with even more indexes are really rare - likely because of the performance issues they will face.

The correlation between performance and the number of indexes on the cluster is kind of a nasty thing: Initially, each cluster starts with only few indexes. The performance you are observing will be fine. Only with progressing time, more and more indexes will accumulate on a cluster. Then very slowly, the performance will deteriorate. At one point one will wonder: Hasn’t it been faster once?

For search operations, the benchmark results shown in the following chart look similar; this chart features one more line: The purple line represents the throughput seen by a user with roles which impose Document Level Security (DLS) restrictions. As DLS is only available for reading operations, we can only consider it here. 

![Benchmark for search operations on a single index on OpenSearch 2.18](/assets/media/blog-images/2025-07-30-optimized-privilege-evaluation/benchmark-search-baseline.svg)

You can see in these benchmarks that in older versions of OpenSearch it's reasonable to have clusters with up to 300 indexes. Having more indexes on the cluster however would significantly affect the performance.

## Optimized action privilege evaluation

In order to address these performance issues, we worked on the [Optimized Privilege Evaluation project](https://github.com/opensearch-project/security/issues/3870). Analyzing the code that was responsible for privilege evaluation showed the use of quite a few nested loops on roles, privileges, and indexes. Speaking mathematically, the code was in the *O(n²)* complexity class, where *n* is the number of indexes.

*Note:* The phrase *“O(n²) complexity class”* comes from the [Big O notation](https://en.wikipedia.org/wiki/Big_O_notation), which can be used to reason about the computational complexity of algorithms. If you are not familiar with it: Actually it is pretty simple, one can say on a high level: *O(1)* is amazing, *O(log n)* is nice, *O(n)* is okay-ish, *O(n²)* is bad, and anything beyond is horrible. 

Our goal was to build new privilege evaluation code which achieves a better complexity class; the ideal would be *O(1)*, an algorithm that is independent of factors like the number of indexes. 

For achieving optimal performance, we have designed a new data structure which forms the core of the optimized privilege evaluation. When designing the data structure, we applied a number of fundamental strategies in order to ensure optimal results:
- Use of fast data structures: hash tables give optimal performance with amortized *O(1)* computational complexity 
- Use of denormalized data structures: The role configuration allows very compact specification of privileges by using pattern expressions on indexes and actions and by using grouping. However, doing privilege evaluations directly on this data structure is not too efficient. In such cases, de-normalization is used to achieve maximum performance. We expand the role configuration into a big de-normalized data structure by resolving index and action patterns to concrete actions and “multiplying out” the index/action grouping.
 - Use of as few loops as possible: The most perfect performance would be gained if the privilege evaluation could be done without any loops. Then one would have a true *O(1)* complexity. In reality, it is rarely possible to avoid loops altogether, but minimizing them is always a great idea. If a loop cannot be avoided, one should be sure to minimize the total number of iterations spent inside the loops.
- This leads us directly to the next strategy: Reduce the problem space as quickly as possible. Identify the most selective criteria and apply these first. This helps with reducing the number of necessary iterations and also with the performance of hash tables.
- Finally: One downside of de-normalization is: It can create quite a lot of data. In order to keep the amount of data manageable, we again had to use techniques which reduced the amount of data to reasonable numbers.

If you are interested in the details: The actual code can be found in the class [`ActionPrivileges`](https://github.com/opensearch-project/security/blob/3c635c9f64ec58be206d9c43a865bd8cfa423fa1/src/main/java/org/opensearch/security/privileges/ActionPrivileges.java). There is also a [blog post on the implementation details](https://eliatra.com/blog/performance-improvements-for-the-access-control-layer-of-opensearch-2/).

Let's look at the benchmarks for the new code: The chart below compares now the bulk indexing throughput between the old code (represented by dashed lines) and the new code (represented by solid lines). 

![Benchmark for bulk indexing with optimized privilege evaluation](/assets/media/blog-images/2025-07-30-optimized-privilege-evaluation/benchmark-bulk-ope.svg)

You can nicely see the strong performance improvement; we can see two properties which stand out:

- The solid lines are mostly linear - which means, they do not show a significant change correlated to the number of indexes on the cluster. This is expected, it corresponds to the runtime characteristics of the data structures that are being used in the new implementation. There’s still a slight decline of performance starting from 3000 indexes. We additionally performed [micro benchmarks on the privilege evaluation code](https://github.com/opensearch-project/security/pull/4380#issuecomment-2208603824) with up to 100,000 indexes. In these micro benchmarks, this performance behavior was not visible. Thus, the decline must come from another piece of code - which we work on at the moment. More on that at the end of this article.
- In any case, the performance shows a significant improvement. For clusters with up to 100 indexes, this will be only noticeable for users with non-trivial role configurations. For clusters with more indexes, this will be noticeable for any user. In the case of the cluster with 300 indexes, the full privileges user (i.e., with the most trivial role configuration) will achieve a throughput improvement of 27%. On the 1000 indexes cluster, we get an improvement of 79%, which is pretty amazing!

The best news: The optimized action privilege evaluation code was already released with OpenSearch 2.19.0. So, if you keep your OpenSearch version up to date, you are already getting the better performance.

## Optimized privilege evaluation for DLS/FLS

The optimizations described above only tackled the action access control; that is the decision for the question *“is user X allowed to execute action Y (on index Z)”*. Document Level Security (DLS) and Field Level Security (FLS) however offer more fine grained access controls. These require a separate privilege evaluation and access control implementation.

In a second step, we applied the techniques developed for the action privileges also to DLS/FLS. Additionally, we changed the access control implementation so that privilege evaluation for DLS/FLS is performed in a more distributed manner.

Originally, the DLS/FLS privilege evaluation was performed centrally on the node that received the respective request. The evaluated privileges were then passed on to the different nodes on the cluster which retrieved the documents from the shards. This approach had the advantage that privilege evaluation only needed to be performed once per search request. However, this also brought a disadvantage: The resulting data structure could be huge; which again can incur a significant performance penalty.

We now moved the DLS/FLS privilege evaluation to the shard level; thus it is as distributed as possible. Of course, that means that privileges will be evaluated more often for a single search request. However, as we have now a pretty fast privilege evaluation code, this is not a relevant factor.

The benchmarks show great improvements for this approach:

![Benchmark for search with optimized privilege evaluation](/assets/media/blog-images/2025-07-30-optimized-privilege-evaluation/benchmark-search-ope.svg)

Again, the purple lines represent users with active DLS restrictions. You can see that on the optimized version, the user with DLS restrictions has virtually no different performance characteristics than a user without DLS restrictions. And compared to the old code, the gains are amazing: Already on a cluster with just 100 indexes, the new implementation improves the throughput of a user with DLS by 58%. 

Also here the best news: The optimized privilege evaluation for DLS/FLS was already released with OpenSearch 3.0.0.

## User object optimizations

After having finished the work on privilege evaluation, we looked at another central component of the security layer: the user object. Interestingly, the performance of OpenSearch can also depend on the size of the user object. The size of the user object is mostly dependent on the number of roles of the user and the number of user attributes. While in many cases we will have only very few roles and attributes, there are some surprising cases: especially in environments using LDAP, users can have large amounts of roles and attributes.

One process that suffers quite strongly from big user objects is the exchange of the user object between nodes during inter-node communication. This is especially caused by the necessary serialization and deserialization of the user data. We aimed at reducing these processes in the [immutable user object project](https://github.com/opensearch-project/security/pull/5212). By making the user object immutable, we gained the possibility to reuse the serialized form regularly, reducing the number of necessary serializations. Caches help us to reduce the number of deserialization processes.

We also performed [benchmarks](https://github.com/opensearch-project/security/pull/5212#issuecomment-2804401414) on these optimizations. While the gains are not as huge as for the optimized privilege evaluation, we also get some good results.

![Benchmark for search with user object optimizations](/assets/media/blog-images/2025-07-30-optimized-privilege-evaluation/benchmark-immutable-user-object.svg)

We see here the throughput of a search operation on 20 indexes. Again, the dashed line represents the old version, and the solid line represents the optimized version. The horizontal axis does now represent the number of user attributes, i.e., the size of the user object. We can see: Users with 10 attributes see a 21% improvement. Users with 100 attributes get a throughput that is 39% higher than the on the old version.

The user object optimizations have been recently released with OpenSearch 3.1.0.

## Improved index resolution

And this is not the end yet. We are now working on the another facet of the security layer: In the [Index pattern resolution improvements project](https://github.com/opensearch-project/security/issues/5367) we are now working on the code that tells the security layer which indexes an action request is about to access. We believe to gain further performance improvements by doing optimizations here.

## Conclusion

The recent OpenSearch versions bring huge performance improvements on the security layer. Especially if you have a cluster with many indexes, getting the most recent OpenSearch version will bring you many advantages. 

From the perspective of a software engineer, the results show: it takes the right data structures and with the right algorithms to max out the potential of your infrastructure. OpenSearch and Lucene are actually full of such great applications of efficient algorithms and data structures, especially in the indexing and search core. It is really cool that we could move even more forward now.

Yet, we also see that creating efficient and scalable components is difficult, especially in distributed systems. [Eliatra](https://eliatra.com/), a founding member of the OpenSearch Software Foundation, has the deep expertise and engineering capacity to address such challenges. Eliatra’s team actively drives innovation and contributes production-grade improvements to OpenSearch. If you're running large-scale OpenSearch clusters and need advanced tuning, architectural guidance, or custom features; Eliatra ready to help.

## Resources

- [Blog article at Eliatra: Performance Improvements for the Access Control Layer of OpenSearch: An In-depth Technical Look](https://eliatra.com/blog/performance-improvements-for-the-access-control-layer-of-opensearch/); [part 2](https://eliatra.com/blog/performance-improvements-for-the-access-control-layer-of-opensearch-2/)
- [Issue: Optimized privilege evaluation](https://github.com/opensearch-project/security/issues/3870)
- [Issue: Make user object immutable](https://github.com/opensearch-project/security/issues/5168)
- [Issue: Index pattern resolution improvements](https://github.com/opensearch-project/security/issues/5367)
- [PR: Optimized privilege evaluation](https://github.com/opensearch-project/security/pull/4380)
- [PR: Immutable user object](https://github.com/opensearch-project/security/pull/5212)
