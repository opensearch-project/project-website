---
primary_presenter: nbandener
speaker_name_full: 'Nils Bandener'

speaker_talk_title: 'Securing OpenSearch: Hints for avoiding common hassles'

# Page level 1 header title.
primary_title: 'Securing OpenSearch: Hints for avoiding common hassles'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: Securing OpenSearch: Hints for avoiding common hassles'

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
session_time: "2024-05-07 - 1:30pm-2:10pm"

# Room of location where the talk will occur.
session_room: "Moskau"

# Session topic track.
session_track: "Operating OpenSearch"

# URL permalink for the session.
permalink: '/events/opensearchcon/2024/europe/sessions/securing-opensearch.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
youtube_video_id: 'yhHmN_Gjies'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-europe'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - nbandener
---
Getting your cluster properly secured is an essential part of moving it into production. If you have only one or two users and are not using OpenSearch Dashboards, it is likely a straightforward task. However with a larger user base - with different authorization levels - things can get more challenging, especially if OpenSearch Dashboards is involved. Integrating OpenSearch into an SSO environment further complicates matters.

This has a number of reasons: First, OpenSearch security offers a number of features to simplify your configuration. But sometimes, these features are not too obvious. Second, there are some configuration choices which can actually make your life more difficult than necessary. And finally, it can be non-obvious to test the configuration and find out about the reasons for issues.
In our presentation, we will cover:

- Good ways to assign privileges to users
- Getting a smooth OpenSearch Dashboards experience
- Things to keep in mind when defining complex authentication configurations, especially involving SSO
- Strategies to test configuration and diagnose issues