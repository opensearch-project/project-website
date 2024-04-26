---
#
# The expected filename format is ${conference_id}-${url-encoded-session-title}.md
# For example the "Community Inclusion" session from the 2023 conference in Europe the title is "2023-europe-community-inclusion.html"
#

# Conference session speaker short name that maps to a short_name value
# in the community members collection.
primary_presenter: 'bgamble'

# Conference session speaker full name.
speaker_name_full: 'Ben Gamble'

# Conference Multi-tenancy for all workloads.
speaker_talk_title: 'Rag to riches: getting AI to work for you with opensearch'

# Page level 1 header title.
primary_title: 'Rag to riches: getting AI to work for you with opensearch'

# Page document title displayed in the browser title bar.
title: 'OpenSearchCon 2024 Session: Rag to riches: getting AI to work for you with opensearch'

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
session_time: "2024-05-07 - 3:00pm-3:40pm"
session_room: "Moskau"

# Session topic track.
session_track: "Search"

# URL permalink for the session.
permalink: '/events/opensearchcon/sessions/rag-to-riches-getting-ai-to-work-for-you-with-opensearch.html'

# ID of the YouTube video of the session to embed in the page.
# This is to be added after the conference and after the session recordings
# are uploaded to YouTube.
#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID'

# Conference ID.
# It is normative to use the format of 'YYYY-location-name', eg. '2023-europe'.
conference_id: '2024-europe'

# Array of short_name values for the Community Members with the conference_speaker persona whom are presenting the session. This includes the primary_speaker indicated above and any other presenters (if any).
presenters:
  - bgamble
---
Large language models have gained immense popularity recently, but deploying them for tasks like customer service, data discovery, or code generation involves certain risks. One significant concern is the occurrence of hallucinations, where the model makes illogical connections between concepts, leading to nonsensical or erroneous responses. These hallucinations, while not the only risk associated with large language models, are certainly among the most conspicuous.

So, why consider OpenSearch? The key lies in understanding how Large language models Operate. They are HUGE, multi-layered neural nets, and like all neural nets, inherently lack comprehension of words. To enable this understanding, we need to vectorize words. Vectorization involves translating facts into numerical sequences, creating high-dimensional vectors. These facts can range from images and text blocks to sounds and program code. A vector represents the quantified essence of a fact in n-dimensional space. With effective vectorization techniques, the similarity between vectors can be gauged, often through nearest neighbor searches. For instance, the vector for "burgers" would be close to that of "sandwiches" in a search for related food items. Thus, the process involves vectorization followed by search. Recall-assisted generation (RAG) operates by providing context which is missing in the initial training. In addition to allowing LLM answers to be updated and improved as time goes by.

Where does opensearch fit in this? OpenSearch provides robust support for K-nearest neighbors (KNN) indexing, enhancing the efficiency and accuracy of similarity searches. By leveraging KNN indices, OpenSearch enables rapid retrieval of nearest neighbors for a given vector, facilitating quick and precise identification of semantically similar items. This feature significantly streamlines the recall-assisted generation process, empowering users to harness the full potential of large language models with confidence and ease.

In this presentation, we'll delve into the fundamentals of building systems with large language models using OpenSearch as a vector database. We'll explore recall-assisted generation, including the main APIs available and related tools such as LangChain and LangChain4J. Additionally, we'll discuss strategies for deploying and scaling these systems in production, highlighting the unique features of OpenSearch that make it an ideal tool for recall-assisted generation.