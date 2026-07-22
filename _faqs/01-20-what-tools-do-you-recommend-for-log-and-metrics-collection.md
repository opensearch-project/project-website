---
question: What tools do you recommend for log and metrics collection?
category: General
---

OpenSearch is supported by a range of tools like Beats, Fluentd, Fluent Bit, and OpenTelemetry Collector. Moving forward, we will focus effort on improving Data Prepper, Fluentd, and FluentBit. Users who are using Beats <= 7.12.x as an agent tool, and considering open source alternatives, should migrate to Fluent Bit >= 1.9 or Open Telemetry Collector. Beats version >= 7.13 does not support OpenSearch. 