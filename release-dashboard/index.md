---
layout: fullwidth-with-breadcrumbs
primary_title: 'OpenSearch Release Dashboard'
title: 'OpenSearch Release Dashboard'
breadcrumbs:
  icon: platform
  items:
    - title: The OpenSearch Platform
      url: '/platform/'
    - title: Release Dashboard
      url: '/release-dashboard/'
omit_from_search: true

release_versions:
  - version: 2.18.0
    release_issue: 5004
    release_retro_issue: 5005
  - version: 2.17.0
    release_issue: 4908
    release_retro_issue: 4909
  - version: 2.16.0
    release_issue: 4771
    release_retro_issue: 4847

metrics_height_desktop: 2000
metrics_height_mobile: 6000
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
    .version-selector {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        margin-bottom: 20px;
    }
    .version-item {
        margin: 0 10px;
        padding: 10px 20px;
        border: 1px solid #007bff;
        border-radius: 4px;
        cursor: pointer;
        color: #007bff;
        font-weight: bold;
        text-align: center;
        user-select: none;
    }
    .version-item.selected {
        background-color: #007bff;
        color: #fff;
    }
</style>

<p>
    Welcome to the OpenSearch Release Metrics page. As part of the metrics project initiative and with the goal of providing a central release dashboard, this page offers a comprehensive overview of the metrics and key indicators related to the ongoing OpenSearch releases. It provides a consolidated view of all release-related metrics, helping the OpenSearch community to track release progress and its activities effectively.
    <br><br>
    <a href="#metrics-dashboard">OpenSearch Release Metrics</a>: This dashboard provides a high-level overview of key repo health indicators and metrics related to the current OpenSearch release. It is designed to help release managers and the community monitor the release's progress and ensure that everything is on track.
    <br><br>
    <a href="#component-metrics-dashboard">OpenSearch Component Release Metrics</a>: This dashboard provides an overview of metrics related to specific OpenSearch components, enabling teams to track the release status of individual components through detailed component-level release metrics.
    <br><br>
    <a href="#test-results-dashboard">OpenSearch Release Build and Integration Test Results</a>: This dashboard focuses on build and integration test failures. It is a critical dashboard for component-level release owners, as it highlights build and integration test issues that need to be resolved to avoid delays or problems during the release process.
</p>

<h2>Release Version</h2>
<div id="version-selector" class="version-selector">
    {% for version in page.release_versions %}
        <div class="version-item {% if forloop.first %}selected{% endif %}" data-version="{{ version.version }}">{{ version.version }}</div>
    {% endfor %}
</div>

<div id="release-info">
    <p id="release-issue"></p>
    <p id="release-retro-issue"></p>
</div>

<div id="metrics-dashboard" class="dashboard-container">
    <h1 onclick="openModal('modal1')">OpenSearch Release Metrics</h1>
    <a id="metrics-dashboard-link" href="#" target="_blank" class="button">Direct Link to Metrics Dashboard</a>
    <iframe id="metrics-iframe" width="100%" height="1300"></iframe>
</div>

<div id="component-metrics-dashboard" class="dashboard-container">
    <h1 onclick="openModal('modal2')">OpenSearch Component Release Metrics</h1>
    <a id="component-metrics-dashboard-link" href="#" target="_blank" class="button">Direct Link to Component Metrics Dashboard</a>
    <iframe id="component-metrics-iframe" width="100%" height="{{ page.metrics_height_desktop }}"></iframe>
</div>

<div id="test-results-dashboard" class="dashboard-container">
    <h1 onclick="openModal('modal3')">OpenSearch Release Build and Integration Test Results</h1>
    <a id="test-results-dashboard-link" href="#" target="_blank" class="button">Direct Link to Test Results Dashboard</a>
    <iframe id="test-results-iframe" width="100%" height="{{ page.metrics_height_desktop }}"></iframe>
</div>


<div id="modal1" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <span class="close" onclick="closeModal('modal1')">&times;</span>
            OpenSearch Release Metrics
        </div>
        <div class="modal-body">
            <iframe id="modal1-iframe" width="100%" height="100%"></iframe>
        </div>
    </div>
</div>

<div id="modal2" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <span class="close" onclick="closeModal('modal2')">&times;</span>
            OpenSearch Component Release Metrics
        </div>
        <div class="modal-body">
            <iframe id="modal2-iframe" width="100%" height="100%"></iframe>
        </div>
    </div>
</div>

<div id="modal3" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <span class="close" onclick="closeModal('modal3')">&times;</span>
            OpenSearch Release Build and Integration Test Results
        </div>
        <div class="modal-body">
            <iframe id="modal3-iframe" width="100%" height="100%"></iframe>
        </div>
    </div>
</div>

<script>
    const versions = {
        {% for version in page.release_versions %}
            "{{ version.version }}": {
                releaseIssue: {{ version.release_issue }},
                releaseRetroIssue: {{ version.release_retro_issue }}
            },
        {% endfor %}
    };

    let currentSelection = "{{ page.release_versions[0].version }}";

    function updateDashboard(selectedVersion) {
        const versionData = versions[selectedVersion];

        if (selectedVersion) {
            document.getElementById('release-issue').innerHTML = `The current release issue for ${selectedVersion} is <a href="https://github.com/opensearch-project/opensearch-build/issues/${versionData.releaseIssue}" style="color: #007bff; text-decoration: none;">#${versionData.releaseIssue}</a> and the release retro issue is <a href="https://github.com/opensearch-project/opensearch-build/issues/${versionData.releaseRetroIssue}" style="color: #007bff; text-decoration: none;">#${versionData.releaseRetroIssue}</a>. Please follow the release issue for updates posted by the release manager.`;

            const baseUrl = 'https://metrics.opensearch.org/_dashboards/app/dashboards?security_tenant=global#';
            const metricsUrl = `${baseUrl}/view/12d47dd0-e0cc-11ee-86f3-3358a59f8c46?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,controlledBy:'1710287534575',disabled:!f,index:'512c9c70-e0b3-11ee-9a74-07cd3b4ff414',key:version.keyword,negate:!f,params:(query:'${selectedVersion}'),type:phrase),query:(match_phrase:(version.keyword:'${selectedVersion}')))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Release%20Metrics',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true`;

            const testResultsUrl = `${baseUrl}/view/21aad140-49f6-11ef-bbdd-39a9b324a5aa?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-30d,to:now))&_a=(description:'OpenSearch%20Release%20Build%20and%20Integration%20Test%20Results',filters:!(('$state':(store:appState),meta:(alias:!n,controlledBy:'1721852613904',disabled:!f,index:'16f55f10-4977-11ef-8565-15a1562cd0a0',key:version,negate:!f,params:(query:'${selectedVersion}'),type:phrase),query:(match_phrase:(version:'${selectedVersion}')))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Release%20Build%20and%20Integration%20Test%20Results',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true`;

            const componentMetricsUrl = `${baseUrl}/view/be62b350-6b06-11ef-8d6b-d50babf51bc6?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now%2Fd,to:now%2Fd))&_a=(description:'',filters:!(('$state':(store:appState),meta:(alias:!n,controlledBy:'1725485220320',disabled:!f,index:'512c9c70-e0b3-11ee-9a74-07cd3b4ff414',key:version.keyword,negate:!f,params:(query:'${selectedVersion}'),type:phrase),query:(match_phrase:(version.keyword:'${selectedVersion}')))),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Component%20Release%20Metrics',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true`;

            document.getElementById('metrics-iframe').src = metricsUrl;
            document.getElementById('test-results-iframe').src = testResultsUrl;
            document.getElementById('component-metrics-iframe').src = componentMetricsUrl;
            document.getElementById('metrics-dashboard-link').href = metricsUrl;
            document.getElementById('test-results-dashboard-link').href = testResultsUrl;
            document.getElementById('component-metrics-dashboard-link').href = componentMetricsUrl;
            document.getElementById('modal1-iframe').src = metricsUrl;
            document.getElementById('modal2-iframe').src = componentMetricsUrl;
            document.getElementById('modal3-iframe').src = testResultsUrl;
        } else {
            document.getElementById('release-issue').innerHTML = '';
            document.getElementById('release-retro-issue').innerHTML = '';
            const baseUrl = 'https://metrics.opensearch.org/_dashboards/app/dashboards?security_tenant=global#';
            const defaultMetricsUrl = `${baseUrl}/view/12d47dd0-e0cc-11ee-86f3-3358a59f8c46?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Release%20Metrics',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true`;

            const defaultTestResultsUrl = `${baseUrl}/view/21aad140-49f6-11ef-bbdd-39a9b324a5aa?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-30d,to:now))&_a=(description:'OpenSearch%20Release%20Build%20and%20Integration%20Test%20Results',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Release%20Build%20and%20Integration%20Test%20Results',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true`;

            const defaultComponentMetricsUrl = `${baseUrl}/view/be62b350-6b06-11ef-8d6b-d50babf51bc6?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now%2Fd,to:now%2Fd))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'OpenSearch%20Component%20Release%20Metrics',viewMode:view)&show-top-menu=true&show-query-input=true&show-time-filter=true`;

            document.getElementById('metrics-iframe').src = defaultMetricsUrl;
            document.getElementById('test-results-iframe').src = defaultTestResultsUrl;
            document.getElementById('component-metrics-iframe').src = defaultComponentMetricsUrl;
            document.getElementById('metrics-dashboard-link').href = defaultMetricsUrl;
            document.getElementById('test-results-dashboard-link').href = defaultTestResultsUrl;
            document.getElementById('component-metrics-dashboard-link').href = defaultComponentMetricsUrl;
            document.getElementById('modal1-iframe').src = defaultMetricsUrl;
            document.getElementById('modal2-iframe').src = defaultComponentMetricsUrl;
            document.getElementById('modal3-iframe').src = defaultTestResultsUrl;
        }
    }
    document.addEventListener('DOMContentLoaded', function () {
        const defaultVersion = "{{ page.release_versions[0].version }}";
        document.querySelector(`.version-item[data-version="${defaultVersion}"]`).classList.add('selected');
        updateDashboard(defaultVersion);
    });
    document.getElementById('version-selector').addEventListener('click', function (event) {
        const selectedElement = event.target;
        if (selectedElement.classList.contains('version-item')) {
            const selectedVersion = selectedElement.getAttribute('data-version');
            
            if (currentSelection === selectedVersion) {
                selectedElement.classList.remove('selected');
                currentSelection = '';
                updateDashboard('');
            } else {
                if (currentSelection) {
                    document.querySelector(`.version-item[data-version="${currentSelection}"]`).classList.remove('selected');
                }
                selectedElement.classList.add('selected');
                currentSelection = selectedVersion;
                updateDashboard(selectedVersion);
            }
        }
    });
</script>

<script>
    function openModal(modalId) {
        document.getElementById(modalId).style.display = "flex";
    }
    function closeModal(modalId) {
        document.getElementById(modalId).style.display = "none";
    }
</script>

<h2>Join the discussion</h2>
<p>
    Questions or contributions? Connect with the OpenSearch community in the <a href="https://opensearch.slack.com/archives/C0561HRK961">#releases</a> channel on our public Slack.
</p>

<p>
    To learn more about OpenSearch Release Process, please read this <a href="https://github.com/opensearch-project/opensearch-build/wiki/Releasing-the-Distribution">wiki document</a> part of the opensearch-build repo.
</p>