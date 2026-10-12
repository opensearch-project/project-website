---
layout: post
title: "Querying AI-agent job histories in OpenSearch"
authors: [tridev-tej]
date: 2026-10-10
categories: [technical-posts]
tags: [opensearch, observability, ai-agents]
excerpt: "Inspect synthetic retry histories by tenant, attempt and action identity, including unresolved and contradictory records."
---

A worker reports a tool timeout, restarts, and finishes on the next attempt. Its error log explains the timeout. To decide whether to repeat the action, you also need to know what each attempt did and which confirmations were recorded.

OpenSearch can store that history as structured events. Separate identities for the job, execution attempt, and intended action let you inspect retries without losing the relationship between them.

## Overview

The example uses a synthetic corpus of five job histories across two tenants, with 33 events. It includes a successful retry, an unresolved action, tied timestamps, and a late failure that contradicts a completion record. A separate eight-event history shows an action confirmation recorded again after a restart.

All events are authored fixtures. The lab runs no model, external tool, or worker restart.

## Prerequisites

To reproduce the example, you need:

- OpenSearch 3.9.0 on Linux amd64.
- Docker and Python 3.
- A host with `vm.max_map_count` of at least 262144.

The tested configuration limits the OpenSearch container to 4 GiB and two CPUs, and the request driver to 256 MiB and 0.5 CPU. It uses bounded, volatile storage, one shard, and zero replicas.

The Security plugin is disabled only on the isolated, unexposed lab network. The example makes no authentication or persistence claim.

The [reproduction handoff](/assets/media/blog-images/2026-10-10-querying-ai-agent-job-histories/lab/REPRODUCE.md) includes the tested package, captured responses, and cleanup procedure. Its automated runner executes the requests in this post and removes the lab indexes and cluster before returning.

## Getting started

### 1. Define the event identities

Give each job a `job_id` that survives restarts, and bump `attempt` on every execution. Keep `action_id` stable when a later attempt refers to the same intended tool action.

| Field | Meaning in this example |
| --- | --- |
| `tenant_id` and `job_id` | The job's identity within a tenant |
| `attempt` | One execution of that job |
| `event_id` | One logical event, reused if that event is submitted again |
| `action_id` | One intended follow-up action, independent of attempt |
| `sequence` | The synthetic producer's order across the job's attempts |
| `event_time` | When the producer says the event happened |
| `ingested_at` | Authored fixture timestamp representing ingestion; not measured HTTP submission time |

For example, `alpha:job-retry:a2:s04` identifies the second attempt's start event. The action key that job later uses is `alpha:job-retry:followup:v1`.

I assigned `sequence` explicitly in the fixture. It's not OpenSearch's `_seq_no`, not an ingestion timestamp, and not a distributed ordering guarantee. Concurrent producers need their own ordering contract, because a wall clock can't supply one when events share a timestamp or arrive late.

### 2. Create the history index

Agent logs can contain prompts, tool arguments, response bodies, and authorization headers. The loader builds a fresh object from an allowlist before generating the indexing request. Only fields in the following mapping survive.

It also validates values: identifiers have bounded syntax, attempts and sequences are positive integers, event types come from a fixed enum. An allowed field can still contain sensitive content, so field names alone are insufficient for validation.

Create the main index with `PUT /<history-index>`, using an index name owned by the lab and this mapping:

```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "schema_version": { "type": "integer", "coerce": false },
      "tenant_id": { "type": "keyword" },
      "job_id": { "type": "keyword" },
      "attempt": { "type": "integer", "coerce": false },
      "sequence": { "type": "long", "coerce": false },
      "event_id": { "type": "keyword" },
      "event_type": { "type": "keyword" },
      "action_id": { "type": "keyword" },
      "event_time": { "type": "date", "format": "strict_date_time" },
      "ingested_at": { "type": "date", "format": "strict_date_time" }
    }
  }
}
```

`keyword` fields give you exact identity filters. `dynamic: strict` rejects unmapped fields, but the loader still has to enforce required fields and valid event types. It validates sequence uniqueness within one submitted batch. Ordering and sequence uniqueness across batches remain producer invariants that the loader doesn't enforce globally. Don't use `dynamic: false` as a redaction mechanism. It leaves unmapped data sitting in `_source`. See the [dynamic mapping reference](https://docs.opensearch.org/latest/mappings/mapping-parameters/dynamic/).

The redaction check reads both the outbound request bytes and the fetched `_source`. Hiding a field in a search response proves nothing about what was stored.

### 3. Index events with create operations

Set the document `_id` to `event_id` and use a `create` operation. A plain `PUT /index/_doc/id` can replace an existing document. The [create endpoint](https://docs.opensearch.org/latest/api-reference/document-apis/index-document/) fails when the ID already exists, which is what an append-only history wants.

For bulk ingestion, send this to `POST /<history-index>/_bulk`, replacing the placeholder with the index you own. The endpoint supplies the index the action line omits. Each action line is followed by its document line, and the NDJSON request ends with a newline:

```text
{"create":{"_id":"alpha:job-retry:a1:s03"}}
{"schema_version":1,"tenant_id":"alpha","job_id":"job-retry","attempt":1,"sequence":3,"event_id":"alpha:job-retry:a1:s03","event_type":"COMPUTE_FAILED","event_time":"2026-10-01T12:00:03.000+04:00","ingested_at":"2026-10-01T12:01:43.000+04:00"}
```

A repeated create produces a conflict. Fetch the existing document and compare its canonical sanitized content with what you sent. Equal content is a repeated submission under this application's contract. Different content is a conflicting event. Treat every HTTP 409 as a harmless retry and you can hide a producer bug.

Inspect every bulk item. The [Bulk API](https://docs.opensearch.org/latest/api-reference/document-apis/bulk/) can return HTTP 200 while individual operations fail; its `errors` flag and ordered `items` describe the partial success. Retry the whole batch without reading them and you resubmit events that were already accepted.

A successful write can land before search visibility. Use an explicit refresh for a bounded fixture load, or `refresh=wait_for` when a write must precede a search. The [refresh options](https://docs.opensearch.org/latest/api-reference/document-apis/index-document/#refresh) define visibility. They say nothing about a tool action in another service.

## Querying job histories

### Retrieve a complete retry timeline

In the retry fixture, attempt 1 records `COMPUTE_FAILED` and attempt 2 reaches `COMPLETED`. Send this body to `POST /<history-index>/_search`. Filter by both tenant and job, and sort by the producer sequence with `event_id` as a stable secondary key:

```json
{
  "size": 3,
  "track_total_hits": true,
  "query": {
    "bool": {
      "filter": [
        { "term": { "tenant_id": "alpha" } },
        { "term": { "job_id": "job-retry" } }
      ]
    }
  },
  "sort": [
    { "sequence": "asc" },
    { "event_id": "asc" }
  ]
}
```

Request each following page with `search_after` set to the last hit's returned `sort` array. Keep the filters and sort unchanged. `track_total_hits: true` gives an exact match count, not all matching documents.

The history returned was:

| Sequence | Attempt | Event |
| ---: | ---: | --- |
| 1 | 1 | STARTED |
| 2 | 1 | COMPUTE_STARTED |
| 3 | 1 | COMPUTE_FAILED |
| 4 | 2 | STARTED |
| 5 | 2 | COMPUTE_STARTED |
| 6 | 2 | COMPUTE_FINISHED |
| 7 | 2 | ACTION_REQUESTED |
| 8 | 2 | ACTION_CONFIRMED |
| 9 | 2 | COMPLETED |

I set the page size to 3 on purpose. It forces pagination on a nine-event job, so the check reads three full pages plus an empty terminal page and confirms the nine expected IDs with no duplicates. Reject timed-out responses, failed shards, or a non-exact total before you interpret absence.

All fixture ingestion stops during this page walk. Plain `search_after` reads a live index and can shift under concurrent writes. For that case the [pagination guide](https://docs.opensearch.org/latest/search-plugins/searching-data/paginate/) describes consistent pagination with Point in Time. A PIT stabilizes the indexed view. It can't recover an event that was never indexed.

### Inspect action confirmations across retries

A separate eight-event fixture, `alpha/job-action-retry`, uses the same mapping and loader in its own index. The diagram shows selected confirmation and restart records; the table gives the full history returned by the query.

![Authored retry history: two attempts, different confirmation event IDs, one action ID.](/assets/media/blog-images/2026-10-10-querying-ai-agent-job-histories/opensearch-history.png)

*Selected records from the synthetic action-retry history. The attempts share one action ID and use different confirmation event IDs.*

| Sequence | Attempt | Event |
| ---: | ---: | --- |
| 1 | 1 | STARTED |
| 2 | 1 | COMPUTE_STARTED |
| 3 | 1 | COMPUTE_FINISHED |
| 4 | 1 | ACTION_REQUESTED |
| 5 | 1 | ACTION_CONFIRMED |
| 6 | 2 | STARTED |
| 7 | 2 | ACTION_CONFIRMED |
| 8 | 2 | COMPLETED |

Query that index with the timeline request above, changing `job_id` to `job-action-retry`. The pages held three, three, two, and zero hits. Ingestion stays paused while the cursor advances.

The request and both confirmation records carry `alpha:job-action-retry:followup:v1`. Sequence 7 is a later observation about the same intended action, under a different event ID. Those records alone don't establish how many effects occurred or whether another POST happened.

Attempt 1 has no `COMPLETED` event. Its recorded action confirmation still precedes the restart in producer order, and reading the missing terminal event as "the action never happened" throws that evidence away.

`ACTION_CONFIRMED` is the producer's recorded confirmation; the lab has no external service receipt. A real workflow must verify the outcome through the service that owns the action.

### Count computation starts by attempt

Send this body to `POST /<history-index>/_search` for the original corpus. Filter `COMPUTE_STARTED` and run a composite aggregation over tenant, job, and attempt:

```json
{
  "size": 0,
  "track_total_hits": true,
  "query": { "term": { "event_type": "COMPUTE_STARTED" } },
  "aggs": {
    "attempts": {
      "composite": {
        "size": 2,
        "sources": [
          { "tenant": { "terms": { "field": "tenant_id" } } },
          { "job": { "terms": { "field": "job_id" } } },
          { "attempt": { "terms": { "field": "attempt" } } }
        ]
      }
    }
  }
}
```

Continue with the response's `after_key` in the next request's `after` parameter. Don't build the cursor from the final bucket. The [composite aggregation reference](https://docs.opensearch.org/latest/aggregations/bucket/composite/#paginating-composite-results) explains that the two can differ.

The original 33-event fixture's six buckets include two for `alpha/job-retry` and one for each other job. Grouping those exact buckets identifies the retry without estimating distinct values or counting duplicate delivery as another execution.

This query counts attempts with recorded computation starts. The separate action-retry history has two `STARTED` events but only one `COMPUTE_STARTED`, so use its complete timeline to see both attempts.

For failure investigation, a `terms` filter on `COMPUTE_FAILED` and `JOB_FAILED` returned two records: the retry's first-attempt failure and `job-late`'s contradictory failure. Calling both jobs "currently failed" discards the rest of their histories.

### Identify contradictory and unresolved histories

`job-late` first records `COMPLETED` at sequence 6. A later ingestion adds `JOB_FAILED` at sequence 7, with an earlier `event_time`. Sort by ingestion time and you pick the failure. Sort by event time and you can hide that it arrived after completion. Neither choice resolves the contradiction.

Keep both records and classify the authored history as `INCONSISTENT`, with the supporting event IDs. You can then inspect the producer or the external service.

`job-unknown` ends with `HOLD_UNKNOWN` for a stable action ID. The history has an action request and no confirmation. That supports "the recorded outcome is unresolved." It doesn't establish that the external action failed or never happened. A worker needs an independent receipt or a service lookup before it can safely decide whether to repeat the action.

`alpha/job-ok` and `beta/job-ok` share a job name, so every tenant-scoped query includes `tenant_id`. That checks query selection only. Access control still has to stop a caller from dropping the filter or reading another tenant's documents.

For a real workflow, keep an authoritative event source, define how missing or late events get detected, and retain history for the investigation period.

## Results

The reproduction run on 10 October 2026 GST returned the following results:

| Investigation | Recorded result |
| --- | --- |
| Retry timeline | Nine events across two attempts; attempt 1 records `COMPUTE_FAILED`, and attempt 2 reaches `COMPLETED`. |
| Timeline pagination | Three pages of three events, followed by an empty terminal page; all nine expected event IDs appear once. |
| Action-retry timeline | Eight events across two attempts; both confirmation records carry the same action ID and different event IDs. |
| Computation starts | Six composite buckets in the original 33-event corpus, including two for `alpha/job-retry`. |
| Failure filter | Two records: the retry's first-attempt failure and `job-late`'s contradictory failure. |
| Unresolved action | `job-unknown` records an action request and `HOLD_UNKNOWN`, with no confirmation. |

The [captured response summary](/assets/media/blog-images/2026-10-10-querying-ai-agent-job-histories/lab/results/raw-summary.json) contains the run results. The [captured action-retry responses](/assets/media/blog-images/2026-10-10-querying-ai-agent-job-histories/lab/results/os17-pages-v4a.json) include the second and third pages, where sequences 5 and 7 share an action ID.

The run does not measure agent performance or test tenant access control.

## Conclusion

A final status can hide a confirmation before a restart or a failure recorded after completion. With stable identities and a complete timeline, those records remain available for investigation.

Questions about this approach are welcome on the [OpenSearch forum](https://forum.opensearch.org/).
