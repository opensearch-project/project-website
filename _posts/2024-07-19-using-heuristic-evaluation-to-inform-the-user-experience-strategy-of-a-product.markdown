---
# List of one or more author names that map to the value of short_name in site.community_members. See the content in the _community_members collection for reference.
authors: 
    - apasun
    - rsalas

# Content categorization. One or more categories can be specified. 
category:
  - community-updates

# Publish date in the format of four digit year, two digit month, two digit day, hour, minute, second, and timezone offset; e.g., 2021-04-12 01:01:01 -0700
date: 2024-08-16 01:01:01 -0700

# An excerpt of the blog post. It is used in the blog post list view, and in the home page what's new list of N most recent blog posts. It is also used as a fallback value for the twittercard:description field if not explictly defined in the front matter.
#excerpt: 

# Used as a fallback for the Twitter Card image, otherwise not currently used. Is only present in content up to June 3, 2021.
#feature_image: /assets/path/to/image/asset.ext

# Setting to true will result in the inclusion of the MathJax JavaScript library for rendering math equations. For reference see: _includes/include-mathjax.html.
#has_math: true

# Setting to true will result in the inclusion of CSS styles specific to using borders for the table, for table header cells, and table data cells. scientific data tables. For reference see: _includes/science-table-styles.html.
#has_science_table: true

# The layout template to use for rendering the content.
# Options are default, fullwidth, homepage, and post.
layout: post

# Value used for the meta description tag. Also used as a final fallback value for the Twitter Card description field after the excerpt property.
meta_description: "Learn why the OpenSearch Project partners with Steyer Insights to conduct a heuristic evaluation of the OpenSearch Playground and how these insights are informing a refined getting started process."
  


# Value used for the meta keywords tag.
meta_keywords: "UX heuristic evaluation, OpenSearch Plaground, OpenSearch UI design, Steyer Insights"

# Set to true to indicate content that was imported from the Open Distro For Elasticsearch blog.
#odfeimport: true

# URL for use by the jekyll-redirect-from plugin.
# When importing your posts and pages from, say, Tumblr, it's annoying and impractical to create new pages in the proper subdirectories so they, e.g. /post/123456789/my-slug-that-is-often-incompl, redirect to the new post URL.
# For reference see: https://github.com/jekyll/jekyll-redirect-from
#redirect_from: /blog/odfe-updates/2019/09/Check-out-earlier-blogposts-on-Open-Distro-for-Elasticsearch/

# The title of the post.
title: "Using heuristic evaluation to inform the user experience strategy of a product"

# Meta data for the twitter card. The twitter card is used when a link to the blog post is shared on twitter. The twitter card is also used by other social media sites when a link to the blog post is shared on those sites. The twitter card is also used by search engines when a link to the blog post is shared on those sites.

---


Analytics products such as OpenSearch rely heavily on visual interfaces such as dashboards to communicate the meaning of data to end users. These products offer powerful tools to construct visualizations, and it is crucial that the user workflow is both intuitive and smooth.

Of the different research methodologies that a product team can utilize to improve their dashboard offerings, conducting a heuristic evaluation to help inform the user experience strategy can be valuable. This research method helps amplify the benefits of best-in-line research methodologies and helps inform product improvement recommendations.

Conducting a heuristic evaluation is significantly more cost effective than methodologies involving user samples and can often be performed by internal teams on an ongoing basis. The ultimate value of this methodology is that it can be executed quickly, highlight actionable feedback, and help shape the user experience strategy. This method is not a replacement for primary research but is a valuable tool in any organization's mixed-method research toolkit.

The OpenSearch Project recently partnered with [Steyer Insights](https://www.steyer.net/insights/) to conduct a heuristic evaluation of [OpenSearch Playground](https://playground.opensearch.org/app/home#/), with a specific focus on identifying gaps that a new user might encounter when getting started with OpenSearch.



## Conducting a heuristic evaluation

A heuristic evaluation is a usability inspection method that helps identify issues in a UI design. Evaluators examine the interface and assess its compliance with a set of guidelines, called heuristics, that make systems easy to use. Heuristic evaluations are used to improve the quality of UI design early in the product lifecycle.

We wanted to conduct a heuristic evaluation of the OpenSearch Dashboards experience. To do this, we applied two frameworks: [UI Tenets & Traps](https://uitraps.com/) and [Nielsen's 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

UI Tenets & Traps is a framework that detects common UI design errors that can affect the user experience, such as invisible elements, poor groupings, and uncomprehended elements.

Nielsen's 10 Usability Heuristics are general guidelines for UI design, such as visibility of system status, error prevention, and user control and freedom. These methods help in developing a UI that is easy to use, intuitive, and meets the needs of the user.


## UX heuristic evaluation: OpenSearch Playground


The goal of this research was to produce a document that not only identifies the tenets, traps, and UX heuristic violations of OpenSearch Playground but also offers the product and UX teams immediately actionable insights.

To improve the UI/UX of OpenSearch Playground, we tried to view the product through the fresh eyes of a new customer. To do so, we deployed the research principles of a UX heuristic evaluation. As a result of this process, we identified four key recommendations. These recommendations are informed by the most commonly identified violations of tenets, traps, and UX heuristics and are summarized below.

![](/assets/media/blog-images/2024-07-19-using-heuristic-evaluation-to-inform-the-user-experience-strategy-of-a-product/Image.jpg)
1. **Focus on workflows that help customers achieve a goal rather than complete specific tasks**. The OpenSearch Playground home page points customers toward concrete tasks like ingesting data, exploring data, and trying a query assistant. Consider organizing the site to support customer goals such as proactive anomaly monitoring, data visualization, and getting started with minimal expertise.

1. **Use consistent terminology and workflows across all tools and features to help customers work faster and build intuitive mental models.** There are several instances where the experience changes depending on whether users are logged in or not. There are also instances where terms are used that differ from industry standards, like "buckets." Simplifying terminology and workflows to follow industry best practices will increase customer confidence in the product.

1. **Minimize available actions in OpenSearch Playground that trial users cannot access**. A recurring Tenet & Trap violation was Inviting Dead End. Users encounter options (for example, "add sample data") that they do not have access to and are unable to perform. Focusing on eliminating these encounters and errors makes it easier for potential customers to assess the product.

1. **Investigate potential content gaps on [OpenSearch.org](http://opensearch.org/)** that may hinder a new user trial. The website appears to have information gaps that add friction to understanding and trialing OpenSearch Playground.


## Takeaways

* Perform a heuristic analysis to rapidly identify common traps and violations in your product design.
* You can scope your research as broadly or narrowly as needed.
* UX heuristic insights are often universally applicable to your entire UX; be sure to broaden your understanding (and dissemination) of your findings to ensure maximum derived value from your efforts.
* You can engage outside UX research experts or utilize existing resources to apply these UI Tenets & Traps and Nielsen's 10 Usability Heuristics to your product.
* Implement a regular heuristic research practice to monitor and track improvements.




### About Steyer


"We don't just analyze data, we create meaning from it. We don't just report insights, we inspire action from them."

Steyer partners with our clients to make meaningful connections between people and information, solving our clients' business problems with the tools we know best: strategic analysis, user research, and the creation, organization, and revision of business content. With nearly three decades of delighting both our clients and our own team members, we understand what it takes to effect real change in the real world.

![](/assets/media/blog-images/2024-07-19-using-heuristic-evaluation-to-inform-the-user-experience-strategy-of-a-product/Image1.jpg)






