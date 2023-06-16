---
layout: post
title:  "End-to-end acknowledgements in Data Prepper"
authors:
- kkondaka
- dlv
date: 2023-06-19 10:00:00 -0700
categories:
  - technical-post

meta_keywords: Data Prepper E2E, Data Prepper sink, Data Prepper pipeline as the sink
meta_description: Learn how Data Prepper provides data durability through the use of end to end acknowledgements by delivering data to the sink before notifying the source.

---

[Data Prepper](https://opensearch.org/docs/latest/data-prepper/index/) is an open-source data collector used to ingest data into OpenSearch clusters. While Data Prepper has an in-memory buffer that allows for fast throughput, users also want improved data durability, particularly, confirmation that the data received by Data Prepper reaches the desired sink. To solve challenges with data durability, Data Prepper now has capability to use end-to-end acknowledgements.

## The need: Improving data durability 

The Data Prepper maintainers and their teams have observed that a common challenge to data durability is the reliability of the ingestion pipeline. For example, if the OpenSearch cluster cannot receive data because of temporary stress on the cluster or underscaling, then Data Prepper cannot send data to the destination sink. Further, Data Prepper may exhaust memory or other system resources or the hardware running Data Prepper may fail resulting the data loss during the ingestion.

To solve these challenges, we must consider the data sources themselves. For example, the Amazon S3 source can read data from a highly durable store. When observing this, we realized that if Data Prepper fails to deliver data to OpenSearch, Data Prepper can retry reading data from Amazon S3. This, however, requires knowing when the data is written before deleting the SQS message that notifies Data Prepper of an available S3 object to consume.


## Our solution: End-to-end acknowledgements

Data Prepper provides data durability through the use of end-to-end acknowledgements. When a Data Prepper source is configured to use end-to-end acknowledgements, the source is notified only when the data is successfully delivered to the sink. If the source receives end-to-end acknowledgments, it can take appropriate actions such as removing SQS messages that have been successfully delivered to the sink or incrementing the commit offset in case of Kafka source. If end-to-end acknowledgements are not received, the source may retry operation or notify the external source of the failure. The following picture illustrates the control flow when a Data Prepper source is configured to use end-to-end acknowledgements.

<img src="/assets/media/blog-images/2023-06-16-end-to-end-acknowledgements/end-to-end-acknowledgements.png" alt="End-to-end acknowledgements diagram"/>{: .img-fluid}


1. Data Prepper source receives a batch of records from an external source (such as Amazon S3).
2. When a Data Prepper source is configured with end-to-end acknowledgements, the source creates an AcknowledgementSet along with a callback function for each batch of records received from the external source. The Source converts the records to Data Prepper events
3. Each event in the batch is added to the AcknowledgementSet, and a reference to the AcknowledgementSet is kept in the event as a handle
4. Events are then passed to the ingestion pipeline, which consists of multiple processors that transform, filter, enrich the data in the event
5. If an event is dropped in the processors, the AcknowledgementSet is notified of the completion of the event when the event handle is released
6. All the events that are not dropped are sent to the Data Prepper sink
7. The Data Prepper sink sends the events to the external sink (such as OpenSearch Cluster)
8. When events are successfully sent to the external sink, the AcknowledgementSet is notified of the event's completion when the event handles are released.
9. When the AcknowledgementSet has no pending events, it invokes the callback function
10. The callback function notifies the external source about the successful delivery of the batch of records

If all events are not successfully delivered to the external sinks, AcknowledgementSet will retain some events that have not been released. Each AcknowledgementSet has an expiry time, and if all events are not released before the expiry time, the AcknowledgementSet is freed, and external source is not notified of the delivery of the records. This situation may trigger Data Prepper source or the external source to take corrective action, such as retrying the ingestion of the records again.

Data Prepper supports multiple pipelines and events can be routed to different pipelines based on the configuration and the data within the events. Additionally, each event may be routed to multiple pipelines that eventually send data to different sinks. However, in some cases, multiple copies of the same event are not created when it is routed to multiple pipelines/sinks. This poses a challenge when tracking acknowledgements because multiple acknowledgements are required for the same event. To address this issue, reference counts are maintained for events that are routed to multiple pipelines. When an event handle is released (either in the step 5 or step 8), the reference count is decremented. The event is considered completed and the handle is removed from the AcknowledgementSet only when the reference count reaches zero, indicating the successful delivery of the event to all sinks. This approach ensures accurate tracking of acknowledgements for events routed to multiple pipelines.

Data Prepper also provides support for sending negative acknowledgements to indicate explicit failure. The callback function can examine the acknowledgement status, whether it is positive or negative, and take appropriate action based on that information.

In certain scenarios, when Data Prepper sinks are configured with a Dead Letter Queue (DLQ), events that cannot be delivered to the external sink, such as OpenSearch, are written to DLQ. When end-to-end acknowledgements are enabled, successfully writing the events to the DLQ (after failing to deliver them to the external sink) is considered a successful completion of event delivery. In this case, a positive acknowledgement is delivered to the AcknowledgmentSet, indicating successful event processing and handling.


## Moving forward: Conclusion and next steps

End-to-end acknowledgments offer robust data durability when using Data Prepper for data processing and ingestion. Some considerations, however, are necessary:

1. End-to-end acknowledgments currently are not compatible with stateful aggregations. The Data Prepper maintainers are considering this issue and exploring solutions for release in future iterations.

2. To leverage end-to-end acknowledgments, source plugins must integrate with the acknowledgment system. Currently, the Amazon S3 source is the only source plugin with this functionality. However, the capability is designed to expand to include additional sources and is well-suited for pull-based sources. Ongoing development of a new Kafka source is showing to be a promising candidate for using these acknowledgments. Users also have expressed interest in applying these acknowledgments to push-based sources like HTTP, which is an area maintainers are exploring.

If you have data stored in Amazon S3 and would like to ingest it into OpenSearch, try out the Data Prepper end-to-end acknowledgments feature. As always, the Data Prepper community appreciates your feedback and contributions.

A brief description of the feature, how to enable it for the sources that currently support the feature, and details on how to add end-to-end acknowledgements to new or other sources can be found [here](https://github.com/opensearch-project/data-prepper/blob/main/docs/end_to_end_acknowledgements.md).

Share your [feedback and comments](https://github.com/opensearch-project/data-prepper/issues) on the overall goals, user-experience, architecture of this feature.
