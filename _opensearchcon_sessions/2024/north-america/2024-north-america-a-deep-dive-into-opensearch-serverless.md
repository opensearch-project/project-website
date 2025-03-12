---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-north-america-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'rnair'

# Conference session speaker full name.
speaker_name_full: 'Rohit Nair'

# Conference session title.
speaker_talk_title: 'A deep dive into OpenSearch Serverless'

# Page level 1 header title.
primary_title: 'A deep dive into OpenSearch Serverless'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 North America Session: A deep dive into OpenSearch Serverless'


# Session date / time
# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
session_time: "2024-09-25 - 4:40pm-5:20pm"

# Room of location where the talk will occur.
session_room: "Continental BR 1-3"

# Session topic track.
session_track: "Operating OpenSearch"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/a-deep-dive-into-opensearch-serverless.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: '2024-north-america'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - rnair
  - milavshah
---
Ever wondered how OpenSearch serverless works? Dive into the details of the architecture, understand its performance and operational characteristics and find out where we’re headed next!