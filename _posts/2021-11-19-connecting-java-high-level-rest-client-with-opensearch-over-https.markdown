---
layout: post
title:  "Connecting Java High-level REST client with OpenSearch over HTTPS"
authors: 
  - setiah
date: 2021-11-19 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "This post walks through the steps to configure Java High-level REST client to connect with OpenSearch over HTTPS"
---

If you have ever used OpenSearch with a java application, you might have come across OpenSearch Java high-level REST client. Java high-level REST client provides OpenSearch APIs as methods, and makes it easier for a java application to interact with OpenSearch using request/response objects.

In this blog, we will see how to configure the Java high-level REST client (a.k.a JHLRC) to connect with an OpenSearch cluster securely. We will set up a local OpenSearch server using the default distribution which comes with security plugin pre-installed, and use JHLRC client in a sample Java application to interact with the server over HTTPS. I have used an Ubuntu 18.04 machine, but it should work for other linux distributions as well.

**Setup OpenSearch Server**

Lets start with downloading the [latest OpenSearch linux distribution](https://opensearch.org/downloads.html) from [opensearch.org](http://opensearch.org/). I have used 1.1.0 version which is the latest available version at the time of this writing. Unzip the downloaded tar.gz file.

```
// Download the latest available version from opensearch.org. 
`> wget https://artifacts.opensearch.org/releases/bundle/opensearch/1.1.0/opensearch-1.1.0-linux-x64.tar.gz
`
// Unzip it
`>`` tar ``-``xf opensearch``-``1.1``.``0``-``linux``-``x64``.``tar``.``gz`
```

The default distribution comes pre-installed with security plugin for encryption support. As part of the initial setup, we are required to setup the SSL certificates for providing encrypted client to node and node to node communication. The distribution comes with a tool for setting up demo certificates for a quick getting started experience, however it is highly recommended to use certificates from a trusted Certification Authority (CA). You can also setup self-signed certificates by following this [documentation](https://opensearch.org/docs/latest/security-plugin/configuration/generate-certificates/). For the purpose of this demo, I have used the demo certificates available with the `install_demo_configuration.sh` tool.

```
> cd opensearch-1.1.0/

// Install demo ssl certificates with install_demo_configurations.sh tool
> chmod +rwx plugins/opensearch-security/tools/install_demo_configuration.sh
> ./plugins/opensearch-security/tools/install_demo_configurations.sh -y
```

Once the certificates are setup, we can start the OpenSearch cluster and use curl to interact over HTTPS. OpenSearch comes with a SuperAdmin user with default admin:admin username/password. It is strongly recommended to change the password for production use case. 

```
// Increase mmap count limit 
sudo sysctl -w vm.max_map_count=262144

// To start the OpenSearch cluster
> bin/opensearch

// Check the OpenSearch cluster is up and running with curl
> curl -k -XGET https://localhost:9200 -u 'admin:admin'

*Response*
{
  "name" : "smoketestnode",
  "cluster_name" : "opensearch",
  "cluster_uuid" : "2oMfOxJKQcmrDZ1e0OgXKw",
  "version" : {
    "distribution" : "opensearch",
    "number" : "1.1.0",
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

Now that we have setup the OpenSearch server, let us move on to setting up the JHLRC client.

**Setup Java High Level REST Client**

The OpenSearch Java High Level REST Client is available on [Maven central](https://search.maven.org/search?q=a:opensearch-rest-high-level-client). For the purpose of this blog, we will create a simple gradle based java application which uses High Level REST Client to connect with OpenSearch server.

Let’s start with including the JHLRC dependency in `build.gradle`. This will download the dependency from maven central when the project is executed. It is recommended to use the same version of JHLRC client as OpenSearch version.

```
repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.opensearch.client:opensearch-rest-high-level-client:1.1.0'
}
```

Next, we will create an instance of `RestHighLevelClient` and use that to create an index and ingest some data into OpenSearch. But before going there, hold on a sec! Remember, while setting up the server we configured SSL certificates which enabled HTTPS (and disabled HTTP) on server side? We’ll need to configure the client as well to successfully establish an SSL connection with the server. Let’s see how to configure the client truststore.

A java application (by default) uses the JVM truststore, which holds certificates from the trusted [Certified Authorities (CA)](https://en.wikipedia.org/wiki/Certificate_authority), to verify the certificate presented by the server in an SSL connection. You can use the java `keytool` to see the list of trusted CAs in your JVM truststore.

```
keytool -keystore $JAVA_HOME/lib/security/cacerts -storepass changeit -list 
```

To configure the client, we need to add the root CA certificate (root-ca.pem) to the client truststore. The install_demo_configurations.sh tool created `opensearch-1.1.0/config/root-ca.pem` while setting up the server. We can either add it to the JVM truststore, or add it to a custom truststore and use that custom truststore in the JHLRC client. I prefer the custom truststore approach to keep the JVM truststore clean. 

Use the java `keytool` to create a custom truststore and import the root authority certificate. The `keytool` does not understand the `.pem` format, so we’ll have to first convert the root authority certificate to `.der` format using `openssl` cryptography library and then add it to the custom truststore using java `keytool`. Most Linux distributions already come with `openssl` installed. 

_STEP 1:_ Convert the root authority certificates from .pem to .der format.

```
openssl x509 -in opensearch-1.1.0/config/root-ca.pem -inform pem -out root-ca.der --outform der
```

_STEP 2:_ Create a custom truststore and add the `root-ca.der` certs. Later, we will set this custom truststore in the client code to override the default truststore.

```
keytool -import root-ca.der -alias opensearch -keystore myTrustStore
```

Confirm the action was successful by listing certs in truststore. The grep should be able to find opensearch alias if the certs were added successfully.

```
keytool -keystore myTrustStore -storepass changeit -list | grep opensearch
```

_STEP 3:_ Next, set the truststore properties in the client code to point to the custom truststore. 

```
//Point to keystore with appropriate certificates for security.
System.setProperty("javax.net.ssl.trustStore", "/full/path/to/myCustomTrustStore");
System.setProperty("javax.net.ssl.trustStorePassword", "password-for-myCustomTrustStore");
```


_STEP 4:_ Now create an instance of client and connect with OpenSearch over HTTPS. 

```
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
CreateIndexRequest createIndexRequest = new CreateIndexRequest("twitter");
createIndexRequest.settings(Settings.builder() //Specify in the settings how many shards you want in the index.
    .put("index.number_of_shards", 4)
    .put("index.number_of_replicas", 1)
    );
CreateIndexResponse createIndexResponse = client.indices().create(createIndexRequest, RequestOptions.DEFAULT);
```

You can also checkout this [github example](https://github.com/setiah/OpenSearchRestClient/tree/main) for full code.

Congratulations, you have now successfully setup the Java high level REST client to connect with OpenSearch on a secure HTTPS channel. If you face any problems or would like to provide some feedback, please comment on this [github issue](https://github.com/opensearch-project/project-website/issues/440). 
