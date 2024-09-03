---
layout: fullwidth-with-breadcrumbs
primary_title: 'OpenSearch Release Metrics'
title: 'OpenSearch Release Metrics'
breadcrumbs:
  icon: platform
  items:
    - title: The OpenSearch Platform
      url: '/platform/'
    - title: Release Metrics
      url: '/release-metrics/'
omit_from_search: true

benchmark_domain: 'metrics.opensearch.org'
benchmark_dashboard_id: '88071cb0-f118-11ed-aff5-859eb6ed880f'
benchmark_range_days: 7

benchmark_height_desktop: 2000
benchmark_height_mobile: 6000
---
<style>
    body, html {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #fff;
    }
    h1 {
        text-align: center;
        margin: 5px 0;
        cursor: pointer;
        text-decoration: underline;
    }
    .dashboard-container {
        width: 100%;
        margin-bottom: 20px;
        overflow: hidden;
    }
    iframe {
        width: 100%;
        border: none;
    }
    @media only screen and (min-width: 768px) {
        iframe {
            height: {{ page.benchmark_height_desktop }}px;
        }
    }
    @media only screen and (max-width: 767px) {
        iframe {
            height: {{ page.benchmark_height_mobile }}px;
        }
    }
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: rgba(0,0,0,0.5);
        justify-content: center;
        align-items: center;
    }
    .modal-content {
        position: relative;
        width: 100%;
        height: 100%;
        max-width: 1200px;
        max-height: 900px
        background-color: white;
        overflow: hidden;
    }
    .modal-header {
        padding: 16px;
        font-size: 20px;
        font-weight: bold;
        border-bottom: 1px solid #ddd;
        background-color: #f5f5f5;
        margin-bottom: 16px;
    }
    .close {
        position: absolute;
        right: 20px;
        top: 20px;
        color: #000;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
        z-index: 2;
    }
    .close:hover,
    .close:focus {
        color: #555; 
        text-decoration: none;
        cursor: pointer;
    }
    .modal-body {
        padding: 16px;
        height: calc(100% - 60px);
        overflow: auto;
    }
    .nav-index {
        margin: 5px;
        text-align: center;
    }
    .nav-index a {
        margin: 0 15px;
        text-decoration: none;
        color: #007bff;
        font-weight: bold;
    }
    .nav-index a:hover {
        text-decoration: underline;
    }
    .button {
        display: inline-block;
        padding: 10px 15px;
        font-size: 14px;
        color: #fff;
        background-color: #007bff;
        text-decoration: none;
        border-radius: 4px;
        margin-top: 10px;
    }
    .button:hover {
        background-color: #0056b3;
    }
</style>

<div class="nav-index">
    <a href="#metrics-dashboard">OpenSearch Release Metrics</a>
    <a href="#test-results-dashboard">OpenSearch Release Build and Integration Test Results</a>
</div>

<p> 
    Welcome to the OpenSearch Release Metrics page. As part of the <a href="https://github.com/opensearch-project/opensearch-metrics">metrics project initiative</a> and with the goal of providing a central release dashboard, this page offers a comprehensive overview of the metrics and key indicators related to the ongoing OpenSearch releases. It provides a consolidated view of all release-related metrics, helping the the OpenSearch community to track release progress and its activities effectively. The page features dashboards and visualizations that support the community, plugin teams, and release managers by offering essential data to ensure a smooth release process. Additionally, it includes dashboards for build and integration test failures, which are particularly valuable for component-level release owners as these dashboards help in identifying and addressing issues before and during the release window.
</p>
<h2>Join the discussion</h2>
<p>
    Questions or contributions? Connect with the OpenSearch community in the <a href="https://opensearch.slack.com/archives/C0561HRK961">#releases</a> channel on our public Slack.
</p>

<p>
    To learn more about OpenSearch Release Process, please read this <a href="https://github.com/opensearch-project/opensearch-build/wiki/Releasing-the-Distribution">wiki document</a> part of the opensearch-build repo.
</p>

<div id="metrics-dashboard" class="dashboard-container">
    <h1 onclick="openModal('modal1')">OpenSearch Release Metrics</h1>
    <a href="https://metrics.opensearch.org/_dashboards/app/dashboards?security_tenant=global#/view/12d47dd0-e0cc-11ee-86f3-3358a59f8c46?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Release%20Metrics',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true" target="_blank" class="button">Direct Link to Metrics Dashboard</a>
    <iframe src="https://metrics.opensearch.org/_dashboards/app/dashboards?security_tenant=global#/view/12d47dd0-e0cc-11ee-86f3-3358a59f8c46?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Release%20Metrics',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true"></iframe>
</div>

<div id="test-results-dashboard" class="dashboard-container">
    <h1 onclick="openModal('modal2')">OpenSearch Release Build and Integration Test Results</h1>
    <a href="https://metrics.opensearch.org/_dashboards/app/dashboards?security_tenant=global#/view/21aad140-49f6-11ef-bbdd-39a9b324a5aa?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-30d,to:now))&_a=(description:'OpenSearch%20Release%20Build%20and%20Integration%20Test%20Results',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Release%20Build%20and%20Integration%20Test%20Results',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=tru" target="_blank" class="button">Direct Link to Metrics Dashboard</a>
    <iframe src="https://metrics.opensearch.org/_dashboards/app/dashboards?security_tenant=global#/view/21aad140-49f6-11ef-bbdd-39a9b324a5aa?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-30d,to:now))&_a=(description:'OpenSearch%20Release%20Build%20and%20Integration%20Test%20Results',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Release%20Build%20and%20Integration%20Test%20Results',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true"></iframe>
</div>

<!-- First Modal -->
<div id="modal1" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <span class="close" onclick="closeModal('modal1')">&times;</span>
            OpenSearch Release Metrics
        </div>
        <div class="modal-body">
            <iframe src="https://metrics.opensearch.org/_dashboards/app/dashboards?security_tenant=global#/view/12d47dd0-e0cc-11ee-86f3-3358a59f8c46?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Release%20Metrics',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true"></iframe>
        </div>
    </div>
</div>

<!-- Second Modal -->
<div id="modal2" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <span class="close" onclick="closeModal('modal2')">&times;</span>
            OpenSearch Release Build and Integration Test Results
        </div>
        <div class="modal-body">
            <iframe src="https://metrics.opensearch.org/_dashboards/app/dashboards?security_tenant=global#/view/21aad140-49f6-11ef-bbdd-39a9b324a5aa?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-30d,to:now))&_a=(description:'OpenSearch%20Release%20Build%20and%20Integration%20Test%20Results',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Release%20Build%20and%20Integration%20Test%20Results',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true"></iframe>
        </div>
    </div>
</div>

<script>
    function openModal(modalId) {
        document.getElementById(modalId).style.display = "flex";
    }
    function closeModal(modalId) {
        document.getElementById(modalId).style.display = "none";
    }
</script>
