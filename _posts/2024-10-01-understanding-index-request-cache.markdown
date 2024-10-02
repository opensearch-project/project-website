---
layout: post
title: "Behind the scenes with OpenSearch: Understanding Index request cache through code" 
authors:
   - awskiran
   - kkhatua
date: 2024-10-01 
categories:
  - technical-posts
  - search
excerpt: 
meta_keywords: OpenSearch cluster, Opensearch caching, index request cache, search performance optimization, search latency
meta_description: 
---
Speed and efficiency are essential to search users. OpenSearch achieves them using a variety of mechanisms—one of the most crucial being the [Index request cache](https://opensearch.org/docs/latest/search-plugins/caching/request-cache/). This blog post describes the inner workings of this cache, breaking down how it functions at the code level to optimize query performance.

## What is Index request cache

![Index-Request-Cache](/assets/media/blog-images/2024-10-01-understanding-index-request-cache/cache_location.png){:class="img-centered"}
The Index Request Cache is designed to speed up search queries in OpenSearch by caching the results of queries at the shard level. This approach is particularly effective for queries targeting specific indices or patterns, enhancing response times and system efficiency.

The cache automatically clears entries when data changes, ensuring only up-to-date information is returned.

## Caching policy

Not all searches are eligible for caching in the Index request cache. By default, search requests with size=0 (i.e only cache the metadata like total number of results/hits) are cached.

The following requests are ineligible for caching:

* **Non-deterministic requests:** Searches involving functions like Math.random() or relative times such as now or new Date().
* **Scroll and Profile requests**
* **DFS Query Then Fetch requests:** Search type of DFS (Depth First Search) Query Then Fetch results depend on both index content and overridden statistics, leading to inaccurate scores when stats differ (e.g., due to shard updates).

You can enable caching for individual search requests by setting the request_cache query parameter to true:

```json
GET /students/_search?request_cache=true
{
  "query": {
    "match": {
      "name": "doe john"
    }
  }
}
```

## Understanding cache entries

Every cache entry is a key value pair of **Key → BytesReference**

A [Key](https://github.com/opensearch-project/OpenSearch/blob/4199bc2726235456e5b5422eaf4e836f25c2c5ed/server/src/main/java/org/opensearch/indices/IndicesRequestCache.java#L346) comprises 3 entities

1. **CacheEntity** - [IndexShardCacheEntity](https://github.com/opensearch-project/OpenSearch/blob/4199bc2726235456e5b5422eaf4e836f25c2c5ed/server/src/main/java/org/opensearch/indices/IndicesService.java#L1866C24-L1866C45) that comprises [IndexShard](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/index/shard/IndexShard.java) (think of this as a main reference to relate a key to the shard it belongs to).
2. **ReaderCacheKeyId** - This is a unique reference to the current state of the shard. On a change of state (i.e., document addition or deletion or updates and upon a refresh) this reference changes.
3. **BytesReference** - The actual search query in bytes format.

These three components together ensure that each Key uniquely identifies a specific query targeting a particular shard, while also confirming that the shard’s state is current, preventing the retrieval of stale data.
![Key](/assets/media/blog-images/2024-10-01-understanding-index-request-cache/what_is_key.png){:class="img-centered"}

## Storing entries into the cache

Any cacheable query calls [getOrCompute](https://github.com/opensearch-project/OpenSearch/blob/4199bc2726235456e5b5422eaf4e836f25c2c5ed/server/src/main/java/org/opensearch/indices/IndicesRequestCache.java#L223) that either fetches the precomputed value from the cache or caches it after computing the result.

```
function getOrCompute(CacheEntity, DirectoryReader, cacheKey) {
    // Step 1: Get the current state identifier of the shard
    readerCacheKeyId = DirectoryReader.getDelegatingCacheKey().getId()

    // Step 2: Create a unique key for the cache entry
    key = new Key(CacheEntity, cacheKey, readerCacheKeyId)

    // Step 3: Check if the result is already in the cache
    value = cache.computeIfAbsent(key)
    
    // Step 4: If the result was computed (not retrieved from the cache), register a cleanup listener
    if (cacheLoader.isLoaded()) {
        cleanupKey = new CleanupKey(CacheEntity, readerCacheKeyId)
        OpenSearchDirectoryReader.addReaderCloseListener(DirectoryReader, cleanupKey)
    }

    // Step 5: Return the cached or computed result
    return value
}
```

## Cache Invalidation

An IndexReader is point-in-time view of an index, any operations causing a change in the contents of an index would create a new IndexReader and close the old IndexReader. All the cache entries created by the old IndexReader is now stale and needs cleaning up.

### CleanupKey

When an IndexReader is closed the corresponding cleanupKey is added to a Set called keysToClean.
![CleanupKey](/assets/media/blog-images/2024-10-01-understanding-index-request-cache/key_and_cleanupkey.png){:class="img-centered"}

The third entity in the Key class, **BytesReference**, is not used in CleanupKey because it represents the actual cached data which is not necessary for identifying which entries need to be cleaned up. The CleanupKey is only concerned with identifying the entries, not their contents.

A cache entry can become invalid due to these operations:

#### Refresh / Merge

A Refresh or a Merge operation creates a new IndexReader

#### Cache Clear API

```POST /my-index/_cache/clear?request=true```

The API call invalidates all the request cache entries for the index.

![Cache-Clear](/assets/media/blog-images/2024-10-01-understanding-index-request-cache/keys_to_clean_insert.png){:class="img-centered"}

In Summary, any scenario of invalidating an IndexReader or specifically clearing the cache would add corresponding CleanupKeys into a collection called KeysToClean.

## Cache Cleanup

OpenSearch has a background job called [CacheCleaner](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/indices/IndicesService.java#L1678) that runs every 1 minute in a separate thread.
This calls the [cleanCache](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/indices/IndicesRequestCache.java#L698) method, which iterates through all the entries of the cache and maps every Key to a CleanupKey held in KeysToClean and deletes the corresponding Keys.

```
function cleanCache() {
    // Step 1: Initialize sets for keys to clean
    currentKeysToClean = new Set()
    currentFullClean = new Set()

    // Step 2: Process the list of keys that need to be cleaned
    for each cleanupKey in keysToClean {
        keysToClean.remove(cleanupKey)
        if (shard is closed or cacheClearAPI called) {
            currentFullClean.add(cleanupKey.entity.getCacheIdentity())
        } else {
            currentKeysToClean.add(cleanupKey)
        }
    }

    // Step 3: Process the cache and remove identified keys
    for each key in cache.keys() {
        if (currentFullClean.contains(key.entity.getCacheIdentity()) or 
            currentKeysToClean.contains(new CleanupKey(key.entity, key.readerCacheKey))) {
            cache.remove(key)
        }
    }

    // Step 4: Refresh the cache
    cache.refresh()
}
```

![Cache-Clear](/assets/media/blog-images/2024-10-01-understanding-index-request-cache/keys_to_clean_delete_and_fetch.png){:class="img-centered"}

## Wrapping up

The Index Request Cache plays a crucial role in OpenSearch’s efficiency. By understanding how it works, you can optimize performance and tune your configurations with greater confidence.

OpenSearch thrives on community contributions. If you have ideas or see opportunities for improvement, consider contributing. Your input can help shape the future of this search technology.
