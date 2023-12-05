---
layout: post
title:  Improving document retrieval with sparse semantic encoders
authors:
  - zhichaog
  - xinyual
  - dagney
  - yych
date: 2023-12-05 01:00:00 -0700
categories:
    - technical-posts
meta_keywords: search relevance, neural sparse search, semantic search, semantic search with sparse encoders
meta_description: Learn how the neural sparse framework in OpenSearch 2.11 can help you improve search relevance and optimize semantic searches with spare encoders using just a few APIs.
has_science_table: true
---

In our previous [blog post](https://opensearch.org/blog/semantic-science-benchmarks), one finding shared was that zero-shot semantic search based on dense encoders will have challenges when being applied to scenarios with unfamiliar corpus. This was highlighted with the [BEIR](https://github.com/beir-cellar/beir) benchmark, which consists of diverse retrieval tasks so that the “transferability” of a pretrained embedding model to unseen datasets can be evaluated.

In this blog post, we will present Neural Sparse, our sparse semantic retrieval framework that is now the top-performing search method on the latest BEIR benchmark. You will learn about semantic search with sparse encoders as well as how to implement this method in OpenSearch with just a few API calls.

## Sparse Encoder is now a better choice
When using transformer-based encoders (e.g. BERT) in traditional dense text embedding, the output of each position in the response layer is translated into a vector, projecting the text into a semantic vector space where distance correlates to similarity in meaning. Neural sparse conducts the process in a novel way that makes the encoder “vote” for the most representative BERT tokens. The vocabulary being adopted (WordPiece) contains most daily used words and also various suffixes, including tense suffixes (for example, ##ed, ##ing,) and common word roots (for example, ##ate, ##ion), where the symbol ## represents continuation. The vocabulary itself spans into a semantic space where all the documents can be regarded as sparse vectors.

<table style="border:none">
  <tr>
    <td style="border:none">
        <img src="/assets/media/blog-images/2023-12-05-improving-document-retrieval-with-spade-semantic-encoders/embedding.png" />
    </td>
    <td style="border:none">
        <img src="/assets/media/blog-images/2023-12-05-improving-document-retrieval-with-spade-semantic-encoders/expand.png" />
    </td>
  </tr>
  <tr>
    <td colspan="2" style="border:none">
        Figure 1: <b>Left:</b> words encoded in the dense vector sparse. <b>Right</b>: A typical result of sparse encoding.
    </td>
  </tr>
</table>

Searching with dense embedding will present challenges when facing “unfamiliar” content. In this case, the encoder will produce unpredictable embeddings, leading to bad relevance. That is also why in some BEIR datasets that contain strong domain knowledge, BM25 is the still best performer. In these cases, sparse encoders will try to degenerate themselves into keyword-based matching, protecting the search result to be no worse than BM25. A relevance comparison is provided in **Table I**.

In dense encoding, documents are usually represented as high-dimensional vectors; therefore, k-NN indexes need to be adopted in similarity search. On the contrary, the sparse encoding results are more similar to “term vectors” used by keyword-based matching; therefore, native Lucene indexes can be leveraged. Compared to k-NN indexes, sparse embeddings has the following advantages, leading to reduced costs: 1) Much smaller index size, 2) Reduced runtime RAM cost, and 3) Lower computation cost. The quantized comparison can be found in **Table II**.

### Try extreme efficiency with document-only encoders
There are two modes supported by Neural Sparse: 1) with bi-encoders and 2) with document-only encoders. Bi-encoder mode is outlined above, while document-only mode, wherein the search queries are tokenized instead of being passed to deep encoders. In this mode, the document encoders are trained to learn more synonym association so as to increase the recall. And by eliminating the online inference phase, a few computational resources can be saved while the latency can also be reduced significantly. We can observe this in **Table II** by comparing “Neural Sparse Doc-only” with other solutions.

## Neural Sparse Search outperforms in Benchmarking

We have conducted some benchmarking using a cluster containing 3 r5.8xlarge data nodes and 1 r5.12xlarge leader&ml node. First, all the evaluated methods are compared in terms of NCDG@10. Then we also compare the runtime speed of each method as well as the resource cost.

Key takeaways:

* Both bi-encoder and document-only mode generate the highest relevance on the BEIR benchmark, along with the Amazon ESCI dataset.
* Without online inference, the search latency of document-only mode is comparable to BM25.
* Neural sparse search have much smaller index size than dense encoding. A document-only encoder generates an index with 10.4% of dense encoding’s index size, while the number for a bi-encoder is 7.2%.
* Dense encoding adopts k-NN retrieval and will have a 7.9% increase in RAM cost when search traffic received. Neural sparse search is based on native Lucene, and the RAM cost will not increase in runtime.


The detailed results are presented in the following tables.

<center><b>Table I.</b> Relevance comparison on <b>BEIR</b><sup>*</sup> benchmark and Amazon ESCI, in the term of both NDCG@10 and the rank.</center>

<table>
    <tr style="text\-align:center;">
        <td></td>
        <td colspan="2">BM25</td>
        <td colspan="2">Dense(with TAS-B model)</td>
        <td colspan="2">Hybrid(Dense + BM25)</td>
        <td colspan="2">Neural Sparse Search bi-encoder</td>
        <td colspan="2">Neural Sparse Search doc-only</td>
    </tr>
    <tr>
        <td><b>Dataset</b></td>
        <td><b>NDCG</b></td>
        <td><b>Rank</b></td>
        <td><b>NDCG</b></td>
        <td><b>Rank</b></td>
        <td><b>NDCG</b></td>
        <td><b>Rank</b></td>
        <td><b>NDCG</b></td>
        <td><b>Rank</b></td>
        <td><b>NDCG</b></td>
        <td><b>Rank</b></td>
    </tr>
    <tr>
        <td>Trec Covid</td>
        <td>0.688</td>
        <td>4</td>
        <td>0.481</td>
        <td>5</td>
        <td>0.698</td>
        <td>3</td>
        <td>0.771</td>
        <td>1</td>
        <td>0.707</td>
        <td>2</td>
    </tr>
    <tr>
        <td>NFCorpus</td>
        <td>0.327</td>
        <td>4</td>
        <td>0.319</td>
        <td>5</td>
        <td>0.335</td>
        <td>3</td>
        <td>0.36</td>
        <td>1</td>
        <td>0.352</td>
        <td>2</td>
    </tr>
    <tr>
        <td>NQ</td>
        <td>0.326</td>
        <td>5</td>
        <td>0.463</td>
        <td>3</td>
        <td>0.418</td>
        <td>4</td>
        <td>0.553</td>
        <td>1</td>
        <td>0.521</td>
        <td>2</td>
    </tr>
    <tr>
        <td>HotpotQA</td>
        <td>0.602</td>
        <td>4</td>
        <td>0.579</td>
        <td>5</td>
        <td>0.636</td>
        <td>3</td>
        <td>0.697</td>
        <td>1</td>
        <td>0.677</td>
        <td>2</td>
    </tr>
    <tr>
        <td>FiQA</td>
        <td>0.254</td>
        <td>5</td>
        <td>0.3</td>
        <td>4</td>
        <td>0.322</td>
        <td>3</td>
        <td>0.376</td>
        <td>1</td>
        <td>0.344</td>
        <td>2</td>
    </tr>
    <tr>
        <td>ArguAna</td>
        <td>0.472</td>
        <td>2</td>
        <td>0.427</td>
        <td>4</td>
        <td>0.378</td>
        <td>5</td>
        <td>0.508</td>
        <td>1</td>
        <td>0.461</td>
        <td>3</td>
    </tr>
    <tr>
        <td>Touche</td>
        <td>0.347</td>
        <td>1</td>
        <td>0.162</td>
        <td>5</td>
        <td>0.313</td>
        <td>2</td>
        <td>0.278</td>
        <td>4</td>
        <td>0.294</td>
        <td>3</td>
    </tr>
    <tr>
        <td>DBPedia</td>
        <td>0.287</td>
        <td>5</td>
        <td>0.383</td>
        <td>4</td>
        <td>0.387</td>
        <td>3</td>
        <td>0.447</td>
        <td>1</td>
        <td>0.412</td>
        <td>2</td>
    </tr>
    <tr>
        <td>SCIDOCS</td>
        <td>0.165</td>
        <td>2</td>
        <td>0.149</td>
        <td>5</td>
        <td>0.174</td>
        <td>1</td>
        <td>0.164</td>
        <td>3</td>
        <td>0.154</td>
        <td>4</td>
    </tr>
    <tr>
        <td>FEVER</td>
        <td>0.649</td>
        <td>5</td>
        <td>0.697</td>
        <td>4</td>
        <td>0.77</td>
        <td>2</td>
        <td>0.821</td>
        <td>1</td>
        <td>0.743</td>
        <td>3</td>
    </tr>
    <tr>
        <td>Climate FEVER</td>
        <td>0.186</td>
        <td>5</td>
        <td>0.228</td>
        <td>3</td>
        <td>0.251</td>
        <td>2</td>
        <td>0.263</td>
        <td>1</td>
        <td>0.202</td>
        <td>4</td>
    </tr>
    <tr>
        <td>SciFact</td>
        <td>0.69</td>
        <td>3</td>
        <td>0.643</td>
        <td>5</td>
        <td>0.672</td>
        <td>4</td>
        <td>0.723</td>
        <td>1</td>
        <td>0.716</td>
        <td>2</td>
    </tr>
    <tr>
        <td>Quora</td>
        <td>0.789</td>
        <td>4</td>
        <td>0.835</td>
        <td>3</td>
        <td>0.864</td>
        <td>1</td>
        <td>0.856</td>
        <td>2</td>
        <td>0.788</td>
        <td>5</td>
    </tr>
    <tr>
        <td>Amazon ESCI</td>
        <td>0.081</td>
        <td>3</td>
        <td>0.071</td>
        <td>5</td>
        <td>0.086</td>
        <td>2</td>
        <td>0.077</td>
        <td>4</td>
        <td>0.095</td>
        <td>1</td>
    </tr>
    <tr>
        <td>Average</td>
        <td>0.419</td>
        <td>3.71</td>
        <td>0.41</td>
        <td>4.29</td>
        <td>0.45</td>
        <td>2.71</td>
        <td>0.492</td>
        <td>1.64</td>
        <td>0.462</td>
        <td>2.64</td>
    </tr>
</table>

***BEIR** is short for Benchmarking Information Retrieval, check our its [Github](https://github.com/beir-cellar/beir) page.

<center><b>Table II.</b>Speed Comparison, in the term of latency and throughput</center>

|	                        | BM25          | Dense (with TAS-B model)  | Neural Sparse Search bi-encoder | Neural Sparse Search doc-only  |
|---------------------------|---------------|---------------------------| ------------------------------- | ------------------------------ |
| P50 latency (ms)          | 8ms	        | 56.6ms	                |176.3ms	                      | 10.2ms	|
| P90 latency (ms)          | 12.4ms	    | 71.12ms	                |267.3ms	                      | 15.2ms	|
| P99 Latency (ms)          | 18.9ms	    | 86.8ms	                |383.5ms	                      | 22ms	|
| Max throughput (op/s)	    | 2215.8op/s	| 318.5op/s	                |107.4op/s	                      | 1797.9op/s	|
| Mean throughput (op/s)	| 2214.6op/s	| 298.2op/s	                |106.3op/s	                      | 1790.2op/s	|


*The latencies were tested on a subset of MSMARCO v2, with in total 1M documents. We used 20 clients to loop search requests to get the latency data.

<center><b>Table III.</b>Capacity consumption comparison</center>

|	|BM25	|Dense (with TAS-B model)	|Neural Sparse Search Bi-encoder	| Neural Sparse Search Doc-only	|
|-|-|-|-|-|
|Index size	|1 GB	|65.4 GB	|4.7 GB	|6.8 GB	|
|RAM usage	|480.74 GB	|675.36 GB	|480.64 GB	|494.25 GB	|
|Runtime RAM delta	|+0.01 GB	|+53.34 GB	|+0.06 GB	|+0.03 GB	|

*We performed this experiment using the full dataset of MSMARCO v2, with 8.8M passages. We excluded all _source fields for all methods and force merged the index before measuring index size. We set the heap size of the OpenSearch JVM to half the node RAM, so an empty OpenSearch cluster also consumes close to 480 GB of memory.

## Build your search engine in five steps

Several pretrained encoder models are published in the OpenSearch model repository. As the state-of-the-art of BEIR benchmark, they are already available for out-of-the-box use, reducing fine-tuning effort. You can follow these three steps to build your search engine:

1. **Prerequisites**: To run the following simple cases in the cluster, change the settings:

    ```
    PUT /_cluster/settings
    {
        "transient" : {
        "plugins.ml_commons.allow_registering_model_via_url" : true,
        "plugins.ml_commons.only_run_on_ml_node" : false,
        "plugins.ml_commons.native_memory_threshold" : 99
        }
    }
    ```

    **allow_registering_model_via_url** is required to be true because you need to register your pretrained model by URL. Set **only_run_on_ml_node** to false if you don’t have a machine learning (ML) node on your cluster.
2. **Deploy encoders**: The ML Commons plugin supports deploying pretrained models via URL. Taking `opensearch-neural-sparse-encoding` as an example, you can deploy the encoder via this API:

    ```
    POST /_plugins/_ml/models/_register?deploy=true
    {
        "name": "opensearch-neural-sparse-encoding",
        "version": "1.0.0",
        "description": "opensearch-neural-sparse-encoding",
        "model_format": "TORCH_SCRIPT",
        "function_name": "SPARSE_ENCODING",
        "model_content_hash_value": "d1ebaa26615090bdb0195a62b180afd2a8524c68c5d406a11ad787267f515ea8",
        "url": "https://artifacts.opensearch.org/models/ml-models/amazon/neural-sparse/opensearch-neural-sparse-encoding-v1/1.0.1/torch_script/neural-sparse_opensearch-neural-sparse-encoding-v1-1.0.1-torch_script.zip"
        }
    ```

    After that, you will get the task_id in your response:

    ```
    {
        "task_id": "<task_id>",
        "status": "CREATED"
    }
    ```

    Use task_id to search register model task like:

    ```
    GET /_plugins/_ml/tasks/<task_id>
    ```

    You can get register model task information. The state will change. After the state is completed, you can get the model_id like::

    ```
    {
        "model_id": "<model_id>",
        "task_type": "REGISTER_MODEL",
        "function_name": "SPARSE_TOKENIZE",
        "state": "COMPLETED",
        "worker_node": [
            "wubXZX7xTIC7RW2z8nzhzw"
        ],
        "create_time": 1701390988405,
        "last_update_time": 1701390993724,
        "is_async": true
    }
    ```

3. **Set up the ingestion process**: Each document should be encoded into sparse vectors before being indexed. In OpenSearch, this procedure is implemented by an ingestion processor. You can create the ingestion pipeline using this API:

    ```
    PUT /_ingest/pipeline/neural-sparse-pipeline
    {
        "description": "An example neural sparse encoding pipeline",
        "processors" : [
            {
                "sparse_encoding": {
                    "model_id": "<model_id>",
                    "field_map": {
                    "passage_text": "passage_embedding"
                    }
                }
            }
        ]
    }
    ```

4. **Set up index mapping**: Neural search leverages the `rank_features` field type for indexing, such that the token weights can be stored. The index will use the above ingestion processor to embed text. The index can be created as follows:

    ```
    PUT /my-neural-sparse-index
    {
        "settings": {
            "default_pipeline": "neural-sparse-pipeline"
        },
        "mappings": {
            "properties": {
                "passage_embedding": {
                    "type": "rank_features"
                },
                "passage_text": {
                    "type": "text"
                }
            }
        }
    }
    ```

5. **Ingest documents with the ingestion processor**: After setting index, customer can put doc. Customer provide text field while processor will automatically transfer text content into embedding vector and put it into  `rank_features` field according the `field_map` in the processor:

    ```
    PUT /my-neural-sparse-index/_doc/
    {
        "passage_text": "Hello world"
    }
    ```

### Model selection

Neural sparse has two working modes: bi-encoder and document-only. For bi-encoder mode, we recommend using the pretrained model named “opensearch-neural-sparse-encoding-v1”, while both online search and offline ingestion share the same model file. For document-only mode, we recommended using the pretrained model “opensearch-neural-sparse-encoding-doc-v1” for the ingestion processor and using the model “opensearch-neural-sparse-tokenizer-v1” to implement online query tokenization. Altough presented as a “ml-commons” model, “opensearch-neural-sparse-tokenizer-v1” only translates the query into tokens without any model inference. All the models are published [here](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/).

### **Try your engine with a query clause**

Congratulations! Now you have your own semantic search engine based on sparse encoders. To try a sample query, we can invoke the `_search` endpoint using the `neural_sparse` clause in query DSL:

```
 GET /my-neural-sparse-index/_search/
 {
    "query": {
        "neural_sparse": {
            "passage_embedding": {
                "query_text": "Hello world a b",
                "model_id": "<model_id>",
                "max_token_score": 2.0
            }
        }
    }
}
```

Here are two parameters:
- **“model_id” (string)**: The ID of the model that will be used to generate tokens and weights from the query text. The model must be indexed in OpenSearch before it can be used in neural search. A sparse encoding model will expand the tokens from query text, while the tokenizer model will only generate the token inside the query text.
- **“max_token_score” (float)**: An extra parameter required for performance optimization. Just like the common procedure of OpenSearch match query, the neural_sparse query is transformed to a Lucene BooleanQuery combining disjunction of term-level sub-queries. The difference is we use FeatureQuery instead of TermQuery for term here. Lucene leverages the WAND (Weak AND) algorithm for dynamic pruning, which skips non-competitive tokens based on their score upper bounds. However, FeatureQuery uses FLOAT.MAX_VALUE as the score upper bound, which makes WAND optimization ineffective. The parameter resets the upper bound of each token in this query, and the default value is FLOAT.MAX_VALUE, which is consistent with the origin FeatureQuery. Setting the value to “3.5” for the bi-encoder model and “2” for the document-only model can accelerate search without precision loss. After OpenSearch is upgraded to Lucene version 9.8, this parameter will be deprecated.
