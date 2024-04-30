---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in Europe the title is "2023-europe-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'acharalambous'

# Conference session speaker full name.
speaker_name_full: 'Antony Charalambous'

# Conference Multi-tenancy for all workloads.
speaker_talk_title: 'A Thrilling Journey into Data-Driven Security Automation'

# Page level 1 header title.
primary_title: 'A Thrilling Journey into Data-Driven Security Automation'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: A Thrilling Journey into Data-Driven Security Automation'

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
session_time: "2024-05-06 - 12:10pm-12:30pm"

session_room: "Moskau"
# Session topic track.
session_track: "Analytics, Observability, and Security"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/a-thrilling-journey-into-data-driven-security-automation.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-europe'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - plynch
  - acharalambous
---
Join us to find out how OpenSearch fuels a cutting-edge, data-driven approach to security automation, exploring how the data-generated can be used to enhance security use-cases resulting in increased visibility and insights.

OpenSearch plays a crucial role in managing datasets across various domains of IT including applications, networks, and infrastructure. Leveraging these datasets it supports a modern approach to data-driven automation, particularly in the area of security. In our session, we will delve into several applications of this method looking at how data can be utilised to perform just-in-time patching of assets, the generation of insights with continuous password hygiene reducing risks of compromise through poor password practices, and the use of historical data to inform automated decisions when granting network access.

OpenSearch has been instrumental in our ability to deploy numerous innovative security use-cases. By integrating OpenSearch with robust automation processes, we’ve managed to construct solutions that would have otherwise required additional technologies or tools. In this presentation, we aim to illustrate how OpenSearch can empower security teams to accomplish more with less whilst minimising the number of tools. By leveraging data-driven automation we were able to reduce manual processes and mitigate burnout among team members.