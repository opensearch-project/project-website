---

speaker_talk_title: Lucene And Beyond - Core Storage Extension In OpenSearch

primary_title: Lucene And Beyond - Core Storage Extension In OpenSearch

primary_presenter: samuelherman

speaker_name_full: Samual Herman

title: 'OpenSearchCon 2024 North America Session: Lucene And Beyond - Core Storage Extension In OpenSearch'

session_time: '2024-09-25 - 2:35pm-3:15pm' 

session_room: 'MainStage' 

session_track: 'Operating OpenSearch' 

permalink: '/events/opensearchcon/sessions/lucene-and-beyond-core-storage-extension-in-opensearch.html' 

#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID' 

conference_id: '2024-north-america' 

presenters: 
  - samuelherman



---
OpenSearch is tightly bound to the Lucene core APIs that facilitate the following functionalities:
1. Encoding
2. Transactions
3. Merges
4. Search
5. And more...

In this presentation I will discuss how the OpenSearch storage encoding can be extended to popular formats (e.g. Parquet, Avro) that are readable by public big data systems such as Apache spark.
This provides a strategic long term benefit for the project as it allows it to more easily integrate with big data systems without the need for reindexing and transforming the data. In addition for integrations it allows for OpenSearch to easily enjoy new encoding developments that are happening outside of Lucene, such as new compression algos etc..
Moreover, I will discuss the various way of solving this problem and how in my case I choose to extend it via a new extension mechanism that involves an external writer.
The approach is quite generic and allow to extend many other aspects of the Lucene codec with native implementations such as Rust/Python etc.. 

