---
layout: post
title: "Long running operation notifications and component template"
authors:
  - ihailong
  - gbinlong
  - suzhou
  - gzhichao
date: 2023-06-07
categories:
  - technical-post
meta_keywords: index management, index operation UI, Notifications,OpenSearch Dashboards
meta_description: Transform long running operations, including Resize / Open / Force merge, into tasks and provides a mechanism to set up related notifications when specific task completes or fails. Simplify cluster operations with Index Management UI enhancements that enable you to manage component templates in a more user-friendly way.

excerpt: OpenSearch dashboard now provides a new interface you can use to manage  notifications for long running operations and component templates. You can now subscribe a specific task or a type of tasks through all the channels Notification plugin supports.
---

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/notificaitons-on-long-running-operation.gif" alt="notifications on long-running operations"/>{: .img-fluid }

Index management plugin has release feature that enable notifications on long-running operations!

# Notifications on long-running operations

In the before it is always frustrating to constantly refresh and wait for a long-running operation to finish, especially when the task may be so large that it may take hours to go. For reindex, Opensearch has brought up a concept of `task`, which makes it possible to let a time-consuming job run in background. But admin still has to check task status now and then to ensure the task has gone to a final state, not to mention that operations like shrink do not have the basic ability to run asynchronously.

## Transform long-running operations into tasks

Shrink, split, clone, open, force_merge are already known operations that may need roughly 30 minutes to finish when it comes to large indexes. Thus we transform all these operations into tasks when user declaim to run with `wait_for_completion` to `false`.

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/transform-operations-into-tasks.png" alt="transform long-running operations into tasks" />{: .img-fluid }

## Notify when tasks of specific type finishes or fails

It is a waste of resources that admin has to manually loop request task status to retrive the final result of an operation. Thus we integrate tasks with notification channels to let Opensearch to notify admin when the task finishes or fails.

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/notify-when-tasks-of-specific-type-finishes-or-fails.png" alt="Notify when tasks of specific type finishes or fails"/>{: .img-fluid }

## Support adhoc notification config

Sometimes it is reasonable that admin may want to let more people be informed on a specific operation, like reindexing a production index. Index management provides the capability to set up adhoc notification config on an operation and please feel free to use it for your own need.

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/support-adhoc-notification-config.png" alt="Support adhoc notification config"/>{: .img-fluid }

## Support operations from API or Dashboard UI

The notification after the completion of operations is not only available on Dashboard UI, but also available when we do that from API.

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/support-operations-from-api-or-dashboard-ui.png" alt="Support operations from API or Dashboard UI"/>{: .img-fluid }

## Security enabled

Notifications can be annoying sometimes, especially when there are multiple tasks running in background. Notifications for long-running operations have integrated with security plugin with some fine-grained actions permission control.

1. `cluster:admin/opensearch/controlcenter/lron/get` indicates if the user has permission to `view` the notification configs for long-running operations.
1. `cluster:admin/opensearch/controlcenter/lron/write` indicates if the user has permission to `add or update` the notification configs for long-running operations.
1. `cluster:admin/opensearch/controlcenter/lron/delete` indicates if the user has permission to `delete` the notification configs for long-running operations.

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/security-enabled.png" alt="Security enabled"/>{: .img-fluid }

# Component templates

Component templates makes it possible to create your index template by combining multiple component templates.

## Component-based template creation experience

It is always to tell what the index template will be like after merging all the associated component templates and its own configs from API, now Dashboard UI enable admin to preview the index template while create/update. 

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/component-based-template-creation-experience.png" alt="Component-based template creation experience"/>{: .img-fluid }

## Aggregated view to help admin better manage index templates with component templates

It is hard to tell how many index templates are using a single component template, thus Dashboard UI gives an aggregated view for admin to find all the index templates in perspect of component templates.

<img src="/assets/media/blog-images/2023-07-07-long-running-operation-and-component-template/aggregated-view-to-help-admin-better-manage-index-templates-with-component-templates.png" alt="Aggregated view to help admin better manage index templates with component templates"/>{: .img-fluid }

## Next steps

There will be more and more asynchronized scenarios that requires timely notifications, and we will integrate. If you have any feedback or suggestions, leave a message on the [OpenSearch forum](https://forum.opensearch.org/).

## References

- [OpenSearch 2.8 is here!](https://opensearch.org/blog/opensearch-2.8.0-released/) blog post
