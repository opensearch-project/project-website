---
#
# Sample data for community members with the persona of "conference_speaker".
#

# Short name. It is normative to match the filename in the form of 
# first letter of first name + last name.
# For example the name John Smith the value would be 'jsmith'.
speaker_name: 'flast'

# The path to the user photo.
speaker_image: '/assets/media/opensearchcon/speakers/flast.jpg'

# Community member full name (first + last).
speaker_name_full: 'First Last'

# Used as the level 1 page header text.
primary_title: 'Speaker: First Last'

# Used as the document title displayed in the browser title bar.
title: 'OpenSearchCon 2023 Speaker: First Last'

# Breadcrumbs specification.
# The community icon is expected.
# The breadcrumbs path structure is Communit -> Members -> First Last's Profile.
breadcrumbs:
  icon: community
  items:
    - title: Community
      url: /community/index.html
    - title: Members
      url: /community/members/index.html
    - title: "First Last&apos;s Profile"
      url: '/community/members/first-last.html'

# Value depends on the user, what company they work for, and what is their job title.
speaker_title_and_company: 'Researcher'

# Array of conference IDs for which the community member is a keynote speaker, if any, or boolean false otherwise.
keynote_speaker:
  - '2023-north-america'
# keynote_speaker: false

# The conference topic track for the user's sessions.
session_track: "Community"

# URL for the community member profile.
permalink: '/community/members/first-last.html'

# Array of community member user personas.
personas:
  - conference_speaker

# Array of conference IDs that the member is a speaker.
conference_id:
  - "2023-north-america"
---

Markdown or HTML content providing a user bio, or whatever is desired to describe their involvement in open source technology in general, and specifically how their work relates to the OpenSearch Project.
