---
# The conference_sessions template is required.
layout: conference_sessions

# Document title in the form of OpenSearchCon + the year of the conference: + the location + Session Lineup
# For example: "OpenSearchCon 2022: North America Session Lineup.
# This value is used in the <title> element and shown in the browser title bar.
title: "OpenSearchCon 2022: North America Session Lineup"

# Can be the same as title. Will be used as the page title in the top level <h1> element
# below the breadcrumbs.
# If this is not provided the title value from above will be used.
primary_title: "OpenSearchCon 2022: North America Session Lineup"

# Page breadcrumbs area configuration.
# See the _layouts/fullwidth-with-breadcrumbs.html for more information on how this is used.
# The form of the breadcrumbs for OpenSearchCon sessions content archival is 
# OpenSeardhCon -> __YEAR__ -> __LOCATION__ -> Sessions
# The "community" icon is required.
breadcrumbs:
  icon: community
  items:
    - title: OpenSearchCon
      url: /events/opensearchcon/index.html
    - title: 2022
      url: /events/opensearchcon/2022/index.html
    - title: North America
      url: /events/2022-0921-opensearchcon/
    - title: Sessions
      url: /events/opensearchcon/2022/north-america/sessions/index.html

# The conference ID. This is used by the conference content templates
# to identify what sessions, community members, exhibitors, workshops,
# and whatever other related pieces of content should be rendered.
# The format of "__YEAR__-__LOCATION__" is used because it is descriptive,
# and it is also included in the filenames of sessions, and exhibitors.
conference_id: '2022-north-america'

# Permalink specification for the desirable URL path for this conference archival exhibitors page.
# The form of OpenSearchCon sessions archives is
# /events/opensearchcon/__YEAR__/__LOCATION__/sessions/index.html.
permalink: /events/opensearchcon/2022/north-america/sessions/index.html
---
