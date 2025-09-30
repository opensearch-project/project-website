# Blog Guide

This guide provides an overview of formatting blogs for the project website. It references the [semantic blog post](/_posts/2023-03-30-semantic-science-benchmarks.md) as an example. You can [view the post](https://opensearch.org/blog/semantic-science-benchmarks/) in its rendered form on the project website.

* * *

### Table of contents

* [Adding a blog post](#adding-a-blog-post)
* [Front matter](#front-matter)
* [Title](#title)
* [Tables](#tables)
* [Images](#images)
* [Authors](#authors)
* * *

## Adding a blog post

To add a new blog post, create a new `.md` file in the `_posts` directory. The name of the file must start with the date in the format `yyyy-MM-dd` (for example, `2023-03-30-semantic-science-benchmarks.md`).

## Front matter

Every post must start with front matter in YAML format, for example:

```
---
layout: post
title:  "The ABCs of semantic search in OpenSearch: Architectures, benchmarks, and combination strategies"
authors:
 - mshyani
 - dhrubo
 - nmishra
 - kolchfa
date: 2023-03-30
categories:
 - technical-post
meta_keywords: semantic search engine, neural search engine, keyword and natural language search, search relevance, benchmarking tests
meta_description: Learn how to create a semantic search engine in OpenSearch, including architecture and model options, benchmarking tests, and effects of different combination strategies and normalization protocols.
excerpt: In an earlier blog post, we described different ways of building a semantic search engine in OpenSearch. In this post, we'll dive further into the science behind it. We'll discuss the benefits of combining keyword-based search with neural search, the architecture and model options, and benchmarking tests and results. First, we'll provide an overview of our proposed solutions and a summary of the main results. Next, we'll outline the steps for creating a solution and fine-tuning it for your own document corpus. Finally, we'll discuss the effects of different combination strategies and normalization protocols on search relevance. 
has_math: true
has_science_table: true
---
```

The following table describes all front matter variables.

Variable | Description
:--- | :---
`layout` | The page layout. Must be `post`.
`title` | The blog title.
`authors` | A list of authors' short names.
`date` | The publish date of the blog post. To test your blog by running the project website locally, this date must be no later than the current date. You can change this date to the publish date once the blog post has been reviewed and is ready for publishing.
`categories` | A list of categories to which the blog post applies. Common options are `community-updates`, `technical-posts`, `update`, `community`, `feature`, `updates`, `partners`, and `releases`.
`meta_keywords` | Meta keywords are provided by the marketing team once you put up a PR with the blog post.
`meta_description` | Meta keywords are provided by the marketing team once you put up a PR with the blog post.
`excerpt` | (Optional) A blog excerpt you want to appear on the [blog front page](https://opensearch.org/blog). If you don't provide this variable, the excerpt will contain the first paragraph of the blog. If you do provide your own excerpt, make sure it does not contain any special Markdown formatting because this formatting will be ignored and displayed as is. For example, if you surround a word with tic marks, the tic marks will be displayed rather than formatting the variable in code font.
`has_math` | (Optional) If your blog post contains mathematical formulas, set this variable to `true` so you can use the [MathJax](https://www.mathjax.org/) syntax to render the formulas.
`has_science_table` | (Optional) By default, tables do not render grid lines. To add grid lines to your table, set this variable to `true`.

## Title

The blog title is sourced from the `title` variable in the front matter. Do not include a heading after the front matter; start with the introductory paragraph directly. If you include a heading after the front matter, the heading will be displayed twice.

## Tables

You can use either Markdown or HTML syntax for tables in your blog post. Markdown tables do not support row or column span. By default, tables do not render grid lines. To add grid lines to your table, include `has_science_table: true` in the front matter of the blog post.

## Images

If your blog post contains images, add a folder containing the images in the `assets/media/blog-images` directory. Name the folder the same as you named the blog file except for the file extension. For example, if your blog file is named `2023-03-30-semantic-science-benchmarks.md`, name the image folder `2023-03-30-semantic-science-benchmarks` You can use either Markdown or HTML syntax for images. By default, images include a standard border and are responsive. 

To insert a Markdown image, use the `![<alternate text>](link)` syntax:

```
![Similar vectors](/assets/media/blog-images/2023-02-13-semantic-search-solutions/vectors.jpg)
```

If you want to specify the image width or another style, use HTML syntax:

```
<img src="/assets/media/blog-images/2023-02-13-semantic-search-solutions/vectors.jpg" alt="Similar vectors" width="700"/>
```

~~To center a Markdown image, specify the `img-centered` class for the image:~~

```
![Similar vectors](/assets/media/blog-images/2023-02-13-semantic-search-solutions/vectors.jpg){:class="img-centered"}
```


^ The markdown convention that Jekyll uses for adding CSS classes causes issues with our publishing process. Please refrain from using it. Use the raw HTML methodology below.

To center an HTML image, include `class="centered"` in the image tag:

```
<img src="/assets/media/blog-images/2023-02-13-semantic-search-solutions/vectors.jpg" alt="Similar vectors" class="img-centered"/>
```

## Authors

For each author, add an author [bio](#author-bio) and [picture](#author-picture).

### Author bio

For an author bio, create an author file in the `_community_members` directory with the value of 'author' in its `personas` array. The name the author file must be the same as the variable you are referencing in the `authors` list of the blog front matter. For example, suppose your front matter contains the following author list:

```
authors:
 - krisfreedain
```

In this example, the file name is `krisfreedain.markdown`. The author file contains the following front matter and bio:

```
---
short_name: krisfreedain
name: Kris Freedain
photo: '/assets/media/community/memberes/krisfreedain.jpg'
twitter: 'KrisFreedain'
github: krisfreedain
linkedin: 'krisfreedain'
---
**Kris Freedain** is the OpenSearch Project Community Manager; his hobbies include gardening, garage gym powerlifting, and meditation.
```

The Twitter, GitHub, and LinkedIn profile names are optional.

### Author picture

Add an author picture file in the `assets/media/community/members/` directory. The name of the file must be the same as the `short_name` variable in the author file front matter. Common image file extensions are `.png` and `.jpg`. In this example, the file name is `krisfreedain.jpg`.