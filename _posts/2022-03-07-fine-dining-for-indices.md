---
layout: post
title:  "Fine Dining for Indices"
authors:
- nateboot

date: 2022-03-07
categories:
 - intro

excerpt: "There are a lot of reasons you might want to fine-tune indices on an OpenSearch cluster. Every workflow has different requirements, and the default behavior of OpenSearch might not suit your use case. Before ingesting with reckless abandon to fill an index with data, enjoy some insight on tuning an index. "
---

## Is Your Cluster Eating Healthy? 

There are a lot of reasons you might want to fine-tune indices on an OpenSearch cluster.  Every workflow has different requirements, and the default behavior of OpenSearch might not suit your use case.  Before ingesting with reckless abandon to fill an index with data, enjoy some insight on tuning an index.  A small bit of foresight can help fine tune a cluster for speed or space efficiency to suit a particular workflow. 

## Are You Going To Eat All of That? 

By default, OpenSearch indexes all the fields in each document it ingests. Enabling or disabling this on a per field basis allows for a customized index with only specific fields in it. This does not nullify the original document - a field that isn’t indexed can still be retrieved and parsed from the `_source` field, but the data is not part of the index, nor can it be aggregated by visualizations.  Consider this dev tool snippet -

```
PUT my_index_name
{
    "mappings": {
        "properties": {
            "eat_me": {
                "type": "text"
            },
            "field_that_does_not_need_to_be_indexed": {
                "type": "text",
                "enabled": false
            },
            "drink_me": {
                "type": "text"                
            }
        }
    }
}
```

`my_index_name` will refuse to index any ingested fields  called `field_that_does_not_need_to_be_indexed` . If you later decide to retrieve the document you will still find the values stored in the `_source` element, just not in the index. **This tradeoff is one of efficiency.** The size of your index will be somewhat proportional to the amount of data you store in it. Deciding not to index certain fields means a smaller index, which means a smaller cluster. 

## Please Ingest Responsibly!

OpenSearch will index every single field encountered in an ingested document. If a new field is ingested, OpenSearch will do its best to determine the data type and update the index mapping accordingly. This is called “Dynamic Mapping” and is also the default behavior. This is where being intimate with your data set is very helpful. Being too granular can cause what is known as a **mapping explosion**, where the number of fields in an index causes storage and retrieval to be bound and slow. 

If your diet is particularly strict, you can ignore fields that are not part of an explicit mapping. Consider the previous example with another option added:


```
PUT my_index_name
{
    "mappings": {
    "dynamic" : false,
        "properties": {
            "eat_me": {
                "type": "text"
            },
            "field_that_does_not_need_to_be_indexed": {
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

Note the addition of `dynamic: false`. With this option in place, your mapping will never be automatically updated when ingesting a new field.  You can always check if your mapping has changed: 

```
GET /my_index_name/_mapping
```

## Can I Keep the Recipe? 

By default the entire document ingested is saved as a field named `_source`. This field can be disabled (it is by default enabled) when creating your index,  usually for storage space efficiency.  Ingested documents are indexed, but the originally submitted document is not stored. In this case, if you decide not to index every field encountered, the data will not be part of the index, nor will it be retrievable from the `_source` field. It will be lost to oblivion. 

Consider this snippet of the `mappings` section of an index creation API call that would disable saving the `_source` field: 

```
  "mappings": {
    "_source": {
      "enabled": false
    }
  }
```

## Save the Leftovers? 

There are also other options for keeping only specific pieces of the `_source` material after indexing. This retains the `_source` document, but not in its entirety.  While this may reduce the size of the resulting `_source` field, you will lose the data you exclude if it were to be re-indexed. It will cease to be. 


```
"mappings": {
    "_source": {
      "includes": [
        "food.*",
        "beverage.*"
      ],
      "excludes": [
        "*.msg",
        "*.salt"
      ]
    }
  }
```

## Nutritional Information Available

If you're worried about the size of your index, don't forget that you can always check the amount of disk space its using with an API call. Need a fun at-home experiment? Try defining two exact indices, one with `_source` and one without. How does their resource usage compare? 

```
GET /_cat/indices
```


## Flavor To Taste, and Bon Apetít!

A lot of index functionality is controlled by these small, sometimes overlooked stanzas of configuration. Storing the source document, deciding whether to index or not index fields, or even whether new fields should be added on the fly are all things that have a lasting impact on the way it behaves. The way that OpenSearch comes out of the box is suitable for a lot of tasks, but there’s no replacement for having intimacy and forethought with your own data.  Getting comfortable with the index configuration options will help ensure your cluster is ingesting properly. 

## How Was The Service Today?

As a community its important to know whether we’re advocating for all of the users. Please get involved and let us know if we’re providing what is needed to make the most out of OpenSearch. Whether via the [GitHub Project](https://github.com/opensearch-project), the [community forums](https://discuss.opendistrocommunity.dev/) or any of the other ways you can [connect with the community.](https://opensearch.org/connect.html) 










