---
layout: post
title:  "Announcing Data Prepper 2.3.0"
authors:
- dlv
- kkondaka
date: 2023-05-25 21:30:00 -0700
categories:
  - releases
meta_keywords: Data Prepper 2.3.0
meta_description: Data Prepper 2.3.0 with enhancements to expressions, event tagging, enhancements to add_entries processor, s3 sink and tail sampling processor
---

Data Prepper 2.3.0 is now available for [download](https://opensearch.org/downloads.html#data-prepper)!
This release introduces a number of changes that help with Data Prepper’s ability to process complex expressions with functions, arithmetic and string operations.

## Enhancements to Data Prepper expressions

DataPrepper 2.3 supports using functions in expressions. List of functions supported are can be found  at https://github.com/opensearch-project/data-prepper/blob/main/docs/expression_syntax.md

DataPrepper 2.3 supports three types of expressions

* Conditional expressions
    * Conditional expressions evaluate to a result of Boolean type. The expressions can now have functions in them. For example, length(/message) > 20 would evaluate to true if length of the message field in the event is greater than 20 other wise it evaluates to false. 
* Arithmetic expressions
    * Arithmetic expressions evaluate to a result of Integer or Float type. The expressions can have simple arithmetic operators like `+,-,*,/` with functions or json pointers or literals as operands. For example, the following expression will add the length of message field of type string in the event with the value of event metadata with key integerField and subtracts 1 from it

 `length(/message) + getMetadata("integerField") - 1`

* String expressions
    * String expressions evaluate to a result of String type. String concatenation operator is supported in addition to using functions or json pointers or literals as operands. For example, the following expression will add the message1 field of type string in the event with message2 field of type string in the event  and appends suffix to it.

`/message1 + /message2 + "suffix"`

## Event Tagging

DataPrepper 2.3 supports tagging events while using grok processor. Events can be tagged optionally using the following configuration

```
processor:
   - grok: 
        match:
          message: <pattern>
        tags_on_match_failure: ["grok_match_fail", "another_tag"]
```

Presence of tags can be checked in conditional expressions in different processors or routing using `hasTags()` function to do conditional ingestion. For example, a conditional expression checking for presence of tag `grok_match_fail` would be `hasTags("grok_match_fail")`

## Enhancements to `add_entries` processor

### Expression based value

`add_entries` processor is enhanced to support adding values based on expression where the return type can be Boolean or Integer/Float or String. An example `add_entries` processor configuration with `value_expression` option  

```
processor:
   - add_entries:
       entries:
         - key: "request_len"
           value_expression: "length(/request)"  
```

This configuration adds an entry with key `request_len` with value equal to the length of the request field in the key. The value expression can be any of the expressions supported (see [expression syntax](https://github.com/opensearch-project/data-prepper/blob/main/docs/expression_syntax.md) for more details)

### Setting Event Metadata keys

`add_entries` processor can also add entries in the event’s metadata instead of the event itself. And example `add_entries` processor configuration for adding an entry to metadata 

```
processor:
   - add_entries:
       entries:
         - metadata_key: "request_len"
           value_expression: "length(/request)"  
```
This configuration adds an attribute to event metadata with attribute key `request_len` with value equal to the length of the request field in the key. The value can be set using value or format or `value_expression` option of entries field.


## S3 Sink

Data Prepper now supports saving data to Amazon S3 sinks as njson. Amazon S3 is a popular choice for storing large volumes of data reliably and in a cost-effective way.

Ingesting data into S3 offers a lot of possibilities for your data pipelines, including some of the following:

* Noisy or uninteresting data can be routed to S3 and not to OpenSearch to reduce load on your OpenSearch cluster. This can also help you save on compute and storage costs.
* Ingesting data to S3 creates data which you can use for future processing.


## Tail Sampling

Data Prepper 2.3.0 supports tail sampling to limit the number of events that are sent to a sink similar to the tail sampling support provided by open telemetry. More details tail sampling in open telemetry can be found [here](https://opentelemetry.io/blog/2022/tail-sampling/).

Tail processing in Data Prepper is supported as an action to aggregate processor. The events are stored in the aggregate processor beyond the `group_duration` time until no events are received in the last `wait_period` time. 

For example, the following configuration sends all traces with errors to the sink and non-error events are sampled with the user specified `percent` probabilistic sampler. 

```
trace-normal-pipeline:
  source:
    otel_trace_source:
      ssl: false
  processor:
    - trace_peer_forwarder:  
  processor:
    - aggregate:
        identification_keys: ["traceId"]
        action:
          tail_sampler:
            percent: 20
            wait_period: "15s"
            error_condition: "/traceGroupFields/statusCode == 2"
        group_duration: "30s"
 sink:
    - opensearch
         hosts: ["https://opensearch:9200"]
         insecure: true
         username: "admin"
         password: "admin"
         index: sampled-traces

```

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
* [oeyh](https://github.com/oeyh) - Hai Yan
* [udaych20](https://github.com/udaych20) - Uday Chintala 
* [deepaksahu562](https://github.com/deepaksahu562) - Deepak Sahu
* [ajeeshakd](https://github.com/ajeeshakd) - Ajeesh Gopalakrishnakurup
* [rajeshLovesToCode](https://github.com/rajeshLovesToCode) - Rajesh
* [umayr-codes](https://github.com/umayr-codes) - Umair Husain
