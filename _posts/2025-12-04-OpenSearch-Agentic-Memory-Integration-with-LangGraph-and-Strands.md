---
layout: post
title: "OpenSearch Agentic Memory Integration with LangGraph and Strands"
authors:
  - nathhjo
date: 2025-12-09
categories:
  - technical-post
meta_keywords: OpenSearch 3.3, agentic memory solution, AI agents, persistent memory, machine learning, agentic memory, context awareness, LLM, language models, memory containers, semantic search, AI development, agent frameworks, intelligent agents, context management, LangGraph, Strands, Strands Agent
meta_description: "Learn how OpenSearch 3.3 enables AI agents to remember and learn with agentic memory. Includes LangGraph and Strands integration examples and notebooks."
---

An AI agent's effectiveness depends on its memory. Without the ability to recall past interactions, maintain context across conversations, or learn from previous decisions, even the most sophisticated agents lose their effectiveness the moment a conversation ends. This is where agentic memory becomes critical. With OpenSearch 3.3.0, we're introducing agentic memory capabilities that enable AI agents to store, retrieve, and reason over their interaction history. In this post, we'll show you how to integrate this powerful features with two popular AI agent frameworks - LangGraph and Strands - to build agents that truly remember and evolve.

## Quick Start 🚀

We’ve prepared two paths to explore OpenSearch agentic memory capabilities with LangGraph and Strands.

1. Real use case Notebooks - Interactive Jupyter notebooks with complete implementations
2. Framework demo scripts - Focused Python scripts to learn core concepts

Requirements for both paths:

* Python 3.10+
* OpenSearch 3.3.2+
* AWS credentials for Amazon Bedrock access

### 🎯 See It In Action: Real Use Case Notebooks

**Want to see a real use case example?** We've prepared two interactive notebooks demonstrating agentic memory with different AI agent frameworks, LangGraph and Strands . Choose one to start, or try both to see how different frameworks handle memory.

#### 1. Fitness Coach Assistant with LangGraph

A fitness coaching assistant that tracks your workout history, learns your goals, and provides personalized training recommendations.

**Setup for Notebook:**

```bash
# Clone and navigate
git clone https://github.com/opensearch-project/opensearch-py-ml.git
cd docs/source/examples/agentic_memory

# Open the notebook
jupyter notebook langgraph/demo_fitness_assistant.ipynb
```

View notebook on Github → [notebook_link](..)

**What you’ll experience:**

* Workout history tracking - Agent remembers exercises and progress
* Goal-oriented coaching - Adapts to your objectives
* Progress analysis - Suggests improvements
* Context-aware guidance - Advice based on history

#### 2. Travel Agent Assistant with Strands Agent

A travel planning assistant that remembers your preferences, past trips, and builds personalized recommendations over time.

**Setup for Notebook:**

```bash
# Clone and navigate
git clone https://github.com/opensearch-project/opensearch-py-ml.git
cd docs/source/examples/agentic_memory

# Open the notebook
jupyter notebook strands/demo_travel_assistant.ipynb
```
View notebook on Github → [notebook_link](..)

**What you’ll experience:**

* Multi-session memory - Agent remembers you across sessions
* Preference learning  - Understands your travel style and preferences
* Context-aware recommendations - Uses past conversations to personalize suggestions
* Semantic memory retrieval - Finds relevant past interactions intelligently

### 🔧 Start with the Basics: Framework Demos

**Prefer to start simple?** Run our standalone demos to understand the fundamentals before diving into the complete use case.

#### What’s included:

* Short-term vs long-term memory patterns
* Basic conversation storage and retrieval
* Framework integration examples (e.g., LangGraph and Strands Agent)

View complete documentation in the [README](..)

#### Prerequisites

1. Clone and navigate

```bash
git clone https://github.com/opensearch-project/opensearch-py-ml.git
cd docs/source/examples/agentic_memory
```

2. Install dependencies

```bash
python -m venv .venv
source .venv/bin/activate # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### Strands Demos:

* Short-Term Memory

What you'll see: An agent that maintains context during a conversation but starts fresh in new sessions.

```bash
# Configure environment
cp strands/.env.strands-short.example strands/.env.strands-short

# Edit .env.strands-short file with the required configurations

# Run the script
python strands/strands_short_term.py
```

* Long-Term Memory

What you'll see: An agent that recalls information from previous sessions and builds knowledge over time.

```bash
# Configure environment
cp strands/.env.strands-long.example strands/.env.strands-long

# Edit .env.strands-long file with the required configurations

# Run the script
python strands/strands_long_term.py
```

#### LangGraph Demos:

* Short-Term Memory

What you'll see: An agent that maintains context during a conversation but starts fresh in new sessions.

```bash
# Configure environment
cp langgraph/.env.langgraph-short.example langgraph/.env.langgraph-short

# Edit .env.langgraph-short file with the required configurations

# Run the script
python langgraph/langgraph_short_term.py
```

* Long-Term Memory

What you'll see: An agent that recalls information from previous sessions and builds knowledge over time.

```bash
# Configure environment
cp langgraph/.env.langgraph-long.example langgraph/.env.langgraph-long

# Edit .env.langgraph-long file with the required configurations

# Run the script
python langgraph/langgraph_long_term.py
```

### 💡 Which memory type should you use?

**Short-term memory** is ideal for:

* Chatbots and conversational assistants
* Single-session tasks
* Temporary context that doesn't need persistence

**Long-term memory** is ideal for:

* Personal assistants that learn over time
* Customer support with historical context
* Applications requiring knowledge accumulation

## Conclusion

Agentic memory transforms AI agents from tools that forget into intelligent assistants that learn and evolve. With OpenSearch 3.3.0, you now have a powerful, scalable foundation to build agents that remember user preferences, maintain context across conversations, and provide truly personalized experiences.

Whether you're building customer support systems, personal assistants, or conversational applications, the integration examples in this post provide a solid starting point. From the fitness and travel agent notebook to the LangGraph and Strands demos, you have practical patterns to build upon. The choice between short-term and long-term memory patterns gives you the flexibility to match your specific use case, from brief chat sessions to knowledge-building systems that improve over time.

With OpenSearch's agentic memory capabilities, you can create agents that remember, reason, and continuously improve with every interaction.

## What’s next?

* Explore the official documentation for [agentic memory](https://docs.opensearch.org/latest/ml-commons-plugin/agentic-memory/)
* Share your feedback on [OpenSearch forum](https://forum.opensearch.org/)
* Stay tuned for updates as agentic memory capabilities expand in future releases