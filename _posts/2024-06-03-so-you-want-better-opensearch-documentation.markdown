---
layout: post
title: So you want better OpenSearch documentation?
authors:
  - epugh
  - chull
  - hdhalter
date: 2024-06-18
categories:
  - events

meta_keywords: OpenSearch documentation, diataxis documentation structure, Divio quadrants
meta_description: Learn how the OpenSearch Project uses the Diataxis documentation system to identify gaps while working with its community to encourage contributions and improve its content.

excerpt: Learn how the OpenSearch Project uses the Diataxis documentation system to identify gaps while working with its community to encourage contributions and improve its content.
featured_blog_post: true
featured_image:  /assets/media/blog-images/2024-06-03-improvedocs/2024-06-03-improvedocs.jpg
---

[Charlie Hull](https://opensourceconnections.com/team/charlie-hull/) and I, [Eric Pugh](https://opensourceconnections.com/team/eric-pugh/), from [OpenSource Connections](https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://opensourceconnections.com/&ved=2ahUKEwiqxrXG37WGAxUtM1kFHY5XDKgQFnoECAcQAQ&usg=AOvVaw0jRbdTI-7Nyxctwov1hOEu), had the opportunity during the "Unconference" portion of [OpenSearchCon Europe 2024](https://opensearch.org/events/opensearchcon/2024/europe/index.html) to talk about the current state of the OpenSearch documentation and get some feedback from the community. I chose this topic based on conversations I had with [Heather Halter](https://www.linkedin.com/in/heather-halter/), OpenSearch Documentation Manager, last fall at OpenSearchCon 2023 in Seattle.

![lightning talk](/assets/media/blog-images/2024-06-03-improvedocs/2024-06-03-improvedocs.jpg)

{% include youtube-player.html id="eRLmIzevC-4" %}

We started with the slightly tongue-in-cheek statement that the way you search Reddit is to go to Google and search "How do I (insert any task here) +Reddit" to get the information you want. The pattern that lots of folks use to find information about OpenSearch (unsurprisingly, as OpenSearch started as a fork of Elasticsearch) is to go to Google and search "How do I (insert any task here) +Elasticsearch." That statement was met with a few nodding heads and light chuckling.  

We then introduced [The Documentation System](https://docs.divio.com/documentation-system/), which is referred to as *The Grand Unified Theory of Documentation*. You may know it as [Diátaxis](https://diataxis.fr/) (I am unclear about the relationship between the two sites!). Here's a [video](https://www.youtube.com/watch?v=t4vKPhjcMZg) explaining the concept, which divides documentation into four quadrants: Tutorials, How-To Guides, Explanation, and Reference. 

![Divio quadrants](/assets/media/blog-images/2024-06-03-improvedocs/2024-06-03-quadrant.jpg)

OpenSearch actually does a pretty good job of the _Reference_ portion of the puzzle, especially considering that there are new releases every 6 weeks. I started contributing documentation late last year and recently joined the [opensearch-project/documentation-website](https://github.com/opensearch-project/documentation-website) repository as a maintainer. I see a constant flow of both new docs and the improvement of existing docs. Considering the ratio of writers to developers and where the project was not too long ago, I think we're doing a really good job of keeping up with both. 

The other three quadrants, however, are where we could do a better job. There is _Tutorial_ and _Explanation_ content mixed in with the _Reference_ content, so you can spend a lot of time wading through the minutiae of how things work when you are really looking for an understanding of the core principles. We also have a huge amount of great content in the existing [blog](https://opensearch.org/blog/) that could flesh out these other areas of the documentation, especially if we start linking to third-party blogs. This is an area I plan to invest more energy into.

Charlie then asked the audience what their thoughts were, and we captured a lot of great questions and comments. I then followed up with Heather Halter, whose remarks are in *italics*. 

**"Older versions of OpenSearch docs often show up in Google, which is often jarring. Can we make sure Google is properly indexing the latest content?"**

_While we've made a lot of progress in this area, particularly with implementing a redirect strategy, we are currently planning on adding canonical links to all the older pages. The goal is to get this work done by the end of Q2, which should show a big improvement in the back half of the year._

**"I often find a GitHub issue that answers my question and I ⭐ it." Someone suggested that we look for comments on GitHub issues that have lots of stars and use that as an indicator of where docs could be improved.**

 _Great suggestion!_

**"My 2-year-old won't let me work at night" was one response to the question of why people who find a gap in documentation don't pursue opening a PR to improve the docs.** 

_We love community contributions and have made it really easy to start. Check out the [CONTRIBUTING.md](http://contributing.md/) file and watch this [YouTube video](https://www.youtube.com/watch?v=zmVC3fQwnVI) on our documentation process and how you can contribute. You can also search through the issues labeled [good first issue](https://github.com/opensearch-project/documentation-website/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) or [help wanted](https://github.com/opensearch-project/documentation-website/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22)._

**Backwards compatibility in APIs came up as an issue. It would be interesting if we could better communicate API changes over time.** 

_We use the "Introduced (version)" label to indicate the release in which a feature is introduced. But going backwards to identify everything is a big job. We received a suggestion to do this for field types, so I labeled it with "[good first issue](https://github.com/opensearch-project/documentation-website/issues/6993)" in case someone wants to jump in._

**Someone did make the comment that they do NOT believe that developers don't like to write docs, especially in open source, but that we need to strive to continue to lower the barriers to contributing docs.** 

_We are relying more and more on developers to write content and are looking at tools that make it easier and faster to write good documentation. We also have a great automated style checker built into our process that helps developers learn how to write better by correcting their mistakes._

**One person asked what powered the site search functionality, and the response that it is OpenSearch sparked a conversation about whether we could apply new OpenSearch capabilities, like hybrid search and vectors, to what powers the website. Kris Freedain spoke up with a "Who wants to collaborate on this?", and at least one person raised their hand ;-).**

_We are currently looking at how we can upgrade the search experience on the overall website. Please get in touch with [Kris Freedain](https://opensearch.org/community/members/kris-freedain.html) if you are interested._

_If you have more feedback on OpenSearch documentation, reach out on the [forum](https://forum.opensearch.org/c/feedback/6), [Slack](https://opensearch.slack.com/archives/C052GAV1MQF), or [enter an issue](https://github.com/opensearch-project/documentation-website/issues/new/choose) in the `documentation-website` repo. We also welcome you to contribute your thoughts on the recently published [OpenSearch Documentation Strategy](https://github.com/opensearch-project/documentation-website/issues/7189)._

Thanks to the OpenSearch team for providing a great forum to connect with an incredible community. You can catch up on all the excitement in this [blog post](https://opensearch.org/blog/OpenSearchCon-europe-2024-shines-in-berlin/), and I look forward to seeing everyone at [OpenSearchCon North America](https://opensearch.org/events/opensearchcon/2024/north-america/index.html)!



