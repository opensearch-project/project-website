---
layout: post
title:  "A time machine for your data: OpenSearch searchable snapshots"
authors:
  - abunday
date: 2024-04-10
categories:
  - technical-post
  - feature
  - partners
meta_keywords:
meta_description:
---

Many organizations scaling up open-source databases such as OpenSearch are currently grappling with how to most efficiently store and search massive amounts of data. As a leading managed service provider for OpenSearch, this is something Instaclustr by NetApp is only too familiar with. We also utilize OpenSearch internally as a way of organizing, storing, and retrieving the massive amounts of logging data our applications generate every day. But how do you store all of that data without breaking the bank or spending hours of precious time managing it? You could store all of your data on disk, but the cost of doing so quickly adds up. Alternatively, you could ship it all off to cheaper remote data storage, such as Amazon Simple Storage Service (Amazon S3) or Azure Blob Storage, but then it becomes difficult to access again. If only there was some kind of time machine that allowed us to bring past data into the present without the cost or hassle.

This is what we found ourselves wondering recently. We were storing up to 12 months of audit logs in an Amazon S3 bucket. However, in the event of an audit, our security team was required to locate the relevant snapshot in S3, spin up an OpenSearch cluster, and then download the entire snapshot to that cluster just to be able to search through it. This process could take hours or even days—if everything goes to plan!

But searchable snapshots have helped us address this data challenge, and here’s why we believe it can help organizations using OpenSearch do the same.

### Searchable snapshots save time

Managing OpenSearch snapshots in remote storage can be time-intensive. In the event you need to search through that data, you will also need to restore it back to the cluster. It’s a very manual process that can take hours or even days, depending on the size of the index.

With searchable snapshots, however, it’s like having a time machine that can take you straight back to a point in time. Searchable snapshots allow you to search through remotely stored data directly from the cluster, as you would with a regular OpenSearch snapshot. By pulling down a special kind of index called a "remote snapshot," you can retrieve remotely stored snapshot data quickly and easily.

In practice, this can be easily done with the OpenSearch REST API which can restore a snapshot as a "remote snapshot" index:

```json
POST /_snapshot/custom-repository/test-snapshot-2024-01-01/_restore
{
      "indices": "test_index",
      "storage_type": "remote_snapshot",
      "rename_pattern": "(.+)",
      "rename_replacement": "restored_$1"
}
```

You can then proceed to search against the searchable snapshot index just as you would against a regular index:

```json
GET /restored_test_index/_search
{
      <Enter search query here>
}
```

Furthermore, with out-of-the-box caching configured on Instaclustr OpenSearch clusters, subsequent searches on the same dataset would resolve even faster. This reduces the time it takes our team to search logs to minutes.

### Searchable snapshots save manual effort

Searching through historical snapshots stored in remote storage requires effort. You need to understand the size of the snapshot and then ensure you have resources required to restore it to the cluster. This might require spinning up another OpenSearch cluster or increasing the disk size for an existing one. Lastly, you’ll need to restore the entire snapshot to the cluster before you can perform a search query. All of this would take a dedicated employee significant effort and resources.

But using searchable snapshots reduces the process to two easy steps:
1.	Tell OpenSearch which remote snapshot to search by doing a remote snapshot restore.
2.	Submit your query just as you would when searching any other index.

Remember how we said that searchable snapshots use a special kind of snapshot called a remote snapshot? Another cool thing about a remote snapshot is that it requires no additional cluster space in order to restore it. This means that you don’t need to provision any additional infrastructure to search through remote snapshots. This reduces the effort required considerably, freeing up your team to focus on more important tasks.

### Searchable snapshots save money

It is widely acknowledged that log data is usually more likely to be queried earlier in its life than later in its life. What this meant before searchable snapshots was that you had to retain months or years of newer data in the cluster in order for it to be retrievable in a timely manner. As we all know, storing data to "hot" disk is far more expensive than storing it in "cold" remote storage.

With searchable snapshots, you can move data to remote storage earlier in its lifecycle because it is still accessible even after being moved from the cluster to remote storage. This reduces the amount of disk space you are using in your cluster by moving older data to low-cost remote storage. Using this method, your data is still searchable, and it costs you much less to store.

### Searchable snapshots in practice

The biggest benefit we have seen so far from using searchable snapshots has been the significantly reduced amount of time that our security team spends searching through logs.

We have decided to retain data for 90 days on disk and to move all our older data to S3 storage, whereas previously, our team had to spend hours performing a full restore from older snapshots. Using searchable snapshots, that data can be queried immediately. Our index policy was configured as follows:

```json
{
  "policy": {
    "description": "Rollover indexes every day, delete indexes after 90 days.",
    "error_notification": null,
    "default_state": "hot",
    "states": [
      {
        "name": "hot",
        "actions": [],
        "transitions": [
          {
            "state_name": "rolled-over",
            "conditions": {
              "min_index_age": "1d"
            }
          }
        ]
      },
      {
        "name": "rolled-over",
        "actions": [
          {
            "retry": {
              "count": 3,
              "backoff": "exponential",
              "delay": "1m"
            },
            "rollover": {}
          }
        ],
        "transitions": [
          {
            "state_name": "deleting",
            "conditions": {
              "min_index_age": "91d"
            }
          }
        ]
      },
      {
        "name": "deleting",
        "actions": [
          {
            "retry": {
              "count": 3,
              "backoff": "exponential",
              "delay": "1m"
            },
            "delete": {}
          }
        ],
        "transitions": []
      }
    ],
    "ism_template": [
      {
        "index_patterns": [
          "audit-logging-*"
        ],
        "priority": 150
      }
    ]
  }
}
```

By spending significantly less time searching through old logs, our security team can spend more time on more valuable activities. This means we’re saving on resources across the business.

### Bringing the past into the present

We hope you can see the numerous benefits of using OpenSearch searchable snapshots. They can save you time by making remotely stored snapshots instantly accessible. They can also save you effort by removing the need to restore an entire snapshot back to the cluster. Lastly, they can save you money by reducing the amount of data being stored to disk in the cluster.

But perhaps the biggest benefit of searchable snapshots is that they give your historical data a portal back into the present day, making it suddenly accessible again. Like a time machine, they bring your data to you from the past, instantly making it more useful and valuable. If you’re looking for the ability to easily and instantly travel into the past to find the data you need, searchable snapshots is the ideal solution.

If you would like to find out more about searchable snapshots, read our release blog post or contact our friendly support team at support@instaclustr.com.
