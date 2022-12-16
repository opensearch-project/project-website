---
layout: post
title: Introducing the community projects page
authors: 
  - elifish
date: 2021-06-30
categories:
  - community
twittercard:
  description: "Many open source projects benefit from the ecosystem of software created on top of or for the project. As a first steps towards having a robust ecosystem, opensearch.org now has added a community projects page to highlight projects created for the OpenSearch community by the OpenSearch community... "
redirect_from: "/blog/community/2021/06/introducing-community-projects/"
---

Many open source projects benefit from the ecosystem of software created on top of or for the project. As an example, the Node Package Manager (NPM) makes JavaScript more approachable. It hosts a variety of modules that solve problems people face during the development of JavaScript software. Users can quickly search for these modules install them and incorporate them directly into their JavaScript project. Having a similar ecosystem for OpenSearch will help all of us get more out of our own OpenSearch deployments. As a first step, I wanted to share that [opensearch.org](/) now has a [community projects page](/community_projects/). The goal of this page is to highlight projects built by the OpenSearch community for the OpenSearch community.

![OpenSearch Community Projects Page](/assets/media/blog-images/2021-06-30-introducing-community-projects/screenshot.png){: .img-fluid}

**What kinds of projects are appropriate to highlight?**
As mentioned above, the goal of this page is to highlight projects built by the OpenSearch community for the OpenSearch community. Any project that helps people use or get more value out of OpenSearch is appropriate for the page, regardless of the project license. Projects could be OpenSearch plugins, OpenSearch Dashboards plugins, client libraries, ingestion tools, and more. For example, the first two projects highlighted are the [OpenSearch Plugin Template](https://github.com/AmiStrn/opensearch-plugin-template-java) (by [AmiStrn](https://github.com/AmiStrn)) and the [Flattened Data Type plugin](https://github.com/aparo/opensearch-flattened-mapper-plugin) (by [aparo](https://github.com/aparo)). Each project has a *name*, *description*, *icon (optional)*, *license*, *owner*, and *download link (optional)*. 

**How do I get a project added to the page?**
Getting a project added is as simple as creating a pull request (PR). Just follow the instructions in the [community projects page](/community_projects/) to know where to add your project information and submit a PR. Once you have created the PR, one or more of the OpenSearch website maintainers will review it, and work with you to resolve any issues. Once the PR is merged, the website will be updated to include your project. 

**Where do we go from here?**
This is a first step in highlighting OpenSearch community projects. Overtime this page will evolve to have search functionality, tags, project types and more. The ultimate goal is for all of us to have a catalog of projects that any of us can easily search through and incorporate into our OpenSearch and OpenSearch Dashboards deployments. If you’ve got something you’d like to add, go ahead and open a PR on [the website repo](https://github.com/opensearch-project/project-website) or reach out on [the forums](https://discuss.opendistrocommunity.dev/).

I'd like to thank the people involved in creating the first version of this page:
* [AmiStrn](https://github.com/AmiStrn) for volunteering to have the Plugin Template added
* [aparo](https://github.com/aparo) for volunteering to have the Flattened Data Type plugin added
* [stockholmux](https://github.com/stockholmux) for reviewing the blog post and project page PR
* [kgcreative](https://github.com/kgcreative) for styling the page
