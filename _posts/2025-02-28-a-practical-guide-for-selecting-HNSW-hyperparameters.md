---
layout: post
title:  "A Practical Guide for Selecting HNSW Hyperparameters"
authors:
   - huibishe
   - jmazane
date: 2025-02-28
has_science_table: true
categories:
  - technical-posts
meta_keywords: HNSW, hyperparameters
meta_description: We publish 5 HNSW hyperparameters that sketch the good recall and good throughput region reasonably well. Customers can try them sequentially and stop once the expectred recall is reached.
---

Vector search is an essential component in many ML and data science pipelines. In the era of LLM, vector search has become the backbone technology for [RAG](https://aws.amazon.com/what-is/retrieval-augmented-generation/), that finding relevant context from a large collection of documents to improve generation quality. Doing exact KNN vector search in large scale can be very expensive. Thus, Approximate Nearest Neighbor (ANN) search methods, such as [Hierarchical Navigable Small Worlds](https://arxiv.org/pdf/1603.09320) (HNSW) is often used for efficiency [1]. 

Finding the right configurations of HNSW is essentially a multi-objective problem. The two objectives are the search quality and search speed. Search quality is often measured by recall@k, that is the fraction of the top k ground truth neighbors found in the k results returned by the HNSW. Search speed is often measured by query throughput, that is the number of queries executed per second.

The hyperparameters of HNSW decide the connection density of the graph in HNSW. A denser graph in HNSW usually has better recall but lower query throughput while a sparser graph usually has higher query throughput but lower recall. Identifying the configurations that satisfy the recall and latency requirements involves trying potentially many configurations and currently there is limited guidance on how to do it.

We focus on 3 most important HNSW hyperparameters:

* `M` – The maximum number of edges per vector in a graph. Higher values increase memory consumption but may improve search approximation.
* `efSearch` – The size of the candidate queue during search traversal. Larger values increase search latency but may improve approximation quality.
* `efConstruction` – Similar to efSearch, but used during index construction. Controls queue size when inserting new nodes. Larger values increase index build time but may improve search quality.

While one could use general Hyperparameter Optimization (HPO) technique to solve this problem, it can be expensive and the gain of it can be limited. Especially given we know the algorithm we want to optimize. Thus, we can use meta-learning to learn a set of good configurations that are close to the optimal while being very effective [3, 4]. 

Based on the technique introduced in the next section, we publish a list of 5 HNSW configurations that build denser and denser graph. The list of 5 configurations sketch the good recall and good throughput region reasonably well, and are close to the Pareto Frontiers across a wide range of datasets. In practice, our customers only need to **evaluate the 5 configurations sequentially**, and stop trying once the recall reaches their expectation. 

```Python
{'M': 16,  'efConstruction': 128, 'efSearch': 32}
{'M': 32,  'efConstruction': 128, 'efSearch': 32}
{'M': 16,  'efConstruction': 128, 'efSearch': 128}
{'M': 64,  'efConstruction': 128, 'efSearch': 128}
{'M': 128, 'efConstruction': 256, 'efSearch': 256}
```

## Portfolio learning for HNSW

We learn the 5 HNSW configurations with Portfolio learning [2,3,4], which learns a set of complementary configurations that when evaluating the set, at least one of them performs well on average. Following this idea, we aim to learn a set of HNSW configurations that represent different trade-offs between recall and query throughput, and are as close to the Pareto Frontiers as possible. 

### Prepare datasets

We collect 15 vector search datasets from diverse modalities, embedding models and distance functions, and list them as follows. For each dataset, we compute top 10 neighbors for every query in the test set using exact KNN search. 

| Dataset        | Dimensions   | Train size   | Test size   |   Neighbors | Distance      | Embedding                                      | Domain                        |
|:---------------|:-------------|:-------------|:------------|------------:|:--------------|:-----------------------------------------------|:------------------------------|
| [Fashion-MNIST](https://github.com/zalandoresearch/fashion-mnist)  | 784          | 60,000       | 10,000      |         100 | Euclidean     | -                                              | Image, cloth                  |                                             
| [MNIST](http://yann.lecun.com/exdb/mnist/)          | 784          | 60,000       | 10,000      |         100 | Euclidean     | -                                              | Image, digits                 |                                                          
| [GloVe](https://nlp.stanford.edu/projects/glove/)          | 25           | 1,183,514    | 10,000      |         100 | Angular       | Word-word co-occurrence matrix | Language (wiki, common crawl) |                                                 
| [GloVe](https://nlp.stanford.edu/projects/glove/)           | 50           | 1,183,514    | 10,000      |         100 | Angular       | Word-word co-occurrence matrix | Language (wiki, common crawl) |             
| [GloVe](https://nlp.stanford.edu/projects/glove/)           | 100          | 1,183,514    | 10,000      |         100 | Angular       | Word-word co-occurrence matrix | Language (wiki, common crawl) |            
| [GloVe](https://nlp.stanford.edu/projects/glove/)          | 200          | 1,183,514    | 10,000      |         100 | Angular       | Word-word co-occurrence matrix | Language (wiki, common crawl) |    
| [NYTimes](https://archive.ics.uci.edu/dataset/164/bag+of+wordsD199572657/)        | 256          | 290,000      | 10,000      |         100 | Angular       | BoW                                            | Language, news article        |                                                      
| [NYTimes](https://archive.ics.uci.edu/dataset/164/bag+of+wordsD199572657/)        | 16           | 290,000      | 10,000      |         100 | Angular       | BoW                                            | Language, news article        |                                                    
| [SIFT](http://corpus-texmex.irisa.fr/)           | 128          | 1,000,000    | 10,000      |         100 | Euclidean     | SIFT descriptors                               | Image                         |                                          
| [SIFT](https://github.com/erikbern/ann-benchmarks/tree/main)            | 256          | 1,000,000    | 10,000      |         100 | Hamming       | SIFT descriptors                               | Image                         |                                          
| [Last.fm](http://millionsongdataset.com/lastfm/)        | 65           | 292,385      | 50,000      |         100 | Inner product | Matric Factorization                           | Song recommendation           |                                                   
| [Word2bits](https://github.com/agnusmaximus/Word2BitsD199572657/)      | 800          | 399,000      | 1,000       |         100 | Hamming       | Word2Vec with quantized parameter              | Language, English wikipedia   |                                                       
| [GIST](http://corpus-texmex.irisa.fr/)         | 960          | 1,000,000    | 1,000       |         100 | Euclidean     | GIST descriptors, INRIA C implementation       | Image                         |                                                        
| [msmarco](https://microsoft.github.io/msmarco/)        | 384          | 1,000,000    | 50,000      |         100 | Euclidean     | MiniLLM                                        | Language, Question answering  |                                                           
| [openai-dbpedia](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-1536-1M) | 1,536        | 950,000      | 50,000      |         100 | Euclidean     | text-embedding-3-large                         | Language, DBpedia             | 


For each dataset, we evaluate a grid of 80 HNSW configurations based on the following search space:

```Python
search_space = {
    "M": [8, 16, 32, 64, 128],
    "efConstruction": [32, 64, 128, 256],
    "efSearch": [32, 64, 128, 256]
}
```
For each HNSW configuration, we record query throughput and recall@10, which compares the top 10 nearest neighbors to the ground-truth top 10 neighbors based on exact KNN search. Now we are ready to introduce the algorithm to learn the portfolio.

### Method

Selecting an HNSW configuration is fundamentally a multi-objective optimization problem. To represent different trade-offs between recall and throughput, we use a simple linearization, assigning weights in [0, 1] to recall and throughput. Given a weighting, we find the configuration maximizing the linearized object in the following 4 steps:

1. For every dataset, apply min-max scaling on the recall and throughput across all the configurations.
2. For all the configurations within a dataset, combine the normalized recall and throughput with the given weights on recall and throughput, forming a new weighted metric.
3. For every configuration, compute average weighted metric across datasets.
4. Return the configuration that maximize the average weight metric.

The following figure shows an example of the algorithm with 2 datasets and 3 configurations.

![Learning methods](/assets/media/blog-images/2025-02-28-a-pratical-guide-for-selecting-HNSW-hyperparameters/hnsw-portfolio-learn.png){:class="img-centered"}

We considered the following weighting profiles for recall and throughput. We don’t consider higher weights for throughput as most applications require a good recall, before they start optimizing throughput.

|              |   0 |   1 |   2 |   3 |   4 |
|:-------------|----:|----:|----:|----:|----:|
| w_recall     | 0.9 | 0.8 | 0.7 | 0.6 | 0.5 |
| w_throughput | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 |

## Evaluation

We evaluated the method in two scenarios: 1) a leave-one-out setting where one of the 15 datasets is sequentially used as test dataset while keeping the rest as training dataset. 2) 15 datasets as training and another 4 datasets with a new embedding [cohere-embed-english-v3](https://huggingface.co/Cohere/Cohere-embed-english-v3.0) that are not included in the training. 

### Quantitative evaluation

In the first setting, we compute the ground-truth configurations under different weightings by applying the proposed method on the test dataset. We compare them with the predicted configurations using the same method based on the training dataset. We compute mean absolute errors (MAE) between the predicted configurations and the ground-truth configurations on the normalized (min-max scaled) recall and throughput. We show average MAE across 15 datasets (leave-one-out) in the following bar plot. 

![MAE compared with groundtruth](/assets/media/blog-images/2025-02-28-a-pratical-guide-for-selecting-HNSW-hyperparameters/mae.png){:class="img-centered"}

From the plot, we see the average MAEs on the normalized recall are less than 0.1, indicating the predicted configurations are not very different on the recall compared with ground-truth configurations, especially on high recall weightings. The MAEs on the throughput are larger, partially due to the measurements of throughput are very noisy. Also the MAEs tend to be smaller when weighting on the throughput are higher.

### Qualitative evaluation

In the second setting, we compute the predicted configurations on the 15 training datasets under different weighting and evaluate them on 3 datasets with Cohere-embed-english-v3, a new embedding model that is not used in the training datasets. Our goal is for them to be on the Pareto Front and represent different tradeoffs between recall and throughput. We show the recall and throughput on the learnt configurations with different colors and the other configurations in grey.

![Trade-off of the 5 configurations](/assets/media/blog-images/2025-02-28-a-pratical-guide-for-selecting-HNSW-hyperparameters/tradeoff.png){:class="img-centered"}

We can see the 5 configurations cover the good recall and good throughput well. As we don’t use high weights for the throughput, the learnt configurations don’t cover the high throughput low recall areas.

## How to use them?

In order to try out these configurations, you will need to create an index:
```json
curl -X PUT "localhost:9200/test-index" -H 'Content-Type: application/json' -d'
{
  "settings" : {
    "knn": true
  },
  "mappings": {
    "properties": {
      "my_vector": {
        "type": "knn_vector",
        "dimension": 4,
        "space_type": "l2",
        "method": {
          "name": "hnsw",
          "parameters": {
            "m": 16,
            "ef_construction": 256
          }
        }
      }
    }
  }
}
'
```
Here, you must specify the index build parameters, which are not dynamic. Then, you can ingest your data:
```json
curl -X PUT "localhost:9200/_bulk" -H 'Content-Type: application/json' -d'
{ "index": { "_index": "test-index" } }
{ "my_vector": [1.5, 5.5, 4.5, 6.4]}
{ "index": { "_index": "test-index" } }
{ "my_vector": [2.5, 3.5, 5.6, 6.7]}
{ "index": { "_index": "test-index" } }
{ "my_vector": [4.5, 5.5, 6.7, 3.7]}
{ "index": { "_index": "test-index" } }
{ "my_vector": [1.5, 5.5, 4.5, 6.4]}
'
```
Lastly, you can perform search:
```json
curl -X GET "localhost:9200/test-index/_search?pretty&_source_excludes=my_vector" -H 'Content-Type: application/json' -d'
{
  "size": 100,
  "query": {
    "knn": {
      "my_vector": {
        "vector": [0, 0, 0, 0],
        "k": 100,
        "method_parameters": {
          "ef_search": 128
        }
      }
    }
  }
}
'
```
Because ef_search is a search time parameter, it can be dynamically adjusted per search request. We also provide an end-to-end example using python client with [boto3](https://pypi.org/project/boto3/) and [opensearch-py](https://pypi.org/project/opensearch-py/) packages in the following.

### End-to-end example using python client

#### Load necessary modules
```Python
from typing import Tuple, List
import sys
import time
import logging
import random
import hashlib
import json

import h5py
import numpy as np
import pandas as pd
from tqdm import tqdm
import boto3

from opensearchpy import OpenSearch, RequestsHttpConnection, helpers
from opensearchpy.exceptions import RequestError, NotFoundError, TransportError
from opensearchpy.helpers.errors import BulkIndexError
from requests_aws4auth import AWS4Auth
```
#### Modify the data loading function to load your own data

Below functions assumes a hdf5 file with "documents", "queries" and "ground_truth_l2" keys
```Python
def load_data(local_file_path: str) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Load vector datasets from local_file_path

    Args:
        local_file_path (str): Path to the local file storing .

    Returns:
        Tuple[np.ndarray, np.ndarray, np.ndarray]: 
        A tuple containing:
          - documents (np.ndarray): A set of vectors (n, m) to search against.
          - querys (np.ndarray): A set of query (q, m) vectors to test an ANN algorithm.
          - neighbors (np.ndarray): An array (q, k) that contains groundtruth top k neighbors for each query.
    """
    hdf5_file = h5py.File(local_file_path, "r")
    vectors = hdf5_file["documents"]
    query_vectors = hdf5_file["queries"]
    neighbors = hdf5_file["ground_truth_l2"]
    return vectors, query_vectors, neighbors
```

#### Load all the util functions
```Python
logger = logging.getLogger(__name__)


def get_client(host: str, region: str, profile: str) -> OpenSearch:
    """Get an OpenSearch client using the given host and AWS region.
    It assumes AWS crediential has been configured.

    Args:
        host (str): OpenSearch domain endpoint.
        region (str): An AWS region, e.g. us-west-2

    Returns:
        OpenSearch: An OpenSearch client.
    """
    credentials = boto3.Session(profile_name=profile, region_name=region).get_credentials()

    awsauth = AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        region,
        "es",
        session_token=credentials.token,
    )

    client = OpenSearch(
        hosts=[{"host": host, "port": 443}],
        http_auth=awsauth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        timeout=60 * 60 * 5,
        search_timeout=60 * 60 * 5,
    )
    return client


def create_index_body(config, engine):
    return {
        "settings": {
            "index": {"knn": True, "knn.algo_param.ef_search": config["efSearch"]},
            "number_of_shards": 1,
            "number_of_replicas": 0,
        },
        "mappings": {
            "_source": {"excludes": ["vector"], "recovery_source_excludes": ["vector"]},
            "properties": {
                "vector": {
                    "type": "knn_vector",
                    "dimension": config["dim"],
                    "method": {
                        "name": "hnsw",
                        "space_type": config["space"],
                        "engine": engine,
                        "parameters": {
                            "ef_construction": config["efConstruction"],
                            "m": config["M"],
                        },
                    },
                }
            },
        },
    }


def get_index_name(config: dict) -> str:
    """Hash the config dict to get a unique index name

    Args:
        config (dict): An HNSW configuration to evaluate.

    Returns:
        str: A unique index name using hashing.
    """
    dict_str = "_".join(map(str, config.values()))
    hash_obj = hashlib.md5(dict_str.encode())
    index_name = hash_obj.hexdigest()
    return index_name


def random_delay(lower_time_limit: float = 1.0, upper_time_limit: float = 2.0) -> float:
    return min(lower_time_limit + random.random() * upper_time_limit, upper_time_limit)


def bulk_index_vectors(
    client: OpenSearch,
    index: str,
    vectors: List[np.ndarray],
    source_name: str,
    batch_size=1000,
):
    """Bulk ingesting vectors with batch_size into index with name index_name

    Args:
        client (OpenSearch): An OpenSearch client
        index (str): Index to ingest vectors.
        vectors (List[np.ndarray]): List of vectors to be ingested.
        source_name (str): Name to be used in the `_source` field.
        batch_size (int, optional): Defaults to 1000.
    """
    actions = []
    for i, vector in enumerate(
        tqdm(vectors, desc="Indexing vectors", total=len(vectors), file=sys.stdout)
    ):
        # Create an index request for each vector
        action = {
            "_index": index,
            "_id": i,  # Unique ID for each vector
            "_source": {source_name: vector.tolist()},  # Convert NumPy array to list
        }
        actions.append(action)

        # When the batch size is reached, send the bulk request
        if len(actions) == batch_size:
            helpers.bulk(client, actions)
            actions = []  # Clear actions for the next batch

    # Index any remaining documents that didn't fill the batch size
    if actions:
        helpers.bulk(client, actions)


def delete_one_index(client: OpenSearch, index: str, max_retry: int = 5):
    try:
        client.indices.clear_cache(
            index=index, fielddata=True, query=True, request=True
        )
    except NotFoundError:
        pass

    success = False
    count = 0
    while not success and count < max_retry:
        try:
            client.indices.delete(index=index)
            success = True
        except NotFoundError:
            logger.error(f"{index} not found, SKIP.")
            success = True
        except RequestError as e:
            delay = random_delay()
            logger.error(f"{index} delete failed {e}, wait {delay} seconds.")
            time.sleep(delay)
        count += 1


def get_graph_memory(client: OpenSearch) -> float:
    resp = client.transport.perform_request(
        method="GET", url=f"/_plugins/_knn/stats?pretty"
    )
    return sum([stat["graph_memory_usage"] for node_id, stat in resp["nodes"].items()])


def knn_bulk_search(client, config, index_name, query_vectors, k):
    # Prepare the msearch request body
    msearch_body = ""
    for query_vector in query_vectors:
        search_header = '{"index": "' + index_name + '"}\n'
        search_body = {
            "size": k,
            "query": {
                "knn": {
                    "vector": {
                        "vector": query_vector.tolist(),  # Convert NumPy array to list
                        "k": k,
                    }
                }
            },
            "_source": False,
        }

        # Append header and body for each query to the msearch body
        msearch_body += search_header + json.dumps(search_body) + "\n"

    # Send the msearch request
    response = client.msearch(body=msearch_body)
    return response


def pad_list(input_list, n):
    """
    Pads the input list with -1 on the right if its length is less than n.

    :param input_list: List of integers to pad
    :param n: The desired length of the list
    :return: The padded list
    """
    if len(input_list) < n:
        input_list += [-1] * (n - len(input_list))
    return input_list


def batch_knn_search(client, config, index_name, query_vectors, batch_size, k):
    pred_inds = []
    took_time = 0.0
    for i in tqdm(
        range(0, len(query_vectors), batch_size), desc="Search vectors", file=sys.stdout
    ):
        batch = query_vectors[i : i + batch_size]
        results = knn_bulk_search(client, config, index_name, batch, k)
        # Process results for each batch
        for j, result in enumerate(results["responses"]):
            ids = [hit["_id"] for hit in result["hits"]["hits"]]
            if len(ids) < k:
                logger.error(f"{config} batch {i} search needs padding")
                ids = pad_list(ids, k)
            pred_inds.append(ids)
        took_time += results["took"] 
    return pred_inds, took_time * 0.001 # convert took_time from ms to s.


def compute_recall(labels: np.ndarray, pred_labels: np.ndarray):
    assert labels.shape[0] == pred_labels.shape[0], (
        labels.shape,
        pred_labels.shape,
    )
    assert labels.shape[1] == pred_labels.shape[1], (
        labels.shape,
        pred_labels.shape,
    )
    labels = labels.astype(int)
    pred_labels = pred_labels.astype(int)
    k = labels.shape[1]
    correct = 0
    for pred, truth in zip(pred_labels, labels):
        top_k_pred, truth_k = pred[:k], truth[:k]
        for p in top_k_pred:
            for y in truth_k:
                if p == y:
                    correct += 1
    return float(correct) / (k * labels.shape[0])


def ingest_vectors(
    config: dict,
    engine: str,
    client: OpenSearch,
    index_name: str,
    vectors: List[np.ndarray],
):
    index_body = create_index_body(config, engine)

    success = False
    max_try = 0
    while not success and max_try < 5:
        try:
            client.indices.create(index=index_name, body=index_body)
            logger.info(f"{index_name}: Ingesting vectors")
            bulk_index_vectors(client, index_name, vectors, "vector")
            success = True
        except BulkIndexError as e:
            delay = random_delay()
            delete_one_index(client, index_name)
            max_try += 1
            time.sleep(random_delay())
            logger.error(
                f"{index_name}: BulkIndexError, retrying after {delay} seconds\n{e}"
            )
        except RequestError as e:
            if e.error == "resource_already_exists_exception":
                delay = random_delay()
                logger.error(f"{e}, delete and retry after {delay} seconds")
                delete_one_index(client, index_name)
                time.sleep(random_delay())
                max_try += 1
            else:
                raise


def query_index(config, index_name, client, query_vectors, k) -> list[np.ndarray]:
    success = False
    batch_size = 100  # large batch size may lead to query time out
    max_try = 0
    while not success and max_try < 5:
        try:
            pred_inds, search_time = batch_knn_search(
                client, config, index_name, query_vectors, batch_size=batch_size, k=k
            )
            success = True
            return pred_inds, search_time
        except TransportError as e:
            delay = random_delay()
            logger.error(
                f"{index_name}: Query failed, retrying after {delay} seconds {e}"
            )
            time.sleep(delay)
            max_try += 1
    raise Exception(f"{index_name}: Query failed after {max_try} retries")


def eval_config(
    config: dict, local_file_path: str, host: str, region: str, aws_profile: str, engine: str, k=10
):

    vectors, query_vectors, neighbors = load_data(local_file_path)
    client = get_client(host, region, aws_profile)  # creat new one to avoid credential expiring
    index_name = get_index_name(config)

    ingest_vectors(config, engine, client, index_name, vectors)

    # prepare for searching
    client.transport.perform_request(method="POST", url=f"/{index_name}/_refresh")
    client.transport.perform_request(
        method="GET", url=f"/_plugins/_knn/warmup/{index_name}?pretty"
    )
    stats = client.indices.stats(index=index_name, metric="store")
    index_size_in_bytes = stats["indices"][index_name]["total"]["store"][
        "size_in_bytes"
    ]
    graph_mem_in_kb = get_graph_memory(client)

    time.sleep(random_delay(lower_time_limit=5, upper_time_limit=10))

    logger.info(f"{index_name}: Query indexes")
    pred_inds, search_time = query_index(config, index_name, client, query_vectors, k)

    groundtruth_topk_neighbors = [v[:k] for v in neighbors]
    recall = compute_recall(np.array(groundtruth_topk_neighbors), np.array(pred_inds))
    logger.info(f"{index_name}: Recall {recall}")

    config.update(
        {
            f"recall@{k}": recall,
            "search_time": search_time,
            "search_throughput": len(query_vectors) / search_time,
            "index_size_in_bytes": index_size_in_bytes,
            "graph_mem_in_kb": graph_mem_in_kb,
        }
    )

    # clean up
    delete_one_index(client, index_name)
    logger.info(f"Clean up done, finishing evaluation.")
    return config
```

#### Set variables for your experiments
* OpenSearch domain, engine, 
* aws region and aws profile 
* local file path, dataset dim, space to use in HNSW
```Python
host = "your_domain_endpoint_without_https://"
engine = "faiss"

region = "us-west-2"
aws_profile = "your_aws_profile"

local_file_path = "your_data_path"
dim = 384 # vector dimension
space = "l2" # space in HNSW
```
#### Start evaluating differernt configurations
```Python
metrics = []
for i, config in enumerate([
    {'M': 16, 'efConstruction': 128, 'efSearch': 32},
    {'M': 32, 'efConstruction': 128, 'efSearch': 32},
    {'M': 16, 'efConstruction': 128, 'efSearch': 128},
    {'M': 64, 'efConstruction': 128, 'efSearch': 128},
    {'M': 128, 'efConstruction': 256, 'efSearch': 256}
]):
    config.update({"dim": dim, "space": space})
    metric = eval_config(config, local_file_path, host, region, aws_profile, engine)
    metrics.append(metric)
```
You will see following output in the terminal:
```
Indexing vectors: 100%|██████████| 8674/8674 [00:26<00:00, 321.72it/s]
Search vectors: 100%|██████████| 15/15 [00:09<00:00,  1.55it/s]
Indexing vectors: 100%|██████████| 8674/8674 [00:34<00:00, 248.95it/s]
Search vectors: 100%|██████████| 15/15 [00:07<00:00,  1.88it/s]
Indexing vectors: 100%|██████████| 8674/8674 [00:30<00:00, 280.84it/s]
Search vectors: 100%|██████████| 15/15 [00:07<00:00,  2.09it/s]
Indexing vectors: 100%|██████████| 8674/8674 [00:27<00:00, 311.41it/s]
Search vectors: 100%|██████████| 15/15 [00:07<00:00,  2.07it/s]
Indexing vectors: 100%|██████████| 8674/8674 [00:34<00:00, 250.86it/s]
Search vectors: 100%|██████████| 15/15 [00:07<00:00,  2.03it/s]
```
And the metrics can be visualized by:
```Python
df = pd.DataFrame(metrics)
df
```
![Example metrics](/assets/media/blog-images/2025-02-28-a-pratical-guide-for-selecting-HNSW-hyperparameters/example_metrics.png){:class="img-centered"}
## Limitations and future work

Our method currently produces the same set of configurations, regardless of the datasets. It potentially can be improved by taking the characteristics of the dataset into account and compute more targeted recommendations. Also, the current set of recommendations are based on 15 datasets and using more datasets in training would improve the generalization of the learnt configurations. In the end, extending the scope to also recommend quantization methods, together with HNSW, will further reduce the index size and improve throughput.

## References

1. Malkov, Yu A., and Dmitry A. Yashunin. "Efficient and robust approximate nearest neighbor search using hierarchical navigable small world graphs." IEEE transactions on pattern analysis and machine intelligence 42.4 (2018): 824-836.
2. Xu, Lin, Holger Hoos, and Kevin Leyton-Brown. "Hydra: Automatically configuring algorithms for portfolio-based selection." Proceedings of the AAAI Conference on Artificial Intelligence. Vol. 24. No. 1. 2010.
3. Winkelmolen, Fela, et al. "Practical and sample efficient zero-shot hpo." arXiv preprint arXiv:2007.13382 (2020).
4. Salinas, David, and Nick Erickson. "TabRepo: A Large Scale Repository of Tabular Model Evaluations and its AutoML Applications." arXiv preprint arXiv:2311.02971 (2023).
