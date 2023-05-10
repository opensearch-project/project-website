---
layout: post
title:  "Discontinuing the custom Logstash distribution"
authors:
- dlv
date: 2023-05-11 12:30:00 -0500
meta_description: OpenSearch project will continue to provide Logstash plugins while discontinuing the custom distribution.
---

One of the core [OpenSearch project principles](https://opensearch.org/about.html) is to be used everywhere.
Among the many people already using OpenSearch, a large number use the data processing pipeline [Logstash](https://www.elastic.co/logstash/).
To help OpenSearch reach more people, we provide two Logstash plugins so that OpenSearch users can ingest data to and from OpenSearch using Logstash. 
Those two plugins are [logstash-output-plugin](https://github.com/opensearch-project/logstash-output-opensearch) and [logstash-input-plugin](https://github.com/opensearch-project/logstash-input-opensearch).  
We have also provided a custom distribution of Logstash with these plugins embedded.
However, we believe that OpenSearch users will continue to get as much benefit from the two plugins using the Apache-licensed Logstash distribution from Elastic. 
Therefore, we plan to discontinue the custom Logstash distribution by October 2023.

## Reasons to discontinue

Many users are downloading the custom OpenSearch distribution of Logstash, and we acknowledge that it does provide some convenience and value to OpenSearch users. 
However, we also recognize some compelling reasons to discontinue the distribution.

One of the reasons is to help users of these plugins get updates quickly. 
Because the custom distribution is based on the Apache-licensed distribution provided by Elastic, users cannot get the updates immediately after Elastic releases them. 
Instead, they have to wait for the OpenSearch project to repackage the updates.
This is especially important for security patches, when getting these updates as soon as possible is a consideration.

Another reason is that, by discontinuing the distribution, it becomes perfectly clear to users who exactly is responsible for supporting the tools they use.  
When a user needs support for Logstash features or bundled Logstash plugins, they typically go to the [Logstash discuss](https://discuss.elastic.co/c/elastic-stack/logstash/14) page.
When they have an issue with the OpenSearch plugins, however, they know to seek support from the OpenSearch project.

Finally, the main Logstash distribution already supports downloads for a variety of platforms. 
For example, it supports Linux, macOS, and RPM installations.
The custom OpenSearch distribution, on the other hand, lacks many of these distributions.

Installing the OpenSearch plugins in the main Logstash distribution is straightforward.
And given the ease of installation, along with the reasons we've already listed, we believe that a decision to discontinue the distribution outweighs the convenience associated with it.  
Discontinuing this distribution will also free up time and resources so we can better focus on delivering great features in our core products and the Logstash plugins.

## Going forward

The OpenSearch project will continue to maintain the existing Logstash plugins for OpenSearch.
To install the plugins, first [download Logstash](https://www.elastic.co/downloads/logstash) from Elastic and then run the following commands.

For the logstash-output-opensearch plugin, run:

```
bin/logstash-plugin install logstash-output-opensearch
```

And to install the logstash-input-opensearch plugin, run:

```
bin/logstash-plugin install logstash-input-opensearch
```

In the coming weeks, we will improve the documentation for using these plugins with the Logstash distribution and start to remove the download links for the existing distribution. 
We plan to stop releasing new versions by the end of July 2023. 
And we will retain existing download URLs through October 2023 to give time for users to update any automation they have in place.
