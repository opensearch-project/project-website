---
layout: post
title: "The real cost of your observability stack"
category: blog
tags: [observability, opensearch, opentelemetry, ai-agents, cost-optimization, prometheus, mcp, agent-evaluation]
authors:
    - pshenoy
    - jdbright
date: 2026-06-24
categories:
  - technical-posts
meta_keywords: observability cost, open source observability, AI agent observability, observability vendor lock-in, unified observability platform, reasoning traces, OpenSearch observability, telemetry at scale, observability data tax, agent traces, MCP apps, agent evaluation, PPL query language
meta_description: The real cost of observability is operational blindness, not the invoice. We break down the fragmentation tax, the per-GB trap for agentic workloads, and what building on an open-source search foundation changes.
---

Modern infrastructure is not just infrastructure anymore. It is the intelligence running on top of it. Observability went from "dashboards for on-call engineers" to the data foundation powering autonomous investigation. AI agents now triage incidents, correlate signals, and propose root causes. Engineers query their observability data from Claude Desktop and VS Code, not just from a console. And the stack that worked for deterministic microservices has not kept up.

The cost of that gap is not just the invoice. It is operational blindness at the worst possible time: when an agent hallucinates in production, when a reasoning chain fails silently, when every investigation costs more tokens than the last because your data is not structured for the way agents consume it.

This post breaks down where that cost actually lives and what changes when you build on an open-source search foundation designed for the agentic world.

## The fragmentation tax

A scene that plays out in nearly every platform engineering team: it is 2 AM, an alert fires, and the on-call engineer opens their laptop. They check the metrics dashboard in one tool. CPU looks fine, but latency is spiking. They pivot to the logging system to search for errors. Different query language, different time range defaults, different authentication. They find a suspicious error, but need the trace to understand the call path. That is in a third system. By the time they have correlated the signal across all three tools, forty-five minutes have passed and the actual fix takes three lines of code.

Now multiply that by agents. When an investigation agent tries to piece together root cause, it makes the same journey: query the metrics store, query the log store, query the trace store. Each query costs tokens. Each context switch costs latency. Each tool boundary loses correlation context. An investigation that should take 2-3 tool calls takes 15, and the token bill reflects it.

Most teams run three to five observability tools. Each one made sense when it was adopted. But over time, the collection becomes a tax on both humans and agents. Correlation time. Context-switching time. The cognitive overhead of translating between query languages and maintaining the glue code that holds it all together. And now: the token cost of agents that have to navigate that same fragmentation programmatically, without the institutional knowledge of which tool to check first.

The hidden line items compound every quarter: duplicate data ingestion (the same event in two systems because each tool needs its own format), engineering time maintaining integration pipelines, and the onboarding cost when new engineers need to learn four query languages before investigating their first incident.

## The per-GB data tax does not scale for agentic workloads

Proprietary observability vendors built their pricing on a simple model: charge per gigabyte ingested. For years, this worked. A stable microservices fleet generates roughly stable telemetry volumes. You can forecast your bill.

Then agents entered the picture, and that pricing model stopped making sense.

Consider what a single AI agent produces in telemetry compared to a traditional API endpoint. A REST service handling a request generates a trace span, a few log lines, and some metric increments. An AI agent handling a comparable task generates reasoning traces documenting every step of its logic, token consumption logs tracking input and output across multiple model calls, confidence scores at each decision point, tool invocation records, and retrieval-augmented generation lookups. The telemetry volume grows significantly, and it grows with every new agent customers deploy.

This creates a perverse incentive. The workloads that need the most observability are exactly the ones that cost the most to observe. Teams respond rationally: they sample aggressively, drop agent traces after 24 hours, truncate reasoning chains to save bytes, and shorten retention from months to days. Every one of these decisions trades the ability to debug future failures for present-day budget compliance.

They are flying blind precisely when the flight gets turbulent.

Then there is the tool sprawl problem for AI workloads. Organizations running agents need to store and query embeddings alongside their operational telemetry, because understanding why an agent retrieved a particular document requires seeing the embedding that matched, the similarity score it produced, and the operational context around that retrieval. But their observability vendor was not built for vector data. So embeddings get exiled to a separate database, disconnected from the traces and metrics that give them meaning. Another tool. Another bill. Another correlation gap.

## What you cannot see is costing you more than what you pay

The total cost of observability lives in three layers, and most teams only measure the first.

The first layer is direct costs: licensing fees, per-GB ingestion charges, per-host agent fees, user seat limits. These feel manageable because they are visible.

The second layer is indirect costs: the engineering time that never gets billed to "observability" but exists because of it. The SRE spending a day each week maintaining integrations between five observability backends. The data engineering team building a correlation pipeline that breaks every time a vendor changes their API. The agent framework team writing custom adapters so their investigation agents can query three different systems with three different authentication models.

The third layer is token and investigation costs: the new line item that did not exist two years ago. When your investigation agents make 15 tool calls to correlate what should take 3, that is wasted tokens at frontier model pricing. When there is no pre-computed context (baselines, dependency maps, error clusters), every investigation starts from raw data. When agents cannot get structured answers efficiently, the cost of agentic investigation scales linearly with complexity instead of being bounded by the structure of your data.

The scenario that keeps platform teams up at night: an AI agent generates a confident but incorrect answer. A customer acts on it. Something goes wrong. The root cause lives in the reasoning trace. If you could not afford to store it, you cannot debug the failure. And you certainly cannot demonstrate to your customers or your compliance team that it will not happen again.

## What an open-source search foundation changes

The alternative to fragmentation is not forced consolidation into a proprietary vendor. It is building on an open-source search engine where you own the data, own the schema, and own the experience on top.

![Observability Stack architecture: all signals flow through a single pipeline into one correlation engine](/assets/media/blog-images/2026-06-24-the-real-cost-of-your-observability-stack/architecture.png){:class="img-centered"}

**A search engine purpose-built for observability data.** Logs, traces, and agent telemetry are semi-structured, free-text, high-cardinality data. They need full-text search across billions of events, flexible schema handling, and fast correlation across signal types. This is what search engines are designed for. OpenSearch stores logs, traces, and agent telemetry as first-class data: queryable with PPL (a pipe-based language familiar to anyone who has used pipe syntax in other log analytics tools) or SQL, with full-text search and anomaly detection built in.

**Native Prometheus integration for metrics.** Not everything needs to live in one store. OpenSearch queries Amazon Managed Prometheus with native PromQL, keeping metrics in a purpose-built time-series store while correlating them with logs and traces in a single interface. No data duplication. Each backend handles the signal type it was optimized for.

**Agent trace observability as a first-class signal.** AI agent behavior is observable using OpenTelemetry GenAI semantic conventions. Reasoning traces, tool invocations, token consumption, and confidence scores are stored with the same fidelity as application logs and queryable with the same tools. When an agent misbehaves, you trace its decision chain the same way you would trace a failed request through microservices.

**Native vector storage alongside operational telemetry.** Embeddings live next to the traces and logs that give them operational context. You can trace a vector similarity search from the query that triggered it through the retrieval results it produced to the agent decision it informed. OpenSearch k-NN vector search is built into the same engine, not bolted on as a separate system.

**Anomaly detection without manual configuration.** ML-powered anomaly detection identifies issues proactively. Log pattern clustering discovers anomalies without regex. These capabilities run on the same data in the same engine, surfacing problems before static thresholds would catch them.

**PPL: a query language for operational analytics.** Pipe-based syntax that is natural for engineers coming from other log analytics tools. Filter, aggregate, transform, and correlate across signal types in a single language. Combined with SQL support, teams can choose the query interface that fits their workflow. Natural language to PPL translation means engineers can describe what they want and get the correct query without learning syntax.

**You control the cost model.** With open source, there is no per-GB ingestion tax, no per-host fees, no user seat limits imposed by a vendor. You run OpenSearch on your own infrastructure and pay for the compute and storage you provision. When your AI workloads generate more telemetry next quarter, you scale your infrastructure proportionally, not your licensing bill exponentially. You can afford to store the agent reasoning traces that will save you when something goes wrong.

**Apache 2.0 licensing.** Full sovereignty over your telemetry data. No vendor processing your logs in their infrastructure. No licensing cliffs. No copyleft restrictions that complicate enterprise legal review. No legal ambiguity about data access or ownership. The same engine carries you from your first hundred gigabytes to your first petabyte. You can run it on AWS, on other clouds, on-prem, or anywhere in between. You can take it with you if you change providers.

## Observing the agents

Traditional observability answers "what happened?" Agent observability answers "why did it decide that?" and "how well did it do?"

When an AI agent takes an action in production, you need to understand the reasoning that led to that action. Not just that it happened, but why this choice over all the alternatives considered and rejected. The signals that answer this question are fundamentally different from traditional telemetry:

**Reasoning traces** capture the step-by-step logic chain: what context did the agent have, what did it retrieve, how did it weigh alternatives, and what led to the final decision. A stack trace for cognition rather than execution.

**Token economics** give you real-time cost visibility: cost per inference, cost per agent action, cumulative budget burn rate. When an agent workflow costs $0.50 per invocation and runs a hundred thousand times daily, you need visibility into whether that spend is generating value.

**Confidence scoring** distinguishes between an agent reasoning from grounded, verified knowledge and one extrapolating from thin evidence. The difference between a reliable automation and a confident mistake waiting to happen.

**Decision quality correlation** connects what the agent decided to what actually happened as a result. Did the recommendation convert? Did the triage route correctly? This feedback loop separates teams confidently scaling their AI investments from teams hoping nothing goes wrong.

![Agent Traces in OpenSearch Dashboards showing spans with kind, name, status, latency, token counts, and input/output columns](/assets/media/blog-images/2026-06-24-the-real-cost-of-your-observability-stack/traces-overview.png){:class="img-centered"}

OpenSearch stores all of these signals using [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/). They are queryable with PPL and SQL, correlated with infrastructure logs and traces, and retained as long as you need them without per-GB penalties.

![Trace detail showing a multi-agent request decomposed into invoke_agent, LLM chat, and tool execution spans with metadata and raw span data](/assets/media/blog-images/2026-06-24-the-real-cost-of-your-observability-stack/trace-detail.png){:class="img-centered"}

**Agent evaluations close the loop.** Online and offline evaluation capabilities answer "how well is this agent performing over time?" by tracking accuracy, drift, and quality metrics against the same traces. This is not a separate evaluation platform; it is built into the same engine that stores the agent telemetry, so evaluation results correlate directly with the operational data that explains them.

**MCP Apps bring investigation into your IDE.** OpenSearch observability is available as open-source MCP Apps for Claude Desktop, VS Code, and compatible agentic IDEs. Each investigation query returns a text summary for agent reasoning plus interactive visualizations for human review, directly in the conversation thread. Agents and humans investigate together without console-switching: log search, metrics correlation, trace exploration, service maps, and topology views all happen in the tool you are already working in.

As agents become production systems, they need to be observed like production systems, using the same tools and the same data store.

## Sovereignty and compliance are not optional

GDPR, SOC 2, HIPAA, FedRAMP require knowing exactly where your data lives, who processes it, and how long it is retained. When you use a proprietary observability vendor, your telemetry transits through infrastructure you do not control, governed by terms you did not write.

For regulated industries, open source observability is not a preference. It is a compliance architecture. Full data residency control means your agent reasoning traces, your customer interaction logs, and your security telemetry never leave infrastructure you operate. You define the retention policies. You control access at every layer. OpenSearch's built-in [security capabilities](https://docs.opensearch.org/latest/security/) cover encryption at rest and in transit, fine-grained access control, and audit logging: the controls that compliance frameworks actually require you to demonstrate.

As AI workloads grow and agent reasoning traces contain increasingly sensitive decision logic (why a loan was approved, why a patient was triaged, why a security alert was dismissed), the sovereignty question only intensifies. The telemetry itself becomes sensitive data, subject to the same protections as the systems it describes. Open source means you can prove compliance because you own the entire stack, not because a vendor handed you a report about their environment.

## The path forward

The real cost of your observability stack is not the invoice. It is the fragmentation that slows every incident response. The token waste when agents cannot get structured answers efficiently. The blind spots that hide agent failures until customers report them. The architectural debt that compounds every time you add another point solution.

The shift is toward investing in a foundation you own: where adding AI workloads does not trigger a budget crisis, where logs and traces and agent telemetry and vector data all live in one searchable engine, where you query from whatever tool you prefer, and where no vendor controls your data, your schema, or your roadmap.

Observability should scale with your systems, including the intelligent ones, not against your budget. And you should not have to give up ownership to get there.

## Get started with OpenSearch observability

- Install the [OpenSearch MCP server](https://opensearch.org/docs/latest/automating-configurations/mcp-servers/) and [OpenSearch Agent Skills](https://github.com/opensearch-project/opensearch-agent-skills) to investigate from Claude Desktop or VS Code
- [Explore the OpenSearch observability documentation](https://observability.opensearch.org)
- [Try PPL for log analytics](https://opensearch.org/docs/latest/search-plugins/sql/ppl/index/) in your environment
- [Instrument with OpenTelemetry](https://observability.opensearch.org/docs/getting-started/) and send traces to OpenSearch
- Connect with the community on [Slack](https://opensearch.org/slack.html) and join the [Observability TAG](https://opensearch.org/blog/announcing-opensearch-observability-tag-shaping-open-source-observability-together/) to shape the roadmap

OpenSearch is an open-source, community-driven project licensed under Apache 2.0.
