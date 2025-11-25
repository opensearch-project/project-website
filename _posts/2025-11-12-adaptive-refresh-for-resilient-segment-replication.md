---
layout: post
title:  "Adaptive refresh for resilient segment replication"
authors:
 - vigyas
 - noushka
date: 2025-11-12
categories:
 - technical-post
meta_keywords: lucene, adaptive refresh, segment replication, resiliency, replicas, checkpoints
meta_description: This blog post dives into the searcher refresh mechanism in Lucene, how adaptive refresh works, and the strategies for implementing it successfully in a highly replicated search engine.
excerpt: Segment replication is a powerful index replication strategy for high QPS workloads that allows physical isolation and decoupling of indexing and search workloads, rapid replica failovers, and seamless point-in-time restores. However, this efficiency comes with its own unique challenges. During high indexing bursts, or if replication is delayed due to network issues, the system can accumulate large replication checkpoints. Searchers (replica shards) struggle to absorb these checkpoints, experiencing high page faults, thrashing for in-flight queries, and degraded search performance. This blog post describes how to address these issues and build a resilient segment-replicated system using Lucene's powerful new hooks for "Adaptive Refresh". 
---


*It is a truth universally acknowledged that a highly available system, in possession of high QPS traffic, must be in want of a resilient replication strategy.*

Highly replicated systems are the foundation of modern distributed computing. In search engines, this typically means serving the same index on a large number of 'searcher' instances or replicas. By distributing query traffic across these replicas, we can scale the service beyond the throughput of a single instance. Further, provisioning replicas on geographically separated physical instances helps with high availability---one bad instance does not take the service down, and the service can survive a data center outage.

A central challenge in replicated systems is how to propagate index changes across all replicas. Real-world document sets change over time, including product catalog changes, availability and price changes in e-commerce search, documents being added and updated in enterprise document search, flight availability changes in airline ticket search, and most commercial search engines requiring near-real-time updates.  


## Propagating changes in replicated systems

Traditionally, systems used *document replication*, where a document is routed to all of the replicas, and each replica independently indexes the document into its search index. "Indexing" refers to a bunch of computational tasks like extracting tokens from a document and creating data structures that enable efficient search at query time, like posting lists, BKD trees, and nearest neighbor graphs. As you can reason, with document replication, this work is repeated on every replica instance. Not only is this computationally wasteful, but since replicas now must do the additional work of indexing documents, each replica has fewer resources to dedicate to search. This lowers the available search throughput per replica, requiring more replicas to support a given amount of search traffic.

Lucene, however, has a unique write-once segmented architecture, where recently indexed documents are written into a self-contained, immutable Lucene segment. Once created, these segment files will never change again. While unusual, when compared to traditional databases, these immutable segments enable a lot of useful features, like transactionality (a document is either fully indexed or not at all), a point-in-time view of the index that will never change and allows for features like pagination and multiple point-in-time snapshots---you can recover to an older snapshot by simply loading its corresponding segments. These properties enable another interesting form of replication called *segment replication*.

With segment replication, a document is indexed only once on a primary indexing machine, the indexer. Immutable segments created in this process are then copied over the network to all the replicas. Whenever there are document updates or new documents are added, Lucene (on the indexer machine) indexes the changes and creates new segments, which are then copied over to all the replicas (searchers). Upon receiving the new segments (also called a replication payload or checkpoint), replicas atomically "refresh" their searchers to load these new segments. All subsequent search queries get served with the new index changes in place.

With this approach, a document is indexed only once. We save precious computation resources on replicas and instead leverage the network to copy (replicate) index changes across the entire fleet. By tracking replication checkpoints, we can make sure that each replica is on the same point-in-time view of the index, as opposed to document replication, where each replica may index at its own pace. There's also the ability to roll back to a known older "good checkpoint" should some bad index changes make their way into production.


## A typical segment replication setup

In classic "segment replicated" systems, indexers invoke a Lucene `commit` and create segments at fixed time intervals. Each commit is then treated as a replication checkpoint and copied over to replica instances. The frequency of creating checkpoints on indexers is preconfigured based on the acceptable tolerance for propagating updates. Upon receiving a new checkpoint, replicas compare it to their local state, fetch any missing files, and invoke a Lucene `refresh` so that queries can see the updated index. 

In well-architected systems, indexers and replicas are decoupled via remote storage. Indexers publish periodic checkpoints to a remote store, like Amazon Simple Storage Service (Amazon S3). Replicas poll the store and fetch the latest available checkpoint. Remote stores provide durability; if a replica crashes or restarts, it can fetch and load the latest checkpoint. It also decouples indexers and replicas: indexers can continue to publish checkpoints at a fixed pace without getting held up by lags or issues on replicas. 

Before we go any further, it's worth understanding how Lucene manages searcher refreshes, which forms the basis of segment-replicated systems.


## Understanding Lucene's refresh mechanism

Lucene exposes a clean refresh story around readers and reference management. The core abstraction is the **ReferenceManager**. 

Lucene provides concrete implementations like `SearcherManager` and `SearcherTaxonomyManager` that hold a single active `IndexSearcher` (and optionally a `TaxonomyReader` for faceted search). These managers swap the searcher atomically during refresh while using reference counting to ensure active queries on the old searcher finish safely before resources are closed. As a user, you typically call `acquire()` to get a reference to the searcher, run your query, and then call `release()` to let go of the searcher reference.

Here's how a typical refresh unfolds in a segment-replicated system. Indexer machines produce new commits over time, which are copied over to replicas via checkpoints. The replica searcher is then *refreshed* on the new checkpoint using the `refreshIfNeeded` API. Internally, this API invokes a `DirectoryReader.openIfChanged()` on the directory holding commits from the downloaded checkpoint, which in turn returns an `IndexReader` on the latest commit available in the directory. 

The manager then creates an `IndexSearcher` on this new reader and atomically swaps the existing searcher reference with the new one. All subsequent calls to `acquire()` will get a reference to the new IndexSearcher. Meanwhile, the old searcher is still kept around until in-flight queries holding a reference to it complete. Once its reference count decreases to 0, the old searcher is cleaned up.

**Let's walk through a concrete timeline to see how requests behave during a refresh**:

```ruby
[t0] STATE current=Searcher(S0 on commit=C0)
[t0] REQ-1 "GET /search?q=shoes"  acquire -> S0   refCount[S0]=1   serving commit C0
[t0] REQ-2 "GET /search?q=books"  acquire -> S0   refCount[S0]=2   serving commit C0

[t1] New checkpoint is received with commit C1

[t2] REFRESH start, download commit C1
[t2] REFRESH build Searcher S1 on commit C1

[t2] REQ-3  arrives before swap acquire -> S0   refCount[S0]=3   serving commit C0
[t2] REFRESH swap current S0 -> S1  (atomic)
[t2] STATE  current=Searcher(S1 on commit=C1); S0 still alive (refCount[S0]=2)

[t3] REQ-4  arrives after swap  acquire -> S1   refCount[S1]=1   serving commit C1
[t4] REQ-5  arrives after swap  acquire -> S1   refCount[S1]=2   serving commit C1

[t5] REQ-1  release(S0)   refCount[S0]=2
[t6] REQ-2  release(S0)   refCount[S0]=1  
[t6] REQ-3  release(S0)   refCount[S0]=0  -> close S0 and R0
[t7] REQ-4  release(S1)   refCount[S1]=1
[t8] REQ-5  release(S1)   refCount[S1]=0  (S1 stays current)

[t8] STATE  current=Searcher(S1 on commit=C1)
```



## Real-world challenges at scale

As with all things distributed, the real challenges show up at scale. The classic single-commit model has a cliff. Replicas jump from "current" to "latest" in one step. If your indexer gets a burst of updates, during a high-traffic season for example, the checkpoint created at a point in time can be quite large. Replicas then have to pay the cost of loading these large checkpoints in a single shot. 

Similarly, highly available systems are often replicated across geographical regions. Replication then depends on cross-region bandwidth and round trip time. If the delta between a replica's current commit and the checkpoint is large, the transfer takes longer and the refresh applies a big change in one step. Pulling a large delta, materializing many new segment files, and refreshing the searcher can create a burst of page faults and cause latency spikes.  

When the gap between checkpoints absorbed by the replica is large, you pay the whole cost at once, which can lead to page faults, thrashing, search request timeouts, and unstable systems. In this post we introduce a novel technique of turning this cliff into a staircase, using a combination of *bite-sized commits* on indexers and *adaptive refresh* on replicas.

**Let's make this concrete with an example**:

Consider a writer that produces a sequence of commits: 1, 2, 3, 4, 5, 6, 7. A replica is currently on commit 1, happily serving queries. Due to transient network issues, replication gets delayed and checkpoint 2 takes a while to propagate to replicas. Meanwhile, indexers continue to process updates, push checkpoints to the remote store, and are now on checkpoint 7. Since we always replicate the latest commit, the next checkpoint contains commit 7.

The replica receives this checkpoint and attempts to refresh on commit 7. High update traffic and merge activity on indexers can cause the index in commit 7 to be significantly different from commit 1. This is not unreasonable; after all, we did just skip through five commits of indexing activity. While this may seem efficient in theory---one download, one refresh, and the replica is up to date---refreshing on a large chunk of new index segments can significantly stress the system. 

The OS page cache must load a large volume of fresh data, triggering page faults to temporarily evict existing pages. As we noted earlier, though, searcher managers in Lucene make sure existing in-flight queries complete with the same searcher they started on. So even if parts of the index are obsolete for the new post-refresh searcher, they will still be used by queries that are already underway on the old searcher. This creates a memory contention, which leads to page faults, thrashing, noticeable latency spikes, and, eventually, search request timeouts.

The single-checkpoint method forces each replica to absorb all accumulated changes in one step. It's simple and correct, but when the gap between checkpoints absorbed by the replica is large, you pay the whole cost at once. This cliff-like behavior is exactly what we wanted to smooth out.


## Bite-sized commits and adaptive refresh

With *bite-sized commits*, we rethink how checkpoints are constructed and consumed. Instead of bundling only the newest commit, the writer now keeps a small rolling history of commits and publishes them together as a single checkpoint. On the search side, replicas receive a set of commits instead of only one. They can step through those commits incrementally, downloading manageable deltas and refreshing in small, predictable cycles. 

Keen readers would note, however, that Lucene's `refreshIfNeeded` API only refreshed on the latest commit by default. We [contributed changes](https://github.com/apache/lucene/pull/14443) to Lucene that allow `SearcherManager` (and related classes) to intelligently select the candidate commit for refresh. Consumer implementations can add logic to select the right commit, like calculating the byte difference between the current searcher commit and available commits and selecting the newest commit that fits in the available searcher memory. Replicas can thus *adaptively refresh* on the bite-sized commits. If all commits are small enough, they can directly jump to the latest one. At the other extreme, they can incrementally step through all provided commits. These changes are available as part of Lucene 10.3.


### Setting up indexers for bite-sized commits

On the indexer side, Lucene's IndexWriter continues to operate as before, creating commits on the indexer machine, though you may want to consider increasing commit frequency to keep each commit as a smaller differential from the previous one. For example, instead of creating a commit every minute, you can consider creating one every 15 seconds, giving you 4 incremental hops per minute window that a replica can chose from. Note that this is one of many possible approaches. Another, better way is to accurately trigger commits whenever segment turnover exceeds a configured threshold size.

`IndexWriters` are configured with an `IndexDeletionPolicy` to clean up older commits that are no longer needed. The default is `KeepOnlyLastCommitDeletionPolicy`, which only retains the most recent commit. Since we want to hold multiple commits in our checkpoint, we must use a different index deletion policy. Lucene offers `KeepLastNCommitsDeletionPolicy` to keep the last N commits. You can also write your own deletion policy based on specific business requirements, like keeping all commits within a specified time window.

Finally, your replication checkpoint should be updated to include all the commits you want bundled together---typically all commits currently available in the index, since your configured deletion policy will already handle cleanup of commits that fall outside the retention window.

With this foundation, we set up our indexers to publish multi-commit checkpoints, enabling replicas to make intelligent, adaptive refresh decisions.


### Changes on replicas for adaptive refresh

The replica now receives a set of commits with each checkpoint. Our goal is still to finally refresh on the latest commit. However, instead of directly jumping to the latest commit, the replica can now plan its path through a series of commits that are safe to refresh on.

With 10.3, Lucene added a `RefreshCommitSupplier` interface that users can implement to specify the strategy for selecting the commit to refresh on. A simple approach could be a threshold-based strategy, where you define a static threshold based on the memory available in your runtime environment, find the "bytes delta" between the current searcher commit and available commits, and select the latest commit that has a delta below the threshold. Each Lucene commit is uniquely identified by a (`long`) commit generation ID, with newer commits being assigned higher generation IDs.

It is worth noting, however, that while adaptive refresh smooths out Lucene's refresh deltas, the very act of downloading a checkpoint on the machine can also create memory contention. After all, it is being run on the same machine and using the same memory. 

In the following steps, we describe a detailed strategy that lets you surgically download and refresh only the bytes you will refresh on---and in increments that do not stress your replicas.

**1) Start with only fetching lightweight commit metadata**
The replica first downloads only lightweight commit metadata---the `segments_N` and `.si` (segment info) files for all commits present in a checkpoint. These files describe the index structure and segments referenced by each commit but are tiny compared to the full segment data.

**2) Calculate commit diffs**
Using commit metadata, the replica creates a list of *new* segment files that a commit brings in. The size of these files gives us the new bytes that each commit is bringing into the index. This is the "commit diff" that we use in our refresh commit selection strategy. By maintaining a simple metadata file in checkpoints that holds the size of each segment file, we can calculate this commit diff without actually downloading any segment files yet!

**3) Select the optimal commit for refresh**
Using our example of a threshold-based selection strategy, the replica evaluates the commit diffs for each available commit and selects the newest commit that is below the threshold. Once a commit is identified for refresh, the replica downloads all the files referenced by that commit and refreshes on it.

It is worth mentioning that you'll need to handle the edge case of none of the commits being below your statically defined threshold, which could happen due to massive update storms, even in the best-effort 15-second window, or aggressive merges that lead to segment files greater than the defined threshold. We have found that simply falling back to picking up the next commit is the safest path forward in such instances.

**4) Loop until you refresh on the latest commit**
Finally, we want to continue this loop until we've refreshed on the latest commit. So loop back to step 2 until the searcher commit is the same as the latest commit in the checkpoint (the index is current with all updates present in the checkpoint).


### How this looks in action

Let's ground this theory in what a real-life adaptive refresh scenario looks like. We start with the following setup:

* **Writer commits**: 1, 2, 3, 4, 5, 6, 7 (latest)
* **Replica**: Currently on commit **1**
* **Checkpoint**: Includes commits [1–7], representing the last 30 minutes of activity
* **Threshold**: 5 GB



#### Pass 1 (current searcher commit = 1, latest commit = 7)

Check deltas versus current (1), walking from the newest to oldest commit:

```ruby
    * Δ(7, 1) = 11 GB > 5 → skip
    * Δ(6, 1) = 9 GB > 5 → skip
    * Δ(5, 1) = 6 GB > 5 → skip
    * Δ(4, 1) = 5 GB ≤ 5 → select commit 4
```

The newest commit with a delta below our threshold of 5 GB is **commit 4**. We download files for that commit and refresh the searcher on it.


#### Pass 2 (current searcher commit = 4, latest commit = 7)

Since we are not on the latest commit yet, we run through the loop again. This time, however, the searcher is on commit=4, so the bytes delta with subsequent commits is smaller:

```ruby
    * Δ(7, 4) = 6 GB > 5 → skip
    * Δ(6, 4) = 5 GB ≤ 5 → select commit 6
```

We find that "commit 6" is now within our safe-to-refresh threshold of 5 GB. We download relevant files and refresh on commit 6, bringing our searcher closer to the latest commit in the checkpoint. The replica can also delete the now unused segment files from the old point-in-time searcher, freeing up some disk space.


#### Pass 3 (current searcher commit = 6, latest commit = 7)

Running through the same loop, we now find that "commit=7" is now conveniently within our safe-to-refresh threshold. We fetch and refresh on the commit, thus getting our searchers the freshest data for the index:

```ruby
    * Δ(7, 6) = 3 GB ≤ 5 → select commit 7
```


Thus, instead of one big jump, the replica moves in bounded bites, with each refresh capped by a size threshold. Instead of a single 11 GB transfer, the replica progresses through 3 smaller steps of 5 GB, 5 GB, and 3 GB. Even though the total new bytes are larger in number (13 GB in this case), each individual refresh is smaller and cheaper, and the system avoids sharp spikes in network, memory, or CPU load.

With a low OS page cache churn, we see fewer page faults and more stable latency for search requests. The entire process is idempotent, retry-able, and resilient to transient failures. Since all intermediate states are valid Lucene commits, you can resume refreshing from the last commit point. Additionally, refreshing again on a commit point that the searcher is already on is a no-op and does not impact the system.

Astute readers might wonder why we don't simply checkpoint more frequently and continue using the single-commit checkpoints. This is done to enable refresh efficiencies. Single-commit checkpoints (even with small commits) require replicas to iterate through all checkpoints as they catch up to the latest changes. With multiple commits in the same checkpoint, we can evaluate them together using common checkpoint metadata and intelligently decide which commits to refresh on. 

![Adaptive Refresh](/assets/media/blog-images/2025-11-12-adaptive-refresh-for-resilient-segment-replication/main_image.png){:class="img-centered"}


## Conclusion

Large checkpoint jumps in segment-replicated systems create a fundamental tension: you want replicas to catch up quickly, but absorbing too much change at once can destabilize the system. The traditional approach of always replicating the latest commit creates a cliff---when replicas fall behind, they must pay the full cost in one painful step, with page faults, latency spikes, and, ultimately, timed out search requests.

Bite-sized commits and adaptive refresh transform this cliff into a staircase. By maintaining a rolling history of commits and letting replicas step through them incrementally, we allow replicas to catch up at their own sustainable pace while maintaining predictable performance characteristics. Each refresh stays within safe resource bounds, page cache churn remains low, and search latency stays stable, even during update bursts or network hiccups.

The elegance of this approach lies in its simplicity. There's no complex coordination protocol, no expensive distributed consensus---just intelligent use of what Lucene already gives us: immutable segments and atomic refresh semantics. Replicas make local decisions about which commit to refresh on next, using simple heuristics like delta size thresholds. The system remains fully idempotent and retry-able; if anything fails mid-refresh, you simply resume from the last successful commit. Each bite-sized commit is actually an incremental backup of the index. As a nice side effect, we get fine-grained point-in-time checkpoints from which to recover your index in case of outages or data corruption events. 

In production environments spanning multiple geographic regions with varying network conditions, this matters significantly. A replica in a distant data center experiencing bandwidth constraints can make steady progress without falling dangerously behind. A replica recovering from a restart can catch up incrementally rather than attempting one massive refresh.

At the same time, it is worth noting that this setup will increase your remote storage costs. Since you now store a sliding window of more frequent commits, you capture some transient segments that would've otherwise been skipped with less frequent checkpoints. This increase in storage is directly controlled by the window and frequency of checkpoints you choose to maintain---longer windows consume more storage. It is important to configure a remote storage cleanup policy that periodically deletes older, obsolete checkpoints.

Support for this architecture is now available in Lucene 10.3, providing high-throughput, geographically distributed search systems with a proven path to more stable replication. If your replicas are experiencing latency spikes during refresh, or if you're dealing with cross-region replication challenges, adaptive refresh might be exactly the resilient replication strategy you've been looking for.

