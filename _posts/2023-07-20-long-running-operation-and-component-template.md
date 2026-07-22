---
layout: post
title: "New for OpenSearch Dashboards: Long-running operation notifications and component templates"
authors:
  - ihailong
  - gbinlong
  - suzhou
  - zhichaog
  - kolchfa
date: 2023-07-20
categories:
  - technical-post
meta_keywords: OpenSearch index state management, index management UI, OpenSearch dashboards
meta_description: Learn how OpenSearch simplifies cluster operations with index management UI enhancements that enable you to manage component templates in a user-friendly way.

excerpt: OpenSearch Dashboards now provides two additional UI elements to simplify index management---notifications for long-running operations and component templates. With long-running operation notification, you can subscribe to be notified of a specific task or type of task through any notification channel supported by the Notification plugin. With component templates, you can create a single index pattern that matches multiple indexes. Using component templates together with index templates provides a powerful tool for managing large volumes of data.
---

OpenSearch Dashboards now provides two additional UI elements to simplify index management: [notifications for long-running operations](#long-running-operation-notifications) and [component templates](#component-templates). With long-running operation notification, you can subscribe to be notified of a specific task or type of task through any notification channel supported by the Notification plugin. With component templates, you can create a single index pattern that matches multiple indexes. Using component templates together with index templates provides a powerful tool for managing large volumes of data.

## Long-running operation notifications

In the past, when you ran a long-running operation, you needed to wait for it to complete, constantly refreshing to update the status. This became challenging because a task could take hours to finish. To alleviate the problem, OpenSearch introduced asynchronous tasks for `reindex` operations, making it possible for a time-consuming job to run in the background. However, admins still had to check the task status from time to time to ensure that the task had progressed to its final state. Additionally, operations like `shrink` lacked the basic ability to run asynchronously.

### Transforming long-running operations into asynchronous tasks

For large indexes, the `shrink`, `split`, `clone`, `open`, and `force_merge` operations are known to need roughly 30 minutes to finish. If you want to run them asynchronously, you can transform these operations into tasks by setting the `wait_for_completion` query parameter to `false`:

```json
POST /my-old-index/_shrink/my-new-index?wait_for_completion=false
{
  "settings": {
    "index.number_of_replicas": 4,
    "index.number_of_shards": 3
  },
  "aliases":{
    "new-index-alias": {}
  }
}
```

The preceding query returns a task ID that you can use to monitor the operation status. 

### Getting notified when asynchronous tasks finish or fail

To support notifications for long-running operations, we integrated tasks with notification channels. To be notified when a task finishes or fails, you can configure notification settings, as shown in the following image.

<img src="/assets/media/blog-images/2023-07-20-long-running-operation-and-component-template/notify-when-tasks-of-specific-type-finishes-or-fails.png" alt="Notify when tasks of specific type finishes or fails"/>{: .img-fluid }

For detailed instructions on configuring notifications, see [Notification settings](https://opensearch.org/docs/latest/dashboards/im-dashboards/notifications/).

### Notifying additional users of an indexing operation

Sometimes you may want to notify additional users of the status of a specific operation, such as the reindexing of a production index. Index management provides the capability to amend default notifications with additional notifications for an individual operation, as shown in the following image.

<img src="/assets/media/blog-images/2023-07-20-long-running-operation-and-component-template/support-adhoc-notification-config.png" alt="Support adhoc notification config"/>{: .img-fluid }

For more information, see [Configuring notification settings for an individual operation](https://opensearch.org/docs/latest/dashboards/im-dashboards/notifications/#configuring-notification-settings-for-an-individual-operation).

### Configuring notifications through the API

You can use the `lron` API endpoint to configure notification settings for a task. For example, the following query sets up notifications when a reindex task fails:

```json
POST /_plugins/_im/lron
{
  "lron_config": {
      "task_id":"dQlcQ0hQS2mwF-AQ7icCMw:12354",
      "action_name":"indices:data/write/reindex",
      "lron_condition": {
        "success": false,
        "failure": true
      },
      "channels":[
          {"id":"channel1"},
          {"id":"channel2"}
      ]
  }
}
```

The `lron` API lets you create, retrieve, update, and delete notification settings. To learn more about these operations, see [Notification settings](https://opensearch.org/docs/latest/im-plugin/notifications-settings/).

### Setting up fine-grained access control with notification permissions

To limit notification setup access to certain users, notifications are integrated with the Security plugin, which provides the following fine-grained permissions:

- `cluster:admin/opensearch/controlcenter/lron/get`: The user has permission to `view` the notification configurations for long-running operations.
- `cluster:admin/opensearch/controlcenter/lron/write`: The user has permission to `add or update` the notification configurations for long-running operations.
- `cluster:admin/opensearch/controlcenter/lron/delete`: The user has permission to `delete` the notification configurations for long-running operations.

If users lack permissions to view notification settings, they are prompted to request permissions, as shown in the following image.

<img src="/assets/media/blog-images/2023-07-20-long-running-operation-and-component-template/security-enabled.png" alt="Security enabled"/>{: .img-fluid }

## Component templates

Component templates let you create a single index pattern that matches multiple indexes. You can combine multiple component templates to create an index template.

### Creating component templates

When you create index templates through the API, it may be difficult to determine what the index template will be like after merging all the associated component templates with their own configurations. Now when you create or update an index template through the UI, you can preview the template in OpenSearch Dashboards, as shown in the following image.

<img src="/assets/media/blog-images/2023-07-20-long-running-operation-and-component-template/component-based-template-creation-experience.png" alt="Component-based template creation experience"/>{: .img-fluid }

For detailed instructions on creating component templates, see [Component templates](https://opensearch.org/docs/latest/dashboards/im-dashboards/component-templates/).

### Managing index templates with the aggregated index template view

Using the API, it may be difficult to determine how many index templates are using a single component template. Now OpenSearch Dashboards provides an aggregated view of all index templates associated with a particular component template so you can easily manage them, as shown in the following image.

<img src="/assets/media/blog-images/2023-07-20-long-running-operation-and-component-template/aggregated-view-to-help-admin-better-manage-index-templates-with-component-templates.png" alt="Aggregated view to help admin better manage index templates with component templates"/>{: .img-fluid }

## Next steps

We are exploring new ways to use the notifications framework for other asynchronous task scenarios that require timely notifications. If you have any feedback or suggestions, join the discussion on the [OpenSearch forum](https://forum.opensearch.org/). 