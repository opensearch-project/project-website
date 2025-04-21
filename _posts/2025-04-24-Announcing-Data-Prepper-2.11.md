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
excerpt: 
meta_keywords: 
meta_description: 
---

## Introduction

Data Prepper 2.11 is now available for download!
This release includes a number of great improvements to help you ingest data into OpenSearch.
Some major changes include new sources for data and better OpenTelemetry support.


## Open Telemetry improvements

TODO: Krishna

## Jira/Confluent source

TODO: Santhosh

## Amazon Aurora/RDS as a source

[Amazon Aurora](https://aws.amazon.com/rds/aurora/) and [Amazon RDS](https://aws.amazon.com/rds/) are fully managed relational database services that make it easier to set up, operate, and scale a relational database in the AWS Cloud. 
For those who want to take advantage of advanced search capabilities like full-text and vector search on the transactional data in Amazon Aurora/RDS, you can now use Data Prepper to synchronize data from Aurora and RDS to OpenSearch.

Data Prepper’s new `rds` source first exports existing data from Amazon Aurora/RDS tables to OpenSearch indices, then streams incremental changes from those tables to keep the data consistent between the relational database and OpenSearch. 
The `rds` source currently supports Aurora MySQL, Aurora PostgreSQL, RDS MySQL, and RDS PostgreSQL engines.


The following is an example configuration:

```
aurora-mysql-pipeline:
  source:
    rds:
      db_identifier: "<<cluster-id>>"
      engine: aurora-mysql
      database: "<<database-name>>"
      # Optional: use include/exclude options to specify the tables to ingest
      # tables:
        # include:
        #   - "<<table1>>"
        #   - "<<table2>>"
        # exclude:
        #   - "<<table3>>"
        #   - "<<table4>>"
      s3_bucket: "<<bucket-name>>"
      s3_region: "<<bucket-region>>"
      # Optional s3_prefix for Opensearch ingestion to write the records
      # s3_prefix: "<<path_prefix>>"
      export:
        kms_key_id: "<<kms-key-id>>"
        export_role_arn: "<<arn:aws:iam::123456789012:role/Export-Role>>"
      stream: true
      aws:
        sts_role_arn: "<<arn:aws:iam::123456789012:role/Example-Role>>"
        region: "<<us-east-1>>"
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

TODO: David


## Next steps

TODO: David

## Thanks to our contributors!

TODO: David
