---
layout: post
title:  "Fine Dining for Indices"
authors:
- nateboot

date: 2022-03-09
categories:
 - intro

excerpt: "There are a lot of reasons you might want to fine-tune indices on an OpenSearch cluster. Every workflow has different requirements, and the default behavior of OpenSearch might not suit your use case. Before ingesting with reckless abandon to fill an index with data, enjoy some insight on tuning an index. "
meta_description: "This article helps create the most efficient OpenSearch index mapping that you can think of."
meta_keywords: "data ingestion, indices, opensearch, index mapping"
redirect_from: "/blog/intro/2022/03/fine-dining-for-indices/"
---

## Is Your Cluster Eating Healthy? 

There are a lot of reasons you might want to fine-tune indices on an OpenSearch cluster.  Every workflow has different requirements, and the default behavior of OpenSearch might not suit your use case.  Before ingesting with reckless abandon to fill an index with data, enjoy some insight on tuning an index.  A small bit of foresight can help fine tune a cluster for speed or space efficiency to suit a particular workflow. 

## Are You Going To Eat All of That? 

By default, all of the fields in an ingested document become part of the index. If they are not part of the field mapping for that index, a mapping will be added.  Conversely, only fields that are part of the index can be queried and returned in search results after the document is ingested. By using an _index mapping_ API call before you ingest data, control is taken over which fields become part of the index and which fields do not. Just one form of caloric restriction - consider this dev tool snippet: 


```
PUT dynamic_mapping_index
{
    "mappings": {
        "properties": {
            "eat_me": {
                "type": "text"
            },
            "dont_index_me": {
                "type": "text",
                "index": false
            },
            "drink_me": {
                "type": "text"                
            }
        }
    }
}
```

`dynamic_mapping_index` will refuse to index any ingested fields  called `dont_index_me`. If you later decide to retrieve the document you will still find the fields and values stored in the `_source` object. **This tradeoff is one of efficiency.** The size of your index will be somewhat proportional to the amount of data you store in it. Deciding not to index certain fields means a smaller index, which means a smaller cluster. 


## The Proof is in the Pudding 

How does this work in action? Remember, the field `dont_index_me` is explicitly not part of the index because of the mapping property of `index: false`. So, when you add a document with this field it isn't being added to the index but is being stored.

```
POST dynamic_mapping_index/_doc
{
	"eat_me": "iron ration",
	"drink_me": "potion of index familiarity",
	"dont_index_me": "I'm expecting this field to be ingested, but because I'm familiar with my data I know beforehand I don't need it. It will not be indexed and won't be returned in search queries. It will be retrievable in the `_source` object of this document is ever retrieved.",
	"some_other_field": "This field is not in the mapping to exemplify Dynamic Mapping."
}
```

Let us try a search query using the field `dont_index_me`: 

```
GET dynamic_mapping_index/_search
{
	"query": {
		"match": {
		    "dont_index_me": "what?!"
		}
	}
}

```

You'll be met with an error message. 

```
{
  "error" : {
    "root_cause" : [
      {
        "type" : "query_shard_exception",
        "reason" : "failed to create query: Cannot search on field [dont_index_me] since it is not indexed.",
	...
      }
    ],
  ...
  "status" : 400
}


```

However, retrieve the document you stored and you'll see that `dont_index_me` is in the `_source` object. 

```

GET dynamic_mapping_index/_doc/xxxxxxxxxxx
{
  ...
  "found" : true,
  "_source" : {
    "eat_me" : "iron ration",
    "drink_me" : "potion of index familiarity",
    "dont_index_me" : "I'm expecting this field to be ingested, but I know beforehand I don't need it. It will not be indexed and won't be returned in search queries. It will be retrievable in the `_source` object if this document's id is retrieved",
    "some_other_field" : "This should exemplify dynamic mapping when we check the mapping later."
  }
}


```

If you look at the mapping for `dynamic_mapping_index` - 

```
GET dynamic_mapping_index/_mapping
{
  "dynamic_mapping_index" : {
    "mappings" : {
      "properties" : {
        "dont_index_me" : {
          "type" : "text",
          "index" : false
        },
        "drink_me" : {
          "type" : "text"
        },
        "eat_me" : {
          "type" : "text"
        },
        "some_other_field" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        }
      }
    }
  }
}
```

Wait a second - ingesting a field that wasn't explicitly mapped added a new mapping. `some_other_field` wasn't there in the mapping until a new document was added that contained that field. This exemplifies a great dining tip: 

## Please Ingest Responsibly!

OpenSearch will index every single field encountered in an ingested document. If a new field is ingested, OpenSearch will do its best to determine the data type and update the index mapping accordingly. This is called “Dynamic Mapping” and is also the default behavior. This is where being intimate with your data set is very helpful. Being too granular can cause what is known as a **mapping explosion**, where the number of fields in an index causes storage and retrieval to be bound and slow. 

If your diet is particularly strict, you can ignore fields that are not part of an explicit mapping. Consider the previous example with another option added:


```
PUT explicit_mapping_index
{
    "mappings": {
    "dynamic" : false,
        "properties": {
            "eat_me": {
                "type": "text"
            },
            "drink_me": {
                "type": "text"                
            },
            "dont_index_me": {
                "type": "text",
                "index": false
            }
        }
    }
}
```

Note the addition of `dynamic: false`. With this option in place, your mapping will never be automatically updated when ingesting a field that has not been seen before.  Let's repeat our previous experiment with this new **explicitly mapped** index. 

```
POST explicit_mapping_index/_doc
{
	"eat_me": "iron ration",
	"drink_me": "potion of index familiarity",
	"dont_index_me": "I'm expecting this field to be ingested, but because I'm familiar with my data I know beforehand I don't need it. It will not be indexed and won't be returned in search queries. It will be retrievable in the `_source` object if this document is ever retrieved.",
        "some_other_field": "This field is not in the mapping to exemplify Dynamic Mapping."
}
```

Remember with the **dynamically mapped** index, a new entry was added to the mapping when a new field was ingested. Checking our mapping now shows that `some_other_field` was not added automatically. 

```
GET explicit_mapping_index/_mapping
{
  "explicit_mapping_index" : {
    "mappings" : {
      "dynamic" : "false",
      "properties" : {
        "dont_index_me" : {
          "type" : "text",
          "index" : false
        },
        "drink_me" : {
          "type" : "text"
        },
        "eat_me" : {
          "type" : "text"
        }
      }
    }
  }
}
```

## Can I Keep the Recipe? 

By default the entire document is ingested to the `_source` object. `_source` can be disabled (it is by default enabled) when creating your index,  usually for storage space efficiency.  Ingested documents are indexed, but the originally submitted document is not stored. In this case, if you decide not to index every field encountered, the data will not be part of the index, nor will it be retrievable from the `_source` object. 

Consider this index creation API call that would disable saving the `_source` object: 

```
PUT no_source_index
{
    "mappings": {
    "_source": { "enabled": false}, 
    "dynamic" : false,
        "properties": {
            "eat_me": {
                "type": "text"
            },
            "drink_me": {
                "type": "text"
            },
            "dont_index_me": {
                "type": "text",
                "index": false
            }
        }
    }
}
```

And again, the same experiment: 

```
POST no_source_index/_doc
{
  "eat_me": "iron ration",
  "drink_me": "potion of index familiarity",
  "dont_index_me": "I'm expecting this field to be ingested, but because I'm familiar with my data I know beforehand I don't need it. It will not be indexed and won't be returned in search queries. It will be retrievable in the `_source` object if this document is ever retrieved.",
  "some_other_field": "This field is not in the mapping to exemplify Dynamic Mapping."
}
```

No source field! 

```
GET no_source_index/_doc/xxxxxxxxxxx
{
  "_index" : "no_source_index",
  "_type" : "_doc",
  "_id" : "u7jIZn8BGDFfrMtSqjOH",
  "_version" : 1,
  "_seq_no" : 0,
  "_primary_term" : 1,
  "found" : true
}
```


## Save the Leftovers? 

There are also other options for keeping only specific pieces of the `_source` material after indexing. This retains the `_source` document, but not in its entirety.  While this may reduce the size of the resulting `_source` object, you will lose the data you exclude if it were to be re-indexed, an operation that takes all of the documents `_source` objects in an index and re-processes them into a new index. 

One more index: 


```
PUT exclude_index
{
    "mappings": {
    "_source": { 
      "includes": ["eat_me.*","drink_me.*"],
      "excludes": ["*.msg", "*.salt"]
    }, 
    "dynamic" : false,
        "properties": {
            "eat_me": {
                "type": "text"
            },
            "drink_me": {
                "type": "text"
            },
            "dont_index_me": {
                "type": "text",
                "index": false
            }
        }
    }
}
```

A dash of data: 

```
POST exclude_index/_doc
{
	"eat_me": "iron ration",
	"secret_ingredient": {
		"msg": "yes I'm MSG, the flavor enhancer.", 
		"salt": "I'm salt. Also a flavor enhancer."
	},
	"drink_me": "potion of index familiarity",
	"dont_index_me": "I'm expecting this field to be ingested, but because I'm familiar with my data I know beforehand I don't need it. It will not be indexed and won't be returned in search queries. It will be retrievable in the `_source` object if this document is ever retrieved.",
	"some_other_field": "This field is not in the mapping to exemplify Dynamic Mapping."
}
```

What's leftover in `_source`?

```
GET exclude_index/_doc/xxxXxXXxXxXx
{
	...
	"found" : true,
	"_source" : {
		"drink_me" : "potion of index familiarity",
		"eat_me" : "iron ration"
	}
}
```

The `_source` is filtered down to only the elements described in the `include` and `exclude` stanzas in the index mapping.


## Nutritional Information Available

If you're worried about the size of your index, don't forget that you can always check the amount of disk space its using with an API call. Need a fun at-home experiment? Try defining two exact indices, one with `_source` and one without. How does their resource usage compare? 

Here's how our examples are adding up so far: 


```
GET /_cat/indices/dynamic_mapping_index?format=json
[
  {
    "health" : "green",
    "status" : "open",
    "index" : "dynamic_mapping_index",
    "uuid" : "9g7x9PRoSyGcQp-3UMrP6g",
    "pri" : "1",
    "rep" : "1",
    "docs.count" : "1",
    "docs.deleted" : "0",
    "store.size" : "10.1kb",
    "pri.store.size" : "5kb"
  }
]


GET _cat/indices/explicit_mapping_index?format=json
[
  {
    "health" : "green",
    "status" : "open",
    "index" : "explicit_mapping_index",
    "uuid" : "D66KzvYJSme5WZQU28YQDw",
    "pri" : "1",
    "rep" : "1",
    "docs.count" : "1",
    "docs.deleted" : "0",
    "store.size" : "8.3kb",
    "pri.store.size" : "4.1kb"
  }
]

GET _cat/indices/exclude_index?format=json
[
  {
    "health" : "green",
    "status" : "open",
    "index" : "exclude_index",
    "uuid" : "3T4shiqERUS5qJTDm6qTWQ",
    "pri" : "1",
    "rep" : "1",
    "docs.count" : "1",
    "docs.deleted" : "0",
    "store.size" : "13.8kb",
    "pri.store.size" : "6.9kb"
  }
]

```


## Flavor To Taste, and Bon Apetít!

A lot of index functionality is controlled by these small, sometimes overlooked stanzas of configuration. Storing the source document, deciding whether to index or not index fields, or even whether new fields should be added on the fly are all things that have a lasting impact on the way it behaves. The way that OpenSearch comes out of the box is suitable for a lot of tasks, but there’s no replacement for having intimacy and forethought with your own data.  Getting comfortable with the index configuration options will help ensure your cluster is ingesting properly. 

## How Was The Service Today?

As a community its important to know the team is advocating for all of the users. Please get involved and speak up if you find anything that would help you get more out of OpenSearch.  Whether via the [GitHub Project](https://github.com/opensearch-project), the [community forums](https://discuss.opendistrocommunity.dev/) or any of the other ways you can [connect with the community.](https://opensearch.org/connect.html) 










