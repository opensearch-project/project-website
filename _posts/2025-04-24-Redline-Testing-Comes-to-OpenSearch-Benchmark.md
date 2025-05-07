---
layout: post
title:  Redline Testing Comes to OpenSearch Benchmark
authors: Michael Oviedo
date: 2025-04-24 12:30:00 -0600
categories:
  - community
categories:
  - technical-posts
meta_keywords: OpenSearch Benchmark, OSB, workloads
meta_description: OpenSearch Benchmark has come a long way and there is so much more ahead.
---

# Redline Testing Comes to OpenSearch Benchmark

**Automatically Discover Your OpenSearch Clusters’ Limits with Zero Guesswork**

“How much traffic can my cluster really handle?” is a question many of us have asked before using an OpenSearch cluster in production. Until now, answering that question required trial and error, guesswork, or a lot of manual tuning.

With a new redline testing feature, OpenSearch Benchmark (OSB) can now dynamically scale client load based on real-time cluster performance, giving you a precise view of your cluster’s true limits—automatically.

## Why Redline Testing?

OSB recently began supporting the ramp-up of clients and throughput during a benchmark run. But users still needed to:

- Guess what load would break their cluster  
- Watch logs or dashboards to catch failures manually  
- Rerun benchmarks with different configurations  

All of which made discovering the maximum sustainable throughput slow and imprecise.

## What We Built

To automate this process, we introduced:

- A new **Feedback Actor** that monitors real-time request failures  
- A **self-adjusting load mechanism** that pauses/unpauses clients based on cluster behavior  

This allows OSB to:

- Ramp up the number of active clients  
- Detect when request failures begin  
- Scale back automatically, wait for recovery, then resume testing  

The result: OSB can now find your cluster’s redline in a single test run.

## How It Works (Technical Deep Dive)
![Flowchart for OpenSearch Benchmark's actor system](/assets/media/blog-images/2025-04-24-Redline-Testing-Comes-to-OpenSearch-Benchmark/OSB-system-architecture.jpg){: .img-fluid}

OpenSearch Benchmark uses the **Actor Model**, a conceptual framework for building concurrent and distributed systems using message-passing instead of shared memory.

Each actor:

- Has private, isolated state  
- Processes messages sequentially  
- Can create other actors  
- Sends asynchronous messages to others  

By default, OSB spawns `n` worker actors (one per CPU core on the machine where OSB is running), distributing clients evenly across them. For example, with 10 workers and 20 clients, each worker manages 2 clients.

**Key components:**

- **Clients**: Perform indexing and send search requests  
- **Workers**: Manage their assigned clients  
- **WorkerCoordinatorActor**: Manages workers and aggregates client metadata  

### Timed Mode and Redline Logic

OSB can run in two modes:

- **Iteration mode**: Fixed number of iterations per task  
- **Timed mode**: Tasks run for a fixed duration  

Redline testing uses **timed mode**. While running a timed test procedure:

1. OSB ramps up clients until request errors occur  
2. Upon detecting errors, it scales down clients  
3. Waits for recovery, then attempts another ramp-up  

### Feedback Actor and Shared State

Failed requests are pushed to the **Feedback Actor** via a shared queue. It manages client activity using a shared dictionary:
```
{
  "worker-1": { "client-0": true, "client-1": false }
}
```
- `true` → client is active  
- `false` → client is paused  

This dictionary is shared using Python’s `multiprocessing` module for safe inter-process communication. Clients consult it before sending requests—paused clients skip their turn.

For deeper technical insights, see the ([RFC on redline testing](https://github.com/opensearch-project/opensearch-benchmark/issues/785#issue-2898221524)).

## How to Use It

Create a timed test procedure:
```
{
  "name": "timed-mode-test-procedure",
  "schedule": [
    {
      "operation": "keyword-terms",
      "warmup-time-period": {{ warmup_time | default(300) | tojson }},
      "time-period": {{ time_period | default(900) | tojson }},
      "target-throughput": {{ target_throughput | default(20) | tojson }},
      "clients": {{ search_clients | default(20) }}
    }
  ]
}
```
Then run:
```
opensearch-benchmark execute-test \
  --pipeline=benchmark-only \
  --target-hosts=<your-opensearch-cluster> \
  --workload=<workload> \
  --test-procedure=<your-timed-mode-test-procedure> \
  --redline-test
```
To override the default (1000) max clients, you can attach an integer to the `--redline-test` flag. Let's say you wanted to use 1500 clients:

`--redline-test=1500`

This is useful in the case where your cluster is able to handle the default number of 1000 clients for the task(s) you provide.

After execution, OSB will log:

- The maximum number of stable clients  
- All pause/unpause actions  
- Reasoning for scaling back  
- Performance metrics: throughput, latency, service time

Here's how your clusters' latency might look during the test:
![Screenshot showing a clusters' latency increasing in steps over time](/assets/media/blog-images/2025-04-24-Redline-Testing-Comes-to-OpenSearch-Benchmark/dashboards-latency-over-time.png){: .img-fluid}

## What’s Next?

Future enhancements may include:

- Smarter ramp-up algorithms (e.g., binary search, exponential)  
- Reacting to metrics like latency and service time—not just request failure  

Redline testing is available now in OpenSearch Benchmark.

Give it a try, and feel free to [file an issue](https://github.com/opensearch-project/OpenSearch-Benchmark/issues) with feedback or ideas!
