---
layout: post
title:  "OpenSearch Partner Highlight: BYOK for B2B SaaS Operators using OpenSearch"
authors:
  - pakshirajan 
date:   2022-04-26 01:01:01 -0700
categories:
  - partners
redirect_from: "/blog/partners/2022/04/partner-highlight-titaniam-byok/"
---

We recently learnt that a number of our prospects were running their B2B SaaS platform on top of Elasticsearch. Nearly all of them asked if we also support AWS OpenSearch. Many of them are running older versions of Elasticsearch and are evaluating if they should upgrade to a more recent version or migrate to OpenSearch to stick to Apache license. This is about to play out in large scale in the upcoming months. SaaS companies operate on their customers' data, and they have to take all the precautions within their reach to protect that data. 

In my previous OpenSearch Partner blog ([link](https://opensearch.org/blog/partners/2021/08/partner-highlight-titaniam/)), we reviewed all the great security features that are part of OpenSearch (inter-node TLS, authentication, RBACs, Audit logging and OSD multi-tenancy) and a high level overview of Titaniam's _data-in-use_ encryption plugin for OpenSearch.

Titaniam plugin for OpenSearch can be installed on your OpenSearch cluster in a few minutes. Once installed, it encrypts the designated fields in selected indices before OpenSearch indexes the data, while preserving all its awesome search capabilities. You can designate which fields in your index need to be protected and how it will be released in search results.

This blog addresses an important need for B2B SaaS providers who is already running on an OpenSearch backend or strongly considering it: _**BYOK (Bring Your Own Key)**_.

## Problem

You are a B2B SaaS provider. You have filled out that long security questionnaire as part of the presales process. You have faced questions like 
1. How do you protect my data? 
2. Can your devops staff see my data?

You may point to encryption built into the storage layer - like AWS S3&#39;s SSE-S3 or EBS volume encryption. These encryption solutions protect the data from being viewed by AWS datacenter employees, not your devops team.

Your enterprise prospects know this as well. Especially the ones from regulated industries such as banking, finance, healthcare. With ransomware attacks and data breaches on the rise, they demand more. They press you to ship your SaaS software for on-premise deployment. What do you do?

1. Shipping SaaS software for on-premise deployment is a nightmare. SaaS Software is built to run on a very specific software stack by a team of specialists (your devops ninjas). It does not distribute well or lend itself to be run by enterprise IT. Dependencies on cloud stacks, distributed computing, cost optimizations that only work at scale - impedance mismatches start to count up. Building out the platform support matrix will bury your engineering team on low value tasks (supporting Oracle 12g, Oracle Linux version 7.1).

2. As a SaaS vendor you enjoy several advantages: fewer release branches, agility in upgrading and patching, rich instrumentation, visibility into usage, direct line to customer challenges etc. Dollar for dollar, your SaaS revenue is 5-10x more worthy than on-prem revenue towards your company&#39;s valuation. Shipping your software for on-prem deployment grinds away that advantage.

You&#39;d like to be able to give definitive answers to your prospects:

1. &quot;We encrypt your data with the highest data protection standards (NIST FIPS 140-2).&quot;
2. &quot;Our devops team cannot see your data in clear text.&quot;
3. &quot;As our premium enterprise customer, you can supply and control the encryption keys. You can revoke them whenever you want.&quot; aka BYOK - _Bring Your Own Key_.

However, implementing this takes massive engineering effort. And you would rather continue to invest in areas of your core competency than in specialized encryption.

Titaniam can help. Titaniam is the preeminent provider of encryption solutions protecting big data stores such as AWS S3 and search engines such as AWS OpenSearch. All Titaniam offerings come with consistently implemented BYOK capabilities giving your customers a simple and seamless key management experience. You can roll out Titaniam and secure your SaaS backend in a matter of weeks with minimal engineering effort allowing your team to focus on what they do the best - building and running your software. See my last blog for how Titaniam protects the data in your OpenSearch ([link](https://opensearch.org/blog/partners/2021/08/partner-highlight-titaniam/))

This document

- Outlines the BYOK aspects of the Titaniam encryption and
- Presents you a solution architecture

## BYOK for OpenSearch

BYOK in Titaniam for OpenSearch is built further upon the existing strengths of searchable encryption. It is built using two simple premises - index specific encryption keys and ability to read those individual keys from any location.

As a SaaS operator it requires just one thing - maintain a separate search index (or a set of indices) for each customer. This is anyway a good practice from both security and maintenance stand point; it allows for independent upgrades, encryption key rotation, etc. Titaniam plugin comes with a key registry where you can register which index needs to be secured using which encryption key (i.e. which customer it belongs to) and where to read each key from. Titaniam reads the encryption keys directly from your customers keystore. Titaniam supports common key stores such as AWS Secrets Manager, Hashicorp Vault etc.

Steps to enabling data protection with BYOK for your OpenSearch based application.

1. Install Titaniam Plugin for OpenSearch
2. Choose which fields to protect. In a typical OpenSearch index, not all documents need to be secured and searched. You choose specific fields to secure.
3. Test out your front end application works seamlessly.
4. Create a key registry - specify which index should use which key and provide Titaniam with the credentials (in encrypted form) to access the corresponding keystores.
5. Start loading data and querying it.

![query-results](/assets/media/blog-images/2022-04-26-partner-highlight-titaniam/BYOK_Opensearch.png){: .img-fluid}  
**Fig1. BYOK in Titaniam Plugin for OpenSearch**

Your customers can supply their key in any key store of their choice by putting it in a simple JSON structure like this.

    {
      "key":"CjWe57Pl4sDn...7cu8Z1WC/H5tkgmpgXbo968WI",
      "disabled":"false"
    }

To disable access to their keys, they just have to turn the second attribute to true. Titaniam plugin checks the various customers&#39; keystores periodically (e.g. every minute) to see if any customer has revoked a key. If it finds a revoked key, it will add that information to the log and disable search and decryption on that index.

## Consistency in BYOK

Unlike other point solutions, Titaniam fulfills the BYOK promise in a consistent manner across all its products. Titaniam can use the same (or same set of) customer controlled keys to encrypt customer&#39;s data, whether it is stored in AWS S3 or AWS OpenSearch. Your enterprise SaaS customers will immediately gain control over all their data held by you, their SaaS vendor.

Titaniam handles not just the well-trodden happy path, but all the scenarios that occur with distributed key management such as network fault tolerance, key revocation and reinstatement, key rotation, usage report and dashboards.

Titaniam supports a range of keystores for the customers to work with, such as AWS Secrets Manager, Hashicorp Vault etc. so that your customers do not have to open up new cloud accounts or install anything unnatural to manage encryption keys.

## About Titaniam

Titaniam is a leading provider of encryption based data protection for modern big data stores. At the heart of Titaniam&#39;s encryption capability is searchable encryption which allows the data to be searched and aggregated without decryption. To find out more about us and our complete product portfolio visit our website ([https://titaniam.io](https://titaniam.io/partners/opensearch/?utm_source=opensearch&amp;utm_medium=blog&amp;utm_campaign=byok)).
