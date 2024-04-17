---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-north-america-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'jhandler'

# Conference session speaker full name.
speaker_name_full: 'Jon Handler'

# Conference session title.
speaker_talk_title: 'Natural Language Search-Lexical and Semantic'

# Page level 1 header title.
primary_title: 'Natural Language Search-Lexical and Semantic'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: Natural Language Search-Lexical and Semantic'

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
# Session date / time
# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
session_time: "time TBD"

session_room: "a room yet to be determined."


# Session topic track.
session_track: "Community"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/natural-language-search-lexical-and-semantic.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - jhandler

---
When we work with information systems, we capture information in text and find information with text queries. Advances in AI have made it possible to move from word-to-word matching to something like meaning-to-meaning matching. Learn how search and OpenSearch unlock the meaning in your information.

This session is foundational, covering why we search, and how we search to retrieve the best results. I will cover the core search algorithm, BM25 scoring, vectors (dense and sparse), LLMs, embedding generation and the neural and kNN plugins, exact, and approximate scoring