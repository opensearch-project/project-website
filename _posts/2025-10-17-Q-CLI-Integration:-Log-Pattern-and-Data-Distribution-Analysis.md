---
layout: post
title: "Amazon Q CLI integration: Log pattern and data distribution analysis"
authors:
  - ihailong
  - jiaruj
date: 2025-10-17
categories:
  - technical-posts
meta_keywords: Amazon Q CLI, CLI integration, log pattern analysis, data distribution analysis, OpenSearch CLI, command line interface, log analysis tools, data distribution tools, OpenSearch integration, diagnostic tools, MCP, Agent, Agentic AI, OpenTelemetry
meta_description: Learn how to integrate Amazon Q CLI with OpenSearch's log pattern analysis and data distribution tools for streamlined command-line diagnostics and enhanced system troubleshooting capabilities.
---

Modern distributed systems generate vast amounts of log data that can be challenging to analyze manually. In this blog, we'll explore how you can integrate Amazon Q CLI with OpenSearch's advanced analysis tools to transform complex log investigations into natural language queries. We'll demonstrate the integration of two powerful OpenSearch agent tools---the Log Pattern Analysis Tool and Data Distribution Tool---through the Model Context Protocol (MCP), showing how this combination enables streamlined command-line diagnostics and enhanced system troubleshooting.

Through a real-world OpenTelemetry Demo scenario investigating payment failures, you'll learn how to set up the integration, configure the necessary components, and use these tools to perform automated pattern recognition and statistical analysis. By the end of this post, you'll understand how to use conversational commands to quickly identify root causes in distributed system logs, significantly reducing time to resolution for critical issues.

## Log Pattern Analysis tool

The [Log Pattern Analysis Tool](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/tools/log-pattern-analysis-tool/) is an OpenSearch agent tool that automates log analysis through multiple analysis modes. It performs differential pattern analysis between baseline and problem periods and analyzes log sequences using trace correlation. The tool provides log insights by automatically extracting error patterns and keywords from log data to accelerate troubleshooting.

## Data Distribution tool

The [Data Distribution Tool](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/tools/data-distribution-tool/) is an OpenSearch agent tool that analyzes data distribution patterns within datasets and compares distributions between different time periods. It supports both single dataset analysis and comparative analysis to identify significant changes in field value distributions, helping detect anomalies, trends, and data quality issues.

The tool generates statistical summaries including value frequencies, percentiles, and distribution metrics to help understand data characteristics and identify potential data quality issues.

## Amazon Q CLI integration

Amazon Q CLI can seamlessly integrate with these OpenSearch analysis tools through the [Model Context Protocol (MCP)](https://opensearch.org/blog/introducing-mcp-in-opensearch/). By configuring the OpenSearch MCP server, you can access both the Log Pattern Analysis Tool and Data Distribution Tool directly from your command line interface.

This integration enables natural language queries for log analysis and data distribution insights, making complex diagnostic tasks accessible through simple conversational commands.

### Implementation using opensearch-mcp-server-py

This integration is built on the [opensearch-mcp-server-py](https://github.com/opensearch-project/opensearch-mcp-server-py) project, which provides a Python-based MCP server for OpenSearch. To enable the Log Pattern Analysis Tool and Data Distribution Tool integration, you need to clone this project and add custom integration code for both tools. This extends the server's capabilities to support these advanced analysis features.

### Complete integration workflow

To set up Amazon Q CLI with OpenSearch MCP integration, follow these steps:

1. **Clone the MCP server repository**:

   ```bash
   git clone https://github.com/opensearch-project/opensearch-mcp-server-py.git
   cd opensearch-mcp-server-py
   ```

2. **Add tool integration code**:
   - Implement Log Pattern Analysis tool integration in the MCP server
   - Implement Data Distribution tool integration in the MCP server
   - Register both tools with the MCP server's tool registry
   - For a complete implementation example, see the demo at [opensearch-mcp-server-py/integrate-skill-tool](https://github.com/PauiC/opensearch-mcp-server-py/tree/integrate-skill-tool)

3. **Start the MCP server**:

   ```bash
   OPENSEARCH_URL="<your-opensearch-cluster-endpoint>" \
   OPENSEARCH_USERNAME="<your-opensearch-username>" \
   OPENSEARCH_PASSWORD="<your-opensearch-password>" \
   python -m src.mcp_server_opensearch --transport stream --host 0.0.0.0 --port 9900
   ```
   
   This command starts the MCP server on localhost:9900. When using this configuration, set the `url` field in your configuration file to `"http://localhost:9900/mcp"`.

4. **Configure Amazon Q CLI**:
   - Open your Amazon Q CLI configuration file.
   - Add the [MCP server configuration](#mcp-configuration-example).

5. **Submit natural language queries**:
   - Launch Amazon Q CLI.
   - Query your OpenSearch data using conversational commands.

### MCP configuration example

To configure the OpenSearch MCP server for Amazon Q CLI, add the following configuration:

```json
{
  "mcpServers": {
    "opensearch-mcp-server": {
      "type": "http",
      "url": "<your-mcp-server-url>",
      "env": {
        "OPENSEARCH_URL": "<your-opensearch-cluster-endpoint>",
        "OPENSEARCH_USERNAME": "<your-opensearch-username>",
        "OPENSEARCH_PASSWORD": "<your-opensearch-password>"
      }
    }
  }
}
```

**Configuration notes**:
- `url`: Specify your MCP server URL (for example, `http://localhost:9900/mcp`).
- `OPENSEARCH_URL`: Specify your OpenSearch cluster endpoint.
- `OPENSEARCH_PASSWORD`: Specify your OpenSearch password.
- `OPENSEARCH_USERNAME`: Specify your OpenSearch username.

## Real-world example: OpenTelemetry demo

To demonstrate the practical application of these integrated tools, we'll use the OpenTelemetry Demo as our example scenario.

OpenTelemetry is an observability framework that provides a collection of tools, APIs, and SDKs for generating, collecting, and exporting telemetry data (metrics, logs, and traces) from applications. The OpenTelemetry Demo simulates a realistic e-commerce platform with multiple microservices including cart service, checkout service, payment service, and recommendation engine.

In this environment, common issues arise such as payment processing failures, cart abandonment errors, recommendation service timeouts, and checkout workflow disruptions. This provides excellent opportunities for root cause analysis in a distributed system environment.

### Investigating payment failures

In our scenario, users are reporting payment failures during checkout---a critical issue impacting revenue and customer experience. We choose payment failures as our root cause analysis target due to their business-critical impact.

The OpenTelemetry demo can simulate various failure conditions, including payment service disruptions and authentication issues. To resolve this issue, we need to analyze the logs to identify failure patterns and determine whether the issue is related to specific customer segments, authentication problems, or system-level configuration issues.

### Amazon Q CLI investigation process

Using Amazon Q CLI with the integrated OpenSearch tools, you can investigate this issue through natural language queries. Here's how the investigation unfolds:

**Initial query**:

```
Users are reporting payment failures during checkout process and we need to investigate the root cause by analyzing logs from the ss4o_logs* index between 2025-08-21 3 PM and 4 PM to identify patterns in checkout service failures related to card charging issues.
```

**Amazon Q CLI analysis results**:

```
I'll help you investigate the payment failures by analyzing the logs from the ss4o_logs* index during the specified time period. Let me start by examining the available indices and then analyze the checkout service failures.
> 
> 🛠️  Using tool: ListIndexTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running ListIndexTool with the param:
>  ⋮  {
>  ⋮    "include_detail": false
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 2.304s
> 
> I can see there are ss4o_logs indices available. Let me check the specific index for August 21st, 2025 and examine its structure:
> 
> 🛠️  Using tool: IndexMappingTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running IndexMappingTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs-otel-2025.08.21"
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 1.25s
> 
> Perfect! I can see this is an OpenTelemetry logs index with rich payment-related attributes like cardType, amount, lastFourDigits, transactionId, etc. Now let me analyze the checkout service failures during the specified time period (August 21st, 3-4 PM). I'll use the LogPatternAnalysisTool to identify patterns in checkout failures:
> 
> 🛠️  Using tool: LogPatternAnalysisTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running LogPatternAnalysisTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs-otel-2025.08.21",
>  ⋮    "logFieldName": "body",
>  ⋮    "selectionTimeRangeStart": "2025-08-21T15:00:00Z",
>  ⋮    "selectionTimeRangeEnd": "2025-08-21T16:00:00Z",
>  ⋮    "timeField": "time"
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 0.591s
> 
> Excellent! The log pattern analysis reveals critical insights. Now let me get more detailed information about the checkout failures by searching for specific error patterns:
> 
> 🛠️  Using tool: SearchIndexTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running SearchIndexTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs-otel-2025.08.21",
>  ⋮    "query": {
>  ⋮      "query": {
>  ⋮        "bool": {
>  ⋮          "must": [
>  ⋮            {
>  ⋮              "range": {
>  ⋮                "time": {
>  ⋮                  "gte": "2025-08-21T15:00:00Z",
>  ⋮                  "lte": "2025-08-21T16:00:00Z"
>  ⋮                }
>  ⋮              }
>  ⋮            },
>  ⋮            {
>  ⋮              "bool": {
>  ⋮                "should": [
>  ⋮                  {
>  ⋮                    "match": {
>  ⋮                      "body": "could not charge the card"
>  ⋮                    }
>  ⋮                  },
>  ⋮                  {
>  ⋮                    "match": {
>  ⋮                      "body": "Payment request failed"
>  ⋮                    }
>  ⋮                  },
>  ⋮                  {
>  ⋮                    "match": {
>  ⋮                      "body": "Invalid token"
>  ⋮                    }
>  ⋮                  }
>  ⋮                ]
>  ⋮              }
>  ⋮            }
>  ⋮          ]
>  ⋮        }
>  ⋮      },
>  ⋮      "aggs": {
>  ⋮        "service_breakdown": {
>  ⋮          "terms": {
>  ⋮            "field": "serviceName",
>  ⋮            "size": 10
>  ⋮          }
>  ⋮        },
>  ⋮        "card_type_failures": {
>  ⋮          "terms": {
>  ⋮            "field": "log.attributes.cardType",
>  ⋮            "size": 10
>  ⋮          }
>  ⋮        },
>  ⋮        "error_timeline": {
>  ⋮          "date_histogram": {
>  ⋮            "field": "time",
>  ⋮            "fixed_interval": "5m"
>  ⋮          }
>  ⋮        }
>  ⋮      },
>  ⋮      "size": 5
>  ⋮    }
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 1.24s
> 
> Now let me search for more specific payment-related information to understand the card charging issues:
> 
> 🛠️  Using tool: SearchIndexTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running SearchIndexTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs-otel-2025.08.21",
>  ⋮    "query": {
>  ⋮      "size": 10,
>  ⋮      "aggs": {
>  ⋮        "payment_errors": {
>  ⋮          "terms": {
>  ⋮            "field": "body.keyword",
>  ⋮            "size": 5
>  ⋮          }
>  ⋮        },
>  ⋮        "transaction_failures": {
>  ⋮          "terms": {
>  ⋮            "field": "log.attributes.transactionId",
>  ⋮            "size": 10
>  ⋮          }
>  ⋮        },
>  ⋮        "loyalty_levels": {
>  ⋮          "terms": {
>  ⋮            "field": "log.attributes.app@loyalty@level",
>  ⋮            "size": 5
>  ⋮          }
>  ⋮        }
>  ⋮      },
>  ⋮      "query": {
>  ⋮        "bool": {
>  ⋮          "must": [
>  ⋮            {
>  ⋮              "range": {
>  ⋮                "time": {
>  ⋮                  "lte": "2025-08-21T16:00:00Z",
>  ⋮                  "gte": "2025-08-21T15:00:00Z"
>  ⋮                }
>  ⋮              }
>  ⋮            },
>  ⋮            {
>  ⋮              "term": {
>  ⋮                "serviceName": "checkout"
>  ⋮              }
>  ⋮            },
>  ⋮            {
>  ⋮              "match": {
>  ⋮                "body": "Invalid token"
>  ⋮              }
>  ⋮            }
>  ⋮          ]
>  ⋮        }
>  ⋮      }
>  ⋮    }
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 1.24s
> 
> Let me also check for any successful transactions during this period to understand the scope of the issue:
> 
> 🛠️  Using tool: CountTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running CountTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs-otel-2025.08.21",
>  ⋮    "body": {
>  ⋮      "query": {
>  ⋮        "bool": {
>  ⋮          "must": [
>  ⋮            {
>  ⋮              "range": {
>  ⋮                "time": {
>  ⋮                  "gte": "2025-08-21T15:00:00Z",
>  ⋮                  "lte": "2025-08-21T16:00:00Z"
>  ⋮                }
>  ⋮              }
>  ⋮            },
>  ⋮            {
>  ⋮              "term": {
>  ⋮                "serviceName": "checkout"
>  ⋮              }
>  ⋮            },
>  ⋮            {
>  ⋮              "bool": {
>  ⋮                "should": [
>  ⋮                  {
>  ⋮                    "match": {
>  ⋮                      "body": "success"
>  ⋮                    }
>  ⋮                  },
>  ⋮                  {
>  ⋮                    "match": {
>  ⋮                      "body": "completed"
>  ⋮                    }
>  ⋮                  },
>  ⋮                  {
>  ⋮                    "match": {
>  ⋮                      "body": "charged successfully"
>  ⋮                    }
>  ⋮                  }
>  ⋮                ]
>  ⋮              }
>  ⋮            }
>  ⋮          ]
>  ⋮        }
>  ⋮      }
>  ⋮    }
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 0.988s
> 
> Now let me analyze the data distribution to get a comprehensive view of the failures:
> 
> 🛠️  Using tool: DataDistributionTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running DataDistributionTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs-otel-2025.08.21",
>  ⋮    "selectionTimeRangeStart": "2025-08-21T15:00:00Z",
>  ⋮    "selectionTimeRangeEnd": "2025-08-21T16:00:00Z",
>  ⋮    "timeField": "time"
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 0.584s
> 
> Based on my comprehensive analysis of the checkout service logs from August 21st, 2025 between 3-4 PM, here are the key findings regarding payment failures:
> 
> ## Root Cause Analysis Summary
> 
> ### Primary Issue: Invalid Payment Token Errors
> • **792 total payment-related failures** during the 1-hour period
> • **189 specific "Invalid token" errors** from the checkout service
> • **63 instances** of the exact pattern: "Payment request failed. Invalid token. app.loyalty.level=gold"
> 
> ### Key Patterns Identified
> 
> 1. Payment Token Validation Failure
>    • Primary error: "could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token"
>    • All failures consistently show app.loyalty.level=gold, suggesting the issue specifically affects gold-tier loyalty customers
> 
> 2. Error Distribution Timeline
>    • Peak failure periods: 15:20-15:25 (82 failures) and 15:45-15:50 (79 failures)
>    • Consistent failure rate throughout the hour (50-80 failures per 5-minute interval)
>    • **533 successful transactions** occurred during the same period, indicating partial system functionality
> 
> 3. Service Impact Breakdown
>    • **Checkout service**: 471 failures (primary affected service)
>    • **Kafka service**: 188 failures (likely downstream effects)
>    • **Ad service**: 133 failures (secondary impact)
> 
> ### Secondary Issues
> • **19 product catalog failures**: "failed to get product #OLJCESPC7Z" indicating inventory system problems
> • Multiple trace IDs affected, suggesting widespread rather than isolated incidents
> 
> ### Recommendations
> 
> 1. Immediate Actions
>    • Investigate payment token generation/validation service for gold loyalty customers
>    • Check payment gateway integration for token handling issues
>    • Verify loyalty program integration with payment processing
> 
> 2. System Investigation
>    • Review payment service logs for token generation failures
>    • Check authentication/authorization services for gold-tier customers
>    • Examine any recent changes to loyalty program or payment processing logic
> 
> 3. Monitoring Enhancement
>    • Implement specific alerts for payment token validation failures
>    • Add loyalty-level segmentation to payment monitoring
>    • Set up proactive monitoring for checkout service error rates
> 
> The data clearly shows a systematic issue with payment token validation specifically affecting gold loyalty customers, requiring immediate attention to the payment processing pipeline.
```

### Raw tool results

The following sections provide the detailed JSON responses from each tool used in the investigation, showing the specific patterns, statistics, and insights that informed our analysis.

#### Log Pattern Analysis tool results

```json
{
  "inference_results": [
    {
      "output": [
        {
          "name": "response",
          "result": {
            "logInsights": [
              {
                "pattern": "*** METRIC EVENT: Recording checkout.result=<*> status=failure error=could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold ***",
                "count": 63.0,
                "sampleLogs": [
                  "*** METRIC EVENT: Recording checkout.result=0, status=failure, error=could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold ***",
                  "*** METRIC EVENT: Recording checkout.result=0, status=failure, error=could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold ***"
                ]
              },
              {
                "pattern": "could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold",
                "count": 63.0,
                "sampleLogs": [
                  "could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold",
                  "could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold"
                ]
              },
              {
                "pattern": "failed to charge card: could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold",
                "count": 63.0,
                "sampleLogs": [
                  "failed to charge card: could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold",
                  "failed to charge card: could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold"
                ]
              },
              {
                "pattern": "*** METRIC EVENT: Recording checkout.result=<*> status=failure error=failed to prepare order: failed to get product #\"<*>Z\" ***",
                "count": 19.0,
                "sampleLogs": [
                  "*** METRIC EVENT: Recording checkout.result=0, status=failure, error=failed to prepare order: failed to get product #\"OLJCESPC7Z\" ***",
                  "*** METRIC EVENT: Recording checkout.result=0, status=failure, error=failed to prepare order: failed to get product #\"OLJCESPC7Z\" ***"
                ]
              },
              {
                "pattern": "failed to get product #\"<*>Z\"",
                "count": 19.0,
                "sampleLogs": [
                  "failed to get product #\"OLJCESPC7Z\"",
                  "failed to get product #\"OLJCESPC7Z\""
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}
```

#### Data Distribution tool results

```json
{
  "inference_results": [
    {
      "output": [
        {
          "name": "response",
          "result": {
            "singleAnalysis": [
              {
                "field": "droppedAttributesCount",
                "divergence": 1.0,
                "topChanges": [
                  {
                    "value": "0",
                    "selectionPercentage": 1.0
                  }
                ]
              },
              {
                "field": "severityNumber",
                "divergence": 0.689,
                "topChanges": [
                  {
                    "value": "9",
                    "selectionPercentage": 0.69
                  },
                  {
                    "value": "0",
                    "selectionPercentage": 0.31
                  }
                ]
              },
              {
                "field": "severityText",
                "divergence": 0.609,
                "topChanges": [
                  {
                    "value": "INFO",
                    "selectionPercentage": 0.61
                  },
                  {
                    "value": "",
                    "selectionPercentage": 0.18
                  },
                  {
                    "value": "info",
                    "selectionPercentage": 0.12
                  },
                  {
                    "value": "Information",
                    "selectionPercentage": 0.08
                  },
                  {
                    "value": "error",
                    "selectionPercentage": 0.01
                  }
                ]
              },
              {
                "field": "flags",
                "divergence": 0.594,
                "topChanges": [
                  {
                    "value": "0",
                    "selectionPercentage": 0.59
                  },
                  {
                    "value": "1",
                    "selectionPercentage": 0.41
                  }
                ]
              },
              {
                "field": "schemaUrl",
                "divergence": 0.573,
                "topChanges": [
                  {
                    "value": "",
                    "selectionPercentage": 0.57
                  },
                  {
                    "value": "https://opentelemetry.io/schemas/1.24.0",
                    "selectionPercentage": 0.25
                  },
                  {
                    "value": "https://opentelemetry.io/schemas/1.34.0",
                    "selectionPercentage": 0.18
                  }
                ]
              },
              {
                "field": "serviceName",
                "divergence": 0.223,
                "topChanges": [
                  {
                    "value": "kafka",
                    "selectionPercentage": 0.22
                  },
                  {
                    "value": "product-catalog",
                    "selectionPercentage": 0.18
                  },
                  {
                    "value": "frontend-proxy",
                    "selectionPercentage": 0.15
                  },
                  {
                    "value": "checkout",
                    "selectionPercentage": 0.13
                  },
                  {
                    "value": "load-generator",
                    "selectionPercentage": 0.11
                  },
                  {
                    "value": "cart",
                    "selectionPercentage": 0.08
                  },
                  {
                    "value": "shipping",
                    "selectionPercentage": 0.04
                  },
                  {
                    "value": "ad",
                    "selectionPercentage": 0.03
                  },
                  {
                    "value": "currency",
                    "selectionPercentage": 0.02
                  },
                  {
                    "value": "recommendation",
                    "selectionPercentage": 0.01
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}
```

#### Log Pattern Analysis tool's contribution

The Log Pattern Analysis tool contributed to identifying the root cause of payment failures in the following ways.

**Core contribution: Automated error pattern recognition**

The Log Pattern Analysis Tool played a crucial pattern identification role in this payment failure investigation:

1. **Primary failure pattern identification** (63 occurrences):
   - Automatically identified three related patterns for payment token validation failures.
   - All patterns pointed to the same root cause: `Payment request failed. Invalid token`.
   - Specifically identified that failures are associated with `app.loyalty.level=gold`.

2. **Secondary failure pattern identification** (19 occurrences):
   - Identified two product catalog-related failure patterns.
   - Pattern: `failed to get product #"<*>Z"`.
   - Provided specific product ID examples: `OLJCESPC7Z`.

3. **Pattern classification and quantification**:
   - Automatically grouped related error messages into logical failure categories.
   - Provided exact occurrence count statistics.
   - Delivered actual log samples for each pattern for validation.

**Value delivered**: This tool eliminated the need for manual pattern recognition, automatically discovering that payment token validation failures occur 3.3 times more frequently than product catalog issues, clearly establishing primary and secondary failure mode priorities.

#### Data Distribution tool's contribution


The Data Distribution tool contributed to identifying the root cause of payment failures in the following ways.

**Core contribution: Statistical analysis and context provision**

The Data Distribution tool provided critical statistical background and field distribution analysis for the investigation:

1. **Service distribution analysis** (divergence: 0.223):
   - `kafka`: 22% (highest log volume service)
   - `product-catalog`: 18% (secondary failure source)
   - `frontend-proxy`: 15% (user-facing errors)
   - `checkout`: 13% (primary failure point)
   - `load-generator`: 11%
   - Other services: 21%

2. **Severity level analysis** (divergence: 0.609):
   - `INFO` level: 81% total (same severity, different service formats)
     - `INFO`: 61% (Java-based services)
     - `info`: 12% (Python-based services) 
     - `Information`: 8% (.NET-based services)
   - `error` level: 1% (concentrated failures)
   - Empty values: 18%

3. **Field anomaly detection**:
   - `droppedAttributesCount`: divergence = 1.0 (complete anomaly)
   - `severityNumber`: divergence = 0.689 (high anomaly)
   - `flags`: divergence = 0.594 (moderate anomaly)
   - `schemaUrl`: divergence = 0.573 (moderate anomaly)

**Value delivered**: This tool revealed that despite checkout service representing only 13% of total logs, it contains the highest concentration of critical failures. The severity distribution showed that error-level logs are rare (1%), making the 63 payment failures statistically significant. This quantitative context helped prioritize checkout service investigation over higher-volume but less critical services like `kafka`.

#### Both tools working together

The combination of both tools created a synergistic effect that enhanced the investigation's effectiveness:

1. **Qualitative + quantitative analysis**: Log Pattern Analysis tool provided specific error patterns, Data Distribution tool provided statistical validation.
2. **Priority guidance**: Combined analysis showed checkout service has disproportionately high failure impact despite lower log volume.
3. **Root cause validation**: Both tools confirmed payment token validation as the primary issue, with product catalog as secondary.
4. **Actionable insights**: Tools working together provided specific error messages and statistical significance, supporting clear remediation recommendations.

This investigation demonstrates Q CLI's orchestration of multiple OpenSearch tools: `ListIndexTool` and `IndexMappingTool` for data discovery, `SearchIndexTool` for targeted queries, `DataDistributionTool` for statistical analysis of field patterns, `CountTool` for quantitative assessment, and `LogPatternAnalysisTool` for automated pattern extraction.

The Log Pattern Analysis tool provided precise error pattern identification with exact occurrence counts (63 payment failures, 19 product catalog issues), while the Data Distribution tool offered statistical context that validated the significance of checkout service failures despite lower log volume. The combination generated a comprehensive root cause analysis that pinpointed invalid payment tokens as the primary issue affecting gold-tier customers, complete with actionable recommendations for token validation, service dependencies, and monitoring improvements.

## Conclusion

The integration of Q CLI with OpenSearch's Log Pattern Analysis tool and Data Distribution tool transforms complex log investigation into conversational analysis. Through the Model Context Protocol (MCP), these tools become accessible via natural language queries, significantly reducing diagnostic complexity.

**Key benefits demonstrated**:

1. **Conversational interface**: Complex log analysis through natural language queries.
2. **Automated pattern recognition**: No manual log parsing or pattern identification required.
3. **Statistical validation**: Quantitative analysis supporting qualitative findings.
4. **Comprehensive investigation**: Multiple tool orchestration in single conversation.
5. **Actionable results**: Clear root cause identification with specific recommendations.

Together, these tools delivered comprehensive root cause analysis through simple conversational commands, transforming what traditionally required multiple manual queries and domain expertise into an automated, intelligent investigation process. This integration makes advanced log analysis accessible to broader audiences while significantly reducing time to resolution in distributed system troubleshooting.