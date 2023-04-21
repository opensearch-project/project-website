---
layout: post
title:  "Improving JSON parsing performance in opensearch-java"
authors:
  - chibenwa
date:   2023-04-10
categories:
  - technical-post
meta_keywords: OpenSearch, Apache James, Flame graph, Performance, Driver
meta_description: Learn how contributors of Apache James found out and fixed major performance problems in OpenSearch Java driver JSON parsing.
---

As an open source enthusiast, I believe in the power of collaboration to make open source projects faster and more efficient. In this blog post, I will share how my team at [Linagora](https://linagora.com), contributing to the [Apache James](https://james.apache.org) project, identified and addressed a performance issue in the OpenSearch java client using benchmark tools and flamegraphs, and collaborated with the OpenSearch community.

[Apache James](https://james.apache.org), a.k.a. Java Apache Mail Enterprise Server, is an open source email server written in Java. It implements common email protocols like SMTP, IMAP or [JMAP](https://jmap.io). Apache James is easy to customize with a wide range of extension mechanisms. It is even easy to use as a toolbox to assemble your own email server! Apache James proposes an innovative architecture for email servers: James is stateless and relies on NoSQL databases and message brokers for state management. Thus administrating James is as easy as managing any modern web application: no sharding and no protocol-aware load balancing. Apache James uses OpenSearch for search-related features in the distributed mail server setup. 

When operating an email server, performance is a concern, as email is a massively used application, generally considered critical. Often with even a medium-sized deployment, handling over 1000 requests per seconds is not uncommon. We use a range of tools for benchmarking the performance of Apache James. Our docs [explain](https://github.com/apache/james-project/blob/master/server/apps/distributed-app/docs/modules/ROOT/pages/benchmark/index.adoc) some of the benchmarks we suggest our administrators run to identify performance bottlenecks and malfunctions in their clusters.

Apache James relies on OpenSearch as its search engine for its email database. It takes as a dependency the [opensearch-java client](https://github.com/opensearch-project/opensearch-java). We frequently run performance tests with custom [Gatling](https://gatling.io/) benchmarks. We specifically wanted to regression test performance when we migrated from ElasticSearch 7.10 to OpenSearch for licenses reasons (as an Apache project, we must use licenses compatible with the Apache License 2.0). We realized the OpenSearch requests were slower and started investigating why.

### Identifying the performance issue

Flamegraphs are powerful visualization tools that can help developers analyze the execution flow of their code and identify bottlenecks. By analyzing the flamegraphs, I was able to identify specific areas of code that were causing the performance issue. We used async-profiler to generate a flamegraph and found that frequent SPI lookups were causing the performance issue.

[opensearch_2.4.0.zip](https://github.com/opensearch-project/opensearch-java/files/10334079/opensearch_2.4.0.zip) is the flame graph we diagnosed this issue from. It was taken with <https://github.com/jvm-profiling-tools/async-profiler>  from within Apache James container):

`./profiler -d 120 -e itimer -f opensearch_2.4.0.html 1`


<img src="/assets/media/blog-images/2023-04-10-opensource-perf/flame1.png" alt="Flame graph general overview"/>{: .img-fluid }


Then searching for `"opensearch"` using the search widget in the top left corner of the flamegraph:

<img src="/assets/media/blog-images/2023-04-10-opensource-perf/flame2.png" alt="Flame graph: OpenSearch driver threads"/>{: .img-fluid }

-   the driver thread (on the right) with the httpclient event loop
-   Apache James calls to the OpenSearch driver (small stacktraces in the center)

Observations on the driver event loop:

-   We spend a huge amount of resources doing SPI calls in order to locate the JSON parser implementation. It not only eats CPU/heap allocations but it also blocks the HTTP event loop, which can be catastrophic (the James app is not OpenSearch heavy so that is not a big issue to me).
-   Unsurprisingly JSON parsing takes 11% of the driver's CPU and 24% of heap allocation.
-   Event loop busyness (pushing stuff to the kernel network stack, SSL) takes around 60% of the event loop CPU, 25% of heap allocations, which again feels normal to me.
-   2.3% of the event loop CPU is our binding to Reactor reactive library, which, again is normal: converting futures and enqueuing tasks takes time.

To mitigate calls to the SPI, we submitted a [change](https://github.com/opensearch-project/opensearch-java/pull/293) to [JsonValueParser.java](https://github.com/opensearch-project/opensearch-java/blob/a8df7e7c26ccc644811539c4fea57d97f1031aaa/java-client/src/main/java/org/opensearch/client/json/jackson/JsonValueParser.java#L52) that addressed the issue. This led to a 50x speedup of the JSON parsing by getting rid of the SPI lookups, not even taking into account the blocking operations... Huge win!

As a common practice we then run micro-benchmarks to validate changes, and [JMH](https://github.com/openjdk/jmh) comes in handy for this! It summarizes key metrics, performs warmup, repeats measurements and comes with nano-second resolution!

Here is the JMH output backing this change:

#### Before

```
Benchmark                Mode  Cnt   Score   Error  Units
JMHFieldBench.jsonBench  avgt    5  71.790 ± 2.125  us/op
```

#### After

```
Benchmark                Mode  Cnt  Score   Error  Units
JMHFieldBench.jsonBench  avgt    5  1.418 ± 0.024  us/op
```

#### Code of the benchmark

```
package org.apache.james.backends.opensearch;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import org.apache.james.backends.opensearch.json.jackson.JacksonJsonpParser;
import org.junit.Test;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.infra.Blackhole;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.options.Options;
import org.openjdk.jmh.runner.options.OptionsBuilder;
import org.openjdk.jmh.runner.options.TimeValue;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.ObjectMapper;

public class JMHFieldBench {
    public static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    public void launchBenchmark() throws Exception {
        Options opt = new OptionsBuilder()
            .include(this.getClass().getName() + ".*")
            .mode (Mode.AverageTime)
            .timeUnit(TimeUnit.MICROSECONDS)
            .warmupTime(TimeValue.seconds(5))
            .warmupIterations(3)
            .measurementTime(TimeValue.seconds(2))
            .measurementIterations(5)
            .threads(1)
            .forks(1)
            .shouldFailOnError(true)
            .shouldDoGC(true)
            .build();
        new Runner(opt).run();
    }

    @Benchmark
    public void jsonBench(Blackhole bh) throws IOException {
        final JsonParser parser = OBJECT_MAPPER.createParser("[\"a\",\"b\"]");
        try {
            bh.consume(new JacksonJsonpParser(parser).getArrayStream());
        } catch (Exception e) {
            // do nothing
        } finally {
            parser.close();
        }
    }
}
```

The bench was applied before/after the backport of this PR on top of Apache James CF [apache/james-project@d5af3a5](https://github.com/apache/james-project/commit/d5af3a52cd30eebf7a8fb4d8f2402920c42d5f7c)

### Collaborating with the OpenSearch community

I believe open source projects are more than just code--they're communities of people who share a common goal of making technology more accessible and efficient. By collaborating with the OpenSearch community, I contributed to this goal by getting rid of SPI lookups and improving JSON parsing performance in an application that is probably running on countless servers. Working together, we made OpenSearch faster and more efficient. It's rewarding to make a positive impact on both technology and the community of people who use it. This case study shows how collaboration and community involvement can make open source technology better for everyone.
