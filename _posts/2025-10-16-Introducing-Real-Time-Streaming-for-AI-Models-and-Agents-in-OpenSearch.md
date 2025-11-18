---
layout: post
title:  "Introducing real-time streaming for AI models and agents in OpenSearch"
authors:
 - nathhjo
date: 2025-11-18
categories:
  - technical-posts
meta_keywords: OpenSearch, streaming API, real-time AI, AI models, agents, machine learning, open-source LLM
meta_description: Learn how to implement streaming APIs in OpenSearch 3.3 for real-time AI responses. Stream model predictions and agent executions with immediate feedback.
---

In today's fast-paced digital world, waiting isn't an option, especially when it comes to AI-powered applications. Streaming technology has emerged as a critical solution to this challenge, fundamentally changing how systems deliver responses. Instead of waiting for complete outputs before displaying any results, streaming enables incremental data delivery, sending information in chunks as it becomes available. This approach is particularly valuable for AI operations such as model predictions and agent executions, where responses can be lengthy and generation time unpredictable. 

OpenSearch now supports streaming capabilities, enabling real-time data processing and continuous query execution. Available as an experimental feature starting in OpenSearch 3.3, the Predict Stream API and Execute Stream Agent API provide this functionality, offering the same core features as their non-streaming counterparts while delivering responses progressively. This new feature allows you to handle live data streams efficiently, making it possible to process and analyze data as it arrives rather than in batches. This makes streaming ideal for applications like remote model predictions and complex agent workflows where you need visibility into multi-step execution processes.

## Prerequisites

Before using streaming, ensure that you have fulfilled the following prerequisites.

### 1. Install the required plugins

The streaming feature depends on the following plugins, which are included in the OpenSearch distribution but must be explicitly installed as follows:

```bash
bin/opensearch-plugin install transport-reactor-netty4
bin/opensearch-plugin install arrow-flight-rpc
```

For more information, see [Installing plugins](https://docs.opensearch.org/latest/install-and-configure/plugins/).

### 2. Configure OpenSearch settings

Add these settings to your `opensearch.yml` file or Docker Compose configuration:

```bash
opensearch.experimental.feature.transport.stream.enabled: true

# Choose one based on your security settings
http.type: reactor-netty4        # security disabled
http.type: reactor-netty4-secure # security enabled

# Multi-node cluster settings (if applicable)
# Use network.host IP for opensearch.yml or node name for Docker
arrow.flight.publish_host: <ip>
arrow.flight.bind_host: <ip>

# Security-enabled cluster settings (if applicable)
transport.stream.type.default: FLIGHT-SECURE
flight.ssl.enable: true
transport.ssl.enforce_hostname_verification: false
```

_If you're using the security demo certificates, change `plugins.security.ssl.transport.enforce_hostname_verification: false` to `transport.ssl.enforce_hostname_verification: false` in your `opensearch.yml` file._

For more information about enabling experimental features, see [Experimental feature flags](https://docs.opensearch.org/latest/install-and-configure/configuring-opensearch/experimental/).

### 3. Configure JVM options

Add these settings to your `jvm.options` file:

```bash
-Dio.netty.allocator.numDirectArenas=1
-Dio.netty.noUnsafe=false
-Dio.netty.tryUnsafe=true
-Dio.netty.tryReflectionSetAccessible=true
--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED
```

### 4. Enable the streaming feature flag

Since this feature is still experimental in OpenSearch 3.3, you need to enable the streaming feature flag before using the streaming APIs.

To enable streaming, run the following command:

```json
PUT /_cluster/settings
{
    "persistent": {
        "plugins.ml_commons.stream_enabled": true
    }
}
```

## Getting started

Once you've completed all the prerequisites, follow these steps to implement streaming in OpenSearch.

### Step 1: Set up model prediction streaming

#### 1. Register a compatible externally hosted model

Currently, streaming functionality is supported for the following model providers:

* [OpenAI Chat Completion](https://platform.openai.com/docs/api-reference/completions)
* [Amazon Bedrock Converse Stream](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ConverseStream.html)

For this tutorial, we'll demonstrate the registration process using an Amazon Bedrock Converse Stream model.

To register an Amazon Bedrock Converse Stream model, send the following request:

```json
POST /_plugins/_ml/models/_register
{
    "name": "Bedrock converse stream",
    "function_name": "remote",
    "description": "bedrock claude model",
    "connector": {
        "name": "Amazon Bedrock Converse",
        "description": "Test connector for Amazon Bedrock Converse",
        "version": 1,
        "protocol": "aws_sigv4",
        "credential": {
            "access_key": "{{access_key}}",
            "secret_key": "{{secret_key}}",
            "session_token": "{{session_token}}"
        },
        "parameters": {
            "region": "{{aws_region}}",
            "service_name": "bedrock",
            "response_filter": "$.output.message.content[0].text",
            "model": "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
        },
        "actions": [{
            "action_type": "predict",
            "method": "POST",
            "headers": {
                "content-type": "application/json"
            },
            "url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/converse",
            "request_body": "{\"messages\":[{\"role\":\"user\",\"content\":[{\"type\":\"text\",\"text\":\"${parameters.inputs}\"}]}]}"
        }]
    }
}
```

#### 2. Run the Predict Stream API

To run the Predict Stream API, you must include the `_llm_interface` parameter that corresponds to your model type:

* OpenAI Chat Completion: `openai/v1/chat/completions`
* Amazon Bedrock Converse Stream: `bedrock/converse/claude`

To run the Predict Stream API, send the following request:

```json
POST /_plugins/_ml/models/yFT0m5kB-SbOBOkMDNIa/_predict/stream
{
  "parameters": {
    "inputs": "Can you summarize Prince Hamlet of William Shakespeare in around 100 words?",
    "_llm_interface": "bedrock/converse/claude"
  }
}
```

#### Sample response

The streaming format uses Server-Sent Events (SSE), with each chunk containing a portion of the model's response. Each data line represents a separate chunk transmitted in real time as the model generates output:

```json
data: {"inference_results":[{"output":[{"name":"response","dataAsMap":{"content":"#","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"response","dataAsMap":{"content":" Prince Hamlet:","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"response","dataAsMap":{"content":" A Summary","is_last":false}}]}]}

...

data: {"inference_results":[{"output":[{"name":"response","dataAsMap":{"content":"ities of human action versus","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"response","dataAsMap":{"content":" inaction.","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"response","dataAsMap":{"content":"","is_last":true}}]}]}
```

Each chunk has the following key elements:

* `content` -- The text fragment generated in this chunk (for example, a word, or phrase).
* `is_last` -- A Boolean flag indicating whether this is the final chunk (`false` for intermediate chunks, `true` for the last one).

### Step 2: Set up agent streaming

_Note: The Execute Stream Agent API currently supports **conversational agents** only. Other agent types are not compatible with streaming at this time._

#### 1. Register a compatible externally hosted model

Currently, streaming functionality is supported for the following model providers:

* [OpenAI Chat Completion](https://platform.openai.com/docs/api-reference/completions)
* [Amazon Bedrock Converse Stream](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ConverseStream.html)

For this tutorial, we'll demonstrate the registration process using an Amazon Bedrock Converse Stream model. Note that the `request_body` parameter used for agent execution connectors differs from the one used in model prediction connectors.

To register an Amazon Bedrock Converse Stream model, send the following request:

```json
POST /_plugins/_ml/models/_register
{
    "name": "Bedrock converse stream",
    "function_name": "remote",
    "description": "bedrock claude model",
    "connector": {
        "name": "Amazon Bedrock Converse",
        "description": "Test connector for Amazon Bedrock Converse",
        "version": 1,
        "protocol": "aws_sigv4",
        "credential": {
            "access_key": "{{access_key}}",
            "secret_key": "{{secret_key}}",
            "session_token": "{{session_token}}"
        },
        "parameters": {
            "region": "{{aws_region}}",
            "service_name": "bedrock",
            "model": "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
        },
        "actions": [{
            "action_type": "predict",
            "method": "POST",
            "headers": {
                "content-type": "application/json"
            },
            "url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/converse",
            "request_body": "{ \"system\": [{\"text\": \"${parameters.system_prompt}\"}], \"messages\": [${parameters._chat_history:-}{\"role\":\"user\",\"content\":[{\"text\":\"${parameters.prompt}\"}]}${parameters._interactions:-}]${parameters.tool_configs:-} }"
        }]
    }
}
```

#### 2. Register a conversational agent

When registering your agent, you must include the `_llm_interface` parameter that corresponds to your model type:

* OpenAI Chat Completion: `openai/v1/chat/completions`
* Amazon Bedrock Converse Stream: `bedrock/converse/claude`

To register your agent, send the following request:

```json
POST /_plugins/_ml/agents/_register
{
    "name": "Chat agent",
    "type": "conversational",
    "description": "this is a test agent",
    "llm": {
        "model_id": "<your_model_id>",
        "parameters": {
            "max_iteration": 5,
            "system_prompt": "You are a helpful assistant. You are able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics.\nIf the question is complex, you will split it into several smaller questions, and solve them one by one. For example, the original question is:\nhow many orders in last three month? Which month has highest?\nYou will spit into several smaller questions:\n1.Calculate total orders of last three month.\n2.Calculate monthly total order of last three month and calculate which months order is highest. You MUST use the available tools everytime to answer the question",
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
            "type": "IndexMappingTool",
            "name": "DemoIndexMappingTool",
            "description": "Tool to get index mapping of index",
            "parameters": {
                "index": "${parameters.index}",
                "input": "${parameters.question}"
            }
        },
        {
            "type": "ListIndexTool",
            "name": "RetrieveIndexMetaTool",
            "description": "Use this tool to get OpenSearch index information: (health, status, index, uuid, primary count, replica count, docs.count, docs.deleted, store.size, primary.store.size)."
        }
    ],
    "app_type": "chat_with_rag"
}
```

#### 3. Run the Execute Stream Agent API

To run the Execute Stream Agent API, send the following request:

```json
POST /_plugins/_ml/agents/37YmxZkBphfsuvK7qIj4/_execute/stream
{
    "parameters": {
        "question": "How many indices are in my cluster?"
    }
}
```

#### Sample response

The streaming format uses SSE, with each chunk containing a portion of the agent's response. Each data line represents a separate chunk transmitted in real time as the agent generates output:

```json
data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":"[{\"index\":0.0,\"id\":\"call_HjpbrbdQFHK0omPYa6m2DCot\",\"type\":\"function\",\"function\":{\"name\":\"RetrieveIndexMetaTool\",\"arguments\":\"\"}}]","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":"[{\"index\":0.0,\"function\":{\"arguments\":\"{}\"}}]","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":"{\"choices\":[{\"message\":{\"tool_calls\":[{\"type\":\"function\",\"function\":{\"name\":\"RetrieveIndexMetaTool\",\"arguments\":\"{}\"},\"id\":\"call_HjpbrbdQFHK0omPYa6m2DCot\"}]},\"finish_reason\":\"tool_calls\"}]}","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":"","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":"row,health,status,index,uuid,pri(number of primary shards),rep(number of replica shards),docs.count(number of available documents),docs.deleted(number of deleted documents),store.size(store size of primary and replica shards),pri.store.size(store size of primary shards)\n1,green,open,.plugins-ml-model-group,Msb1Y4W5QeiLs5yUQi-VRg,1,1,2,0,17.1kb,5.9kb\n2,green,open,.plugins-ml-memory-message,1IWd1HPeSWmM29qE6rcj_A,1,1,658,0,636.4kb,313.5kb\n3,green,open,.plugins-ml-memory-meta,OETb21fqQJa3Y2hGQbknCQ,1,1,267,7,188kb,93.9kb\n4,green,open,.plugins-ml-config,0mnOWX5gSX2s-yP27zPFNw,1,1,1,0,8.1kb,4kb\n5,green,open,.plugins-ml-model,evYOOKN4QPqtmUjxsDwJYA,1,1,5,5,421.5kb,210.7kb\n6,green,open,.plugins-ml-agent,I0SpBovjT3C6NABCBzGiiQ,1,1,6,0,205.5kb,111.3kb\n7,green,open,.plugins-ml-task,_Urzn9gdSuCRqUaYAFaD_Q,1,1,100,4,136.1kb,45.3kb\n8,green,open,top_queries-2025.09.26-00444,jb7Q1FiLSl-wTxjdSUKs_w,1,1,1736,126,1.8mb,988kb\n9,green,open,.plugins-ml-connector,YaJORo4jT0Ksp24L5cW1uA,1,1,2,0,97.8kb,48.9kb\n","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":"There","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":" are","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":" ","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":"9","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":" indices","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":" in","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":" your","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":" cluster","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":".","is_last":false}}]}]}

data: {"inference_results":[{"output":[{"name":"memory_id","result":"LvU1iJkBCzHrriq5hXbN"},{"name":"parent_interaction_id","result":"L_U1iJkBCzHrriq5hXbs"},{"name":"response","dataAsMap":{"content":"","is_last":true}}]}]}
```

Each chunk has the following key elements:

* `content` -- The text or data fragment generated in this chunk (for example, a word or phrase).
* `is_last` -- A Boolean flag indicating whether this is the final chunk (`false` for intermediate chunks, `true` for the last one).
* `memory_id` -- A unique identifier for the conversation memory session.
* `parent_interaction_id` -- An identifier linking related interactions in the conversation.

## Conclusion

Streaming capabilities in OpenSearch represent a significant step forward in delivering responsive, real-time AI experiences. By enabling incremental data delivery through the Predict Stream API and Execute Stream Agent API, you can transform how you interact with your AI-powered applications, replacing loading spinners with immediate, progressive feedback. Whether you're building conversational AI interfaces, content generation tools, or agent-based workflows, streaming provides the foundation for more engaging and transparent user experiences.

**Ready to get started?** Try implementing streaming in your OpenSearch environment and experience the difference firsthand. As this feature evolves from experimental to general availability, we expect to see expanded model and agent support and additional capabilities.

## What's next?

* Explore the [Predict Stream](https://docs.opensearch.org/latest/ml-commons-plugin/api/train-predict/predict-stream/) and [Execute Stream Agent](https://docs.opensearch.org/latest/ml-commons-plugin/api/agent-apis/execute-stream-agent/) API references.
* Share your feedback on the [OpenSearch forum](https://forum.opensearch.org/).
* Stay tuned for updates as streaming support expands in future releases.