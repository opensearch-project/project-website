---
# you can override pretty values like this
#pretty:
#  artifacts:
#    elasticsearch: FantasticSearch
components:
  -
    role: daemon
    artifact: elasticsearch
    version: odfe-1.13.2
    architecture_order: 
      - arm64
      - x64
      - jvm
    platform_order:
      - java
      - linux
      - windows
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
    role: cli
    artifact: odfe-cli
    version: cli-1.1.0
  -
    role: performance-monitor
    artifact: perftop
    version: odfe-1.13.0
  -
    role: ingest
    artifact: data-prepper
    version: data-prepper-1.1.0
---