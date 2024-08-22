---

speaker_talk_title: "Architectural blockers for autoscaling in OpenSearch, or - Why cant we have nice things?"

primary_title: "Architectural blockers for autoscaling in OpenSearch, or - Why cant we have nice things?"

primary_presenter: amistrn

speaker_name_full: Amitai Stern

title: "OpenSearchCon 2024 North America Session: Architectural blockers for autoscaling in OpenSearch, or - Why cant we have nice things?"

session_time: '2024-09-24 - 1:35pm-2:15pm' 

session_room: 'Continental BR 1-3' 

session_track: 'Operating OpenSearch' 

permalink: "/events/opensearchcon/sessions/architectural-blockers-for-autoscaling-in-opensearch-or-why-cant-we-have-nice-things.html"

#youtube_video_id: 'SOME_YOUTUBE_VIDEO_ID' 

conference_id: '2024-north-america' 

presenters: 
  - amistrn



---
The indexing rates of many clusters follow some sort of fluctuating pattern - be it day/night, weekday/weekend, or any sort of duality when the cluster changes from being active to less active.  In these cases how does one scale the cluster? Could they be wasting resources during the night while activity is low?
Many big data technologies such as OpenSearch have a wonderful feature - they scale! This is key to maintaining a production cluster, as we may increase the cluster's capacity by simply adding more nodes on the fly. However, when the capacity is not being utilized we may wish to reduce costs by reducing the number of nodes (scaling-in).
Sadly, scaling OpenSearch is not straightforward, let alone easy to automate. This results in all sorts of innovative cluster topologies to reduce wasted resources based on the specific (continuously changing!) use case of the cluster.

In this talk we will take a look at OpenSearch's architecture, highlighting the main reasons scaling clusters is hard. Discuss state-of-the-art topologies to achieve primitive basic autoscaling, and dive into how the opensearch-project may be able to support this in the future.

If you manage a production cluster and are concerned about the cost, particularly if you think autoscaling could help you but are unsure if you want to go down that road. Or, if you want to be that "well actually..." person when people mention autoscaling OpenSearch -> then this talk is for you!

