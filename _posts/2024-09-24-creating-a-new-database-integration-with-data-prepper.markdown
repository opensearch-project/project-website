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

Data Prepper, an open source data collector, enables you to collect, filter, enrich, and aggregate trace and log data. With Data Prepper, you can prepare your data for downstream analysis and visualization in OpenSearch.

Data Prepper pipelines consist of three main components: a source, an optional set of processors, and one or more sinks. For more information, see [ Data Prepper key concepts and fundamentals](https://opensearch.org/docs/latest/data-prepper/#key-concepts-and-fundamentals). The following sections outline the steps necessary for implementing a new database source integration within Data Prepper.

### Understanding push-based and pull-based sources

Data Prepper source plugins fall into two categories: push-based and pull-based. 

_Pull-based sources_ such as HTTP and OpenTelemetry (OTel), scale easily across Data Prepper containers. _Push-based sources_ rely load balancing solutions, such as Kubernetes, NGINX, or Docker Swarm, to distribute workload across Data Prepper containers.  

Unlike push-based sources, pull-based sources in Data Prepper use [Source coordination](https://opensearch.org/docs/latest/data-prepper/managing-data-prepper/source-coordination/) to achieve scalability and work distribution across multiple containers. Source coordination uses an external store functioning as a lease table, similar to the approach used by the [Kinesis Client Library](https://docs.aws.amazon.com/streams/latest/dev/shared-throughput-kcl-consumers.html).


### Defining work partitions for source coordination

Data Prepper uses source coordination to distribute  work partitions" across Data Prepper containers.

For new Data Prepper sources using source coordination, identifying and delineating work partitions is a fundamental first step. 

Data Prepper defines work partitions differently for various sources. In the S3 source, each S3 object represents a partition. For OpenSearch, an index serves as a partition. DynamoDB sources have dual partition types: S3 data files for exports and shards for stream processing. 


### Creating a source coordination-enabled Data Prepper plugin

A source coordination plugin consists of to two classes: the main plugin class and a configuration class. The configuration class specifies all required users inputs, from the data endpoints to authorization details and performance tuning parameters. All user-required inputs for plugin operation should be specified within this configuration class.

For a practical starting point, refer to the [sample source code](https://github.com/graytaylor0/data-prepper/blob/SourceCoordinationSampleSource/data-prepper-plugins/sample-source-coordination-source/src/main/java/SampleSource.java) in the Data Prepper repository.
 
This example demonstrates a basic configuration for a [hypothetical database source](https://github.com/graytaylor0/data-prepper/blob/SourceCoordinationSampleSource/data-prepper-plugins/sample-source-coordination-source/src/main/java/SampleSourceConfig.java), requiring only `database_name`, `username`, and `password`. The plugin name and configuration class are defined in the `@DataPrepperPlugin` annotation.
 
The `pipeline.yaml` for running this source in Data Prepper would be structured as follows:

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

These methods provide for managing partition CRUD operations and getting the next available partition using `acquireAvailablePartition(String partitionType)`. A common source coordination pattern assigns a "leader" Data Prepper container for partition discovery and creation. This is done by initializing a "leader partition" at startup and using `acquireAvailablePartition(LeaderPartition.PARTITION_TYPE)` to assign partition management responsibilities. 
is to assign a "leader" Data Prepper container that is responsible for partition discovery and creation of partitions. This is achieved by creating one partition on startup of Data Prepper that is the "Leader Partition", and utilizing the `acquireAvailablePartition(LeaderPartition.PARTITION_TYPE)`
method to determine if the job of partition discovery and creation of other partitions is assigned to a given Data Prepper container. 

The following code snippet demonstrates a simple flow while using source coordination. This example references a hypothetical database, where the "partition" is a single database file.
The full code for this example can be found [here](https://github.com/graytaylor0/data-prepper/blob/6e38dead8e9beca089381519654f329b82524b9d/data-prepper-plugins/sample-source-coordination-source/src/main/java/DatabaseWorker.java#L40).

The overview of this code is as follows for the different numbered sections

1. A leader partition was created on startup of Data Prepper ([Code reference](https://github.com/graytaylor0/data-prepper/blob/6e38dead8e9beca089381519654f329b82524b9d/data-prepper-plugins/sample-source-coordination-source/src/main/java/SampleSource.java#L41)). There is only one leader partition, and whichever Data Prepper node acquires it with the method call to `acquireAvailablePartition(LeaderPartition.PARTITION_TYPE)` will now be assigned the responsibility of discovering new database files.
2. If the leader partition is owned by this Data Prepper node, it will query the hypothetical database and create new partitions in the Source Coordination Store. When these partitions are created in the store, all Data Prepper nodes running this source will be able to acquire the database file partitions.
3. Acquire a database file partition to process. If no database files need to be processed at this time, an empty Optional will be returned
4. Process the database file by writing the records from that file into the Data Prepper buffer as individual Events. After the database file has all records written to the buffer, mark the database file partition as COMPLETED in the source coordination store. This will make it so the database file is not processed again.

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

### Running and Testing Data Prepper with Source Coordination

To create a new plugin, it is helpful to first experience setting up and running Data Prepper locally. The following steps will outline how to get Data Prepper up and running with a pipeline
that is streaming documents from MongoDB, and writing them to OpenSearch using source coordination. The example will only use a single Data Prepper application instance, 
but using source coordination allows for scaling if multiple instances of Data Prepper were run with the same pipeline configuration (i.e. pointing to the same MongoDB database), 
and utilizing the same source coordination store as defined in the `data-prepper-config.yaml`.

#### Step 1 - Set up Data Prepper locally for development

The [Data Prepper Developer Guide](https://github.com/opensearch-project/data-prepper/blob/main/docs/developer_guide.md) demonstrates all of the ways to run Data Prepper.
When developing a new source plugin, one must clone the Data Prepper repository and build from source with the following commands


Clone the Data Prepper repository
```
git clone https://github.com/opensearch-project/data-prepper.git
```

Build data prepper from source

```
./gradlew assemble
```

#### Step 2 - Set up MongoDB locally

Follow the [MongoDB installation guide](https://www.mongodb.com/docs/manual/installation/) to install and run MongoDB. Before you run MongoDB, 
you will need to enable [MongoDB change streams](https://www.mongodb.com/docs/manual/changeStreams/) by following [Converting your Standalone Self-Manged MongoDB to a Replica Set](https://www.mongodb.com/docs/manual/tutorial/convert-standalone-to-replica-set/).

Run `mongosh` to enter the shell. Once in the shell, create a new user and password. This username and password will be specified later in the Data Prepper `pipeline.yaml`. See [Create User Documentation](https://www.mongodb.com/docs/manual/reference/method/db.createUser/) for more information on creating users with MongoDB.

```
use admin
db.createUser({"user": "dbuser","pwd": "admin1234","roles": []});
```

Create a new database named `demo`:

```
use demo
```

Now create a new MongoDB collection in the `demo` database named `demo_collection` with

```
db.createCollection("demo_collection")
```

Insert some records into the collection. These will be processed during the export phase of the MongoDB pipeline.

```
db.demo_collection.insertOne({"key-one": "value-one"})
db.demo_collection.insertOne({"key-two": "value-two"})
db.demo_collection.insertOne({"key-three": "value-three"})
```

#### Step 3 - Set up OpenSearch locally

Follow the [Installation Quickstart](https://opensearch.org/docs/latest/getting-started/quickstart/) guide to run OpenSearch locally.

#### Step 4 - Create an AWS S3 bucket
Follow the steps here to [Create a new S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-bucket.html). If you already have a bucket, this step can be skipped. Since only one Data Prepper node can read from MongoDB streams
at a time, this S3 bucket will be used by the pipeline to provide a way to parallelize the processing and writing of data to OpenSearch between multiple Data Prepper containers when running in a multi-node environment.

#### Step 5 - Get credentials for accessing AWS DynamoDB and AWS S3

To create and interact with the DynamoDB Source Coordination Store that will be created on startup of Data Prepper, and to access the S3 bucket that was created in step 4, create a role with the following AWS policy permissions.
Be sure to replace the `MONGODB_BUCKET`, `REGION` and `AWS_ACCOUNT_ID`.

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

Now run

```
aws configure
```

and insert the `Access Key Id` and `Secret Access Key` for credentials that allow the previously created role to be assumed.

Set the following environment variables:

```
export AWS_REGION="{{REGION}}"
export SOURCE_COORDINATION_PIPELINE_IDENTIFIER="test-mongodb"
```

The `SOURCE_COORDINATION_PIPELINE_IDENTIFIER` should be the same as the `partition_prefix` in the `data-prepper-config.yaml` that 
will be created in the next step.

#### Step 6 - Create the data-prepper-config.yaml

The `data-prepper-config.yaml` is used to configure the source coordination store for Data Prepper. At this time,
only DynamoDB is supported as a source coordination store.

Create a file named `data-prepper-config.yaml` in the `data-prepper/release/archives/linux/build/install/opensearch-data-prepper-$VERSION-linux-x64/config/` directory 
and place the following contents into it. Be sure to replace the `REGION` with the desired region the DynamoDB table will be created in, as well as the `ROLE_ARN_FROM_STEP_5`:

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

Note how the `skip_table_creation` parameter is set to false. This will make it so Data Prepper will attempt to create the table on startup if it does not exist.
After the first time Data Prepper is run, this flag can be set to true to speed up the startup of Data Prepper.

Also note the `partition_prefix`. This prefix makes it easy to do a soft reset of the pipeline in the coordination store. If you are testing a new source plugin, simply bumping the prefix between each 
run (i.e. `test-mongodb-1`, `test-mongodb-2`) will make it so Data Prepper ignores DynamoDB items from the previous test run.

#### Step 7 - Create the pipeline.yaml

Create a file named `pipeline.yaml` in the `data-prepper/release/archives/linux/build/install/opensearch-data-prepper-$VERSION-linux-x64/pipelines/` directory, and place the following contents into it.
Be sure to replace `S3_BUCKET_NAME`, `S3_BUCKET_REGION`, `ROLE_ARN_FROM_STEP_5`, and your OpenSearch password:

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

Now that you have the AWS credentials, and MongoDB and OpenSearch are both running locally, you can now start the pipeline.

Move to the directory containing the Data Prepper binaries

```
cd data-prepper/release/archives/linux/build/install/opensearch-data-prepper-$VERSION-linux-x64
```

Start Data Prepper

```
bin/data-prepper
```

#### Step 9 - Observe the documents in OpenSearch

It may take a minute for the export to go through. Once you see a log like `org.opensearch.dataprepper.plugins.source.s3.ScanObjectWorker - Received all acknowledgments for folder partition` from Data Prepper, 
visit OpenSearch Dashboards in your browser at `http://localhost:5601`. 


Go to `Dev Tools` and run `GET mongodb-index/_search`. You should see the documents you added to MongoDB in step 2. 

#### Step 10 - Insert some sample documents to MongoDB

```
db.demo_collection.insertOne({"key-four": "value-four"})
db.demo_collection.insertOne({"key-five": "value-five"})
db.demo_collection.insertOne({"key-six": "value-six"})
```

These documents will now be pulled by Data Prepper's MongoDB source from the MongoDB streams.

#### Step 11 - Observe the documents in OpenSearch

Once you see another Data Prepper log like `org.opensearch.dataprepper.plugins.source.s3.ScanObjectWorker - Received all acknowledgments for folder partition`, 
go back to OpenSearch Dashboards Dev Tools and run another query on the index with `GET mongodb-index/_search`.

#### Step 12 - Cleanup resources

You are all done! Remember to delete the DynamoDB Source Coordination Store and the S3 bucket, and to stop Data Prepper, MongoDB, and OpenSearch.

### Summary

After reading this and following along, you hopefully will have a better understanding of the internals of Data Prepper, and how to create a new plugin 
that can scale via Source Coordination. If you have any ideas or proposals on new database plugins for Data Prepper, 
questions about creating a new plugin for a database, or even just general questions about Data Prepper, 
please don't hesitate to [Create a new discussion](https://github.com/opensearch-project/data-prepper/discussions), 
and the community and Data Prepper maintainers would be happy to help!



