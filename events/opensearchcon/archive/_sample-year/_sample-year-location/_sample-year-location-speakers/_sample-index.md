---
# The conference_sessions template is required.
layout: conference_speakers

# Document title displyed in the browser title bar.
title: "Meet the OpenSearchCon 2022 Speakers"

# Can be the same as title. Will be used as the page title in the top level <h1> element
# below the breadcrumbs.
# If this is not provided the title value from above will be used.
primary_title: "Meet the OpenSearchCon 2022 Speakers"

# Page breadcrumbs area configuration.
# See the _layouts/fullwidth-with-breadcrumbs.html for more information on how this is used.
# The form of the breadcrumbs for OpenSearchCon Speakers content archival is 
# OpenSeardhCon -> Archive -> __YEAR__ -> __LOCATION__ -> Speakers
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
      url: /events/2022-0921-opensearchcon/
    - title: Speakers
      url: /events/opensearchcon/archive/2022/us/speakers/index.html

# The conference ID. This is used by the conference content templates
# to identify what sessions, community members, exhibitors, workshops,
# and whatever other related pieces of content should be rendered.
# The format of "__YEAR__-__LOCATION__" is used because it is descriptive,
# and it is also included in the filenames of sessions, and exhibitors.
conference_id: '2022-us'

# Permalink specification for the desirable URL path for this conference archival exhibitors page.
# The form of OpenSearchCon speakers archives is
# /events/opensearchcon/archive/__YEAR__/__LOCATION__/speakers/index.html.
permalink: /events/opensearchcon/archive/2022/us/speakers/index.html
---
