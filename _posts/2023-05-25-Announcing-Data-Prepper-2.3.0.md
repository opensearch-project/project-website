---
layout: post
title:  "Announcing Data Prepper 2.3.0"
authors:
- kkondaka
- dvenable
date: 2023-06-06 10:00:00 -0700
categories:
  - releases
meta_keywords: Data Prepper expressions, tail sampling in Data Prepper, Amazon S3 Sink
meta_description: Learn how Data Prepper 2.3.0 improves the ability to process complex expressions, supports event tagging, enhances the add entries processor, and supports Amazon S3 sink. Download it now.
---

Data Prepper 2.3.0 is now available for [download](https://opensearch.org/downloads.html#data-prepper)!
This release introduces a number of changes that improve Data Prepper’s ability to process complex expressions with functions, arithmetic operations, and string operations.

## Enhancements to Data Prepper expressions

Data Prepper 2.3 supports using functions in expressions. A list of supported functions is available in the [Expression syntax](https://opensearch.org/docs/latest/data-prepper/pipelines/expression-syntax/) documentation.

Data Prepper 2.3 supports three types of expressions; [conditional](#conditional-expressions), [arithmetic](#arithmetic-expressions), and [string](#string-expressions).

### Conditional expressions

 Conditional expressions evaluate to a result of Boolean type, and the expressions can now have functions in them. For example, `length(/message) > 20` would evaluate to true if the length of the message field in the event is greater than 20. Otherwise it evaluates to false.

### Arithmetic expressions

Arithmetic expressions evaluate to a result of integer or float type. The expressions can have simple arithmetic operators like `+,-,*,/`, with functions, JSON pointers, or literals as operands. For example, the following expression adds the length of `message` field in the event with the value of `integerField` in the event metadata and subtracts 1 from it.

```
length(/message) + getMetadata("integerField") - 1
```

### String expressions

String expressions evaluate to a result of string type. The string concatenation operator is supported, and it uses functions, JSON pointers, or literals as operands. For example, the following expression concatenates the `message1` field of type string in the event with the `message2` field in the event and appends "suffix" to it:

```
/message1 + /message2 + "suffix"
```

## Event tagging

Data Prepper 2.3 supports tagging events while using the `grok` processor. Events can be tagged optionally be tagged using the following configuration:

```
processor:
   - grok:
        match:
          message: <pattern>
        tags_on_match_failure: ["grok_match_fail", "another_tag"]
```

The presence of tags can be checked in conditional expressions in different processors or routing using the `hasTags()` function to perform conditional ingestion. For example, a conditional expression checking for the presence of tag `grok_match_fail` would be `hasTags("grok_match_fail")`.

## Enhancements to `add_entries` processor

The `add_entries` processor has been enhanced to support values with expressions and to set event metadata keys.

### Expression-based value

The [`add_entries`](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/processors/add-entries/) processor has been enhanced to support adding values based on an expression where the return type can be Boolean, integer or float, or string. The following example shows an `add_entries` processor configuration with a `value_expression` option:

```
processor:
   - add_entries:
       entries:
         - key: "request_len"
           value_expression: "length(/request)"
```

This configuration adds an entry with the key `request_len` with a value equal to the length of the request field in the key. The value expression can be any of the expressions supported. See [Supported operators](https://github.com/opensearch-project/data-prepper/blob/main/docs/expression_syntax.md) for more details.

### Setting event metadata keys

The `add_entries` processor can add entries in the event’s metadata instead in the event itself. The following example shows an `add_entries` processor configuration for adding an entry to metadata:

```
processor:
   - add_entries:
       entries:
         - metadata_key: "request_len"
           value_expression: "length(/request)"
```
This configuration adds an attribute to event metadata with the attribute key `request_len` with value equal to the length of the request field in the key. The value can be set using the value, format, or `value_expression` options of the entries field.


## Amazon S3 sink

Data Prepper now supports saving data to Amazon Simple Storage Service (Amazon S3) sinks as Newline delimited JSON (ndjson). Amazon S3 is a popular choice for storing large volumes of data reliably and cost effectively.

Ingesting data into Amazon S3 offers many possibilities for your data pipelines, including some of the following:

* Noisy or uninteresting data can be routed into Amazon S3 and not to OpenSearch in order to reduce load on your OpenSearch cluster. This can help you save on compute and storage costs.
* Ingestion data into Amazon S3 to have normalized data on-hand that you can use for future processing.


## Tail sampling

Data Prepper 2.3.0 supports tail sampling to limit the number of events that are sent to a sink, similar to the tail sampling support provided by OpenTelemetry. For information about tail sampling in [OpenTelemetry](https://opentelemetry.io), see the blog post ["Tail Sampling with OpenTelemetry: Why it’s useful, how to do it, and what to consider"](https://opentelemetry.io/blog/2022/tail-sampling/).

Tail processing in Data Prepper is supported as an action to the `aggregate` processor. The events are stored in the `aggregate` processor beyond the `group_duration` time until no events are received in the last `wait_period` time.

For example, the following configuration sends all traces with errors to the sink and non-error events are sampled with the user-specified `percent` probabilistic sampler:

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

## Obfuscate processor:

Data Prepper 2.3.0 supports obfuscation of sensitive data by replacing specified field's value with mask character(s). For example, the following configuration obfuscates pattern matching values for the key specified in the field `source`. If no pattern is specified, the entire value corresponding to the key specified in the field `source` is obfuscated.

```
processor:
  - obfuscate:
      source: "log"
      target: "new_log"
      patterns:
        - "[A-Za-z0-9+_.-]+@([\\w-]+\\.)+[\\w-]{2,4}"
      action:
        mask:
          mask_character: "#"
          mask_character_length: 6
  - obfuscate:
      source: "phone"
```


## Getting started

* To download Data Prepper, see the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.4, see the [Data Prepper roadmap](https://github.com/orgs/opensearch-project/projects/221).


## Thanks to our contributors!

The following community members contributed to this release. Thank you!

* [ajeeshakd](https://github.com/ajeeshakd) - Ajeesh Gopalakrishnakurup
* [ashoktelukuntla](https://github.com/ashoktelukuntla) - Ashok Telukuntla
* [asifsmohammed](https://github.com/asifsmohammed) - Asif Sohail Mohammed
* [chenqi0805](https://github.com/chenqi0805) - Qi Chen
* [cmanning09](https://github.com/cmanning09) - Christopher Manning
* [daixba](https://github.com/daixba) - Aiden Dai
* [deepaksahu562](https://github.com/deepaksahu562) - Deepak Sahu
* [dlvenable](https://github.com/dlvenable) - David Venable
* [engechas](https://github.com/engechas) - Chase Engelbrecht
* [graytaylor0](https://github.com/graytaylor0) - Taylor Gray
* [kkondaka](https://github.com/kkondaka) - Krishna Kondaka
* [oeyh](https://github.com/oeyh) - Hai Yan
* [rajeshLovesToCode](https://github.com/rajeshLovesToCode) - Rajesh
* [tmonty12](https://github.com/tmonty12) - Thomas Montfort
* [udaych20](https://github.com/udaych20) - Uday Chintala
* [umayr-codes](https://github.com/umayr-codes) - Umair Husain
* [wanghd89](https://github.com/wanghd89)
