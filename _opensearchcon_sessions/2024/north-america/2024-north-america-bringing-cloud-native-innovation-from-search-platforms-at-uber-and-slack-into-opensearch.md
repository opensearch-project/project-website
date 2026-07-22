---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-north-america-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
#primary_presenter: 'flast'

# Conference session speaker full name.
#speaker_name_full: 'First Last'

# Conference session title.
speaker_talk_title: 'Bringing cloud native innovation from search platforms at Uber and Slack into OpenSearch'

# Page level 1 header title.
primary_title: 'Bringing cloud native innovation from search platforms at Uber and Slack into OpenSearch'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 North America Session: Bringing cloud native innovation from search platforms at Uber and Slack into OpenSearch'


# Session date / time
# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
session_time: "2024-09-25 - 9:15pm-9:55am"

# Room of location where the talk will occur.
session_room: "Continental BR 4-5"

# Session topic track.
session_track: "Community"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/bringing-cloud-native-innovation-from-search-platforms-at-uber-and-slack-into-opensearch.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: '2024-north-america'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - bburkholder
  - kramasamy
  - pallp

---
In this session, Uber and Slack, who are strategic partners for OpenSearch, will go through their unique requirements of their low latency, high throughput workloads. These requirements have led them to develop their own search and log analytics platforms, namely LucenePlus from Uber and Astra from Slack/Salesforce. This session will cover the innovations in LucenePlus and Astra that make it easy to operate, cost-effective, and scale to petabytes of data. The session will conclude with how Uber and Slack are collaborating with OpenSearch Project to bring some of their learnings and innovations from their platforms into OpenSearch, with special focus on a modular cloud native architecture with isolation between readers and writers and a performant messaging protocol for communication between services.

