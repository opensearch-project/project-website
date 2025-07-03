---
layout: post
title:  Neural sparse models are now available in Hugging Face Sentence Transformers
authors:
  - zhichaog
  - yych
  - tomaarsen
  - arthurbr11
  - kolchfa
date: 2025-06-11
categories:
    - technical-posts
has_science_table: true
meta_keywords: neural sparse models, OpenSearch semantic search, Sentence Transformers
meta_description: Using OpenSearch neural sparse features with Sentence Transformers
featured_blog_post: false 
featured_image: false # /assets/media/blog-images/__example__image__name.jpg
---

OpenSearch's neural sparse search transforms text into sparse token-weight pairs using transformer models, combining semantic search capabilities with efficient inverted indexing. This approach delivers high retrieval accuracy with low latency and minimal resource usage, offering a scalable alternative to dense vector search. The inference-free mode eliminates query encoding overhead, enabling extremely fast searches. To enable this efficient search, OpenSearch provides state-of-the-art pretrained models for sparse retrieval, which consistently rank at the top of the [BEIR](https://github.com/beir-cellar/beir) benchmark. These models have been downloaded over **10 million times** on Hugging Face. 

The [Sentence Transformers](https://github.com/UKPLab/sentence-transformers) (also known as SBERT) library, developed by [UKPLab](https://www.tu-darmstadt.de/) and maintained by [Hugging Face](https://huggingface.co/), is a Python framework designed to generate semantically meaningful embeddings for sentences, paragraphs, and images. The library is now widely adopted in natural language processing (NLP) tasks such as semantic search, clustering, paraphrase mining, and retrieval-augmented generation.

We are thrilled to announce that, through a collaborative effort between OpenSearch and Hugging Face, neural sparse models are now available in the Sentence Transformers library. You can now encode sentences into sparse vectors within the same framework. This collaboration establishes OpenSearch as an officially supported vector search engine for both dense and sparse vector operations.

<img src="/assets/media/blog-images/2025-06-11-neural-sparse-sentence-transformers/image.png"/>

## How to use neural sparse models in Sentence Transformers

Compared to dense embedding models, sparse models have a more complex structure, requiring post-processing layers for vector sparsification and complex tensor-to-map conversions for OpenSearch compatibility. These factors collectively increase the technical barrier to using and deploying neural sparse models in Python.

Sentence Transformers offers a streamlined user experience to simplify this process. It abstracts the encoding details of OpenSearch neural sparse models, including configuration options like bi-encoder or doc-only (inference-free) modes and activation functions. These abstractions are handled internally, so you can initialize a model and encode text with just one or two lines of code.

Follow these steps to get started with neural sparse models using the Sentence Transformers library.

### Step 1: Install Python dependencies

First, install the required Python library:

```bash
pip install sentence-transformers==5.0.0
```

### Step 2: Initialize a neural sparse model

Import the SparseEncoder class and load a pretrained model. You can find more models in OpenSearch's [Hugging Face repository](https://huggingface.co/opensearch-project):

```python
# Here we initialize a model directly from model_id.
# All settings like inference-free and l0 activation are bind with model_id and handled silently.
from sentence_transformers.sparse_encoder import SparseEncoder

sparse_model = SparseEncoder("opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte", trust_remote_code=True)
```

### Step 3: Use the model for encoding

Use the model to encode queries and documents. Encoding converts text to a sparse token-weight format. 

#### Encode a query

Use the following code to encode a query:

```python
# First, use the encode method to convert text to torch.sparse_coo tensor (it's inference-free here)
# Then, use the decode method to convert torch.sparse_coo tensor to (token, weight) pairs

query_tensor = sparse_model.encode_query("What's the weather in ny now?")
query_embedding = sparse_model.decode(query_tensor)

print(dict(query_embedding))
```

**Example output:**

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

#### Encode a document

You can also encode documents the same way, optionally limiting the output to top-weighted tokens:

```python
# First, use the encode method to convert text to torch.sparse_coo tensor
# Then, use the decode method to convert torch.sparse_coo tensor to (token, weight) pairs and obtain tokens with top-10 weights

doc_tensor = sparse_model.encode_document("Currently New York is rainy.")
doc_embedding = sparse_model.decode(doc_tensor, top_k=10)

print(dict(doc_embedding))
```

**Example output:**

```python
# this format is compatible with OpenSearch index and search

{
    'weather': 1.0386661291122437,
    'york': 1.0295677185058594,
    'ny': 0.9702811241149902,
    'rain': 0.9549840092658997,
    'rainy': 0.9479081630706787,
    'nyc': 0.8448441624641418,
    'new': 0.687921404838562,
    'raining': 0.6790128350257874,
    'current': 0.6762210130691528,
    'wet': 0.6448971629142761
}
```
### Step 5: Integrate with OpenSearch

Once you obtained the sparse embeddings from Sentence Transformers, you can index and search them directly in OpenSearch. The output format is fully compatible with OpenSearch's neural sparse search.

For detailed instructions, see the [OpenSearch documentation](https://docs.opensearch.org/docs/latest/vector-search/ai-search/neural-sparse-with-raw-vectors/).

You can also explore example scripts for working with the following embedding types:

- [Sparse embeddings](https://github.com/UKPLab/sentence-transformers/blob/master/examples/sparse_encoder/applications/semantic_search/semantic_search_opensearch.py)
- [Dense embeddings](https://github.com/UKPLab/sentence-transformers/blob/master/examples/sentence_transformer/applications/semantic-search/semantic_search_nq_opensearch.py)


## OpenSearch's contributions to inference-free models in Sentence Transformers

The OpenSearch team is leading innovation in learned sparse retrieval. Our research in inference-free sparse encoders [^1][^2] is increasingly adopted as standard practice across the industry. The following techniques have now been integrated into the Sentence Transformers library, making them more accessible to the broader community.

### IDF-aware Penalty: Enhancing Relevance and Efficiency

Traditional sparse retrievers apply uniform penalties to all tokens during training, ignoring the varying importance of different terms. To address this limitation, OpenSearch researchers introduced IDF-aware penalty[^1], which modulates the penalty based on token significance. This approach applies stronger penalties to common tokens while preserving rare, information-rich tokens that carry more distinctive meaning.

With this enhancement, inference-free retrievers significantly outperform baselines on zero-shot retrieval. The IDF-aware penalty also improves search efficiency by reducing average FLOPs on inverted indexes. Importantly, this enhancement serves as a prerequisite for implementing the powerful [two-phase search](https://opensearch.org/blog/Introducing-a-neural-sparse-two-phase-algorithm) methodology. All inference-free models[^3] released by our team incorporate this enhancement.

#### How to apply the IDF-aware penalty in Sentence Transformers

The IDF-aware enhancement is implemented as a [module](https://github.com/UKPLab/sentence-transformers/blob/v5.0-release/sentence_transformers/sparse_encoder/models/SparseStaticEmbedding.py) in Sentence Transformers. You can create inference-free sparse models with IDF-aware enhancement by incorporating this module into your model architecture. The implementation requires configuring a document encoder and router setup, as shown in the following code example:

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

### ℓ0-inspired sparsification: Advancing sparse retrieval

Achieving optimal balance between sparsity and relevance has been a persistent challenge for inference-free retrievers. OpenSearch addressed this by developing two novel ℓ0-inspired sparsification approaches[^2] (accepted to SIGIR 2025): ℓ0 mask loss, which excludes already-sparse documents from further regularization, and ℓ0 Approximation Activation, which uses log transformations to alter the penalty on tokens with lower activations.

Models using these ℓ0-inspired techniques demonstrate superior performance while significantly improving efficiency and sparsity. The ℓ0 mask loss also streamlines the training process by eliminating the need for multiple attempts at tuning the FLOPS lambda hyperparameter.
Hugging Face's [doc-v3-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-distill) and [doc-v3-gte](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte) models incorporate these enhancements, delivering state-of-the-art performance.

#### How to apply ℓ0-inspired sparsification in Sentence Transformers

Both [ℓ0 mask loss](https://github.com/UKPLab/sentence-transformers/blob/14afc4b6681f0b83bded05fe91a8fd3320d453f9/sentence_transformers/sparse_encoder/losses/FlopsLoss.py#L24) and [ℓ0 Approximation Activation](https://github.com/UKPLab/sentence-transformers/blob/14afc4b6681f0b83bded05fe91a8fd3320d453f9/sentence_transformers/sparse_encoder/models/SpladePooling.py#L34) are integrated in Sentence Transformers models and training pipelines. You can easily adopt these techniques by configuring the following parameters:

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

- [Improving document retrieval with sparse semantic encoders](https://opensearch.org/blog/improving-document-retrieval-with-sparse-semantic-encoders)
- [A deep dive into faster semantic sparse retrieval in OpenSearch 2.12](https://opensearch.org/blog/A-deep-dive-into-faster-semantic-sparse-retrieval-in-OS-2.12/)
- [Introducing the neural sparse two-phase algorithm](https://opensearch.org/blog/Introducing-a-neural-sparse-two-phase-algorithm)
- [Advancing search quality and inference speed with v2 series neural sparse models](https://opensearch.org/blog/neural-sparse-v2-models)

---

## References

[^1]: Geng, Z., Ru, D., & Yang, Y. (2024). Towards Competitive Search Relevance For Inference-Free Learned Sparse Retrievers. [https://arxiv.org/pdf/2411.04403](https://arxiv.org/pdf/2411.04403)

[^2]: Shen, X., Geng, Z., & Yang, Y. (2025). Exploring ℓ0 Sparsification for Inference-free Sparse Retrievers. SIGIR 2025. [https://arxiv.org/pdf/2504.14839](https://arxiv.org/pdf/2504.14839)

[^3]: Available models: [doc-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v1), [doc-v2-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-distill), [doc-v2-mini](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v2-mini), [doc-v3-distill](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-distill), [doc-v3-gte](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte), [multilingual-doc-v1](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-multilingual-v1)
