---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-europe-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'fbarrera'

# Conference session speaker full name.
speaker_name_full: 'Fernando Rejon Barrera'

# Conference session title.
speaker_talk_title: 'RAGElo: An Elo Rating-based Evaluation Toolkit for RAG'

# Page level 1 header title.
primary_title: 'RAGElo: An Elo Rating-based Evaluation Toolkit for RAG'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: RAGElo: An Elo Rating-based Evaluation Toolkit for RAG'

breadcrumbs:
  icon: community
  items:
    - title: OpenSearchCon
      url: /events/opensearchcon/index.html
    - title: 2024
      url: /events/opensearchcon/2024/index.html
    - title: North America
      url: /events/opensearchcon/2024/europe/index.html
    - title: Session Summaries
      url: /events/opensearchcon/2024/europe/sessions/index.html
      


session_time: "2024-05-07 - 10:55am-11:35am"

session_room: "Asgabat"


# Session topic track.
session_track: "Community"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/ragelo-an-elo-rating-based-evaluation-toolkit-for-rag.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-europe'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - fbarrera
  - jzavrel

---
Retrieval Augmented Generation (RAG) has become the workhorse of Large Language Models (LLMs) for Question Answering and Chat grounded in private data sets. On the R side, search engines provide many different retrieval strategies for finding relevant information; vector search, BM25, hybrid search, re-ranking, etc. On the G side, prompt engineering is more like an art than a science; small variations in the prompt can lead to wildly different results. When combined with agent-style generation, where the LLM is in charge of deciding the query, search filters, and retrieval strategy based on the user intent, the number of possible solution variations becomes astronomical. On top of all of this, standard evaluation techniques of comparing to "gold standard" answers are not always feasible, as the answer might not be known or might be too expensive to obtain. This is where RAGElo comes in. RAGElo creates an Elo ranking system for the different RAG solutions. Here, powerful LLMs employ reasoning techniques to evaluate pairs of answers alongside a set of questions, taking into account the information retrieved by the search engine.