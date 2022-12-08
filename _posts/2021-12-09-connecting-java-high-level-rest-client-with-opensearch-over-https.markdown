---
layout: post
title:  "Connecting to OpenSearch over HTTPS using the Java High-Level REST Client"
authors: 
  - setiah
date: 2021-12-09 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "This post walks through the steps to configure Java High-level REST client to connect to OpenSearch over HTTPS."
redirect_from: "/blog/technical-post/2021/12/connecting-java-high-level-rest-client-with-opensearch-over-https/"
---

If you have ever used OpenSearch with a Java application, you might have come across the [OpenSearch Java high-level REST client](https://opensearch.org/docs/latest/clients/java-rest-high-level/). The REST client provides OpenSearch APIs as methods, and makes it easier for a Java application to interact with OpenSearch using request/response objects.

In this blog, you will learn how to configure the Java high-level REST client to connect to OpenSearch over HTTPS. For demonstration purposes, I'll first setup an OpenSearch server with SSL certificates. If you already have one running, you may skip this step. Next, I'll walk you through the steps to configure and use the Java High level REST client in your Java application.

## Setup OpenSearch Server

Start by downloading the latest [Linux distribution](https://opensearch.org/downloads.html) from the OpenSearch website. I have used the `1.2.0` version which is the latest available version at the time of this writing. You can also download this version with `wget` command as shown below.
```shell
wget https://artifacts.opensearch.org/releases/bundle/opensearch/1.2.0/opensearch-1.2.0-linux-x64.tar.gz
```

Next, unzip the downloaded `tar.gz` file.
```shell
tar -xf opensearch-1.2.0-linux-x64.tar.gz
```

The OpenSearch distribution comes pre-installed with the security plugin. As part of the initial setup, you are required to setup the SSL certificates for encrypting the client to node and the node to node communication channels. The distribution comes with a tool for setting up demo certificates for a quick getting started experience. However, it is highly recommended to use certificates from a trusted [Certification Authority (CA)](https://en.wikipedia.org/wiki/Certificate_authority). You could also setup self-signed certificates by following this [documentation](https://opensearch.org/docs/latest/security-plugin/configuration/generate-certificates/). For the purpose of this blog, I have used the demo certificates available with the [install_demo_configuration.sh](https://github.com/opensearch-project/security/blob/main/tools/install_demo_configuration.sh) tool. 
```shell
cd opensearch-1.2.0/

# Provide executable permissions to the tool if missing 
chmod +x plugins/opensearch-security/tools/install_demo_configuration.sh

# Install demo ssl certificates with install_demo_configuration.sh tool
./plugins/opensearch-security/tools/install_demo_configuration.sh -y -i -s
```

Once the certificates are setup, increase the default [`vm.max_map_count` limit](https://opensearch.org/docs/latest/opensearch/install/important-settings/) and start the OpenSearch cluster.  

```shell
# Increase mmap count limit 
sudo sysctl -w vm.max_map_count=262144

# To start the OpenSearch cluster
bin/opensearch
```

At this point, your server is ready. You can verify using the below `curl` command. 
```shell
curl -k -XGET https://localhost:9200 -u 'admin:admin'
```

You should see a response similar to -

```json
{
  "name" : "smoketestnode",
  "cluster_name" : "opensearch",
  "cluster_uuid" : "2oMfOxJKQcmrDZ1e0OgXKw",
  "version" : {
    "distribution" : "opensearch",
    "number" : "1.2.0",
    "build_type" : "tar",
    "build_hash" : "15e9f137622d878b79103df8f82d78d782b686a1",
    "build_date" : "2021-10-04T21:29:03.079792Z",
    "build_snapshot" : false,
    "lucene_version" : "8.9.0",
    "minimum_wire_compatibility_version" : "6.8.0",
    "minimum_index_compatibility_version" : "6.0.0-beta1"
  },
  "tagline" : "The OpenSearch Project: https://opensearch.org/"
}
```

Now that you have setup the OpenSearch server, it's time to move on to the client.

## Setup Java High Level REST Client

The OpenSearch Java High Level REST Client is available on [Maven Central](https://search.maven.org/search?q=a:opensearch-rest-high-level-client). Add it as a dependency to your Java application.

For Gradle build system, include the following dependency in your project's `build.gradle` file:

```gradle
dependencies {
    implementation 'org.opensearch.client:opensearch-rest-high-level-client:1.2.0'
}
```
 
For Maven build system, include the following dependency in your project's `pom.xml` file:
```xml
<dependency>
  <groupId>org.opensearch.client</groupId>
  <artifactId>opensearch-rest-high-level-client</artifactId>
  <version>1.2.0</version>
</dependency>
```

Next, create an instance of `RestHighLevelClient` in your Java application and use that to create an index and ingest some data into OpenSearch. But before going there, hold on a sec! Remember, while setting up the server you configured SSL certificates to enable HTTPS (and disabled HTTP)? Now, since these server certificates are just demo certificates and not provided by any trusted Certificate Authority (CA), they won't be trusted by your Java application to establish an SSL connection. In order to make it work, you'll need to add the root authority (that signed the server certificate) certificate to your application truststore. Let’s see how to configure the Java application truststore.

Java applications (by default) use the JVM truststore, which holds certificates from the trusted [Certified Authorities (CA)](https://en.wikipedia.org/wiki/Certificate_authority), to verify the certificate presented by the server in an SSL connection. You can use the Java `keytool` to see the list of trusted CAs in your JVM truststore.

```shell
keytool -keystore $JAVA_HOME/lib/security/cacerts -storepass changeit -list 
```

To use the `RestHighLevelClient`, you need to add the root CA certificate `root-ca.pem` to the application truststore. This tells your Java application to trust any certificates signed by this root authority.  The `install_demo_configuration.sh` tool created the `root-ca.pem` file in `opensearch-1.2.0/config/` directory while setting up the server. You can either add it to the JVM truststore, or add it to a custom truststore and use that custom truststore in the Java application. I used the custom truststore approach to keep the JVM truststore clean. 

Use the Java `keytool` to create a custom truststore and import the root authority certificate. The `keytool` does not understand the `.pem` format, so you’ll have to first convert the root authority certificate to `.der` format using `openssl` cryptography library and then add it to the custom truststore using Java `keytool`. Most Linux distributions already come with `openssl` installed.

### Step 1: Convert the root authority certificates from `.pem` to `.der` format.

```shell
openssl x509 -in opensearch-1.2.0/config/root-ca.pem -inform pem -out root-ca.der --outform der
```

### Step 2: Create a custom truststore and add the `root-ca.der` certs. 

Adding the root authority certificate to the application truststore tells the application to trust any certificate signed by this root CA.

```shell
keytool -import root-ca.der -alias opensearch -keystore myTrustStore
```

Confirm the action was successful by listing certs in truststore. The `grep` should be able to find opensearch alias if the certs were added successfully.

```shell
keytool -keystore myTrustStore -storepass changeit -list | grep opensearch
```

### Step 3: Set the truststore properties in the Java application code to point to the custom truststore. 

```java
// Point to keystore with appropriate certificates for security.
System.setProperty("javax.net.ssl.trustStore", "/full/path/to/myCustomTrustStore");
System.setProperty("javax.net.ssl.trustStorePassword", "password-for-myCustomTrustStore");
```


### Step 4: Create an instance of the client and connect to OpenSearch over HTTPS. 

```java
// Create the client.
RestClientBuilder builder = RestClient.builder(new HttpHost("localhost", 9200, "https"))
        .setHttpClientConfigCallback(new RestClientBuilder.HttpClientConfigCallback() {
            @Override
            public HttpAsyncClientBuilder customizeHttpClient(HttpAsyncClientBuilder httpClientBuilder) {
                return httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider);
            }
        });
RestHighLevelClient client = new RestHighLevelClient(builder);

// Create an index with custom settings.
CreateIndexRequest createIndexRequest = new CreateIndexRequest("custom-index");
createIndexRequest.settings(Settings.builder() //Specify in the settings how many shards you want in the index.
    .put("index.number_of_shards", 4)
    .put("index.number_of_replicas", 1)
    );
CreateIndexResponse createIndexResponse = client.indices().create(createIndexRequest, RequestOptions.DEFAULT);

// Adding data to the index.
IndexRequest request = new IndexRequest("custom-index"); //Add a document to the custom-index we created.
request.id("1"); //Assign an ID to the document.
HashMap<String, String> stringMapping = new HashMap<String, String>();
stringMapping.put("message:", "Testing Java REST client");
request.source(stringMapping); //Place your content into the index's source.
IndexResponse indexResponse = client.index(request, RequestOptions.DEFAULT);
```

Checkout this [documentation](https://opensearch.org/docs/latest/clients/java-rest-high-level/) for complete sample code.

Congratulations! You have now successfully setup the Java high level REST client and connected to OpenSearch on a secure HTTPS channel. 

Hope this post helped you in getting started with OpenSearch in your Java application. Moving forward, we are looking at ways in which we can further simplify the getting started experience for OpenSearch, and would like to seek your feedback in [OpenSearch#1618](https://github.com/opensearch-project/OpenSearch/issues/1618).
