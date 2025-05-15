---
layout: post
title: Redline testing now available in OpenSearch Benchmark
authors: Michael Oviedo
date: 2025-04-24 12:30:00 -0600
categories:
  - technical-posts
meta_keywords: OpenSearch Benchmark, OpenSearch Benchmark, workloads, redline testing
meta_description: Learn how the new redline testing feature in OpenSearch Benchmark helps you automatically determine the maximum throughput your cluster can handle—no guesswork required.
---

# Redline testing now available in OpenSearch Benchmark

**Automatically determine your OpenSearch cluster’s throughput limits—no guesswork required**

“How much traffic can my cluster really handle?” is a question many OpenSearch users face before moving to production. Until now, finding your cluster’s **redline**—the point beyond which it can no longer maintain acceptable service levels—required trial and error, guesswork, or time-consuming manual tuning.

With redline testing in OpenSearch Benchmark , you can now dynamically scale client load based on real-time cluster performance to automatically identify your cluster’s throughput ceiling.


## The challenge of guessing thresholds

OpenSearch Benchmark recently introduced support for ramping up clients and throughput during a benchmark run. However, users still needed to perform the following actions when benchmarking:

- Estimate what amount of load would break the cluster.  
- Manually watch for failures in logs or dashboards.  
- Rerun benchmarks with different parameters.  

These time-consuming tasks made it difficult to pinpoint the maximum sustainable throughput.

## What we built: Redline testing

Redline testing automates the following:

- A **Feedback Actor** to monitor request failures in real time  
- A **self-adjusting load mechanism** to pause or unpause clients based on observed behavior  

This enables OpenSearch Benchmark to perform following actions:

- Ramp up active clients  
- Detect when failures begin  
- Scale back automatically, wait for recovery, and resume testing  

The result: OpenSearch Benchmark can now determine your cluster’s redline in a single test run.

## How it works

The following diagram provides a high-level overview of the actor-based execution flow in OpenSearch Benchmark. It illustrates how benchmark tasks are allocated and executed across multiple worker actors, each of which manages a group of clients responsible for sending requests to a target OpenSearch cluster, using the following components:

- **BenchmarkActor**: Initiates the benchmarking process.  
- **WorkerCoordinatorActor**: Manages worker lifecycle and task distribution using an allocation matrix from the **Allocator**.  
- **Workers (Worker1 through WorkerN)**: Execute tasks by managing clients via the **AsyncIoAdapter**.  
- **Clients (Client1 through ClientN)**: Uses the `AsyncExecutor` class to perform operations against the target host in parallel.  

![Flowchart for OpenSearch Benchmark's actor system](/assets/media/blog-images/2025-04-24-Redline-Testing-Comes-to-OpenSearch-Benchmark/OpenSearch Benchmark-system-architecture.jpg){: .img-fluid}

OpenSearch Benchmark uses the **Actor Model**, which structures concurrent, distributed systems around isolated, message-passing components.

Each actor performs the following actions:

- Maintains private, isolated state  
- Processes messages sequentially  
- Can create other actors  
- Communicates asynchronously  

By default, OpenSearch Benchmark spawns `n` worker actors (one per CPU core), distributing clients evenly across them. For example, with 10 workers and 20 clients, each manages 2 clients.
 

### Timed mode and redline logic

OpenSearch Benchmark supports the following two modes for redline testing:

- **Iteration mode**: Runs tasks for a fixed number of iterations  
- **Timed mode**: Runs tasks for a fixed duration  

Redline testing uses timed mode to perform the following actions:

1. Ramp up client load until errors occur  
2. Scale down in response to failures  
3. Wait for recovery and ramp up again  

### Feedback Actor and shared state

Failures are sent to the **Feedback Actor** via a shared queue. A shared dictionary manages the client state:

```json
{
  "worker-1": { "client-0": true, "client-1": false }
}
```

The following settings reflect these client states: 

- `true` = active  
- `false` = paused  

This state is shared using Python’s `multiprocessing` module. Each client checks the dictionary before sending a request—paused clients skip execution.

For more technical details, see the [RFC on redline testing](https://github.com/opensearch-project/opensearch-benchmark/issues/785#issue-2898221524).

## Getting started with redline testing

Getting started with redline testing begins with a timed test procedure that defines the duration, target throughput, and number of clients. Once configured, you can run the benchmark with a single command—and optionally customize the maximum number of clients to match your cluster’s capacity.

Create a timed test procedure using the following settings:

```json
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

Then run the benchmark test with the following command:

```bash
opensearch-benchmark execute-test \
  --pipeline=benchmark-only \
  --target-hosts=<your-opensearch-cluster> \
  --workload=<workload> \
  --test-procedure=<your-timed-mode-test-procedure> \
  --redline-test
```

To override the default max clients (1000), add a number to the `--redline-test` flag, similar to the following example:

```bash
--redline-test=1500
```

Users can customize redline test parameters such as the maximum number of clients, the client ramp-up rate, the percentage of clients to pause during back-off, and the wait time before resuming scale-up.

OpenSearch Benchmark captures the following log information:
- During the test:
  - The current number of clients.
  - The pause/unpause events.
  - The reasons for scaling back
- After the test:
  - The maximim number of clients reached
  - Any performance metrics


The following chart shows how redline testing in OpenSearch Benchmark incrementally increases client load during a timed test. Each step represents a controlled ramp-up, allowing the system to observe when performance begins to degrade. In this example image, throughput steadily rises until it plateaus—indicating the cluster’s redline has been reached. This automated feedback loop removes guesswork and enables precise load testing in a single run.


![Latency over time](/assets/media/blog-images/2025-04-24-Redline-Testing-Comes-to-OpenSearch-Benchmark/dashboards-latency-over-time.png){: .img-fluid}

## What’s next?

Upcoming improvements to redline testing might include:

- Smarter ramp-up strategies, such as binary or exponential search.  
- Scaling based on latency or service time, not just request failures.  

Redline testing is available now in OpenSearch Benchmark. Try it out and share your feedback by making a [GitHub issue](https://github.com/opensearch-project/OpenSearch-Benchmark/issues)!
