---
layout: post
title: "Amazon Q CLI Integration: Log Pattern and Data Distribution Analysis"
authors:
  - ihailong
  - jiaruj
date: 2025-10-17
categories:
  - technical-posts
meta_keywords: Amazon Q CLI, CLI integration, log pattern analysis, data distribution analysis, OpenSearch CLI, command line interface, log analysis tools, data distribution tools, OpenSearch integration, diagnostic tools, MCP, Agent, Agentic AI, OpenTelemetry
meta_description: Learn how to integrate Amazon Q CLI with OpenSearch's log pattern analysis and data distribution tools for streamlined command-line diagnostics and enhanced system troubleshooting capabilities.
---

## Log Pattern Analysis Tool Overview

The [Log Pattern Analysis Tool](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/tools/log-pattern-analysis-tool/) is an OpenSearch agent tool that automates log analysis through multiple analysis modes. It performs differential pattern analysis between baseline and problem periods, analyzes log sequences using trace correlation, and provides log insights by automatically extracting error patterns and keywords from log data to accelerate troubleshooting.

## Data Distribution Tool Overview

The [Data Distribution Tool](https://docs.opensearch.org/latest/ml-commons-plugin/agents-tools/tools/data-distribution-tool/) is an OpenSearch agent tool that analyzes data distribution patterns within datasets and compares distributions between different time periods. It supports both single dataset analysis and comparative analysis to identify significant changes in field value distributions, helping detect anomalies, trends, and data quality issues. The tool generates statistical summaries including value frequencies, percentiles, and distribution metrics to help understand data characteristics and identify potential data quality issues.

## Amazon Q CLI Integration

Amazon Q CLI can seamlessly integrate with these OpenSearch analysis tools through the [Model Context Protocol (MCP)](https://opensearch.org/blog/introducing-mcp-in-opensearch/). By configuring the OpenSearch MCP server, you can access both the Log Pattern Analysis Tool and Data Distribution Tool directly from your command line interface. This integration enables natural language queries for log analysis and data distribution insights, making complex diagnostic tasks accessible through simple conversational commands.

### Implementation with opensearch-mcp-server-py

This integration is built on the [opensearch-mcp-server-py](https://github.com/opensearch-project/opensearch-mcp-server-py) project, which provides a Python-based MCP server for OpenSearch. To enable the Log Pattern Analysis Tool and Data Distribution Tool integration, you need to clone this project and add custom integration code for both tools, extending the server's capabilities to support these advanced analysis features.

### Complete Integration Workflow

To set up Amazon Q CLI with OpenSearch MCP integration, follow these steps:

1. **Clone the MCP Server Repository**
   ```bash
   git clone https://github.com/opensearch-project/opensearch-mcp-server-py.git
   cd opensearch-mcp-server-py
   ```

2. **Add Tool Integration Code**
   - Implement Log Pattern Analysis Tool integration in the MCP server
   - Implement Data Distribution Tool integration in the MCP server
   - Register both tools with the MCP server's tool registry
   - For a complete implementation example, see the demo at [opensearch-mcp-server-py/integrate-skill-tool](https://github.com/PauiC/opensearch-mcp-server-py/tree/integrate-skill-tool)

3. **Start the MCP Server**
   ```bash
   OPENSEARCH_URL="<your-opensearch-cluster-endpoint>" \
   OPENSEARCH_USERNAME="<your-opensearch-username>" \
   OPENSEARCH_PASSWORD="<your-opensearch-password>" \
   python -m src.mcp_server_opensearch --transport stream --host 0.0.0.0 --port 9900
   ```
   
   This command starts the MCP server on localhost:9900. When using this configuration, set the `url` field in your configuration file to: `"http://localhost:9900/mcp"`

4. **Configure Amazon Q CLI**
   - Open your Amazon Q CLI configuration file
   - Add the MCP server configuration (see below)

5. **Start Using Natural Language Queries**
   - Launch Amazon Q CLI
   - Begin querying your OpenSearch data using conversational commands

### MCP Configuration Example

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

**Configuration Notes:**
- `url`: Replace with your MCP server URL (e.g., `http://localhost:9900/mcp`)
- `OPENSEARCH_URL`: Replace with your OpenSearch cluster endpoint
- `OPENSEARCH_PASSWORD`: Replace with your OpenSearch password
- `OPENSEARCH_USERNAME`: Replace with your OpenSearch username

## Real-World Example: OpenTelemetry Demo

To demonstrate the practical application of these integrated tools, we'll use the OpenTelemetry Demo as our example scenario. OpenTelemetry is an observability framework that provides a collection of tools, APIs, and SDKs for generating, collecting, and exporting telemetry data (metrics, logs, and traces) from applications. The OpenTelemetry Demo simulates a realistic e-commerce platform with multiple microservices including cart service, checkout service, payment service, and recommendation engine. In this environment, common issues arise such as payment processing failures, cart abandonment errors, recommendation service timeouts, and checkout workflow disruptions, providing excellent opportunities for root cause analysis in a distributed system environment.

### Investigating Payment Failures

In our scenario, users are reporting payment failures during checkout - a critical issue impacting revenue and customer experience. We choose payment failures as our root cause analysis target due to their business-critical impact. The OpenTelemetry Demo can simulate various failure conditions, including payment service disruptions and authentication issues. To resolve this issue, we need to analyze the logs to identify failure patterns and determine whether the issue is related to specific customer segments, authentication problems, or system-level configuration issues.

### Amazon Q CLI Investigation Process

Using Amazon Q CLI with the integrated OpenSearch tools, we can investigate this issue through natural language queries. Here's how the investigation unfolds:

**Initial Query:**
```
Users are reporting payment failures during checkout process and we need to investigate the root cause by analyzing logs from the ss4o_logs* index between 2025-08-21 and 2025-08-22 to identify patterns in checkout service failures related to card charging issues.
```

**Amazon Q CLI Analysis Results:**
```
I'll help you investigate the payment failures by analyzing the logs in the ss4o_logs* index. Let me start by examining the available indices and then analyze the log patterns during the specified time period.
> 
> 🛠️  Using tool: ListIndexTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running ListIndexTool with the param:
>  ⋮  {
>  ⋮    "include_detail": false
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 2.54s
> 
> I can see the ss4o_logs-otel-2025.08.21 index is available for the specified date range. Now let me use the LogPatternAnalysisTool to analyze patterns related to checkout failures and card charging issues:
> 
> 🛠️  Using tool: LogPatternAnalysisTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running LogPatternAnalysisTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs-otel-2025.08.21",
>  ⋮    "logFieldName": "body",
>  ⋮    "selectionTimeRangeStart": "2025-08-21T00:00:00.000Z",
>  ⋮    "selectionTimeRangeEnd": "2025-08-22T00:00:00.000Z",
>  ⋮    "timeField": "time"
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 1.444s
> 
> Excellent! I found significant payment failure patterns. Let me also search for more specific checkout service logs to get a complete picture:
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
>  ⋮                  "gte": "2025-08-21T00:00:00.000Z",
>  ⋮                  "lte": "2025-08-22T00:00:00.000Z"
>  ⋮                }
>  ⋮              }
>  ⋮            },
>  ⋮            {
>  ⋮              "bool": {
>  ⋮                "should": [
>  ⋮                  {"match": {"body": "checkout"}},
>  ⋮                  {"match": {"body": "payment"}},
>  ⋮                  {"match": {"body": "card"}},
>  ⋮                  {"match": {"serviceName": "checkoutservice"}}
>  ⋮                ]
>  ⋮              }
>  ⋮            }
>  ⋮          ]
>  ⋮        }
>  ⋮      },
>  ⋮      "size": 20,
>  ⋮      "sort": [{"time": {"order": "desc"}}]
>  ⋮    }
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 1.378s
> 
> Now let me get a count of the different types of failures to understand the scale:
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
>  ⋮                  "lte": "2025-08-22T00:00:00.000Z",
>  ⋮                  "gte": "2025-08-21T00:00:00.000Z"
>  ⋮                }
>  ⋮              }
>  ⋮            },
>  ⋮            {
>  ⋮              "match": {
>  ⋮                "body": "Payment request failed. Invalid token"
>  ⋮              }
>  ⋮            }
>  ⋮          ]
>  ⋮        }
>  ⋮      }
>  ⋮    }
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 0.968s
> 
> Let me also check for other types of checkout failures:
> 
> 🛠️  Using tool: CountTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running CountTool with the param:
>  ⋮  {
>  ⋮    "body": {
>  ⋮      "query": {
>  ⋮        "bool": {
>  ⋮          "must": [
>  ⋮            {
>  ⋮              "range": {
>  ⋮                "time": {
>  ⋮                  "lte": "2025-08-22T00:00:00.000Z",
>  ⋮                  "gte": "2025-08-21T00:00:00.000Z"
>  ⋮                }
>  ⋮              }
>  ⋮            },
>  ⋮            {
>  ⋮              "match": {
>  ⋮                "body": "failed to get product"
>  ⋮              }
>  ⋮            }
>  ⋮          ]
>  ⋮        }
>  ⋮      }
>  ⋮    },
>  ⋮    "index": "ss4o_logs-otel-2025.08.21"
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 0.980s
> 
> Let me analyze the distribution of failures over time to understand patterns:
> 
> 🛠️  Using tool: DataDistributionTool from mcp server opensearch-mcp-server
>  ⋮ 
>  ● Running DataDistributionTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs-otel-2025.08.21",
>  ⋮    "selectionTimeRangeStart": "2025-08-21T00:00:00.000Z",
>  ⋮    "selectionTimeRangeEnd": "2025-08-22T00:00:00.000Z",
>  ⋮    "timeField": "time",
>  ⋮    "size": 5000
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 0.801s
> 
> Based on my analysis of the logs from the ss4o_logs-otel-2025.08.21 index (the closest available data to your requested timeframe), I've identified significant payment failure patterns in the checkout process. Here are the key findings:
> 
> ## Root Cause Analysis Summary
> 
> ### Primary Issue: Payment Token Validation Failures
> • **7,906 instances** of "Payment request failed. Invalid token" errors
> • **Pattern**: could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold
> 
> ### Secondary Issue: Product Catalog Failures  
> • **123,100 instances** of "failed to get product" errors
> • **Pattern**: failed to prepare order: failed to get product #"<PRODUCT_ID>"
> 
> ## Key Patterns Identified
> 
> ### 1. Payment Processing Flow
> The checkout process follows this sequence:
> 1. *** CHECKOUT PROCESS STARTED - Will record checkout.result metric at the end ***
> 2. charge card, amount: currency_code:"USD" units:<amount> nanos:<cents>, paymentInfo: credit_card_number:"<CARD>" credit_card_cvv:<CVV> credit_card_expiration_year:<YEAR> credit_card_expiration_month:<MONTH>
> 3. FAILURE: could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token
> 4. failed to charge card: <error details>
> 5. *** METRIC EVENT: Recording checkout.result=0, status=failure, error=<details> ***
> 
> ### 2. Service Distribution
> • **Checkout service**: 10% of logs (primary failure point)
> • **Product catalog**: 14% of logs (secondary failure source)
> • **Frontend proxy**: 15% of logs (showing HTTP 500 errors)
> 
> ### 3. Error Correlation
> • All payment failures result in HTTP 500 responses at the frontend-proxy level
> • Failures consistently occur for users with app.loyalty.level=gold
> • Each failed checkout generates multiple log entries across the transaction flow
> 
> ## Recommendations
> 
> ### Immediate Actions
> 1. Investigate payment service token validation - The "Invalid token" error suggests issues with payment gateway authentication or token generation
> 2. Check product catalog service stability - High volume of product lookup failures may be causing cascading checkout issues
> 3. Review loyalty level processing - All observed failures are associated with gold-level users
> 
> ### Monitoring Improvements
> 1. Set up alerts for payment token validation failures
> 2. Monitor checkout success/failure rates by loyalty level
> 3. Track product catalog service availability and response times
> 
> The data shows a systemic issue with payment processing rather than isolated incidents, requiring immediate attention to the payment service's token validation mechanism.
```

### Raw Tool Results

#### Log Pattern Analysis Tool Results

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
                "count": 1177.0,
                "sampleLogs": [
                  "*** METRIC EVENT: Recording checkout.result=0, status=failure, error=could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold ***",
                  "*** METRIC EVENT: Recording checkout.result=0, status=failure, error=could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold ***"
                ]
              },
              {
                "pattern": "could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold",
                "count": 1177.0,
                "sampleLogs": [
                  "could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold",
                  "could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold"
                ]
              },
              {
                "pattern": "failed to charge card: could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold",
                "count": 1177.0,
                "sampleLogs": [
                  "failed to charge card: could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold",
                  "failed to charge card: could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token. app.loyalty.level=gold"
                ]
              },
              {
                "pattern": "*** METRIC EVENT: Recording checkout.result=<*> status=failure error=failed to prepare order: failed to get product #\"<*>Z\" ***",
                "count": 348.0,
                "sampleLogs": [
                  "*** METRIC EVENT: Recording checkout.result=0, status=failure, error=failed to prepare order: failed to get product #\"OLJCESPC7Z\" ***",
                  "*** METRIC EVENT: Recording checkout.result=0, status=failure, error=failed to prepare order: failed to get product #\"OLJCESPC7Z\" ***"
                ]
              },
              {
                "pattern": "failed to get product #\"<*>Z\"",
                "count": 348.0,
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

#### Data Distribution Tool Results

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
                    "selectionPercentage": 1.0,
                    "baselinePercentage": 0.0
                  }
                ]
              },
              {
                "field": "severityNumber",
                "divergence": 0.6978,
                "topChanges": [
                  {
                    "value": "9",
                    "selectionPercentage": 0.7,
                    "baselinePercentage": 0.0
                  },
                  {
                    "value": "0",
                    "selectionPercentage": 0.3,
                    "baselinePercentage": 0.0
                  }
                ]
              },
              {
                "field": "severityText",
                "divergence": 0.6424,
                "topChanges": [
                  {
                    "value": "INFO",
                    "selectionPercentage": 0.64,
                    "baselinePercentage": 0.0
                  },
                  {
                    "value": "",
                    "selectionPercentage": 0.2,
                    "baselinePercentage": 0.0
                  },
                  {
                    "value": "info",
                    "selectionPercentage": 0.09,
                    "baselinePercentage": 0.0
                  },
                  {
                    "value": "error",
                    "selectionPercentage": 0.01,
                    "baselinePercentage": 0.0
                  }
                ]
              },
              {
                "field": "serviceName",
                "divergence": 0.2984,
                "topChanges": [
                  {
                    "value": "kafka",
                    "selectionPercentage": 0.3,
                    "baselinePercentage": 0.0
                  },
                  {
                    "value": "frontend-proxy",
                    "selectionPercentage": 0.15,
                    "baselinePercentage": 0.0
                  },
                  {
                    "value": "product-catalog",
                    "selectionPercentage": 0.14,
                    "baselinePercentage": 0.0
                  },
                  {
                    "value": "checkout",
                    "selectionPercentage": 0.1,
                    "baselinePercentage": 0.0
                  },
                  {
                    "value": "load-generator",
                    "selectionPercentage": 0.08,
                    "baselinePercentage": 0.0
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

#### Log Pattern Analysis Tool's Role in This Investigation

**Core Contribution: Automated Error Pattern Recognition**

The Log Pattern Analysis Tool played a crucial pattern identification role in this payment failure investigation:

1. **Primary Failure Pattern Identification** (1,177 occurrences):
   - Automatically identified three related patterns for payment token validation failures
   - All patterns point to the same root cause: `Payment request failed. Invalid token`
   - Specifically identified that failures are associated with `app.loyalty.level=gold`

2. **Secondary Failure Pattern Identification** (348 occurrences):
   - Identified two product catalog-related failure patterns
   - Pattern: `failed to get product #"<*>Z"`
   - Provided specific product ID examples: `OLJCESPC7Z`

3. **Pattern Classification and Quantification**:
   - Automatically grouped related error messages into logical failure categories
   - Provided exact occurrence count statistics
   - Delivered actual log samples for each pattern for validation

**Value Delivered**: This tool eliminated the need for manual pattern recognition, automatically discovering that payment token validation failures occur 3.4 times more frequently than product catalog issues, clearly establishing primary vs. secondary failure mode priorities.

#### Data Distribution Tool's Role in This Investigation

**Core Contribution: Statistical Analysis and Context Provision**

The Data Distribution Tool provided critical statistical background and field distribution analysis for the investigation:

1. **Service Distribution Analysis** (divergence: 0.2984):
   - kafka: 30% (highest log volume service)
   - frontend-proxy: 15% (user-facing errors)
   - product-catalog: 14% (secondary failure source)
   - checkout: 10% (primary failure point)
   - Other services: 31%

2. **Severity Level Analysis** (divergence: 0.6424):
   - INFO level: 64% (normal operations)
   - Error level: Only 1% (concentrated failures)
   - Empty values: 20%
   - info level: 9%

3. **Field Anomaly Detection**:
   - `droppedAttributesCount`: divergence = 1.0 (complete anomaly)
   - `severityNumber`: divergence = 0.6978 (high anomaly)
   - `flags`: divergence = 0.6498 (moderate anomaly)

**Value Delivered**: This tool revealed that despite checkout service representing only 10% of total logs, it contains the highest concentration of critical failures. The severity distribution showed that error-level logs are rare (1%), making the 1,177 payment failures statistically significant. This quantitative context helped prioritize checkout service investigation over higher-volume but less critical services like kafka.

#### Synergistic Effect of Both Tools

1. **Qualitative + Quantitative Analysis**: Log Pattern Analysis Tool provided specific error patterns, Data Distribution Tool provided statistical validation
2. **Priority Guidance**: Combined analysis showed checkout service has disproportionately high failure impact despite lower log volume
3. **Root Cause Validation**: Both tools confirmed payment token validation as the primary issue, with product catalog as secondary
4. **Actionable Insights**: Together provided specific error messages and statistical significance, supporting clear remediation recommendations

This investigation demonstrates Q CLI's orchestration of multiple OpenSearch tools: ListIndexTool and IndexMappingTool for data discovery, SearchIndexTool for targeted queries, DataDistributionTool for statistical analysis of field patterns, CountTool for quantitative assessment, and LogPatternAnalysisTool for automated pattern extraction. The Log Pattern Analysis Tool provided precise error pattern identification with exact occurrence counts, while the Data Distribution Tool offered statistical context that validated the significance of checkout service failures despite lower log volume. The combination generated a comprehensive root cause analysis that pinpointed invalid payment tokens as the primary issue affecting gold-tier customers, complete with actionable recommendations for token validation, service dependencies, and monitoring improvements.

## Conclusion

The integration of Q CLI with OpenSearch's Log Pattern Analysis Tool and Data Distribution Tool transforms complex log investigation into conversational analysis. Through the Model Context Protocol (MCP), these tools become accessible via natural language queries, significantly reducing diagnostic complexity.

**Key Benefits Demonstrated:**

1. **Conversational Interface**: Complex log analysis through natural language queries
2. **Automated Pattern Recognition**: No manual log parsing or pattern identification required
3. **Statistical Validation**: Quantitative analysis supporting qualitative findings
4. **Comprehensive Investigation**: Multiple tool orchestration in single conversation
5. **Actionable Results**: Clear root cause identification with specific recommendations

Together, these tools delivered comprehensive root cause analysis through simple conversational commands, transforming what traditionally required multiple manual queries and domain expertise into an automated, intelligent investigation process. This integration makes advanced log analysis accessible to broader audiences while significantly reducing time to resolution in distributed system troubleshooting.