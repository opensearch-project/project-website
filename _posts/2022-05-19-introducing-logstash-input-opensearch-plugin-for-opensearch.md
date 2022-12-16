---
layout: post
title:  "Introducing logstash-input-opensearch plugin for OpenSearch"
authors:
- prashagr
date: 2022-05-19
categories:
 - community

excerpt: "In this post, we will talk about the new input plugin for Logstash. We will show how it works with OpenSearch by giving an example on how to read data from OpenSearch, perform a transformation, and index back to OpenSearch. This use case is useful in the event you want to migrate from one OpenSearch major version to another (e.g. 1.3 → 2.0)."
redirect_from: "/blog/community/2022/05/introducing-logstash-input-opensearch-plugin-for-opensearch/"
---

## Overview

Following the launch of [logstash-output-opensearch](https://github.com/opensearch-project/logstash-output-opensearch) plugin, the OpenSearch project team has released the logstash-input-opensearch plugin on [Github](https://github.com/opensearch-project/logstash-input-opensearch) as well as [Ruby Gems](https://rubygems.org/gems/logstash-input-opensearch/versions/1.0.0).

In this post, we will talk about the new input plugin for Logstash. We will show how it works with OpenSearch by giving an example on how to read data from OpenSearch, perform a transformation, and index back to OpenSearch. This use case is useful in the event you want to migrate from one OpenSearch major version to another (e.g. 1.3 → 2.0).


## What are Logstash plugins?

To understand what a plugin is in Logstash, it’s important to understand what makes up the stages for Logstash plugins:

![Logstash data flow originating from data source to inputs plugin, then to filters plugin, then to outputs plugin, then to final data destination](/assets/media/blog-images/2022-05-19-introducing-logstash-input-opensearch-plugin-for-opensearch/LogstashDataFlowFromSourceThroughPlugins.png){: .img-fluid}

1. **Inputs** are used to get data into Logstash. There could be 1 or more inputs (e.g., S3, Kinesis, Kafka).
2. **Filters** are buildings block for processing the events received from the input stages. Filters are not mandatory and there could be zero or more filters (e.g., Mutate, GeoIP).
3. **Outputs** are final stage of the Logstash and it can have one or more output to send the processed data from filters (e.g., OpenSearch).


## How do logstash-input-opensearch plugins work?

Plugins are configured within the Logstash config file. There are sections for **Input**, **Filter**, and **Output**. Once configured (see below), Logstash will send a request to the OpenSearch cluster and read the data as per the specified query in the inputs section. Once data is read from OpenSearch, you can optionally send it to next stage **Filter** for doing a transformation such as add a geolocation associated with an IP address. In this example, we won’t use the **Filter** plugin. Next up is the Output plugin. From the output section of the config file, you can either send the data back to same OpenSearch cluster or different clusters if desired.

### Setup Logstash and plugin

#### Logstash Installation

This step can be skipped if you already have [OSS version of logstash](https://opensearch.org/artifacts#:~:text=x64.tar.gz-,logstash%2Doss%2Dwith%2Dopensearch%2Doutput%2Dplugin,-docker%2Darm64) installed. Otherwise follow the steps below:

1. Download logstash-oss-with-opensearch-output-plugin (this example uses the distro for macos-x64). For other distro please refer the artifacts [here](https://opensearch.org/artifacts#:~:text=x64.tar.gz-,logstash%2Doss%2Dwith%2Dopensearch%2Doutput%2Dplugin,-docker%2Darm64).

```
wget https://artifacts.opensearch.org/logstash/logstash-oss-with-opensearch-output-plugin-7.16.3-macos-x64.tar.gz
```

2. Extract the downloaded tar ball.

```
tar - zxvf logstash-oss-with-opensearch-output-plugin-7.16.3-macos-x64.tar.gz
 cd logstash-7.16.3/
```

3. Install logstash-input-opensearch plugin.

```
./bin/logstash-plugin install --preserve logstash-input-opensearch
```

Once installation is done, you will see the message as below:

```
Validating logstash-input-opensearch
Installing logstash-input-opensearch
Installation successful
```


### Let’s get into action and see how the plugin works

In the introduction you have seen that Logstash processing has 3 stages. These stages are wrapped as part of config file. Let’s work on creating config to search data from one index in OpenSearch as my_index, and write the data into another index as my_index_new. Create a new file and add below content, save the file as **logstash-input-opensearch.conf** after replacing the OpenSearch HOST, PORT, USERNAME, PASSWORD, and INDEX with your OpenSearch cluster URL and credentials.




```
input {
  opensearch {
    hosts =>  ["https://HOST:PORT"]
    user  =>  "USERNAME"
    password  =>  "PASSWORD"
    index =>  "my_index"
    query =>  '{ "query": { "match_all": {}} }'
  }
}

output {
  opensearch {
    hosts =>  ["https://HOST:PORT"]
    user  =>  "USERNAME"
    password  =>  "PASSWORD"
    index => "my_index_new"
    ssl => true
    ecs_compatibility => "disabled"
  }
}
```


Using the above configuration, the `match_all` query filter is triggered and data is loaded once.

`schedule` setting can be used to periodically schedule ingestion using cron syntax.

Example: `schedule => "* * * * *"` Adding this to the above configuration loads the data every minute. 


### Start Logstash

You can run the logstash with below command:

```
./bin/logstash -f logstash-input-opensearch.conf
```


Once you run the command as above, logstash will search the data from source index, write to destination index and shutdown the logstash.


```
[2022-05-06T20:14:28,965][INFO][logstash.agent] Successfully
started Logstash API endpoint {:port=>9600, :ssl_enabled=>false}
…
…
[2022-05-06T20:14:38,852][INFO][logstash.javapipeline][main] Pipeline terminated {"pipeline.id"=>"main"}
[2022-05-06T20:14:39,374][INFO][logstash.pipelinesregistry] Removed pipeline from registry successfully {:pipeline_id=>:main}
[2022-05-06T20:14:39,399][INFO][logstash.runner] Logstash shut down.
```



## Summary

Using logstash-input-opensearch plugin you can read data from one OpenSearch cluster and write to same or another OpenSearch cluster. This is helpful if you are planning to reindex the data or looking to move data from one cluster to another cluster. You can also request any changes by creating a [GitHub issue](https://github.com/opensearch-project/logstash-input-opensearch/issues/new/choose). This project is open source and we are happy to accept [community contributions](https://github.com/opensearch-project/logstash-input-opensearch/blob/main/CONTRIBUTING.md).
