---
primary_presenter: apaponaud
speaker_talk_title: 'Implementing an open-source RAG with OpenSearch'
primary_title: 'Implementing an open-source RAG with OpenSearch'
title: 'OpenSearchCon 2024 Session: Implementing an open-source RAG with OpenSearch'

breadcrumbs:
  icon: community
  items:
    - title: OpenSearchCon
      url: /events/opensearchcon/index.html
    - title: 2024
      url: /events/opensearchcon/2024/europe/index.html
    - title: Europe
      url: /events/opensearchcon/2024/europe/index.html
    - title: Session Summaries
      url: /events/opensearchcon/2024/europe/sessions/index.html

# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
session_time: "2024-05-07 - 2:15pm-2:55pm"

# Room of location where the talk will occur.
session_room: "Moskau"

# Session topic track.
session_track: "Search"

# URL permalink for the session.
permalink: '/events/opensearchcon/2024/europe/sessions/implementing-an-open-source-rag-with-opensearch.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: "2024-europe"
# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - apaponaud
  - pmele


---
The RAG systems, such as Microsoft's Copilot and Google's Bard, are playing an increasingly crucial role in our digital daily lives, used every day by hundreds of millions of users.

As these giants compete for supremacy in the field of artificial intelligence, is there an emerging path towards an open-source RAG system that respects data privacy?

This presentation aims to answer this question by exploring the use of the Langchain library and OpenSearch as vector databases. We will begin with a quick analysis of the foundations of the RAG architecture. Then, we will focus on the implementation, also examining other alternatives to Langchain and OpenSearch. Finally, we will conclude by presenting the operation of a fully open-source and local RAG system within a concrete use case.