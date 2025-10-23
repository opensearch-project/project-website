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

## Real-World Example: OpenTelemetry Demo

To demonstrate the practical application of these integrated tools, we'll use the OpenTelemetry Demo as our example scenario. OpenTelemetry is an observability framework that provides a collection of tools, APIs, and SDKs for generating, collecting, and exporting telemetry data (metrics, logs, and traces) from applications. The OpenTelemetry Demo simulates a realistic e-commerce platform with multiple microservices including cart service, checkout service, payment service, and recommendation engine. In this environment, common issues arise such as payment processing failures, cart abandonment errors, recommendation service timeouts, and checkout workflow disruptions, providing excellent opportunities for root cause analysis in a distributed system environment.

### Investigating Payment Failures

In our scenario, users are reporting payment failures during checkout - a critical issue impacting revenue and customer experience. We choose payment failures as our root cause analysis target due to their business-critical impact. The OpenTelemetry Demo can simulate various failure conditions, including payment service disruptions and authentication issues. To resolve this issue, we need to analyze the logs to identify failure patterns and determine whether the issue is related to specific customer segments, authentication problems, or system-level configuration issues.

### Amazon Q CLI Investigation Process

Using Amazon Q CLI with the integrated OpenSearch tools, we can investigate this issue through natural language queries. Here's how the investigation unfolds:

**Initial Query:**
```
Users are reporting payment failures during checkout process and we need to investigate the root cause by analyzing logs from the ss4o_logs* index between 2025-08-11 07:29:07.414 and 2025-08-12 07:29:07.414 to identify patterns in checkout service failures related to card charging issues.
```

**Amazon Q CLI Analysis Results:**
```
I'll help you investigate the payment failures by analyzing the logs in the ss4o_logs* index. Let me start by examining the index structure and then search for checkout-related failures.
> 
> 🛠️  Using tool: ListIndexTool from mcp server opensearch
>  ⋮ 
>  ● Running ListIndexTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs"
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 1.187s
> 
> > Let me check what indices are available that match the pattern:
> 
> 🛠️  Using tool: ListIndexTool (trusted) from mcp server opensearch
>  ⋮ 
>  ● Running ListIndexTool with the param:
>  ⋮  {}
> 
>  ⋮ 
>  ● Completed in 2.395s
> 
> > I can see there are several ss4o_logs-otel-* indices that match the pattern you mentioned. Let me search for logs related to checkout and payment failures in the time range you specified. I'll start by examining the structure of one of these indices and then search for checkout-related failures.
> 
> 🛠️  Using tool: IndexMappingTool from mcp server opensearch
>  ⋮ 
>  ● Running IndexMappingTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs-otel-sample"
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 1.34s
> 
> > Perfect! I can see the log structure includes fields like body, serviceName, and various attributes including cardType, amount, transactionId, etc. Now let me search for checkout and payment-related failures in the specified time range. Since the exact date range you mentioned (2025-08-11 to 2025-08-12) appears to be in the future, I'll search in the available indices that match the pattern.
> 
> [Multiple SearchIndexTool executions with various queries for payment failures, checkout errors, and card charging issues]
> 
> > Perfect! I found extensive checkout service failures. Now let me analyze the data distribution to understand the patterns better:
> 
> 🛠️  Using tool: DataDistributionTool from mcp server opensearch
>  ⋮ 
>  ● Running DataDistributionTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs*",
>  ⋮    "selectionTimeRangeStart": "2025-08-11T07:29:07.414Z",
>  ⋮    "selectionTimeRangeEnd": "2025-08-12T07:29:07.414Z"
>  ⋮  }
> 
>  ⋮ 
>  ● Completed in 0.675s
> 
> > Let me get a count of checkout errors and analyze the pattern:
> 
> 🛠️  Using tool: CountTool from mcp server opensearch
>  ⋮ 
>  ● Running CountTool with the param:
>  ⋮  {
>  ⋮    "index": "ss4o_logs*",
>  ⋮    "body": {
>  ⋮      "query": {
>  ⋮        "bool": {
>  ⋮          "must": [
>  ⋮            {
>  ⋮              "range": {
>  ⋮                "time": {
>  ⋮                  "lte": "2025-08-31",
>  ⋮                  "gte": "2025-08-01"
>  ⋮                }
>  ⋮              }
>  ⋮            },
>  ⋮            {
>  ⋮              "term": {
>  ⋮                "serviceName": "checkout"
>  ⋮              }
>  ⋮            },
>  ⋮            {
>  ⋮              "terms": {
>  ⋮                "severityText": [
>  ⋮                  "error",
>  ⋮                  "ERROR"
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
>  ● Completed in 1.21s
> 
> > Based on my analysis of the logs from the ss4o_logs* index, I've identified significant payment failures in the checkout service. Here's my investigation summary:
> 
> ## Payment Failure Analysis - Root Cause Investigation
> 
> ### Key Findings:
> 
> 1. Primary Issue: Invalid Payment Tokens
> • The most common error pattern is: "Payment request failed. Invalid token"
> • This appears consistently across all checkout failures
> • Error occurs specifically during card charging operations
> 
> 2. Error Pattern Analysis:
> • **Total checkout errors found:** 13,300+ error logs in August 2025
> • **Primary error messages:**
>   • "could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token"
>   • "failed to charge card: could not charge the card: rpc error: code = Unknown desc = Payment request failed. Invalid token"
> 
> 3. Customer Impact Pattern:
> • All failures are associated with app.loyalty.level=gold customers
> • This suggests the issue may be specifically affecting gold-tier loyalty customers
> • Each failed transaction generates multiple error logs (initial failure + retry failure)
> 
> 4. Service Architecture Issues:
> • The checkout service is making RPC calls to a payment service
> • The payment service is rejecting requests due to invalid tokens
> • This indicates a token generation, validation, or expiration issue
> 
> ### Root Cause Analysis:
> 
> Most Likely Causes:
> 1. Payment Token Expiration: Payment tokens for gold loyalty customers may be expiring before the checkout process completes
> 2. Token Generation Issue: The system generating payment tokens for gold customers may have a bug
> 3. Authentication Service Problem: The service validating payment tokens may have incorrect validation logic for gold-tier customers
> 4. Configuration Issue: Gold customer payment processing may have different token requirements that aren't being met
> 
> ### Recommended Actions:
> 
> 1. Immediate Investigation:
>    • Check payment token generation service for gold customers
>    • Verify token expiration times for different loyalty tiers
>    • Review authentication service configuration
> 
> 2. Service Dependencies:
>    • Investigate the RPC connection between checkout and payment services
>    • Check if payment service has different token validation for loyalty tiers
> 
> 3. Monitoring:
>    • Set up alerts for "Invalid token" errors
>    • Monitor checkout success rates by loyalty level
> 
> The pattern clearly shows this is a systematic issue affecting gold loyalty customers specifically, with the payment token validation being the primary failure point in the checkout process.
```

This investigation demonstrates Q CLI's orchestration of multiple OpenSearch tools: ListIndexTool and IndexMappingTool for data discovery, SearchIndexTool for targeted queries, DataDistributionTool for statistical analysis of field patterns, and CountTool for quantitative assessment. The Log Pattern Analysis Tool identified recurring error patterns and anomalous sequences, while the Data Distribution Tool revealed statistical correlations between customer loyalty levels and failure rates. Together, these tools generated a comprehensive root cause analysis that pinpointed invalid payment tokens as the primary issue affecting gold-tier customers, complete with actionable recommendations for token validation, service dependencies, and monitoring improvements.

## Conclusion

The integration of Q CLI with OpenSearch's Log Pattern Analysis Tool and Data Distribution Tool transforms complex log investigation into conversational analysis. Through the Model Context Protocol (MCP), these tools become accessible via natural language queries, significantly reducing diagnostic complexity.

The Log Pattern Analysis Tool proved essential for identifying recurring error patterns and extracting meaningful insights from large log volumes. It automatically detected critical failure patterns and correlated them with specific system attributes and user segments. The Data Distribution Tool complemented this by revealing statistical relationships between different field values and error frequencies, providing quantitative evidence to support root cause hypotheses.

Together, these tools delivered comprehensive root cause analysis through simple conversational commands, transforming what traditionally required multiple manual queries and domain expertise into an automated, intelligent investigation process. This integration makes advanced log analysis accessible to broader audiences while significantly reducing time to resolution in distributed system troubleshooting.