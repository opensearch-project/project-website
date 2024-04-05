---
primary_presenter: eric-pugh
speaker_name_full: Eric Pugh
conference_id: '2024-europe'
speaker_talk_title: 'User Behavior Insights'
primary_title: 'User Behavior Insights'
title: 'OpenSearchCon 2024 Session: User Behavior Insights'

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
session_time: "time TBD"

# Room of location where the talk will occur.
session_room: "a room yet to be determined."

# Session topic track.
session_track: "Search"

# URL permalink for the session.
permalink: '/events/opensearchcon/2024/europe/sessions/user-behavior-insights.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: 
  - "2024-europe"

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - epugh
  - macrakis
---
Every search professional needs data about users' behavior. Data is fundamental for analyzing user behavior and improving search relevance, both with manual tuning and with machine learning. User Behavior Insights system provides a standard way to do just that.
Business product managers, UX designers, and relevance engineers need data to understand their users: What do they search for? What do they click on? What do they act on or buy? How do they use facets and filters? How do they refine their queries within a session? Engineers need data to improve search relevance and effectiveness, both manually and using AI/ML.

But until now, collecting user behavior data has been haphazard. Proprietary SaaS search systems collect data but don't share it with their customers. Open-source systems simply don't offer data collection mechanisms. Third-party analytics systems are designed primarily to track page-to-page flow, and not the flow of search results through the system -- and often make it difficult to extract the raw granular data needed for model training. Consequently many search teams develop and maintain their own ad hoc data collection systems and analysis tools.

Our open-source User Behavior Insights (UBI) system provides a client-side library for instrumenting web pages, a server-side library for collecting data, and analytical tools for understanding it. Critically, it defines a standard schema for behavior data so that the community can contribute additional analytical tools. We have also demonstrated its integration with personalization software.

With the emergence of even more ways of generating and ranking search results -- neural dense search, neural sparse search, model fine-tuning, hybrid search, RAG, ... -- choosing the best mix of approaches for your search application becomes even more critical.

[//]: # (UBI is a call to action to the Search Relevance community to make it simpler to seamlessly track, in an ethical and safe manner, the steps of a user’s search journey in order to build the experiences that the future requires.)