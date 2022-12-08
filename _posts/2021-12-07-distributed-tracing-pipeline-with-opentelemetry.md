---
layout: post
title:  "Building a distributed tracing pipeline with OpenTelemetry Collector, Data Prepper, and OpenSearch Trace Analytics"
authors: 
  - kuberkaul
date: 2021-12-07 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "Over the past few years, the importance of observability when developing and managing applications has spiked with the spotlight firmly on micro-services, service mesh. Distributed services can be unpredictable. Despite our best efforts, failures and performance bottlenecks in such systems are inevitable and difficult to isolate. In such an environment, having deep visibility into the behavior of your applications is critical for software development teams and operators."
redirect_from: "/blog/technical-post/2021/12/distributed-tracing-pipeline-with-opentelemetry/"
---

Over the past few years, the importance of observability when developing and managing applications has spiked with the spotlight firmly on micro-services, service mesh. Distributed services can be unpredictable. Despite our best efforts, failures and performance bottlenecks in such systems are inevitable and difficult to isolate. In such an environment, having deep visibility into the behavior of your applications is critical for software development teams and operators.

The landscape for observability tools continues to grow as we speak. This growth is particularly large for metrics, error logging, and distributed traces. These can provide valuable information to optimize service performance and troubleshoot issues to make a service more reliable. With this in mind, it makes sense to create a distributed tracing pipeline to ingest, process, and visualize tracing data with query/alerting.

At [Dow Jones](https://www.dowjones.com/), we started on a similar journey as we continue to move our applications and microservices to our service mesh based on [EKS](https://docs.aws.amazon.com/whitepapers/latest/overview-deployment-options/amazon-elastic-kubernetes-service.html) and [Istio](https://istio.io/). Our requirements formulated from the generated service mesh telemetry data was to have a distributed tracing pipeline that could scale to the amount of our traces, work for applications regardless of host, and the language of implementation. OpenTelemetry's full support for traces, metrics, and logs, as well as, provide a single implementation married perfectly into this idea.

OpenTelemetry (OTEL) is formed by the merging of OpenTracing and OpenCensus. It is a CNCF incubating project and the second most active in terms of contributions. OTEL, since its inception, aimed to offer a single set of APIs and libraries that standardize how you collect and transfer telemetry data.

[Tracing was the first component to reach stable status for the OpenTelemetry project](https://opentelemetry.io/status/). Since then, almost all trace components but collector has reached stable maturity level, metrics are well on their way, and initial work on logs has also started. At Dow Jones, we launched a distributed tracing pipeline based on the OpenTelemetry project. I will be going over a few of the design decisions we implemented in our setup and source code to DIY.

## Tracing Pipeline Components

With OpenTelemetry as the core of our pipeline, we still needed to decide on the sink for our traces, tools to visualize and query traces, and tools to export traces in order to create a Federated architecture. After much deliberation, we decided on the following components:

- **OpenTelemetry** for creation, propagation, collection, processing, and exporting of trace data.

- **OpenSearch** as the sink for the traces

OpenSearch is a community-driven, open source search and analytics suite derived from Apache 2.0 licensed Elasticsearch 7.10.2 & Kibana 7.10.2. Additionally, it comes with managed Trace Analytics plugin, a visualization and user interface, and OpenSearch Dashboards.

- **Data Prepper** and **Jaeger** to re-format OpenTelemetry trace data and export it to OpenSearch in formats that both the OpenSearch dashboard and Jaeger understand. This should go away soon as both Jaeger and OpenSearch Dashboards will natively be able to use OpenTelemetry Protocol (OLTP) traces.

[Jaeger](https://www.jaegertracing.io/) tracks and measures requests and transactions by analyzing end-to-end data from service call chains, making it easier to understand latency issues in microservice architectures. It's exclusively meant for distributed tracing with a simple web UI to query traces and spans across services. Jaeger enables views of individual traces in a waterfall-style graph of all the related trace and span executions, service invocations for each trace, time spent in each service and each span, and the payload content of each span, including errors.

Data Prepper is a new component of OpenSearch that receives trace data from the OpenTelemetry collector, aggregates, transforms, and normalizes it for analysis and visualization in OpenSearch Dashboards.

- **Trace Analytics Plugin** for OpenSearch to visualize and query traces

The Trace Analytics plugin also aggregates trace data into Trace Group views and Service Map views, to enable monitoring insights of application performance on trace data. By going beyond the ability to search and analyze individual traces, these features enable developers to proactively identify application performance issues, not just react to problems when they occur.

## Architecture

Once we got the components for the pipeline penciled, the remaining work to get them to play nice with each other and scale to our requirement. Since then, the tracing pipeline has been launched in production and processes 4-6 TB of traces daily. In a nutshell, the flow is as follows:

**&#8594;** Applications use OpenTelemetry libraries/API to instrument traces and send it to open telemetry agents.

**&#8594;** OpenTelemetry agents process/batches and send traces from microservices to the openTelemetry gateway collector.

**&#8594;** The collector processes/samples the traces and export them to backends which in our case are Data Prepper and Jaeger collector. These backends transform and export the data to OpenSearch.

**&#8594;** Trace Analytics plugin for OpenSearch Dashboards and Jaeger visualizes trace data from OpenSearch and allows querying on it.

![tracing_step4](/assets/media/blog-images/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/tracing_step4.png){: .img-fluid}

Let's break it down further by the flow of traces through the distributed tracing pipeline ...

## Breakdown

### Step 1 : Creating and Propagating traces

#### Creating traces

We need to create/propagate traces to be able to use a distributed tracing pipeline. OpenTelemetry provides a collection of tools such as API, SDK and integrates with popular languages and frameworks to integrate with the greater OpenTelemetry ecosystem, such as OTLP and the OpenTelemetry collector.

OpenTelemetry provides a [status page](https://opentelemetry.io/status/) to keep track of its multiple tools as they go stable. Additionally, it provides documentation on how to create distributed traces for your service both [manually or with auto instrumentation](https://opentelemetry.io/docs/concepts/instrumenting/)

The documentation should get you started with creating standard OTEL traces for your service.

#### Propagating traces

Once we have traces created for services, context propagation is required to convert these traces to distributed traces. Context propagation facilitates the movement of context between services and processes. Context is injected into a request and extracted by a receiving service. It is then used to parent new spans. That service may then make additional requests and inject context to be sent to other services...and so on.

There are several protocols for context propagation that OpenTelemetry recognizes.

- [W3C Trace-Context HTTP Propagator](https://w3c.github.io/trace-context/)
- [W3C Correlation-Context HTTP Propagator](https://w3c.github.io/correlation-context/)
- [B3 Zipkin HTTP Propagator](https://github.com/openzipkin/b3-propagation)

This works well for our service mesh PaaS as Istio leverages Envoy’s distributed tracing feature to provide tracing integration out of the box. Specifically, Istio provides options to install various tracing backends and configure proxies to send trace spans to them automatically. It requires an application to propagate the [B3 Zipkin HTTP Propagator](https://github.com/openzipkin/b3-propagation) headers so that when the proxies send span information, the spans can be correlated correctly into a single trace. It natively works with OpenTelemetry as well, since this is a supported context propagation protocol in OpenTelemetry.

### Data Collection

Once we have the tracing data created and propagated through services, the OpenTelemetry project facilitates the collection of telemetry data via the [Open Telemetry collector](https://opentelemetry.io/docs/collector/). The OpenTelemetry collector offers a vendor-agnostic implementation on how to receive, process, and export telemetry data. It removes the need to run, operate, and maintain multiple agents/collectors in order to support open-source observability data formats exporting to one or more backends. In addition, the collector gives end-users control of their data. The collector is the default location where instrumentation libraries export their telemetry data to.

OpenTelemetry binary can be deployed in two primary deployment methods. For production workloads, it is recommended to go with a mix of both methods.

The two primary deployment methods:

- **Agent**: A collector instance running with the application or on the same host as the application (e.g. binary, sidecar, or daemonset).
- **Gateway**: One or more collector instances running as a standalone service (e.g. container or deployment) typically per cluster, data center or region.

We will be deploying a mix of both the agent and the gateway in our setup.

### Step 2 : OpenTelemetry Agents

We will be deploying OpenTelemetry agents as daemonset to receive, process, and export trace from every EKS worker node. The Agent is capable of receiving telemetry data (push and pull based) as well as enhancing telemetry data with metadata such as custom tags or infrastructure information. In addition, the agent can offload responsibilities that client instrumentation would otherwise need to handle including batching, retry, encryption, compression, and more.

The agent can be deployed either as a daemonset or as a sidecar in a Kubernetes (k8s) cluster. This step may be skipped (not recommended), if you are creating this pipeline in a test environment and would rather send traces straight to the open telemetry collector, which is deployed as a Kubernetes deployment (horizontally scalable).

![tracing_step1](/assets/media/blog-images/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/tracing_step1.png){: .img-fluid}

{% 
  include code_expand.html 
  code_path="/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/k8s-manifest-for-otel-agent.yml"
  language="yaml"
  message= "__*Click to expand : K8s Manifest for OpenTelemetry Agent*__"
%}

### Step 3 : OpenTelemetry Gateway

The OpenTelemetry agent forwards the telemetry data to an OpenTelemetry collector gateway. A Gateway cluster runs as a standalone service and offers advanced capabilities over the agent, including tail-based sampling. In addition, a Gateway cluster can limit the number of egress points required to send data, as well as consolidate API token management. Each collector instance in a Gateway cluster operates independently, so it can be scaled with a simple load balancer. We will deploy gateway as a Kubernetes [deployment type](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/).

K8s deployments are highly elastic and can be automatically scaled up and down via Horizontal Pod Autoscale depending on the amount of traces flowing through the pipeline.

![tracing_step2](/assets/media/blog-images/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/tracing_step2.png){: .img-fluid}


The agent-gateway architecture also allows us to use [Tail Sampling Processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/tailsamplingprocessor/README.md) with more availability in this setup. Tail Sampling Processor enables us to make more intelligent choices when it comes to sampling traces. This is especially true for latency measurements, which can only be measured after they are complete. Since the collector sits at the end of the pipeline and has a complete picture of the distributed trace, sampling determinations are made in opentelemetry collector to sample based on isolated, independent portions of the trace data.

Today, this processor only works with a single instance of the collector. The workaround is to utilize [Trace ID aware load balancing](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/exporter/loadbalancingexporter/README.md) to support multiple collector instances and avoid a single point of failure. This load balancer exporter is added to the agent configuration. It is responsible for consistently exporting spans and logs belonging to a trace to the same backend gateway collector for tail based sampling.

### Filtering traces for tail based sampling

We will use a combination of filters to sample the traces. The filters for tail sampling are positive selections only, so if a trace is caught by any of the filter, it will be sampled; Alternatively, if no filter catches a trace, then it will not be sampled. The filters for tail based sampling can be chained together to get the desired effect:

- **latency**: Sample based on the duration of the trace. The duration is determined by looking at the earliest start time and latest end time, without taking into consideration what happened in between.
- **probabilistic**: Sample a percentage of traces.
- **status_code**: Sample based upon the status code (`OK`, `ERROR` or `UNSET`)
- **rate_limiting**: Sample based on rate of spans per trace per second
- **string_attribute**: Sample based on string attributes value matches, both exact and regex value matches are supported

Since there is no blocklist for filters, we will be using a workaround to sample all but cherrypick services that we do not want sampled. we will be using the `string_attribute` filter to create a negative filter. The filter will be dropping specific service traces that we do not want sampled and sample all other traces. This can be done using the following:

**&#8594;** In the agent config, add a span attribute for all traces with a key/value pair (e.g - retain_span/false) using attribute processor.

**&#8594;** In the agent config, add another attribute processor now to override that value to false for cherrypicked services that we don't want to be sampled.

**&#8594;** In the gateway config, use the string attribute filter on tail based sampling with the `key: retain_span` and `value: true`. All traces without `retain_span: true` attribute will not be sampled.

{% 
  include code_expand.html 
  code_path="/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/k8s-manifest-for-otel-collector.yaml"
  language="yaml"
  message= "__*Click to expand : K8s Manifest for OpenTelemetry collector*__"
%}

### Formatting and Exporting Traces

We now have distributed traces created, context propagated, and sampled using tail based sampling. We need to format the trace data in a way that our query engine can analyze it. At Dow Jones, we have some teams that use Jaeger and others use OpenSearch Dashboards to query and visualize this data. With OpenTelemetry, we can push the data to multiple backends from the same collector. At present, there is one caveat, both [Trace Analytics OpenSearch Dashboards plugin](https://opensearch.org/docs/monitoring-plugins/trace/ta-dashboards/) and [Jaeger](https://www.jaegertracing.io/) need OpenTelemetry data transformed to be able to visualize it mandating the need for last mile server-side components:

- **Jaeger collector**

[Jaeger is actively working toward the future Jaeger backend components to be based on OpenTelemetry collector](https://www.jaegertracing.io/docs/1.21/opentelemetry/). This integration will make all OpenTelemetry collector features available in the Jaeger backend components. Till this is experimental, Jaeger collector is required to transform the traces before shipping to OpenSearch so that Jaeger UI (query component) is able to consume and visualize the trace data. Jaeger collector is deployed as a deployment with a horizontal pod autoscaler.

{% 
  include code_expand.html 
  code_path="/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/helm-chart-for-jaeger-collector.yml"
  language="yaml"
  message= "__*Click to expand : Helm Chart for Jaeger collector*__"
%}


- **Data Prepper**

Similar to Jaeger, to vizualize distributed traces through Trace Analytics in OpenSearch, we need to transform these traces for OpenSearch. [Data Prepper](https://github.com/opensearch-project/data-prepper) is a key component in providing Trace Analytics feature in OpenSearch. Data Prepper is a data ingestion component of the OpenSearch project. It is a last mile server-side component that collects telemetry data from AWS Distro OpenTelemetry collector or OpenTelemetry collector. It then transforms it before storing and indexing in OpenSearch.

To pre-process documents, Data Prepper allows you to configure a pipeline that specifies a source, buffers, a series of processors, and sinks. Once you have configured a data pipeline, Data Prepper takes care of managing source, sink, buffer properties, and maintains state across all instances of Data Prepper on which the pipelines are configured. A single instance of Data Prepper can have one or more pipelines configured. A pipeline definition requires at least a source and sink attribute to be configured, and will use the default buffer and no processor if they are not configured. Data Prepper can be deployed as a deployment with a horizontal pod autoscaler.

{% 
  include code_expand.html 
  code_path="/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/k8s-manifest-for-data-prepper.yml"
  language="yaml"
  message= "__*Click to expand : K8s Manifest for Data Prepper*__"
%}


### Sink : OpenSearch

As you may have noticed in the architecture, we utilize OpenSearch to ship to and store traces. [OpenSearch](https://opensearch.org/) makes an excellent choice for storing and searching trace data, along with other observability data due to its fast search capabilities and horizontal scalability.

![tracing_step3](/assets/media/blog-images/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/tracing_step3.png){: .img-fluid}

Jaeger collector and Data Prepper can be configured to ship traces to the same OpenSearch cluster. Both deployments create their indexes with a mutually exclusive prefix for name. OpenSearch can be configured with index patterns to create seperate views:
- Jaeger : `jaeger-span*`
- Trace Analytics : `otel-v1-apm-span*`

Trace analytics and Jaeger UI (Query component) are configured to analyze their indexes based on prefix and do not collide with each other. This allows for a single OpenSearch service with multiple data formats existing side by side.

### Step 4 : Visualization

Once you reach this point, the difficult part is over. You should have distributed traces created, context propagated, and sampled using tail based sampling, transformed, and exported to OpenSearch under different index patterns.

Now is the part where you actually get to use the pipeline and visualize these traces to run queries, build dashboards, setup alerting. While Trace Analytics OpenSearch Dashboards plugin is a managed plugin that comes with OpenSearch, we host our own [Jaeger Frontend/UI](https://www.jaegertracing.io/docs/1.28/frontend-ui/) with a simple Jaeger UI to query for distributed traces with Traces View
and Traces Detail View. We deploy Jaeger Query as a deployment within the EKS cluster. Jaeger Query can be deployed as a deployment with a horizontal pod autoscaler.

![tracing_step4](/assets/media/blog-images/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/tracing_step4.png){: .img-fluid}

- **Jaeger UI (Query)**

To visualize your traces with Jaeger we need to run a Jaeger Query. Jaeger-Query serves the API endpoints and a React/Javascript UI. The service is stateless and is typically run behind a load balancer:

{% 
  include code_expand.html 
  code_path="/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/helm-chart-for-jaeger-query.yml"
  language="yaml"
  message= "__*Click to expand : Helm Chart for Jaeger Query*__"
%}


- **Trace Analytics feature in OpenSearch/OpenSearch Dashboards**

Trace Analytics for Opensearch Dashboards can be leveraged without having to re-instrument applications. Once you have traces flowing through your pipeline, you should see indexes being created in OpenSearch under the `otel-v1\*` index prefix. As this is created, trace analytics plugin within OpenSearch Dashboards should now have visualization for your traces, inclusive of service map, error/throughput graphs, and waterfall trace view for your services.

![opensearch](/assets/media/blog-images/2021-12-02-distributed-tracing-pipeline-with-opentelemetry/opensearch.png){: .img-fluid}

## Testing

We now have the distributed tracing pipeline. It is time to start an application that generates traces and exports them to agents. Depending on your application code and whether you want to do manual or automatic instrumentation, the [Open Telementry Instrumentation Docs](https://opentelemetry.io/docs/) should get you started.

In this setup, OTEL agents are running as daemonset. We will be exporting traces from the service to the agent on the same host(worker-node). To get the host IP, we can set the HOST_IP environment variable via the [Kubernetes downwards API](https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/#capabilities-of-the-downward-api). It can be referenced in our instrumentation as the destination address.

Make sure you are injecting the `HOST_IP` environment variable in your application manifest:

```
env:
  - name: HOST_IP
    valueFrom:
      fieldRef:
          fieldPath: status.hostIP
```

To setup the pipeline, you can apply the Kubernetes manifest files and helm chart(for Jaeger). Besides being in the body of this blog, the manifests have been added to [opensearch-blog github repo](https://github.com/dowjones/opensearch-blog/tree/master/source) for convenient access.

## Next Steps

We built a scalable distributed tracing pipeline based on the OpenTelemetry project running in an EKS cluster. One of the driving forces behind our move to OpenTelemetry is to consolidate to a single binary to ingest, process, and export, not just traces but metrics and logs as well (telemetry data). Telemetry data can be exported to multiple backends by creating [pipelines](https://github.com/open-telemetry/opentelemetry-collector/blob/main/docs/design.md#pipelines) for pushing to observability platform of choice.

Data Prepper 1.2 (December 2021) release is going to provide users the ability to send logs from Fluent Bit to OpenSearch and use Grok to enhance the logs. Logs can then be correlated to traces coming from the OTEL collectors to further enhance deep diving into your service problems using OpenSearch Dashboards. This should elevate the experience of deep diving into your service with a unified view and give a really powerful feature into the hands of developers and operators.

So the next step would naturally be to extend this pipeline to be more than just a distributed tracing pipeline and morph to a distributed telemetry pipeline!

_Comments, questions, corrections? Just let me know on [Twitter](https://twitter.com/kub3rkaul), via email kuber.kaul@dowjones.com, or submit a github issue_

Thanks to [EP team](https://github.com/orgs/newscorp-ghfb/teams/dj-ep/members), [Chris Nelligan](https://github.com/nelliganc).

Architecture images created using [cloudcraft.io](https://www.cloudcraft.co/)
