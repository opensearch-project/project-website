---
layout: post
title:  "Announcing Data Prepper 2.0.0"
authors:
- dvenable
- oeyh
date: 2022-10-10 15:00:00 -0500
categories:
  - technical-post
redirect_from: "/blog/technical-post/2022/10/Announcing-Data-Prepper-2.0.0/"
---

The Data Prepper maintainers are proud to announce the release of Data Prepper 2.0. This release makes 
[Data Prepper](https://github.com/opensearch-project/data-prepper/projects/1) 
easier to use and helps you improve your observability stack based on feedback from our users. Data Prepper 2.0 retains
compatibility with all current versions of OpenSearch.

Here are some of the major changes and enhancements made for [Data Prepper 2.0](https://opensearch.org/downloads.html#data-prepper).

## Conditional routing

Data Prepper 2.0 supports conditional routing to help pipeline authors send different 
[logs](https://opensearch.org/blog/technical-post/2021/12/Introducing-Data-Prepper-1.2.0-with-Log-Pipelines/) 
to specific OpenSearch clusters.

One common use case for conditional routing is reducing the volume of data going to some clusters.
When you want info logs that produce large volumes of data to go to a cluster, to index with more frequent rollovers, or to 
add deletions to clear out large volumes of data, you can now configure pipelines to route the data with your chosen action.


Simply choose a name appropriate for the domain and a Data Prepper expression. 
Then for any sink that should only have some data coming through, define one or more routes to apply. Data Prepper will evaluate 
these expressions for each event to determine which sinks to route these events. Any sink that has no routes defined will accept all events.

For example, consider an application log that includes log data. A typical Java application log might look like the following.

```
2022-10-10T10:10:10,421 [main] INFO org.example.Application - Saving 10 records to SQL table "orders"
```

The text that reads `INFO` indicates that this is an INFO-level log. Data Prepper pipeline authors can now route logs with this level to only certain OpenSearch clusters.

The following example pipeline takes application logs from the `http` source. This source 
accepts log data from external sources such as [Fluent Bit](https://fluentbit.io/). 

The pipeline then uses the `grok` processor to split the log line into multiple fields. The `grok` processor adds a 
field named `loglevel` to the event. Pipeline authors can use that field in routes.

This pipeline contains two OpenSearch sinks. The first sink will only receive logs with a log level of `WARN` or `ERROR`.
Data Prepper will route all events to the second sink.

```
application-log-pipeline:
  workers: 4
  delay: "50"
  source:
    http:
  processor:
    - grok:
        match:
          log: [ "%{NOTSPACE:time} %{NOTSPACE:thread} %{NOTSPACE:loglevel}  %{NOTSPACE:class} - %{GREEDYDATA:message}" ]

  route:
    - warn_and_above: '/loglevel == "WARN" or /loglevel == "ERROR"'
  sink:
    - opensearch:
        routes:
          - warn_and_above
        hosts: ["https://opensearch:9200"]
        insecure: true
        username: "admin"
        password: "admin"
        index: warn-and-above-logs
    - opensearch:
        hosts: ["https://opensearch:9200"]
        insecure: true
        username: "admin"
        password: "admin"
        index: all-logs
```

There are many other use cases that conditional routing can support. If there are other conditional expressions 
you’d like to see support for, please create an issue in GitHub.

## Peer forwarder

Data Prepper 2.0 introduces peer forwarding as a core feature.

Previous to Data Prepper 2.0, performing stateful trace aggregations required using the peer forwarder processor plugin. 
But this plugin only worked for traces and would send data back to the source. Also, 
[log aggregations](https://opensearch.org/blog/technical-post/2022/03/Introducing-Data-Prepper-1.3.0-with-New-Aggregation-Processor/) 
only worked on a single node.

With peer forwarding as a core feature, pipeline authors can perform stateful 
aggregations on multiple Data Prepper nodes. When performing stateful aggregations, Data Prepper uses a hash ring to determine 
which nodes are responsible for processing different events based on the values of certain fields. Peer forwarder 
routes events to the node responsible for processing them. That node then holds the state necessary for performing the aggregation.

To use peer forwarding, configure how Data Prepper discovers other nodes and the security for connections in your
`data-prepper-config.yaml` file.

In the following example, Data Prepper discovers other peers by using a DNS query on the `my-data-prepper-cluster.production` domain.
When using peer forwarder with DNS, the DNS record should be an A record with a list of IP addresses for peers. The example also uses a custom certificate and private key.
For host verification, it checks the fingerprint of the certificate. Lastly, it configures each server to authenticate requests using
Mutual TLS (mTLS) to prevent data tampering.


```
peer_forwarder:
    discovery_mode: dns
    domain_name: "my-data-prepper-cluster.production"
    ssl_certificate_file: /usr/share/data-prepper/config/my-certificate.crt
    ssl_key_file: /usr/share/data-prepper/config/my-certificate.key
    ssl_fingerprint_verification_only: true
    authentication:
        mutual_tls:
```


## Directory structure

Before the release of Data Prepper 2.0, we distributed Data Prepper as a single executable JAR file. While convenient, 
this made it difficult for us to include custom plugins.

We now distribute Data Prepper 2.0 in a bundled directory structure. This structure features a shell script to launch 
Data Prepper and dedicated subdirectories for JAR files, configurations, pipelines, logs, and more.

```
data-prepper-2.0.0/
  bin/
    data-prepper                    # Shell script to run Data Prepper
  config/
    data-prepper-config.yaml        # The Data Prepper configuration file
    log4j.properties                # Logging configuration
  pipelines/                             # New directory for pipelines
    trace-analytics.yaml
    log-ingest.yaml
  lib/
    data-prepper-core.jar
    ... any other jar files
  logs/
```

You now can launch Data Prepper by running `bin/data-prepper`; there is no need for additional command line arguments or Java system 
property definitions. Instead, the application loads configurations from the `config/` subdirectory.

Data Prepper 2.0 reads pipeline configurations from the `pipelines/` subdirectory. You can now define pipelines across 
multiple YAML files in the subdirectory, where each file contains the definition for one or more pipelines. The directory 
also helps keep pipeline definition distinct and, therefore, more compact and focused.

## JSON and CSV parsing

Many of our users have incoming data with embedded JSON or CSV fields. To help in these use cases, Data Prepper 2.0 
supports parsing JSON and CSV.

For example, when one large object includes a serialized JSON string, you can use the `parse_json` processor to extract 
the fields from the JSON string into your event.

Data Prepper can now import CSV or TSV formatted files from Amazon Simple Storage Service (Amazon S3) 
[sources](https://opensearch.org/blog/technical-post/2022/06/S3-Log-Ingestion-Using-Data-Prepper-1.5.0/).
This is useful for systems like Amazon CloudFront, 
which write their access logs as TSV files. Now you can parse these logs using Data Prepper. 

Additionally, if your events have 
CSV or TSV fields, Data Prepper 2.0 now contains a `csv` processor that can create fields from your incoming CSV data.

## Other improvements

Data Prepper 2.0 includes a number of other improvements. We want to highlight a few of them.

* The OpenSearch sink now supports `create` actions for OpenSearch when writing documents. Pipeline authors can configure their pipelines to only create new documents and not update existing ones.
* The HTTP source now supports loading TLS/SSL credentials from either Amazon S3 or AWS Certificate Manager (ACM). Pipeline authors can now configure them for their log ingestion use cases. Before Data Prepper 2.0, only the OTel Trace Source supported these options.
* Data Prepper now requires Java 11 or higher. The Docker image deploys with JDK 17.

Please see our [release notes](https://github.com/opensearch-project/data-prepper/releases/tag/2.0.0) for a complete list.

## Try Data Prepper 2.0

Data Prepper 2.0 is available for [download](https://opensearch.org/downloads.html#data-prepper) now! The maintainers encourage you to
read the [latest documentation](https://opensearch.org/docs/latest/clients/data-prepper/index/) and try out the new features.
