---
layout: post
title:  "Introducing Data Prepper 1.3.0 with New Aggregation Processor"
authors:
- tylgry
- ddpowers
- dvenable
date: 2022-03-21 10:00:00 -0500
categories:
  - technical-post
twittercard:
  description: " Data Prepper 1.3.0 is available for use today. This release provides a log aggregation processor and other new processors."
redirect_from: "/blog/technical-post/2022/03/Introducing-Data-Prepper-1.3.0-with-New-Aggregation-Processor/"
---

Data Prepper is an open source data collector for trace and log data that can filter, 
enrich, and aggregate data for downstream analysis and visualization. Data Prepper now 
has more support for log enrichment and aggregation with the new features released in 
Data Prepper 1.3.0. This release includes new processors to mutate fields on events, 
aggregate distinct log events, drop certain events, and more.

In this post, we’d like to introduce some of the new enrichment processors that are 
part of Data Prepper 1.3.0. The 
[Release Notes](https://github.com/opensearch-project/data-prepper/blob/main/release/release-notes/data-prepper.release-notes-1.3.0.md) 
include the full list of processors as well as links to their documentation.

## Mutate and String Processors

The [mutate event processors](https://github.com/opensearch-project/data-prepper/blob/main/data-prepper-plugins/mutate-event-processors/README.md) 
offer the opportunity to rename, copy, add, or even delete entries in events. Using the Add Entry Processor, 
for example, would allow a user to add in an entry to their data to help debug the flow of data:


```yaml
...
processor:
  - add_entries:
    entries:
    - key: "debug"
      value: true
...
```

The mutate string processors offer tools to manipulate strings in the incoming data. Say there was a need to split 
a string into an array. Simply add this processor:


```yaml
...
processor:
  - split_string:
    entries:
    - source: "message"
      delimiter: "&"
...
```

and an entry named `message` with a string such as `"a&b&c"` would transform into `["a", "b", "c"]`. Currently, 
there is support for `lowercase`, `uppercase`, `trim`, `substitute`, and `split`.

The [Logstash conversion tool](https://github.com/opensearch-project/data-prepper/blob/main/docs/logstash_migration_guide.md) 
has been updated to support conversion from Logstash's `mutate` filter into these new processors.

## Filtering with the Drop Processor

Data Prepper now supports a new [drop processor](https://github.com/opensearch-project/data-prepper/tree/main/data-prepper-plugins/drop-events-processor) 
which can filter out specified log events. Say you are collecting web request logs and only wish to store 
non-successful requests. You could create a pipeline which drops any requests where the response is less than 400 
so that only HTTP status codes 400 and above remain. The following example pipeline shows how you could configure this.

```yaml
log-pipeline:
  source:
    http:
      ssl: false
  processor:
    - grok:
        match:
          log: [ "%{COMMONAPACHELOG}" ]
    - drop:
        drop_when: "/response < 400"
  sink:
    - opensearch:
        hosts: [ "https://opensearch:9200" ]
        index: failure_logs
```

In the sample above, one of the processors is `drop`. The `drop_when` property defines a condition to determine 
which Events to drop from the pipeline. This condition is `/response < 400`.

## Extracting Key-Value Pairs from Strings

Often log data includes strings of key-value pairs. One common scenario is an HTTP query string. For example, if a 
web user queries for a pageable URL, the HTTP logs might have the following HTTP query string: 
`page=3&q=my-search-term`. If you wish to perform analysis using the search terms, you may wish to extract the 
value of `q` from a query string. Data Prepper’s new 
[key-value processor](https://github.com/opensearch-project/data-prepper/blob/main/data-prepper-plugins/key-value-processor/README.md) 
provides robust support for extracting keys and values from strings like these.

The following example shows how you could use the new `split_string` processor and `key_value` processor to get query 
parameters from an Apache log line.

```yaml
processor:
  - grok:
      match:
        message: [ "%{COMMONAPACHELOG}" ]
  - split_string:
      entries:
        - source: request
          delimiter: "?"
  - key_value:
      source: "/request/1"
      field_split_characters: "&"
      value_split_characters: "="
      destination: query_params
```

## Setting Timestamps on Events

Data Prepper provides a new 
[date processor](https://github.com/opensearch-project/data-prepper/blob/main/data-prepper-plugins/date-processor/README.md) 
to allow pipeline authors to configure the timestamp. This gives pipeline authors a couple options. The first option 
is to parse a field in the current Event according to a date-time pattern. This is useful if your log events already 
have timestamps in them. You can configure the timezone as well in case the timestamps come from other timezones. The 
second option is to use the time that Data Prepper receives events as the timestamp for events. You may wish to use 
this when receiving log data that does not have a timestamp.

## Aggregate Processor

Users often want to aggregate data from different Events over a period of time. This is important in order to reduce 
unnecessary log volume, and to handle use cases like multi-line logs that come in as separate Events. The `aggregate` 
processor is a stateful processor that groups Events together based on the values for a set of specified 
[identification_keys](https://github.com/opensearch-project/data-prepper/tree/main/data-prepper-plugins/aggregate-processor#identification_keys), 
and performs a configurable [action](https://github.com/opensearch-project/data-prepper/tree/main/data-prepper-plugins/aggregate-processor#action) 
such as `remove_duplicates` or `put_all` on each group. You can use existing actions, or you can create your own actions 
as Java code to perform custom aggregations.

State in the aggregate processor is stored in memory. For example, in order to combine four Events into one, Data Prepper 
needs to retain pieces of the first three Events. The state of an aggregate group of Events is kept for a configurable 
amount of time. Depending on your logs, the aggregate action being used, and the amount of memory available, the 
aggregation could take place over a long period of time.

In Data Prepper 1.3, two actions are being released with the `aggregate` processor: `remove_duplicates` and `put_all`. 
However, creating custom actions is extremely simple. If you are interested in learning more about creating custom actions, read the 
[aggregate README](https://github.com/opensearch-project/data-prepper/tree/main/data-prepper-plugins/aggregate-processor#creating-new-aggregate-actions). 
Additionally, please create a [Github issue](https://github.com/opensearch-project/data-prepper/issues/new/choose) 
for any actions you would like Data Prepper to support.

At the moment, the aggregate processor is only useful for single-node clusters of Data Prepper. However, utilizing the 
[peer forwarder](https://github.com/opensearch-project/data-prepper/issues/700)
to aggregate over multiple-node clusters is planned for a future release of Data Prepper.

The following pipeline configuration extracts fields of `sourceIp`, `destinationIp`, and `port` using the `grok`
processor, and then aggregates on those fields over a period of 30 seconds using the `aggregate` processor and 
the `put_all` action. At the end of the 30 seconds, the aggregated log is sent to the OpenSearch sink.

```yaml
aggregate_pipeline:  
   source:
     http:
       ssl: false
   processor:
     - grok:
         match: 
           log: ["%{IPORHOST:sourceIp} %{IPORHOST:destinationIp} %{NUMBER:port:int}"]
          
     - aggregate:
         group_duration: "30s"
         identification_keys: ["sourceIp", "destinationIp", "port"]
         action:
           put_all:
   sink:
     - opensearch:
         hosts: ["https://opensearch:9200"]
         index: aggregated_logs
```

Given the following batch of logs:

```json
  { "log": "127.0.0.1 192.168.0.1 80", "status": 200 }
  { "log": "127.0.0.1 192.168.0.1 80", "bytes": 1000 }
  { "log": "127.0.0.1 192.168.0.1 80" "http_verb": "GET" }
```

The grok processor will extract the `identification_keys` to create the following logs:

```json
  { "sourceIp": "127.0.0.1", "destinationIp": "192.168.0.1", "port": 80, "status": 200 }
  { "sourceIp": "127.0.0.1", "destinationIp": "192.168.0.1", "port": 80, "bytes": 1000 }
  { "sourceIp": "127.0.0.1", "destinationIp": "192.168.0.1", "port": 80, "http_verb": "GET" }
```

And when the group is concluded after a duration of 30 seconds from the time that the first log is 
received by the `aggregate` processor, the following aggregated log will be shipped to the sink:

```json
{ "sourceIp": "127.0.0.1", "destinationIp": "192.168.0.1", "port": 80, "status": 200, "bytes": 1000, "http_verb": "GET" }
```

## Other Improvements

In addition to the new features already described, Data Prepper 1.3.0 has a few other improvements.

* Many OpenSearch users setup rolling indexes based on time to help reduce storage costs. You can now configure Data Prepper to use a date and time pattern in your index names for log-based indexes. Data Prepper can also convert index names with date-time patterns from your Logstash configuration files.
* Data Prepper now uses the term “Processor” instead of “Prepper” in pipelines. This disambiguates the Data Prepper product from the processors which provide enrichment and transformation.
* Data Prepper is internally migrating plugins to the new Event model. Once completed, generic processors will be able to work for any Event type including traces. This release includes some work toward that goal allowing some trace sources and sinks to work with Events.

## Looking to the Next Release

This release allows Data Prepper to solve more log use-cases for developers and teams. 
[Data Prepper 1.4](https://github.com/opensearch-project/data-prepper/milestone/5) 
has other important features coming. We’d especially like to highlight the following significant changes.

* Data Prepper will begin to support metrics thanks to a [community contribution](https://github.com/opensearch-project/data-prepper/pull/1154).
* Many users have asked for a way to route different Events to different Sinks. Data Prepper’s [Conditional Routing](https://github.com/opensearch-project/data-prepper/issues/1007) will allow users to route based on our new Data Prepper Expression syntax.

You can see the [Data Prepper roadmap](https://github.com/orgs/opensearch-project/projects/221) to see other
upcoming changes. If there are any features on the roadmap that you are most interested in, please comment on the 
issue to help the team prioritize issues. You can also request any changes by creating a 
[GitHub issue](https://github.com/opensearch-project/data-prepper/issues/new/choose). This project is open source 
and we are happy to accept [community contributions](https://github.com/opensearch-project/data-prepper/blob/main/CONTRIBUTING.md).


