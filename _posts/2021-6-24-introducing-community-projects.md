---
layout: post
title: Introducing the community projects page
authors: 
  - elifish
date: 2021-06-24
categories:
  - community
twittercard:
  description: "Many open source projects benefit from the ecosystem of software created on top of or for the project. As a first steps towards having a robust ecosystem, opensearch.org now has added a community projects page to highlight projects created for the OpenSearch community by the OpenSearch community... "
---

Many open source projects benefit from the ecosystem of software created on top of or for the project. As an example, the Node Package Manager (NPM) has been instrumental in helping JavaScript be more approachable. It hosts a variety of modules that solve problems people face during the development of JavaScript software. Users can quickly search for these modules install them and incorporate them directly into their JavaScript project. I believe having a similar ecosystem for OpenSearch will help all of us get more out of our own OpenSearch deployments. As a first step, I wanted to share that [opensearch.org](http://opensearch.org/) now has a [community projects page](http://opensearch.org/community_projects/). The goal of the community projects page is to highlight projects created for the OpenSearch community by the OpenSearch community.

![OpenSearch Community Projects Page](/assets/media/blog-images/2021-06-24-introducing-community-projects/screenshot.png){: .img-fluid}

**What kinds of projects are appropriate to highlight?**
As mentioned above, the goal of the community projects page is to highlight projects created for the OpenSearch community by the OpenSearch community. Any project that that was written to help people use or get more value out of OpenSearch is appropriate for the page, regardless of the project license. Projects could be OpenSearch plugins, OpenSearch Dashboards plugins, client libraries, ingestion tools, and more. For example, the first two projects highlighted are the [OpenSearch Plugin Template](https://github.com/AmiStrn/opensearch-plugin-template-java) (by [AmiStrn](https://github.com/AmiStrn)) and the [Flattened Data Type plugin](https://github.com/aparo/opensearch-flattened-mapper-plugin) (by [aparo](https://github.com/aparo)). Today the page pulls the **project name, project owner, description, license, stars, and forks** from GitHub. Each time the website is republished the information is updated.

**How do I get a project added to the page?**
Getting a project added is as simple as creating a pull request (PR). Just follow the instructions in the [community projects page](https://opensearch.org/community_projects/) to know where to add your project information and submit a PR. Once you have created the PR, one or more of the OpenSearch website maintainers will review it, and work with you to resolve any issues. Once the PR is merged, the website will be updated to include your project. 

**Where do we go from here?**
This is a first step in highlighting OpenSearch community projects. Overtime this page will evolve to have search functionality, download links of the pre-built projects, and support for highlighting non GitHub-based projects. The ultimate goal is for all of us to have a catalog of projects that any of us can easily search through and incorporate into our OpenSearch and OpenSearch Dashboards deployments. If you’ve got something you’d like to add, go ahead and open a PR on [the website](https://github.com/opensearch-project/project-website) or reach out on [the forums](https://discuss.opendistrocommunity.dev/).

Many thanks to both [AmiStrn](https://github.com/AmiStrn) and [aparo](https://github.com/aparo) for volunteering to add their projects to the first version of the community projects page!
