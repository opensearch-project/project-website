---
role: ui
artifact_id: opensearch-dashboards
version: 2.13.0
platform: docker
architecture: arm64
slug: opensearch-dashboards-2.13.0-docker-arm64
category: opensearch-dashboards
type: docker
inline_instructions:
- label: "Docker Hub"
  code: docker pull opensearchproject/opensearch-dashboards:2.13.0
  link:
    label: View on Docker Hub
    url: https://hub.docker.com/r/opensearchproject/opensearch-dashboards/tags?page=1&ordering=last_updated&name=2.13.0
- label: "Amazon ECR"
  code: docker pull public.ecr.aws/opensearchproject/opensearch-dashboards:2.13.0
  link:
    label: View on Amazon ECR
    url: https://gallery.ecr.aws/opensearchproject/opensearch-dashboards
---