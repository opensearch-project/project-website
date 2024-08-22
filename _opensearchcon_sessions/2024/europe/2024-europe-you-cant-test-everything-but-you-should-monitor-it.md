---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-europe-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'mlehr'

# Conference session speaker full name.
speaker_name_full: 'Michael Lehr'

# Conference session title.
speaker_talk_title: "You can't test everything but you should monitor it"

# Page level 1 header title.
primary_title: "You can't test everything but you should monitor it"

# Page document title displayed in the browser title bar.
title: "OpenSearchCon 2024 Session: You can't test everything but you should monitor it"

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
session_time: "2024-05-07 - 4:45pm-5:05pm"

session_room: "Asgabat"

# Session topic track.
session_track: "Community"

# URL permalink for the session.
permalink: "/events/opensearchcon/sessions/you-cant-test-everything-but-you-should-monitor-it.html"

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
youtube_video_id: '6vhK8lTDeKM'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-europe'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - mlehr

---
I want to present an incident which happend at our warehouse which leads to an OpenSearch use case for metrics and monitoring:
We are renting out thousands of photo booths every year with ten thousands of bookings. Most of our processes are fully automated, like the configuration of the photo booths which are connected to the network in the fulfillment or the download of the photos when a photo booth has returned.

In the high season, the photo booths get returned via shipping on the same day as they are getting configured and sent out to the next customer.

For this, the download of several gigabytes of photos must be fast. Normally, there are only 10 minutes between downloading and configuring a photo booth on the shelf again.

From one day to the next, we had issues that the download did not finish in time and it took almost 30 minutes. This disrupted the business a lot. After several hours of debugging, we found out that we had a network issue. After aggregating the data - which took some time - we found out that this error was there from 2020 already - 2 years. But we did not notice because we did not have a monitoring for this and we did not send out that many photo booths because of Covid-19.

This was the day we decided we need monitoring for everything - so we set up OpenSearch, pushed in the metrics including the old one and added alerts so we get noticed in time. By this, we will recognize very early and can take action to get rid of problems.