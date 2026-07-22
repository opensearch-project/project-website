---
#
# Sample data for community members.
#

# The short name is used to identify related pieces of content in the site. For example it is used in the "authors" array of blog posts, and it is used in the "presenters" array for OpenSearch Conference sessions to identify who is speaking.
# The format for existing values is not normalized. In some cases it is "first-initial-of-first-name" + "last-name", or matching a GitHub username, or something all together random. What is important is that it is unique within the system.
short_name: "mkarnik"

# The member's full name, or otherwise meaningful preferred name. It is used in the templates for presenting content authors as well as the name of conference speakers.
name: "Mukul Karnik"

# The path to the community member's photo.
photo: "/assets/media/community/members/mkarnik.jpeg"

# Used as the level 1 page header text.
primary_title: 'Mukul Karnik'

# Used as the document title displayed in the browser title bar.
title: 'OpenSearch Project Community Member: Mukul Karnik'

# Breadcrumbs specification.
# The community icon is expected.
# The breadcrumbs path structure is Communit -> Members -> Mukul Karnik's Profile.
breadcrumbs:
  icon: community
  items:
    - title: Community
      url: /community/index.html
    - title: Members
      url: /community/members/index.html
    - title: "Mukul Karnik&apos;s Profile"
      url: '/community/members/first-last.html'

# Community member job title and company where they work.
job_title_and_company: 'General Manager, OpenSearch'

# Array of conference IDs for which the community member is a keynote speaker, if any, or boolean false otherwise.
# This value is only relevant for member's with the "conference_speaker" user persona.
keynote_speaker:
  - '2024-europe'
# keynote_speaker: false

# The conference topic track for the conference sessions that the user is a speaker. These are shaped as an array of value pairs mapping conference ID and name. 
# For example for the North American conference for the year 2023, and the "Community" track:
session_track: 
  - conference_id: "2024-europe"
    name: "Keynote"

# URL for the community member profile.
permalink: '/community/members/mukul-karnik.html'

# Array of community member user personas.
# At this time, only conference_speaker, and author are defined.
personas:
  - conference_speaker
  - author

# Array of conference IDs that the member is a speaker.
conference_id:
  - "2024-europe"


# Optional GitHub username
#github: githubusername

# Optional LinkedIn username
#linkedin: linkedinusername

# Optional Twitter username
#twitter: twitterusername

# Optional Mastodon server url, and username / handle.
#mastodon:
#  url: https://mastodon.social/@mastodonusername
#  name: mastodonusername
redirect_from: '/authors/mkarnik/'
---

Mukul Karnik is General Manager for OpenSearch at Amazon Web Services, where he helps steward the open-source OpenSearch Project and is responsible for large-scale cloud-native search, log, and security analytics platforms. Mukul has held several roles since joining Amazon in 2005, including serving as engineering director for Amazon QuickSight at the time the service was launched and leading the service and caching infrastructure org that powers Amazon and AWS services. Mukul earned his Master’s degree from the University of Maryland, College Park. He holds more than 30 patents and has authored several journals and conference papers.
 