---
layout: post
title:  "Exploring Concurrent Segment Search Performance"
authors:
 - jaydeng
 - sohami
date: 2024-06-30
categories:
 - search
 - technical-post
meta_keywords:
meta_description:
has_math: true
has_science_table: true
---

In October 2023, we [introduced concurrent segment search in OpenSearch](https://opensearch.org/blog/concurrent_segment_search/) as an experimental feature. Searching segments concurrently improves search latency across a large variety of workloads. This feature was made generally available in OpenSearch 2.12; we highly recommend that you try it! Here, we’ll share our exploration of performance in simulations of different real-world scenarios. In particular, we’ll look at the performance trends as the available resources in the system decrease and concurrency increases.

In concurrent segment search, each shard-level search request on a node is divided into multiple execution tasks called _slices_. Slices can be executed concurrently on separate threads in the index searcher thread pool, separate from the search thread pool. Each slice searches within the segments associated with it. Once all slice executions are complete, the collected results from all slices are combined (reduced) and returned to the coordinator node. The index searcher thread pool is used to execute the slices of each shard search request and is shared across all shard search requests on a node. By default, the index searcher thread pool has twice as many threads as the number of available processors.

## Performance results

For our performance testing, we standardized on an r5.8xlarge instance type, which has 32 vCPUs and an index searcher thread pool size of 64. That lets us explore various concurrency and cluster load scenarios on a realistic instance and allows us to capture a more accurate picture of performance as we increase the number of slices and the number of search clients.

In our [previous blog](https://opensearch.org/blog/concurrent_segment_search/), we saw that the strongest performance improvements were in long-running and CPU-intensive operations while fast queries like `match_all` saw little improvement or even a slight performance regression from the overhead of concurrent search. Because we want to focus this post on how performance changes under various cluster load conditions, we will look at a smaller subset of longer-running operations for the [`nyc_taxis`](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/nyc_taxis) and the [`big5`](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/big5) workloads using OpenSearch Benchmark. Additionally, we'll report the p90 system metrics for the entire workload provided by OpenSearch Benchmark, which is most relevant for the longer-running operations.

First, we establish a performance baseline using a single shard and a single search client. This configuration is the theoretical best-case scenario when using concurrent segment search because in this configuration there is a maximum of 1 shard-level search request being processed at a time; thus each request uses maximum resources.

The following sections present the obtained performance results. We abbreviate concurrent segment search as `CS`.

### Cluster setup 1

* Instance type: r5.8xlarge (32 vCPUs, 256GB RAM)
* Node count: 1
* Shard count: 1
* Search client count: 1
* Concurrent search thread pool size: 64

#### P90 Query Latency Comparison

|                                   Operation | CS disabled (in ms) | CS enabled (Lucene default slices) (in ms) | % Improvement | CS enabled (fixed slice count=2)  (in ms) | % Improvement | CS enabled (fixed slice count=4) (in ms) | % Improvement |
|--------------------------------------------|--------------------|-------------------------------------------|--------------|------------------------------------------|--------------|-----------------------------------------|--------------|
| `range-auto-date-histo-with-metrics` (`big5`) |               21757 |                                       4178 |           81% |                                     11710 |           46% |                                     6915 |           68% |
|              `range-auto-date-histo` (`big5`) |                7950 |                                       1486 |           81% |                                      4341 |           45% |                                     2555 |           67% |
|            `query-string-on-message` (`big5`) |                 143 |                                         49 |           66% |                                        81 |           43% |                                       59 |           58% |
|                   `keyword-in-range` (`big5`) |                 127 |                                         58 |           54% |                                        87 |           31% |                                       70 |           44% |
|           `distance_amount_agg` (`nyc_taxis`) |               12403 |                                       2921 |           76% |                                      6642 |           46% |                                     3633 |           71% |

#### System Metrics (`big5`)

|               Metric              | CS disabled | CS enabled (Lucene default slices) | CS enabled (fixed slice count=2) | CS enabled (fixed slice count=4) |
|-----------------------------------|-------------|------------------------------------|----------------------------------|----------------------------------|
| p90 CPU                           | 3%          | 36%                                | 6%                               | 12%                              |
| p90 JVM                           | 54%         | 56%                                | 54%                              | 54%                              |
| Max `index_searcher` active threads | --          | 17                                 | 2                                | 4                                |

#### System Metrics (`nyc_taxis`)

|               Metric              | CS disabled | CS enabled (Lucene default slices) | CS enabled (fixed slice count=2) | CS enabled (fixed slice count=4) |
|-----------------------------------|-------------|------------------------------------|----------------------------------|----------------------------------|
| p90 CPU                           | 3%          | 23%                                | 7%                               | 13%                              |
| p90 JVM                           | 23%         | 23%                                | 21%                              | 22%                              |
| Max `index_searcher` active threads | --          | 22                                 | 2                                | 4                                |


Similarly to the initial performance results shared in our first blog, with the larger `r5.8xlarge` instance type we see strong performance improvements in long-running, CPU-intensive operations. As for system resource utilization, CPU usage increases as expected when the number of active concurrent search threads increases. However, the p90 JVM heap utilization appears mostly uncorrelated with increased concurrency.

Taking a step back, the theoretical maximum performance gain from concurrent segment search is approximately a 50% improvement in shard level search request latency for every twofold increase in concurrency. For example, when going from no concurrent search to concurrent search with 2 slices, the theoretical best performance improvement is 50%. Increasing to 4 slices, the best performance improvement is 75%, and to 8 slices---87.5%.  Additionally, for every doubling of concurrency, we expect the CPU utilization to roughly double, assuming the work distribution is the same across slices. This is because twice the number of CPU threads is used, although for a shorter duration.

With that in mind, even in **Cluster setup 1**, we begin to observe diminishing returns in the performance improvement as we increase the slice level concurrency. This change is largely because of duplicate work and the additional effort needed to reduce the slice-level search results as the number of slices increases. 

#### Performance improvements vs. CPU utilization of `range-auto-date-histo-with-metrics`

The following table presents a performance example of the `range-auto-date-histo-with-metrics` operation.

|               Comparison               | % Performance improvement | % Additional CPU utilization (p90) |
|----------------------------------------|---------------------------|------------------------------------|
| Concurrent Search Disabled to 2 slices |                       46% |                                 3% |
|          2 slices to 4 slices          |                       22% |                                 6% |
| 4 slices to Lucene default slice count |                       13% |                                24% |

When we compare concurrent search with 2 slices to not using concurrent search, we can see that we can get a 46% performance improvement by utilizing just 3% more CPU. However, performance improvements diminish as we increase the slice count in order to utilize more CPU. We can see that going from 4 slices to the Lucene default slice count results in only a 13% performance improvement at the cost of a 24% higher CPU utilization.

Of course, in the real world, a cluster is rarely only serving a single search request at a time. To understand how the performance of concurrent segment search changes as the load on a cluster increases, we ran performance tests on a few additional cluster setups. The results are presented in the following sections. 

### Cluster Setup 2

* Instance type: r5.8xlarge (32 vCPUs, 256GB RAM)
* Node count: 1
* Shard count: 1
* Search client count: 2
* Concurrent search thread pool size: 64

#### P90 Query Latency Comparison

|                  Operation                  | CS disabled (in ms) | CS enabled (Lucene default slices) (in ms) | % Improvement | CS enabled (fixed slice count=2)  (in ms) | % Improvement | CS enabled (fixed slice count=4) (in ms) | % Improvement |
|---------------------------------------------|---------------------|--------------------------------------------|---------------|-------------------------------------------|---------------|------------------------------------------|---------------|
| `range-auto-date-histo-with-metrics` (`big5`) |               21888 |                                       4544 |           79% |                                     11930 |           45% |                                     6920 |           68% |
|           `range-auto-date-histo` (`big5`)            |                8235 |                                       1634 |           80% |                                      4532 |           45% |                                     2633 |           68% |
|           `query-string-on-message` (`big5`)          |                 142 |                                         49 |           65% |                                       101 |           29% |                                       63 |           55% |
|              `keyword-in-range` (`big5`)              |                 127 |                                         61 |           52% |                                       105 |           18% |                                       73 |           43% |
|             `distance_amount_agg` (`nyc_taxis`)            |               12335 |                                       2941 |           76% |                                      6969 |           44% |                                     3689 |           70% |

#### System Metrics (`big5`)

|               Metric              | CS disabled | CS enabled (Lucene default slices) | CS enabled (fixed slice count=2) | CS enabled (fixed slice count=4) |
|-----------------------------------|-------------|------------------------------------|----------------------------------|----------------------------------|
| p90 CPU                           | 6%          | 60%                                | 12%                              | 25%                              |
| p90 JVM                           | 54%         | 53%                                | 56%                              | 54%                              |
| Max `index_searcher` active threads | --          | 34                                 | 4                                | 8                                |

#### System Metrics (`nyc_taxis`)

|               Metric              | CS disabled | CS enabled (Lucene default slices) | CS enabled (fixed slice count=2) | CS enabled (fixed slice count=4) |
|-----------------------------------|-------------|------------------------------------|----------------------------------|----------------------------------|
| p90 CPU                           | 6%          | 47%                                | 13%                              | 24%                              |
| p90 JVM                           | 59%         | 59%                                | 50%                              | 55%                              |
| Max `index_searcher` active threads | --          | 44                                 | 4                                | 8                                |

In **Cluster Setup 2**, we increase the search client count to 2, so there are now 2 search clients sending search requests to the cluster at the same time. From the system metrics, we can confirm that the max `index_searcher` active threads metric is showing twice as many active threads in the 2-slice, 4-slice, and Lucene default cases. Moreover, the OpenSearch Benchmark workloads run in [benchmarking mode](https://opensearch.org/docs/latest/benchmark/user-guide/target-throughput/#benchmarking-mode), which means that there is no delay between requests: as soon as search clients receive a response from the server, they send a subsequent request.

Based on the system utilization metrics, even with the additional search client, CPU utilization remains below 60%. In fact, even in the in the worst-case scenario, CPU is not being fully utilized. Therefore, we don't observe any decline in performance improvements when comparing various slice count scenarios between **Cluster setup 1** and **Cluster setup 2**. As we increase the number of slices, we continue to observe diminishing returns in performance improvements relative to the rise in CPU usage.

#### Performance improvements vs. CPU utilization of `range-auto-date-histo-with-metrics`

The following table presents a performance example of the `range-auto-date-histo-with-metrics` operation.

|               Comparison               | % Performance improvement | % Additional CPU utilization (p90) |
|----------------------------------------|---------------------------|------------------------------------|
| Concurrent Search Disabled to 2 slices |                       45% |                                 6% |
| 2 slices to 4 slices                   |                       23% |                                13% |
| 4 slices to Lucene default slice count |                       11% |                                35% |

### Cluster setup 3

* Instance type: r5.8xlarge (32 vCPUs, 256GB RAM)
* Node count: 1
* Shard count: 1
* Search client count: 4
* Concurrent Search thread pool size: 64

#### P90 query latency comparison

|              Operation              | CS disabled (in ms) | CS enabled (Lucene default slices) (in ms) | % Improvement | CS enabled (fixed slice count=2)  (in ms) | % Improvement | CS enabled (fixed slice count=4) (in ms) | % Improvement |
|-------------------------------------|---------------------|--------------------------------------------|---------------|-------------------------------------------|---------------|------------------------------------------|---------------|
| `range-auto-date-histo-with-metrics` (`big5`) |               21307 |                                       6398 |           70% |                                     11692 |           45% |                                     6921 |           68% |
|        `range-auto-date-histo` (`big5`)       |                8088 |                                       2444 |           70% |                                      4504 |           44% |                                     2727 |           66% |
|       `query-string-on-message` (`big5`)      |                 142 |                                         51 |           64% |                                       103 |           27% |                                       69 |           52% |
|          `keyword-in-range` (`big5`)          |                 132 |                                         68 |           48% |                                       110 |           17% |                                       81 |           39% |
|         `distance_amount_agg` (`nyc_taxis`)        |               12022 |                                       3512 |           71% |                                      6362 |           47% |                                     3649 |           70% |

#### System Metrics (`big5`)

|               Metric              | CS disabled | CS enabled (Lucene default slices) | CS enabled (fixed slice count=2) | CS enabled (fixed slice count=4) |
|-----------------------------------|-------------|------------------------------------|----------------------------------|----------------------------------|
| p90 CPU                           | 13%         | 93%                                | 25%                              | 49%                              |
| p90 JVM                           | 54%         | 54%                                | 54%                              | 54%                              |
| Max `index_searcher` active threads | --          | 64                                 | 8                                | 16                               |

#### System Metrics (`nyc_taxis`)

|               Metric              | CS disabled | CS enabled (Lucene default slices) | CS enabled (fixed slice count=2) | CS enabled (fixed slice count=4) |
|-----------------------------------|-------------|------------------------------------|----------------------------------|----------------------------------|
| p90 CPU                           | 12%         | 77%                                | 25%                              | 50%                              |
| p90 JVM                           | 59%         | 59%                                | 59%                              | 59%                              |
| Max `index_searcher` active threads | --          | 64                                 | 8                                | 16                               |

Next, we have a setup serving search requests to 4 search clients concurrently. For the Lucene default slice count, this scenario creates enough segment slices to fill the `index_searcher` thread pool. The maximum number of concurrent search active threads is 64, which is equal to the thread pool size. Because of this, the majority of the available CPU resources are consumed in the Lucene default slice count case, leading to diminishing performance improvements. 

**Cluster setup 1** and **Cluster setup 2** showed a roughly 80% performance improvement in the `range-auto-date-histo-with-metrics` for the Lucene default case. However, in **Cluster setup 3**, when we reach the CPU availability bottleneck, this same performance improvement decreases to 70%.

#### Performance improvements vs. CPU utilization of `range-auto-date-histo-with-metrics`

The following table presents a performance example of the `range-auto-date-histo-with-metrics` operation.

|               Comparison               | % Performance improvement | % Additional CPU utilization (p90) |
|----------------------------------------|---------------------------|------------------------------------|
| Concurrent Search Disabled to 2 slices |                       45% |                                12% |
| 2 slices to 4 slices                   |                       22% |                                24% |
| 4 slices to Lucene default slice count |                        2% |                                44% |

Reviewing the `range-auto-date-histo-with-metrics` operation again shows that as we approach 100% CPU utilization, the performance benefit of additional slices when using concurrent segment search mostly disappears. In **Cluster setup 3**, when comparing 4 slices to the Lucene default slice count, we see only a 2% performance improvement at the cost of a prohibitive 44% Additional CPU usage.

### Cluster setup 4

* Instance type: r5.8xlarge (32 vCPUs, 256GB RAM)
* Node count: 1
* Shard count: 1
* Search client count: 8
* Concurrent search thread pool size: 64

#### P90 Query Latency Comparison

|                  Operation                  | CS disabled (in ms) | CS enabled (Lucene default slices) (in ms) | % Improvement | CS enabled (fixed slice count=2)  (in ms) | % Improvement | CS enabled (fixed slice count=4) (in ms) | % Improvement |
|---------------------------------------------|---------------------|--------------------------------------------|---------------|-------------------------------------------|---------------|------------------------------------------|---------------|
| `range-auto-date-histo-with-metrics` (`big5`) |               21641 |                                      11937 |           45% |                                     11596 |           46% |                                    11884 |           45% |
|       `range-auto-date-histo` (`big5`)        |                8382 |                                       4457 |           47% |                                      4536 |           46% |                                     4437 |           47% |
|      `query-string-on-message` (`big5`)       |                 166 |                                         83 |           50% |                                       118 |           29% |                                       75 |           55% |
|          `keyword-in-range` (`big5`)          |                 162 |                                         99 |           39% |                                       126 |           22% |                                       90 |           44% |
|        `distance_amount_agg` (`big5`)         |               11727 |                                       5420 |           54% |                                      6586 |           44% |                                     5326 |           55% |

#### System Metrics (`big5`)

|               Metric              | CS disabled | CS enabled (Lucene default slices) | CS enabled (fixed slice count=2) | CS enabled (fixed slice count=4) |
|-----------------------------------|-------------|------------------------------------|----------------------------------|----------------------------------|
| p90 CPU                           | 25%         | 100%                               | 49%                              | 99%                              |
| p90 JVM                           | 56%         | 55%                                | 54%                              | 54%                              |
| Max `index_searcher` active threads | --          | 64                                 | 16                               | 32                               |

#### System Metrics (`nyc_taxis`)

|               Metric              | CS disabled | CS enabled (Lucene default slices) | CS enabled (fixed slice count=2) | CS enabled (fixed slice count=4) |
|-----------------------------------|-------------|------------------------------------|----------------------------------|----------------------------------|
| p90 CPU                           | 26%         | 100%                               | 50%                              | 100%                             |
| p90 JVM                           | 60%         | 58%                                | 59%                              | 58%                              |
| Max `index_searcher` active threads | --          | 64                                 | 16                               | 32                               |

For this setup, we double the number of search clients again to 8. From the system resource utilization metrics, we see that in both the 4 slice and the Lucene default slice cases, we reach 100% CPU usage. As expected, increasing the slice count in this scenario results in even more pronounced diminishing returns and, in some cases, even slight performance regressions.

#### Performance improvements vs. CPU utilization of `range-auto-date-histo-with-metrics`

The following table presents a performance example of the `range-auto-date-histo-with-metrics` operation.

|               Comparison               | % Performance improvement | % Additional CPU utilization (p90) |
|----------------------------------------|---------------------------|------------------------------------|
| Concurrent Search Disabled to 2 slices |                       46% |                                24% |
| 2 slices to 4 slices                   |                       -1% |                                50% |
| 4 slices to Lucene default slice count |                        0% |                                 1% |

In **Cluster setup 3**, we saw little to no benefit going from 4 slices to the Lucene default slice count when CPU utilization reached 100%. Similarly, moving from 2 slices to 4 slices in this scenario yields minimal benefit when CPU usage reaches 100%. We can clearly see that in scenarios with a high number of search clients sending requests concurrently, performance gains are unlikely when we increase the slice level concurrency on our cluster because CPU resource utilization starts to reach the maximum number of queries per second.

### Comparing setups

The following sections present a comparison of the preceding setups.

#### Setup comparison for `range-auto-date-histo-with-metrics`

| Clsuter configuration | % Performance improvement from CS disabled to 2 slices | % Additional CPU utilization | % Performance improvement from 2 slices to 4 slices | % Additional CPU utilization | % Performance improvement from 4 slices to Lucene default | % Additional CPU utilization |
|-----------------------|-------------------------------------------------------|------------------------------|----------------------------------------------------|------------------------------|----------------------------------------------------------|------------------------------|
| 1 shard / 1 client    |                                                   46% |                           3% |                                                22% |                           6% |                                                      12% |                          24% |
| 1 shard / 2 client    |                                                   45% |                           6% |                                                22% |                          13% |                                                      10% |                          35% |
| 1 shard / 4 client    |                                                   45% |                          12% |                                                22% |                          24% |                                                       2% |                          44% |
| 1 shard / 8 client    |                                                   46% |                          24% |                                                -1% |                          50% |                                                       0% |                           1% |

#### Setup comparison for `distance_amount_agg`

| Clsuter configuration | % Performance improvement from cs disabled to 2 slices | % Additional CPU utilization | % Performance improvement from 2 slices to 4 slices | % Additional CPU utilization | % Performance improvement from 4 slices to Lucene default | % Additional CPU utilization |
|-----------------------|-------------------------------------------------------|------------------------------|----------------------------------------------------|------------------------------|----------------------------------------------------------|------------------------------|
| 1 shard / 1 client    | 45%                                                   | 4%                           | 26%                                                | 6%                           | 6%                                                       | 10%                          |
| 1 shard / 2 client    | 49%                                                   | 7%                           | 21%                                                | 11%                          | 7%                                                       | 23%                          |
| 1 shard / 4 client    | 46%                                                   | 13%                          | 22%                                                | 25%                          | 3%                                                       | 27%                          |
| 1 shard / 8 client    | 44%                                                   | 24%                          | 10%                                                | 50%                          | 0%                                                       | 0%                           |

The main takeaway here is that whenever there are available CPU resources, you can improve performance by further increasing concurrency. However, once CPU resources are fully utilized, you will no longer see performance gains by increasing concurrency and you may even see slight regressions. Moreover, there are diminishing returns on increasing the concurrency of a single request even when there are CPU resources available. This is because there is additional overhead introduced by the combination of duplicated work across slices in the concurrent portion and sequential work during reduce phase. As the availability of these CPU resources decreases, the effect of the diminishing returns on concurrency is further amplified.

## `noaa` Workload

In addition to the `nyc_taxis` and `big5` workloads, we also benchmarked performance for the [`noaa`](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/noaa) OpenSearch Benchmarks workload focused on aggregations. Because we saw the greatest improvements for the aggregation-related queries in `nyc_taxis` and `big5`, we wanted to see how these performance gains held up across datasets and queries.

### Cluster setup 5

* Instance type: r5.2xlarge (8 vCPUs, 64GB RAM)
* Node count: 1
* Shard count: 1
* Search client count: 1
* Concurrent Search thread pool size: 16

#### p90 query latency comparison

|              Workload operation             | CS disabled (in ms) | CS enabled (Lucene default slices) (in ms) | % Improvement | CS enabled (fixed slice count=4)(in ms) | % Improvement |
|---------------------------------------------|---------------------|--------------------------------------------|---------------|-----------------------------------------|---------------|
| `date-histo-entire-range`                     | 3                   | 4                                          | -31%          | 3                                       | 2%            |
| `date-histo-string-significant-terms-via-map` | 13700               | 7650                                       | 44%           | 7538                                    | 45%           |
| `keyword-terms`                               | 147                 | 83                                         | 44%           | 78                                      | 47%           |
| `range-auto-date-histo-with-metrics`          | 3957                | 2182                                       | 45%           | 2226                                    | 44%           |
| `range-date-histo`                            | 1803                | 948                                        | 47%           | 1029                                    | 43%           |
| `range-numeric-significant-terms`             | 2597                | 2951                                       | -14%          | 1627                                    | 37%           |

#### System metrics

|               Metric              | CS disabled | CS enabled (Lucene default slices) | CS enabled (fixed slice count=4) |
|-----------------------------------|-------------|------------------------------------|----------------------------------|
| p90 CPU                           | 25%         | 99%                                | 50%                              |
| p90 JVM                           | 60%         | 60%                                | 60%                              |
| Max `index_searcher` active threads | --          | 16                                 | 4                                |

The performance results for these aggregation types confirm the results we saw with previous cluster configurations. We see strong performance improvements in most aggregation types, and again, this performance improvement diminishes and sometimes even regresses as we increase  concurrency under the CPU load.

## Observations

Increases or decreases in performance related to concurrent segment search can usually be attributed to one of the following four reasons.

First, whenever the number of segment slices is large, the index searcher thread pool fills. Whenever there are no threads available to execute the shard search task for a slice, the slice waits in the queue until other slices are finished processing. For example, in **Cluster setup 3** there are `4 * 17 = 68` total segment slices when using the Lucene default slice count but only 64 threads available in the concurrent search thread pool. Thus, 4 segment slices will spend some time waiting in the thread pool queue.

Second, whenever the number of active threads is higher than the number of CPU cores, each individual thread may spend more time processing because the CPU cores are multiplexing tasks. By default, the `r5.2xlarge` instance with 8 CPU cores has 16 threads in the index searcher thread pool and 13 threads in the search thread pool. If all 29 threads are concurrently processing search tasks, then each individual thread will encounter a longer processing time because there are only 8 CPU cores to serve these 29 threads.

Third, the specific query implementation can greatly impact the performance when increasing concurrency because some queries may perform more duplicate work as the number of slices increases. For example, significant terms aggregations count queries for each bucket key to determine the term background frequencies. Thus, duplicated bucket keys across segment slices result in duplicated count queries across slices as well.

Fourth, the reduce phase is performed sequentially on all segment slices. If the reduce overhead is large, it can offset the gains from searching documents concurrently. For example, for aggregations, a new `Aggregator` instance is created for each segment slice. Each `Aggregator` creates an `InternalAggregation` object, which represents the buckets created during document collection. These `InternalAggregation` object instances are then processed sequentially during the reduce phase. As a result, a simple `term` aggregation can create up to `slice_count * shard_size` buckets per shard, which are then processed sequentially during the reduce phase.

## Wrapping up

In summary, when choosing a segment slice count to use, it’s important to run your own benchmarking to determine if the additional parallelization from adding more segment slices outweighs the additional processing overhead. While concurrent segment search is ready for use in production environments, you can continue to track its further improvements on this [project board](https://github.com/orgs/opensearch-project/projects/117).

Additionally, in order to provide performance visibility over time, we will publish nightly performance runs for concurrent segment search in [OpenSearch Performance Benchmarks] (https://opensearch.org/benchmarks), covering all the test workloads mentioned in this post.

For guidelines when getting started with concurrent segment search, see [General guidelines](https://opensearch.org/docs/latest/search-plugins/concurrent-segment-search/#general-guidelines).