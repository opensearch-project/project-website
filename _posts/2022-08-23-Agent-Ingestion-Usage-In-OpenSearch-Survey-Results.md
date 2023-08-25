---
layout: post
title:  "Agent Ingestion Usage in OpenSearch Survey Results"
authors:
- jdbright
date: 2022-08-23
categories:
 - technical-post
redirect_from: "/blog/technical-post/2022/08/Agent-Ingestion-Usage-In-OpenSearch-Survey-Results/"
---

First, a huge thank you to all of you who responded to the survey. Understanding how you use agents in your ingestion pipelines helps us prioritize use cases that deliver the most value to the community.

In total, 67 individuals responded to the survey run in July 2022. Following are the results:

* ~54% of participants said that they still use [Beats](https://www.elastic.co/beats/) in their client ingestion pipeline (down from ~66% in June 2021).
    * Of the participants who said that they still use Beats:
        * ~52% are not planning to move off of Beats.
        * ~23% plan to move off in the next 12 months.
        * ~25% are waiting for a feature/solution before moving off.
* ~46% of participants do not use Beats in their client ingestion pipeline.
    * 21% use [Fluent Bit](https://fluentbit.io/).
    * 14% use [Fluentd](https://www.fluentd.org/).
    * 0% use [Open Telemetry Collector](https://opentelemetry.io/docs/collector/).
    * ~64% chose Other, which consisted of custom-built solutions, [Logstash](https://www.elastic.co/guide/en/logstash/current/introduction.html), and other solutions.

The survey also asked the community which agents and modules are most popular in their environments. Below are the results from those who use Beats agents in their client ingestion environment.

|**Agent/Module**	|Number Who Use	|
|:---	|---:	|
|[Filebeat w/ Logstash](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-logstash.html)	|19	|
|[Metricbeat w/ system](https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-module-system.html)	|16	|
|[Filebeat w/ Apache](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-apache.html)	|16	|
|[Winlogbeat w/ security](https://www.elastic.co/guide/en/beats/winlogbeat/current/winlogbeat-module-security.html)	|15	|
|[Auditbeat w/ auditd](https://www.elastic.co/guide/en/beats/auditbeat/master/auditbeat-module-auditd.html)	|11	|
|[Filebeat w/ *SQL (all SQL logs)](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-modules-overview.html)	|10	|
|[Filebeat w/ Netflow](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-netflow.html)	|10	|
|[Filebeat w/ Nginx](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-nginx.html)	|10	|
|[Auditbeat w/ file integrity](https://www.elastic.co/guide/en/beats/auditbeat/master/auditbeat-module-file_integrity.html)	|8	|
|[Auditbeat w/ system](https://www.elastic.co/guide/en/beats/auditbeat/master/auditbeat-module-system.html)	|8	|
|[Metricbeat w/ http](https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-module-http.html)	|6	|
|[Metricbeat w/ Kafka](https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-module-kafka.html)	|6	|
|[Metricbeat w/ *SQL (all SQL logs)](https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-modules.html)	|6	|
|[Filebeat w/ Cisco](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-cisco.html)	|6	|
|[Filebeat w/ Kafka](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-kafka.html)	|6	|
|[Heartbeat](https://www.elastic.co/guide/en/beats/heartbeat/current/heartbeat-overview.html)	|6	|
|[Metricbeat w/ Nginx](https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-module-nginx.html)	|5	|
|[Filebeat w/ IIS](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-iis.html)	|5	|
|[Packetbeat](https://www.elastic.co/guide/en/beats/packetbeat/current/packetbeat-overview.html)	|4	|
|[Metricbeat w/ IIS](https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-module-iis.html)	|3	|
|[Functionbeat](https://www.elastic.co/guide/en/beats/functionbeat/current/functionbeat-overview.html)	|3	|
|[Journalbeat](https://www.elastic.co/guide/en/beats/journalbeat/current/journalbeat-overview.html)	|2	|
|[Filebeat w/ HAProxy](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-haproxy.html)	|1	|
|[Fortinet](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-fortinet.html)	|1	|
|[Checkpoint](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-module-checkpoint.html)	|1	|

## So what did we learn?

Thanks to the survey response, the community now has a better understanding of how Beats usage is trending. Last year, 66% of community members were using Beats, which dropped to 54% this year. If all things go as expected with planned migrations in the commuity, Beats usage will drop to 42% in 2023. For those who are still using Beats, the most popular agents are [Filebeat](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-overview.html), [Metricbeat](https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-overview.html), [Winlogbeat](https://www.elastic.co/guide/en/beats/winlogbeat/current/_winlogbeat_overview.html), and [Auditbeat](https://www.elastic.co/guide/en/beats/auditbeat/current/auditbeat-overview.html).

For the ~28% of the community who have no plan to stop using Beats into OpenSearch via Logstash using the [OpenSearch Output plugin](https://github.com/opensearch-project/logstash-output-opensearch), users should be aware that Elastic Common Schema (ECS) compatibility mode is turned on by default in Logstash 8.0. If community members encounter ECS compatibility errors, they should [disable ECS in their pipeline](https://www.elastic.co/guide/en/logstash/current/ecs-ls.html).
