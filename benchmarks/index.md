---
layout: fullwidth
primary_title: 'OpenSearch Performance Benchmarks'
omit_from_search: true

benchmark_domain: 'benchmarks.opensearch.org'
benchmark_dashboard_id: '88071cb0-f118-11ed-aff5-859eb6ed880f'
benchmark_range_days: 7

benchmark_height_desktop: 7300
benchmark_height_mobile: 12400
---
<style>
    #benchmark-dashboard {
        width: 100%;
        height: {{ page.benchmark_height_desktop }}px;
        background: transparent;
        border: 0;
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
<iframe
  id="benchmark-dashboard"
  src="https://{{ page.benchmark_domain }}/app/dashboards?security_tenant=global#/view/{{ page.benchmark_dashboard_id }}?embed=true&show-time-filter=true&hide-filter-bar=true&&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-{{ page.benchmark_range_days }}d,to:now))"
></iframe>
