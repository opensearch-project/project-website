---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-europe-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'jhandler'

# Conference session speaker full name.
speaker_name_full: 'Jon Handler'

# Conference Multi-tenancy for all workloads.
speaker_talk_title: 'Multi-tenancy for all workloads'

# Page level 1 header title.
primary_title: 'Multi-tenancy for all workloads'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: Multi-tenancy for all workloads'

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
permalink: '/events/opensearchcon/sessions/multi-tenancy-for-all-workloadshtml'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-europe'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - jhandler

---
All OpenSearch workloads are multi-tenant! Search workloads with multiple indices, languages, or customers, or logs workloads with multiple data streams, are multi-tenant. Handling that tenancy means aligning resources against data for optimal performance. Learn the strategies and solutions!

I'll cover the three main tenancy models - siloed, pooled, and hybrid. I'll cover how to implement them, and tradeoffs with each model. At large scale, tenancy becomes a burning issue. I'll talk through how to break up large, multi-tenant workloads, with the right architectures and tenant distribution. I'll also cover operationalizing your tenancy strategy with routing, isolation, tenant management, cost and resource allocation.
