---
layout: post
has_science_table: true
title: "Investigating a late agent alert with OpenSearch"
authors: [tridev-tej]
date: 2026-10-10
categories: [technical-posts]
tags: [opensearch, observability]
excerpt: "Follow a late image-error card to its exact run reference, inspect the older rejection, and assess a completed synthetic-image QA turn from its own retained evidence."
---

During my Lumian QA task, I asked an agent to read `SKU` and `ORDER` fields from a synthetic image. `qa-run-3` started at 21:56:05 GST and completed at 21:56:11 GST; its directly linked saved reply contained both labels. Then an image-error card arrived at 21:56:51 GST, about 40 seconds later. Its `alert_run_id` was `qa-run-2`. Should I reopen the completed turn, or investigate an older run?

This is a retrospective investigation of real retained Lumian QA records, sanitized and projected into an explanatory field model. I ran the fixture's four requests later in an OpenSearch 3.9.0 sandbox for this article. Identifiers are aliases; all incident times are 18 September 2026 GST (UTC+4).

The [complete fixture and setup](/assets/media/blog-images/2026-10-10-querying-ai-agent-job-histories/agent-image-investigation.txt) includes the mapping, nine records, four requests and detailed event inventory. `durable_run_id` identifies a run in the stored history; `alert_run_id` records the run reference carried by a card. Keeping them separate lets me follow the card's reference without assigning it to whichever run happened most recently.

## Find the run referenced by the card

This search looks for the card's `qa-run-2` reference in either field within `qa-thread` (request C in the companion). Both requests below use `POST /<index>/_search` against that fixture.

```json
{
  "size": 9,
  "track_total_hits": true,
  "query": {
    "bool": {
      "filter": [{ "term": { "thread_id": "qa-thread" } }],
      "should": [
        { "term": { "durable_run_id": "qa-run-2" } },
        { "term": { "alert_run_id": "qa-run-2" } }
      ],
      "minimum_should_match": 1
    }
  },
  "sort": [{ "at": "asc" }, { "doc_id": "asc" }]
}
```

With the thread filter in place, `minimum_should_match: 1` requires at least one of the two exact reference matches ([Boolean query documentation](https://docs.opensearch.org/latest/query-dsl/compound/bool/)). Selected response excerpt, showing three hits with fields reduced:

```text
21:27:01 GST  durable_run_id=qa-run-2  (run creation)
21:31:18 GST  alert_run_id=qa-run-2    (card envelope)
21:56:51 GST  alert_run_id=qa-run-2    (card envelope)
```

Run `at` values are creation times; alert `at` values are envelope times. The completion time in the opening is retained context, not the indexed `at`.

The reference leads to an older run. It says `status=succeeded`, but `exit_reason=anthropic_error`, and retained event 2 contains this provider rejection:

> At least one of the image dimensions exceed max allowed size: 8000 pixels

Reading only `status` would miss that rejection. The late card points back to this run even though another turn completed closer to its arrival. The quoted rejection does not measure the original image or establish current provider policy.

## Inspect the later turn's own evidence

This search returns the three QA run records in creation order (request B in the companion):

```json
{
  "size": 9,
  "track_total_hits": true,
  "query": {
    "bool": {
      "filter": [
        { "term": { "kind": "run" } },
        { "term": { "thread_id": "qa-thread" } }
      ]
    }
  },
  "sort": [{ "at": "asc" }, { "doc_id": "asc" }]
}
```

Selected response excerpt: only `qa-run-3`, with fields reduced from the three-hit response:

```json
{
  "durable_run_id": "qa-run-3",
  "status": "succeeded",
  "exit_reason": "end_turn",
  "recorded_error_events": 0,
  "reply_field_names": ["SKU", "ORDER"]
}
```

This run records normal completion, zero retained error events and both requested reply labels. The completed turn and the referenced rejection belong to different runs. Completion does not establish that the extracted values are accurate.

## Decide what the late card warrants

Based on this reconstruction, I would associate the card with `qa-run-2` and keep investigating that rejection. This card alone would not justify reopening or rerunning `qa-run-3`. I would assess that completed turn separately and compare its `SKU` and `ORDER` values with the image before accepting the extraction.

The counts cover retained events only, not every execution or side effect. A missing or partial inventory leaves the counts unknown. The three QA user messages referenced the same uploaded file, but shared references do not establish identical transmitted bytes.

Attributing the later completion to a repair would require evidence of the serving revision for those runs. The run comparison alone cannot supply that evidence. Likewise, finding the reused `qa-run-2` reference establishes which run the card names; it does not explain why the card was emitted.
