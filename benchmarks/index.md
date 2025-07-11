---
layout: fullwidth-with-breadcrumbs
primary_title: 'OpenSearch Performance Benchmarks'
title: 'OpenSearch Performance Benchmarks'
breadcrumbs:
  icon: platform
  items:
    - title: The OpenSearch Platform
      url: '/platform/'
    - title: Performance Benchmarks
      url: '/benchmarks/'
omit_from_search: true

benchmark_domain: 'benchmarks.opensearch.org'
benchmark_dashboard_id: '88071cb0-f118-11ed-aff5-859eb6ed880f'
benchmark_range_days: 7

benchmark_height_desktop: 2000
benchmark_height_mobile: 6000
---
<style>
    #benchmark-dashboard {
        width: 100%;
        height: {{ page.benchmark_height_desktop }}px;
        background: transparent;
        border: 0;
    }

    #navigation ul
    {
        margin: 0;
        padding: 8px;
    }

    #navigation ul li
    {
        list-style-type: none;
        display: inline-block;
    }
    
    #navigation li:not(:first-child):before {
        content: " | ";
    }
   
    @media only screen and (max-width: 767px) {
            #benchmark-dashboard {
                height: {{ page.benchmark_height_mobile }}px;
            }
        }
</style>
<p>
    Welcome to the OpenSearch performance benchmarking page. This page displays the results of ongoing performance testing for recent and upcoming versions of the OpenSearch software. You can view key performance metrics across different workloads with the dashboard visualizations below.
</p>
<h2>Why publish performance data?</h2>
<p>
    The OpenSearch Project benchmarks the performance of OpenSearch releases to measure performance stability and gather data to inform software development. As an open-source project, we make this information publicly available in order to share it with the OpenSearch community.
</p>
<h2>Join the discussion</h2>
<p>
    Questions or contributions? Connect with the OpenSearch community in the <a href="https://app.slack.com/client/T01QQ0Q5GMA/C0516H8EJ7R">#performance</a> channel on our public Slack.
</p>
<p> You can also view the open GitHub issues tagged to performance label <a href ="https://github.com/issues?q=is%3Aopen+is%3Aissue+user%3Aopensearch-project+label%3Aperformance+">here</a>.
</p>
<p>
    To learn more about OpenSearch performance improvements through version 2.14, read <a href="https://opensearch.org/blog/opensearch-performance-2.14/">this blog post</a>.
</p>

<div class="switcher" id="navigation">
<ul>
<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards#/view/ae971a70-0715-11ee-a68c-1330e5a77b4c?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'HTTP%20Logs',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">HTTP logs</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards#/view/ed93fc60-072f-11ee-babf-6f5128a15ea1?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'NYC%20Taxis%20dashboard',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">NYC taxis</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards#/view/56b9d060-f8f8-11ee-addb-f72c2feaa994?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'PMC%20Nightly%20Dashboard',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">PMC</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards#/view/c28730f0-1ead-11ef-addb-f72c2feaa994?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:Big5_final,viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Big5</a>
</li>

<li>
   <a href ="https://{{ page.benchmark_domain }}/app/dashboards#/view/1a369150-e232-11ee-addb-f72c2feaa994?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-1w,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:b4c18ee0-f35f-11ed-aff5-859eb6ed880f,key:query,negate:!f,type:custom,value:'%7B%22bool%22:%7B%22minimum_should_match%22:1,%22should%22:%5B%7B%22match_phrase%22:%7B%22user-tags.cluster-config%22:%22arm64-r6g.2xlarge-3-data-3-shards-1-replica-nmslib-cohere-1m%22%7D%7D,%7B%22match_phrase%22:%7B%22meta.tag_cluster-config%22:%22arm64-r6g.2xlarge-3-data-3-shards-1-replica-nmslib-cohere-1m%22%7D%7D%5D%7D%7D'),query:(bool:(minimum_should_match:1,should:!((match_phrase:(user-tags.cluster-config:arm64-r6g.2xlarge-3-data-3-shards-1-replica-nmslib-cohere-1m)),(match_phrase:(meta.tag_cluster-config:arm64-r6g.2xlarge-3-data-3-shards-1-replica-nmslib-cohere-1m))))))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'%5BVector%20Search%5D%20%5BNmslib%5D%201M%20Cohere%20768D',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Vectorsearch-nmslib-Cohere-1m-768D</a>
</li>

<li>
   <a href ="https://{{ page.benchmark_domain }}/app/dashboards#/view/f9ef2c40-ee11-11ee-a589-033f2c21734f?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'333e2950-edec-11ed-a453-51f8c622cf9a',key:query,negate:!f,type:custom,value:'%7B%22bool%22:%7B%22minimum_should_match%22:1,%22should%22:%5B%7B%22match_phrase%22:%7B%22user-tags.cluster-config%22:%22arm64-r6g.4xlarge-3-data-6-shards-1-replica-nmslib-cohere-10m%22%7D%7D,%7B%22match_phrase%22:%7B%22meta.tag_cluster-config%22:%22arm64-r6g.4xlarge-3-data-6-shards-1-replica-nmslib-cohere-10m%22%7D%7D%5D%7D%7D'),query:(bool:(minimum_should_match:1,should:!((match_phrase:(user-tags.cluster-config:arm64-r6g.4xlarge-3-data-6-shards-1-replica-nmslib-cohere-10m)),(match_phrase:(meta.tag_cluster-config:arm64-r6g.4xlarge-3-data-6-shards-1-replica-nmslib-cohere-10m))))))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'%5BVector%20Search%5D%20%5BNmslib%5D%201OM%20Cohere%20768D',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Vectorsearch-nmslib-Cohere-10m-768D</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards#/view/addcf410-ee05-11ee-addb-f72c2feaa994?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-1w,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'333e2950-edec-11ed-a453-51f8c622cf9a',key:query,negate:!f,type:custom,value:'%7B%22bool%22:%7B%22minimum_should_match%22:1,%22should%22:%5B%7B%22match_phrase%22:%7B%22user-tags.cluster-config%22:%22arm64-r6g.2xlarge-3-data-3-shards-1-replica-faiss-cohere-1m%22%7D%7D,%7B%22match_phrase%22:%7B%22meta.tag_cluster-config%22:%22arm64-r6g.2xlarge-3-data-3-shards-1-replica-faiss-cohere-1m%22%7D%7D%5D%7D%7D'),query:(bool:(minimum_should_match:1,should:!((match_phrase:(user-tags.cluster-config:arm64-r6g.2xlarge-3-data-3-shards-1-replica-faiss-cohere-1m)),(match_phrase:(meta.tag_cluster-config:arm64-r6g.2xlarge-3-data-3-shards-1-replica-faiss-cohere-1m))))))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'%5BVector%20Search%5D%20%5BFaiss%5D%201M%20Cohere%20768D',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Vectorsearch-faiss-Cohere-1m-768D</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards#/view/27259320-ee12-11ee-9deb-49e7059d5448?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'333e2950-edec-11ed-a453-51f8c622cf9a',key:query,negate:!f,type:custom,value:'%7B%22bool%22:%7B%22minimum_should_match%22:1,%22should%22:%5B%7B%22match_phrase%22:%7B%22user-tags.cluster-config%22:%22arm64-r6g.4xlarge-3-data-6-shards-1-replica-faiss-cohere-10m%22%7D%7D,%7B%22match_phrase%22:%7B%22meta.tag_cluster-config%22:%22arm64-r6g.4xlarge-3-data-6-shards-1-replica-faiss-cohere-10m%22%7D%7D%5D%7D%7D'),query:(bool:(minimum_should_match:1,should:!((match_phrase:(user-tags.cluster-config:arm64-r6g.4xlarge-3-data-6-shards-1-replica-faiss-cohere-10m)),(match_phrase:(meta.tag_cluster-config:arm64-r6g.4xlarge-3-data-6-shards-1-replica-faiss-cohere-10m))))))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'%5BVector%20Search%5D%20%5BFaiss%5D%2010%20M%20Cohere%20768D',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Vectorsearch-faiss-Cohere-10m-768D</a>
</li>

<li>
  <a href ="https://{{ page.benchmark_domain }}/app/dashboards#/view/8d787400-ee06-11ee-addb-f72c2feaa994?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'333e2950-edec-11ed-a453-51f8c622cf9a',key:query,negate:!f,type:custom,value:'%7B%22bool%22:%7B%22minimum_should_match%22:1,%22should%22:%5B%7B%22match_phrase%22:%7B%22user-tags.cluster-config%22:%22arm64-r6g.2xlarge-3-data-3-shards-1-replica-lucene-cohere-1m%22%7D%7D,%7B%22match_phrase%22:%7B%22meta.tag_cluster-config%22:%22arm64-r6g.2xlarge-3-data-3-shards-1-replica-lucene-cohere-1m%22%7D%7D%5D%7D%7D'),query:(bool:(minimum_should_match:1,should:!((match_phrase:(user-tags.cluster-config:arm64-r6g.2xlarge-3-data-3-shards-1-replica-lucene-cohere-1m)),(match_phrase:(meta.tag_cluster-config:arm64-r6g.2xlarge-3-data-3-shards-1-replica-lucene-cohere-1m))))))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'%5BVector%20Search%5D%20%5BLucene%5D%201M%20Cohere%20768D',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Vectorsearch-lucene-Cohere-1m-768D</a>
</li>

<li>
   <a href ="https://{{ page.benchmark_domain }}/app/dashboards#/view/813c78b0-ee12-11ee-9deb-49e7059d5448?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:b4c18ee0-f35f-11ed-aff5-859eb6ed880f,key:query,negate:!f,type:custom,value:'%7B%22bool%22:%7B%22minimum_should_match%22:1,%22should%22:%5B%7B%22match_phrase%22:%7B%22user-tags.cluster-config%22:%22arm64-r6g.4xlarge-3-data-6-shards-1-replica-lucene-cohere-10m%22%7D%7D,%7B%22match_phrase%22:%7B%22meta.tag_cluster-config%22:%22arm64-r6g.4xlarge-3-data-6-shards-1-replica-lucene-cohere-10m%22%7D%7D%5D%7D%7D'),query:(bool:(minimum_should_match:1,should:!((match_phrase:(user-tags.cluster-config:arm64-r6g.4xlarge-3-data-6-shards-1-replica-lucene-cohere-10m)),(match_phrase:(meta.tag_cluster-config:arm64-r6g.4xlarge-3-data-6-shards-1-replica-lucene-cohere-10m))))))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'%5BVector%20Search%5D%20%5BLucene%5D%2010M%20Cohere%20768D',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Vectorsearch-lucene-Cohere-10m-768D</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards?#/view/d67264e0-f5aa-11ed-aff5-859eb6ed880f?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'Segment%20Replication%20Benchmark',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Segment Replication</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards?#/view/c130a680-fb5f-11ee-addb-f72c2feaa994?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'Big5 Dashboard',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Concurrent Segment Search Big5</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards?#/view/f2eeb270-fd4e-11ee-a589-033f2c21734f?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'NYC_TAXIS Dashboard',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Concurrent Segment Search NYC taxis</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards?#/view/f3f89730-fb73-11ee-addb-f72c2feaa994?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'NOAA Dashboard',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Concurrent Segment Search NOAA</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards?#/view/01b25d30-5216-11f0-b39d-2363e77eb224?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'Neural Search Sparse Search Dashboard',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Neural Sparse Search</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards?#/view/ee8742a0-52b7-11f0-b39d-2363e77eb224?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'Neural Search Semantic Search Dashboard',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Neural Semantic Search</a>
</li>

<li>
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards?#/view/8d469750-52b4-11f0-b987-7598f5347746?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'Neural Search Hybrid Search Dashboard',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Neural Hybrid Search</a>
</li>

</ul>
</div>

<iframe class="switch-target" src="https://{{ page.benchmark_domain }}/app/dashboards#/view/ae971a70-0715-11ee-a68c-1330e5a77b4c?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'HTTP%20Logs',viewMode:view)&show-time-filter=true&hide-filter-bar=true" id="benchmark-dashboard" name="benchmark-dashboard"></iframe>
