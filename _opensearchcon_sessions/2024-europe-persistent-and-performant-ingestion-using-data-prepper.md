---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-north-america-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'dvenable'

# Conference session speaker full name.
speaker_name_full: 'David Venable'

# Conference session title.
speaker_talk_title: 'Persistent and performant ingestion using Data Prepper'

# Page level 1 header title.
primary_title: 'Persistent and performant ingestion using Data Prepper'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: Persistent and performant ingestion using Data Prepper'

breadcrumbs:
  icon: community
  items:
    - title: OpenSearchCon
      url: /events/opensearchcon/index.html
    - title: 2024
      url: /events/opensearchcon/2024/index.html
    - title: North America
      url: /events/opensearchcon/2024/north-america/index.html
    - title: Session Summaries
      url: /events/opensearchcon/2024/europe/sessions/index.html
# Session date / time
# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))

session_time: "time TBD"

# Room of location where the talk will occur.
session_room: "a room yet to be determined."




# Session topic track.
session_track: "Analytics, Observability, and Security"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/persistent-and-performant-ingestion-using-data-prepper.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-europe'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - dvenable
---
Data Prepper is a last-mile data collector for ingestion into OpenSearch. It has a number of capabilities to help users reliably move their data into OpenSearch. We will discuss the Kafka buffer. This buffer uses Apache Kafka to persist data before writing to OpenSearch. You can use it to simplify your pipeline creation. We will also share how to use dead-letter queues to ensure your data is saved when OpenSearch has a transient error preventing ingestion. We will also discuss how you can use end-to-end acknowledgements for pull-based sources. Finally, we will share some of our future plans for Data Prepper and how they will improve on these solutions.