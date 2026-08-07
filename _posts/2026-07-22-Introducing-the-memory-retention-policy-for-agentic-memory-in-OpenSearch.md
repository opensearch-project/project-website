---
layout: post
title: "Introducing memory retention for agentic memory in OpenSearch"
authors:
  - erfanballew
date: 2026-07-22
categories:
  - technical-post
meta_keywords: OpenSearch agentic memory, memory retention policy, AI agent memory, memory container, session retention, long-term memory, pinned memory
meta_description: Learn how the memory retention policy in OpenSearch automatically manages the lifecycle of agentic memory, controlling storage growth while preserving specific memories.
---

OpenSearch agentic memory provides an AI agent with persistent storage that spans conversations. A memory container stores four types of memory: `sessions` record conversations between a user and an agent, `working` memory holds the individual messages within each session, `long-term` memory stores knowledge distilled from those conversations, and `history` keeps an immutable audit trail of operations.

All four memory types grow with use. A high-volume support agent can accumulate hundreds of thousands of sessions in weeks, so you pay to store and search conversations that are no longer relevant, and the agent retrieves stale context that degrades answer quality and increases inference cost.

OpenSearch 3.8 introduces a new experimental **memory retention** feature that addresses this problem. In this post, we'll describe memory retention and show you how to choose limits for your workload and how to enable retention on a cluster that already holds data.

## Enabling memory retention

Memory retention is controlled by a feature flag, `plugins.ml_commons.memory.retention_enabled`, which defaults to `false`. To enable retention cluster-wide, configure the following setting:

```json
PUT /_cluster/settings
{
  "persistent": {
    "plugins.ml_commons.memory.retention_enabled": true
  }
}
```

## How a retention policy works

A policy provides up to two independent controls per memory type. `retention_days` deletes memories older than the specified number of days, measured from a memory's `last_updated_time`. `max_count` retains at most the specified number of memories, deleting the oldest first. When you set both controls, OpenSearch deletes a memory that violates either one.

Adding a message to a session advances the session's `last_updated_time`, so a conversation that is still in progress is never deleted. `working` memory has no rule of its own: messages are deleted when their parent session is deleted, so to control how long messages are retained, configure retention for `sessions`. For more information, see [Defining a retention policy](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory-retention/#defining-a-retention-policy).

## Choosing retention values

Each memory type answers a different question:

- For `sessions`, consider how long a conversation remains useful to reopen. A support agent rarely needs a conversation older than the ticket that prompted it, so a short `retention_days` value, from several days to a few weeks, is usually sufficient. An assistant that references a discussion from the previous month requires a longer period.
- For `long-term` memory, consider how many entries the agent can retrieve against before precision declines and cost per query increases. This is usually a `max_count` decision rather than an age one, because durable facts don't expire on a schedule.
- For `history`, consider how much audit trail you must retain. This is usually determined by compliance requirements rather than by usefulness. Because history supports only `max_count` and is inexpensive to store, choose the largest count your storage budget allows.

To calculate `max_count`, multiply the number of memories your agent creates per day by the number of days you want to retain them, then add a margin for variation in daily volume. If a support agent creates approximately 500 sessions per day and you want to retain two weeks of conversations, then `500 × 14 ≈ 7,000`, so a `max_count` of 10,000 accommodates periods of higher volume.

## Attaching a retention policy to a container

After retention is enabled, you can attach a policy to a container when creating it. The following example applies the preceding reasoning to a support agent that has high conversation volume, a modest reusable knowledge base, and a compliance requirement to retain an audit trail:

```json
POST /_plugins/_ml/memory_containers/_create
{
  "name": "support-agent-memory",
  "configuration": {
    "embedding_model_id": "{{embedding_model_id}}",
    "llm_id": "{{llm_id}}",
    "strategies": [
      { "type": "SEMANTIC", "namespace": ["user_id"] }
    ],
    "retention_policy": {
      "sessions": {
        "retention_days": 14,
        "max_count": 10000
      },
      "long-term": {
        "max_count": 2000
      },
      "history": {
        "max_count": 500000
      }
    }
  }
}
```

The `embedding_model_id`, `llm_id`, and `strategies` fields configure the container itself rather than retention, but a container must define `strategies` in order to store long-term memory: without a strategy, the agent doesn't extract durable facts, so a long-term policy has no memories to manage. For the full set of configuration options, review [Create Memory Container API](https://docs.opensearch.org/latest/ml-commons-plugin/api/agentic-memory-apis/create-memory-container/).

## Pinning memories

Retention applies to every memory in a container, including a troubleshooting conversation or an extracted fact that you need to preserve. Pinning exempts a memory from retention enforcement: the job never deletes a pinned memory, regardless of its age or the container's count limit.

To pin a session, send the following request:

```json
PUT /_plugins/_ml/memory_containers/{id}/memories/sessions/{session_id}
{
  "pinned": true
}
```

Pinning a session protects the entire conversation, including all of its messages. Pinned memories also don't count toward `max_count`: if you limit sessions to 100 and pin 30 of them, the job retains the newest 100 non-pinned sessions. You can pin `sessions` and `long-term` memories; `working` memory and `history` cannot be pinned.

## Setting cluster-wide defaults

Setting a policy on each container is precise, but if you run many containers, you can instead configure defaults that apply to every container without a policy of its own:

```json
PUT /_cluster/settings
{
  "persistent": {
    "plugins.ml_commons.memory.default_session_retention_days": 90,
    "plugins.ml_commons.memory.default_session_max_count": 5000,
    "plugins.ml_commons.memory.default_long_term_max_count": 2000,
    "plugins.ml_commons.memory.default_history_max_count": 100000
  }
}
```

Adjust these values as you measure your workload: a high-volume support agent might retain sessions for only a few days, while a research assistant might retain long-term memory for a year.

When you configure defaults, new containers inherit them at creation, and existing containers without a policy adopt them on the next job run. Two rules determine which containers are affected:

- A container with its own explicit policy is never overridden.
- A container that explicitly opts out by setting `"retention_policy": null` is permanently exempt, and defaults never apply to it.

## Enabling retention on an existing cluster

Enabling retention on a cluster that already holds months of memory carries a risk: the first job run could delete data you still need. The following sequence separates enabling the feature from enforcing any limits, so nothing is deleted until you determine which limits to apply:

1. Enable `retention_enabled` before you configure any defaults. Because every default remains at `-1`, no container receives a policy and nothing is deleted. This step only makes the retention APIs available.

2. Set an explicit policy on each container whose workload you know, using the values you chose in [Choosing retention values](#choosing-retention-values). To exempt a container from retention permanently, set its `retention_policy` to `null`.

3. Configure the [cluster-wide defaults](#setting-cluster-wide-defaults) that apply to the remaining containers. Every container you configured or exempted in the previous step is unaffected, and the rest adopt the defaults on the next job run.

## Safety controls

Because retention deletes data, OpenSearch provides the following controls:

- Setting `retention_enabled` to `false` immediately pauses all enforcement cluster-wide. It's a dynamic setting, so no restart is required, and your policies remain stored but unenforced.
- Each count-based pass deletes at most 50,000 documents per memory type per container, converging over successive runs instead of issuing one large delete.
- A background sweep deletes orphaned working memory messages---those whose parent session no longer exists, and those that cannot be attributed to a session---after they age past a cutoff, which is one week by default. Recently orphaned messages are therefore retained. The first time the sweep observes a container, it records a baseline and deletes nothing, which gives pre-existing memories a full interval before any deletion.
- Because the job runs on a schedule, expired memories can still appear in query results for up to one job interval, which is 24 hours by default, before they are deleted.

## Conclusion

Memory retention provides automatic lifecycle management for agentic memory in OpenSearch. An age limit and a count limit per memory type control storage costs and context quality, and pinning exempts the memories you must preserve. Because the feature is opt-in and disabled by default, you can adopt it incrementally. Note that the retention job doesn't run on multi-tenant clusters.

To get started, see [Agentic memory retention](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory-retention/).

We'd like to hear which retention values suit your workload. Share your questions and feedback on the [OpenSearch forum](https://forum.opensearch.org/).


