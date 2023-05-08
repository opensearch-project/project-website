---
layout: post
title:  "Discontinuing the custom Logstash distribution"
authors:
- dlv
date: 2023-05-11 12:30:00 -0500
---

One of the core [OpenSearch project principles](https://opensearch.org/about.html) is to be used everywhere. 
Many users use [Logstash](https://www.elastic.co/logstash/) - a data processing pipeline - with OpenSearch. 
To help OpenSearch be used everywhere, we provide two Logstash plugins to allow OpenSearch users to ingest data to and from OpenSearch using Logstash: [logstash-output-plugin](https://github.com/opensearch-project/logstash-output-opensearch) and [logstash-input-plugin](https://github.com/opensearch-project/logstash-input-opensearch). 
We have also provided a custom distribution of Logstash with these plugins embedded. 
We believe that OpenSearch users will continue to benefit from our plugins using only the Apache-licensed Logstash distribution from Elastic and plan to discontinue the custom Logstash distribution by October 2023.

## Reasons to discontinue

Many users are downloading the custom OpenSearch distribution of Logstash. 
So it does provide some convenience and value to OpenSearch users. 
However, we find some compelling reasons to discontinue the distribution.

One of the reasons is to help users get updates quickly. 
Because the OpenSearch distribution is based on the Apache-licensed distribution provided by Elastic, users cannot get the updates immediately after they are released. 
They have to wait for the OpenSearch project to repackage the updates. 
This is especially important for security patches which the OpenSearch project aims to provide as soon as possible.

Another reason is to provide clarity for users on who is supporting these tools. 
With this change, the direction to users for support is clear. 
If a user needs support for Logstash features or bundled Logstash plugins, they go to the main [Logstash support](https://discuss.elastic.co/c/elastic-stack/logstash/14). 
When they have an issue with the OpenSearch plugins they know to seek support from the OpenSearch project.

Finally, the main Logstash distribution already supports downloads for a variety of platforms. 
For example, it supports Linux, macOS, and RPM installations. 
The current OpenSearch distribution lacks many of these distributions.

Installing the OpenSearch plugins in the main Logstash distribution is straightforward. 
Because it is quite easy, we believe that the reasons to discontinue outweigh the convenience of having the distribution. 
Discontinuing this distribution will let us focus on deliver great features in our core products and the Logstash plugins.

## Going forward

The OpenSearch project will continue to maintain the existing Logstash plugins for OpenSearch. 
Users will be able to [download Logstash](https://www.elastic.co/downloads/logstash) from Elastic. 
Then run the following commands to install the plugins.

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
