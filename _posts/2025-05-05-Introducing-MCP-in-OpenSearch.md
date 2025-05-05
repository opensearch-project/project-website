---
layout: post
title: "Introducing MCP in OpenSearch"
authors:
  - ylwu
  - rithinp
date: 2025-05-05
categories:
  - technical-posts
meta_keywords: MCP, OpenSearch, AI agents, tool calling, LangChain, Claude
meta_description: Learn about OpenSearch's new MCP (Model Control Protocol) support, enabling AI agents to safely and efficiently interact with your search data through standardized tool interfaces.
---
[The Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) is a standardized communication framework that solves the integration complexity between AI agents and external tools. Without MCP, developers face significant technical overhead as each tool integration requires implementing custom code for specific API endpoints, parameter schemas, response formats, and error handling patterns. This fragmentation creates maintenance challenges and slows development velocity. MCP addresses these issues by providing a unified protocol layer with consistent interfaces for tool discovery, parameter validation, response formatting, and error handling. The protocol establishes a contract between agent frameworks and tool providers, enabling seamless interoperability through standardized JSON payloads and well-defined behavioral expectations. This standardization means developers can integrate new tools with minimal code changes, as the agent only needs to communicate with MCP's consistent interface rather than learning each tool's proprietary API structure.

![MCP Architecture Comparison](/assets/media/blog-images/2025-05-05-Introducing-MCP-in-OpenSearch/mcp-architecture.png){: .img-fluid}

This diagram shows the difference. On the left, the agent is directly connected to every tool. On the right, MCP sits in the middle. The result is a much cleaner and more scalable setup.

# Section 1: OpenSearch MCP Server

## Section 1.1: Built in MCP Server

OpenSearch 3.0 ships an experimental MCP Server inside the ML Commons plugin. The server publishes a core set of tools as first‑class MCP endpoints over a streaming SSE interface (`/_plugins/_ml/mcp/sse`). An LLM agent —for example, LangChain’s ReAct agent—can simply connect and discover what the server offers, and then invoke the tools with JSON arguments without you writing any adapter code or opening up ad-hoc REST endpoints.

The OpenSearch MCP Server solves the last-mile problem of giving agents safe and real-time access to your search data. In practice this means that every index in the cluster - your product catalog, logs, or vector store can all be queried, summarized, or cross-referenced by whatever agent framework you prefer via the MCP server.

![MCP Server Architecture](/assets/media/blog-images/2025-05-05-Introducing-MCP-in-OpenSearch/mcp-server-architecture.png){: .img-fluid}

### Quick Start:

To setup the MCP server inside OpenSearch, follow these steps:

**Step 1:** Enable the Experimental Streaming feature to support SSE:

Follow the steps in this document to install the `transport-reactor-netty4` plugin and enable Experimental Streaming.

**Step 2:** Enable the experimental MCP Server:

```json
PUT /_cluster/settings/
{
    "persistent": {
        "plugins.ml_commons.mcp_server_enabled": "true"
    }
}
```

**Step 3:** Register tools:

The server starts empty, so you register whichever tools you want it to expose. Here is a minimal example that activates the `ListIndexTool` and `SearchIndexTool`. 
Note: All properties must be wrapped inside an "input" field within the schema, as shown below:

```json
POST /_plugins/_ml/mcp/tools/_register
{
    "tools": [
        {
            "type": "ListIndexTool",
            "name": "My_ListIndexTool",
            "description": "Lists index of Opensearch CLuster A",
            "attributes": {
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "input": {
                            "indices": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "description": "OpenSearch index name list, separated by comma. for example: [\"index1\", \"index2\"], use empty array [] to list all indices in the cluster"
                            }
                        }
                    },
                    "additionalProperties": false
                }
            }
        },
        {
            "type": "SearchIndexTool",
            "name": "My_SearchIndexTool",
            "description": "Searches an index using a query in OpenSearch Cluster A",
            "attributes": {
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "input": {
                            "index": {
                                "type": "string",
                                "description": "OpenSearch index name. for example: index1"
                            },
                            "query": {
                                "type": "object",
                                "description": "OpenSearch search index query. You need to get index mapping to write correct search query. It must be a valid OpenSearch query. Valid value:\n{\"query\":{\"match\":{\"population_description\":\"seattle 2023 population\"}},\"size\":2,\"_source\":\"population_description\"}\nInvalid value: \n{\"match\":{\"population_description\":\"seattle 2023 population\"}}\nThe value is invalid because the match not wrapped by \"query\".",
                                "additionalProperties": false
                            }
                        }
                    }
                },
                "required": [
                    "input"
                ],
                "strict": false
            }
        }
    ]
}
```

That's it! The `ListIndexTool` and the `SearchIndexTool` are ready to be used my the MCP Server.

#### Important Endpoints

* MCP server base endpoint: `/_plugins/_ml/mcp`
* Message endpoint used internally by the MCP Client: `/_plugins/_ml/mcp/sse/message?sessionId=...`

Note: For Python MCP Clients, use this URL to establish the connection: `/_plugins/_ml/mcp/sse?append_to_base_url=true`

#### Available tools:

OpenSearch provides a comprehensive suite of tools that can be registered with OpenSearch MCP server. You can find the list of supported tools [here](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/tools/index/). To make them compatible with MCP, wrap all the input schema properties of a tool inside the "input" field like above.

#### Authentication:

When connecting to the MCP Server, you'll need to include appropriate authentication headers based on your OpenSearch security setup. The example below shows how to add headers in a LangChain client:

```python
cred = base64.b64encode(f"{username}:{password}".encode()).decode()
headers = {
    "Content-Type": "application/json",
    "Accept-Encoding": "identity",
    "Authorization": f"Basic {cred}"
}

client = MultiServerMCPClient({
    "opensearch": {
        "url": "http://localhost:9200/_plugins/_ml/mcp/sse?append_to_base_url=true",
        "transport": "sse",
        "headers": headers    
    }
})
```

### End‑to‑end example with LangChain

This complete example demonstrates how to create an agent that interacts with OpenSearch via MCP tools. The code below shows how to initialize a LangChain agent, discover available MCP tools from OpenSearch, and execute a simple query to list products. While this example uses GPT-4o, the approach works with any LLM that supports LangChain's tool-calling interface.



```python
import asyncio
from dotenv import load_dotenv
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from langchain.agents import AgentType, initialize_agent

# Load openAI key from .env file
load_dotenv()

# Initialize the OpenAI chat model
model = ChatOpenAI(model="gpt-4o")

async def main():
    # Create MCP client with OpenSearch connection details
    async with MultiServerMCPClient({
        "opensearch": { 
        "url": "http://localhost:9200/_plugins/_ml/mcp/sse?append_to_base_url=true",
        "transport": "sse",
        "headers": {
            "Content-Type": "application/json",
            "Accept-Encoding": "identity",  # Disable compression for SSE
        }
    }
    }) as client:
        # Get available tools from the MCP server
        tools = client.get_tools()
        
        # Initialize LangChain agent with tools and model
        agent = initialize_agent(
            tools=tools,
            llm=model,
            agent=AgentType.OPENAI_FUNCTIONS,
            verbose=True,
        )

        # Execute agent with query to list products
        await agent.ainvoke({"input": "List all the products"})

if __name__ == "__main__":
    asyncio.run(main())
```

Example Output:

```
> Entering new AgentExecutor chain...

# Agent Invoking List Index Tool to understand the available Indices
Invoking: `ListIndexTool` with `{'indices': []}`


# Response of the tool
row,health,status,index,uuid,pri(number of primary shards),rep(number of replica shards),docs.count(number of available documents),docs.deleted(number of deleted documents),store.size(store size of primary and replica shards),pri.store.size(store size of primary shards)
1,green,open,.plugins-ml-memory-message,wd9uHXSyTgS6vCgj2XsXfg,1,0,231,3,157.2kb,157.2kb
2,green,open,.plugins-ml-model-group,0bPcdNUNRBCGIvQDiFOk_A,1,0,3,0,16.6kb,16.6kb
3,green,open,.plugins-ml-memory-meta,iGdfyjKtRFOpgzTMaJ6puw,1,0,15,0,51.5kb,51.5kb
4,green,open,.plugins-ml-config,rTKo7buGSr2190wC3fsOtg,1,0,1,0,4kb,4kb
5,green,open,.plugins-ml-model,GiU5ZusSQ9WQ-G20zuxcsw,1,0,10,0,235.6kb,235.6kb
6,green,open,.plugins-ml-agent,BhxPKcLxS2GYbfIeT-HixA,1,0,13,0,54.7kb,54.7kb
7,yellow,open,.plugins-ml-mcp-session-management,14Y6xzzlSgy5V4LntUJBWA,1,1,70,0,29.6kb,29.6kb
8,green,open,.plugins-ml-task,FO4JshGBT4WNO495EDdy4w,1,0,52,0,44.9kb,44.9kb
9,green,open,.plugins-ml-connector,0imPQiljRViP_ZFyFwP7oQ,1,0,1,0,13.9kb,13.9kb
10,yellow,open,products,2gEDtub0QUK02mozUEQVkQ,1,1,5,0,4.5kb,4.5kb

# Agent invoking the SearchIndexTool to understand the contents of the products index
Invoking: `SearchIndexTool` with `{'input': {'index': 'products', 'query': {'query': {'match_all': {}}}}}`

# Response of the Tool
{"_index":"products","_source":{"name":"Product A","description":"High-quality leather wallet"},"_id":"qfnakpYB_WRO-vG7MgXB","_score":1.0}
{"_index":"products","_source":{"name":"Product B","description":"Eco-friendly bamboo toothbrush"},"_id":"qvnakpYB_WRO-vG7MgXC","_score":1.0}
{"_index":"products","_source":{"name":"Product C","description":"Wireless noise-cancelling headphones"},"_id":"q_nakpYB_WRO-vG7MgXC","_score":1.0}
{"_index":"products","_source":{"name":"Product D","description":"Portable external SSD 1TB"},"_id":"rPnakpYB_WRO-vG7MgXD","_score":1.0}
{"_index":"products","_source":{"name":"Product E","description":"Smart water bottle with hydration tracker"},"_id":"rfnakpYB_WRO-vG7MgXD","_score":1.0}

# Final Response of the Model
Here are the products listed in the OpenSearch index:

1. **Product A**: High-quality leather wallet
2. **Product B**: Eco-friendly bamboo toothbrush
3. **Product C**: Wireless noise-cancelling headphones
4. **Product D**: Portable external SSD 1TB
5. **Product E**: Smart water bottle with hydration tracker
```

The example above demonstrates how MCP enables agents to reason about data discovery and retrieval without requiring any custom code to integrate with OpenSearch. The agent autonomously determines which tools to use, how to sequence them, and how to process the results - as shown in its step-by-step interaction with the OpenSearch cluster.

#### Potential Applications:

As demonstrated in this example, OpenSearch MCP server simplifies development and unlocks possibilities for building sophisticated Agentic applications. One compelling use case would be creating a shopping assistant:

1. Store your product catalog in OpenSearch indices
2. Configure a LangChain agent to access this data via MCP Server
3. The agent can provide personalized shopping recommendations, answer product questions, compare features, and guide customers through their shopping journey

This approach eliminates the need to build custom integrations and leverages the robust search capabilities of OpenSearch combined with the intelligence of LLMs.

### Conclusion

The OpenSearch MCP Server represents a significant advancement in how AI agents can interact with your search and analytics data. By providing a standardized interface, it eliminates the need for custom integration code and allows for faster, more secure deployment of Agentic search and analytics applications.
Key benefits include:

* Unified Data Platform Integration: OpenSearch provides native capabilities for AI agents to seamlessly perform search, analytics and vector store capabilities.
* Enhanced Development Efficiency: standard interface across all tools; Elimination of custom integration code
* Enterprise-Grade Security: Integrated authentication through OpenSearch security; Consistent access control mechanisms
* Framework Flexibility: Compatible with leading AI frameworks like LangChain, Bedrock etc

While currently experimental, the MCP Server in OpenSearch 3.0 lays the groundwork for more sophisticated AI agent interactions with your valuable search data.

## Section 1.2: Standalone OpenSearch MCP server

While the solution described in Section 1.1 has the MCP server integrated within OpenSearch, we understand that this built-in functionality is only available from version 3.0. To address this limitation, we've developed a Standalone MCP Server that operates as a separate process outside the OpenSearch cluster.
This external server communicates with your OpenSearch cluster via REST API calls, allowing it to work with any version of OpenSearch. By positioning the MCP server outside the cluster architecture, it becomes completely version-agnostic, bringing all the benefits of MCP functionality to users regardless of which OpenSearch version they're running.

This new Standalone MCP Server will be officially released soon. But you can test the demo version [here](https://github.com/rithin-pullela-aws/opensearch-mcp-server)

You can find more details about the Standalone OpenSearch MCP server in the [RFC](https://github.com/opensearch-project/ml-commons/issues/3749)

**Key Benefits of the Standalone Approach**

* Runs Independently: Operates as a separate process outside the OpenSearch cluster
* Version Agnostic: Compatible with any OpenSearch version through REST API calls
* Independent Release Cycle: Updates don't depend on OpenSearch releases
* Flexible Communication: Supports both SSE and stdio protocols
* Simple Integration: Works with solutions like Claude Desktop which integrate with MCP servers

![Standalone MCP Server Architecture](/assets/media/blog-images/2025-05-05-Introducing-MCP-in-OpenSearch/standalone-mcp-architecture.png){: .img-fluid}

The standalone architecture follows a simple flow: the agent triggers a tool call, which is forwarded to the OpenSearch MCP server. The server then performs REST calls to the OpenSearch cluster, retrieves the required data, formats it, and returns the result back to the client.

### Quick Start Guide:

#### Installation

Install our demo PyPI package (official release coming soon):

```bash
pip install test-opensearch-mcp
```

#### Starting the MCP Server

* For stdio protocol (recommended for Claude desktop):

```bash
python -m mcp_server_opensearch
```

* For SSE protocol (runs on port 9900):

```bash
python -m mcp_server_opensearch --transport sse
```

#### Authentication Methods:

Configure your environment variables to connect the MCP server to your OpenSearch cluster:

* Basic Authentication

```bash
export OPENSEARCH_URL="<your_opensearch_domain_url>"
export OPENSEARCH_USERNAME="<your_opensearch_domain_username>"
export OPENSEARCH_PASSWORD="<your_opensearch_domain_password>"
```

* IAM Role Authentication

```bash
export OPENSEARCH_URL="<your_opensearch_domain_url>"
export AWS_REGION="<your_aws_region>"
export AWS_ACCESS_KEY="<your_aws_access_key>"
export AWS_SECRET_ACCESS_KEY="<your_aws_secret_access_key>"
export AWS_SESSION_TOKEN="<your_aws_session_token>"
```

#### Available Tools

Currently these 4 tools are available:

* list_indices: Lists all indices in OpenSearch.
* get_index_mapping: Gets the mapping for specified index.
* search_index: Searches an index using a query.
* get_shards: Gets information about shards in OpenSearch cluster.

We encourage the community to contribute and add more tools to this repo. You can contribute by commenting on our RFC document, raising issues on the GitHub repository, or submitting pull requests with new tools or improvements. For now, please use the temporary repository linked above until the official release is available.

### Claude desktop Integration:

Claude desktop natively supports MCP via stdio protocol, making integration straightforward:

#### Step1: Configure the Claude Desktop

* Go to Settings > Developer > Edit Config
* Add the OpenSearch MCP server in the claude_desktop_config.json file

```json
{
    "mcpServers": {
        "opensearch-mcp-server": {
            "command": "uvx",
            "args": [
                "test-opensearch-mcp"
            ],
            "env": {
                // Required
                "OPENSEARCH_URL": "<your_opensearch_domain_url>",

                // For Basic Authentication
                "OPENSEARCH_USERNAME": "<your_opensearch_domain_username>",
                "OPENSEARCH_PASSWORD": "<your_opensearch_domain_password>",

                // For IAM Role Authentication
                "AWS_REGION": "<your_aws_region>",
                "AWS_ACCESS_KEY": "<your_aws_access_key>",
                "AWS_SECRET_ACCESS_KEY": "<your_aws_secret_access_key>",
                "AWS_SESSION_TOKEN": "<your_aws_session_token>"
            }
        }
    }
}
```

#### Step 2: Chat away!

Open a new chat in Claude desktop, and you'll see the available OpenSearch tools appear in your chat window. You can immediately start asking questions about your OpenSearch data.

#### Demo
![Claude Desktop Demo](/assets/media/blog-images/2025-05-05-Introducing-MCP-in-OpenSearch/claude-desktop-demo.png){: .img-fluid}

### Conclusion

The Standalone OpenSearch MCP Server bridges the gap between advanced AI capabilities and all versions of OpenSearch. By providing a version-agnostic solution, organizations can leverage the power of AI agents with their existing OpenSearch deployments without upgrading. Whether you're using Claude, LangChain, or other agent frameworks, the standalone server offers a standardized way to connect AI models with your valuable search data.

Stay tuned for the official release, and we encourage you to test the demo version and provide feedback to help us improve this solution.

# Section 2: OpenSearch MCP Client

As part of our comprehensive MCP support, we're also adding MCP Client capabilities to the Agents within OpenSearch as an experimental feature. Starting with OpenSearch 3.0, the Conversational Agent and the newly introduced Plan, Execute, and Reflect agent can connect to external MCP servers and leverage their tools. Support for additional agent types will be available soon!

For detailed implementation steps, see our documentation: https://github.com/opensearch-project/documentation-website/blob/ab15e100326a390251241e197fc9391deb09b095/_ml-commons-plugin/agents-tools/mcp/mcp-connector.md

### Quick Start Guide:

#### Step1: Create an MCP Connector

An MCP Connector stores connection details and credentials for your MCP server:

```json
POST /_plugins/_ml/connectors/_create
{
  "name":        "My MCP Connector",
  "description": "Connects to the external MCP server for weather tools",
  "version":     1,
  "protocol":    "mcp_sse",
  "url":         "https://my-mcp-server.domain.com",
  "credential": {
    "mcp_server_key": "THE_MCP_SERVER_API_KEY"
  },
  "headers": {
    "Authorization": "Bearer ${credential.mcp_server_key}"
  }
}
```

#### Step 2: Register a Large Language Model

```json
POST /_plugins/_ml/models/_register
{
  "name": "My OpenAI model: gpt-4",
  "function_name": "remote",
  "description": "Test model registration (this example uses OpenAI, but you can register any model)",
  "connector": {
    "name": "My OpenAI Connector: gpt-4",
    "description": "Connector for the OpenAI chat model",
    "version": 1,
    "protocol": "http",
    "parameters": {
      "model": "gpt-4o"
    },
    "credential": {
      "openAI_key": "<YOUR_API_KEY>"
    },
    "actions": [
      {
        "action_type": "predict",
        "method": "POST",
        "url": "https://api.openai.com/v1/chat/completions",
        "headers": {
          "Authorization": "Bearer ${credential.openAI_key}"
        },
        "request_body": "{ \"model\": \"${parameters.model}\", \"messages\": [{\"role\":\"developer\",\"content\":\"${parameters.system_instruction}\"},${parameters._chat_history:-}{\"role\":\"user\",\"content\":\"${parameters.prompt}\"}${parameters._interactions:-}], \"tools\": [${parameters._tools:-}],\"parallel_tool_calls\":${parameters.parallel_tool_calls},\"tool_choice\": \"${parameters.tool_choice}\" }"
      }
    ]
  }
}
```

#### Step 3: Register an agent for accessing MCP tools

To enable external MCP tools, include one or more MCP connectors in your agent's configuration.

Each connector must specify the following parameters in the `parameters.mcp_connectors` array.

| Parameter | Data type | Required | Description | 
|:--- |:--- |:--- |:--- |
| `mcp_connector_id` | String | Yes | The connector ID of the MCP connector. | 
| `tool_filters` | Array | No | An array of Java-style regular expressions that specify which tools from the MCP server to make available to the agent. If omitted or set to an empty array, all tools exposed by the connector will be available. Use `^/$` anchors or literal strings to precisely match tool names. For example, `^get_forecast` matches any tool starting with get_forecast, while `search_indices` matches only `search_indices`.|

In this example, we'll register a conversational agent using the connector ID created in Step 1 and model ID from step 2

```json
POST /_plugins/_ml/agents/_register
{
  "name":        "Weather & Search Bot",
  "type":        "conversational",
  "description": "Uses MCP to fetch forecasts and OpenSearch indices",
  "llm": {
    "model_id": "<MODEL_ID_FROM_STEP_2>",
    "parameters": {
      "max_iteration": 5,
      "system_instruction": "You are a helpful assistant.",
      "prompt": "${parameters.question}"
    }
  },
  "memory": {
    "type": "conversation_index"
  },
  "parameters": {
    "_llm_interface": "openai/v1/chat/completions",
    "mcp_connectors": [
      {
        "mcp_connector_id": "<MCP_CONNECTOR_ID_FROM_STEP_1`>",
        "tool_filters": [
          "^get_forecast",    
          "get_alerts"    
        ]
      }
    ]
  },
  "tools": [
    { "type": "ListIndexTool" },
    { "type": "SearchIndexTool" }
  ],
  "app_type": "os_chat"
}
```

#### Step 4: Execute the Agent

Invoke the registered agent by calling the Execute Agent API:

```json
POST /_plugins/_ml/agents/<Agent_ID>/_execute
{
  "parameters": {
    "question": "Any weather alerts in Washington",
    "verbose": true
  }
}
```

The agent uses both OpenSearch tools specified in the tools array and selected tools from the MCP server based on your tool filters. In this example, since we're asking about weather alerts, it uses the tool from the MCP server:

```json
{
    "inference_results": [
        {
            "output": [
                {
                    "name": "memory_id",
                    "result": "MfiZfpYBjoQOEoSH13wj"
                },
                {
                    "name": "parent_interaction_id",
                    "result": "MviZfpYBjoQOEoSH13xC"
                },
                {
                    "name": "response",
                    "result": "{\"id\":\"chatcmpl-BRRcdxVjkrKG7HjkVWZVwueJSEjgd\",\"object\":\"chat.completion\",\"created\":1.745880735E9,\"model\":\"gpt-4o-2024-08-06\",\"choices\":[{\"index\":0.0,\"message\":{\"role\":\"assistant\",\"tool_calls\":[{\"id\":\"call_yWg0wk4mfE2v8ARebupfbJ87\",\"type\":\"function\",\"function\":{\"name\":\"get_alerts\",\"arguments\":\"{\\\"state\\\":\\\"WA\\\"}\"}}],\"annotations\":[]},\"finish_reason\":\"tool_calls\"}],\"usage\":{\"prompt_tokens\":201.0,\"completion_tokens\":16.0,\"total_tokens\":217.0,\"prompt_tokens_details\":{\"cached_tokens\":0.0,\"audio_tokens\":0.0},\"completion_tokens_details\":{\"reasoning_tokens\":0.0,\"audio_tokens\":0.0,\"accepted_prediction_tokens\":0.0,\"rejected_prediction_tokens\":0.0}},\"service_tier\":\"default\",\"system_fingerprint\":\"fp_f5bdcc3276\"}"
                },
                {
                    "name": "response",
                    "result": "[{\"text\":\"\\nEvent: Wind Advisory\\nArea: Kittitas Valley\\nSeverity: Moderate\\nDescription: * WHAT...Northwest winds 25 to 35 mph with gusts up to 45 mph\\nexpected.\\n\\n* WHERE...Kittitas Valley.\\n\\n* WHEN...From 2 PM to 8 PM PDT Tuesday.\\n\\n* IMPACTS...Gusty winds will blow around unsecured objects. Tree\\nlimbs could be blown down and a few power outages may result.\\nInstructions: Winds this strong can make driving difficult, especially for high\\nprofile vehicles. Use extra caution.\\n\"}]"
                },
                {
                    "name": "response",
                    "result": "There is a Wind Advisory for the Kittitas Valley in Washington. Here are the details:\n\n- **Event:** Wind Advisory\n- **Area:** Kittitas Valley\n- **Severity:** Moderate\n- **Description:** Northwest winds 25 to 35 mph with gusts up to 45 mph expected.\n- **When:** From 2 PM to 8 PM PDT Tuesday.\n- **Impacts:** Gusty winds may blow around unsecured objects, potentially causing tree limbs to fall, and resulting in a few power outages.\n\n**Instructions:** These strong winds can make driving difficult, especially for high-profile vehicles. Use extra caution if you are traveling in the area."
                }
            ]
        }
    ]
}
```

This demonstrates that our agent is able to successfully use the tools from the MCP server.

### End-to-End Example: Cross-Cluster Data Access

This example demonstrates a practical use case: connecting to external MCP servers to access data across multiple OpenSearch clusters.

#### Scenario

Consider two OpenSearch clusters:

* Cluster A contains product catalog data
* Cluster B contains product ratings data

We want an agent that can answer questions requiring data from both clusters.

#### Data setup

Cluster A - Products Index:

```json
{ "product_id": "11111111-aaaa-aaaa-aaaa-111111111111", "name": "car toy", "description": "f1 car toy" }
{ "product_id": "22222222-bbbb-bbbb-bbbb-222222222222", "name": "bike toy", "description": "motogp bike toy" }
{ "product_id": "33333333-cccc-cccc-cccc-333333333333", "name": "Samsung earphones", "description": "buds 2" }
{ "product_id": "44444444-dddd-dddd-dddd-444444444444", "name": "Apple earphones", "description": "Airpods 2" }
```

Cluster B - Product_Ratings Index:

```json
{ "product_id": "11111111-aaaa-aaaa-aaaa-111111111111", "Rating": 5 }
{ "product_id": "22222222-bbbb-bbbb-bbbb-222222222222", "Rating": 4 }
{ "product_id": "33333333-cccc-cccc-cccc-333333333333", "Rating": 5 }
{ "product_id": "44444444-dddd-dddd-dddd-444444444444", "Rating": 4 }
```

#### Tools

Tools Available in Cluster A:

* ListIndexTool_ClusterA: Lists all indices in OpenSearch Cluster A
* IndexMappingTool_ClusterA: Retrieves index mapping information for Cluster A indices
* SearchIndexTool_ClusterA: Searches indices in Cluster A using query DSL

Tools Available via MCP from Cluster B:

* ListIndexTool_ClusterB: Lists all indices in OpenSearch Cluster B
* IndexMappingTool_ClusterB: Retrieves index mapping information for Cluster B indices
* SearchIndexTool_ClusterB: Searches indices in Cluster B using query DSL

#### Agent Execution

Using the Plan, Execute, and Reflect agent, we asked:

```
Give toy products ratings in ascending order. You have tools which can access 2 clusters A and B. Use data from both the clusters to give ratings in this format: product id, name, rating.
```
Response:
```
The toy products in ascending order of ratings are:
`22222222-bbbb-bbbb-bbbb-222222222222` bike toy 4.0
`11111111-aaaa-aaaa-aaaa-111111111111` car toy 5.0
```
#### Agent's Reasoning Process

Identified product data source:

* Listed all indices in Cluster A to identify the products index
* Used a search query to find toy products:

```json
{
  "index": "products",
  "query": {
    "query": {
      "bool": {
        "should": [
          {"match": {"description": "toy"}},
          {"match": {"name": "toy"}}
        ]
      }
    }
  },
  "size": 10
}
```

Located rating data:

* Listed all indices in Cluster B to find the product_ratings index
* Examined the index mapping to understand the data structure
* Determined that product_id connects both datasets

Retrieved ratings:

* Used SearchIndexTool_ClusterB to query ratings for the specific product IDs
* Found that car toy (ID `11111111-aaaa-aaaa-aaaa-111111111111`) had rating 5
* Found that bike toy (ID `22222222-bbbb-bbbb-bbbb-222222222222`) had rating 4

Sorted and presented results:

* Organized the data in ascending order by rating
* Formatted output as requested: product ID, name, rating

This example demonstrates how MCP allows agents to seamlessly work across multiple data sources, combining information from different OpenSearch clusters to deliver comprehensive results.

### Conclusion

The OpenSearch MCP Client functionality allows OpenSearch agents to connect to external tool providers through the MCP protocol, significantly expanding their capabilities beyond native OpenSearch functions. Rather than being limited to built-in tools, agents can now leverage specialized external services like weather forecasts, translation APIs, document processing tools, and more. This interoperability helps position OpenSearch agents as versatile orchestrators that can coordinate across diverse systems and data sources. As this experimental feature matures, we anticipate a growing ecosystem of MCP-compatible tools that will make OpenSearch agents increasingly powerful for solving complex, multi-step tasks. We invite you to explore these capabilities in OpenSearch 3.0 and contribute to the development of this emerging standard.
