---
layout: post
title:  "Save up to 2x on storage with derived source"
authors:
   - tanikp
   - mgodwani
   - bukhtawa
   - kolchfa
date: 2025-09-30
categories:
  - technical-posts
meta_keywords: todo
meta_description: "Learn about derived source, introduced in OpenSearch 3.2: why it matters, how it works, and how to start using it to reduce storage costs."
---

Storage is a key factor driving infrastructure cost of your OpenSearch cluster. As your data grows, storage requirement can increase multifold, based on how OpenSearch stores document in multiple formats. This is where the derived source feature, comes to the rescue, optimising storage cost.

In this blog post, we will describe how documents are stored in OpenSearch and how to use derived source to retrieve those documents in a cost-effective manner, without compromising on the current functionalities.

## How documents are stored in OpenSearch?

When documents are ingested, OpenSearch stores the original document body in the [`_source`](https://docs.opensearch.org/latest/field-types/metadata-fields/source/) fields and also document’s fields get stored in various forms like [indexed](https://docs.opensearch.org/latest/field-types/mapping-parameters/index-parameter/), [stored](https://docs.opensearch.org/latest/field-types/mapping-parameters/store/) and [docValues](https://docs.opensearch.org/latest/field-types/mapping-parameters/doc-values/). OpenSearch stores data in different format as each field type requires values to be stored in specific form for optimised search, e.g. full-text search relies on inverted index whereas exact term aggregation on keyword field relies on doc values.  As original document gets stored in a separate data-structure comprising all the fields at a single place, it becomes easy to retrieve in fetch phase. With this setup, search latency benefit is there at the expense of storage cost due to duplication of data.

Illustration on how original document and individual fields get stored on disk in different formats
![Doc-Field-Values](/assets/media/blog-images/2025-09-30-Introducing-Derived-Source/doc-field-values.png){:class="img-centered"}

On one of the experiment performed on a test dataset comprising ~1B documents in a single index, here is how field distribution looks like:

![Storage Breakdown](/assets/media/blog-images/2025-09-30-Introducing-Derived-Source/storage-distribution.png){:class="img-centered"}

## How OpenSearch uses `_source` field?

`_source` field is not just used for document retrievals during search operations, but it is used for operations like update, reindex, scripted updates and recovery operations. If we disable the _source, then these functionalities won’t be available, which is not acceptable given data recovery is not possible.

Starting from OpenSearch 2.9.0, [ZSTD compression](https://docs.opensearch.org/latest/im-plugin/index-codecs/) support has been introduced, which provides great compression ratio at a fast compression speed. On the same experiment to determine the storage footprint, using the ZSTD compression slashes the stored field size to 216gb, providing the ~46% reduction. Even after reduction in storage after utilising the ZSTD compression, stored fields are occupying the significant amount of storage.

## What is Derived Source?

For aggregation use-cases, where we need various aggregations(min, max, avg, sum, term aggregations etc) and don’t need actual matched documents, it is a diminishing return in terms of storage due to duplication of data given actual documents are not needed rather only aggregations are needed.

Starting from OpenSearch 3.2.0, for such workload Derived Source can be used to optimise the storage. Derived source is the mode of an index with modified behaviour to not store the `_source` field at the time of ingestion, thus avoiding duplication of the data resulting into less storage requirement. Such documents are retrieved dynamically using various flavours of field stored(docValues, stored field), in an on-demand basis thus fulfilling the search capabilities and other functionalities which relies on `_source` field data like reindex, update, scripted update and recovery without actually storing the `_source` field.

With this modification in behaviour of document retrieval, during fetch phase in search query, for each of the documents, it will retrieve the value of each field using various formats like docValues and stored field as illustrated below, and finally it will combine the result.

![Derived_Source_Generation](/assets/media/blog-images/2025-09-30-Introducing-Derived-Source/derived-source-generation.png){:class="img-centered"}

While configuring index with derived source, it validates each fields must be from supported field types. And when documents are requested under any path like search, update, recovery etc., derived source regenerates the value for each of the fields defined in index mapping using either docValues or stored field. As it needs to read data from individual field’s disc locations as compared to single reach operation of `_source` field, latency degradation might be observed while requesting last number of documents.

## How to configure Derived Source?

Derived source can be configured at an index level, as we are changing the default behaviour of storing the original source, this setting can’t be updated once index has been created such that dual behaviour of original source and dynamically generated source(this might be the flavour of original source in display forms) can be avoided.

```json
PUT sample-index1
{
  "settings": {
    "index": {
      "derived_source": {
        "enabled": true
      }
    }
  },
  "mappings": {
    <index fields>
  }
}
```
## Performance benchmarks

Based on experiment runs, derived source provides the great storage reduction on some of the workloads. Search latency we have seen regression ranging from 10%(requesting 1k documents in terms aggregation) to 100%(requesting 10k documents in match-all query), wheres in some queries we have seen some latency improvements as well, considering the fact that decompression is not needed for most of the field types for which we are reading docValues as opposed to `_source` field, which is a stored field and requires decompression prior to reading it from the disc.

Workload | Storage Reduction
:--- | :---
nyc_taxis | 41% |
http logs | 43% |
elb logs | 58% |

Across these benchmarks, we also saw significant indexing throughput improvements upto 18% and also reduction in merge time, ranging from 20% to 48%, owing to lesser CPU overhead in generating optimised segments, which also helps cut down the merge overhead.

With reduced index size, other benefits can also be observed like smaller shard size leads to faster recovery in event on node restart or shard movement. Further smaller segments will require less disc I/O operations and less page cache swaps, leading to efficient queries.

While file based recovery can be fast, operational based recovery would take a hit due to regeneration of source. For operation based recovery, there are two types: 1) Lucene based, which would take a hit due to document replication using derived source and 2) Translog based, there is a way to read `_source` as it is instead of regenerating under derived source(which we have seen taking 2x more time, because of the way derived source works for documents in translog).

```json
PUT sample-index1
{
  "settings": {
    "index": {
      "derived_source": {
        "enabled": true,
        "translog": {
          "enabled": false
        }
      }
    }
  }
}
```

## Limitations

While derived source offers substantial storage reduction, there are certain limitations on the generated source in terms of, how query responses are returned.

### Representation of [date](https://docs.opensearch.org/latest/field-types/supported-field-types/date/)

For date field with multiple [formats](https://docs.opensearch.org/latest/field-types/supported-field-types/date/#formats) supplied, derived source will have first format from the specified ones for all the requested documents irrespective of ingested field value.

### Representation of [geo-point](https://docs.opensearch.org/latest/field-types/supported-field-types/geo-point/)

GeoPoint field values can be ingested in multiple formats, but derived source will always represent these values in fix format of {"lat", lat_val, "lon": lon_val}. These values are indexed with some of precision loss, same degree of precision loss might be observed in derived source

### Order and deduplication of multiple value fields

Derived source will sort and/or deduplicate values in a multiple value field array.

```json
1. Keyword field
    a. Ingested source
    {
      "keyword": ["b", "c", "a", "c"]
    }
    
    b. Derived source
    {
     "keyword": ["a", "b", "c"]
    }

2. Number field
    a. Ingested source
    {
      "number": [3, 1, 2, 1]
    }
    
    b. Derived source
    {
     "number": [1, 1, 2, 3]
    }
```

Field level details limitations are listed under each [supported fields](https://docs.opensearch.org/latest/field-types/metadata-fields/source/#supported-fields-and-parameters).

## What's next?

While we are supporting most commonly used field types, there are certain limitations around how these field type should be defined in index mapping, we intend to relax these limitations and open up more use-cases that can leverage derived source. We are also planning to support some of the field types which are not supported currently like [range](https://docs.opensearch.org/latest/field-types/supported-field-types/range/), [geo-shape](https://docs.opensearch.org/latest/field-types/supported-field-types/geo-shape/), etc. With this, we will also be focusing on optimising the document retrieval strategy to improve search latency while requesting lots of documents.
