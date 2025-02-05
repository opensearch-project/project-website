---
layout: post
title:  "Reduce costs with disk-based vector search"
authors:
   - jmazane
   - vikash
   - vamshin
   - kolchfa
date: 2025-02-03
categories:
  - technical-posts
meta_keywords: TBD
meta_description: Learn how to reduce your OpenSearch costs for vector search using the new disk-based vector search.
---

With the advent of powerful natural language embedding models, vector search has become a very hot topic in the field of information retrieval. Embedding models work by mapping some form of domain-specific data into a vector space with the goal of mapping similar pieces of data close to each other in the vector space. On search, the query data is then embedded into the vector space and a nearest neighbor search is used to find the most similar items based on a distance calculation. 

Vectors can be thought of as arrays of a fixed dimension of some kind of numeric type (float, byte, or bit). The shape of the vector and the function to compare vectors is determined by the model that produces the embedding. 

As an example, with [Cohere’s v3 multi-lingual embedding model](https://cohere.com/blog/introducing-embed-v3), you can pass a chunk of text as input, and then the model returns a 1024-dimensional vector of 32-bit floating point numbers that represent the text in the vector space, as shown in the following image. 

![Vector layout](/assets/media/blog-images/2025-02-03-Reduce-Cost-with-Disk-based-Vector-Search/vector-layout.png){:class="img-centered"}

In order to determine similarity, the "distance" is computed between vectors using a function like the dot product or the euclidean metric. The distance function to use is typically determined by the model that produces the embeddings. Vector search excels at understanding the implicit meaning of the data, which can lead to producing more accurate results. On top of this, Vector search can be combined with traditional text based search in order to get the best of both worlds and improve search quality even more!

## The memory footprint of vector search

Vector-based indexes can be very large. For example, 1 billion of 768-dimensional floating point embeddings will consume `1000^3 * 768 * 4 ~= 2861 GB` of storage. This cost further increases when replicas are enabled and additional metadata is added to the index. Traditionally, because of the random access pattern over the index vectors, many efficient nearest-neighbor algorithms require that the vectors be fully resident in memory in order to provide fast search. This memory footprint can lead to high costs as the number of vectors scales, as shown in the following image.

![Number of vectors compared to memory requirement](/assets/media/blog-images/2025-02-03-Reduce-Cost-with-Disk-based-Vector-Search/vector-v-mem-footprint.png){:class="img-centered"}

To reduce the memory footprint of vector indexes, vector quantization techniques are typically employed. From a high level, quantization will compress vectors into smaller representations, while trying to minimize the amount of information lost. For example, with [fp16 quantization](https://opensearch.org/blog/optimizing-opensearch-with-fp16-quantization/), 32-bit floats are represented as 16-bit floats, cutting the memory for the vectors in half. Because many datasets do not require the full 32-bit space, we commonly see that no accuracy is lost!

In addition to fp16, quantization can be used to compress vectors even further, with compression factors of 4x, 8x, 16x, 32x, and beyond! Further reducing the memory consumption provides even higher cost savings!

However, as most of us computer scientists know, there’s typically no free lunch, and quantization is no exception. The more information you lose, the worse the approximation of the nearest neighbor search becomes. But, it turns out, with improvements in secondary storage, we can trade some search latency to get accurate nearest neighbor search in a low memory environment!

## Disk-based vector search in OpenSearch

In 2.17, we introduced an `on_disk` mode for `knn_vector` fields that allows users to run disk-based vector search in OpenSearch. With this feature, users can run nearest neighbor search in much lower memory environments. In order to accomplish this, we take a two-phased query approach, shown in the following diagram. First, on ingestion, we build indexes utilizing configurable quantization mechanisms and store the full-precision vectors on disk. The quantized indexes reside fully in memory during search — but, because the vectors are quantized, they take up a lot less memory! On search, we query the quantized indexes to produce greater than k results. Next, we lazily load the full-precision vectors of these results into memory and recompute the distance to the query. This reorders the set of results, and, from here we return only the top K results. Empirically, this two-phased approach has demonstrated the ability to produce [high-recall results](https://github.com/opensearch-project/k-NN/issues/1779#user-content-appendix-b-baseline-rescore-experiments) on a wide variety of quantization techniques.

![High-level architecture](/assets/media/blog-images/2025-02-03-Reduce-Cost-with-Disk-based-Vector-Search/hla.png){:class="img-centered"}

### Introducing online binary quantization 

As part of this feature, we also extended our quantization support. Previously, the only way to get >= 8x compression in OpenSearch was to use Product Quantization. Product Quantization can be powerful, but requires a training step that needs to be run before ingestion can begin. In addition to this, it also requires the user to manage their models. **In 2.17, we introduced several new online quantization techniques for 8x, 16x and 32 compression — no need to pretrain a model — just start ingesting.** This makes getting started very easy! Check out this tech deep dive to see how we did this.

Consider the following 8-dimensional vectors of 32-bit floating point numbers: 

```
v1 = [0.56, 0.85, 0.53, 0.25, 0.46, 0.01, 0.63, 0.73]
v2 = [-0.99, -0.79, 0.23, -0.62, 0.87, -0.06, -0.24, -0.75]
v3 = [-0.15, 0.17, 0.10, 0.46, -0.79, -0.31, 0.36, -1.00]
```

In order to quantize them, we perform the following steps

#### 1. Calculate mean per dimension

The mean for each dimension j is calculated using the following formula:

![Mean Formula](/assets/media/blog-images/2025-02-03-Reduce-Cost-with-Disk-based-Vector-Search/mean.png){:class="img-centered"}

For our set of vectors above, this gives the following:

```
Mean = [-0.19, 0.08, 0.29, 0.03, 0.18, -0.12, 0.25, -0.34]
```

#### 2. Quantization rule

The quantization rule for each dimension j of a vector is given by:

![Quantization Formula](/assets/media/blog-images/2025-02-03-Reduce-Cost-with-Disk-based-Vector-Search/quantization.png){:class="img-centered"}

#### 3. Quantization of a new vector

Consider a new vector:

```
v_new = [0.45, -0.30, 0.67, 0.12, 0.25, -0.50, 0.80, 0.55]
```

![Quantization Example](/assets/media/blog-images/2025-02-03-Reduce-Cost-with-Disk-based-Vector-Search/quantization-example.png){:class="img-centered"}

## Getting started

Getting setup with disk-based vector search in OpenSearch is very simple! In the mapping, all you have to do is specify `mode=on_disk`! The mode parameter will automatically select a low memory configuration with re-scoring enabled:

```json
PUT my-vector-index
{
  "settings" : {
    "index.knn": true
  },
  "mappings": {
    "properties": {
      "my_vector_field": {
        "type": "knn_vector",
        "dimension": 8,
        "space_type": "innerproduct",
        "mode": "on_disk"
      }
    }
  }
}
```

In order to tune the quantization, you can specify the `compression_level` in the mapping. By default for `on_disk` mode, it is 32x:

```json
PUT my-vector-index
{
  "settings" : {
    "index.knn": true
  },
  "mappings": {
    "properties": {
      "my_vector_field": {
        "type": "knn_vector",
        "dimension": 8,
        "space_type": "innerproduct",
        "mode": "on_disk",
        "compression_level": "16x"
      }
    }
  }
}
```

On search, if mode=on_disk, the two-phased search will automatically be applied:

```json
GET my-vector-index/_search
{
  "query": {
    "knn": {
      "my_vector_field": {
        "vector": [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5],
        "k": 5
      }
    }
  }
}
```

With `on_disk` mode, OpenSearch will configure an oversample factor so that more than k results are returned from the quantized index search. This can be overridden by specifying the `oversample_factor` in the query body:

```json
GET my-vector-index/_search
{
  "query": {
    "knn": {
      "my_vector_field": {
        "vector": [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5],
        "k": 5,
        "rescore": {
            "oversample_factor": 10.0
        }
      }
    }
  }
}
```

For more information, see https://opensearch.org/docs/latest/search-plugins/knn/disk-based-vector-search/. 

## Experiments

### One million vector tests

We ran several different tests on a [single node OpenSearch cluster](https://github.com/jmazanec15/opensearch-knn-single-node-experiments) for datasets between 1 and 10 million vectors.

| Name              | *Space type* | Normalized | Dimension | Index vector count | Notes                                                                                                                                       |
|-------------------|--------------|----------------|-----------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `sift`              | `l2`           | No             | 128       | 1,000,000          | Classic sift image descriptor dataset                                                                                                       |
| `minillm-msmarco `  | `l2`           | Yes            | 384       | 1,000,000          | Used `minillm` to encode a sample of `ms-marco`. See https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2                              |
| `mpnet-msmarco`     | `l2`           | Yes            | 768       | 1,000,000          | Used `mpnet` to encode a sample of `ms-marco`. See https://huggingface.co/sentence-transformers/all-mpnet-base-v2                               |
| `mxbai-msmarco`     | `cosine`       | Yes            | 1024      | 1,000,000          | Used `mxbai` to encode a sample of `ms-marco`. See https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1                                    |
| `tasb-msmarco`      | `ip`           | No             | 768       | 1,000,000          | Used `tasb` to encode a sample of `ms-marco`. See https://huggingface.co/sentence-transformers/msmarco-distilbert-base-tas-b                    |
| `e5small-msmarco`   | `l2`           | Yes            | 384       | 8,841,823          | Used the `e5small` model to encode a larger sample of `ms-marco`. See https://huggingface.co/intfloat/e5-small                                  |
| `sNowflake-msmarco` | `l2`           | Yes            | 768       | 8,841,823          | Used the `snowflake-arctic-embed-m` model to encode a larger sample of `ms-marco`. See https://huggingface.co/Snowflake/snowflake-arctic-embed-m |
| `clip-flickr`       | `l2`           | No             | 512       | 6,637,685          | Used the `clip` model to encode a random sample of images from Flickr                                                                         |

We ran the experiments with `in_memory` mode and `on_disk` mode and 16x and 32x compression levels. `on_disk` mode will have a re-scoring stage and `in_memory` will not.  For `in_memory` mode, we used r6g.4xlarge AWS EC2 instance types and for `on_disk` mode, we used r6gd.4xlarge types with an SSD attached to the instance (as opposed to EBS storage type). Using Docker, we controlled the amount of memory and cpu’s OpenSearch had access to. 

We obtained the following results, comparing recall to compression level:

![Million Vector Results](/assets/media/blog-images/2025-02-03-Reduce-Cost-with-Disk-based-Vector-Search/mill-results.png){:class="img-centered"}

We can see that the combination of binary quantization and full precision re-scoring can drastically improve the recall while still maintaining competitive latencies in lower memory regimes. For some data sets, like sift, it can help but recall is somewhat low. So, it is dataset dependent and it is important to test with your dataset.

### Large-scale tests

In addition to the smaller scale tests, we also ran a test on a larger dataset, [MS Marco 2.1 encoded with the Cohere v3 model](https://huggingface.co/datasets/Cohere/msmarco-v2.1-embed-english-v3). We set up several different tests to showcase how this disk-based vector search compares to `in_memory` vector search at 8x, 16x, and 32x compression levels. Here is the overall configuration

|            |                                                                          |
|------------|--------------------------------------------------------------------------|
| Name       | Cohere v3 encoding of MS Marco v2.1                                       |
| Dimension  | 1024                                                                     |
| Normalized      | Yes                                                                      |
| Space type | Cosine (inner product over normalized data)                              |
| Index vectors | 113M                                                                     |
| Notes   | See https://huggingface.co/datasets/Cohere/msmarco-v2.1-embed-english-v3 |

We chose four different cluster configurations to test against and used [opensearch-cluster-cdk](https://github.com/opensearch-project/opensearch-cluster-cdk) and OpenSearch 2.18 to provision the clusters. In general, we chose the cluster and index configuration to follow production recommendations. For instance, we configured replica shards and dedicated cluster manager nodes. In addition, we targeted the shard count to have between 2 and 3 vCPUs per shard.

| Name        | Data node count | Data node type | Data node disk size | Data node disk type | JVM size | Primary shard count | Replica shards | Compression level |
|-------------|-----------------|----------------|---------------------|---------------------|----------|---------------------|----------------|-------------------|
| `in_memory`   | 8               | r6g.8xlarge    | 300                 | EBS                 | 32       | 40                  | 1              | 1x                |
| `on_disk_8x`  | 10              | r6gd.2xlarge   | 474                 | Instance            | 32       | 15                  | 1              | 8x                |
| `on_disk_16x` | 6               | r6gd.2xlarge   | 474                 | Instance            | 32  9    | 1                   | 16x            |
| `on_disk_32x` | 4               | r6gd.2xlarge   | 474                 | Instance            | 32  6    | 1                   | 32x            |

From then above table, you can see that the higher level of compression clusters use substantially less resources than the non-compressed.

In order to run the tests, we also made a few other optimizations to tune performance:

1. Retrieved ids from doc values in order to reduce fetch time
2. Disabled source storage 

The test procedure was fairly simple. All tests were executed with OSB. See the [vector search workloads](https://github.com/opensearch-project/opensearch-benchmark-workloads/tree/main/vectorsearch) for more details. We did the following:

1. Ingest the dataset
2. Force merged to 5 segments per shard
3. Warmed the index up
4. Ran the Single-client latency test
5. Ran the Multi-client throughput tests
6. Repeated 4 and 5 with disk-based re-score setting disabled to show what the results would be without re-scoring, effectively searching over a compressed index without re-scoring.

#### Results

From these experiments, we obtained the following results.

| Metric/Configuration              | `in-memory` | `on_disk_8x` | `in_memory_8x` | `on_disk_16x` | `in_memory_16x` | `on_disk_32x` | `in_memory_32x` |
|-----------------------------------|-----------|------------|--------------|-------------|---------------|-------------|---------------|
| recall@100 (ratio)                | 0.95      | 0.98       | 0.98         | 0.97        | 0.96          | 0.94        | 0.95          |
| 1-client p90 search latency (ms)  | 24.02     | 96.31      | 28.90        | 108.05      | 29.79         | 104.421     | 47.2906       |
| 1-client mean t/p (qps)           | 40.64     | 11.03      | 42.33        | 10.06       | 43.95         | 10.65       | 31.83         |
| 4-client p90 search latency (ms)  | 25.82     | 97.19      | 20.40        | 220.19      | 18.09         | 244.52      | 46.13         |
| 4-client mean t/p (qps)           | 162.80    | 45.86      | 204.62       | 25.80       | 193.27        | 25.28       | 146.77        |
| 8-client p90 search latency (ms) | 27.69     | 95.05      | 30.88        | 414.20      | 27.94         | 429.79      | 25.07         |
| 8-client mean t/p (qps)           | 306.70    | 95.22      | 305.86       | 26.34       | 343.95        | 25.75       | 376.60        |

Interestingly, for this dataset, the on-disk recall results (with re-scoring) are very similar to the in-memory recall results (without re-scoring), but in-memory is substantially faster. This is most likely because the cohere v3 model has been optimized to work very well with binary quantized data (see this [blog for details](https://cohere.com/blog/int8-binary-embeddings)).

## Learnings

In general, we can see that the two-phased approach to ANN works well in low-memory environments, and yet is very dataset dependent. In general, we recommend that when running your own experiments, test with the setting `index.knn.disk.vector.shard_level_rescoring_disabled` enabled and disabled to see the benefit that you get. Additionally, with disk-based search, ensure that the secondary storage is optimized for high read traffic — we’ve found that SSD’s in general work the best.

## Whats next?

We have a lot of new and exciting features coming up in OpenSearch for vector search. In future releases, we are going to further improve on improving the quantization performance for all data sets so that fine-tuning does not need to be done. Stay tuned for improvements in performance and functionality! And, as always, checkout our [GitHub repo](https://github.com/opensearch-project/k-NN) to get involved — we always appreciate contributions and feature requests!
