---
layout: post
title:  "Index management UI enhancements"
authors:
- ihailong
- gbinlong
- suzhou
- lxuesong
date: 2023-02-28
categories:
 - technical-post
meta_keywords: index operations, split, shrink, reindex, index template, alias
meta_description: Simplify cluster operations with index management UI enhancements.

excerpt: OpenSearch now offers users a new interface for running common indexing and data stream operations. Users can perform create, read, update, and delete (CRUD) and mapping for indexes, index templates, and aliases through the UI as well as open, close, reindex, shrink, and split indexes. This is the first step toward establishing an Index Management UI, which will serve as a unified administration panel in OpenSearch Dashboards.
---

Users may find it difficult to manage indexes, aliases, and templates on Opensearch Dashboard using only APIs. There are restrictions and relation-binding tasks, like adding aliases to indexes, simulating an index template by its name and more. We are excited to announce that these cluster operations have now been largely simplified with index management UI enhancements on Opensearch Dashboard v2.5.

### Visual editor for index mappings with nested tree editor

It is more complicated to build a JSON when it comes to index mappings, which have multiple nested layers and properties. To simplify that, a visual editor is provided with editable capabilities for nested properties. Users can add properties by clicking the operation buttons and then see what the mappings will look like by switching to the JSON editor.

<img src="/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/index-mapping-editor.png" alt="index mapping editor"/>{: .img-fluid }

### Simulate index by index name

It is hard to indicate what the index will be like considering the existing templates. To solve that, we will try to find out if the index name matches any templates each time users change the index name and merge what users manually input with what the matching template contains. A what you see is what you get index.

<img src="/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/simulate-template.png" alt="simulate template"/>{: .img-fluid }

### Edit settings by JSON editor and diff mode

The new index operation UI provides a visual editor and a JSON editor in case the visual editor does not support all available fields. Further more, we provide the editor with diff mode so that users can see what changes they have made by comparing the existing index to ensure that no mistake are made.

<img src="/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/json-diff-editor.png" alt="JSON diff editor"/>{: .img-fluid }

### One click to manage aliases on indexes

It is easy to see what aliases an index contains while it's hard to see how many indexes an aliases points to via API. The Aliases page gives you these results by grouping by alias. Moreover, by using the API users have to build alias actions to add/remove indexes behind an alias and manually type the indexes, which can lead to mistakes. By using the Index Management UI, it will be much easier to attach/detach indexes from an alias, and the alias actions will be automatically generated.

<img src="/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/alias-creation.png" alt="create an alias"/>{: .img-fluid }

### Simplify the flow for the reindex operation

You can easily select the source and destination indexes, aliases, or data streams from the dropdown menu. Additionally, we provide an ad-hoc destination index creation flow that allows you to import settings and mappings directly from the source, making the process more convenient.

![Image: Reindex page]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/reindex.png){:.img-fluid }

### Shrink index operation

The shrink index operation is used to shrink an existing index into a new index with fewer primary shards.

When you want to shrink an index, go to the indices page, select an index, then click the `Shrink` action in the actions menu. You will then enter the shrink index page. Please note that only one index can be shrunk at once and data stream indices are not supported to do a shrink opperation, so if multiple indices are selected or a data stream backing index is selected in the indices pages, the `Shrink` option is disabled. 

![Image: Shrink-action]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-action.jpg){:.img-fluid }

Before shrinking, please make sure that the index you want to shrink is not in one of the following states:

* The index's health status is red.
* The index has only one primary shard.

If the index is in one of the above states, error messages will be shown in the shrink index page and the shrink button will be disabled.

![Image: Shrink-red]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-red.jpg){:.img-fluid }

![Image: Shrink-one-shard]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-one-shard.jpg){:.img-fluid }

Shrink index operation has some prerequisites, if the source index does not meet the conditions, some error messages will be shown in the shrink index page.

One condition is that the source index must block write operations, i.e. the `index.blocks.write` setting in the source index is `true`, if the source index is not set to block write operations, then you can click the `Block write operations` button to set the `index.blocks.write` setting to `true`.

![Image: Shrink-block-write]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-block-write.jpg){:.img-fluid }

The second condition is that the source index must be open, when the source index is closed, the shrink operation will fail, so you can click the `Open` button to open the index, this may take additional time to complete and the index will be in red health status while opening.

![Image: Shrink-open]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-open.jpg){:.img-fluid }

Another condition is that a copy of every shard in the source index must reside on the same node, you can move a copy of every shard to one node manually or using the shard allocation filter to do so, but it is not required when the cluster has only one data node or the replica count of the source index is equal to the number of data nodes minus 1(in these cases, a copy of every shard in the source index just reside on the same node). So if a copy of every shard in the source index does not reside on the same node, you can update the `index.routing.allocation.require._name` setting of the source index to move shards to one node automatically.

You can update the setting in the source index's detail page:
![Image: Shrink-move-shards]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-move-shards.jpg){:.img-fluid }

or submit the following request by `Dev Tools`:

```
PUT test-1/_settings
{
"index.routing.allocation.require._name":"node1"
}
```

After all things are ready, fill the input form in the shrink index page, speficy a name, primary shard count and replica count for the new shrunken index, you can also secify new aliases or select existing aliases to attach them to the new shrunken index. 

![Image: Shrink-configure]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-configure.jpg){:.img-fluid }

All the settings you specified above will also be shown in the json editor contained in the `Advanced settings` part, you can specify more index settings for the new shrunken index in the json editor, for example, set both `index.routing.allocation.require._name` and `index.blocks.write` to `null`, this will clear the allocation requirement and the index write block copied from the source index.


![Image: Shrink-advanced-settings]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-advanced-settings.jpg){:.img-fluid }

As the settings for the new shrunken index are specified, click the `Shrink` button then the shrink operation will be triggered:

![Image: Shrink-started]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-started.jpg){:.img-fluid }

you can see a toast showing the shrink operation started successfully, after minutes or even hours, when the shrink operation is completed, a new toast will be shown says that the source index has been successfully shrunken.

![Image: Shrink-completed]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-completed.jpg){:.img-fluid }

### 7. Open and close index operation

You can selecet multiple indices except the backing indices of a data stream to open or close.

If you don't need to read or search some old indices, but you don't want to delete them, then you can use close opeartion to     close these indices which can maintain the data but have a small overhead on the cluster. Another scenario is that when you want to add an new analyzer to an existing index, you must close the index, define the analyzer and then open the index. A closed index is blocked for read and write operations, so you must type the word close to confirm your action:

![Image: Close-index]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/close-index.jpg){:.img-fluid }

Open index is easier, you can select multiple indices to open even though these indices are all open:

![Image: Open-index]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/open-index.jpg){:.img-fluid }

### 8. Split index

When user choose to split an index, we'll check the status of that index, if it's not ready to be splitted, we'll provide actions that user can operate to make the index ready for splitting. We'll also provide a list of shard numbers the index can be splitted to so user does not need to calculate it manually.
User can  specify number of replicas, associate the new index with existing index alias or new alias. They can also use JSON editor to specify any index setting as well.

![Image: Split page]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/splitindex-normal.jpg){:.img-fluid }
![Image: Split page]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/splitindex-notready.jpg){:.img-fluid }

# In the end

**Try it**

To try the new index management, please find features on [official playground](https://playground.opensearch.org/app/opensearch_index_management_dashboards#/indices).

## Next steps

We’ll be releasing more admin UI on features related to data streams, monitor metrics and so on. If you have any great advice on what we have or will release, please leave you message on the [OpenSearch forum](https://forum.opensearch.org/).