
# Explore OpenSearch 3.10

### *Simplify hybrid search, expand observability for AI agents, and ingest data at rest*

OpenSearch 3.10 brings advancements across observability, serch and cluster operations, delivering deeper visibility into applications and AI agents, simpler and more predictable AI-powered search, and new ways to ingest and recover data. The latest capabilities in OpenSearch 3.10 include:

- Investigating applications and AI agents faster with the OpenSearch Observability Stack, which maps the databases, queues, and external APIs that services depend on and traces agent conversations down to the failing call.
- Charting Prometheus metrics in Vega and Vega-Lite visualizations.
- Speeding up PPL queries with time-range index pruning and adding support for cross-cluster queries.
- Running hybrid queries without a search pipeline using a new fusion mode.
- Connecting to models on Google's Gemini Enterprise Agent Platform with fewer setup steps.
- Making agentic search more predictable with experimental search templates that the LLM fills in instead of writing full queries.
- Extending pull-based ingestion to data at rest in object storage.
- Restoring plugin state cleanly from snapshots.

OpenSearch 3.10 is ready for download. The following sections describe the new features in more detail. For a complete list of changes, see the release notes.

## Observability and analytics

OpenSearch 3.10 helps teams go from a symptom to its cause without leaving OpenSearch Dashboards. Application Performance Monitoring (APM) now maps the databases, queues, and third-party APIs that your services depend on. Agent Traces follows an AI agent conversation down to the LLM or tool call that failed. The visualization editor becomes the starting point for new charts, and Vega can now chart Prometheus metrics. PPL can skip indexes outside the selected time range, return results while a query is still running, and query `flat_object` fields and remote clusters. Please note that several of these features require the OpenSearch Observability Stack with Data Prepper 2.17, which is versioned separately from core OpenSearch.

#### **See databases, queues, and external APIs on the service map**

OpenSearch 3.10 and Data Prepper 2.17 can detect the databases, message queues, and external APIs that your services call, and show them directly in APM. Data Prepper finds these dependencies in client spans, including PostgreSQL, Valkey, Redis, Kafka, external HTTP services and LLM endpoints, so you do not need to instrument the dependencies themselves. APM shows each dependency as a typed node with its own rate, error and duration (RED) metrics. The topology map and the Services catalog show dependencies next to your services, and you can filter the catalog by type. The same dependencies also appear in the trace map, waterfall, and topology card of a single trace in Discover Traces. More interactive APM charts add a synced crosshair across dependencies, and you can zoom into a latency spike or open it in Discover Metrics to see whether a problem comes from your own code or from a database, a queue or a third-party API. For more information, visit [Services](https://observability.opensearch.org/docs/apm/services/) and [Service map](https://observability.opensearch.org/docs/apm/service-map/).

[IMAGE TO BE ADDED]

*Filter the APM Services catalog to databases and message queues, each with its own latency, throughput and failure rate*

#### **Trace AI agent conversations from session to failing call**

As AI agents move into production, teams need to monitor them like any other workload. OpenSearch 3.10 and Data Prepper 2.17 add a Sessions view to Agent Traces. It groups agent runs into multi-turn conversations using the `gen_ai.conversation.id` attribute. Each session shows its first message, duration, trace count and total tokens, and a filter narrows the list to sessions with errors. You can read a conversation turn by turn, then open a failing turn to see which LLM call or tool call failed and how many tokens it used. A new Related logs tab in the trace flyout lists the logs that the trace wrote, and each span shows its own logs, so you can go from a failed tool call straight to its log lines. Agents that run inside an HTTP service, such as a chat endpoint that calls an agent, are now detected as agent runs, so more of your AI applications can be monitored without code changes. For more information, see [Agent tracing](https://observability.opensearch.org/docs/ai-observability/agent-tracing/).

[IMAGE TO BE ADDED]

*Read an agent conversation turn by turn in the Agent Traces Sessions view, with duration and token totals for each trace*

#### Visualize Prometheus metrics in Vega and Vega-Lite

Vega has long been one of the most flexible visualization options in OpenSearch Dashboards, and OpenSearch 3.10 extends it to Prometheus data sources. Vega and Vega-Lite specifications can now query a Prometheus data connection using PromQL. You can build interactive metrics visualizations next to your log and search visualizations in one interface. For example, a Kubernetes memory explorer can let users pick a point in time and view memory usage in a tree map split by namespace and pod. Data is fetched on the server, so you do not need to enable external URLs, and visualizations can follow the dashboard time picker. This work is a community contribution, and you can help shape further improvements by commenting on the [RFC](https://github.com/opensearch-project/OpenSearch/issues/22829).

#### Build every chart from one visualization editor

OpenSearch 3.10 makes the visualization editor the starting point for new charts. **Create visualization** now recommends the visualization editor and offers shortcuts to start from Discover or Metrics. The 19 classic visualization types are in a collapsed, searchable **Legacy visualization types** section, so existing workflows keep working. In the visualization editor, a **Code** / **Builder** switch lets you build a PPL query point by point instead of typing it. Dashboard variables also scale to large value lists. You can search the full list of values, and a new **Custom all value** field lets you choose what **All** sends to the query, for example `.+` for a PromQL regex. For more information, see [Visualization editor](https://observability.opensearch.org/docs/dashboards/visualize/) and [Managing variables](https://observability.opensearch.org/docs/dashboards/variables/managing-variables/).

#### Visualize data flows with Sankey charts

A new Sankey visualization in Discover and dashboards shows how volume flows between two fields, such as from services to severity levels. You can build one directly from a PPL `stats ... by` query by choosing a source, a target and a value field. Display options include orientation, node labels, link colors and per-level styling.

[IMAGE TO BE ADDED]

*Show flows between two fields with a Sankey chart built from* `stats count() by agent, machine.os`

#### Query faster and at larger scale with PPL

OpenSearch 3.10 helps PPL queries finish sooner and work with more kinds of data:

- **Time-range index pruning:** Discover now sends the selected time range with each PPL query, and the SQL plugin uses it to skip indexes that hold no data in that range before reading their mappings. A query on `logs-*` for the last 30 minutes no longer reads every rolled-over index in the pattern. Pruning also works on data stream backing indexes, and on queries that filter on `@timestamp`, `timestamp` or `time`. Query results do not change.
- **Streaming results and asynchronous queries:** When enabled, Discover shows PPL results as a long-running query runs. A row count updates as results arrive, and the Run button becomes Stop so you can end the query early. Applications can submit PPL queries asynchronously, check how far along they are with `progress.fraction_done`, and cancel them with `DELETE /_plugins/_async_query/{id}`.
- `flat_object`** fields:** PPL can now read, filter, `cast` and `typeof` the leaf fields of `flat_object` fields, such as `attributes.duration_ms`. Filters such as `=`, `in`, `like` and `isnull` run as index lookups.
- **Cross-cluster queries:** Queries such as `source=remote:logs-*`, `*:logs-*`, or a mix of local and remote patterns, now work in PPL and in Discover. Previously, these queries only worked if a matching index also existed on the local cluster. For more information, see [Cross-cluster search](https://observability.opensearch.org/docs/ppl/commands/search/#cross-cluster-search).
- **Unicode string literals** are now supported in the Calcite PPL engine.
- **Regex match limit:** A new dynamic setting, `plugins.ppl.regex.match.limit` (default `100000`), caps how much work a single `parse` or `rex` regex match can do. One pathological pattern can no longer occupy a worker thread for a long time.

## Search modernization

AI-powered search applications benefit from relevance tuning that is simple to configure, query generation that behaves predictably, and vector storage that scales efficiently. OpenSearch 3.10 advances all three with a new fusion mode that brings hybrid score combination into the query itself, experimental search templates for agentic search, deeper compression options for half-precision vectors, and an easier path to connecting with models on Google's Gemini Enterprise Agent Platform.

#### **Run hybrid queries without a search pipeline**

OpenSearch 3.10 introduces fusion mode for the `hybrid` query, which lets you define score normalization and combination directly in the query body instead of in a search pipeline. Because retrieval logic and fusion configuration live in one request, hybrid search can be easier to set up and tune, and existing pipeline configurations can still be reused through the `source: pipeline` option. Fusion mode also makes hybrid queries composable: a pipeline-based hybrid query must be the top-level query, but a fused hybrid query can be nested inside a `bool`, `dis_max`, or another fused hybrid query, and rescoring applies to the combined results. It supports the existing normalization and combination techniques, including min-max, z-score, L2, and reciprocal rank fusion, and it works with rescoring, `explain`, and standard paging without extra configuration. A new `weights` parameter also lets each request set subquery weights in fusion mode or for pipeline-based queries, so teams can tune relevance per request without changing shared configuration. For more information, refer to the documentation [LINK TO BE ADDED].

#### **Return a full page of distinct groups from hybrid queries**

Hybrid queries that use collapse can now return a full page of distinct groups. A new index setting collects the top groups rather than the top documents, so a single group with many high-scoring documents does not crowd others off the page, which can suit search experiences that show one result per product, author, or category. This functionality is disabled by default; refer to the documentation [LINK TO BE ADDED] for instructions on enabling this option.

#### **Connect to Gemini Enterprise Agent Platform models**

OpenSearch 3.10 makes it easier to connect OpenSearch to models on Google’s Gemini Enterprise Agent Platform (formerly Vertex AI). The `google_cloud` connector protocol, introduced in 3.9, handles Google Cloud credentials in the cluster, much as `aws_sigv4` does for Amazon Bedrock and SageMaker. It creates and refreshes OAuth2 access tokens on the cluster’s behalf, so administrators don’t need to rotate short-lived tokens or build their own refresh automation. It supports service account keys and Application Default Credentials (for example, GKE Workload Identity or the Compute Engine metadata server). New in 3.10, Gemini Enterprise Agent Platform endpoints are included in the default trusted-endpoint list, and the blueprints for Gemini text generation, text embeddings, streaming, and batch inference have been updated and tested end to end, so teams can get to a working connector in fewer steps. For more information, refer to the documentation [LINK TO BE ADDED].

#### **Keep agentic search predictable with search templates**

Agentic search translates natural language questions into OpenSearch queries, and OpenSearch 3.10 introduces agentic search templates as an experimental way to make that translation more predictable. Instead of asking the LLM to write the full query DSL, you register existing search templates, and the LLM selects the most appropriate one and fills in only its parameters, such as query text, filters, or sort fields. Because the query structure stays under your control and the model has less to generate, results can often be more consistent across requests. Template filling can run inside the cluster through ML Commons or through the OpenSearch Agent Server, using the same registered templates. For more information, refer to the documentation [LINK TO BE ADDED].

#### **Combine half-float storage with deeper compression in k-NN search**

OpenSearch 3.10 builds on the vector storage and compression options introduced in 3.9. Half-precision (`half_float`) vectors now support 2-bit and 4-bit scalar quantization, so you can pair 16-bit storage with higher compression when balancing memory against recall. Quantized search also gets faster: new SIMD kernels can speed up graph builds for 2-bit and 4-bit indexes, and 1-bit quantized queries are now scored from a precomputed table.

#### **Use k-NN queries in more search scenarios**

k-NN queries stored in percolator fields now run with exact search instead of failing when a document is percolated, so you can match incoming documents against saved vector queries. Rescoring also now works with `expand_nested_docs` on the Lucene engine, so nested-document results are refined on full-precision distances. For more information, refer to the documentation

#### **Boost query throughput and reduce graph memory with Intel Scalable Vector Search**

OpenSearch 3.10 features a sandbox engine framework for experimental vector-search engines in the k-NN plugin, with Intel Scalable Vector Search (SVS) as the first tenant. SVS's Vamana graphs and LeanVec compression target substantially higher query throughput and lower graph memory than HNSW-fp16 at equal recall, with the largest gains in high-recall configurations.```

## Scalability and resiliency

As clusters take on more data and more tenants, teams need simpler ways to bring data in, recover from failures, and balance capacity utlization. OpenSearch 3.10 extends pull-based ingestion to data at rest in object storage, helps plugins pick up where they left off after a snapshot restore, and adds request throttling for workload groups, along with a new Notifications send API and expanded Query Insights.

#### **Ingest data directly from object storage with pull-based ingestion**

Pull-based ingestion lets OpenSearch fetch data directly from a source, and until now those sources have been streaming platforms such as Apache Kafka and Amazon Kinesis. OpenSearch 3.10 extends the model to data at rest with a new object store source, which reads NDJSON files directly from Amazon S3, Google Cloud Storage, Azure Blob Storage, or a shared file system. Database exports and files from upstream jobs can now flow into OpenSearch the same way, without a separate streaming layer or bulk indexing client. Each record maps to a stable document ID, so recovery and replays do not create duplicates. This first version supports uncompressed, append-only NDJSON, making it well suited to bulk loads of data that does not change during ingestion.

#### **Restore plugin state cleanly from a snapshot**

Snapshots are the main way to recover or move OpenSearch data, but restoring plugin state from system indexes can be difficult. Security blocks REST administrators from restoring system indexes, so a restore usually requires the admin certificate. Even then, some plugins may end up out of step with the new cluster (for example, monitors skip new documents, and managed indexes restart their policies). <textStyle t="green-6">OpenSearch 3.10 adds a post-restore hook for plugins. Now, Alerting and Index State Management (ISM) carry restored state over to the new cluster, and both use the hook.</textStyle> Restored Alerting monitors resume reading new documents and keep writing alerts and findings, and ISM-managed indexes continue their policies from the state captured in the snapshot instead of starting over. The Security plugin also lets REST administrators restore an approved list of system indexes, so disaster recovery and cluster migration for indexes on that list do not need the admin certificate. Because results can depend on restore order and configuration, administrators may want to review the per-plugin guidance before planning a restore. For more information, refer to the documentation [LINK TO BE ADDED; refer to [https://github.com/opensearch-project/documentation-website/pull/13472](https://github.com/opensearch-project/documentation-website/pull/13472)].

#### **Cap concurrent search requests per workload group**

OpenSearch 3.10 adds request throttling to workload management, letting you cap how many search requests a workload group runs at the same time. You can set a per-node limit (`node_limit`), which each node enforces locally with no added latency, or a strict cluster-wide limit (`shared_limit`), which adds latency from distributed coordination and is best reserved for cases that need exact cluster-wide enforcement. For each workload group, you choose whether the limits apply to the group as a whole, per user or per role, which can help keep any single tenant from taking all of the search capacity. Requests over the limit are rejected with a `429` status code. Support for queueing these requests until capacity is available is planned for a future release. For more information, refer to the documentation [LINK TO BE ADDED].

#### **Reuse notification channels from any application with a new send API**

A new Notifications send API lets applications and clients deliver messages through the email, chat, SNS, and webhook channels already configured in OpenSearch, so teams do not need to build a separate integration for each channel type. <textStyle t="gray-6">Each request targets a single channel by its ID, and a</textStyle> new `notifications_send_access` role allows sending without permission to create or modify channels. For more information, refer to the documentation [LINK TO BE ADDED].

#### **See who is running which queries in Query Insights**

Query Insights in OpenSearch 3.10 shows each running PPL query as a single entry in Live Queries and adds user, role and application ID columns and sortable live query tables, which can make it easier to see who is running which queries and where load is coming from. For more information, refer to the documentation [LINK TO BE ADDED].

## Security

Security updates in OpenSearch 3.10 focus on managing access control at scale and protecting sensitive key material. This release adds bulk APIs for roles, role mappings, and action groups, supports storing on-behalf-of token keys in a keystore with AES-256-GCM encryption, and adds more detail to audit logs and security configuration workflows.

#### **Update many roles, role mappings and action groups at once**

OpenSearch 3.10 adds bulk create and update operations to the Security plugin's roles, role mappings, and action groups APIs, so a single request can apply many access-control definitions at once. Each request is validated in full before any change is written, and one invalid or unauthorized entry causes the whole request to be rejected, which can help keep security configuration consistent when changes are applied through automation or infrastructure-as-code pipelines. Definitions that are not included in the request stay unchanged, so teams can often update a targeted set of roles without rewriting their entire configuration. For more information, refer to the documentation [LINK TO BE ADDED].

#### **Store on-behalf-of token keys in a keystore**

OpenSearch 3.10 strengthens on-behalf-of tokens by encrypting their role claims with AES-256-GCM and a derived key, and it lets administrators load the signing and encryption keys from a node-level keystore instead of storing them in the security index. Keeping key material and its passwords in the OpenSearch keystore may simplify alignment with internal key-handling and FIPS requirements, and tokens remain valid during a rolling upgrade from the previous release. Existing inline key configuration continues to work, so clusters can adopt keystore-based keys at their own pace. For more information, refer to the documentation [LINK TO BE ADDED].

#### **Investigate failed logins from audit logs**

Failed login audit events now record the attempted user and the reason the credential was refused, even when authentication fails before a user is established, which can make suspicious login attempts easier to investigate. Raw tokens are not stored. 

#### **Protect every resource type in a shared index**

Resource sharing now requires every resource type stored in the same index to be protected together, so a shared index cannot be left partially covered. The Security plugin flags misconfigurations at startup, and administrators may want to review their protected resource type settings before upgrading.

#### **Run Security configuration changes as background tasks**

Security configuration write APIs now accept a `wait_for_completion` parameter, so changes to roles, role mappings, users, and other settings can run as background tasks that you check through the Tasks API. This can make automation more resilient in large clusters, and the default behavior is unchanged.

## Infrastructure updates

#### **JDK security fixes and platform updates**

OpenSearch 3.10 bundles updated OpenJDK builds that include the October 2026 security fixes, so deployments that use the bundled JDK can pick up these patches without a separate JDK upgrade. To align with upstream JDK platform support, macOS x64 archive distributions are no longer produced starting with this release; users on Apple silicon or Linux are not affected.

#### Getting Started with OpenSearch 3.10

You can download OpenSearch 3.10 today in your preferred distribution or try it out in OpenSearch Playground. The release notes, documentation release notes, and updated documentation cover the full set of changes. We would love to hear how these features fit into your workflows, so share your feedback on the community forum, GitHub, or Slack. Happy searching!
