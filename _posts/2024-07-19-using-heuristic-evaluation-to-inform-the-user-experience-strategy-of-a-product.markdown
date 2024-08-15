---
# List of one or more author names that map to the value of short_name in site.community_members. See the content in the _community_members collection for reference.
authors: 
    - apasun
    - rsalas

# Content categorization. One or more categories can be specified. 
category:
  - community-updates

# Publish date in the format of four digit year, two digit month, two digit day, hour, minute, second, and timezone offset; e.g., 2021-04-12 01:01:01 -0700
date: 2024-07-19 01:01:01 -0700

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
meta_description: "" 

# Value used for the meta keywords tag.
meta_keywords: ""

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

Of the different research methodologies that a product team can utilize to improve their dashboard offerings, conducting a heuristic evaluation to help inform the products user experience strategy can be valuable. This research method helps amplify the benefits of best in line research methodologies and helps inform essential and universal recommendations in the product.

Conducting a heuristic evaluation is significantly more cost effective than methodologies involving user samples and can often be performed by internal teams on an ongoing basis. The ultimate value of this methodology is that it can be executed quickly, can highlight actionable feedback to product, and help shape the strategy of user experiences in the product. This method is not a replacement for primary research but is a valuable tool in any organizations mixed-method research toolkit.

OpenSearch Project recently partnered with [Steyer Insights](https://www.steyer.net/insights/) to conduct a Heuristics evaluation of the OpenSearch Playground with a specific focus on identifying gaps that a new user would navigate through getting started on OpenSearch. We evaluated the Playground experience, and approached this with a heuristic evaluation, which we detail below



## Conducting a Heuristic Evaluation

A heuristic evaluation is a usability inspection method that helps identify issues in a user interface design. Evaluators examine the interface and judge its compliance with a set of guidelines, called heuristics, that make systems easy to use. Heuristic evaluations are used to improve the quality of UI design early in the product life cycle.

We wanted to conduct a heuristic evolution on the OpenSearch Dashboards experience. To do this, we applied two frameworks: [UI Tenets & Traps](https://uitraps.com/) and [Nielsen’s 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

UI Tenets & Traps is a framework that detects common UI design errors that can affect the user experience, such as invisible elements, poor groupings, and uncomprehended elements

Nielsen’s 10 Usability Heuristics are general guidelines for UI design, such as visibility of system status, error prevention, and user control and freedom. These methods help develop a UI that is easy to use, intuitive, and meets the needs of the user and is the base framework of this heuristic evaluation.


## UX Heuristics Evaluation: OpenSearch Playground


The goal of this research was to produce a document that not only identified the tenets and traps and UX heuristics violations of the OpenSearch Playground UX but would also offer the product and UX teams immediately actionable insights.

To improve the UI / UX of the OpenSearch Playground, one of the primary ways that new users can evaluate the OpenSearch platform, we tried to view our product through the fresh eyes of a new customer. To do so we deployed the research principles of a UX heuristics evaluation. In this process, we identified four key recommendations. These recommendations are informed by the most common violations of tenets and traps and UX heuristics that our researchers identified in the Playground and are summarized below.

![](/assets/media/blog-images/2024-07-19-using-heuristic-evaluation-to-inform-the-user-experience-strategy-of-a-product/Image.jpg)
**Focus on workflows that help customers achieve a goal rather than complete specific tasks**. The Playground home page offers customers concrete tasks like ingesting data, exploring data, and trying a query assistant. Think about organizing the site to support customer goals such as proactive anomaly monitoring, visualizing your data, and getting started with minimal expertise.

**Use consistent terminology and workflows across all tools and features to help customers work faster and build intuitive mental models.** There are several instances where the experience changes depending on whether users are logged in or not. There are also instances where terms like “buckets” are used that differ from industry standards. Simplifying terminology and workflows to follow industry knowledge and best practices will increase customer confidence that this product is for them.

**Minimize available actions within the Playground that trial users cannot access**. A recurring Tenet & Trap violation was Inviting Dead End. Users encounter options (e.g. “add sample data”) within the Playground that they do not have access to and are unable to perform. Focusing on eliminating these encounters and errors make it easier for potential customers to assess the platform.

**Investigate potential content gaps on [OpenSearch.org](http://opensearch.org/) which** may hinder new user trial. The customer journey on [OpenSearch.org](http://opensearch.org/) seems to have information gaps that add friction to understanding and trialing of the Playground.


## Takeaways

* Perform a heuristics analysis to rapidly identify common traps and violations in your product design
* You can scope your research as broadly or narrowly as you need
* UX heuristics insights are often universally applicable to your entire UX; be sure to broaden your understanding (and dissemination) of your findings to ensure maximum value from your efforts
* You can engage outside UX research experts or utilize existing resources to apply these UI Tenets and Traps and 10 Usability Heuristics to your product
* Implement a regular Heuristics research practice to monitor and track improvements.

## References

[UI Tenets & Traps](https://uitraps.com/)
[Nielsen’s 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)


### About Steyer


"We don't just analyze data, we create meaning from it. We don't just report insights, we inspire action from them."

Steyer partners with our clients to make meaningful connections between people and information, solving our clients’ business problems with the tools we know best: strategic analysis, user research, and the creation, organization, and revision of business content. With nearly three decades of delighting both our clients and our own team members, we understand what it takes to effect real change in the real world.

![](/assets/media/blog-images/2024-07-19-using-heuristic-evaluation-to-inform-the-user-experience-strategy-of-a-product/Image1.jpg)


**About Ray Salas - Steyer Insight Research Lead and Strategist**


As a leader with 20+ years of team building and people management experience at companies like JP Morgan Chase, Microsoft, and Amazon, Ray has been both a creator and consumer of customer research. As a research leader, he has implemented frameworks that deeply integrate human insight into engineering and product lifecycles, and he has driven prioritizations and roadmaps by balancing human insight, tech capability, and business viability. Above all, Ray believes in product and service development that is customer led and not just customer validated.

![](/assets/media/blog-images/2024-07-19-using-heuristic-evaluation-to-inform-the-user-experience-strategy-of-a-product/Image2.jpg)

