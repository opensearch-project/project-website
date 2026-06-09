---
layout: post
title: 'Data Prepper 2.16: Improved end-to-end metrics'
authors:
  - srikanthpadakanti
  - dvenable
date: 2026-06-16
categories:
  - releases
excerpt: TODO
meta_keywords: TODO
meta_description: TODO
---

The OpenSearch Data Prepper maintainers are happy to announce the release of Data Prepper 2.16.
This release improves metrics workloads with a pull-based Prometheus source and the ingestion for OpenSearch-TSDB.


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

## OpenSearch pull-based ingestion

TODO: dvenable

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

TODO: dvenable

## Getting started

Use the following resources to get up and running with Data Prepper 2.16:

* To learn about all the changes see the [2.16.0 release notes](https://github.com/opensearch-project/data-prepper/releases/tag/2.16.0)
* To download Data Prepper, visit the [Download & Get Started](https://opensearch.org/downloads.html) page.
* For information about getting started with Data Prepper, see [Getting started with OpenSearch Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about upcoming work for Data Prepper, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

Thanks to the following community members who contributed to this release:

TODO: dvenable
