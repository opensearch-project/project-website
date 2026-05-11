---
layout: post
title: "Bringing intelligence to OpenSearch: Introducing the OpenSearch Agent Server"
authors:
  - mingshl
  - jiapingzeng
date: 2026-05-07
categories:
  - technical-posts
  - feature
meta_keywords: OpenSearch Agent Server, multi-agent orchestration, AI agents, MCP server, Model Context Protocol, AG-UI Protocol, search relevance, agentic AI, OpenSearch Dashboards, AWS Bedrock
meta_description: Introducing the OpenSearch Agent Server, a multi-agent orchestration platform that enables developers to build specialized AI agents that collaborate within OpenSearch through an intelligent routing layer.
excerpt: The OpenSearch Agent Server is a multi-agent orchestration platform released as experimental in OpenSearch 3.6. It enables developers to build specialized AI agents—each with distinct expertise and tools—that collaborate through an intelligent routing layer, transforming how users interact with OpenSearch.
has_math: false
has_science_table: false
---

Real-world OpenSearch deployments serve diverse needs: developers querying logs, analysts exploring metrics, engineers optimizing search, and business users seeking insights. A single generalist assistant trying to handle all of these tasks inevitably compromises on depth. What if you could match the right specialist to each task?

Today, we're introducing the **OpenSearch Agent Server** in OpenSearch 3.6 as an experimental release. The Agent Server is a multi-agent orchestration platform that enables developers to build specialized AI agents that work together within OpenSearch. Instead of one generalist assistant trying to handle everything, this platform provides infrastructure for creating focused agents—each with distinct expertise and tools—that collaborate through an intelligent routing layer. A default agent serves as a general assistant for broad queries, while specialized agents handle specific domains like search relevance tuning.

In this post, we'll explore the platform's architecture, dive into a real-world example with the ART agent, and show you how to start building your own agents.

## Architecture and core concepts

The Agent Server is built on three foundational components: a standalone MCP server, a multi-agent orchestration layer, and the AG-UI Protocol for real-time streaming.

![OpenSearch Agent Server Architecture showing Dashboards, orchestration layer, agents, MCP server, and OpenSearch cluster](/assets/media/blog-images/2026-05-07-introducing-opensearch-agent-server/architecture.jpg)

### The OpenSearch MCP server

At the foundation is a standalone [OpenSearch MCP (Model Context Protocol) server](https://github.com/opensearch-project/opensearch-mcp-server-py). This server connects to your OpenSearch cluster and exposes operations—search, aggregations, index management—as reusable tools that all agents can access. Instead of each agent reimplementing OpenSearch interactions, builders simply orchestrate these existing tools for their specific purpose.

### Multi-agent orchestration

The orchestration layer routes incoming requests to the right agent based on context and intent. Agents register their capabilities at startup, and the router matches requests to the most appropriate specialist. If no specialized agent matches the request, a default agent handles general OpenSearch queries. This context-aware routing ensures that users always get a response from the agent best equipped to help.

### AG-UI Protocol

The [AG-UI Protocol](https://github.com/ag-ui-protocol/ag-ui) handles real-time streaming responses between OpenSearch Dashboards and agents. This enables a responsive conversational experience where users see results as they're generated rather than waiting for complete responses.

This architecture—one shared MCP server plus specialized agents and a default agent—eliminates duplicate development and makes creating new agents straightforward.

## The ART agent deep dive


The ART (Automated Relevance Tuning) agent is one of the first specialized agents built on the platform. For a detailed look at how it automates search relevance tuning, see [Introducing OpenSearch Relevance Agent](/blog/introducing-relevance-agent/).

## Key platform features

### Flexible LLM integration

The Agent Server supports LLM integration through AWS Bedrock, allowing you to leverage powerful foundation models for agent reasoning. Additional model providers will be supported in the future.

### Security with on-behalf-of token passing

Security is handled through on-behalf-of (OBO) token passing from OpenSearch Dashboards. When enabled, the Agent Server receives the authenticated user's identity via OBO tokens, ensuring that all OpenSearch operations enforce user-level permissions rather than running under a service account. This preserves proper access controls throughout the request chain.

### Production-ready resilience

The platform includes built-in retry logic with exponential backoff for resilient LLM and OpenSearch interactions, plus structured observability logging to track agent behavior and diagnose issues in production.

### Model Context Protocol (MCP)

At the heart of the system, MCP provides the standardized interface between agents and OpenSearch. It exposes cluster operations as composable tools that agents can orchestrate without reimplementing low-level functionality. This means new agents can immediately leverage the full power of OpenSearch through a well-defined, secure abstraction layer.

## Getting started

### Configuration

Before running the server, you'll need AWS Bedrock credentials for LLM inference. Copy the environment template and add your Bedrock settings:

```bash
cp .env.example .env
```

Add the following to your `.env` file:

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
BEDROCK_INFERENCE_PROFILE_ARN=arn:aws:bedrock:...
```

The rest of the defaults in `.env.example` are pre-configured for local development.

### Running the quickstart

The quickstart script sets up the full development stack in one command: OpenSearch with streaming plugins, OpenSearch Dashboards, the MCP server, the Agent Server, and sample data:

```bash
./scripts/quickstart.sh
```

**Prerequisites:** Java 21+, Node.js 20.x, Python 3.12+, and [uv](https://astral.sh/uv).

### Your first interaction

Once the script completes, open Dashboards at [http://localhost:5601](http://localhost:5601) and look for the chat interface in the upper-right corner.

1. **Try the default agent**: Ask a question such as "How is my cluster health?" The default agent will use the MCP server to query your cluster and stream back results in real time.
2. **Try the ART agent**: Navigate to the Search Relevance page, and the same chat interface automatically routes questions to the ART agent instead. Try asking "What are my most popular queries?" You'll notice different tools being used for search relevance purposes to answer this question.

## Agent development guide

*Section coming soon.* <!-- TODO: Add agent development guide covering custom agent creation, agent interface and requirements, tool execution framework, and best practices -->

## Conclusion and what's next

The OpenSearch Agent Server provides a powerful foundation for building intelligent, specialized agents that transform how users interact with OpenSearch. By leveraging a shared MCP server and multi-agent orchestration, developers can create focused agents that excel at specific tasks without duplicating infrastructure or reimplementing basic OpenSearch operations. The platform ships with security, observability, and flexible LLM integration—but this is just the beginning.

We're actively working on the following enhancements:

- **Agentic memory**: Enabling agents to maintain context across conversations and learn from past interactions.
- **Multimodal support**: Enabling agents that work with images, documents, and other rich data types beyond text.

These enhancements will unlock entirely new classes of agents and use cases.

## Get involved

This is an open-source project and we welcome community contributions. Check out the [OpenSearch Agent Server repository](https://github.com/opensearch-project/opensearch-agent-server) to explore the code, review open issues for areas where you can contribute, and share your ideas for new agents or platform improvements. Whether you're building a custom agent for your use case, enhancing the orchestration layer, or adding new capabilities, your contributions help shape the future of intelligent interactions in OpenSearch.

## Resources

- [OpenSearch Agent Server GitHub repository](https://github.com/opensearch-project/opensearch-agent-server)
- [OpenSearch MCP Server](https://github.com/opensearch-project/opensearch-mcp-server-py)
- [OpenSearch Project](https://opensearch.org)

Start building your specialized agents today and join us in making OpenSearch more intelligent and accessible for everyone.
