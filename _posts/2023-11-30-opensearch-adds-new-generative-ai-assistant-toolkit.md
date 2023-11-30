---
layout: post
title:  "OpenSearch adds a new generative AI assistant toolkit"
authors:
  - jimishsh
  - elifish
  - nitincd
  - jadhanir
date:   2023-11-30 11:30:00 -0700
categories:
  - releases
twittercard:
  description: The OpenSearch Assistant toolkit is here! We’re giving the community the tools to build genAI experiences inside of OpenSearch Dashboards. Learn more on the OpenSearch blog & see how you can start building your AI-powered assistant today!
OpenSearchAssistantDemo: VTiJtGI2Sr4
OpenSearchAssistantMrkt: 9r0RyB_oHKk
meta_keywords: opensearch generative AI, opensearch assistant, opensearch AI assistant, opensearch query assistant, opensearch chat, opensearch machine learning
meta_description: A new toolkit is designed to provide OpenSearch developers with flexible and customizable tools for building generative AI experiences. Integrate natural language processing and contextual awareness features and deploy large language models to deliver interactive user experiences that unlock actionable insights.
---

OpenSearch is widely used by developers to build search and analytics solutions. One of the areas top of mind for our community has been how to use transformative technologies like artificial intelligence (AI) and machine learning (ML) to improve their search and analytics applications. OpenSearch has supported vector database capabilities, like k-NN, since its inception. Over the last year we have continued to innovate by adding new AI/ML features, like conversational search, neural search, and ML model extensibility through [ML Commons](https://opensearch.org/docs/latest/ml-commons-plugin/index/), to the OpenSearch suite of capabilities. Putting these capabilities in place has allowed us to innovate further by incorporating generative AI into OpenSearch. 

Generative AI is changing how users interact with and derive insights from their data. We are excited to share that OpenSearch has released the OpenSearch Assistant, a toolkit designed to provide OpenSearch developers with flexible and customizable tools for building generative AI experiences. By integrating natural language processing and contextual awareness features, this toolkit helps developers use large language models (LLMs) to deliver smart, unique, and interactive user experiences that unlock actionable insights from complex datasets. This is the beginning of the OpenSearch Project’s generative AI journey. We are committed to delivering seamless AI and ML innovations in OpenSearch, helping the community to unlock the potential of generative AI capabilities. 

We invite you to explore the capabilities of the OpenSearch Assistant and imagine how it can be used to solve your search and analytics challenges. Watch the following video to see an example experience built using the OpenSearch Assistant.

{% include youtube-player.html id=page.OpenSearchAssistantMrkt %}

### How does it work? 

The OpenSearch Assistant toolkit comprises a few key building blocks that help developers create AI-powered assistants inside of OpenSearch Dashboards. These building blocks include *skills* that define and automate various tasks performed by the assistant, the *ML framework* that allows OpenSearch to connect the assistant to an LLM or a fine-tuned model, and *UI components* for building interactive conversation-based experiences.

A skill is a lightweight task that the assistant runs for a user. For example, if a user enters “Show me all of my indices”, a single skill would be used to list all of the indices in a cluster. Multiple skills can be combined to answer complex questions, such as “Show me the active alerts on my largest index.” In this case, a skill would first list the indices to find the largest index. Another skill would then list the alert monitors for that index to find the corresponding alerts. This effectively combines two different skills to answer a single question.

We have included a variety of foundational skills, such as *CAT indices*, which lists all indices; *Piped Processing Language (PPL) query generation*, which can convert user-provided natural language prompts into a PPL query; and many more. PPL is a query language that lets you use pipe ( `|` ) syntax to explore, discover, and query data in OpenSearch. These skills are available as part of code repositories for [LangChain](https://github.com/opensearch-project/dashboards-assistant/tree/feature/langchain), [Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/feature/2.11/os-assistant), and the [query assistant](https://github.com/opensearch-project/dashboards-observability/tree/feature/explorer-query-assistant). While the current skills make use of LangChain, the project is working toward incorporating core ML skills that can be conveniently accessed by any OpenSearch feature. If you are interested in learning more about future plans and contributing to the evolution of the OpenSearch Assistant skills, please review and comment on [this RFC](https://github.com/opensearch-project/dashboards-assistant/issues/18).

The ML framework underlying this assistant integrates AI models with OpenSearch Assistant using no-code connectors. It simplifies interactions with AI technologies, making them more accessible and user friendly.

To help developers build impactful user experiences, the toolkit also incorporates several UI components for OpenSearch Dashboards. These components include chat interaction patterns, feature interactions, and a conversational search bar.

### See it in action with our query assistant demo

Imagine using natural language conversations to get answers from your data. Using our new query assistant demo, you can experience the ease of querying your OpenSearch logs. This demo experience is designed to automate and simplify user interactions using natural language prompts. The assistant automatically converts user prompts to PPL queries for the specified data and then summarizes the results in a simple response. The assistant combines the three building blocks we previously mentioned: skills, the ML framework, and UI components. It eliminates the need for deep technical expertise, making observability data insights readily accessible to users of all skill levels. Let us dive into how we built this demo experience using a selected set of skills from the toolkit.

First, we used a few essential skills to construct the workflows. One of these skills is the “PPL Query Generation” skill, which can transform a natural language question into a PPL query. For instance, if you say “Are there any errors in my logs?”, this skill would translate that into the PPL query `source=opensearch_dashboards_sample_data_logs | where QUERY_STRING(['response'], '4* OR 5*')`. This query specifically looks for 4xx and 5xx HTTP response codes in the logs. Additionally, we used the “Summarization” skill to convert the query results into a concise summary for quick analysis. If an error occurs, then the “Suggestion” skill is automatically engaged, which can not only explain the issue but also suggest alternative questions for consideration.

Next, we connected these skills to an LLM to help generate the summary from the query results. The toolkit comes with fine-tuned prompts and connectors for the [Anthropic Claude Instant model](https://www.anthropic.com/index/releasing-claude-instant-1-2). While this example is integrated with Anthropic Claude Instant model, the [ML framework](https://opensearch.org/docs/latest/ml-commons-plugin/extensibility/index/) allows users to integrate with a wider range of LLMs or fine-tuned models specific to their use case. 

Last, we needed to provide an intuitive and interactive OpenSearch Dashboards user experience. This was as simple as embedding the provided search bar UI component into our log explorer interface. The following diagram provides an architectural view of how these parts are used together.

This example experience showcases one of many possible solutions you can build with the OpenSearch Assistant toolkit. We welcome you to try it out by simply logging in to [OpenSearch Playground](https://ai.playground.opensearch.org/) and asking questions. If you’d like to check out the code, it’s all available on GitHub within these repos: [LangChain](https://github.com/opensearch-project/dashboards-assistant/tree/feature/langchain), [Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/feature/2.11/os-assistant), and the [query assistant](https://github.com/opensearch-project/dashboards-observability/tree/feature/explorer-query-assistant). We’ve also built Docker images to help you stand up this demo with your own data by following [these steps](https://github.com/opensearch-project/dashboards-assistant/blob/main/GETTING_STARTED_GUIDE.md). And we’ve created the following video demonstration of the kinds of AI-powered experiences developers can build with the OpenSearch Assistant toolkit.

{% include youtube-player.html id=page.OpenSearchAssistantDemo %}

### What’s next for the OpenSearch Assistant?

This is just the beginning of the OpenSearch Assistant journey, and we look forward to working with you to make OpenSearch a delightful solution for building generative AI–powered applications. As next steps, we will make this toolkit more flexible and customizable and allow you to rebrand it to meet your needs. If you are interested in contributing or need more information, you can refer to [this RFC](https://github.com/opensearch-project/dashboards-assistant/issues/18). If you’d like to share feedback, please use [this OpenSearch forum thread](https://forum.opensearch.org/t/feedback-opensearch-assistant/16741) or the OpenSearch [#assistant-feedback](https://opensearch.slack.com/channels/assistant-feedback) Slack channel. 
