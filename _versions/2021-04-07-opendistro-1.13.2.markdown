---
components:
  -
    role: daemon
    artifact: elasticsearch
    version: odfe-1.13.2
#    architecture_order: 
#      - arm64
#      - x64
#      - jvm
#    platform_order:
#      - java
#      - linux
#      - windows
  -
    role: ui
    artifact: kibana
    version: odfe-1.13.2
  -
    role: driver
    artifact: odfe-jdbc
    version: odfe-1.13.0
  -
    role: driver
    artifact: odfe-odbc
    version: odfe-1.13.0
  -
    role: command-line-tools
    artifact: odfe-cli
    version: cli-1.1.0
  -
    role: command-line-tools
    artifact: perftop
    version: odfe-1.13.0
  -
    role: ingest
    artifact: data-prepper
    version: data-prepper-1.1.0
  -
    role: ingest
    artifact: logstash-oss-with-opensearch-output-plugin
    version: logstash-oss-with-opensearch-output-plugin-1.0.0

# you can override pretty values like this
#pretty:
#  artifacts:
#    elasticsearch: FantasticSearch
pretty:
  sections:
    docker: 'Try Open Distro with Docker'
    production: 'Install Open Distro for Elasticsearch for production'
    elasticsearch: 'Elasticsearch & Plugins'
    kibana: 'Kibana & Plugins'
    drivers: 'Drivers for Open Distro'

version: '1.13.2 (Open Distro for Elasticsearch)'
date: 2021-04-07
release_notes: https://github.com/opendistro-for-elasticsearch/opendistro-build/blob/master/release-notes/opendistro-for-elasticsearch-release-notes-1.13.2.md

sections:
  docker:
    explanation: "downloads/odfe-docker.markdown"
  production:
    explanation: "downloads/odfe-production.markdown"
  elasticsearch:
    role: daemon
    artifacts:
      elasticsearch:
        explanation: "downloads/odfe-daemon.html"
  kibana:
    role: ui
    artifacts:
      kibana:
        explanation: "downloads/odfe-ui.html"
  drivers:
    explanation: "downloads/odfe-drivers.html"
    role: driver
    artifacts:
      odfe-jdbc:
        explanation: "downloads/jdbc.html"
      odfe-odbc:
        explanation: "downloads/odbc.html"
  command-line-tools:
    role: command-line-tools
    artifacts:
      odfe-cli:
        explanation: "downloads/odfe-cli.html"
      perftop:
        explanation: "downloads/perftop.html"
  data-ingest:
    role: ingest
    artifacts:
      data-prepper:
        explanation: "downloads/data-prepper.html"
      logstash-oss-with-opensearch-output-plugin:
        explanation: "downloads/logstash-oss-with-opensearch-output-plugin.html"
---