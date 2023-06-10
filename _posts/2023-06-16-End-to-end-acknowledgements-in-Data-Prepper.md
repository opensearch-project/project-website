---
layout: post
title:  "End-to-end acknowledgements in Data Prepepr"
authors:
- kkondaka
- dlv
date: 2023-06-16 10:00:00 -0700
categories:
  - technical-post

meta_keywords: Data Prepper, end-to-end acknowledgements
meta_description: Learn how Data Prepper end-to-end acknowledgements provide data durability by making sure that data is delivered to the sink before the source is notified

---

## The need: Improving durability


[Data Prepper](https://opensearch.org/docs/latest/data-prepper/index/) is an open-source data collector. You can use Data Prepper to ingest data into OpenSearch clusters. With Data Prepper, you can filter, enrich, normalize, and transform the data going into your OpenSearch cluster. 

Data Prepper comes with an in-memory buffer which allows for fast processing of large volumes of data. Besides throughput, another quality that users often seek in in Data Prepper is data durability. They want to ensure that data received by Data Prepper reaches the desired sink.

Several challenges arise with data durability. For example, Data Prepper may exhaust memory or other system resources, or the hardware running Data Prepper may fail. The maintainers of Data Prepper and ther teams have observed that the most common hindrance to data durability is the sink. If the OpenSearch cluster is unable to receive data either due to temporary stress on the cluster or if it is underscaled, then Data Prepper cannot send data to the destination sink. 

We have also considered the sources of data. In particular, we have noticed that the Amazon S3 source is already reading data from a highly durable store. Keeping these observations in mind we realized that if Data Prepper fails to deliver data to OpenSearch, it can retry reading from S3. We just need to know when the data is written before deleting the SQS message that notifies Data Prepper of an available S3 object to consume.

## Our solution: End-to-end acknowledgements

Data Prepper provides data durability through the use of end-to-end acknowledgements. When a Data Prepepr source is configured to use end-to-end acknowledgements, the source is notified only when the data is successfully delivered to the sink. If the source receives end-to-end acknowledgments, it can take appropriate actions such as removing SQS messages that have been successfully delivered to the sink or incrementing the commit offset in case of Kafka source. If end-to-end acknowledgements are not received, the source may retry operation or notify the external source of the failure. The following picture illustrates the control flow when a Data Prepper source is configured to use end-to-end acknowledgements. 

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

In certain scenarios, when Data Prepper sinks are configured with Dead Letter Queue (DLQ), eventsthat cannot be delivered to the external sink (such as OpenSearch) are written to the DLQ. When end-to-end acknowledgements are enabled, successfully writing the events to the DLQ (after failing to deliver them to the external sink) is considered a successful completion of event delivery. In this case, a positive acknowledgement is delivered to the acknowledgment set, indicating successful processing and handling of the event.


## Moving forward: Conclusion and next steps

End-to-end acknowledgments offer robust data durability when utilizing Data Prepper for data processing and ingestion. However, there are a couple of important considerations regarding this feature:

Firstly, it's worth noting that end-to-end acknowledgments are not currently compatible with stateful aggregations. The maintainers of Data Prepper have plans to delve into this area and explore potential solutions in future iterations.

Secondly, in order to leverage end-to-end acknowledgments, source plugins need to integrate with the acknowledgment system. Currently, the S3 source is the only source plugin offering this functionality. However, the capability is designed to expand to encompass additional sources and is particularly well-suited for pull-based sources. There is ongoing development of a new Kafka source that is a promising candidate for utilizing these acknowledgments. Some community members have also expressed interest in applying these acknowledgments to push-based sources like HTTP. This is an area that the maintainers intend to investigate further in the future. 

If you have data stored in S3 that you wish to ingest into OpenSearch, we highly encourage you to try out Data Prepper’s end-to-end acknowledgments feature which is available for use now. As always, feedback and contributions are welcomed and valued by the Data Prepper community.

