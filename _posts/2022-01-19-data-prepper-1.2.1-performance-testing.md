---
layout: post
title:  "Data Prepper 1.2.1 Performance Testing"
authors:
  - Steven Bayer
date: 2022-01-19
categories:
  - technical-post

excerpt: "Celebrating of the release of Data Prepper 1.2.1, we are adding a suite of open-source performance tests for everyone to measure performance and tune configurations for maximum log ingestion throughput. Our goals in building a performance test suite are to create simulations of real-world scenarios used in any environment while maintaining compatibility with popular log ingestion applications."

---

Celebrating of the release of Data Prepper 1.2.1, we are adding a suite of open-source performance tests for everyone to measure performance and tune configurations for maximum log ingestion throughput. Our goals in building a performance test suite are to create simulations of real-world scenarios used in any environment while maintaining compatibility with popular log ingestion applications. In all performance testing environments and configurations are identical, except where the same option is not available for all applications, see testing limitations section for explicit details.

# TL;DR Data Prepper 1.2.1 vs Logstash 7.13.2 Results
- Data Prepper 1.2.1 has 88% better sustained throughput than Logstash 7.13.2
- Data Prepper 1.2.1 has 46% lower mean response latency than Logstash 7.13.2

![Throughput Graph](/assets/media/blog-images/2022-01-19-data-prepper-1.2.1-performance-testing/Graph-Throughput.png){: .img-fluid}

Throughout the test, Data Prepper can maintain a higher throughput more consistently.

![Response Time Graph](/assets/media/blog-images/2022-01-19-data-prepper-1.2.1-performance-testing/Graph-Response-Time.png){: .img-fluid}

Logstash hit peak latency of 7382ms
Data Prepper’s peak latency was 5276ms

|                      | Data Prepper 1.2.1 | Logstash 7.13.2 |
| :------------------- | -----------------: | --------------: |
| Mean Logs / Second   |             37,849 |          20,104 |
| Mean Response (ms)   |                 53 |              99 |
| Total Logs Processed |         68,166,000 |      36,206,800 |

Data Prepper 1.2.1 increased the total number of logs processed by 88% compared to Logstash 7.13.2 within the 30-minute test limit.

# Performance testing setup

## Data Prepper Environment

![Data Prepper Environment](/assets/media/blog-images/2022-01-19-data-prepper-1.2.1-performance-testing/Data-Prepper.png){: .img-fluid}

## Logstash Environment

![Logstash Environment](/assets/media/blog-images/2022-01-19-data-prepper-1.2.1-performance-testing/Logstash.png){: .img-fluid}

Let’s compare the performance of the latest release of Data Prepper 1.2.1 against Logstash 7.13.2. We measured the latencies and throughputs of 10 clients sending requests of 200 logs each as frequently as possible over a duration of 30 minutes.

## Application Configurations

| Property             | Data Prepper | Logstash |
| -------------------- | -----------: | -------: |
| HTTP Source Thread   |            4 |        4 |
| Max Connection Count |        2,000 |    n/a * |
| Request Timeout      |       10,000 |    n/a * |
| Buffer Size          |    2,000,000 |    n/a * |
| Batch Size           |        5,000 |    5,000 |
| Worker Thread        |           12 |       12 |
| SSL                  |     Disabled | Disabled |

_[*] Note, Max Connection Count, Request Timeout, Buffer Size are not configurable with Logstash 7.13.2_

## Logstash Limitations
Logstash lacks several configuration properties available in Data Prepper needed to tune performance. After tuning the thread counts and batch size, we managed to achieve a maximum sustained throughput of 20,000 logs per second.

## Limitation of the Testing
It’s important to note that Data Prepper 1.2.1 and Logstash 7.13.2 support different feature sets, and our performance test suite is targeted at common functionality. As Data Prepper and our test suite grow in complexity, we are excited about what we might learn.

## Candidates for future performance testing scenarios and improvements

![Environment Reference](/assets/media/blog-images/2022-01-19-data-prepper-1.2.1-performance-testing/Environment-Reference.png){: .img-fluid}

In a real-world deployment, as the Ingestion system’s response time increases, pressure applies to the Source system while the Sink may be underutilized. A scenario where we would expect to observe this is, the source is producing 1000 logs/second, the ingestion system receives a request for 1000 log and response with a latency of 2 seconds, now the source has 2000 logs queued. If the sink has a capacity to accept 5000 logs/second, we quickly realize the ingestions system is under provisioned. In this scenario, measuring log ingestion throughput and backpressure could better represent expected performance.

More testing is needed with various hardware configurations to understand the relationships with CPU count, memory, buffer capacity, thread count, cluster size, and ingestion throughput.

### Hardware based scenario proposals
| vCPU | Memory (GiB) | Buffer Capacity | Thread Count | Cluster Size |
| ---: | -----------: | --------------: | -----------: | -----------: |
|    2 |            4 |       2,000,000 |            2 |            1 |
|    2 |            4 |       2,000,000 |            4 |            1 |
|    2 |            4 |       2,000,000 |            2 |            3 |
|    2 |            4 |       2,000,000 |            2 |            5 |
|    2 |            8 |       4,000,000 |            4 |            1 |
|    4 |           16 |       8,000,000 |           12 |            1 |
|    4 |           16 |       8,000,000 |           12 |            3 |
|    8 |           16 |       8,000,000 |           24 |            1 |
|    8 |           32 |      16,000,000 |           24 |            1 |

The scope of our initial performance testing scenarios was focused on a common scenario, http source, grok processor, OpenSearch sink. As new features are added to Data Prepper in upcoming releases, we plan to add matching performance testing simulations for core functionality.

# Running Data Prepper Performance tests
Performance suite source code is available on [GitHub](https://github.com/sbayer55/gatling-tests/). To run the full test suite execute `./gradlew –rerun-tasks gatlingRun -Dhost=<target url>`. After all tests have completed HTML reports will be created in `./build/reports/gatling/<simulation-name>-<unix-timestamp>/index.html`. Further instructions on running performance tests and Gatling are available in the repository readme.

For more information on Gatling checkout their [website](https://gatling.io/).

Table [1] - AWS Environment Details
| Name                              | EC2 Instance Type | Instance Count | vCPU | Memory (GiB) | JVM Memory Limit (GiB) |
| :-------------------------------- | :---------------- | -------------: | ---: | -----------: | ---------------------: |
| Data Prepper                      | m5.xlarge         |              1 |    4 |           16 |                      4 |
| Data Prepper Prometheus + Grafana | m5.xlarge         |              1 |    4 |           16 |                        |
| Data Prepper OpenSearch Cluster   | i3.xlarge         |              3 |    4 |         30.5 |                        |
| Logstash                          | m5.xlarge         |              1 |    4 |           16 |                      4 |
| Logstash Prometheus + Grafana     | m5.xlarge         |              1 |    4 |           16 |                        |
| Logstash OpenSearch Cluster       | i3.xlarge         |              3 |    4 |         30.5 |                        |
| Gatling                           | m5.2xlarge        |              1 |    8 |           32 |                        |
