---
date: "2023-06-06"
product: opensearch
version: '2.8.0'
release_notes: https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.8.0.md
version_sort: 2.8.0-ga
components:
  - role: daemon
    artifact: opensearch
    version: 2.8.0
  - role: ui
    artifact: opensearch-dashboards
    version: 2.8.0
  - role: command-line-tools
    artifact: opensearch-cli
    version: 1.1.0
  - role: ingest
    artifact: data-prepper
    version: data-prepper-2.3.2
    platform_order:
      - docker
      - linux
  - role: ingest
    artifact: logstash-oss-with-opensearch-output-plugin
    version: 8.6.1
  - role: minimal-artifacts
    artifact: opensearch-min
    version: 2.8.0
  - role: minimal-artifacts
    artifact: opensearch-dashboards-min
    version: 2.8.0
  - role: drivers
    artifact: opensearch-sql-odbc
    version: 1.5.0.0
  - role: drivers
    artifact: opensearch-sql-jdbc
    version: 1.3.0.0
sections:
  docker-compose:
    explanation: "downloads/opensearch-docker.markdown"
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
  data-ingest:
    explanation: "downloads/opensearch-data-ingest.markdown"
    role: ingest
    artifacts:
      data-prepper:
        explanation: "downloads/data-prepper.html"
      logstash-oss-with-opensearch-output-plugin:
        explanation: "downloads/logstash-oss-with-opensearch-output-plugin.markdown"
  command-line-tools:
    role: command-line-tools
    artifacts:
      opensearch-cli:
        explanation: "downloads/opensearch-cli.html"
  drivers:
    explanation: "downloads/drivers.markdown"
    role: drivers
    artifacts:
      opensearch-sql-odbc:
        explanation: "downloads/odbc.markdown"
      opensearch-sql-jdbc:
        explanation: "downloads/jdbc.markdown"
  minimal:
    explanation: "downloads/minimal-distributions.markdown"
    role: minimal-artifacts
    artifacts:
      opensearch-min:
        explanation: "downloads/opensearch-daemon-min.markdown"
      opensearch-dashboards-min:
        explanation: "downloads/opensearch-ui-min.markdown"
pretty:
  artifacts:
    opensearch: ''
    opensearch-min: 'OpenSearch Minimum'
    opensearch-dashboards: ''
    opensearch-dashboards-min: 'OpenSearch Dashboards Minimum'
---
OpenSearch is open source software that uses the Apache License version 2 (ALv2). ALv2 grants you well-understood usage rights; you can use, modify, extend, embed, monetize, resell, and offer OpenSearch as part of your products and services. The source for the entire project is available on [GitHub](https://github.com/opensearch-project/) and you're welcome to build from source for customized deployments. Downloadable artifacts for OpenSearch and OpenSearch Dashboards include plugins and tools, ready for you to use with minimal configuration.
