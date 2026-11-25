---
layout: post
title:  Improving document retrieval with sparse semantic encoders
authors:
  - zhichaog
  - xinyual
  - dagney
  - yych
  - kolchfa
date: 2023-12-05 01:00:00 -0700
categories:
    - technical-posts
meta_keywords: search relevance, neural sparse search, semantic search, semantic search with sparse encoders
meta_description: Learn how the neural sparse framework in OpenSearch 2.11 can help you improve search relevance and optimize semantic searches with sparse encoders using just a few APIs.
has_science_table: true
---

OpenSearch 2.11 introduced neural sparse search---a new efficient method of semantic retrieval. In this blog post, you'll learn about using sparse encoders for semantic search. You'll find that neural sparse search reduces costs, performs faster, and improves search relevance. We're excited to share benchmarking results and show how neural sparse search outperforms other search methods. You can even try it out by building your own search engine in just five steps. To skip straight to the results, see [Benchmarking results](#benchmarking-results).

## What are dense and sparse vector embeddings?

When you use a transformer-based encoder, such as BERT, to generate traditional dense vector embeddings, the encoder translates each word into a vector. Collectively, these vectors make up a semantic vector space. In this space, the closer the vectors are, the more similar the words are in meaning.

In sparse encoding, the encoder uses the text to create a list of tokens that have similar semantic meaning. The model vocabulary ([WordPiece](https://huggingface.co/learn/nlp-course/chapter6/6?fw=pt)) contains most commonly used words along with various tense endings (for example, `-ed` and `-ing`) and suffixes (for example, `-ate` and `-ion`). You can think of the vocabulary as a semantic space where each document is a sparse vector.

The following images show example results of dense and sparse encoding.

<table style="border:none">
  <tr>
    <td style="border:none">
        <img height="280px" src="/assets/media/blog-images/2023-12-05-improving-document-retrieval-with-spade-semantic-encoders/embedding.png" />
    </td>
    <td style="border:none">
        <img height="280px" src="/assets/media/blog-images/2023-12-05-improving-document-retrieval-with-spade-semantic-encoders/expand.png" />
    </td>
  </tr>
</table>

_**Left**: Dense vector semantic space. **Right**: Sparse vector semantic space._

## Sparse encoders use more efficient data structures

In dense encoding, documents are represented as high-dimensional vectors. To search these documents, you need to use a k-NN index as an underlying data structure. In contrast, sparse search can use a native Lucene index because sparse encodings are similar to term vectors used by keyword-based matching. 

Compared to k-NN indexes, **sparse embeddings have the following cost-reducing advantages**: 

1. Much smaller index size
1. Reduced runtime RAM cost
1. Lower computational cost

For a detailed comparison, see [Table II](#table-ii-speed-comparison-in-terms-of-latency-and-throughput).

## Sparse encoders perform better on unfamiliar datasets

In our previous [blog post](https://opensearch.org/blog/semantic-science-benchmarks), we mentioned that searching with dense embeddings presents challenges when encoders encounter unfamiliar content. When an encoder trained on one dataset is used on a different dataset, the encoder often produces unpredictable embeddings, resulting in poor search result relevance. 

Often, BM25 performs better than dense encoders on BEIR datasets that incorporate strong domain knowledge. In these cases, sparse encoders can fall back on keyword-based matching, ensuring that their search results are no worse than those produced by BM25. For a comparison of search result relevance benchmarks, see [Table I](#table-i-relevance-comparison-on-beir-benchmark-and-amazon-esci-in-terms-of-ndcg10-and-rank).

## Among sparse encoders, document-only encoders are the most efficient

You can run a neural sparse search in two modes: **bi-encoder** and **document-only**.

In bi-encoder mode, both documents and search queries are passed through deep encoders. In document-only mode, documents are still passed through deep encoders, but search queries are instead tokenized. In this mode, document encoders are trained to learn more synonym association in order to increase recall. By eliminating the online inference phase, you can **save computational resources** and **significantly reduce latency**. For benchmarks, compare the `Neural sparse document-only` column with the other columns in [Table II](#table-ii-speed-comparison-in-terms-of-latency-and-throughput). 

## Neural sparse search outperforms other search methods in benchmarking tests

For benchmarking, we used a cluster containing 3 `r5.8xlarge` data nodes and 1 `r5.12xlarge` leader/machine learning (ML) node. We measured search relevance for all evaluated search methods in terms of NCDG@10. Additionally, we compared the runtime speed and the resource cost of each method.

**Here are the key takeaways:**

* Both modes provide the highest relevance on the BEIR and Amazon ESCI datasets.
* Without online inference, the search latency of document-only mode is comparable to BM25.
* Sparse encoding results in a much smaller index size than dense encoding. A document-only sparse encoder generates an index that is **10.4%** of the size of a dense encoding index. For a bi-encoder, the index size is **7.2%** of the size of a dense encoding index.
* Dense encoding uses k-NN retrieval and incurs a 7.9% increase in RAM cost at search time. Neural sparse search uses a native Lucene index, so the RAM cost does not increase at search time.

## Benchmarking results

The benchmarking results are presented in the following tables.

### Table I. Relevance comparison on BEIR benchmark and Amazon ESCI in terms of NDCG@10 and rank

<table>
    <tr style="text\-align:center;">
        <td></td>
        <td colspan="2">BM25</td>
        <td colspan="2">Dense (with TAS-B model)</td>
        <td colspan="2">Hybrid (Dense + BM25)</td>
        <td colspan="2">Neural sparse search bi-encoder</td>
        <td colspan="2">Neural sparse search document-only</td>
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
        <td>Trec-Covid</td>
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
        <td>SciDocs</td>
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

<sup>*</sup> For more information about Benchmarking Information Retrieval (BEIR), see [the BEIR GitHub page](https://github.com/beir-cellar/beir).

### Table II. Speed comparison in terms of latency and throughput

|	                        | BM25          | Dense (with TAS-B model)  | Neural sparse search bi-encoder | Neural sparse search document-only  |
|---------------------------|---------------|---------------------------| ------------------------------- | ------------------------------ |
| P50 latency (ms)          | 8 ms	        | 56.6 ms	                |176.3 ms	                      | 10.2ms	|
| P90 latency (ms)          | 12.4 ms	    | 71.12 ms	                |267.3 ms	                      | 15.2ms	|
| P99 Latency (ms)          | 18.9 ms	    | 86.8 ms	                |383.5 ms	                      | 22ms	|
| Max throughput (op/s)	    | 2215.8 op/s	| 318.5 op/s	                |107.4 op/s	                      | 1797.9 op/s	|
| Mean throughput (op/s)	| 2214.6 op/s	| 298.2 op/s	                |106.3 op/s	                      | 1790.2 op/s	|


<sup>*</sup> We tested latency on a subset of MS MARCO v2 containing 1M documents in total. To obtain latency data, we used 20 clients to loop search requests.

### Table III. Resource consumption comparison

|	|BM25	|Dense (with TAS-B model)	|Neural sparse search bi-encoder	| Neural sparse search document-only	|
|-|-|-|-|-|
|Index size	|1 GB	|65.4 GB	|4.7 GB	|6.8 GB	|
|RAM usage	|480.74 GB	|675.36 GB	|480.64 GB	|494.25 GB	|
|Runtime RAM delta	|+0.01 GB	|+53.34 GB	|+0.06 GB	|+0.03 GB	|

<sup>*</sup> We performed this experiment using the full MS MARCO v2 dataset, containing 8.8M passages. For all methods, we excluded the `_source` fields and force merged the index before measuring index size. We set the heap size of the OpenSearch JVM to half of the node RAM, so an empty OpenSearch cluster still consumed close to 480 GB of memory.

## Build your search engine in five steps

Follow these steps to build your search engine:

1. **Prerequisites**: For this simple setup, update the following cluster settings:

    ```json
    PUT /_cluster/settings
    {
        "transient": {
            "plugins.ml_commons.only_run_on_ml_node": false,
            "plugins.ml_commons.native_memory_threshold": 99
        }
    }
    ```

    For more information about ML-related cluster settings, see [ML Commons cluster settings](https://opensearch.org/docs/latest/ml-commons-plugin/cluster-settings/).
2. **Deploy encoders**: The ML Commons plugin supports deploying pretrained models using a URL. For this example, you'll deploy the `opensearch-neural-sparse-encoding` encoder:

    ```json
    POST /_plugins/_ml/models/_register?deploy=true
    {
        "name": "amazon/neural-sparse/opensearch-neural-sparse-encoding-v1",
        "version": "1.0.1",
        "model_format": "TORCH_SCRIPT"
    }
    ```

    OpenSearch responds with a `task_id`:

    ```json
    {
        "task_id": "<task_id>",
        "status": "CREATED"
    }
    ```

    Use the `task_id` to check the status of the task:

    ```json
    GET /_plugins/_ml/tasks/<task_id>
    ```

    Once the task is complete, the task state changes to `COMPLETED` and OpenSearch returns the `model_id` for the deployed model:

    ```json
    {
        "model_id": "<model_id>",
        "task_type": "REGISTER_MODEL",
        "function_name": "SPARSE_ENCODING",
        "state": "COMPLETED",
        "worker_node": [
            "wubXZX7xTIC7RW2z8nzhzw"
        ],
        "create_time": 1701390988405,
        "last_update_time": 1701390993724,
        "is_async": true
    }
    ```

3. **Set up ingestion**: In OpenSearch, a `sparse_encoding` ingest processor encodes documents into sparse vectors before indexing them. Create an ingest pipeline as follows:

    ```json
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

4. **Set up index mapping**: Neural search uses the `rank_features` field type to store token weights when documents are indexed. The index will use the ingest pipeline you created to generate text embeddings. Create the index as follows:

    ```json
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

5. **Ingest documents using the ingest pipeline**: After creating the index, you can ingest documents into it. When you index a text field, the ingest processor converts text into a vector embedding and stores it in the `passage_embedding` field specified in the processor:

    ```json
    PUT /my-neural-sparse-index/_doc/
    {
        "passage_text": "Hello world"
    }
    ```

**Try your engine with a query clause**

Congratulations! You've now created your own semantic search engine based on sparse encoders. To try a sample query, invoke the `_search` endpoint using the `neural_sparse` query:

```json
 GET /my-neural-sparse-index/_search/
 {
    "query": {
        "neural_sparse": {
            "passage_embedding": {
                "query_text": "Hello world a b",
                "model_id": "<model_id>"
            }
        }
    }
}
```

### Neural sparse query parameters

The `neural_sparse` query supports three parameters:

- `query_text` (String): The query text from which to generate sparse vector embeddings.
- `model_id` (String): The ID of the model that is used to generate tokens and weights from the query text. A sparse encoding model will expand the tokens from query text, while the tokenizer model will only tokenize the query text itself.
- `query_tokens` (Map<String, Float>): The query tokens, sometimes referred to as sparse vector embeddings. Similarly to dense semantic retrieval, you can use raw sparse vectors generated by neural models or tokenizers to perform a semantic search query. Use either the `query_text` option for raw field vectors or the `query_tokens` option for sparse vectors. Must be provided in order for the `neural_sparse` query to operate.

## Selecting a model

OpenSearch provides several pretrained encoder models that you can use out of the box without fine-tuning. For a list of sparse encoding models provided by OpenSearch, see [Sparse encoding models](https://opensearch.org/docs/latest/ml-commons-plugin/pretrained-models/#sparse-encoding-models). We have also released the [models](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-v1) in Hugging Face model hub. 

Use the following recommendations to select a sparse encoding model:

- For **bi-encoder** mode, we recommend using the `opensearch-neural-sparse-encoding-v2-distill` pretrained model. For this model, both online search and offline ingestion share the same model file. 

- For **document-only** mode, we recommended using the `opensearch-neural-sparse-encoding-doc-v3-distill` pretrained model for ingestion and the `opensearch-neural-sparse-tokenizer-v1` model at search time to implement online query tokenization. This model does not employ model inference and only translates the query into tokens. 


## Next steps

- For more information about neural sparse search, see [Neural sparse search](https://opensearch.org/docs/latest/search-plugins/neural-sparse-search/). 
- For an end-to-end neural search tutorial, see [Neural search tutorial](https://opensearch.org/docs/latest/search-plugins/neural-search-tutorial/). 
- For a list of all search methods OpenSearch supports, see [Search methods](https://opensearch.org/docs/latest/search-plugins/index/#search-methods).
- Provide your feedback on the [OpenSearch Forum](https://forum.opensearch.org/).

## Further reading

Read more about neural sparse search:

1. [A deep dive into faster semantic sparse retrieval in OpenSearch 2.12]({{site.baseurl}}/blog/A-deep-dive-into-faster-semantic-sparse-retrieval-in-OS-2.12/)
1. [Introducing the neural sparse two-phase algorithm]({{site.baseurl}}/blog/Introducing-a-neural-sparse-two-phase-algorithm)
1. [Advancing Search Quality and Inference Speed with v2 Series Neural Sparse Models]({{site.baseurl}}/blog/neural-sparse-v2-models)
1. [Neural Sparse is now available in Hugging Face Sentence Transformers]({{site.baseurl}}/blog/neural-sparse-sentence-transformers)