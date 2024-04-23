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
    <a href ="https://{{ page.benchmark_domain }}/app/dashboards?#/view/d67264e0-f5aa-11ed-aff5-859eb6ed880f?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'Segment%20Replication%20Benchmark',viewMode:view)&show-time-filter=true&hide-filter-bar=true" target="benchmark-dashboard">Segment Replication</a>
</li>
</ul>
</div>

<iframe class="switch-target" src="https://{{ page.benchmark_domain }}/app/dashboards#/view/ae971a70-0715-11ee-a68c-1330e5a77b4c?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!f,title:'HTTP%20Logs',viewMode:view)&show-time-filter=true&hide-filter-bar=true" id="benchmark-dashboard" name="benchmark-dashboard"></iframe>
