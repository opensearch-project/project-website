---
layout: post
title:  "Announcing Data Prepper 2.6.0"
authors:
- dvenable
date: 2023-11-28 13:30:00 -0600
categories:
  - releases
meta_keywords: Data Prepper DynamoDB source, Apache Kafka buffer, OpenSearch Serverless network policy
meta_description: With Data Prepper 2.6.0 you can ingest data from DynamoDB, improve data durability using the new Apache Kafka buffer, and automatically connect to Amazon OpenSearch Serverless collections.
---

Data Prepper 2.6.0 is now available for [download](https://opensearch.org/downloads.html#data-prepper).
Now you can now ingest data from DynamoDB, improve data durability by using the new Kafka buffer, and automatically connect to Amazon OpenSearch Serverless collections.


## DynamoDB source

[Amazon DynamoDB](https://aws.amazon.com/dynamodb/) is a high-scale, high-performance key-value database.
Generally, developers will query DynamoDB on the primary index and secondary indexes.
However, many teams would also like to search and analyze data in DynamoDB.
Now you can use Data Prepper and OpenSearch to search and analyze DynamoDB data.

Data Prepper's new `dynamodb` source ingests items from a DynamoDB table so that you can index those items in OpenSearch.
You can import existing data that was backed up by DynamoDB's point-in-time recovery.
For new data, Data Prepper can read from DynamoDB Streams to keep your OpenSearch cluster's data up-to-date with DynamoDB.

The feature supports change data capture (CDC), so it will keep the OpenSearch index up-to-date with DynamoDB.
You can add items, update items, and delete them.
Data Prepper will handle the complicated work of moving this data for you.

## Kafka buffer

Data Prepper provides [end-to-end acknowledgements]({{site.baseurl}}/blog/End-to-end-acknowledgements-in-Data-Prepper) to ensure that data from pull-based sources reaches OpenSearch.
For push-based sources, Data Prepper currently has an in-memory buffer, but there is some risk of losing data when the node crashes.
For these sources, we can improve durability by storing data in an external system instead of locally on the Data Prepper node.

[Apache Kafka](https://kafka.apache.org/) is an open-source event streaming platform.
It is highly durable and can store events for as long as you configure them.
This makes it a great choice for durable storage of events in Data Prepper.

Data Prepper now has a new `kafka` buffer type that uses Kafka to store data in flight.
You can use this feature to send data directly to Data Prepper and hold the data in Kafka before Data Prepper saves it to OpenSearch.

Now existing clients such as the [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) and [Fluent Bit](https://fluentbit.io/) can send data to Data Prepper just as they do now, but with better durability.
You can abstract the internals of how you store data in Data Prepper and won't need to change those client configurations.

Additionally, Data Prepper's `kafka` buffer supports per-event encryption so that you can perform client-side encryption if needed.

## Amazon OpenSearch Serverless improvements

Data Prepper improves integration with [Amazon OpenSearch Serverless](https://aws.amazon.com/opensearch-service/features/serverless/) with new options to update the network policy.
With this feature, you can configure Data Prepper to create an OpenSearch Serverless network policy to your VPC-based collections.
This simplifies some of the setup for developers who have the necessary permissions to create this policy.
This new configuration is available for both the OpenSearch sink and source.

## Other features

* Data Prepper's `s3` source provides duplication protection by extending the visibility timeout for Amazon Simple Queue Service (SQS) messages. We encourage users to add the necessary permissions and use this feature to avoid data duplication.
* The `opensearch` source now allows for configuring a `distribution_version` to connect with ElasticSearch 7 clusters.


## Getting started

* To download Data Prepper, see the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.7, see the [Data Prepper roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

The following people contributed to this release. Thank you!

* [asuresh8](https://github.com/asuresh8) - Adi Suresh
* [asifsmohammed](https://github.com/asifsmohammed) - Asif Sohail Mohammed
* [chenqi0805](https://github.com/chenqi0805) - Qi Chen
* [daixba](https://github.com/daixba) - Aiden Dai
* [dinujoh](https://github.com/dinujoh) - Dinu John
* [dlvenable](https://github.com/dlvenable) - David Venable
* [engechas](https://github.com/engechas) - Chase Engelbrecht
* [graytaylor0](https://github.com/graytaylor0) - Taylor Gray
* [hshardeesi](https://github.com/hshardeesi) – Hardeep Singh
* [KarstenSchnitter](https://github.com/KarstenSchnitter) - Karsten Schnitter
* [kkondaka](https://github.com/kkondaka) - Krishna Kondaka
* [mallikagogoi7](https://github.com/mallikagogoi7)
* [oeyh](https://github.com/oeyh) - Hai Yan
* [Periecle](https://github.com/Periecle) - Roman Kvasnytskyi
* [reta](https://github.com/reta) - Andriy Redko
* [wanghd89](https://github.com/wanghd89)
