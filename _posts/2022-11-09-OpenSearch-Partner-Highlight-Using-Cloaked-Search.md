---
layout: post
title:  "OpenSearch partner highlight: Using Cloaked Search to protect your data"
authors:
  - zmre
date:   2022-11-14
categories:
  - partners
redirect_from: "/blog/partners/2022/11/OpenSearch-Partner-Highlight-Using-Cloaked-Search/"
---

Most companies will tell you that the data they hold is well protected. They'll say it's encrypted “at rest and
in transit,” which means they use HTTPS and disk-level or database-level encryption. Unfortunately, this isn't
the protection most people think it is.

## Most encryption claims are smoke and mirrors

What passes for data protection these days is often wildly overblown on the “protection” front.

HTTPS protects the data for a brief moment in time by warding off eavesdroppers and interlopers, but it
**doesn't change the availability of the data**. For example, this blog is served over HTTPS, and you are
probably not authenticated.

“At-rest encryption” is really only useful when someone steals a hard drive. When used by an always-on server,
the value drops to near zero. That's because the encryption key is only needed when the system starts up, after
which the protection is transparent to anybody accessing the server.

![Application-Layer Encryption]({{ site.baseurl }}/assets/media/blog-images/2022-11-09-OpenSearch-Partner-Highlight-Using-Cloaked-Search/app-layer-enc.png){: .img-fluid}

## Application-layer encryption: A better approach

When you encrypt the data before it is sent to the storage layer, an attacker scraping a database gets a bunch
of garbage bytes that aren't useful to them without the relevant keys. This is known as application-layer
encryption (ALE) because it happens at the layer above the data store instead of below it.

By separating the data and keys, companies can achieve meaningful defense-in-depth, where the everyday problems
of cloud misconfigurations, application vulnerabilities, and network breaches don't necessarily result in a
data breach. This makes gaining access to the needed keys an entirely different and more difficult problem for
an attacker.  

If this approach were used more often, we wouldn't constantly hear stories about attackers who get into a
corporate network, move laterally within the network to a database server, and then scrape all of the data
down for sale on the darknet. The companies who are implementing this correctly are the ones who aren't in
the news.

## Why encrypt data in OpenSearch?

Search services are often an underprotected backdoor way to gain access to sensitive data. They frequently hold
many different types of data that should be protected: personal information like names and addresses; log data
that includes web form submissions; communications records like emails, customer messages, and chats;
insider-trading fodder like roadmap info, financial projections, legal documents; and a variety of other
data that should be defended against unauthorized access.

A search service is akin to an attractive nuisance. Just as a swimming pool without a fence will attract
neighborhood kids, search data without encryption will attract hackers and employees.

The employee side is what we call the “curious insider” problem, where trusted users ignore policy and bypass or
abuse application-level access controls in order to peek at data they shouldn't. In most companies, employees in
roles such as database administration, ops, customer support, and engineering can sneak peeks at sensitive data.
These trusted folks who scratch the itch of curiosity can get a company in just as much trouble as a hacker.

![Cloaked Search Proxy]({{ site.baseurl }}/assets/media/blog-images/2022-11-09-OpenSearch-Partner-Highlight-Using-Cloaked-Search/cloaked-search-proxy.png){: .img-fluid}

Access to sensitive data should always be controlled. Backdoor access should be eliminated whenever possible.
That includes controlling access by admins. With ALE, a company can build in these
controls for all users and administrators and can fortify legitimate access with unbypassable audit trails.

## Protecting search data with Cloaked Search

At IronCore Labs, we provide tools and technologies that help companies protect their data with
ALE while keeping that data usable. One way we do that is by enabling search over
encrypted data.

[Cloaked Search](https://ironcorelabs.com/products/cloaked-search/) by IronCore Labs is a drop-in proxy that
sits in front of OpenSearch and automatically encrypts the sensitive data before it gets to the OpenSearch
service. It's ALE for search. A valid key is then required in order to search the data.  If you
don't have a valid key, the data in OpenSearch is useless.

![Cloaked Search Benefits]({{ site.baseurl }}/assets/media/blog-images/2022-11-09-OpenSearch-Partner-Highlight-Using-Cloaked-Search/benefits.png){: .img-fluid}

## Features and functionality

Cloaked Search is easy to deploy, simple to configure, **and immediately adds protection to the private data
held in your search service**. It comes packaged as a Docker container that deploys on your infrastructure.
Your application connects to it, and it then connects to the OpenSearch service. 

No plugins or other modifications needed to be added to OpenSearch, so it works as well with Amazon's service as with
your own cluster. And it can be configured such that even Amazon, if you host with them, can't access your
sensitive data.

Cloaked Search protects text fields and supports the most popular types of queries. It handles Boolean searches
(“and/or” qualifiers) with “must” and “must not” restrictions, prefix searches, suffix searches, phrase searches,
and phonetic searches. The results are similar to what you would get without the encryption. Cloaked Search supports
weighting of fields and other rank tuning, though you can't do everything. For example, Cloaked Search doesn't
support regular expression searches on encrypted fields. But for most users, it drops in and just works.

![Cloaked Search Functionality]({{ site.baseurl }}/assets/media/blog-images/2022-11-09-OpenSearch-Partner-Highlight-Using-Cloaked-Search/functionality.png){: .img-fluid}

For those who are holding personal, private, sensitive, or regulated data in their OpenSearch service, Cloaked
Search reduces the inherent risks. This makes it easier to comply with data privacy laws, data security requirements
set by statutes, and contractual obligations. If you offer software as a service, it also helps you earn the
trust of your customers. And for customers who have multiple tenants within OpenSearch, Cloaked Search seamlessly
integrates with SaaS Shield.

![SaaS Shield Integration]({{ site.baseurl }}/assets/media/blog-images/2022-11-09-OpenSearch-Partner-Highlight-Using-Cloaked-Search/saas-shield.png){: .img-fluid}

If you're looking for ALE encryption for the rest of your data, from queues to databases to files
on disk, [IronCore Labs](https://ironcorelabs.com/) can help you protect that, too, with developer-proof,
crypto-agile tools that handle key orchestration and make it easy for you to be private and secure by design.
