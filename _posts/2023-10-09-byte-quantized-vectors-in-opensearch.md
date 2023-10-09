---
layout: post
title:  "Byte-quantized vectors in OpenSearch"
authors:
  - navtat
  - vamshin
  - macrakis
  - talw
date: 2023-10-09 00:00:00 -0700
categories:
  - technical-posts
meta_keywords: byte-quantized vectors, OpenSearch k-NN plugin, storage and memory optimization using byte vectors
meta_description: Learn how byte vector feature in OpenSearch helps to improve the overall performance with a minimal loss in quality. 
excerpt: In OpenSearch k-NN plugin when we index and query vectors of type float, each vector element occupies 4 bytes. This is getting expensive in terms of memory and storage, especially for large-scale use cases. Starting with the OpenSearch 2.9 release, using the new byte vector feature we can reduce memory and storage requirements, significant reduction in query latencies with a minimal loss in recall.
---

Until now, the OpenSearch k-NN plugin has supported the indexing and querying of vectors of type float, with each vector element occupying 4 bytes. This can be expensive in terms of memory and storage, especially for large-scale use cases. Using the new byte vector feature in [OpenSearch 2.9](https://opensearch.org/blog/introducing-opensearch-2.9.0/), users can reduce memory requirements by a factor of 4 and significantly reduce search latency, with minimal loss in quality (recall).

In this post, we’ll show you how to use byte vectors and how to convert (quantize) 32-bit floats to 8-bit signed integers. We’ll also show you some benchmarking results related to both performance and quality.

## Using byte vectors

With byte vectors, each vector element occupies 1 byte (8 bits) and is treated as a signed integer within the range of -128 to 127. This takes advantage of the support for byte vectors in the underlying `Lucene` engine.

To use a `byte` vector, set the optional `data_type` parameter to `byte` when creating a mapping for an index (the default value of the `data_type`  parameter is `float`):

```json
PUT test-index
{
  "settings": {
    "index": {
      "knn": true,
      "knn.algo_param.ef_search": 100
    }
  },
  "mappings": {
    "properties": {
      "my_vector1": {
        "type": "knn_vector",
        "dimension": 3,
        "data_type": "byte",
        "method": {
          "name": "hnsw",
          "space_type": "l2",
          "engine": "lucene",
          "parameters": {
            "ef_construction": 128,
            "m": 24
          }
        }
      }
    }
  }
}
```

Ingestion remains unchanged, but each value in the vector must be within the supported byte range [-128, 127]; otherwise, OpenSearch will return an error:

```json
PUT test-index/_doc/1
{
  "my_vector1": [-126, 28, 127]
}
```

There is no change in k-NN search. Again, the query vector elements must be within the byte range:

```json
GET test-index/_search
{
  "size": 2,
  "query": {
    "knn": {
      "my_vector1": {
        "vector": [26, -120, 99],
        "k": 2
      }
    }
  }
}
```

## Quantizing float values as bytes

For many applications, existing float vector data can be quantized with little loss in quality.

There are many quantization techniques, such as scalar quantization or product quantization (used in the Faiss engine). The choice of quantization technique depends on the type of data and the k-NN distance metric. It can affect the accuracy of recall, so it is a best practice to run experiments with your own data. Some useful quantization method resources include the following:
* Babak Rokh et al., “A Comprehensive Survey on Model Quantization for Deep Neural Networks in Image Classification”, _ACM Transactions on Intelligent Systems Technology, 2023_ (in press)
* B. Jacob et al., "Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference," 2018 IEEE/CVF Conference on Computer Vision and Pattern Recognition, Salt Lake City, UT, USA, 2018, pp. 2704-2713, doi: 10.1109/CVPR.2018.00286.

The following section contain Python pseudocode demonstrating a scalar quantization technique suitable for data using Euclidean distance. Euclidean distance is shift invariant; that is, if we shift x and y, then the distance remains the same. Mathematically,

_||x-y||=||(x-z)-(y-z)||_.

### Scalar quantization technique for the L2 space type

```python
import numpy as np
# Random dataset (Example to create a random dataset)
dataset = np.random.uniform(-300, 300, (100, 10))
# Random query set (Example to create a random queryset)
queryset = np.random.uniform(-350, 350, (100, 10))
# Number of values
B = 256

# INDEXING:
# Get min and max
dataset_min = np.min(dataset)
dataset_max = np.max(dataset)
# Shift coordinates to be non-negative
dataset -= dataset_min
# Normalize into [0,1]
dataset *= 1. / (dataset_max - dataset_min)
# Bucket into 256 values
dataset = np.floor(dataset * (B-1)) - int(B / 2)

# QUERYING:
# Clip (if queryset range is out of datset range)
queryset = queryset.clip(dataset_min, dataset_max)
# Shift coordinates to be non-negative
queryset -= dataset_min
# Normalize
queryset *= 1. / (dataset_max - dataset_min)
# Bucket into 256 values
queryset = np.floor(queryset * (B - 1)) - int(B / 2)
```

### Scalar quantization technique for the cosinesimilarity space type

Angular datasets using cosine similarity need a different approach because cosine similarity is not shift invariant.

```python
# For Positive Numbers

# INDEXING and QUERYING:

# Get Max of train dataset
max = np.max(dataset)
min = 0
B = 127

# Normalize into [0,1]
val = (val - min) / (max - min)
val = (val * B)

# Get int and fraction values
int_part = floor(val)
frac_part = val - int_part

if 0.5 < frac_part:
 bval = int_part + 1
else:
 bval = int_part

return Byte(bval)
```

```python
# For Negative Numbers

# INDEXING and QUERYING:

# Get Min of train dataset
min = 0
max = -np.min(dataset)
B = 128

# Normalize into [0,1]
val = (val - min) / (max - min)
val = (val * B)

# Get int and fraction values
int_part = floor(var)
frac_part = val - int_part

if 0.5 < frac_part:
 bval = int_part + 1
else:
 bval = int_part

return Byte(bval)
```

These are just two simple examples. You will want to evaluate different techniques with your own data to evaluate recall.

## Benchmarking results

We ran benchmarking tests on some popular [datasets](https://github.com/erikbern/ann-benchmarks#data-sets) using our 
[k-NN benchmarking perf-tool](https://github.com/opensearch-project/k-NN/tree/main/benchmarks/perf-tool) to compare the quality 
and performance of byte vectors against float vectors. All the tests were run on the r5.large instance type, which has 2 CPU cores and 16 GB of memory.

_SIFT_ is a feature extraction method that reduces the image content to a set of points used to detect similar patterns in other images. This algorithm 
is usually related to computer vision applications, including image matching and object detection. A _GIST_ descriptor is a compact representation of an image, 
which offers advantages such as dimensionality reduction and compatibility with machine learning techniques, making it a valuable choice for approximate 
nearest neighbor (ANN) tasks in computer vision.

The _MNIST_ dataset is widely used in the field of machine learning and computer vision; it consists of a collection of handwritten digits from 0 to 9 
represented as grayscale images of size 28x28 pixels and is a subset of a larger dataset collected by NIST. The _GloVe_ dataset consists of pretrained word 
vectors generated using the GloVe algorithm. GloVe is an unsupervised learning algorithm used to learn dense vector representations or embeddings for words 
in a large corpus of text. 

### Recall and storage results

* **Recall@100** – This is the ratio of the top 100 results that were ground truth nearest neighbors. This metric helps you to understand whether you are using a good quantization technique for the dataset.

<table>
    <tr>
        <td colspan="1"><b>Dataset</b></td>
        <td colspan="1"><b>Dimension of vector</b></td>
        <td colspan="1"><b>Data size</b></td>
        <td colspan="1"><b>Number of queries</b></td>
        <td colspan="1"><b>Training data range</b></td>
        <td colspan="1"><b>Query data range</b></td>
        <td colspan="1"><b>Space type</b></td>
        <td colspan="2"><b>Recall@100</b></td>
        <td colspan="2"><b>Index size (GB)</b></td>
        <td colspan="1"><b>% change in storage</b></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td><b>float</b></td>
        <td><b>byte</b></td>
        <td><b>float</b></td>
        <td><b>byte</b></td>
        <td></td>
    </tr>
    <tr>
        <td><b>gist-960-euclidean</b></td>
        <td>960</td>
        <td>1,000,000</td>
        <td>1,000</td>
        <td>[ 0.0, 1.48 ]</td>
        <td>[ 0.0, 0.729 ]</td>
        <td>L2</td>
        <td>0.99</td>
        <td>0.96</td>
        <td>16.5</td>
        <td>4.2</td>
        <td>75%</td>
    </tr>
    <tr>
        <td><b>sift-128-euclidean</b></td>
        <td>128</td>
        <td>1,000,000</td>
        <td>10,000</td>
        <td>[ 0.0, 218.0 ]</td>
        <td>[ 0.0, 184.0 ]</td>
        <td>L2</td>
        <td>0.99</td>
        <td>0.99</td>
        <td>1.3</td>
        <td>0.63</td>
        <td>52%</td>
    </tr>
    <tr>
        <td><b>mnist-784-euclidean</b></td>
        <td>784</td>
        <td>60,000</td>
        <td>10,000</td>
        <td>[ 0.0, 255.0 ]</td>
        <td>[ 0.0, 255.0 ]</td>
        <td>L2</td>
        <td>0.99</td>
        <td>0.99</td>
        <td>0.38</td>
        <td>0.12</td>
        <td>68%</td>
    </tr>
    <tr>
        <td><b>glove-50-angular</b></td>
        <td>50</td>
        <td>1,183,514</td>
        <td>10,000</td>
        <td>[ -6.97, 6.51 ]</td>
        <td>[ -6.25, 5.85 ]</td>
        <td>cosine</td>
        <td>0.99</td>
        <td>0.94</td>
        <td>1.3</td>
        <td>0.35</td>
        <td>73%</td>
    </tr>
    <tr>
        <td><b>glove-100-angular</b></td>
        <td>100</td>
        <td>1,183,514</td>
        <td>10,000</td>
        <td>[ -6.53, 5.96 ]</td>
        <td>[ -6.15, 4.22 ]</td>
        <td>cosine</td>
        <td>0.99</td>
        <td>0.92</td>
        <td>2.6</td>
        <td>0.62</td>
        <td>76%</td>
    </tr>
    <tr>
        <td><b>glove-200-angular</b></td>
        <td>200</td>
        <td>1,183,514</td>
        <td>10,000</td>
        <td>[ -6.80, 4.61 ]</td>
        <td>[ -6.64, 2.72 ]</td>
        <td>cosine</td>
        <td>0.99</td>
        <td>0.77</td>
        <td>5.1</td>
        <td>1.1</td>
        <td>78%</td>
    </tr>
</table>

### Indexing and querying results

* **Indexing throughput (docs/s)** – The number of documents per second that can be ingested.

```
Document_Cnt / (total_index_time_s + total_refresh_time_s)
Document_Cnt/ (( ingest_took_total)_s + (refresh_index_took_total)_s)
```

* **Query time (ms)** – Time per query, summarized as mean, p50, p90, p99.

<table>
    <tr>
        <td colspan="1"><b>Dataset</b></td>
        <td colspan="1"><b>Dimension of vector</b></td>
        <td colspan="1"><b>Space type</b></td>
        <td colspan="2"><b>Indexing throughput (docs/sec)</b></td>
        <td colspan="2"><b>Query time p50 (ms)</b></td>
        <td colspan="1"><b>% change in p50 latency</b></td>
        <td colspan="2"><b>Query time p90 (ms)</b></td>
        <td colspan="1"><b>% change in p90 latency</b></td>
        <td colspan="2"><b>Query time p99 (ms)</b></td>
        <td colspan="1"><b>% change in p99 latency</b></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
        <td><b>float</b></td>
        <td><b>byte</b></td>
        <td><b>float</b></td>
        <td><b>byte</b></td>
        <td></td>
        <td><b>float</b></td>
        <td><b>byte</b></td>
        <td></td>
        <td><b>float</b></td>
        <td><b>byte</b></td>
        <td></td>
    </tr>
    <tr>
        <td><b>gist-960-euclidean</b></td>
        <td>960</td>
        <td>L2</td>
        <td>269</td>
        <td>639</td>
        <td>711</td>
        <td>571</td>
        <td>20%</td>
        <td>1483</td>
        <td>625</td>
        <td>58%</td>
        <td>2047</td>
        <td>697</td>
        <td>66%</td>
    </tr>
    <tr>
        <td><b>sift-128-euclidean</b></td>
        <td>128</td>
        <td>L2</td>
        <td>2422</td>
        <td>2164</td>
        <td>112</td>
        <td>67</td>
        <td>40%</td>
        <td>125</td>
        <td>75</td>
        <td>40%</td>
        <td>150</td>
        <td>96</td>
        <td>36%</td>
    </tr>
    <tr>
        <td><b>mnist-784-euclidean</b></td>
        <td>784</td>
        <td>L2</td>
        <td>845</td>
        <td>935</td>
        <td>97</td>
        <td>64</td>
        <td>34%</td>
        <td>105</td>
        <td>69</td>
        <td>34%</td>
        <td>116</td>
        <td>78</td>
        <td>32%</td>
    </tr>
    <tr>
        <td><b>glove-50-angular</b></td>
        <td>50</td>
        <td>cosine</td>
        <td>1391</td>
        <td>1566</td>
        <td>158</td>
        <td>89</td>
        <td>44%</td>
        <td>173</td>
        <td>96</td>
        <td>44%</td>
        <td>205</td>
        <td>119</td>
        <td>42%</td>
    </tr>
    <tr>
        <td><b>glove-100-angular</b></td>
        <td>100</td>
        <td>cosine</td>
        <td>1014</td>
        <td>1074</td>
        <td>252</td>
        <td>143</td>
        <td>43%</td>
        <td>291</td>
        <td>154</td>
        <td>47%</td>
        <td>324</td>
        <td>179</td>
        <td>45%</td>
    </tr>
<tr>
        <td><b>glove-200-angular</b></td>
        <td>200</td>
        <td>cosine</td>
        <td>640</td>
        <td>684</td>
        <td>597</td>
        <td>260</td>
        <td>56%</td>
        <td>644</td>
        <td>279</td>
        <td>57%</td>
        <td>726</td>
        <td>316</td>
        <td>57%</td>
    </tr>
</table>

### RSS results

* **Peak RSS** – The peak of the resident set size obtained by the aggregated sum of RSSAnon (size of resident anonymous memory) and RSSFile (size of resident file mappings).

<table>
    <tr>
        <td colspan="1"><b>Dataset</b></td>
        <td colspan="1"><b>Dimension of vector</b></td>
        <td colspan="1"><b>Space type</b></td>
        <td colspan="2"><b>Peak RSS (GB)</b></td>
        <td colspan="1"><b>% change in memory</b></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
        <td><b>float</b></td>
        <td><b>byte</b></td>
        <td></td>
    </tr>
    <tr>
        <td><b>gist-960-euclidean</b></td>
        <td>960</td>
        <td>L2</td>
        <td>6.71</td>
        <td>4.47</td>
        <td>33%</td>
    </tr>
    <tr>
        <td><b>sift-128-euclidean</b></td>
        <td>128</td>
        <td>L2</td>
        <td>2.19</td>
        <td>1.86</td>
        <td>15%</td>
    </tr>
    <tr>
        <td><b>mnist-784-euclidean</b></td>
        <td>784</td>
        <td>L2</td>
        <td>1.55</td>
        <td>1.42</td>
        <td>8%</td>
    </tr>
    <tr>
        <td><b>glove-50-angular</b></td>
        <td>50</td>
        <td>cosine</td>
        <td>2.44</td>
        <td>1.65</td>
        <td>33%</td>
    </tr>
    <tr>
        <td><b>glove-100-angular</b></td>
        <td>100</td>
        <td>cosine</td>
        <td>3.47</td>
        <td>1.86</td>
        <td>47%</td>
    </tr>
    <tr>
        <td><b>glove-200-angular</b></td>
        <td>200</td>
        <td>cosine</td>
        <td>5.6</td>
        <td>2.27</td>
        <td>59%</td>
    </tr>
</table>

### RSS comparison graphs (in KB)

![RSS Comparison for gist-960-euclidean dataset](/assets/media/blog-images/2023-10-10-byte-quantized-vectors-in-opensearch/rss-comparison-for-gist-960-euclidean-dataset.png){: .img-fluid}

![RSS Comparison for sift-128-euclidean dataset](/assets/media/blog-images/2023-10-10-byte-quantized-vectors-in-opensearch/rss-comparison-for-sift-128-euclidean-dataset.png){: .img-fluid}

![RSS Comparison for mnist-784-euclidean dataset](/assets/media/blog-images/2023-10-10-byte-quantized-vectors-in-opensearch/rss-comparison-for-mnist-784-euclidean-dataset.png){: .img-fluid}

![RSS Comparison for glove-50-angular dataset](/assets/media/blog-images/2023-10-10-byte-quantized-vectors-in-opensearch/rss-comparison-for-glove-50-angular-dataset.png){: .img-fluid}

![RSS Comparison for glove-100-angular dataset](/assets/media/blog-images/2023-10-10-byte-quantized-vectors-in-opensearch/rss-comparison-for-glove-100-angular-dataset.png){: .img-fluid}

![RSS Comparison for glove-200-angular dataset](/assets/media/blog-images/2023-10-10-byte-quantized-vectors-in-opensearch/rss-comparison-for-glove-200-angular-dataset.png){: .img-fluid}

### Analysis

Comparing the benchmarking results, you can see that:

* Using byte vectors rather than 32-bit floats results in a significant reduction in storage and memory usage while also improving indexing throughput and reducing query latency. Precision and recall were not greatly affected, although this will depend on the quantization technique and characteristics of your data.
* Storage usage was reduced by up to **78%**, and RAM usage was reduced by up to **59%** (for the glove-200-angular dataset).
* Recall values for angular datasets were lower than those of Euclidean datasets. We expect that better quantization techniques would improve recall.

## References

*  Hervé Jégou, Matthijs Douze, Cordelia Schmid. Product Quantization for Nearest Neighbor Search. IEEE Transactions on Pattern Analysis and Machine Intelligence, 2011, 33 (1), pp.117-128.
   10.1109/TPAMI.2010.57 . inria-00514462v2
* Y. LeCun, L. Bottou, Y. Bengio, and P. Haffner. "Gradient-based learning applied to document recognition." Proceedings of the IEEE, 86(11):2278-2324, November 1998
* Jeffrey Pennington, Richard Socher, and Christopher D. Manning. 2014. [GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf)


