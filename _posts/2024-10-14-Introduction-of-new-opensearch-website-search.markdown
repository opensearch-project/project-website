---
layout: post
title: Introducing enhanced search functionality on OpenSearch.org
authors:
   - zelinhao
   - kolchfa
date: 2024-10-30 
categories:
  - community-updates
  - update
  - community
meta_keywords: OpenSearch search update, improved search results, advanced filters, documentation search, OpenSearch search page, Amazon OpenSearch Service, version-specific search, search infrastructure update
meta_description: Discover the new and improved search functionality on OpenSearch.org. Learn how our updated infrastructure, advanced filters, and dedicated search results page make it easier to find the documentation, blog posts, and event information you need.
---
We're pleased to announce an update to the search functionality on OpenSearch.org. This new design addresses key challenges in the current infrastructure and search experience while setting the stage for more advanced search features that help you find the information you need more easily.

## The new search functionality

The previous search system had limitations related to scalability, maintenance, and user experience. With this update, we're moving to Amazon OpenSearch Service for a more reliable and scalable infrastructure, and we've added new search features to make your experience faster and more efficient.

**Here's what's new:**

- [**Improved infrastructure**](#better-search-infrastructure) to eliminate deployment and indexing issues.
- **No more duplicate results**, giving you cleaner and more accurate search results.
- A [**new search results page**](#new-search-results-page) that goes beyond the dropdown format.
- **Filters for documentation, blog posts, and events** to help you focus on relevant content.
- The ability to **search archived versions** of documentation.

## Better search infrastructure

We've restructured the backend of our search system to improve both performance and relevance. Now content is indexed by documentation version, so your search results are version specific. This reduces clutter and duplication, making it easier for you to find the right information quickly.

We've also upgraded from basic query strings to `match` and `multi_match` queries, which provide more precise results by searching across multiple fields. Additionally, we've applied `indices_boost` to prioritize documentation in search results, further improving relevance.

## New search results page

We've moved away from the simple dropdown search interface in favor of a full search results page, offering a more powerful and user-friendly way to navigate search results. This page gives you more control over your search experience and makes it easier to refine your results.

## Key features

Here's a look at the key improvements and new features in OpenSearch.org search:

- **Dedicated search results page**:
    Search results are shown on a dedicated page with a comprehensive list of results, which makes it easy to review them.

- **Persistent search box**:
    The search box stays at the top of the page, allowing you to refine your query or enter new keywords without losing your current search context.

- **Advanced filters**:
    The new page includes filtering options to help you focus your search. You can filter by:
    - **Documentation**: Narrow down your search to technical documentation.
    - **Blogs**: View relevant blog posts.
    - **Events**: Search through events and announcements.
    - **All**: Search across all types of content.

    You can also filter by specific documentation versions, like "OpenSearch 2.17 (latest)" or "OpenSearch 1.3." This is particularly useful if you're working with different versions of OpenSearch and need access to historical documentation.

- **Organized results display**:
    Search results are displayed clearly, with:
    - **A title and summary**:
    Each result includes a selectable title and a brief summary of the content.
    - **Breadcrumb navigation**:
    Each result shows its location within the documentation structure.

By introducing these new features, we're making it easier for you to quickly find the information you need, whether you're looking through documentation, blog posts, or events. The updated search results page helps you filter and interact with results more efficiently, improving both the speed and accuracy of your searches.

## We value your feedback

Your experience matters to us! We encourage you to explore the new search functionality and share your thoughts on the [OpenSearch forum](https://forum.opensearch.org/) or directly on one of our [documentation](https://opensearch.org/docs/latest/) pages. Your input is essential in helping us improve and refine our features. 

Thank you for being a part of the OpenSearch community!