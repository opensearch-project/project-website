---
layout: post
title: Introduction of new OpenSearch website search
authors:
   - zelinhao
date: 2024-10-14 
categories:
  - update
  - search
excerpt: 
meta_keywords: 
meta_description: 
---
We are excited to announce a new update to OpenSearch.org's search capabilities. This new design addresses key challenges in the current infrastructure and search functionality while laying the foundation for enhanced user experience through advanced search options.

## Overview

The previous documentation search system had limitations in terms of scalability, maintenance, and user experience. With the new search functionality, we are transitioning to Amazon OpenSearch Service for a more robust and scalable infrastructure, while introducing advanced search features that allow users to find exactly what they need, faster and more efficiently.

This update will:

* **Stabilize infrastructure**, eliminating deployment and indexing failures.
* **Remove duplication of search results** to provide cleaner, more accurate results.
* Introduce a **new search results landing page**, moving beyond the dropdown experience.
* **Filter search results exclusively on documentation/blog/event** for a more relevant experience.
* Enable users to **search across archived versions** of documentation.

## Key Features

### Enhanced search infrastructure

To enhance both performance and relevancy, we've restructured the underlying infrastructure that powers the search functionality on OpenSearch.org. We redesigned our indexing strategy by splitting the indexes by version. Now, content is indexed based on the specific documentation version it belongs to, allowing users to get version-specific search results. This approach ensures that results are clean, relevant, and free from duplication, making it easier for users to find exactly what they need.

Previously, we utilized basic query strings, which provided a fundamental search experience. To offer more accurate and refined search results, we’ve adopted `match` and `multi_match` queries, which allow us to search across multiple fields with a high degree of precision. `indices_boost` is applied to prioritize documentation indices, further enhancing the relevancy of search hits.

### New search results landing page

In a move to enhance user experience, we’re transitioning from the simple dropdown interface to a fully-featured search results landing page. This new page offers a more powerful and intuitive way for users to engage with search results, enabling deeper filtering and customization options. Whether users are searching through documentation, blog posts, or event content, the landing page provides the tools to efficiently refine their results, making it easier than ever to find relevant information.

#### Key Features:

* **Dedicated search results page:**  
  When users enter a query and press ‘Enter,’ they’ll be taken to this new results page. Unlike the previous dropdown, which showed limited and condensed results, the new page is designed to present search results in a more organized and comprehensive manner. Users are able to browse through extensive lists of results without leaving the page, making their search journey smoother and more effective.

* **Search box:**  
  The search box at the top of the landing page allows users to input new keywords or modify their existing query. It remains persistent across interactions, so users can continue adjusting their search criteria as needed without losing their context.

* **Advanced filters:**  
  One of the standout features of the new landing page is its filtering options. Users can now specify their search focus by selecting content types, including:
    * **Documentation:** Focus exclusively on technical documents.
    * **Blog:** Retrieve blog posts related to OpenSearch.
    * **Event:** Search through events and announcements.
    * **All:** A combined search across all content categories.

  Along with content filters, users can also select specific documentation versions (for example, “OpenSearch 2.17 (latest)”, “OpenSearch 1.3”) to narrow down results to particular product releases. This feature is especially useful for users who are working on different versions of OpenSearch and want to access historical documentation.

* **Search results display:**  
  The results themselves are shown in a clear and organized list, featuring:
    * **Title and brief overview:**  
      Each search result includes a clickable title that links directly to the relevant page, accompanied by a short summary to give users a quick preview of the content.
    * **Breadcrumb navigation:**  
      To help users maintain their sense of location within the documentation structure, each result is equipped with breadcrumb navigation, outlining its position in the hierarchy (for example, OpenSearch 2.17 › › Installing OpenSearch).

By integrating these new features into the landing page, we’re ensuring that users can quickly access, filter, and interact with search results in ways that suit their specific needs, improving both speed and accuracy of information retrieval.
