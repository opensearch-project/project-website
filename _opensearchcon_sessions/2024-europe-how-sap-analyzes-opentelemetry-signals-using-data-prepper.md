---
primary_presenter: jbrand
speaker_name_full: "Jannik Brand"
speaker_talk_title: 'How SAP analyzes OpenTelemetry signals using Data Prepper'
primary_title: 'How SAP analyzes OpenTelemetry signals using Data Prepper'
title: 'OpenSearchCon 2024 Session: How SAP analyzes OpenTelemetry signals using Data Prepper'

breadcrumbs:
  icon: community
  items:
    - title: OpenSearchCon
      url: /events/opensearchcon/index.html
    - title: 2024
      url: /events/opensearchcon/2024/europe/index.html
    - title: Europe
      url: /events/opensearchcon/2024/europe/index.html
    - title: Session Summaries
      url: /events/opensearchcon/2024/europe/sessions/index.html

# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
session_time: "2024-05-07 - 11:40am-12:20pm"

# Room of location where the talk will occur.
session_room: "Moskau"

# Session topic track.
session_track: "Analytics, Observability, and Security"

# URL permalink for the session.
permalink: '/events/opensearchcon/2024/europe/sessions/how-sap-analyzes-opentelemetry-signals-using-data-prepper.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: "2024-europe"
# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - jbrand
  - dvenable


---

OpenTelemetry is the CNCF standard for observability providing simple code instrumentations and vendor neutrality while supporting logs, metrics, and traces. This increases the demand for observability backends supporting this format. Analyzing observability data is one of the main use cases for OpenSearch. The observability plugin enables powerful trace analytics amongst other things. Data Prepper closes the gap between OpenTelemetry-instrumented applications and OpenSearch by providing the required field mappings.

The first part of the session provides a general overview of Data Prepper. We will discuss some of Data Prepper’s key offerings to help you ingest observability data into OpenSearch.

In the second part, a productive use case within SAP will show how OpenTelemetry and OpenSearch come together. This is achieved by a managed Data Prepper component for ingestion and several predefined dashboards for analysis.

We will show the working solution from SAP Cloud Logging and explain our Data Prepper based architecture and deployment. This will include operational challenges with Data Prepper running on Kubernetes, such as memory configuration and stability. An important aspect is ingestion performance, for which we present our load test setup and learnings.