---
layout: post
title: 'Data Prepper 2.17 brings Splunk HEC compatibility and JDBC source coordination'
authors:
  - srikanthpadakanti
  - tonypiazza
  - hsotaro
  - dvenable
date: 2026-11-01
categories:
  - releases
excerpt: Data Prepper 2.17 adds a Splunk HEC-compatible source, a rewritten RSS source supporting multiple feeds, and multi-node scaling backed by your relational database.
meta_keywords: OpenSearch Data Prepper, Splunk HEC, Splunk migration, HTTP Event Collector, RSS source, Atom feeds, JDBC source coordination, PostgreSQL, MySQL, gRPC keepalive, OpenTelemetry, data pipeline
meta_description: OpenSearch Data Prepper 2.17 adds a Splunk HEC-compatible source for ingesting from existing Splunk forwarders, a rewritten RSS source, JDBC-backed source coordination, and gRPC connection age settings for OpenTelemetry sources.
---

The OpenSearch Data Prepper maintainers are happy to announce the release of Data Prepper 2.17.
Data Prepper now accepts data from existing Splunk forwarders and HTTP Event Collector (HEC) clients without any client changes, so you can more easily send Splunk-originated data to OpenSearch.
This release also rewrites the RSS source to reliably ingest multiple RSS and Atom feeds, adds a Java Database Connectivity (JDBC) source coordination store so you can scale Data Prepper to multiple nodes using a relational database that you already run, and improves load balancing for OpenTelemetry sources in horizontally scaled deployments.


## Splunk HEC source

If you already run Splunk universal forwarders, heavy forwarders, or applications that log through the [Splunk HTTP Event Collector (HEC)](https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector) protocol, sending this data to OpenSearch required reconfiguring each client or running intermediate tooling.

Data Prepper 2.17 introduces a new `splunk_hec` source that implements a HEC-compatible server, so existing forwarders and any HEC client can send data to Data Prepper without modification. You configure the client to send data to Data Prepper instead of Splunk. The source accepts the same requests and tokens and returns the HEC response codes that clients expect.

The source provides the following standard HEC endpoints, relative to the `/services/collector` path:

* `POST /event` accepts one or more HEC events as concatenated JSON objects.
* `POST /raw` accepts plain text and creates one event per line, reading metadata such as `sourcetype` and `index` from query parameters.
* `POST /ack` returns indexer acknowledgment status, which clients poll when acknowledgments are enabled.
* `GET /health` returns the collector's health status and does not require authentication.

The source authenticates each request using the standard `Authorization: Splunk <token>` header. You can configure multiple tokens, disable a token without removing it, and assign each token its own default values for `index`, `sourcetype`, `source`, `host`, and additional `fields`. Per-token defaults let you separate traffic from different teams or applications by token, as in Splunk. By default, the source flattens JSON object events into top-level fields, converts the HEC `time` value to the event `@timestamp`, and stores the HEC `index` value in the `splunk_index` metadata attribute so that you can use it for routing.

The source is built for production forwarders. When the buffer is full, it returns `503` with HEC code 9 (server is busy), which signals Splunk forwarders to retry with backoff instead of dropping data. When you set `acknowledgements: true`, the source implements the HEC indexer acknowledgment protocol on top of Data Prepper end-to-end acknowledgments, so the source acknowledges a request only after the sink writes its data. The source enables TLS by default so that tokens aren't sent in cleartext.

The following pipeline accepts HEC traffic on the standard port 8088, assigns per-token defaults, and writes each event to the OpenSearch index named by its HEC `index`:

```yaml
hec-pipeline:
  source:
    splunk_hec:
      port: 8088
      ssl_certificate_file: "/path/to/server.crt"
      ssl_key_file: "/path/to/server.key"
      acknowledgements: true
      tokens:
        - token: "${% raw %}{{aws_secrets:hec-secrets:infra-token}}{% endraw %}"
          defaults:
            index: "infrastructure"
            sourcetype: "syslog"
        - token: "${% raw %}{{aws_secrets:hec-secrets:app-token}}{% endraw %}"
          defaults:
            index: "application"
  sink:
    - opensearch:
        hosts: ["https://opensearch:9200"]
        index: '${getMetadata("splunk_index")}'
```

Any HEC client can then send events to Data Prepper, as shown in the following example:

```bash
curl https://data-prepper:8088/services/collector/event \
  -H "Authorization: Splunk <token>" \
  -d '{"event": {"message": "user login", "user": "alice"}, "sourcetype": "auth", "host": "web-01"}'
```

## Rewritten RSS source with multiple feed support

The `rss` source ingests any type of RSS or Atom feed, such as news, release announcements, security advisories, and blog posts, into OpenSearch. Earlier versions could read only one feed per source and had two serious bugs: every poll re-emitted the entire feed while memory use grew without bound, and a single transient network error stopped polling permanently.

Data Prepper 2.17 rewrites the `rss` source to fix both bugs and adds support for multiple feeds. Each feed now keeps a bounded cache of recently seen items, so the source writes only new items to the buffer. Feeds fail independently: when a feed fails, the source logs the error, increments a per-feed failure metric, and retries the feed with exponential backoff without affecting other feeds. The new `request_timeout` setting, which defaults to 30 seconds, prevents a slow or unresponsive feed from blocking a worker thread.

You configure feeds in a `feeds` map keyed by feed name. Each feed can override the default `polling_frequency` and can set its own HTTP basic authentication credentials. The `workers` setting controls how many feeds are polled concurrently.

The source converts each item into an `rss-item` event with `title`, `link`, `description`, `publication_date`, and `item_id` fields. Every event also contains the `feed_name` and `feed_url` fields. The `item_id` field contains the item's globally unique identifier (GUID). If the item has no GUID, the source uses the item's link, or a content hash if there's no link. Because `item_id` is always populated, you can use it as the `document_id` in the `opensearch` sink. The source redacts the query string from `feed_url` and from log messages so that API keys passed as query parameters are not exposed. When a feed provides channel details such as its title, link, language, or categories, the source attaches them as event metadata.

The following pipeline polls two feeds, one of them using basic authentication, and writes each feed to its own daily index:

```yaml
rss-pipeline:
  source:
    rss:
      workers: 2
      polling_frequency: PT5M
      feeds:
        opensearch-forum:
          url: "https://forum.opensearch.org/latest.rss"
        internal-advisories:
          url: "https://private.example.com/feed.xml"
          polling_frequency: PT1M
          authentication:
            basic:
              username: "${% raw %}{{aws_secrets:rss-credentials:username}}{% endraw %}"
              password: "${% raw %}{{aws_secrets:rss-credentials:password}}{% endraw %}"
  sink:
    - opensearch:
        hosts: ["https://opensearch:9200"]
        index: "rss-${/feed_name}-%{yyyy.MM.dd}"
        document_id: "${/item_id}"
```

The source reports `itemsIngested.<feed-name>` and `feedPollsFailed.<feed-name>` metrics for each feed, so you can track ingestion and alert on a failing feed individually. The seen-item cache stores the 10,000 most recent items for each feed in memory and is cleared when Data Prepper restarts. To prevent items that are ingested again after a restart from creating duplicate documents, use `item_id` as the `document_id`, as in the preceding example. For the full list of options, see the [RSS source documentation](https://docs.opensearch.org/latest/data-prepper/pipelines/configuration/sources/rss/).

## JDBC source coordination store

Several Data Prepper sources, including the OpenSearch, Amazon S3 scan, and Apache Iceberg sources, scale beyond a single node only when they can share a source coordination store that assigns work to each node and prevents duplicate processing. Until now, this store has been backed by Amazon DynamoDB.

Data Prepper 2.17 adds a new `jdbc` source coordination store backed by a relational database. If you already run PostgreSQL or MySQL, you can now scale Data Prepper to a multi-node cluster using that database, with the backup, monitoring, and access controls that you've already configured for it. The new store supports every source that uses source coordination, so you can switch an existing pipeline from DynamoDB to JDBC by changing only the configuration.

The following `data-prepper-config.yaml` configuration uses a PostgreSQL database as the source coordination store:

```yaml
source_coordination:
  store:
    jdbc:
      url: "jdbc:postgresql://db:5432/dataprepper"
      username: "dp_user"
      password: "${% raw %}{{aws_secrets:db-secrets:password}}{% endraw %}"
```

## gRPC connection age for OpenTelemetry sources

gRPC clients resolve DNS once and then keep the same long-lived connection. In horizontally scaled Data Prepper deployments, new replicas behind a load balancer receive no OpenTelemetry traffic until existing clients reconnect, so load remains concentrated on the original nodes.

Data Prepper 2.17 adds two optional settings to the sources that run a gRPC server (`otlp`, `otel_trace_source`, `otel_logs_source`, and `otel_metrics_source`). The `max_connection_age` setting gracefully closes connections after the configured age so that clients reconnect and resolve new endpoints. The `connection_drain_duration` setting gives in-flight requests time to finish before the connection closes. These settings correspond to the gRPC `MAX_CONNECTION_AGE` and `MAX_CONNECTION_AGE_GRACE` server options. When you omit them, the server behaves exactly as in earlier versions.

The following configuration closes connections after 30 minutes and gives in-flight requests 15 seconds to finish:

```yaml
otel-pipeline:
  source:
    otlp:
      port: 21893
      max_connection_age: PT30M
      connection_drain_duration: 15s
```

## Other notable changes

This release includes the following additional improvements:

* Data Prepper now supports Amazon OpenSearch Service domains optimized for observability with a new `trace-analytics-plain-raw-v2` index type in the `opensearch` sink.
* The `parse_json` and `parse_ion` processors can now parse top-level JSON arrays, writing the parsed array to the target key ([#5705](https://github.com/opensearch-project/data-prepper/issues/5705)).
* Events now support string values up to 64 MB, up from the previous 20 MB limit, so you can ingest documents with very large individual fields ([#7145](https://github.com/opensearch-project/data-prepper/issues/7145)).
* The Kafka source supports `azure_federated` OAuth authentication for Azure Event Hubs ([#7011](https://github.com/opensearch-project/data-prepper/pull/7011)).
* The `length()` expression function now supports maps, lists, and arrays in addition to strings ([#7030](https://github.com/opensearch-project/data-prepper/issues/7030)).
* The Prometheus sink can attach a per-instance `instance_label` to outgoing samples, so that multiple Data Prepper nodes can safely write the same series ([#7023](https://github.com/opensearch-project/data-prepper/issues/7023)).
* Data Prepper has a new opt-in plugin framework backed by an embedded Apache Felix Open Services Gateway initiative (OSGi) runtime. To enable it, set `-Ddata-prepper.plugin.framework=osgi`. The default classpath loader is unchanged ([#6760](https://github.com/opensearch-project/data-prepper/issues/6760)).

## Getting started

Use the following resources to get started with Data Prepper 2.17:

* To learn about all the changes, see the [2.17.0 release notes](https://github.com/opensearch-project/data-prepper/releases/tag/2.17.0).
* To download Data Prepper, visit the [Download & Get Started](https://opensearch.org/downloads.html) page.
* To get started with Data Prepper, follow the updated [Getting started with OpenSearch Data Prepper](https://docs.opensearch.org/latest/data-prepper/getting-started/) guide.
* To learn more about upcoming work for Data Prepper, see the [Data Prepper Project Roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

Thanks to the following community members who contributed to this release:

TODO
