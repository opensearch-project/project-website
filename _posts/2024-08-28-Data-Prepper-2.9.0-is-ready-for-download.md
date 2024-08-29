---
layout: post
title:  Data Prepper 2.9.0 is ready for download
authors:
- dvenable
date: 2024-08-28 13:30:00 -0600
categories:
  - releases
excerpt: Data Prepper 2.9.0 contains core improvements to expressions, routing, performance, and more.
meta_keywords: expressions, set operators, conditional routing, performance
meta_description: Data Prepper 2.9.0 contains core improvements to help with expressions, routing, performance, and more.
---

## Introduction

You can download Data Prepper 2.9.0 today.
This release includes a number of core improvements as well as improvements to many popular processors.


## Expression improvements

Data Prepper continues to improve support for expressions to allow you more control over conditions that you use for routing and conditional processing.
In this release, Data Prepper adds support for set operations.
These operations allow you to write conditions that check whether a value is in a set of possible values.
This can be especially useful for routing, where you need to route data depending on the originating system.

Additionally, Data Prepper has a new `startsWith` function that determines whether a string value starts with another string.

## Default route

Data Prepper has offered sink routing since version 2.0.
With this capability, pipeline authors can use Data Prepper expressions to route events to different sinks in order to meet their requirements.
One challenge experienced by pipeline authors has been how to handle events that do not match any existing routes.
A common solution to this challenge has been to create a route that is the inverse of other routes.
However, this required copying and inverting the other conditions, which could be difficult to handle and even more difficult to maintain.

Now Data Prepper supports a special route named `_default`.
By applying this route to a sink, pipeline authors can ensure that events that do not match any other routes will be sent to a default sink of their choosing.

For example, consider a simple situation in which you want to route frontend and backend events to different sinks.
You can define two sinks for these events and then define your routes.
But what if you receive events that do not match?
The following sample pipeline shows an approach to handling events that do not match either the frontend or backend routes:

```
routes:
  - frontend: '/service == "front-end"`
  - backend: '/service == "back-end"`
sink:
 - opensearch:
      routes:
         - front-end
 - opensearch:
      routes:
         - back-end
  - opensearch:
       routes:
          - _default
```

## Performance

The Data Prepper maintainers have been working toward improving the performance of Data Prepper.
This release includes a number of internal improvements that speed up processing for many processors.
You don't need to do anything other than update your version to experience these improvements.

Data Prepper 2.9 also offers some new features that you can use to help reduce out-of-memory errors or circuit breaker trips.
Many pipelines involve extracting source data from a string into a structure.
Some examples are `grok` and `parse_json`.
When you use these processors, you more than double the size of each event that you process.
Because the events flowing through the system consume the largest portion of memory usage, this will greatly increase your memory requirements.

Many pipeline authors may use these processors and then remove the source data in a second processor.
This is a good approach when you don't need to store the original string in your sink.
But it doesn't always make the memory used by the string available for garbage collection when you need it.
The reason for this is that Data Prepper pipelines operate on batches of data.
As these batches of data move through the pipeline, the pipeline will expand the memory usage in one processor and then attempt to reduce it in the next.
Because the memory expansion happens in batches, Data Prepper may expand many thousands of events before starting to remove the source data.

See the following example pipeline, which runs `grok` and then `delete_entries`.
With a configured `batch_size` of 100,000, Data Prepper will expand 100,000 events before deleting the messages.

```
my-pipeline:
  buffer:
    bounded_blocking:
      batch_size: 100000
  processor:
    - grok:
        match:
          message: ["..."]
    - delete_entries:
        with_keys: ["message"]
```

To help with this memory usage issue, Data Prepper now provides a `delete_source` flag on some of these processors, including `grok` and `parse_json`.

Returning to the preceding example, you could both simplify the pipeline and reduce the amount of memory used in between processors:

```
my-pipeline:
  buffer:
    bounded_blocking:
      batch_size: 100000
  processor:
    - grok:
        match:
          message: ["..."]
        delete_source: true
```

If you observe this pattern of the source being deleted in a separate processor, configure your pipeline to use `delete_source` in order to improve your overall memory usage.


## Getting started

* To download Data Prepper, visit the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.10 and other releases, see the [Data Prepper roadmap](https://github.com/opensearch-project/data-prepper/projects/1).

## Thanks to our contributors!

The following community members contributed to this release. Thank you!

* [chenqi0805](https://github.com/chenqi0805) -- Qi Chen
* [danhli](https://github.com/danhli) -- Daniel Li
* [dinujoh](https://github.com/dinujoh) -- Dinu John
* [dlvenable](https://github.com/dlvenable) -- David Venable
* [graytaylor0](https://github.com/graytaylor0) -- Taylor Gray
* [ivan-tse](https://github.com/ivan-tse) -- Ivan Tse
* [jayeshjeh](https://github.com/jayeshjeh) -- Jayesh Parmar
* [joelmarty](https://github.com/joelmarty) -- Joël Marty
* [kkondaka](https://github.com/kkondaka) -- Krishna Kondaka
* [mishavay-aws](https://github.com/mishavay-aws)
* [oeyh](https://github.com/oeyh) -- Hai Yan
* [san81](https://github.com/san81) -- Santhosh Gandhe
* [sb2k16](https://github.com/sb2k16) -- Souvik Bose
* [shenkw1](https://github.com/shenkw1) -- Katherine Shen
* [srikanthjg](https://github.com/srikanthjg) -- Srikanth Govindarajan
* [timo-mue](https://github.com/timo-mue)
