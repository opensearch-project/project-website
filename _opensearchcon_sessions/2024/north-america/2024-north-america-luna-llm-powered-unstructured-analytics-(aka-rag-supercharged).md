---

speaker_talk_title: Luna — LLM-powered Unstructured Analytics (aka “RAG-supercharged”)

primary_title: Luna — LLM-powered Unstructured Analytics (aka “RAG-supercharged”)

primary_presenter: mehulshah

speaker_name_full: Mehul Shah

title: 'OpenSearchCon 2024 North America Session: Luna — LLM-powered Unstructured Analytics (aka “RAG-supercharged”)'

session_time: '2024-09-25 - 10:00am-10:40am' 

session_room: 'Continental BR 7-9' 

session_track: 'Search' 

permalink: '/events/opensearchcon/sessions/luna-llm-powered-unstructured-analytics-(aka-ragsupercharged).html' 

#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID' 

conference_id: '2024-north-america' 

presenters: 
  - mehulshah



---
RAG is all the rage. In enterprise settings such financial services, healthcare, pharma, and more, users want accurate and explainable answers from LLMs. Unfortunately, LLM hallucinate, and thus can be a liability. To address this, developers are using retrieval-augmented generation (RAG) — an approach where LLMs synthesize answers from external data to limit hallucinations.
We argue that pure search-based RAG approaches are insufficient and that we need a more general approach inspired by the tenets that made relational databases successful. We call this Luna for LLM-powered unstructured analytics. With Luna, users ask questions in free-form natural language, and the system uses LLMs to automatically generate and execute a query plan. The query plan can include analytics functions, hybrid search queries, LLM-based data processing, and more. In our case, the plan uses OpenSearch and LLMs to compute answers from complex, unstructured documents such as PDFs, HTML, and presentations.
In this talk, we outline customers use cases and how Luna handles three styles of questions, “hunt-and-peck”, “sweep-and-harvest”, and “data integration,” that arise from these use cases. We describe the Luna planner, which uses LLMs to automatically construct query plans and translate them into search pipelines in OpenSearch. We describe how we extend OpenSearch search pipelines to support external Python-native operators that easily integrate with LLMs and their libraries. We show that combining the Luna planner with OpenSearch and its extended set of search and analytics functionality, we can achieve higher accuracy and answer a richer spectrum of questions than existing RAG approaches.

