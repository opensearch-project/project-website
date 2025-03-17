---
role: daemon
artifact_id: opensearch
version: 3.0.0-alpha1
platform: docker
architecture: arm64
slug: opensearch-3.0.0-alpha1-docker-arm64
category: opensearch
type: docker
inline_instructions:
- label: "Docker Hub"
  code: docker pull opensearchproject/opensearch:3.0.0-alpha1
  link:
    label: View on Docker Hub
    url: https://hub.docker.com/r/opensearchproject/opensearch/tags?page=1&ordering=last_updated&name=3.0.0-alpha1
- label: "Amazon ECR"
  code: docker pull public.ecr.aws/opensearchproject/opensearch:3.0.0-alpha1
  link:
    label: View on Amazon ECR
    url: https://gallery.ecr.aws/opensearchproject/opensearch
---