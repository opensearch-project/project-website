---
layout: post
title: "OpenSearch MCP Server: Empowering EC2 Team's Droplet Analysis"
authors:
    - arjunkumargiri
    - cgunawat
    - ylwu
    - rithinp    
date: 2025-08-18
categories:
    - technical-posts
meta_keywords: "OpenSearch MCP server, Amazon Q, EC2 droplet analysis, multi-cluster connectivity, operational automation, Model Context Protocol"
meta_description: "Learn how Amazon's EC2 team implemented OpenSearch MCP server with Amazon Q to automate droplet failure analysis across multiple OpenSearch domains, reducing investigation time from hours to minutes."
twittercard:
    description: "Amazon EC2 team revolutionized droplet quality investigations using OpenSearch MCP server with Amazon Q, transforming manual processes into efficient automated workflows."
    image: /assets/img/opensearch-logo-themed.svg
    image_alt: "OpenSearch Logo"
---

# Introduction

Amazon EC2 team recently leveraged OpenSearch's Model Context Protocol (MCP) server to revolutionize their droplet quality investigations. By connecting Amazon Q with multiple OpenSearch domains simultaneously, they've transformed a previously manual, time-consuming process into an efficient, automated workflow. This blog explores how the EC2 team implemented this solution, the technical setup involved, and the impressive results they've achieved.

# The Challenge

The EC2 team manages droplet quality across their fleet, investigating failures and impairments to maintain reliability. Their data was distributed across multiple OpenSearch domains in various regions, each storing logs for different components. Engineers faced a multi-step process when troubleshooting:

* Search in one domain to find initial information
* Use those findings to query another domain
* Correlate data across multiple sources
* Repeat until root cause is identified

This process required extensive domain knowledge about where to search and what patterns to look for. The team recognized that their engineers' expertise could be better utilized for solving issues rather than manually gathering and correlating data.

# The Solution

The EC2 team implemented a solution combining:
* **Amazon Q CLI** as the intelligent agent to analyze data and provide insights

> **Note:** While this blog demonstrates the solution with Amazon Q CLI, you can replace it with any other agentic solution such as Claude, OpenAI, or other AI agents that support the Model Context Protocol
* **OpenSearch MCP server** as the connectivity layer to multiple OpenSearch domains
* **AWS profiles** for secure authentication to different clusters

![OpenSearch MCP Server Architecture](/assets/media/blog-images/2025-08-18-opensearch-mcp-server-empowering-ec2-teams-droplet-analysis/mcp-architecture-diagram.png){: .img-fluid}

The key innovation was leveraging OpenSearch MCP server's multi-cluster connectivity feature, which allowed them to interact with multiple OpenSearch domains through a single interface, avoiding tool proliferation that could overwhelm the agent.

# Implementation Steps

## Step 1: Configure Q CLI to use OpenSearch MCP Server

First, the team configured Amazon Q CLI to use the OpenSearch MCP server by editing the ~/.aws/amazonq/mcp.json file:

```json
{
  "mcpServers": {
    "opensearch-mcp-server": {
      "command": "uvx",
      "args": [
        "opensearch-mcp-server-py",
        "--mode", "multi",
        "--config", "/path/to/config.yml"
      ],
      "env": {}
    }
  }
}
```

## Step 2: Define OpenSearch Clusters Configuration

Next, they created a YAML configuration file (clusters.yml) defining all their OpenSearch domains:

```yaml
version: "1.0"
description: "OpenSearch cluster configurations"

clusters:
    # Cluster for hardware engineering data
    hardware-logs:
    opensearch_url: "https://<Hardware cluster URL>"
    profile: "hardware-profile"
    aws_region: "us-east-1"
    
    # Cluster for droplet metrics
    droplet-metrics:
    opensearch_url: "https://<Metrics cluster URL>"
    profile: "metrics-profile"
    aws_region: "us-west-2"
    
    # Cluster for system events
    system-events:
    opensearch_url: "https://<Events cluster URL>"
    profile: "events-profile"
    aws_region: "eu-west-1"
```

The authentication for each cluster was managed through AWS profiles, allowing the OpenSearch MCP server to use the appropriate credentials for each cluster when needed.

### AWS Credentials File Structure

To complement the cluster configuration, here's how the AWS credentials file (~/.aws/credentials) was structured to support the profile-based authentication:

```ini
[hardware-profile]
aws_access_key_id = <your-access-key-id>
aws_secret_access_key = <your-secret-access-key>
aws_session_token = <your-session-token>
region = us-east-1

[metrics-profile]
aws_access_key_id = <your-access-key-id>
aws_secret_access_key = <your-secret-access-key>
aws_session_token = <your-session-token>
region = us-west-2

[events-profile]
aws_access_key_id = <your-access-key-id>
aws_secret_access_key = <your-secret-access-key>
aws_session_token = <your-session-token>
region = us-west-2
```

**This profile-based approach allowed the EC2 team to:**
* Leverage their existing AWS IAM roles and permissions
* Maintain credential separation between different environments
* Simplify credential rotation without modifying configuration files
* Ensure proper access controls for each OpenSearch domain

The OpenSearch MCP server supports various other authentication methods like basic authentication (username/password), direct IAM role authentication etc. Explore more authentication options in the [OpenSearch MCP Server documentation](https://github.com/opensearch-project/opensearch-mcp-server-py/blob/main/USER_GUIDE.md#authentication)

## Step 3: Provide Context to Amazon Q

To help Amazon Q make intelligent decisions about which clusters to query, the team provided the following context prompt to Amazon Q about the available clusters and their contents:

**Context Prompt Given to Amazon Q:**
```
The following OpenSearch clusters are available:

* hardware-logs: Contains detailed hardware engineering logs including voltage readings, temperature data, and hardware failure events.
* droplet-metrics: Stores performance metrics for droplets including CPU, memory, network, and storage metrics.
* system-events: Contains system-level events, lifecycle events, and administrative actions.

When investigating droplet failures, first check system-events for any lifecycle events, then examine hardware-logs for potential hardware failures, and finally analyze droplet-metrics for performance anomalies.
```

This context prompt enables Amazon Q to understand the data structure and develop an intelligent investigation strategy.

# The Workflow in Action

With this setup, the EC2 team could now ask Amazon Q to investigate droplet issues. Here's an example interaction:

**User Query:**
Analyze droplet failure for hardware ID ABC123 that occurred yesterday.

Amazon Q's Process:
* Amazon Q determines it needs to check multiple OpenSearch clusters
* It makes tool calls to the OpenSearch MCP server, specifying which cluster to query:

```json
{
  "arguments": {
    "opensearch_cluster_name": "system-events",
    "index": "lifecycle-events",
    "query": {
      "bool": {
        "must": [
          { "match": { "hardware_id": "ABC123" } },
          { "range": { "timestamp": { "gte": "now-1d", "lte": "now" } } }
        ]
      }
    }
  },
  "name": "SearchIndexTool"
}
```

* After finding relevant lifecycle events, it queries the hardware logs:

```json
{
  "arguments": {
    "opensearch_cluster_name": "hardware-logs",
    "index": "voltage-readings",
    "query": {
      "bool": {
        "must": [
          { "match": { "hardware_id": "ABC123" } },
          { "range": { "timestamp": { "gte": "2025-07-09T00:00:00", "lte": "2025-07-09T18:30:00" } } }
        ]
      }
    }
  },
  "name": "SearchIndexTool"
}
```

* Finally, it analyzes performance metrics leading up to the failure:

```json
{
  "arguments": {
    "opensearch_cluster_name": "droplet-metrics",
    "index": "performance-metrics",
    "query": {
      "bool": {
        "must": [
          { "match": { "hardware_id": "ABC123" } },
          { "range": { "timestamp": { "gte": "2025-07-09T17:30:00", "lte": "2025-07-09T18:30:00" } } }
        ]
      }
    }
  },
  "name": "SearchIndexTool"
}
```

**Example Response:**
Analysis of droplet failure for hardware ID ABC123:

**Root Cause:** Voltage irregularity detected prior to failure
* System event at 18:15:23: Emergency shutdown initiated
* Hardware logs show voltage fluctuations starting at 18:10:05
* Performance metrics indicate CPU temperature increased to 85°C at 18:09:30

**Timeline:**
* 18:09:30 - CPU temperature spike to 85°C
* 18:10:05 - Voltage fluctuations begin (3.1V to 2.7V)
* 18:15:23 - Emergency shutdown initiated
* 18:15:45 - Droplet failure recorded

**Recommendation:** Investigate power delivery system for hardware ID ABC123. Similar voltage irregularities were observed in ticket P12345678.

# Results and Impact

The implementation has delivered significant benefits to the EC2 team:
* Reduced investigation time: What previously took hours of manual correlation now happens in minutes
* Improved accuracy: The systematic approach eliminates human error in data gathering
* Knowledge democratization: Less experienced engineers can now investigate complex issues
* Pattern recognition: Successfully classified approximately 30 previously "unknown" failures
* Standardized analysis: Consistent format for all investigations improves team communication

## Conclusion

The EC2 team has developed a system that can perform this analysis by combining OpenSearch MCP server with Amazon Q to address real-world operational challenges. Through the integration of multi-cluster connectivity features and AWS
profile-based authentication, they've created a powerful solution designed to rapidly diagnose issues and provide
resolution recommendations, which will significantly improve droplet quality across their fleet.

This approach can be adapted by other teams facing similar challenges with distributed data sources, showing the flexibility and power of OpenSearch MCP server as a critical component in AI-assisted operations. Teams can enhance performance by implementing automated pipelines, expanding context prompts with investigation examples, and continuously refining prompts for better recommendations.

