# Editorial review: Fill, don't write

**Reviewed file:** `_posts/2026-09-03-fill-dont-write-llm-query-generation-with-opensearch-search-templates.md`  
**Scope:** Read-only editorial, technical, safety, metadata, link, and formatting review. No source files were changed.

## Checks performed

- Read the repository guidance, `BLOG_GUIDE.md`, and the OpenSearch Style, Writing, Blog Style, and Text Formatting guides.
- Ran `vale --minAlertLevel=suggestion` on the post. Vale reported 17 suggestions, no warnings, and no errors.
- Confirmed the linked posts, documentation, and forum each returned HTTP 200.
- Compared the template-fill behavior with the official [Search Template Fill tool](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/tools/search-template-fill-tool/) and [Filling templates in the agent server](https://docs.opensearch.org/latest/vector-search/ai-search/agentic-search/agentic-search-templates/agent-server/) documentation.

Content from external documentation was rephrased for compliance with licensing restrictions.

## High

### H1. Add the production-use warning before persistent cluster changes

**Lines:** 60–85  
**Wording:** “The template endpoints are experimental and disabled by default. To enable them, update the following cluster setting,” followed by two `"persistent"` cluster-setting requests.

The official feature documentation identifies agentic search templates as experimental and advises against production use. The post explains that the settings affect every connector, but it does not state the production limitation before asking readers to persist cluster-wide changes. Readers can apply the examples to an existing cluster without recognizing the support and operational risk.

**Recommended action:** Add a prominent warning before the first request. State that the feature is experimental and not recommended for production. State that the examples change persistent, cluster-wide settings. In the second example, instruct readers to retrieve and preserve their current trusted-endpoint configuration before replacing the array, then restore the setting when the test is complete.

### H2. Do not present cleartext bearer-token transport as a general connector pattern

**Lines:** 76–88, 276–299  
**Wording:** `"protocol": "http"`, `"url": "http://${parameters.endpoint}/invoke"`, and `"Authorization": "Bearer ${credential.token}"`. Line 88 then says to replace `127.0.0.1:8001` with the agent server’s “real host.”

The connector sends a bearer token over HTTP. Although the preceding cluster-setting example is introduced as a local walkthrough, the instruction to substitute a real host makes the example easy to carry into a networked deployment. On a network path, HTTP exposes the token and request content to interception.

**Recommended action:** Limit the HTTP example explicitly to a loopback-only local test. Add a production example that uses HTTPS, validates the agent server certificate, and uses the exact HTTPS endpoint in the trusted-endpoint expression. Direct readers to provide the token through their documented secret-management process rather than placing a real token in a saved request or source-controlled file.

### H3. Provide reproducible evidence for the central latency, cost, and reliability claims

**Lines:** 12, 15, 49–55, 409, 441–442  
**Wording:** “improves latency and reliability”; “filling a template lowers both”; “ran 3.4 times faster on average”; “far fewer output tokens”; “it declined in three of five runs”; and “searched for `shoes` in all five runs.”

The post’s main recommendation depends on these results, but the evidence does not identify the models, model versions, provider regions, OpenSearch configuration, index sizes, prompts/questions, concurrency, warm-up behavior, number of latency samples, latency statistic, token measurement method, or per-path results. Five runs cannot establish a reliability rate, and “far fewer” supplies no measurable result. The 18-versus-481-character animation likewise does not establish token count, cost, or latency.

**Recommended action:** Add a compact methodology and results table or link to a reproducible benchmark artifact. Identify both models and their versions, cluster and provider environment, template/query corpus, sample count, token accounting method, and whether “average” is mean or median. Report absolute latency and output-token values, variation, and failures for each path. Recast the five-run examples as illustrative observations unless they are backed by a larger controlled evaluation.

### H4. Make silent fallback and `match_all` behavior operationally safe

**Lines:** 32, 472–476  
**Wording:** “the request falls back to writing the query directly without returning an error” and “If query generation fails entirely, it returns a `match_all` query.”

This behavior can hide an authorization or template-read failure and can return broader results than the reader expects. The post notes the mechanics but does not give an operational response. The later statement that templates do not replace document-level security is useful, but it does not tell readers how to detect this fallback or protect applications that require a template-enforced constraint.

**Recommended action:** Add a warning immediately after the fallback description. Tell readers to enforce access restrictions outside the generated template, record and alert on fallback reasons, and validate the returned generated query before relying on template-only filters. State that applications requiring fail-closed behavior should use the in-cluster tool with `fallback_enabled` set to `false` where that behavior fits the application, or otherwise reject unexpected fallback responses.

## Medium

### M1. Describe agent and model behavior as request processing, not human-like selection or refusal

**Lines:** 18, 220, 472–476, 523, 533  
**Wording:** “an agent reads your index”; “the agent selects among several templates”; “The model can decline”; “the model picks a template”; and “the agent selects the one that best fits.”

The repository guidance requires mechanical descriptions of AI behavior. These sentences assign reading, selecting, and declining to an agent or model without naming the request fields and validation conditions. The official documentation supplies useful mechanisms: the LLM can return `cannot_express`; the tool checks candidate IDs, registered indexes, nonempty schemas, and template access; and it then renders or uses the documented fallback path.

**Recommended action:** Name the request processor, candidate filtering, model output, and fallback explicitly. For example: “The LLM can set `cannot_express`; the tool then uses the Query Planning tool.” Replace “the agent selects” with wording that says the implementation compares the registered candidate descriptions and passes one candidate to the fill request, if that is the confirmed implementation behavior. Replace “reads your index” with the specific mapping or sample-document access used by the path being described.

### M2. Use the required plugin name on first reference

**Lines:** 21, 28, 154, 225, 230 and throughout  
**Wording:** “ML Commons `SearchTemplateFillTool`,” “ML Commons,” and “register the template with ML Commons.”

The OpenSearch Style Guide requires the word “plugin” when naming a plugin. The current prose uses the plugin name alone throughout, which makes the component type less clear.

**Recommended action:** Introduce “the ML Commons plugin” on first use, then use “ML Commons” only where repetition would impede readability. Retain the exact API paths and tool type names in code font.

### M3. Replace generic headings with headings that state the subject

**Lines:** 23, 535  
**Wording:** `## Prerequisites` and `## Next steps`.

The repository guidance requires specific, scannable headings and explicitly disallows generic headings. The headings do not identify agentic search templates or the action readers will take.

**Recommended action:** Use headings such as `## Requirements for template filling` and `## Try template filling with your search application`.

### M4. Split dense prerequisite and failure-handling text

**Lines:** 32, 474  
**Wording:** The single bullet beginning “**Permissions for the connector’s credential**” and the paragraph beginning “How other failures are handled depends on where the template is filled.”

Each passage contains several distinct permissions or fallback conditions. The first is difficult to scan when a reader configures authorization. The second combines the behavior of two implementations, several failure classes, the `match_all` outcome, and `fallback_enabled` in one paragraph.

**Recommended action:** Divide line 32 into an introductory sentence and a nested list of the required permissions, each paired with the reason it is needed. Divide line 474 into one short subsection or list per implementation. Preserve the different error and fallback behavior; it is important technical information.

### M5. Make the stated scope of broad performance claims match the evidence

**Lines:** 52–55, 476, 532–534  
**Wording:** “Rendering the template … takes about the same time for a large template as for a small one”; “the largest gain”; and “Direct query authoring remains preferable.”

These broad statements can be true only under stated conditions, but the post does not identify those conditions or distinguish measurement from recommendation. The surrounding text already acknowledges model and template variation, which makes the unsupported generality more visible.

**Recommended action:** Attribute each statement to the benchmark configuration or frame it as a hypothesis to test. For the recommendation, name the deciding conditions, such as query coverage, fallback tolerance, and measured end-to-end latency.

## Low

### L1. Resolve the actionable Vale word-choice suggestions

**Lines:** 30, 175, 212, 226, 462, 523  
**Wording:** “For more information, see”; “Such a parameter gets every mapped field”; “For more information, see”; “if you want”; “telling the full-text parameter”; and “How other failures are handled.”

Vale identifies these as imprecise or phrasal wording. They are small edits, but they conflict with the repository preference for direct language and precise single-word verbs.

**Recommended revision:** Use “For more information about, read …” or “For more information about …”; “receives every mapped field”; “if you require”; “instructing the full-text parameter”; and “Failure handling differs by template-filling path.”

### L2. Keep documented `fallback` terminology rather than applying Vale’s `reverts` suggestion

**Lines:** 15, 31–32, 266, 474, 476  
**Wording:** “falls back” and “falling back.”

Vale reports several suggestions to replace these phrases with “reverts.” That substitution would be less accurate because `fallback_enabled` and the fallback path are documented feature terms. The wording is a technical term here, not a vague phrasal verb.

**Recommended action:** Retain “fallback” where it identifies the documented behavior. If a prose-only rewrite improves a sentence, use “uses the fallback path” rather than “reverts.”

### L3. Replace the unexplained `TL;DR` label

**Line:** 15  
**Wording:** `**TL;DR:**`

The label is an unexplained abbreviation and informal internet shorthand. It is less accessible to a global audience than a plain label.

**Recommended revision:** Use `**Summary:**` or remove the label and make the paragraph the opening summary.

### L4. Use punctuation that matches the list-description format

**Lines:** 541–544  
**Wording:** Resource-list descriptions separated from links by ` -- `.

The spaced double hyphen is visually inconsistent with the writing guidance for dashes and makes the resources look like command-line options. A colon gives the list a conventional, readable structure.

**Recommended revision:** Replace each ` -- ` with `: `.

## Passed checks

- **Front matter and authors (lines 1–13):** The post includes all required fields: `layout`, sentence-case `title`, `authors`, `date`, `categories`, `meta_keywords`, and `meta_description`. Both `adityashah` and `jiapingzeng` have author entries in `_community_members/`. The `technical-posts` category is a documented category.
- **Title and most headings (lines 3, 36–526):** The title and all headings use sentence case. Apart from the two generic headings identified in M3, headings state the section subject and avoid prohibited headings such as “Overview” and “How it works.”
- **Reader address and voice (throughout):** The post consistently addresses the reader as “you.” References to a “user” describe the search requester and authorization context, so they do not replace direct reader address.
- **Terminology and abbreviations (lines 18–20):** The prose expands query domain-specific language (DSL) and large language model (LLM) on first body use. It uses “OpenSearch” consistently and does not use the prohibited “OpenSearch ecosystem” phrasing.
- **Structure and call to action (lines 15–547):** The opening states the post’s problem and approach immediately. The post progresses from prerequisites through configuration, examples, limitations, and a final invitation to try the feature and use the OpenSearch forum.
- **Lists, images, and code formatting (lines 26–32, 41–49, 76–87, 93–545):** Lists have complete introductory sentences and use parallel item structures. The animation has a preceding complete-sentence introduction, descriptive alternative text, and a supporting caption. Its referenced GIF exists at the expected date-matched asset path. Code blocks use appropriate language labels, and the Mustache template is protected by `{% raw %}` tags.
- **Technical alignment and links (lines 26–35, 231–267, 271–370, 412, 472–524, 541–547):** The reviewed API paths, version 3.10 introduction, multi-tenancy limitation, connector fields, access-control explanation, candidate limit, and differing fallback behavior align with the official documentation checked during this review. All nine external links returned HTTP 200. This was a documentation comparison, not an executed-cluster test.
- **Security awareness (lines 28–33, 88, 529–531):** The post identifies the required permissions, cautions readers to scope the endpoint expression, and correctly states that a template is not a substitute for document-level security. H1, H2, and H4 identify the remaining operational safety context required before publication.
- **Automated style check:** Vale completed with **0 errors**, **0 warnings**, and **17 suggestions**. The actionable suggestions are covered in L1; the documented `fallback` term is addressed in L2.
