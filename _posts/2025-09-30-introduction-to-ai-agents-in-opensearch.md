---
layout: post
title: "Introduction to AI agents in OpenSearch: From simple flows to advanced ReAct multi-agent systems"
authors: 
    - dotan
    - mingshl
date: 2025-09-30
categories: 
    - technical-post
excerpt: "Explore the diverse range of AI agents in OpenSearch, from simple flow agents to advanced ReAct multi-agent systems. Learn how to choose the right agent for tasks like RAG, chatbots, research, and automated root cause analysis."
---

An *AI agent* (or simply ‘agent’) is a coordinator that uses a large language model (LLM) to solve a problem. After the LLM reasons and decides what action to take, the agent coordinates the action execution.

The OpenSearch project includes a portfolio of agent types that are suitable for a variety of different AI tasks, such as RAG, chatbots, research and automated root cause analysis.

In this blog we will give an overview of the various agents supported by the OpenSearch Project, along with guidance on how to choose the right agent for your task at hand. We’ll start from the simplest agents and grow in complexity to make things interesting.

## **Flow agent**

Flow agent is the simplest type of agent. It orchestrates multiple tools in a workflow and runs the tools sequentially, as outlined in configuration. The flow agent acts as an orchestrator of a fixed workflow, which invokes tools and coordinates the tools so that one tool’s output can become another tool’s input.

Flow agent is useful for [retrieval-augmented generation (RAG)](https://opensearch.org/blog/using-opensearch-for-retrieval-augmented-generation-rag/), where the agent invokes a tool to retrieve the knowledge base, and then invokes another tool to call the LLM while passing the knowledge base retrieved from the previous step as input, along with the query. This is ideal for implementing *one-shot prompts*.

For more information on Flow agents, read [here](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/agents/flow/).

## **Conversational flow agent**

Much like the flow agent, Conversational flow agent runs tools sequentially, in the order specified in its configuration, to execute a fixed specified workflow.

However, the conversational flow agent also stores conversation history in its memory index between prompts in the session. This history allows users to ask follow-up questions that the agent can address with that historical context. This makes the conversational agent a great fit for building chatbots. It is a type of a *few-shot prompts* with the conversation history as the context.

The conversation history is stored in an index in the OpenSearch cluster, much like any other data, which makes it conveniently accessible for querying and inspection by agents or humans, for auditing, reasoning and debugging purposes.

## **Conversational agent**

Unlike the previous agents, the conversational agent isn’t bound by a fixed workflow. Instead, the conversational agent supports dynamic workflows by employing LLM-based *reasoning* to provide a response, based on the *ReAct (reasoning & acting)* agentic framework. The LLM reasons iteratively to decide what action to take until it obtains the final answer (or until it reaches the iteration limit.)

The conversational agent bases its reasoning on a knowledge base from the LLM, as well as from a set of tools provided to the LLM that enable it to extend beyond its built-in knowledge base and fetch additional context.

Similar to conversational flow agent, conversational agents store conversation history so that users can ask follow-up questions. The workflow of a conversational agent is variable, based on follow-up questions.

For specific questions, the agent uses the *Chain-of-Thought (CoT)* process to select the best tool from the configured tools for providing a response to the question.

Conversational agents are useful for creating a chatbot that employs RAG.

## **Plan-execute-reflect agent**

Plan-execute-reflect agent is a more elaborate form of dynamic workflow. It dynamically plans, executes, and refines multi-step workflows to solve complex tasks.

Internally, a plan-execute-reflect agent uses the multi-agent pattern in OpenSearch. Multi-agent enables chaining agents and defining sub-agents. In the case of the plan-execute-reflect agent, it employs a CoT agent for the planning phase, and a conversational agent to execute each individual step in the plan. The agent automatically selects the most appropriate tool for each step based on tool descriptions and context.

Plan-execute-reflect agent is ideal for long-running, exploratory processes, which benefit from iterative reasoning and adaptive execution, such as conducting research or performing automated root cause analysis (RCA).

The OpenSearch project itself uses these agents for [Agentic search with natural language queries](https://github.com/opensearch-project/ml-commons/blob/main/docs/tutorials/agentic_search/agentic_search_llm_generated_type.md), and for the [release automation agent OSCAR](https://github.com/opensearch-project/oscar-ai-bot).

For more information on the plan-execute-reflect agent type, check out this [blog post](https://opensearch.org/blog/intelligent-troubleshooting-using-opensearch-3-0s-plan-execute-reflect-agent/).

## **Agentic memory**

As we saw, agents can use a session cache to store previous prompts as context for the conversation. This means that follow up questions on the same conversation can take the preceding questions and answers into account. This cache, however, is limited to the current session.

Agentic memory, a new feature introduced in [OpenSearch 3.2](https://opensearch.org/blog/introducing-opensearch-3-2-next-generation-search-and-anayltics-with-enchanced-ai-capabilities/), enables extending beyond the boundaries of a single session, and maintaining persistent memory across sessions. This enables agents to learn from past conversations, for a deeper level of personalization and context. You can find more information about [agentic memory here](https://docs.opensearch.org/latest/ml-commons-plugin/api/agentic-memory-apis/index/).

## **Agentic experience with MCP server**

Model Context Protocol (MCP) has been gaining popularity as a communication standard for agentic workflows, simplifying the way AI agents interact with external tools.

The OpenSearch project runs a [built-in MCP server](https://opensearch.org/blog/introducing-mcp-in-opensearch/), which provides agents with real-time and secure access to search data. Agents can invoke tools exposed by the MCP server, such as GetShardsTool, IndexMappingTool, ListIndexTool, and SearchIndexTool, and execute complex data queries and analysis logic with these tools, in combination with other tools and other MCP servers at the agent’s disposal. You can see a detailed example in this [blog post](https://opensearch.org/blog/unlocking-agentic-ai-experiences-with-opensearch/).

## **Summary**

OpenSearch offers a variety of agents to suit different AI tasks. These include both fixed workflows and dynamic ones, from short and focused logic to long-running exploration.

For a step-by-step tutorial, see [Agents and tools tutorial](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/agents-tools-tutorial/).
