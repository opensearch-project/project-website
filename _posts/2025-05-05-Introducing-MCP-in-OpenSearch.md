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
[The Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) is a standardized communication framework that solves the integration complexity between AI agents and external tools. Without MCP, developers face significant technical overhead as each tool integration requires implementing custom code for specific API endpoints, parameter schemas, response formats, and error handling patterns. This fragmentation creates maintenance challenges and slows development velocity. MCP addresses these issues by providing a unified protocol layer with consistent interfaces for tool discovery, parameter validation, response formatting, and error handling. The protocol establishes a contract between AI applications and tool providers' servers, enabling seamless interoperability through standardized JSON payloads and well-defined behavioral expectations. This standardization means developers can integrate new tools with minimal code changes, as the agent only needs to communicate with MCP's consistent interface rather than learning each tool's proprietary API structure.

This diagram shows the difference:

On the left, the agent connects directly to each tool, requiring custom integration for every connection.

On the right, LLM uses Model Context Protocol to connect with the tools exposed. MCP serves as an intermediary layer, simplifying communication and creating a cleaner, more scalable architecture.

![MCP Architecture Comparison](/assets/media/blog-images/2025-05-05-Introducing-MCP-in-OpenSearch/MCP-Before-After.png){: .img-fluid}

# Section 1: OpenSearch MCP Server

## Section 1.1: Built in MCP Server

OpenSearch 3.0 ships an experimental MCP Server inside the ML Commons plugin. The server publishes a core set of tools as first‑class MCP endpoints over a streaming SSE interface (`/_plugins/_ml/mcp/sse`). An LLM agent —for example, LangChain's ReAct agent—can simply connect and discover what the server offers, and then invoke the tools with JSON arguments without you writing any adapter code or opening up ad-hoc REST endpoints.

The OpenSearch MCP Server solves the last-mile problem of giving agents safe and real-time access to your search data. In practice this means that every index in the cluster - your product catalog, logs, or vector store can all be queried, summarized, or cross-referenced by whatever agent framework you prefer via the MCP server.

![MCP Server Architecture](/assets/media/blog-images/2025-05-05-Introducing-MCP-in-OpenSearch/mcp-server-architecture.png){: .img-fluid}

For comprehensive API documentation and implementation details, visit the [MCP Server APIs documentation](https://docs.opensearch.org/docs/latest/ml-commons-plugin/api/mcp-server-apis/index/).

### Quick Start:

To setup the MCP server inside OpenSearch, follow these steps:

**Step 1:** Enable the Experimental Streaming feature to support SSE:

Follow the steps in this [document](https://docs.opensearch.org/docs/latest/install-and-configure/configuring-opensearch/network-settings/#selecting-the-transport) to install the `transport-reactor-netty4` plugin and enable Experimental Streaming.

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

```json
POST /_plugins/_ml/mcp/tools/_register
{
    "tools": [
        {
            "type": "ListIndexTool"
        },
        {
            "type": "SearchIndexTool",
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
                                "description": "OpenSearch search index query. You need to get index mapping to write correct search query. It must be a valid OpenSearch query. Valid value:
{\"query\":{\"match\":{\"population_description\":\"seattle 2023 population\"}},\"size\":2,\"_source\":\"population_description\"}
Invalid value: 
{\"match\":{\"population_description\":\"seattle 2023 population\"}}
The value is invalid because the match not wrapped by \"query\".",
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

**Important Endpoints**

* MCP server base url: `/_plugins/_ml/mcp`
* Message endpoint used internally by the MCP Client: `/_plugins/_ml/mcp/sse/message?sessionId=...`

Note: For Python MCP Clients, use this URL to establish the connection: `/_plugins/_ml/mcp/sse?append_to_base_url=true`

#### Available tools:

OpenSearch provides a comprehensive suite of tools that can be registered with OpenSearch MCP server. You can find the list of supported tools [here](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/tools/index/).

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

The short script demonstrates how to initialize a LangChain agent, discovers available MCP tools, and asks the agent to list all indices in the cluster. While this example uses gpt-4o, the script is compatible with any LLM that integrates with LangChain and tool calling.

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

When executed with a sample "products" index in OpenSearch, the agent demonstrates intelligent tool use. First, it calls `ListIndexTool` to discover available indices, then uses `SearchIndexTool` on the products index to retrieve and present the product information in a structured format. This workflow shows how LLMs can autonomously navigate OpenSearch data through MCP tools.

```
> Entering new AgentExecutor chain...
Invoking: `ListIndexTool` with `{'indices': []}`
# Tool finds available indices including "products" index

Invoking: `SearchIndexTool` with `{'input': {'index': 'products', 'query': {'query': {'match_all': {}}}}}`
# Tool returns product data

# Final Response of the Model
Here are the products listed in the OpenSearch index:
1. **Product A**: High-quality leather wallet
2. **Product B**: Eco-friendly bamboo toothbrush
...
```
### Conclusion

The OpenSearch MCP Server represents a significant advancement in how AI agents can interact with your search and analytics data. By providing a standardized interface, it eliminates the need for custom integration code and allows for faster, more secure deployment of Agentic search and analytics applications.
Key benefits include:

* **Unified Data Platform Integration**: OpenSearch provides native capabilities for AI agents to seamlessly perform search, analytics and vector store capabilities.
* **Streamlined Infrastructure**: Built directly into OpenSearch, eliminating separate MCP server deployment, hosting, and maintenance requirements.
* **Enterprise-Grade Security**: Integrated authentication through OpenSearch security; Consistent access control mechanisms.
* **Enhanced Development Efficiency**: Standard interface across all tools; Elimination of custom integration code.
* **Framework Flexibility**: Compatible with leading AI frameworks like LangChain, Bedrock etc.

While currently experimental, the MCP Server in OpenSearch 3.0 lays the groundwork for more sophisticated AI agent interactions with your valuable search data.

## Section 1.2: Standalone OpenSearch MCP server

Built-in MCP server in OpenSearch, described in section 1.1, is only available from version 3.0. To use MCP with older versions, you can run the Standalone MCP Server outside OpenSearch cluster.

The standalone architecture follows a simple flow: the agent triggers a tool call, which is forwarded to the OpenSearch MCP server. The server then performs REST calls to the OpenSearch cluster, retrieves the required data, formats it, and returns the result back to the client.

![Standalone MCP Server Architecture](/assets/media/blog-images/2025-05-05-Introducing-MCP-in-OpenSearch/standalone-mcp-architecture.png){: .img-fluid}

This new Standalone MCP Server will be officially released soon. But you can test the demo version [here](https://github.com/rithin-pullela-aws/opensearch-mcp-server)

You can find more details about the Standalone OpenSearch MCP server in the [RFC](https://github.com/opensearch-project/ml-commons/issues/3749)

Key Benefits of the Standalone Approach

* Runs Independently: Operates as a separate process outside the OpenSearch cluster
* Independent Release Cycle: Updates don't depend on OpenSearch releases
* Flexible Communication: Supports both SSE and stdio protocols
* Simple Integration: Works with solutions like Claude Desktop which integrate with MCP servers
* Broad Version Compatibility: Works with various OpenSearch versions through REST API calls

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

* ListIndexTool: Lists all indices in OpenSearch.
* IndexMappingTool: Retrieves index mapping and setting information for an index in OpenSearch.
* SearchIndexTool: Searches an index using a query in OpenSearch.
* GetShardsTool: Gets information about shards in OpenSearch.

For full tool documentation, see the [available tools guide](https://github.com/rithin-pullela-aws/opensearch-mcp-server/blob/main/README.md#available-tools).

We welcome community contributions! Please review our [developer guide](https://github.com/rithin-pullela-aws/opensearch-mcp-server/blob/main/DEVELOPER_GUIDE.md) to learn how to add new tools or enhance existing ones.

### Claude desktop Integration:

Claude desktop natively supports MCP via stdio protocol, making integration straightforward:

**Step1: Configure the Claude Desktop**

* Go to `Settings > Developer > Edit Config`
* Add the OpenSearch MCP server in the `claude_desktop_config.json` file

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

**Step 2: Chat away!**

Open a new chat in Claude desktop, and you'll see the available OpenSearch tools appear in your chat window. You can immediately start asking questions about your OpenSearch data.

**Demo**
![Claude Desktop Demo](/assets/media/blog-images/2025-05-05-Introducing-MCP-in-OpenSearch/claude-desktop-demo.png){: .img-fluid}

### Conclusion

The Standalone OpenSearch MCP Server bridges the gap between advanced AI capabilities and earlier versions of OpenSearch. Organizations can leverage the power of AI agents with their existing OpenSearch deployments without upgrading to version 3.0. Whether you're using Claude, LangChain, or other agent frameworks, the standalone server offers a standardized way to connect AI models with your valuable search data.

The current implementation provides access to core search functionality, with future plans to enhance version-specific tool compatibility. We invite you to explore the demo version and share your feedback as we prepare for the official release. Your input will help shape this solution to better meet the community's needs.

# Section 2: OpenSearch MCP Client

As part of our comprehensive MCP support, we're also adding MCP Client capabilities to the Agents within OpenSearch as an experimental feature. Starting with OpenSearch 3.0, the [Conversational Agent](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/agents/conversational/) and the newly introduced [Plan, Execute, and Reflect agent](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/agents/plan-execute-reflect/) can connect to external MCP servers and leverage their tools. Support for additional agent types will be available soon!

### Quick Start Guide:

While the [full documentation](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/mcp/mcp-connector/) provides detailed step-by-step instructions, here's a simplified view of the process:

**Step 1: Create an MCP Connector** - This stores connection details to your MCP server

**Step 2: Register a Large Language Model** - This powers your agent's reasoning capabilities

**Step 3: Configure an Agent with MCP Tools** - Here's where the magic happens:
```json
 "parameters": {
    "_llm_interface": "openai/v1/chat/completions",
    "mcp_connectors": [
        {
        "mcp_connector_id": "<YOUR_CONNECTOR_ID>",
        "tool_filters": [
            "^get_forecast",
            "get_alerts"
        ]
        }
    ]
  }
  ```

The tool_filters parameter is particularly powerful - it allows you to precisely control which external tools your agent can access. You can use Java-style regular expressions to:
  * Allow all tools from the MCP server (empty array)
  * Select tools by exact name (`search_indices`)
  * Select tools by regular expression pattern (`^get_forecast` for all tools starting with "`get_forecast`")

**Step 4: Execute the Agent** - Invoke the registered agent by calling the Execute Agent API

The agent uses both OpenSearch tools specified in the tools array and selected tools from the MCP server based on your tool filters.

### End-to-End Example: Cross-Cluster Data Access

This example demonstrates how MCP enables agents to access data across multiple OpenSearch clusters.

**Scenario:**

* Cluster A contains product catalog data in a 'products' index
* Cluster B contains product ratings data in a 'product_ratings' index
* Goal: Enable an agent in Cluster A to answer questions requiring data from both clusters

**Setup:**

* Dataset: Mock product data from [here](https://github.com/rithin-pullela-aws/opensearch-mock-data)
* Cluster A tools: `ListIndexTool_ClusterA`, `IndexMappingTool_ClusterA`, `SearchIndexTool_ClusterA`
* Cluster B tools (accessed via MCP): `ListIndexTool_ClusterB`, `IndexMappingTool_ClusterB`, `SearchIndexTool_ClusterB`

**Agent Execution:**

Using the [Plan, Execute, and Reflect agent](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/agents/plan-execute-reflect/), we asked the question:

```json
You have access to data from 2 OpenSearch clusters, Cluster A and Cluster B. Using data from these clusters, answer me this: List me 10 kid toy products with high rating.
```

**Response of the Plan, Execute, and Reflect agent with detailed steps breakdown**
```
# Top 10 Kid Toy Products with High Ratings


Based on my analysis of data from OpenSearch Clusters A and B, I've identified the following top-rated toy products for children:

1. **Fisher-Price Laugh & Learn Smart Stages Puppy (10/10)**
   - Interactive plush toy with 75+ songs, sounds, and phrases
   - Three learning levels that adapt as baby grows
   - Age range: 6-36 months

2. **Melissa & Doug Farm Animals Sound Puzzle (10/10)**
   - Eight-piece wooden puzzle with realistic animal sounds
   - Educational toy developing matching and listening skills
   - Age range: 2+ years

3. **American Girl Bitty Baby Doll (9/10)**
   - 15\" baby doll with blonde hair and blue eyes
   - Includes Bitty Bear plush toy and starter outfit
   - Age range: 3+ years

4. **Ravensburger Jungle Animals 100-Piece Puzzle (9/10)**
   - High-quality cardboard puzzle with linen finish
   - Colorful jungle theme with 100 pieces
   - Age range: 6+ years

5. **Dora the Explorer Toddler Backpack (9/10)**
   - Mini backpack designed for carrying toys and supplies
   - Features Dora and Boots Fairground Adventure theme
   - Age range: 3-5 years

6. 
...

## Analysis Methodology

I conducted this analysis through the following steps:

1. First, I identified all product-related indices in both clusters:
   - Cluster A: 'products' index containing product descriptions
   - Cluster B: 'product_ratings' index containing product ratings

2. I examined the index structures using mapping tools:
   - The products index contains product_id and text fields
   - The product_ratings index contains product_id and rating fields

3. I executed multiple targeted searches to find toy products using keywords like:
   - toy, game, puzzle, stuffed, doll, action figure, board game, LEGO
   - Additional searches for brands like Fisher-Price, Melissa & Doug, etc.

4. I cross-referenced the product IDs of toy items with their ratings from Cluster B

5. I compiled and sorted the results by rating to identify the top 10 highest-rated kid toy products

The final list includes a diverse selection of toys across multiple categories including educational toys, plush toys, puzzles, dolls, building sets, vehicles, action toys, and board games. The two products with perfect 10/10 ratings (Fisher-Price Laugh & Learn Smart Stages Puppy and Melissa & Doug Farm Animals Sound Puzzle) are both educational toys designed for younger children.

```

### Conclusion

The OpenSearch MCP Client functionality allows OpenSearch agents to connect to external tool providers through the MCP protocol, significantly expanding their capabilities beyond native OpenSearch functions. Rather than being limited to built-in tools, agents can now leverage specialized external services like weather forecasts, translation APIs, document processing tools, and more. This interoperability helps position OpenSearch agents as versatile orchestrators that can coordinate across diverse systems and data sources. As this experimental feature matures, we anticipate a growing ecosystem of MCP-compatible tools that will make OpenSearch agents increasingly powerful for solving complex, multi-step tasks. We invite you to explore these capabilities in OpenSearch 3.0 and contribute to the development of this emerging standard.
