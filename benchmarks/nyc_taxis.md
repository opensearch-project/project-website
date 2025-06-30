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

<iframe src="https://{{ page.benchmark_domain }}/app/dashboards#/view/ed93fc60-072f-11ee-babf-6f5128a15ea1?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'NYC%20Taxis%20dashboard',viewMode:view)&show-time-filter=true&hide-filter-bar=true"></iframe>
