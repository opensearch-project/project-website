---
layout: post
title:  "Day in the Life of a Release Manager"
authors:
- eugenesk
date: 2022-08-25
categories:
 - community
redirect_from: "/blog/community/2022/08/day-in-the-life-of-a-release-manager/"
---

An OpenSearch version release can be a daunting prospect, especially if you’re the one managing it. There are ambiguously worded tasks that need to be completed, deadlines to be met. Now not only do you have to get your work done, but you also have to make sure that everyone else does too. Facing this challenge for the first time, I thought it would be useful to document the process so that any future release managers can avoid the mistakes I made.

It all starts with a gif. My manager asks in our team Slack if anyone would like to volunteer to be the release manager of our plugins. My mind immediately goes to the scene in the The Hunger Games where Katniss volunteers as tribute. I want to send the gif, but that means adding more to my plate. In addition to it being my first release, this one has big features, so I ask my colleagues if it will be manageable. They tell me that the work of a release manager starts after code freeze and that there will be no overlap between my responsibilities as an individual contributor and a release manager. The responsibilites would just be to complete a list of tasks for each of our plugins and report to the overall release manager. I am quickly convinced, and I hit send on the gif.

A couple weeks go by with no updates until a couple days before feature freeze, I am given my first mission: Add all of the plugins to the 1.3 release manifest with 1.3 branches. My actual first mission: Figure out what a release manifest is.

What is a release manifest? I turn to the [results](https://dzone.com/articles/release-snapshots-smart#:~:text=A%20release%20manifest%20contains%20the,signatures%20from%20sender%20and%20receiver.) of a quick Google search.

*A release manifest contains the collection of versioned stuff that is being deployed, configuration settings, and approvals. What, how, where, and who approved it. This is similar to a shipping form listing out the boxes sent, value and contents of the goods, destination, and signatures from sender and receiver.*

I find the release manifest for OpenSearch within a repository called [opensearch-build](https://github.com/opensearch-project/opensearch-build) within a folder conveniently called [manifests](https://github.com/opensearch-project/opensearch-build/tree/main/manifests). I start reading all of the docs I can find related to this release and previous ones. 

After forking the [repository](https://github.com/opensearch-project/opensearch-build), I check out a branch, add my team’s plugins to the manifest, and create a [pull request](https://github.com/opensearch-project/opensearch-build/issues/889#issuecomment-1036510660) (PR).

Two weeks before release, [GitHub issues](https://github.com/opensearch-project/observability/issues/503) are created in each repository with a checklist for each (the actual checklist that was created for this version release is pictured below). I self-assign the issue and check off some of the completed tasks. In hindsight, it seems obvious that I would know that checking off a task does not mean that it is actually completed. But this only becomes clear to me when I wake up one morning to the continuous integration (CI) builds failing.

![Image: Figure 1]({{ site.baseurl }}/assets/media/blog-images/2022-08-25-day-in-the-life-of-a-release-manager/release-checklist-1.png){: .img-fluid }

Thanks to a teammate, the issue is quickly triaged: dashboards-visualizations’ main branch has not been bumped to 1.3. My memory of bumping the version for three repositories conveniently expanded to include the fourth. Mortified, I glare at the fourth and fifth check marks of my checklist.

*Mistake #1: Checking off an item that wasn’t complete.*

As the code freeze date approaches, I hear other release managers talk about making sure branches are cut and manifests are updated. For the repositories I am managing, that means communicating with respective repo owners and tracking when they are ready to cut a 1.3 branch (Cutting a branch just means creating a new branch labeled 1.3, which marks the state of that release). Once pencils are down, I cut 1.3 branches and [update](https://github.com/opensearch-project/opensearch-build/commit/aa7590659cb8107102879f66274182b907aec347) the manifest to reference 1.3 instead of main. 

As OpenSearch moves toward its release date, I start my first release task: completing [documentation](https://github.com/opensearch-project/documentation-website). This means updating the [documentation-website](https://github.com/opensearch-project/documentation-website) repo. Along with documentation, release notes have to be gathered (the actual checklist that was created for this version release is pictured below).

![Image: Figure 1]({{ site.baseurl }}/assets/media/blog-images/2022-08-25-day-in-the-life-of-a-release-manager/release-checklist-2.png){: .img-fluid }

Now you may be wondering, as I was, what are release notes and where are they stored?

*Release notes are a categorized list of the commits that are going into the new release. They are most likely stored in a folder called release-notes (https://github.com/opensearch-project/observability/tree/main/release-notes) within the repository.*

Luckily, my team has a [script](https://github.com/opensearch-project/observability/blob/main/.github/draft-release-notes-config.yml) that automatically drafts release notes based on PRs that are merged with labels. Unluckily, none of the [observability](https://github.com/opensearch-project/observability) PRs were labeled, which means manually categorizing PRs. I create new release note files for this release in every repository.

*Note to self: For future releases, put a mechanism in place to make sure PRs are labeled before they are merged for future releases.*

After merging the PRs adding release notes, I check that off all of the lists. Little do I know, I have just made mistake #1 again. That afternoon I get a message from the overall release manager that one of my repositories does not have release notes. I learn that even repositories with no changes made for that release still need to have release notes. 

*Mistake #2: Not adding release notes for repositories with no changes.*

I quickly add a short release note and backport it to the 1.3 branch. 

*To backport is to add commits to the main branch and then also push them to the tip of a previously cut branch. Most repositories have scripts to [auto-backport](https://github.com/opensearch-project/observability/blob/main/DEVELOPER_GUIDE.md#backports) PRs.*

I return to completing documentation. Soon after, the release launches and [release tags](https://github.com/opensearch-project/observability/tags) are automatically created. My job as release manager abruptly comes to an end. My final mission: make sure any future, first-time release managers do not struggle and make the same mistakes I did. 
