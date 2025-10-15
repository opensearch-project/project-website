---
layout: redesign-use-case
title: eCommerce Use Cases
description: 'OpenSearch can be used to implement powerful eCommerce search applications. Following are a few examples of solutions you can build.'
feature_area_category_name: Search
feature_area_solution_name: eCommerce
how_to_get_started: 
  - 'You can get started with OpenSearch&apos;s eCommerce functionality by exploring our <a href="https://opensearch.org/docs/latest/" target="_blank">documentation</a>. To learn more or to start a discussion, join our <a href="https://opensearch.org/slack.html"  target="_blank">public Slack channel</a>, check out our <a href="https://forum.opensearch.org/"  target="_blank">user forum</a>, and follow our <a href="https://opensearch.org/blog/"  target="_blank">blog</a> for the latest on OpenSearch tools and features.'
button_stack:
  - download
---
{::comment}
    Implementation note: HTML tables are used instead of markdown, because markdown 
    does not support the use of colspan which is needed to make all first columns 
    across tables the same width without worrying about the length of the header text.
{:/comment}
<table>
  <thead>
    <tr>
      <th colspan="2">Search</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Product Name and Description Search</td>
      <td>Enables customers to find products by entering keywords related to the product's name or description. This fundamental use case forms the backbone of eCommerce search, allowing users to quickly locate items based on their knowledge or expectations of the product.</td>
    </tr>
    <tr>
      <td>Category and Faceted Navigation</td>
      <td>Allows users to browse products by category and refine results using various attributes (facets) such as price range, brand, or color. This use case enhances the user experience by providing intuitive navigation and filtering options, especially useful when customers have a general idea of what they want but need to narrow down their choices.</td>
    </tr>
    <tr>
      <td>Autocomplete and Search Suggestions</td>
      <td>Provides real-time suggestions as users type their query, helping them formulate their search and find products faster. This feature not only speeds up the search process but also helps users discover relevant products they might not have initially considered.</td>
    </tr>
    <tr>
      <td>Semantic Search and Natural Language Processing</td>
      <td>Interprets the intent behind a user's query, understanding context and synonyms to provide more relevant results. This advanced capability allows the search engine to handle complex queries and understand user intent, even when the exact product names or attributes aren't used in the search query.</td>
    </tr>
  </tbody>
</table>
<table>
  <thead>
    <tr>
      <th colspan="2">Personalization</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>User-level content targeting</td>
      <td>Personalize web pages by using OpenSearch to retrieve content ranked by user propensities using embeddings trained on user interactions.</td>
    </tr>
    <tr>
      <td>Recommendation engine</td>
      <td>Generate product and user embeddings using collaborative filtering techniques and use OpenSearch to power your recommendation engine.</td>
    </tr>
    <tr>
      <td>Geo-located Product Search</td>
      <td>Incorporates the user's location to provide relevant results, such as showing nearby store availability or adjusting shipping estimates. This feature is especially valuable for businesses with both online and physical presence, enhancing the omnichannel shopping experience.</td>
    </tr>
    <tr>
      <td>Bundle and Accessory Recommendations</td>
      <td>Suggests related products, bundles, or accessories based on the items in the search results or the user's cart. This use case not only improves the shopping experience by helping users find complementary products but also increases average order value through cross-selling.</td>
    </tr>
  </tbody>
</table>
