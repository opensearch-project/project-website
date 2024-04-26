---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-europe-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'charliehull'

# Conference session speaker full name.
speaker_name_full: 'Charlie Hull'

# Conference session title.
speaker_talk_title: "Tune E-commerce Search For Success with Chorus & OpenSearch"

# Page level 1 header title.
primary_title: "Tune E-commerce Search For Success with Chorus & OpenSearch"

# Page document title displayed in the browser title bar.
title: "OpenSearchCon 2024 Session: Tune E-commerce Search For Success with Chorus & OpenSearch"

breadcrumbs:
  icon: community
  items:
    - title: OpenSearchCon
      url: /events/opensearchcon/index.html
    - title: 2024
      url: /events/opensearchcon/2024/index.html
    - title: Europe
      url: /events/opensearchcon/2024/europe/index.html
    - title: Session Summaries
      url: /events/opensearchcon/2024/europe/sessions/index.html
      
session_time: "2024-05-07 - 1:30pm-2:10pm"

session_room: "Asgabat"

# Session topic track.
session_track: "Search"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/tune-e-commerce-search-for-success-with-chorus-and-opensearch.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-europe'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - charliehull

---
E-commerce search managers are constantly tuning search, finding under-performing or problem queries and balancing changing business and user needs. Chorus, an entirely open source reference platform for e-commerce (now compatible with OpenSearch), allows you to test queries, gather human judgements and derive overall search result quality metrics. It also allows individual queries to be modified to boost up or down products from certain categories, help match what the user types with your product catalogue or redirect to information pages. Chorus is a composable reference implementation- you can take each of the technologies demonstrated and use them with your own OpenSearch setup as you require.

We'll show how Chorus came to be and demonstrate using our example online shop, Chorus Electronics, how to fix common problems that affect user loyalty and sales volume. We'll also discuss how Chorus can empower search managers to fix problem queries without re-indexing or modifying search configurations - even on a live site. We'll finish with examples of how vector search can be used in Chorus to improve results and add image search.