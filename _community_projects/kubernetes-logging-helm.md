---
name: Kubernetes Logging stack using Opensearch
description: This helm chart deploys a scalable containerized logging stack with the main purpose of enabling log observability for kubernetes applications featuring in-cluster managed Opensearch. Deployment may take various configurations depending on the desired use cases. From a single node setup usable for local development up to a scaled multi nodes opensearch deployments suitable for production environments. In the scaled setup multiple componets are deployed like Opensearch node types(coordination, data and master), kafka broker(s) and fluentd(s), where each of those can be both horizontally and vertically scaled depending on the load and replication demands.
owner: Niki Dokovski
owner_link: https://github.com/nickytd
link: https://github.com/nickytd/kubernetes-logging-helm
license: Apache License 2.0
license_link: https://www.apache.org/licenses/LICENSE-2.0
---
