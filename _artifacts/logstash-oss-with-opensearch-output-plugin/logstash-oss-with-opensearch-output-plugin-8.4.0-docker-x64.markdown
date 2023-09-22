---
role: ingest
artifact_id: logstash-oss-with-opensearch-output-plugin
version: 8.4.0
platform: docker
architecture: x64
slug: logstash-oss-with-opensearch-output-plugin-8.4.0-docker-x64
category: logstash-oss-with-opensearch-output-plugin
type: docker
inline_instructions:
- label: "Docker Hub"
  code: docker pull opensearchproject/logstash-oss-with-opensearch-output-plugin:8.4.0
  link:
    label: View on Docker Hub
    url: https://hub.docker.com/r/opensearchproject/logstash-oss-with-opensearch-output-plugin/tags?page=1&ordering=last_updated&name=8.4.0
- label: "Amazon ECR"
  code: docker pull public.ecr.aws/opensearchproject/logstash-oss-with-opensearch-output-plugin:8.4.0
  link:
    label: View on Amazon ECR
    url: https://gallery.ecr.aws/opensearchproject/logstash-oss-with-opensearch-output-plugin
---