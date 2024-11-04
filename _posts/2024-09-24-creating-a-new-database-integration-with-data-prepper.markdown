---
layout: post
title:  "Step-by-step: Creating a new database integration using Data Prepper"
authors:
- tylgry
- dinujoh
date: 2022-09-21 10:00:00 -0500
categories:
  - technical-post
twittercard:
  description: "Data Prepper offers a flexible framework for database migration, supporting sources like MongoDB and DynamoDB. You can extend this capability to new databases by implementing a Data Prepper source plugin."
---

Data Prepper, an open-source data collector, enables you to collect, filter, enrich, and aggregate trace and log data. With Data Prepper, you can prepare your data for downstream analysis and visualization in OpenSearch.

Data Prepper pipelines consist of three main components: a source, an optional set of processors, and one or more sinks. For more information, see [Data Prepper key concepts and fundamentals](https://opensearch.org/docs/latest/data-prepper/#key-concepts-and-fundamentals). The following sections outline the steps necessary for implementing a new database source integration within Data Prepper.

### Understanding push-based and pull-based sources

Data Prepper source plugins fall into two categories: push based and pull based. 

_Pull-based sources_, such as HTTP and OpenTelemetry (OTel), scale easily across Data Prepper containers. _Push-based sources_ rely on load balancing solutions, such as Kubernetes, NGINX, or Docker Swarm, to distribute a workload across Data Prepper containers.  

Unlike push-based sources, pull-based sources use [source coordination](https://opensearch.org/docs/latest/data-prepper/managing-data-prepper/source-coordination/) to achieve scalability and work distribution across multiple containers. Source coordination uses an external store functioning as a lease table, similar to the approach used by the [Kinesis Client Library](https://docs.aws.amazon.com/streams/latest/dev/shared-throughput-kcl-consumers.html).


### Defining work partitions for source coordination

Data Prepper uses source coordination to distribute work partitions across Data Prepper containers.

For new Data Prepper sources using source coordination, identifying and delineating work partitions is a fundamental first step. 

Data Prepper defines work partitions differently for various sources. In the `s3` source, each Amazon Simple Storage Service (Amazon S3) object represents a partition. In OpenSearch, an index serves as a partition. Amazon DynamoDB sources have dual partition types: S3 data files for exports and shards for stream processing. 


### Creating a source-coordination-enabled Data Prepper plugin

A source coordination plugin consists of to two classes: the main plugin class and a configuration class. The configuration class specifies all required user inputs, including data endpoints, authorization details, and performance tuning parameters. All user-required inputs for plugin operations should be specified within this configuration class.

For a practical starting point, refer to the [sample source code](https://github.com/graytaylor0/data-prepper/blob/SourceCoordinationSampleSource/data-prepper-plugins/sample-source-coordination-source/src/main/java/SampleSource.java) in the Data Prepper repository.
 
This example demonstrates a basic configuration for a [hypothetical database source](https://github.com/graytaylor0/data-prepper/blob/SourceCoordinationSampleSource/data-prepper-plugins/sample-source-coordination-source/src/main/java/SampleSourceConfig.java), requiring only `database_name`, `username`, and `password`. The plugin name and configuration class are defined in the `@DataPrepperPlugin` annotation.
 
The `pipeline.yaml` file for running this source in Data Prepper would be structured as follows:

```yaml
version: 2
sample-source-pipeline:
  source:
   sample_source:
     database_name: "my-database"
     username: 'my-username'
     password: 'my-password'
  sink:
    - stdout:
```

### Using the source coordination APIs

The [source coordination interface](https://github.com/opensearch-project/data-prepper/blob/main/data-prepper-api/src/main/java/org/opensearch/dataprepper/model/source/coordinator/enhanced/EnhancedSourceCoordinator.java) defines the methods available for interacting with the [source coordination store](https://github.com/opensearch-project/data-prepper/blob/main/data-prepper-api/src/main/java/org/opensearch/dataprepper/model/source/SourceCoordinationStore.java).

These methods support managing partition CRUD operations and getting the next available partition using `acquireAvailablePartition(String partitionType)`. A common source coordination pattern assigns a "leader" Data Prepper container for partition discovery and creation. This is done by initializing a "leader partition" at startup and using `acquireAvailablePartition(LeaderPartition.PARTITION_TYPE)` to assign partition management responsibilities. 

The following code snippet shows a basic source coordination workflow, using a hypothetical database in which each partition represents an individual database file. See the [full code](https://github.com/graytaylor0/data-prepper/blob/6e38dead8e9beca089381519654f329b82524b9d/data-prepper-plugins/sample-source-coordination-source/src/main/java/DatabaseWorker.java#L40) on GitHub.

The key components and workflow in the code for implementing source coordination in Data Prepper are as follows:

1. Upon starting Data Prepper, a leader partition is established. See the [code reference](https://github.com/graytaylor0/data-prepper/blob/6e38dead8e9beca089381519654f329b82524b9d/data-prepper-plugins/sample-source-coordination-source/src/main/java/SampleSource.java#L41)). The single leader partition is assigned to the Data Prepper node that successfully calls `acquireAvailablePartition(LeaderPartition.PARTITION_TYPE)`, assigning it the task of identifying new database files.
2. When a Data Prepper node owns the leader partition, it queries the hypothetical database and creates new partitions in the source coordination store, enabling all nodes running this source to access these database file partitions.
3. A database file partition is acquired for processing. In cases where no partitions need processing, an empty `Optional` is returned.
4. The database file undergoes processing, with its records written into the Data Prepper buffer as individual `Events`. Once all records have been written to the buffer, the source coordination store marks the database file partition as `COMPLETED`, ensuring that it is not processed again.

```java
public void run() {

    while (!Thread.currentThread().isInterrupted()) {
        try {

            // 1 - Check if this node is already the leader. If it is not, then try to acquire leadership in case the leader node has crashed
            if (leaderPartition == null) {
                final Optional<EnhancedSourcePartition> sourcePartition = sourceCoordinator.acquireAvailablePartition(LeaderPartition.PARTITION_TYPE);
                if (sourcePartition.isPresent()) {
                    LOG.info("Running as a LEADER that will discover new database files and create partitions");
                    leaderPartition = (LeaderPartition) sourcePartition.get();
                }
            }

            // 2- If this node is the leader, run discovery of new database files and create partitions
            if (leaderPartition != null) {
                final List<EnhancedSourcePartition<DatabaseFilePartitionProgressState>> databaseFilePartitions = discoverDatabaseFilePartitions();
                LOG.info("Discovered {} new database file partitions", databaseFilePartitions.size());

                databaseFilePartitions.forEach(databaseFilePartition -> {
                    sourceCoordinator.createPartition(databaseFilePartition);
                });

                LOG.info("Created {} database file partitions in the source coordination store", databaseFilePartitions.size());
            }

            // 3 - Grab a database file partition, process it by writing to the buffer, and mark that database file partition as completed
            final Optional<EnhancedSourcePartition> databaseFilePartition = sourceCoordinator.acquireAvailablePartition(DatabaseFilePartition.PARTITION_TYPE);

            // 4 - If it's empty that means there are no more database files to process for now. If it's not empty, the database file is processed and then marked as COMPLETED in the source coordination store
            if (databaseFilePartition.isPresent()) {
                processDataFile(databaseFilePartition.get().getPartitionKey());
                sourceCoordinator.completePartition(databaseFilePartition.get());
            }

        } catch (final Exception e) {
            LOG.error("Received an exception in DatabaseWorker loop, retrying");
        }
    }
}
```

### Running and testing Data Prepper using source coordination

Before creating a new plugin, you must set up and run Data Prepper locally. The following steps guide you through configuring Data Prepper for streaming documents from MongoDB to OpenSearch using source coordination. While this example uses a single Data Prepper instance, the source coordination allows for scalability when running multiple instances with identical pipeline configurations and shared source coordination store settings defined in `data-prepper-config.yaml`.

#### Step 1: Set up Data Prepper for local development

The [OpenSearch Data Prepper Developer Guide](https://github.com/opensearch-project/data-prepper/blob/main/docs/developer_guide.md) provides a complete overview of running Data Prepper in various environments.
Creating a new source plugin requires cloning the Data Prepper repository and building it from the source using the following commands:


- Clone the Data Prepper repository:
```
git clone https://github.com/opensearch-project/data-prepper.git
```

- Build Data Prepper from source

```
./gradlew assemble
```

#### Step 2: Set up MongoDB locally

First, install and configure MongoDB using the [MongoDB installation guide](https://www.mongodb.com/docs/manual/installation/). Before running MongoDB, enable [MongoDB change streams](https://www.mongodb.com/docs/manual/changeStreams/) by following the instructions in [Convert a Standalone Self-Managed mongod to a Replica Set](https://www.mongodb.com/docs/manual/tutorial/convert-standalone-to-replica-set/).

Next, launch the MongoDB shell by running `mongosh`, and then create a new user and password within the shell using the following syntax. The username and password are required later in the Data Prepper `pipeline.yaml` file. See [Create User Documentation](https://www.mongodb.com/docs/manual/reference/method/db.createUser/) for more information about MongoDB user creation.

```
use admin
db.createUser({"user": "dbuser","pwd": "admin1234","roles": []});
```

Then, create a new database named `demo`:

```
use demo
```

Next, create a new MongoDB collection named `demo_collection` in your `demo` database with this syntax:

```
db.createCollection("demo_collection")
```

Finally, add sample records to the collection using the following syntax. These records are processed during the MongoDB pipeline's export phase:

```
db.demo_collection.insertOne({"key-one": "value-one"})
db.demo_collection.insertOne({"key-two": "value-two"})
db.demo_collection.insertOne({"key-three": "value-three"})
```

#### Step 3: Set up OpenSearch locally

To run OpenSearch locally, follow the steps in the [Installation quickstart](https://opensearch.org/docs/latest/getting-started/quickstart/).

#### Step 4: Create an Amazon S3 bucket
Follow the steps in [Create a new S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-bucket.html). You can skip this step if you have an existing bucket. This S3 bucket enables parallel processing and writing to OpenSearch across multiple Data Prepper containers in a multi-node setup, given that only one node can read from MongoDB streams at a time.

#### Step 5 - Get AWS credentials for DynamoDB and S3 access

Set up an AWS role with the following policy permissions to enable Data Prepper to interact with the DynamoDB source coordination store and the S3 bucket from step 4. Make sure to replace `MONGODB_BUCKET`, `REGION` and `AWS_ACCOUNT_ID` with your unique values.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "s3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": [ "arn:aws:s3:::{{MONGODB_BUCKET}}/*" ]
    },
    {
      "Sid": "allowReadingFromS3Buckets",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::{{MONGODB_BUCKET}}",
        "arn:aws:s3:::{{MONGODB_BUCKET}}/*"
      ]
    },
    {
      "Sid": "allowListAllMyBuckets",
      "Effect":"Allow",
      "Action":"s3:ListAllMyBuckets",
      "Resource":"arn:aws:s3:::*"
    },
    {
      "Sid": "ReadWriteSourceCoordinationDynamoStore",
      "Effect": "Allow",
      "Action": [
        "dynamodb:DescribeTimeToLive",
        "dynamodb:UpdateTimeToLive",
        "dynamodb:DescribeTable",
        "dynamodb:CreateTable",
        "dynamodb:GetItem",
        "dynamodb:DeleteItem",
        "dynamodb:PutItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:${AWS_ACCOUNT_ID}:table/DataPrepperSourceCoordinationStore",
        "arn:aws:dynamodb:${REGION}:${AWS_ACCOUNT_ID}:table/DataPrepperSourceCoordinationStore/index/source-status"
      ]
    }
  ]
}
```

Run the following command, then enter the `Access Key Id` and `Secret Access Key` associated with credentials that correspond to the previously defined role:

```
aws configure
```


Then, set the following environment variables:

```
export AWS_REGION="{{REGION}}"
export SOURCE_COORDINATION_PIPELINE_IDENTIFIER="test-mongodb"
```

The `SOURCE_COORDINATION_PIPELINE_IDENTIFIER` must correspond to the `partition_prefix` that you will define in the `data-prepper-config.yaml` in step 6. 

#### Step 6 - Create the data-prepper-config.yaml

Configure the source coordination store for Data Prepper using the `data-prepper-config.yaml` file. Currently, this store exclusively supports DynamoDB.

In the `data-prepper/release/archives/linux/build/install/opensearch-data-prepper-$VERSION-linux-x64/config/` directory, create a file named `data-prepper-config.yaml`. Insert the following content, replacing `REGION` with your desired DynamoDB table region and `ROLE_ARN_FROM_STEP_5` with the appropriate role ARN:

```yaml
ssl: false
source_coordination:
  partition_prefix: "test-mongodb"
  store:
    dynamodb:
      sts_role_arn: "{{ROLE_ARN_FROM_STEP_5}}"
      table_name: "DataPrepperSourceCoordinationStore"
      region: "{{REGION}}"
      skip_table_creation: false
```

The `skip_table_creation` parameter is set to `false`, instructing Data Prepper create the table on startup if it is missing. For subsequent runs, you can set this flag to `true` to accelerate startup speed.

The `partition_prefix` enables soft resets of the pipeline in the source coordination store. When testing a new source plugin, incrementing this prefix (for example, `test-mongodb-1`, `test-mongodb-2`) ensures Data Prepper ignores DynamoDB items from the previous test runs.

#### Step 7 - Create the `pipeline.yaml` file

In the `data-prepper/release/archives/linux/build/install/opensearch-data-prepper-$VERSION-linux-x64/pipelines/` directory, create a `pipeline.yaml` file with the following content. Make sure to update `S3_BUCKET_NAME`, `S3_BUCKET_REGION, ROLE_ARN_FROM_STEP_5`, and your OpenSearch password:

```yaml
pipeline: 
  workers: 2 
  delay: 0 
  buffer: 
    bounded_blocking: 
      batch_size: 125000 
      buffer_size: 1000000 
  source: 
    mongodb: 
      host: "localhost" 
      port: 27017 
      acknowledgments: true 
      s3_bucket: "{{S3_BUCKET_NAME}}"  
      s3_region: "{{S3_BUCKET_REGION}}" 
      s3_prefix: "mongodb-opensearch"
      insecure: "true" 
      ssl_insecure_disable_verification: "true" 
      authentication:
        username: "dbuser"
        password: "admin1234"
      collections: 
        - collection: "demo.demo_collection"
          export: true
          stream: true
      aws:
        sts_role_arn: "{{ROLE_ARN_FROM_STEP_5}}"
  sink: 
    - opensearch:  
        hosts: [ "http://localhost:9200" ] 
        index: "mongodb-index" 
        document_id: "${getMetadata(\"primary_key\")}" 
        action: "${getMetadata(\"opensearch_action\")}" 
        document_version: "${getMetadata(\"document_version\")}" 
        document_version_type: "external" 
        # Default username
        username: "admin"
        # Change to your OpenSearch password if needed. For running OpenSearch with Docker Compose, this is set by the environment variable OPENSEARCH_INITIAL_ADMIN_PASSWORD
        password: "OpenSearchMongoDB1#"
        flush_timeout: -1
```

#### Step 8 - Run the pipeline

With AWS credentials configured and both MongoDB and OpenSearch running on your local machine, you can launch the pipeline.

First, navigate to the directory containing the Data Prepper binaries:

```
cd data-prepper/release/archives/linux/build/install/opensearch-data-prepper-$VERSION-linux-x64
```

Then, start Data Prepper using the following command:

```
bin/data-prepper
```

#### Step 9 - Review the documents in OpenSearch

Wait for the export to complete, which may take a minute. Once Data Prepper displays  a log, for example, `org.opensearch.dataprepper.plugins.source.s3.ScanObjectWorker - Received all acknowledgments for folder partition`, open `http://localhost:5601` to access OpenSearch Dashboards. 

Go to the **Dev Tools** application and enter `GET mongodb-index/_search` into the console editor to retrieve the MongoDB documents you created in step 2. 

#### Step 10 - Add sample documents to MongoDB
Add sample documents to MongoDB using the following command:
 
```
db.demo_collection.insertOne({"key-four": "value-four"})
db.demo_collection.insertOne({"key-five": "value-five"})
db.demo_collection.insertOne({"key-six": "value-six"})
```

The MongoDB source in Data Prepper will now extract  these documents from the MongoDB streams.

#### Step 11 - Review the documents in OpenSearch

As soon as Data Prepper generates another log, for example, `org.opensearch.dataprepper.plugins.source.s3.ScanObjectWorker - Received all acknowledgments for folder partition`, return to **Dev Tools** and run another search on the index using `GET mongodb-index/_search`.

#### Step 12: Clean up resources

As you complete this process, make sure that you delete the DynamoDB source coordination store and S3 bucket as well as stop the Data Prepper, MongoDB, and OpenSearch instances.

### Summary

We hope this guide deepens your knowledge of the Data Prepper architecture and the process of creating scalable plugins with source coordination. For any suggestions regarding new database plugins, assistance with plugin creation, or general Data Prepper questions, [create a new discussion](https://github.com/opensearch-project/data-prepper/discussions). The Data Prepper community and maintenance team are committed to supporting your efforts.  



