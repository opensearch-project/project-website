---
role: ingest
artifact_id: data-prepper
version: data-prepper-2.10.2
platform: docker
type: docker
architecture: x64
slug: data-prepper-2.10.2-docker-x64
category: opensearch
inline_instructions:
  - label: "Docker Hub"
    code: docker pull opensearchproject/data-prepper:2.10.2
    link:
      label: View on Docker Hub
      url: https://hub.docker.com/r/opensearchproject/data-prepper/tags?page=1&ordering=last_updated&name=2.10.2
  - label: "Amazon ECR"
    code: docker pull public.ecr.aws/opensearchproject/data-prepper:2.10.2
    link:
      label: View on Amazon ECR
      url: https://gallery.ecr.aws/opensearchproject/data-prepper
---

