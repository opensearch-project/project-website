---
layout: post
title: "Hands-On with the Agentic Search UI: Use Cases and Examples in OpenSearch"
authors:
  - ohltyler
  - kazabdu
  - rithinp
  - jpalis
  - kolchfa

date: 2026-01-01
has_science_table: true
categories:
  - technical-posts
meta_keywords: agents, tools, agentic, search, LLM, NLQ
meta_description: OpenSearch 3.4's new agentic search UI enables natural language queries through configurable agents.
---

We are excited to announce an all-new agentic search user experience available in OpenSearch 3.4. This UI provides a streamlined interface for configuring agents, testing them with natural language queries, and exporting settings for integration into your downstream applications.

## What is agentic search?

Agentic Search transforms how you interact with data by enabling natural language queries instead of complex search syntax. An intelligent agent interprets your question, automatically plans the search, and returns relevant results with complete transparency into its decision-making process. For a detailed overview of agentic search capabilities and architecture, visit the [documentation](https://docs.opensearch.org/latest/vector-search/ai-search/agentic-search/index/) or [blog](https://opensearch.org/blog/introducing-agentic-search-in-opensearch-transforming-data-interaction-through-natural-language/).

## Using the UI

To access the UI, navigate to **OpenSearch Dashboards > OpenSearch Plugins > AI Search Flows** and create a new Agentic Search workflow. The interface has two main sections: configure agents on the left, test searches on the right. For complete details on UI structure, agent types, available tools, and configuration options, refer to the [documentation](https://docs.opensearch.org/latest/vector-search/ai-search/building-agentic-search-flows/).

## Examples

Next, let's explore practical use cases. Both of the examples below have the following resources preconfigured:

- Deployed Bedrock Claude 4.5 agent. For details on how to deploy this model in your environment, and to view other suggested models compatible with agentic search, check out the [documentation](https://docs.opensearch.org/latest/vector-search/ai-search/agentic-search/index/).
- Connector to an MCP server containing order history based on customer IDs.
- Index `demo_amazon_fashion`. This was created using the MIT-licensed [Fashion Products Images Dataset](https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-dataset) with added synthetic values for price and ratings. Any index containing product data will be suitable.

## E-commerce conversational search

Conversational agents enable users to ask questions in natural language and refine their search through follow-up questions, with the agent maintaining context across the conversation to progressively narrow results and find exactly what they're looking for. Let's build an application that demonstrates this capability.

### Step 1: Create an agent

Create a conversational agent:

1. Select **Create agent**.
2. Provide a name: `My conversational agent`.
3. Select the model: `Bedrock Claude 4.5`.
4. Enable the following tools: **Query Planning**, **Search Index**, **List Index**, and **Index Mapping**.
5. Select **Create**.

![Conversational agent](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-1.png)

### Step 2: Run agentic searches

Now let's test the agent:

1. Select the index: `demo_amazon_fashion`.
2. Enter a search query. Since this data contains miscellaneous fashion products, let's try `Blue shades for my dad`.
3. Select **Search**.

You'll see the agent-generated query DSL and search results. It looks like all are showing men's blue sunglasses. Great!

![Generated query](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-2-gen-query.png)
![Results](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-3-results.png)

Review the agent summary to understand its decision-making process.

![Summary](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-4-agent-summary.png)

Now ask a follow-up question to refine your search:

1. At the top, next to **Query**, select **Continue conversation**.
2. Update the query to `Do you have any black ones from Ray-Ban?`.
3. Select **Search**.

The agent maintains context from your original query while applying new constraints. The results now show men's black sunglasses specifically from Ray-Ban. Click on **View more** to see the full details for a result hit.

![Ray-bans](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-5-ray-ban.png)

You can try more queries, and the agent will continuously reference and update the conversational history to maintain context. To remove the history and start a new conversation, select **Clear conversation**.

### Step 3: Tune your agent

Searches taking too long? Not getting the results you were expecting? Fortunately, there are plenty of ways to fine-tune your agents and iteratively test different configurations.

First, let's try swapping out the model for the latest one from OpenAI—GPT-5. This model offers enhanced reasoning capabilities and improved understanding of complex, multi-faceted user queries. After the model is deployed, let's continue:

1. Under **Configure Agent**, select the **Model** dropdown.
2. Select `OpenAI GPT-5`.
3. Select **Update agent**.
4. Under **Agentic Search**, select **Search** to execute a new search with the updated agent and see how it does. Below is an example running the query `Men's blue shirts` using the new model.

![GPT hits](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-6-gpt.png)

Next, we can try updating the available tools the model has. To enhance the agent's flexibility and enable access to real-time information, let's enable the Web Search tool.

1. Under **Configure Agent > Tools > Web Search**, select **Enable**. The tool form will be expanded automatically.
2. Under **Engine**, enter `duckduckgo`—this is the simplest option and doesn't require additional permissions or configuration.
3. Select **Update agent**.
4. Under **Agentic Search**, select **Search** to execute a new search with the updated agent. The agent can now handle questions that require information beyond the scope of your indexed dataset.

Let's try a new search query that would require fetching external information and see how it performs. Type `Shoes from the brand Serena Williams wears` and select **Search**.

![Web query](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-7-web-query.png)
![Web results](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-8-web-results.png)

Looking at the results, we can see the agent generated a query filtering on the brand Nike.

Looking at the agent summary, we can see it first searched the web to find Serena Williams' brand Nike to use in the generated query, and finally returned Nike shoes.

![Nike](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-9-web-summary.png)

Next, let's try integrating with the sample MCP server to let the agent view the user's order history for a more customized, personalized search experience. This server has a tool `simple_get_order_history` we can use to return the order history details for the current user.

1. Under **Configure Agent > MCP Servers**, select **Add MCP server**.
2. Under the **MCP Server** dropdown, select `Customer Order History MCP Server`.
3. Under **Tool filters**, adding `simple_get_order_history` will only allow this tool from the server available to the agent.
4. Select **Update agent**.

![MCP](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-10-mcp.png)

Now try searching for some athletic shorts, leveraging the order history to find similar products and brands. Update the query to `Athletic shorts similar to my order history`. The results look to show athletic shorts from Adidas and Nike.

![Query](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-11-query.png)

Looking at the generated query and the agent summary, we can see the agent determined that Nike and Adidas brands were present in the order history, and used them as filters in the DSL query.

![Results](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-12-results.png)
![Summary](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-13-summary.png)

### Step 4: Exporting your configuration

Once you've completed your testing and are ready to integrate your configuration into your downstream application, select **Export** in the top-right-hand corner. This will give you more details on the underlying search pipelines powering agentic search, and how you can fit it into your new or existing system.

![Pipeline](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-17-pipeline.png)
![Query](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-18-query.png)

## Fast product filtering

Flow agents provide rapid, single-query search capabilities, executing significantly faster than conversational agents when multi-turn conversations or complex reasoning aren't needed. Let's build an application that leverages this efficiency.

### Step 1: Create an agent

Create a flow agent:

1. Select **Create agent**.
2. Provide a name: `My flow agent`.
3. Change the agent type to **Flow**.
4. Under the **Query Planning** tool, select `Bedrock Claude 4.5`.
5. Select **Create**.

![Flow](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-14-flow.png)

### Step 2: Run agentic searches

Test the agent with a direct product search:

1. Select the index: `demo_amazon_fashion`.
2. Enter a search query. Let's try `Women's running shoes under $100`.
3. Select **Search**.

The agent generates an optimized query DSL and executes the search, returning women's running shoes under $100.

![Flow query](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-15-flow-query.png)
![Flow results](/assets/media/blog-images/2026-01-01-introducing-agentic-search-ui/blog-16-flow-results.png)

### Step 3: Tune your agent

Similar to the previous example, you can see how your agent performs using different models for query generation.

## Next steps

Ready to transform your search experience? Start with the UI to explore its capabilities, then leverage these insights to build powerful production applications with agentic search. Check out these helpful links for more details and examples.

- Try out the feature today using pre-configured agents on the ML playground: [https://ml.playground.opensearch.org/app/opensearch-flow#/workflows](https://ml.playground.opensearch.org/app/opensearch-flow#/workflows)
- Agentic Search UI documentation: [https://docs.opensearch.org/latest/vector-search/ai-search/building-agentic-search-flows/](https://docs.opensearch.org/latest/vector-search/ai-search/building-agentic-search-flows/)
- Agentic Search documentation: [https://docs.opensearch.org/latest/vector-search/ai-search/agentic-search/index/](https://docs.opensearch.org/latest/vector-search/ai-search/agentic-search/index/)
- Agentic Search feature blog: [https://opensearch.org/blog/introducing-agentic-search-in-opensearch-transforming-data-interaction-through-natural-language/](https://opensearch.org/blog/introducing-agentic-search-in-opensearch-transforming-data-interaction-through-natural-language/)
