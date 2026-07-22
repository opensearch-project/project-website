---
layout: post
title:  "Simple NGINX dashboards with Fluent Bit and OpenSearch"
authors:
  - jdbright
  - lioperry
  - anurag_gup
  - armarble
date:   2023-03-06
categories:
  - technical-post
meta_keywords: opensearch simple schema, observability schema, opensearch opentelemetry, OpenSearch 2.6
meta_description: While users can currently send their logs to OpenSearch, there are no set formats or schemas for the logs, which can make sharing dashboards and alerts cumbersome. In this blog post, we talk about using Fluent Bit, a new simple schema, and OpenSearch with NGINX as a new workflow that simplifies the sharing of dashboards and alerts.
---

Fluent Bit is a graduated sub-project under the Cloud Native Computing Foundation (CNCF) Fluentd project umbrella. Fluent Bit integrates with hundreds of common tools such as Kafka, Syslog, Loki, and, of course, OpenSearch.

While users can currently send their logs to OpenSearch, there are no set formats or schemas for the logs, which can make sharing dashboards and alerts cumbersome. In this blog post, we talk about using Fluent Bit, a new simple schema, and OpenSearch with NGINX as a new workflow that simplifies the sharing of dashboards and alerts.

## Simple Schema for Observability

OpenSearch 2.6 introduced a standardization for conforming to a common and unified observability schema: Simple Schema for Observability. 

Observability is a collection of plugins and applications that let you visualize data-driven events by using PPL/SQL/DQL to explore and query data stored in OpenSearch. With the schema in place, Observability tools can ingest, automatically extract, and aggregate data and create custom dashboards, making it easier to understand the system at a higher level.

Simple Schema for Observability is based on the way that Amazon Elastic Container Service ([Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_cwe_events.html)) organizes logs and on information provided by [OpenTelemetry](https://opentelemetry.io/docs/), including metadata.

## Connecting Simple Schema for Observability and Fluent Bit

When raw logs are ingested by Fluent Bit, they are automatically converted into MessagePack, a binary representation of JSON. Fluent Bit’s automatic conversion makes parsing and modifying messages in transit simpler.

In addition, Fluent Bit comes with out-of-the-box parsers for common applications such as NGINX, Apache Web Logs, Kubernetes, and more. These parsers give structure to a log file, though they do not have the depth that other log schemas and formats do.

Fluent Bit can perform more advanced transformations by using a filter written with a programming language called Lua.

[Lua filters](https://docs.fluentbit.io/manual/pipeline/filters/lua) give users extreme flexibility in how they transform their data, including modification, addition, enrichment via API, calculation, or even redaction. To connect Fluent Bit and the new Simple Schema for Observability, we opted for a Lua script that you can paste into your configuration file to run on top of NGINX-ingested logs.

The following is an example `fluent-bit.conf` file for virtual machines (VMs) or standalone deployments:

```bash
[INPUT]
    name tail
    read_from_head true
    exit_on_eof true
    path /tmp/data.log
    parser nginx

[Filter]
    Name    lua
    Match   *
    code    function cb_filter(a,b,c)local d={}local e=os.date("!%Y-%m-%dT%H:%M:%S.000Z")d["observerTime"]=e;d["body"]=c.remote.." "..c.host.." "..c.user.." ["..os.date("%d/%b/%Y:%H:%M:%S %z").."] \""..c.method.." "..c.path.." HTTP/1.1\" "..c.code.." "..c.size.." \""..c.referer.."\" \""..c.agent.."\""d["trace_id"]="102981ABCD2901"d["span_id"]="abcdef1010"d["attributes"]={}d["attributes"]["data_stream"]={}d["attributes"]["data_stream"]["dataset"]="nginx.access"d["attributes"]["data_stream"]["namespace"]="production"d["attributes"]["data_stream"]["type"]="logs"d["event"]={}d["event"]["category"]={"web"}d["event"]["name"]="access"d["event"]["domain"]="nginx.access"d["event"]["kind"]="event"d["event"]["result"]="success"d["event"]["type"]={"access"}d["http"]={}d["http"]["request"]={}d["http"]["request"]["method"]=c.method;d["http"]["response"]={}d["http"]["response"]["bytes"]=tonumber(c.size)d["http"]["response"]["status_code"]=c.code;d["http"]["flavor"]="1.1"d["http"]["url"]=c.path;d["communication"]={}d["communication"]["source"]={}d["communication"]["source"]["address"]="127.0.0.1"d["communication"]["source"]["ip"]=c.remote;return 1,b,d end
    call    cb_filter

[OUTPUT]
    format json
    name stdout
    match *
```

## Importing the dashboard in OpenSearch

For examples of using an NGINX dashboard with Fluent Bit, see the following resources:

-	Reference the text in [this readme file](https://github.com/opensearch-project/observability/blob/e18cf354fd7720a6d5df6a6de5d53e51a9d43127/integrations/nginx/samples/preloaded/README.md) for example preloaded data.
-	Reference the text in [this readme file](https://github.com/opensearch-project/observability/blob/9267012051fabfc2a971493bddde60448bc48ecf/integrations/nginx/test/README.md) to view an example live NGINX > Fluent Bit > OpenSearch workflow.
- The following OpenSearch [Playground](https://observability.playground.opensearch.org/app/dashboards#/view/96847220-5261-44d0-89b4-65f3a659f13a) demo uses a preloaded NGINX > Fluent Bit > OpenSearch Simple Schema log data stream.

## Summary and next steps

In this blog post, we provided an overview of the new OpenSearch Simple Schema for Observability, showed how to take advantage of it using [Fluent Bit](https://fluentbit.io/), and modified and imported an NGINX dashboard contributed by [WorldTechIT](https://wtit.com/) to demonstrate a full agent-to-dashboard flow. To dive deeper and see how it all works for yourself, download the [Docker Compose file](https://github.com/opensearch-project/observability/blob/e18cf354fd7720a6d5df6a6de5d53e51a9d43127/integrations/nginx/test/README.md) and leave us feedback in [GitHub Discussions](https://github.com/fluent/fluent-bit/discussions).
