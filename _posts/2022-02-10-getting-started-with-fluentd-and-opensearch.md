---
layout: post
title:  "Getting started with Fluentd and OpenSearch"
authors:
- anurag_gup

date: 2022-02-10
categories:
 - technical

excerpt: "The OpenSearch project is, a community-driven open-source search and analytics suite derived from Apache 2.0 licensed Elasticsearch 7.10.2 and Kibana 7.10.2. In order to get started with OpenSearch you will need to get data into OpenSearch. A new method, built through a partnership of Calyptia and the OpenSearch project, is native plugins for Fluentd. Fluentd is an open-source log and metrics processor that is part of the Cloud Native Computing Foundation (CNCF)."
redirect_from: "/blog/technical/2022/02/getting-started-with-fluentd-and-opensearch/"
---

The OpenSearch project is, a community-driven open-source search and analytics suite derived from Apache 2.0 licensed Elasticsearch 7.10.2 and Kibana 7.10.2. In order to get started with OpenSearch you will need to get data into OpenSearch. A new method, built through a partnership of Calyptia and the OpenSearch project, is native plugins for Fluentd. Fluentd is an open-source log and metrics processor that is part of the Cloud Native Computing Foundation (CNCF).

In this getting started guide we go over how you can use the new Fluentd plugin to collect data from your infrastructure, containers, and/or network devices and bring them into OpenSearch.

## Use Cases

For users not familiar with Fluentd, one of its strengths is the ability to collect data from multiple sources through plugins and add formatting, processing, or enrichment before sending it out to multiple outputs. There are over 500+ community plugins for Fluentd that can read data including enterprise staples like Kafka, as well as data heavy backends like Hadoop and MongoDB.

A few popular use cases for Fluentd that now support OpenSearch as a backend include:


1. Integration with reading and writing from Kafka
2. Ingesting long term data into long term data stores (E.g. Hadoop, Google Cloud storage, Amazon S3)
3. Migrating from proprietary backends by routing data to multiple destinations
4. Listening on syslog for firewalls and networks devices and performing GeoIP or other enrichment
5. Routing application logs from apps running in Kubernetes




## How to get the new plugin?

There are two ways to get the new OpenSearch plugin that we will go over in this guide:

1. Calyptia Fluentd packages
2. Downloading as a Ruby gem


Of course the new Fluentd OpenSearch plugin is fully Apache 2.0 open source and available here: [_https://github.com/fluent/fluent-plugin-opensearch_](https://github.com/fluent/fluent-plugin-opensearch).



## Calyptia Fluentd packages

As Calyptia, we maintain a distribution of Fluentd, named Calyptia Fluentd. These packages contain all the downstream dependencies of Ruby and SSL, without you needing to maintain that yourself. 


With the latest 1.3.4 release of Calyptia Fluentd, the OpenSearch plugin is included by default.


### Download and install the package

1. [Red Hat Enterprise Linux / CentOS / Amazon Linux](https://docs.fluentd.org/installation/install-by-rpm)
2. [Debian / Ubuntu](https://docs.fluentd.org/installation/install-by-deb)
3. [Windows](https://docs.fluentd.org/installation/install-by-msi)
4. [MacOSX](https://docs.fluentd.org/installation/install-by-dmg)


### Adding configuration 
We can create a barebones configuration that allows us to send the message “dummy” to OpenSearch. We can store this configuration under `/etc/calyptia-fluentd/calyptia-fluentd.conf`

```
<source>
@type dummy
tag dummy
dummy {"hello":"world"}
</source>

<match dummy>
@type opensearch
host localhost
port 9200
index_name fluentd
</match>
```

### Running Calyptia Fluentd


To run Calyptia Fluentd and start sending data to OpenSearch we can use the command line or restart the services that are configured during installation. For example, on Mac we can run the following command: 

```shell
sudo launchctl load /Library/LaunchDaemons/calyptia-fluentd.plist
```

## Downloading as a Ruby gem

If you are already using Fluentd or another distribution you can also retrieve the OpenSearch plugin by downloading the Ruby Gem. The Ruby Gem can be downloaded by running the following command:


### Running the gem install command 


```shell
gem install fluent-plugin-opensearch
```



1. **Adding a configuration**

We can create a barebones configuration that allows us to send the message “dummy” to OpenSearch. We can store this configuration under `/etc/fluent.conf`


```
<source>
@type dummy
tag dummy
dummy {"hello":"world"}
</source>

<match dummy>
@type opensearch
host localhost
port 9200`
index_name fluentd
</match>
```


### Running Fluentd
Once completed you will then be able to run the following command to use the configuration used above.


```shell
fluentd -c /etc/fluent.conf
```


## Getting involved

With this getting started guide we talked through how you can retrieve Fluentd packages and get started with the Fluentd plugin for OpenSearch. There are tons of additional plugins for Fluentd to explore connecting to other sources and backends.


To join the conversation be sure to sign up to the Fluent Slack channel, as well as leave your feedback on the OpenSearch forums.
