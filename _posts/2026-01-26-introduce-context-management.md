---
layout: post
title: "Solving context overflow: How OpenSearch agents stay smart in long conversations"
authors:
  - mingshl
  - kolchfa

date: 2026-01-26
has_science_table: true
categories:
  - technical-posts
meta_keywords: agents, tools, agentic, search, context engineering, context management, token limits, context optimization
meta_description: Learn how OpenSearch 3.5's new context management feature solves token limit issues for AI agents through intelligent summarization, sliding windows, and smart truncation. Build long-running agents that maintain conversation continuity without context overflow.

---

As AI agents become more sophisticated and handle longer conversations with multiple tool interactions, managing context efficiently becomes critical. Today, we're excited to introduce _context management_ for OpenSearch Agents in OpenSearch 3.5.

## The problem: Context window overflow

Modern AI agents face a fundamental challenge: context window limitations. As your agents engage in lengthy conversations, use multiple tools, and accumulate interaction history, they quickly approach token limits. When context exceeds LLM limits, requests fail. As context becomes unwieldy, performance degrades. Processing unnecessary tokens increases costs, and when irrelevant context confuses the model, hallucinations increase.

Traditional approaches to this problem are crude and involve cutting off old messages by token limit. But this loses valuable context and breaks your agent's ability to maintain coherent, long-running conversations.

## The solution: Intelligent context engineering

Context management introduces a sophisticated hook-based system that allows you to engineer your agent's context dynamically. Your agents can now intelligently summarize older interactions while preserving key information, apply sliding windows to maintain recent context, truncate tool outputs strategically when they become too large, and combine multiple strategies for optimal context optimization.

## How context management works

Context management operates through a hook-based architecture that intercepts agent execution at specific points. The `pre_llm` hook optimizes context before sending requests to the LLM, while the `post_tool` hook processes context after tool execution completes. At each hook, you can configure teams of context managers that work together to optimize your agent's context.

### Context managers

One of the most powerful aspects of context management is its flexibility. You can mix and match different context managers, adjust parameters to fit your specific use case, experiment with thresholds to find optimal performance, and combine strategies for comprehensive context optimization. Start with conservative settings and gradually adjust based on your agent's performance and requirements.

OpenSearch provides three built-in context managers. 

#### Sliding window manager

The _sliding window manager_ maintains a sliding window of the most recent interactions, automatically removing older messages when limits are reached. The following example shows how to configure a sliding window manager that keeps the six most recent messages and activates when the message count exceeds 20:

```json
{
  "type": "SlidingWindowManager",
  "config": {
    "max_messages": 6,
    "activation": {
      "message_count_exceed": 20
    }
  }
}
```

#### Summarization manager

The _summarization manager_ intelligently summarizes older interactions using large language models, preserving essential information while reducing token count. The following example configures summarization that preserves the 10 most recent messages, compresses older messages to 30% of their original size, and activates when the token count exceeds 200,000:

```json
{
  "type": "SummarizationManager",
  "config": {
    "summary_ratio": 0.3,
    "preserve_recent_messages": 10,
    "activation": {
      "tokens_exceed": 200000
    }
  }
}
```

#### Tools output truncate manager

The _tools output truncate manager_ truncates tool outputs that exceed specified limits, preventing single large outputs from overwhelming the context. The following example limits tool outputs to 100,000 characters:

```json
{
  "type": "ToolsOutputTruncateManager",
  "config": {
    "max_output_length": 100000
  }
}
```

## Smart activation rules

Context managers use _activation rules_ to determine when optimization is needed. The `tokens_exceed` rule activates when the estimated token count exceeds a threshold, while the `message_count_exceed` rule activates when the message count exceeds a limit. You can combine multiple rules using `AND` logic for precise control. This means your agents only perform expensive operations like summarization when actually needed.

## Real-world use cases

Context management performs well in scenarios in which agents need to maintain long conversations while managing resource constraints. 

### Customer service agent

For a customer service agent that handles multiple short interactions, you can configure a sliding window manager to keep only the most recent messages while truncating large tool outputs. The following example creates a context management configuration that maintains the six most recent messages (activating after 15 messages) and limits tool outputs to 50,000 characters:

```json
POST /_plugins/_ml/context_management/customer-service-optimizer
{
  "description": "Optimized context management for customer service interactions",
  "hooks": {
    "pre_llm": [
      {
        "type": "SlidingWindowManager",
        "config": {
          "max_messages": 6,
          "activation": {
            "message_count_exceed": 15
          }
        }
      }
    ],
    "post_tool": [
      {
        "type": "ToolsOutputTruncateManager",
        "config": {
          "max_output_length": 50000
        }
      }
    ]
  }
}
```

### Research assistant with heavy tool usage

For a research assistant that uses many tools and accumulates large amounts of context, you can combine summarization with output truncation. The following example creates a configuration that summarizes older messages (preserving the eight most recent messages), activates when tokens exceed 150,000, and limits tool outputs to 80,000 characters:

```json
POST /_plugins/_ml/context_management/research-assistant-optimizer
{
  "description": "Context management for research agents with extensive tool interactions",
  "hooks": {
    "pre_llm": [
      {
        "type": "SummarizationManager",
        "config": {
          "summary_ratio": 0.4,
          "preserve_recent_messages": 8,
          "activation": {
            "tokens_exceed": 150000
          }
        }
      }
    ],
    "post_tool": [
      {
        "type": "ToolsOutputTruncateManager",
        "config": {
          "max_output_length": 80000
        }
      }
    ]
  }
}
```

## Implementing context management

To implement context management, first create a context management configuration with your desired managers and rules (as shown in the use cases above). Then register your agent with that configuration by referencing the configuration name in your agent registration. The following example registers a conversational agent with the customer service optimizer configuration:

```json
POST /_plugins/_ml/agents/_register
{
  "name": "my-smart-agent",
  "type": "conversational",
  "llm": {
    "model_id": "your-llm-model-id"
  },
  "context_management_name": "customer-service-optimizer"
}
```

Once registered, execute your agent and observe intelligent context optimization in action. You can even specify different context management templates for individual executions. The following example executes an agent using the research assistant optimizer configuration:

```json
POST /_plugins/_ml/agents/agent-id/_execute
{
  "parameters": {
    "question": "How can I help you today?"
  },
  "context_management_name": "research-assistant-optimizer"
}
```

After deployment, monitor your agent's performance and adjust configurations based on observed behavior and resource usage patterns.

## Next steps

Context management is available in OpenSearch 3.5. Review the [context management documentation](https://opensearch.org/docs/latest/ml-commons-plugin/context-management/) and start experimenting with different configurations to find what works best for your use cases.

The hook-based architecture is designed for extensibility, providing a foundation for even more sophisticated context optimization strategies. You can build custom context managers for specialized use cases, add new execution hooks at different points in the agent lifecycle, or implement advanced activation rules.

The OpenSearch community welcomes contributions! Whether you have ideas for new context optimization strategies or want to extend the hook system, review our [contribution guidelines](https://github.com/opensearch-project/ml-commons/blob/main/CONTRIBUTING.md) and join the conversation on [GitHub](https://github.com/opensearch-project/ml-commons) or the [community forum](https://forum.opensearch.org/).
