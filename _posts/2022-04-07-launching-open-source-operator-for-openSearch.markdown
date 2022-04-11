---
layout: post
title: "Introducing Kubernetes Open-Source Operator for OpenSearch"
authors:
  - Opster
date: 2022-04-07
categories:
  - technical-post
twittercard:
  description: "The Kubernetes OpenSearch Operator is used for automating the deployment, provisioning, management, and orchestration of OpenSearch clusters."
---


Launching Open-Source Operator for OpenSearch 
----------------------------------------------

### With powerful capabilities for orchestration & management of OpenSearch clusters. The Operator is led by Opster with partners including AWS, SUSE Rancher, Maibornwolff, Logz.io and more.

Overview
--------

The [OpenSearch Operator](https://github.com/Opster/opensearch-k8s-operator) is fully open-source, licensed as Apache 2.0, and is used for automating the deployment, provisioning, management, and orchestration of OpenSearch clusters and OpenSearch dashboards.

The Operator development is being led by [Opster](https://opster.com/) with partners including [SUSE Rancher](https://www.suse.com/), [Maibornwolff](https://www.maibornwolff.de/en), [AWS](https://aws.amazon.com/), [Logz.io](https://logz.io/) and more.

Operator Capabilities
---------------------

The Operator enables high-level API use, for easily running advanced OpenSearch operations on Kubernetes. With the Operator, scaling up and down, version upgrades, rolling restarts, securing deployments and managing certificates is simplified and streamlined.

The Operator allows for management of multiple OpenSearch clusters and OpenSearch Dashboards. The Operator simplifies operation by providing node draining, adjustment of memory and disk resources on the nodes, advanced shard allocation strategies and auto-scaling based on usage load and resources.

Getting Started
---------------

### Repository location
https://github.com/Opster/opensearch-k8s-operator


### Installing the Operator
In order to install the Operator you can use 2 methods:
	1. Helm chart and the other is to build it locally.
	2. Local installation

Helm chart installation
----------------------
- Download the helm gz file from https://github.com/Opster/opensearch-k8s-operator/releases/download/v0.9/opensearchOperator-chart.tar.gz
- Follow these instructions: https://github.com/Opster/opensearch-k8s-operator#installing-the-operator-on-your-k8s-cluster-with-helm

Local installation
------------------
- Clone the repo
- Run `make build manifests` to build the controller binary and the manifests
- Start a kubernetes cluster (e.g. with k3d or minikube) and make sure your `~/.kube/config` points to it
- Run `make install` to create the CRD in the kubernetes cluster

### Deploying a new OpenSearch cluster
Go to `opensearch-operator` and use `opensearch-cluster.yaml` as a starting point to define your cluster - note that the `clusterName` is also the namespace that the new cluster will reside in. Then run:
```bash
kubectl apply -f opensearch-cluster.yaml
```
Note: the current installation deploys with the default demo certificate provided by OpenSearch.
### Deleting an OpenSearch cluster
In order to delete the cluster, please delete your OpenSearch cluster resource; this will delete the cluster namespace and all its resources.
```bash
kubectl get opensearchclusters --all-namespaces
kubectl delete opensearchclusters my-cluster -n <namespace>
```

## Moving Forward

The joint team is hard at work continuing to further develop the Operator and add even more powerful capabilities. 
If you want to test the Operator and contribute feedback, or contribute to the development of the Operator, check out the github repo [here](https://github.com/Opster/opensearch-k8s-operator).
If you have any questions or need help, reach out to the team at operator@opster.com.

## About Opster
[Opster's](https://opster.com/) products and services optimize the performance of Elasticsearch and OpenSearch deployments, improve stability and reduce hardware costs. 
