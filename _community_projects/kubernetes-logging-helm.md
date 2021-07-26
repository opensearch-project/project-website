---
name: Kubernetes Logging stack using Opensearch
description: This helm chart deploys a scalable containerized logging stack with the main purpose of enabling log observability for kubernetes applications featuring in-cluster managed Opensearch. Depending on the desired use cases, the deployment may take various configurations. From a single node setup usable for a local development up to scaled multi nodes opensearch deployments suitable for production environments. Multiple componets are deployed in the scaled setup. Among those are different Opensearch nodes (coordination, data and master types), kafka broker(s) and fluentd(s), where each of those can be both horizontally and vertically scaled depending on the load and replication demands.
owner: Niki Dokovski
owner_link: https://github.com/nickytd
link: https://github.com/nickytd/kubernetes-logging-helm
license: Apache License 2.0
license_link: https://www.apache.org/licenses/LICENSE-2.0
---
