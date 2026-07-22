---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-north-america-community-inclusion.html"
#



# Conference session title.
speaker_talk_title: 'Airbnb Embedding Platform'

# Page level 1 header title.
primary_title: 'Airbnb Embedding Platform'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: Airbnb Embedding Platform'


# Session date / time
# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
session_time: "2024-09-25 - 10:00am - 10:40am"

# Room of location where the talk will occur.
session_room: "Main Stage"

# Session topic track.
session_track: "Community"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/airbnb-embedding-platform.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: '2024-north-america'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - mpaul
  - xwang
  - tflobbe
  - asharma
---
In this session, you'll learn how Airbnb is leveraging OpenSearch as a vector database for its embedding platform. This talk is for everyone, starting with an overview of how Airbnb is using vector embeddings to solve guest, host & marketplace challenges, followed by specific use cases that led Airbnb to adopt OpenSearch as its vector database. We will share lessons learned and provide insights into strategies for optimizing OpenSearch as a vector database.This talk is must attend for those exploring vector databases to power embeddings based retrieval, generative AI or RAG use cases.


In this talk we will

* Overview - Discuss how we use embeddings and LLMs to tackle many product challenges across Airbnb.
* Infrastructure - We will also discuss the infrastructure we built at airbnb to power vector solutions with focus on Airbnb’s embedding platform.
* OpenSearch - This section will discuss in detail how we leverage OpenSearch as a vector database to store and retrieve embeddings effectively.
* Optimizations - Finally we share our learnings and strategies to optimize OpenSearch vector indices with “image search” as case study.
