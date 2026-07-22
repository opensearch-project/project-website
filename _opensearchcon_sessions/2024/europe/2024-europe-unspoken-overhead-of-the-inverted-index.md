---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-north-america-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'phejman'

# Conference session speaker full name.
speaker_name_full: 'Przemyslaw Hejman'

# Conference session title.
speaker_talk_title: 'Unspoken overhead of the Inverted Index'

# Page level 1 header title.
primary_title: 'Unspoken overhead of the Inverted Index'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: Unspoken overhead of the Inverted Index'

breadcrumbs:
  icon: community
  items:
    - title: OpenSearchCon
      url: /events/opensearchcon/index.html
    - title: 2022
      url: /events/opensearchcon/2022/index.html
    - title: North America
      url: /events/opensearchcon/2022/north-america/index.html
    - title: Session Summaries
      url: /events/opensearchcon/2022/north-america/sessions/index.html
      


session_time: "2024-05-07 - 3:00pm-3:40pm"

session_room: "Asgabat"


# Session topic track.
session_track: "Community"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/unspoken-overhead-of-the-inverted-index.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
youtube_video_id: 'fJUWK_lsdaw'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - phejman
---
In this presentation I'd like to explore the technical fundamentals of Inverted Index. We'll see where it shines and where its biggest trade-offs are. We’re going to explore usage patterns, where full-text search doesn’t work best, and how one can optimize OpenSearch for the ultimate experience. We’ll dive into structures like keywords, match-only text fields or doc values.

This rather entry-level talk will focus on technical fundamentals and necessary implementation details. The audience is going to build intuition immensely useful for designing their data structures. 

Today, dozens of companies struggle escaping from OpenSearch to columnar-based SQL warehouses. Primary concern here being of course the cost. Understanding how one can optimize their setup first will help squeezing the most from their existing resources.