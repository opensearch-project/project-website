---
layout: post
title: "Fill, don't write: LLM query generation with OpenSearch search templates"
authors:
  - adityashah
date: 2026-09-03
categories:
  - technical-posts
meta_keywords: agentic search, search templates, LLM query generation, Mustache, OpenSearch DSL, agent server
meta_description: A look at how agentic search can fill the parameters of a registered search template instead of writing full OpenSearch query DSL, and why constraining what the model produces improves latency and reliability.
excerpt: Agentic search can now fill the parameters of a registered search template instead of authoring a full query, trading some flexibility for lower latency and more predictable results.
---

> **TL;DR:** Agentic search can generate an OpenSearch query in two ways: it can author the full `_search` body from a natural-language question or it can fill the parameters of a search template you register ahead of time. With template fill, the model supplies a few typed values, the template defines the query structure, and OpenSearch renders the final query through `_render/template`. Cost and latency scale with how much the model writes, so filling a template lowers both, and you control the query shape. When a template can't express a question, the model declines and agentic search falls back to writing the query directly. The feature is experimental and disabled by default.

[Agentic search](https://opensearch.org/blog/introducing-agentic-search-in-opensearch-transforming-data-interaction-through-natural-language/), introduced in OpenSearch 3.3, lets you include a natural-language question in a search request, which an AI agent converts into an OpenSearch query. You send a `_search` request with an `agentic` query clause, an agent reads your index and produces a `_search` body written in OpenSearch's query domain-specific language (DSL), and OpenSearch runs it and returns results.

This approach requires the model to produce the entire query correctly. A large language model (LLM) can return a query that is invalid, or one that is valid but expresses a different request than the one you asked for. A query that needs more structure also requires more output, which costs more tokens and more time.

This post describes a different approach, built on the [OpenSearch agent server](https://opensearch.org/blog/bringing-intelligence-to-opensearch-introducing-the-opensearch-agent-server/). Instead of writing the query, the model **fills a template**. You register a search template once, the model supplies only its parameter values, and OpenSearch renders the query.

## Prerequisites

Template fill requires OpenSearch 3.9 or later and configuration in both OpenSearch and the agent server, so verify the following prerequisites first:

- **A running OpenSearch agent server** that is reachable from your cluster. For more information, see [Bringing intelligence to OpenSearch: Introducing the OpenSearch agent server](https://opensearch.org/blog/bringing-intelligence-to-opensearch-introducing-the-opensearch-agent-server/). Template fill runs in the agent server, so it is not available through an agent that generates queries inside the cluster. The configuration described in this blog post registers a separate flow agent that calls the agent server.
- **Amazon Bedrock as the agent server's model provider**: Filling a template uses a forced tool call, which the agent server currently implements for Bedrock. With another provider, the fill attempt fails and the request falls back to writing the query directly, so searches continue to work but the template is never used.
- **Read access to the template system index** for the identity in the connector's credential, if your cluster runs the Security plugin. The agent server reads each template's parameter schema from `.plugins-ml-agentic-search-templates`, which is a protected system index. Without that access, the schema read fails and every request falls back to writing the query directly.

If you have not used agentic search before, start with the [3.3 introduction](https://opensearch.org/blog/introducing-agentic-search-in-opensearch-transforming-data-interaction-through-natural-language/) and the [hands-on walkthrough](https://opensearch.org/blog/opensearch-3-4s-agentic-search-in-opensearch-dashboards-hands-on-use-cases-and-examples/).

## Two stages of template fill

A **search template** is a stored query written in the Mustache templating language, with placeholders for the parts that change between requests. You control the structure of the query, and the template marks the positions where a value is substituted. For example, a product search is often a `match` on the title with an optional category filter, in which the search text and the category are the parts that vary.

With template fill, the work splits into two stages:

- **At registration time**, OpenSearch reads the template body and derives a **parameter schema**: each parameter's name and type, whether it is required, a description of what it does, and the values it may take when those come from a fixed set. You register the template once, and OpenSearch derives and stores the schema for you.
- **At query time**, the agent provides the model with only that schema and the question. The model returns parameter values, not a query. OpenSearch renders the template with those values and runs the result.

The model does not need to produce the query structure because the template defines it. The model only supplies the values for the parameters you defined.

The following animation compares the two approaches for the same question.

![Filling a template writes four values (18 characters); authoring the query directly writes the whole body (481 characters).](/assets/media/blog-images/2026-09-03-fill-dont-write-llm-query-generation-with-opensearch-search-templates/template-fill-demo.gif)
*For the same question, filling a template (left) has the model write four values, while authoring the query directly (right) has it write the entire request body.*

The cost and latency of a generation request scale with how many tokens the model produces. Authoring a full query produces the whole `_search` body, which grows as the query becomes more complex. Filling a template produces only a few values, and that number stays small regardless of the template's size. Rendering the template into a query happens inside OpenSearch and takes about the same time for a large template as for a small one.

In our testing across five indexes and two models, filling a template that defines substantial query structure ran 3.4 times faster on average than authoring the equivalent query, while emitting far fewer output tokens. The size of the gain depends on the template. A template that defines most of the query structure produces the largest gain, because the model would otherwise have to write that structure itself. A template that defines little structure produces a smaller gain. With such a template and a fast model, latency was nearly identical, because the model produced a similar number of tokens in both cases. Filled queries also applied mandatory rules more consistently, because a required filter written into the template does not depend on the model adding it.

Keeping the generated output small has a second benefit. Neural Search caps the generated query at 10,000 characters and fails the request when a query exceeds that, with no fallback. A filled template emits values rather than a query body, so it stays well below that limit even when the rendered query is long.

## Enabling the template endpoints

The template endpoints are experimental and disabled by default. Enable them with a cluster setting:

```json
PUT _cluster/settings
{
  "persistent": {
    "plugins.ml_commons.agentic_search_template_enabled": true
  }
}
```

Two more ML Commons settings control which hosts a connector may call, and both affect the walkthrough in the following sections. When you create a connector, ML Commons resolves its URL and matches it against `plugins.ml_commons.trusted_connector_endpoints_regex`. The default list includes hosted model providers rather than a service you run yourself, so a connector that references your agent server is rejected. Addresses on the local machine or a private network are also refused unless `plugins.ml_commons.connector.private_ip_enabled` is enabled. For a local walkthrough, use the following settings:

```json
PUT _cluster/settings
{
  "persistent": {
    "plugins.ml_commons.trusted_connector_endpoints_regex": [
      "^http://127\\.0\\.0\\.1:8001/.*$"
    ],
    "plugins.ml_commons.connector.private_ip_enabled": true
  }
}
```

Scope that pattern to your agent server's real host rather than widening it, and note that replacing the regex list removes the defaults, so restore any model-provider endpoints your cluster already relies on.

## Registering a search template

Start with the index you plan to search. This example uses a small product catalog:

```json
PUT products
{
  "mappings": {
    "properties": {
      "title":    { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "category": { "type": "keyword" },
      "price":    { "type": "float" }
    }
  }
}
```

Next, store the search template as a Mustache script. Store the body as a **string**, not as a JSON object: a body that uses conditional sections such as `{{#category}}` is not valid JSON until it renders, so an object body is rejected.

```json
PUT _scripts/product_search
{
  "script": {
    "lang": "mustache",
    "source": "{\"query\":{\"bool\":{\"must\":[{\"match\":{\"title\":\"{{query_text}}\"}}],\"filter\":[{{#category}}{\"term\":{\"category\":\"{{category}}\"}}{{/category}}]}},{{#sort_by}}\"sort\":[{\"{{sort_by}}\":\"desc\"}],{{/sort_by}}\"size\":{{size}}}"
  }
}
```

Escaped on one line, the body is hard to read, so the following listing shows it formatted. The placeholders are the parts the model fills: `query_text` is the search text, `category` is an optional filter, `sort_by` specifies a field to sort on, and `size` sets the number of results.

```text
{
  "query": {
    "bool": {
      "must": [ { "match": { "title": "{{query_text}}" } } ],
      "filter": [
        {{#category}}{ "term": { "category": "{{category}}" } }{{/category}}
      ]
    }
  },
  {{#sort_by}}"sort": [ { "{{sort_by}}": "desc" } ],{{/sort_by}}
  "size": {{size}}
}
```

Wrapping `category` and `sort_by` in Mustache sections marks them as optional: when the model omits one, the rendered query does not include that clause.

Next, register the template with ML Commons so that the agent can use it. You pass the template's ID and the index it targets. A description is optional; if you omit it, OpenSearch derives one from the template body:

```json
POST /_plugins/_ml/agentic_search_templates
{
  "template_id": "product_search",
  "index": "products",
  "description": "Product catalog search"
}
```

The response confirms the template was created:

```json
{ "template_id": "product_search", "status": "created" }
```

Registration also validates the template. OpenSearch renders the body twice, once with every parameter filled and once with only the required ones, and rejects the registration if either render is not valid JSON. A template that would fail at query time is rejected during registration instead.

Registration creates the template once. Register the same `template_id` again and OpenSearch returns a `409` instead of overwriting the existing template, so a schema you have tuned is preserved.

During registration, OpenSearch derives the parameter schema from the template body. It reads each Mustache tag to determine the type and whether the parameter is required, and it uses your index mapping to supply the choices for parameters that select a field, such as one named `sort_by` or ending in `_field`. It also renders the body to determine the position each parameter occupies in the resulting query, then uses the surrounding clause to write a description for it. The derivation runs on fixed rules, with no model involved. You can inspect the result:

```json
GET /_plugins/_ml/agentic_search_templates/product_search
```

The `param_schema` in the response appears as follows:

```json
{
  "query_text": {
    "type": "string",
    "required": true,
    "description": "Full-text query matched against the title field."
  },
  "category": {
    "type": "string",
    "required": false,
    "description": "Filter by exact category value."
  },
  "sort_by": {
    "type": "string",
    "required": false,
    "description": "Field to sort results by.",
    "enum": [ "category", "price", "title", "title.keyword" ],
    "source": "mapping"
  },
  "size": {
    "type": "number",
    "required": true,
    "description": "Number of results to return."
  }
}
```

Several details in this schema are worth noting. The `query_text` parameter appears in a quoted position and is used directly, so it is a required string, and because it renders inside a `match` clause on `title`, its description names that field. The `category` parameter is wrapped in its own Mustache section, which marks it optional, and it renders inside a `term` filter, so it is described as an exact-match filter. The `sort_by` parameter names a field, so OpenSearch derives its allowed values from the index mapping. The `size` parameter is unquoted, so it is treated as a number.

Those descriptions and allowed values are the information the model receives when it generates a value for each parameter, which makes them the most effective part of the schema to adjust. For more information, see [Improving results by describing your parameters](#improving-results-by-describing-your-parameters). To bypass derivation entirely, pass your own `param_schema` on the register call; OpenSearch validates and stores it as sent.

OpenSearch also derives a one-line description of the template as a whole, which it stores when you don't supply your own. For the preceding template, that description is:

```text
Full-text search over title; filters by category; sortable.
```

The derived description is used when the agent selects among several templates.

## Connecting the template to a search pipeline

Registering a template makes it available for filling, but it does not connect the template to a search request. A connector describes the call to the agent server, an agent uses the connector, and a search pipeline specifies which agent OpenSearch runs.

Start with the connector. Two of its fields control template fill:

- **`parameters`** contains the static values, including the `template_id` to fill. Set `endpoint` to your agent server's host.
- **`request_body`** is a template for the JSON payload. OpenSearch substitutes each `${parameters.<name>}` placeholder before sending, so `question` and `index_name` come from the search request at query time, while `template_id` comes from the preceding static parameters.

```json
POST /_plugins/_ml/connectors/_create
{
  "name": "Agentic Search Template-Fill Connector",
  "description": "Calls the agent server in template-fill mode.",
  "version": "1",
  "protocol": "http",
  "parameters": {
    "endpoint": "127.0.0.1:8001",
    "template_id": "product_search"
  },
  "credential": {
    "token": "replace-with-agent-server-token"
  },
  "actions": [
    {
      "action_type": "predict",
      "method": "POST",
      "url": "http://${parameters.endpoint}/invoke",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer ${credential.token}"
      },
      "request_body": "{\"query\":\"${parameters.question}\",\"agent\":\"agentic_search\",\"context\":{\"index_name\":\"${parameters.index_name}\",\"template_id\":\"${parameters.template_id}\"},\"response_format\":\"inference_results\"}",
      "post_process_function": "connector.post_process.mlcommons.passthrough"
    }
  ]
}
```

Because `request_body` must be a single JSON string, it is hard to read inline. The following listing shows the same payload formatted, which is what the agent server receives:

```text
{
  "query": "${parameters.question}",
  "agent": "agentic_search",
  "context": {
    "index_name": "${parameters.index_name}",
    "template_id": "${parameters.template_id}"
  },
  "response_format": "inference_results"
}
```

The formatted payload shows the two fields that control template fill. The `context.template_id` key enables template-fill mode; without it, the same connector writes the query directly. The `response_format: inference_results` field requests the response envelope that the `post_process_function` in the preceding connector parses, so that Neural Search receives the generated query in the format it expects.

One consequence of defining `template_id` in the connector is that the template is chosen when you register the connector, not per query. To serve several query shapes, register a connector and agent for each, or use a candidate set, as described in [Choosing among several templates](#choosing-among-several-templates).

Next, register a flow agent that calls the connector. Specify the `connector_id` returned in the previous response:

```json
POST /_plugins/_ml/agents/_register
{
  "name": "Agentic Search Template-Fill Agent",
  "type": "flow",
  "description": "Generates OpenSearch DSL by filling a registered search template.",
  "tools": [
    {
      "type": "ConnectorTool",
      "name": "template_fill_generator",
      "description": "Fills a registered search template from a natural-language question.",
      "parameters": {
        "connector_id": "PASTE_CONNECTOR_ID",
        "connector_action": "predict"
      }
    }
  ]
}
```

Finally, create a search pipeline. The `agentic_query_translator` request processor converts an `agentic` clause into a call to your agent, and it reads `agent_id` from its own configuration. Specify the `agent_id` from the previous response:

```json
PUT /_search/pipeline/product_agentic_pipeline
{
  "request_processors": [
    {
      "agentic_query_translator": {
        "agent_id": "PASTE_AGENT_ID"
      }
    }
  ],
  "response_processors": [
    {
      "agentic_context": {
        "dsl_query": true
      }
    }
  ]
}
```

The response processor is optional, but `dsl_query` is worth enabling during configuration, since it returns the generated query alongside your results.

## Asking a question

With the pipeline in place, a question is an ordinary search request that names the pipeline and specifies the question in an `agentic` clause:

```json
POST /products/_search?search_pipeline=product_agentic_pipeline
{
  "query": {
    "agentic": {
      "query_text": "the 5 most expensive shoes in the footwear category"
    }
  }
}
```

When OpenSearch processes that request, the agent sends the model the schema for `product_search`, and the model returns values:

```json
{ "query_text": "shoes", "category": "footwear", "sort_by": "price", "size": 5 }
```

OpenSearch renders the template with those values, producing the query it runs:

```json
{
  "query": {
    "bool": {
      "must":   [ { "match": { "title": "shoes" } } ],
      "filter": [ { "term": { "category": "footwear" } } ]
    }
  },
  "sort": [ { "price": "desc" } ],
  "size": 5
}
```

The response contains the matching documents and, if you enabled `dsl_query`, the generated query under `ext.dsl_query`. The model produced four values. The category filter and the sort clause appear because the model filled those optional parameters. If it had omitted them, the rendered query would not include those clauses. The query structure is the one you defined in the template.

The `agentic` clause has several constraints of its own. It must be the top-level query, and your request cannot also use aggregations, `sort`, highlighting, `post_filter`, `suggest`, `rescore`, or `collapse`, because the generated query replaces the search body. Sorting is still supported, as in the preceding example, when the template produces the `sort` clause. Two other clause fields do not apply in template-fill mode: `query_fields` is not passed to the fill prompt, and `memory_id` is rejected by a flow agent.

## Improving results by describing your parameters

With the structure fixed, incorrect values are the remaining source of error, and the schema is the only information the model receives about a parameter. The derived descriptions address the common cases, but they describe the clause a parameter renders into rather than what the values mean in your data. Rewriting them for your data is the change that improved our results the most, more than switching models or reworking the prompt did.

Units are the clearest example. Suppose a template has a parameter that bounds a weight field. Derivation can determine that it is an upper bound on a range, but the unit is not derivable from the template body. Ask for "a tent that weighs under 1.5 kilograms" and a model working from the parameter name alone might supply `1.5` for a bound that the template applies to price, because both are numbers and both fit the sentence. Stating the unit in the description removes the ambiguity.

The same applies to the preceding `product_search` schema. The `query_text` parameter is used in a `match` clause, so filter words do not belong in it, and `sort_by` includes every field in the mapping, including `title`, which is a `text` field that cannot be used for sorting. Both are worth narrowing:

```json
PUT /_plugins/_ml/agentic_search_templates/product_search
{
  "param_schema": {
    "query_text": {
      "description": "Product words only, such as a type or material. Do not include filters such as price, category, or availability."
    },
    "sort_by": {
      "description": "Field to sort results by.",
      "enum": [ "price", "title.keyword" ]
    }
  }
}
```

The update API merges these descriptions into the stored schema, so you change only the fields you name. It rejects any parameter the template body does not reference. The following adjustments have the largest effect:

- **State units and scale** for numeric parameters. A model is most likely to substitute one field for another for amounts, durations, and distances.
- **Say what a parameter should exclude**, not just what it contains. A full-text parameter is the common case: without guidance, a model tends to supply the entire question as the value, including words that belong in filters.
- **Narrow the allowed values** to those that are valid for your data. Derivation lists every field in the mapping for a field-selector parameter, which is broader than the fields you intend to sort on.
- **Mention the fallback** for an optional parameter when derivation did not identify one, so the model can omit the parameter rather than generating an arbitrary value.

None of these edits is required to begin, and a template with derived descriptions is usable as registered. Make these edits once you have identified questions that return incorrect results.

## When a template cannot express a question

A template supports a defined range of questions. A user might ask for something it cannot represent, such as "what is the average price per category," which requires an aggregation that the `product_search` template does not contain. If the model forced values into a template that cannot express the request, the query would run and answer the wrong question.

The model can decline instead. Every template-fill request includes a way for the model to report that the template cannot express the question. When it does, agentic search writes the query directly from the index, the same behavior it uses when no template is involved. In both cases you receive results: a filled template when the question matches one, and a generated query when it does not.

The two kinds of failure differ in how visible they are. A query that fails to render raises an error that OpenSearch catches, and the request falls back to writing the query directly. A query that renders but expresses the wrong request raises no error, and the decline behavior prevents the model from filling a template that cannot express the question. Note that a declined question costs two generation calls rather than one, so the latency advantage applies to the questions your templates actually support.

## Choosing among several templates

A connector can name more than one template. If you register several templates for an index, for example, a keyword search and a semantic search, change two fields in the preceding connector configuration. First, list the candidate IDs in the static parameters, and remove the `template_id` entry, since a connector that specifies both sends the scalar as an extra candidate:

```json
"parameters": {
  "endpoint": "127.0.0.1:8001",
  "template_ids": "[\"product_search\", \"semantic_product_search\"]"
}
```

Then update the payload to pass `template_ids` in the context instead of `template_id`. The placeholder is not quoted here because the parameter value is already a JSON array and quoting it would produce an invalid payload:

```text
{
  "query": "${parameters.question}",
  "agent": "agentic_search",
  "context": {
    "index_name": "${parameters.index_name}",
    "template_ids": ${parameters.template_ids}
  },
  "response_format": "inference_results"
}
```

Escaped for the connector's `request_body`, the payload appears as follows:

```text
{\"query\":\"${parameters.question}\",\"agent\":\"agentic_search\",\"context\":{\"index_name\":\"${parameters.index_name}\",\"template_ids\":${parameters.template_ids}},\"response_format\":\"inference_results\"}
```

When more than one template is available, the agent selects the one that best fits the question and fills it in a single step, rather than making one request to choose and another to fill. The agent compares the template descriptions, so the description derived at registration time is worth reviewing. Candidates registered against a different index are excluded, so only templates that apply to the index you are searching are considered. If no template matches the question, the same decline behavior applies and the agent writes the query directly.

## Searches suited to template fill

Template fill suits searches whose shape you can describe in advance, even though the words in the question vary. The following kinds of searches are good candidates:

- **Product and catalog search.** A storefront search is usually the same query every time: match the shopper's words against a title and description, filter on category, brand, price, and availability, then sort by relevance or price. The template defines the relevance configuration you tuned, and the model supplies the shopper's terms and filters. Questions such as "waterproof jackets under $150, in stock" and "cheapest wool socks" fill the same template.
- **Searches with rules that must always apply.** Many applications require a filter on every query: a tenant identifier, an `is_active` flag, a visibility or region field. When that filter is part of the template body, it appears in every rendered query without the model having to add it. A template makes the filter consistent across generated queries, but it governs only the queries the agent generates, so it is not a substitute for document-level security.
- **Searches over a hand-tuned relevance configuration.** If your query uses field boosts, a `function_score`, or a decay function that required tuning, the template stores that configuration. The model changes the terms and filters without modifying the scoring. The latency gain is also largest in this case, because the model no longer produces the long query body.

Direct query authoring is still the better fit for open-ended exploration, in which you can't predict the shape of a question and need the model's full range, and for analytics questions such as aggregations. Because the model declines a question a template cannot express, a practical approach is to register templates for the searches you serve most often and let the model write the rest.

Template fill gives agentic search a second way to turn a question into a query. Instead of writing the query, the model fills the parameters of a template you register, and OpenSearch renders the result. The template defines the structure, so the model produces less, which lowers latency and cost and leaves you in control of the query shape. When a template can't express a question the model declines and the agent writes the query directly, so a template narrows what the model has to do without limiting what you can ask. The feature is experimental and opt-in.

## Next steps

Template fill requires OpenSearch 3.9 or later, a running agent server, and the `plugins.ml_commons.agentic_search_template_enabled` cluster setting. To try it, register a template for a search your application already serves, ask a question that the template supports, and compare the query under `ext.dsl_query` with the one your application sends today. Then rewrite the derived parameter descriptions for your data, which is the change most likely to improve the values the model produces.

The following resources describe the components used in this post:

- [Agentic search](https://docs.opensearch.org/latest/vector-search/ai-search/agentic-search/) -- Configuration reference for agentic search, including the agent types it supports.
- [Search templates](https://docs.opensearch.org/latest/search-plugins/search-template/) -- Mustache syntax, conditional sections, and the `_render/template` endpoint.
- [Agentic query translator processor](https://docs.opensearch.org/latest/search-plugins/search-pipelines/agentic-query-translator-processor/) -- Parameters for the request processor that calls your agent.

Share the query shapes you templated, along with the questions your templates still cannot express, on the [OpenSearch forum](https://forum.opensearch.org/).
