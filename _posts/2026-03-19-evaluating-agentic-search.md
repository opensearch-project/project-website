---
layout: post
title:  "Evaluating agentic search in OpenSearch"
authors:
  - jpalis
  - agtunnell
  - kazabdu
  - rithinp
  - ohltyler

date: 2026-03-18
has_science_table: true
categories:
  - technical-posts
meta_keywords: agents, agentic, search, LLM, NLQ
meta_description: Discover how we evaluate agentic search in OpenSearch through two different dimensions, document relevance and execution accuracy.
---

In our [previous blog post](https://opensearch.org/blog/introducing-agentic-search-in-opensearch-transforming-data-interaction-through-natural-language/), we introduced agentic search in OpenSearch, which enables you to interact with your data using natural language. The ability to conversationally search for information is a transformative step towards simplifying information retrieval, making it easier for you to accurately search for the information you need without being a query expert. The flexibility of large language models (LLMs) allows agentic search to be adaptable so it can understand and answer a wide variety of questions, whether analytical questions requiring aggregations and filtering or retrieval questions aimed at finding semantically similar documents. When you interact with OpenSearch using natural language, you don't see the actual queries being executed. That's why we thoroughly test the search system across many different use cases. 

In this blog post, we'll explain how agentic search performs, sharing our evaluation methodology and results across two critical dimensions:

* **Search relevance**: How well does agentic search rank relevant documents?
* **Execution accuracy**: Does agentic search generate the correct structured query for a given natural language question? 

Together, these dimensions provide a comprehensive insight into agentic search capabilities across both structured and unstructured retrieval tasks.

## Search relevance

Search relevance indicates how well the returned documents are ranked. We measured ranked retrieval quality using Normalized Discounted Cumulative Gain at rank 10 (NDCG@10), a standard evaluation metric.

### Datasets

To evaluate search relevance, we used established information retrieval benchmarks: the Benchmarking Information Retrieval (BEIR) and Bridging Retrieval and Insights through Grounding in Hard Tasks (BRIGHT) datasets. 

#### BEIR dataset

[BEIR](https://github.com/beir-cellar/beir) is a widely adopted heterogeneous benchmark for evaluating information retrieval models. It spans diverse domains and task types, providing a robust test of retrieval generalization. We evaluated search relevance using seven BEIR datasets:

1. **Natural Questions (NQ)**: Real Google search queries paired with Wikipedia answers.
2. **FiQA**: Financial opinion question answering.
3. **SciFact**: Scientific claim verification.
4. **SciDocs**: Citation prediction in scientific literature.
5. **TREC-COVID**: COVID-19-related information retrieval.
6. **NF-Corpus**: Nutrition and health information retrieval.
7. **ArguAna**: Argument retrieval for counterargument generation.

#### BRIGHT dataset

[BRIGHT](https://brightbenchmark.github.io/) is a more recent and significantly challenging benchmark designed to test retrieval systems using complex, reasoning-intensive queries for which traditional keyword matching is insufficient. We evaluated search relevance using six BRIGHT datasets:

1. **Biology**: Complex biological reasoning questions.
2. **Earth science**: Geoscience reasoning queries.
3. **Economics**: Economic analysis questions.
4. **LeetCode**: Programming problem retrieval.
5. **Psychology**: Psychological research questions.
6. **StackOverflow**: Technical programming questions requiring contextual understanding.

BRIGHT queries are specifically designed to be difficult for standard retrieval methods because they often require understanding of the intent behind a question rather than simply matching surface-level keywords. This makes BRIGHT an ideal dataset for evaluating whether agentic search's query reformulation capabilities provide meaningful advantages.

### Evaluation setup

We compared six retrieval configurations across thirteen datasets, using Anthropic Claude Opus 4.6 for our flow agent and the `msmarco-distilbert-base-tas-b` model for generating vector embeddings of the document text:

```json
{
  "name": "huggingface/sentence-transformers/msmarco-distilbert-base-tas-b",
  "version": "1.0.3",
  "model_format": "TORCH_SCRIPT"
}
```

We tested three standard baseline methods and compared them to three agentic search variants:

* **Standard (baseline) methods**:

    * **Lexical (BM25)**: Traditional keyword-based retrieval.
    * **Neural**: Semantic search using dense embeddings.
    * **Hybrid**: A combination of lexical and neural retrieval.

* **Agentic methods**:

    * **Agentic (lexical)**: Uses BM25 as the underlying retrieval method.
    * **Agentic (neural)**: Uses neural retrieval.
    * **Agentic (hybrid)**: Uses hybrid retrieval.

### System prompt tuning

System prompt tuning is a critical aspect for agentic retrieval. It allows the agent to adjust its behavior in order to better understand and plan retrieval for a given dataset. For relevance evaluations, we created retrieval-mode-specific system prompts for the `QueryPlanningTool` that were explicitly optimized for document retrieval rather than structured data querying because of the simplistic index mappings of both BEIR and BRIGHT datasets.

Different retrieval methods require different query formats to perform optimally. Lexical search benefits from keyword expansion, while neural search works better with natural language descriptions. To produce queries that use each method's strength, we designed three distinct prompt strategies, one for each retrieval mode (lexical, neural, and hybrid).

#### Lexical retrieval prompt

For BM25-based retrieval, the system prompt instructs the agent to expand the user's query into a broad, keyword-rich search query. The prompt follows a four-step process:

1. **Understand**: Identify the core topic, information type, key entities, and implicit constraints.
2. **Enrich**: Add domain-specific terms, proper nouns, technical vocabulary, and expanded abbreviations.
3. **Broaden**: Add synonyms, alternate phrasings, and co-occurring vocabulary.
4. **Compose**: Combine everything into a single flat keyword bag (no natural language sentences, only relevant terms separated by spaces).

For example, the query "what is the meaning of the dragon boat festival" is expanded into the following text:

>"dragon boat festival meaning significance origin history tradition Chinese Duanwu Festival rice dumplings zongzi Qu Yuan poet commemoration fifth month lunar calendar racing paddling celebration cultural heritage dragon boats race competition memorial purpose symbolism customs rituals holiday traditional"

The agent returns the result as a `multi_match query` across the `text` and `title` fields:

```json
{
    "query": {
        "multi_match": {
            "query": "<expanded keyword bag>",
            "type": "best_fields",
            "fields": ["text_key", "title_key"],
            "tie_breaker": 0.5
        }
    }
}
```

This approach targets BM25's term-matching mechanism. By enriching the query with relevant terms, synonyms, and domain vocabulary, we increase the likelihood that BM25 will retrieve relevant documents.

#### Neural retrieval prompt

For neural retrieval, the strategy is fundamentally different. Dense embedding models encode meaning rather than individual keywords, so using a flat keyword bag would be counterproductive. Instead, the system prompt instructs the agent to rewrite the query as well-formed natural language sentences that capture the full semantic intent:

1. **Understand**: Identify the core topic, information type, key entities, and implicit constraints.
2. **Enrich**: Add domain-specific context, expand abbreviations, and incorporate related concepts.
3. **Rephrase**: Write coherent, descriptive prose (not a keyword list) that an embedding model can use to find semantically similar documents.
4. **Preserve focus**: Ensure that every detail is relevant to the original query, avoiding tangential topics.

The same dragon boat festival query is expanded into the following text:

>"The meaning and cultural significance of the Dragon Boat Festival (Duanwu Festival), a traditional Chinese holiday celebrated on the fifth day of the fifth lunar month, including its origins commemorating the poet Qu Yuan, the traditions of dragon boat racing, eating zongzi (sticky rice dumplings), and other customs such as hanging calamus and mugwort, drinking realgar wine, and wearing perfume pouches to ward off evil spirits and disease."

This formulation gives the embedding model a rich, coherent description of the needed information, producing a dense vector that is closer to relevant document embeddings in the vector space:

```json
{
    "query": {
        "neural": {
            "passage_embedding": {
                "query_text": "<enriched natural language query>",
                "model_id": "...",
                "k": 100
            }
        }
    }
}
```

#### Hybrid retrieval prompt

For hybrid retrieval, the prompt combines both strategies by instructing the agent to produce two complementary formulations from a single query:

* A keyword formulation (flat keyword bag) for the BM25 component.
* A semantic formulation (natural language sentences) for the neural component.

This allows each retrieval mechanism to receive a query in the format it processes best, rather than forcing both mechanisms to use a single query representation. The agent returns a hybrid query structure containing both formulations:

```json
{
    "query": {
        "hybrid": {
            "queries": [
                {
                    "multi_match": {
                        "query": "<keyword formulation>",
                        "type": "best_fields",
                        "fields": ["text_key", "title_key"],
                        "tie_breaker": 0.5
                    }
                },
                {
                    "neural": {
                        "passage_embedding": {
                            "query_text": "<semantic formulation>",
                            "model_id": "...",
                            "k": 100
                        }
                    }
                }
            ]
        }
    }
}
```

#### Customizing system prompts

These prompt designs reflect a core principle of agentic search: the system prompt is an essential tuning mechanism. You can customize the `query_planner_system_prompt` parameter in the `QueryPlanningTool` configuration to optimize for your specific use case, domain, and retrieval strategy. In our evaluations, we used a `flow` agent with a custom system prompt passed directly to the `QueryPlanningTool`:

```json
{
    "name": "Agent for agentic search",
    "type": "flow",
    "description": "Use this for agentic search",
    "tools": [
        {
            "type": "QueryPlanningTool",
            "parameters": {
                "response_filter": "$.output.message.content[0].text",
                "query_planner_system_prompt": "<retrieval-mode-specific prompt>",
                "model_id": "<model_id>"
            },
            "include_output_in_agent_response": false
        }
    ]
}
```

Prompt tuning involves more than generating the correct DSL syntax; it determines the way the agent thinks about the retrieval task itself. By tailoring the system prompt to the retrieval mode, we ensure that the agent's query enrichment strategy complements the underlying search mechanism instead of working against it. Our test results demonstrate the impact of this tuning mechanism. You can achieve similar improvements by customizing system prompts for your specific domains and data.

### Search relevance benchmarking results

The following sections present benchmarking test results for search relevance.

#### BEIR datasets (NDCG @10)

The following table provides NDCG@10 scores for all retrieval methods on BEIR datasets.

| Dataset    | Lexical (BM25) | Agentic (lexical) | Neural | Agentic (neural) | Hybrid | Agentic (hybrid) |
|------------|----------------|--------------------|--------|-------------------|--------|-------------------|
| NQ         | 0.31           | 0.436 (+40.9%)     | 0.333  | 0.440 (+32.2%)    | 0.393  | 0.536 (+36.6%)    |
| FiQA       | 0.238          | 0.194 (−18.4%)     | 0.211  | 0.207 (−2.1%)     | 0.274  | 0.262 (−4.5%)     |
| SciFact    | 0.65           | 0.676 (+4.0%)      | 0.467  | 0.592 (+26.9%)    | 0.64   | 0.695 (+8.6%)     |
| SciDocs    | 0.156          | 0.164 (+5.3%)      | 0.132  | 0.150 (+14.0%)    | 0.167  | 0.184 (+10.7%)    |
| TREC-COVID | 0.614          | 0.645 (+5.1%)      | 0.334  | 0.627 (+87.8%)    | 0.55   | 0.680 (+23.6%)    |
| NF-Corpus  | 0.303          | 0.353 (+16.3%)     | 0.259  | 0.281 (+8.5%)     | 0.309  | 0.367 (+19.0%)    |
| Arguana    | 0.421          | 0.283 (−32.9%)     | 0.353  | 0.321 (−9.0%)     | 0.45   | 0.361 (−19.7%)    |

#### BRIGHT datasets (NDCG @10)

The following table provides NDCG@10 scores for all retrieval methods on BRIGHT datasets.

| Dataset        | Lexical (BM25) | Agentic (lexical)    | Neural | Agentic (neural)        | Hybrid | Agentic (hybrid)    |
|----------------|----------------|----------------------|--------|-------------------------|--------|----------------------|
| biology        | 0.085          | 0.246 (+190.0%)      | 0.014  | 0.285 (+1,910.4%)       | 0.048  | 0.252 (+420.4%)      |
| earth_science  | 0.108          | 0.184 (+71.1%)       | 0.06   | 0.172 (+186.5%)         | 0.104  | 0.234 (+125.3%)      |
| economics      | 0.097          | 0.128 (+31.7%)       | 0.046  | 0.117 (+155.4%)         | 0.086  | 0.134 (+55.7%)       |
| leetcode       | 0.121          | 0.116 (−4.5%)        | 0.126  | 0.105 (−17.2%)          | 0.131  | 0.094 (−28.3%)       |
| psychology     | 0.063          | 0.173 (+174.2%)      | 0.037  | 0.203 (+446.4%)         | 0.073  | 0.236 (+223.8%)      |
| stackoverflow  | 0.121          | 0.270 (+122.5%)      | 0.057  | 0.052 (−8.6%)           | 0.1    | 0.186 (+85.7%)       |

#### Result analysis

We analyzed the results by comparing each retrieval method against its agentic counterpart.

**Lexical retrieval**

Comparing standard BM25 against agentic lexical retrieval isolates the impact of keyword expansion on term-based retrieval. On the BEIR dataset, agentic lexical retrieval outperforms BM25 retrieval on 4 of the 7 datasets:

* **NQ**: + 40.9% (0.3098 ->  0.4364)
* **NF-Corpus**: +16.3% (0.3035 -> 0.3529)
* **TREC-COVID**: +5.1% (0.6142 -> 0.6455)
* **SciFact**: +4% (0.6499 -> 0.6761)

The keyword expansion strategy performs well for these datasets because they contain queries in which the user’s natural language phrasing may not match the exact terminology in the relevant documents. Expanding the query with synonyms and domain-specific vocabulary bridges that gap. 

On the BRIGHT dataset, the gains are far more pronounced. Agentic lexical retrieval outperforms standard BM25 retrieval on 5 of 6 datasets, in which queries are inherently difficult for keyword matching because the surface-level terms in the query often do not appear in the relevant documents. The agent’s ability to expand the query using related technical vocabulary transforms retrieval quality on these reasoning-intensive tasks: 


* **Biology**: +190% (0.08499 → 0.24645)
* **Psychology**: + 174% (0.06316 → 0.17316)
* **StackOverflow**: +123% (0.12144 → 0.27023)
* **Earth Science**: +71% (0.10753 → 0.18398)
* **Economics**:  +32% (0.09711 → 0.12788)

On datasets with highly domain-specific phrasing (FiQa, ArguAna, SciDocs, LeetCode), agentic lexical retrieval underperforms because keyword expansion introduces noise when the original query terms are already precise matches for the relevant documents.

**Neural retrieval**

Comparing standard neural retrieval with agentic neural retrieval demonstrates the value of semantic enrichment for embedding-based retrieval. On the BEIR dataset, agentic neural retrieval outperforms standard neural retrieval on 5 of the 7 datasets. The enriched natural language reformulation gives the embedding model a more complete description of the user intent, producing vectors that better capture the query’s full semantic meaning: 

* **NQ**: +32.3% (0.33252 -> 0.43972)
* **TREC-COVID**:  +87.8% (0.334 -> 0.62718)
* **SciFact** : +26.9% (0.4665 -> 0.59196)
* **SciDocs**: +14.0% (0.1317 -> 0.1501)
* **NF-Corpus**: +8.5% (0.2588 -> 0.2806)

On the BRIGHT dataset, the results are mixed, though some datasets show improvement. Standard neural retrieval performs poorly on most BRIGHT datasets due to short, ambiguous queries, which produce embeddings not positioned near relevant document vectors. The agent’s semantic enrichment transforms these queries into rich descriptions that the embedding model can use effectively: 

* **Biology** : +1911% (0.01417 → 0.28487)
* **Psychology**: +446% (0.03715 → 0.20294)

Agentic neural retrieval shows underperformance on datasets like StackOverflow and more limited gains on the other BRIGHT datasets. This mirrors the issue seen with agentic lexical retrieval: enriched reformulations of the query may drift from the original user intent, or the embedding model itself may not capture the semantics well for the domain.

**Hybrid retrieval**

Agentic hybrid retrieval shows the combined effect of the dual-reformulation of the original query text, in which each retrieval method receives a query in its optimal format. On the BEIR benchmark, agentic hybrid retrieval achieves the highest NDCG@10 on 5 out of 7 datasets. The improvements are particularly notable for the following datasets:

* **NQ**: +36.6% improvement over standard hybrid (0.3926 -> 0.5361), a substantial gain on one of the most widely used retrieval benchmarks
* **TREC-COVID**: +23.6% improvement (0.5503 -> 0.6802), demonstrating strong performance on domain-specific biomedical retrieval
* **NF-Corpus**: +19.0% improvement (0.3086 -> 0.3672)
* **SciFact**: +8.6% improvement (0.6397 -> 0.6945)
* **SciDocs**: +10.7% improvement (0.1665 -> 0.1844)

Two datasets, FiQA and ArguAna, showed slight decreases with agentic methods compared to their standard counterparts. FiQA's financial opinion queries and ArguAna's counterargument retrieval tasks involve nuanced, domain-specific language in which the agent's query reformulation may introduce drift from the original query intent.

On the BRIGHT benchmark, designed to test reasoning-intensive retrieval, agentic search delivers significant improvements on 5 out of 6 datasets:

* **Biology**: +235% improvement over the best standard method (0.0850 -> 0.2849)
* **Psychology**: +224% improvement (0.0728 -> 0.2358)
* **StackOverflow**: +122% improvement (0.1214 -> 0.2702)
* **Earth Science**: +118% improvement (0.1075 -> 0.2342)
* **Economics**: +38% improvement (0.0971 -> 0.1342)

These results represent transformative improvements in retrieval quality for complex queries. The BRIGHT benchmark was specifically designed to expose the limitations of traditional retrieval methods for queries that require deeper understanding. This is precisely the scenario in which query reasoning and reformulation deliver the most value.

The sole exception is the LeetCode dataset, in which standard hybrid retrieval slightly outperforms all agentic retrieval configurations. Programming problem retrieval may involve highly specific technical terminology, in which the original query is already well-suited for direct matching; reformulation risks diluting precise terms.

#### Key takeaways

Several clear patterns emerge from the relevance evaluation:

**1. Agentic search excels on complex, reasoning-intensive queries**: The BRIGHT dataset results demonstrate that the harder the query, the more value agentic search provides. When queries require understanding intent beyond surface-level keywords, the agent's ability to analyze, decompose, and reformulate queries translates into dramatically better retrieval.

**2. Hybrid retrieval is consistently the strongest foundation for agentic search**: On both BEIR and BRIGHT datasets, agentic hybrid configuration most frequently achieves the best performance. By combining lexical precision with semantic understanding and by receiving a query tailored to each mechanism through the dual-formulation prompt, hybrid retrieval provides the agent with the most flexible retrieval foundation.

**3. Standard benchmarks show solid improvements; hard benchmarks show transformative ones**: For the BEIR dataset, agentic methods improve NDCG@10 on 5 of 7 datasets with an average improvement of approximately 15--20% over standard hybrid retrieval on the winning datasets. For the BRIGHT dataset, the average improvements on winning datasets exceed 100%. This suggests that agentic search's value increases with query complexity.

**4. Retrieval-mode-aware prompting makes a difference**: The strong performance of agentic hybrid retrieval, which uses the dual-formulation prompt to produce both a keyword bag and a semantic sentence, validates tailoring the system prompt to the retrieval mechanism. This is a mechanism available to all agentic search users through the `query_planner_system_prompt` configuration.

**5. Some query types benefit less from agentic reformulation**: Datasets like FiQA, ArguAna, and LeetCode show that agentic reformulation isn't universally beneficial. Queries that are already well formed for retrieval or that require very precise terminology may not benefit from, and can occasionally be harmed by, reformulation. Understanding when to reformulate and when to pass the original query is an important direction for future optimization.

## Part 2: Execution accuracy

While relevance relates to the quality and position of the returned documents, execution accuracy is concerned with the quality of the generated query itself and attempts to assess the ability of the LLM to accurately translate user questions related to analysis or aggregations. Our core question was "How accurately does agentic search translate natural language into correct structured queries?"

To answer this question, we needed a rigorous evaluation framework. We chose the [Spider dataset](https://yale-lily.github.io/spider), an established benchmark for text-to-SQL systems, and adapted it to evaluate agentic search's capability to translate natural language into OpenSearch query domain-specific language (DSL).

### Why the Spider dataset?

Spider is a large-scale semantic parsing dataset created by researchers at Yale University, containing 7,000 questions paired with SQL queries across 200 databases spanning 138 different domains. It was originally designed to benchmark text-to-SQL systems---models that convert natural language questions into SQL queries. This makes it an excellent fit for evaluating agentic search's text-to-DSL capabilities because both SQL and OpenSearch's query DSL are structured query languages that express similar operations. The following table provides a comparison of SQL and OpenSearch query DSL operations.

| Operation          | SQL                | OpenSearch query DSL      |
|--------------------|--------------------|---------------------|
| Field selection    | `SELECT`           | `_source` / `fields`|
| Filtering          | `WHERE`            | `query` clauses     |
| Aggregations       | `GROUP BY`         | `aggs`              |
| Sorting & limiting | `ORDER BY` / `LIMIT` | `sort` / `size`  |

The cognitive challenge of translating "Show me all customers from California who spent more than $1000 last month" into either SQL or DSL is fundamentally the same: understanding intent, identifying relevant fields, and constructing appropriate filter logic.

Spider's 138 different domains test whether a system can generalize its query understanding across unfamiliar schemas, representing real-world agentic search usage where users query diverse OpenSearch indexes with varying field structures and data types. Its queries also range from simple ("How many employees are there?") to complex ("What are the name and budget of the departments with average instructor salary greater than the overall average?"), testing agentic search's ability to handle the full spectrum of questions users might ask.

### Adapting the Spider dataset for OpenSearch

We performed extensive filtering of the dataset in order to allow its queries to translate well to OpenSearch. The Spider dataset's SQL queries use features such as JOINs and subqueries (`SELECT`, `UNION`, `INTERSECT`, and `EXCEPT` clauses), which assume that the data is spread across multiple related tables. In contrast, OpenSearch stores data as self-contained documents rather than tables linked using foreign keys, therefore our evaluations were focused on single-table operations. 

To create a fair evaluation, we filtered out these queries and focused our experiment on single-table operations such as filtering, sorting, and aggregations. From the original 7,000 Spider examples we evaluated 921.

### Evaluation methodology

We evaluated agentic search using the following process:

1. **Gold SQL Execution**: Execute the human-verified "gold" SQL query against SQLite tables, producing a reference DataFrame.
2. **Agentic Query Execution**: Execute the agentic search query using the corresponding natural language question, producing a result DataFrame:

    ```json
    GET <index_name>/_search?search_pipeline=agentic-search-pipeline
        {
        "query": {
            "agentic": {
            "query_text": "<Natural Language Question>"
            }
        }
        }
    ```
3. **DataFrame Comparison**: Compare search results to determine if they contain the same data.

We used the following evaluation criteria designed to account for valid query variations:

* Compare results irrespective of row/column order and column names.
* If columns have different names, verify if column values are identical.
* The predicted DataFrame can contain extra columns. If it contains all gold columns with exact matching rows, it's considered correct.

This approach recognizes that there are often multiple valid ways to answer the same question, just as the same SQL query can be written in different ways while returning identical results.

### Results

The following output provides the execution accuracy evaluation results.

```
============================================================
EVALUATION RESULTS
============================================================
Total examples attempted: 921

agentic search:
  Valid evaluations: 736
  Correct: 604
  Execution Accuracy: 82.07%
============================================================
```

Agentic search correctly translates natural language to structured queries more than 4 out of 5 times (82% execution accuracy), so you can query your data in plain English without understanding query syntax or schemas.

#### Accuracy by database

The following table provides accuracy results across different database domains.

| Database             | Queries evaluated | Correct queries| Accuracy |
|----------------------|-------------------|---------|----------|
| architecture         | 8                 | 8       | 100%     |
| city_record          | 16                | 16      | 100%     |
| company_1            | 6                 | 6       | 100%     |
| candidate_poll       | 26                | 24      | 92.30%   |
| county_public_safety | 24                | 22      | 91.70%   |
| body_builder         | 12                | 11      | 91.70%   |
| apartment_rentals    | 46                | 42      | 91.30%   |
| book_2               | 16                | 15      | 93.80%   |
| climbing             | 26                | 23      | 88.50%   |
| college_2            | 76                | 65      | 85.50%   |
| aircraft             | 22                | 19      | 86.40%   |
| allergy_1            | 68                | 57      | 83.80%   |

#### System prompt tuning

A key insight from our execution accuracy evaluations, and one that reinforces a finding from our relevance work, is that system prompt design is a critical mechanism for search quality. We observed that achieving optimal execution accuracy required careful tuning of the system prompts used by agentic search. Initially, our system prompt included example queries to help guide the model towards correct query DSL syntax. However, we observed that newer, more capable models exhibited a tendency to overfit to these examples, rigidly following example patterns even when not appropriate or reproducing example structures verbatim, leading to incorrect filter logic.

By removing the default search template and examples, we allowed the model to reason about each query based strictly on the user's natural language question, index mapping information, and the model's inherent understanding of query construction. This approach yielded better generalization across the diverse Spider databases, allowing the model to adapt its query construction strategy to each unique mapping rather than forcing queries into predefined patterns.

This highlights an important insight for agentic systems: as underlying models become more capable, less prescriptive prompting often produces better results. Continuous evaluation and prompt iteration are essential as models evolve and improve over time.

## Search relevance and execution accuracy results

The following table provides the combined results for search relevance and execution accuracy.

| Task                   | Benchmark | Result                                                                          |
|------------------------|-----------|---------------------------------------------------------------------------------|
| relevance (Standard)   | BEIR      | Best NDCG@10 on 5 of 7 datasets; up to +36.6% improvement                       |
| relevance (Hard)       | BRIGHT    | Best NDCG@10 on 5 of 6 datasets; up to +235% improvement                        |
| Execution Accuracy     | Spider    | 82% of natural language questions correctly translated to structured queries    |

These results validate agentic search across both retrieval paradigms: 82% execution accuracy for structured queries (filtering, sorting, aggregating) and significant relevance improvements for unstructured text retrieval, with the most dramatic gains for the most challenging queries.

Together, these results demonstrate that agentic search reduces the technical barriers to using OpenSearch. Currently, using OpenSearch effectively requires knowledge of Query DSL syntax, query types (`match`, `term`, `bool`), clause logic (`must`, `should`, `filter`), analyzer behavior, aggregation syntax, and relevance tuning. Thus, business analysts, product managers, and other non-technical users must rely on engineers to write queries for them. Agentic search removes this barrier: users ask questions in natural language and get accurate, well-ranked results.

## What's next?

Our efforts are now focused on features intended to further improve the performance and relevance of agentic search, for example, support for agentic memory, reranking, search using index patterns and aliases, and optimizations to search template integration. 

If you have feedback, questions, or ideas for additional use cases you'd like to see implemented, we'd love to hear from you. Join the discussion on the [OpenSearch forum](https://forum.opensearch.org/t/use-cases-and-general-feedback-for-agentic-search/27488) or [OpenSearch Slack workspace](https://opensearch.org/slack/).

To track ongoing development and design updates, see the [Agentic search RFC](https://github.com/opensearch-project/neural-search/issues/1525).

## Acknowledgements

Our evaluation framework builds upon the foundational work of Alexander Greaves-Tunnell, a senior applied scientist at OpenSearch, who developed the original evaluation methodology for text-to-Piped Processing Language (PPL) models. His rigorous approach to measuring query translation accuracy provided the basis for the agentic search execution accuracy evaluation tool. This version extends his original framework to support agentic search's text-to-DSL capabilities.