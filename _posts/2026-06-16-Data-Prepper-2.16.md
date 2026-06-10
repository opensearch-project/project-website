---
layout: post
title: 'Data Prepper 2.16: Improved end-to-end metrics'
authors:
  - srikanthpadakanti
  - dvenable
date: 2026-06-16
categories:
  - releases
excerpt: Data Prepper 2.16 adds experimental OpenSearch pull-based ingestion, new processors for shaping array data, OpenTelemetry logs in the OTLP sink, and end-to-end metrics with a pull-based Prometheus source and OpenSearch-TSDB.
meta_keywords: OpenSearch Data Prepper, pull-based ingestion, Kafka ingestion, Prometheus metrics, OpenSearch TSDB, OTLP sink, OpenTelemetry logs, foreach processor, filter_entries processor, conditional script updates, data pipeline
meta_description: OpenSearch Data Prepper 2.16 introduces experimental OpenSearch pull-based ingestion through Kafka, new array-shaping processors, OpenTelemetry logs support in the OTLP sink, and end-to-end metrics ingestion with a pull-based Prometheus source and OpenSearch-TSDB.
---

The OpenSearch Data Prepper maintainers are happy to announce the release of Data Prepper 2.16.
This feature-rich release improves end-to-end metrics workloads with a pull-based Prometheus source and direct ingestion into OpenSearch-TSDB. 
It also introduces experimental OpenSearch pull-based ingestion, two new processors for shaping array data, OpenTelemetry logs support in the OTLP sink, and powerful new OpenSearch sink capabilities.


## Pull-based Prometheus source

Data Prepper 2.15 introduced a Prometheus source that accepts Remote Write requests pushed in by a Prometheus server. Some environments cannot turn on Remote Write and instead expose `/metrics` endpoints that need to be scraped on a schedule.

Data Prepper 2.16 extends the same Prometheus source with a pull-based scraper. You configure one or more target URLs and the source periodically scrapes each one, parses the Prometheus text exposition format, and converts each sample into the same metric events the Remote Write path produces. The scraper supports configurable scrape intervals and timeouts, HTTP basic and bearer token authentication, and TLS. Targets must use HTTPS unless you explicitly set `insecure: true`.

The following pipeline scrapes a node exporter and a service every 15 seconds and writes the metrics to OpenSearch:

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

## OpenSearch-TSDB Ingestion

The OpenSearch [time-series database plugin](https://github.com/opensearch-project/time-series-db) introduces a dedicated storage engine for metrics. It compresses samples into chunks for a much smaller storage footprint and faster series queries than treating every sample as its own Lucene document.

Data Prepper 2.16 adds direct ingestion support for that engine through a new `index_type: tsdb` option on the OpenSearch sink. When this option is set, the sink converts each metric event into the document shape the TSDB engine expects, with a labels keyword, an epoch millisecond timestamp, a double value, and a timestamp range. Gauges and counters become a single document per sample, and histograms and summaries are expanded back into one document per bucket or quantile along with the matching `_count` and `_sum` series. The sink also installs a default index template so a new TSDB index gets the right mappings on first write.

The following pipeline takes Prometheus metrics from the new pull-based source and writes them into a TSDB index in OpenSearch:

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

Traditionally, Data Prepper pushes documents to OpenSearch through the bulk API, which couples ingestion throughput to the indexing path. Data Prepper 2.16 introduces experimental support for OpenSearch [pull-based ingestion](https://docs.opensearch.org/latest/api-reference/document-apis/pull-based-ingestion/), which inverts this model. Instead of pushing documents, Data Prepper writes them to a streaming source such as a Kafka topic, and an OpenSearch index configured with an `ingestion_source` pulls those documents itself. This decouples ingestion from indexing and lets OpenSearch consume data at its own pace.

This is the first phase of pull-based ingestion support, and it is experimental. It targets a single, pre-existing OpenSearch index that already has pull-based ingestion configured on the OpenSearch side. To use it, the OpenSearch sink gains a `pull_indexing` block whose `engine` selects the streaming transport. The shipped engine is `kafka`, which requires the list of `bootstrap_servers` for your Kafka cluster. Documents are routed to Kafka partitions using a Murmur3 hash of the document ID, consistent with OpenSearch's own shard routing.

Because this feature is experimental, you must explicitly opt in. Add the following to your `data-prepper-config.yaml` file to enable experimental features:

```yaml
experimental:
  enable_all: true
```

In this first phase, the following constraints apply:

* The `document_id` and `document_version` are both required. Events without a resolvable document ID or version will fail.
* The target index must already exist with `ingestion_source` configured. Data Prepper does not create it.
* Only the `index`, `create`, and `delete` actions are supported.

The following pipeline reads from any source and writes documents into a pull-based OpenSearch index through Kafka:

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

## OpenTelemetry logs in the OTLP sink

The OTLP sink previously sent only traces, and it always signed requests with a hardcoded `xray` SigV4 signing name. Data Prepper 2.16 generalizes the sink so it can emit OpenTelemetry logs in addition to traces, lets you override the SigV4 signing service name, and lets you inject custom HTTP headers on every request. Together, these changes open the sink up to OTLP-compatible backends beyond AWS X-Ray. The sink selects the OTLP signal automatically based on the events flowing through the pipeline, so log events are exported as logs and span events as traces. These changes are backward compatible, so existing trace configurations continue to work unchanged.

The following pipeline sends logs to an OTLP endpoint, overriding the signing service name and adding a custom header:

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

## OpenSearch sink enhancements

Data Prepper 2.16 adds several capabilities that expand what the OpenSearch sink can do:

* **Conditional script updates** ([#3563](https://github.com/opensearch-project/data-prepper/issues/3563)). The sink can now perform script-based updates and upserts so that OpenSearch can evaluate the existing document against the incoming one through an update script, rather than blindly overwriting it. This supports patterns such as last-write-wins-by-field, counters, and partial merges. Incoming documents must contain the fields that the script references.
* **Client certificate authentication** ([#633](https://github.com/opensearch-project/data-prepper/issues/633)). Data Prepper can now authenticate to OpenSearch with a client certificate (mutual TLS), either on its own or alongside HTTP basic authentication.
* **Reverse proxy support** ([#6654](https://github.com/opensearch-project/data-prepper/issues/6654)). The sink now supports OpenSearch served under a path prefix, such as `https://host/os`, so you can run Data Prepper against a cluster behind a reverse proxy.

The following sink performs a script-based upsert that merges incoming fields into the existing document:

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

## Tail support for file source

Until now the file source has been a one-shot reader. It opened a file, parsed it from start to end, and exited. That works for batch-style ingestion but not for log files that grow continuously or rotate. To watch a live log you had to reach for separate tooling.

Data Prepper 2.16 adds a tail mode to the file source. When you set `tail: true`, the source watches the configured paths for changes, picks up new lines as they are written, and keeps reading across rotations. Files are identified by a fingerprint over the first kilobyte of bytes, so renames and moves do not produce duplicates. You can specify multiple paths with glob support, exclude paths, choose whether a new pipeline starts from the beginning of existing files or only from the tail, and persist a checkpoint to disk so a restart picks up exactly where it left off. Tail mode supports the same codec, compression, and end-to-end acknowledgment options that other sources offer.

The file source reads from the local filesystem, so Data Prepper needs direct access to the files it tails. In production that means running it close to the logs, through a shared volume on a central cluster, as a sidecar, or as a per-host workload. Durable checkpoints keep all three patterns clean across restarts and rolling deployments.

The following pipeline tails Nginx access logs across a directory, parses each line with the JSON codec, and writes the events to OpenSearch:

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

## Processor improvements

TODO: bagmarnikhil

## Other notable changes

This release includes the following additional improvements:

* A new `otel_traces` input codec decodes OpenTelemetry traces, in either JSON or Protobuf format, into span events. Because it is an input codec, you can use it on any source that accepts a codec, such as Amazon S3, which makes pull-based trace pipelines possible.
* The Iceberg source now shuffles records by `identifier_columns` hash so that `DELETE` and `INSERT` pairs co-locate, fixing correctness and scaling for `UPDATE` and `DELETE` snapshots in change data capture pipelines.
* The OpenSearch source now defaults to point-in-time (PIT) search on Amazon OpenSearch Serverless ([#6335](https://github.com/opensearch-project/data-prepper/issues/6335)). This is a breaking change for pipelines that rely on the previous default behavior on Serverless.

In total, Data Prepper 2.16 includes 7 new features and 14 enhancements. For the complete list, see the [release notes](https://github.com/opensearch-project/data-prepper/releases/tag/2.16.0).

## Getting started

Use the following resources to get up and running with Data Prepper 2.16:

* To learn about all the changes see the [2.16.0 release notes](https://github.com/opensearch-project/data-prepper/releases/tag/2.16.0)
* To download Data Prepper, visit the [Download & Get Started](https://opensearch.org/downloads.html) page.
* For information about getting started with Data Prepper, see [Getting started with OpenSearch Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about upcoming work for Data Prepper, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

Thanks to the following community members who contributed to this release:

TODO: dvenable
