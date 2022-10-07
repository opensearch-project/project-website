---
layout: post
title:  "Announcing Data Prepper 2.0.0"
authors:
- dlv
date: 2022-10-10 15:00:00 -0500
categories:
  - technical-post
---

Today the maintainers are announcing the release of Data Prepper 2.0. It has been over a year since Data Prepper 1.0 was first introduced
and this release introduces significant changes based on feedback from our users. This release makes Data Prepper easier to use and helps 
you improve your observability stack. This post will highlight some major changes and enhancements in this release.

## Conditional routing

Often time with log ingestion, pipeline authors need to send different logs to certain OpenSearch clusters. One example of this is routing logs based on log levels. 
Perhaps you want info logs which produce large volumes of data to go to a cluster or index that has more frequent rollovers or deletions to clear out these large volumes of data.

Now Data Prepper supports conditional routing to help with use-cases such as these. A pipeline author can configure routes. 
The author will define a name that is appropriate for the domain and a Data Prepper expression. 
Then for any sink that should only have some data coming through, define one or more routes to apply Data Prepper will evaluate 
these expressions for each event to determine which sinks to route these events to. Any sink that has no routes defined will accept all events.

Continuing with log-levels, consider an application log which includes log data. A common Java application log might look like the following.

```
2022-10-10T10:10:10,421 [main] INFO org.example.Application - Saving 10 records to SQL table "orders"
```

The text that reads `INFO` indicates that this is an INFO-level log. Data Prepper pipeline authors can now route logs with this level to only certain OpenSearch clusters.

The following example pipeline shows how this works. This pipeline takes application logs from the `http` source. This source 
accepts log data from external sources such as Fluent Bit. The pipeline then uses the `grok` processor to split the log line into multiple fields. 
Now the event has a field named `loglevel` that authors can use in routes. This pipeline has two OpenSearch sinks. The first sink only receives 
logs with a log level of `WARN` or `ERROR`. Data Prepper will route all events to the second sink.

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

There are many other use-cases that conditional routing can support. If there are other conditional expressions 
you’d like to see support for, please create an issue in GitHub.

## Peer Forwarder

Data Prepper supports stateful aggregations for traces and logs. With these, pipeline authors can improve the quality of the data going into OpenSearch. 
Previous to Data Prepper 2.0, performing stateful trace aggregations required using the `peer-forwarder` processor plugin. 
But this plugin only worked for traces and would send data back to the source. Also, log aggregations only worked on a single node.

Data Prepper introduces peer forwarding as a core feature in Data Prepper 2.0. This allows pipeline authors to perform stateful 
aggregations on multiple Data Prepper nodes. When performing stateful aggregations, Data Prepper uses a hash ring to determine 
which nodes are responsible for processing different events based on the values of certain fields. Data Prepper's core peer-forwarder 
routes events to the node responsible for processing the event. That node then holds all the state necessary for performing the aggregation.

To use peer forwarding, you will configure how Data Prepper discovers other nodes and the security for connections in your 
`data-prepper-config.yaml` file. The following snippet shows an example of how to do this.

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

In the example above, Data Prepper will discover other peers using DNS. It will perform a DNS query on the domain `my-data-prepper-cluster.production`.
This DNS record should be an A record with a list of IP addresses for peers. The configuration uses a custom certificate and private key. 
It performs host verification by checking the fingerprint of the certificate. And finally it configures each server to authenticate requests using 
Mutual TLS (mTLS) to prevent tampering of data.

## Directory structure

Previously, Data Prepper was distributed as a single executable JAR file. This is simple and convenient, but also makes it difficult for Data Prepper 
to include custom plugins. Data Prepper 2.0 introduces a change for it and now distributes the application in a bundled directory structure. 
The new directory structure features a shell script to launch Data Prepper and dedicated subdirectories for JAR files, configurations, pipelines, logs, and more. 
The directory structure looks like this:

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

With this change, a user can launch Data Prepper by simply running `bin/data-prepper`. No additional command line arguments or Java system property definitions 
are required. Instead, the application will load configurations from `config/` subdirectory.

Data Prepper will also read pipeline configurations from `pipelines/` subdirectory.  Users can now define pipelines across 
multiple YAML files in the subdirectory, where each file contains the configuration for one or more pipelines. This will 
allow users to keep their pipeline definitions distinct and thus more compact and focused. 

## JSON & CSV parsing

Many of our users have incoming data with embedded JSON or CSV fields. Now Data Prepper supports parsing either JSON or CSV.

A common example of this is when one larger object includes a serialized JSON string. If your incoming event data has a 
serialized JSON string, you can use the `parse_json` processor to extract the fields from the JSON into your event.

Data Prepper can now import CSV or TSV formatted files from Amazon S3 sources. This is useful for systems like Amazon CloudFront 
which write their access logs as TSV files. Now you can parse these logs using Data Prepper. Additionally, if your events have 
CSV or TSV fields, Data Prepper has a `csv` processor which can create fields from your incoming CSV data.

## Other improvements

Data Prepper 2.0 includes a number of other improvements. We’d like to highlight a few of them.

* The OpenSearch sink now supports create actions to OpenSearch. When Data Prepper writes documents to OpenSearch it normally does this via an update action. This will create the document if it does not exist or update it. Now a pipeline author can configure Data Prepper to use the create action. When this is configured, the OpenSearch cluster will not update the document if it already exists. Some scenarios call of for using this so that documents are only saved once and never updated.
* The HTTP source now supports loading TLS/SSL credentials from either Amazon S3 or Amazon Certificate Manager. The OTel Trace Source supported these options and now pipeline authors can configure them for their log ingestion use-cases as well.
* Data Prepper now requires Java 11 and the Docker image deploys with JDK 17.

Please see our release notes for a complete list.
