---

speaker_talk_title: The Future of Ingestion is... Streaming!

primary_title: The Future of Ingestion is... Streaming!

primary_presenter: reta

speaker_name_full: Andriy Redko

title: 'OpenSearchCon 2024 North America Session: The Future of Ingestion is... Streaming!'

session_time: '2024-09-25 - 10:45am-11:25am' 

session_room: 'Continental BR 1-3' 

session_track: "Analytics, Observability, and Security"

permalink: '/events/opensearchcon/sessions/the-future-of-ingestion-is-streaming.html' 

#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID' 

conference_id: '2024-north-america' 

presenters: 
  - reta



---
OpenSearch clusters are capable of ingesting massive amounts of data through a number of different HTTP APIs. How to use the ingestion APIs efficiently however, we leave for our users to figure out. Turns out, sizing bulk requests is actually kind of hard. Or: sometimes ingestion will succeed at first, and then within a few minutes OpenSearch complains that there are too many requests. Usability of the ingestion APIs is... lacking.

A while back OpenSearch Project core members suggested to introduce a streaming flavor to ingestion, in an attempt to provide an easy-to-use, efficient and modern mechanism to bringing data into OpenSearch clusters. And indeed we've started down that road. This talk will cover what we have tried, retried and retired, to finally find the way to make it work.

