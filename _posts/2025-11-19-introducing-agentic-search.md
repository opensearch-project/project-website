---
layout: post
title:  "Introducing agentic search in OpenSearch - Transforming data interaction through natural language"
authors:
  - kazabdu
  - rithinp
  - ohltyler
  - jpalis
  - agtunnell
  - mingshl
  - seanzheng
  - kolchfa

date: 2025-11-19
has_science_table: true
categories:
  - technical-posts
meta_keywords: agents, tools, agentic, search, LLM, NLQ
meta_description: Discover how agentic search in OpenSearch 3.3 lets you find data using natural language, without writing complex queries or learning technical syntax.
---

With OpenSearch 3.3, we are excited to introduce _agentic search_, a major evolution in the way you interact with your data. Agentic search lets you explore your data using a natural language interface, without needing to construct DSL queries manually.

## Agentic search core concepts

Agentic search operates using two key components: agents and tools.

### Agents

An _agent_ is a system powered by a large language model (LLM) that can interpret your request, plan the necessary steps, and decide which tools to use. It understands intent, breaks tasks into actions, and adapts based on intermediate results.

### Tools

_Tools_ are capabilities the agent can invoke, such as listing indexes or performing search. The agent selects the tools to use based on the query intent. For a full list of tools, see [Tools](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/tools/index/).

## How agentic search differs from other search types

You can experiment with queries and their results using the Compare Search Results tool in OpenSearch Dashboards. For more information, see [Comparing single queries](https://docs.opensearch.org/latest/search-plugins/search-relevance/compare-search-results/).

To understand why agentic search represents a significant advancement, consider the query "I want to buy black shades for my dad" (entered as `SearchText` in Compare Search Results). The following queries demonstrate these differences in practice.

### Agentic search and keyword search compared

To compare agentic search with keyword search, run the following queries.

Agentic query:

```json
{
  "query": {
    "agentic": {
      "query_text": "%SearchText%",
      "query_fields": []
    }
  }
}
```

Keyword query:

```json
{
  "query": {
    "multi_match": {
      "query": "%SearchText%"
    }
  }
}
```

The results for agentic search (left) and keyword search (right) are shown in the following image.

![Agentic search compared to keyword search](/assets/media/blog-images/2025-11-19-introducing-agentic-search/keyword.png)

**Agentic search** interprets the query intent and understands that "shades" means sunglasses, returning relevant eyewear products.

**Keyword search** matches individual tokens like "want", "buy", "black", "shades", and "dad", potentially returning irrelevant results about window shades or other black objects.

### Agentic search and semantic search compared

To compare agentic search with semantic search, run the following queries.

Agentic query:

```json
{
  "query": {
    "agentic": {
      "query_text": "%SearchText%",
      "query_fields": []
    }
  }
}
```

Semantic query:

```json
{
  "query": {
    "neural": {
      "content_embedding": {
        "query_text": "%SearchText%",
        "k": 100,
        "model_id": "IX-eM5oBVLB2ECqF42kS"
      }
    }
  }
}
```

The results for agentic search (left) and semantic search (right) are shown in the following image.

![Agentic search compared to semantic search](/assets/media/blog-images/2025-11-19-introducing-agentic-search/neural.png)

**Agentic search** provides more comprehensive understanding by interpreting the full context and user goal, focusing specifically on black sunglasses suitable for gifting.

**Semantic search** understands semantic meaning and correctly identifies "shades" as sunglasses. However, it may also return results for anything black-colored, because it processes all query terms without understanding the complete user intent.

## How agentic search works

Agentic search is powered by an intelligent, agent-driven system that interprets your natural language queries, selects the appropriate tools, and generates optimized search strategies automatically. You can run agentic search using the `agentic` query type, allowing you to explore your data without needing to know query syntax or internal data structures.

For example, you can ask questions such as:

* "Find red cars under $30,000"
* "Show me last quarter's sales trends"
* "What are the top performing products in the electronics category?"

The agent then carries out the necessary steps—such as identifying relevant indexes, planning the query, or gathering supplemental information—and returns results aligned with your intent. It also provides a transparent explanation of the tools and decisions involved.

## Agentic search capabilities

OpenSearch 3.3 introduces several powerful capabilities that enable natural, conversational interaction with your data while providing advanced orchestration across systems.

### Conversational search experience

Maintain context across queries using memory IDs, enabling seamless multi-turn interactions that build on previous queries. The agent keeps track of context and updates the query plan accordingly, so you can refine or follow up on queries naturally without repeating details.

### Built-in tools

Agentic search uses built-in tools to retrieve, understand, and enrich information. The `ListIndexTool` identifies which indexes exist in your cluster, while the `IndexMappingTool` helps the agent understand their structure and fields. The `QueryPlanningTool` generates optimized queries from your natural language questions. When a query can't be fully answered from local data, the `WebSearchTool` retrieves relevant external information.

For example, you can ask the following questions:

* "Show me shoes similar to Ronaldo's favorite."
* "What items do I need to play golf?"

If the agent can't find enough information in your indexes, it performs a web search to gather additional context, then compares that information against your local data to return the most relevant matches.

### Custom search templates

Advanced users can define custom search templates that capture known query strategies or domain-specific logic. The agent automatically selects and fills in the most appropriate template based on your question and conversation context. This hybrid approach lets experts apply their domain knowledge while still interacting through a natural language interface.

### External system integration

Connect to external systems using MCP (Model Context Protocol) connectors (a standardized way to integrate with external data sources and services) to expand search capabilities beyond your OpenSearch cluster.to expand search capabilities beyond your OpenSearch cluster. By connecting to external MCP servers or compute environments, the agent can orchestrate broader query planning and execution across multiple systems, enabling advanced workflows that enrich queries with data from third-party services.

## Example use cases

The following examples show how agentic search supports real-world scenarios across industries, without requiring you to understand index structures, query syntax, or search optimization.

### Personalized shopping recommendations

**Query**: "Show me running shoes I might like based on my past orders and browsing behavior."

**Process**:
* The agent identifies relevant indexes such as `products` through the `ListIndexTool`.
* It invokes the `get_order_history` MCP tool to gather past purchases, preferred brands, sizes, and price ranges.
* Using index mappings and MCP-provided order data, the agent automatically builds an optimized DSL query using the `QueryPlanningTool`.

**Outcome**:

Highly customized, context-aware product recommendations that blend behavioral data, semantic signals, and trends—without manual query creation.

### Observability and incident correlation

**Query**: "Show me which customers were impacted by the power outage this morning."

**Process**:
* The agent selects relevant operational indexes such as `logs`, `metrics`, and `alerts` using the `ListIndexTool`.
* Using a custom incident management MCP tool, it retrieves official incident details and correlates them with log data.
* It uses the `IndexMappingTool` to interpret timestamps, service fields, and customer identifiers.
* If needed, `WebSearchTool` validates external references such as public outage announcements.
* The agent then creates a DSL query using the `QueryPlanningTool` that filters logs for the outage window and identifies customers showing error spikes or activity drops.

**Outcome**:
A complete, correlated view of affected customers, automatically combining logs, metrics, incident data, and optional external context.

### Fraud detection and risk investigation

**Query**: "Find potential fraudulent transactions in the past 24 hours."

**Note**: MCP servers can be sourced from [MCP Servers](https://mcpservers.org/).

**Process**:
* The agent identifies the `transactions` index using the `ListIndexTool`.
* Using the `IndexMappingTool`, it recognizes key fields such as amount, location, device_id, merchant, and timestamp.
* Using a custom fraud-rule-engine MCP tool, the agent retrieves defined rules and ranks results by risk score.
* It constructs an optimized DSL query using the `QueryPlanningTool` that detects anomalies—such as geo-distance deviations or unusual transaction frequency.

**Outcome**:
Automated fraud triage that merges OpenSearch anomaly detection, external rule engines, and enrichment—significantly reducing manual investigation time.

## Try agentic search on the playground

To explore agentic search, use preconfigured agents and sample data on the [machine learning (ML) Playground](https://ml.playground.opensearch.org/app/opensearch-flow#/workflows/yjn5LZoBjktoC8RhTWUk?configureAgent=false).

## Set up agentic search locally

To configure agentic search locally, follow the [agentic search setup documentation](https://docs.opensearch.org/latest/vector-search/ai-search/agentic-search/index/).

To enable detailed explanation of search results, configure the [agentic context processor](https://docs.opensearch.org/latest/search-plugins/search-pipelines/agentic-context-processor/). The explanation contains information about steps the agent took to generate the results and the tools it used, as shown in the following image.

![Agent Summary](/assets/media/blog-images/2025-11-19-introducing-agentic-search/summary.png)

## Use agentic search in OpenSearch Dashboards

To use agentic search in OpenSearch Dashboards, follow these steps:

1. Navigate to **OpenSearch Plugins** > **AI Search Flows**.
2. Select **Create new workflow** and then select **Agentic Search**.
3. Provide a workflow name to save your configuration.
4. Select **"Create"** to open the agentic search interface.

The interface has two main sections:
- **Left panel**: Configure and create agents
- **Right panel**: Run searches and analyze results

Collapse the left panel to focus on testing queries and reviewing results. For detailed instructions, see the [agentic search documentation](https://docs.opensearch.org/latest/vector-search/ai-search/building-agentic-search-flows/).

## What's next

We're currently implementing further performance optimizations for agentic search, including prompt caching, multi-agent architecture, and improved agent tracing. We're planning to publish additional blog posts that describe our evaluation framework, query accuracy, and user experience.
If you have feedback, questions, or ideas for additional use cases you'd like to see implemented, we'd love to hear from you. Join the discussion on the [OpenSearch forum](https://forum.opensearch.org/t/use-cases-and-general-feedback-for-agentic-search/27488) or in the [OpenSearch Slack](https://opensearch.org/slack/).

To track ongoing development and design updates, see the [Agentic search RFC](https://github.com/opensearch-project/neural-search/issues/1525).

