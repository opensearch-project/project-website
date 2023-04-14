---
layout: post
title:  "Announcing Data Prepper 2.2.0"
authors:
- dlv
date: 2023-04-19 14:30:00 -0500
categories:
  - releases
meta_keywords: Data Prepper 2.1.0
meta_description: Data Prepper 2.1.0 improves data delivery assurances with end-to-end acknowledgements and an S3 DLQ.
---

Data Prepper 2.2.0 is now available for [download](https://opensearch.org/downloads.html#data-prepper)!
This release has a number of changes that help with Data Prepper’s reliability and data delivery assurances.

## S3-based dead-letter queue for OpenSearch

Data Prepper’s `opensearch` sink can now write failed documents to an Amazon S3 dead-letter queue (DLQ) to help with analyzing failures. 
Prior to this release, the `opensearch` sink would write to a local file only. 
This required logging into the machine to get these files or creating different infrastructure to export it. 
Now, the sink can write failed events directly to S3. 
This will help users that run on serverless infrastructure to avoid maintaining persistent state on serverless machines.

## End-to-end acknowledgements for S3 source

Data Prepper’s `s3` source now supports end-to-end acknowledgements. 
With this change, the S3 source will not acknowledge completion until the events are sent to either an OpenSearch index or the `opensearch` sink’s DLQ. 
Before this change, the S3 source would acknowledge the event with SQS after writing all the events to the Data Prepper buffer. 
So if Data Prepper is unable to write to OpenSearch, then the SQS message would be acknowledged and Data Prepper would not read the object again. 
Now, the SQS message will remain in the SQS queue for processing again.

The maintainers designed end-to-end acknowledgements so that they could be used in other sources.
The S3 source is a natural first solution because the acknowledgement was inherently asynchronous.
Please [create a GitHub issue](https://github.com/opensearch-project/data-prepper/issues/new/choose) if you would like to have this extended to other sources.


## Writing to Amazon OpenSearch Serverless

Data Prepper can now write events to an [Amazon OpenSearch Serverless](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-overview.html) collection. 
Now users of Amazon OpenSearch Serverless can use Data Prepper for ingesting log data.


## Other features

* Data Prepper has a new processor `list_to_map` which converts lists of objects to maps.
* The `add_entries` processor now supports format strings.
* The S3 Source supports reading S3 objects using [Amazon S3 Select](https://docs.aws.amazon.com/AmazonS3/latest/userguide/selecting-content-from-objects.html). With this feature, you can filter read Parquet files in Data Prepper or filter the data before Data Prepper.

## Getting started

You can [download](https://opensearch.org/downloads.html) Data Prepper or install a Docker container from the OpenSearch Download & Get Started page. 

Work is in progress for Data Prepper 2.3. See the [roadmap](https://github.com/opensearch-project/data-prepper/projects/1) to learn more.

