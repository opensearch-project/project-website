---
date: "2025-02-11"
product: opensearch
version: '2.19.0'
release_notes: https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.19.0.md
version_sort: 2.19-ga
components:
  - role: daemon
    artifact: opensearch
    version: 2.19.0
  - role: ui
    artifact: opensearch-dashboards
    version: 2.19.0
  - role: command-line-tools
    artifact: opensearch-cli
    version: 1.2.0
  - role: ingest
    artifact: data-prepper
    version: data-prepper-2.10.2
    platform_order:
      - docker
      - linux
  - role: minimal-artifacts
    artifact: opensearch-min
    version: 2.19.0
  - role: minimal-artifacts
    artifact: opensearch-dashboards-min
    version: 2.19.0
  - role: drivers
    artifact: opensearch-sql-odbc
    version: 1.5.0.0
  - role: drivers
    artifact: opensearch-sql-jdbc
    version: 1.4.0.1
  - role: sql-command-line
    artifact: opensearch-sql-cli
    version: 1.0.0
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
  command-line-tools:
    role: command-line-tools
    artifacts:
      opensearch-cli:
        explanation: "downloads/opensearch-cli.html"
  sql-command-line:
    role: sql-command-line
    artifacts:
      opensearch-sql-cli:
        explanation: "downloads/opensearch-sql-cli.markdown"
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
