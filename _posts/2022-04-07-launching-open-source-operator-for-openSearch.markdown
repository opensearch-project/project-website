---
layout: post
title: "Introducing open-source Kubernetes Operator for OpenSearch"
authors:
  - shahar
date: 2022-04-07
categories:
  - technical-post
twittercard:
  description: "The Kubernetes OpenSearch Operator is used for automating the deployment, provisioning, management, and orchestration of OpenSearch clusters and OpenSearch dashboards."

excerpt: "The Operator enables high-level API use, for easily running advanced OpenSearch operations on Kubernetes."
redirect_from: "/blog/technical-post/2022/04/launching-open-source-operator-for-openSearch/"

---


### Overview

Since the launch of the OpenSearch project, a fully open-source K8s Operator has been a [popular request](https://discuss.opendistrocommunity.dev/t/kubernetes-operator-support-for-the-fork/5267)  with the community. We are happy to announce the [release](https://github.com/Opster/opensearch-k8s-operator/releases/tag/v0.9) for the OpenSearch Operator.

The [OpenSearch Operator](https://github.com/Opster/opensearch-k8s-operator) is a fully open-source Kubernetes Operator, licensed as Apache 2.0, and is used for automating the deployment, provisioning, management, and orchestration of OpenSearch clusters and OpenSearch dashboards.

The Operator development is being led by [Opster](https://opster.com/) with partners including [SUSE Rancher](https://www.suse.com/), [Maibornwolff](https://www.maibornwolff.de/en), [AWS](https://aws.amazon.com/), [Logz.io](https://logz.io/), and more.

### Operator Capabilities

The Operator enables high-level API use for easily running advanced OpenSearch operations on Kubernetes.

With this release, the Operator allows for management of multiple OpenSearch clusters and OpenSearch dashboards. Using the Operator makes scaling up and down, version upgrades, rolling restarts, adjustment of memory and disk resources on the nodes, securing deployments, and managing certificates simplified and streamlined.

In the future releases, it would also allow for advanced shard allocation strategies, monitoring with Prometheus and Grafana, control of shard balancing and allocation (For example, based on AZ/rack awareness, hot/warm) and auto scaling based on usage load and resources.

### Getting Started
The Operator is available [here](https://github.com/Opster/opensearch-k8s-operator).

#### Step 1: Installation
In order to install the Operator, you can use two methods:
1. Helm chart installation.
2. Local installation

#### Helm chart installation
Artifact Hub is a web-based application that enables finding, installing, and publishing packages and configurations for CNCF projects, including publicly available distributed charts Helm charts.
The deployment process is very simple with Artifact Hub, you can follow these [instructions](https://github.com/Opster/opensearch-k8s-operator#getting-started)
to pull and install the OpenSearch Operator under opensearch-operator-system namespace.

#### Local installation
- Clone the repo.
- Run `make build manifests` to build the controller binary and the manifests.
- Start a Kubernetes cluster (e.g, with k3d or minikube) and make sure your `~/.kube/config` points to it.
- Run `make install` to create the CustomResourceDefinition (CRD) in the Kubernetes cluster.

There is no special recommendation on which method to use; both of them will install the OpenSearch Operator deployment and CRD on your kubernetes cluster. If you would like to explore the source code, you can use method #2.

#### Step 2: Deploying a new OpenSearch cluster

Go to `opensearch-operator` and use `opensearch-cluster.yaml` as a starting point to define your cluster.
Note that the `clusterName` is also the namespace that the new cluster will reside in. Then run:

```bash
kubectl apply -f opensearch-cluster.yaml
```
The current installation deploys with the default demo certificate provided by OpenSearch, which is ideal for demo purposes but not safe for production use. We recommend replacing the demo certificates with trusted certificate authority (CA)-provided certificates for any production use.

#### Step 3: Deleting an OpenSearch cluster
In order to delete the cluster, please delete your OpenSearch cluster resource; this will delete the cluster namespace and all its resources.
```bash
kubectl get opensearchclusters --all-namespaces
kubectl delete opensearchclusters my-cluster -n <namespace>
```

### Moving Forward

The joint team is hard at work further developing the Operator and adding even more powerful capabilities. In the meantime, please feel free to [test the Operator](https://github.com/Opster/opensearch-k8s-operator/blob/main/README.md#getting-started), contribute [feedback](https://github.com/Opster/opensearch-k8s-operator/issues/new), or contribute to the [development](https://github.com/Opster/opensearch-k8s-operator/blob/main/docs/designs/dev-plan.md) of the Operator. If there are more features you'd like to see or contribute, please feel free to create an [issue](https://github.com/Opster/opensearch-k8s-operator/issues/new).

### About Opster
[Opster's](https://opster.com/) products and services optimize the performance of Elasticsearch and OpenSearch deployments, improve stability, and reduce hardware costs.
