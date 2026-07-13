---
layout: post
title: "Connect OpenSearch to private ML endpoints"
authors:
    - nathhjo
date: 2026-06-08
categories:
  - technical-posts
meta_keywords: private endpoints, ML connectors, ML Commons, private IP, VPC connectivity, Amazon OpenSearch Service, self-managed OpenSearch, secure ML inference, private ML models, VPC egress
meta_description: Step-by-step guide to connect OpenSearch to ML models on private infrastructure. Covers Amazon OpenSearch Service and self-managed deployments with VPC configuration and troubleshooting.
---

As organizations bring machine learning into production, many choose to host models on private infrastructure, whether for security, regulatory compliance, or cost efficiency. Fine-tuned language models, custom embedding services, and specialized inference endpoints often run within virtual private clouds (VPCs) or behind corporate firewalls, unreachable from the public internet.

OpenSearch’s ML Commons plugin supports connections to private endpoints, letting you integrate with internal ML infrastructure without exposing services publicly. With this feature, you can:

* Connect to models hosted on private IP addresses within your network
* Access VPC-hosted services such as private SageMaker endpoints, internal API gateways, or self-hosted inference servers
* Maintain strict network isolation required by your security posture
* Reduce latency and data transfer costs by keeping traffic off the public internet

This guide describes how to configure private endpoint connectivity for both self-managed OpenSearch and Amazon OpenSearch Service, with common troubleshooting scenarios included.

## Prerequisites

* OpenSearch or Amazon OpenSearch Service 2.15+
* A private ML inference endpoint (for example, a private SageMaker endpoint or self-hosted model server)
* For Amazon OpenSearch Service: a VPC-configured domain with VPC egress enabled
* Appropriate AWS Identity and Access Management (IAM) permissions for cluster settings

## Getting started with Amazon OpenSearch Service

Amazon OpenSearch Service requires additional configuration for VPC egress connectivity.

### Step 1: Enable VPC egress

Enable VPC egress on your domain by following the [VPC egress documentation](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/vpc-egress.html#vpc-egress-enable).

### Step 2: Enable the ML private IP setting

To enable private IP connectivity on your Amazon OpenSearch Service domain, submit a support ticket to have the `plugins.ml_commons.connector.private_ip_enabled` setting applied to your domain. This setting is service-managed to enforce network security controls.

### Step 3: Configure trusted endpoints

OpenSearch validates connector URLs against a trusted endpoints allowlist. Configure regex patterns that match the private endpoints you intend to connect to:

```json
PUT /_cluster/settings
{
    "persistent": {
        "plugins.ml_commons.trusted_connector_endpoints_regex": [
        "^https://internal-ml-api\\.company\\.com/.*$",
        "^https://10\\.0\\..*"
        ]
    }
}
```

Security best practice: Use the most specific regex patterns possible. Avoid overly broad patterns like `^https://.*$` which would permit connections to any endpoint. Scope patterns to known hostnames or CIDR ranges.

### Step 4: Create a connector

Create a connector pointing to your private endpoint:

```json
POST /_plugins/_ml/connectors/_create
{
    "name": "Internal ML Model",
    "description": "Private inference endpoint",
    "version": "1.0",
    "protocol": "http",
    "parameters": {
        "endpoint": "https://internal-ml-api.company.com"
    },
    "credential": {
        "roleArn": "arn:aws:iam::<account_id>:role/<role_name>"
    },
    "actions": [
        {
        "action_type": "predict",
        "method": "POST",
        "url": "${parameters.endpoint}/v1/predict",
        "headers": {
            "Content-Type": "application/json"
        },
        "request_body": "{ \"input\": \"${parameters.input}\" }"
        }
    ]
}
```

### Step 5: Register and deploy the model

Register the model:

```json
POST /_plugins/_ml/models/_register
{
    "name": "my_private_model",
    "function_name": "remote",
    "description": "Model with private IP",
    "connector_id": "connector123"
}
```

Deploy the model:

```json
POST /_plugins/_ml/models/model123/_deploy
```

### Step 6: Test model inference

Test the model by sending a predict request:

```json
POST /_plugins/_ml/models/model123/_predict
{
    "parameters": {
        "input": "What is machine learning?"
    }
}
```

## Getting started with self-managed OpenSearch

For self-managed OpenSearch, you enable private IP connectivity directly via cluster settings - no VPC egress configuration or support ticket is needed. Set `plugins.ml_commons.connector.private_ip_enabled` to `true` along with your trusted endpoint patterns.

### Step 1: Enable the ML private IP setting and configure trusted endpoints

```json
PUT /_cluster/settings
{
    "persistent": {
        "plugins.ml_commons.connector.private_ip_enabled": true,
        "plugins.ml_commons.trusted_connector_endpoints_regex": [
        "^https://internal-ml-api\\.company\\.com/.*$",
        "^https://10\\.0\\..*"
        ]
    }
}
```

### Step 2: Create a connector and deploy the model

Follow the same steps as Amazon OpenSearch Service ([Steps 4–6](#step-4-create-a-connector) above).

## Troubleshooting

### Issue 1: "Remote Inference host name has private ip address"

**Symptom:** This error persists even after enabling `private_ip_enabled` and configuring trusted endpoints.

**Cause:** The model was not redeployed after the setting change. ML Commons reads settings at model deployment time.

**Solution:** Undeploy and redeploy the model:

```json
# Undeploy the model
POST /_plugins/_ml/models/model123/_undeploy

# Redeploy the model
POST /_plugins/_ml/models/model123/_deploy
```

### Issue 2: Connection timeout to private endpoint

**Cause:** Network rules (security groups, NACLs, or route tables) are blocking traffic between the OpenSearch cluster and the target endpoint.

**Solution:** Verify that outbound traffic from your OpenSearch nodes is allowed to the endpoint’s IP and port, and that the endpoint allows inbound traffic from the cluster’s subnet or security group.

### Issue 3: Connector creation succeeds but predict returns "endpoint not matched"

**Cause:** The URL configured in the connector doesn’t match any pattern `trusted_connector_endpoints_regex`.

**Solution:** Ensure your regex matches the full URL including path and scheme. For example, `^https://10\\.0\\..*` matches `https://10.0.1.5/v1/predict` but not `http://10.0.1.5/v1/predict` (note `https` vs `http`).

## Conclusion

Connecting OpenSearch to private ML endpoints enables secure, low-latency inference while keeping your models within your network perimeter. When configuring private endpoint connectivity, remember the following:

* **Enable private IP** at the cluster level.
* **Use specific trusted endpoint regex patterns** to restrict access to known endpoints only.
* **Configure VPC egress** on Amazon OpenSearch Service for network reachability.
* **Always redeploy models** after changing connector or cluster settings.

## Additional resources

For more information, see the following resources:

* [Amazon OpenSearch Service VPC egress](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/vpc-egress.html)
* [ML Commons connectors (self-managed OpenSearch)](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/connectors/)
* [ML Commons connectors (Amazon OpenSearch Service)](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/ml-create.html)
