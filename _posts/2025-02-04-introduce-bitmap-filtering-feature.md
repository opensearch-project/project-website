---
layout: post
title:  "Efficient large-scale filtering with bitmap filtering in OpenSearch"
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

OpenSearch is a powerful open-source search and analytics engine that enables you to efficiently search and filter large datasets. A common search pattern involves filtering documents based on whether a field matches any value in a large set. While the existing `terms` query works well for smaller sets, its performance degrades significantly when handling thousands or millions of terms.

In OpenSearch 2.17, we introduced _bitmap filtering_ to address this issue, providing a more efficient way to handle large-scale filtering operations. OpenSearch 2.19 further enhances this feature with a new index-based bitmap query that improves performance for smaller queries and optimizes their efficiency.

## The challenge of large-scale filtering

Many applications need to filter documents by checking if a numeric identifier matches any value in a large set. Consider these examples:

- An e-commerce platform filtering a product catalog to display only items in a customer's digital library (matching product IDs against a list of thousands of purchased items).
- A bookstore chain searching for all books from a specific store (matching book IDs against a list of thousands of ISBNs).

Using `terms` queries for large sets of identifiers can cause the following issues:

- Performance degradation as query size increases.
- Scalability challenges because of high memory and CPU consumption.
- Network overhead from transmitting extensive filter lists.

These limitations negatively affect both performance and scalability, particularly for large datasets and high-traffic workloads.

## Bitmap filtering: An optimized approach

Bitmap filtering improves query performance and scalability when filtering by integer sets, such as product IDs or ISBN numbers. It uses Roaring Bitmap, an efficient data structure for handling integer sets:

- Roaring Bitmap automatically selects the most efficient internal representation based on data characteristics. It provides excellent compression for sparse integer sets while maintaining fast lookup speeds.
- Set operations (for example, intersection, or union) can be computed efficiently using the Roaring Bitmap library before sending queries to OpenSearch.

## How OpenSearch implements bitmap filtering

OpenSearch integrates bitmap filtering seamlessly into its query infrastructure:

- A new `value_type` parameter in `terms` queries allows specifying a filter list using a base64-encoded Roaring Bitmap.
- `terms` lookup is enhanced to fetch values from stored fields instead of the entire `_source`.

## Example: Filtering a customer’s purchased products

Suppose you run an e-commerce marketplace with 1 million products and 100,000 customers. Each customer has a digital library containing their purchased products. You maintain a bitmap for each customer representing their product ownership. Using bitmap filtering, you can efficiently retrieve the products owned by a specific customer as follows:

```json
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

In this example, the bitmap filter is applied to the `product_id` field in the `products` index to retrieve products owned by a specific customer. The bitmap filter data is stored in the `customers` index under the document ID `customer123`, in the field `customer_filter`. This binary field is optimized for fast retrieval and efficient processing. During query execution, the bitmap filter is loaded into memory and applied to the filtering operation.

In addition to using a `terms` lookup, as shown in the previous example, you can provide the bitmap directly in the query:

```json
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

In this case, the bitmap must be base64-encoded before being included in the query. This approach is useful when you have precomputed bitmaps or need to perform bitmap operations on the client side before querying OpenSearch.

## Key advantages of bitmap filtering

Bitmap filtering integrates seamlessly with OpenSearch’s existing query infrastructure:

- The `value_type: "bitmap"` parameter allows you to specify bitmap filters in `terms` queries.
- Enhanced `terms` lookup enables efficient retrieval of stored bitmap filters.
-  You can combine bitmap filters with other query types in Boolean queries, making them a flexible tool for large-scale filtering.

These enhancements enable you to adopt bitmap filtering with minimal changes to your existing OpenSearch queries while gaining significant performance benefits for large-scale filtering operations.

## Performance benchmarks

We conducted performance tests on an index containing 100 million documents, comparing different filtering approaches across filter sizes ranging from 100 to 10 million random IDs.

We compared the following approaches:

- Query using a list of IDs (traditional `terms` query) with document values (OpenSearch 2.17)
- Query using a list of IDs (traditional `terms` query) with an indexed field (OpenSearch 2.17)
- Query using bitmap filtering with document values (OpenSearch 2.17)
- Query using bitmap filtering with an indexed field (OpenSearch 2.19)

The following figure shows the query time comparison of these approaches.

![Traditional and bitmap query performance](/assets/media/blog-images/2025-02-04-introduce-bitmap-filtering-feature/query_time_comparison.png){:class="img-centered"}  
*Figure 1: Traditional and bitmap filtering query performance*

For small filter sizes (up to 100,000 IDs), all approaches performed similarly. However, traditional methods degraded rapidly for larger filter sizes, while bitmap filtering maintained stable performance even with millions of IDs.

### Optimized bitmap filtering comparison

OpenSearch 2.19 introduced an index-based bitmap query that automatically selects the most efficient execution strategy based on the query context and cost estimation. Compared to the original document-value-based bitmap implementation, the new implementation delivers remarkable improvements:

- **1000x speed improvement** for smaller filter sizes.
- **Consistently low query times** even with millions of IDs.
- **Stable performance** across all filter sizes.

The following figure shows the query time comparison of bitmap filtering with document values and with indexed fields.

![Optimized bitmap filtering performance](/assets/media/blog-images/2025-02-04-introduce-bitmap-filtering-feature/query_time_comparison_bitmap_index_docvalues.png){:class="img-centered"}  
*Figure 2: Optimized bitmap filtering performance*

Bitmap filtering is not only faster but also more space-efficient. A filter containing 10 million IDs requires only **16 MB** of storage when encoded as a bitmap, compared to **360 MB** as a raw ID list. This compact representation reduces network transfer times, disk I/O, and memory usage.

The following figure shows the space efficiency comparison of bitmap filtering with document values and with indexed fields.

![Space efficiency comparison](/assets/media/blog-images/2025-02-04-introduce-bitmap-filtering-feature/data_size_comparison.png){:class="img-centered"}  
*Figure 3: Optimized bitmap filtering space efficiency*


## Conclusion

Bitmap filtering in OpenSearch provides an efficient way to filter documents using large sets of numeric identifiers (thousands to millions). Integrated into `terms` queries and `terms` lookup, it is especially useful for scenarios such as:

- Digital content platforms filtering large document collections based on user entitlements.
- E-commerce platforms matching product IDs against customer libraries.

To determine whether bitmap filtering or standard `terms` queries best suit your needs, see [Performance benchmarks](#performance-benchmarks). If you're using bitmap filtering in large-scale applications, we welcome your feedback to help shape future improvements.