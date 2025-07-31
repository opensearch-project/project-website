---
layout: post
title:  "Offline Batch ML Inference and Ingestion for 1 Billion Requests using OpenSearch Ingestion"
authors:
 - xunzh
 - kolchfa
date: 2025-07-30
categories:
 - technical-post
meta_keywords: "ml inference, opensearch, opensearch ingestion, Offline batch processing, semantic search, vector search"
meta_description: "Learn how to use OpenSearch Ingestion pipeline to automate the ml batch inference for offline ingestion."
excerpt: "Perform offline batch AI inference within Amazon OpenSearch Ingestion (OSI) pipelines to efficiently enrich large volumes of data at scale with Amazon OpenSearch 2.17+ domains. By optimizing the vector generation phase of the ingestion pipeline, we're making it easier than ever to build and scale neural search applications efficiently"
has_science_table: true
---

In the era of large-scale machine learning applications, one of the most significant challenges organizations face is efficiently generating vector embeddings during data ingestion into OpenSearch. The process of transforming millions or even billions of documents into high-dimensional vectors through ML models has become a critical bottleneck in building effective neural search applications. While traditional real-time APIs offer a straightforward approach to vector generation, they present substantial limitations when dealing with large-scale ingestion workflows.

The real-time vector generation approaches often incur higher costs per inference and are constrained by lower rate limits, creating significant bottlenecks during the ingestion phase. As organizations attempt to vectorize massive document collections, these limitations result in extended ingestion times and increased operational costs. The challenge is further compounded by the complexity of orchestrating the entire pipeline - from initial document processing to vector generation and final indexing into OpenSearch.

To address these vector generation challenges and streamline the ingestion workflow, we're excited to introduce a powerful integration between OpenSearch Ingestion (OSI) and ML Commons. This integration enables seamless batch ML inference processing in offline mode, revolutionizing how organizations can generate vectors for large-scale document collections. By optimizing the vector generation phase of the ingestion pipeline, we're making it easier than ever to build and scale neural search applications efficiently.

## How does ml_commons integrate with OSI?
A new “ml_inference” processor is added in OSI to interact with ml_commons to create offline batch inference jobs. Ml-Commons has released the batch_predict API since OpenSearch 2.17, which perform inference on large datasets in an offline asynchronous mode using a model deployed on external model servers in BedRock, SageMaker, Cohere, and OpenAI. The integration between ml_commons with OSI essentially couples this batch_predict API into the OSI ecosystem, offering additional superpower for OSI pipelines to leverage batch inference jobs in the ingestion. The diagram below shows the end-to-end solution of a OSI pipeline that orchestrates different components to achieve this goal. 

![OSI Integration with Ml-Commons](/assets/media/blog-images/2025-07-30-Offline-Batch-ML-Inference-and-Ingestion-for-1-Billion-Requests-using-OpenSearch-Ingestion/OSI_Ml_Commons_Integration.png){: .img-fluid}

In the solution, a S3 source is added into the system which monitors events for any new file generated in the inference pipeline, and sends the new file name as an input to ml-commons for batch_inference. There are three sub pipelines, each performing distinct tasks in the data flow: 

* **Pipeline 1 (Data preparation and transformation)** 
	1. Source: Data is ingested from an external source provided by customer and supported by data prepper.
	2. Data Transformation Processors: The raw data is processed and transformed, preparing it in the correct format for batch inference in the remote AI server.
	3. S3 (sink): The transformed data is then stored in an S3 bucket as the input to the AI server, acting as an intermediary storage layer. 

* **Pipeline 2 (Trigger ml batch_inference)** 
	1. Source: The S3 Scan that monitors the S3 file generated in the pipeline 1
	2. Ml_inference processor: The new processor that calls ml-commons batch_predict API to create batch jobs.
	3. Task ID: Each batch job is associated with a Task ID for tracking and management.
	4. OpenSearch ML Commons: The plugin that hosts the model for real time neural search, manage the connectors to remote AI servers, and serves the APIs for batch_inference and jobs management.
	5. AI Services: OpenSearch ML Commons interacts with AI services (e.g., SageMaker, Bedrock) to perform batch inference on the data, producing predictions or insights. The results will be saved asynchronously into a separate S3 file.

* **Pipeline 3 (Bulk Ingestion)** 
    1. S3 (source): The results of the batch jobs are stored in S3, which is the source of this pipeline.
    2. Data Transformation Processors: Further processing and transformation are applied to the batch inference output before ingestion. This is to ensure the data is mapped correctly in the OpenSearch index.
    3. OpenSearch Index (sink): The processed results are then indexed into OpenSearch for storage, search, and further analysis.

## What is the ml_inference processor in OSI and how to use it
The current OpenSearch Ingestion (OSI) implementation features a specialized integration between the S3 Scan source and ML inference processor for batch processing. In this initial release, the S3 Scan operates in metadata-only mode, efficiently collecting S3 file information without reading the actual file contents. The ML inference processor then utilizes these S3 file URLs to coordinate with ML Commons for batch processing. This design choice optimizes the batch inference workflow by minimizing unnecessary data transfer during the scanning phase.

Looking ahead, we plan to extend the ML inference processor's capabilities to support real-time model predictions. This enhancement will introduce a new operating mode for the S3 Scan source, where it will fully read and process the contents of input files, enabling immediate vector generation through real-time inference. This dual-mode functionality will provide users with the flexibility to choose between efficient batch processing for large-scale operations and real-time processing for immediate inference needs.

The ml_inference processor can be defined with parameters:
```json
processor:
    - ml_inference:
        # The endpoint URL of your OpenSearch domain
        host: "https://search-xunzh-test-offlinebatch-kitdj4jwpiencfmxpklyvwarwa.us-west-2.es.amazonaws.com“

        # Type of inference operation:
        # - batch_predict: for batch processing
        # - predict: for real-time inference
        action_type: "batch_predict"
        
        # Remote ML model service provider (bedrock or sagemaker)
        service_name: "bedrock"
        
        # Unique identifier for the ML model
        model_id: "EzNlGZcBo9m_Jklj4T0j"
        
        # S3 path where batch inference results will be stored
        output_path: "s3://xunzh-offlinebatch/bedrock-multisource/output-multisource/"
        
        # AWS configuration settings
        aws:
            # AWS Region where the Lambda function is deployed
            region: "us-west-2"
            # IAM role ARN for Lambda function execution
            sts_role_arn: "arn:aws:iam::388303208821:role/Admin"
            
        # Conditional expression that determines when to trigger the processor
        # In this case, only process when bucket matches "xunzh-offlinebatch"
        ml_when: /bucket == "xunzh-offlinebatch"
```
## Ingestion Performance Boost by the ml_inference Processor

The OSI ml_inference processor significantly enhances data ingestion performance for ML-enabled search functionalities. It's ideally suited for use cases requiring ML model generated data, including Semantic search, Multimodal search, Document enrichment, and Query understanding. In Semantic Search scenarios, the processor can accelerate the creation and ingestion of large-volume, high-dimensional vectors by an order of magnitude.

The processor's offline batch inference capability offers distinct advantages over real-time model invocation. While real-time processing requires a live model server with capacity limitations, batch inference dynamically scales compute resources on demand and processes data in parallel. For example, when the OSI pipeline received 1 billion source data requests, it created 100 S3 files for ML batch inference input. The ml_inference processor then initiated a SageMaker batch job using 100 ml.m4.xlarge EC2 instances, completing the vectorization of 1 billion requests in 14 hours - a task that would be virtually impossible to accomplish in real-time mode

This solution offers excellent scalability by allowing linear reduction in processing time through the addition of more workers. For example, while the initial setup with 100 ml.m4.xlarge EC2 instances processed 1 billion document requests in 14 hours, doubling the worker count to 200 instances could potentially reduce the processing time to 7 hours. This linear scaling capability demonstrates the solution's flexibility in meeting various performance requirements by simply adjusting the worker count and instance type, enabling organizations to optimize their processing time based on their specific needs and urgency.

In addition, most AI server provides the batch inference API with a 50% lower price, meaning that you can achieve a better performance with half the price.

![SageMaker Batch Job](/assets/media/blog-images/2025-07-30-Offline-Batch-ML-Inference-and-Ingestion-for-1-Billion-Requests-using-OpenSearch-Ingestion/SageMaker_Batch_Job.png){: .img-fluid}

## Getting started: Create an OSI pipeline with ml_inference processor
Let’s walk through a practical example of using OSI ML inference processor to ingest 1 billion requests of data for semantic search using a text embedding model. 

### Step 1: Create connectors and Register models in OpenSearch

Follow the tutorial to create the connector and model in ml-commons. https://github.com/opensearch-project/ml-commons/blob/main/docs/remote_inference_blueprints/batch_inference_sagemaker_connector_blueprint.md
```json
# Create DJL ML Model in SageMaker for batch transform
POST https://api.sagemaker.us-east-1.amazonaws.com/CreateModel
{
   "ExecutionRoleArn": "arn:aws:iam::419213735998:role/aos_ml_invoke_sagemaker",
   "ModelName": "DJL-Text-Embedding-Model-imageforjsonlines",
   "PrimaryContainer": { 
      "Environment": { 
         "SERVING_LOAD_MODELS" : "djl://ai.djl.huggingface.pytorch/sentence-transformers/all-MiniLM-L6-v2" 
      },
      "Image": "763104351884.dkr.ecr.us-east-1.amazonaws.com/djl-inference:0.29.0-cpu-full"
   }
}
```

Create a connector with the batch_predict as the new action type in the actions.
```json
POST /_plugins/_ml/connectors/_create
{
  "name": "DJL Sagemaker Connector: all-MiniLM-L6-v2",
  "version": "1",
  "description": "The connector to sagemaker embedding model all-MiniLM-L6-v2",
  "protocol": "aws_sigv4",
  "credential": {
    "access_key": "xxx",
    "secret_key": "xxx",
    "session_token": "xxx"
  },
  "parameters": {
    "region": "us-east-1",
    "service_name": "sagemaker",
    "DataProcessing": {
      "InputFilter": "$.text",
      "JoinSource": "Input",
      "OutputFilter": "$"
    },
    "MaxConcurrentTransforms": 100,
    "ModelName": "DJL-Text-Embedding-Model-imageforjsonlines",
    "TransformInput": {
      "ContentType": "application/json",
      "DataSource": {
        "S3DataSource": {
          "S3DataType": "S3Prefix",
          "S3Uri": "s3://offlinebatch/msmarcotests/"
        }
      },
      "SplitType": "Line"
    },
    "TransformJobName": "djl-batch-transform-1-billion",
    "TransformOutput": {
      "AssembleWith": "Line",
      "Accept": "application/json",
      "S3OutputPath": "s3://offlinebatch/msmarcotestsoutputs/"
    },
    "TransformResources": {
      "InstanceCount": 100,
      "InstanceType": "ml.m4.xlarge"
    },
    "BatchStrategy": "SingleRecord"
  },
  "actions": [
    {
      "action_type": "predict",
      "method": "POST",
      "headers": {
        "content-type": "application/json"
      },
      "url": "https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/OpenSearch-sagemaker-060124023703/invocations",
      "request_body": "${parameters.input}",
      "pre_process_function": "connector.pre_process.default.embedding",
      "post_process_function": "connector.post_process.default.embedding"
    },
    {
      "action_type": "batch_predict",
      "method": "POST",
      "headers": {
        "content-type": "application/json"
      },
      "url": "https://api.sagemaker.us-east-1.amazonaws.com/CreateTransformJob",
      "request_body": """{ "BatchStrategy": "${parameters.BatchStrategy}", "ModelName": "${parameters.ModelName}", "DataProcessing" : ${parameters.DataProcessing}, "MaxConcurrentTransforms": ${parameters.MaxConcurrentTransforms}, "TransformInput": ${parameters.TransformInput}, "TransformJobName" : "${parameters.TransformJobName}", "TransformOutput" : ${parameters.TransformOutput}, "TransformResources" : ${parameters.TransformResources}}"""
    },
    {
      "action_type": "batch_predict_status",
      "method": "GET",
      "headers": {
        "content-type": "application/json"
      },
      "url": "https://api.sagemaker.us-east-1.amazonaws.com/DescribeTransformJob",
      "request_body": """{ "TransformJobName" : "${parameters.TransformJobName}"}"""
    },
    {
      "action_type": "cancel_batch_predict",
      "method": "POST",
      "headers": {
        "content-type": "application/json"
      },
      "url": "https://api.sagemaker.us-east-1.amazonaws.com/StopTransformJob",
      "request_body": """{ "TransformJobName" : "${parameters.TransformJobName}"}"""
    }
  ]
}
```

Note the connector ID in the response; you’ll use it to register the model:
```json
# Register the SageMaker model
POST /_plugins/_ml/models/_register
{
    "name": "SageMaker model for batch",
    "function_name": "remote",
    "description": "test model",
    "connector_id": "a3Y8O5IBOcD45O-eoq1g"
}
```
Invoke the model with the "batch_predict" action type
```json
POST /_plugins/_ml/models/teHr3JABBiEvs-eod7sn/_batch_predict
{
  "parameters": {
    "TransformJobName": "SM-offline-batch-transform"
  }
}
// Response
{
 "task_id": "oSWbv5EB_tT1A82ZnO8k",
 "status": "CREATED"
}
```

You can get batch job status using get task API
```json
GET /_plugins/_ml/tasks/oSWbv5EB_tT1A82ZnO8k
// Response
{
  "model_id": "nyWbv5EB_tT1A82ZCu-e",
  "task_type": "BATCH_PREDICTION",
  "function_name": "REMOTE",
  "state": "RUNNING",
  "input_type": "REMOTE",
  "worker_node": [
    "WDZnIMcbTrGtnR4Lq9jPDw"
  ],
  "create_time": 1725496527958,
  "last_update_time": 1725496527958,
  "is_async": false,
  "remote_job": {
    "TransformResources": {
      "InstanceCount": 1,
      "InstanceType": "ml.c5.xlarge"
    },
    "ModelName": "DJL-Text-Embedding-Model-imageforjsonlines",
    "TransformOutput": {
      "Accept": "application/json",
      "AssembleWith": "Line",
      "KmsKeyId": "",
      "S3OutputPath": "s3://offlinebatch/output"
    },
    "CreationTime": 1725496531.935,
    "TransformInput": {
      "CompressionType": "None",
      "ContentType": "application/json",
      "DataSource": {
        "S3DataSource": {
          "S3DataType": "S3Prefix",
          "S3Uri": "s3://offlinebatch/sagemaker_djl_batch_input.json"
        }
      },
      "SplitType": "Line"
    },
    "TransformJobArn": "arn:aws:sagemaker:us-east-1:802041417063:transform-job/SM-offline-batch-transform15",
    "TransformJobStatus": "InProgress",
    "BatchStrategy": "SingleRecord",
    "TransformJobName": "SM-offline-batch-transform15",
    "DataProcessing": {
      "InputFilter": "$.content",
      "JoinSource": "Input",
      "OutputFilter": "$"
    }
  }
}
```
### Step 1 alternative: Use CloudFormation Template Integration to simply the ml model creation

Refer to this AWS doc https://docs.aws.amazon.com/opensearch-service/latest/developerguide/cfn-template.html to deploy a CloudFormation stack which creates all the required SageMaker mode and connectors/models for you. 
![CloudFormation Console Integration](/assets/media/blog-images/2025-07-30-Offline-Batch-ML-Inference-and-Ingestion-for-1-Billion-Requests-using-OpenSearch-Ingestion/CFN_Console_Integration.png){: .img-fluid}

Once you started the CFN template deployment, please ensure that you have the parameter “Enable Offline Batch Inference” toggled to be true. 
![CloudFormation Parameters](/assets/media/blog-images/2025-07-30-Offline-Batch-ML-Inference-and-Ingestion-for-1-Billion-Requests-using-OpenSearch-Ingestion/CFN_Parameters.png){: .img-fluid}

After the CFN stack is created, you will find the connector_id and model_id in the output.

### Step 2: Define and Create an OSI pipeline for Ingestion
Create your OSI pipeline using code with a configuration editor.
```json
version: '2'
extension:
  osis_configuration_metadata:
    builder_type: visual
sagemaker-batch-job-pipeline:
  source:
    s3:
      acknowledgments: true
      delete_s3_objects_on_read: false
      scan:
        buckets:
          - bucket:
              name: xunzh-offlinebatch
              data_selection: metadata_only
              filter:
                include_prefix:
                  - sagemaker/sagemaker_djl_batch_input
                exclude_suffix:
                  - .manifest
          - bucket:
              name: xunzh-offlinebatch
              data_selection: data_only
              filter:
                include_prefix:
                  - sagemaker/output/
        scheduling:
          interval: PT6M
      aws:
        region: us-west-2
      default_bucket_owner: 388303208821
      codec:
        ndjson:
          include_empty_objects: false
      compression: none
      workers: '1'
  processor:
    - ml_inference:
        host: "https://search-xunzh-test-offlinebatch-kitdj4jwpiencfmxpklyvwarwa.us-west-2.es.amazonaws.com"
        aws_sigv4: true
        action_type: "batch_predict"
        service_name: "sagemaker"
        model_id: "9t4AbpYBQb1BoSOe8x8N"
        output_path: "s3://xunzh-offlinebatch/sagemaker/output"
        aws:
          region: "us-west-2"
          sts_role_arn: "arn:aws:iam::388303208821:role/Admin"
        ml_when: /bucket == "xunzh-offlinebatch"
    - copy_values:
        entries:
          - from_key: /content/0
            to_key: chapter
          - from_key: /content/1
            to_key: title
          - from_key: /SageMakerOutput/0
            to_key: chapter_embedding
          - from_key: /SageMakerOutput/1
            to_key: title_embedding
    - delete_entries:
        with_keys:
          - content
          - SageMakerOutput
  sink:
    - opensearch:
        hosts: ["https://search-xunzh-test-offlinebatch-kitdj4jwpiencfmxpklyvwarwa.us-west-2.es.amazonaws.com"]
        aws:
          serverless: false
          region: us-west-2
        routes:
          - ml-ingest-route
        index_type: custom
        index: test-nlp-index
  routes:
    - ml-ingest-route: /chapter != null and /title != null
```

### Step 3: Prepare your data for ingestion

The implementation uses MSMARCO dataset(https://microsoft.github.io/msmarco/Datasets.html.), a collection of real user queries, for natural language processing tasks. The dataset is structured in JSONL format, where each line represents a request to the ML embedding model:
```json
{"_id": "1185869", "text": ")what was the immediate impact of the success of the manhattan project?", "metadata": {"world war 2"}}
{"_id": "1185868", "text": "_________ justice is designed to repair the harm to victim, the community and the offender caused by the offender criminal act. question 19 options:", "metadata": {"law"}}
{"_id": "597651", "text": "what color is amber urine", "metadata": {"nothing"}}
{"_id": "403613", "text": "is autoimmune hepatitis a bile acid synthesis disorder", "metadata": {"self immune"}}
...
```
For this test, we constructed 1 billion input requests distributed across 100 files, each containing 10 million requests. These files are stored in S3 with the prefix s3://offlinebatch/sagemaker/sagemaker_djl_batch_input/. The OSI pipeline scans these 100 files simultaneously and initiates a SageMaker batch job with 100 workers for parallel processing, enabling efficient vectorization and ingestion of the 1 billion documents into OpenSearch service.

In production environments, customers can leverage OSI pipeline to generate S3 files for batch inference input. The pipeline supports various data sources (documented at https://docs.opensearch.org/latest/data-prepper/pipelines/configuration/sources/sources/), and operates on a schedule, continuously transforming source data into S3 files. These files are then automatically processed by AI servers through scheduled offline batch jobs, ensuring continuous data processing and ingestion.

### Step 4: Monitor the batch_inference jobs
You can monitor the batch_inference jobs through the SageMaker Console, cli or directly use the GetTask API provided by ml_commons for more details. 

```json
GET /_plugins/_ml/tasks/_search
{
  "query": {
    "bool": {
      "filter": [
        {
          "term": {
            "state": "RUNNING"
          }
        }
      ]
    }
  },
  "_source": ["model_id", "state", "task_type", "create_time", "last_update_time"]
}

```
A list of the active tasks of batch jobs will be listed

```json
{
  "took": 2,
  "timed_out": false,
  "_shards": {
    "total": 5,
    "successful": 5,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 3,
      "relation": "eq"
    },
    "max_score": 0.0,
    "hits": [
      {
        "_index": ".plugins-ml-task",
        "_id": "nyWbv5EB_tT1A82ZCu-e",
        "_score": 0.0,
        "_source": {
          "model_id": "nyWbv5EB_tT1A82ZCu-e",
          "state": "RUNNING",
          "task_type": "BATCH_PREDICTION",
          "create_time": 1725496527958,
          "last_update_time": 1725496527958
        }
      },
      {
        "_index": ".plugins-ml-task",
        "_id": "miKbv5EB_tT1A82ZCu-f",
        "_score": 0.0,
        "_source": {
          "model_id": "miKbv5EB_tT1A82ZCu-f",
          "state": "RUNNING",
          "task_type": "BATCH_PREDICTION",
          "create_time": 1725496528123,
          "last_update_time": 1725496528123
        }
      },
      {
        "_index": ".plugins-ml-task",
        "_id": "kiLbv5EB_tT1A82ZCu-g",
        "_score": 0.0,
        "_source": {
          "model_id": "kiLbv5EB_tT1A82ZCu-g",
          "state": "RUNNING",
          "task_type": "BATCH_PREDICTION",
          "create_time": 1725496529456,
          "last_update_time": 1725496529456
        }
      }
    ]
  }
}
```

### Step 5: Run Semantic search query against your 1 billion vectorized data
To search raw vectors, use the knn query type, provide the vector array as input, and specify the number of returned results k:

```json
GET /my-raw-vector-index/_search
{
  "query": {
    "knn": {
      "my_vector": {
        "vector": [0.1, 0.2, 0.3],
        "k": 2
      }
    }
  }
}
```

To run an AI-powered search, use the neural query type. Specify the query_text input, the model ID of the embedding model you configured in the OSI pipeline, and the number of returned results k. To exclude embeddings from being returned in search results, specify the embedding field in the _source.excludes parameter:
```json
GET /my-ai-search-index/_search
{
  "_source": {
    "excludes": [
      "output_embedding"
    ]
  },
  "query": {
    "neural": {
      "output_embedding": {
        "query_text": "What is AI search?",
        "model_id": "mBGzipQB2gmRjlv_dOoB",
        "k": 2
      }
    }
  }
}
```

## Conclusion

The integration of ml_commons with OSI through the ml_inference processor marks a significant advancement in large-scale ML data processing and ingestion. The solution's multi-pipeline architecture efficiently orchestrates data preparation, batch inference, and ingestion, while supporting multiple AI services including Bedrock, SageMaker in the first launch. The system demonstrates remarkable performance capabilities, as evidenced by its ability to process 1 billion requests through parallel processing and dynamic resource allocation, while offering cost benefits through 50% lower pricing for batch inference APIs compared to real-time processing. Looking ahead, the planned expansion to support real-time inference alongside batch processing will provide greater flexibility for various use cases. This makes the solution particularly valuable for applications such as semantic search, multimodal search, and document enrichment, where efficient vector creation and ingestion at scale are crucial. Overall, this integration represents a significant milestone in making large-scale ML operations more accessible, efficient, and cost-effective within the OpenSearch ecosystem, offering organizations a powerful tool for handling their ML-driven search and analytics needs.
