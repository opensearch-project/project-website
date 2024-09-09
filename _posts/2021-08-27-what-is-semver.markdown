---
layout: post
title:  "OpenSearch Versioning, or What is SemVer anyway?"
authors: 
  - kyledvs
date:   2021-08-27 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "I think people often use Semantic Versioning (a.k.a SemVer) intuitively even if they don't know the term. So, let's take a look at what SemVer is and what it means for software like OpenSearch."
redirect_from: "/blog/technical-post/2021/08/what-is-semver/"
---

I think people often use Semantic Versioning (a.k.a SemVer) intuitively even if they don't know the term. So, let's take a look at what SemVer is and what it means for software like OpenSearch.

SemVer is a way of versioning software. Versioning software has been done in a variety of ways since the dawn of computing: date-based versioning (Windows 95), major/minor (MS DOS 6.22), and even some idiosyncratic versions (dBase III+), but as time went along the idea of a three component version became more predominant: e.g version 3.2.1. [S*emantic versioning* is a formalized three component version](https://semver.org/): the first component is the 'major', the second is a 'minor', and the third is a 'patch'.

## Quick overview

Each one of these components has meaning and provides the user with an understanding of the version. Let's start from the right with 'patch'. A patch version fixes something, for example a security patch. It doesn't add or remove any features and doesn't change any data formats or APIs. It should be considered an extremely low risk upgrade (and maybe even a risk to *not* upgrade). You can usually skip a patch version and still upgrade (the exceptions being where a patch fixes an issue in the upgrading process itself).

A minor version is one that provides something new, but it doesn't change the data formats or APIs. A minor upgrade should be a low risk upgrade, but you shouldn't feel compelled to upgrade since the data formats and APIs are the same. You just might miss out on a feature, a performance improvement, or a bug fix but otherwise it's no damage. You don't generally have to upgrade to each minor version, so you could skip from 1.1.0 to 1.3.0 safely. 

Major versions are breaking changes. They provide new functionality and break the API or data format. Major version upgrades are higher risks in upgrades that might require you to switch tools or client libraries. You’ll want to upgrade in sequence to avoid any potential breakage in the upgrade process (1.x.x → 2.x.x → 3.x.x, but usually not 1.x.x directly to 3.x.x)

These changes can be consolidated, so it's valid for major releases to have new, unbreaking features and fixes, just not the other way around. For example, version 3.0.0 could include many fixes, features, and breaking changes, but 3.0.1 could not include any breaking changes or features when compared to 3.0.0.

## The intuitive and the unintuitive

SemVer aside, when software breaks on a minor or patch version people tend to get cross - it seems wrong that 1.1.0 to 1.2.0 would mean that you need to carefully test. Indeed, this logic is baked into tools you use. It's not uncommon for package managers to allow you to auto-upgrade or install the latest minor or patch on every fresh install. And going from 1.0.0 to 2.0.0 is something that most people would understand to not automate - for good reason.

Unintuitively, SemVer does not indicate the drastic-ness of the change. Let's take a few scenarios:

1. A patch version is released that fixes a major conceptual misunderstanding. This patch version could change *thousands* of lines of code, yet as long as it's not a new feature and doesn't change the API or data formats, it's still a valid patch release.
2. A minor version includes dozens of new features. As long as the existing APIs and data formats are not disturbed by the the new features, this is still a valid minor release. 
3. An API endpoint is misspelled and is corrected. Under SemVer, this correction might only be *a single byte change*, but it would be considered a major release. Granted, if spelling issues in the API are being released, this is indicative of other quality issues that probably also need attention! 

That’s the biggest mental hurdle - a major version does not indicate a major leap forward or lots of new features. It just means that it’s breaking compatibility.

One question that comes up occasionally is why minor and patch are isolated from one another - if a feature doesn't break anything then why does it need a different type of release? One of the major reasons is that new additions to the code have a higher risk of causing problems. Consider that adding a new feature could take up significantly more resources. Adding new features over fixing existing features carries inherently more risk.

A minor release also might not contain any new features under one specific circumstance. SemVer states that deprecations trigger a new minor release. So, the APIs do *function* between these versions, just stating that a feature or part of the API is deprecated would be enough to cut a new minor version.

## SemVer at play in OpenSearch

Because OpenSearch is still at 1.0.0, there is no history to draw upon as examples. However, looking at some planned changes in the OpenSearch roadmap there are a few examples of changes that will have to be in patch, minor, and major versions:

1. In [security-dashboards-plugin#805](https://github.com/opensearch-project/security-dashboards-plugin/issues/805), there is an issue where the tenant name displayed in the UI could reflect an out-of-date value. This is planned to be released in 1.0.1. This is a good example of something that could be contained in a patch release as it only fixes and existing feature and it doesn’t break the data format nor the API.
2. [OpenSearch#846](https://github.com/opensearch-project/OpenSearch/pull/846) introduces a new tool for migrating Elasticsearch nodes to OpenSearch. The 1.1.0 release will carry this feature. Because it’s a new feature, it can’t be in a patch version but yet it doesn’t break the data format or API, so the upgrade risk is still low and it could go in a minor release.
3. While OpenSearch 2.0.0 is still many months from release, [OpenSearch#472](https://github.com/opensearch-project/OpenSearch/issues/472) describes changing the API from ‘Master’ to a new, as yet undetermined, term. While this will probably not have many actual logic changes, this does have a change on the externally facing APIs, so it has to go into a major version, 2.0.0.

These are, of course, forward looking and could move around in actual version numbers but because of SemVer, the requirements stay the same. However, because of consolidation, all of these changes could end up in the next major version.


## OpenSearch & SemVer

First, the software OpenSearch was forked from **does not** follow semantic versioning, despite using a three component version. As a result, Open Distro **did not** follow semantic versioning. OpenSearch, from the outset, has used semantic versioning. 

The OpenSearch plugins and OpenSearch Dashboards plugins do not *quite* follow semantic versioning though. These plugins use a four component version number (1.2.3.4), with the fourth component being build metadata. At the time of writing, this [build metadata doesn’t follow the SemVer spec syntactically](https://semver.org/#spec-item-10) but it’s conceptually compatible. Additionally, each plugin is developed somewhat independently, so each one may have different build metadata. These plugins are released in coordination with the OpenSearch and OpenSearch Dashboards distribution that *does* follow semantic versioning, so that’s what you should be most concerned about.

One consequence of SemVer is that OpenSearch may end up with a much higher version number over time - again this doesn’t indicate re-writes or major changes, but it’s really a way for the developers of the project to communicate directly and concisely to the user why the version was released.

As a user, this means that OpenSearch will be released predictably and you can judge if a release is an upgrade path for your situation just by glancing at the version number compared to yours. For the developers of OpenSearch it gives clear instruction on what constitutes a major, minor, and patch version.

Now that you’re armed with this knowledge, it’s a great time to take a look at the [roadmap](https://github.com/orgs/opensearch-project/projects/220) and see what is in store for the OpenSearch project!


