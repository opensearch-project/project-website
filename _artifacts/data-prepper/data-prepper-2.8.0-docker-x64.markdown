---
role: ingest
artifact_id: data-prepper
version: data-prepper-2.8.0
platform: docker
type: docker
architecture: x64
slug: data-prepper-2.8.0-docker-x64
category: opensearch
inline_instructions:
  - label: "Docker Hub"
    code: docker pull opensearchproject/data-prepper:2.8.0
    link:
      label: View on Docker Hub
      url: https://hub.docker.com/r/opensearchproject/data-prepper/tags?page=1&ordering=last_updated&name=2.8.0
  - label: "Amazon ECR"
    code: docker pull public.ecr.aws/opensearchproject/data-prepper:2.8.0
    link:
      label: View on Amazon ECR
      url: https://gallery.ecr.aws/opensearchproject/data-prepper
---