---
layout: post
title:  "Boosting vector search performance with concurrent segment search"
authors:
- vijay
- navneev
- vamshin
- kolchfa
date: 2024-08-22
categories:
  - technical-posts
  - search
meta_keywords: concurrent segment search, OpenSearch vector search, shard optimization, k-NN
meta_description: The concurrent segment search feature in OpenSearch optimizes CPU usage and enhances vector search performance by executing queries in parallel across multiple segments within a shard.
has_science_table: true
---

<style>

table { 
    font-size: 16px; 
}

h3 {
    font-size: 22px;
}

h4 {
    font-size: 20px;
}

th {
    background-color: #f5f7f7;
}​

</style>

In OpenSearch, data is stored in shards, which are further divided into segments. When you execute a search query, it runs sequentially across all segments of each shard involved in the query. As the number of segments increases, this sequential execution can increase _query latency_ (the time it takes to retrieve the results) because the query has to wait for each segment run to complete before moving on to the next one. This delay becomes especially noticeable if some segments take longer to process queries than others.

Introduced in OpenSearch version 2.12, _concurrent segment search_ addresses this issue by enabling parallel execution of queries across multiple segments within a shard. By using available computing resources, this feature reduces overall query latency, particularly for larger datasets with many segments. Concurrent segment search is designed to provide more consistent and predictable latencies. It achieves this consistency by reducing the impact of variations in segment performance or the number of segments on query execution time.

In this blog post, we'll explore the impact of concurrent segment search on vector search workloads.

## Enabling concurrent segment search

By default, concurrent segment search is disabled in OpenSearch. For our experiments, we enabled it for all indexes in the cluster by using the following dynamic cluster setting:

```json
PUT _cluster/settings
{
   "persistent": {
      "search.concurrent_segment_search.enabled": true
   }
}
```

To achieve concurrent segment searches, OpenSearch divides the segments within each shard into multiple slices, with each slice processed in parallel on a separate thread. The number of slices determines the degree of parallelism that OpenSearch can provide. You can either use Lucene's default slicing mechanism or set the maximum slice count manually. For detailed instructions on updating the slice count, see [Slicing mechanisms](https://opensearch.org/docs/latest/search-plugins/concurrent-segment-search/#slicing-mechanisms).

## Performance results

We performed our tests on an [OpenSearch 2.15](https://opensearch.org/versions/opensearch-2-15-0.html) cluster using the OpenSearch Benchmark [vector search workload](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/vectorsearch). We used the Cohere dataset with two different configurations to evaluate the performance improvements of vector search queries when running the workload with concurrent segment search disabled, enabled with default settings, and enabled with different max slice counts.

### Cluster setup

- 3 data nodes (r5.4xlarge: 128 GB RAM, 16 vCPUs, 250 GB disk space)
- 3 cluster manager nodes (r5.xlarge: 32 GB RAM, 4 vCPUs, 50 GB disk space)
- 1 OpenSearch workload client (c5.4xlarge: 32 GB RAM, 16 vCPUs)
- 1 and 4 search clients
- `index_searcher` thread pool size: 32

#### Index settings

|`m`	|`ef_construction`	|`ef_search`	|Number of shards	|Replica count	|Space type	|
|---	|---	|---	|---	|---	|---	|
|16	|100	|100	|6	|1	|inner product	|

#### Configuration

|Dimension	|Vector count	| Search query count	|Refresh interval	|
|:--- | :--- | :--- | :--- |
|768	| 10M	|10K	|1s (default)	|

### Service time comparison

We conducted the following experiments:

1. [Concurrent search disabled](#experiment-1-concurrent-search-disabled)
1. Concurrent search enabled:
   - [Max slice count = 0 (default)](#experiment-2-concurrent-search-enabled-max-slice-count--0-default)
   - [Max slice count = 2](#experiment-3-concurrent-search-enabled-max-slice-count--2)
   - [Max slice count = 4](#experiment-4-concurrent-search-enabled-max-slice-count--4)
   - [Max slice count = 8](#experiment-5-concurrent-search-enabled-max-slice-count--8)

The following sections present the results of these experiments.

#### Experiment 1: Concurrent search disabled

<table border="1">
  <thead>
    <tr>
      <th>k-NN engine</th>
      <th>Segment count</th>
      <th>Num search clients</th>
      <th colspan="3">Service time (ms)</th>
      <th>Max CPU %</th>
      <th>% JVM heap used</th>
      <th>Recall</th>
    </tr>
    <tr>
      <th></th>
      <th></th>
      <th></th>
      <th>p50</th>
      <th>p90</th>
      <th>p99</th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">Lucene</td>
      <td rowspan="2">381</td>
      <td>1</td>
      <td>30</td>
      <td>37</td>
      <td>45</td>
      <td>11</td>
      <td>53.48</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>36</td>
      <td>43</td>
      <td>51</td>
      <td>38</td>
      <td>42</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td rowspan="2">NMSLIB</td>
      <td rowspan="2">383</td>
      <td>1</td>
      <td>28</td>
      <td>35</td>
      <td>41</td>
      <td>10</td>
      <td>47.5</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>35</td>
      <td>41</td>
      <td>46</td>
      <td>36</td>
      <td>48.06</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td rowspan="2">Faiss</td>
      <td rowspan="2">381</td>
      <td>1</td>
      <td>29</td>
      <td>37</td>
      <td>42</td>
      <td>10</td>
      <td>47.85</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>36</td>
      <td>40</td>
      <td>44</td>
      <td>38</td>
      <td>46.38</td>
      <td>0.97</td>
    </tr>
  </tbody>
</table>

#### Experiment 2: Concurrent search enabled, max slice count = 0 (default)

<table border="1">
  <thead>
    <tr>
      <th>k-NN engine</th>
      <th>Segment count</th>
      <th>Num search clients</th>
      <th colspan="3">Service time (ms)</th>
      <th>Max CPU %</th>
      <th>% JVM heap used</th>
      <th>Recall</th>
    </tr>
    <tr>
      <th></th>
      <th></th>
      <th></th>
      <th>p50</th>
      <th>p90</th>
      <th>p99</th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">Lucene</td>
      <td rowspan="2">381</td>
      <td>1</td>
      <td>13</td>
      <td>15</td>
      <td>17</td>
      <td>47</td>
      <td>47.99</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>27</td>
      <td>32</td>
      <td>37</td>
      <td>81</td>
      <td>45.95</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td rowspan="2">NMSLIB</td>
      <td rowspan="2">383</td>
      <td>1</td>
      <td>13</td>
      <td>14</td>
      <td>16</td>
      <td>38</td>
      <td>47.28</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>24</td>
      <td>27</td>
      <td>32</td>
      <td>75</td>
      <td>44.76</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td rowspan="2">Faiss</td>
      <td rowspan="2">381</td>
      <td>1</td>
      <td>13</td>
      <td>14</td>
      <td>16</td>
      <td>34</td>
      <td>46.04</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>25</td>
      <td>28</td>
      <td>33</td>
      <td>76</td>
      <td>47.72</td>
      <td>0.97</td>
    </tr>
  </tbody>
</table>

#### Experiment 3: Concurrent search enabled, max slice count = 2

<table border="1">
  <thead>
    <tr>
      <th>k-NN engine</th>
      <th>Segment count</th>
      <th>Num search clients</th>
      <th colspan="3">Service time (ms)</th>
      <th>Max CPU %</th>
      <th>% JVM heap used</th>
      <th>Recall</th>
    </tr>
    <tr>
      <th></th>
      <th></th>
      <th></th>
      <th>p50</th>
      <th>p90</th>
      <th>p99</th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">Lucene</td>
      <td rowspan="2">381</td>
      <td>1</td>
      <td>14</td>
      <td>16</td>
      <td>19</td>
      <td>41</td>
      <td>52.91</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>28</td>
      <td>34</td>
      <td>42</td>
      <td>88</td>
      <td>51.65</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td rowspan="2">NMSLIB</td>
      <td rowspan="2">383</td>
      <td>1</td>
      <td>20</td>
      <td>23</td>
      <td>25</td>
      <td>16</td>
      <td>44.97</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>23</td>
      <td>27</td>
      <td>33</td>
      <td>60</td>
      <td>41.06</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td rowspan="2">Faiss</td>
      <td rowspan="2">381</td>
      <td>1</td>
      <td>20</td>
      <td>22</td>
      <td>24</td>
      <td>19</td>
      <td>46.42</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>23</td>
      <td>26</td>
      <td>32</td>
      <td>67</td>
      <td>37.23</td>
      <td>0.97</td>
    </tr>
  </tbody>
</table>

#### Experiment 4: Concurrent search enabled, max slice count = 4

<table border="1">
  <thead>
    <tr>
      <th>k-NN engine</th>
      <th>Segment count</th>
      <th>Num search clients</th>
      <th colspan="3">Service time (ms)</th>
      <th>Max CPU %</th>
      <th>% JVM heap used</th>
      <th>Recall</th>
    </tr>
    <tr>
      <th></th>
      <th></th>
      <th></th>
      <th>p50</th>
      <th>p90</th>
      <th>p99</th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">Lucene</td>
      <td rowspan="2">381</td>
      <td>1</td>
      <td>13.6</td>
      <td>15.9</td>
      <td>17.6</td>
      <td>49</td>
      <td>53.37</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>28</td>
      <td>33</td>
      <td>41</td>
      <td>86</td>
      <td>50.12</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td rowspan="2">NMSLIB</td>
      <td rowspan="2">383</td>
      <td>1</td>
      <td>14</td>
      <td>15</td>
      <td>16</td>
      <td>29</td>
      <td>51.12</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>21</td>
      <td>25</td>
      <td>31</td>
      <td>72</td>
      <td>42.63</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td rowspan="2">Faiss</td>
      <td rowspan="2">381</td>
      <td>1</td>
      <td>14</td>
      <td>15</td>
      <td>17</td>
      <td>30</td>
      <td>41.1</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>23</td>
      <td>28</td>
      <td>37</td>
      <td>77</td>
      <td>47.19</td>
      <td>0.97</td>
    </tr>
  </tbody>
</table>

#### Experiment 5: Concurrent search enabled, max slice count = 8

<table border="1">
  <thead>
    <tr>
      <th>k-NN engine</th>
      <th>Segment count</th>
      <th>Num search clients</th>
      <th colspan="3">Service time (ms)</th>
      <th>Max CPU %</th>
      <th>% JVM heap used</th>
      <th>Recall</th>
    </tr>
    <tr>
      <th></th>
      <th></th>
      <th></th>
      <th>p50</th>
      <th>p90</th>
      <th>p99</th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">Lucene</td>
      <td rowspan="2">381</td>
      <td>1</td>
      <td>14</td>
      <td>16</td>
      <td>18</td>
      <td>43</td>
      <td>45.37</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>28</td>
      <td>34</td>
      <td>43</td>
      <td>87</td>
      <td>48.79</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td rowspan="2">NMSLIB</td>
      <td rowspan="2">383</td>
      <td>1</td>
      <td>10</td>
      <td>12</td>
      <td>14</td>
      <td>41</td>
      <td>45.21</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>23</td>
      <td>25</td>
      <td>29</td>
      <td>75</td>
      <td>45.87</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td rowspan="2">Faiss</td>
      <td rowspan="2">381</td>
      <td>1</td>
      <td>15</td>
      <td>16</td>
      <td>17</td>
      <td>44</td>
      <td>48.68</td>
      <td>0.97</td>
    </tr>
    <tr>
      <td>4</td>
      <td>23</td>
      <td>26</td>
      <td>32</td>
      <td>79</td>
      <td>47.19</td>
      <td>0.97</td>
    </tr>
  </tbody>
</table>

### Comparing results 

For simplicity, we'll focus on the p90 metric with a single search client because this metric captures the performance of long-running vector search queries.

#### Service time comparison (p90)

|k-NN engine	|Concurrent segment search disabled	|Concurrent segment search enabled (Lucene default number of slices)	|% Improvement	|Concurrent segment search with max slice count = 2	|% Improvement	|Concurrent segment search with max slice count = 4	|% Improvement	|Concurrent segment search with max slice count = 8	|% Improvement	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|Lucene	|37	|15	|59.5	|16	|56.8	|15.9	|57	|16	|56.8	|
|NMSLIB	|35	|14	|60	|23	|34.3	|15	|57.1	|12	|65.7	|
|Faiss	|37	|14	|62.2	|22	|40.5	|15	|59.5	|16	|56.8	|


#### CPU utilization comparison

|k-NN engine	|Concurrent segment search disabled	|Concurrent segment search enabled (Lucene default number of slices)	|% Additional CPU utilization	|Concurrent segment search with max slice count = 2	|% Additional CPU utilization	|Concurrent segment search with max slice count = 4	|% Additional CPU utilization	|Concurrent segment search with max slice count = 8	|% Additional CPU utilization	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|Lucene	|11	|47	|36	|41	|30	|49	|38	|43	|32	|
|NMSLIB	|10	|38	|28	|16	|6	|29	|19	|41	|31	|
|Faiss	|10	|34	|24	|19	|9	|30	|20	|44	|34	|


As demonstrated by our performance benchmarks, enabling concurrent segment search with the default slice count delivers at least a **60% improvement** in vector search service time while requiring only **25--35% more CPU**. This increase in CPU utilization is expected because concurrent segment search runs on more CPU threads---the number of threads is equal to twice the number of CPU cores.

We observed a similar improvement in service time when using multiple concurrent search clients. However, maximum CPU utilization also doubled, as expected, because of the increased number of active search threads running concurrently.


## Conclusion

Our experiments clearly show that enabling concurrent segment search with the default slice count improves vector search query performance, albeit at the cost of higher CPU utilization. We recommend testing your workload to determine whether the additional parallelization achieved by increasing the slice count outweighs the additional processing overhead.

Before running concurrent segment search, we recommend force-merging segments into a single segment to achieve better performance. The major disadvantage of this approach is that the time required for force-merging increases as segments grow larger. Thus, we recommend reducing the number of segments in accordance with your use case. 

By combining vector search with concurrent segment search, you can improve query performance and optimize search operations. To get started with concurrent segment search, explore the [documentation](https://opensearch.org/docs/latest/search-plugins/concurrent-segment-search/).