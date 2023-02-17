---
layout: post
title:  "Index management UI enhancements"
authors:
- Cui Hailong
- Gao Binlong
- Luo Xuesong
- Su Zhou
date: 2023-02-28
categories:
 - technical-post
meta_keywords: index operations, split, shrink, reindex, index template, alias
meta_description: Simplify cluster operations with index management UI enhancements.

excerpt: OpenSearch now offers users a new interface for running common indexing and data stream operations. Users can perform create, read, update, and delete (CRUD) and mapping for indexes, index templates, and aliases through the UI as well as open, close, reindex, shrink, and split indexes. This is the first step toward establishing an Admin UI, which will serve as a unified administration panel in OpenSearch Dashboards.
---

Users may find it difficult to manage indexes, aliases and templates on Opensearch Dashboard by using APIs. There are restrictions and relation-binding stuff, like adding aliases to indexes, simulating an index template by its name and so on in the before. And now, we are excited to announce that the cluster operations have been largely simplified with index management UI enhancements on Opensearch Dashboard v2.5:

### 1. Visual editor for index mappings with nested tree editor.
<img src="/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/index-mapping-editor.png" alt="index mapping editor"/>{: .img-fluid }

It is more complicated to build a JSON when it comes to index mappings, which has multiple nested layers and properties. To simplify that, A visual editor is provided with nested properties editable capability. Users can add properties by clicking the operation buttons and see what the mappings will be like by switching to JSON editor.

### 2. Simulate index by index name.

[TODO](A screen shot)
It is hard to indicate what the index will be like considering the existing templates. To solve that, we will try to find if the index name matches any template every time users change the index name and merge what users manually input with what the matching template contains. What you see is what the index you get.

### 3. Edit settings by JSON editor and diff mode.

[TODO](A screen shot)
The new index operation UI provides a visual editor and a JSON editor in case the visual editor does not support all the fields. Further more, we provide editor with diff mode so users can see what changes they have made comparing the existing index, ensure no mistake will be made.

### 4. One click to manage aliases on indexes.

[TODO](A screen shot)
It is easy to see what aliases an index contains while hard to see how many indexes an aliases points to by API. The Aliases page give you the result grouping by alias. Moreover, users have to use alias actions to add/remove indexes behind an alias and manually type the indexes, which is easy to raise faults. By using the Admin UI, it will be much easier to attach/detach indexes from an alias and the alias actions will be automatically generated.

### 5. Simplify the flow for the reindex operation.

You can easily choose the source/destination from the dropdown, and we also provide an ad-hoc destination index creation flow that allows you to import settings and mappings directly from the source, making it more convenient.

![Image: Reindex page]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/reindex.png){:.img-fluid }

### 6. Others

Indexes, aliases and templates are all enhanced with CRUD operations in GUI. 

# In the end

**Try it**

To try new admin panels, please find features on [official playground](https://playground.opensearch.org/app/opensearch_index_management_dashboards#/indices).

## Next steps

We’ll be releasing more admin UI on features related to data streams, monitor metrics and so on. If you have any great advice on what we have released or will release, please leave you message on the [OpenSearch forum](https://forum.opensearch.org/).