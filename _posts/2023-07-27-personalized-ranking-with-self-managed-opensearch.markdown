---
# List of one or more author names that map to the value of short_name in site.community_members. See the content in the _community_members collection for reference.
authors: 
    - shreeyasharma

# Content categorization. One or more categories can be specified. 
category:
  - partner-highlight

# Publish date in the format of four digit year, two digit month, two digit day, hour, minute, second, and timezone offset; e.g., 2021-04-12 01:01:01 -0700
#date: 2021-04-12 01:01:01 -0700
date: 2023-07-27 00:00:01 -0700

# An excerpt of the blog post. It is used in the blog post list view, and in the home page what's new list of N most recent blog posts. It is also used as a fallback value for the twittercard:description field if not explictly defined in the front matter.
excerpt: "OpenSearch partner and contributor AWS recently released Amazon Personalize Search Ranking, a new plugin for self-managed OpenSearch that helps users leverage the deep learning capabilities offered by Amazon Personalize and apply personalization to their search results."

# Used as a fallback for the Twitter Card image, otherwise not currently used. Is only present in content up to June 3, 2021.
#feature_image: /assets/path/to/image/asset.ext

# Setting to true will result in the inclusion of the MathJax JavaScript library for rendering math equations. For reference see: _includes/include-mathjax.html.
has_math: false

# Setting to true will result in the inclusion of CSS styles specific to using borders for the table, for table header cells, and table data cells. scientific data tables. For reference see: _includes/science-table-styles.html.
has_science_table: false

# The layout template to use for rendering the content.
# Options are default, fullwidth, homepage, and post.
layout: post

# Value used for the meta description tag. Also used as a final fallback value for the Twitter Card description field after the excerpt property.
meta_description: "Amazon Personalize launches a new integration with self-managed OpenSearch that enables customers to personalize search results for each user and predict their needs." 

# Value used for the meta keywords tag.
meta_keywords: "Amazon Personalize, search ranking plugin, OpenSearch Dashboards, OpenSearch 2.9.0, personalized search"

# Set to true to indicate content that was imported from the Open Distro For Elasticsearch blog.
odfeimport: false

# URL for use by the jekyll-redirect-from plugin.
# When importing your posts and pages from, say, Tumblr, it's annoying and impractical to create new pages in the proper subdirectories so they, e.g. /post/123456789/my-slug-that-is-often-incompl, redirect to the new post URL.
# For reference see: https://github.com/jekyll/jekyll-redirect-from
#redirect_from: /blog/odfe-updates/2019/09/Check-out-earlier-blogposts-on-Open-Distro-for-Elasticsearch/

# The title of the post.
title: "Partner Highlight: AWS releases Amazon Personalize Search Ranking for self-managed OpenSearch"

# Meta data for the twitter card. The twitter card is used when a link to the blog post is shared on twitter. The twitter card is also used by other social media sites when a link to the blog post is shared on those sites. The twitter card is also used by search engines when a link to the blog post is shared on those sites.
twittercard:
  # The username of the twitter account that is associated with the blog post.This affords the opportunity to not only follow the OpenSearch project, but also individual authors who create content for the OpenSearch blog.
  
  
  # Image alt text to support accessibility. The value has a maximum length of 420 characters and will be truncated by template logic in accordance with twitter's requirements.
  image_alt: "OpenSearch Logo"

  # The Twitter account associated with the blog post. This is not the same as the author, but rather the OpenSearch Project's twitter account. It defaults to @OpenSearchProj if not explicity defined.
  site: '@OpenSearchProj'

  # The type of the twitter card. The value of summary_large_image is used if there is an image defined in the front matter. Otherwise the value of summary is used. However, an explicit type can be defined here for example if a player type is needed for a video.
  type: summary_large_image

---

OpenSearch partner and contributor [AWS](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/gsg.html) recently released Amazon Personalize Search Ranking, a new plugin for self-managed OpenSearch that helps users leverage the deep learning capabilities offered by Amazon Personalize and apply personalization to their search results. For users of open-source [OpenSearch version 2.9.0](https://opensearch.org/blog/introducing-opensearch-2.9.0/) or later, this plugin allows you to go beyond traditional keyword matching and boost relevant items in an end user’s search results, based on their interests, context, and past interactions, in real time. You can also control the level of personalization for each search query, and you can compare personalized search results to the default OpenSearch ranker and assess improvements with [OpenSearch Dashboards](https://opensearch.org/docs/latest/dashboards/index/). For more details, check out the [AWS What’s New announcement](https://aws.amazon.com/about-aws/whats-new/2023/07/personalize-search-results-amazon-personalize-opensearch-integration/), and refer to the [AWS documentation](https://docs.aws.amazon.com/personalize/latest/dg/personalize-opensearch.html) to learn how to get started.
