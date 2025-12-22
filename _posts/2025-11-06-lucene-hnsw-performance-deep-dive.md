---
layout: post
title: "Lucene HNSW performance: A deep dive into the OS page cache"
date: 2025-11-06
categories: [search, performance, vector]
authors:
  - akhilpathivada
description: "Understand how Lucene HNSW performance in OpenSearch depends on the OS page cache, not the JVM heap, and learn how to size memory for fast, consistent vector search."
meta_keywords: "Lucene, HNSW, vector search, performance, OS page cache, OpenSearch, k-NN"
excerpt: "Learn about the deep connection between system RAM and Lucene HNSW query performance, and discover why the OS page cache—not the JVM heap—is the key to sustained, high-speed vector search."
---

You’ve built a powerful vector search application with the [OpenSearch k-NN plugin](https://opensearch.org/docs/latest/search-plugins/knn/index/), and the performance is incredible. Queries are fast and results are relevant. But as you add more data, something changes: query times become slow and unpredictable, and your CPU isn’t even maxed out. You’re left staring at dashboards, wondering what’s going on.

This behavior points not to the JVM heap but to the most critical and frequently overlooked resource for this workload: the server’s available system RAM.

By the end of this post, you’ll understand the deep connection between this system RAM, your Lucene segments, and k-NN query performance. You’ll learn why the familiar JVM heap isn’t the main story here and how to diagnose bottlenecks and configure your cluster for optimal, sustained speed.

---

## The golden rule: Why vector search checks every file

To understand why memory is so critical, we first need to understand a fundamental difference between vector search and traditional keyword search.

When you run a keyword search, OpenSearch uses a highly efficient data structure called an inverted index. It can look up your term and instantly get a list of exactly which documents contain it, allowing it to ignore the vast majority of your data.

Vector search operates differently. It measures proximity within a high-dimensional space, and there’s no simple index to tell it where the closest vectors might be. To guarantee it finds the true nearest neighbors for your query, the OpenSearch k-NN plugin must execute the search against the vector graph in **every single Lucene segment** within a shard. This is because each segment has its own, single HNSW graph file, creating a permanent one-to-one relationship. If it were to skip one, it might miss the best possible result.

This rule—that every segment must be checked—is the foundation for everything that follows.

---

This division of memory is the key to performance. Here’s a simple breakdown of how the physical RAM is shared:

*   **A portion for the JVM heap**: The OpenSearch process uses this for its own operations.
*   **The rest for the OS page cache**: This is where the operating system loads the HNSW graph files for high-speed access.

This illustrates why the total available system RAM, not just the JVM heap, is a critical resource for Lucene HNSW performance.

## The invisible hero: How the OS page cache does the work

When using the default Lucene HNSW engine, the k-NN plugin relies on a more efficient memory model than other engines such as Faiss. Instead of maintaining a **manually managed off-heap cache** that requires loading entire graph files, the Lucene engine integrates directly with the operating system. It doesn’t use the JVM heap to store vector graphs; instead, it uses **memory-mapped files**, which are served by the **operating system’s page cache**.

Here’s how it works:

1. **A virtual shortcut is created**: When a shard opens, Lucene instructs the operating system to map the on-disk HNSW graph files into the OpenSearch process’s **virtual memory space**. This creates a fast “shortcut” to the files on disk without actually loading them into RAM.  
2. **Data is loaded on demand**: As a query traverses the graph, it accesses these virtual memory addresses. The first time a page is needed, the operating system intercepts the access, reads that portion of the file from disk into the **page cache**, and then returns it to the process.  
3. **Subsequent access is from RAM**: Future requests for that same page are served directly from the page cache at memory speed, completely bypassing the disk.  

This model delegates memory management to the operating system, which is highly optimized for the task. However, performance depends entirely on the size of the page cache.

---

## The two worlds of performance: A tale of RAM

Your k-NN workload will fall into one of two distinct performance scenarios based on your server’s available RAM. The difference between them is fundamental: one operates at the speed of memory, while the other is constrained by the physical latencies of disk I/O.

### World 1: The fast lane (CPU-bound performance)

In this scenario, the RAM available for the OS page cache is sufficient to hold the active HNSW graphs. After an initial warm-up, the required data pages reside in physical RAM. When a query runs, the CPU can access this data directly, and performance is bound only by the speed of the CPU’s calculations.

**Result**: Fast, consistent, and **CPU-bound** performance. This is the goal state.

### World 2: The traffic jam (I/O-bound performance)

This occurs when your HNSW graph files are larger than the available page cache. To handle a new memory access, the OS must evict the Least Recently Used (LRU) page from the cache to make room. As a query iterates through segments, it constantly requests pages that aren’t in the cache, forcing the OS to read from disk. This inefficient cycle, where the system is bottlenecked by the storage device’s speed, is called **cache thrashing**.

**Result**: Slow, unpredictable, and **I/O-bound** performance. The CPU spends most of its time waiting for the disk.

---

## Practical guidance for optimal performance

Achieving the “fast lane” state requires a deliberate approach to configuration. If you’re experiencing I/O-bound performance—which you can diagnose by monitoring disk activity with tools such as `iostat`—the following considerations are key to resolving the bottleneck.

### Calculate your memory requirements

For capacity planning before you build your index, you can estimate the required RAM for the page cache. The formula used in billion-scale benchmarks is a reliable starting point:

```
RAM for page cache ≈ 1.1 * (4 * d + 8 * m) * num_vectors
```

Let’s break down the parameters:

- **`d`**: The dimension of your vectors (for example, 1024).  
- **`m`**: The number of connections each node in the HNSW graph will have. This is a configurable index parameter, with a default of 16. Higher values improve accuracy but increase the memory footprint.  
- **`num_vectors`**: The total number of vectors you plan to have in a shard.  
- **`1.1`**: A multiplier that accounts for roughly 10% overhead for filesystem and system-level caches.

This formula provides a powerful way to forecast your hardware needs based on your data and desired accuracy, ensuring you can provision enough RAM to achieve “fast lane” performance.

### Prioritize the page cache over the JVM

For a dedicated vector search node, the standard 50/50 RAM split between the JVM and the OS isn’t optimal. A better strategy is to allocate a smaller, sufficient heap for OpenSearch’s operations (for example, 8–32 GB) and **dedicate the majority of the server’s RAM to the OS page cache**. This approach has been validated in large-scale tests, where nodes with hundreds of gigabytes of RAM are successfully run with a 32 GB heap to maximize memory for the OS. This ensures the OS has the resources it needs to hold the graphs in memory.

### Optimize index structure with force merge

For read-heavy indexes, using the [Force Merge API](https://opensearch.org/docs/latest/api-reference/index-apis/forcemerge/) to consolidate a shard into a single segment can significantly improve caching efficiency. A single, contiguous graph file is more predictable for the OS to manage in the page cache than dozens of smaller, fragmented files, making your system less susceptible to thrashing.

---

## Conclusion

The performance of the Lucene HNSW engine isn’t a story about JVM tuning; it’s a story about feeding the OS page cache enough RAM. By understanding how memory-mapped files work, calculating your memory requirements, and configuring your nodes to prioritize the OS, you can move from unpredictable, I/O-bound performance to the stable, CPU-bound speed that modern vector search promises. You now have the mental model to build and maintain a truly high-performance search engine.

