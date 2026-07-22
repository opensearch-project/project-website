---
layout: post
title:  "Adopting inclusive language across OpenSearch"
authors:
- andrross
- tlfeng
date: 2022-10-18
categories:
 - technical-post

excerpt: "We are removing exclusionary language from the OpenSearch Project, including from APIs, documentation, and source code. Specifically, we are replacing the non-inclusive terms \"master\" and \"blacklist/whitelist\" with inclusive language throughout the OpenSearch Project."
redirect_from: "/blog/technical-post/2022/10/Adopting-inclusive-language-across-OpenSearch/"
---

We are removing exclusionary language from the OpenSearch Project, including from APIs, documentation, and source code. Specifically, we are replacing the non-inclusive terms "master" and "blacklist/whitelist" with inclusive language throughout the OpenSearch Project. 


|Deprecated terminology	|Alternative terminology	|
|---	|---	|
|master	|cluster manager	|
|blacklist	|deny list	|
|whitelist	|allow list	|

## Why are we making this change?

Inclusive language helps to avoid excluding people based on gender, sexual orientation, age, race, ability, etc. By using language that avoids prejudice, we aim to create a more equitable community.

 
Using inclusive language helps to build an environment that encourages diversity and ensures that all community members feel welcome, respected, and safe.

## How does this impact users?

Many users will see no impact, as the indexing and search APIs have few changes. However, all users should audit their usage of OpenSearch 2.x to prepare for and make the necessary updates ahead of removing exclusionary language in OpenSearch 3.0.

### OpenSearch users

OpenSearch displays warnings for all uses of deprecated REST APIs and settings. The general process for updating is to find all uses of a deprecated API or cluster setting and replace them with the new alternative. There is a simple one-to-one replacement option for the exclusionary terms in all cases. For example, the parameter `master_timeout` can be replaced directly with `cluster_manager_timeout`. All deprecations and their replacements in the REST APIs and settings are available in OpenSearch 2.0, so users can complete the update today.

Here are some common REST APIs and settings to update when upgrading to version 3.0:

* The node role `master` -> `cluster_manager`
* The REST API endpoint `GET _cat/master` -> `GET _cat/cluster_manager`
* The cluster setting `cluster.initial_master_nodes` ->  `cluster.initial_cluster_manager_nodes`

The OpenSearch documentation will list other REST APIs and settings affected by the change in terms upon the release of 3.0.

### Plugin developers

The OpenSearch server offers extensibility through a plugin API that allows external developers to add features and functionality by implementing custom Java-based plugins. For the most part, plugin developers can follow the same general process of finding uses of deprecated Java APIs in OpenSearch 2.x and replacing them with the new alternative. Unfortunately, there has never been a strictly enforced boundary between a plugin extension point in the OpenSearch server and a logically internal but public Java class. This means the surface area of potentially impacted APIs is quite large, and given some limitations in extending Java classes, we can't account for all instances by using a two-step deprecate-and-replace-with-alternative approach. For example, an existing method that has an exclusionary term only in the return type cannot be overridden to provide a non-exclusionary alternative side by side. In these cases, plugin developers will encounter compiler errors when upgrading to OpenSearch 3.0. Fortunately, the fix in all cases is a simple replacement.

For example, the following line will create a compiler error:

```
 import org.opensearch.action.support.master.AcknowledgedResponse
```

This type of error can be fixed by changing the line to the following:

```
import org.opensearch.action.support.clustermanager.AcknowledgedResponse
```

 Here's a list of other APIs you should update when upgrading to OpenSearch 3.0:

* `org.opensearch.action.support.master.AcknowledgedRequest` -> `org.opensearch.action.support.clustermanager.AcknowledgedRequest`
* `org.opensearch.action.support.master.AcknowledgedRequestBuilder` -> `org.opensearch.action.support.clustermanager.AcknowledgedRequestBuilder`
* `org.opensearch.action.support.master.AcknowledgedResponse` -> `org.opensearch.action.support.clustermanager.AcknowledgedResponse`
* `Map<ScriptContext<?>, List<Whitelist>> getContextWhitelists()` -> `Map<ScriptContext<?>, List<Allowlist>> getContextAllowlists()`
* `org.opensearch.painless.spi.Whitelist` -> `org.opensearch.painless.spi.Allowlist`
* `org.opensearch.painless.spi.WhitelistLoader` -> `org.opensearch.painless.spi.AllowlistLoader`

## How can you get involved?

Check out our blog post [From the editor's desk: OpenSearch and inclusion](https://opensearch.org/blog/community/2022/08/New-series-From-the-editors-desk/) to learn more about our guidelines for inclusive language and how you can help drive change across our community, documentation, forums, and projects. You can also learn more about the [Inclusive Naming Initiative](https://inclusivenaming.org/), which works closely with companies and the open-source community to remove harmful, exclusionary language. 
