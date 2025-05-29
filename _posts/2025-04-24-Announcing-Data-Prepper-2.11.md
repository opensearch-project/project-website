---
layout: post
title: "Announcing OpenSearch Data Prepper 2.11: Supercharged OpenTelemetry and even more sources"
authors:
- san81
- kkondaka
- dvenable
- oeyh
date: 2025-04-17 12:30:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.11.0 offers better OpenTelemetry support and new integrations with external sources.
meta_keywords: Data Prepper, OpenTelemetry, Atlassian Jira, Atlassian Confluent, Amazon Aurora, Amazon RDS, Amazon SQS
meta_description: Data Prepper 2.11.0 offers better OpenTelemetry support and new integrations with Jira, Confluent, Amazon Aurora/RDS, and Amazon SQS.
---

## Introduction

OpenSearch Data Prepper 2.11 is now available for download! This release includes a number of improvements to help you ingest data into OpenSearch. Some major changes include new sources for data and better OpenTelemetry (OTel) support.


## OTel improvements

Previously, the design and implementation of OTel sources were tightly coupled with the OpenSearch data mapping model and ease of integration with OpenSearch Dashboards, necessitating the following functionality in OTel sources:

* Replacing dots (.) in attributes with the at symbol (@).
* Merging and flattening of attributes -- Resource attributes, scope attributes, and log/metric/span attributes are all merged and stored in the root of the event.
* Addition of non-standard fields -- Non-standard fields, like service name and trace group fields, are added.

Data Prepper has now been modified to support the generation of events compliant with the OTel standard specification. To support this, the following changes have been implemented:

* A new `output_format` configuration option has been added under each OTel source, with OpenSearch as the default, and can be configured to generate OTel-compliant events.
* The OpenTelemetry codec has been renamed to reflect support for default behavior and new configuration options. Non-standard fields are now stored in event metadata, enabling compatibility with trace and service map processors without additional changes.
* All missing OTel standard fields have been added.
* Index templates have been added to the `opensearch` sink to facilitate correct field mapping for log, metric, and span documents in OpenSearch indexes.

With these changes, the OTel source configuration file for generating OTel-compliant events from OTel logs is as follows:

```
source:
  otel_logs_source:
      output_format: otel
sink:
  - opensearch:
        hosts: [ "https://..." ]
        aws:
            region: "<<region>>"
            sts_role_arn: "<<role-arn>>"
        index_type: "log-analytics-plain"
```


Users who need to transform data before sending it to the `opensearch` sink can leverage existing Data Prepper processors. For instance, to nest `severityText` and `severityNumber` under a severity field in OTel logs, the following configuration can be added prior to the sink stage:

```
- add_entries:
       entries:
         - key: "severity/number"
           format: "${/severityNumber}"
         - key: "severity/text"
           format: "${/severityText}"
- delete_entries:
    with_keys: ["severityNumber", "severityText"]
```

## Atlassian Jira as a source

You can now transform your Jira experience with powerful contextual search capabilities by seamlessly integrating all of your Jira content into OpenSearch. Data Prepper's new [Atlassian Jira](https://www.atlassian.com/software/jira) source plugin enables organizations to create a unified searchable knowledge base by synchronizing complete Jira projects while maintaining real-time relevance through continuous monitoring and automatic synchronization of Jira updates. This integration allows for data synchronization with flexible filtering options for specific projects, issue types, and statuses, ensuring that only the information you want is imported. To ensure secure and reliable connectivity, the plugin supports multiple authentication methods, including basic API key authentication and OAuth 2.0 authentication, with the added security of managing credentials through AWS Secrets Manager. It also features automatic token renewal for uninterrupted access, guaranteeing continuous operation. Built on Atlassian's robust [api-version-2](https://developer.atlassian.com/cloud/jira/platform/rest/v2/intro/#version">api-version-2), this integration empowers teams to unlock valuable insights from their Jira data through OpenSearch's advanced search capabilities, changing how organizations interact with and derive value from their Jira content. 
Here's how to get started:

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

You can now also elevate your team's knowledge management and collaboration capabilities by seamlessly integrating [Atlassian Confluence](https://www.atlassian.com/software/confluence) content into OpenSearch through Data Prepper's new Confluence source plugin. This integration enables organizations to create a centralized, searchable repository of their collective knowledge, fostering improved information discovery and team productivity. By synchronizing Confluence content and continuously monitoring for updates, the plugin ensures that your OpenSearch index remains an up-to-date, comprehensive reflection of your organization's shared knowledge base. The integration offers flexible filtering options, allowing you to selectively import content from specific spaces or page types, tailoring the synchronized content to your organization's needs. The plugin supports both basic API key and OAuth 2.0 authentication methods, with the added option of securely managing credentials through AWS Secrets Manager. Furthermore, the plugin's automatic token renewal feature guarantees uninterrupted access and seamless operation. Built on Atlassian's Confluence [api-version](https://developer.atlassian.com/cloud/confluence/rest/v1/intro/#auth), this integration empowers teams to leverage OpenSearch's advanced search capabilities across their Confluence content, dramatically enhancing information accessibility and utilization. 

Here's how to get started:

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


## Amazon Aurora/Amazon RDS as a source

[Amazon Aurora](https://aws.amazon.com/rds/aurora/) and [Amazon Relational Database Service (Amazon RDS)](https://aws.amazon.com/rds/) are fully managed relational database services that make it easier to set up, operate, and scale a relational database in the AWS Cloud.
If you want to take advantage of advanced search capabilities like full-text and vector search on the transactional data in Aurora/Amazon RDS, you can now use Data Prepper to synchronize data from Aurora and Amazon RDS with OpenSearch.

Data Prepper's new `rds` source first exports existing data from Aurora/Amazon RDS tables to OpenSearch indexes and then streams incremental changes from those tables in order to maintain data consistency between the relational database and OpenSearch.
The `rds` source currently supports the Aurora MySQL, Aurora PostgreSQL, RDS MySQL, and RDS PostgreSQL engines.

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

## Amazon SQS as a source

Data Prepper now supports a new Amazon Simple Queue Service (Amazon SQS) source for reading events from SQS queues.
Amazon SQS is a fully managed message queue.
The new `sqs` source in Data Prepper efficiently receives messages from Amazon SQS to create events that you can route to sinks.

Data Prepper receives SQS messages from an SQS queue in batches and then creates Data Prepper events from those SQS messages.
By default, Data Prepper will create a single Data Prepper event per SQS message.
Data Prepper provides a robust collection of [processors](https://docs.opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/processors/) that you can use to parse or grok, depending on the format of your message.

To help reduce your Amazon SQS costs, you can instead design your SQS data and configure Data Prepper to support multiple events per message.
Using this approach reduces your Amazon SQS costs by combining data into SQS messages, allowing for fewer SQS sends and receives.
To take this approach, you must design your sending application to send SQS messages to Amazon SQS in a format available as a [Data Prepper codec](https://docs.opensearch.org/docs/latest/data-prepper/pipelines/configuration/sources/s3/#codec).
Then you can configure your Data Prepper pipeline to use that codec to parse the message into multiple events.

## Other features and improvements

This release also includes several additional features to help you create pipelines:

* The `rename_keys` processor can now rename keys with variable names using a regex pattern.
* The `opensearch` sink now supports new index types for OTel logs and metrics.
* Data Prepper expressions now support slashes (`/`) in the key by allowing you to escape the `/` character.


## Next steps

Work is continuing on Data Prepper, with a few new features upcoming. One exciting feature is the integration of ML Commons and Amazon Bedrock into Data Prepper pipelines. This feature is provided through a new machine learning (ML) inference processor and the Amazon Simple Storage Service (Amazon S3) source and sink. The feature is currently in development and is available for experimental use in version 2.11.


See the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221/views/1) for more information on upcoming features.

## Thanks to our contributors!

Thanks to the following community members who contributed to this release!

* [akshay0709](https://github.com/akshay0709) -- Akshay Pawar
* [chenqi0805](https://github.com/chenqi0805) -- Qi Chen
* [dinujoh](https://github.com/dinujoh) -- Dinu John
* [divbok](https://github.com/divbok) -- Divyansh Bokadia
* [dlvenable](https://github.com/dlvenable) -- David Venable
* [FedericoBrignola](https://github.com/FedericoBrignola)
* [Galactus22625](https://github.com/Galactus22625) -- Maxwell Brown
* [graytaylor0](https://github.com/graytaylor0) -- Taylor Gray
* [janhoy](https://github.com/janhoy) -- Jan Høydahl
* [jmsusanto](https://github.com/jmsusanto) -- Jeremy Michael
* [juergen-walter](https://github.com/juergen-walter) -- Jürgen Walter
* [KarstenSchnitter](https://github.com/KarstenSchnitter) -- Karsten Schnitter
* [kkondaka](https://github.com/kkondaka) -- Krishna Kondaka
* [MohammedAghil](https://github.com/MohammedAghil) -- Mohammed Aghil Puthiyottil
* [oeyh](https://github.com/oeyh) -- Hai Yan
* [RashmiRam](https://github.com/RashmiRam) -- Rashmi
* [Rishikesh1159](https://github.com/Rishikesh1159) -- Rishikesh
* [saketh-pallempati](https://github.com/saketh-pallempati) -- Saketh Pallempati
* [san81](https://github.com/san81) -- Santhosh Gandhe
* [sb2k16](https://github.com/sb2k16) -- Souvik Bose
* [seschis](https://github.com/seschis) -- Shane Schisler
* [shenkw1](https://github.com/shenkw1) -- Katherine Shen
* [srikanthjg](https://github.com/srikanthjg) -- Srikanth Govindarajan
* [TomasLongo](https://github.com/TomasLongo) -- Tomas
* [Zhangxunmt](https://github.com/Zhangxunmt) -- Xun Zhang
