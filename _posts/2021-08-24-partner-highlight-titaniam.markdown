---
layout: post
title:  "OpenSearch Partner Highlight: How Titaniam Arcus can further secure your OpenSearch Deployment"
authors: 
  - pakshirajan
date:   2021-08-24 01:01:01 -0700
categories: 
  - partners
redirect_from: "/blog/partners/2021/08/partner-highlight-titaniam/"
---

Over the past few years there have been [numerous security breaches](https://en.wikipedia.org/wiki/List_of_data_breaches) reported in the news. These types of incidents are top of mind as people want to ensure the software and services they build are secure. OpenSearch provides an out-of-the-box security plugin so that developers can build OpenSearch deployments securely. The out-of-the-box [features](https://opensearch.org/docs/security-plugin/index/) include:

* [TLS](https://opensearch.org/docs/security-plugin/configuration/tls/) for the REST API, node-to-node communication, and OpenSearch Dashboards
* [Built-in authentication](https://opensearch.org/docs/security-plugin/configuration/concepts/) with support for Active Directory, LDAP, SAML OpenID, and more
* [Role-based access control](https://opensearch.org/docs/security-plugin/access-control/index/) with index-level, document-level, and field-level security
* [Audit Logging](https://opensearch.org/docs/security-plugin/audit-logs/index/)
* [OpenSearch Dashboards multi-tenancy](https://opensearch.org/docs/security-plugin/access-control/multi-tenancy/)

 
This blog dives into how  [Titaniam](https://www.titaniamlabs.com/) can further strengthen the OpenSearch security posture with the [Titaniam Arcus plugin](https://www.titaniamlabs.com/titaniam-protect-arcus-for-elasticsearch/).

# The value of encryption-in-use

Encryption is an essential data protection tool in the security toolbox. It is because of encryption that we all can sleep at night knowing our valuable data is secure while flowing through networks and being stored at rest. However, the ability to encrypt data has traditionally been limited to data-at-rest (file system) and data-in-transit (TLS). When it comes to actually utilizing data, say for instance when data is being indexed, searched and analyzed (i.e. ***data-in-use***), it is processed in clear text. Modern day attackers can exploit stolen credentials to get to the data just like how your application would access the data. In this attack vector both data-at-rest or data-in-transit encryption do not help.
 
Nowhere is this more relevant than in the world of enterprise search. Conducting search and analytics on vast quantities of data requires indexing and persisting of this data in clear text. Search and analytics solutions are often the targets for data hungry ransomware and extortion actors, who either look for misconfigured clusters or steal admin credentials. Once inside, they exfiltrate and use this data to extort their victims and their victims’ customers and partners; sometimes leaking and selling the data to other cyber criminals on the dark web. 

# How does Titaniam Arcus solve this problem?

The Titaniam Arcus Plugin for OpenSearch enables sensitive data to be indexed and searched while always keeping the data in [FIPS 140-2 certified encryption format](https://csrc.nist.gov/publications/detail/fips/140/2/final). Here is how it works: 
 

* All  sensitive data is preprocessed and encrypted prior to being indexed. 
* Queries  are intercepted and reformulated to execute in encrypted space without any  data decryption whatsoever. 
  * Titaniam Arcus supports most types of queries  - term, prefix, wildcard, match, match-phrase, match-phrase-prefix, range,  term (CIDR) etc.
* Query  results are natively released in encrypted form. Here is an example of  query results:

![query-results](/assets/media/blog-images/2021-08-24-partner-highlight-titaniam/titaniam-query-results.png){: .img-fluid}  
**Fig1. Titaniam Arcus for OpenSearch returning results in encrypted form**


* Titaniam  Arcus does all the above without significantly impacting ingest and search  performance – typically up to about 10% when ingesting data and 2-3% when  searching.

* ** *
*All this means that even if attackers find their way to your OpenSearch deployment, the data they exfiltrate would be encrypted and unusable to the attacker.*
 
So how does a legitimate user get clear text out of OpenSearch with Titaniam Arcus enabled? There are several controlled release processes including direct allowlisting and controlled release via pre-integrated proxy or translation service. All release configurations are defined at the granular field-level, and you can set up different fields to behave differently.
 
![titaniam-panther](/assets/media/blog-images/2021-08-24-partner-highlight-titaniam/titaniam-panther.png){: .img-fluid}  
**Fig2. Titaniam Panther translating the results from Arcus**
 
Titaniam Arcus comes with a rich key management infrastructure including index specific keys, keystore integrations, key rotation, field-level key derivation and integrations to major key vaults. If you are a SaaS operator or Managed Service Provider, Titaniam’s *index-specific keystore* capability allows you to offer the *Bring Your Own Key* capability to your customer.

# Want to learn more?

For more information, you can visit the [OpenSearch Arcus page](https://www.titaniamlabs.com/opensearch-arcus/) on Titaniam Labs or give it a try following these [instructions](https://docs.titaniamlabs.com/arcus/opensearch/getstarted.html). 


 
 


