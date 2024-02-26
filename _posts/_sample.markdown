---
# List of one or more author names that map to the value of short_name in site.community_members. See the content in the _community_members collection for reference.
authors: 
    - someusername
    - anotherusername

# Content categorization. One or more categories can be specified. 
category:
  - community-updates

# Publish date in the format of four digit year, two digit month, two digit day, hour, minute, second, and timezone offset; e.g., 2021-04-12 01:01:01 -0700
date: 2021-04-12 01:01:01 -0700

# An excerpt of the blog post. It is used in the blog post list view, and in the home page what's new list of N most recent blog posts. It is also used as a fallback value for the twittercard:description field if not explictly defined in the front matter.
excerpt: Since the OpenSearch Project introduced the k-nearest neighbor plugin in 2019, it has supported both exact and approximate k-NN search. The approximate k-NN search method is more efficient for large datasets with high dimensionality because it reduces the cardinality of searchable vectors. This approach is superior in speed at the cost of a slight reduction in accuracy.

# Used as a fallback for the Twitter Card image, otherwise not currently used. Is only present in content up to June 3, 2021.
feature_image: /assets/path/to/image/asset.ext

# Setting to true will result in the inclusion of the MathJax JavaScript library for rendering math equations. For reference see: _includes/include-mathjax.html.
has_math: true

# Setting to true will result in the inclusion of CSS styles specific to using borders for the table, for table header cells, and table data cells. scientific data tables. For reference see: _includes/science-table-styles.html.
has_science_table: true

# The layout template to use for rendering the content.
# Options are default, fullwidth, homepage, and post.
layout: post

# Value used for the meta description tag. Also used as a final fallback value for the Twitter Card description field after the excerpt property.
meta_description: "Learn how the OpenSearch approximate k-NN search solution enables you to build a scalable, reliable, and distributed framework for similarity searches" 

# Value used for the meta keywords tag.
meta_keywords: "approximate k-NN search, k-nearest neighbor plugin, k-NN plugin, ANN similarity search solution"

# Set to true to indicate content that was imported from the Open Distro For Elasticsearch blog.
odfeimport: true

# URL for use by the jekyll-redirect-from plugin.
# When importing your posts and pages from, say, Tumblr, it's annoying and impractical to create new pages in the proper subdirectories so they, e.g. /post/123456789/my-slug-that-is-often-incompl, redirect to the new post URL.
# For reference see: https://github.com/jekyll/jekyll-redirect-from
redirect_from: /blog/odfe-updates/2019/09/Check-out-earlier-blogposts-on-Open-Distro-for-Elasticsearch/

# The title of the post.
title: "Example Blog Post Title"

# Meta data for the twitter card. The twitter card is used when a link to the blog post is shared on twitter. The twitter card is also used by other social media sites when a link to the blog post is shared on those sites. The twitter card is also used by search engines when a link to the blog post is shared on those sites.
twittercard:
  # The username of the twitter account that is associated with the blog post.This affords the opportunity to not only follow the OpenSearch project, but also individual authors who create content for the OpenSearch blog.
  creator: @username

  # Descriptive text that is displayed in the twitter card. If not explicitly defined in the front matter, the value of excerpt is used. If no excerpt is used then the value of the meta_description is used. This value will be truncated to 200 characters in accordance with twitter's requirements.
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce blandit, magna ut luctus cursus, magna tellus venenatis odio, a malesuada nisi arcu ut elit. Curabitur dui felis, blandit id dapibus non."
  
  # The url of the image that is displayed in the twitter card. having an image for the twitter card will result in the Twitter Card type of summary_large_image being used. If not explicitly defined in the front matter, the value of feature_image is used. If there is not image then the twitter card type of summary is used.
  image: /assets/path/to/image/asset.ext
  
  # Image alt text to support accessibility. The value has a maximum length of 420 characters and will be truncated by template logic in accordance with twitter's requirements.
  image_alt: "OpenSearch Logo"

  # The Twitter account associated with the blog post. This is not the same as the author, but rather the OpenSearch Project's twitter account. It defaults to @OpenSearchProj if not explicity defined.
  site: '@OpenSearchProj'

  # The type of the twitter card. The value of summary_large_image is used if there is an image defined in the front matter. Otherwise the value of summary is used. However, an explicit type can be defined here for example if a player type is needed for a video.
  type: summary_large_image

---