---
layout: post
title: "Data Distribution Tool: Statistical data distribution analysis for root cause analysis"
authors:
  - jiaruj
date: 2025-10-13
categories:
  - technical-posts
meta_keywords: OpenSearch 3.3, Data Distribution Tool, root cause analysis, data distribution analysis, ML Commons, observability, statistical analysis, data comparison, field distribution, RCA
meta_description: Discover how OpenSearch 3.3's Data Distribution Tool enhances root cause analysis through statistical data distribution comparison. Learn to identify distribution changes that indicate system issues and performance problems.
---

Understanding data distribution changes is key to effective root cause analysis in modern distributed systems. When system issues arise, underlying data patterns often shift in ways that expose the source of the problem. OpenSearch 3.3 introduces the Data Distribution Tool — a powerful statistical analysis feature that enables users to examine field value distributions within a single time period or compare distributions across baseline and selection periods, supporting data-driven root cause analysis.

## Introduction

In today's complex distributed systems, root cause analysis often requires understanding how data patterns change when issues occur. Traditional approaches to distribution analysis require manual statistical calculations and are time-intensive when dealing with large datasets during incident response.

The Data Distribution Tool addresses these challenges by leveraging statistical methods to automatically:

* Analyze field value distributions for a single time period to understand data patterns
* Compare data distributions between baseline and selection periods when both are provided
* Calculate statistical divergence metrics to quantify distribution differences
* Process different field types (categorical, numerical, boolean) with appropriate statistical methods

This tool integrates with OpenSearch's plan-execute-reflect agent framework, enabling automated RCA workflows that can significantly reduce mean time to resolution (MTTR) for system incidents.

## What is the Data Distribution Tool?

The Data Distribution Tool is a statistical analysis capability within OpenSearch 3.3 that supports both single time period analysis and comparative analysis between baseline and selection periods. The tool accepts PPL and DSL query filters for flexible data selection and can be integrated with OpenSearch's plan-execute-reflect agents to provide root cause analysis capabilities.

### Core capabilities

The tool automatically performs data distribution analysis:

**Single Period Distribution Analysis**
* Analyzes field value distributions within a single time period
* Provides frequency distributions and percentage calculations for supported field types
* Focuses on meaningful fields while filtering out system fields and high-cardinality ID fields

**Data Distribution Comparison Analysis**
* Compares field value distributions between baseline and selection time periods
* Calculates statistical divergence metrics to quantify distribution differences
* Identifies fields with significant distribution changes and their impact levels

**Field-Level Distribution Processing**
* Automatically detects field types (categorical, numerical, boolean, etc.)
* Handles different data types with appropriate statistical methods
* Groups numerical values into ranges for distribution analysis when cardinality is high

**Query Filtering Support**
* Accepts PPL queries for flexible data filtering
* Supports DSL queries for complex data selection criteria
* Allows custom filtering conditions to focus analysis on specific data subsets

## Technical architecture and algorithms

The Data Distribution Tool uses statistical methods and data processing algorithms to identify distribution patterns and detect anomalies. Understanding how these algorithms work helps configure the tool effectively for your specific use case.

### Algorithm foundation

The tool employs a multi-layered approach to distribution analysis:

**Field Type Detection Engine**
* Automatically identifies field types from OpenSearch mappings using GetMappingsRequest
* Supports keyword, boolean, text, and numeric types (byte, short, integer, long, float, double, half_float, scaled_float)
* Filters useful fields and excludes system fields based on predefined field type sets

**Distribution Calculation**
* For categorical fields: Calculates frequency distributions of unique values
* For numerical fields: Groups values into ranges when cardinality exceeds 10 values
* Filters fields based on cardinality limits (ID fields: max 30, data fields: adaptive based on dataset size)

**Distribution Comparison**
* Calculates percentage-based distribution differences between time periods
* Uses maximum difference calculation to quantify distribution changes
* Ranks fields by divergence scores and sorts changes by magnitude

**Data Processing Optimization**
* Implements efficient data sampling with configurable size limits (default: 1000, max: 10000)
* Uses cardinality-based field filtering to focus on meaningful fields
* Applies automatic field filtering to exclude system fields and high-cardinality ID fields

## Getting started with the Data Distribution Tool

Integrating the Data Distribution Tool into your data analysis workflow is straightforward.

### Agent registration

First, register an agent that includes the Data Distribution Tool:

```json
POST /_plugins/_ml/agents/_register
{
  "name": "DataDistributionAnalysis",
  "type": "flow",
  "tools": [
    {
      "name": "data_distribution_tool",
      "type": "DataDistributionTool",
      "parameters": {}
    }
  ]
}
```

### Analysis execution

The tool supports data distribution analysis:

#### Comparative distribution analysis
```json
POST /_plugins/_ml/agents/{agent_id}/_execute
{
  "parameters": {
    "index": "logs-2025.01.15",
    "timeField": "@timestamp",
    "selectionTimeRangeStart": "2025-01-15 10:00:00",
    "selectionTimeRangeEnd": "2025-01-15 11:00:00",
    "baselineTimeRangeStart": "2025-01-15 08:00:00",
    "baselineTimeRangeEnd": "2025-01-15 09:00:00",
    "size": 1000
  }
}
```

#### Single period analysis
```json
POST /_plugins/_ml/agents/{agent_id}/_execute
{
  "parameters": {
    "index": "application-metrics-2025.01.15",
    "timeField": "@timestamp",
    "selectionTimeRangeStart": "2025-01-15 10:00:00",
    "selectionTimeRangeEnd": "2025-01-15 11:00:00",
    "size": 2000
  }
}
```

#### Advanced filtering with DSL
```json
POST /_plugins/_ml/agents/{agent_id}/_execute
{
  "parameters": {
    "index": "user-events-2025.01.15",
    "timeField": "@timestamp",
    "selectionTimeRangeStart": "2025-01-15 10:00:00",
    "selectionTimeRangeEnd": "2025-01-15 11:00:00",
    "baselineTimeRangeStart": "2025-01-15 08:00:00",
    "baselineTimeRangeEnd": "2025-01-15 09:00:00",
    "queryType": "dsl",
    "dsl": "{\"bool\": {\"must\": [{\"term\": {\"user_type\": \"premium\"}}]}}",
    "size": 1500
  }
}
```

### Parameter reference

Understanding the tool's parameters is essential for effective analysis configuration:

**Required parameters**
* `index`: Target OpenSearch index containing the data to analyze
* `selectionTimeRangeStart`: Start time for the analysis period
* `selectionTimeRangeEnd`: End time for the analysis period

**Optional parameters**
* `timeField`: Timestamp field name (default: `@timestamp`)
* `baselineTimeRangeStart`: Start time for baseline comparison period
* `baselineTimeRangeEnd`: End time for baseline comparison period
* `size`: Maximum number of documents to analyze (default: 1000, max: 10000)
* `queryType`: Query type - 'ppl' or 'dsl' (default: 'dsl')
* `filter`: Array of additional DSL query conditions for filtering
* `dsl`: Complete raw DSL query as JSON string
* `ppl`: Complete PPL statement for data filtering

### Analysis modes

The tool automatically determines the analysis mode based on provided parameters:

1. **Comparative Analysis**: When both baseline and selection time ranges are provided
2. **Single Period Analysis**: When only selection time range is provided

### Field type handling

The tool automatically processes different field types:

**Categorical Fields (keyword, boolean, text)**
* Calculates exact frequency distributions
* Handles high cardinality by focusing on top frequent values
* Provides percentage-based comparisons

**Numerical Fields (byte, short, integer, long, float, double)**
* Uses intelligent binning for high-cardinality numerical data
* Maintains exact distributions for low-cardinality numerical fields
* Applies statistical grouping when cardinality exceeds thresholds

### Data processing configuration

The tool uses intelligent data processing:

- **Size limits**: Configurable document limit (default: 1000, maximum: 10000)
- **Cardinality handling**: Automatic detection and appropriate processing for different cardinality levels
- **Field filtering**: Focuses on useful field types while excluding system fields and high-cardinality ID fields

## Understanding the results

The Data Distribution Tool provides structured output that enables quick identification of distribution anomalies and significant changes.

### Comparative analysis results
```json
{
  "comparisonAnalysis": [
    {
      "field": "level",
      "divergence": 0.15,
      "topChanges": [
        {
          "value": "warn",
          "selectionPercentage": 0.25,
          "baselinePercentage": 0.1
        },
        {
          "value": "info",
          "selectionPercentage": 0.6,
          "baselinePercentage": 0.75
        }
      ]
    },
    {
      "field": "user_count",
      "divergence": 0.12,
      "topChanges": [
        {
          "value": "5",
          "selectionPercentage": 0.3,
          "baselinePercentage": 0.18
        },
        {
          "value": "3",
          "selectionPercentage": 0.4,
          "baselinePercentage": 0.5
        }
      ]
    }
  ]
}
```

### Single period analysis results
```json
{
  "singleAnalysis": [
    {
      "field": "user_type",
      "divergence": 0.3,
      "topChanges": [
        {
          "value": "premium",
          "selectionPercentage": 0.65
        },
        {
          "value": "basic",
          "selectionPercentage": 0.35
        }
      ]
    }
  ]
}
```

## Best practices

### 1. Time window selection
- Baseline and selection periods should have similar lengths for accurate comparison
- Choose baseline periods that represent normal system operation
- Ensure both time periods contain data for meaningful comparison

### 2. Size parameter tuning
- Start with default size (1000) for initial analysis
- Increase size for more detailed analysis (up to 10000)
- Balance between analysis depth and performance requirements

### 3. Field selection strategy
- Tool automatically selects fields based on mapping types and cardinality limits
- High-cardinality ID fields are automatically excluded from analysis
- Use DSL/PPL filtering to focus analysis on specific document subsets

### 4. Result interpretation
- Prioritize fields with high divergence values 
- Consider both statistical significance and practical relevance

## Troubleshooting

### Common issues
1. **No results returned**: Verify time ranges contain data and field mappings are correct
2. **Performance issues**: Reduce size parameter or narrow time windows
3. **High cardinality warnings**: Expected for ID fields; focus on other fields for analysis
4. **Memory limitations**: Use smaller size parameters for very large datasets

### Data quality considerations
- Ensure consistent data formats across time periods
- Verify timestamp field accuracy and timezone consistency
- Consider data ingestion delays when selecting time ranges

## Integration with Plan-Execute-Reflect Agent

### Enhanced agent configuration

To leverage the Data Distribution Tool in your plan-execute-reflect agent, include it in the tools configuration:

```json
POST _plugins/_ml/agents/_register
{
  "name": "Advanced Data Quality Agent with Distribution Analysis",
  "type": "plan_execute_and_reflect",
  "description": "Intelligent agent for comprehensive data quality and anomaly detection",
  "llm": {
    "model_id": "your_llm_model_id",
    "parameters": {
      "prompt": "${parameters.question}"
    }
  },
  "memory": {
    "type": "conversation_index"
  },
  "parameters": {
    "_llm_interface": "bedrock/converse/claude"
  },
  "tools": [
    {
      "type": "ListIndexTool"
    },
    {
      "type": "SearchIndexTool"
    },
    {
      "type": "IndexMappingTool"
    },
    {
      "type": "DataDistributionTool"
    }
  ]
}
```

### Agent integration example

Here's a concrete example of how an agent would use the Data Distribution Tool:

#### User query
```json
POST /_plugins/_ml/agents/your_agent_id/_execute
{
  "parameters": {
    "question": "Analyze the data distribution changes in our user events from yesterday compared to last week to identify any anomalies."
  }
}
```

#### Agent's internal tool call

The agent would automatically call the Data Distribution Tool:

```json
POST /_plugins/_ml/agents/your_agent_id/_execute
{
  "parameters": {
    "index": "user-events-2025.01.15",
    "timeField": "@timestamp",
    "selectionTimeRangeStart": "2025-01-14 00:00:00",
    "selectionTimeRangeEnd": "2025-01-14 23:59:59",
    "baselineTimeRangeStart": "2025-01-07 00:00:00",
    "baselineTimeRangeEnd": "2025-01-07 23:59:59",
    "size": 2000
  }
}
```

#### Tool response

```json
{
  "comparisonAnalysis": [
    {
      "field": "event_type",
      "divergence": 0.1,
      "topChanges": [
        {
          "value": "fail_login",
          "selectionPercentage": 0.15,
          "baselinePercentage": 0.05
        },
        {
          "value": "successful_login",
          "selectionPercentage": 0.75,
          "baselinePercentage": 0.85
        }
      ]
    }
  ]
}
```

#### Agent's root cause analysis

Based on the tool's output, the agent would respond:

"I found a significant distribution change that points to a potential root cause. The event type distribution shows login failures increased from 5% to 15% (3x increase) while successful logins decreased from 85% to 75%. This divergence score of 0.25 indicates a statistically significant change. Root cause analysis suggests investigating: 1) Authentication service issues, 2) Database connectivity problems, 3) Potential security attacks, or 4) Recent configuration changes that may have affected login processing."

### Advanced use cases

#### System incident root cause analysis
```json
{
  "question": "Our API response times spiked at 3 PM today. Help me identify the root cause by analyzing distribution changes."
}
```

The agent would use the Data Distribution Tool to:
- Compare API response time distributions before and during the incident
- Identify which endpoints or services show the most significant distribution changes
- Analyze error code distributions to pinpoint failure patterns
- Provide statistical evidence for root cause hypotheses

#### Performance degradation investigation
```json
{
  "question": "Database performance has been declining over the past week. What distribution changes can help identify the root cause?"
}
```

The agent would use the Data Distribution Tool to:
- Compare query execution time distributions between normal and degraded periods
- Identify changes in query type distributions that may indicate problematic queries
- Analyze connection pool usage distributions to detect resource exhaustion
- Correlate database metric distributions with application performance patterns

## Conclusion

The Data Distribution Tool represents a significant advancement in automated root cause analysis for modern distributed systems. By combining statistical distribution analysis with field processing capabilities, it transforms the traditionally manual and time-intensive process of identifying distribution changes during incidents into an automated, statistically rigorous RCA workflow.

Key benefits for root cause analysis include:

* **Faster incident resolution** by automatically identifying distribution changes that indicate root causes
* **Statistical evidence** through divergence metrics that support RCA hypotheses
* **Multi-field analysis** that reveals complex system interactions during incidents
* **Seamless integration** with OpenSearch 3.3's agent framework for fully automated root cause analysis

Whether you're responding to system incidents, investigating performance degradation, or analyzing service dependencies, the Data Distribution Tool can be integrated with plan-execute-reflect agents to provide powerful statistical evidence for root cause analysis.

To get started with the Data Distribution Tool for root cause analysis, explore the [OpenSearch 3.3 documentation](https://docs.opensearch.org/) and begin integrating automated distribution analysis into your incident response and troubleshooting workflows today.