---
layout: post
title:  "Simple NGINX Dashboards with Fluent Bit and OpenSearch"
authors:
  - jdbright
  - armarble
date:   2023-03-06
categories:
  - technical-post
meta_keywords: opensearch simple schema, observability schema, opensearch opentelemetry, OpenSearch 2.6
meta_description: While users can send their logs to OpenSearch today, there are no set formats or schemas which can make sharing dashboards and alerts cumbersome. In this blog, we talk about using Fluent Bit, a new simple schema and OpenSearch with Nginx as the first example.
---

Fluent Bit is a graduated sub-project under the Cloud Native Computing Foundation (CNCF) Fluentd project umbrella. Fluent Bit has hundreds of integrations to common tools such as Kafka, Syslog, Loki, and of course OpenSearch.

While users can send their logs to OpenSearch today, there are no set formats or schemas which can make sharing dashboards and alerts cumbersome. In this blog, we talk about using Fluent Bit, a new simple schema and OpenSearch with Nginx as the first example.

## Simple Schema

OpenSearch 2.6 introduced a standardization for conforming to a common and unified observability schema: Simple Schema for Observability. 

Observability is a collection of plugins and applications that let you visualize data-driven events by using PPL / SQL / DQL to explore and query data stored in OpenSearch.
With the schema in place, Observability tools can ingest, automatically extract, and aggregate data and create custom dashboards, making it easier to understand the system at a higher level.

Simple Schema for Observability is inspired by both [OpenTelemetry](https://opentelemetry.io/docs/) and uses Amazon Elastic Container Service ([Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_cwe_events.html)) event logs and OpenTelemetry metadata.

## Connecting Simple Schema and Fluent Bit

When raw logs are ingested by Fluent Bit they are automatically converted into MessagePack, a binary representation of JSON. Fluent Bit’s automatic conversion makes parsing and modifying messages in-flight simple and easy.

In addition, Fluent Bit comes with out of the box parsers for common applications such as Nginx, Apache Web Logs, Kubernetes, and more. These parsers give some structure to a log file though do not have the depth that other log schema and formats do. Thankfully, Fluent Bit also can handle more complex transformations on top with processor (called filters), or even Lua code.

[Lua filters](https://docs.fluentbit.io/manual/pipeline/filters/lua) give users extreme flexibility with how they want to transform their data, including modifying / adding / enriching via API / calculating / or even redacting. To help us connect Fluent Bit and the new simple schema we opted for a Lua script that can be pasted in your config file to run on top of nginx ingested logs


fluent-bit.conf for VM or standalone deployments:

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

See two tutorials
-	Preloaded data demo (use text in the [readme file](https://github.com/opensearch-project/observability/blob/e18cf354fd7720a6d5df6a6de5d53e51a9d43127/integrations/nginx/samples/preloaded/README.md ))
-	Live nginx->fluent-bit->opensearch demo (use text in the [readme file](https://github.com/opensearch-project/observability/blob/e18cf354fd7720a6d5df6a6de5d53e51a9d43127/integrations/nginx/test/README.md))

## End result and next steps

In this blog post, we provided an overview of OpenSearch’s new Simple Schema for Observability, shown how to take advantage of it using [Fluent Bit](https://fluentbit.io/), and modified and imported an NGINX dashboard contributed by [WorldTechIT](https://wtit.com/) to demonstrate a full agent to dashboard flow. Want to dive deeper and see how it works for yourself, download the [docker compose file](https://github.com/opensearch-project/observability/blob/e18cf354fd7720a6d5df6a6de5d53e51a9d43127/integrations/nginx/test/README.md) and drop us some feedback in [Github Discussions](https://github.com/fluent/fluent-bit/discussions).
