---
layout: post
title:  "Beats Survey Results"
authors:
- jdbright
date: 2022-07-13
categories:
 - technical-post

---

First, a huge thank you to all of you who responded to the survey. Understanding how you use agents in your ingestion pipelines helps us prioritize use cases that deliver the most value to the community.

In total, 67 individuals responded to the survey run in July 2022. Following are the results:

* ~54% of participants said that they still use Beats in their client ingestion pipeline (down from ~66% in June 2021).
    * Of the participants who said that they still use Beats:
        * ~52% are not planning to move off of Beats.
        * ~23% plan to move off in the next 12 months.
        * ~25% are waiting for a feature/solution before moving off.
* ~46% of participants do not use Beats in their client ingestion pipeline.
    * 21% use Fluent Bit.
    * 14% use Fluentd.
    * 0% use Open Telemetry Collector.
    * ~64% chose Other, which consisted of custom-built solutions, Logstash, and other solutions.

The survey also asked the community which agents and modules are most popular in their environments. Below are the results from those who use Beats agents in their client ingestion environment.

|**Agent/Module**	|Number Who Use	|
|---	|---	|
|Filebeat w/ Logstash	|19	|
|Metricbeat w/ system	|16	|
|Filebeat w/ Apache	|16	|
|Winlogbeat w/ security	|15	|
|Auditbeat w/ auditd	|11	|
|Filebeat w/ *SQL (all SQL logs)	|10	|
|Filebeat w/ Netflow	|10	|
|Filebeat w/ Nginx	|10	|
|Auditbeat w/ file integrity	|8	|
|Auditbeat w/ system	|8	|
|Metricbeat w/ http	|6	|
|Metricbeat w/ Kafka	|6	|
|Metricbeat w/ *SQL (all SQL logs)	|6	|
|Filebeat w/ Cisco	|6	|
|Filebeat w/ Kafka	|6	|
|Heartbeat	|6	|
|Metricbeat w/ Nginx	|5	|
|Filebeat w/ IIS	|5	|
|Packetbeat	|4	|
|Metricbeat w/ IIS	|3	|
|Functionbeat	|3	|
|Journalbeat	|2	|
|Filebeat w/ HAProxy	|1	|
|Fortinet	|1	|
|Checkpoint	|1	|

## So what did we learn?

Thanks to the survey response, the community now has a better understanding of how Beats usage is trending. Last year, 66% of community members were using Beats which dropped to 54% this year. If all things go as expected with planned migrations in the commuity, Beats usage will drop to 42% in 2023. For those who are still using Beats, the most popular agents are Filebeat, Metricbeat, Winlogbeat, and Auditbeat.

For the ~28% of the community who have no plan to stop using Beats into OpenSearch via Logstash using the [OpenSearch Output plugin](https://github.com/opensearch-project/logstash-output-opensearch), users should be aware that Elastic Common Schema (ECS) compatibility mode is turned on by default in Logstash 8.0. If community members encounter ECS compatibility errors, they should [disable ECS in their pipeline](https://www.elastic.co/guide/en/logstash/current/ecs-ls.html).

End Blog -------




8/18 - Review Meeting with Arjun/Rajiv


* Agree that the response should be in the form of a blog post which can be referenced in the forums to take advantage of SEO, etc.
* Rajiv called out that plugins is not the right nomenclature (Joshua to change to modules)
* In a future survey, we can ask folks where they are sending there data (e.g. OpenSearch, S3, Azure Files, Google File Storage, etc.)
* Why didn’t we add details for those who aren’t using Beats in their pipeline?
    * The only responses were Fluent Bit and Fluentd
* Worth wrapping up the post by saying that for those who continue to use Beats, despite the license checks, can use the Logstash Output plugin and turn off ECS if they run into compatibility errors


Action Items

* ~~Joshua to add in the wrap up and remove the blurb around how we are going to use the data to help prioritize items on the potential roadmap.~~
* ~~Joshua to change nomenclature of plugins to modules~~
* ~~Joshua to send updated draft to Rajiv/Arjun offline and then send to editor for final review ahead of launching the blog post.~~
