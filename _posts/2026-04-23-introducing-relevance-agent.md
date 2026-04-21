---
layout: post
title:  "Introducing OpenSearch Relevance Agent: AI-Powered Search Tuning"
authors:
 - bmohammed
 - dwrigley
date: 2026-04-23
categories:
 - feature
 - releases
meta_keywords: search relevance, agent, search quality, relevance optimization, relevance tuning
meta_description: OpenSearch Relevance Agent automates relevance optimization from diagnosis to deployment, reducing tuning cycles from weeks to hours.
excerpt: The OpenSearch Project introduces a faster, smarter way to optimize your search experience. The OpenSearch Relevance Tuning Agent is designed to automate the heavy lifting for search relevance tuning, allowing you to move from "best guess" tuning to data-driven precision in a fraction of the time. OpenSearch Relevance Agent continuously analyzes user behavior signals and query patterns, generates data-driven hypotheses, and validates improvements through rigorous offline evaluation.  
has_math: false
has_science_table: false
---

Improving search relevance isn't a "set it and forget it" task. It’s a constant balancing act between what a user types and what they actually want. If someone searches for "apple," are they looking for a snack, a new phone, or a stock price?

For most teams, solving this means navigating three massive hurdles:

* **The Intent Gap:** Decoding ambiguous queries and balancing precision (getting exactly the right results) with recall (getting enough results).  
* **The Data Struggle:** Dealing with "noisy" metadata or niche datasets where information is sparse or incomplete.  
* **The Scale Problem:** What works in a small test environment often falls apart when hit with the chaotic, high-volume reality of production traffic.

## The problem with the "Old Way"

Traditionally, tuning relevance is a marathon. It often takes months of manual tweaking by search experts to find the "perfect" settings. But in the modern enterprise, data doesn't stay still. Seasonal trends and evolving product catalogs expand the search space faster than humans can keep up.

This leaves organizations stuck in a cycle of reactive tuning, struggling to maintain high-quality results across millions of unique queries.

## Automate search quality

To break this cycle, the OpenSearch Project introduces a faster, smarter way to optimize your search experience. The **OpenSearch Relevance Agent** is designed to automate the heavy lifting, allowing you to move from "best guess" tuning to data-driven precision in a fraction of the time. OpenSearch Relevance Agent continuously analyzes user behavior signals and query patterns, generates data-driven hypotheses, and validates improvements through rigorous offline evaluation. 

Through a conversational interface in OpenSearch Dashboards, developers interactively identify relevance issues, receive guided tuning recommendations, and execute complex workflows using natural language. This makes advanced relevance optimization accessible to all teams. 

OpenSearch Relevance Agent delivers immediate value in any environment. While it's designed to leverage User Behavior Insights (UBI) data when available for deeper optimization, UBI is not required to begin transforming your relevance workflow. Future releases will add support for additional data sources.

Leveraging the full capabilities of the Search Relevance Workbench, OpenSearch Relevance Agent enables end-to-end experimentation, from creating query sets and judgment lists, to running controlled tests and quantifying impact using standard relevance metrics. The system orchestrates a systematic, automated tuning workflow that abstracts the complexity of relevance engineering. In [OpenSearch 3.6](https://opensearch.org/blog/introducing-opensearch-3-6/), it delivers immediate impact through actionable DSL-level optimizations such as refining search fields, adjusting weights, and tuning boost functions.

OpenSearch Relevant Agent is one of the agents supported in OpenSearch Agent Server in 3.6 as an experimental release. The [OpenSearch Agent Server](https://github.com/opensearch-project/opensearch-agent-server) is a multi-agent orchestration platform that enables developers to build specialized AI agents that work together within OpenSearch.

## Empowering teams to deliver better search, faster

* **Accelerated Developer Velocity**: Reduce *time-to-diagnose and fix relevance issues* from days or weeks to hours. OpenSearch Relevance Agent automates root-cause analysis and tuning workflows, enabling rapid iteration and faster release cycles.  
* **Democratization of Relevance Engineering**: Eliminate dependency on scarce search relevance experts. OpenSearch Relevance Agent empowers any developer or product team to confidently tune search quality through guided, agent-driven workflows—lowering the barrier to entry across the organization.  
* **Evidence-Driven Confidence**: Replace intuition-based tuning with **automated evaluation and validation loops**. OpenSearch Relevance Agent continuously tests changes against real queries and datasets, ensuring improvements are measurable, explainable, and free from unintended regressions.  
* **Human-in-the-Loop Control**: Maintain full oversight of the optimization process through a collaborative approach. While OpenSearch Relevance Agent automates the heavy lifting, the user remains the ultimate decision-maker—steering the agent's direction, providing critical domain-specific context, and refining recommendations to ensure they align perfectly with unique business requirements and expert intuition.

## How it works: A multi-agent system built for OpenSearch

OpenSearch Relevance Agent enables users to enter the conversation at any stage of the search improvement cycle, whether starting from scratch with a diagnostic check or bringing specific hypotheses for immediate validation. Instead of a single bot trying to do everything, the Relevance Agent uses a **multi-agent system**. Think of it as a specialized task force led by an **Orchestrator** that manages three experts in a three-agent workflow:

1. **User Behavior Analysis Agent** surfaces relevance gaps by analyzing UBI data (when available) or query patterns  
2. **Hypothesis Generator Agent** interprets results to create data-driven tuning strategies  
3. **Evaluator Agent** validates strategies by running automated tests against offline evaluation sets within the Search Relevance Workbench

## Under the hood: Built for the OpenSearch ecosystem

![OpenSearch Relevance Agent Embedded in the OpenSearch Ecosystem](/assets/media/blog-images/2026-04-23-introducing-relevance-agent/artchitecture_overview.png)

The OpenSearch Relevance Agent is not just a standalone tool; it’s a service that lives where you already work.

* **Seamless integration:** Built on the **Strands SDK**, the agent plugs directly into your OpenSearch Dashboards chat through the [**AG-UI standard**](https://github.com/ag-ui-protocol/ag-ui).  
* **The MCP Server:** All agents communicate through the [**OpenSearch Model Context Protocol (MCP) server**](https://github.com/opensearch-project/opensearch-mcp-server-py/). This acts as a secure translator between the AI and your search engine.  
* **Facts Over "Feelings":** To prevent the AI from "hallucinating" numbers, we offload complex metric calculations to deterministic tools, ensuring that every KPI and relevance metric reported back to the user is grounded in rigorous, error-free analysis.

All agents communicate with the search engine exclusively through the **OpenSearch MCP server**. This abstraction layer allows OpenSearch Relevance Agent to leverage the full power of the Search Relevance Workbench through standardized tools. 

The system utilizes specialized tools within the agent environment designed specifically to handle complex metric calculations. By offloading these computations from the LLM to deterministic tools, OpenSearch Relevance Agent significantly reduces the risk of hallucinations or mathematical estimations, ensuring that every KPI and relevance metric reported back to the user is grounded in rigorous, error-free analysis.

## Getting started with OpenSearch Relevance Agent

Follow these steps to configure OpenSearch Relevance Agent in minutes.

### Pre-requisites

For the quickstart script you need Java 21+, Node.js 20+, Python 3.12+, [`uv`](https://astral.sh/uv), yarn, `jq`, curl as prerequisites and access to a Large Language Model hosted on Amazon Bedrock. More model providers will be supported in the future. 

**1. Clone the repository**

First, clone the OpenSearch Agent Server repository and navigate into the project folder:
```bash
git clone https://github.com/opensearch-project/opensearch-agent-server.git
```

**2. Configure environment variables**

Create your local environment file from the provided template:

```bash
cp .env.example .env
```

Open the .env file in your preferred editor. You will need to provide your Amazon Bedrock credentials and configuration.

**Note**: Ensure your AWS IAM user has the necessary permissions for Bedrock model invocation.

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
BEDROCK_INFERENCE_PROFILE_ARN=arn:aws:bedrock:...
```

**3. Launch the quickstart script**

Run the automated setup script. This will download, configure, and launch all necessary components, including OpenSearch, Dashboards, and the Agent Server.

```bash
./scripts/quickstart.sh
```

This process typically takes a few minutes. If you see a "OpenSearch Dashboards did not load properly" error in your browser, please wait another 2-3 minutes for the backend services to fully initialize.

**4. Start tuning**

Once the setup is complete, navigate to [http://localhost:5601](http://localhost:5601).

* Dashboards will automatically open a preconfigured **Search Workspace**.  
* Click the **"Ask AI"** button in the top-right corner to open the OpenSearch Relevance Agent interface.  
* **Try this prompt:** *"What are "underperforming" queries of the past two years?"*

The agent will immediately begin analyzing the sample UBI data indexed during the quickstart and provide a detailed summary of findings.

![OpenSearch Relevance Agent Feedback](/assets/media/blog-images/2026-04-23-introducing-relevance-agent/relevance_agent_feedback.png)

## What’s next

While OpenSearch 3.6 marks a significant leap in streamlining search quality, it is only the beginning. The project is already exploring the future where relevance engineering is more dynamic, expansive, and increasingly autonomous.

### Closing the loop with online testing

Currently, OpenSearch Relevance Agent excels at offline evaluation using historical data. Our next major milestone is extending the improvement cycle into the **online production environment**. We are planning to enable OpenSearch Relevance Agent to orchestrate **Interleaving** tests—a technique that blends results from different tuning strategies in real-time. By analyzing which results users actually click on in a live setting, OpenSearch Relevance Agent will be able to capture user feedback faster than traditional A/B testing, allowing for even more rapid and precise iteration.

### Expanding the optimization surface

The current version of OpenSearch Relevance Agent focuses on powerful DSL-level adjustments. We plan to expand the agent’s "toolbox" to include **complex index-level operations** and **advanced optimization techniques**. This includes:

* **Schema Evolution:** Recommending and executing changes to mappings, such as adding sub-fields or changing tokenizers.  
* **Vector & Hybrid Tuning:** Optimizing k-NN parameters and balancing lexical and semantic weights in hybrid search architectures.  
* **Automated Learning to Rank (LTR):** Training and deploying sophisticated ranking models that use machine learning to weigh hundreds of features simultaneously. OpenSearch Relevance Agent will help automate the feature engineering and model training lifecycle, moving beyond manual boost functions to a truly optimized ranking experience.

### Universal data connectivity through MCP

While OpenSearch Relevance Agent is optimized to leverage OpenSearch’s native User Behavior Insights (UBI), we recognize that every organization has a unique data ecosystem. Our vision is to make OpenSearch Relevance Agent a truly data-agnostic engine by utilizing the **Model Context Protocol (MCP)** to connect with external signals.

Whether your user behavior data lives in **Google Analytics**, **Matomo**, or enterprise data warehouses like **Snowflake** and **BigQuery**, OpenSearch Relevance Agent will be able to dynamically pull these signals into the tuning loop. By treating these platforms as plug-and-play data sources, we ensure that OpenSearch Relevance Agent can ground its recommendations in whatever source of truth you use to track user success—transforming OpenSearch Relevance Agent from a specialized plugin into a universal relevance orchestrator.

## How you can contribute

OpenSearch Relevance Agent represents a fundamental shift in how organizations approach search relevance, moving from manual, intuition-driven tuning to a systematic, agent-driven, and continuously improving workflow. By combining multi-agent intelligence, conversational interfaces, and rigorous evaluation frameworks, OpenSearch Relevance Agent not only accelerates developer productivity but also democratizes relevance engineering across teams.

As search systems evolve toward more dynamic, hybrid, and agentic architectures, OpenSearch Relevance Agent lays the foundation for a future where relevance optimization is always-on, deeply data-driven, and seamlessly integrated into the development lifecycle, enabling organizations to deliver consistently high-quality search experiences at scale.

OpenSearch Relevance Agent is an open-source project under the OpenSearch Project umbrella, and it grows through community contribution. Whether you want to add support for a new relevance feature, improve the relevance agent, or simply share feedback from your experience, we want to hear from you. [Clone the repository](https://github.com/opensearch-project/opensearch-agent-server), try it with your own data, and share your results with the community.

⭐ **Star us and get involved in the [OpenSearch Agent Server repository](https://github.com/opensearch-project/opensearch-agent-server) on GitHub**
Questions? Join the conversation in the OpenSearch [community forum](https://forum.opensearch.org/) and Slack.

### Acknowledgments

We would like to extend our sincere gratitude to the following contributors for their valuable contributions to this project:

* [Sean Zheng](https://github.com/sean-zheng-amazon)
* [Janelle Arita](https://github.com/janellearita)
* [Mingshi Liu](https://github.com/mingshl)
* [Jiaping Zeng](https://github.com/jiapingzeng)
* [Eric Pugh](https://github.com/epugh)
* [David Mackey](https://github.com/davidshq)
* [Andreas Wagenmann](https://github.com/awagen)
* [Craig Perkins](https://github.com/cwperks)

Your dedication, expertise, and collaborative spirit have been instrumental in making this project successful. Thank you for your time and contributions.
