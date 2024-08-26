---

speaker_talk_title: "Accelerating search and aggregations in OpenSearch - How we achieved a 6.7x speedup across 5 areas"

primary_title: "Accelerating search and aggregations in OpenSearch - How we achieved a 6.7x speedup across 5 areas"

primary_presenter: mfroh

speaker_name_full: Michael Froh

title: "OpenSearchCon 2024 North America Session: Accelerating search and aggregations in OpenSearch - How we achieved a 6.7x speedup across 5 areas"

session_time: '2024-09-24 - 3:50pm-4:30pm' 

session_room: 'Continental BR 1-3' 

session_track: 'Search' 

permalink: "/events/opensearchcon/sessions/accelerating-search-and-aggregations-in-opensearch-how-we-achieved-a-6x-speedup-across-5-areas.html"

#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID' 

conference_id: '2024-north-america' 

presenters: 
  - mfroh 



---
In this talk, we explore 5 areas that have seen speedups in OpenSearch versions 2.12 and later. For text term queries, we explore how match_only_text and IndexOrDocValues queries improve text matching. We improved sorting performance by optimizing the order of segment traversal in a search. On terms aggregations, we completely bypass collection by reading bucket counts from the underlying index statistics.  We discuss how we modified date histogram aggregations to work more closely with the point tree representation of timestamps. Finally, we describe current work (planned for OpenSearch 2.16) to speed up range queries by approximation and early termination.

