---
layout: post
title: 'Data Prepper 2.16: Improved end-to-end metrics'
authors:
  - bagmarnikhil
  - srikanthpadakanti
  - dvenable
date: 2026-06-12
categories:
  - releases
excerpt: Data Prepper 2.16 adds end-to-end metrics with a pull-based Prometheus source and OpenSearch-TSDB, experimental OpenSearch pull-based ingestion, other improvements to the OpenSearch sink, and more.
meta_keywords: OpenSearch Data Prepper, pull-based ingestion, Kafka ingestion, Prometheus metrics, OpenSearch TSDB, OTLP sink, OpenTelemetry logs, file source, filter_list processor, CloudWatch Logs sink
meta_description: OpenSearch Data Prepper 2.16 improves end-to-end metrics ingestion with a pull-based Prometheus source and OpenSearch-TSDB, introduces experimental OpenSearch pull-based ingestion through Kafka, adds powerful capabilities to the OpenSearch sink, and more.
---

The OpenSearch Data Prepper maintainers are happy to announce the release of Data Prepper 2.16.
This feature-rich release improves end-to-end metrics workloads with a pull-based Prometheus source and direct ingestion into OpenSearch time-series database (TSDB).
It also introduces OpenSearch pull-based ingestion as an experimental capability. Additional features include powerful new OpenSearch sink capabilities, support for OpenTelemetry Protocol (OTLP) logs in the OTLP sink, CloudWatch Logs sink improvements, and a greatly improved file source.


## Pull-based Prometheus source

Data Prepper 2.15 introduced a Prometheus source that accepts Remote Write requests pushed in by a Prometheus server. Some environments cannot enable Remote Write and instead expose `/metrics` endpoints that need to be scraped on a schedule.

Data Prepper 2.16 extends the same Prometheus source with a pull-based scraper. You configure one or more target URLs, and the source periodically scrapes each URL, parses the Prometheus text exposition format, and converts each sample into the same metric events as the Remote Write path produces. The scraper supports configurable scrape intervals and timeouts, HTTP basic and bearer token authentication, and Transport Layer Security (TLS). Targets must use HTTPS unless you explicitly set `insecure: true`.

For example, the following pipeline scrapes a node exporter and a service every 15 seconds and writes the metrics to OpenSearch:

```yaml
prometheus-pipeline:
  source:
    prometheus:
      scrape:
        targets:
          - url: "https://node-exporter.example.com:9100/metrics"
          - url: "https://my-service.example.com:8080/metrics"
        scrape_interval: 15s
        scrape_timeout: 10s
        authentication:
          http_basic:
            username: "scraper"
            password: "..."
  sink:
    - opensearch:
        hosts: ["https://localhost:9200"]
        index: "metrics-prometheus"
```

## OpenSearch TSDB ingestion

The OpenSearch [Time-Series Database plugin](https://github.com/opensearch-project/time-series-db) introduces a dedicated storage engine for metrics. Instead of storing every sample as its own Lucene document, it compresses samples into chunks, resulting in a smaller storage footprint and faster series queries.

Data Prepper 2.16 adds direct ingestion support for the TSDB engine using a new `index_type: tsdb` option for the OpenSearch sink. When this option is set, the sink converts each metric event into the document format the TSDB engine expects: each document contains a labels keyword, an epoch millisecond timestamp, a double value, and a timestamp range. Gauges and counters become a single document per sample, and histograms and summaries are expanded back into one document per bucket or quantile along with the matching `_count` and `_sum` series. The sink also installs a default index template, so a new TSDB index receives the correct mappings during the first write.

For example, the following pipeline takes Prometheus metrics from the new pull-based source and writes them into a TSDB index in OpenSearch:

```yaml
metrics-tsdb-pipeline:
  source:
    prometheus:
      scrape:
        targets:
          - url: "https://node-exporter.example.com:9100/metrics"
        scrape_interval: 15s
  sink:
    - opensearch:
        hosts: ["https://localhost:9200"]
        index: "metrics-tsdb"
        index_type: tsdb
```

## OpenSearch pull-based ingestion (experimental)

Traditionally, Data Prepper pushes documents to OpenSearch using the Bulk API, which couples ingestion throughput to the indexing path. Data Prepper 2.16 introduces experimental support for OpenSearch [pull-based ingestion](https://docs.opensearch.org/latest/api-reference/document-apis/pull-based-ingestion/), which inverts this model. Instead of pushing documents, Data Prepper writes them to a streaming source such as an Apache Kafka topic, and an OpenSearch index configured with an `ingestion_source` pulls those documents. This decouples ingestion from indexing and lets OpenSearch consume data at its own pace.

This is the first phase of pull-based ingestion support, and it is experimental. It targets a single, preexisting OpenSearch index that already has pull-based ingestion configured on the OpenSearch side. To configure pull-based ingestion, add a `pull_indexing` block to the OpenSearch sink. The block's `engine` field determines the streaming transport type. Data Prepper ships with a `kafka` engine, which requires a list of `bootstrap_servers` pointing to your Kafka cluster. Documents are routed to Kafka partitions using a Murmur3 hash of the document ID, consistent with OpenSearch's own shard routing.

Because this feature is experimental, you must explicitly configure it. Add the following to your `data-prepper-config.yaml` file to enable experimental features:

```yaml
experimental:
  enable_all: true
```

In this first phase, the following constraints apply:

* The `document_id` and `document_version` are both required. Events without a resolvable document ID or version will fail.
* The target index must already exist with `ingestion_source` configured. Data Prepper does not create it.
* Only the `index`, `create`, and `delete` actions are supported.

For example, the following pipeline reads from any source and writes documents into a pull-based OpenSearch index through Kafka:

```yaml
pull-ingestion-pipeline:
  source:
    # ... any source, such as http, otel, or s3 ...
  sink:
    - opensearch:
        hosts: ["https://opensearch:9200"]
        index: "my-index"
        document_id: "${/doc_id}"          # required for pull-based ingestion
        document_version: "${/timestamp}"  # required for pull-based ingestion
        action: "index"                    # index, create, or delete
        pull_indexing:
          engine:
            kafka:
              bootstrap_servers:
                - "kafka:9092"
```

## OpenSearch sink enhancements

Data Prepper 2.16 adds several capabilities to the OpenSearch sink:

* **Conditional script updates** ([#3563](https://github.com/opensearch-project/data-prepper/issues/3563)): The sink can now perform script-based updates and upserts so that OpenSearch can evaluate the existing document against the incoming one using an update script, rather than overwriting it. This supports patterns such as last-write-wins-by-field, counters, and partial merges. Incoming documents must contain the fields that the script references.
* **Client certificate authentication** ([#633](https://github.com/opensearch-project/data-prepper/issues/633)): Data Prepper can now authenticate to OpenSearch with a client certificate (mutual TLS), either on its own or alongside HTTP basic authentication.
* **Reverse proxy support** ([#6654](https://github.com/opensearch-project/data-prepper/issues/6654)): The sink now supports OpenSearch served under a path prefix, such as `https://host/os`, so you can run Data Prepper against a cluster behind a reverse proxy.

For example, the following sink performs a script-based upsert that merges incoming fields into the existing document:

```yaml
sink:
  - opensearch:
      hosts: ["https://opensearch:9200"]
      index: "my-index"
      action: "upsert"
      document_id: "${/id}"
      script:
        source: "ctx._source.putAll(params.doc)"
        params:
          doc: "${/doc}"
```

## OpenTelemetry logs in the OTLP sink

The OTLP sink previously supported only traces and always signed requests with a hardcoded `xray` AWS Signature Version 4 signing name. Data Prepper 2.16 generalizes the sink so it can emit OpenTelemetry logs in addition to traces. It also offers a configurable Signature Version 4 signing service name and lets you inject custom HTTP headers on every request. Together, these changes allow the sink to work with any OTLP-compatible backend, not just AWS X-Ray. The sink selects the OTLP signal automatically based on the events flowing through the pipeline, so log events are exported as logs and span events as traces. These changes are backward compatible, so existing trace configurations continue to work unchanged.

For example, the following pipeline sends logs to an OTLP endpoint, overriding the signing service name and adding a custom header:

```yaml
otlp-logs-pipeline:
  source:
    # ... any log source ...
  sink:
    - otlp:
        endpoint: "https://my-otlp-endpoint.example.com:443"
        service_name: "my-service"   # overrides the SigV4 signing service name
        additional_headers:
          x-custom-header: "my-value"
        max_retries: 3
        threshold:
          max_events: 512
          max_batch_size: "1mb"
          flush_timeout: "200ms"
        aws:
          region: "us-east-1"
          sts_role_arn: "arn:aws:iam::123456789012:role/MyRole"
```

## CloudWatch Logs sink enhancements

Data Prepper 2.16 makes the CloudWatch Logs sink easier to operate by adding these capabilities:

* **Automatic log group and stream creation** ([#6861](https://github.com/opensearch-project/data-prepper/issues/6861)): The new `create_log_group` and `create_log_stream` options (both default to `false`) let the sink create the configured log group and stream on startup if they do not already exist. This allows a pipeline to bootstrap itself rather than failing. Enabling these options requires the `logs:CreateLogGroup` and `logs:CreateLogStream` permissions.
* **Entity attributes** ([#6860](https://github.com/opensearch-project/data-prepper/issues/6860)): A new `entity` block attaches CloudWatch [entity](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_Entity.html) metadata to every `PutLogEvents` request, using `key_attributes` to identify the entity and optional `attributes` to describe it. This powers CloudWatch [entity-based correlation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/how-does-related-telemetry-work.html).

For example, the following sink creates its log group and stream if needed and attaches entity metadata to each request:

```yaml
sink:
  - cloudwatch_logs:
      aws:
        region: "us-east-1"
        sts_role_arn: "arn:aws:iam::123456789012:role/Data-Prepper"
      log_group: "/my/service/logs"
      log_stream: "my-stream"
      create_log_group: true
      create_log_stream: true
      entity:
        key_attributes:
          Type: "RemoteService"
          Name: "okta_auth0"
        attributes:
          AWS.ServiceNameSource: "UserConfiguration"
```

## Tail support for file source

Until now, the file source has been a one-shot reader. It opened a file, parsed it from start to end, and exited. That works for batch-style ingestion but not for log files that grow continuously or rotate. To watch a live log, you had to use separate tooling.

Data Prepper 2.16 adds a tail mode to the file source. When you set `tail: true`, the source watches the configured paths for changes, reads new lines as they are written, and continues reading across rotations. Files are identified by a fingerprint over the first kilobyte of bytes, so renames and moves do not produce duplicates. You can specify multiple paths using glob patterns, exclude paths, choose whether a new pipeline starts from the beginning of existing files or only from the tail, and persist a checkpoint to disk so a restart resumes from the last recorded position. Tail mode supports the same codec, compression, and end-to-end acknowledgment options as other sources.

The file source reads from the local file system, so Data Prepper needs direct access to the files it tails. In production, this means running it close to the logs, through a shared volume on a central cluster, as a sidecar, or as a per-host workload. Each pattern works the same way at runtime: the source persists its byte offset per file to a checkpoint on disk, and after a restart or rolling deployment it rereads the checkpoint and resumes from the exact last recorded position, so a redeploy does not produce duplicates or gaps.

For example, the following pipeline tails Nginx access logs across a directory, parses each line with the JSON codec, and writes the events to OpenSearch:

```yaml
nginx-pipeline:
  source:
    file:
      tail: true
      paths:
        - "/var/log/nginx/*.log"
      exclude_paths:
        - "/var/log/nginx/error.log"
      start_position: END
      codec:
        json:
      checkpoint_file: "/var/lib/data-prepper/nginx-checkpoint.json"
      acknowledgments: true
  sink:
    - opensearch:
        hosts: ["https://localhost:9200"]
        index: "nginx-access"
```

## A new `filter_list` processor

Existing mutate-event processors work on an event's keys, so previously there was no way to keep only the array *elements* that match a condition. The new `filter_list` processor iterates over the array at `iterate_on` and keeps each element for which the `keep_element_when` expression is `true`. By default, it filters in place; set the `target` to write the result to a different key.

For example, in the following pipeline, an `items` array keeps only the elements whose `status` is `active`:

```yaml
processor:
  - filter_list:
      iterate_on: "items"
      keep_element_when: '/status == "active"'
```


## Other notable changes

This release includes the following additional improvements:

* A new `otel_traces` input codec decodes OpenTelemetry traces provided in either JSON or Protobuf format into span events. Because it is an input codec, you can use it on any source that accepts a codec, such as Amazon S3, which makes pull-based trace pipelines possible.
* The Iceberg source now shuffles records by the `identifier_columns` hash so that `DELETE` and `INSERT` pairs colocate, fixing correctness and scaling for `UPDATE` and `DELETE` snapshots in change data capture pipelines.
* The OpenSearch source now defaults to Point-in-Time (PIT) search in Amazon OpenSearch Serverless ([#6335](https://github.com/opensearch-project/data-prepper/issues/6335)). This is a breaking change for pipelines that rely on the previous default behavior in Serverless.
* The CloudWatch Logs sink now catches unexpected errors in its upload path, recording a `cloudWatchLogsUnhandledError` metric and releasing the batch's acknowledgments so acknowledgment-aware sources keep making progress instead of stalling ([#6887](https://github.com/opensearch-project/data-prepper/issues/6887)).

In total, Data Prepper 2.16 includes 7 new features and 14 enhancements. For the complete list, see the [release notes](https://github.com/opensearch-project/data-prepper/releases/tag/2.16.0).

## Getting started

Use the following resources to get started with Data Prepper 2.16:

* To learn about all the changes, see the [2.16.0 release notes](https://github.com/opensearch-project/data-prepper/releases/tag/2.16.0).
* To download Data Prepper, visit the [Download & Get Started](https://opensearch.org/downloads.html) page.
* For information about getting started with Data Prepper, see [Getting started with OpenSearch Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about upcoming work for Data Prepper, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

Thanks to the following community members who contributed to this release:

TODO: dvenable
