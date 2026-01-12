---
layout: post
title: "Configuring Investigation and Chatbot Features in OpenSearch: A Complete Guide"
authors:
  - ihailong
  - jiaruj
date: 2026-01-09
categories:
  - technical-posts
meta_keywords: OpenSearch development, open source environment, chatbot setup, investigation features, MCP server, OpenSearch Dashboards, development environment
meta_description: Learn how to configure OpenSearch chatbot and investigation features, including OpenSearch backend, Dashboards frontend, and MCP server configuration.
---

OpenSearch's intelligent assistant capabilities bring advanced chatbot and investigation features to the open source community. Setting up these features requires careful configuration of multiple components, from the OpenSearch backend to the Dashboards frontend and MCP (Model Context Protocol) server integration.

This comprehensive guide walks you through the entire setup process, covering everything from basic configuration to advanced features like streaming output, agent frameworks, and local development workflows. Whether you're contributing to the project or exploring its capabilities, this guide provides the foundation you need to get started with OpenSearch's AI-powered features.



### Local Development Setup

For local development, you can run both frontend and backend components:

#### Frontend Setup

```bash
git clone https://github.com/opensearch-project/OpenSearch-Dashboards.git
cd OpenSearch-Dashboards/plugins/
git clone https://github.com/opensearch-project/dashboards-investigation.git
git clone https://github.com/opensearch-project/dashboards-assistant.git
cd ..
yarn osd bootstrap
yarn start --no-base-path
```

#### Frontend Configuration

Configure OpenSearch Dashboards by adding the following settings to your `opensearch_dashboards.yml` file:

```yaml
# Dashboard Administration
opensearchDashboards.dashboardAdmin.users: ['admin']

# Core Features
workspace.enabled: true
data_source.enabled: true
contextProvider.enabled: true

# Chat and Assistant Features
chat.enabled: true
chat.mlCommonsAgentId: '<your_agent_id>'  # Replace with your agent ID
assistant.enabled: true
assistant.chat.enabled: false
assistant.next.enabled: true
assistant.text2viz.enabled: true
assistant.alertInsight.enabled: true
assistant.smartAnomalyDetector.enabled: true
assistant.incontextInsight.enabled: true

# Investigation Features
investigation.enabled: true
investigation.agenticFeaturesEnabled: true
explore.enabled: true

# Query Enhancements
queryEnhancements.queryAssist.summary.enabled: true

# Security and Permissions
savedObjects.permission.enabled: true
opensearch.ignoreVersionMismatch: true
data_source.ssl.verificationMode: none

# UI Settings
uiSettings:
  overrides:
    'home:useNewHomePage': true
```

#### Backend Setup

```bash
# Clone and build job scheduler plugin (required for ML Commons)
git clone https://github.com/opensearch-project/job-scheduler.git
cd job-scheduler/
./gradlew assemble

# Clone and build ML Commons plugin (core ML functionality)
git clone https://github.com/opensearch-project/ml-commons.git
cd ml-commons/
./gradlew assemble

# Clone and build Skills plugin (agent tool capabilities)
git clone https://github.com/opensearch-project/skills.git
cd skills/
./gradlew assemble

# Clone and build SQL plugin (PPL execution capabilities)
git clone https://github.com/opensearch-project/sql.git
cd sql/
./gradlew assemble

# Clone and build OpenSearch core with required transport plugins
git clone https://github.com/opensearch-project/OpenSearch.git
cd OpenSearch/
./gradlew :plugins:transport-reactor-netty4:assemble
./gradlew :plugins:arrow-flight-rpc:assemble
./gradlew localDistro

# Install all built plugins into OpenSearch
cd build/distribution/local/opensearch-3.4.0-SNAPSHOT
./bin/opensearch-plugin install file:///path/to/job-scheduler.zip
./bin/opensearch-plugin install file:///path/to/ml-commons.zip
./bin/opensearch-plugin install file:///path/to/skills.zip
./bin/opensearch-plugin install file:///path/to/sql.zip
./bin/opensearch-plugin install file:///path/to/transport-reactor-netty4.zip
./bin/opensearch-plugin install file:///path/to/arrow-flight-rpc.zip
./bin/opensearch  # Start OpenSearch with all plugins
```

#### Backend Configuration

Configure OpenSearch by adding the following settings to your `opensearch.yml` file:

```yaml
# Enable stream transport feature
opensearch.experimental.feature.transport.stream.enabled: true

# HTTP transport type
http.type: reactor-netty4

# ML Commons plugin settings
plugins.ml_commons.agent_framework_enabled: true
plugins.ml_commons.index_insight_feature_enabled: true
plugins.ml_commons.stream_enabled: true
plugins.ml_commons.ag_ui_enabled: true
plugins.ml_commons.mcp_connector_enabled: true
plugins.ml_commons.trusted_connector_endpoints_regex: ["^https?://localhost.*", "^https?://127\.0\.0\.1.*"]
```

Additionally, configure JVM options by adding the following to your `jvm.options` file:

```bash
# Streaming setup for Arrow Flight RPC
-Dio.netty.allocator.numDirectArenas=1
-Dio.netty.noUnsafe=false
-Dio.netty.tryUnsafe=true
-Dio.netty.tryReflectionSetAccessible=true
```

Set up OpenSearch MCP server for tool integration

```bash
git clone https://github.com/opensearch-project/opensearch-mcp-server-py.git
cd opensearch-mcp-server-py
pip install -r requirements.txt  # Install Python dependencies
# Configure and start MCP server with your OpenSearch credentials
OPENSEARCH_URL="<your_opensearch_endpoint>" \
OPENSEARCH_USERNAME="<your_username>" \
OPENSEARCH_PASSWORD="<your_password>" \
python -m src.mcp_server_opensearch --transport stream --host 0.0.0.0 --port 8080
```

## Setting Up Chatbot Features

Configure the following in Dashboards Dev Tools:

### Enable Streaming Output

First, enable streaming in your OpenSearch cluster:

```bash
PUT /_cluster/settings
{
    "persistent": {
        "plugins.ml_commons.stream_enabled": true
    }
}
```

### Create Model and Connector

Register a Claude 4.5 model with Bedrock connector (note the `model_id` field in output):

```bash
POST /_plugins/_ml/models/_register
{
    "name": "Claude 4.5",
    "function_name": "remote",
    "description": "openai model",
    "connector": {
        "name": "Bedrock Converse Connector",
        "description": "Bedrock Converse Connector",
        "version": 1,
        "protocol": "aws_sigv4",
        "parameters": {
            "region": "us-west-2",
            "model": "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
            "service_name": "bedrock",
            "disable_profile_file": true,
            "disable_ec2_metadata": true
        },
        "credential": {
            "access_key": "{% raw %}{{aws-access-key-id}}{% endraw %}",
            "secret_key": "{% raw %}{{aws-secret-access-key}}{% endraw %}",
            "session_token": "{% raw %}{{aws-session-token}}{% endraw %}"
        },
        "actions": [
            {
                "action_type": "predict",
                "method": "POST",
                "url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/converse-stream",
                "request_body": "{\"messages\": [${parameters._chat_history:-}{\"role\":\"user\",\"content\":[{\"text\":\"${parameters.prompt}\"}]}${parameters._interactions:-}]${parameters.tool_configs:-}}"
            }
        ]
    }
}
```

### Register MCP Connector

Create an MCP connector for tool integration (note the `connector_id` field in output):

```bash
POST _plugins/_ml/connectors/_create
{
  "name": "OpenSearch MCP Server",
  "description": "OpenSearch MCP Server",
  "version": 1,
  "protocol": "mcp_streamable_http",
  "url": "http://localhost:8080",
  "parameters": {
    "endpoint": "/mcp/"
  }
}
```

### Register AG-UI Agent

Create the main chatbot agent (fill in `model_id` and `mcp_connector_id` from previous steps):

```bash
POST /_plugins/_ml/agents/_register
{
    "name": "AG-UI chat agent",
    "type": "AG_UI",
    "description": "this is a test agent",
    "llm": {
        "model_id": "{% raw %}{{model_id}}{% endraw %}",
        "parameters": {
            "max_iteration": 50,
            "system_prompt": "You are a helpful assistant. Use the available tools to help users. When you need to perform an action, use the appropriate tool by calling it with the correct parameters.",
            "prompt": "Context:${parameters.context}\\nQuestion:${parameters.question}"
        }
    },
    "memory": {
        "type": "conversation_index"
    },
    "parameters": {
        "_llm_interface": "bedrock/converse/claude",
        "mcp_connectors": [
            {
                "mcp_connector_id": "{% raw %}{{mcp_connector_id}}{% endraw %}"
            }
        ]
    },
    "tools": [
        {
            "type": "ListIndexTool",
            "name": "ListIndexTool"
        }
    ]
}
```

Next, edit the Dashboards config file and change the value of `chat.mlCommonsAgentId` to your newly registered agent ID.

## Setting Up Investigation Features

### Create Memory Container

Set up memory management for investigation workflows (note the `memory_container_id` field in output):

```bash
POST _plugins/_ml/memory_containers/_create
{
    "name": "test container",
    "description": "this is a test container",
    "configuration": {
        "index_prefix": "test1",
        "disable_history": false,
        "disable_session": false,
        "use_system_index": false
    }
}
```

### Create Investigation Connector

Create connector for investigation features (note the `connector_id` field in output):

```bash
POST _plugins/_ml/connectors/_create
{
    "name": "Amazon Bedrock Claude 4.5-sonnet connector",
    "description": "Connector to Amazon Bedrock service for the Claude model",
    "version": 1,
    "protocol": "aws_sigv4",
    "parameters": {
        "region": "us-west-2",
        "service_name": "bedrock",
        "model": "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
    },
    "credential": {
        "access_key": "{% raw %}{{aws-access-key-id}}{% endraw %}",
        "secret_key": "{% raw %}{{aws-secret-access-key}}{% endraw %}",
        "session_token": "{% raw %}{{aws-session-token}}{% endraw %}"
    },
    "actions": [
        {
            "action_type": "predict",
            "method": "POST",
            "url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/converse",
            "headers": {
                "content-type": "application/json"
            },
            "request_body": "{ \"system\": [{\"text\": \"${parameters.system_prompt}\"}], \"messages\": [${parameters._chat_history:-}{\"role\":\"user\",\"content\":[{\"text\":\"${parameters.prompt}\"}]}${parameters._interactions:-}]${parameters.tool_configs:-} }"
        }
    ]
}
```

### Register Investigation Model

Register model for investigation features (note the `model_id` field in output):

```bash
POST _plugins/_ml/models/_register
{
    "name": "Bedrock Claude 4.5 Sonnet",
    "function_name": "remote",
    "description": "Bedrock Claude model",
    "connector_id": "{% raw %}{{connector_id}}{% endraw %}"
}
```

### Register Investigation MCP Connector

Register MCP connector for investigation tools (note the `connector_id` field in output):

```bash
POST _plugins/_ml/connectors/_create
{
    "name": "My MCP Server Connector",
    "description": "Connector to MCP server",
    "version": "1",
    "protocol": "mcp_streamable_http",
    "url": "http://localhost:8080"
}
```


### Register Investigation Agent

Create a plan-execute-reflect agent for complex investigations (fill in `model_id`, `memory_container_id` and `mcp_connector_id` from previous steps):

```bash
POST _plugins/_ml/agents/_register
{
    "name": "My Plan Execute Reflect Agent",
    "type": "plan_execute_and_reflect",
    "description": "Agent for dynamic task planning and reasoning",
    "llm": {
      "model_id": "{% raw %}{{model_id}}{% endraw %}",
      "parameters": {
        "prompt": "please help me answer the question."
      }
    },
    "memory": {
      "type": "AGENTIC_MEMORY",
      "memory_container_id": "{% raw %}{{memory_container_id}}{% endraw %}"
    },
    "parameters": {
      "_llm_interface": "bedrock/converse/claude",
      "llm_response_filter": "$.output.message.content[0].text",
      "mcp_connectors": "[{\"mcp_connector_id\":\"{% raw %}{{mcp_connector_id}}{% endraw %}\"}]"
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
      }
    ],
    "app_type": "os_chat"
}
```

### Configure Investigation Settings

Register the agent for investigation features (fill in `agent_id` from previous step):

```bash
POST .plugins-ml-config/_doc/os_deep_research
{
    "type": "os_deep_research",
    "configuration": {
      "agent_id": "{% raw %}{{agent_id}}{% endraw %}"
    }
}
```

## Results

After completing the configuration, you'll have access to OpenSearch's intelligent assistant capabilities through multiple interfaces. The setup provides three key components that work together to deliver comprehensive AI-powered functionality.

### Investigation Entry Point

The investigation feature is accessible through the main OpenSearch Dashboards interface, providing users with an intuitive entry point to AI-powered data analysis.

<img src="/assets/media/blog-images/2026-01-09-configuring-investigation-and-chatbot-features-in-opensearch/investigation-interface.png" alt="OpenSearch Investigation Entry Point"/>{: .img-fluid }

### Investigation Workflow in Action

The investigation feature demonstrates advanced AI capabilities, including automated analysis, pattern recognition, and comprehensive reporting based on your data queries.

<img src="/assets/media/blog-images/2026-01-09-configuring-investigation-and-chatbot-features-in-opensearch/investigation-workflow.png" alt="Investigation Workflow Example"/>{: .img-fluid }

### Chatbot Functionality

The chatbot interface enables real-time conversations with your data, allowing users to ask questions in natural language and receive intelligent responses powered by the configured ML models.

<img src="/assets/media/blog-images/2026-01-09-configuring-investigation-and-chatbot-features-in-opensearch/chatbot-interface.png" alt="OpenSearch Chatbot Interface"/>{: .img-fluid }
