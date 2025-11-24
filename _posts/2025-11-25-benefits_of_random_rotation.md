---
layout: post
title:  "The Benefit of Random Rotation in Quantized Vector Search"
authors:
 - talw
 - nmishra
 - ynaamad
 - finnrobl
 - vikash
 - vamshin
date: 2025-11-24
categories:
 - technical-post
meta_keywords: vector search, quantization, rotation, random rotation
meta_description: Opensearch 3.2 introduces random rotation as a data standardizing transformation. This post explains the benefits of random rotation in quantized similarity search.
excerpt: Random rotation is a useful tool to make our data more standard before feeding it into an approximate nearest neighbor search algorithm. While it has a computational cost that need be taken into account, it can remove spurious axis correlation that lead to reduced accuracy.
has_math: true
has_science_table: false
---

## Introduction

Modern vector search systems, like those used in retrieval augmented generation (RAG) pipelines, need to handle a wide variety of datasets with rich and diverse structure and properties. It is often difficult to predict how a search algorithm would perform in a new and unseen dataset. One way to promote performance predictability is through transformations that standardize the data, making it more amenable to the approximate nearest neighbor (ANN) algorithm down the pipeline. 

Opensearch 3.2 introduces random rotation as a data standardizing transformation, which is helpful particularly in the context of <a href=”https://docs.opensearch.org/latest/vector-search/optimizing-storage/binary-quantization/#enhancing-search-quality-with-adc-and-rr”>Binary Quantization</a>. A random rotation simply rotates all our data and query vectors at a random orientation. Below is an example of an ellipsoidal-shaped dataset in two dimensions, before and after a random rotation (randomly chosen to be 130.6 degrees). 

![Random rotation](/assets/media/blog-images/2025-11-25-benefits_of_random_rotation/rotation_example.png)

## The benefit of random rotation

How does a random rotation change our data? Let’s start with what it doesn’t change: every rotation is an isometry, meaning it perfectly preserves all Euclidean distances and cosine similarities in our data. Therefore, if we use exact search, we would get precisely the same results before and after any rotation, including a random rotation. In other words, exact search by Euclidean distances or cosine similarities is rotationally invariant.

In practice, however, we rarely use exact search on large scale data, opting for more efficient approximate methods instead. Many of these methods are not rotationally invariant. Binary Quantization (BQ) represents each vector by the sign vector of its coordinates; Product Quantization (PQ) partitions the dimension into contiguous coordinate blocks and quantizes each block. These operations are highly dependent on the specific system of coordinates our data is aligned with. If we rotate the data, we might get completely different quantization results with different recall performance, even when the same search and quantization parameters are used.

Below is an example of a dataset with four clusters. On the left, the clusters are highly aligned with the x and y axes, which causes each cluster to be split across two BQ regions. This is detrimental to accuracy: even though point <b>x</b> is much closer to point <b>y</b> than to point <b>z</b>, BQ assigns the same code <b> [1,1] </b> to points <b>x</b> and <b>z</b>, and a different code <b> [1,0] </b> to point <b>y</b>. This makes <b>x</b> and <b>z</b> seem identical post-quantization and <b>y</b> seem equally far from both. On the right, after rotation, each cluster is fully contained in a single BQ region. Now <b>x</b> and <b>y</b> get the same code and <b>z</b> a different code. Thus, even though a rotation is an isometry, when combined with BQ it can have a massive impact on accuracy. 

![Quantization before and after random rotation](/assets/media/blog-images/2025-11-25-benefits_of_random_rotation/quantization_example.png)

This motivates us to consider rotating our data. One option is to find the best rotation for our data by solving an optimization problem. Some methods are indeed designed to this end, like <a href=https://faiss.ai/cpp_api/struct/structfaiss_1_1ITQMatrix.html>Iterative Quantization (ITQ)</a> and <a href=”https://faiss.ai/cpp_api/struct/structfaiss_1_1OPQMatrix.html”>Optimized Product Quantization (OPQ)</a>, which are available in FAISS. Their downside is that searching for an optimal rotation through optimization may be computationally intensive, and once found, it may not adapt well to unseen data, distribution shifts, or different data and query distributions.

A random rotation has a more modest objective: to remove spurious axis correlations altogether, decoupling the data from quantization boundaries. It doesn’t try to find the best rotation — only to avoid the very worst ones. A random rotation does not need to be optimized or learned — only sampled — and since it is oblivious to the data, there are no concerns about unseen data or distribution shifts. Unlike learned rotations, its impact on the data hold true for any point, not just the specific points in our dataset.

Importantly, that the rotation is random does not mean its impact on the data is entirely unpredictable. On the contrary: due to strong probabilistic concentration, a random rotation is overwhelmingly likely to move any given point away from all of the axes. Intuitively, this is because unit ball in $\mathbb{R}^d$ has$d$ axes but $\exp(d)$ volume. Hence, the probability that a point falls near an axis post-rotation behaves like $d/\exp(d)$, which tends to 0 quickly as $d$ grows. As a result, a random rotation can be seen as “standardizing” our data: it makes it very likely that almost all of the points are far away from the axes, thus making the performance of quantization algorithms like BQ more predictable, without changing the true distances and angles.

Mathematically, a random rotation interacts particularly nicely with BQ in the following way. After a random rotation, the expected Hamming distance between every pair of points $x,y\in\mathbb{R}^d$  equals $\frac{d}{\pi}\cdot\theta(x,y)$, where $\theta(x,y)$ is the angle between $x,y$. This follows from the analysis of the classical SimHash algorithm and from the linearity of expectation. Thus, after a random rotation, the expected Hamming distance between the BQ codes of the two points is directly related to their angular distance, irrespective of how they originally happened to be positioned with respect to the quantization boundaries.

Let’s see another example of detrimental axis correlations. To simulate a dataset highly correlated with the x-axis in two dimensions, we sample 10,000 points from a 2D gaussian distribution with independent coordinates, with the x-coordinate sampled from $N(0,1)$ and the y-coordinate sampled from $N(0,0.1)$. This is the ellipsoidal dataset already shown in the beginning of this blog post. Below, we highlight in orange the points that ended up with a different BQ code than their nearest neighbor, which is a bad event. After the rotation, due to eliminating the correlation with the x-axis, the number of bad events has decreased from 123 to 55 — a 55% decrease in bad events.

![Nearest neighbor separation with BQ before and after random rotation](/assets/media/blog-images/2025-11-25-benefits_of_random_rotation/rotation_experiment.png)

This happens in higher dimensions as well. To see this, we again sample a dataset with independent 0-centered Gaussian coordinates, this time in 100 dimensions. The first coordinate has variance 1 and all other coordinates have variance 0.1. For every point $x$, we look at the rank of its true nearest neighbor when the points are sorted by Hamming distance of their BQ codes from $x$. This is the number of quantized candidates we need to scan in order to find the true nearest neighbor, so lower rank is better. We list the quantiles over all points before and after a random rotation. We see that after a random rotation, the ranks are noticeably smaller. The median number of candidates we need to scan decreases by 12%, while for the 0.9-quantile — i.e., the most difficult queries — it decreases by 26%. 

| Quantile | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 |
|----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| NN rank before rotation | 10 | 30 | 63 | 110 | 186 | 302 | 495 | 956 | 1795 |
| NN rank after rotation | 9 | 25 | 55 | 97 | 164 | 265 | 421 | 678 | 1325 |

## The cost of random rotation

A random rotation introduces some computational costs. Sampling a random rotation can be done in time $O(d^3)$ — the the appendix below for an example of an implementation. This needs to be done once during the indexing phase, and is typically acceptable for in the dimensions used in modern large-scale vector search scenarios. Recent scientific literature contains several methods for faster approximate sampling of (approximate) rotation matrices, which can resolve alleviate this running time in cases where it is a bottleneck. 

In addition, every data point and every query need to be multiplied by the rotation matrix, which entails a certain additional computational cost during indexing and query time. There is also some bookkeeping to be done to ensure the vector database remains consistent with respect to the rotation, which Opensearch takes care of. The benefit versus overhead tradeoff of a random rotation is a decision that depends on your specific dataset: give it a try if your accuracy is lower than expected. 

## Using random rotation in Opensearch

Enabling random rotation in your Opensearch index is done by simply setting the “random_rotation” option to “true”. See the full instructions <a href=”https://docs.opensearch.org/latest/vector-search/optimizing-storage/binary-quantization/#enhancing-search-quality-with-adc-and-rr”>here</a>. 

## Conclusion

Random rotation is a useful tool to make our data more standard before feeding it into an approximate nearest neighbor search algorithm. While it has a computational cost that need be taken into account, it can remove spurious axis correlation that lead to reduced accuracy. If your ANN pipeline with BQ fails to attain the expected performance, give random rotation a try — you may find it leads to a large boost in accuracy with very little overhead.

## Appendix: How to sample a random rotation

In this appendix we dive deeper into the technical details of implementing random rotation. Technically, by a “random rotation” in $d$ dimensions we mean sampling a uniformly random matrix $\Pi$ from the group of $d\times d$ orthogonal matrices (commonly denoted $\mathrm{O}(d)$), and multiplying every vector by $\Pi$. Note: even though we colloquially use the term “random rotation”, $\mathrm{O}(d)$ contains not only ‘pure’ rotations, but also reflections; since reflections are isometries too, it doesn’t matter for our application whether we include them or not. Thus, the original dataset $x_1,x_2,x_3,...\in\mathbb R^d$ is replaced by $\Pi x_1,\Pi x_2,\Pi x_3,...\in\mathbb R^d$, and similarly, every query vector $q\in\mathbb R^d$ is replaced by $\Pi q\in\mathbb R^d$. 

The uniform distribution over orthogonal matrices is known as the Haar measure. There are several algorithmic ways to sample from it. The one Opensearch uses is to sample a random $d\times d$ matrix $G$ with i.i.d. normally distributed entries and orthonormalize its rows via the Gram-Schmidt process. Another way, simpler to implement in NumPy, is to compute a QR decomposition $G=QR$, and let S be the diagonal matrix of signs of the main diagonal of $R$. The matrix $\Pi=QS$ is a random rotation sampled from the Haar measure. Below is an implementation.

```python
import numpy as np

def sample_random_rotation(dimension):
    M = np.random.standard_normal((dimension, dimension))
    Q, R = np.linalg.qr(M)
    return Q * np.sign(np.diag(R))
```
