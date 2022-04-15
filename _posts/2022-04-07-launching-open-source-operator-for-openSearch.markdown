---
layout: post
title: "Introducing open source Kubernetes Operator for OpenSearch"
authors:
  - Opster
date: 2022-04-07
categories:
  - technical-post
twittercard:
  description: "The Kubernetes OpenSearch Operator is used for automating the deployment, provisioning, management, and orchestration of OpenSearch clusters and OpenSearch dashboards."
---


### Overview

Since the launch of OpenSearch project, a fully open source k8s Operator has been a [popular request](https://discuss.opendistrocommunity.dev/t/kubernetes-operator-support-for-the-fork/5267)  with the community. We are happy to announce the [beta release](https://github.com/Opster/opensearch-k8s-operator/releases/tag/v0.9) for the OpenSearch Operator.

The [OpenSearch Operator](https://github.com/Opster/opensearch-k8s-operator) is fully open-source kubernetes operator, licensed as Apache 2.0, and is used for automating the deployment, provisioning, management, and orchestration of OpenSearch clusters and OpenSearch dashboards.

The Operator development is being led by [Opster](https://opster.com/) with partners including [SUSE Rancher](https://www.suse.com/), [Maibornwolff](https://www.maibornwolff.de/en), [AWS](https://aws.amazon.com/), [Logz.io](https://logz.io/) and more.

### Operator Capabilities

The Operator enables high-level API use for easily running advanced OpenSearch operations on Kubernetes.

With this beta release, the Operator allows for management of multiple OpenSearch clusters and OpenSearch Dashboards. Using Operator makes scaling up and down, version upgrades, rolling restarts, adjustment of memory and disk resources on the nodes, securing deployments and managing certificates simplified and streamlined.

In the future releases, it would also allow for advanced shard allocation strategies, monitoring with Prometheus and Grafana, control shard balancing and allocation (For example based on AZ/Rack awareness, Hot/Warm) and auto-scaling based on usage load and resources.

### Getting Started
The Operator is available at https://github.com/Opster/opensearch-k8s-operator.

#### Step 1: Installation
In order to install the Operator you can use 2 methods:
    1. Helm chart and the other is to build it locally.
    2. Local installation

###### Helm chart installation
- Download the helm gz file from https://github.com/Opster/opensearch-k8s-operator/releases/download/v0.9/opensearchOperator-chart.tar.gz
- Follow these instructions: https://github.com/Opster/opensearch-k8s-operator#installing-the-operator-on-your-k8s-cluster-with-helm

###### Local installation
- Clone the repo
- Run `make build manifests` to build the controller binary and the manifests
- Start a kubernetes cluster (e.g. with k3d or minikube) and make sure your `~/.kube/config` points to it
- Run `make install` to create the CRD in the kubernetes cluster

There is no special recommandation on which method to use, both of them will install the OpenSearch operator deployment and CRD on your kubernetes cluster. If you would like to explore the source code and play with it you can use method #2.

#### Step 2: Deploying a new OpenSearch cluster

Go to `opensearch-operator` and use `opensearch-cluster.yaml` as a starting point to define your cluster - note that the `clusterName` is also the namespace that the new cluster will reside in. Then run:

```bash
kubectl apply -f opensearch-cluster.yaml
```
The current installation deploys with the default demo certificate provided by OpenSearch which are good for demo purposes but not safe for production use. We recommend replacing the demo certificates with a trusted CA provided certificates for any production use.

#### Step 3: Deleting an OpenSearch cluster
In order to delete the cluster, please delete your OpenSearch cluster resource; this will delete the cluster namespace and all its resources.
```bash
kubectl get opensearchclusters --all-namespaces
kubectl delete opensearchclusters my-cluster -n <namespace>
```

### Moving Forward

The joint team is hard at work continuing to further develop the Operator and add even more powerful capabilities. In the meantime, we welcome anyone who would like to [test the Operator](https://github.com/Opster/opensearch-k8s-operator/blob/main/README.md#getting-started) and contribute [feedback](https://github.com/Opster/opensearch-k8s-operator/issues/new), or contribute to the [development](https://github.com/Opster/opensearch-k8s-operator/blob/main/docs/designs/dev-plan.md) of the Operator. If there are more features you'd like to see or contribute, please feel free to create an [issue](https://github.com/Opster/opensearch-k8s-operator/issues/new).

### About Opster
[Opster's](https://opster.com/) products and services optimize the performance of Elasticsearch and OpenSearch deployments, improve stability and reduce hardware costs.
