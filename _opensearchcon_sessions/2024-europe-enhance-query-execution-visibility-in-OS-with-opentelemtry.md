---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-north-america-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'sdeshmukh'

# Conference session speaker full name.
speaker_name_full: 'Siddhant Deshmukh'

# Conference session title.
speaker_talk_title: 'Enhance Query Execution Visibility in OS with OpenTelemetry'

# Page level 1 header title.
primary_title: 'Enhance Query Execution Visibility in OS with OpenTelemetry'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: Enhance Query Execution Visibility in OS with OpenTelemetry'

breadcrumbs:
  icon: community
  items:
    - title: OpenSearchCon
      url: /events/opensearchcon/index.html
    - title: 2024
      url: /events/opensearchcon/2024/index.html
    - title: Europe
      url: /events/opensearchcon/2024/north-america/index.html
    - title: Session Summaries
      url: /events/opensearchcon/2024/europe/sessions/index.html
# Session date / time
# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
session_time: "2024-05-06 - 11:45am-12:05pm"

# Room of location where the talk will occur.
session_room: "Moskau"

# Session topic track.
session_track: "Search"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/enhance-query-execution-visibility-in-OS-with-opentelemetry.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - sdeshmukh

---
OpenSearch users and business today seek for visibility and insights into execution of their queries. Due to the multi-phase and distributed nature of these queries, pinpointing resource utilization and time consumption, as well as identifying bottlenecks, becomes exceedingly complex.

Observability is the cornerstone of modern system monitoring and troubleshooting. In this session, we elucidate the pivotal role of observability in enhancing system reliability and performance. Delve into the three pillars of observability – Metrics, Logs, and Traces – gaining invaluable insights through real-world examples and use cases.

Embark on a journey through OpenTelemetry, the cutting-edge observability framework revolutionizing the landscape of monitoring and diagnostics. Understand the necessity of OpenTelemetry in modern distributed systems, unraveling its key concepts such as context propagation, signals, and instrumentations. Explore the robust architecture of OpenTelemetry and its seamless integration with OpenSearch components, paving the way for comprehensive end-to-end observability solutions.

Witness firsthand the practical application of OpenTelemetry within OpenSearch. Through insightful examples and code walkthroughs, learn how OpenTelemetry facilitates the effortless export of metrics and traces, offering unparalleled visibility into your OpenSearch clusters. Gain proficiency in leveraging OpenTelemetry to capture span and trace data, empowering you with actionable insights for optimizing system performance and reliability.