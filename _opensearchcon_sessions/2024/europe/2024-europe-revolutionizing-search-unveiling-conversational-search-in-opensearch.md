---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-north-america-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'ljeanniot'

# Conference session speaker full name.
speaker_name_full: 'Lucas Jeanniot'

# Conference session title.
speaker_talk_title: 'Revolutionizing Search: Unveiling Conversational Search in OpenSearch'

# Page level 1 header title.
primary_title: 'Revolutionizing Search: Unveiling Conversational Search in OpenSearch'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: Revolutionizing Search: Unveiling Conversational Search in OpenSearch'

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
# Session date / time
# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
session_time: "2024-05-07 - 3:00pm-3:40pm"

# Room of location where the talk will occur.
session_room: "Moskau"

# Session topic track.
session_track: "Search"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/revolutionizing-search-unveiling-conversational-search-in-opensearch.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
youtube_video_id: 'Rm1SVjgmugg'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - ljeanniot
---
This session will delve into the world of conversational search and it's implementation on OpenSearch clusters. This talk will guide viewers through the steps of implementing AI powered retrieval, inference, and context to your data through simple pipelines. Discover how a fusion of AI-Powered NLP processes and search functionality can help you interact with your data in a more personal and meaningful way. From understanding user intent to handling complex queries in real-time, learn how Conversational Search empowers users to access information seamlessly and intuitively. Attendees will gain a comprehensive understanding of the architecture, design, and best practices for deploying Conversational Search on their clusters.