---
layout: post
title:  "Build Your First RAG with OpenSearch® and Scalingo"
authors:
 - samirakarioh
date: 2025-09-12
categories:
 - technical-post
meta_keywords: opensearch, vector database, retrieval augmented generation, rag tutorial, huggingface, semantic search, ai search, embeddings, scalingo, ml, GenAI, machine learning
meta_description: A step-by-step tutorial on building a Retrieval-Augmented Generation (RAG) pipeline using a HuggingFace model and OpenSearch® on Scalingo’s PaaS platform, with full setup and code examples
has_math: false
has_science_table: false
---

In the past, building a RAG (Retrieval-Augmented Generation) meant juggling many different tools. Today, the process is much simpler: you just need [HuggingFace](https://huggingface.co/) to get your model and OpenSearch® as a vector database. In this tutorial, we’ll walk you through the entire process step by step, and show you how to build your own RAG using Scalingo and their OpenSearch® offering.

<aside>
📼

If you’d rather watch than read, [here’s the video version](https://youtu.be/Wmr-F72EUYs) of this tutorial.

</aside>

## Getting started

The first step is to [create an account on Scalingo](https://auth.scalingo.com/users/sign_uphttps://scalingo.com/blog/30-days-to-explore-scalingo-free-trial-details?utm_source=devrel&utm_medium=partner-post&utm_campaign=opensearch&utm_content=tutorial) or [log in](https://auth.scalingo.com/users/sign_in?utm_source=devrel&utm_medium=partner-post&utm_campaign=opensearch&utm_content=tutorial) to your existing one.

Keep in mind that the 30-day free trial offered at sign-up does **not** include the integration, use, or activation of OpenSearch®. If you want to follow this tutorial right away, you’ll need to end your trial by adding a payment method.

Alternatively, you can use your free trial period to explore other features of the platform, and then come back to this tutorial once you’re ready to get started with OpenSearch®.

<aside>
💡

[More info](https://scalingo.com/fr/blog/30-jours-pour-decouvrir-scalingo-tous-les-details-de-la-version-d-essai) on their free trial and what is included.

</aside>

Once your account is set up, [choose one of the OpenSearch-provided pretrained models](https://docs.opensearch.org/latest/ml-commons-plugin/pretrained-models/). In our example, we’ll be using `huggingface/sentence-transformers/all-MiniLM-L6-v2`.

## Creating Your App on Scalingo

Now, head back to your Scalingo dashboard. We’re going to create an application on the platform, to set up the OpenSearch® Dashboard. 


![Create an app](/assets/media/blog-images/2025-09-18-Build-Your-First-RAG-with-OpenSearch-and-Scalingo/creation_of_app.png){:class="img-centered"}

Choose the Git deployment option, selecting the HDS ([Health Data Hosting](https://scalingo.com/blog/health-data-hosting)) or [SecNumCloud](https://scalingo.com/qualification-secnumcloud) offering if your app uses sensitive data. Else, leave the default option.


![Choose a repo](/assets/media/blog-images/2025-09-18-Build-Your-First-RAG-with-OpenSearch-and-Scalingo/choose_git.png){:class="img-centered"}


Back in the Scalingo dashboard, it’s time to add an OpenSearch® database to our application. To do this, click on your application, and in the “addons” section, click on “manage”. Next, click on “add an addon” and select OpenSearch®.

![Add a OpenSearch Addon](/assets/media/blog-images/2025-09-18-Build-Your-First-RAG-with-OpenSearch-and-Scalingo/opensearch_addon.png){:class="img-centered"}


Scalingo offers several database plans, depending on your needs. But, for this app, we recommend choosing the Business plan so you can take advantage of high availability and multi-node setups.

![Price of Opensearch Plan](/assets/media/blog-images/2025-09-18-Build-Your-First-RAG-with-OpenSearch-and-Scalingo/opensearch_plan.png){:class="img-centered"}


<aside>
💡

Need help choosing the right plan? Visit the [comparison page](https://scalingo.com/databases/opensearch) or [reach out to their team](https://scalingo.com/contact). 

</aside>

Now it's time to install the OpenSearch® dashboard. To do this, go to the **Environment Variables** section of your OpenSearch® Dashboard app and add the following environment variable:

```
BUILDPACK_URL="https://github.com/Scalingo/opensearch-dashboards-buildpack"
```

Installing the OpenSearch® dashboard will make it easier to track each stage of the process and give you access to the Dev Tools.

In your code editor, clone our repository for OpenSearch® Dashboard:

```
git clone https://github.com/Scalingo/opensearch-dashboards-scalingo
```

Navigate into the folder (`cd`) and add the remote connection with: `git remote add scalingo <your_opensearch_dashboard_app_url>` Replace <your_opensearch_dashboard_app_url> with the remote URL of your OpenSearch® Dashboard application on Scalingo.

Finally, push your commit to Scalingo.

## Setting Up the Model and Vectors

Now it’s time to deploy and register the model in OpenSearch®.
Registering the model tells OpenSearch® how to connect to your custom model server.

To do this, your model must be in the ONNX format. You can find more details on how to configure your model on its page on Hugging Face.

Go back to Scalingo and select the application that contains your OpenSearch® Dashboard. Open it and make sure the OpenSearch® dashboard page loads correctly. Log in using your user credentials, which can be found in the environment variable `SCALINGO_OPENSEARCH_URL` on your application dashboard, then navigate to **Dev Tools**. 

Next  add the [following parameters](https://docs.opensearch.org/latest/ml-commons-plugin/pretrained-models/#prerequisites):

![OpenSearchML Settings](/assets/media/blog-images/2025-09-18-Build-Your-First-RAG-with-OpenSearch-and-Scalingo/opensearch_settings.png){:class="img-centered"}

- The first setting allows OpenSearch® to download the model online
- The second allows the model to be launched on all OpenSearch® nodes
- The last two remove memory limits and enable access control.

These parameters are crucial to ensure your model is correctly loaded and optimised across your entire cluster.

This is also where you’ll be able to register your model group, by entering [this request](https://docs.opensearch.org/latest/tutorials/vector-search/semantic-search/semantic-search-asymmetric/#step-3-register-a-model-group) in the DevTools. You can choose the name you’d like for your group, but make sure to keep the ID obtained after sending your request. Follow the steps 4 and 5 of [this page](https://docs.opensearch.org/latest/tutorials/vector-search/semantic-search/semantic-search-asymmetric/#step-4-register-the-model) to complete the registration of your model and its deployment. All the information about the model you chose, like its name and version, are available on the OpenSearch® website. After these steps, keep your model ID handy.

Now, you’ll need a way to convert your documents into embeddings. To do this, create an ingestion pipeline by following the process described [here](https://docs.opensearch.org/latest/vector-search/ai-search/semantic-search/#step-1-create-an-ingest-pipeline). Make sure to put the ID obtained in the previous step in the `model_id` field .

Next, you’ll need to create a [vector index](https://docs.opensearch.org/latest/vector-search/ai-search/semantic-search/#step-2-create-an-index-for-ingestion). A vector index is a structure that allows you to store and efficiently retrieve vectors. Enter the request indicated on the OpenSearch® website and make sure to modify the “default_pipeline” field so that it matches the name you gave to your pipeline created in the previous step.

**Note:** Make sure that the dimension in your mapping matches the output dimension of your model.

Finally, we’ll add documents to our index. To do this, ingest the documents you chose with the following request:

```
PUT /my-nlp-index/_doc/1
{
"passage_text": "Hello world",
"id": "s1"
}
```

Perform the operation as many times as necessary, changing the number at the end of the endpoint, as shown in [this example](https://docs.opensearch.org/latest/vector-search/ai-search/semantic-search/#step-3-ingest-documents-into-the-index).

You can also add several documents at the same time, with the `/_bulk` endpoint, as you can see in [this example](https://docs.opensearch.org/latest/tutorials/vector-search/semantic-search/semantic-search-asymmetric/#step-74-ingest-data). Make sure to edit the index so it matches yours.

After this step, you can set up your research pipeline and send in a request to make sure everything is working. The request can be found [here](https://docs.opensearch.org/latest/vector-search/ai-search/semantic-search/#step-4-search-the-index). Don’t forget to edit the request to include your own model ID.

## Conclusion

You now have everything you need to build your own RAG with OpenSearch® and Scalingo: automatic embedding generation and an ingestion pipeline. From here, simply add documents to your OpenSearch® index, and you’ll be able to run queries directly from the OpenSearch® dashboard.

Need more guidance on using OpenSearch® with Scalingo? [Reach out to their friendly team!](https://scalingo.com/book-a-demo?utm_source=devrel&utm_medium=partner-post&utm_campaign=opensearch&utm_content=tutorial)