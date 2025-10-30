---
layout: post
title: "Introduction to AI agents in OpenSearch: From simple flow agents to advanced ReAct multi-agent systems"
authors: 
    - dhorovits
    - mingshl
date: 2025-09-30
categories: 
    - technical-post
excerpt: "Explore the diverse range of AI agents in OpenSearch, from simple flow agents to advanced ReAct multi-agent systems. Learn how to choose the right agent for tasks like RAG, chatbots, research, and automated root cause analysis."
---

An _AI agent_ (or simply _agent_) is a coordinator that uses a large language model (LLM) to solve a problem. After the LLM reasons and decides what action to take, the agent coordinates the action execution.

OpenSearch includes a portfolio of agents suitable for a variety of AI tasks, such as retrieval-augmented generation (RAG), chatbots, research, and automated root cause analysis (RCA).

In this blog post, we'll explore the various agents supported by OpenSearch and provide guidance on how to choose the right agent for your task. To build a clear understanding, we'll start with the simplest agents and move on to more complex ones.

## Flow agent

A _flow agent_ is the simplest type of agent. It orchestrates multiple tools in a workflow and runs them sequentially, in the order defined in the agent configuration. The flow agent acts as an orchestrator of a fixed workflow, which invokes tools and coordinates the tools so that one tool's output becomes another tool's input.

Flow agents are useful for [RAG](https://opensearch.org/blog/using-opensearch-for-retrieval-augmented-generation-rag/). During RAG, the agent first invokes a tool to retrieve information from a knowledge base, then invokes another tool to call the LLM while passing the knowledge base retrieved from the previous step as input, along with the query. This is ideal for implementing *one-shot prompts*.

For more information, see [Flow agents](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/agents/flow/).

## Conversational flow agent

Much like a flow agent, a _conversational flow agent_ runs tools sequentially, in the order specified in its configuration, to execute a fixed workflow.

However, the conversational flow agent also stores conversation history in its memory index between prompts in a session. This history allows users to ask follow-up questions that the agent can address using that historical context. The conversational flow agent is ideal for a chatbot that needs to execute a predetermined, multi-step process for most of its user interactions but also needs to remember the context of the conversation for follow-up questions. It achieves this by using a *few-shot prompt*, in which the conversation history serves as context for each new prompt. 

The conversation history is stored in an index in the OpenSearch cluster, much like any other data. It is conveniently accessible for querying and inspection by agents or humans for auditing, reasoning, and debugging. The data can be accessed using the [Memory APIs](https://docs.opensearch.org/latest/ml-commons-plugin/api/memory-apis/index/). For more information see [Agentic memory](#agentic-memory).

## Conversational agent

Unlike the previously described agents, a _conversational agent_ isn't bound by a fixed workflow. Instead, it supports dynamic workflows by using LLM-based *reasoning* to provide a response, based on the *ReAct (reasoning & acting)* agentic framework. The LLM reasons iteratively to decide what action to take until it obtains the final answer or reaches the iteration limit.

The conversational agent bases its reasoning on two sources: the LLM's built-in knowledge base and a set of tools that enable it to fetch additional context beyond that knowledge.

For specific questions, the agent uses the *Chain-of-Thought (CoT)* process to select the best tool from the configured tools for providing a response to the question.

Similarly to a conversational flow agent, conversational agents store conversation history so that users can ask follow-up questions. The workflow of a conversational agent is variable, based on follow-up questions.

Conversational agents are useful for creating chatbots that use RAG.

OpenSearch uses these agents internally for [agentic search with natural language queries](https://github.com/opensearch-project/ml-commons/blob/main/docs/tutorials/agentic_search/agentic_search_llm_generated_type.md).

## Plan-execute-reflect agent

A plan-execute-reflect agent uses a more elaborate form of dynamic workflow. It dynamically plans, executes, and refines multi-step workflows to solve complex tasks.

Internally, a plan-execute-reflect agent uses the multi-agent pattern in OpenSearch, which enables chaining agents and defining subagents. The plan-execute-reflect agent uses a CoT agent for the planning phase and a conversational agent to execute each individual step in the plan. The agent automatically selects the most appropriate tool for each step based on tool descriptions and context.

The plan-execute-reflect agent is ideal for long-running, exploratory processes, which benefit from iterative reasoning and adaptive execution, such as conducting research or performing automated RCA. 

For more information about the plan-execute-reflect agent, check out [this blog post](https://opensearch.org/blog/intelligent-troubleshooting-using-opensearch-3-0s-plan-execute-reflect-agent/).

## Agent tools and external data integration

Agents are only as effective as the portfolio of tools at their disposal. OpenSearch's agentic framework enables agents to invoke both built-in and external tools using standardized protocols.

### Built-in agent tools

OpenSearch provides a comprehensive suite of prebuilt [tools](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/tools/index/) that can be seamlessly configured with the different agent types. These native tools enable agents to efficiently access and manipulate search data within OpenSearch, providing essential capabilities for data retrieval, analysis, and management operations.
 
### External data source integration using MCP connectors

Model Context Protocol (MCP) has been gaining popularity as a communication standard for agentic workflows, simplifying the way AI agents interact with external tools.

OpenSearch extends agent capabilities through [MCP connectors](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/mcp/index/), enabling integration with external MCP servers and their associated tools. This powerful feature is supported by plan-execute-reflect agents and conversational agents, allowing them to use external data sources and services and significantly expanding their analytical and operational capabilities beyond the confines of OpenSearch itself. The connectors support the Streamable HTTP and Server-Sent Events (SSE) protocols, providing flexibility in connecting to various external MCP servers. These agents can seamlessly combine internal OpenSearch tools with external MCP server tools, creating unified workflows that enable sophisticated multi-source data analysis and decision-making processes across diverse data sources and services.

## Agentic memory

Agents can use a session cache to store previous prompts as context for a conversation. This allows follow-up questions within the same session to take earlier questions and answers into account. However, this cache is limited to the current session. What if you want agents to learn from past conversations, enabling a deeper level of personalization and context? In such cases, you need to move from short-term memory to long-term memory—support that extends beyond a single session and maintains persistent memory across sessions. Let's explore what OpenSearch offers to address both needs.

In the 2.12 release, OpenSearch introduced [Memory APIs](https://docs.opensearch.org/latest/ml-commons-plugin/api/memory-apis/index/), which store raw conversation messages and records of tools used in OpenSearch indexes to support conversational history retrieval and tracing. This Memory API preserves the messages and tool usage in their raw form, serving as a type of short-term memory.

Recently, OpenSearch expanded to also support long-term memory, with the addition of _agentic memory_. Introduced in [OpenSearch 3.2](https://opensearch.org/blog/introducing-opensearch-3-2-next-generation-search-and-anayltics-with-enchanced-ai-capabilities/) and generally available in OpenSearch 3.3, agentic memory is a persistent memory system that enables AI agents to learn, remember, and reason across conversations and interactions. This feature provides comprehensive memory management using multiple strategies, including semantic fact extraction, user preference learning, and conversation summarization. It allows agents to maintain context and build knowledge over time and enables sophisticated memory operations, such as consolidation, retrieval, and history tracking. 

By providing agents with persistent, searchable memory, this feature transforms static AI interactions into dynamic, context-aware experiences that improve over time, enabling more personalized and intelligent responses while maintaining control over memory organization and retention policies. For more information, see [Agentic memory](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory/).

## An agentic experience with an MCP server

External agents can also benefit from accessing OpenSearch capabilities exposed as tools over standard MCP. OpenSearch offers two comprehensive [MCP server solutions](https://opensearch.org/blog/introducing-mcp-in-opensearch/) to meet diverse integration needs:
 
1. **Built-in MCP server**: The [built-in MCP server](https://docs.opensearch.org/latest/ml-commons-plugin/api/mcp-server-apis/index/) provides native integration within OpenSearch, exposing a Streamable HTTP MCP API that enables dynamic tool registration and removal. This solution offers seamless access to core OpenSearch capabilities, allowing agents to invoke powerful [tools](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/tools/index/) for real-time data queries and analysis. Since it makes direct API calls to OpenSearch through `/_plugins/_ml/mcp`, it natively supports Role-Based Access Control (RBAC), ensuring secure and granular access management.
 
2. **Standalone MCP server**: The [standalone MCP server](https://github.com/opensearch-project/opensearch-mcp-server-py/blob/main/USER_GUIDE.md) delivers flexible deployment options through the `opensearch-mcp-server-py` PyPI package. This solution supports multiple protocols, including `stdio`, Streamable HTTP, and SSE, making it compatible with various AI agent frameworks. Advanced features include tool filtering capabilities and multi-cluster connectivity, enabling sophisticated agentic workflows across distributed environments.
 
Both solutions provide agents with secure, real-time access to search data and enable complex analytical operations by combining OpenSearch tools with other MCP servers and external tools. For detailed implementation examples and use cases, see [this comprehensive blog post](https://opensearch.org/blog/unlocking-agentic-ai-experiences-with-opensearch/).

## Summary

OpenSearch provides a variety of agents to support different AI tasks. These range from fixed workflows to dynamic ones, covering everything from short, focused logic to long-running exploratory processes.

To get started with agents in OpenSearch, follow the step-by-step setup instructions in the [Agents and tools tutorial](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/agents-tools-tutorial/).
