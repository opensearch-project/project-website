---
layout: post
title:  "AWS SigV4 support for OpenSearch clients"
authors:
  - hvamsi
  - theotr
  - tsfarr
  - wbeckler
  - monicank
date: 2022-12-09
categories:
  - feature

---

## Introduction

OpenSearch Clients today support the ability to sign requests using [AWS Signature V4](https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html). This has been a community request since we forked clients from Elasticsearch, and we’re happy to announce that we have completed work across all clients, in collaboration with external contributors. Signing requests using native clients has been a big requirement for accessing the Amazon OpenSearch Service on AWS using fine grained access controls. Having SigV4 support natively in clients avoids work-arounds or using CURL requests.


## Setting up the managed service to use fine grained access control

Be sure to update the access control from using a master user to an IAM role/user. Here the IAM role used allows access to this specific OpenSearch domain.

![Fine Grained Access Control]({{ site.baseurl }}/assets/media/blog-images/2022-12-09-aws-sigv4-support-for-clients/fine-grained-control.png){: .img-fluid}

You can even set a domain level access policy without using fine grained access. Ensure that the IAM role used has read/write access to the domain.

![Access Policy]({{ site.baseurl }}/assets/media/blog-images/2022-12-09-aws-sigv4-support-for-clients/access-policy.png){: .img-fluid}

## Creating a client connection using SigV4 signing

 First, ensure that you have [AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) set up on your machine. AWS credentials are stored in `~/.aws/credentials` and contain an access key and a secret key that allow you to authenticate with AWS resources using IAM. 


### Creating a client connection in Python

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

## Conclusion

Customers can now sign their requests using the client APIs natively instead of using workarounds. We’re continuing to work on improving the capabilities of SigV4 in clients with scenarios like async connections, compressed requests, and connection pooling support. We’re happy to take pull requests and feedback in the form of issues on [github](https://github.com/opensearch-project/opensearch-py/issues).
