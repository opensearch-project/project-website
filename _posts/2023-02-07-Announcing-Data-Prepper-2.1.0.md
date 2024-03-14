---
layout: post
title:  "Announcing Data Prepper 2.1.0"
authors:
- kkondaka
- nsifmoh
- dvenable
date: 2023-03-02 14:30:00 -0500
categories:
  - releases
meta_keywords: Data Prepper 2.1.0, OpenTelemetry metrics, OpenTelemetry logs, detect anomalies in logs and traces, sampling and rate limiting
meta_description: Data Prepper 2.1.0 improves performance and stability with enhancements such as generated metrics, anomaly detection, sampling and limiting, and more.
---

Data Prepper 2.1.0 is now available for [download](https://opensearch.org/downloads.html#data-prepper)! This release
adds several new features to Data Prepper. Additionally, the maintainers have improved Data Prepper’s 
stability and performance. Many of the new features 
came from community contributions in the form of GitHub issues and pull requests.

## Generated metrics

By creating metrics for logs and traces that pass through Data Prepper, the performance and scalability of OpenSearch 
(data store, search engine, and visualization) can be significantly enhanced. The ability to generate metrics enables the 
summarization of events over a specific time period, making it easier to visualize and set alerts, as opposed to utilizing 
raw data for visualization and alerting.

Data Prepper 2.1 supports generating OpenTelemetry-format metrics from all incoming events. The Data Prepper aggregate 
processor has two new actions that support the generation of metrics for logs and traces:

- The `histogram` action generates a histogram of the data field being aggregated. The histogram data includes total 
count, min, max, and sum, in addition to the histogram buckets and bucket-level counts.

- The `count` action generates a count of the data being aggregated.

You can combine both of these actions with the aggregate processor’s conditional aggregation option in order to generate more meaningful metrics.

For example, you can obtain the number of traces with an error (`status_code` equal to 2) using the `count` aggregate action along 
with the `aggregate_when` option. You can also generate a histogram of trace latencies using another aggregate processor in 
a parallel sub-pipeline.

The pipeline configuration for the preceding example is similar to the following:

```
trace-error-metrics-pipeline:
  source:
    pipeline:
      name: "span-pipeline"
  processor:
    - aggregate:
        identification_keys: ["serviceName", "traceId"]
        action:
          count:
        group_duration: "20s"
        aggregate_when: "/status_code == 2"
  sink:
     - opensearch
         hosts: ["https://opensearch:9200"]
        insecure: true
        username: "admin"
        password: "admin"
        index: trace-error-metrics
        
 trace-high-latency-metrics-pipeline:
  source:
    pipeline:
      name: "span-pipeline"
  processor:
    - aggregate:
        identification_keys: ["serviceName", "traceId"]
        action:
          histogram:
            key: "durationInNaos"
            record_minmax: true
            units: "nanoseconds"
            buckets: [1000000000, 1500000000, 2000000000]
        group_duration: "20s"
        aggregate_when: "/durationInNanos > 1000000000"
  sink:
      - opensearch
         hosts: ["https://opensearch:9200"]
         insecure: true
         username: "admin"
         password: "admin"
         index: trace-high-latency-metrics
```

## Anomaly detection

Data Prepper 2.1 introduces anomaly detection as an independent processor that can be placed anywhere in the pipeline to
detect anomalies using artificial intelligence/machine learning (AI/ML) techniques. For now, the processor only supports the random cut forest algorithm for detecting anomalies. 
Support for other AI/ML algorithms may be added in the future. The processor can be configured to use any numerical (integer 
or floating-point data type) field in the input events to detect anomalies.

Anomaly detection in Data Prepper provides a more scalable and efficient way to detect anomalies in logs and traces 
because the ML algorithm is applied on the server side.

For example, consider an aggregate processor that generates a histogram of trace latencies (`durationInNanos`). If you place an anomaly detector processor after the aggregate processor, it can identify abnormally high latencies. 
The following is an example of such a configuration:

```
trace-metric-anomaly-detector-pipeline:
  source:
    pipeline:
      name: "trace-high-latency-metrics-pipeline"
  processor:
    - anomaly_detector:
        keys: ["max"]
        mode:
          random_cut_forest:
  sink:
    - opensearch
         hosts: ["https://opensearch:9200"]
         insecure: true
         username: "admin"
         password: "admin"
         index: high-latency-traces-with-anomalies
```

## Sampling and rate limiting

Data Prepper 2.1 supports sampling and rate limiting to limit the number of events that are sent to a sink.

These features can be used to reduce the load on the OpenSearch cluster when storing ordinary logs and metrics.
For example, you can limit the number of success HTTP logs or repetitive requests, such as from a health check. 

Both sampling and rate limiting are available as configurable actions in the aggregate processor.
To use sampling, specify the sampling percentage
To use rate limiting, set the events per second option

For example, the following percent sampling configuration sends 60% of events to OpenSearch:

```
trace-normal-pipeline:
  source:
    pipeline:
      name: "span-pipeline"
  processor:
    - aggregate:
        identification_keys: ["serviceName"]
        action:
          percent_sampler:
            percent: 60
        group_duration: "30s"
        aggregate_when: "/status_code != 2 and /durationInNanos <= 1000000000"
 sink:
    - opensearch
         hosts: ["https://opensearch:9200"]
         insecure: true
         username: "admin"
         password: "admin"
         index: sampled-traces
```

You can configure a rate-limiting action to limit the number of events by specifying the number of events per second.
You can also use the `when_exceeds` option to specify what should happen when the number of events exceeds the specified limit.
The `when_exceeds` option can take the following values:

- `block`: Blocks the current pipeline thread until events are allowed (this is the default value)
- `drop`: Drop any excess events

Setting `when_exceeds` to `block` is useful when there is a temporary burst in the number of events and you don't want to lose any of them.

The following rate-limiting configuration sends 10 events per second to OpenSearch and uses the `drop` option:

```
trace-normal-pipeline:
  source:
    pipeline:
      name: "span-pipeline"
  processor:
    - aggregate:
        identification_keys: ["serviceName"]
        action:
          rate_limiter:
            events_per_second: 10
            when_exceeds: "drop"
        group_duration: "30s"
        aggregate_when: "/status_code != 2 and /durationInNanos <= 1000000000"
 sink:
    - opensearch
         hosts: ["https://opensearch:9200"]
         insecure: true
         username: "admin"
         password: "admin"
         index: sampled-traces
```

## OpenTelemetry logs

One of Data Prepper’s goals is to support open standards. Data Prepper now supports the [OpenTelemetry](https://opentelemetry.io)
log format. Previously, Data Prepper supported log data through the 
[HTTP Source plugin](https://opensearch.org/docs/latest/data-prepper/pipelines/configuration/sources/http-source/), 
which works well with tools such as [Fluent Bit](https://fluentbit.io). If you would like to deploy the 
[OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) on your applications 
and not require any other sidecars, you can now send logs to Data Prepper, which will route them to OpenSearch.


## OpenSearch sink improvements

Running Data Prepper as an ingestion pipeline in front of OpenSearch is an important capability. This 
release adds new enhancements to Data Prepper’s OpenSearch sink to make it even more useful.

Data Prepper now supports routing traces and logs to different indexes dynamically. To achieve this, you can define an 
index name using a format string, which can include properties from different events. With this capability, Data Prepper 
can support an arbitrary number of indexes using a single sink. For example, if you have logs with different 
application identifiers, you can route events to an index specific to each application.

Data Prepper also now allows you to route documents to specific OpenSearch shards using the existing OpenSearch `routing` parameter.
The new `routing_field` property on the OpenSearch sink will use properties from events to specify how to 
route them within OpenSearch. Most users prefer allowing OpenSearch to generate document IDs and choosing the shard 
from that. However, Data Prepper now allows you to specify these values explicitly.

Going hand in hand with the routing field, Data Prepper now lets you specify a complex field to 
use when specifying a document ID. Previously, you could only copy a value to a field in the root of 
the event in order to use it as a document ID.

## Type conversion

Data Prepper now provides a new 
[convert entry](https://github.com/opensearch-project/data-prepper/tree/main/data-prepper-plugins/mutate-event-processors#convertentryprocessor) 
as part of its collection of 
[mutate processors](https://github.com/opensearch-project/data-prepper/tree/main/data-prepper-plugins/mutate-event-processors#mutate-event-processors). 
This feature can convert a value from one type to another. This can be particularly useful in conditional expressions when using conditional routing.

For example, you can use the following processor in a pipeline to convert the value of the `status` key to an `integer`: 

```
...
processor:
  - convert_entry_type:
      key: "status"
      type: "integer"
...
```

## Other improvements

In addition to the new features already described, Data Prepper 2.1.0 introduces several other important improvements:

* Instead of failing, Data Prepper pipelines with OpenSearch sinks now wait for OpenSearch to start during pipeline initialization if the sink is not available.
* OpenSearch sinks now allow you to load index mapping and Index State Management (ISM) template files from an Amazon Simple Storage Service (Amazon S3) bucket.
* Data Prepper expressions now support the `null` value keyword in conditions with equality operators.
* To help with pipeline stability, Data Prepper now provides a circuit breaker on Java heap usage. The circuit breaker will cause the sources to stop accepting new data that could possibly cause the process to crash. 

See the [release notes](https://github.com/opensearch-project/data-prepper/releases/tag/2.1.0) for a full list of changes.

## Getting started

You can [download](https://opensearch.org/downloads.html) Data Prepper or install a Docker container from the OpenSearch Download & Get Started page. The maintainers encourage 
all users to update to Data Prepper 2.1.0 on order to gain the improved stability, additional administrative options, and new features.

Additionally, we have already started working on Data Prepper 2.2. See the [roadmap](https://github.com/opensearch-project/data-prepper/projects/1) to learn more.


