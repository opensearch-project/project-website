---
layout: post
title:  "Learn-to-Rank with OpenSearch and Metarank"
authors:
  - shuttie
date:   2022-09-28 15:00:00 +0100
categories:
  - community
---
[Metarank](https://github.com/metarank/metarank) is an open-source secondary ranker that can perform advanced search results reordering with a [LambdaMART](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/MSR-TR-2010-82.pdf) Learn-to-Rank model. In this article, we'll discuss why & when LTR approach to ranking may be helpful and how Metarank implements it on top of OpenSearch. 

## Ranking in Lucene and OpenSearch

OpenSearch, being a close relative to the [Apache Lucene](https://lucene.apache.org) project, uses a traditional approach to search results ordering:
* on a **retrieval** stage, Lucene builds a result set of all the documents matching the query from the inverted index.
* on a **scoring** stage, each document is scored with a [BM25](https://en.wikipedia.org/wiki/Okapi_BM25) scoring function.

BM25 is a strong baseline for text relevance, but it only takes into account frequencies of terms in the query and some basic statistics over the collection of documents in the index. A more intuitive overview of logical parts of BM25 formula is shown on a diagram below, taken from the [Lectures 17-18 of the Text Technologies for Data Science (TTSDS) course at the University of Edinburgh](https://www.youtube.com/watch?v=XFIKE34HafY):

![BM25 parts]({{ site.baseurl }}/assets/media/blog-images/2022-09-28-ltr-with-opensearch-and-metarank/bm25.png){:class="img-centered"}

BM25 scoring function is typically applied to all the documents in the result set, so it should be fast not to become a CPU bottleneck on large sets.

But in common use-cases like e-commerce, term frequencies and index statistics are not the only factors affecting relevance. For example, using implicit visitor behavior and item metadata may improve relevance, but these factors then should be mixed into the scoring function.

OpenSearch has a custom scoring function support using the [script_score](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-script-score-query.html) query:
```
GET /_search
{
  "query": {
    "script_score": {
      "query": {
        "match": { "message": "socks" }
      },
      "script": {
        "source": "doc['click_count'].value * _score"
      }
    }
  }
}
```

In the example above, we multiply the BM25 score with the stored column of the per-document number of clicks this document received. With this approach, you can:
* use item metadata from stored fields in the ranking (item price, for example)
* put external ranking factors into the scoring function, like having a separate set of weights for mobile and desktop visitors.

But `script_score` approach also has a set of important drawbacks:
* As the scoring function is invoked on each matching document, **you cannot do any complex computations inside**.
* Which scoring formula should you have? There are no common ones, and you have to **invent your own scoring function**.
* Scoring formula typically has a set of constants and weights. **How to choose the best values for parameters**?
* Feature values used in the ranking formula should be either stored in the index (**requiring a frequent full reindexing**), or served outside the search (**requiring a custom satellite [Feature Store](https://www.featurestore.org/what-is-a-feature-store)**)

## Secondary reranking

There exists another approach to ranking, a secondary/multi-level re-ranking. The idea of such an approach is to split retrieval and multiple re-ranking phases into separate independent steps:
* first-level retrieves a full set of results without any extra ranking at all.
* second-level fast ranker like BM25 does an initial scoring to reduce the number of matching documents to a top-N most relevant documents, focusing on [recall metric](https://en.wikipedia.org/wiki/Precision_and_recall).
* finally, third-level slow ranker reorders only a top-N candidates into the final ranking, focusing on a [precision metric](https://en.wikipedia.org/wiki/Precision_and_recall).

This approach is widespread in the industry. For a good overview, watch a talk [ Berlin Buzzwords 2019: Michael Sokolov & Mike McCandless–E-Commerce search at scale on Apache Lucene](https://youtu.be/EkkzSLstSAE?t=2191) on how multi-stage ranking is implemented on amazon.com:

![Multi-phase ranking]({{ site.baseurl }}/assets/media/blog-images/2022-09-28-ltr-with-opensearch-and-metarank/mphase.png){:class="img-centered"}

Multi-stage ranking also has a set of its tradeoffs:
* **it operates only on top-N candidates**, so if your first-level ranker under-scored a document (so it wasn't included in the top-N set), it may be missing from the final ranking.
* you had to **build such a system in-house**, as before now, there were no open-source solutions for this case.

But as final re-ranking is happening outside your search application and happens only on a top-N subset of documents, you can implement complex [Learn-to-Rank](https://en.wikipedia.org/wiki/Learning_to_rank) algorithms like [LambdaMART](https://softwaredoug.com/blog/2021/11/28/how-lammbamart-works.html).

## Metarank

[Metarank](https://github.com/metarank/metarank) is an open-source secondary reranker:
* Implements [LambdaMART](https://docs.metarank.ai/reference/overview/supported-ranking-models) on top of embedded feature engineering pipeline.
* [A YAML DSL](https://docs.metarank.ai/reference/overview/feature-extractors) defining ranking factors: rates, counters, windows, UA/Referer/GeoIP parsers, etc.

As a secondary reranker, it's agnostic to the way you perform the candidate retrieval: it should be integrated with your app, and not the search engine:

![Secondary reranking]({{ site.baseurl }}/assets/media/blog-images/2022-09-28-ltr-with-opensearch-and-metarank/reranking.png){:class="img-centered"}

Metarank's ranking predictions are based on past historical click-through events. These events are analyzed, aggregated into a set of [implicit judgments](https://softwaredoug.com/blog/2021/02/21/what-is-a-judgment-list.html), and later used to train the ML model. Finally, in the real-time inference stage, the model tries to predict the best ranking based on a past visitor behavior:

![Secondary reranking]({{ site.baseurl }}/assets/media/blog-images/2022-09-28-ltr-with-opensearch-and-metarank/inside.png){:class="img-centered"}

### Preparing historical events

Metarank used historical click-through events as an ML training dataset::
1. **Metadata**: visitor or item-specific information was updated, like item price, tags, and CRM visitor profile.
```json
{
  "event": "item",
  "id": "81f46c34-a4bb-469c-8708-f8127cd67d27",
  "item": "product1",
  "timestamp": "1599391467000",
  "fields": [
        {"name": "title", "value": "Nice jeans"},
        {"name": "price", "value": 25.0},
        {"name": "color", "value": ["blue", "black"]},
        {"name": "availability", "value": true}
  ]
}
```
2. **Impression**: visitor viewed an item listing. Example: search results, collection, rec widget was displayed.
```json
{
  "event": "ranking",
  "id": "81f46c34-a4bb-469c-8708-f8127cd67d27",
  "timestamp": "1599391467000",
  "user": "user1",
  "session": "session1",
  "fields": [
      {"name": "query", "value": "socks"}
  ],
  "items": [
        {"id": "item3", "relevancy":  2.0},
        {"id": "item1", "relevancy":  1.0},
        {"id": "item2", "relevancy":  0.5} 
  ]
}
```
3. **Interaction**: visitor acted on an item from the list. Example: click, add-to-cart, mouse hover, like.
```json
{
  "event": "interaction",
  "id": "0f4c0036-04fb-4409-b2c6-7163a59f6b7d",
  "impression": "81f46c34-a4bb-469c-8708-f8127cd67d27",
  "timestamp": "1599391467000",
  "user": "user1",
  "session": "session1",
  "type": "purchase",
  "item": "item1",
  "fields": [
        {"name": "count", "value": 1},
        {"name": "shipping", "value": "DHL"}
  ],
}	
```

### Mapping events to ranking factors

Metarank has a rich DSL, which can help you map feedback events to the actual numerical ranking factors. Apart from some simple cases like [directly using item metadata numerical fields](https://docs.metarank.ai/reference/overview/feature-extractors/scalar), Metarank can also handle complex ML features.

You can do a one-hot/label encoding of low-cardinality string fields:
```yaml
- name: genre
  type: string
  scope: item
  source: item.genre
  values:
  - comedy
  - drama
  - action
```

Extract and one-hot encode a mobile/desktop/tablet category from User-Agent field:
```yaml
- name: platform
  type: ua
  field: platform
  source: ranking.ua
```

A sliding window count of interaction events for a particular item:
```yaml
- name: item_click_count
  type: window_count
  interaction: click
  scope: item
  bucket_size: 24h         // make a counter for each 24h rolling window
  windows: [7, 14, 30, 60] // on each refresh, aggregate to 1-2-4-8 week counts
  refresh: 1h
```

Rates:
```yaml
- name: CTR
  type: rate
  top: click      // divide number of clicks
  bottom: impression // to number of examine events
  scope: item
  bucket: 24h     // aggregate over 24-hour buckets
  periods: [7, 14, 30, 60] // sum buckets for multiple time ranges
```

There are many more feature extractors available, so check  [Metarank docs](https://docs.metarank.ai) for other examples and a more detailed [quick-start guide](https://docs.metarank.ai/introduction/quickstart).

These feature extractors map events into numerical features and form a set of implicit judgments, which are later used for ML model training:

![Implicit judgments diagram]({{ site.baseurl }}/assets/media/blog-images/2022-09-28-ltr-with-opensearch-and-metarank/ij.png){:class="img-centered"}

## Sending requests

The integration between your search application, OpenSearch and Metarank probably require a couple of additions to your current setup:
* **Feedback events**: it's time to start collecting visitor feedback events if you're not yet doing so. You can either roll your own or use existing open-source telemetry collectors like [Snowplow Analytics](https://docs.metarank.ai/reference/overview-1/snowplow).
* Metarank uses **Redis as a state store**. Redis node sizing is usually depends on your ML feature setup and number of users, you can check the [Metarank RAM usage benchmark](https://blog.metarank.ai/metarank-ram-usage-benchmark-391c7018aaa) for ballpark estimations for your use case.
* After receiving a response with top-N candidates from OpenSearch, you need to send an extra request to Metarank to perform reranking.

![Integration diagram]({{ site.baseurl }}/assets/media/blog-images/2022-09-28-ltr-with-opensearch-and-metarank/integration.png){:class="img-centered"}

An example reranking request is the same as the ranking event above:
```json
{
  "event": "ranking",
  "id": "id1",
  "items": [
    {"id":"72998"},  {"id":"67197"},  {"id":"77561"},  {"id":"68358"},
    {"id":"72378"},  {"id":"85131"},  {"id":"94864"},  {"id":"68791"},
    {"id":"109487"}, {"id":"59315"},  {"id":"120466"}, {"id":"90405"},
    {"id":"117529"}, {"id":"130490"}, {"id":"92420"},  {"id":"122882"},
    {"id":"113345"}, {"id":"2571"},   {"id":"122900"}, {"id":"88744"},
    {"id":"95875"},  {"id":"60069"},  {"id":"2021"},   {"id":"135567"},
    {"id":"122902"}, {"id":"104243"}, {"id":"112852"}, {"id":"102880"},
    {"id":"96610"},  {"id":"741"},    {"id":"166528"}, {"id":"164179"},
    {"id":"71057"},  {"id":"3527"},   {"id":"6365"},   {"id":"6934"},
    {"id":"114935"}, {"id":"8810"},   {"id":"173291"}, {"id":"1580"},
    {"id":"1917"},   {"id":"135569"}, {"id":"106920"}, {"id":"1240"},
    {"id":"85056"},  {"id":"780"},    {"id":"1527"},   {"id":"5459"},
    {"id":"8644"},   {"id":"60684"},  {"id":"7254"},   {"id":"44191"},
    {"id":"97752"},  {"id":"2628"},   {"id":"541"},    {"id":"106002"},
    {"id":"2012"},   {"id":"79357"},  {"id":"6283"},   {"id":"113741"},
    {"id":"27660"},  {"id":"34048"},  {"id":"1882"},   {"id":"1748"},
    {"id":"34319"},  {"id":"1097"},   {"id":"115713"}, {"id":"2916"}
  ],
  "user": "alice",
  "session": "alice1",
  "timestamp": 1661345221008
}
```

Metarank will respond with the same set of requested items, but in another ordering: 
```json
{
 "items": [
  {"item": "1580",   "score": 3.345952033996582},
  {"item": "5459",   "score": 2.873959541320801},
  {"item": "8644",   "score": 2.500633478164673},
  {"item": "56174",  "score": 2.2979140281677246},
  {"item": "2571",   "score": 2.0133864879608154},
  {"item": "1270",   "score": 1.807900071144104},
  {"item": "109487", "score": 1.7143194675445557},
  {"item": "589",    "score": 1.706472396850586},
  {"item": "780",    "score": 1.7030035257339478},
  {"item": "1527",   "score": 1.6445566415786743},
  {"item": "60069",  "score": 1.6372750997543335},
  {"item": "1917",   "score": 1.6299139261245728}
 ]
}
```

## OpenSearch Remote Ranker Plugin RFC

OpenSearch project maintainers are currently discussing a new approach for a better and more flexible reranking framework: [ [RFC] OpenSearch Remote Ranker Plugin (semantic)](https://github.com/opensearch-project/search-relevance/issues/4).

The main idea is that OpenSearch project will:
* **define the common ranking API**, and handle the reranking process internally; no need to send multiple queries from the application to different backends.
* multiple rankers can implement this common API and can be hot-swappable with **no need to modify the application code** while implementing reranking. 

To quote the original RFC:

> The OpenSearch Semantic Ranker is a plugin that will re-rank search results at search time by calling an external service with semantic search capabilities for improved accuracy and relevance. This plugin will make it easier for OpenSearch users to quickly and easily connect with a service of their choice to improve search results in their applications.

The plugin will modify the OpenSearch query flow and do the following:

1. **Get top N document results** from the OpenSearch index.
2. **Preprocess document results** and prepare them to be sent to an external “re-ranking” service.
3. **Call the external service** that uses semantic search models to re-rank the results.

![reranking with a plugin]({{ site.baseurl }}/assets/media/blog-images/2022-09-28-ltr-with-opensearch-and-metarank/reranking2.png){:class="img-centered"}

Metarank developers are already collaborating with OpenSearch team on this proposal and plan to support the **Remote Ranker Plugin API** when it is released.
