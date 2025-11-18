---
layout: post
title:  "Introducing Agentic Search in OpenSearch - Transforming Data Interaction Through Natural Language"
authors:
  - kazabdu
  - rithinp
  - ohltyler
  - jpalis
  - agtunnell
  - mingshl
  - seanzheng

date: 2025-11-19
has_science_table: true
categories:
  - technical-posts
meta_keywords: agents, tools, agentic, search, LLM, NLQ
meta_description: Learn about building agentic search in OpenSearch.
---

With OpenSearch 3.3, we are excited to announce the release of Agentic Search, a major evolution in how users interact with their data. Agentic Search introduces an intelligent agent-driven system that understands user intent, orchestrates the right set of tools, generates optimized queries, and provides transparent summaries of its decision-making process through it’s natural language interface.

## What is Agentic Search?

Before diving into Agentic Search, it’s helpful to clarify two core concepts: agents and tools.

**Agents**

An agent is a system powered by a large language model (LLM) that can interpret a user’s request, plan the steps needed to fulfill it, and decide which tools to call along the way. It reasons about intent, breaks tasks into actions, and adapts based on intermediate results.

**Tools**

*Tools* are capabilities the agent can invoke . For example in OpenSearch such as listing indexes, reading index mappings, performing search. Agents can also call external MCP tools, for example, order history services, product comparison APIs, or incident/ticketing systems.. The agent decides which tools to use based on the query’s intent. Built in tools provided by OpenSearch can be found [here](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/tools/index/).

Agentic Search introduces an intelligent agent-driven system that understands user intent, orchestrates the right set of tools (like ListIndexTool, IndexMapping, WebSearchTool), generates optimized queries, and provides transparent summaries of its decision-making process through a simple 'agentic' query type and natural language search terms without the need for manual DSL construction.

For example users can simply ask questions like:
- "Find red cars under $30,000"
- "Show me last quarter's sales trends"
- "What are the top performing products in the electronics category?"

The agent understands your intent, selects optimal search strategies, and delivers precise results, making powerful search accessible to users regardless of their technical expertise. Best of all, it also returns a summary of how the result was generated, showing which tools were used and why.

Try out agentic search **today** on the [ML Playground](https://ml.playground.opensearch.org/app/opensearch-flow#/workflows/yjn5LZoBjktoC8RhTWUk?configureAgent=false), with pre-configured agents and sample data.

## Why Agentic Search?


**Natural Language Based**: Users can engage in natural dialogue with their data, asking questions directly without needing to understand underlying search complexity or data structure.

**Intelligent Query Planning**: Agents automatically choose the most appropriate search approach, generating optimized queries that would typically require deep OpenSearch expertise to construct manually.

**Conversational Context**: Maintain context across queries through memory IDs, enabling seamless multi-turn conversations that build upon previous interactions.

**Extensible Architecture**: Connect to external systems through MCP (Model Context Protocol) connector integration, expanding search capabilities beyond your OpenSearch cluster.


### Agentic Search vs Keyword Search

Below is a typical natural language query used to compare agentic search with keyword based search:
“I want to buy black shades for my dad.”
Agentic search interprets the intent of the query and understands that the user is looking for sunglasses, returning results aligned with that meaning.
In contrast, a traditional keyword search focuses on token matches such as “want,” “buy,” “black,” “shades,” or “dad,” which can dilute relevance and lead to less accurate results.

![Agentic Search vs Keyword Search](/assets/media/blog-images/2025-11-19-introducing-agentic-search/keyword1.png)
![Agentic Search vs Keyword Search](/assets/media/blog-images/2025-11-19-introducing-agentic-search/keyword2.png)


### Agentic Search vs Neural Search


Similarly to keyword-based search, neural search can understand the semantics of the word “shades” and retrieve results like sunglasses. However, it still doesn’t fully capture and follow the user’s broader intent in the way agentic search does and show other results for the color.

![Agentic Search vs Neural Search](/assets/media/blog-images/2025-11-19-introducing-agentic-search/neural1.png)
![Agentic Search vs Neural Search](/assets/media/blog-images/2025-11-19-introducing-agentic-search/neural2.png)

## Key Capabilities in OpenSearch 3.3

#### Conversational Search Experience

Agentic Search enables natural language dialogue with your data. It supports multi-turn conversations, meaning it can maintain context across queries through memory IDs. This allows users to refine, expand, or follow up on queries naturally, just like a conversation. The agent keeps track of context and updates the query plan accordingly, no need to repeat yourself or reconstruct the logic manually.

#### External MCP Connector Integration

With 3.3, Agentic Search also supports external Model Context Protocol (MCP) connectors. This means you can extend the capabilities of OpenSearch by connecting to external MCP Servers and compute environments, allowing for broader query planning, orchestration, and execution across systems, not just within your cluster.
This opens the door to more advanced workflows, such as third-party systems to enrich the query process.

#### User-Defined Templates

Advanced users can leverage custom search templates while still benefiting from the conversational interface. These templates can encode known query strategies or domain-specific logic. The agent intelligently selects and populates the most appropriate template based on the user's question and the context of the conversation. This hybrid approach allows advanced users to inject domain expertise into the query process, while still benefiting from the natural-language interface.


#### Built-in tools Usage

Agentic Search leverages built-in tools to intelligently retrieve and enrich information. The ListIndex tool helps the agent identify which indices exist, while IndexMapping tool allows it to understand the structure and fields of those index. The WebSearch tool enables the agent to pull in real-time external information when the user’s question isn’t fully answered by local data. For example, you can ask:
For example, you can ask:

>*“Show me shoes that are similar to Ronaldo's favorite?”*
*“What are the items needed to play golf?”*

If the agent determines that the information isn’t available in your local data, it uses the Web Search Tool to retrieve fresh, relevant content from the internet. Once the external data is gathered, the agent look for the items in your local index to find the most relevant matches.

## 
Getting Started


Ready to transform your search experience? Explore Agentic Search in OpenSearch 3.3 and discover how natural language can unlock the full potential of your data. Please follow the documentation for setting up [Agentic Search](https://docs.opensearch.org/latest/vector-search/ai-search/agentic-search/index/).

With the help of [agentic context processor](https://docs.opensearch.org/latest/search-plugins/search-pipelines/agentic-context-processor/), you can also enable agent summaries for each search query, providing clear insights into how results were generated and which tools were used.

![Agent Summary](/assets/media/blog-images/2025-11-19-introducing-agentic-search/summary.png)

## Example Use Cases

### Personalized Shopping & Recommendations

### **User Query:**

>“Show me running shoes I might like based on my past orders and browsing behavior.”


**What Happens:**

* The agent identifies local indexes such as `products` using the List Index Tool.
* It then invokes the get_order_history MCP tool attached to the agent to retrieve the user’s past purchases, preferred brands, sizes, and price ranges.
* Using index mappings received from Index Mapping tool and MCP data of shoes from past order, the agent constructs an optimized DSL query using the Query Planning tool.

**Outcome:**
 A personalized, context-aware product search that combines behavioral data, semantic relevance, and live trends, all without manual query construction.


### Observability & Incident Correlation

### **User Query:**

>“Show me which customers were impacted by the power outage this morning.”


**What Happens:**

* The agent selects relevant operational and telemetry indexes such as `logs`, `metrics`, `alerts` using the ListIndexTool
* Using the Incident management tool attached through MCP, it retrieves the official incident details and correlates them with logs.
* It parses timestamps and service fields via index mappings.
* Optionally, WebSearch can be used to confirm external references (e.g., public outage announcements).
* Finally, creates a DSL query that filters logs for the outage time window and provides the customer name which had activity drops or error spikes.

**Outcome:**
 A fully correlated explanation of which customers were affected, combining logs, metrics, incident data, and optional public information, all pulled together in one intelligent agent workflow.

### Fraud Detection & Risk Investigation

### **User Query:**

>“Find potential fraudulent transactions in the past 24 hours.”

**Note**: MCP servers can be used from [MCP Servers](https://mcpservers.org/)

**What Happens:**

* The agent uses index like `transactions`  using the ListIndexTool
* Using mappings, it identifies fields such as amount, location, device_id, merchant, and timestamp.
* Using the fraud rule engine MCP connected, the agent can gather defined fraud rules, rank results by risk score.
* It later builds an optimized DSL query that detects anomalies for geo-distance inconsistencies or unusual transaction cadence. 

**Outcome:**
 Automated fraud triage that merges OpenSearch anomaly signals, policy rules, and external enrichment. Dramatically reducing manual investigation effort.


## User interface

Navigate to OpenSearch Dashboards > OpenSearch Plugins > AI Search Flows. Click on “Create new workflow”, and select “Agentic Search”. Provide a name. This workflow will persist all of your agentic search configuration. Click “Create” to create the workflow and navigate to the Agentic Search UI.

The page is split into two main components. Use the left-hand side for configuring and creating agents. Use the right-hand side for running agentic searches. You can collapse the left-hand side to focus on testing different agents, different queries, and analyzing the results. For more information and examples, check out the [documentation](https://docs.opensearch.org/latest/vector-search/ai-search/building-agentic-search-flows/).

Whether you are an analyst, developer, or business user, Agentic Search unlocks a new way to ask questions and get answers without needing to write a single query.


## Next Steps

We are working on further performance optimizations for agentic search, including prompt caching and a multi-agent architecture. We also plan to improve agent tracing.
We will be releasing a few additional blog posts soon covering our evaluation framework, query accuracy, and our UI.
Please reach out to us for your use cases and questions on the [forum](https://forum.opensearch.org/t/use-cases-and-general-feedback-for-agentic-search/27488) or [opensource slack](https://opensearch.org/slack/). Check out the [RFC for Agentic Search](https://github.com/opensearch-project/neural-search/issues/1525).



