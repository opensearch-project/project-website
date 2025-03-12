---
layout: post
title:  "S3 log ingestion using Data Prepper 1.5.0"
authors:
- dvenable
date: 2022-06-23 12:00:00 -0500
categories:
  - technical-post
twittercard:
  description: "You can start using Data Prepper 1.5.0 to ingest log data from S3 today."
redirect_from: "/blog/technical-post/2022/06/S3-Log-Ingestion-Using-Data-Prepper-1.5.0/"
---

Data Prepper is an open-source data collector for data ingestion into OpenSearch. It currently supports trace analytics 
and log analysis use cases. Earlier this year Data Prepper added log ingestion over HTTP using tools such as 
[Fluent Bit](https://fluentbit.io/).
And a recent community submission added OpenTelemetry metrics ingestion in Data Prepper 1.4.0.

Today, the Data Prepper maintainers announce the release of Data Prepper 1.5.0 with support for 
[Amazon Simple Storage Service](https://aws.amazon.com/s3/) (Amazon S3) as a source.


## The current environment

Many teams use cloud object stores such as Amazon S3 for storing logs. AWS services often write valuable logs to Amazon S3 that 
customers want to analyze. For example, Application Load Balancer writes access logs to S3. As part of a 
comprehensive log solution, teams want to incorporate this log data along with their application logs.

It’s not only AWS services writing logs to S3. S3 is a highly available service offering that does a fantastic job of 
taking in large volumes of data. Because it does this so well, some application developers are sending their logs to S3.

Right now, getting this log data out of S3 is complicated, and developers are writing their own code to read from S3. Much 
of this is duplicated code for receiving S3 Event Notifications and then parsing S3 objects. And developers may also encounter 
issues with the size and scale of some files.


## Go where the logs are

To solve these recurring issues for teams, Data Prepper 1.5.0 adds support for Amazon S3 as a source of log data. S3 has a 
feature called S3 Event Notifications that Data Prepper leverages to get log data. With this feature, Amazon S3 can send 
notifications to configured destinations whenever objects in an S3 bucket change. For example, if a new object is 
created, S3 will send this notification. You can configure an S3 bucket to send event notifications to an 
[Amazon Simple Queue Service](https://aws.amazon.com/sqs/) (Amazon SQS) queue whenever new objects are written to S3. You then configure Data Prepper 
to use that SQS queue for receiving event notifications.

Data Prepper polls the SQS queue to receive event notifications. For any newly created object, Data Prepper then gets that object out of S3 
and parses it into events. Initially, Data Prepper can read two types of formats:

1. Single-line logs - These are logs where a single log line indicates the same event.
2. JSON objects - Data Prepper expects a common JSON pattern where the JSON structure has one large JSON array of smaller objects. Data Prepper will create a single event from each smaller object.

Additionally, Data Prepper supports either uncompressed data or Gzip-compressed data.


### An example

Earlier, I mentioned supporting Application Load Balancer access logs. These logs are saved as traditional logs. 
Each network request is a single line in the log file, and that line follows a specific format. Additionally, Application Load Balancer logs are stored with 
gzip compression in S3.

There is a lot of rich information in these logs. You can determine whether requests are HTTP, HTTPS, or gRPC, and both the time that 
the entire request took to process and the time your application took to process it are available. Also, you can get 
the final status code, User-Agent headers, and AWS X-Ray trace information. Much of this information is available 
in your application logs, but you can also find out why an Application Load Balancer failed a request before sending it your application.


The following is an example Application Load Balancer log.

```
http 2022-06-22T20:18:15.398914Z app/awseb-AWSEB-1HEOQDG4Y6178/7714ad4a617cc2b1 72.29.185.16:4131 172.31.10.112:80 0.000 0.001 0.000 403 403 236 119 "GET http://myexample.com:80/orders/ad2f0b17-c32e-450c-b702-58037795939a HTTP/1.1" "python-requests/2.23.0" - - arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/awseb-AWSEB-7GYGTFHE3TC80/285a7d99a833502a "Root=1-62b32917-528df45625f90fd94b858e78" "-" "-" 0 2022-06-22T20:18:15.397000Z "forward" "-" "-" "172.31.10.104:80" "403" "-" "-"
```

Data Prepper can read these objects using the S3 Source, perform grok processing on the data, and create a document in 
OpenSearch that is much richer than just a single log line. The following pipeline shows how you could do this.

The first part is the `s3` source. It is new in Data Prepper 1.5.0.

After that comes the processor chain. It has three `grok` processors. The first one breaks up the log line into 
different parts. The second two break up some parts even further to produce more fine-grained information. Then the data 
processor adds a timestamp representing the time the data was received from S3.

After all of this, the data is sent to the configured OpenSearch cluster via the `opensearch` sink.

```
log-pipeline:
  source:
    s3:
      notification_type: "sqs"
      compression: "gzip"
      codec:
        newline:
      sqs:
        queue_url: "https://sqs.us-east-1.amazonaws.com/12345678910/ApplicationLoadBalancer"
      aws:
        region: "us-east-1"
        sts_role_arn: "arn:aws:iam::12345678910:role/Data-Prepper"

  processor:
    - grok:
        match:
          message: ["%{DATA:type} %{TIMESTAMP_ISO8601:time} %{DATA:elb} %{DATA:client} %{DATA:target} %{BASE10NUM:request_processing_time} %{DATA:target_processing_time} %{BASE10NUM:response_processing_time} %{BASE10NUM:elb_status_code} %{DATA:target_status_code} %{BASE10NUM:received_bytes} %{BASE10NUM:sent_bytes} \"%{DATA:request}\" \"%{DATA:user_agent}\" %{DATA:ssl_cipher} %{DATA:ssl_protocol} %{DATA:target_group_arn} \"%{DATA:trace_id}\" \"%{DATA:domain_name}\" \"%{DATA:chosen_cert_arn}\" %{DATA:matched_rule_priority} %{TIMESTAMP_ISO8601:request_creation_time} \"%{DATA:actions_executed}\" \"%{DATA:redirect_url}\" \"%{DATA:error_reason}\" \"%{DATA:target_list}\" \"%{DATA:target_status_code_list}\" \"%{DATA:classification}\" \"%{DATA:classification_reason}"]
    - grok:
        match:
          request: ["(%{NOTSPACE:http_method})? (%{NOTSPACE:http_uri})? (%{NOTSPACE:http_version})?"]
    - grok:
        match:
          http_uri: ["(%{WORD:protocol})?(://)?(%{IPORHOST:domain})?(:)?(%{INT:http_port})?(%{GREEDYDATA:request_uri})?"]
    - date:
        from_time_received: true
        destination: "@timestamp"

  sink:
    - opensearch:
        hosts: [ "https://localhost:9200" ]
        username: "admin"
        password: "admin"
        index: alb_logs
```

You can use Data Prepper’s `grok` processor, `mutate` processor, and other processors to 
ingest from other log sources as well.

## Possible future extensions

This initial version only supports two codecs: single-line logs and JSON. There may be opportunities to add other 
codecs, such as multiline logs, or Apache Parquet. Additionally, Data Prepper may benefit from a core concept of codecs
which can be shared across different Sources and Sinks.
Please comment on [this GitHub feature request](https://github.com/opensearch-project/data-prepper/issues/1532) to 
add the concept of codecs to Data Prepper.

## Other changes

* **Disabling index management**: Data Prepper can manage OpenSearch indexes. This can make it easier to get started with trace analytics in Data Prepper and OpenSearch. However, some teams have security requirements that prevent Data Prepper from having the necessary permissions to create Index State Management (ISM) policies, templates, or indexes. These teams may wish to manage indexes directly in OpenSearch. Data Prepper now allows for disabling any form of index management that reduces the permissions that Data Prepper needs on the OpenSearch cluster.
* **Custom metrics tags**: Data Prepper produces metrics indicating how Data Prepper itself is running. These metrics allow Data Prepper administrators to monitor the health of Data Prepper and its pipelines. Now, Data Prepper administrators can add custom tags to these metrics. This can help them to better organize their Data Prepper metrics.

## What's next

The [Data Prepper roadmap](https://github.com/orgs/opensearch-project/projects/221) is the best place to see what
is coming next. The maintainers are working toward Data Prepper 2.0, which will include 
[conditional routing](https://github.com/opensearch-project/data-prepper/issues/1007) of events and 
[core peer forwarding](https://github.com/opensearch-project/data-prepper/issues/700) for log aggregations.
