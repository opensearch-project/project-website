---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-north-america-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'gkamat'

# Conference session speaker full name.
speaker_name_full: 'Govind Kamat'

# Conference session title.
speaker_talk_title: "Unleash Your Cluster's Potential with OpenSearch Benchmark"


# Page level 1 header title.
primary_title: Unleash Your Cluster's Potential with OpenSearch Benchmark

# Page document title displayed in the browser title bar.
title: "OpenSearchCon 2024 Session: Unleash Your Cluster's Potential with OpenSearch Benchmark"

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
      


# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
session_time: "time TBD"

# Room of location where the talk will occur.
session_room: "a room yet to be determined."


# Session topic track.
session_track: "Operating OpenSearch"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/unleash-your-clusters-potential-with-opensearch-benchmark.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - gkamat
  - ihoang

---
Are you confused about sizing your OpenSearch cluster? Worried whether it will scale to handle your workload? Curious if it's performing at its best? Unsure whether an upgrade will help? If so, this talk is tailored for you!

OpenSearch users strive to obtain the best possible performance from their clusters to meet their business needs. However, measuring performance accurately and using the insights obtained to size, tune, and operate deployments is a complex undertaking.OpenSearch Benchmark (OSB), its associated workloads and provided telemetry devices are widely used within the community as a metric of performance. In this session, we'll dive into using OSB to model and run your workload, while comparing various scenarios, thereby providing you with the answers you need to optimize your cluster's performance. 

You'll gain a deep understanding of OSB's capabilities, techniques for using it for performance, scale, and longevity tests, and how it's being leveraged for the community's performance runs. By mastering the effective use of this tool and customizing it to fit your unique needs, you'll obtain meaningful insights to unleash your OpenSearch cluster's full potential and meet your business goals.

Join us and learn how to harness the power of OpenSearch Benchmark to maximize your cluster's performance, ensuring it scales seamlessly and operates at its peak.

