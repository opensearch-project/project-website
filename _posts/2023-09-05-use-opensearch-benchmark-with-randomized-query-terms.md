---
layout: post
title:  "Use OpenSearch Benchmark with Randomized Query Terms"
authors:
- handler
date: 2023-09-05
categories:
  - technical-post
meta_keywords: opensearch-benchmark
meta_description: Learn how to add a randomized query set to an OpenSearch Benchmark workload
---

Performance testing is part science and part art. On the measurement side, you employ science to run test cases, collect and visualize metrics, and evaluate results. On the test creation side, you use intuition and understanding to make sure that you build coverage across the use cases and data that will comprise the majority of the uses of OpenSearch.

[OpenSearch Benchmark](https://opensearch.org/docs/latest/benchmark/index/) is a community-driven, benchmarking framework that makes it easy to benchmark your workload against OpenSearch. You can use OpenSearch benchmark to create a custom workload, pulling data from your indices on OpenSearch, and then customize that workload to your requirements. 

One limitation of OpenSearch Benchmark is that when you run a search operation, the query itself is hard-coded. If you want to randomize your query workload across a set of possible search terms, there's no out-of-the-box way to do that. In this post, you'll use data from [BoardgameGeek.com](https://boardgamegeek.com/) (BGG) to create a custom Opensearch Benchmark workload. You'll then create two, one-line-per-query files and use those files to create randomized terms for querying OpenSearch. 

## Prerequisites

To set up to follow this example, you’ll need the following:

- **Python 3.8+**: Follow instructions to install [Python 3.8+](https://www.python.org/downloads/)
- **Java Development Kit (JDK) 17**: Follow instructions to [install JDK 17](https://www.oracle.com/java/technologies/downloads/)
- **OpenSearch Benchmark**: Follow instructions to [install OpenSearch Benchmark](https://opensearch.org/docs/latest/benchmark/installing-benchmark/). I installed in a virtual environment in a scratch directory that also holds the custom workload and config. 
- **OpenSearch Cluster**: For this walkthrough, I used [Docker Desktop](https://www.docker.com/products/docker-desktop/) to run OpenSearch on my machine. Follow the [OpenSearch Quick Start](https://opensearch.org/docs/latest/quickstart/) to create an OpenSearch cluster.
- **Data in OpenSearch**: [BoardgameGeek provides APIs](https://boardgamegeek.com/wiki/page/BGG_XML_API2) that deliver data to you in Extensible Markup Language (XML). For this example, I used and extended [sample code from the Open Distro for Elasticsearch project that downloads some games from BoardGameGeek](https://github.com/opendistro-for-elasticsearch/sample-code/tree/main/BGG) to load games into OpenSearch in a `games` index. The data contains names, descriptions, ratings, user comments, and more. If you have your own data set, you can load that into OpenSearch instead.

## Generate a custom workload

Once you have your data loaded into the games index, create a working directory and `cd` into it. I created a directory `osb`. Create a custom workload by running:

```opensearch-benchmark create-workload --workload=bgg --target-hosts="<your cluster endpoint>" --client-options="basic_auth_user:'<your user name>',basic_auth_password:'<your password>',verify_certs:false" --indices=games --output-path=.```

**NOTE:** This example uses basic authentication. Be sure to replace `<your user name>`, and `<your user password>` with the values you used to set up the security plugin in the command-line above. Replace `<your cluster endpoint>` with the endpoint and port for your cluster.

Opensearch benchmark creates a `bgg` directory with a number of files, including `games.json`, and `workload.py`. Examine `games.json`. This file contains the index settings that OpenSearch Benchmark will use when creating the games directory in your test cluster. In the settings section, you can see that Benchmark has created some templatized settings for `number_of_shards`, and `number_of_replicas`.

```
    "settings": {
        "index": {
            "number_of_replicas": "{{number_of_replicas | default(1)}}",
            "number_of_shards": "{{number_of_shards | default(1)}}",
            "replication": {
                "type": "DOCUMENT"
            }
        }
    }
```

When you run Benchmark from the command-line, you can set these values to try out different test cases.

Examine `workload.json`. This file contains the workload description in the `indices` and `corpora` sections. The `schedule` section defines the operations that the test runs, in the order it runs them, by default. The default test framework deletes any existing index named `games`, creates a fresh index, waits for the cluster to settle, then bulk loads the data it has downloaded, and runs a `match_all` query.

You can test this configuration by running the command

```
opensearch-benchmark execute-test --pipeline benchmark-only --workload-path=<path-to-your-bgg-folder> --target-host=http://localhost:9200 --client-options="use_ssl:true,basic_auth_user:'<your user name>',basic_auth_password:'<your password>',verify_certs:false" --workload-params="bulk_size:300"
```

Be sure to replace `<your user name>`, `<your user password>`, and the `<path-to-your-bgg-folder>` with the correct values. In the command-line above, you can see where I set the actual `_bulk` size to 300 with the `--workload-params`. Benchmark resolves and inserts this value in the `bulk` operation from `workload.json`

```
    {
      "operation": {
        "operation-type": "bulk",
        "bulk-size": {{bulk_size | default(100)}},
        "ingest-percentage": {{ingest_percentage | default(100)}}
      },
      "clients": {{bulk_indexing_clients | default(8)}}
    }
```

Use `--workload-params` to vary values across your test cases.

## Prepare query terms

Looking at `workload.json`, you can see that the test runs a single, `match-all` query. Of course, this is not a realistic test. You could make the query more robust, running one or many match queries, but that wouldn't be adequate coverage or represent realistic, end-user queries. To build a better query set, I downloaded games from the BGG API, and pulled out the `primary_name` and `description` fields. I tokenized and cleaned this data then generated 1-5 term query strings and wrote 100,000 of them to a file called `bgg_words.txt`. You'll see in the next section how to wire in this set of terms. Here's a sample:

```
Introduces Professional 
declarant petals Machen 
destruyelos 80C tapped enemy 
bombing sculpts Scorn 8022 
Mystical interpose clearance Canope 
fulfilled 
Colony mortality 
5ive 
```

To give a little more reality to the query set, I also downloaded a list of 10,000 english words (`english_words.txt`) that will provide single-term queries. You can find a similar list on the internet, generate one of your own, or even skip this step.

One risk with the BGG terms and the English words, is that you will have too many queries that don't match any documents. These "zero-result" queries are faster and cause less load than queries that have matches. If the ratio of zero-result queries is too high, your test results won't be accurate. To solve that, as part of your testing, you can track the hit counts for all of your queries and adjust your term sets to ensure that you have matches and zero-result queries that are representative for your workload.

## Build a custom parameter source

To wire your query terms in to the workload, use a custom parameter source. Modify the search operation in `workload.json` to

```
    {
      "operation": {
        "operation-type": "search",
        "param-source": "search-term-source",
        "index": "games"
      },
      "clients": {{search_clients | default(8)}},
      "iterations": 1000
    }
```

You add a `param-source` parameter that calls the item `search-term-source` from Benchmark's registry. Create `workload.py` in the `bgg` directory. Benchmark will look for a file with this name and execute it on startup. You also increase the number of `iterations` for this operation to 1,000

Create a file called `workload.py` with the contents below, in the same directory as `workload.json`. The `random_search_term` function selects random terms from either the English words corpus or the BGG corpus and injects them into a term query body. The `register` function registers the `random_search_term` function as the `search-term-source` parameter source. 

```
import random
import logging

# Load the source terms from the bgg_words and english_words files. To 
# keep it simple, the files are structured as a single set of terms per line.
english_words = None
with open('english_words.txt', 'r') as f:
    lines = f.readlines()
    english_words = list(map(lambda x: x.lstrip().rstrip(), lines))


bgg_words = None
with open('bgg_words.txt', 'r') as f:
    lines = f.readlines()
    bgg_words = list(map(lambda x: x.lstrip().rstrip(), lines))


# This function generates and returns a full query body. Be sure to match
# the function signature and return structure as below.
def random_search_term(track, params, **kwargs):
    index_name = params.get("index")

    # Choose either a single english term, or one of the query
    # term sets from the BGG data.
    collection = random.choice([english_words, bgg_words])
    query = random.choice(collection)

    # logging.log(logging.INFO, f'Query: {query}')

    # Returns a basic term query against the description field. In most cases, for performance
    # testing, you want to disable the request cache. This carries through any cache parameter
    # specified in the workload.
    return {
        "body": {
            "query": {
                "term": {
                    "description": query
                }
            }
        },
        "index": index_name,
        "cache": params.get("cache", False)
    }


# This maps the random_search_term function to the search-term-source 
# parameter source specified in workload.json
def register(registry):
    registry.register_param_source("search-term-source", random_search_term)
```

Run OpenSearch Benchmark with the command line above. If you want to validate that Benchmark is pulling in the terms correctly, uncomment the line that logs the query terms. You can also enable slow logging in your OpenSearch cluster. **Note**, logging each query, or enabling slow logs will materially affect your performance results, so be sure to turn them off for actual measurement.

## Summary

In this post, you learned how to use `opensearch-benchmark create-workload` to read data from a running cluster, and build a test framework for that data. With the test framework in place, you generalized the search operation to provide a realistic set of queries by using terms from the corpus and from the English language. You can generalize this method to pull in and randomize elements of your query to use OpenSearch Benchmark and get accurate results.