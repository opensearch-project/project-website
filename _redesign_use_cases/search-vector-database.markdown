---
layout: redesign-use-case
title: Vector Database Use Cases
description: 'OpenSearch as a vector database supports a range of applications. Following are a few examples of solutions you can build.'
feature_area_category_name: Search
feature_area_solution_name: Vector Database
how_to_get_started: 
  - 'You can get started with OpenSearch&apos;s vector database functionality by exploring our <a href="https://opensearch.org/docs/latest/search-plugins/vector-search/" target="_blank">vector search documentation</a>. To learn more or to start a discussion, join our <a href="https://opensearch.org/slack.html"  target="_blank">public Slack channel</a>, check out our <a href="https://forum.opensearch.org/"  target="_blank">user forum</a>, and follow our <a href="https://opensearch.org/blog/"  target="_blank">blog</a> for the latest on OpenSearch tools and features.'
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
      <td>Visual search</td>
      <td>Create applications that allow users to take a photograph and search for similar images without having to manually tag images.</td>
    </tr>
    <tr>
      <td>Semantic search</td>
      <td>Enhance search relevancy by powering vector search with text embedding models that capture semantic meaning and use hybrid scoring to blend term frequency models (BM25) for improved results. To learn more, see <a href="https://opensearch.org/docs/latest/search-plugins/semantic-search/" target="_blank">Semantic search</a>.</td>
    </tr>
    <tr>
      <td>Multimodal search</td>
      <td>Use state-of-the-art models that can fuse and encode text, image, and audio inputs to generate more accurate digital fingerprints of rich media and enable more relevant search and insights. To learn more, see <a href="https://opensearch.org/docs/latest/search-plugins/multimodal-search/" target="_blank">Multimodal search</a>.</td>
    </tr>
    <tr>
      <td>Generative AI agents</td>
      <td>Build intelligent agents with the power of generative AI while minimizing <a href="https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)#:~:text=AI%20hallucination%20gained%20prominence%20around,falsehoods%20within%20their%20generated%20content." target="_blank">hallucinations</a> by using OpenSearch to power retrieval augmented generation (RAG) workflows with large language models (LLMs). (Whether you refer to them as chatbots, automated conversation entities, question answering bots, or something else, OpenSearch’s vector database functionality can help them deliver better results). To learn more, see <a href="https://opensearch.org/docs/latest/search-plugins/conversational-search/" target="_blank">Conversational search</a>.</td>
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
      <td>Recommendation engine</td>
      <td>Generate product and user embeddings using collaborative filtering techniques and use OpenSearch to power your recommendation engine.</td>
    </tr>
    <tr>
      <td>User-level content targeting</td>
      <td>Personalize web pages by using OpenSearch to retrieve content ranked by user propensities using embeddings trained on user interactions.</td>
    </tr>
  </tbody>
</table>
<table>
  <thead>
    <tr>
      <th colspan="2">Data Quality</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Automate pattern matching and de-duplication</td>
      <td>Use similarity search for automating pattern matching and duplicates in data to facilitate data quality processes.</td>
    </tr>
  </tbody>
</table>
<table>
  <thead>
    <tr>
      <th colspan="2">Vector database engine</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data and machine learning platforms</td>
      <td>Build your platform with an integrated, Apache 2.0-licensed vector database that provides a reliable and scalable solution to operationalize embeddings and power vector search. To learn more, see <a href="https://opensearch.org/docs/latest/search-plugins/vector-search/" target="_blank">Vector search</a>.</td>
    </tr>
  </tbody>
</table>
