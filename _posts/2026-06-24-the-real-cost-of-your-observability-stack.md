---
layout: post
title: "The real cost of your observability stack"
authors:
    - pshenoy
    - jdbright
date: 2026-06-24
categories:
  - technical-posts
meta_keywords: observability cost, open source observability, AI agent observability, observability vendor lock-in, unified observability platform, reasoning traces, OpenSearch observability, telemetry at scale, observability data tax, agent traces, MCP apps, agent evaluation, PPL query language
meta_description: The real cost of observability is operational blindness, not the invoice. This post describes the fragmentation tax, the per-GB trap for agentic workloads, and what building on an open-source search foundation changes.
---

Modern infrastructure is not just infrastructure anymore. It is the intelligence running on that infrastructure. Observability has evolved from "dashboards for on-call engineers" to the data foundation powering autonomous investigation. AI agents now triage incidents, correlate signals, and propose root causes. Engineers query their observability data from Claude Desktop and VS Code, not just from a console. And the stack that worked for deterministic microservices has not adapted.

The cost of that gap is not just the invoice. It is operational blindness at the worst possible time: when an agent hallucinates in production, when a reasoning chain fails silently, when every investigation costs more tokens than the last because your data is not structured for the way agents consume it.

This post analyzes the true cost of fragmented observability for agentic workloads and presents an open-source alternative that eliminates per-GB penalties, tool sprawl, and correlation gaps.

## The fragmentation tax

A scenario that occurs in nearly every platform engineering team: it is 2 AM, an alert fires, and the on-call engineer opens the laptop. The engineer checks the metrics dashboard in one tool. CPU looks fine, but latency is spiking. The engineer pivots to the logging system to search for errors. Different query language, different time range defaults, different authentication. The engineer finds a suspicious error, but needs the trace to understand the call path. That is in a third system. By the time the engineer has correlated the signal across all three tools, forty-five minutes have passed, and the actual fix takes three lines of code.

This problem is compounded when agents are involved. When an investigation agent tries to determine root cause, it makes the same journey: query the metrics store, query the log store, query the trace store. Each query costs tokens. Each context switch costs latency. Each tool boundary loses correlation context. An investigation that should take 2--3 tool calls takes 15, and the token bill reflects the excess.

Most teams run three to five observability tools. Each one made sense when it was adopted. But over time, the collection becomes a cost to both humans and agents: correlation time, context-switching time, the cognitive overhead of translating between query languages, and maintaining the integration code that connects them. And now: the token cost of agents that have to navigate that same fragmentation programmatically, without the institutional knowledge of which tool to check first.

These hidden costs compound every quarter: duplicate data ingestion (the same event in two systems because each tool needs its own format), engineering time maintaining integration pipelines, and the onboarding cost when new engineers need to learn four query languages before investigating their first incident.

## The per-GB data tax does not scale for agentic workloads

Proprietary observability vendors built their pricing on a simple model: charge per gigabyte ingested. For years, this worked. A stable fleet of microservices generates roughly stable telemetry volumes. You can forecast your bill.

Then agents entered production, and that pricing model stopped working.

Consider what a single AI agent produces in telemetry compared to a traditional API endpoint. A REST service handling a request generates a trace span, a few log lines, and some metric increments. An AI agent handling a comparable task generates reasoning traces documenting every step of its logic, token consumption logs tracking input and output across multiple model calls, confidence scores at each decision point, tool invocation records, and retrieval-augmented generation lookups. The telemetry volume is significantly higher, and it increases with every additional agent deployed.

This creates a perverse incentive. The workloads that need the most observability are exactly the ones that cost the most to observe. Teams respond rationally: they sample aggressively, drop agent traces after 24 hours, truncate reasoning chains to save bytes, and shorten retention from months to days. Every one of these decisions trades the ability to debug future failures for present-day budget compliance.

Teams lose visibility precisely when they need it most.

There is also the tool sprawl problem for AI workloads. Organizations running agents need to store and query embeddings alongside their operational telemetry, because understanding why an agent retrieved a particular document requires viewing the embedding that matched, the similarity score it produced, and the operational context for that retrieval. But their observability vendor was not built for vector data. So embeddings are stored in a separate database, disconnected from the traces and metrics that provide their operational context. This adds another tool, another bill, and another correlation gap.

## What you cannot see is costing you more than what you pay

Observability costs exist in three layers, but most teams only measure the first.

The first layer is direct costs: licensing fees, per-GB ingestion charges, per-host agent fees, user seat limits. These are manageable because they are visible.

The second layer is indirect costs: the engineering time that is never billed to "observability" but exists because of it. The SRE spending a day each week maintaining integrations between five observability backends. The data engineering team building a correlation pipeline that breaks every time a vendor changes their API. The agent framework team writing custom adapters so their investigation agents can query three different systems with three different authentication models.

The third layer is token and investigation costs: the new line item that did not exist two years ago. When your investigation agents need 15 tool calls to correlate signals that a unified system could resolve in 3, the difference is wasted tokens at frontier model pricing. When there is no precomputed context (baselines, dependency maps, and error clusters), every investigation starts from raw data. When agents cannot get structured answers efficiently, the cost of agentic investigation scales linearly with complexity instead of being bounded by the structure of your data.

Consider the following scenario: an AI agent generates a confident but incorrect answer. A customer acts on it. Something fails. The root cause is in the reasoning trace. If you cannot afford to store the trace, you cannot debug the failure. And you certainly cannot assure your customers or your compliance team that it will not happen again.

## What an open-source search foundation changes

The alternative to fragmentation is not forced consolidation into a proprietary vendor. It is building on an open-source search engine in which you own the data, the schema, and the experience built on it. The [OpenSearch Observability Stack](https://github.com/opensearch-project/observability-stack) implements this approach, as shown in the following image.

![Observability Stack architecture: all signals flow through a single pipeline into one correlation engine](/assets/media/blog-images/2026-06-24-the-real-cost-of-your-observability-stack/architecture.png){:class="img-centered"}

The Observability Stack addresses fragmentation with the following capabilities:

- **A search engine built specifically for observability data**: Logs, traces, and agent telemetry are semi-structured, free-text, high-cardinality data. They need full-text search across billions of events, flexible schema handling, and fast correlation across signal types. This is what search engines are designed for. OpenSearch stores logs, traces, and agent telemetry as first-class data, queryable using either Piped Processing Language (PPL)---a pipe-based language familiar to anyone who has used pipe syntax in other log analytics tools---or SQL, with built in full-text search and anomaly detection.

- **Native Prometheus integration for metrics**: Not everything needs to be in one store. OpenSearch queries Amazon Managed Prometheus using native PromQL, keeping metrics in a time-series store while correlating them with logs and traces in a single interface. No data duplication. Each backend handles the signal type it was optimized for.

- **Agent trace observability as a first-class signal**: AI agent behavior is observable using OpenTelemetry GenAI semantic conventions. Reasoning traces, tool invocations, token consumption, and confidence scores are stored with the same fidelity as application logs and queryable with the same tools. When an agent makes a wrong decision, you trace its decision chain the same way you would trace a failed request through microservices.

- **Native vector storage alongside operational telemetry**: Embeddings are stored alongside the traces and logs that provide their operational context. You can trace a vector similarity search from the query that triggered it, through the retrieval results it produced, to the agent decision it caused. OpenSearch k-NN vector search is built into the same engine, not added as a separate system.

- **Anomaly detection without manual configuration**: ML-powered anomaly detection identifies issues proactively. Log pattern clustering discovers anomalies without regular expressions. These capabilities run on the same data in the same engine, identifying problems before static thresholds would catch them.

- **PPL: a query language for operational analytics**: Pipe-based syntax is natural for engineers coming from other log analytics tools. Filter, aggregate, transform, and correlate across signal types in a single language. Combined with SQL support, teams can choose the query interface that fits their workflow. Natural language to PPL translation means that engineers can describe what they want in natural language instead of learning query syntax.

- **You control the cost model**: With open source, there is no per-GB ingestion tax, no per-host fees, no user seat limits imposed by a vendor. You run OpenSearch on your own infrastructure and pay for the compute and storage that you provision. When your AI workloads generate more telemetry next quarter, you scale your infrastructure proportionally, not your licensing bill exponentially. You can afford to store the agent reasoning traces that you will need when something fails.

- **Apache 2.0 licensing**: Full sovereignty over your telemetry data. No vendor processing your logs in their infrastructure. No licensing cliffs. No copyleft restrictions that complicate enterprise legal review. No legal ambiguity about data access or ownership. The same engine scales from your first hundred gigabytes to your first petabyte. You can run it on AWS, on other clouds, or on premises. You can migrate it if you change providers.

## Observing the agents

Traditional observability answers "what happened?" Agent observability answers "why did the agent decide to do this?" and "how well did it do?"

When an AI agent takes an action in production, you need to understand the reasoning that led to that action. You need to know why the agent made this choice over all the alternatives considered and rejected. The signals that answer this question are fundamentally different from traditional telemetry:

- **Reasoning traces** capture the step-by-step logic chain: what context did the agent have, what did it retrieve, how did it weigh alternatives, and what led to the final decision. These are the equivalent of a stack trace, but for cognition rather than execution.

- **Token economics** provide real-time cost visibility: cost per inference, cost per agent action, cumulative budget consumption rate. When an agent workflow costs $0.50 per invocation and runs a hundred thousand times daily, you need visibility into whether that spending is generating value.

- **Confidence scoring** distinguishes between an agent reasoning from grounded, verified knowledge and one extrapolating from scarce evidence. The difference between a reliable automation and a confident but incorrect response.

- **Decision quality correlation** connects what the agent decided to what actually happened as a result. Did the recommendation convert? Did the triage route correctly? This feedback loop separates teams confidently scaling their AI investments from teams operating without verification.

OpenSearch stores all of these signals using [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/). They are queryable with PPL and SQL, correlated with infrastructure logs and traces, and retained as long as you need them without per-GB penalties.

The following image shows the **Agent Traces** overview in OpenSearch Dashboards, in which each row represents a span with its status, latency, and token counts.

![Agent Traces in OpenSearch Dashboards showing spans with kind, name, status, latency, token counts, and input/output columns](/assets/media/blog-images/2026-06-24-the-real-cost-of-your-observability-stack/traces-overview.png){:class="img-centered"}

Selecting a trace opens the detail view, as shown in the following image. In this view, a multi-agent request is decomposed into individual spans for each step (agent invocation, LLM chat, and tool execution).

![Trace detail showing a multi-agent request decomposed into invoke_agent, LLM chat, and tool execution spans with metadata and raw span data](/assets/media/blog-images/2026-06-24-the-real-cost-of-your-observability-stack/trace-detail.png){:class="img-centered"}

Beyond storing these signals, OpenSearch provides the following additional capabilities for agent observability:

- **Agent evaluations complete the feedback cycle**: Online and offline evaluation capabilities answer "how well is this agent performing over time?" by tracking accuracy, drift, and quality metrics against the same traces. This is not a separate evaluation platform; it is built into the same engine that stores the agent telemetry, so evaluation results correlate directly with the operational data that explains them.

- **Model Context Protocol (MCP) apps integrate investigation into your IDE**: OpenSearch observability is available as open-source MCP apps for Claude Desktop, VS Code, and compatible agentic IDEs. Each investigation query returns a text summary for agent reasoning plus interactive visualizations for human review, directly in the conversation thread. Agents and humans investigate together without switching between consoles: log search, metrics correlation, trace exploration, service maps, and topology views all take place in the tool you are already working in.

As agents become production systems, they need to be observed like production systems, using the same tools and the same data store.

## Sovereignty and compliance are not optional

GDPR, SOC 2, HIPAA, FedRAMP require knowing exactly where your data resides, who processes it, and how long it is retained. When you use a proprietary observability vendor, your telemetry transits through infrastructure that you do not control, governed by terms you did not write.

For regulated industries, open source observability is not a preference. It is a compliance architecture. Full data residency control means your agent reasoning traces, your customer interaction logs, and your security telemetry never leave infrastructure you operate. You define the retention policies. You control access at every layer. OpenSearch's built-in [security capabilities](https://docs.opensearch.org/latest/security/) cover encryption at rest and in transit, fine-grained access control, and audit logging: the controls that compliance frameworks actually require you to demonstrate.

As AI workloads grow and agent reasoning traces contain increasingly sensitive decision logic (why a loan was approved, why a patient was triaged, why a security alert was dismissed), the sovereignty question only intensifies. The telemetry itself becomes sensitive data, subject to the same protections as the systems it describes. Open source means you can prove compliance because you own the entire stack, not because a vendor handed you a report about their environment.

## The path forward

The real cost of your observability stack is not the invoice. It is the fragmentation that slows every incident response. The token waste when agents cannot get structured answers efficiently. The blind spots that hide agent failures until customers report them. The architectural debt that compounds every time you add another point solution.

The shift is toward investing in a foundation that you own. In this model:

- Adding AI workloads does not trigger a budget crisis.
- Logs, traces, agent telemetry, and vector data are stored in one searchable engine.
- You query from whatever tool you prefer.
- No vendor controls your data, your schema, or your roadmap.

Observability should scale with your systems, including the intelligent ones, not against your budget. And you should not have to give up ownership to achieve it.

## Getting started with OpenSearch observability

To explore the OpenSearch Observability Stack, use the following resources:

- Install the [OpenSearch MCP server](https://opensearch.org/docs/latest/automating-configurations/mcp-servers/) and [OpenSearch Agent Skills](https://github.com/opensearch-project/opensearch-agent-skills) to perform investigations from Claude Desktop or VS Code.
- [Explore the OpenSearch observability documentation](https://observability.opensearch.org).
- [Try PPL for log analytics](https://opensearch.org/docs/latest/search-plugins/sql/ppl/index/) in your environment.
- [Instrument with OpenTelemetry](https://observability.opensearch.org/docs/getting-started/) and send traces to OpenSearch.
- Connect with the community on [Slack](https://opensearch.org/slack.html) and join the [Observability TAG](https://opensearch.org/blog/announcing-opensearch-observability-tag-shaping-open-source-observability-together/) to contribute to the roadmap.

_OpenSearch is an open-source, community-driven project licensed under Apache 2.0._
