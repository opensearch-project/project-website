---
layout: post
title:  "Introduce Bitmap Filtering Feature"
authors:
   - bowenlan-amzn
   - macrakis
   - msfroh
   - kolchfa
date: 2025-02-04
categories:
  - technical-posts
meta_keywords: bitmap
meta_description: Introduce the bitmap filtering feature about its usage and performance
---

## Introduction

OpenSearch is a powerful open-source search and analytics engine that enables users to efficiently search and filter large datasets. A common search pattern requires filtering documents based on whether a field matches any value in a large set. While the existing terms query works well for smaller sets, its performance degrades significantly when dealing with thousands or millions of terms. In OpenSearch 2.17, we introduced bitmap filtering to efficiently handle these large-scale filtering operations. Version 2.19 further enhances this feature with a new index-based bitmap query that delivers performance improvement for small queries and fixes efficiency gaps.

## The Challenge

Many applications need to filter documents by checking if their numeric identifiers match any value in a large set. For example, an e-commerce platform might filter a product catalog to show only items in a customer's digital library (matching product IDs against a list of thousands of purchased item IDs); user want to find all books from one store of a chain bookstore (matching book IDs against a list of thousands of ISBNs). Using terms queries for these large sets of identifiers can cause:

1. Performance degradation due to increased query size
2. Scalability issues from high memory and CPU consumption
3. Network overhead from transmitting extensive filter lists

These limitations harm performance and scalability, especially for large-scale datasets and high-traffic workloads.

## Bitmap Filtering: A New Approach

When filtering by sets of integers, such as product IDs or ISBN numbers, we can significantly improve query performance and scalability by using Roaring Bitmap - a highly optimized data structure for representing integer sets.

* Roaring Bitmap automatically selects the most efficient internal representation based on the data characteristics. It provides excellent compression for sparse integer sets while maintaining fast lookup speeds.
* Set operations (intersection, union) between filters can be computed efficiently using the Roaring Bitmap library before sending the query to OpenSearch.

## Implementation in OpenSearch

We've enhanced the existing query infrastructure to integrate bitmap filtering seamlessly:

* Introduced a new value_type parameter in terms queries, set to "bitmap" to specify a filter list using a base64-encoded Roaring Bitmap representation
* Added a parameter in terms lookup to fetch values from stored fields instead of the entire _source

Let's look at a practical example. Suppose you run an e-commerce marketplace with 1 million products and 100,000 customers. Each customer has their own digital library containing their purchased products. To efficiently query which products a customer owns, you maintain a bitmap for each customer representing their product ownership. Here's how you can use bitmap filtering to fetch all products owned by a specific customer:

```
POST products/_search
{
  "query": {
    "terms": {
      "product_id": {
        "index": "customers",
        "id": "customer123",
        "path": "customer_filter",
        "store": true
      },
      "value_type": "bitmap"
    }
  }
}
```

In this example, the bitmap filter is applied to the "product_id" field of the "products" index to retrieve the products owned by a specific customer. The bitmap filter data is retrieved from a different index "customers" using the document ID "customer123" and the field path "customer_filter". The bitmap data is stored in a binary field type optimized for fast retrieval and efficient processing. During query execution, the bitmap filter is loaded into memory and applied to the filtering operation.

Users have two options for providing bitmap filters. The first is using terms lookup as shown in the previous example, and the second is providing the bitmap directly in the query:

```
POST products/_search
{
  "query": {
    "terms": {
      "product_id": ["<base64-encoded-bitmap>"],
      "value_type": "bitmap"
    }
  }
}
```

Note that in this case, the bitmap needs to be base64-encoded before being included in the query. This direct approach is particularly useful when you have pre-computed bitmaps or want to perform bitmap operations client-side before sending the query.

The flexibility of bitmap filtering comes from its seamless integration with OpenSearch's existing query infrastructure:

1. The new value_type: "bitmap" parameter allows you to specify bitmap filters within standard terms queries
2. The enhanced terms lookup feature lets you efficiently retrieve stored bitmap filters
3. Bitmap filters can be freely combined with other query types in boolean queries, making them a versatile addition to your query toolkit

These enhancements enable you to adopt bitmap filtering with minimal changes to your existing OpenSearch queries while gaining significant performance benefits for large-scale filtering operations.

## Performance Benchmark

![Figure 1](/assets/media/blog-images/2025-02-04-introduce-bitmap-filtering-feature/query_time_comparison.png){:class="img-centered"} Figure 1
![Figure 2](/assets/media/blog-images/2025-02-04-introduce-bitmap-filtering-feature/query_time_comparison_bitmap_index_docvalues.png){:class="img-centered"} Figure 2

We conducted multiple performance testings using an index containing 100 million documents, comparing different filtering approaches across various filter sizes (from 100 to 10 million random IDs).
In version 2.17 (Figure 1), we compared three approaches:

* Standard terms query using document values
* Standard terms query using field index
* Our new bitmap filtering approach based on document values

As shown in the first graph, while all approaches performed similarly for small filter sizes (up to 100,000 IDs), the traditional approaches showed quick performance degradation with larger filter sizes. In contrast, bitmap filtering maintained consistent performance even with millions of IDs.
Version 2.19 (Figure 2) brought another leap forward. The new index or docvalues bitmap query (shown as "Encoded Bitmap (Index)" in the second graph) automatically chooses the most efficient execution strategy based on the query context and cost estimation. When compared to the previous bitmap implementation, it shows remarkable improvements:

* Thousand times faster for smaller filter sizes
* Maintains stable performance across all filter sizes
* Consistently low query times even with millions of IDs

Beyond query performance, bitmap filtering also provides significant space efficiency. From Figure 3, a filter containing 10 million IDs requires only 16 MB when encoded as a bitmap, compared to 360 MB as a raw ID list. This compact representation leads to reduced network transfer times, lower disk I/O, and better memory utilization.

![Figure 2](/assets/media/blog-images/2025-02-04-introduce-bitmap-filtering-feature/query_time_comparison_bitmap_index_docvalues.png){:class="img-centered"} Figure 3

## Conclusion

Bitmap filtering in OpenSearch is particularly valuable when filtering documents using large sets of numeric identifiers (thousands to millions scale). Implemented as part of terms query and terms lookup feature, this new feature can benefit scenarios like digital content platforms filtering large document corpus against different user entitlements, or e-commerce systems matching product IDs against customer libraries. PPlease check the Performance Benchmark section to determine if bitmap filtering or standard terms query better suits your needs. We welcome feedback from users implementing this feature in their large-scale filtering applications to help guide future improvements.
