---
layout: post
title: "OpenSearch Agent Health: Open-Source Observability and Evaluation for AI Agents"
authors:
  - goyamegh
  - thottan
date: 2026-02-28
categories:
  - technical-posts
  - community
meta_keywords:
meta_description:
---

*How Observability-Driven Development Lets You Ship Agents in Weeks, Not Months*

You've built an Agentic AI application. It's sophisticated, using recursive loops and autonomous tool-calling to navigate data. It passed your local testing with flying colors, so you deploy.

Then the logs hit.

A user asks for an order update. Your agent retrieves the wrong context, decides it needs to "reason" through a product manual, and triggers a sequence of expensive, irrelevant tool calls. After several seconds and a surprising inference cost, it returns a confident but unhelpful response. Your dashboard shows a healthy cluster and a successful 200 OK, but your agent just failed in silence.

### Why do agents fail in silence?

As AI agents move from prototype to production, organizations face a critical challenge that's becoming impossible to ignore. Agents are autonomously making decisions, calling tools, and delivering results, yet the teams building them are often operating without visibility. This creates three critical challenges:

**The Reasoning Gap**: You see the final answer your agent delivers, but you don't see the hallucinated steps it took to get there. Did it call the wrong API? Did it misinterpret the user's intent? Did it retry a failed operation three times before succeeding? Without visibility into the reasoning chain, debugging becomes guesswork.

**The Cost-Latency Spiral**: Agentic workflows are inherently recursive. A single user query can trigger a cascade of expensive and time-consuming sub-tasks. Without real-time operational observability, you don't know which specific tool or sub-agent is burning your budget. Performance issues are only discovered when the bill arrives.

**The Evaluation Paradox**: Without a systematic way to grade agent performance at scale, teams fall back on manual spot-checking. How do you know if your latest prompt change improved accuracy by 5% or silently degraded it by 10%? Without structured evaluation, teams can't confidently deploy to production.

### How will Agent Health help?

The transition from a multi-month deployment cycle to weekly deployments comes down to eliminating the "vibes-based" QA cycle. Every time a prompt is tweaked, or a new tool/skill is added to an agent, testing every possible trajectory manually is not feasible at scale. Agent Health accelerates development by converting this testing process into an automated, AI judge based workflow. By catching regressions early during the development phase (and in CI/CD pipelines) and providing real-time visual traces of exactly where the agent failed/diverged, teams reclaim engineering hours previously lost to staring at logs or waiting for customer incident reports. You debug in minutes, test systematically, and deploy with greater confidence.

![Before and after Agent Health](/assets/media/blog-images/2026-02-28-opensearch-agent-health/before-after-agent-health.png){:class="img-centered"}

### Introducing OpenSearch Agent Health

```
npx @opensearch-project/agent-health
# ✓ Server running at http://localhost:4001
# ✓ Demo data loaded
```

That's it. No installation required. Run one command and the full Agent Health interface is ready with traces, benchmarks, evaluations, and comparisons.

OpenSearch Agent Health is an open-source observability and evaluation solution for AI agents. Available as a zero-installation NPX tool that delivers three core capabilities in a lightweight (~4 MB) package.

**1. Solving the Reasoning Gap: OpenTelemetry-Native Trace Observability**

Agent Health provides timeline and flow visualizations that show exactly what your agent is doing at every step such as which tools it's calling, the sequence of decisions, the data flowing between components, and where things go wrong. All tracing follows OpenTelemetry standards, so your instrumentation remains portable and works alongside your existing observability tooling.

**2. Solving the Cost-Latency Spiral: Structured Benchmarking**

Agent Health enables systematic A/B comparison of agent configurations across test suites. Test different prompts, models, or configurations side-by-side, and track results over time. By storing all benchmarks and results in OpenSearch, Agent Health gives you a persistent, queryable history of every evaluation run, so you catch regressions before they reach production, not after.

**3. Solving the Evaluation Paradox: Real-Time Agent Evaluation**

Agent Health uses "Golden Path" trajectory comparison, where an LLM judge scores agent actions against expected outcomes. You define what "good" looks like for your agent (the expected steps, tool calls, and outcomes) and Agent Health measures how well your agent performs against these criteria. Use your preferred LLM provider as your judge, giving you flexibility to choose the evaluation model that fits your needs and budget.

### Built for Developer Workflows

Agent Health includes both a web UI (`localhost:4001`) and a headless CLI to support different workflows throughout the development lifecycle.

- **AI Agent Developers** can write test cases, run evaluations locally, and integrate agent evaluation directly into CI/CD pipelines. Benchmarks defined in JSON can be executed from the command line, exporting both human and machine-readable reports for automated quality gating.
- **ML Scientists and Evaluators** can use the web UI (`localhost:4001`) to design golden datasets, define quality criteria, run batch benchmarks across configurations, perform A/B testing to track accuracy trends over time, export results for reports or further analysis, and even compare their benchmarks against different comparable agents.

### Try it yourself

Ready to see Agent Health in action? Choose your path: explore with pre-loaded sample data, or connect your own agent and start evaluating.

**Quick Start: Explore with Sample Data (No Agent Required)**

The fastest way to experience Agent Health is with the built-in sample data. Run a single command and you'll have real traces, benchmarks, and evaluation results to explore immediately.

```
npx @opensearch-project/agent-health
# ✓ Server running at http://localhost:4001
# ✓ Demo data loaded
# ✓ Ready to trace, evaluate, and ship
```

Navigate to Traces to explore pre-loaded agent execution data, go to Benchmarks to run the "Travel Planning Accuracy - Demo" and see LLM judge evaluations in action, and visit Compare to see side-by-side run comparisons.

**Evaluate Your Own Agent**

This walkthrough shows you how to instrument your agent, create benchmarks, and iterate based on evaluation results.

**Step 1: Start Agent Health**

Start the tool and configure your connections:

```
npx @opensearch-project/agent-health
# ✓ Server running at http://localhost:4001
```

Agent Health needs an OpenSearch cluster for evaluation data (test cases, benchmarks, and results) and for observability data (agent traces). You can use any existing hosted OpenSearch cluster, or spin one up locally with the [OpenSearch Observability Stack](https://github.com/opensearch-project/observability-stack?tab=readme-ov-file#-quickstart).

```bash
curl -fsSL https://raw.githubusercontent.com/opensearch-project/observability-stack/main/install.sh | bash
```

The local stack launches two components:

- **OpenSearch cluster on port 9200** — Use this as both your evaluation storage and observability storage endpoints in Agent Health Settings.
- **OTEL Collector on port 4317** — Point your instrumented agent's traces here. Agent Health uses OpenTelemetry for trace collection. Follow the [OpenTelemetry instrumentation guide](https://opentelemetry.io/docs/instrumentation/) for your language to add tracing to your agent.

If you're using an existing cluster, add your cluster endpoint directly as both storage endpoints in Settings.

In Settings, configure your agent endpoint (name, URL, and connector type), and you can set your own LLM Judge via env variables.

**Step 2: Create a Benchmark**

Define test cases in JSON format. Example for a travel planner agent (travel-agent-benchmark.json):

```json
[
  {
    "name": "Check hotel availability",
    "description": "User wants to find hotels in New York for specific dates",
    "labels": ["category:Travel", "difficulty:Easy"],
    "initialPrompt": "Are there any hotels available in Manhattan for next weekend?",
    "expectedOutcomes": [
      "Agent should call search_hotels tool with location and date range",
      "Agent should present available hotels with prices and amenities"
    ]
  },
  {
    "name": "Complete booking with confirmation",
    "description": "User wants to book a specific flight and hotel",
    "labels": ["category:Travel", "difficulty:Medium"],
    "initialPrompt": "Book the morning flight to New York and the Hilton hotel for 2 nights",
    "context": [
      {
        "description": "Previous search results showing available flights and hotels",
        "value": "{\"flights\":[{\"id\":\"AA123\",\"time\":\"8:00 AM\",\"price\":\"$350\"}],\"hotels\":[{\"id\":\"hilton-manhattan\",\"name\":\"Hilton Manhattan\",\"price\":\"$200/night\"}]}"
      }
    ],
    "expectedOutcomes": [
      "Agent should call book_flight tool with the correct flight ID",
      "Agent should call book_hotel tool with hotel ID and number of nights",
      "Agent should confirm both bookings with confirmation numbers and total cost"
    ]
  }
]
```

**Step 3: Run and Analyze**

Choose your workflow:

**Option A: CLI Mode**

```bash
npx @opensearch-project/agent-health benchmark \
  -f travel-agent-benchmark.json \
  -a travel-agent \
  --export baseline-results.json \
  -v
```

This imports the benchmark, creates it, runs it against your agent, and exports results in one command.

**Option B: Via UI**

Navigate to Benchmarks, then Import JSON and select your file. Choose "Run" and configure the agent and Judge Model. Watch real-time progress as each test case executes.

**Step 4: View Results**

Access results through the UI (Benchmarks, then Latest Run) to see overall pass rates, per-test-case results with LLM judge reasoning, and improvement strategies ranked by priority. Navigate to Traces for detailed execution visualization showing timeline views, flow views, and span details. Alternatively, analyze the JSON export:

```bash
cat baseline-results.json | jq '.runs[0].reports[] | select(.passFailStatus == "failed") | {
  testCase: .testCaseId,
  reasoning: .llmJudgeReasoning,
  strategies: .improvementStrategies
}'
```

**Step 5: Iterate and Improve**

Update your agent based on high-priority recommendations, then re-run the benchmark and compare results. Navigate to Compare from Benchmarks and select two runs to visualize improvements across metrics like pass rate, latency, cost, and failed tests.

![Agent Health benchmark comparison view](/assets/media/blog-images/2026-02-28-opensearch-agent-health/benchmark-comparison.png){:class="img-centered"}

### What's Next

This is an experimental release, and we're actively shaping what Agent Health becomes next. As the AI agent ecosystem matures and standards solidify, we'll continue evolving the tool based on real-world usage.

Agent Health is designed as a development-phase companion that helps you build, test, and iterate on your agents before they reach production. As the ecosystem matures, we're exploring how Agent Health's evaluation and observability capabilities can extend into production-scale deployments.

Install it, run your benchmarks, and share what you find. Open an issue on GitHub, join the discussion in the RFC, or share your experience with the community. Your feedback will directly influence how we prioritize features and refine the developer experience.

### Learn More

- **GitHub Repository**: [opensearch-project/agent-health](https://github.com/opensearch-project/agent-health)
- **RFC**: [Agent Health RFC](https://github.com/opensearch-project/agent-health/issues/42)
