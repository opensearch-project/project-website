---
layout: post
title:  Neural Sparse is now available in Hugging Face Sentence Transformers
authors:
  - zhichaog
  - yych
  - tomaarsen
  - arthurbr11
date: 2025-06-11
categories:
    - technical-posts
has_science_table: true
meta_keywords: neural sparse models, OpenSearch semantic search, Sentence Transformers
meta_description: Using OpenSearch neural sparse features with Sentence Transformers
excerpt: Through a collaborative effort between the OpenSearch and Hugging Face teams, neural sparse is now available in the Sentence Transformers library.
featured_blog_post: false 
featured_image: false # /assets/media/blog-images/__example__image__name.jpg
---

OpenSearch's neural sparse feature transforms text into sparse token-weight pairs using transformer models, combining semantic search capabilities with efficient inverted indexing. This approach delivers high retrieval accuracy with low latency and minimal resource usage, offering a scalable alternative to dense vector search. The inference-free mode eliminates query encoding overhead, enabling extremely fast search. OpenSearch provides state-of-the-art pretrained models that consistently lead the [BEIR](https://github.com/beir-cellar/beir) benchmark for sparse retrievers, and has yield over **10M+ downloads** on Hugging Face!

The [Sentence Transformers](https://github.com/UKPLab/sentence-transformers) (a.k.a. SBERT) library, developed by [UKPLab](https://www.tu-darmstadt.de/) and maintained by [Hugging Face](https://huggingface.co/), is a Python framework designed to generate semantically meaningful embeddings for sentences, paragraphs, and images. The library is now widely adopted in the natural language processing (NLP) tasks such as semantic search, clustering, paraphrase mining, and retrieval-augmented generation.

Now we are thrilled to announce that, through a collaborative effort between the OpenSearch and Hugging Face teams, neural sparse is now available in the Sentence Transformers library! This integration enables the encoding of sentences into sparse vectors directly within the library. This collaboration establishes OpenSearch as an officially supported vector search engine for both dense and sparse vector operations.

<img src="/assets/media/blog-images/2025-06-11-neural-sparse-sentence-transformers/image.png"/>

## Neural Sparse models in Sentence Transformers

Compared to dense embedding models, sparse models have a more complex structure, requiring post-processing layers for vector sparsification and complex tensor-to-map conversions for OpenSearch compatibility. These factors collectively increase the technical barrier to using and deploying neural sparse models in Python.

Sentence Transformers offers a streamlined user experience. All encoding details of OpenSearch neural sparse models are abstracted away. Configuration aspects like bi-encoder or doc-only (inference-free) mode and activation functions are handled internally. Model initialization and text encoding require just 1-2 lines of code.

Now let's explore neural sparse in Sentence Transformers with hands-on coding examples!

### Install Python dependencies
```
pip install sentence-transformers==5.0.0
```

### Model Initialization

See OpenSearch's [Hugging Face repo](https://huggingface.co/opensearch-project) for all available model ids.

```python
# Here we initialize a model directly from model_id.
# All settings like inference-free and l0 activation are bind with model_id and handled silently.
from sentence_transformers import SparseEncoder

sparse_model = SparseEncoder("opensearch-project/opensearch-neural-sparse-encoding-doc-v3-distill")
```

### Encoding Examples

The model supports encoding for both documents and queries.

#### Query Encoding
```python
# We first use encode method to convert text to torch.sparse_coo tensor (it's inference-free here)
# Then we use decode method to convert torch.sparse_coo tensor to (token, weight) pairs

query_tensor = sparse_model.encode_query("What's the weather in ny now?")
query_embedding = sparse_model.decode(query_tensor)

print(dict(query_embedding))
```

**Output:**
```python
# this format is compatible with OpenSearch index and search

{
    "ny": 5.772862434387207,
    "weather": 4.568415641784668,
    "now": 3.5895495414733887,
    "?": 3.331254720687866,
    "what": 2.7698843479156494,
    "'": 1.5750715732574463,
    "s": 1.4272583723068237,
    "in": 0.49892646074295044,
    "the": 0.1353016495704651,
}
```

#### Document Encoding
```python
# We first use encode method to convert text to torch.sparse_coo tensor
# Then we use decode method to convert torch.sparse_coo tensor to (token, weight) pairs and obtain tokens with top-10 weights

doc_tensor = sparse_model.encode_document("Currently New York is rainy.")
doc_embedding = sparse_model.decode(doc_tensor, topk=10)

print(dict(doc_embedding))
```

**Output:**
```python
# this format is compatible with OpenSearch index and search

{
    "weather": 0.9710425138473511,
    "york": 0.8649968504905701,
    "rain": 0.8370056748390198,
    "ny": 0.8048510551452637,
    "rainy": 0.7947040796279907,
    "nyc": 0.6949161291122437,
    "rainfall": 0.6676556468009949,
    "new": 0.6556974053382874,
    "raining": 0.5904556512832642,
    "current": 0.5838088393211365,
}
```
### Integrate with OpenSearch

After we get the sparse embedding using Sentence Transformers, it's quite easy to index and search these sparse embeddings using OpenSearch. See OpenSearch [documentation](https://docs.opensearch.org/docs/latest/vector-search/ai-search/neural-sparse-with-raw-vectors/) for more details. We also provide example Python scripts to use OpenSearch with Sentence Transformers for both [sparse](http://github.com/arthurbr11/sentence-transformers/blob/feature_branch/examples/sparse_encoder/applications/semantic_search/semantic_search_opensearch.py) and [dense](https://github.com/UKPLab/sentence-transformers/blob/master/examples/sentence_transformer/applications/semantic-search/semantic_search_nq_opensearch.py) embeddings.

## OpenSearch's Innovations in Sentence Transformers for Inference-free Models

The OpenSearch team stands at the forefront of learned sparse retrieval innovation. Our innovations[^1][^2] in inference-free sparse encoders have been increasingly adopted as standard practice across the industry. These techniques have now been integrated into Sentence Transformers, making them more accessible to the broader community.

### IDF-aware Penalty: Enhancing Relevance and Efficiency

### Innovation

Traditional sparse retrievers apply uniform penalties to all tokens during training, ignoring the varying importance of different terms. To address this limitation, OpenSearch researchers introduced IDF-aware penalty[^1], which modulates the penalty based on token significance. This approach applies stronger penalties to common tokens while preserving rare, information-rich tokens that carry more distinctive meaning.

With this enhancement, inference-free retrievers significantly outperform baselines on zero-shot retrieval. The IDF-aware penalty also improves search efficiency by reducing average FLOPs on inverted indices. Importantly, this enhancement serves as a prerequisite for implementing the powerful [two-phase search](https://opensearch.org/blog/Introducing-a-neural-sparse-two-phase-algorithm) methodology. All inference-free models[^3] released by our team incorporate this enhancement.

### Usage in Sentence Transformers

The IDF enhancement is built as a [module](https://github.com/arthurbr11/sentence-transformers/blob/feature_branch/sentence_transformers/sparse_encoder/models/IDF.py) in Sentence Transformers. Users can built inference-free sparse models with IDF enhancement through simply stacking the module.

```python
from sentence_transformers import SparseEncoder, models
from sentence_transformers.sparse_encoder.models import SparseStaticEmbedding, MLMTransformer, SpladePooling

doc_encoder = MLMTransformer(model_id)
router = models.Router(
    {
        "query": [
            SparseStaticEmbedding.from_json(
                model_id,
                tokenizer=doc_encoder.tokenizer,
                frozen=True,
            ),
        ],
        "document": [
            doc_encoder,
            SpladePooling(),
        ],
    }
)

sparse_model = SparseEncoder(
    modules=[router],
    similarity_fn_name="dot",
)
```

### ℓ0-inspired Sparsification: Advancing Sparse Retrieval

### Innovation

Achieving optimal balance between sparsity and relevance has been a persistent challenge for inference-free retrievers. The OpenSearch team addressed this by developing two novel ℓ0-inspired sparsification approaches[^2] (accepted to SIGIR 2025): ℓ0 Mask Loss, which excludes already-sparse documents from further regularization, and ℓ0 Approximation Activation, which uses log transformations to alter the penalty on tokens with lower activations.

Models using these ℓ0-inspired techniques demonstrate superior performance while significantly improving efficiency and sparsity. The ℓ0 Mask Loss also streamlines the training process by eliminating the need for multiple attempts at tuning the flops lambda hyperparameter. Our [doc-v3-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-distill) model incorporates these enhancements, delivering state-of-the-art performance.

### Usage in Sentence Transformers

Both [ℓ0 Mask Loss](https://github.com/arthurbr11/sentence-transformers/blob/58ea46e18d13ee56b723a96c77abbaba876d63ce/sentence_transformers/sparse_encoder/losses/FlopsLoss.py#L24) and [ℓ0 Approximation Activation](https://github.com/arthurbr11/sentence-transformers/blob/58ea46e18d13ee56b723a96c77abbaba876d63ce/sentence_transformers/sparse_encoder/models/SpladePooling.py#L34) are integrated in Sentence Transformers models and training pipelines. Users can easily adopt these techniques through configuring parameters.

```python
# ℓ0 Mask Loss use threshold 150
from sentence_transformers.sparse_encoder.losses import FlopsLoss
loss = FlopsLoss(model, threshold=150)

# ℓ0 Approximation Activation
from sentence_transformers.sparse_encoder.models import SpladePooling
pooling = SpladePooling(activation_function="log1p_relu")
```

## Further reading

For more information about neural sparse search, see these previous blog posts:

- [Improving document retrieval with sparse semantic encoders]({{site.baseurl}}/blog/improving-document-retrieval-with-sparse-semantic-encoders)
- [A deep dive into faster semantic sparse retrieval in OpenSearch 2.12]({{site.baseurl}}/blog/A-deep-dive-into-faster-semantic-sparse-retrieval-in-OS-2.12/)
- [Introducing the neural sparse two-phase algorithm]({{site.baseurl}}/blog/Introducing-a-neural-sparse-two-phase-algorithm)
- [Advancing Search Quality and Inference Speed with v2 Series Neural Sparse Models]({{site.baseurl}}/blog/neural-sparse-v2-models)

---

[^1]: Geng, Z., Ru, D., & Yang, Y. (2024). Towards Competitive Search Relevance For Inference-Free Learned Sparse Retrievers. [https://arxiv.org/pdf/2411.04403](https://arxiv.org/pdf/2411.04403)

[^2]: Shen, X., Geng, Z., & Yang, Y. (2025). Exploring ℓ0 Sparsification for Inference-free Sparse Retrievers. SIGIR 2025. [https://arxiv.org/pdf/2504.14839](https://arxiv.org/pdf/2504.14839)

[^3]: Available models: [doc-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v1), [doc-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-distill), [doc-v2-mini](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-mini), [doc-v3-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-distill), [multilingual-doc-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-multilingual-v1)
