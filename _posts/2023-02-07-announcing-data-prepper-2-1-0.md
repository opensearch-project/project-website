---
layout: post
title:  "Announcing Data Prepper 2.1.0"
authors:
- kkondaka
- nsifmoh
- dlv
date: 2023-02-07 15:00:00 -0500
categories:
  - releases
meta_keywords: Data Prepper 2.1.0, Open Telemetry metrics, OpenTelemetry logs, detect anomalies in logs and traces, sampling and rate-limiting
meta_description: Data Prepper 2.1.0 improves performance and stability with enhancements such as generated metrics, anomaly detection, sampling and limiting, and more.
---

Data Prepper 2.1.0 is now available for [download](https://opensearch.org/downloads.html#data-prepper)! This release provides a number of new features to Data Prepper.  Additionally, the maintainers have improved Data Prepper’s stability and performance. Many of the new features came from community contributions in the form of GitHub issues and pull requests.

## Generated metrics

By creating metrics for logs and traces that pass through the Data Prepper, the performance and scalability of Open Search (data store, search engine, and visualization) can be significantly enhanced. The ability to generate metrics enables the summarization of events over a specific time period, making it easier to visualize and set alerts, as opposed to utilizing raw data for visualization and alerting.

Data Prepper 2.1 supports generating Open Telemetry format metrics from all incoming events. The Data Prepper aggregate processor has two new actions to support the generation of metrics for logs and traces.

The `histogram` action generates a histogram of the data field being aggregated. The histogram data includes total count, min, max, sum in addition to the histogram buckets and bucket level counts. The `count` action generates a count of the data being aggregated.

Both these actions can be combined with aggregate processor’s conditional aggregation option to generate more meaningful metrics.

For example, the number of traces with error (`status_code` equal to 2) be obtained using `count` aggregate action along with `aggregate_when` option. We can also generate a histogram of trace latencies using another aggregate processor in a parallel sub-pipeline.

The pipeline configuration for the above example would look like the following:

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

Data Prepper 2.1 introduces anomaly detection as an independent processor that can be placed anywhere in the pipeline to detect anomalies using AI/ML techniques. It supports only random cut forest algorithm to detect anomalies for now. 
Support for other AI/ML algorithms may be added in future. The processor can be configured to use any numerical (integer or floating point data type) field in the input events to detect anomalies.

Anomaly detection in Data Prepper allows for more scalable and efficient way to detect anomalies in the logs and traces because the ML algorithm is applied on the server side.

For example, the anomaly detector processor placed after aggregate processor that generates histogram of trace latencies (`durationInNanos`) could detect abnormally high latencies. The following anomaly detector processor configuration can be used for it.

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

## Sampling and limiting

Data Prepper 2.1 supports sampling and rate-limiting to limit the number of events that are sent to a Sink.

One possible use case for both these features can be used to reduce the load on the OpenSearch when storing normal (not very interesting) logs and metrics.

Both these features are available as a configurable action in the aggregate processor. Simply choose the appropriate action (sampling or rate limiting) and specify the sampling percent or events per second option as needed.

For example, the following percent sampler configuration sends 60% of the events to OpenSearch:

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

Rate limiter action can be configured to limit the number of events by specifying the number of events per second and optionally what to do when the number of events exceed the specified limit using the `when_exceeds` option. This `when_exceeds` option can take either `block` or `drop` value and can either block until events are allowed or drop any excess events. The `block` is useful if there is a temporary burst and the user do not want to lose any events in that case. The default value for this option is `block`.

And the following rate limiter configuration send 10 events per second to the open search and using `drop` option.

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

## OTel logs

One of Data Prepper’s goals is supporting open standards. Data Prepper now supports the [OpenTelemetry](https://opentelemetry.io) log format. Previously, Data Prepper supported log data through the [HTTP source plugin](https://opensearch.org/docs/latest/data-prepper/configuration/sources/http-source/) which works well with tools such as [FluentBit](https://fluentbit.io). Some users would like to deploy the [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) on their applications and not require any other sidecars. Those users can now start to send logs to Data Prepper and then to OpenSearch.


## OpenSearch sink improvements

Running Data Prepper as an ingestion pipeline in front of OpenSearch is an important capability for Data Prepper. This release now adds hew enhancements to Data Prepper’s OpenSearch sink to make it even more useful with OpenSearch.

Data Prepper now supports routing traces and logs to different indices dynamically. Pipeline authors can define an index name using a format string which can include properties from different events. With this capability, Data Prepper can support an arbitrary number of indices using a single sink. For example, if you have logs with different application identifiers, you could route events to an index specifically for each application.

Data Prepper also now allows routing documents to specific OpenSearch shards by use of the existing `routing` parameter in OpenSearch. The new `routing_field` property on the OpenSearch sink will use properties from events to specify how to route within OpenSearch. Most users will prefer to allow OpenSearch to generate document ids and choose the shard from that. But, in some cases users need to specify these values and now Data Prepper offers users that option.

Going hand-in-hand with the routing field, Data Prepper now allows pipeline authors to specify a complex field to use when specifying a document Id. Previously, a pipeline author would need to copy a value to a field in the root of the event to use it as a document ID.

## Type conversion

Data Prepper now supports a new [convert entry](https://github.com/opensearch-project/data-prepper/tree/main/data-prepper-plugins/mutate-event-processors#convertentryprocessor) processor as part of [mutate processors](https://github.com/opensearch-project/data-prepper/tree/main/data-prepper-plugins/mutate-event-processors#mutate-event-processors) to convert value from one type to another. This can be particularly useful in conditional expressions when using conditional routing.

For example, in the following pipeline using this processor would allow a user to convert value of `status` key to `integer`. 

```
...
processor:
  - convert_entry_type:
      key: "status"
      type: "integer"
...
```

## Other improvements

In addition to the new features already described, Data Prepper 2.1.0 has a few other improvements. We want to highlight a few of them.

* Data Prepper pipelines with OpenSearch sink now waits for OpenSearch to start during pipeline initialization if the sink is not available instead of failing.
* OpenSearch sink now allows users to load index mapping and ISM template files from S3 bucket. Pipeline authors can configure it by providing S3 URI’s in existing configuration option to load them.
* Data Prepper expressions now support `null` value keyword in conditions with equality operators.
* To help with pipeline stability, Data Prepper now supports a circuit breaker on Java heap usage. This will cause the sources to stop accepting new data that could possibly cause the process to crash.
* The documentation team has been updating the [Data Prepper documentation](https://opensearch.org/docs/latest/data-prepper/index/) by migrating many of the details from the GitHub repository into the primary documentation. 

See the [release notes](https://github.com/opensearch-project/data-prepper/releases/tag/2.1.0) for a full list of changes.

## Get started

You can download Data Prepper or install a Docker container from the OpenSearch downloads page. The maintainers encourage all users to update to Data Prepper 2.1.0 to gain the improved stability, administration options, and feature set.

Work is already started on Data Prepper 2.2. Please see the [roadmap](https://github.com/opensearch-project/data-prepper/projects/1) to learn about what is upcoming.