---
layout: post
title: Announcing Data Prepper 2.11
authors:
- san81
- kkondaka
- dvenable
- oeyh
date: 2025-04-17 12:30:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.10.0 offers better OpenTelemetry support and new integrations with external sources.
meta_keywords: Data Prepper, OpenTelemetry, Atlassian Jira, Atlassian Confluent, Amazon Aurora, Amazon RDS, Amazon SQS
meta_description: Data Prepper 2.10.0 offers better OpenTelemetry support and new integrations with Jira, Confluent, Amazon Aurora/RDS, and Amazon SQS.
---

## Introduction

Data Prepper 2.11 is now available for download!
This release includes a number of great improvements to help you ingest data into OpenSearch.
Some major changes include new sources for data and better OpenTelemetry support.


## Open Telemetry improvements

TODO: Krishna


## Atlassian Jira as a source

Transform your Jira experience with powerful contextual search capabilities by seamlessly integrating your entire Jira content into OpenSearch.
Data Prepper's new [Atlassian Jira](https://www.atlassian.com/software/jira) source plugin enables organizations to create a unified searchable knowledge base by synchronizing
complete Jira projects, while maintaining real-time relevance through continuous monitoring and automatic synchronization
of Jira updates. This integration allows for data synchronization with flexible filtering options for specific projects, issue types,
and status, ensuring that only the information that you wanted is imported. To ensure secure and reliable connectivity,
the plugin supports multiple authentication methods, including basic API key authentication and OAuth2 authentication,
with the added security of managing credentials via AWS Secrets. It also features automatic token renewal for uninterrupted access,
guaranteeing continuous operation. Built on Atlassian's robust [api-version-2](https://developer.atlassian.com/cloud/jira/platform/rest/v2/intro/#version">api-version-2),
this integration empowers teams to unlock valuable insights from their Jira data through OpenSearch's advanced search capabilities,
changing how organizations interact with and derive value from their Jira content. Here's how to get started:

```
version: "2"
extension:
    aws:
      secrets:
        jira-account-credentials:
          secret_id: <<secret-arn>>
          region: <<secrets-region>>
          sts_role_arn: <<role-to-access-secret>>
jira-pipeline:
  source:
    jira:
      hosts: ["<<Atlassian-host-url>>"]
      authentication: 
        basic:
          username: ${{aws_secrets:jira-account-credentials:jiraId}}
          password: ${{aws_secrets:jira-account-credentials:jiraCredential}}
      filter:
        project:
          key:
            include:
              - "<<project-key>>"
            exclude:
               - "<<project-key>>"
        issue_type:
          include: 
            - "Story"
            - "Epic"
            - "Task"
          exclude:
            - "Bug"
        status:
          include: 
            - "To Do"
            - "In Progress"
            - "Done"
          exclude:
            - "Closed"
  sink:
    - opensearch:

```

## Atlassian Confluence as a source

Elevate your team's knowledge management and collaboration capabilities by seamlessly integrating [Atlassian Confluence](https://www.atlassian.com/software/confluence) content into OpenSearch
through Data Prepper's new Confluence source plugin. This integration enables organizations to create a centralized, searchable repository of their collective knowledge,
fostering improved information discovery and team productivity. By synchronizing Confluence content and continuously monitoring for updates,
the plugin ensures that your OpenSearch index remains an up-to-date, comprehensive reflection of your organization's shared knowledge base.
The integration offers flexible filtering options, allowing you to selectively import content from specific spaces or page types, tailoring the synchronized content to your organization's needs.
The plugin supports both basic API key and OAuth2 authentication methods, with the added option of securely managing credentials through AWS Secrets.
Furthermore, the plugin's automatic token renewal feature guarantees uninterrupted access and seamless operation.
Built on Atlassian's Confluence [api-version](https://developer.atlassian.com/cloud/confluence/rest/v1/intro/#auth),
this integration empowers teams to leverage OpenSearch's advanced search capabilities across their Confluence content,
dramatically enhancing information accessibility and utilization within the organization. Here's how to get started:

```
version: "2"
extension:
    aws:
      secrets:
        confluence-account-credentials:
          secret_id: <<secret-arn>>
          region: <<secrets-region>>
          sts_role_arn: <<role-to-access-secret>>
confluence-pipeline:
  source:
    confluence:
      hosts: ["<<Atlassian-host-url>>"]
      authentication: 
        basic:
          username: ${{aws_secrets:confluence-account-credentials:confluenceId}}
          password: ${{aws_secrets:confluence-account-credentials:confluenceCredential}}
      filter:
        space:
          key:
            include:
              - "<<space-key>>"
            exclude:
               - "<<space-key>>"
        page_type:
          include: 
            - "page"
            - "blogpost"
            - "comment"
          exclude:
            - "attachment"
  sink:
    - opensearch:

```


## Amazon Aurora/RDS as a source

[Amazon Aurora](https://aws.amazon.com/rds/aurora/) and [Amazon RDS](https://aws.amazon.com/rds/) are fully managed relational database services that make it easier to set up, operate, and scale a relational database in the AWS Cloud. 
For those who want to take advantage of advanced search capabilities like full-text and vector search on the transactional data in Amazon Aurora/RDS, you can now use Data Prepper to synchronize data from Aurora and RDS to OpenSearch.

Data Prepper’s new `rds` source first exports existing data from Amazon Aurora/RDS tables to OpenSearch indices, then streams incremental changes from those tables to keep the data consistent between the relational database and OpenSearch. 
The `rds` source currently supports Aurora MySQL, Aurora PostgreSQL, RDS MySQL, and RDS PostgreSQL engines.


The following is an example configuration:

```yaml
aurora-mysql-pipeline:
  source:
    rds:
      db_identifier: "my-aurora-cluster"
      engine: "aurora-mysql"
      database: "hr_db"
      tables:
        include:
          - "employees"
          - "departments"
      s3_bucket: "my-s3-bucket"
      s3_prefix: "pipeline-data"
      export:
        kms_key_id: "1234abcd-1234-abcd-1234-123456abcdef"
        export_role_arn: "arn:aws:iam::123456789012:role/ExportRole"
      stream: true
      aws:
        sts_role_arn: "arn:aws:iam::123456789012:role/PipelineRole"
        region: "us-east-1"
      authentication:
        username: ${{aws_secrets:secret:username}}
        password: ${{aws_secrets:secret:password}}
```

## SQS as a source

Data Prepper now supports a new Amazon Simple Queue Service (SQS) source for reading events from SQS queues.
Amazon SQS is a fully managed message queue.
The new SQS source in Data Prepper efficiently receives messages from SQS to create events you can route to sinks such as OpenSearch.

Data Prepper receives SQS messages from an SQS queue in batches, then creates Data Prepper events from those SQS messages.
By default, Data Prepper will create a single Data Prepper event per SQS message.
Data Prepper provides a robust collection of [processors](https://docs.opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/) that you can use to parse or grok, depending on the format of your message.

To help reduce your SQS costs, you can instead design your SQS data and Data Prepper to support multiple events per message.
Using this approach reduces your SQS costs by combining data into SQS messages allowing for fewer SQS sends and receives.
To take this approach you must design your sending application to send SQS messages to SQS in a format available as a [Data Prepper codec](https://docs.opensearch.org/docs/latest/data-prepper/pipelines/configuration/sources/s3/#codec).
Then you configure your Data Prepper pipeline to use that codec to parse the message into multiple events.

## Other features and improvements

This release includes another of other features to help you create pipelines for your needs.

* The `rename_keys` processor can now rename keys with variable names using a regex pattern.
* The `opensearch` sink now supports new index types for OTel Logs and Metrics.
* Data Prepper expressions now support names with `/` using escaping of the `/` character.


## Next steps

Working is continuing on Data Prepper with a few new features coming.

One exciting feature is the integration with ML-Commons and Amazon Bedrock in Data Prepper pipelines.
This feature is provided through a new ML inference processor and the Amazon S3 source and sink.
The feature is currently in development and is available for experimental usage in 2.11.

See the [Data Prepper roadmap](https://github.com/orgs/opensearch-project/projects/221/views/1) for more information on upcoming features.

## Thanks to our contributors!

TODO: We will add this shortly
