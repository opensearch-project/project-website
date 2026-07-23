---
layout: post
title: "Introducing the memory retention policy for agentic memory in OpenSearch"
authors:
  - erfanballew
date: 2026-07-22
categories:
  - technical-post
meta_keywords: OpenSearch agentic memory, memory retention policy, ML Commons, AI agent memory, memory container, session retention, long-term memory, pinned memory
meta_description: Learn how the new memory retention policy in OpenSearch ML Commons automatically manages the lifecycle of agentic memory, controlling storage growth while keeping the memories that matter.
---

AI agents that remember get better over time. In OpenSearch ML Commons, agentic memory lets an agent store conversation **sessions**, distill durable knowledge into **long-term memory**, and keep an audit trail in **history**. But memory that only grows creates three problems: storage costs climb without bound, agents start retrieving stale or contradictory context that degrades answer quality, and larger contexts drive up inference costs.

Starting in OpenSearch 3.8, ML Commons introduces a **memory retention policy** that solves this. You declare simple rules — keep sessions for 90 days, cap long-term memory at 2,000 entries — and a background job enforces them on a schedule. This post walks through what the feature does, how to turn it on, and how to use it safely.

<!--more-->

## The problem: memory without a lifecycle

A memory container holds four types of memory, and each grows for a different reason:

| Memory type | What it stores | Growth driver |
|---|---|---|
| **sessions** | Conversation sessions between a user and an agent | Every new conversation |
| **long-term** | Distilled knowledge extracted from conversations | Every fact the agent learns |
| **history** | Immutable audit trail of interactions | Every operation |
| **working** | Individual messages within a session | Every message |

Left unmanaged, a busy support agent can accumulate hundreds of thousands of sessions in weeks. You end up paying to store — and search across — conversations that no longer matter. The retention policy gives you a declarative way to keep the container at a healthy size without writing any cleanup scripts.

## Opt-in by design

The most important thing to know: **retention is opt-in, and nothing is ever deleted by default.**

The feature is gated by a feature flag, `plugins.ml_commons.memory.retention_enabled`, which defaults to `false`. Until an administrator turns it on, the APIs reject any `retention_policy` or `pinned` input with a `403`, and the background job short-circuits without touching a single document. There are no hidden "recommended" defaults — every cluster-level default ships disabled (`-1`).
To enable retention cluster-wide:

```json
PUT /_cluster/settings
{
  "persistent": {
    "plugins.ml_commons.memory.retention_enabled": true
  }
}
```

## Quick start

Once retention is enabled, attach a policy when you create a container. The values below are just one possible starting point — the right numbers depend on your workload, so set what fits you:

```json
POST /_plugins/_ml/memory_containers/_create
{
  "name": "my-agent-memory",
  "configuration": {
    "retention_policy": {
      "sessions": {
        "retention_days": 90,
        "max_count": 5000
      },
      "long-term": {
        "max_count": 2000
      },
      "history": {
        "max_count": 100000
      }
    }
  }
}
```

That's it. The background job (every 24 hours by default) enforces these rules automatically. Prefer these applied everywhere without setting them per container? See [Cluster-wide defaults for administrators](#cluster-wide-defaults-for-administrators) below.

## How a retention policy works

A policy has up to two independent controls per memory type:

- **`retention_days`** — delete memories older than N days, measured from `last_updated_time`.
- **`max_count`** — keep at most N memories; when the count is exceeded, the oldest are evicted first.

When both are set, they act as an **OR** condition: a memory is removed if it violates *either* rule. A few things worth knowing:

- **Active conversations stay alive.** Adding a message to a session — or updating its summary — bumps its `last_updated_time`, so an in-progress chat won't be aged out from under the user.
- **History is count-only.** For audit integrity, history supports `max_count` but not `retention_days`.
- **Working memory follows its session.** Messages have no rule of their own — they're deleted when their parent session is removed, so a conversation is never left with gaps. To control message lifetime, set retention on `sessions`. (Session-less containers are the exception: with no parent to age messages out, cleanup falls to a cluster-level TTL, `working_memory_ttl_days`, which ships off by default — so those messages are kept indefinitely until an admin turns it on.)
- **Deletions cascade cleanly.** When a session is removed, its working memory messages are deleted first, then the session document.

## Pinning: protecting the memories that matter

Retention shouldn't force you to lose an important troubleshooting thread or a critical piece of learned knowledge. **Pinning** exempts a memory from all retention enforcement — the job never deletes a pinned memory, regardless of age or count.

```json
PUT /_plugins/_ml/memory_containers/{id}/memories/sessions/{session_id}
{
  "pinned": true
}
```

Pinning a session protects the whole conversation, including all its messages. And pinned memories **don't count toward `max_count`** — if you cap sessions at 100 and pin 30 of them, the job still keeps the newest 100 *non-pinned* sessions. You can pin sessions and long-term memories; working memory and history cannot be pinned.

## Cluster-wide defaults for administrators

Individual policies are great, but organizations often want a baseline that applies everywhere without asking every team to configure it. Administrators can optionally set cluster-level defaults.

If you'd rather not reason through the numbers per container, here's one possible starting point (tune to your own workload):

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

Treat them as a sensible default to adjust as you learn your workload; a high-volume support agent might tighten sessions to a few days, while a research assistant might keep long-term memory far longer.

When defaults are set, new containers inherit them at creation, and existing containers with no policy pick them up on the next job run. Two escape hatches keep this predictable:

- A container with its own explicit policy is never overridden.
- A container that explicitly opts out with `"retention_policy": null` is permanently exempt — defaults never touch it.

This also enables a safe rollout pattern: an admin can announce planned defaults while keeping `retention_enabled=false`, giving container owners time to opt out before enforcement begins.

## Safety first

Because retention deletes data, the feature is built with guardrails:

- **Emergency stop.** Setting `retention_enabled: false` immediately pauses all enforcement cluster-wide (it's a dynamic setting — no restart). Your policies stay saved; they just stop being enforced.
- **Bounded eviction.** Each count-based pass evicts at most 50,000 documents per type per run, converging over successive runs rather than issuing one massive delete.
- **Orphan-sweep grace period.** A background sweep also clears stray working-memory messages — those whose parent session no longer exists, and fully unattributable ones — once they've aged past a cutoff (a week by default), so recently orphaned data isn't touched. And the first time the sweep sees a container, it just stamps a baseline and deletes nothing, giving pre-existing data a full window to settle before any cleanup.
- **Staleness window.** Because the job runs on a schedule, expired memories may still appear in queries for up to one job interval (default 24 hours) before they're removed.

## Conclusion

Memory retention brings automatic lifecycle management to agentic memory in OpenSearch ML Commons. With a few declarative rules you can keep storage costs and context quality under control, while pinning ensures the memories that matter are never lost. And because the entire feature is opt-in and defaults to off, you adopt it entirely on your own terms.

To get started, upgrade to OpenSearch 3.8, enable `plugins.ml_commons.memory.retention_enabled`, and attach a policy to your memory containers. One caveat: on multi-tenant clusters the retention job sits out for now, so your policies won't be enforced until multi-tenant support lands in a future release. To learn more about agentic memory in OpenSearch, see the [agentic memory documentation](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory/).
