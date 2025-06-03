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

**Automatically determine your OpenSearch cluster's throughput limits—no guesswork required**

"How much traffic can my cluster really handle?" is a question many OpenSearch users face before moving to production. Until now, finding your cluster's **redline**—the point beyond which it can no longer maintain acceptable service levels—required trial and error, guesswork, or time-consuming manual tuning.

With redline testing in OpenSearch Benchmark, you can now dynamically scale client load based on real-time cluster performance to automatically identify your cluster's throughput ceiling.


## The challenge of guessing thresholds

OpenSearch Benchmark recently introduced support for ramping up clients and throughput during a benchmark run. However, users still needed to perform the following actions when benchmarking:

- Estimate what amount of load would break the cluster.
- Convert the estimate to the appropriate number of client threads and the desired target throughput.
- Manually watch for failures in the OSB logs or cluster dashboards.
- Raise the estimate if failures did not materialize, lower it if a sufficient number of errors were encountered
- Iterate until the breaking point and maximum steady state workload intensities are identified 

These time-consuming tasks made it difficult to pinpoint the maximum sustainable throughput.

## What we built: Redline testing

Redline testing automates the following:

- A control module to monitor request throughput and failures in real time
- A **self-adjusting load mechanism** to pause or unpause clients based on observed behavior  

This enables OpenSearch Benchmark to perform the following actions:

- Ramp up active clients  
- Detect when failures begin  
- Scale back automatically, wait for recovery, and resume testing  

The result: OpenSearch Benchmark can now determine your cluster's redline point in a single test run.

## How it works

The following diagram provides a high-level overview of the actor-based execution flow in OpenSearch Benchmark. It illustrates how benchmark tasks are allocated and executed across multiple worker actors, each of which manages a group of clients responsible for sending requests to a target OpenSearch cluster, using the following components:

![Flowchart for OpenSearch Benchmark's actor system](/assets/media/blog-images/2025-04-24-Redline-Testing-Comes-to-OpenSearch-Benchmark/OpenSearch Benchmark-system-architecture.jpg){: .img-fluid}

OpenSearch Benchmark uses the **Actor Model**, which structures concurrent, distributed systems around isolated, message-passing components.

Normally, OpenSearch Benchmark starts with a fixed number of 'clients' that all send requests at the same rate throughout a test.
With this feature, the tool can automatically ramp that number up or down as the test runs. It can add more clients when it needs to push harder, or pull clients back when it needs to ease off.

This lets you see how your OpenSearch cluster behaves under changing pressure, rather than at just one fixed load, and provides a more realistic, flexible benchmark that can mimic real-world traffic patterns.

### Timed mode and redline logic

OpenSearch Benchmark supports the following two modes for redline testing:

- **Iteration mode**: Runs tasks for a fixed number of iterations  
- **Timed mode**: Runs tasks for a fixed duration  

Redline testing operates only in the timed mode. It performs the following actions:

1. Ramp up client load until errors occur.
2. Scale down in response to failures.
3. Wait for recovery and ramp up again.

### How the Feedback Component Manages Clients

A special “feedback” actor watches for errors as the test runs. It keeps a simple list of every worker and their clients, marking each one as either “running” or “paused.”

When everything is healthy, clients stay “running” and keep sending requests.

If failures start piling up, the feedback component can “pause” individual clients to give the system a breather.

Once things stabilize, those paused clients are switched back to “running.”

This lets the benchmark automatically throttle back parts of the load when problems occur—and ramp them up again when things recover—so you get a more realistic picture of how your cluster handles hiccups.

For more technical details, see the [RFC on redline testing](https://github.com/opensearch-project/opensearch-benchmark/issues/785#issue-2898221524).

## How to run a workload in redline testing mode

Getting started with redline testing begins with creating a timed test procedure that defines the duration, target throughput, and number of clients. Once configured, you can run the benchmark with a single command—and optionally customize the maximum number of clients to match your cluster's capacity.

Create a timed test procedure using settings similar to the following:

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

You can modify the default parameter values as you see appropriate. 
Documentation about the parameters is available at our [documentation website](https://docs.opensearch.org/docs/latest/benchmark/)

Once you have a test procedure ready, you can run the benchmark test with the following command:

```bash
opensearch-benchmark execute-test \
  --pipeline=benchmark-only \
  --target-hosts=<your-opensearch-cluster> \
  --workload=<workload> \
  --test-procedure=<your-timed-mode-test-procedure> \
  --redline-test
```

Users can customize redline test parameters—such as the maximum number of clients, the client ramp-up rate, the percentage of clients to pause during back-off, and the wait time before resuming scale-up—using the following flags:


`--redline-scale-step`: Specifies the number of clients to unpause in each scaling iteration (integer value).
`--redline-scaledown-percentage`: Specifies the percentage of clients to pause when an error occurs (float value).
- `--redline-post-scaledown-sleep`: Specifies the number of seconds the feedback actor waits before initiating a scale-up after scaling down (integer value).
- `--redline-max-clients`: Specifies the maximum number of clients allowed during redline testing. If unset, OpenSearch Benchmark defaults to the number of clients defined in the test procedure (integer value).

OpenSearch Benchmark captures the following log information:
- During the test:
  - The current number of clients
  - The pause/unpause events
  - The reasons for scaling back
- After the test:
  - The maximum number of clients reached
  - A summary of test result metrics like service time, throughput, latency, and more.


The following chart shows how redline testing in OpenSearch Benchmark incrementally increases client load during a timed test. Each step represents a controlled ramp-up, allowing the system to observe when performance begins to degrade. In this example image, throughput steadily rises until it plateaus—indicating that the cluster's redline has been reached. This automated feedback loop removes guesswork and enables precise load testing in a single run.


![Latency over time](/assets/media/blog-images/2025-04-24-Redline-Testing-Comes-to-OpenSearch-Benchmark/dashboards-latency-over-time.png){: .img-fluid}

## What's next?

Upcoming improvements to redline testing may include:

- Smarter ramp-up strategies, such as binary or exponential search.  
- Scaling based on latency or service time, not just request failures.  

Redline testing is available now in OpenSearch Benchmark. We hope you find it useful and look forward to your feedback in the [OpenSearch forum](https://forum.opensearch.org/) or at the OpenSearch Benchmark [community meetup](https://www.meetup.com/opensearch/events/307446531/?eventOrigin=group_upcoming_events)!
