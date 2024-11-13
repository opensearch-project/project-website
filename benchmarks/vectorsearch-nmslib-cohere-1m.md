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

<iframe src="https://{{ page.benchmark_domain }}/app/dashboards#/view/1a369150-e232-11ee-addb-f72c2feaa994?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-1w,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:b4c18ee0-f35f-11ed-aff5-859eb6ed880f,key:query,negate:!f,type:custom,value:'%7B%22bool%22:%7B%22minimum_should_match%22:1,%22should%22:%5B%7B%22match_phrase%22:%7B%22user-tags.cluster-config%22:%22arm64-r6g.2xlarge-3-data-3-shards-1-replica-nmslib-cohere-1m%22%7D%7D,%7B%22match_phrase%22:%7B%22meta.tag_cluster-config%22:%22arm64-r6g.2xlarge-3-data-3-shards-1-replica-nmslib-cohere-1m%22%7D%7D%5D%7D%7D'),query:(bool:(minimum_should_match:1,should:!((match_phrase:(user-tags.cluster-config:arm64-r6g.2xlarge-3-data-3-shards-1-replica-nmslib-cohere-1m)),(match_phrase:(meta.tag_cluster-config:arm64-r6g.2xlarge-3-data-3-shards-1-replica-nmslib-cohere-1m))))))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'%5BVector%20Search%5D%20%5BNmslib%5D%201M%20Cohere%20768D',viewMode:view)&show-time-filter=true&hide-filter-bar=true"></iframe>
