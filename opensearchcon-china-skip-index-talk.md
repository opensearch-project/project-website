# From 100x to the Next Frontier: Skip Index-Based Aggregation Optimizations in OpenSearch

**OpenSearchCon China 2026 — Shanghai**
**Presenters:**
**Ankit Jain, Software Engineer, AWS Opoensearch Service**
**Asim Mahmood, Software Engineer, AWS OpenSearch Service**

---

## Slide 1: Title

**From 100x to the Next Frontier: Skip Index-Based Aggregation Optimizations in OpenSearch**

Ankit Jain
Software Engineer, AWS OpenSearch Service
OpenSearchCon China 2026 | Shanghai

Asim Mahmood
Software Engineer, AWS OpenSearch Service
OpenSearchCon China 2026 | Shanghai

*Follow-up to "Transforming Bucket Aggregations: Our Journey to 100x Performance Improvement" — OpenSearchCon NA 2024*

### Speaker Notes

Welcome everyone, thank you for being here. My name is Ankit Jain, I'm a software engineer on the AWS OpenSearch Service team. Today I'm going to share the next chapter in our aggregation performance story. Last year at OpenSearchCon North America, we presented presented how we achieved up to 100x faster date histogram aggregations using filter rewrite and multi-range traversal. Today, with my colleague Asim Mahmood, we'll show you how we pushed beyond those gains using a completely different approach — doc value skip indexes — to accelerate aggregations that our previous techniques couldn't touch. If you haven't seen the previous talk, don't worry — I'll recap the key ideas before we dive in.

---

## Slide 2: About Us



- Software Engineer, AWS OpenSearch Service
- Co-author of the skip index aggregation optimizations
- Contributor to OpenSearch and Lucene

Ankit Jain
- GitHub: @jainankitk

Asim Mahmood
- GitHub: @asimmahmood1

### Speaker Notes

Quick intro — I work on the OpenSearch team at AWS, focusing on search and aggregation performance. I co-authored the skip index-based optimizations we'll discuss today alongside Asim Mahmood. Feel free to reach out on GitHub or Slack after the talk if you want to dig deeper into any of this.

---

## Slide 3: Recap — The Story So Far

**Date histogram latency improvements across OpenSearch versions (big5 benchmark)**

| Version | Daily Agg | Hourly Agg | Minutely Agg |
|---------|-----------|------------|--------------|
| 2.7/2.11 | Baseline | Baseline | Baseline |
| 2.12 | ~50x faster | ~50x faster | Minimal gain |
| 2.14 | ~50x faster | ~50x faster | ~100x faster |

**Key techniques:**
- **Filter rewrite** (2.12): Rewrote date histogram into range filters, used BKD tree to count docs without visiting individual doc values → O(N) became O(log N)
- **Multi-range traversal** (2.14): Single sorted pass through BKD tree for all buckets → eliminated per-bucket tree traversal overhead

### Speaker Notes

In the previous talk, we showed how we transformed date histogram aggregations from a linear scan over every document into a logarithmic tree traversal. The first breakthrough was filter rewrite — instead of iterating over doc values one by one, we rewrote the aggregation into range filters and used Lucene's BKD tree to count documents per bucket. This gave us roughly 50x improvement for daily and hourly aggregations. But minutely aggregations with thousands of buckets didn't benefit much because we were still traversing the tree from the top for each bucket. That's where multi-range traversal came in — a two-pointer approach that processes all buckets in a single pass through the tree. This brought minutely aggregations up to 100x faster as well. These were massive wins. 

---

## Slide 4: Where Filter Rewrite Falls Short

**Two fundamental limitations:**

1. **Filter field must equal aggregation field**
   - BKD tree only has info about one field
   - If you filter on field A but aggregate on field B, the tree can't help

2. **No support for subaggregations**
   - Filter rewrite only provides document counts
   - Can't compute averages, sums, or other metrics within buckets

**Example — uncorrelated fields:**
```json
{
  "query": {
    "range": {
      "trip_distance": { "gte": 0, "lte": 20 }
    }
  },
  "aggs": {
    "dropoffs_over_time": {
      "date_histogram": {
        "field": "dropoff_datetime",
        "calendar_interval": "month"
      }
    }
  }
}
```

→ BKD tree for `trip_distance` knows nothing about `dropoff_datetime`
→ Falls back to scanning every matching document one by one

### Speaker Notes

So what's the problem? Filter rewrite and multi-range traversal rely on a key assumption: the field you're filtering on IS the field you're aggregating on. In that case, the BKD tree for that field gives you everything you need. But look at this query — we're filtering on trip_distance but aggregating on dropoff_datetime. These are completely different fields. The BKD tree for trip_distance has zero information about how dropoff_datetime values are distributed. So the engine can't rewrite anything — it falls back to the old approach of iterating over every matching document and looking up each dropoff_datetime value individually. The second limitation is subaggregations. If you want the average fare amount within each monthly bucket, filter rewrite can't help because it only gives you counts, not access to individual field values. And these aren't edge cases — in practice, most analytical queries filter on one dimension while aggregating on another. Dashboards almost always have subaggregations. We needed a more general solution.

---

## Slide 5: The Real-World Problem

**Typical observability query:**
```json
{
  "query": {
    "bool": {
      "must": [
        { "range": { "@timestamp": { "gte": "2024-01-01", "lte": "2024-01-31" } } },
        { "term": { "process.name": "systemd" } }
      ]
    }
  },
  "aggs": {
    "daily_counts": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "day"
      }
    }
  }
}
```

- The `range` on `@timestamp` could use filter rewrite...
- But the `term` filter on `process.name` prevents the rewrite
- Engine must iterate over every matching document individually

**This is the common case in production dashboards.**

### Speaker Notes

Here's what this looks like in a real observability scenario. You're looking at logs for the month of January, filtered to just the systemd process, and you want a daily count. Now, the range query on @timestamp could theoretically benefit from filter rewrite. But the moment you add that term filter on process.name, the optimization breaks down. The query now involves two different fields, and the BKD tree for @timestamp can't account for which documents also match the process.name filter. So the engine falls back to the slow path — iterate over every matching document, look up each @timestamp value, place it in the right bucket. This is the common case in production. Almost every dashboard has multi-field filters. We needed something that works regardless of how the matching document set was produced.

---

## Slide 6: Enter Lucene 10 — Doc Value Skip Indexes

**A new indexing structure in Lucene 10.0**

Think of it like a **table of contents** for a book:
- Instead of scanning every page → check chapter headings first
- Then section headings → then narrow to the exact page
- Skip index does the same for doc values

**Key difference from BKD-based optimizations:**
- Operates on **doc values**, not the Points index
- Works **regardless of which field the query filters on**
- The aggregation field's skip index is consulted **after** the query produces matching doc IDs

**References:**
- Lucene PR #13449 — Initial skip index implementation
- Lucene PR #13563 — Multi-level support

### Speaker Notes

This is where Lucene 10 gives us a new datastructure on top of docvalues. Starting with Lucene 10.0, there's an optional skip index that sits on top of numeric doc values. The best way to think about it is like a table of contents for a book. If you're looking for something specific, you don't read every page — you check the chapter headings first, then the section headings, then narrow down to the exact page. The skip index works the same way for doc values. It lets the aggregation engine check summary metadata for large blocks of documents before deciding whether to examine individual values. And here's the critical difference from our previous BKD-based optimizations: this structure operates on doc values, not the Points index. So it works regardless of which field the query filters on. The query engine first evaluates the query using whatever indexes are appropriate for the filter fields, produces a set of matching document IDs, and then during aggregation, it consults the skip index on the aggregation field. This decoupling is the key insight.

---

## Slide 7: Skip Index Architecture

**4-level deterministic hierarchy:**

| Level | Documents per Interval | Description |
|-------|----------------------|-------------|
| 0 | 4,096 | Base interval |
| 1 | 32,768 (4,096 × 8) | Every 8 level-0 intervals |
| 2 | 262,144 (4,096 × 64) | Every 8 level-1 intervals |
| 3 | 2,097,152 (4,096 × 512) | Every 8 level-2 intervals |

**Each interval entry: only 29 bytes**
- Min/max value (16 bytes)
- Min/max doc ID (8 bytes)
- Document count (4 bytes)
- Number of levels (1 byte)

**Scale:** For ~2.1 billion docs → ~524K level-0 entries, ~1K level-3 entries
→ Billions of documents reduced to thousands of metadata checks

*[Show skip index visualization diagram]*

### Speaker Notes

Let me walk you through the architecture. Unlike a probabilistic skip list, Lucene's implementation is entirely deterministic. It divides documents into fixed-size intervals and builds a hierarchy of summary levels. At the base level — level 0 — each interval covers 4,096 documents. Each subsequent level aggregates 8 intervals from the level below. So level 1 covers about 32,000 documents, level 2 covers about 262,000, and level 3 covers over 2 million documents per interval. Each entry is remarkably compact — just 29 bytes. It stores the minimum and maximum field values within that interval, the document ID boundaries, and the document count. For a worst-case index with 2.1 billion documents, the entire skip index hierarchy has about 524,000 entries at level 0 and only about 1,000 entries at level 3. So we've reduced the search space from billions of documents to a few thousand metadata checks. The traversal starts at the highest available level and descends only when needed — very similar in spirit to how BKD tree traversal skips entire subtrees.

---

## Slide 8: Three Decisions Per Interval

**For each interval, the engine checks min/max values against the current bucket:**

```
┌─────────────────────────────────────────────────┐
│  Interval min/max OUTSIDE bucket?  → SKIP       │
│  (Don't look at any documents)                  │
├─────────────────────────────────────────────────┤
│  Interval min/max WITHIN one bucket? → BULK     │
│  COUNT (Count all docs without individual       │
│  inspection)*                                    │
├─────────────────────────────────────────────────┤
│  Interval SPANS multiple buckets? → FALL BACK   │
│  (Process documents individually)               │
└─────────────────────────────────────────────────┘
```

**Example — hourly buckets on @timestamp:**
- Block 42: values 14:00:01 to 14:20:59 → entirely within 14:00-15:00 bucket → **BULK COUNT**
- Block 43: values 14:55:00 to 15:05:30 → spans bucket boundary → **FALL BACK**
- Block 44: values 15:10:00 to 15:45:00 → entirely within 15:00-16:00 bucket → **BULK COUNT**

→ ~85% reduction in individual doc value lookups
* caveat: how we count all, will cover later

### Speaker Notes

So what does the engine actually do with this metadata? For each interval, it makes one of three decisions. First — if the interval's min and max values fall entirely outside the current aggregation bucket, skip the entire interval. Don't look at any documents. Second — if the min and max values fall entirely within a single bucket, bulk-count all documents without inspecting individual values. This is the big win. Third — if the interval spans multiple bucket boundaries, fall back to processing documents one by one. Let me give you a concrete example. Say we're doing hourly buckets on @timestamp. Block 42 has values from 14:00:01 to 14:20:59 — that's entirely within the 2 PM to 3 PM bucket, so we bulk-count the whole block. Block 43 has values from 14:55 to 15:05 — it crosses the hour boundary, so we fall back to individual processing. Block 44 is back within a single bucket, so we bulk-count again. In practice, the vast majority of blocks fall within a single bucket, giving us roughly 85% reduction in individual doc value lookups.

---

## Slide 9: The Key Insight — Decoupling Filter from Aggregation

```
┌──────────────┐     ┌───────────────────┐     ┌─────────────────────┐
│  Query Phase │     │  Matching Doc IDs │     │  Aggregation Phase  │
│              │ --→ │  (any filter      │---→ │  Skip index on      │
│  Filter on   │     │   combination)    │     │  aggregation field  │
│  ANY field(s)│     │                   │     │  decides:           │
│              │     │                   │     │  skip/bulk/fallback │
└──────────────┘     └───────────────────┘     └─────────────────────┘
```

**Why this matters:**
- Filter rewrite: filter field = aggregation field (coupled)
- Skip index: filter field ≠ aggregation field (decoupled) ✓
- The skip index doesn't care HOW the document set was produced
- It only needs the aggregation field's value distribution within each interval

### Speaker Notes

The fundamental breakthrough of skip indexes is the decoupling of the filter phase from the aggregation phase. With filter rewrite, the filter field and aggregation field had to be the same — they were tightly coupled. With skip indexes, they're completely independent. The query engine first evaluates whatever filters you have — term queries, range queries, boolean combinations, anything — and produces a set of matching document IDs. Then, during aggregation, it consults the skip index on the aggregation field to decide whether blocks of those matching documents can be skipped or bulk-counted. The skip index doesn't care how the document set was produced. It only needs information about the aggregation field's value distribution within each interval. This is what lets us optimize the queries that filter rewrite could never touch.

---

## Slide 10: Efficient Counting with Popcount

**The subtlety:** Skip index covers ALL docs in the segment, but we only want FILTERED docs

**Problem:** Can't use the interval's doc count directly
**Naive approach:** Advance through iterator one doc at a time → defeats the purpose

**Solution: Hardware `popcount` instruction**

```
Matching docs as bitset:  [0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, ...]
                           ↑                                      ↑
                     interval start                         interval end

popcount(bitset words) → exact count of matching docs in interval
                         in a single CPU operation per word
```

- Query engine represents matching docs as a bitset (1 bit per doc ID)
- Extract bits within the skip index interval's doc ID range
- Apply `popcount` across those words → exact filtered count
- Also supports bulk collection interface (stream of doc IDs collected in one operation)

**Result:** Additional ~3x improvement on top of skip index gains

### Speaker Notes

There's an important subtlety in the bulk-counting step that I want to highlight. When the skip index tells us that all values in an interval fall within a single bucket, we know we can bulk-count. But we can't just use the interval's document count directly. Why? Because the skip index covers ALL documents in the segment, but we only want the documents that matched our query filters. One approach is to advance through the iterator one document at a time, counting as we go. But that defeats the purpose of skipping. Instead, we use a hardware-level optimization — the popcount instruction, which counts the number of set bits in a machine word in a single CPU operation. The query engine often represents the matching document set as a bitset — each bit corresponds to a document ID, set to 1 if the document matched. To count matching documents within a skip index interval, we extract the relevant portion of this bitset and apply popcount across those words. This gives us the exact count without iterating. Combined with a bulk collection interface where the collector receives streams of doc IDs instead of one at a time, this adds roughly another 3x improvement on top of the skip index gains.

---

## Slide 11: Sorted Data — Where Skip Indexes Shine

**Why sorting matters:**
- Sorted data → narrow min/max ranges per interval → more bulk-counting
- Unsorted data → wide min/max ranges → more fallbacks to per-doc processing

**Time-series data is naturally sorted** (logs, metrics, observability)

**Two approaches to maintain sort order:**

1. **Index sort (recommended):**
```json
{
  "settings": {
    "index.sort.field": "@timestamp",
    "index.sort.order": "desc"
  }
}
```

2. **Log merge policy:** `log_byte_size` preserves temporal ordering for append-only workloads

**Key point:** Skip indexes still work on unsorted data — just with fewer optimization opportunities

### Speaker Notes

Skip indexes deliver their best performance when documents are sorted by the aggregation field. The reason is straightforward — when data is sorted, consecutive documents have similar values, so the min/max range within each 4,096-document interval is narrow. Narrow ranges are more likely to fall entirely within a single aggregation bucket, which means more bulk-counting and fewer fallbacks. For time-series workloads — which I know many of you are running — this is great news. Log data, metrics, observability data — it all arrives in roughly chronological order. Data streams in OpenSearch maintain this ordering naturally. To guarantee sort order is preserved through segment merges, you can configure an explicit index sort setting on @timestamp. Alternatively, the log_byte_size merge policy tends to maintain temporal ordering for append-only workloads. I want to emphasize — skip indexes still work correctly on unsorted data. You just get fewer opportunities for skipping and bulk-counting because each interval's range is likely to span multiple buckets.

---

## Slide 12: Performance Results

### Date histogram (http_logs workload)

| Operation | Baseline (p90) | With Skip Index (p90) | Improvement |
|-----------|----------------|----------------------|-------------|
| `hourly_agg_with_filter` | 998 ms | 36 ms | **28x faster** |
| `hourly_agg_with_filter_and_metrics` | 1,618 ms | 970 ms | **40% faster** |

### Auto date histogram (big5 workload)

| Operation | Baseline (p90) | With Skip Index (p90) | Improvement |
|-----------|----------------|----------------------|-------------|
| `range-auto-date-histo` | 2,099 ms | 324 ms | **6.5x faster** |
| `range-auto-date-histo-with-metrics` | 5,733 ms | 3,928 ms | **35% faster** |

### Storage overhead

| Configuration | Size Increase |
|--------------|---------------|
| `@timestamp` field only | ~0.1% |
| All numeric fields | ~1% |

### Speaker Notes

On the http_logs workload, the pure counting aggregation with an uncorrelated filter went from 998 milliseconds to 36 milliseconds — that's 28x faster. This is the case where filter rewrite couldn't help at all before. When we add subaggregations with metrics, the improvement is smaller — 40% faster — because per-document metric computation still requires individual value lookups for the metric fields. But that's still significant. On the big5 workload with auto date histograms, we see 6.5x improvement for pure counting and 35% for metrics. These results combine filter rewrite for the range query with skip indexes for the auto date histogram, showing how the two techniques complement each other. And the storage cost? Negligible. Enabling skip indexes on just the @timestamp field adds about 0.1% to index size. Even enabling it on ALL numeric fields only adds about 1%. So we're getting massive performance gains with essentially zero storage cost.

---

## Slide 13: How It All Fits Together

| Technique | When It Applies | Limitation |
|-----------|----------------|------------|
| **Filter rewrite** | Filter field = aggregation field, simple counting | Can't handle uncorrelated fields or subaggregations |
| **Multi-range traversal** | Same as filter rewrite, many buckets | Same limitations as filter rewrite |
| **Skip index** | Any query pattern, any aggregation field | Best on sorted data; graceful fallback on unsorted |

**OpenSearch picks the best strategy automatically:**
- Eligible for filter rewrite? → Use it (avoids doc value access entirely)
- Not eligible? → Skip index provides a fast fallback
- The two approaches cover complementary parts of the query space

### Speaker Notes

I want to be clear — skip indexes don't replace filter rewrite and multi-range traversal. They complement them. Think of it as layers of optimization. When a query is eligible for filter rewrite — meaning the filter field and aggregation field are the same and there are no subaggregations — OpenSearch uses filter rewrite because it avoids doc value access entirely. That's still the fastest path. But when filter rewrite can't apply — uncorrelated fields, subaggregations, complex boolean queries — skip indexes provide a fallback that is still dramatically faster than scanning every document. OpenSearch picks the best strategy automatically. The user doesn't need to do anything special. Together, these techniques cover the full spectrum of aggregation query patterns.

---

## Slide 14: Enabling Skip Indexes

### Default behavior by version

| Version | Behavior |
|---------|----------|
| OpenSearch 3.2 | Introduces `skip_list` mapping parameter (default: `false`) |
| OpenSearch 3.3 | Auto-enables for `@timestamp` on date histogram aggregations |
| OpenSearch 3.4 | Extends to auto date histogram aggregations on `@timestamp` |

### Manual configuration

```json
PUT /my-index
{
  "mappings": {
    "properties": {
      "custom_timestamp": {
        "type": "date",
        "skip_list": true
      },
      "price": {
        "type": "long",
        "skip_list": true
      }
    }
  }
}
```

### Speaker Notes

How do you actually use this? If you're on OpenSearch 3.3 or later and you have a field called @timestamp, you get skip index optimization automatically on date histogram aggregations — no configuration needed. OpenSearch 3.4 extends this to auto date histograms as well. For other numeric fields, you can manually enable skip indexes by adding the skip_list parameter to your field mapping. This works for date fields, longs, integers — any numeric type. My recommendation: if you have a time-series workload, make sure you're on 3.3+ and your timestamp field is named @timestamp. You'll get the optimization for free. If you have other numeric fields that you frequently aggregate on, consider enabling skip_list on those as well — the storage overhead is minimal.

---

## Slide 15: What's Next

**Active development areas:**

- **Min/max aggregations** — Use skip index metadata for instant min/max without visiting any documents (issue #20174)

- **Enhanced bucket handling** — Support multiple owning bucket ordinals for complex aggregation patterns

- **Bulk processing & vectorization** — Restructure collection loops to process documents in batches:
  - Load field values into contiguous buffers
  - JVM auto-vectorization and SIMD instructions for sums, averages, min/max
  - Reduce virtual method call overhead (one `collect()` per batch instead of per document)
  - Especially promising for subaggregations with per-document metrics

**The philosophy:** Identify the bottleneck → understand the data structures → avoid unnecessary work

### Speaker Notes

(need to edit)
We're not done. The OpenSearch community is actively extending skip index capabilities. One exciting direction is using skip index metadata for instant min/max calculations — if the skip index already stores the min and max values for each interval, we can compute global min/max without visiting any documents at all. We're also working on enhanced bucket handling for more complex aggregation patterns. And perhaps most exciting is the work on bulk processing and vectorization. The idea is to restructure collection loops to process documents in batches rather than one at a time. By loading field values into contiguous buffers, the JVM can apply auto-vectorization and SIMD instructions to compute sums, averages, and min/max across many values simultaneously. This is especially promising for subaggregations where per-document overhead currently dominates. The underlying philosophy hasn't changed since the first talk: identify the bottleneck, understand the data structures, and find ways to avoid unnecessary work. Filter rewrite taught us that counting through an index tree is faster than iterating over doc values. Skip indexes extend that lesson — even when we must use doc values, we can still avoid looking at every single one.

---

## Slide 16: Resources & Links

- **Blog post:** "Beyond filter rewrite: How doc value skip indexes accelerate aggregations in OpenSearch"
- **Previous talk:** [Transforming Bucket Aggregations — OpenSearchCon NA 2024](https://www.youtube.com/watch?v=wS7vg50Vv0U)
- **Previous blog:** [opensearch.org/blog/transforming-bucket-aggregations-our-journey-to-100x-performance-improvement](https://opensearch.org/blog/transforming-bucket-aggregations-our-journey-to-100x-performance-improvement/)
- **Meta issue:** [#18882](https://github.com/opensearch-project/OpenSearch/issues/18882) — Skip index implementation plan
- **Benchmarks:** [#19384](https://github.com/opensearch-project/OpenSearch/issues/19384) — Results and ongoing work
- **Key PRs:** [#19130](https://github.com/opensearch-project/OpenSearch/pull/19130), [#20057](https://github.com/opensearch-project/OpenSearch/pull/20057)

**Contact:**
- GitHub: @jainankitk
- GitHub: @asimmahmood
- OpenSearch Slack

### Speaker Notes

Here are all the links if you want to dive deeper. The blog post has the full technical details with diagrams. The meta issue on GitHub tracks the complete skip index implementation plan, and the benchmark issue has detailed performance results. I'd especially encourage you to check out the previous talk video if you haven't seen it — it provides the foundation for everything we discussed today. Feel free to reach out on GitHub or Slack. I'm happy to discuss any of this further.

---

## Slide 17: Q&A

**Thank you!**

Questions?

### Speaker Notes

That wraps up the presentation. Thank you all for your time and attention. I'm happy to take any questions. If we run out of time, please find me after the session or reach out online — I'd love to continue the conversation.

---

## Appendix: Timing Guide

| Slide | Topic | Duration | Cumulative |
|-------|-------|----------|------------|
| 1 | Title | 0:30 | 0:30 |
| 2 | About Me | 1:00 | 1:30 |
| 3 | Recap — Story So Far | 2:00 | 3:30 |
| 4 | Where Filter Rewrite Falls Short | 2:00 | 5:30 |
| 5 | Real-World Problem | 1:30 | 7:00 |
| 6 | Enter Lucene 10 — Skip Indexes | 3:00 | 10:00 |
| 7 | Skip Index Architecture | 3:00 | 13:00 |
| 8 | Three Decisions Per Interval | 2:00 | 15:00 |
| 9 | Key Insight — Decoupling | 2:00 | 17:00 |
| 10 | Popcount | 2:00 | 19:00 |
| 11 | Sorted Data | 2:00 | 21:00 |
| 12 | Performance Results | 3:00 | 24:00 |
| 13 | How It All Fits Together | 2:00 | 26:00 |
| 14 | Enabling Skip Indexes | 1:30 | 27:30 |
| 15 | What's Next | 2:00 | 29:30 |
| 16 | Resources | 0:30 | 30:00 |
| 17 | Q&A | 3-4 min | ~33:00 |
