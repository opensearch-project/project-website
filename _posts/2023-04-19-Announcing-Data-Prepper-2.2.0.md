---
layout: post
title:  "Announcing Data Prepper 2.2.0"
authors:
- dvenable
date: 2023-04-19 14:30:00 -0500
categories:
  - releases
meta_keywords: Data Prepper 2.2.0
meta_description: Data Prepper 2.2.0 improves data delivery assurances with end-to-end acknowledgments and an S3 DLQ.
---

Data Prepper 2.2.0 is now available for [download](https://opensearch.org/downloads.html#data-prepper)!
This release introduces a number of changes that help with Data Prepper’s reliability and data delivery assurances.

## S3-based dead-letter queue for OpenSearch

Prior to Data Prepper 2.2.0, the `opensearch` sink could only write failed events to a local file. 
This required logging in to your cloud instance or machine to retrieve failed events as well creating a different infrastructure to export them.

Now the `opensearch` sink can write documents from failed events directly into Amazon Simple Storage Service (Amazon S3) objects.
You can now use these objects as an alternate dead-letter-queue (DLQ). 
This helps you analyze event failures without having to retrieve them locally. 
Furthermore, users that run on a serverless infrastructure can avoid maintaining a persistent fail state on serverless machines.

## End-to-end acknowledgments for S3 source

Data Prepper's `s3` source now support end-to-end acknowledgments.

Before end-to-end acknowledgments, the `s3` source would only acknowledge event delivery with Amazon Simple Queue Service (Amazon SQS) after writing all events to a Data Prepper buffer. 
In cases where Data Prepper was unable to write to OpenSearch, the SQS message would still be acknowledged, and Data Prepper would not read for the object.

With end-to-end acknowledgments, the `s3` source does not acknowledge completion until all events are sent to an OpenSearch index or the `opensearch` sink's DLQ. 
If the `s3` source receives no acknowledgment, the SQS message remains in the SQS queue for reprocessing.

For Data Prepper 2.2.0, end-to-end acknowledgments are only supported inside the `s3` source because acknowledgments to `s3` are asynchronous. 
However, we've designed end-to-end acknowledgments so that they could be used in other sources. 
If you would like to see additional sources added for this feature,  
[create a GitHub issue](https://github.com/opensearch-project/data-prepper/issues/new/choose).

## Writing to Amazon OpenSearch Serverless

Data Prepper can write events to an 
[Amazon OpenSearch Serverless](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-overview.html) 
collection, giving Amazon OpenSearch Serverless users the ability to use Data Prepper to ingest log data.


## Other features

* Added a new `list_to_map` processor, which converts lists of objects to maps.
* Added support for format strings in the `add_entries` processor.
* Added support to the `s3` source for reading S3 objects using [Amazon S3 Select](https://docs.aws.amazon.com/AmazonS3/latest/userguide/selecting-content-from-objects.html). With this feature, you can read Parquet files in Data Prepper or filter the data in S3 Select before it ever even reaches Data Prepper.

## Getting started

* To download Data Prepper, see the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/2.6/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.3, see the [Data Prepper roadmap](https://github.com/opensearch-project/data-prepper/projects/1).


## Thanks to our contributors!

The following people contributed to this release. Thank you!

* [ashoktelukuntla](https://github.com/ashoktelukuntla) - Ashok Telukuntla
* [asifsmohammed](https://github.com/asifsmohammed) - Asif Sohail Mohammed
* [chenqi0805](https://github.com/chenqi0805) - Qi Chen
* [cmanning09](https://github.com/cmanning09) - Christopher Manning
* [dlvenable](https://github.com/dlvenable) - David Venable
* [engechas](https://github.com/engechas) - Chase Engelbrecht
* [graytaylor0](https://github.com/graytaylor0) - Taylor Gray
* [kkondaka](https://github.com/kkondaka) - Krishna Kondaka
* [KrishnanandSingh](https://github.com/KrishnanandSingh) - Krishnanand Singh
* [livekn](https://github.com/livekn) - Toby Lam
* [oeyh](https://github.com/oeyh) - Hai Yan
* [roshan-dongre](https://github.com/roshan-dongre) - Roshan Dongre 
* [udaych20](https://github.com/udaych20) - Uday Chintala 
