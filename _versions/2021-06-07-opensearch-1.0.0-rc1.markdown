---
date: 2021-06-07

product: opensearch
version: '1.0.0 (Release Candidate 1)'
release_notes: https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-1.0.0-rc1.md

version_sort: 1.0.0-1

components:
  -
    role: daemon
    artifact: opensearch
    version: 1.0.0-rc1
  -
    role: ui
    artifact: opensearch-dashboards
    version: 1.0.0-rc1

sections:
  opensearch:
    role: daemon
    artifacts:
      opensearch:
        explanation: "downloads/opensearch-daemon.markdown"
  opensearch-dashboards:
    role: ui
    artifacts:
      opensearch-dashboards:
        explanation: "downloads/opensearch-ui.markdown"
  docker-compose:
    explanation: "downloads/opensearch-docker.markdown"

#  -
#    role: dashboards-plugin
#    artifact: dashboards-reports
#    version: 1.1.1
#  -
#    role: plugin
#    artifact: reports
#    version: 1.1.2
#  -
#    role: plugin
#    artifact: sql
#    version: 1.0.0-rc1
---
OpenSearch is open source software that uses the Apache License version 2 (ALv2). ALv2 grants you well-understood usage rights; you can use, modify, extend, embed, monetize, resell, and offer OpenSearch as part of your products and services. The source for the entire project is available on [GitHub](https://github.com/opensearch-project/) and you're welcome to build from source for customized deployments. Downloadable artifacts for OpenSearch and OpenSearch Dashboards include plugins and tools, ready for you to use with minimal configuration.
