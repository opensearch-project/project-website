---
layout: post
title:  "Aggregate by multiple terms in OpenSearch"
authors:
- penghuo 
- dtaivpp
date: 2022-07-21
categories:
 - technical-post
redirect_from: "/blog/technical-post/2022/07/aggregate-by-multiple-terms/"
excerpt: "Multi-terms aggregation allows you to group and sort results from a query. While terms aggregation has existed in OpenSearch for some time, multi-terms aggregation allows for sorting by deeper levels. This is particularly useful in the observability space."
---

Multi-terms aggregation allows you to group and sort results from a query. While terms aggregation has existed in OpenSearch for some time, multi-terms aggregation allows for sorting by deeper levels. This is particularly useful in the observability space. Say, for example, you need to identify servers that have the most contention for CPU so you can either redistribute the load or scale up the server. 

You can now do this with multi-terms aggregation, as shown by the demo below. This can be run from the *Dev Tools* section in OpenSearch Dashboards. If you need a test environment, you can spin up a single-node development environment using [Docker Compose](https://opensearch.org/docs/latest/opensearch/install/docker/#sample-docker-compose-file-for-development) (make sure you have at least 4 GB of memory available in *Preferences* → *Resources*). 

## Environment setup

First, we will set up a test index for storing our sample data. We can do this by issuing a `PUT` request with the index name we want to create—in this case, `test_0001`. The body in the example below contains the `settings` and `mappings` that we wish to use for each of the fields. 

```
PUT test_0001
{
  "settings": {
    "index": {
      "number_of_replicas": 0
    }
  },
  "mappings": {
    "properties": {
      "region": {
        "type": "keyword"
      },
      "host": {
        "type": "keyword"
      }, 
      "container": {
        "type": "keyword"
      },       
      "cpu": {
        "type": "integer"
      }       
    }
  }
}
```

Next, we can use the below `GET` request on the `_mapping` endpoint to validate the mappings have been created properly for our test index. 

```GET /test_0001/_mapping```

Finally, we will add some test data to practice with. Our data here has four fields: region, host, container, and CPU. 

```
PUT /test_0001/_bulk
{ "index" : { "_index" : "test_0001", "_id" : "1" } }
{ "region" : "iad", "host" : "h1", "container": "c1", "cpu": 10}
{ "index" : { "_index" : "test_0001", "_id" : "2" } }
{ "region" : "iad", "host" : "h1", "container": "c2", "cpu": 15}
{ "index" : { "_index" : "test_0001", "_id" : "3" } }
{ "region" : "iad", "host" : "h2", "container": "c1", "cpu": 20}
{ "index" : { "_index" : "test_0001", "_id" : "4" } }
{ "region" : "iad", "host" : "h2", "container": "c2", "cpu": 50}
{ "index" : { "_index" : "test_0001", "_id" : "5" } }
{ "region" : "dub", "host" : "h1", "container": "c1", "cpu": 50}
{ "index" : { "_index" : "test_0001", "_id" : "6" } }
{ "region" : "dub", "host" : "h1", "container": "c2", "cpu": 90}
{ "index" : { "_index" : "test_0001", "_id" : "7" } }
{ "region" : "dub", "host" : "h2", "container": "c1", "cpu": 50}
{ "index" : { "_index" : "test_0001", "_id" : "8" } }
{ "region" : "dub", "host" : "h2", "container": "c2", "cpu": 70}
```

## Using multi-terms aggregation

Now for the real fun! For those who may not have worked with aggregations, “hot” is an arbitrary name for this aggregation. Additionally, `"size": 0` specifies that we do not want to return the documents that contributed to the query. The `multi_terms` field accepts keyword fields that are then used as buckets for aggregation. This is similar to how the SQL `GROUP BY` statement works, where the order in which the terms are specified determines the order in which they are grouped in the results. 

The `order` section specifies an aggregation that should be used to order the buckets. The  `max-cpu` aggregation finds the maximum value of the CPU metric for each bucket. This layering of sorting is what makes multi-terms aggregation so powerful. 

```
GET /test_0001/_search
{
  "size": 0, 
  "aggs": {
    "hot": {
      "multi_terms": {
        "terms": [{
          "field": "region" 
        },{
          "field": "host" 
        }],
        "order": {"max-cpu": "desc"}
      },
      "aggs": {
        "max-cpu": { "max": { "field": "cpu" } }
      }      
    }
  }
}
```

Below we can see the results of our query. As a reminder, “hits” is empty here because we specified "size": 0 earlier, meaning we don’t want to return the documents that contributed to the aggregations. Now we can see clearly that the region dub has the servers with the highest CPU contention—in particular, host h1. 

```
{
  "took" : 3,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 8,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "hot" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : [
            "dub",
            "h1"
          ],
          "key_as_string" : "dub|h1",
          "doc_count" : 2,
          "max-cpu" : {
            "value" : 90.0
          }
        },
        {
          "key" : [
            "dub",
            "h2"
          ],
          "key_as_string" : "dub|h2",
          "doc_count" : 2,
          "max-cpu" : {
            "value" : 70.0
          }
        },
        {
          "key" : [
            "iad",
            "h2"
          ],
          "key_as_string" : "iad|h2",
          "doc_count" : 2,
          "max-cpu" : {
            "value" : 50.0
          }
        },
        {
          "key" : [
            "iad",
            "h1"
          ],
          "key_as_string" : "iad|h1",
          "doc_count" : 2,
          "max-cpu" : {
            "value" : 15.0
          }
        }
      ]
    }
  }
}
```

## Wrapping it up

With this information we can now see which regions and hosts have the most contention for CPU resources. This is just one example of how multi-terms aggregation can be useful. To learn more be sure to check out the [documentation page](https://opensearch.org/docs/latest/opensearch/bucket-agg/#multi-terms) or read the [original pull request](https://github.com/opensearch-project/OpenSearch/pull/2687). Additionally, if you find any issues or have questions, feel free to either create an [issue on GitHub](https://github.com/opensearch-project/OpenSearch/issues/new/choose) or ask a question on the [forum](https://forum.opensearch.org/c/opensearch/56)!
