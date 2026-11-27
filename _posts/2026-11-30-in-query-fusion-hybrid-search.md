---
layout: post
title: "Hybrid search as a building block: in-query fusion in OpenSearch 3.10"
authors:
  - gaievski
  - seanzheng
  - kolchfa
date: 2026-11-30
categories:
  - technical-posts
meta_keywords: hybrid search, hybrid query, in-query fusion, rescore, function_score, search relevance, OpenSearch 3.10
meta_description: Use in-query fusion in OpenSearch 3.10 to nest hybrid queries inside other queries, combine several in one request, and rescore the fused results.
excerpt: In-query fusion is a new per-query execution mode for the hybrid query in OpenSearch 3.10. It lets a hybrid query sit inside other queries, appear more than once in a request, or be rescored after fusion.
has_science_table: true
has_math: false
---

Consider a product catalog that combines lexical and vector search. Your relevance team wants to multiply a hybrid score by a product-rating signal, place an exact SKU match ahead of the fused list, blend title-focused and description-focused strategies in one request, and rerank the best candidates with a phrase query—all after fusion.

Until now, none of that was possible: classic hybrid search fuses scores in a search pipeline between the query and fetch phases, so the hybrid query must be the top-level query and can't be wrapped, combined, or rescored on the fused result.

OpenSearch 3.10 introduces in-query fusion, a per-query execution mode that fuses subquery scores during query rewrite. Add a `fusion` block to the existing `hybrid` query, and the fused score becomes a regular score that `function_score`, `dis_max`, `bool`, and `rescore` can all act on. A query that carries `fusion` is a fused hybrid query; one without it is a classic hybrid query.

## How hybrid search fuses scores

A hybrid query has traditionally had to stand alone since the 2.10 version where it has been introduced. In classic hybrid search, a search pipeline's normalization or score ranker processor fuses subquery scores after the query phase. The examples use a `products` index whose embedding fields are filled by a [text-embedding ingest pipeline](https://docs.opensearch.org/latest/ingest-pipelines/processors/text-embedding/).

Take that catalog. Classic hybrid search builds one result list per subquery on every shard. A phase-results processor on the coordinating node then normalizes the scores, combines the lists, and sends the ranking to the fetch phase. Because the fused score does not exist during the main query, the hybrid query must be at the root. Its scoring configuration lives in a pipeline, and rescore operates on each subquery before normalization.

For example, wrapping a classic hybrid query in `function_score` is rejected:

```json
POST /products/_search?search_pipeline=hybrid-minmax
{
  "query": {
    "function_score": {
      "query": {
        "hybrid": {
          "queries": [
            {
              "match": {
                "title": "walnut coffee table"
              }
            },
            {
              "neural": {
                "title_embedding": {
                  "query_text": "walnut coffee table",
                  "model_id": "<model_id>",
                  "k": 100
                }
              }
            }
          ]
        }
      },
      "functions": [
        {
          "field_value_factor": {
            "field": "average_rating",
            "modifier": "log1p",
            "missing": 1
          }
        }
      ],
      "boost_mode": "multiply"
    }
  }
}
```

Each ask runs into the same design:

- **Rating signal:** an enclosing `function_score` is rejected, as the preceding request shows; so is `constant_score`.
- **SKU match:** putting the hybrid query and a boosted SKU `term` query under `dis_max` is rejected too, while `bool` with a filter or `boosting` can silently bypass normalization rather than fail.
- **Two strategies in one request:** two hybrid queries in one search body are rejected.
- **Phrase rerank:** limited, classic hybrid search has accepted `rescore` since OpenSearch 2.18, but applies it per subquery, before normalization, so normalization can lower efficiency and visibility of boost.

## Introducing in-query fusion

In-query fusion keeps the existing `hybrid` query and adds an optional `fusion` block. The mode is on by default in 3.10.

Next, choose where the fusion configuration comes from. To reuse an existing search pipeline and set a 300-document global fusion window, use an object with `source`:

```json
POST /products/_search?search_pipeline=hybrid-minmax
{
  "query": {
    "hybrid": {
      "fusion": {
        "source": "pipeline",
        "window_size": 300
      },
      "queries": [
        {
          "match": {
            "title": "walnut coffee table"
          }
        },
        {
          "neural": {
            "title_embedding": {
              "query_text": "walnut coffee table",
              "model_id": "<model_id>",
              "k": 100
            }
          }
        }
      ]
    }
  }
}
```

The shorthand `"fusion": "pipeline"` also reads the techniques from the attached or default pipeline. Alternatively, put search configuration (`normalization`, `combination`, weights, and `window_size`) directly in the `fusion` object; this form does not require a search pipeline.

Note: `{"window_size": 300}` alone uses the built-in `min_max` and `arithmetic_mean` defaults. It does **not** read the attached pipeline. To reuse pipeline techniques while changing the window, write `{"source": "pipeline", "window_size": 300}`. If `"fusion": "pipeline"` cannot find a compatible normalization or score ranker processor, the request is rejected instead of returning raw scores.

A query without `fusion` stays on classic execution, existing search pipelines remain usable, and both modes can run in the same cluster.

### Sizing the fusion window

`window_size` is how many documents each subquery contributes to fusion. The default is 100, and the maximum is `indices.query.bool.max_clause_count - 1`, which is 1,023 with the default clause limit.

This is the one trade-off the mode introduces. Classic hybrid search pools each shard's own top list, so its candidate pool grows with the shard count; in-query fusion keeps a single global top `window_size` instead. On a multi-shard index the default is therefore shallower than classic's pool, and whether that shallower pool costs relevance depends on how many relevant documents a query has.

Two interactions matter. A k-NN subquery's `k` applies per shard, so that subquery can supply at most *k × shards* candidates; keep *k × shards* at or above `window_size`, or the vector subquery runs out before the window fills. And a query that already sets `pagination_depth` uses it to size the window unless `window_size` overrides it.

Which value to choose depends on how deeply your corpus is judged. A query with one or two relevant documents is unaffected by the default window; one with hundreds, where classic recalls only a fraction, is where a shallow window costs the most. Recall@100 is a cheap proxy. The benchmarks below measure what each window buys; see [Choosing the fusion window](#choosing-the-fusion-window) for the per-window numbers.

## How it works: Fusing after or before the main query

The following diagram compares the two execution paths.

![Two flow diagrams. In classic hybrid search, every shard runs the subqueries and returns its top results per subquery; the coordinating node pools the per-shard lists and a search pipeline processor normalizes and combines them before the fetch phase, so the fused score exists only after the query phase. In in-query fusion, the coordinating node runs each subquery as its own search during query rewrite, keeps each subquery's global top window_size candidates, normalizes and combines them, and rewrites the hybrid query into a standard query that then runs on the shards with enclosing queries, sort, aggregations, and rescore; for a simple top-level request that second trip is not needed.](/assets/media/blog-images/2026-11-30-in-query-fusion-hybrid-search/figure-1-where-fusion-happens.png){:class="img-centered"}

Both modes fuse scores on the coordinating node with the same normalization and combination techniques; they differ in when fusion happens and which candidates it sees.

**Classic hybrid search fuses after the main query.** Each shard returns its top `size` (or `pagination_depth`) documents per subquery, the coordinating node pools those lists—up to *size × shards* candidates per subquery—and the search pipeline's processor normalizes and combines them between the query and fetch phases. Nothing else in the request can use the fused score.

**In-query fusion fuses before the main query, during query rewrite.** The coordinating node runs each subquery as its own search across all shards and keeps its global top `window_size` candidates; routing, preference, timeout, point in time, and the hybrid query's own `filter` carry over. It fuses those lists and replaces the hybrid query with a standard query: the ranked documents with their fused scores plus, when totals or aggregations need them, the remaining matches without a fused score. Enclosing queries, sort, aggregations, and rescore then run on that standard query.

For a simple top-level request, OpenSearch can assemble the page from the subquery results without going back to the shards at all (default total hits may add a lightweight count). Enclosing queries, several fused hybrid queries, rescore, aggregations, and sort need that second trip.

**Why a global window.** A subquery contributes its global top `window_size` documents instead of *size × shards*, so the pool the coordinating node fuses is sized by the subqueries and the window, not by the shard count. On a multi-shard index the default window is therefore shallower than classic's pool. Fusing inside each shard ([Simplified hybrid query for self-contained shard-level hybrid search](https://github.com/opensearch-project/neural-search/issues/1777)) lost relevance as shards were added, and rebuilding classic's per-shard pool needs one search per subquery per shard.

## How in-query fusion helps

The examples answer the relevance team's asks in order. Every shape below needs the second trip to the shards that a plain fused request can skip, so what they buy is expressiveness, not lower latency. The following diagram shows the request shapes that can act on the fused score.

![Diagram of a hybrid query with fusion as a building block. Lexical and neural subqueries feed the fused hybrid query, whose fused score is used by four surrounding query shapes: function_score for business signals, dis_max to put an exact match first, bool.should or nesting to combine several strategies, and rescore to rerank the final candidates. A filter inside the hybrid query runs before fusion; the enclosing queries act after it.](/assets/media/blog-images/2026-11-30-in-query-fusion-hybrid-search/figure-2-building-block.png){:class="img-centered"}

**Table 1: Classic hybrid search and in-query fusion at a glance.**

| Request shape | Classic hybrid search | With `fusion` |
|---|---|---|
| Hybrid inside `function_score` or `dis_max` | Rejected | Enclosing query scores the fused result |
| Hybrid in `bool` with a filter, or in `boosting` | Unsupported; normalization may be bypassed | Enclosing query scores the fused result |
| Several hybrid queries in one request | Rejected | Siblings or nested fused hybrids |
| `rescore` | Per subquery, before normalization | Reranks the fused results |

### Boost and combine with `function_score`, `dis_max`, `bool`, or `boosting`

Because fusion happens first, an enclosing `function_score` can operate on the fused score. The following request filters to in-stock products before fusion, then multiplies the fused score by a rating factor:

```json
POST /products/_search
{
  "query": {
    "function_score": {
      "query": {
        "hybrid": {
          "fusion": {
            "window_size": 300,
            "normalization": {
              "technique": "min_max"
            },
            "combination": {
              "technique": "arithmetic_mean",
              "parameters": {
                "weights": [0.3, 0.7]
              }
            }
          },
          "filter": {
            "term": {
              "in_stock": true
            }
          },
          "queries": [
            {
              "match": {
                "title": "walnut coffee table"
              }
            },
            {
              "neural": {
                "title_embedding": {
                  "query_text": "walnut coffee table",
                  "model_id": "<model_id>",
                  "k": 100
                }
              }
            }
          ]
        }
      },
      "functions": [
        {
          "field_value_factor": {
            "field": "average_rating",
            "modifier": "log1p",
            "missing": 1
          }
        }
      ],
      "boost_mode": "multiply"
    }
  }
}
```

The next request answers the exact-match ask: a boosted SKU `term` query sits beside the fused hybrid query under `dis_max`, so a catalog-number hit outranks the fused list.

```json
POST /products/_search?search_pipeline=hybrid-minmax
{
  "size": 10,
  "query": {
    "dis_max": {
      "queries": [
        {
          "term": {
            "sku": {
              "value": "WCT-4823",
              "boost": 10
            }
          }
        },
        {
          "hybrid": {
            "fusion": {
              "source": "pipeline",
              "window_size": 300
            },
            "queries": [
              {
                "match": {
                  "title": "walnut coffee table"
                }
              },
              {
                "neural": {
                  "title_embedding": {
                    "query_text": "walnut coffee table",
                    "model_id": "<model_id>",
                    "k": 100
                  }
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

`boosting` can demote out-of-stock products. By contrast, the hybrid query's own `filter` runs before fusion and is where to restrict which documents compete for the window.

A selective filter wrapped around a fused hybrid query can remove ranked documents after fusion, leaving matches outside the window with score 0, which a multiplicative boost keeps at 0 but an additive score can lift. A `boost_mode` of `replace` can rank them above the window entirely; `track_total_hits: false` removes them. Supported composition is limited to the request's `query`; a fused hybrid query is refused elsewhere, including `post_filter`, sort, and `wrapper`.

### Run several hybrid queries in one request

A request can contain multiple fused hybrid queries. For example, one can fuse title signals while another fuses description signals, after which `bool.should` combines the two fused scores:

```json
POST /products/_search
{
  "size": 10,
  "query": {
    "bool": {
      "should": [
        {
          "hybrid": {
            "fusion": {
              "window_size": 300,
              "normalization": { "technique": "min_max" },
              "combination": {
                "technique": "arithmetic_mean",
                "parameters": { "weights": [0.3, 0.7] }
              }
            },
            "queries": [
              { "match": { "title": "walnut coffee table" } },
              {
                "neural": {
                  "title_embedding": {
                    "query_text": "walnut coffee table",
                    "model_id": "<model_id>",
                    "k": 100
                  }
                }
              }
            ]
          }
        },
        {
          "hybrid": {
            "fusion": {
              "window_size": 300,
              "normalization": { "technique": "min_max" },
              "combination": {
                "technique": "arithmetic_mean",
                "parameters": { "weights": [0.5, 0.5] }
              }
            },
            "queries": [
              { "match": { "description": "mid-century living room furniture" } },
              {
                "neural": {
                  "description_embedding": {
                    "query_text": "mid-century living room furniture",
                    "model_id": "<model_id>",
                    "k": 100
                  }
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

Each hybrid query has its own normalization, combination, and weights. A fused hybrid query can also be a direct subquery of another fused hybrid query, enabling fusion at more than one level. Keep score scales comparable when combining separately fused values: for example, an RRF score is typically much smaller than a `min_max` arithmetic-mean score.

The cluster setting `plugins.neural_search.hybrid.fusion.max_leg_searches` limits the total number of subquery searches—called *legs* in settings and error messages—across the request. The default is 25. Sibling hybrids run concurrently, while every additional nesting level introduces another trip to the shards.

### Rescore the fused results

Classic hybrid search already supports rescore, but it applies rescore to each subquery before normalization. In-query fusion changes the input to rescore: when the fused hybrid is the request's top-level query, a standard `query` rescorer reranks the already-fused window.

```json
POST /products/_search?search_pipeline=hybrid-minmax
{
  "size": 10,
  "query": {
    "hybrid": {
      "fusion": {
        "source": "pipeline",
        "window_size": 300
      },
      "queries": [
        {
          "match": {
            "title": "walnut coffee table"
          }
        },
        {
          "neural": {
            "title_embedding": {
              "query_text": "walnut coffee table",
              "model_id": "<model_id>",
              "k": 100
            }
          }
        }
      ]
    }
  },
  "rescore": {
    "window_size": 300,
    "query": {
      "rescore_query": {
        "match_phrase": {
          "title": {
            "query": "walnut coffee table",
            "slop": 1
          }
        }
      },
      "query_weight": 1.0,
      "rescore_query_weight": 0.1
    }
  }
}
```

This lets a post-fusion signal move a document that one subquery found above documents found by both subqueries. It does not add documents that fusion did not rank. Set `rescore.window_size`—which is applied per shard—to at least the fusion `window_size`, and tune weights with the fused score scale in mind. `min_max` arithmetic-mean scores are in the range [0, 1], while BM25 phrase scores can be much larger.

The request root must be the fused hybrid, which may itself contain nested fused subqueries. Rescore always needs the second trip. Core also forbids collapse and non-`_score` sort with any rescore. So the rating wrapper and the phrase rerank are alternatives in one request, not a pair.

## Moving a hybrid query to in-query fusion

Most hybrid queries move with one change: add `fusion` to the query. A few configurations stay on classic hybrid search for now, and pages will differ, so compare the results with your relevance judgments before you move traffic.

1. Upgrade every node; a fused request is refused until all nodes run 3.10 or later. No setting change is needed.
2. Add `"fusion": "pipeline"`, or move the techniques and weights into an inline `fusion` object.
3. Keep `pagination_depth` if the query has one: without `window_size`, it sizes the fusion window, never below the default of 100. Otherwise, set `window_size` to at least the deepest `from + size` page. Both are capped by `index.max_result_window`.
4. For classic-like candidate depth, size the window as described above. To retain pipeline techniques while setting it, use `{"source": "pipeline", "window_size": N}`.
5. Compare rankings, totals, and tied-document order with classic hybrid search before you move traffic.

Expect pages to differ. With `min_max`, each query's top 10 overlapped classic's on 66–90% of positions at the default window and 97–99% at matched depth. Pages end with the ranked documents: a page past them is short or empty with HTTP 200, whereas classic returns HTTP 400 beyond its `pagination_depth`. `hits.total` also differs: in-query fusion counts the union matched by the subqueries, up to the requested threshold and within an enclosing filter, while classic can return a lower total when a shard's candidate queue fills.

Use the following guide to decide which mode fits a query.

**Table 2: Which mode fits a query today.**

| Choose in-query fusion when… | Keep a query on classic hybrid search while… |
|---|---|
| Business or exact-match logic must act on the fused score, through `function_score`, `dis_max`, `bool`, or `boosting` | Nothing in the query needs to act on the fused score yet |
| Several hybrid strategies belong in one request, as siblings or nested | The ranking change has not been validated against your relevance judgments: pages, totals, and tie order differ |
| A `query` rescorer must see the fused candidates | The query needs `min_max` bounds, gRPC, `wrapper` or `template`, or custom routing with the same `_id` under different routing values |
| The fusion techniques must be configured in the request, without a search pipeline | It pages beyond about 1,000 results, or classic-like candidate depth would exceed the latency budget |

To turn the mode off cluster-wide, for example to roll back, set the dynamic setting `plugins.neural_search.hybrid.fusion.enabled` to `false`. Requests that carry `fusion` are then rejected rather than silently running as classic hybrid search:

```json
PUT /_cluster/settings
{
  "persistent": {
    "plugins.neural_search.hybrid.fusion.enabled": false
  }
}
```

When `plugins.neural_search.stats_enabled` is `true`, `GET /_plugins/_neural/stats` reports request and technique counters. Stats are disabled by default.

## Benchmarking in-query fusion against classic hybrid search

We compared the modes with the same subqueries, techniques, and weights on eight public datasets. The question was not whether in-query fusion generally performs better, but whether it preserves relevance, what it costs for a plain top-level request, and how `window_size` trades candidate depth for latency.

Classic's k-NN `k` applies on every shard, while the fused window is global, so we compare both the default window of 100 and a matched window near *k × shards*.

### How we ran the benchmarks

The campaign ran on the OpenSearch 3.10 release build: three Amazon Elastic Compute Cloud (Amazon EC2) `r5.8xlarge` data nodes, two cluster manager nodes, 12 primary shards per index, no replicas, no force merge. Eight public datasets totaling 5.9 million documents carried 768-dimensional `all-mpnet-base-v2` embeddings as Lucene HNSW vectors with cosine similarity. Each request paired a `match` subquery with a `neural` subquery at `k = 100`, using `min_max` and `arithmetic_mean` at equal weights, so in-cluster inference is included throughout.

Relevance used every judged query. Latency measured server-side `took` with the request cache disabled, three repetitions, modes interleaved per query, and up to 1,000 queries per dataset.

### Relevance: Equivalent at matched candidate depth

The fusion window is the control for this trade-off between relevance and latency. The following table shows how NDCG@10 moves with `window_size`.

**Table 3: NDCG@10 by dataset and fusion window, for in-query fusion and classic hybrid search**

| Dataset (documents) | Classic | Fusion, window 100 | Fusion, window 200 | Fusion, window 400 | Fusion, window 1,023 |
|---|---:|---:|---:|---:|---:|
| NFCorpus (3,633) | 0.3642 | 0.3650 | 0.3664 | 0.3662 | 0.3640 |
| SciDocs (25,657) | 0.2132 | 0.2178 | 0.2159 | 0.2145 | 0.2139 |
| WANDS (42,994) | 0.7378 | 0.7170 | 0.7242 | 0.7311 | 0.7370 |
| FiQA (57,600) | 0.4373 | 0.4411 | 0.4422 | 0.4393 | 0.4361 |
| TREC-COVID (171,331) | 0.7253 | 0.6380 | 0.6605 | 0.6906 | 0.7281 |
| Amazon ESCI (482,105) | 0.3718 | 0.3637 | 0.3668 | 0.3689 | 0.3712 |
| Quora (522,931) | 0.8933 | 0.8934 | 0.8935 | 0.8936 | 0.8933 |
| DBPedia (4,635,922) | 0.3730 | 0.3631 | 0.3690 | 0.3720 | 0.3732 |

At the default window of 100, the gap follows how deeply a dataset is judged, not how large it is. Quora, where a query has one or two relevant documents, is unchanged. TREC-COVID is the opposite extreme, and the reason it stands out in the table: each of its 50 queries has hundreds of judged relevant documents, and classic itself returns only 14% of them in the top 100, so a window of 100 leaves the most behind: 0.087 NDCG@10. DBPedia is nine times the size of the next-largest corpus and loses only 0.010.

### Latency: One setting decides the cost

For a plain top-level query—no aggregations, sort, collapse, highlight, or rescore—at the default window, the difference comes down to one request setting. With `track_total_hits` disabled, in-query fusion skips the second trip and stayed at or below classic on every dataset.

Requesting an exact count forces that trip, costing 6.3 to 15.6 ms, most on the largest corpus. With one client the differences are smaller.

**Table 4: Server-side `took` in milliseconds at the default window, eight concurrent clients.** Percentiles are p50 / p90 / p99. The first pair has `track_total_hits` disabled; second requests an exact total.

| Dataset | Classic | Fusion | Classic, exact total | Fusion, exact total |
|---|---:|---:|---:|---:|
| NFCorpus | 65 / 101 / 120 | 65 / 101 / 121 | 66 / 104 / 127 | 73 / 109 / 147 |
| SciDocs | 101 / 118 / 152 | 100 / 117 / 147 | 103 / 121 / 147 | 110 / 127 / 151 |
| WANDS | 67 / 88 / 121 | 67 / 89 / 120 | 68 / 91 / 111 | 76 / 99 / 131 |
| FiQA | 102 / 120 / 158 | 101 / 119 / 148 | 104 / 122 / 159 | 111 / 129 / 170 |
| TREC-COVID | 105 / 121 / 142 | 102 / 118 / 153 | 109 / 126 / 157 | 116 / 133 / 149 |
| Amazon ESCI | 76 / 105 / 135 | 75 / 104 / 132 | 85 / 111 / 137 | 94 / 121 / 149 |
| Quora | 109 / 128 / 162 | 106 / 125 / 165 | 115 / 135 / 175 | 123 / 143 / 184 |
| DBPedia | 97 / 133 / 172 | 93 / 127 / 167 | 105 / 142 / 178 | 120 / 154 / 179 |

### Choosing the fusion window

Four of the eight datasets were insensitive to the window; the other four recovered 60–90% of their gap at 400. Depth costs within 1 ms of classic with `track_total_hits` disabled, and 23 ms or more with an exact count.

The following chart shows how that recovery accumulates on the four datasets that have a gap to close.

![Line chart of the share of the classic hybrid search relevance gap that in-query fusion recovers as window_size rises from 100 to 1,023, for WANDS, TREC-COVID, Amazon ESCI and DBPedia. All four curves are concave: each climbs steeply to between 26 and 60 percent recovered by a window of 200, reaches 60 to 90 percent at 400, and then flattens close to parity with classic hybrid search between 800 and 1,023, so the first increases in the window buy far more than the last.](/assets/media/blog-images/2026-11-30-in-query-fusion-hybrid-search/figure-3-window-recovery.png){:class="img-centered"}

### Next: Measuring the new request shapes

Enclosing queries, multiple fused hybrids, and post-fusion rescore always need the second trip to the shards and are not benchmarked here. Measure them against the closest classic and application-side alternatives rather than extrapolating the top-level results.

A top-level `neural` subquery runs its model inference once per request; a fused hybrid nested inside another one can run it again when totals or remaining matches are needed. Use `track_total_hits: false` when totals are unnecessary, remembering that aggregations and highlighting still need those matches. The benchmark above uses a single top-level fused hybrid, so it does not measure that second inference.

## Conclusions

In-query fusion makes the hybrid query composable: the fused score is produced during query rewrite, so the rest of the request's `query` can act on it. Shapes that previously failed or quietly bypassed normalization—an enclosing `function_score` or `dis_max`, several hybrid strategies in one request, a `query` rescorer over the fused window—now work, each at the cost of another trip to the shards. It ships in OpenSearch 3.10 as a full feature of the hybrid query: selected per query, on by default, and switchable off cluster-wide.

The measurements back that up. At matched candidate depth the NDCG@10 difference is indistinguishable from zero on seven of the eight datasets and −0.0006 on the eighth, so the new shapes cost nothing in ranking quality, and at the default window `window_size` sets how close you are. Latency follows one setting: with `track_total_hits` disabled, in-query fusion was at or below classic on every dataset; requesting an exact count adds 6.3 to 15.6 ms.

## What to know before you switch

A few things are worth checking before you move traffic:

- **Rescore needs a fused root.** A request-level `query` rescorer sees the fused candidates when the fused hybrid is the request's top-level query. Under a standard compound query, or over fused siblings, it does not — there is no fused root to act on. Separately, only the `query` rescorer type is implemented, whatever the root: chains of those work, other types do not.
- **Custom routing is not ready.** The same `_id` under different routing values is not handled correctly yet.
- **Leave headroom below the clause limit.** The window is capped at `indices.query.bool.max_clause_count - 1`, 1,023 by default. Near that boundary an exact hit count can fail at the shard level, because the query's own clauses add to the window's, so size it in proportion to query length.
- **Unsupported:** `min_max` bounds, gRPC, cross-cluster search, `terminate_after`, derived fields, and a fused hybrid outside the request's `query`.

See [Limitations](https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/fusion-mode/#limitations) in the in-query-fusion documentation for the complete list.

## What's next

In-query fusion is the execution path we plan to build on: classic hybrid search is expected to be deprecated in a future major release, so new work should target `fusion`, and existing queries can move as the gaps above close. Nearest on that list are rescore detail in explain output, identity under custom routing, `min_max` bounds, gRPC support, and a policy for deriving a default fusion window, alongside an OpenSearch Benchmark operation and release-artifact measurements for the new request shapes.

Try in-query fusion in OpenSearch 3.10 by adding `fusion` to a hybrid query, read the documentation, compare the results with your relevance judgments, and share feedback on [RFC #1930](https://github.com/opensearch-project/neural-search/issues/1930) or the OpenSearch forum.

## References

1. [RFC: In-query fusion for the hybrid query](https://github.com/opensearch-project/neural-search/issues/1930)
2. [Meta issue for in-query fusion](https://github.com/opensearch-project/neural-search/issues/1931)
3. [Hybrid query documentation](https://docs.opensearch.org/latest/query-dsl/compound/hybrid/)
4. Dedicated [documentation page for fusion query type](https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/fusion-mode/#limitations)
5. [Rescoring hybrid queries](https://docs.opensearch.org/latest/query-dsl/compound/hybrid/#rescoring-hybrid-queries)
6. [Original hybrid-search announcement for OpenSearch 2.10](https://opensearch.org/blog/improving-search-relevance-with-hybrid-search/)
7. [BEIR dataset repository](https://github.com/beir-cellar/beir) (Quora, TREC-COVID, and NFCorpus) 
8. [WANDS dataset repository](https://github.com/wayfair/WANDS)
9. [Amazon ESCI dataset repository](https://github.com/amazon-science/esci-data)

### Acknowledgments

Thank you to `dbwiddis` for the RRF, `z_score`, and `l2` work, and to `vibrantvarun`, `bzhangam`, and `owaiskazi19` for reviewing the implementation and helping refine its behavior.
