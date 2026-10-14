---
layout: post
title: "Debug the agent: AI agent traces with the OpenSearch Agent Traces plugin"
category: blog
tags: [observability, ai-observability, agent-traces, genai-sdk, opensearch]
authors:
    - pshenoy
    - reddyvam
date: 2026-06-24
categories:
  - technical-posts
meta_keywords: agent traces, AI observability, OpenSearch, OpenTelemetry, GenAI SDK, multi-agent, trace tree, tool failure, root cause analysis, LLM debugging
meta_description: Use the OpenSearch Agent Traces plugin to trace a multi-agent travel planner, find a failed tool call in the trace tree, and measure how many requests a subagent failure affected using PPL.
---

Multi-agent systems can return partial results without reporting the reason. For example, a travel planner might return trip recommendations that contain no weather data, while the response itself gives no indication of which subagent failed, which tool it called, or how many other requests were affected. Diagnosing an incomplete result requires examining the individual steps that produced it, such as model calls and subagent invocations. Agent traces record these steps together with their status, duration, token usage, and error details, so you can identify the step that failed and the number of requests it affected. In this post, we'll trace a failing multi-agent orchestration end-to-end using the Agent Traces plugin in OpenSearch Dashboards, examine the exact tool execution error, and measure how many requests it affected with a Piped Processing Language (PPL) aggregation query.

## Configuring the demo

This example uses the [Observability Stack](https://github.com/opensearch-project/observability-stack) with its built-in multi-agent travel planner. If you haven't configured the stack yet, see [the previous blog post](https://opensearch.org/blog/single-pane-of-glass-for-all-your-telemetry-the-opensearch-observability-stack/) for installation instructions. The travel planner runs by default, alongside OpenSearch, Data Prepper, OpenTelemetry Collector, Prometheus, and OpenSearch Dashboards, because the `.env` file at the install root enables the example services with `INCLUDE_COMPOSE_EXAMPLES=docker-compose.examples.yml`.

The travel planner is an orchestrator agent that delegates to subagents (`weather-agent` and `events-agent`) and calls tools (flights, currency) through a Model Context Protocol (MCP) server. All services are instrumented with the [OpenSearch GenAI Observability SDK](https://github.com/opensearch-project/genai-observability-sdk-py) using OpenTelemetry GenAI semantic conventions. The agents run as the services `travel-planner`, `weather-agent`, `events-agent`, and `mcp-server`. These service names appear in the Application Map and in the `serviceName` field on every span. A canary service generates continuous traffic with configurable fault injection.

### Triggering the tool failure

To produce a failing trace, include a `tool_error` fault directive for `weather-agent` in the planning request. The directive causes the MCP tool `get_current_weather` to return an HTTP 503 error. The `weather-agent` service propagates a null response, and the orchestrator produces a partial result ("Weather info temporarily unavailable").

Send a planning request that includes the fault directive:

```bash
curl -X POST http://localhost:8003/plan \
  -H "Content-Type: application/json" \
  -d '{"destination": "Tokyo", "origin": "Portland", "fault": {"weather": {"type": "tool_error"}}}'
```

## The multi-agent travel planner

Before examining the failure, start with the service topology. In OpenSearch Dashboards, in the navigation menu, select **Application Map**. The map shows `travel-planner` calling `weather-agent` and `events-agent`, both of which call `mcp-server` for their tools. The `weather-agent` node shows a red segment on its request ring, which marks the requests that returned faults, as shown in the following image.

![Application Map showing the multi-agent travel planner service topology with travel-planner, weather-agent, events-agent, and mcp-server](/assets/media/blog-images/2026-06-24-debug-the-agent-ai-agent-traces-with-the-opensearch-agent-traces-plugin/application-map.png){:class="img-centered"}

The **Application Map** identifies the service with elevated faults, but it doesn't report which step inside the agent logic failed. To identify the failing step, use **Agent Traces**.

## Reviewing the agent trace list

In the navigation menu, select **Agent Traces**. The **Traces** tab lists each root-level agent invocation, one row per `POST /plan` request, with its status, latency, and token count. The metrics bar summarizes the run: total traces, total spans with an error count, total tokens, and P50/P99 latency, as shown in the following image.

![Agent Traces table listing root-level agent invocations with time, status, latency, and token counts, and a metrics bar reporting 10 traces, 171 spans with 12 errors, 26K tokens, and P50/P99 latency](/assets/media/blog-images/2026-06-24-debug-the-agent-ai-agent-traces-with-the-opensearch-agent-traces-plugin/agent-traces-list.png){:class="img-centered"}

Every row reports a **Success** status, even though the metrics bar counts 12 span errors. The orchestrator returns HTTP 200 with a degraded response, so the trace status remains **Success** even when spans deeper in the tree fail. To inspect an individual span, select its trace row. 

## Inspecting the trace tree and finding the failed tool call

As an example, you'll analyze the trace recorded at 11:27:53.190 AM, which has a latency of 1.41 seconds and 2,941 tokens. The trace details summarize the request status, duration, span count, and token usage and provide three views: **Trace Tree**, **Trace Map**, and **Timeline**. The **Trace Tree** view shows the full span hierarchy, so you can read the execution flow directly. The `invoke_agent` spans are labeled with the agent names recorded in the trace (Travel Planner, Weather Assistant, and Events Agent), which differ from the service names shown in the Application Map: the Weather Assistant agent runs in the `weather-agent` service, and the Events Agent runs in `events-agent`. The following abridged tree lists the agent, model, and tool spans and omits the intermediate HTTP spans:

```
POST /plan  (root agent trace, 1.41s, 30 spans, 2,941 tokens)
└── invoke_agent Travel Planner  (1.41s)
    ├── chat planning  (LLM, 130ms, 1,277 tokens)
    ├── invoke_agent weather-agent  (1.01s)  [warning]
    │   └── invoke_agent Weather Assistant  (1.00s, 175 tokens)  [warning]
    │       └── execute_tool get_current_weather  (1.73ms)  <- ERROR
    └── invoke_agent events-agent  (192ms)
        └── invoke_agent Events Agent  (182ms)
            ├── chat events-reasoning  (LLM, 109ms, 658 tokens)
            └── execute_tool fetch_events_api  (72ms)
```

Select `execute_tool get_current_weather` in the trace tree to view its details: an **Error** status, the operation `execute_tool`, a duration of 1.73 milliseconds, and an `exception` event in the raw span, as shown in the following image.

![Trace details with execute_tool get_current_weather selected in the trace tree, showing an Error status and an exception event in the raw span](/assets/media/blog-images/2026-06-24-debug-the-agent-ai-agent-traces-with-the-opensearch-agent-traces-plugin/trace-tool-error.png){:class="img-centered"}

The raw span includes the fields you need for root cause analysis:

- `status.code`: `2` (ERROR), while the root `POST /plan` span remains **Success**.
- **Exception event**: an `exception` entry on the span with `escaped: False` and a stack trace.
- **Operation**: `execute_tool`, span name `get_current_weather`, and a duration of 1.73 milliseconds.
- `serviceName`: `weather-agent`.

The exception event matches the injected fault: the `get_current_weather` tool raised an error after the upstream weather API returned an HTTP 503 error. The orchestrator caught the failure (the root span remains **Success**) and returned a degraded response. The same trace also records the cost of this single tool failure: 1.01 seconds spent on the `weather-agent` branch, 175 tokens consumed by the Weather Assistant agent before it failed, and one user receiving an incomplete plan, none of which is reported at the top level of the trace.

## Measuring the number of affected requests

A single trace identifies which tool call failed but not how many invocations the fault affected. To count the affected invocations across all services, run a PPL query in the Agent Traces query bar:

```sql
source = otel-v1-apm-span-*
| where isnotnull(`attributes.gen_ai.operation.name`)
| where `status.code` = 2
| stats count() as error_count by serviceName, `attributes.gen_ai.operation.name`
```

The two `where` clauses select the spans that have a GenAI operation name and an error status, and `stats count()` counts those spans by service and operation type. The Agent Traces plugin switches to the **Visualization** tab when you run an aggregation query, rendering a bar chart, as shown in the following image.

![Agent Traces Visualization tab showing a bar chart of error counts by service, with events-agent at 1, travel-planner at 5, and weather-agent at 6 split into invoke_agent and execute_tool spans](/assets/media/blog-images/2026-06-24-debug-the-agent-ai-agent-traces-with-the-opensearch-agent-traces-plugin/blast-radius-visualization.png){:class="img-centered"}

The chart accounts for all 12 span errors, split by service and colored by operation type. The `weather-agent` service has 6 errors (4 `invoke_agent` spans and 2 `execute_tool` spans), `travel-planner` has 5 `invoke_agent` spans, and `events-agent` has 1 `invoke_agent` span. The two `execute_tool` errors on `weather-agent` are the MCP tool returning an HTTP 503 error. The `invoke_agent` errors on `weather-agent` and `travel-planner` are those services recording that a call they made failed. One tool fault therefore produces errors at three levels: the tool itself, the agent that called it, and the orchestrator that called that agent.

## Benefits of agent traces

Tracing this single tool failure demonstrates four benefits of agent traces:

- **Trace tree for multi-agent debugging**: Agent Traces shows the full execution graph of a multi-agent request and enables you to select the failing span directly, without scanning logs.
- **GenAI semantic conventions for failure context**: The span name, operation type, and exception event report the tool, the operation, and the error in one place.
- **PPL aggregation for measuring impact**: A `stats` query over error spans reports how many invocations were affected and which services recorded the errors, turning a single-trace finding into a count across all services.
- **Span-level visibility into partial failures**: The orchestrator returned HTTP 200 with degraded content. Without the trace tree, you would know only that the user received incomplete data, not which tool failed or why.

## What's next

We hope you'll try Agent Traces on your own multi-agent applications and share your feedback in the [Observability Stack repository](https://github.com/opensearch-project/observability-stack/issues). The same workflow applies to any agent that emits GenAI spans: read the execution flow in the trace tree, select the failing span, and then aggregate the error spans to measure how widely the fault spread.

For more information about the views used in this post, see the [Agent Traces documentation](https://observability.opensearch.org/docs/ai-observability/agent-tracing/). For a full list of the attributes each span carries, see the [GenAI SDK reference](https://observability.opensearch.org/docs/send-data/ai-agents/).

To apply this workflow to your own agents, start with any of the following steps:

- **Reproduce this investigation**: Install the [Observability Stack](https://github.com/opensearch-project/observability-stack) and inject other fault types through the control panel at `http://localhost:8085`.
- **Explore the Trace Map**: Agent Traces includes a **Trace Map** view that renders the execution as a directed graph with color-coded nodes.
- **Instrument your own agents**: Add the [OpenSearch GenAI Observability SDK](https://github.com/opensearch-project/genai-observability-sdk-py) to your Python agents for automatic span creation with GenAI semantic conventions.
