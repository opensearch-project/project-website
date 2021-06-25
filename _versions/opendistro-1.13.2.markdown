---
components:
  -
    role: daemon
    artifact: elasticsearch
    pretty: Elasticsearch
    version: odfe-1.13.2
    architecture_order: 
      - docker
      - arm64
      - x64
    platform_order:
      - linux
      - windows
  -
    role: ui
    pretty: Kibana
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
    role: cli
    artifact: odfe-cli
    version: odfe-1.1.0
  -
    role: performance-monitor
    artifact: perftop
    version: odfe-1.13.0
  -
    role: ingest
    artifact: data-prepper
    version: "1.0.0"
---