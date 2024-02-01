---
# The conference_archive_landing template is required.
layout: conference_archive_landing

# Document title in the form of "OpenSearchCon the year of the conference: + the location
# For example: "OpenSearchCon 2022: United States.
# This value is used in the <title> element and shown in the browser title bar.
# Replace the substring placeholders __YEAR__ and __LOCATION__ appropriately 
# with the conference year and location respectively.
title: "OpenSearchCon 2022:  United States"

# Can be the same as title. Will be used as the page title in the top level <h1> element
# below the breadcrumbs.
# If this is not provided the title value from above will be used.
primary_title: "OpenSearchCon 2022:  United States"

# Page breadcrumbs area configuration.
# See the _layouts/fullwidth-with-breadcrumbs.html for more information on how this is used.
# The form of the breadcrumbs for OpenSearchCon content archival is 
# OpenSeardhCon -> Archive -> __YEAR__ -> __LOCATION__
# The "community" icon is required.
breadcrumbs:
  icon: community
  items:
    - title: OpenSearchCon
      url: /events/opensearchcon/index.html
    - title: Archive
      url: /events/opensearchcon/archive/index.html
    - title: 2022
      url: /events/opensearchcon/archive/2022/index.html
    - title: United States
      url: /events/opensearchcon/archive/2022/us/index.html

# The conference ID. This is used by the conference content templates
# to identify what sessions, community members, exhibitors, workshops,
# and whatever other related pieces of content should be rendered.
# The format of "__YEAR__-__LOCATION__" is used because it is descriptive,
# and it is also included in the filenames of sessions, and exhibitors.
conference_id: "2022-us"

# Permalink specification for the desirable URL path for this conference archival landing page.
# The form of OpenSearchCon archives is
# /events/opensearchcon/archive/__YEAR__/__LOCATION__/index.html.
premalink: /events/opensearchcon/archive/2022/us/index.html

# For the years 2022, and 2023 there were only a single conference each year.
# So this redirect from .../archive/__YEAR__/index.html is used to redirect
# from that URL to this page instead of a list of conferences for that year.
redirect_from: /events/opensearchcon/archive/2022/index.html

# Whether or not there is a hero image. This has an impact on the base CSS class of the
# document. See _sass/_redesign-typography.scss for how .page-with-hero, and .page-without-hero
# affects page typography.
has_hero: false

# IF there is a page hero image this is where the path will be defined.
hero_image: '/assets/media/opensearchcon/osc-2023.png'

# Configration for the conference sections that are available
# and shown in the left sidebar. They are defined as an array
# of pairs of (label, url). This example shows the configuration
# for what was available for the year 2022; Sessions, Speakers, and Exhibitors.
# In 2023 there was also Workshops, and the Unconference.
conference_sections_button_stack:
  - label: Sessions
    url: /events/opensearchcon/archive/2022/us/sessions/index.html
  - label: Speakers
    url: /events/opensearchcon/archive/2022/us/speakers/index.html
  - label: Exhibitors
    url: /events/opensearchcon/archive/2022/us/exhibitors/index.html

# Cards of related articles shown in the left sidebar.
# Defines title, url, category, and date.
related_articles:
  - title: Using Fluent Bit and OpenSearch with Bottlerocket and Kubelet logs
    url: /blog/bottlerocket-k8s-fluent-bit/
    category: community
    date: Wed, Jul 20, 2022

# Featured session card configuration shown in the main right content area
# below the marketing copy.
featured_sessions:
  - title: Opening Keynote
    url: /events/opensearchcon/archive/2022/united-states/sessions/keynote.html
    date: Wednesday 09/21/2022
    thumbnail: /assets/media/opensearchcon/2022-keynote-thumbnail.png
    category: Community
  - title: Getting Started with the OpenSearch Core Codebase
    url: /events/opensearchcon/archive/2022/united-states/sessions/getting-started-with-opensearch-core-codebase.html
    date: Wednesday 9/21/2022
    thumbnail: /assets/media/opensearchcon/2022-getting-started.png
  - title: OpenSearch Project Roadmap 2022 and Beyond
    url: /events/opensearchcon/archive/2022/united-states/sessions/opensearch-project-roadmap-2022-and-beyond.html
    date: Wednesday 09/21/2022
    thumbnail: /assets/media/opensearchcon/2022-roadmap-and-beyond.png
---
