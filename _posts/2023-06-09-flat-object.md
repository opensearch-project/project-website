---
layout: post
title:  "Use flat object in OpenSearch"
authors:
- mingshl
- kolchfa
date: 2023-06-09
categories:
 - technical-post
meta_keywords: 
meta_description: 

excerpt: OpenSearch 2.7 introduced the new `flat_object` field type. This field type is useful for objects with a large number of fields or when you are not familiar with the field names in your documents. The `flat_object` field type treats the entire JSON object as a string. Subfields within the JSON object are accessible using the flat object field name or the standard dot path notation, but they are not indexed for fast lookup. In this post, we explore how flat object simplifies mapping data structures and enhances the search experience in OpenSearch. 
---

OpenSearch 2.7 introduced the new `flat_object` field type. This field type is useful for objects with a large number of fields or when you are not familiar with the field names in your documents. The `flat_object` field type treats the entire JSON object as a string. Subfields within the JSON object are accessible using the flat object field name or the standard dot path notation, but they are not indexed for fast lookup. In this post, we explore how flat object simplifies mapping data structures and enhances the search experience in OpenSearch. 

## Dynamic mapping

In OpenSearch, a _mapping_ defines the structure of your data. It specifies field names, types, and indexing and analysis settings, ensuring that your data is organized and interpreted correctly. If you don't specify a custom mapping, OpenSearch infers the structure of your document automatically when you upload the document. This process is called _dynamic mapping_, where OpenSearch detects the document data structure and generates the corresponding mapping file. 

## When dynamic mapping falls flat

When documents have complex data structures or deeply nested fields, relying on dynamic mapping can lead to the number of mapped fields in an index quickly growing to hundreds or even thousands. This "mapping explosion" negatively impacts the performance of your cluster. Additionally, searching through deeply nested indexes with lengthy dot paths can be inconvenient, especially if you are unfamiliar with the document structure. Flat object solves both of these problems.

## Use case

To demonstrate a real life use case for the `flat_object` field type, we'll use the new ML Commons remote model inference project, in which you can store and search template documents. Some of the fields in the machine learning model template are user-defined key-value pairs. Because those are created by the user on the fly, it is difficult to predefine the mappings for the index that stores these documents.

### Example documents

For example, consider the following two template documents that connect OpenSearch to OpenAI and Amazon BedRock for model inference: 

```json
PUT test-index/_doc/1 
{
    "Metadata":{
        "connector_name": "OpenAI Connector",
        "description": "The connector to public OpenAI model service for GPT 3.5",
        "version": 1
    },
    "Parameters": {
        "endpoint": "api.openai.com",
        "protocol": "HTTP",
        "auth": "API_Key",
        "content_type" : "application/json",
        "model": "gpt-3.5-turbo"
    }
}
```

```json
PUT test-index/_doc/2 
{
    "Metadata":{
        "connector_name": "Amazon BedRock",
        "description": "The connector to Bedrock for the generative AI models",
        "version": 2
    },
   "Parameters": {
        "label": "default_label",
        "host": "localhost",
        "port": 8080,
        "protocol": "HTTP",
        "auth": "API_Key",
        "content_type" : "application/json",
        "policy":{
            "policy_id":"p_0001",
            "policy_name":"default_policy"
            }
    } 
}
```

### Mapping without flat object

If you don't specify mappings for the `test-index` and let OpenSearch apply dynamic mappings, one JSON document uploaded to an index causes OpenSearch to generate a mapping for every field and subfield. Thus, OpenSearch produces the following mapping, where you can trace every field and subfield of the preceding documents: 

```json
{
  "test-index": {
    "mappings": {
      "properties": {
        "Metadata": {
          "properties": {
            "connector_name": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            },
            "description": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            },
            "version": {
              "type": "long"
            }
          }
        },
        "Parameters": {
          "properties": {
            "auth": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            },
            "content_type": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            },
            "endpoint": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            },
            "host": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            },
            "label": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            },
            "model": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            },
            "policy": {
              "properties": {
                "policy_id": {
                  "type": "text",
                  "fields": {
                    "keyword": {
                      "type": "keyword",
                      "ignore_above": 256
                    }
                  }
                },
                "policy_name": {
                  "type": "text",
                  "fields": {
                    "keyword": {
                      "type": "keyword",
                      "ignore_above": 256
                    }
                  }
                }
              }
            },
            "port": {
              "type": "long"
            },
            "protocol": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            }
          }
        }
      }
    }
  }
}
```

However, often a model service has too many parameters or the number of model services increases when every model service has different parameters. With dynamic mapping, because every subfield is an indexable field, the mapping file can grow enormously. 

### Searching without flat object

When searching for a model parameter, you need to know the dot path to the subfield in advance. For example, if you are searching for a policy with id `p_0001`, you need to use the exact dot path `Parameters.policy.policy_id`:

```json
GET /test-index/_search
{
  "query": {
    "match": {"Parameters.policy.policy_id": "p_0001"}
  }
}
```

### Mapping with flat object

Using `flat_object`, you can save the entire `Parameters` fields as a string rather than JSON object and not specify the field names for its subfields: 

```json
PUT /test-index/
{
  "mappings": {
    "properties": {
      "Parameters": {
        "type": "flat_object"
      }
    }
  }
}
```

After uploading the same documents, you can check the mappings for `test-index`:

```json
GET /test-index/_mappings
```

The `Parameters` field, which is mapped as a `flat_object`, is the only indexable field. Its subfields are not indexed,effectively preventing a "mapping explosion:"


```json
{
  "test-index": {
    "mappings": {
      "properties": {
        "Metadata": {
          "properties": {
            "connector_name": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            },
            "description": {
              "type": "text",
              "fields": {
                "keyword": {
                  "type": "keyword",
                  "ignore_above": 256
                }
              }
            },
            "version": {
              "type": "long"
            }
          }
        },
        "Parameters": {
          "type": "flat_object"
        }
      }
    }
  }
}
```

### Searching with flat object

When searching for a model parameter, you can the use `flat_object` field name, `Parameters`: 

```json
GET /test-index/_search
{
  "query": {
    "match": {"Parameters": "p_0001"}
  }
}
```

Alternatively, you can choose to use the standard dot path notation for convenient exact match search:

```json
GET /test-index/_search
{
  "query": {
    "match": {"Parameters.policy.policy_id": "p_0001"}
  }
}
```

In both cases, the correct document is returned:

```json
{
  "took" : 142,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.0601075,
    "hits" : [
      {
        "_index" : "test-index",
        "_id" : "2",
        "_score" : 1.0601075,
        "_source" : {
          "Metadata" : {
            "connector_name" : "Amazon BedRock",
            "description" : "The connector to Bedrock for the generative AI models",
            "version" : 2
          },
          "Parameters" : {
            "label" : "default_label",
            "host" : "localhost",
            "port" : 8080,
            "protocol" : "HTTP",
            "auth" : "API_Key",
            "content_type" : "application/json",
            "policy" : {
              "policy_id" : "p_0001",
              "policy_name" : "default_policy"
            }
          }
        }
      }
    ]
  }
}
```

## Next steps

For more information about capabilities and limitations of flat object, see the [flat object documentation](https://opensearch.org/docs/latest/field-types/supported-field-types/flat-object/). 

We're adding the ability to search subfields in a flat object using a Painless script. See [this issue](https://github.com/opensearch-project/OpenSearch/issues/7138) for details. Also, we are adding support for [open parameters](https://github.com/opensearch-project/OpenSearch/issues/7137) to flat object.

To learn more about the new ML Commons remote model inference project mentioned in this post, see [Extensibility for OpenSearch Machine Learning](https://github.com/opensearch-project/ml-commons/issues/881).
