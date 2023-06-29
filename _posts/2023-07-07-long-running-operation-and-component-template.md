---
layout: post
title: "Long running operation notifications and component template"
authors:
  - ihailong
  - gbinlong
  - suzhou
  - gzhichao
date: 2023-07-07
categories:
  - technical-post
meta_keywords: index management, index operation UI, Notifications,OpenSearch Dashboards
meta_description: Transform long running operations, including Resize / Open / Force merge, into tasks and provides a mechanism to set up related notifications when specific task completes or fails. Simplify cluster operations with Index Management UI enhancements that enable you to manage component templates in a more user-friendly way.

excerpt: OpenSearch dashboard now provides a new interface you can use to manage  notifications for long running operations and component templates. You can now subscribe a specific task or a type of tasks through all the channels Notification plugin supports.
---

It is always frustrating to constantly refresh and wait for a long-running operation to finish, especially when the task may be so large that it may take hours to go. For reindex, Opensearch has brought up a concept of `task`, which makes it possible to let a time-consuming job run in background. But admin still has to check task status now and then to ensure the task has gone to a final state, not to mention that operations like shrink do not have the basic ability to run asynchronously.

# Notifications on long-running operations

## Transform long-running operations into tasks

Shrink, split, clone, open, force_merge are already known operations that may need roughly 30 minutes to finish when it comes to large indexes. Thus we transform all these operations into tasks when user declaim to run with `wait_for_completion` to `false`.

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/transform-operations-into-tasks.png" alt="transform long-running operations into tasks"/>{: .img-fluid }

## Notify when tasks of specific type finishes or fails

It is a waste of resources that admin has to manually loop request task status to retrive the final result of an operation. Thus we integrate tasks with notification channels to let Opensearch to notify admin when the task finishes or fails.

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/notify-when-tasks-of-specific-type-finishes-or-fails.png" alt="Notify when tasks of specific type finishes or fails"/>{: .img-fluid }

## Support adhoc notification config

Sometimes it is reasonable that admin may want to let more people be informed on a specific operation, like reindexing a production index. Index management provides the capability to set up adhoc notification config on an operation and please feel free to use it for your own need.

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/support-adhoc-notification-config.png" alt="Support adhoc notification config"/>{: .img-fluid }

## Support operations from API or Web GUI

It is straightforward to find out what aliases an index contains through the API, but it is difficult to determine how many indexes an alias points to through the API. The **Aliases** page provides you with these results by grouping indexes by alias. With the Index Management UI, it will be easier to attach or detach indexes from an alias, and the alias actions will be automatically generated, eliminating the need for you to build alias actions to add or remove indexes behind an alias and manually enter the indexes, which can lead to mistakes.

<img src="/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/alias-creation.png" alt="create an alias"/>{: .img-fluid }

## Security enabled

You can select the source and destination indexes, aliases, or data streams from the dropdown menu, as shown in the following image. Moreover, there is now a destination index creation flow that allows you to import settings and mappings directly from the source.

![Image: Reindex page]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/reindex.png){:.img-fluid }

# Component templates

## Component-based template creation experience

The **Shrink index** operation is used to reduce the number of primary shards in an existing index and create a new index.

To shrink an index, go to the **Indices** page, select an index, and choose the **Shrink** action in the **Actions** menu. This will take you to the shrink index page, as shown in the following image.

![Image: Shrink-action]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/shrink-action.jpg){:.img-fluid }
Only one index can be shrunk at once, and the shrink operation does not support data stream indexes. If multiple indexes are selected or if a data stream backing an index is selected in the **Indices** page, the **Shrink** option is disabled.
{: .note }

## Aggregation view to help you better manage index templates with component templates

You can select multiple indexes, except for the backing indexes of a data stream, to open or close.

If you no longer need to read or search old indexes but do not want to delete them, you can use the **Close** operation to close indexes. This will maintain the data by occupying a small amount of overhead on the cluster. Additionally, when you want to add a new analyzer to an existing index, you must close the index, define the analyzer, and then open the index. A closed index is blocked for read and write operations, so you must enter the word "close" to confirm your action, as shown in the following image.

![Image: Close-index]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/close-index.jpg){:.img-fluid }

You can select multiple indexes to open, even if some indexes are already open, as shown in the following image.

![Image: Open-index]({{site.baseurl}}/assets/media/blog-images/2023-02-28-admin-panels-for-index-operations/open-index.jpg){:.img-fluid }

## Next steps

There will be more and more asynchronized scenarios that requires timely notifications, and we will integrate. If you have any feedback or suggestions, leave a message on the [OpenSearch forum](https://forum.opensearch.org/).

## References

- [OpenSearch 2.8 is here!](https://opensearch.org/blog/opensearch-2.8.0-released/) blog post
