---
layout: post
title: "Single pane of glass for all your telemetry: The OpenSearch Observability Stack"
category: blog
tags: [observability, getting-started, opentelemetry, setup, opensearch]
authors:
    - pshenoy
date: 2026-06-16
categories:
  - technical-posts
meta_keywords: OpenSearch Observability Stack, OpenTelemetry, OpenTelemetry Demo, Data Prepper, Prometheus, traces, logs, metrics, service map, RED metrics, PPL, root cause analysis
meta_description: Stand up the OpenSearch Observability Stack with one command, run the OpenTelemetry Demo with the ad service failing, and follow the incident from the Services error spike through the service topology, the trace waterfall in Explore Traces, and the correlated log line in Explore Logs. A single pane of glass for metrics, traces, and logs, all in one OpenTelemetry-native platform.
---

Every incident starts the same way: something is wrong, and your signals are scattered. The error rate is in one tool, the slow trace (if you captured it at all) lives somewhere a third team owns, and the log line that explains it is in a fourth. The minutes you spend pivoting between tabs and reconciling timestamps are minutes the incident is still burning. The [OpenSearch Observability Stack](https://github.com/opensearch-project/observability-stack) is built to collapse that gap: one OpenTelemetry-native platform where metrics, traces, and logs for every service, including AI agents, land together and stay correlated. In this first post of the series, we'll stand the whole stack up, run a real microservices application with one service deliberately failing, and chase that failure from a spike on the **Services** page all the way down to the log line that names the root cause, without ever leaving the UI.

## Setting up the stack

The stack runs on your machine. One command pulls and starts everything:

```bash
curl -fsSL https://raw.githubusercontent.com/opensearch-project/observability-stack/main/install.sh | bash
```

The installer checks prerequisites, configures the stack, and brings up five open-source components wired together:

- **OpenTelemetry Collector** receives OTLP traces, logs, and metrics and routes them downstream.
- **Data Prepper** processes trace spans, builds the **service map**, and computes RED metrics (Rate, Errors, Duration).
- **OpenSearch** indexes and stores traces and logs.
- **Prometheus** stores time-series metrics, queryable with PromQL.
- **OpenSearch Dashboards** is the UI for the APM views: services, service map, traces, and logs.

When it finishes, open OpenSearch Dashboards at [http://localhost:5601](http://localhost:5601). Credentials live in the `.env` file at the install root. This is a development configuration, so harden it before exposing it anywhere real; see the [production readiness notes](https://github.com/opensearch-project/observability-stack#production-readiness).

To get a realistic incident to investigate, enable the [**OpenTelemetry Demo**](https://opentelemetry.io/docs/demo/), the community's "Astronomy Shop": a dozen-plus microservices with a built-in load generator. The simplest way to turn it on is to answer `Y` when the installer prompts you to add the OpenTelemetry Demo:

```text
Include OpenTelemetry Demo? (requires ~2GB additional memory) (Y/n): Y
```

(If the stack is already installed, the demo is also controlled by a single line in `.env` at the install root, `INCLUDE_COMPOSE_OTEL_DEMO=docker-compose.otel-demo.yml`, followed by `docker compose down && docker compose up -d`.)

The demo ships with [**feature flags**](https://opentelemetry.io/docs/demo/feature-flags/) that inject realistic faults. We turn on **`adFailure`**, which makes the **ad** service start returning gRPC `UNAVAILABLE`, so we have a live failure to root-cause. From here on, treat that flag as the ground truth we're trying to rediscover from the telemetry: an SRE wouldn't have flipped the switch, they'd just see the symptom.

## From symptom to root cause

The investigation follows the path any good RCA takes: start with the metrics that tell you *something* is wrong and *roughly where*, narrow to the failing requests in the traces, then confirm with the logs. Each step is one screen, and each links to the next in a click.

### Step 1: Spot the error spike on the Services page

Open the **Services** page under **APM**. This is the service catalog: every service emitting telemetry, with its latency, throughput, and failure rate side by side, computed by Data Prepper as RED metrics. The **Top services by fault rate** panel is where your eye goes first. (See the [Services documentation](https://observability.opensearch.org/docs/apm/services/) for a full tour of this page.)

![The OpenSearch Dashboards Services page. The Top services by fault rate panel lists the ad service at an 8.98% fault rate, the ad-to-frontend dependency path at 9% fault, and the Service Catalog shows the ad row with a rising failure-rate sparkline.](/assets/media/blog-images/2026-06-16-single-pane-of-glass-for-all-your-telemetry-the-opensearch-observability-stack/services-overview.png){:class="img-centered"}

The signal is unambiguous: **ad** is near the top of the fault-rate panel, the **ad → frontend** dependency path is failing, and the **ad** row in the Service Catalog carries a failure-rate sparkline that's climbing. We have our suspect from the metrics alone. To see how it sits in the wider system, use the catalog's correlation buttons: click **View service map** on the **ad** row.

### Step 2: See the failure in the topology and read the RED metrics

The **View service map** button drops you into the **Application Map** focused on **ad**. The topology is generated automatically by Data Prepper from trace data, so you configure nothing. (See the [service map documentation](https://observability.opensearch.org/docs/apm/service-map/) for more on the map.)

![The Application Map focused on the ad service. The ad node health indicator shows a red fault segment with 9.1% faults over 2.6K requests, connected by an edge to frontend. The View insights flyout on the right shows the RED metrics: Total Faults 235, plus Requests, Latency, and a Faults (5xx) chart with a clear error spike.](/assets/media/blog-images/2026-06-16-single-pane-of-glass-for-all-your-telemetry-the-opensearch-observability-stack/service-map-errors.png){:class="img-centered"}

The **ad** node is no longer all green: its health indicator carries a red **fault segment**, and the **frontend → ad** edge makes the blast radius concrete, because the storefront depends on a service that's failing. Click **View insights** on the node and the flyout lays out the RED metrics for **ad**: hundreds of faults out of a few thousand requests, with a **Faults (5xx)** chart that spikes exactly when the trouble started. The metrics have localized the failure. For *why*, we go to the traces.

### Step 3: See the correlated traces in the in-context flyout

From the same flyout, the **Correlated spans** tab pulls the most recent spans for **ad** without leaving the map, with no new query to write.

![The ad service flyout's Correlated spans tab, listing recent oteldemo.AdService/GetAds spans. Several SERVER spans carry a red ERROR status, alongside an Explore Traces button.](/assets/media/blog-images/2026-06-16-single-pane-of-glass-for-all-your-telemetry-the-opensearch-observability-stack/correlated-spans-flyout.png){:class="img-centered"}

The correlated spans confirm it at the request level: the `oteldemo.AdService/GetAds` **SERVER** spans are coming back **ERROR**. This is the bridge from "the metrics say ad is unhealthy" to "here are the exact requests that failed." To dig in, open the failing requests in **Explore Traces**, the dedicated trace explorer.

### Step 4: Find the failing spans in trace analytics

Open **Traces** under **Application Performance** (the [Explore Traces](https://observability.opensearch.org/docs/investigate/discover-traces/) page). It opens on the span table with RED metrics across the top: a **Request count** histogram, an **Error count** histogram that's clearly spiking, and **Avg latency**. Filtering to the failing service with a one-line PPL query, `source = otel-v1-apm-span* | where resource.attributes.service.name = 'ad' and status.code = 2`, leaves only the `oteldemo.AdService/GetAds` spans that came back with an error.

![The Explore Traces span table filtered to the ad service error spans. The Request count and Error count histograms span the top, with the Error count bars spiking; the table below lists oteldemo.AdService/GetAds spans, each with Status code 2 and Service ad.](/assets/media/blog-images/2026-06-16-single-pane-of-glass-for-all-your-telemetry-the-opensearch-observability-stack/explore-traces-error-spans.png){:class="img-centered"}

Every row is a failed `GetAds` call on the **ad** service. To follow one all the way down, click the **SpanID** of any error span and the trace opens in full.

### Step 5: Read the trace waterfall and the error on the span

Clicking the span ID lands you on the trace details view: a Gantt **Timeline** of every operation in the request on the left, and a **Span details** panel on the right for the span you picked.

![The Explore Traces trace details view. The Timeline waterfall shows frontend GET, then GET /api/data, then grpc.oteldemo.AdService/GetAds, then the ad service's own oteldemo.AdService/GetAds span, each flagged with an error icon. The Span details panel on the right shows the ad GetAds span with Span status Error and an Errors tab badged with 2.](/assets/media/blog-images/2026-06-16-single-pane-of-glass-for-all-your-telemetry-the-opensearch-observability-stack/explore-traces-waterfall.png){:class="img-centered"}

The waterfall shows the whole chain of affected calls in one view: **frontend** `GET` → `GET /api/data` → `grpc.oteldemo.AdService/GetAds` → the **ad** service's own `oteldemo.AdService/GetAds` span, and every span on the path carries an error marker. The failure starts at the bottom of the tree, in **ad**, and propagates up to the customer-facing request. Open the **Errors** tab in the **Span details** panel to read what the span actually recorded.

![The Span details Errors tab for the failing ad GetAds span. It shows the span error status, `statusCode` 2, and an Error event whose exception message is UNAVAILABLE, with the timestamp it was recorded.](/assets/media/blog-images/2026-06-16-single-pane-of-glass-for-all-your-telemetry-the-opensearch-observability-stack/explore-traces-span-error.png){:class="img-centered"}

The error is on the request itself, not inferred from a dashboard average: a recorded exception with the message **`UNAVAILABLE`** and `statusCode: 2`, captured the moment the call failed. We now know *which* service, *which* operation, and *what* it returned. The last step is to corroborate it with the service's own logs.

### Step 6: Close the loop with the service's logs

Still in the **Span details** panel, the **Logs** tab shows the **Related logs for span**: the **ad** service's own log lines, stitched to this exact span by span ID. The top one is already a **WARN**. To read the full line and widen the search, click **View in Discover Logs**.

That hands off to the [Explore Logs](https://observability.opensearch.org/docs/investigate/discover-logs/) page, pre-filtered to the same trace ID and span ID, so you land on the offending log line with no query to write. Expand it to read the whole record.

![The Explore Logs page, filtered by the trace ID and span ID from the span. The expanded WARN document shows its full body, GetAds Failed with status Status code=UNAVAILABLE, description=null, cause=null, emitted by oteldemo.AdService.](/assets/media/blog-images/2026-06-16-single-pane-of-glass-for-all-your-telemetry-the-opensearch-observability-stack/explore-logs-rootcause.png){:class="img-centered"}

The expanded document spells it out in the service's own words: `GetAds Failed with status Status{code=UNAVAILABLE, description=null, cause=null}`, emitted by `oteldemo.AdService`. From here you can widen the query with PPL (Piped Processing Language) to see every occurrence. That trace-to-log correlation, with no context switch, is the payoff of a single OpenTelemetry-native platform.

**Root cause:** the **ad** service is failing its `GetAds` gRPC calls with `UNAVAILABLE` (here, by our own `adFailure` flag), and the storefront propagates that up as customer-facing errors. We found it without guessing: we **started with the metrics** on the Services page, followed the **traces** in Explore Traces down to the exact error span, and **correlated to the log line** in Explore Logs that names the failure. Metrics to traces to logs, end to end, in one platform.

## Key takeaways

- *Unified signals*: metrics, traces, and logs land in one OpenTelemetry-native store, so an investigation never requires reconciling timestamps across disconnected tools.
- *Rapid issue identification*: the Services fault-rate panel and the auto-generated topology map point you at the unhealthy service before you've formed a hypothesis.
- *In-context correlation*: the service flyout's **View insights** and **Correlated spans** tabs, plus the span's **Logs** tab, move you from RED metrics to the failing spans to the log lines in single clicks.
- *Root cause on the request itself*: the Explore Traces waterfall shows every affected call, and the span carries the concrete error (`UNAVAILABLE`) rather than a dashboard average.
- *Reproducible faults*: the OpenTelemetry Demo's feature flags let you inject a known failure and practice the exact RCA workflow you'll run for real.
- *One platform, end to end*: service catalog, topology map, RED metrics, trace waterfall, span-level errors, and correlated logs. All of this is available in a single platform, the [OpenSearch Observability Stack](https://github.com/opensearch-project/observability-stack). No stitching together separate tools, no context switching, no timestamp reconciliation. Stand it up once and every signal is already connected.

## What's next?

- **Try it yourself.** Run the installer, answer `Y` to add the OpenTelemetry Demo, flip the `adFailure` flag, and reproduce this walkthrough, then try `paymentFailure` or `cartFailure` and chase those.
- **Go deeper on logs.** The next post in this series filters straight to a failing log line with PPL, the query language we only touched briefly here.
- **Instrument your own services.** Point any OpenTelemetry SDK at `http://localhost:4317` (gRPC) or `http://localhost:4318` (HTTP) and your services join the same service map and trace views. See the [instrumentation examples](https://github.com/opensearch-project/observability-stack/tree/main/examples).
- **Watch for more in this series.** Upcoming posts will take a detailed look at each feature in the stack: PPL queries, the service map, trace analytics, AI-agent observability, and more, so you can get the most out of the platform.

Learn more in the [OpenSearch Observability Stack documentation](https://github.com/opensearch-project/observability-stack#readme).
