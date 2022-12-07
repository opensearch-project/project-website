---
layout: post
title:  "AWS SigV4 support for OpenSearch clients"
authors:
  - vachshah
  - dblock
  - hvamsi
  - theotr
  - xtansia
  - mnkugler
  - mtimmerm
  - ssayakci
date: 2022-12-09
categories:
  - feature

---

## Introduction

OpenSearch Clients now support the ability to sign requests using [AWS Signature V4](https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html). This has been a community request since we forked clients from Elasticsearch, and we’re happy to announce that we have completed work across all clients, in collaboration with external contributors. Signing requests using native clients has been an essential requirement for accessing the Amazon OpenSearch Service on AWS using fine grained access controls. Having SigV4 support natively in clients avoids using cURL requests and other workarounds.


## Setting up the managed service to use fine grained access control

Be sure to update the access control to an IAM role/user. Do not use master user. In the following image, the IAM role used allows access to this specific OpenSearch domain:

![Fine Grained Access Control]({{ site.baseurl }}/assets/media/blog-images/2022-12-09-aws-sigv4-support-for-clients/fine-grained-control.png){: .img-fluid}

Alternatively, you can set a domain level access policy without using fine grained access. Ensure that the IAM role you use has read/write access to the domain.

![Access Policy]({{ site.baseurl }}/assets/media/blog-images/2022-12-09-aws-sigv4-support-for-clients/access-policy.png){: .img-fluid}

## Creating a client connection using SigV4 signing

 Before you start, ensure that you have [AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) set up on your machine. AWS credentials are stored in `~/.aws/credentials` and contain an access key and a secret key that allow you to authenticate with AWS resources using IAM.

 ### Creating a client connection in Java

Use the following code snippet to create a client connection in Java with SigV4 support:

```java
import java.io.IOException;

import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch.core.InfoResponse;
import org.opensearch.client.transport.aws.AwsSdk2Transport;
import org.opensearch.client.transport.aws.AwsSdk2TransportOptions;

import software.amazon.awssdk.http.SdkHttpClient;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.regions.Region;

public static void main(final String[] args) throws IOException {
    SdkHttpClient httpClient = ApacheHttpClient.builder().build();
    try {

        OpenSearchClient client = new OpenSearchClient(
            new AwsSdk2Transport(
                httpClient,
                "search-...us-west-2.es.amazonaws.com",
                Region.US_WEST_2,
                AwsSdk2TransportOptions.builder().build()
            )
        );

        InfoResponse info = client.info();
        System.out.println(info.version().distribution() + ": " + info.version().number());
    } finally {
      httpClient.close();
    }
}
``` 


### Creating a client connection in Python

The python client requires you to have `boto3` installed. Make sure to update the `connection_class` to use `RequestsHttpConnection`. Use the following code to create a client connection in python:

```python
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
import boto3
host = '' # cluster endpoint, for example: my-test-domain.us-east-1.es.amazonaws.com
region = 'us-west-2'
credentials = boto3.Session().get_credentials()
auth = AWSV4SignerAuth(credentials, region)
client = OpenSearch(
    hosts = [{'host': host, 'port': 443}],
    http_auth = auth,
    use_ssl = True,
    verify_certs = True,
    connection_class = RequestsHttpConnection
)
```

### Creating a client connection in JavaScript

The javascript client requires you to have `aws-sdk` installed. Depending on which version of the sdk you are using, initalize the client appropriately as shown in the following code segments:

Using AWS V2 SDK

```js
const AWS = require('aws-sdk'); // V2 SDK.
const { Client } = require('@opensearch-project/opensearch');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');

const client = new Client({
  ...AwsSigv4Signer({
    region: 'us-east-1',
    // Must return a Promise that resolve to an AWS.Credentials object.
    // This function is used to acquire the credentials when the client start and
    // when the credentials are expired.
    // The Client will refresh the Credentials only when they are expired.
    // With AWS SDK V2, Credentials.refreshPromise is used when available to refresh the credentials.

    // Example with AWS SDK V2:
    getCredentials: () =>
      new Promise((resolve, reject) => {
        // Any other method to acquire a new Credentials object can be used.
        AWS.config.getCredentials((err, credentials) => {
          if (err) {
            reject(err);
          } else {
            resolve(credentials);
          }
        });
      }),
  }),
  node: "https://search-xxx.region.es.amazonaws.com", // OpenSearch domain URL
});
```

Using AWS V3 SDK

```js
const { defaultProvider } = require("@aws-sdk/credential-provider-node"); // V3 SDK.
const { Client } = require('@opensearch-project/opensearch');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');

const client = new Client({
  ...AwsSigv4Signer({
    region: 'us-east-1',
    // Must return a Promise that resolve to an AWS.Credentials object.
    // This function is used to acquire the credentials when the client start and
    // when the credentials are expired.
    // The Client will refresh the Credentials only when they are expired.
    // With AWS SDK V2, Credentials.refreshPromise is used when available to refresh the credentials.

    // Example with AWS SDK V3:
    getCredentials: () => {
      // Any other method to acquire a new Credentials object can be used.
      const credentialsProvider = defaultProvider();
      return credentialsProvider();
    },
  }),
  node: "https://search-xxx.region.es.amazonaws.com", // OpenSearch domain URL
});

```
### Creating a client connection in Ruby

The [opensearch-aws-sigv4](https://github.com/opensearch-project/opensearch-ruby/tree/main/opensearch-aws-sigv4) gem provides the `OpenSearch::Aws::Sigv4Client` class, which has all features of `OpenSearch::Client`. The only difference between these two clients is that `OpenSearch::Aws::Sigv4Client` requires an instance of `Aws::Sigv4::Signer` during instantiation to authenticate with AWS:

```ruby
require 'opensearch-aws-sigv4'
require 'aws-sigv4'
signer = Aws::Sigv4::Signer.new(service: 'es',
                                region: 'us-west-2',
                                access_key_id: 'key_id',
                                secret_access_key: 'secret')
client = OpenSearch::Aws::Sigv4Client.new({ log: true }, signer)
client.cluster.health
client.transport.reload_connections!
client.search q: 'test'
```

### Creating a client connection in .NET

All required request signing is handled by the `AwsSigV4HttpConnection` implementation. By default, `AwsSigV4HttpConnection` uses the .NET AWS SDK's default credentials provider to acquire credentials from the environment. However, you may opt to pass in your own credentials provider, for example, to assume a role. Refer to the [OpenSearch.Net User Guide](https://github.com/opensearch-project/opensearch-net/blob/main/USER_GUIDE.md#opensearchnetauthawssigv4) for complete getting started instructions.

```c#
using OpenSearch.Client;
using OpenSearch.Net.Auth.AwsSigV4;

var endpoint = new Uri("https://search-xxx.region.es.amazonaws.com");
var connection = new AwsSigV4HttpConnection();
var config = new ConnectionSettings(endpoint, connection);
var client = new OpenSearchClient(config);
```

### Creating a client connection in Rust

Request signing is configured using the [`Credentials::AwsSigV4`](https://docs.rs/opensearch/latest/opensearch/auth/enum.Credentials.html#variant.AwsSigV4) enum variant or its helper conversion from an AWS SDK config. See [aws-config](https://docs.rs/aws-config/latest/aws_config/) for other AWS credentials provider implementations, for example, to assume a role.

```rust
use opensearch::{
    cat::CatIndicesParts,
    http::transport::{SingleNodeConnectionPool, TransportBuilder},
    OpenSearch,
};
use url::Url;

let creds = aws_config::load_from_env().await;

let host = "https://search-xxx.region.es.amazonaws.com";
let transport = TransportBuilder::new(SingleNodeConnectionPool::new(Url::parse(host).unwrap()))
    .auth(creds.try_into()?)
    // .auth(Credentials::AwsSigV4(creds.credentials().unwrap().clone(), creds.region().unwrap().clone()))
    .build()?;
let client = OpenSearch::new(transport);
```

### Creating a client connection in PHP

The PHP client uses the `setSigV4CredentialProvider` attribute to assume credentials from the the local credential store. Use the `setSigV4Region` attribute to set the region. 

```php
<?php

require __DIR__ . '/vendor/autoload.php';

$client = (new \OpenSearch\ClientBuilder())
    ->setSigV4Region('us-east-2')
    
    // Default credential provider.
    ->setSigV4CredentialProvider(true)
    
    // If you want to specify a custom key and secret
    ->setSigV4CredentialProvider([
      'key' => 'awskeyid',
      'secret' => 'awssecretkey',
    ])
    
    ->build();
```

### Creating a client connection in Go

Use the following code snippet to create a client connection in Go with SigV4 support.

Using the AWS V1 SDK:

```go
package main

import (
	"context"
	"io"
	"log"

	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/opensearch-project/opensearch-go/v2"
	"github.com/opensearch-project/opensearch-go/v2/opensearchapi"
	requestsigner "github.com/opensearch-project/opensearch-go/v2/signer/aws"
)

const endpoint = "" // e.g. https://opensearch-domain.region.com

func main() {
	ctx := context.Background()

	// Create an AWS request Signer and load AWS configuration using default config folder or env vars.
	// See https://docs.aws.amazon.com/opensearch-service/latest/developerguide/request-signing.html#request-signing-go
	signer, err := requestsigner.NewSigner(session.Options{SharedConfigState: session.SharedConfigEnable})
	if err != nil {
		log.Fatal(err) // Do not log.fatal in a production ready app.
	}

	// Create an opensearch client and use the request-signer
	client, err := opensearch.NewClient(opensearch.Config{
		Addresses: []string{endpoint},
		Signer:    signer,
	})
	if err != nil {
		log.Fatal("client creation err", err)
	}
}
```

Using the AWS V2 SDK:

```go
package main

import (
	"context"
	"io"
	"log"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/opensearch-project/opensearch-go/v2/opensearchapi"
	requestsigner "github.com/opensearch-project/opensearch-go/v2/signer/awsv2"
)

const endpoint = "" // e.g. https://opensearch-domain.region.com

func main() {
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Fatal(err) // Do not log.fatal in a production ready app.
	}

	// Create an AWS request Signer and load AWS configuration using default config folder or env vars.
	// See https://docs.aws.amazon.com/opensearch-service/latest/developerguide/request-signing.html#request-signing-go
	signer, err := requestsigner.NewSigner(cfg)
	if err != nil {
		log.Fatal(err) // Do not log.fatal in a production ready app.
	}

	// Create an opensearch client and use the request-signer
	client, err := opensearch.NewClient(opensearch.Config{
		Addresses: []string{endpoint},
		Signer:    signer,
	})
	if err != nil {
		log.Fatal("client creation err", err)
	}
}
```

## Usage with the Amazon OpenSearch Serverless Service (preview)

Please refer to [this article](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-clients.html) on how to use clients with the serverless service.

## Conclusion

You can now sign your requests using the client APIs natively instead of using workarounds. We’re continuing to work on improving the capabilities of SigV4 in clients with scenarios like async connections, compressed requests, and connection pooling support. We’re happy to take pull requests and feedback in the form of issues on [github](https://github.com/opensearch-project/).
