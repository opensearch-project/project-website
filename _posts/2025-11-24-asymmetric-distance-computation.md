---
layout: post
title:  "Asymmetric distance computation for binary quantization"
authors:
 - ynaamad
 - finnrobl
 - tal
date: 2025-11-24
categories:
 - technical-posts
meta_keywords: asymmetric distance computation, ADC, binary quantization, vector search, memory compression, k-NN search, OpenSearch
meta_description: Learn how asymmetric distance computation (ADC) in OpenSearch achieves 32-fold memory compression for vector search while maintaining better recall than traditional binary quantization methods.
excerpt: Modern RAG setups require searching large vector datasets, but memory constraints can be cost prohibitive. Standard binary quantization approaches for index compression offer a 32-fold memory savings but decrease recall. This post explores asymmetric distance computation (ADC), a technique that maintains uncompressed queries while searching compressed indexes, achieving significant memory savings with better recall than traditional binary quantization.
has_math: true
has_science_table: false
---

Modern-day retrieval-augmented generation (RAG) setups typically involve searching large vector datasets for the k-nearest neighbors of very-high-dimensional query vectors. When these datasets grow too large, storing all vectors in memory can be prohibitively expensive. The total memory used for storing the vectors is 

$$\textrm{total_bits} = \textrm{num_documents} \times \textrm{data_dimensionality} \times \textrm{bits_per_dimension},$$

which depends linearly on the number of bits used to encode each vector’s value in each dimension. When it is difficult or insufficient to safely reduce the number of documents or their dimensionality, one popular approach to reducing memory footprint (and thereby increasing affordability) is to reduce the representation of each vector from the standard `float32` representation into fewer than 32 bits.

The most direct compression strategy, *scalar quantization*, achieves compression by using alternative floating-point representations. Switching to a `float16` representation, for example, can lead to a 50% savings in memory utilization (that is, a twofold data compression). While this may be enough in some cases, other situations might require higher compression to fit the dataset in RAM. The most extreme scalar quantization approach, *binary quantization*, reduces every float to a single bit, resulting in a 32-fold compression, and simplifies the memory formula to 

$$\textrm{total_bits} = \textrm{num_documents} \times \textrm{data_dimensionality}.$$

To illustrate the magnitude of the savings, a dataset of 100 million different 768-dimensional vectors requires over 300 GB of system memory when using `float32` vectors, while its binary-quantized counterpart fits comfortably in under 10 GB.

Unsurprisingly, these memory savings come with one major downside: recall degradation. The more you compress these vectors, the more difficult it becomes to estimate the distances between their ground-truth representations. This, in turn, makes it more difficult to identify the true k-nearest neighbors for a given query. While some of this downside is fundamentally unavoidable, various techniques have been discovered to help minimize the negative impact of data compression. In this blog post, we primarily focus on one such approach, *asymmetric distance computation (ADC)*, in which you can search through compressed indexes using uncompressed queries to attain 32-fold compression with improved recall compared to traditional binary quantization.

## How binary quantization works

With just one bit to encode each dimension, a binary-quantized vector can only assign one of two values to each dimension, typically interpreted as ±1. To quantize using binary quantization, the simplest method is to take the element-wise sign of the original vectors: negative values get mapped to -1 (encoded as `0` in binary), and positive values to +1 (encoded as `1`). 

In practice, it is usually better to first *mean-center* the vectors, that is, shift the dataset toward the origin by subtracting the dataset (per-coordinate) mean. Quantization is then applied to these shifted vectors rather than the original. This helps preserve information about the original vectors, especially in datasets where some (or all!) coordinates may take the same sign. For example, every vector in the SIFT dataset has only non-negative values. Without mean-centering, all points would be binary-encoded to the all-ones vector. With mean-centering, the data would be represented using a wider variety of binary representations. 

The shift-and-quantize process is outlined in the following figure.

![Mean-Centering](/assets/media/blog-images/2025-11-24-asymmetric-distance-computation/Mean-Centering.png){:class="img-centered"}

*Figure: To compute the binary quantization of a document corpus, we first mean-center the data so that the average document vector rests at the origin and then convert each coordinate to a ±1 value, depending on its sign.*

While two dimensions only allow for four possible quantizations (and thus many vectors necessarily get quantized to the same value), in higher *d*-dimensional spaces the number of binary quantizations typically vastly exceeds the size of the corpus. Therefore, typical high-dimensional datasets tend to have a relatively small number of collisions. For each document, we store its full-precision vector on disk and only the binary-quantized vector in RAM. 

Now that we understand how binary quantization works, let's examine two different methods of performing k-NN search using these compressed vectors: **[symmetric distance computation (SDC)](#symmetric-distance-computation)** and **[asymmetric distance computation (ADC)](#asymmetric-distance-computation)**.

### Symmetric distance computation

The classical way to perform a k-NN search on a binary-quantized index begins by quantizing the query vector using the exact same procedure described previously. Quantizing the query vectors both ensures that they have the same scale and data type as the quantized dataset stored in RAM and greatly simplifies the process of evaluating the distance between the query and document vectors. 

As an illustrative example, let's compute the squared Euclidean distance between two 4-dimensional vectors, $$\vec{v}_1 = \left(+1,-1,+1,-1\right)$$ and $$\vec{v}_2 = \left(-1,-1,+1,+1\right)$$. Computed the classical way, this operation involves 11 total operations: 4 subtraction, 4 squaring, and 3 addition operations.

$$
\begin{align*}
\|\vec{v}_1 - \vec{v}_2\|_2^2 &= (+1 - (-1))^2 + ((-1) - (-1))^2 + ((+1) - (+1))^2 + ((-1) - (+1))^2 \\
&= 2^2 + 0^2 + 0^2 + (-2)^2 \\
&= 4 + 0 + 0 + 4 \\
&= 8
\end{align*}
$$

However, this calculation can also be expressed another way. The squared Euclidean distance is exactly 4 times the number of coordinates in which $$\vec{v}_1$$ differs from $$\vec{v}_2$$, also known as their *Hamming distance*. Thus, we can equivalently compute the squared Euclidean distance between $$\vec{v}_1$$ and $$\vec{v}_2$$ as four times the number of coordinates in which their binary representations differ. 

Because modern processors can perform `xor` (answering "where do these bit strings differ?") and `popcount` (answering "how many 1s are in this bit string?") operations on full 64-bit words at a time (or more, with SIMD extensions), binary quantization can compute the contribution from many dimensions in parallel, thus reducing the complexity of distance calculation by a similarly large factor.

The downside of SDC is in its impact on *recall*---the fraction of ground-truth k-nearest neighbors returned by the search algorithm. After all, we cannot expect to always identify the nearest vectors when all vectors are so thoroughly distorted in all dimensions simultaneously. 

![SDC-Distortion](/assets/media/blog-images/2025-11-24-asymmetric-distance-computation/SDC-Distortion.png){:class="img-centered"}

*Figure: The post-centering query vector (orange square) originally is located much closer to the blue document vector than the purple one. However, after symmetric quantization maps all vectors to just ±1 in each coordinate, this information is lost and the orange query vector appears equidistant from each of the corresponding quantized document vectors.*

In the next section, we describe how this weakness is addressed using ADC.

### Asymmetric distance computation

Considering SDC, notice that the algorithm introduced errors into the distance calculations at two distinct points in the process. First, document vectors in the corpus are quantized to achieve the 32-fold memory savings that binary quantization provides. Second, the query vector is also quantized to match the scale and data type of the quantized documents. 

However, this second quantization does nothing to meaningfully reduce the memory consumption of k-NN search. Even in extremely high-dimensional datasets, the footprint of the unquantized query is typically only on the order of a few kilobytes. In ADC, recall is improved by preserving the query vector in its original, un-quantized form while still comparing it against binary-quantized document vectors. This asymmetry, keeping one vector in high precision while the other remains binary, allows us to retain more information about the original distance relationships.

The key difficulty that ADC overcomes is that binary quantization treats all values in a dimension identically as long as they have the same sign after mean-centering. This is despite potentially significant differences in their original magnitudes. For example, after mean-centering, both a large positive value of +0.6 and a small positive value of +0.1 would be quantized to +1, even though they represent very different original values. Conversely, the otherwise extremely close -0.1 and +0.1 get quantized to opposite values despite being nearly identical in the original space. 

ADC addresses this limitation by scaling the query vector to match the document vectors while still keeping it in its full-precision form. By comparing the rescaled query---rather than the quantized query---directly against binary document vectors, subtle variations in the original query vector are better captured that would otherwise be lost if the query was quantized as well.

![ADC-Query](/assets/media/blog-images/2025-11-24-asymmetric-distance-computation/ADC-Main.png){:class="img-centered"}

*Figure: For ADC, the document vectors are quantized identically to SDC. However, the query vector is kept in full FP32 precision and does not have to be quantized to a ±1 value.*

#### Rescaling for ADC

Even though we maintain the query vector in its original precision, we still need to ensure that it operates on the same scale as our quantized document vectors. Recall that binary quantization essentially maps all values to ±1 regardless of the initial magnitude of each dimension, thereby inducing an implicit rescaling of the data. For our distance calculations to be meaningful, the query vector must also be recentered using the same dataset means that were used during document quantization and rescaled to match the scale of binary quantization.

The following figure shows an example where failing to rescale leads to ADC finding the wrong nearest neighbors. Even when the nearest neighbor documents are close in the original space (the red points in the top-left quadrant), after quantization they might appear further away than does a faraway point (the blue point in the top-right quadrant). By rescaling, we look to reposition the full-precision query vector so that relative closeness is preserved as well as possible.

![ADC-Rescaling-Importance](/assets/media/blog-images/2025-11-24-asymmetric-distance-computation/ADC-Rescaling-Importance.png){:class="img-centered"}

*Figure: The impact of query rescaling on nearest neighbor search. Document quantization inherently applies a type of coordinate rescaling to the document vectors. Without query rescaling, some points near the query can be moved away from it, while points far from the query may be moved nearer. Query rescaling updates the query vector to counteract the impact of repositioning the document vectors.*

To identify the right scale for the query, we look at how a "typical" document was distorted in each dimension. At the time of data indexing, we compute two centroids for each dimension $$i$$ in our dataset:

1. $$\vec{l}_i$$ is the mean, in dimension $$i$$, of all values that were quantized to -1
2. $$\vec{h}_i$$ is the mean, in dimension $$i$$, of all values that were quantized to +1

![ADC-Rescaling-Strategy](/assets/media/blog-images/2025-11-24-asymmetric-distance-computation/ADC-Rescaling-Strategy.png){:class="img-centered"}

*Figure: For each dimension, we compute the mean value that is quantized to each of -1 (for $$\vec{l}_i$$) and +1 (for $$\vec{h}_i$$). In the figure on the left, we compute the values of $$\vec{l}_x$$ and $$\vec{h}_x$$ as the mean of those quantized negatively or positively, respectively, in the x dimension. Similarly, the sub-figure on the right computes $$\vec{l}_y$$ and $$\vec{h}_y$$ by examining the means of the positive-vs-negative quantized values in the y dimension.*

These centroids represent the "average" values that end up in either of the two quantization buckets for that dimension. Binary quantization ensures that after quantization, the difference between the positively quantized and negatively quantized values in each dimension is exactly 2. To reproduce this characteristic in ADC, we want to scale the data such that the average distance between the post-scaling centroids is also 2. That is, we rescale the query vector $$v$$ to a new $$v'$$ such that 

$$\vec{v}_i' = 2 \frac{\vec{v}_i - \vec{l}_i}{\vec{h}_i - \vec{l}_i} - 1$$

Note that $$\vec{v}_i' = -1$$ whenever $$\vec{v}_i = \vec{l}_i$$, and $$\vec{v}_i' = +1$$ whenever $$\vec{v}_i = \vec{h}_i$$. For all other values of $$\vec{v}_i$$, this scaling interpolates between -1 and +1, potentially falling outside of these bounds when $$\vec{v}_i$$ is either smaller or larger than both centroids in dimension $$i$$. With this rescaled query vector $$v'$$, we are now ready to compute the Euclidean distance to the binary-quantized document vectors with a higher degree of fidelity than would be attainable with a binary-quantized query as in SDC.

One advantage is that the centroid information only needs to be computed once for the entire dataset and requires negligible additional storage compared to the document vectors themselves (comparable to two full-precision vectors). Additionally, at query time, the rescaling only needs to be applied once to the query vector before it can be compared to all document vectors in the corpus.

## Using ADC in production

To enable the creation of ADC-backed indexes in Amazon OpenSearch Service, set `enable_adc` to `true` when creating the index:

```json
PUT /vector-index
{
  "settings" : {
    "index": {
      "knn": true
    }
  },
  "mappings": {
    "properties": {
      "vector_field": {
        "type": "knn_vector",
        "dimension": 8,
        "method": {
            "name": "hnsw",
            "engine": "faiss",
            "space_type": "l2",
            "parameters": {
              "encoder": {
                "name": "binary",
                "parameters": {
                  "bits": 1,
                  "enable_adc": true
                }
              }
            }
        }
      }
    }
  }
}
```

Once the index is created with ADC enabled, you can perform k-NN searches using the standard OpenSearch query syntax—the ADC optimization happens automatically during search operations.

## Conclusion

ADC represents a significant advancement in vector search optimization, providing a 32-fold reduction in memory usage compared to full-precision vectors while substantially mitigating the recall degradation typically associated with SDC. This technique addresses a critical challenge in large-scale vector search: balancing memory efficiency with search quality. Starting with OpenSearch 3.2, ADC is available for you to optimize your vector search implementation without compromising result relevance. 

We invite you to experiment with ADC in your OpenSearch deployments and share your experiences on the [OpenSearch community forum](https://forum.opensearch.org/). Your feedback helps drive continued improvements to vector search capabilities.