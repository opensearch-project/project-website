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

> **TL;DR:** Agentic search can generate an OpenSearch query in two ways. It can author the full `_search` body from a natural-language question, or it can fill the parameters of a search template you register ahead of time. With template fill the model supplies a handful of typed values, the template holds the query structure, and OpenSearch renders the final query through `_render/template`. Cost and latency scale with how much the model writes, so filling a template lowers both, and you get a query shape you control. When a template can't express a question, the model declines and agentic search falls back to writing the query directly. The feature is experimental and opt-in.

[Agentic search](https://opensearch.org/blog/introducing-agentic-search-in-opensearch-transforming-data-interaction-through-natural-language/), introduced in OpenSearch 3.3, lets you put a natural-language question in a search request and have an AI agent turn it into an OpenSearch query. You send a `_search` request with an `agentic` query clause, an agent reads your index and produces a `_search` body written in OpenSearch's query domain-specific language (DSL), and OpenSearch runs it and returns hits.

That puts a lot on the model. It has to get the whole query right, and a large language model can return a query that is invalid, or one that is valid but does not mean what you asked. A query that needs more structure also takes more writing, which costs more tokens and more time.

This post describes a different approach, built on the [OpenSearch agent server](https://opensearch.org/blog/bringing-intelligence-to-opensearch-introducing-the-opensearch-agent-server/). Instead of writing the query, the model **fills a template**. You register a search template once, the model supplies only its parameter values, and OpenSearch renders the query.

## Prerequisites

Template fill spans OpenSearch and the agent server, so a few things need to be in place first:

- **OpenSearch 3.9 or later**, with the ML Commons and Neural Search plugins.
- **A running OpenSearch agent server** that your cluster can reach. The [agent server introduction](https://opensearch.org/blog/bringing-intelligence-to-opensearch-introducing-the-opensearch-agent-server/) covers installation and configuration. Template fill runs in the agent server, so it is not available through an agent that generates queries inside the cluster; the wiring below registers a separate flow agent that calls out to the agent server.
- **Amazon Bedrock as the agent server's model provider.** Filling a template uses a forced tool call, which the agent server currently implements for Bedrock. With another provider the fill attempt fails and the request falls back to writing the query directly, so searches keep working but the template is never used.
- **Read access to the template system index** for the identity in the connector's credential, if your cluster runs the Security plugin. The agent server reads each template's parameter schema from `.plugins-ml-agentic-search-templates`, which is a protected system index. Without that access the schema read fails and every request falls back to writing the query directly.

If you have not used agentic search before, the [3.3 introduction](https://opensearch.org/blog/introducing-agentic-search-in-opensearch-transforming-data-interaction-through-natural-language/) and the [hands-on walkthrough](https://opensearch.org/blog/opensearch-3-4s-agentic-search-in-opensearch-dashboards-hands-on-use-cases-and-examples/) are the places to start.

## How template fill works

A **search template** is a stored query written in the Mustache templating language, with placeholders for the parts that change between requests. You control the structure of the query, and the template marks the spots where a value gets substituted. For example, a product search is often a `match` on the title with an optional category filter, where the search text and the category are the parts that vary.

With template fill, the work splits into two stages:

- **At registration time**, OpenSearch reads the template body and derives a **parameter schema**: each parameter's name and type, whether it is required, a description of what it does, and the values it may take when those come from a fixed set. You register the template once, and OpenSearch derives and stores the schema for you.
- **At query time**, the agent gives the model only that schema and the question. The model returns parameter values, not a query. OpenSearch renders the template with those values and runs the result.

The model never has to produce the query structure, because the structure lives in the template. All it has to do is choose the values that go into the slots you defined.

That difference shows most clearly side by side:

![Filling a template writes four values (18 characters); authoring the query directly writes the whole body (481 characters).](/assets/media/blog-images/2026-09-03-fill-dont-write-llm-query-generation-with-opensearch-search-templates/template-fill-demo.gif)
*For the same question, filling a template (left) has the model write four values, while authoring the query directly (right) has it write the entire request body.*

The cost and latency of a generation request scale with how many tokens the model produces. Authoring a full query means writing the whole `_search` body, which grows as the query gets more complex. Filling a template means writing a handful of values, which stays small no matter how large the template is. Rendering the template into a query happens inside OpenSearch and takes about the same time regardless of the template's size.

In our testing across five indexes and two models, filling a template that carries substantial query structure ran 3.4 times faster on average than authoring the equivalent query, while emitting far fewer output tokens. How much you gain depends on the template. A template carrying a lot of structure gives a large gain, since the model would otherwise have to write all of that structure itself. A light template gives a smaller one. With a light template and a fast model, latency came out close to even, because there was not much for the model to write either way. Filled queries also followed mandatory rules more consistently, since a required filter written into the template does not depend on the model adding it.

Keeping the generated output small has a second benefit. Neural Search caps the generated query at 10,000 characters and fails the request when a query exceeds that, with no fallback. A filled template emits values rather than a query body, so it stays well clear of that ceiling even when the rendered query is long.

## Enabling the feature

The template endpoints are experimental and disabled by default. Turn them on with a cluster setting:

```json
PUT _cluster/settings
{
  "persistent": {
    "plugins.ml_commons.agentic_search_template_enabled": true
  }
}
```

Two more ML Commons settings decide which hosts a connector may call, and the walkthrough below is affected by both. When you create a connector, ML Commons resolves its URL and matches it against `plugins.ml_commons.trusted_connector_endpoints_regex`. The default list covers hosted model providers rather than a service you run yourself, so a connector pointed at your agent server is rejected. Addresses on the local machine or a private network are also refused unless `plugins.ml_commons.connector.private_ip_enabled` is on. For a local walkthrough:

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

Scope that pattern to your agent server's real host rather than widening it, and note that replacing the regex list drops the defaults, so add back any model-provider endpoints your cluster already relies on.

## Registering a search template

Start with the index you want to search. This example uses a small product catalog:

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

Escaped on one line it is hard to read, so here is the same body formatted. The placeholders are the parts the model will fill: `query_text` is the search text, `category` is an optional filter, `sort_by` chooses a field to sort on, and `size` sets the number of results.

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

Wrapping `category` and `sort_by` in Mustache sections is what makes them optional: when the model leaves one out, that whole clause disappears from the rendered query.

Now register the template with ML Commons so the agent can use it. You pass the template's id and the index it targets. A description is optional. Leave it out and OpenSearch derives one from the template body:

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

Registration also validates the template. OpenSearch renders the body twice, once with every parameter filled and once with only the required ones, and rejects the registration if either render is not legal JSON. A template that would break at query time fails here instead.

Registration creates the template once. Register the same `template_id` again and OpenSearch returns a `409` instead of overwriting what is there, so a schema you have tuned stays put.

During registration, OpenSearch derives the parameter schema from the template body. It reads each Mustache tag to decide the type and whether the parameter is required, and it uses your index mapping to fill in the choices for parameters that select a field, such as one named `sort_by` or ending in `_field`. It also renders the body to find where each parameter lands in the resulting query, then uses the surrounding clause to write a description for it. The derivation runs on fixed rules, with no model involved. You can inspect the result:

```json
GET /_plugins/_ml/agentic_search_templates/product_search
```

The `param_schema` in the response looks like this:

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

A few things to notice. `query_text` sits in a quoted position and is used directly, so it is a required string, and because it renders inside a `match` clause on `title`, its description names that field. `category` is wrapped in its own Mustache section, which marks it optional, and it renders inside a `term` filter, so it is described as an exact-match filter. `sort_by` names a field, so OpenSearch drew its allowed values from the index mapping. `size` is unquoted, so it is treated as a number.

Those descriptions and allowed values are what the model reads when it decides which value belongs in which parameter, which makes them the main thing to tune. We come back to that below. If you would rather not start from derivation at all, you can pass your own `param_schema` on the register call and OpenSearch validates and stores it as sent.

OpenSearch also derives a one-line description of the template as a whole, which it stores when you don't supply your own. For the template above, that description is:

```text
Full-text search over title; filters by category; sortable.
```

That becomes useful later, when the agent chooses among several templates.

## Wiring the template to a search pipeline

Registering a template makes it available for filling, but it does not yet connect it to a search request. A connector describes the call to the agent server, an agent uses the connector, and a search pipeline tells OpenSearch which agent to run.

Start with the connector. Two of its fields do the real work:

- **`parameters`** holds the static values, including the `template_id` to fill. Set `endpoint` to your agent server's host.
- **`request_body`** is a template for the JSON payload. OpenSearch substitutes each `${parameters.<name>}` placeholder before sending, so `question` and `index_name` come from the search request at query time, while `template_id` comes from the static parameters above.

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

Because `request_body` has to be a single JSON string, it is hard to read inline. Here is the same payload formatted, which is what the agent server receives:

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

Reading it that way makes the two important fields clear. `context.template_id` is what puts the agent in template-fill mode: without that key the same connector writes the query directly. And `response_format: inference_results` asks the agent server for the response envelope that the `post_process_function` above knows how to unpack, so the generated query lands where Neural Search reads it.

One consequence of `template_id` living in the connector is that the template is chosen when you register the connector, not per query. To serve several query shapes, register a connector and agent for each, or use a candidate set as described further below.

Next, a flow agent that calls the connector. Paste in the `connector_id` returned above:

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

Finally a search pipeline. The `agentic_query_translator` request processor is what turns an `agentic` clause into a call to your agent, and it reads `agent_id` from its own configuration. Paste in the `agent_id` from the previous response:

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

The response processor is optional, but `dsl_query` is worth enabling while you are setting things up, since it returns the generated query alongside your results.

## Asking a question

With the pipeline in place, a question is an ordinary search request that names the pipeline and puts the question in an `agentic` clause:

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

Behind that request, the agent gives the model the schema for `product_search`, and the model returns values:

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

You get hits back, plus that generated query under `ext.dsl_query` if you enabled it. The model wrote four values. The category filter and the sort clause show up because it filled those optional parameters. Had it left them out, the template would have rendered without them. The query structure is the one you defined in the template.

The `agentic` clause brings a few constraints of its own. It has to be the top-level query, and your request cannot also use aggregations, `sort`, highlighting, `post_filter`, `suggest`, `rescore`, or `collapse`, because the generated query replaces the search body. Sorting still works, as above, when the template produces the `sort` clause. Two other clause fields do not apply on this path: `query_fields` is not passed to the fill prompt, and `memory_id` is rejected by a flow agent.

## Improving results by describing your parameters

With the structure fixed, the values are the only thing left to get wrong, and all the model knows about a parameter is what the schema tells it. The derived descriptions handle the common cases, but they describe the clause a parameter renders into rather than what the values mean in your data. Rewriting them for your data is the change that improved our results the most, more than switching models or reworking the prompt did.

Units are the clearest example. Suppose a template has a parameter that bounds a weight field. Derivation can work out that it is an upper bound on a range, but it has no way to know the unit. Ask for "a tent that weighs under 1.5 kilograms" and a model working from the name alone might put `1.5` into a bound that the template applies to price, since both are numbers and both fit the sentence. Saying so in the description removes the ambiguity.

The same applies to the `product_search` schema above. `query_text` feeds a `match` clause, so filter words do not belong in it, and `sort_by` offers every field in the mapping, including `title`, which is a `text` field that a sort would fail on. Both are worth narrowing:

```json
PUT /_plugins/_ml/agentic_search_templates/product_search
{
  "param_schema": {
    "query_text": {
      "description": "Product words only, such as a type or material. Do not include filters like price, category, or availability."
    },
    "sort_by": {
      "description": "Field to sort results by.",
      "enum": [ "price", "title.keyword" ]
    }
  }
}
```

The update API merges these into the stored schema, so you change only the fields you name. It will not accept a parameter the template body does not reference. A few adjustments carry most of the benefit:

- **State units and scale** for numeric parameters. Amounts, durations, and distances are where a model is most likely to substitute one field for another.
- **Say what a parameter should exclude**, not just what it holds. A full-text parameter is the common case: without guidance, a model tends to put the whole question into it, including words that belong in filters.
- **Narrow the allowed values** to ones that work on your data. Derivation lists every field in the mapping for a field-selector parameter, which is broader than the fields you want sorted on.
- **Mention the fallback** for an optional parameter when derivation didn't pick one up, so the model knows it can leave the parameter out rather than guessing a value.

None of this is required to get started, and a template with derived descriptions works. It is the pass to make once you have seen which questions come back wrong.

## When a template can't express a question

A template covers a defined range of questions. Someone might ask for something it cannot represent, such as "what is the average price per category," which needs an aggregation the `product_search` template does not contain. If the model forced values into a template that cannot express the request, the query would run and answer the wrong question.

So the model can decline instead. Every template-fill request gives it a way to say that the template cannot express the question. When it does, agentic search writes the query directly from the index, the same path it uses when no template is involved. Either way you get an answer: a filled template when the question fits, and a written query when it doesn't.

The two kinds of failure differ in how visible they are. A query that fails to render raises an error that OpenSearch catches, and the request falls back to writing the query directly. A query that renders but means the wrong thing will not trip anything, and the decline path is what keeps the model from committing to a template that doesn't fit. Note that a declined question costs two generation calls rather than one, so the latency advantage applies to the questions your templates actually cover.

## Choosing among several templates

A connector can name more than one template. If you register a few templates for an index, say a keyword search and a semantic search, change two things in the connector from the wiring section above. First, list the candidate ids in the static parameters, and remove the `template_id` entry, since a connector carrying both sends the scalar as an extra candidate:

```json
"parameters": {
  "endpoint": "127.0.0.1:8001",
  "template_ids": "[\"product_search\", \"semantic_product_search\"]"
}
```

Then have the payload pass `template_ids` in the context instead of `template_id`. The placeholder is not quoted here, because the parameter value is already a JSON array and quoting it would produce an invalid payload:

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

which becomes this in the connector's `request_body`:

```text
{\"query\":\"${parameters.question}\",\"agent\":\"agentic_search\",\"context\":{\"index_name\":\"${parameters.index_name}\",\"template_ids\":${parameters.template_ids}},\"response_format\":\"inference_results\"}
```

When more than one template is available, the agent picks the one that best fits the question and fills it in a single step, rather than making one request to choose and another to fill. It compares the template descriptions, so the description derived at registration time is worth a read. Candidates registered against a different index are left out, so only templates that apply to the index you are searching get considered. If none of them fit, the same decline path applies and the agent writes the query directly.

## Where template fill fits

Template fill suits searches whose shape you can describe ahead of time, even though the words in the question vary. Some examples:

- **Product and catalog search.** A storefront search is usually the same query every time: match the shopper's words against a title and description, filter on category, brand, price, and availability, then sort by relevance or price. The template holds the relevance configuration your team tuned, and the model supplies the shopper's terms and filters. Questions like "waterproof jackets under $150, in stock" and "cheapest wool socks" fill the same template.
- **Searches with rules that must always apply.** Many applications require a filter on every query: a tenant identifier, an `is_active` flag, a visibility or region field. Written into the template body, that filter shows up in every rendered query without the model having to add it. This gives you consistency, not enforcement: a template only governs the queries the agent generates, so it is not a substitute for document-level security.
- **Searches over a hand-tuned relevance configuration.** If your query uses field boosts, a `function_score`, or a decay function that took effort to get right, a template is where that configuration lives. The model changes the terms and filters without touching the scoring. This is also where the latency gain is largest, since a long query body is exactly what the model no longer has to write.

Direct query authoring is still the better fit for open-ended exploration, where you can't predict the shape of a question and want the model's full range, and for analytics questions such as aggregations. Since the decline path covers the gap, a practical setup is to register templates for the searches you serve most often and let the model write the rest.

## Conclusion

Template fill gives agentic search a second way to turn a question into a query. Instead of writing the query, the model fills the parameters of a template you register, and OpenSearch renders the result. The template holds the structure, so the model produces less, which lowers latency and cost and leaves you in control of the query shape. When a template can't express a question the model declines and the agent writes the query directly, so a template narrows what the model has to do without limiting what you can ask. The feature is experimental and opt-in.

To get started, see the agentic search template documentation, and share your experience on the [OpenSearch forum](https://forum.opensearch.org/).
