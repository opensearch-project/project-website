---
layout: post
title: "Making search smarter with system-generated search pipelines"
layout: post
authors:
   - bzhangam
date: 2025-10-24
has_science_table: true
categories:
   - technical-posts
meta_keywords: system-generated search pipeline, OpenSearch 3.3, plugin development, system-generated pipeline, system-generated search processor
meta_description: Learn how OpenSearch automatically generates and executes search processors during query evaluation, how plugin developers can extend this mechanism, and how to monitor system-generated processors using the Search Pipeline Stats API.
---

OpenSearch 3.3 introduces _system-generated search pipelines_, a new capability designed for plugin developers. It lets OpenSearch automatically process search requests by generating and attaching system search processors at runtime, based on the request context and parameters.

This capability enables you to embed search-time processing logic directly into your plugins---without requiring you to manually create or configure search pipelines. It simplifies integration and creates a smoother, more intelligent search experience out of the box.

Previously, when building a custom search processor, you needed to explicitly configure a search pipeline that included the processor and then reference it in your queries. With system-generated search pipelines, OpenSearch can automatically generate and manage these processors, reducing manual setup while maintaining full compatibility with your user-defined pipelines.

## System-generated search pipelines compared to standard search pipelines

In OpenSearch, a standard search pipeline is defined using the [Search Pipeline API](https://docs.opensearch.org/latest/search-plugins/search-pipelines/index/). You must manually configure and reference these pipelines in your search requests.

A system-generated search pipeline works similarly---it executes one or more processors during the search request lifecycle---but you do not configure it manually. Instead, OpenSearch automatically generates the pipeline at query time based on the registered system processor factories in your plugin and the details of the incoming request.

The following table summarizes the key differences between standard and system-generated search pipelines in OpenSearch.

| **Pipeline type**                    | **How it's defined**                                                                                        | **How it's triggered**                                                                                             | **How to disable it**                                                                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |--------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| **Standard search pipeline**         | You manually define the pipeline using the Search Pipeline API.                                                     | Referenced by name in a search request or set as the default search pipeline in cluster settings.                   | Remove the pipeline reference from search requests or clear default pipeline settings.                                                         |
| **System-generated search pipeline** | OpenSearch automatically generates the pipeline based on request evaluation and plugin-registered processor factories. | Triggered automatically when the search request matches criteria defined by the system-generated processor factory. | All system-generated search processor factories are disabled by default. To enable them, update the `cluster.search.enabled_system_generated_factories` cluster setting before using system-generated pipelines. |


## How it works

When OpenSearch receives a search request, it evaluates the request parameters and context to determine whether to generate system search processors. These processors can be inserted at different stages of the search lifecycle:

 - **System-generated search request processors** modify or enrich the incoming request before execution.

 - **System-generated search phase results processors** operate after shard-level results are collected, allowing aggregation or transformation of intermediate results.

 - **System-generated search response processors** modify the final response before it is returned to the client.

During the evaluation, OpenSearch dynamically constructs a system-generated search pipeline and merges it with any user-defined pipeline specified in the request. System-generated processors are created only when the request meets specific criteria defined in your plugin's factory implementation—for example, when a query includes certain parameters or when a specific search type (such as neural or k-NN) is detected.

The following diagram illustrates how OpenSearch resolves system-generated search pipelines during query execution.

![Generate System Search Pipeline](/assets/media/blog-images/2025-10-24-Making-Search-Smarter-System-Generated-Search-Pipelines/generate-system-search-pipeline.png)

OpenSearch automatically manages execution order, ensuring that system-generated processors run in the correct phase and relative position to any user-defined processors. This ensures compatibility and predictable execution without additional configuration from you.

The following diagram illustrates how OpenSearch runs system-generated search request processors during query execution. The same pattern is used for system-generated search phase results processors and search response processors.

![Execute System Search Pipeline](/assets/media/blog-images/2025-10-24-Making-Search-Smarter-System-Generated-Search-Pipelines/execute-system-search-pipeline.png)

## Comparing the workflows with and without system-generated search processors

The search workflow differs depending on whether system-generated search processors are enabled.

### With system-generated search processors

When system-generated search processors are enabled, you can immediately take advantage of features like [native maximal marginal relevance (MMR) support](https://docs.opensearch.org/latest/vector-search/specialized-operations/vector-search-mmr/) without any additional configuration. The processors are automatically applied to relevant queries, which significantly reduces operational overhead and simplifies your experience. For example, to perform an MMR-based vector search, send the following request:

```json
{
  "query": {
    "neural": {
      "product_description": {
        "query_text": "Red apple"
      }
    }
  },
  "ext":{
    "mmr":{
      "candidates": 10,
      "diversity": 0.5
    }
  }
}
```

In this example, OpenSearch automatically handles the setup and orchestration of the MMR reranking logic using system-generated search processors. This allows you to focus purely on the search logic rather than on pipeline configuration.

### Without system-generated search processors

If you don't use system-generated processors, you have to manually configure search pipelines to enable MMR or similar post-processing features. This requires creating a custom search pipeline, registering it, and either setting it as the default pipeline for an index or specifying it in each search request as follows:

```json
PUT /_search/pipeline/my_pipeline
{
  "request_processors": [
    {
      "mmr_over_sample_factory": {}
    }
  ],
  "response_processors": [
    {
      "mmr_rerank_factory": {}
    }
  ]
}
```

## Building a custom system-generated search processor

You can define custom system-generated search processors in the plugin. To do this, you'll need to:

 - **Create a system search processor**: Implement the processor logic by extending one of the search processor interfaces (such as `SearchRequestProcessor`, `SearchPhaseResultProcessor`, or `SearchResponseProcessor`).

 - **Create a processor factory**: Implement a factory that determines when OpenSearch should generate and attach the processor.

 - **Register the factory**: Register your factory with the OpenSearch plugin so it can participate in automatic pipeline generation.

Follow these steps to build a simple example system-generated search request processor.

### Step 1: Create a system search processor

```java
/**
 * An example system-generated search request processor that will be executed before the user defined processor
 */
public class ExampleSearchRequestPostProcessor implements SearchRequestProcessor, SystemGeneratedProcessor {
    /**
     * type of the processor
     */
    public static final String TYPE = "example-search-request-post-processor";
    /**
     * description of the processor
     */
    public static final String DESCRIPTION = "This is a system-generated search request processor which will be"
        + "executed after the user defined search request. It will increase the query size by 2.";
    private final String tag;
    private final boolean ignoreFailure;

    /**
     * ExampleSearchRequestPostProcessor constructor
     * @param tag tag of the processor
     * @param ignoreFailure should processor ignore the failure
     */
    public ExampleSearchRequestPostProcessor(String tag, boolean ignoreFailure) {
        this.tag = tag;
        this.ignoreFailure = ignoreFailure;
    }

    @Override
    public SearchRequest processRequest(SearchRequest request) {
        if (request == null || request.source() == null) {
            return request;
        }
        int size = request.source().size();
        request.source().size(size + 2);
        return request;
    }

    @Override
    public String getType() {
        return TYPE;
    }

    @Override
    public String getTag() {
        return this.tag;
    }

    @Override
    public String getDescription() {
        return DESCRIPTION;
    }

    @Override
    public boolean isIgnoreFailure() {
        return this.ignoreFailure;
    }

    @Override
    public ExecutionStage getExecutionStage() {
        // This processor will be executed after the user defined search request processor
        return ExecutionStage.POST_USER_DEFINED;
    }
}
```

### Step 2: Create a processor factory

```java
public class Factory implements SystemGeneratedFactory<SearchRequestProcessor> {
    public static final String TYPE = "example-search-request-post-processor-factory";

    // We auto generate the processor if the original query size is less than 5.
    @Override
    public boolean shouldGenerate(ProcessorGenerationContext context) {
        SearchRequest searchRequest = context.searchRequest();
        if (searchRequest == null || searchRequest.source() == null) {
            return false;
        }
        int size = searchRequest.source().size();
        return size < 5;
    }

    @Override
    public SearchRequestProcessor create(
        Map<String, Processor.Factory<SearchRequestProcessor>> processorFactories,
        String tag,
        String description,
        boolean ignoreFailure,
        Map<String, Object> config,
        PipelineContext pipelineContext
    ) throws Exception {
        return new ExampleSearchRequestPostProcessor(tag, ignoreFailure);
    }
}
```

The `shouldGenerate()` method is called for every search request. Avoid performing any time-consuming or resource-intensive logic in this method. It should remain lightweight---its sole purpose is to quickly decide whether a processor needs to be generated.

### Step 3: Register the factory in your plugin

```java
@Override
public Map<String, SystemGeneratedProcessor.SystemGeneratedFactory<SearchRequestProcessor>> getSystemGeneratedRequestProcessors(
    Parameters parameters
) {
    return Map.of(
        ExampleSearchRequestPostProcessor.Factory.TYPE,
        new ExampleSearchRequestPostProcessor.Factory()
    );
}
```

Once the factory is registered, OpenSearch automatically evaluates incoming search requests, generates system processors where applicable, and inserts them into the runtime search pipeline. For more examples, see the [example plugin](https://github.com/opensearch-project/OpenSearch/tree/main/plugins/examples/system-search-processor/src/main/java/org/opensearch/example/systemsearchprocessor). 

Currently, OpenSearch allows only one system-generated search processor per type and stage for each search request. For example, only one system-generated search request processor can run before user-defined processors. This design simplifies execution order management and ensures predictable behavior across different plugins.

In most cases, a single processor per type and stage is sufficient, but future releases may support multiple processors if use cases arise.

You can also add logic in your processor to detect and handle conflicts between your system-generated processors and user-defined processors. This is useful if your processor cannot coexist with certain user-defined ones or if you need to enforce execution constraints.

The following is an example of handling a conflict between a system-generated search processor and a user-defined search processor:

```java
@Override
public void evaluateConflicts(ProcessorConflictEvaluationContext context) throws IllegalArgumentException {
    boolean hasTruncateHitsProcessor = context.getUserDefinedSearchResponseProcessors()
        .stream()
        .anyMatch(processor -> CONFLICT_PROCESSOR_TYPE.equals(processor.getType()));

    if (hasTruncateHitsProcessor) {
        throw new IllegalArgumentException(
            String.format(
                Locale.ROOT,
                "The [%s] processor cannot be used in a search pipeline because it conflicts with the [%s] processor, "
                    + "which is automatically generated when executing a match query against [%s].",
                CONFLICT_PROCESSOR_TYPE,
                TYPE,
                TRIGGER_FIELD
            )
        );
    }
}
```

We recommend that you add a validation step to check whether a custom system-generated processor factory is enabled when a search request contains a parameter that would trigger that processor. This ensures that you receive a clear error message about which factory is required rather than having the request silently do nothing. 

Use the following function, defined in the `SearchPipelineService`, to check whether a certain factory is enabled:

```java
public boolean isSystemGeneratedFactoryEnabled(String factoryName) {
    return enabledSystemGeneratedFactories != null
        && (enabledSystemGeneratedFactories.contains(ALL) || enabledSystemGeneratedFactories.contains(factoryName));
}
```

## Monitoring system-generated search processors

OpenSearch provides the Search Pipeline Stats API to help you monitor performance and execution metrics for both user-defined and system-generated processors.

You can access these metrics using the following command:

```json
GET /_nodes/stats/search_pipeline
```

The response includes a `system_generated_processors` section that reports statistics for each processor type and a `system_generated_factories` section that reports evaluation and generation metrics for each processor factory:

```json
{
  "nodes": {
    "gv8NncXIRiSaA7egwHzfJg": {
      "search_pipeline": {
        "system_generated_processors": {
          "request_processors": [
            {
              "example-search-request-post-processor": {
                "type": "mmr-search-request-processor",
                "stats": {
                  "count": 13,
                  "time_in_millis": 1,
                  "failed": 0
                }
              }
            }
          ]
        },
        "system_generated_factories": {
          "request_processor_factories": [
            {
              "example-search-request-post-processor-factory": {
                "type": "example-search-request-post-processor-factory",
                "evaluation_stats": {
                  "count": 37,
                  "time_in_microseconds": 185,
                  "failed": 0
                },
                "generation_stats": {
                  "count": 13,
                  "time_in_microseconds": 1,
                  "failed": 0
                }
              }
            }
          ]
        }
      }
    }
  }
}
```

The `system_generated_factories` section reports the number of times OpenSearch evaluated and generated processors:

 - `evaluation_stats` shows how many search requests were evaluated by the factory to decide whether a processor should be generated.

 - `generation_stats` shows how many times a processor was actually created and how much time was spent generating it.

These metrics make it easy to determine whether your system-generated processors are behaving as expected and to identify potential performance bottlenecks.

## Summary

System-generated search pipelines extend OpenSearch's search framework by allowing automatic generation and execution of search processors based on request context. This simplifies plugin development, eliminates the need for manual configuration, and makes search smarter and more adaptive.

When developing plugins, you can use this capability to embed custom logic that runs automatically---such as reranking, result diversification, or query enrichment---without requiring you to define search pipelines manually. Try this feature now and leave us feedback on the [OpenSearch forum](https://forum.opensearch.org/).