---
role: ingest
artifact_id: logstash-oss-with-opensearch-output-plugin
version: 8.6.1
platform: docker
architecture: arm64
slug: logstash-oss-with-opensearch-output-plugin-8.6.1-docker-arm64
category: logstash-oss-with-opensearch-output-plugin
type: docker
inline_instructions:
- label: "Docker Hub"
  code: docker pull opensearchproject/logstash-oss-with-opensearch-output-plugin:8.6.1
  link:
  label: View on Docker Hub
  url: https://hub.docker.com/r/opensearchproject/logstash-oss-with-opensearch-output-plugin/tags?page=1&ordering=last_updated&name=8.6.1
- label: "Amazon ECR"
  code: docker pull public.ecr.aws/opensearchproject/logstash-oss-with-opensearch-output-plugin:8.6.1
  link:
  label: View on Amazon ECR
  url: https://gallery.ecr.aws/opensearchproject/logstash-oss-with-opensearch-output-plugin
---