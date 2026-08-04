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

Starting in OpenSearch 3.8, ML Commons introduces a **memory retention policy** that solves this. You declare simple rules — keep sessions for 90 days, cap long-term memory at 2,000 entries — and a background job enforces them on a schedule. This post walks through what the feature does, how to reason about the right numbers for your workload, and how to roll it out on a cluster that already has data.

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

Once retention is enabled, attach a policy when you create a container. The retention numbers below are just one possible starting point — the right values depend on your workload, so set what fits you:

```json
POST /_plugins/_ml/memory_containers/_create
{
  "name": "my-agent-memory",
  "configuration": {
    "embedding_model_id": "{{embedding_model_id}}",
    "llm_id": "{{llm_id}}",
    "strategies": [
      { "type": "SEMANTIC", "namespace": ["user_id"] }
    ],
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

The `embedding_model_id`, `llm_id`, and `strategies` fields aren't part of retention — they configure the container itself, and they're what makes long-term memory work: without a strategy, the agent never extracts durable facts, so there's nothing for a long-term policy to manage. See [creating a memory container](https://docs.opensearch.org/latest/ml-commons-plugin/api/agentic-memory-apis/create-memory-container/) for the full set of configuration options.

That's it. The background job (every 24 hours by default) enforces these rules automatically. Prefer these applied everywhere without setting them per container? See [Cluster-wide defaults for administrators](#cluster-wide-defaults-for-administrators) below.

## How a retention policy works

A policy has up to two independent controls per memory type:

- **`retention_days`** — delete memories older than N days, measured from `last_updated_time`.
- **`max_count`** — keep at most N memories; when the count is exceeded, the oldest are evicted first.

When both are set, they act as an **OR** condition: a memory is removed if it violates *either* rule. A few things worth knowing:

- **Active conversations stay alive.** Adding a message to a session — or updating its summary — bumps its `last_updated_time`, so an in-progress chat won't be aged out from under the user.
- **History is count-only.** For audit integrity, history supports `max_count` but not `retention_days`.
- **Working memory follows its session.** Messages have no rule of their own — they're deleted when their parent session is removed, so a conversation is never left with gaps. To control message lifetime, set retention on `sessions`. (Session-less containers are the exception: with no parent to age messages out, cleanup falls to a cluster-level TTL, `working_memory_ttl_days`, which ships off by default — so those messages are kept indefinitely until an admin turns it on.)
- **The retention job cleans up cleanly.** When the job evicts a session, it deletes that session's working memory messages first, then the session document — so it never leaves a conversation half-removed. (Deleting a session yourself through the API is different: its messages aren't purged on the spot; the orphan sweep tidies them up later, once they age past `orphan_ttl_days`.)

## Choosing the right numbers

Each memory type answers a different question:

- **Sessions — how long is a conversation still useful to reopen?** A support bot rarely needs a chat older than the ticket that spawned it, so a short `retention_days` (days to a few weeks) is fine. A personal assistant that references "what we discussed last month" needs a longer window.
- **Long-term memory — how big a knowledge base stays *helpful* rather than *noisy*?** This is usually a `max_count` question, not a time one — durable facts don't get stale on a clock, but too many dilute retrieval quality and cost more per query. Size it to the working set your agent actually retrieves against.
- **History — how much audit trail must you retain?** Usually driven by compliance, not usefulness. Pick the largest count your storage budget tolerates, since it's cheap insurance and count-only.

A quick way to calibrate `max_count`: estimate your steady-state creation rate, multiply by the window you want to keep, and add headroom. If a support agent opens ~500 sessions a day and you want roughly two weeks of history, `500 × 14 ≈ 7,000`, so a `max_count` of 10,000 leaves comfortable margin.

**Worked example — a customer-support agent.** High conversation volume, a modest reusable knowledge base, and a compliance requirement to keep an audit trail:

```json
POST /_plugins/_ml/memory_containers/_create
{
  "name": "customer-support-agent",
  "configuration": {
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

The reasoning: **sessions** expire after two weeks (a resolved ticket is rarely reopened) with a 10,000 cap as a safety valve against traffic spikes; **long-term** holds a focused 2,000-entry knowledge base so retrieval stays sharp; **history** keeps half a million entries to satisfy audit needs without a time limit. Pin the handful of exemplar conversations you want the agent to always learn from (see below), and this container effectively runs itself.

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

## Rolling out to an existing cluster

Turning retention on for a cluster that already holds months of memory is the scariest moment — flip the wrong switch and the first job run could delete data someone still needs. The feature is designed so you never have to take that risk. Here's a staged rollout that keeps you in control the whole way.

**1. Turn the feature on without changing any behavior.** Enable the flag *before* setting any defaults. Because every default still ships at `-1`, nothing gets a policy and nothing is deleted — you've just unlocked the APIs so owners can start setting policies:

```json
PUT /_cluster/settings
{ "persistent": { "plugins.ml_commons.memory.retention_enabled": true } }
```

**2. Let container owners opt in (or out) deliberately.** Now teams can attach their own policies where they know the workload. Any container an owner wants to exempt permanently can set `"retention_policy": null` — that's a durable opt-out that cluster defaults will never override.

**3. Announce your planned defaults, then wait.** If you want an org-wide baseline for the containers *nobody* has configured, tell owners the numbers and the date first. This announcement window is the whole point: it gives owners time to set explicit policies or opt out before anything is enforced.

**4. Apply the defaults.** When the window closes, set the cluster defaults. Only containers with **no** explicit policy and **no** opt-out pick them up — on the next job run, via backfill:

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

Two properties make this safe on old data specifically. The **orphan sweep won't touch pre-existing working memory** on its first pass — it stamps a baseline and defers deletion for a full `orphan_ttl_days` window, so nothing legacy disappears the moment you enable the feature. And if anything looks wrong at any step, the **emergency stop** below reverts you to "nothing is enforced" instantly, with every policy still saved.

## Safety first

Because retention deletes data, the feature is built with guardrails:

- **Emergency stop.** Setting `retention_enabled: false` immediately pauses all enforcement cluster-wide (it's a dynamic setting — no restart). Your policies stay saved; they just stop being enforced.
- **Bounded eviction.** Each count-based pass evicts at most 50,000 documents per type per run, converging over successive runs rather than issuing one massive delete.
- **Orphan-sweep grace period.** A background sweep also clears stray working-memory messages — those whose parent session no longer exists, and fully unattributable ones — once they've aged past a cutoff (a week by default), so recently orphaned data isn't touched. And the first time the sweep sees a container, it just stamps a baseline and deletes nothing, giving pre-existing data a full window to settle before any cleanup.
- **Staleness window.** Because the job runs on a schedule, expired memories may still appear in queries for up to one job interval (default 24 hours) before they're removed.

## Conclusion

Memory retention brings automatic lifecycle management to agentic memory in OpenSearch ML Commons. With a few declarative rules you can keep storage costs and context quality under control, while pinning ensures the memories that matter are never lost. And because the entire feature is opt-in and defaults to off, you adopt it entirely on your own terms.

To get started, upgrade to OpenSearch 3.8, enable `plugins.ml_commons.memory.retention_enabled`, and attach a policy to your memory containers. One caveat: on multi-tenant clusters the retention job sits out for now, so your policies won't be enforced until multi-tenant support lands in a future release. To learn more about agentic memory in OpenSearch, see the [agentic memory documentation](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory/).
