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

## Jira/Confluent source

TODO: Santhosh

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
