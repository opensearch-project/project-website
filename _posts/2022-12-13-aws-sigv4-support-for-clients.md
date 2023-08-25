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
date: 2022-12-13
categories:
  - feature
  - 
meta_description: "OpenSearch clients now support the ability to sign requests using AWS Signature V4 with fine-grained access control and domain-level access polices."
meta_keywords: "AWS Sigv4 support, fine grained access control, domain-level access policy, AWS request signing, AWS Identity Access Manager"
---

OpenSearch clients now support the ability to sign requests using [AWS Signature V4](https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html). This has been a community request for a while, and we’re happy to announce that we have completed work across all clients, in collaboration with external contributors. Signing requests using native clients has been an essential requirement for accessing the Amazon OpenSearch Service on AWS using fine grained access controls. Having native SigV4 support in clients avoids the need to use cURL requests and other workarounds.

## Setting up the managed service to use fine-grained access control

Be sure to update your access control type to an AWS Identity and Access Management (IAM) role/user. Do not use the master user role. In the following image, the IAM role allows access to the specific OpenSearch domain that is selected:

![Fine Grained Access Control]({{ site.baseurl }}/assets/media/blog-images/2022-12-09-aws-sigv4-support-for-clients/fine-grained-control.png){: .img-fluid}

Alternatively, you can set a domain-level access policy without using fine-grained access. Ensure that the IAM role you use has read/write access to the domain.

![Access Policy]({{ site.baseurl }}/assets/media/blog-images/2022-12-09-aws-sigv4-support-for-clients/access-policy.png){: .img-fluid}

## Creating a client connection using SigV4 signing

Before you begin, ensure that you have [AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) set up on your machine. AWS credentials can be stored in `~/.aws/credentials` or set as `AWS_` environment variables, and contain an access key, a secret key and an optional session token, that allow you to authenticate with AWS resources using IAM.

### Creating a client connection in Java

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
                "search-xxx.region.es.amazonaws.com",
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

The Python client requires you to have `boto3` installed. Make sure to update the `connection_class` to use `RequestsHttpConnection`.

```python
from urllib.parse import urlparse

from boto3 import Session
from opensearchpy import AWSV4SignerAuth, OpenSearch, RequestsHttpConnection

url = urlparse("https://search-xxx.region.es.amazonaws.com")
region = 'us-east-1'

credentials = Session().get_credentials()

auth = AWSV4SignerAuth(credentials, region)

client = OpenSearch(
  hosts=[{
    'host': url.netloc,
    'port': url.port or 443
  }],
  http_auth=auth,
  use_ssl=True,
  verify_certs=True,
  connection_class=RequestsHttpConnection
)

info = client.info()
print(f"{info['version']['distribution']}: {info['version']['number']}")
```

### Creating a client connection in JavaScript

The JavaScript client requires you to have `aws-sdk` installed. Depending on which version of the SDK you are using, initialize the client appropriately as shown in the following code segments.

#### Using AWS V2 SDK

```js
const AWS = require('aws-sdk');
const { Client } = require('@opensearch-project/opensearch');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');

const client = new Client({
  ...AwsSigv4Signer({
    region: 'us-east-1',
    getCredentials: () =>
      new Promise((resolve, reject) => {
        AWS.config.getCredentials((err, credentials) => {
          if (err) {
            reject(err);
          } else {
            resolve(credentials);
          }
        });
      }),
  }),
  node: "https://search-xxx.region.es.amazonaws.com"
});
```

#### Using AWS V3 SDK

```js
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { Client } = require('@opensearch-project/opensearch');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');

async function main() {
  const client = new Client({
    ...AwsSigv4Signer({
      region: "us-east-1",
      getCredentials: () => {
        const credentialsProvider = defaultProvider();
        return credentialsProvider();
      },
    }),
    node: "https://search-xxx.region.es.amazonaws.com"
  });

  var info = await client.info();
  var version = info.body.version
  console.log(version.distribution + ": " + version.number);
}

main();
```

### Creating a client connection in Ruby

The [opensearch-aws-sigv4](https://github.com/opensearch-project/opensearch-ruby/tree/main/opensearch-aws-sigv4) gem provides the `OpenSearch::Aws::Sigv4Client` class, which has all the features of `OpenSearch::Client`. The only difference between these two clients is that `OpenSearch::Aws::Sigv4Client` requires an instance of `Aws::Sigv4::Signer` during instantiation to authenticate with AWS.

```ruby
require 'opensearch-aws-sigv4'
require 'aws-sigv4'

signer = Aws::Sigv4::Signer.new(
  service: 'es',
  region: 'us-east-1',
  access_key_id: '...',
  secret_access_key: '...',
  session_token: '...'
)

client = OpenSearch::Aws::Sigv4Client.new({
  host: "https://search-xxx.region.es.amazonaws.com",
  log: false
}, signer)

info = client.info
puts info['version']['distribution'] + ': ' + info['version']['number']
```

### Creating a client connection in .NET

All required request signing is handled by the `AwsSigV4HttpConnection` implementation. By default, `AwsSigV4HttpConnection` uses the .NET AWS SDK's default credentials provider to acquire credentials from the environment. However, you may opt to pass in your own credentials provider, for example, to assume a role. Refer to the [OpenSearch.Net User Guide](https://github.com/opensearch-project/opensearch-net/blob/main/USER_GUIDE.md#opensearchnetauthawssigv4) for complete instructions.

```c#
using OpenSearch.Client;
using OpenSearch.Net.Auth.AwsSigV4;

namespace Application
{
    class Program
    {
        static void Main(string[] args)
        {
            var endpoint = new Uri("https://search-xxx.region.es.amazonaws.com");
            var connection = new AwsSigV4HttpConnection();
            var config = new ConnectionSettings(endpoint, connection);
            var client = new OpenSearchClient(config);

            Console.WriteLine($"{client.RootNodeInfo().Version.Distribution}: {client.RootNodeInfo().Version.Number}");
        }
    }
}
```

### Creating a client connection in Rust

Request signing is configured using the [`Credentials::AwsSigV4`](https://docs.rs/opensearch/latest/opensearch/auth/enum.Credentials.html#variant.AwsSigV4) enum variant or its helper conversion from an AWS SDK configuration. See [aws-config](https://docs.rs/aws-config/latest/aws_config/) for other AWS credentials provider implementations, for example, to assume a role.

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    use std::{convert::TryInto, env, thread, time};

    use serde_json::Value;

    use opensearch::{
        http::transport::{SingleNodeConnectionPool, TransportBuilder},
        OpenSearch,
    };

    use url::Url;

    let url = Url::parse("https://search-xxx.region.es.amazonaws.com");
    let conn_pool = SingleNodeConnectionPool::new(url?);
    let aws_config = aws_config::load_from_env().await.clone();
    let transport = TransportBuilder::new(conn_pool)
        .auth(aws_config.clone().try_into()?)
        .build()?;
    let client = OpenSearch::new(transport);

    let info: Value = client.info().send().await?.json().await?;
    println!(
        "{}: {}",
        info["version"]["distribution"].as_str().unwrap(),
        info["version"]["number"].as_str().unwrap()
    );

    Ok(())
}
```

### Creating a client connection in PHP

The PHP client uses the `setSigV4CredentialProvider` attribute to assume credentials from the the local credential store. Use the `setSigV4Region` attribute to set the AWS Region. 

```php
<?php

require_once __DIR__ . '/vendor/autoload.php';

$client = (new \OpenSearch\ClientBuilder())
  ->setHosts(["https://search-xxx.region.es.amazonaws.com"])
  ->setSigV4Region("us-east-1")
  ->setSigV4CredentialProvider(true)
  ->build();

$info = $client->info();

echo "{$info['version']['distribution']}: {$info['version']['number']}\n";
```

### Creating a client connection in Go

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/opensearch-project/opensearch-go/v2"
	requestsigner "github.com/opensearch-project/opensearch-go/v2/signer/awsv2"
)

func main() {
	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx)
	signer, _ := requestsigner.NewSigner(cfg)

	endpoint := "https://search-xxx.region.es.amazonaws.com"

	client, _ := opensearch.NewClient(opensearch.Config{
		Addresses: []string{endpoint},
		Signer:    signer,
	})

	if info, err := client.Info(); err != nil {
		log.Fatal("info", err)
	} else {
		var r map[string]interface{}
		json.NewDecoder(info.Body).Decode(&r)
		version := r["version"].(map[string]interface{})
		fmt.Printf("%s: %s\n", version["distribution"], version["number"])
	}
}
```

## Use with Amazon OpenSearch Serverless (preview)

Refer to [this article](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-clients.html) for information about how to use clients with Amazon OpenSearch Serverless.

## Summary

You can now sign your requests natively using the client APIs instead of workarounds. We’re continuing to work on improving the capabilities of SigV4 in clients with scenarios like asynchronous connections, compressed requests, and connection pooling support, and we welcome your pull requests and feedback in the form of issues on [GitHub](https://github.com/opensearch-project/).
