---
layout: post
title:  "Do More with Less: Save Up to 3x on Storage with Derived Vector Source"
authors:
   - jmazane
   - vamshin
   - kolchfa
date: 2025-05-20
categories:
  - technical-posts
meta_keywords: todo
meta_description: Learn about the new Derived Source for Vectors feature released in OpenSearch 3.0 GA—why it matters, how it works, and how to start using it to improve performance and reduce storage costs.
---

## How Vector Data Is Stored in OpenSearch

When a user uploads a JSON document to an OpenSearch cluster, it doesn't just sit there as-is. Behind the scenes, the system kicks off an indexing process—a crucial step that transforms raw data into optimized structures that make search fast and efficient. For example, if the document contains vector data, OpenSearch builds HNSW (Hierarchical Navigable Small World) graphs. These specialized data structures power Approximate Nearest Neighbor (ANN) Search, allowing for quick and accurate similarity searches across large datasets.

![Indexing Process](/assets/media/blog-images/2025-05-20-Do-More-with-Less-Save-Up-to-3x-on-Storage-with-Derived-Vector-Source/indexing-process.png){:class="img-centered"}

One important thing to keep in mind about the indexing process is that it often increases the size of the data stored in the cluster compared to what was originally ingested. That’s because OpenSearch prepares the data for different types of search and analytics operations, each requiring its own optimized structure. For example, full-text search relies on inverted indexes, while fast streaming or aggregation over text fields might use a columnar store. To support these diverse needs, the system may store multiple representations of the same data—resulting in increased storage usage.

When it comes to vector data, OpenSearch typically stores it in two or three different places, each serving a specific purpose:
1. HNSW graph – This is the core structure used for Approximate Nearest Neighbor (ANN) Search, enabling fast and efficient vector similarity lookups. This may or may not also store the vector with it, depending on the engine being used.
2. Vector values – Stored in a columnar format, these raw vectors are often used during the final ranking phase of a search or for exact calculations.
3. _source field – This contains the original JSON document that was ingested, preserving the full context and metadata of the data for retrieval or reindexing.

In an experiment with 10k 128-dimensional vectors, the size break down of these files was:

![Storage Breakdown](/assets/media/blog-images/2025-05-20-Do-More-with-Less-Save-Up-to-3x-on-Storage-with-Derived-Vector-Source/storage-breakdown.png){:class="img-centered"}

Surprisingly, the _source field consumes more than half the storage for the index. In addition to the increase in index size, storing the _source for an index can also hamper performance in indexing, merging, recovery, and even search. Lets dig a little bit deeper into the _source field.

## The _source field and vector search
The _source field is an OpenSearch construct that plays two critical roles:

1. The _source is used to return end user content on the search request. This is the payload of interest. For instance, if you were to index a poetry book, the fields of interest may be the poem text, title and/or author. [Unless otherwise configured](https://docs.opensearch.org/docs/latest/search-plugins/searching-data/retrieve-specific-fields/), these fields will be retrieved from the _source field.
2. The _source can be used to reindex the users original data if needed. This includes operations around updates, re-building indices with different settings (i.e. reindex API), and recovery operations (i.e. translog can replay index operations)

In Lucene, the _source field is represented as a stored field. Stored field’s are typicallly meant for storing data that can be retrieved but not searched.

With vector search, end users typically have no interest in getting the actual vector. An array of floating point numbers does not really carry very much human meaning (with the exception being an expert data scientist perhaps). It is basically binary data. For instance, continuing with the poetry example above, a user in need of a romantic poem to mend a broken relationship has no interest in the semantic modeling of the poem — they just want the text — and fast!

That being said, vector fields are also very large and sending it over the wire will not only add noise to the response, but will also slow down the search request. So, in production, we typically [recommend](https://docs.opensearch.org/docs/latest/vector-search/performance-tuning-search/) that users exclude the vector from the source returned as an optimization (if you are not doing this already, try it out! You’ll see major performance gains!):
```
POST /my_index/_search
 {
   "_source": {
     "excludes": ["vector-field"]
   },
   "query": {
     "knn": {
       "vector-field": {
         "vector": [],
         "k": 10
       }
     }
   }
 }
```

Excluding the vector from the returned payload already offers a notable performance boost—but taking it a step further by removing the vector from _source storage can deliver even greater gains. Smaller shards are easier to relocate, speeding up and strengthening cluster state recovery. Plus, reading less data from disk means less memory usage, which can lead to subtle yet impactful benefits like better page cache efficiency and reduced search latencies.

That being said, it is possible for some users to disable _source storage, but this comes at the cost of losing the functionality mentioned above. Thus, for many users, it is not an option.

## Can we have our cake and eat it too? Enter derived source

A simple question is, if we are already storing the vectors in the vector values file, can we just take the vectors from there and inject them into the source field when we need to read them? It turns out, we can! In OpenSearch 3.0, we released a feature for vector indices to do just that, while keeping the behavior completely transparent to users.

The idea is fairly simple: on write, before serializing the source to disk, we replace the massive vector with a single byte (apply a mask). Then, on read, if the vector is required, we read it from the vector values and put it back in the source. 

![Derived Process](/assets/media/blog-images/2025-05-20-Do-More-with-Less-Save-Up-to-3x-on-Storage-with-Derived-Vector-Source/derived-process.png){:class="img-centered"}

From a user perspective, deriving the source is completely transparent. It is enabled and disabled via an index setting:
```
PUT /my_index
{
  "settings" : {
    "index.knn": true,
    "index.knn.derived_source.enabled" : true # Defaults to true
  },
  "mappings": {
    <Index fields>
  }
}
```

index.knn must be set to true in order to use the feature. By default, derived source is enabled for vector indices created on or after version  3.0.0.

With this change, we saw many performance benefits from our nightly benchmarks. First and foremost, we saw a 3x decrease in storage size.

![Derived Process](/assets/media/blog-images/2025-05-20-Do-More-with-Less-Save-Up-to-3x-on-Storage-with-Derived-Vector-Source/bench-store-size.png){:class="img-centered"}

Additionally, we saw force merging time decrease by about 10%. This can be explained by the fact that less data needs to be copied and processed to create a new segment.

![Derived Process](/assets/media/blog-images/2025-05-20-Do-More-with-Less-Save-Up-to-3x-on-Storage-with-Derived-Vector-Source/bench-force-merge.png){:class="img-centered"}

Lastly, and perhaps most surprisingly, we observed a 90% drop in search latency with the Lucene engine. This is likely due to a cold start issue, where the vector data loaded into the page cache during the merge process must be replaced by the vector data actually used during search.

![Derived Process](/assets/media/blog-images/2025-05-20-Do-More-with-Less-Save-Up-to-3x-on-Storage-with-Derived-Vector-Source/bench-search-latency.png){:class="img-centered"}

Simply put, working with smaller shard sizes often yields surprising performance improvements.

## What’s Next?

Why stop at deriving the source for just vector fields? We're excited to share that upcoming releases will expand support for derived source across all field types, unlocking even more flexibility for developers working with OpenSearch.
Curious about how it's progressing or want to get involved? You can follow the development and join the conversation on GitHub: [OpenSearch Issue #9568](https://github.com/opensearch-project/OpenSearch/issues/9568).

