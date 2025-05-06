---
layout: post
title: "OpenSearch 3.0: Observability meets Agentic AI"
authors:
  - pyek-bot
  - ylwu
date: 2025-05-05
categories:
  - technical-posts
meta_keywords: Plan and Execute, OpenSearch, AI, Agents, Function calling, Claude
meta_description: Learn about OpenSearch 3.0's Agent Framework Enhancements and utilize the plan-execute-reflect agent to resolve an observability use case
---
OpenSearch 3.0 introduces the Plan–Execute–Reflect agent—a powerful new capability that breaks down complex problems, selects and executes tools autonomously, and adapts through reflection. In this post, we’ll show how this agent automates root cause analysis in observability workflows.

## Introduction

In the era of AI, agents have emerged as a powerful way to make Large Language Models (LLMs) more practical and useful. By connecting LLMs with specific tools and capabilities, agents can transform natural language requests into concrete actions and meaningful results. 

OpenSearch ML Commons has been at the forefront of this transformation, providing a robust agent framework that allows users to orchestrate tools and automate workflows. With OpenSearch 3.0, we're taking a significant leap forward by introducing the Plan-Execute-Reflect agent designed for complex, multi-step reasoning tasks.

## What's new in OpenSearch 3.0's agent framework?

* A Plan-Execute-Reflect agent for executing complex multi-step tasks.
* Native MCP (Model Coordination Protocol) support for seamless integration with external AI tools.
* Enhanced tool selection and execution capabilities.
* Asynchronous execution support for long-running tasks.

In this blog, we'll showcase the power of this new agent through a practical observability use case: Automatically investigating a service failure in a microservices application. 

You'll see how the agent can:

* Break down a complex investigation into logical steps
* Automatically select and use appropriate tools
* Analyze multiple data sources (logs, traces, metrics)
* Provide clear, actionable insights

Whether you're managing cloud infrastructure, developing applications, or building AI-powered solutions, this new capability can help streamline your workflows and enhance your problem-solving capabilities. Let's dive in and see how it works.

Now that we’ve seen the key features in 3.0, let’s dive into the capabilities and workflow of the Plan–Execute–Reflect agent.

## What is the Plan–Execute–And-Reflect Agent?

The Plan–Execute–Reflect agent is a long-running agent designed for complex, multi-step tasks. This agent is capable of breaking down a complex task into a series of simple steps (plan), executing each step and optimizing its plan based on intermediate step results. It uses a separate executor agent for the execution of sub steps.

Key features: 

* Reflects on intermediate results to optimize the original plan.
* Allows using separate models for planning and execution by providing your own executor agent during registration. By default, a [conversational](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/agents/conversational/) agent is used as the executor.
* Executes asynchronously, allowing it to handle long-running workflows via background execution (async=true).
* Acts as an MCP client that can connect to multiple MCP servers.
* Relies on function calling for tool execution thereby standardizing communication between the tool and model.
* Supports custom prompts. This allows users to tune this agent for specific use cases. Example: Observability Agent, Research Agent (via WebSearchTool), etc.

The diagram below illustrates the execution flow of the Plan–Execute–Reflect agent.

![PlanExecuteReflect Agent Execution Workflow](/assets/media/blog-images/2025-05-05-plan-execute-agent/per-agent-execution-workflow.png){: .img-fluid}

The workflow is as follows:

1. User provides the Plan-Execute-Reflect agent with a task.
2. Plan-Execute-Reflect agent forwards the task to the planner LLM
3. LLM returns with a plan (a series of steps to execute)
4. Plan-Execute-Reflect forwards the first step of the plan to the executor agent
5. Executor agent executes the steps and returns the response
6. Plan-Execute-Reflect agent forwards the result of executed step and the original plan to the planner-LLM
7. Planner-LLM either returns the final result or a refined plan.
8. If the planner-LLM returns the final result, it is returned to the user. Else, the planner-LLM returns a new plan and execute the steps (4-7) until it has enough information to complete the task and return the result.

For more technical details, visit this Github [issue](https://github.com/opensearch-project/ml-commons/issues/3745)

Let’s watch the agent in action by simulating a real-world failure and root causing an issue.

## Simulating a Real-World Failure with the OpenTelemetry Demo App

Modern distributed systems are complex. Microservices often communicate with each other in unpredictable ways, and information about what’s happening is spread across logs, traces, and metrics. OpenSearch offers a powerful suite of observability tools—including dashboards for metrics, logs, and traces—to help users monitor and troubleshoot distributed systems. However, when debugging complex failures, users are often left manually correlating signals across services and infrastructure layers. This process is generally slow and tedious. This is where Agents come in. By combining OpenSearch's observability data with reasoning and planning capabilities, these agents can automate root cause analysis, generate actionable insights, and significantly enhance the troubleshooting experience.

We'll demonstrate how to use the Plan-Execute-Reflect agent to build an observability agent capable of root-causing an issue in a microservices application. We'll show you how to register the agent, run a task, and interpret the output—all with minimal setup and natural language input.

We’ll simulate a failure in a microservices environment: a cart failure in an e-commerce application. For this, we’ll use the OpenTelemetry Demo application, a reference application that mimics a real-world system.

This application emits telemetry data—including logs, traces, and metrics—to OpenSearch, giving us rich observability signals. We’ll trigger a cart failure, then ask our observability agent to diagnose the root cause using these signals.

For more details about the demo application, see [OpenTelemetry-Demo](https://opentelemetry.io/docs/demo/)

### Triggering the Cart Failure

The OpenTelemetry Demo uses flagd, a simple feature-flag service, to manage built-in fault scenarios. Flag values can be toggled through a web UI or by editing the demo’s configuration file directly.

1. Deploy the application and navigate to the feature-flags dashboard at http://localhost:8080/feature
2. Find cartFailure and toggle it On, then click Save.
3. Once enabled, the Empty Cart button in the frontend UI will stop working. http://localhost:8080/cart
4. Once you add an item to the cart and hit the Empty Cart button, you’ll start seeing error spans and logs in OpenSearch corresponding to the Cart Service failures. 

With the cart failure now active, the demo application will emit error-level spans and log entries for the Cart Service. These signals form the basis of our root-cause analysis.

## Investigating the Issue with an Observability Agent

Let’s now try to identify the root cause of this issue using OpenSearch’s new Plan–Execute–Reflect agent. Instead of manually querying logs or sifting through traces, we’ll describe the problem to the agent and let it do the investigation. Let’s setup the agent.

For more details about the agent, see [Plan-Execute-Reflect Agent](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/agents/plan-execute-reflect/)

### Step 1. Register the LLM

Let’s register the LLM to be used with the agent. 

In this example, we will be using a Claude 3.7-sonnet model deployed on Amazon Bedrock.

For more information about connecting your LLM to the agent, see [Connecting to LLMs](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/agents/plan-execute-reflect/#supported-llms)

#### 1.1 Register the connector

```json
POST /_plugins/_ml/connectors/_create
{
    "name": "BedRock Claude 3.7-sonnet connector",
    "description": "Connector to Bedrock service for claude model",
    "version": 1,
    "protocol": "aws_sigv4",
    "parameters": {
      "region": "your_aws_region",
      "service_name": "bedrock",
      "model": "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
    },
    "credential": {
      "access_key": "your_aws_access_key",
      "secret_key": "your_aws_secret_key",
      "session_token": "your_aws_session_token"
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

Note the connector ID; you will use it to register the model

#### 1.2 Register the model

```json
POST /_plugins/_ml/models/_register
{
    "name": "Bedrock Claude Sonnet model",
    "function_name": "remote",
    "description": "Bedrock Claude 3.7 sonnet model for Plan, Execute and Reflect Agent",
    "connector_id": "your_connector_id"
}
```

Note the model ID; you will use to register the agent

### Step 2. Register the Agent

```json
POST _plugins/_ml/agents/_register
{
  "name": "My Plan Execute and Reflect agent with Claude 3.7",
  "type": "plan_execute_and_reflect",
  "description": "this is a test agent",
  "llm": {
    "model_id": "your_llm_model_id",
    "parameters": {
      "prompt": "${parameters.question}"
  }},
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
    }
  ],
}
```

Note the agent ID; you’ll use it to execute the agent

### Step 3. Execute the agent

Opensearch 3.0 introduces the ability to execute agents asynchronously. As this agent is a long-running agent, let's execute it asynchronously by using the `async=true` query parameter. 

```json
POST /_plugins/_ml/agents/your_agent_id/_execute?async=true
{
  "parameters": {
    "question": "My users are complaining about the cart service. It is showing some unexpected behavior. When I click on empty cart it doesn't do anything. Can you investigate the root cause of this? There are spans and logs you can use to conduct your investigation."
  }
}
```

Example response
```json
{
  "task_id": "waIQmJYBJr85UikuxTKC",
  "status": "RUNNING",
  "response": {
    "memory_id": "v6IQmJYBJr85UikuxTJN"
  }
}
```
Note the task ID and memory ID; 

We will use task ID to query for the result and the memory ID to track interactions between the agent and the LLM. 

### Step 4. Analyze the result

Let’s check the status of the task:

Query the task to see execution status:
```json
GET _plugins/_ml/tasks/your_task_id
```

Once the agent has completed execution, you should see the below response:
```json
{
  "task_type": "AGENT_EXECUTION",
  "function_name": "AGENT",
  "state": "COMPLETED",
  "worker_node": [
    "q5yAqa75RM-rv0I67V1VVQ"
  ],
  "create_time": 1746148548710,
  "last_update_time": 1746148706345,
  "is_async": false,
  "response": {
    "memory_id": "bzWQjpYBKhItn1nNYHtu",
    "inference_results": [
      {
        "output": [
          {
            "result": "bzWQjpYBKhItn1nNYHtu",
            "name": "memory_id"
          },
          {
            "result": "cDWQjpYBKhItn1nNYHuS",
            "name": "parent_interaction_id"
          },
          {
            "result": "dTWQjpYBKhItn1nNbHsw",
            "name": "executor_agent_memory_id"
          },
          {
            "result": "YjWQjpYBKhItn1nN6oYk",
            "name": "executor_agent_parent_interaction_id"
          },
          {
            "name": "response",
            "dataAsMap": {
              "response": """After a comprehensive investigation of the cart service issues, I have identified the root cause of the 'empty cart' functionality failure.

# Root Cause Analysis

## Problem Identification
Users reported that clicking on 'empty cart' doesn't do anything. This was confirmed through analysis of OpenTelemetry traces showing failures in the `/oteldemo.CartService/EmptyCart` gRPC method.

## Key Findings

1. **Redis Connection Failures**:
   - Error message: \"Wasn't able to connect to redis\"
   - Component: `cart.cartstore.ValkeyCartStore`
   - Multiple occurrences between 15:56 and 16:00 on April 18, 2025

2. **EmptyCart Operation Failures**:
   - Method: `/oteldemo.CartService/EmptyCart`
   - Status Code: ERROR (2)
   - Error Message: \"Error emptying cart\"
   - HTTP Status Code: 500 (Internal Server Error)
   - These failures occurred in the same time window as the Redis connection errors

3. **Correlation Evidence**:
   - The timing of EmptyCart failures perfectly aligns with Redis connection errors
   - All failures affect the same cart service instance (container ID: `2e6e7f69cca2`)
   - Read operations (`GetCart`) sometimes succeeded while write operations (`EmptyCart`) consistently failed

## Conclusion

The root cause of the 'empty cart' functionality failure is a Redis connection issue in the cart service. The cart service uses Redis as its backend storage for maintaining cart state. When Redis becomes unavailable, the cart service can't perform write operations like emptying a cart.

Interestingly, some read operations (GetCart) were still succeeding, likely due to caching or different error handling for read vs. write operations, but all EmptyCart operations failed with a 500 error due to the inability to connect to Redis.

## Recommended Action

To resolve this issue:
1. Restore the Redis connection for the cart service
2. Investigate why the Redis connection was lost
3. Consider implementing better error handling in the cart service for Redis connection failures
4. Add better user feedback when backend operations fail"""
            }
          }
        ]
      }
    ]
  }
}
```

The agent identifies that the root cause is a Redis connection issue. It highlights repeated failures to connect to the Redis backend, visible in the service logs and traces, and links to specific log entries showing ECONNREFUSED errors. The response also includes a step-by-step explanation of how it analyzed the traces and logs to pinpoint the failure. Therefore, by automating the root cause analysis, the agent effectively reduces the time spent on manual troubleshooting, showcasing how it can resolve complex issues and empower teams to quickly find solutions.

Let's validate the results by querying the logs:
```json
{
    "_index": "ss4o_logs-2025.05.03",
    "_id": "jKd4mJYBJr85Uiku-gbe",
    "_score": null,
    "_source": {
        "traceId": "2d45e1cde4f8645b36ab31c07e2e67d6",
        "spanId": "e29428cdfabb1c30",
        "severityText": "Error",
        "flags": 1,
        "time": "2025-05-03T23:26:20.084598400Z",
        "severityNumber": 17,
        "droppedAttributesCount": 0,
        "serviceName": "cart",
        "body": "Wasn't able to connect to redis",
        "observedTime": "2025-05-03T23:26:20.084598400Z",
        "schemaUrl": "",
        "instrumentationScope.name": "cart.cartstore.ValkeyCartStore",
        "resource.attributes.service@version": "2.0.2",
        "resource.attributes.telemetry@sdk@name": "opentelemetry",
        "resource.attributes.telemetry@sdk@language": "dotnet",
        "resource.attributes.host@name": "7cbfd02de5b9",
        "resource.attributes.service@namespace": "opentelemetry-demo",
        "resource.attributes.container@id": "7cbfd02de5b9886dcda65e9876ee4d9601c98b29efada503117f3ac187a3b81a",
        "resource.attributes.telemetry@sdk@version": "1.11.2",
        "resource.attributes.service@name": "cart"
    }
},
{
    "_index": "ss4o_logs-2025.05.03",
    "_id": "nqd4mJYBJr85Uiku-gbe",
    "_score": null,
    "_source": {
        "traceId": "2d45e1cde4f8645b36ab31c07e2e67d6",
        "spanId": "e29428cdfabb1c30",
        "severityText": "Information",
        "flags": 1,
        "time": "2025-05-03T23:26:20.084929Z",
        "severityNumber": 9,
        "droppedAttributesCount": 0,
        "serviceName": "cart",
        "body": "Error status code '{StatusCode}' with detail '{Detail}' raised.",
        "observedTime": "2025-05-03T23:26:20.084929Z",
        "schemaUrl": "",
        "instrumentationScope.name": "Grpc.AspNetCore.Server.ServerCallHandler",
        "log.attributes.Detail": """Can't access cart storage. System.ApplicationException: Wasn't able to connect to redis
at cart.cartstore.ValkeyCartStore.EnsureRedisConnected() in /usr/src/app/src/cartstore/ValkeyCartStore.cs:line 95
at cart.cartstore.ValkeyCartStore.EmptyCartAsync(String userId) in /usr/src/app/src/cartstore/ValkeyCartStore.cs:line 178""",
        "resource.attributes.service@version": "2.0.2",
        "resource.attributes.telemetry@sdk@name": "opentelemetry",
        "resource.attributes.telemetry@sdk@language": "dotnet",
        "resource.attributes.host@name": "7cbfd02de5b9",
        "resource.attributes.service@namespace": "opentelemetry-demo",
        "resource.attributes.container@id": "7cbfd02de5b9886dcda65e9876ee4d9601c98b29efada503117f3ac187a3b81a",
        "resource.attributes.telemetry@sdk@version": "1.11.2",
        "resource.attributes.service@name": "cart",
        "log.attributes.StatusCode": "FailedPrecondition"
    }
}
```

As seen, the root cause clearly points to a Redis connection issue. 

For more details on agent registration and execution, see this [tutorial](https://docs.opensearch.org/docs/latest/tutorials/gen-ai/agents/build-plan-execute-reflect-agent/).

If you wish to look at intermediate results, you can query the memory index and memory traces to understand the interactions between the agent and the LLM. 

Fetch message traces
```json
GET /_plugins/_ml/memory/message/your_message_id/traces
```
For more details about memory and traces, see [Memory](https://docs.opensearch.org/docs/latest/ml-commons-plugin/api/memory-apis/index/).

## Extending the Agent with More Tools and MCP Support

The power of the Plan–Execute–And-Reflect agent lies in its flexibility. While our example uses a basic set of tools to investigate a cart failure, the agent can support a wide range of tools. For the list of available tools, see Tools.

In addition, this agent acts as an MCP client, meaning it can connect to an MCP (Model Coordination Protocol) server. This allows the agent to retrieve tools and configurations dynamically and participate in more complex workflows.

One such example would be to use the [WebSearchTool](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/tools/web-search-tool/) to perform deep-research tasks. 

If you’d like to connect your agent to an MCP server, refer to this [document](https://docs.opensearch.org/docs/latest/ml-commons-plugin/agents-tools/mcp/mcp-connector/) for detailed instructions.

### Recommendations and troubleshooting

* If you notice your agent getting throttled by your model, enable retries via the [connector configuration](https://docs.opensearch.org/docs/latest/ml-commons-plugin/remote-models/blueprints/#configuration-parameters).
* If the agent stops with max_steps executed, then you can increase the [max_steps](https://docs.opensearch.org/docs/latest/ml-commons-plugin/api/agent-apis/register-agent/#request-body-fields) or specify it during execution via the `parameters.max_steps` field.

Note: This is an experimental feature and will continue to evolve with future enhancements.

### Future Enhancements

* Support parallel tool execution
* Support multiple reflection strategies
* Human in the loop
* Ability to cancel a running task
* Agent execution checkpointing 

For updates on the progress of the feature or if you want to leave feedback, see the associated GitHub [issue](https://github.com/opensearch-project/ml-commons/issues/3745).

## Conclusion

In this tutorial, we demonstrated how to use the Plan–Execute–Reflect agent to troubleshoot and identify the root cause of a cart failure in the opentelemetry-demo application. By breaking down a high-level task into smaller steps and executing them iteratively, the agent provides a powerful and flexible way to automate complex reasoning workflows. This approach is particularly useful for observability and operational intelligence use cases where multi-step diagnosis is needed.

The Plan–Execute–Reflect agent demonstrates how intelligent automation can simplify root cause analysis. By combining OpenTelemetry observability data with LLM-based reasoning, OpenSearch can now assist engineers in debugging complex, multi-service systems with just a single prompt.

Want to try it yourself? Check out this [tutorial](https://docs.opensearch.org/docs/latest/tutorials/gen-ai/agents/build-plan-execute-reflect-agent/) and deploy the agent in your own stack.
