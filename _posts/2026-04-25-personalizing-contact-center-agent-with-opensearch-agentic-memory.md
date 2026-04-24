---
layout: post
title: "Personalizing Your Contact Center Agent with OpenSearch Agentic Memory"
authors:
 - hfukamori
 - hsotaro
 - dhrubo
 - hangzuo
 - ylwu
date: 2026-04-25
categories:
 - technical-post
meta_keywords: ""
meta_description: ""
excerpt: "Contact center customers shouldn't have to repeat themselves on every call. In this post we show how to give an AI contact center agent persistent, cross-session memory using OpenSearch Agentic Memory — with semantic and hybrid search that retrieves exactly the facts the agent needs, when it needs them."
---

Have you ever built a contact center AI agent, only to realize it treats every call like the first? Most contact center systems lose conversational context the moment a call ends. The life events, preferences, and concerns that surface naturally in conversation — the information that would make your agent genuinely helpful — don't carry over to the next interaction.

In this post, we show how [OpenSearch Agentic Memory](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory/) gives your contact center AI agent persistent, personalized memory across calls, with three memory strategies working simultaneously and semantic search for targeted retrieval. We'll use a wealth management contact center agent as a running example throughout. Wealth management is a natural fit because the customer conversations are inherently unstructured and evolving: clients discuss retirement plans, life changes, and risk preferences across multiple calls over months or years. No single call tells the full story, and the context your agent needs shifts as the client's life does. This makes it an ideal scenario to demonstrate all three memory strategies working together.

## What Is "Memory" for an AI Agent?

LLMs are stateless — every conversation starts from zero. If your AI agent needs to remember anything across interactions, that memory must be built externally. This means three things: **store** relevant information automatically as conversations happen, **retrieve** the right memories at the right time, and **evolve** them as new information arrives. For a deeper look at how these capabilities work under the hood, see [OpenSearch as an Agentic Memory Solution](https://opensearch.org/blog/opensearch-as-an-agentic-memory-solution-building-context-aware-agents-using-persistent-memory/).

## Why OpenSearch for Agentic Memory

For many use cases, vector similarity alone is enough to get started. But as a contact center scales, recall queries may need to combine semantic relevance ("conversations about retirement planning"), keyword precision ("portfolio rebalancing"), and temporal filtering ("from the last 90 days"). OpenSearch handles all three as native hybrid search, so you don't have to stitch together multiple systems when that need arises.

OpenSearch also offloads memory construction — both short-term and long-term — from the agent to the data store. Short-term memory (session context and running summaries) and long-term memory (extracted facts and user preferences) are both managed server-side through Agentic Memory's processing strategies. Rather than building extraction, embedding, and memory management logic in your agent code, you send a conversation and let OpenSearch handle the rest. Your agent stays focused on the conversation, and you can improve extraction quality or swap embedding models without touching agent code.

Concretely, Agentic Memory wraps these capabilities into a purpose-built API:

* **[Memory containers](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory/#memory-containers)** — Per-customer isolation through namespaces within a single container.
* **[Three processing strategies](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory/#memory-processing-strategies)** — SEMANTIC (facts), USER_PREFERENCE (preferences), and SUMMARY (session context) run simultaneously.
* **[Automatic fact extraction](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory/#inference-mode)** — Add a conversation with `infer: true` and the LLM extracts structured facts, detects preferences, and generates summaries automatically.
* **[Semantic search](https://docs.opensearch.org/latest/ml-commons-plugin/api/agentic-memory-apis/semantic-search-memory/)** — Ask a question in natural language, get the memories that matter.

To set up agentic memory in OpenSearch from scratch, see the [OpenSearch Agentic Memory blog post](https://opensearch.org/blog/opensearch-as-an-agentic-memory-solution-building-context-aware-agents-using-persistent-memory/).

## What We Built

### Prerequisites

To follow along with the examples in this post, you need:

* **OpenSearch 3.6.0 or later** with the **ML Commons plugin** enabled — Agentic Memory is part of the ML Commons plugin, introduced in OpenSearch 3.3. The semantic and hybrid search APIs for Agentic Memory used in this post require OpenSearch 3.6.0. You can run OpenSearch locally using [Docker](https://docs.opensearch.org/latest/install-and-configure/install-opensearch/docker/). The ML Commons plugin is included by default in the standard distribution.
* **An LLM registered in ML Commons** — For fact extraction via `infer: true`. LLMs are typically registered via a [remote connector](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/connectors/) to a hosted API (for example, Amazon Bedrock, OpenAI, or Cohere).
* **A text embedding model registered in ML Commons** — For semantic search. We recommend using a [remote model](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/index/) (such as Amazon Bedrock Titan, OpenAI, or Cohere embeddings) so embedding capacity scales independently of your OpenSearch cluster. [Pretrained local models](https://docs.opensearch.org/latest/ml-commons-plugin/pretrained-models/) (e.g., `all-MiniLM-L12-v2`) also work and are convenient for quick experimentation.

The core pattern has three phases: **greet** the customer using their name from memory, **converse** naturally with on-demand memory retrieval, and **remember** the entire conversation when the session ends.

![Figure 1: Call Lifecycle — three phases of a session: greet, converse, and remember.](/assets/media/blog-images/2026-04-25-personalizing-contact-center-agent-with-opensearch-agentic-memory/call-lifecycle.png)
*Figure 1: Call Lifecycle — three phases of a session: greet, converse, and remember.*

### Where Agentic Memory Fits

Agentic Memory handles memory _between_ sessions. During a call, the conversation context is managed by the agent framework itself (the LLM's context window, session state, etc.). Agentic Memory's role is to persist what matters _after_ the call ends and surface relevant memories _during_ the next call — not by loading everything upfront, but by letting the agent search for specific memories when the conversation requires them.

### How Data Flows Into Memory

When the agent sends a conversation with `infer: true`, two things happen:

* The raw conversation is stored in **working** memory — an unprocessed log of what was said.
* The LLM extracts structured knowledge and stores it in **long-term** memory — facts, preferences, and summaries, each with an embedding for semantic search.

With `infer: false` (the default), only step 1 happens — the raw conversation goes into working memory, but no extraction occurs.

The agent reads from long-term memory via semantic search, querying for specific information as the conversation needs it (e.g., "retirement plans" or "risk tolerance"). Working memory serves as a raw conversation log — useful for auditing, debugging, or re-extracting knowledge if you change your LLM or strategies later — but is not queried by the agent during conversations.

### User Isolation Within a Memory Container

All users share the same physical storage (working and long-term indexes) within a memory container. Isolation is logical, not physical — each memory is tagged with a **namespace** (in our case, `customer_id` set to the caller's phone number). When the agent searches for memories, it filters by namespace, so each client only sees their own history.

```
Memory Container
  ├── working index (shared by all users)
  │     ├── messages: [raw conversation turns]
  │     ├── namespace: {customer_id: "+1-555-0123"}  ← per-user filter
  │     └── infer: true/false
  │
  └── long-term index (shared by all users)
        ├── memory: "Client prefers conservative investments"  ← extracted knowledge
        ├── memory_embedding: [...]  ← for semantic search
        ├── strategy_type: SEMANTIC | USER_PREFERENCE | SUMMARY
        └── namespace: {customer_id: "+1-555-0123"}  ← per-user filter
```

To demonstrate this end-to-end, we integrated Agentic Memory into a voice-based AI agent for a wealth management contact center. The agent handles phone calls using a speech-to-speech LLM — what it lacked was the ability to remember clients across calls.

With Agentic Memory added, the agent now:

* Remembers every client across calls using three memory strategies simultaneously (`SEMANTIC`, `USER_PREFERENCE`, `SUMMARY`)
* Retrieves only relevant memories using semantic and hybrid search
* Builds a richer picture of each client over time, without any custom memory infrastructure

Here's what the experience looks like — first without memory, then with it:

**Without memory — every call starts from zero:**

**Call 1 — Retirement planning:** A client calls to discuss retiring in five years. They explain their portfolio, risk concerns, and timeline. The agent has a productive conversation. Agent: "A five-year timeline gives us good room to rebalance gradually. Shall I prepare some options for you and your wife to review together?"

**Call 2 — Client calls back about a life change:** Client: "I've been thinking about what we discussed. Also, my wife and I are thinking about moving to a smaller house." Agent: "I'd be happy to help. Could you tell me a bit about your current financial situation and goals?"

The agent has no idea what "what we discussed" refers to. The client has to re-explain the retirement plan, portfolio composition, and risk preferences from scratch.

**Call 3 — Client mentions a new goal:** Client: "My daughter just had a baby. I want to set up an education fund for my grandchild." Agent: "That's wonderful! I can help with education fund options. What's your current financial situation and risk tolerance?"

The agent can't connect the education fund to the retirement plan or the home sale — because it doesn't know about either.

**With Agentic Memory — context carries over:**

**Call 1 — Retirement planning:** A client calls to discuss retiring in five years. They have a sizable portfolio and want to shift toward more conservative investments. The AI agent discusses options, and the conversation — including the client's risk concerns and timeline — is automatically extracted and stored in memory.

**Call 2 — Life change:** The same client calls a month later. Client: *"I've been thinking about what we discussed. Also, my wife and I are thinking about moving to a smaller house."* Agent: *"Welcome back! Last time we talked about shifting your portfolio toward more conservative investments ahead of your retirement in five years. Selling your current home could free up significant capital — would you like me to model how the proceeds might accelerate your rebalancing timeline? I can prepare options for you and your wife to review together, the way you prefer."*

**Call 3 — New goal:** Client: *"My daughter just had a baby. I want to set up an education fund for my grandchild."* Agent: *"Congratulations! Given your retirement plan and the potential home sale we discussed, you have some flexibility. A conservative education fund that complements your overall plan would make sense — and it wouldn't require changing your rebalancing strategy. Shall I put together a few options for you and your wife to look at?"*

The client said "education fund." The agent heard it in the context of an entire financial life.

Without memory, every interaction starts cold. Clients repeat themselves, agents miss context, and opportunities to deepen the relationship slip by unnoticed. A client mentions selling their house — but the agent doesn't know about the retirement plan, so it can't connect the dots. A grandchild is born — but without knowing the full financial picture, the agent offers generic advice instead of something tailored.

With memory, the agent picks up where the last conversation left off. Clients feel known. Agents spend time advising, not catching up. And when a life event opens a new financial need, the agent sees it — because it remembers the whole picture. The difference isn't just efficiency. It's the difference between a service that processes transactions and one that builds relationships.

## Architecture Overview

The architecture is intentionally component-agnostic. You can swap any component for your preferred alternative — the memory layer works the same regardless of whether your agent is voice-based, chat-based, or API-driven. In our implementation, we used a contact center with a speech-to-speech LLM, but the OpenSearch components (Agentic Memory and the LLM + Embedding model that supports it) are the same for any agent.

![Figure 2: Architecture overview — AI Agent orchestrates S2S LLM, OpenSearch Agentic Memory, and the LLM + Embedding model used by memory.](/assets/media/blog-images/2026-04-25-personalizing-contact-center-agent-with-opensearch-agentic-memory/architecture.png)
*Figure 2: Architecture overview — AI Agent orchestrates S2S LLM, OpenSearch Agentic Memory, and the LLM + Embedding model used by memory.*

Five components:

* **Contact Center** — Receives calls and bridges telephony to the AI agent. Cloud-based or on-premises — the memory layer works the same.
* **AI Agent** — Orchestrates the conversation. Searches memory on demand during the call, writes memory when the call ends, applies business logic, constructs prompts.
* **Speech-to-Speech LLM** — The agent's voice interface. Handles speech input and output.
* **OpenSearch Agentic Memory** — The persistent memory layer. This is the focus of this post.
* **LLM + Embedding Model** — Powers fact extraction (via inference) and semantic search within Agentic Memory.

## Deep Dive: Three Memory Strategies Working Together

OpenSearch Agentic Memory supports three [memory strategies](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory/#memory-processing-strategies) that run simultaneously in a single memory container. Each captures a different dimension of the conversation:

* **SEMANTIC** — Facts and life events: retirement target, portfolio composition, family changes.
* **USER_PREFERENCE** — How the client wants to be served: risk tolerance, communication style, decision-making preferences.
* **SUMMARY** — Condensed session context: what was discussed, what was decided, what's pending.

You configure all three when creating a memory container. Each client's memories are isolated by namespace — you don't need a separate container per client. Here's an example container with all three strategies:

```
POST /_plugins/_ml/memory_containers/_create
{
  "name": "wealth-advisor",
  "configuration": {
    "embedding_model_type": "TEXT_EMBEDDING",
    "embedding_model_id": "your-embedding-model-id",
    "embedding_dimension": 1024,
    "llm_id": "your-llm-model-id",
    "strategies": [
      { "type": "SEMANTIC", "namespace": ["customer_id"] },
      { "type": "USER_PREFERENCE", "namespace": ["customer_id"] },
      { "type": "SUMMARY", "namespace": ["customer_id"] }
    ]
  }
}
```

For the full container creation API and configuration options, see the [Agentic Memory documentation](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory/#memory-containers).

**Customizing extraction per strategy.** Each strategy accepts an optional `system_prompt` in its configuration, letting you steer what gets extracted. For a wealth management agent, you might narrow SEMANTIC to focus on financial facts (retirement timelines, portfolio composition, life events that affect planning) and ignore off-topic chitchat. USER_PREFERENCE can be tuned to capture decision-making style (e.g., spousal involvement, risk tolerance) rather than surface preferences like "prefers email." These custom prompts trade generality for precision, which pays off when your domain has a clear vocabulary.

### How They Work Together — The Wealth Management Flow

**Call 1 — Retirement planning:**

The client calls to discuss retirement. When the call ends, the agent sends the entire conversation to Agentic Memory:

```
POST /_plugins/_ml/memory_containers/<container_id>/memories
{
  "messages": [
    {
      "role": "user",
      "content": [{ "text": "I'm thinking about retiring in about five years. My portfolio is mostly in equities and I'm getting nervous about volatility. I'd like to start shifting to something more conservative.", "type": "text" }]
    },
    {
      "role": "assistant",
      "content": [{ "text": "That makes sense given your timeline. We could gradually rebalance toward a mix of bonds and dividend-paying stocks. Would you like me to prepare some options for you and your wife to review together?", "type": "text" }]
    },
    {
      "role": "user",
      "content": [{ "text": "Yes, please. She'll want to see the numbers before we decide anything.", "type": "text" }]
    }
  ],
  "payload_type": "conversational",
  "infer": true,
  "namespace": { "customer_id": "+1-555-0123" },
  "tags": { "topic": "retirement_planning" }
}
```

With `infer: true`, the LLM automatically extracts facts (SEMANTIC: retirement in 5 years, equity-heavy portfolio), detects preferences (USER_PREFERENCE: conservative, spouse involved in decisions), and generates a session summary (SUMMARY). The extracted knowledge is stored in long-term memory, where it becomes searchable via semantic search. Without `infer: true` (the default is `false`), messages are stored as raw data only — useful for logging, but not searchable by meaning. By sending the full conversation at once rather than individual turns, the LLM has the complete context to extract richer, more coherent facts and preferences.

**Why save at call end, not per-turn?** The LLM produces better extractions when it sees the full conversation at once. It can connect "retiring in five years" from one turn with "my wife wants to see the numbers" from another to infer a joint decision-making preference. Per-turn saving would extract these as isolated facts — "client plans to retire" and "client's wife wants to see numbers" — missing the relationship between them. These fragmented facts add noise at retrieval time without capturing the insight that matters.

**Call 2 — Life change:**

The same client calls a month later. The contact flow searches for the client's name and generates a personalized greeting: *"Welcome back!"* The name search uses the same semantic search API, where `k` specifies the maximum number of results to return:

```
POST /_plugins/_ml/memory_containers/<container_id>/memories/long-term/_semantic_search
{
  "query": "customer name",
  "k": 3,
  "namespace": { "customer_id": "+1-555-0123" }
}
```

Then the conversation begins. When the client mentions "what we discussed," the agent prompts the LLM to formulate a retrieval query based on the current conversation turn. The LLM might produce something like `"retirement planning portfolio rebalancing"` — a specific, targeted query rather than a pre-defined one:

```
POST /_plugins/_ml/memory_containers/<container_id>/memories/long-term/_semantic_search
{
  "query": "retirement planning portfolio rebalancing",
  // ^ generated by the LLM from the live conversation; different turns produce different queries
  "k": 10,
  "namespace": { "customer_id": "+1-555-0123" }
}
```

The agent finds the retirement timeline, risk preference, and that the spouse is involved — so it can immediately connect the move to the existing plan: *"Selling your current home could free up significant capital — would you like me to model how the proceeds might accelerate your rebalancing timeline?"*

**Call 3 — New goal:**

The client mentions an education fund for a grandchild. Given this new topic, the agent asks the LLM to generate a retrieval query that will surface the client's broader financial context. The LLM might produce `"financial situation retirement savings"` — shaped by the current conversation, not a fixed template:

```
POST /_plugins/_ml/memory_containers/<container_id>/memories/long-term/_semantic_search
{
  "query": "financial situation retirement savings",
  // ^ generated by the LLM based on what the client just said
  "k": 10,
  "namespace": { "customer_id": "+1-555-0123" }
}
```

With the full picture retrieved, the agent responds:

*"Congratulations! Given your retirement in about five years and the potential home sale, we have some flexibility. A conservative education fund that complements your overall plan would make sense. Shall I prepare options for you and your wife to review?"*

The agent remembered the retirement timeline, the home sale discussion, the conservative preference, and that the spouse wants to be involved — all from previous calls.

## Semantic and Hybrid Search: Finding What Matters

Previously, retrieving memories required manually constructing k-NN (k-Nearest Neighbors) queries with pre-generated embeddings. The new [semantic search](https://docs.opensearch.org/latest/ml-commons-plugin/api/agentic-memory-apis/semantic-search-memory/) and [hybrid search](https://docs.opensearch.org/latest/ml-commons-plugin/api/agentic-memory-apis/hybrid-search-memory/) APIs simplify this dramatically.

### Semantic Search

Pass a plain text query and get back semantically relevant memories. OpenSearch handles embedding generation and vector search automatically:

```
POST /_plugins/_ml/memory_containers/<container_id>/memories/long-term/_semantic_search
{
  "query": "client risk tolerance and investment preferences",
  "k": 5,
  "namespace": { "customer_id": "+1-555-0123" },
  "min_score": 0.6
}
```

This returns memories about the client's conservative stance and preference for gradual changes — even if those exact words never appeared in the stored conversations. A typical response looks like:

```
{
  "hits": {
    "hits": [
      {
        "_source": {
          "memory": "Client prefers conservative investments and wants to shift away from equities",
          "strategy_type": "USER_PREFERENCE",
          "namespace": { "customer_id": "+1-555-0123" }
        }
      },
      {
        "_source": {
          "memory": "Client plans to retire in five years with a gradual rebalancing strategy",
          "strategy_type": "SEMANTIC",
          "namespace": { "customer_id": "+1-555-0123" }
        }
      }
    ]
  }
}
```

Each result includes the extracted `memory` text, the `strategy_type` that produced it, and the `namespace` it belongs to. Your agent reads the `memory` field and injects the relevant facts into its prompt.

In our implementation, the agent uses semantic search on demand during the conversation. When a client asks "what was my retirement target?", the agent searches with `query="retirement savings target"` and retrieves exactly the relevant memories. When the conversation turns to investment preferences, it searches with `query="investment risk tolerance"`. This keeps each retrieval focused and avoids loading irrelevant context into the LLM's prompt.

### Why On-Demand Search Instead of Loading Everything Upfront

A simpler approach would be to load all of a client's memories at the start of each call and inject them into the LLM's prompt. This works initially, but as memories accumulate across sessions, two problems emerge: the LLM's prompt grows with irrelevant context, and a fixed query can't anticipate what the conversation will need. On-demand search solves both — the agent retrieves only what's relevant to the current turn, and the query is shaped by the actual conversation.

### How Strategies Behave at Search Time

The three memory strategies (SEMANTIC, USER_PREFERENCE, SUMMARY) define different _extraction pipelines_ at write time — but at search time, semantic search queries all strategies in a single index. There is no strategy-level filter; results are ranked purely by embedding similarity.

This produces a useful emergent behavior: **the nature of your query naturally surfaces memories from the most relevant strategy**. In our testing with real conversation data:

- **"what are my preferences"** → top results: risk tolerance, communication style, decision-making preferences. Dominant strategy: USER_PREFERENCE.
- **"summarize our past conversations"** → top results: session summaries, conversation flow notes. Dominant strategy: SUMMARY.
- **"retirement age and savings"** → top results: age, retirement date, savings amounts. Dominant strategy: SEMANTIC, with some USER_PREFERENCE.

This isn't a designed routing mechanism — it's a natural consequence of how each strategy shapes the extracted text and its resulting embedding. USER_PREFERENCE memories contain preference-oriented language, SUMMARY memories contain summary-oriented language, and semantic search matches accordingly. The practical implication: you don't need to build strategy-aware retrieval logic. A single semantic search query returns the right mix.

To make this concrete in our Wealth Management example: when Call 2 opens with a broad cue like "what we discussed," semantic search is likely to surface SUMMARY memories (the session-level condensed view of the retirement planning call) alongside SEMANTIC facts — because the query is similarly session-shaped. Narrower follow-up queries like "retirement planning portfolio rebalancing" lean more on SEMANTIC facts, and questions about how the client prefers to be served draw from USER_PREFERENCE. The value of running all three strategies at write time is that you don't have to predict which angle the future conversation will need; whatever query the LLM generates, the right abstraction of memory is already there to be found.

### Hybrid Search

For queries that benefit from both keyword precision and semantic understanding, Agentic Memory also provides a `_hybrid_search` endpoint that combines BM25 keyword matching and neural search. In our implementation, semantic search was sufficient — but hybrid search is available when you need exact keyword matching alongside semantic relevance:

**Note:** The `_hybrid_search` endpoint is newer than `_semantic_search` — see the [hybrid search API reference](https://docs.opensearch.org/latest/ml-commons-plugin/api/agentic-memory-apis/hybrid-search-memory/) for the full specification. It returns results ranked by a combination of BM25 keyword scores and embedding similarity scores.

```
POST /_plugins/_ml/memory_containers/<container_id>/memories/long-term/_hybrid_search
{
  "query": "retirement timeline five years portfolio rebalancing",
  "k": 10,
  "namespace": { "customer_id": "+1-555-0123" }
}
```

This finds the exact timeline mentioned (keyword match) AND related financial planning context (semantic match).

## Tips for Getting the Most Out of Agentic Memory

Here's what we learned building this system — practical tips to help you get up and running smoothly:

**Design your namespace early.** Choose a namespace key that's available at the start of every session without requiring the user to identify themselves. We used the caller's phone number because it's provided automatically by the telephony system. For a chat agent, an authenticated user ID works well. The key requirement: stable across sessions and available before the conversation begins.

**Choose a capable LLM for fact extraction.** The USER_PREFERENCE strategy produces structured JSON with categories and context annotations, which requires a model that reliably generates well-formed JSON. We got the best results with a capable model such as Claude Sonnet — though smaller models may also work depending on your extraction complexity. A good practice is to test each strategy with your chosen LLM and monitor long-term memory counts by `strategy_type` field to confirm all three strategies are producing output.

**Design your queries to be specific, not generic.** With on-demand retrieval, the quality of each search depends on the query. A query like "customer information" returns a broad mix of facts; a query like "retirement timeline" or "investment risk tolerance" returns exactly what the conversation needs. The agent constructs these queries based on the conversation context, so the prompt should instruct it to be specific.

**Pick the right embedding model for your environment.** Agentic Memory supports both [pretrained local models](https://docs.opensearch.org/latest/ml-commons-plugin/pretrained-models/) and [remote connectors](https://docs.opensearch.org/latest/ml-commons-plugin/remote-models/connectors/) for embeddings. For production, we recommend a remote model (such as Amazon Bedrock Titan, OpenAI, or Cohere embeddings) so embedding capacity scales independently of your OpenSearch cluster and you can upgrade models without redeploying. Local pretrained models (e.g., `all-MiniLM-L12-v2`) are convenient for quick experimentation, but verify that semantic search returns meaningful results before going to production.

**Add graceful fallback for resilience.** Wrapping memory operations in error handling ensures your agent stays responsive even if OpenSearch is temporarily unavailable — it simply falls back to a stateless conversation until memory is restored.

**Combine semantic search with recency when needed.** For queries where the most recent information matters (e.g., "current portfolio allocation"), combining semantic search results with the most recent N memories by `created_time` ensures the agent doesn't miss recent updates that older, semantically similar memories might outrank.

**Tune your recall parameters for your use case.** The value of k directly affects what your agent retrieves. For on-demand queries that target specific topics, a moderate k (5-10) works well. The query specificity matters more than k — a well-targeted query with k=5 outperforms a generic query with k=50. Monitor recall quality in production and adjust as your memory grows.

## Conclusion

Contact center AI agents that forget their customers after every call aren't just inefficient — they're a missed opportunity. The information that makes an advisor genuinely helpful — life events, preferences, conversation history — already surfaces in natural conversation. The challenge has been capturing it systematically and retrieving it intelligently.

OpenSearch Agentic Memory turns this from a custom engineering project into API calls. Three strategies running simultaneously extract facts, learn preferences, and compress session context — all from the same conversation, with a single `infer: true` flag. Semantic search lets the agent retrieve exactly the memories relevant to _this moment_ in the conversation, rather than loading everything it's ever learned.

We built this for wealth management, where client relationships span years and context compounds with every interaction. But the pattern applies wherever your AI agent's value grows with what it remembers: insurance claims, healthcare follow-ups, technical support escalations, or any domain where "I already explained this" is the most common customer frustration.
