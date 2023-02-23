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
meta_keywords: index management, index mappings, index operation UI, shrink index operations, OpenSearch Dashboards
meta_description: Simplify cluster operations with index management UI enhancements that enable you to open, close, reindex, shrink, and split indexes in a more user-friendly way.

excerpt: OpenSearch now offers users a new interface for running common indexing and data stream operations. Users can perform create, read, update, and delete (CRUD) and mapping for indexes, index templates, and aliases through the UI as well as open, close, reindex, shrink, and split indexes. This is the first step toward establishing an Index Management UI, which will serve as a unified administration panel in OpenSearch Dashboards.
---

Users may find it difficult to manage indexes, aliases, and templates in Opensearch Dashboards using only APIs because there are restrictions and relation-binding tasks, like adding aliases to indexes, simulating an index template by its name, and more. We are excited to announce that these cluster operations have now been largely simplified with index management UI enhancements in Opensearch Dashboard v2.5.

### Visual editor for index mappings with nested tree editor

It is complicated to build a JSON when it comes to index mappings, which have multiple nested layers and properties. To simplify this task, a visual editor is provided, as show in the following image, with editable capabilities for nested properties. Users can add properties by clicking the operation buttons and then see what the mappings will look like by switching to the JSON editor.

<img src="/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/index-mapping-editor.png" alt="index mapping editor"/>{: .img-fluid }

### Simulate index by index name

It is hard to indicate what the index will be like considering the existing templates. To solve that, we will try to find out if the index name matches any templates each time users change the index name and merge what users manually input with what the matching template contains. A what you see is what you get index.

<img src="/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/simulate-template.png" alt="simulate template"/>{: .img-fluid }

### Edit settings by JSON editor and diff mode

The new index operation UI provides a visual editor and a JSON editor in case the visual editor does not support all available fields. Further more, we provide the editor with diff mode, as show in the following image, so that users can see what changes they have made by comparing the existing index to ensure that no mistake are made.

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

The shrink index operation has some prerequisites. If the source index does not meet the specified conditions, error messages will be shown in the shrink index page.

The source index must block write operations, that means you must set the `index.blocks.write` setting in the source index to `true`. If the source index is not set to block write operations, you can click the `Block write operations` button to set the `index.blocks.write` setting to `true`.

![Image: Shrink-block-write]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-block-write.jpg){:.img-fluid }

Secondly, the source index must be open. When the source index is closed, the shrink operation will fail. You can click the `Open` button to open the index. This may take additional time to complete and the index will be in the red health status while opening.

![Image: Shrink-open]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-open.jpg){:.img-fluid }

Additionally, a copy of every shard in the source index must reside on the same node. You can move a copy of every shard to one node manually or use the shard allocation filter to do so, but this is not required when the cluster has only one data node or if the replica count of the source index is equal to the number of data nodes minus 1. In these cases, a copy of every shard in the source index reside on the same node. If a copy of every shard in the source index does not reside on the same node, you can update the `index.routing.allocation.require._name` setting of the source index to move shards to one node automatically.

You can update the setting in the source index's detail page:
![Image: Shrink-move-shards]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-move-shards.jpg){:.img-fluid }

Or you can submit the following request with `Dev Tools`:

```
PUT test-1/_settings
{
"index.routing.allocation.require._name":"node1"
}
```

After everything is ready, fill out the input form in the shrink index page, specify a name, the primary shard count, and the replica count for the new shrunken index. You can also specify new aliases or select existing aliases to attach to the new shrunken index. 

![Image: Shrink-configure]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-configure.jpg){:.img-fluid }

All of the settings specified above will also be shown in the json editor under the `Advanced settings` section. You can also specify additional index settings for the new shrunken index in the json editor. For example, set both `index.routing.allocation.require._name` and `index.blocks.write` to `null`. This will clear the allocation requirement and the index write block which are copied from the source index.


![Image: Shrink-advanced-settings]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-advanced-settings.jpg){:.img-fluid }

Now that the settings for the new shrunken index are specified, click the `Shrink` button. The shrink operation will be triggered:

![Image: Shrink-started]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-started.jpg){:.img-fluid }

You will see a notification showing the shrink operation has started successfully. After the shrink operation is completed (this can be anywhere from minutes to hours), a new notification will be shown saying that the source index has been successfully shrunken.

![Image: Shrink-completed]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-completed.jpg){:.img-fluid }

### Open and close index operation

You can select multiple indices, except for the backing indices of a data stream, to open or close.

If you don't need to read or search old indices, but you don't want to delete them, you can use close operation to     close indices which will maintain the data but will  then have small overhead on the cluster. Additionally, when you want to add a new analyzer to an existing index you must close the index, define the analyzer, then open the index. A closed index is blocked for read and write operations so you must type the word close to confirm your action:

![Image: Close-index]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/close-index.jpg){:.img-fluid }

Opening an index is easier as you can select multiple indices to open even though some indices are already open:

![Image: Open-index]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/open-index.jpg){:.img-fluid }

### Split index

When users choose to split an index the status of that index is checked. If the index not able to be split, actions the user can take to make the index ready for splitting are provided. A list of shard numbers the index can be split into are provided so that the user does not need to calculate it manually.
Users can specify the number of replicas and then associate the new index with an existing index or use a new alias. They can also use the JSON editor to specify any index settings as well.

![Image: Split page]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/splitindex-normal.jpg){:.img-fluid }
![Image: Split page]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/splitindex-notready.jpg){:.img-fluid }

## In conclusion

**Try it**

To try out the new index management features, check out these features on the [official playground](https://playground.opensearch.org/app/opensearch_index_management_dashboards#/indices).

## Next steps

We’ll be releasing more Index Management UI features related to data streams, monitor metrics and so on. If you have any advice on what we currently have or will release, please leave a message on the [OpenSearch forum](https://forum.opensearch.org/).

## References

1. OpenSearch 2.5 is live! https://opensearch.org/blog/opensearch-2-5-is-live/