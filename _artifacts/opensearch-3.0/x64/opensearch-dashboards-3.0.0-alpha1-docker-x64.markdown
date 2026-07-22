---
role: ui
artifact_id: opensearch-dashboards
version: 3.0.0-alpha1
platform: docker
architecture: x64
slug: opensearch-dashboards-3.0.0-alpha1-docker-x64
category: opensearch-dashboards
type: docker
inline_instructions:
- label: "Docker Hub"
  code: docker pull opensearchproject/opensearch-dashboards:3.0.0-alpha1
  link:
    label: View on Docker Hub
    url: https://hub.docker.com/r/opensearchproject/opensearch-dashboards/tags?page=1&ordering=last_updated&name=3.0.0-alpha1
- label: "Amazon ECR"
  code: docker pull public.ecr.aws/opensearchproject/opensearch-dashboards:3.0.0-alpha1
  link:
    label: View on Amazon ECR
    url: https://gallery.ecr.aws/opensearchproject/opensearch-dashboards
---