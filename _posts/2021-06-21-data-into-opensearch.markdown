---
layout: post
title: How do you plan on getting data into OpenSearch?
authors: 
  - kyledvs
  - elifish
date: 2021-06-21
categories:
  - community
twittercard:
  description: "In introducing OpenSearch we said: \"The Amazon OpenSearch Service APIs will be backwards compatible with the existing service APIs to eliminate any need for customers to update their current client code or applications. Additionally, just as we did for previous versions of Elasticsearch, we will provide a seamless upgrade path from existing Elasticsearch 6.x and 7.x managed clusters to OpenSearch.\"... "
redirect_from: "/blog/community/2021/06/data-into-opensearch/"
---

I expect very few people will *only* use OpenSearch and OpenSearch Dashboards. Sure, you might do a little testing with the sample data in OpenSearch Dashboards, but really you’re going to be using something to help you get some data into that cluster. There is a ton of existing, compatible software that can help you do just that - agents, client libraries for programming languages, and data pipeline tools. 

Having a good end-to-end experience is important to the success of OpenSearch. Consequently, the team is looking to invest time and resources in testing, documenting and potentially contributing back to the tools to ensure that you have a smooth journey from agent to dashboard. However, like most things in life, the testing and documentation resources are not infinite and the team is looking to make the investment into the most used tools first.

In order to get a grasp on the usage of these tools [Eli](/authors/elifish/) from the product team has put together a poll in our forum. It breaks down the known tools and for each tool it allows you to indicate: 

* You’re currently using,
* You’re not using but interested,
* You’re not using and not interested.

So, head on over to [the forums](https://discuss.opendistrocommunity.dev/t/what-clients-agents-and-ingestion-tools-do-you-use/6269) and give mark your usage and interest. We’ll keep the survey active for 7 more days.
