---
layout: post
title: "Bringing intelligence to OpenSearch: Introducing the OpenSearch agent server"
authors:
  - mingshl
  - jiapingzeng
  - pohongl
date: 2026-05-07
categories:
  - technical-posts
  - feature
meta_keywords: OpenSearch agent server, multi-agent orchestration, AI agents, MCP server, Model Context Protocol, AG-UI Protocol, search relevance, agentic AI, OpenSearch Dashboards, AWS Bedrock
meta_description: Introducing the OpenSearch agent server, a multi-agent orchestration platform that enables developers to build specialized AI agents that collaborate within OpenSearch through an intelligent routing layer.
excerpt: The OpenSearch agent server is a multi-agent orchestration platform released as experimental in OpenSearch 3.6. You can use it to build specialized AI agents that collaborate through an intelligent routing layer. Each agent provides distinct expertise and tools, transforming how users interact with OpenSearch.
has_math: false
has_science_table: false
---

Real-world OpenSearch deployments serve diverse users: developers querying logs, analysts exploring metrics, engineers optimizing search, and business users seeking insights. A single generalist assistant trying to handle these different tasks sacrifices depth in each area. What if you could match the right specialist assistant to each task?

The **OpenSearch agent server**, released as experimental in OpenSearch 3.6, is a multi-agent orchestration platform that enables you to build specialized AI agents that work together within OpenSearch. The agent server platform provides infrastructure for creating focused agents---each with distinct expertise and tools---that collaborate through an intelligent routing layer. 

A default agent serves as a general assistant for broad queries, while specialized agents handle specific domains such as search relevance tuning. The first specialized agent available is the Automated Relevance Tuning (ART) agent. For more information, see [Introducing OpenSearch Relevance Agent](https://opensearch.org/blog/introducing-relevance-agent/).

In this post, we'll describe the agent server architecture, its key features, and how to start building your own agents.

## Architecture and core concepts

The agent server is built on three foundational components: a standalone Model Context Protocol (MCP) server, a multi-agent orchestration layer, and the Agent-User Interface (AG-UI) protocol for real-time streaming, as shown in the following image.

![OpenSearch agent server architecture showing Dashboards, orchestration layer, agents, MCP server, and OpenSearch cluster](/assets/media/blog-images/2026-05-07-introducing-opensearch-agent-server/architecture.jpg)

### The OpenSearch MCP server

The foundational layer is a standalone [OpenSearch MCP server](https://github.com/opensearch-project/opensearch-mcp-server-py). This server connects to your OpenSearch cluster and exposes search, aggregation, and index management operations as reusable tools accessible to all agents.

### Multi-agent orchestration

The orchestration layer routes incoming requests to the right agent based on context and intent. Agents register their capabilities at startup, and the router matches requests to the most appropriate specialist. If no specialized agent matches the request, a default agent handles general OpenSearch queries. This context-aware routing ensures that users always get a response from the agent best equipped to help.

### AG-UI protocol

The [AG-UI protocol](https://github.com/ag-ui-protocol/ag-ui) handles real-time streaming responses between OpenSearch Dashboards and agents. This enables a responsive conversational experience in which users receive results continuously rather than waiting for complete responses.

Because all agents share the same MCP server, you don't need to reimplement OpenSearch operations for each new agent.

## Agent server capabilities

The agent server includes the following built-in capabilities for production use.

### Flexible LLM integration

The agent server supports large language model (LLM) integration through Amazon Bedrock, allowing you to use powerful foundation models for agent reasoning. Additional model providers will be supported in the future.

### Security with on-behalf-of token passing

Security is handled through on-behalf-of (OBO) token passing from OpenSearch Dashboards. When enabled, the agent server receives the authenticated user's identity through OBO tokens, ensuring that all OpenSearch operations enforce user-level permissions rather than running under a service account. This preserves proper access controls throughout the request chain.

### Production-ready resilience

The platform includes built-in retry logic with exponential backoff for resilient LLM and OpenSearch interactions, plus structured observability logging to track agent behavior and diagnose issues in production.

### Model Context Protocol (MCP)

MCP provides the standardized interface between agents and OpenSearch. It exposes cluster operations as composable tools that agents can orchestrate without reimplementing low-level functionality. New agents can immediately use the full capabilities of OpenSearch through a well-defined, secure abstraction layer.

## Getting started

To get started with the agent server, follow these steps.

### Prerequisites

Before running the server, install the following tools and configure Amazon Bedrock credentials:

- Java 21+
- Node.js 20.x
- Python 3.12+
- [`uv`](https://astral.sh/uv)
- Amazon Bedrock credentials for LLM inference

Copy the environment template and add your Bedrock settings:

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

The rest of the defaults in `.env.example` are preconfigured for local development.

### Running the quickstart

The quickstart script configures the full development stack using one command. It sets up OpenSearch with streaming plugins, OpenSearch Dashboards, the MCP server, the agent server, and adds sample data:

```bash
./scripts/quickstart.sh
```

### Installing from PyPI

If you already have an OpenSearch cluster running and don't need the full quickstart setup, you can install and run the agent server directly from PyPI:

```bash
pip install opensearch-agent-server
```

Configure your environment:

```bash
export OPENSEARCH_URL=https://localhost:9200
export OPENSEARCH_USERNAME=admin
export OPENSEARCH_PASSWORD=admin
export AG_UI_AUTH_ENABLED=false
```

Start the agent server and MCP server together in a single process:

```bash
opensearch-agent-server --with-mcp
```

This command starts both the OpenSearch MCP server (port 3001) and the agent server (port 8001). To stop both servers, press `Ctrl/Cmd+C`. You can verify that both services are running by running the following commands:

```bash
curl http://localhost:8001/health    # {"status": "ok"}
curl http://localhost:8001/agents    # list registered agents
```

For more options, including customizing the MCP server port and configuration, see the [OpenSearch agent server README](https://github.com/opensearch-project/opensearch-agent-server#pypi-installation).

### Your first interaction

Once the script completes, go to OpenSearch Dashboards at [http://localhost:5601](http://localhost:5601) and open the chat interface in the upper-right corner. Then try the agents:

1. **Try the default agent**: Ask a question such as _"How is my cluster health?"_ The default agent will use the MCP server to query your cluster and stream back results in real time.
2. **Try the ART agent**: When you navigate to the **Search Relevance** page, the same chat interface automatically routes questions to the ART agent. Try asking _"What are my most popular queries?"_ You'll notice different tools being used for search relevance purposes to answer this question.

## What's next
 
We're actively working on the following enhancements that will enable entirely new classes of agents and use cases:

- **Agentic memory**: Enabling agents to maintain context across conversations and learn from past interactions.
- **Multimodal support**: Enabling agents that work with images, documents, and other rich data types beyond text.

## Get involved

The OpenSearch agent server is an open-source project, and we welcome community contributions. You can explore the code in the [OpenSearch agent server repository](https://github.com/opensearch-project/opensearch-agent-server), review open issues for areas where you can contribute, and share your ideas for new agents or platform improvements. Whether you're building a custom agent for your use case, enhancing the orchestration layer, or adding new capabilities, your contributions help shape the future of intelligent interactions in OpenSearch.

## Resources

For more information, see the following resources:

- [OpenSearch agent server GitHub repository](https://github.com/opensearch-project/opensearch-agent-server)
- [OpenSearch MCP Server](https://github.com/opensearch-project/opensearch-mcp-server-py)
- [OpenSearch MCP Server documentation](https://docs.opensearch.org/latest/ai-agent-integrations/mcp-server/index/)
