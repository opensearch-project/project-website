---
layout: post
title:  "From the editor's desk: OpenSearch and inclusion"
authors: 
  - nbower
date: 2022-08-31
categories: 
  - community
redirect_from: "/blog/community/2022/08/New-series-From-the-editors-desk/"
---

As part of our commitment to providing complete and best-in-class documentation to the OpenSearch community, we want to ensure that you have visibility into how we approach creating bar-raising content. To that end, we will be publishing regular blog posts with tips, guidance, and best practices that will help contributors collaborate with us. Subjects may include technical writing, style, voice and tone, brand messaging, and other topics relevant to the production of our documentation. We hope you find this to be useful, and we would love to hear your thoughts on any of the subjects we discuss in this series. Please feel free to make your voice heard as part of the OpenSearch community through our [community meetings](https://www.meetup.com/OpenSearch/), [forum discussions](https://forum.opensearch.org/), and [GitHub repository](https://github.com/opensearch-project).

## OpenSearch is for everyone, and we are inclusive

We’d like to begin this ongoing conversation with a subject that is foundational to who we are and how we talk to each other as a community: inclusion. As an open-source project, OpenSearch is for everyone, and we are inclusive. We value the diversity of backgrounds and perspectives in the OpenSearch community and welcome feedback from any contributor, regardless of their experience level. 

When developing OpenSearch documentation, we strive to create content that is inclusive and free of bias. We use inclusive language to connect with the diverse and global OpenSearch audience, and we are careful in our word choices. Inclusive and bias-free content improves clarity and accessibility of our content for all audiences, so we avoid ableist and sexist language and language that perpetuates racist structures or stereotypes. In practical terms, this means that we do not allow certain terms to appear in our content, and we avoid using others, depending on the context.

## Inclusive terminology

Our philosophy is that we positively impact users and our industry as we proactively reduce our use of terms that are problematic in some contexts. Instead, we use more technically precise language and terms that are inclusive of all audiences. 

The following terms may be associated with unconscious racial bias, violence, or politically sensitive topics and should not appear in OpenSearch content, if possible. Note that many of these terms are still present but on a path to not being supported.

<div class="table-styler"></div>

| Don’t use      | Use instead                 |
|----------------|-----------------------------|
| abort          | stop                        |
| black day      | blocked day                 |
| blacklist      | deny list                   |
| execute        | start, run                  |
| hang           | stop responding             |
| kill           | end, stop                   |
| master         | primary, main, leader       |
| master account | management account          |
| slave          | replica, secondary, standby |
| white day      | open day                    |
| whitelist      | allow list                  |

The following terms may be problematic in some contexts. This doesn’t mean that you can’t use these terms—just be mindful of their potential associations when using them, and avoid using them to refer to people.

<div class="table-styler"></div>

| Avoid using              | Use instead                         |
|--------------------------|-------------------------------------|
| blackout                 | service outage, blocked             |
| demilitarized zone (DMZ) | perimeter network, perimeter zone   |
| disable                  | turn off, deactivate, stop          |
| enable                   | turn on, activate, start            |
| invalid                  | not valid                           |
| primitive                | primitive data type, primitive type |
| purge                    | delete, clear, remove               |
| segregate                | separate, isolate                   |
| trigger                  | initiate, invoke, launch, start     |

[Version 2.0](https://opensearch.org/blog/releases/2022/05/opensearch-2-0-is-now-available/) replaced non-inclusive terminology (such as master, blacklist) throughout OpenSearch with inclusive terminology (such as cluster manager, allow list), but please let us know if you think we missed something so that we can address it in an expedient manner. Check out the associated [GitHub issue](https://github.com/opensearch-project/OpenSearch/issues/2589) for more information.

## Accessibility

Accessibility involves designing and creating websites, user interfaces, and documentation so that people with disabilities can perceive, navigate, and interact with them. OpenSearch follows basic accessibility guidelines to help ensure that our documentation is available and useful for everyone. Following these principles also helps improve the general usability of content.

We follow these general accessibility guidelines in our documentation:

* Links: Use link text that adequately describes the target page. For example, use the title of the target page instead of “here” or “this link.” In most cases, a formal cross-reference (the title of the page you're linking to) is the preferred style because it provides context and helps readers understand where they’re going when they choose the link.
* Images:
  * Add introductory text that provides sufficient context for each image.
  * Add ALT text that describes the image for screen readers.
* Procedures: Not everyone uses a mouse, so use device-independent verbs; for example, use “choose” instead of “click.” 
* Location: When you’re describing the location of something else in your content, such as an image or another section, use words such as “preceding,” “previous,” or “following” instead of “above” and “below.”

We aim to follow these guidelines consistently, but, again, please let us know if you think we missed something, and we’ll work with you to make an appropriate change.

## Join the conversation

OpenSearch is committed to being a community where everyone can join and contribute, and we welcome community contributions to the [OpenSearch style guidelines](https://github.com/opensearch-project/documentation-website/blob/main/STYLE_GUIDE.md). To access our documentation, see the [OpenSearch documentation home page](https://opensearch.org/docs/latest). If you want to contribute to the OpenSearch documentation, see the [CONTRIBUTING.md](https://github.com/opensearch-project/documentation-website/blob/main/CONTRIBUTING.md) file, which covers how to open an issue or create a pull request on GitHub. We look forward to collaborating with you!
