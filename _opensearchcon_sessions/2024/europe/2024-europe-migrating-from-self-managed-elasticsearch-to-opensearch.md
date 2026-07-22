---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in North America the title is "2023-north-america-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'liusim'

# Conference session speaker full name.
speaker_name_full: 'Liat Iusim'

# Conference session title.
speaker_talk_title: 'Migrating from Self-Managed ElasticSearch to OpenSearch'

# Page level 1 header title.
primary_title: 'Migrating from Self-Managed ElasticSearch to OpenSearch'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: Migrating from Self-Managed ElasticSearch to OpenSearch'

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
# Session date / time
# The template logic expects the following format: YYYY-MM-DD - h:m(am|pm)-(h:m(am|pm))
session_time: "2024-05-07 - 2:15pm-2:55pm"

session_room: "Moskau"


# Session topic track.
session_track: "Community"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/migrating-from-self-managed-elasticsearch-to-opensearch.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
youtube_video_id: '2OQZjnneeCY'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-north-america'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - liusim

---
This session will delve into the intricacies of migrating a large, mission-critical production Elasticsearch cluster to Amazon OpenSearch. The migration aimed to enhance the cluster's stability and increase the team's and DevOps's velocity by avoiding manual configuration changes. 

We will begin by discussing the motivation behind the migration - the complexity of self-managing an ElasticSearch cluster and the many issues we faced. We will continue to emphasize the importance of conducting a thorough POC to ensure that the new cluster meets all of our requirements, both for ingesting hundreds of millions of writes per day and supporting dozens of millions of client-facing low-latency reads per day. The POC phases included feasibility analysis, cost estimation, production cluster settings support, sanity management/maintenance, scalability testing, compatibility assessment, system tests verification, and more. 

One of the major challenges faced during the migration was the absence of an out-of-the-box tool for migrating from our self-managed to Amazon OpenSearch. Additionally, we encountered compatibility limitations that necessitated an alignment of versions of our cluster, complicating the migration process as we needed more than just loading snapshots for data migration. We will explore the solutions we devised to overcome these obstacles, including data migration strategies, validation techniques, and stress testing to ensure the new cluster's resilience and performance. 

Attendees will learn about the comprehensive approach to migrating the cluster, including data migration tools exploration, integration and stress testing, cluster sizing assessment, management, monitoring and scalability testing.  

By the end of this session, you will clearly understand the challenges and solutions involved in migrating a large Elasticsearch cluster to a managed OpenSearch environment and how such a migration can significantly enhance stability, resilience and increase team velocity.