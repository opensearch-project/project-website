---
layout: post
title: "Scaling Kubernetes Workloads with the New OpenSearch KEDA Scaler"
authors:
  - kschnitter
date: 2026-08-05
categories:
  - technical-post
meta_keywords: KEDA, Kubernetes autoscaling, OpenSearch scaler, observability, logs, traces, event-driven autoscaling
meta_description: Learn how to use the new OpenSearch scaler for KEDA to autoscale Kubernetes workloads based on observability data such as logs and traces stored in OpenSearch.
excerpt: KEDA extends Kubernetes with event-driven autoscaling, allowing workloads to scale based on arbitrary events outside the Kubernetes control plane. With the new OpenSearch scaler, contributed by SAP, you can now drive that scaling from logs and traces stored in OpenSearch — no separate metrics pipeline required. This post walks through what KEDA is, when an OpenSearch-driven scaler makes sense, and how to configure it using OpenSearch search templates.
---

Kubernetes has built-in support for scaling workloads based on CPU and memory usage. But real-world scaling decisions are often driven by signals that live elsewhere — in your logs, your traces, or the state of a queue. [KEDA](https://keda.sh) fills that gap by letting you scale any Kubernetes workload based on arbitrary events outside the Kubernetes control plane. With the OpenSearch scaler — contributed by SAP and introduced in KEDA 2.20 — you can now use data already stored in OpenSearch as the scaling signal.

## What is KEDA?

KEDA is a CNCF project that extends Kubernetes with event-driven, automatic scaling of workloads. It works alongside the standard Kubernetes Horizontal Pod Autoscaler (HPA) rather than replacing it. While the HPA scales workloads based on resource metrics, KEDA can query an external source — a message queue, a database, an HTTP endpoint, or OpenSearch — extract a value, and use that to drive the replica count up or down, including all the way to zero. You can find the full list of supported sources and configuration options in the [KEDA documentation](https://keda.sh/docs/).

## Why scale from OpenSearch?

OpenSearch is widely used as the storage backend for observability data: logs collected using OpenTelemetry or Fluent Bit, and distributed traces from instrumented applications. That data is rich with signals that reflect the actual health and load of your services. Rather than building a separate metrics pipeline to expose those signals to Kubernetes, the OpenSearch scaler lets you query them directly.

Readers familiar with [OpenSearch alerting](https://opensearch.org/docs/latest/observing-your-data/alerting/index/) will recognize the pattern: a query runs on a schedule, a threshold is evaluated, and an action is triggered. The KEDA scaler follows the same logic, with the difference that the action is a Kubernetes scaling decision, integrated natively with the cluster rather than delivered as a notification. The two features complement each other — alerting for human-facing notifications, KEDA for automated infrastructure response.

Two scenarios illustrate this well.

### Scaling on 429 response rate

When an application starts returning HTTP 429 (Too Many Requests) responses, it is telling you explicitly that it is overloaded. If your access logs are stored in OpenSearch, you can count those 429 responses over a rolling time window and use that count as a scaling signal. As the rate rises, KEDA scales up additional replicas; as it falls back to zero, the workload scales down again. The feedback loop is tight and the signal is unambiguous.

### Scaling on p95 request latency

Throughput metrics alone can miss situations where a service is slow rather than saturated. If your distributed traces are stored in OpenSearch, you can compute the 95th percentile of request durations over a recent window using an OpenSearch percentile aggregation. When p95 crosses a threshold — say, 500 ms — KEDA scales up the workload. OpenSearch does the aggregation math server-side; KEDA simply reads the resulting number. This pattern shows why the combination is powerful: you get the full expressiveness of the OpenSearch query language as your scaling logic.

## A brief introduction to OpenSearch search templates

Rather than embedding a raw query JSON blob in your KEDA configuration, OpenSearch lets you store and parameterize queries as [search templates](https://opensearch.org/docs/latest/search-plugins/search-template/). A search template is a stored script with named parameters that are substituted at query time. The p95 latency query is a natural fit because the time window is a parameter you will want to vary. For example:

```json
PUT _scripts/request-latency-p95
{
  "script": {
    "lang": "mustache",
    "source": {
      "size": 0,
      "query": {
        "bool": {
          "filter": [
            { "term":  { "span.kind": "SPAN_KIND_SERVER" } },
            { "range": { "endTime": { "gte": "now-{{lookback}}", "lte": "now" } } }
          ]
        }
      },
      "aggs": {
        "latency_p95": {
          "percentiles": {
            "field": "durationInNanos",
            "percents": [95]
          }
        }
      }
    }
  }
}
```

You can then invoke this template by name and pass `lookback` as a parameter:

```json
GET otel-v1-apm-span*/_search/template
{
  "id": "request-latency-p95",
  "params": {
    "lookback": "5m"
  }
}
```

OpenSearch substitutes `{{lookback}}` with `5m` and returns the aggregation result:

```json
{
  "aggregations": {
    "latency_p95": {
      "values": {
        "95.0": 46892376.34360143
      }
    }
  }
}
```

The value at `aggregations.latency_p95.values.95.0` — ~46.9 ms in this example — is what KEDA will read and compare against the target threshold. This keeps your KEDA manifest readable and makes the query independently testable before wiring it into the scaler.

## Configuring the OpenSearch KEDA scaler

Before applying the examples below, KEDA must be installed in your Kubernetes cluster and your OpenSearch instance must be reachable from within it. The [KEDA deployment documentation](https://keda.sh/docs/2.20/deploy/) covers installation using Helm or plain YAML manifests.

The scaler is configured as a trigger inside a `ScaledObject`. The essential parameters are:

| Parameter | Description |
| :--- | :--- |
| `addresses` | Comma-separated list of OpenSearch host:port addresses |
| `index` | The index (or semicolon-separated list of indexes) to query |
| `searchTemplateName` | Name of a stored search template (mutually exclusive with `query`) |
| `parameters` | Semicolon-separated `key:value` pairs passed to the search template |
| `valueLocation` | [GJSON](https://github.com/tidwall/gjson) path expression pointing to the metric value in the response |
| `targetValue` | The threshold at which KEDA begins scaling |
| `activationTargetValue` | The threshold at which KEDA wakes the workload from zero replicas (default: 0) |

### Example: Scaling on 429 response rate

For the 429 case a direct query is more natural than a search template, since there are no parameters to vary. Start by creating a Kubernetes Secret with your OpenSearch credentials. Rather than referencing the password directly in the scaling configuration, KEDA uses a `TriggerAuthentication` resource to keep credentials separate:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: opensearch-credentials
type: Opaque
stringData:
  password: <your-password>
---
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: opensearch-auth
spec:
  secretTargetRef:
    - parameter: password
      name: opensearch-credentials
      key: password
```

Then create the `ScaledObject` with the query embedded directly in the trigger:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: my-deployment-scaler
spec:
  scaleTargetRef:
    name: my-deployment
  minReplicaCount: 1
  maxReplicaCount: 10
  triggers:
    - type: opensearch
      metadata:
        addresses: "https://opensearch.example.com:9200"
        index: "logs-otel-v1*"
        query: |
          {
            "size": 0,
            "query": {
              "bool": {
                "filter": [
                  { "term":  { "attributes.http.response.status_code": 429 } },
                  { "range": { "@timestamp": { "gte": "now-5m" } } }
                ]
              }
            }
          }
        valueLocation: "hits.total.value"
        targetValue: "10"
        activationTargetValue: "1"
        username: "admin"
      authenticationRef:
        name: opensearch-auth
```

Here `valueLocation` points to `hits.total.value`, the document count returned by the query. Setting `size` to `0` avoids fetching the actual documents since only the total count is needed. KEDA scales up the workload as soon as more than 10 such responses appear within the last five minutes.

When choosing the time window, account for ingestion delay: if logs or traces take two minutes to reach OpenSearch after being emitted, a one-minute window will consistently return zero results. A window of five to ten minutes is a safer starting point for most pipelines, at the cost of slightly slower reaction to sudden spikes.

### Example: Scaling on p95 latency

First, store the `request-latency-p95` search template in OpenSearch. Then create the `ScaledObject`, referencing the same `TriggerAuthentication` defined above:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: my-deployment-scaler
spec:
  scaleTargetRef:
    name: my-deployment
  minReplicaCount: 1
  maxReplicaCount: 10
  triggers:
    - type: opensearch
      metadata:
        addresses: "https://opensearch.example.com:9200"
        index: "otel-v1-apm-span*"
        searchTemplateName: "request-latency-p95"
        parameters: "lookback:5m"
        valueLocation: "aggregations.latency_p95.values.95\\.0"
        targetValue: "500000000"
        username: "admin"
      authenticationRef:
        name: opensearch-auth
```

The `valueLocation` field uses GJSON path syntax to navigate the OpenSearch response JSON and extract the p95 value. KEDA compares this value against `targetValue` — 500,000,000 nanoseconds, or 500 ms — and adjusts the replica count proportionally.

## Scoping the query to a specific workload

The examples above query all spans in an index. In a real cluster, multiple services write traces to the same index, so you need to scope the query to the workload being scaled. The [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/resource/k8s/) define standard Kubernetes resource attributes for this purpose. The two most useful for scoping are:

- `k8s.deployment.name` — the name of the Kubernetes Deployment
- `k8s.namespace.name` — the namespace it runs in

These attributes are not available inside a container by default — they must be added by the instrumentation, either through a Kubernetes-aware collector like the OpenTelemetry Collector or Fluent Bit, or by configuring the OTel SDK to attach them explicitly. You can add them as template parameters so the same search template is reusable across services:

```json
PUT _scripts/request-latency-p95-by-deployment
{
  "script": {
    "lang": "mustache",
    "source": {
      "size": 0,
      "query": {
        "bool": {
          "filter": [
            { "term": { "span.kind": "SPAN_KIND_SERVER" } },
            { "term": { "resource.attributes.k8s.deployment.name": "{{deployment}}" } },
            { "term": { "resource.attributes.k8s.namespace.name": "{{namespace}}" } },
            { "range": { "endTime": { "gte": "now-{{lookback}}", "lte": "now" } } }
          ]
        }
      },
      "aggs": {
        "latency_p95": {
          "percentiles": {
            "field": "durationInNanos",
            "percents": [95]
          }
        }
      }
    }
  }
}
```

The `ScaledObject` then passes the deployment's own name as the parameter value:

```yaml
parameters: "lookback:5m;deployment:my-service;namespace:my-namespace"
```

Because the deployment name is known at the time you write the `ScaledObject`, each scaled workload gets its own `ScaledObject` with parameters pointing back to itself — the template itself stays shared.

The same principle applies to log-based queries such as the 429 example. Log records typically carry a `service.name` attribute or a Kubernetes resource attribute that identifies the emitting workload, which can be used as an additional `term` filter to scope the count to a specific deployment.

## Next steps

The OpenSearch scaler is available in KEDA 2.20 and later. The full parameter reference and additional authentication examples — including mutual TLS — are in the [KEDA OpenSearch scaler documentation](https://keda.sh/docs/2.20/scalers/opensearch/).

If you are already storing logs or traces in OpenSearch, you now have a direct path from that observability data to your Kubernetes scaling decisions — without an additional metrics pipeline.
