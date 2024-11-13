---
layout: dashboard_layout
title: OpenSearch Performance Benchmarks
dashboards:
  - name: HTTP_LOGS
    url: /benchmarks/http_logs
  - name: NYC_TAXIS
    url: /benchmarks/nyc_taxis
  - name: PMC
    url: /benchmarks/pmc
  - name: Big5
    url: /benchmarks/Big5
  - name: Vectorsearch-nmslib-Cohere-1m
    url: /benchmarks/vectorsearch-nmslib-cohere-1m
  - name: Vectorsearch-nmslib-Cohere-10m
    url: /benchmarks/vectorsearch-nmslib-cohere-10m
  - name: Vectorsearch-faiss-Cohere-1m
    url: /benchmarks/vectorsearch-faiss-cohere-1m
  - name: Vectorsearch-faiss-Cohere-10m
    url: /benchmarks/vectorsearch-faiss-cohere-10m
  - name: Vectorsearch-lucene-Cohere-1m
    url: /benchmarks/vectorsearch-lucene-cohere-1m
  - name: Vectorsearch-lucene-Cohere-10m
    url: /benchmarks/vectorsearch-lucene-cohere-10m
  - name: Concurrent Segment Search Big5
    url: /benchmarks/concurrent_segment_search_big5
  - name: Concurrent Segment Search NYC_TAXIS
    url: /benchmarks/concurrent_segment_search_nyc
  - name: Concurrent Segment Search NOAA
    url: /benchmarks/concurrent_segment_search_noaa
benchmark_domain: 'benchmarks.opensearch.org'
---

<iframe src="https://{{ page.benchmark_domain }}/app/dashboards#/view/f9ef2c40-ee11-11ee-a589-033f2c21734f?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'333e2950-edec-11ed-a453-51f8c622cf9a',key:query,negate:!f,type:custom,value:'%7B%22bool%22:%7B%22minimum_should_match%22:1,%22should%22:%5B%7B%22match_phrase%22:%7B%22user-tags.cluster-config%22:%22arm64-r6g.4xlarge-3-data-6-shards-1-replica-nmslib-cohere-10m%22%7D%7D,%7B%22match_phrase%22:%7B%22meta.tag_cluster-config%22:%22arm64-r6g.4xlarge-3-data-6-shards-1-replica-nmslib-cohere-10m%22%7D%7D%5D%7D%7D'),query:(bool:(minimum_should_match:1,should:!((match_phrase:(user-tags.cluster-config:arm64-r6g.4xlarge-3-data-6-shards-1-replica-nmslib-cohere-10m)),(match_phrase:(meta.tag_cluster-config:arm64-r6g.4xlarge-3-data-6-shards-1-replica-nmslib-cohere-10m))))))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'%5BVector%20Search%5D%20%5BNmslib%5D%201OM%20Cohere%20768D',viewMode:view)&show-time-filter=true&hide-filter-bar=true"></iframe>
