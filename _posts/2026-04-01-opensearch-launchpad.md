---
layout: post
title: "Introducing OpenSearch Launchpad: From requirements to a running search application in minutes"
category: blog
authors:
    - seanzheng
    - bmohammed
date: 2026-04-01
categories:
  - technical-posts
meta_keywords: AI agents, search application, OpenSearch, machine learning, semantic search, vector search, hybrid search, developer tools
meta_description: OpenSearch Launchpad is an AI-powered assistant that guides you from initial requirements to a fully running search setup in minutes—no OpenSearch expertise required. 
---

Modern search is growing rapidly as users demand natural, multimodal, and context-aware retrieval across massive unstructured data. At the same time, search is becoming exponentially more complex, evolving from simple keyword systems into hybrid architectures that combine lexical search, semantic understanding, vector embeddings, and agentic reasoning.

Today’s developers are no longer just building search; they are orchestrating end-to-end retrieval systems by configuring embedding models, chunking strategies, reranking pipelines, and multistage query flows. This shift requires deep expertise across search, machine learning, and distributed systems, changing what was once a straightforward process into a highly specialized discipline.

As a result, there is a significant barrier to iteration. Experimenting with different retrieval strategies---whether tuning hybrid weights, swapping embedding models, or adjusting chunking---often requires reindexing data, reconfiguring infrastructure, and debugging complex interactions. Feedback loops that should have taken minutes stretch into hours or days, forcing teams to either overengineer early or settle for a suboptimal search experience.

Today, the OpenSearch Project is excited to announce **OpenSearch Launchpad**---an AI-powered assistant that guides you through the process, transforming your requirements into a complete running search setup. Whether you're a developer exploring search for the first time, a solution architect designing a production-grade system, or a DevOps engineer looking to automate deployment, OpenSearch Launchpad is built for you.

**⚡ TL;DR**: OpenSearch Launchpad takes you from zero to a working, local search application in minutes—no OpenSearch expertise required.

## The problem we're solving

Building a search application is a multi-step process that demands deep familiarity with its architecture and ecosystem. Even experienced practitioners routinely spend hours tackling the following challenges:

* **Choosing the right search type**: Should you use BM25 for keyword relevance, neural sparse encoding for semantic search, dense vector retrieval for similarity search, or a hybrid approach that combines them all? Each choice has significant implications for index design, performance, and cost.
* **Provisioning the right infrastructure**: Different search types require different cluster configurations, node roles, and resource allocations. Incorrect configuration leads to poor performance or excessive costs.
* **Configuring machine learning (ML) models and ingest pipelines**: Semantic and hybrid search require ML inference pipelines. Configuring them correctly involves navigating model registration, deployment, and pipeline chaining.
* **Building a usable search interface**: Before you can validate your setup, you need some way to actually run queries. Creating even a basic search UI adds yet more work.
* **Deploying your search setup to AWS**: Moving from a local prototype to Amazon OpenSearch Service or Serverless involves a separate layer of configuration, IAM policies, and network settings.

## What OpenSearch Launchpad provides

OpenSearch Launchpad eliminates this complexity by automating the entire journey---guided by agents, driven by your intent.

### No OpenSearch knowledge required

OpenSearch Launchpad handles every technical decision for you. Provide a sample document and describe what you want to search for, and the AI figures out the optimal architecture, mappings, models, and pipelines. You don't need to know the difference between a dense vector and a neural sparse model to configure the correct one for your use case.

### From zero to search in minutes

Traditionally, designing index mappings, deploying ML models, configuring ingest pipelines, and creating a local UI takes hours or days. Now it takes minutes. OpenSearch Launchpad automates every step, so you can focus on building your application rather than managing infrastructure.

### Works in the Kiro IDE

OpenSearch Launchpad ships with Model Context Protocol (MCP) tools, steering files, and a knowledge base that integrate natively with the Kiro IDE and other leading AI-powered development environments. Stay in your existing workflow---no context switching required.

## How it works

OpenSearch Launchpad follows a clear, multi-phase workflow. Each phase is driven by the AI agent, which uses the project's built-in knowledge base and MCP tools to make intelligent decisions on your behalf.

### Phase 1: Collect -- Provide your sample document

You start by giving the agent a representative sample document you want to make searchable. This can be a product catalog entry, a knowledge base article, a support ticket, or any other structured or unstructured content. The agent analyzes the document's schema and content in order to make all downstream decisions.

### Phase 2: Configure -- Share your preferences

The agent gathers your requirements through a guided conversation: What do you want to search? What matters more: keyword precision or semantic similarity? Do you need multilingual support? Should results be boosted by recency or popularity? Your answers shape the architecture.

### Phase 3: Plan -- AI designs your search architecture

Based on your sample document and preferences, the agent produces a detailed search architecture plan. This includes the recommended search type (BM25, neural sparse, dense vector, or hybrid), index mappings, the ML model to use for semantic encoding, and the ingest pipeline configuration. You can review the plan before execution.

### Phase 4: Execute -- AI creates a complete automated setup

With a single confirmation, the agent provisions the necessary resources: it creates an OpenSearch index with the correct mappings, registers and deploys an ML model, configures an ingest pipeline, ingests your sample document, and launches a local search UI so you can immediately start running queries against your new setup.

### Phase 5 (Optional): Evaluate -- Test and refine your search application

Test and refine your search application using the following evaluation approaches:

- **Manual evaluation**: Use the local search UI to run your preferred search queries and assess the relevance and quality of results based on your use case.
- **AI-powered evaluation**: Let the AI agent perform an automated scoring evaluation of your search setup and provide actionable suggestions for improvement.

This step ensures that your search application meets your requirements before deploying it to production.

### Phase 6 (Experimental): Deploy -- Deploy to production on AWS

When you're ready to move beyond local development, the agent can deploy your setup to Amazon OpenSearch Service or Amazon OpenSearch Serverless. It handles the cluster provisioning, configuration translation, and deployment so your local prototype becomes a production-ready service with minimal effort.

## Getting started

OpenSearch Launchpad works in the Kiro IDE. Follow these steps to configure search in minutes.

### Prerequisites

Before starting, ensure that you have the following installed:

* **Docker**: Required to run a local OpenSearch cluster. If you don't have it installed yet, install [Docker Desktop](https://docs.docker.com/desktop/).
* **An AI-powered IDE**: Kiro, Claude Code, Cursor, or any other IDE that supports [Claude skills](https://code.claude.com/docs/en/skills).
* **Node.js 18+ (Optional)**: Required only if you want to build or customize the local search UI.

### Installation

Install OpenSearch Launchpad in your IDE.

#### Kiro

For the Kiro IDE, follow these steps:

1. Open [Kiro IDE](https://kiro.dev/).
2. Go to the **Powers** panel.
3. Select **Add Power** and paste the following link:

```
https://github.com/opensearch-project/opensearch-launchpad/tree/main/kiro/opensearch-launchpad
```

#### Any other IDE that supports skills

For any other IDE that supports skills, such as [Claude Code](https://code.claude.com/docs/en/overview) or [Cursor](https://cursor.com/), follow these steps:

1. Install `opensearch-launchpad` skills into your project:

```bash
npx skills add opensearch-project/opensearch-launchpad
```

2. Install the skill for your specific agent (for example, Claude Code):

```bash
npx skills add opensearch-project/opensearch-launchpad -a claude-code
```

For detailed IDE-specific instructions, see [the project README](https://github.com/opensearch-project/opensearch-launchpad/tree/main).


### Start chatting

After installation, open a chat window in your IDE and start chatting: 

```
I want to build a semantic search app with 10M docs
```


**💡 Tip**: Use a real sample document from your own dataset. The more representative your sample document, the better the agent's architecture recommendations for your production use case.


## What's in the repository

The OpenSearch Launchpad repository contains all the resources the AI agent needs to design, plan, and implement your search setup.

### Knowledge base

The knowledge base provides all the instructions, scripts, and reference materials organized by skill area.

| Component | Description |
|-----------|-------------|
| `skills/` | Root directory containing all agent skills, each as a self-contained module with instructions, scripts, and reference materials. |
| `skills/opensearch-launchpad/` | The main agent skill for deploying and configuring OpenSearch. Contains concise instructions (SKILL.md ≤ 500 lines), execution scripts for automating OpenSearch setup, and reference materials loaded dynamically during each workflow phase. |
| `└ SKILL.md` | Skill instructions kept under 500 lines for clarity and fast agent loading. |
| `└ scripts/` | Execution scripts that automate OpenSearch provisioning and configuration tasks. |
| `└ references/` | Reference materials loaded on demand per workflow phase to keep context lean. |
| `skills/search-relevance/` | Skill for query tuning, ranking optimization, and search relevance evaluation. |
| `skills/log-analytics/` | Skill covering log ingestion pipelines, parsing strategies, and dashboard creation. |
| `skills/observability/` | Skill for distributed traces, metrics collection, and system monitoring. |

### Integrations and infrastructure

These components enable the AI agent to interact with OpenSearch and integrate with development environments.

| Component | Description |
|-----------|-------------|
| `kiro/` | Integration files for Kiro Power, enabling seamless agent operation within the Kiro IDE environment. Provides the IDE-native execution path. |
| `opensearch_orchestrator/` | Model Context Protocol (MCP) server that exposes OpenSearch operations as callable functions for AI agents. Used exclusively on the Kiro Power execution path. |

### Quality assurance

The test suite validates the functionality and reliability of all agent capabilities.

| Component | Description |
|-----------|-------------|
| `tests/` | Comprehensive test suite ensuring reliability and correctness across all agent capabilities and skill workflows. |

## Looking ahead

OpenSearch Launchpad is just getting started. Our vision is to continuously expand what the agent can do, turning it into a comprehensive companion for the entire OpenSearch development lifecycle. Some of the features we're planning to add include:

* **Advanced search relevance tuning**: Use your own set of queries for evaluation and apply tuning improvements based on your feedback.
* **Observability and monitoring**: Add support for dashboards, alerting rules, and query performance monitoring for your OpenSearch cluster.
* **Enhanced search application**: Add more document views, including conversational search and multimodal search.
* **Agent evaluation support**: Enable AI-agent-powered automated evaluation to ensure the accuracy and quality of the OpenSearch Launchpad assistant as the knowledge base and the number of use cases grow.
* **Cloud support**: Expand AWS service support (currently experimental), including support for the Amazon OpenSearch Ingestion service.

The roadmap is driven by the community. Every new capability starts as a conversation, an issue on GitHub, or a pull request addressing a specific need. That's why your participation matters so much.

## Get involved

Whether you're building your first search application or deploying production systems, OpenSearch Launchpad is an open-source project that grows through community contribution.

You can contribute in the following ways:

* **File an issue**: Encountered a bug or have a feature request? Open an issue on GitHub.
* **Submit a pull request**: Add new MCP tools, expand the knowledge base, improve IDE steering files, or enhance the search UI.
* **Share your experience**: Tried OpenSearch Launchpad with your own dataset? We'd love to hear what worked, what didn't, and what you wish OpenSearch Launchpad could do.
* **Improve the documentation**: Great documentation is a contribution too: help us make the getting started experience even smoother.
* **Spread the word**: If OpenSearch Launchpad saved you time, share your experience with your team or write a blog post.

OpenSearch Launchpad configures your infrastructure so you can focus on what matters: building great search experiences for your users. We're excited to see what you build. Clone the repository, try it with your own data, and let us know what you think.

**⭐ Star and get involved in [the `opensearch-launchpad` repo](https://github.com/opensearch-project/opensearch-launchpad/tree/main)**.

Questions? Join the conversation on the OpenSearch [community forum](https://forum.opensearch.org/) and in the OpenSearch Slack channel.

## Acknowledgments

We would like to extend our sincere gratitude to the following contributors for their valuable contributions to this project:

* [@arjunkumargiri](https://github.com/arjunkumargiri)
* [@chenyang-ji](https://opensearch.org/author/chenyang-ji/)
* [@fen-qin](https://github.com/fen-qin)
* [@janellearita](https://github.com/janellearita)
* [@kaituo](https://github.com/kaituo)
* [@krishna-kondaka](https://opensearch.org/author/krishna-kondaka/)
* [@owaiskazi19](https://github.com/owaiskazi19)
* [@peterzhuamazon](https://github.com/peterzhuamazon)
* [@saratvemulapalli](https://github.com/saratvemulapalli)
* [@zhichao-aws](https://github.com/zhichao-aws)

Your dedication, expertise, and collaborative spirit have been instrumental in making this project successful. Thank you for your time and contributions.
