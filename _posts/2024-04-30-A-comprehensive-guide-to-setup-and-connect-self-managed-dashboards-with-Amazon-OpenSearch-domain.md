---
layout: post
title:  "A comprehensive guide to setting up and connecting self-managed OpenSearch Dashboards with an Amazon OpenSearch Service domain"
authors:
 - mkbn
date: 2024-05-15
categories:
 - technical-post
meta_keywords: OpenSearch Dashboards, Amazon OpenSearch Service, self-managed dashboards, blue/green deployments
meta_description: Read this guide to learn how to set up self-managed dashboards with Amazon OpenSearch Service, covering options such as no authentication, basic authentication and SAML authentication.
has_math: true
has_science_table: true
---

[OpenSearch](https://opensearch.org/) is a scalable, flexible, and extensible open-source software suite for search, analytics, security monitoring, and observability applications, licensed under Apache 2.0. [OpenSearch Dashboards](https://opensearch.org/docs/latest/dashboards/) is a powerful and flexible data visualization and exploration platform that enables users to analyze and visualize large volumes of data. It is open-source software that provides a user-friendly interface for creating interactive dashboards, charts, and graphs, allowing users to gain valuable insights from their data.

In [Amazon OpenSearch Service](https://aws.amazon.com/opensearch-service/), a blue/green deployment establishes a standby environment for domain updates by replicating the production environment. After completing the updates, users are directed to the new environment. The blue environment represents the current production setup, while the green environment represents the standby setup. After completing the upgrade process, OpenSearch Service switches the environments, promoting the green environment to become the new production environment without any data loss. However, due to the current code configuration, access to Dashboards is interrupted during the initial phase of blue/green deployment. This can result in downtime for Dashboards, which presents challenges to users because it restricts their ability to visualize and explore data during this period.

To maintain continuous access to dashboards and visualizations during blue/green deployment, users can implement a workaround by setting up and connecting a self-managed Dashboards instance with a managed service domain. By using self-managed Dashboards instances, users can ensure continuous access to their dashboards and visualizations throughout the blue/green deployment process, minimizing downtime and mitigating any potential impact to business operations.

This solution currently supports three different methods of authentication:
* No authentication
* HTTP basic authentication
* SAML authentication

**IMPORTANT**: It is crucial to select the latest version of self-managed OpenSearch Dashboards, see the [Docker images repository](https://hub.docker.com/r/opensearchproject/opensearch-dashboards/tags) and add `“opensearch.ignoreVersionMismatch: true”` in the `opensearch_dashboards.yml` file. This will bypass the version check, allowing the Dashboards to connect seamlessly with any version of the managed service domain and prevent compatibility issues during blue/green deployment.
Please note that starting from version 2.14.0, OpenSearch Dashboards supports the 'ignore version check' feature.

# Setting up self-managed Dashboards in an Amazon EC2–hosted Docker container: No authentication

## Prerequisite
An AWS-managed OpenSearch domain without any authentication method enabled, accompanied by the following domain access policy, is required:

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "es:*",
      "Resource": "arn:aws:es:ap-south-1:765423874566:domain/no-security/*"
    }
  ]
}
```

**CAUTION**: To establish a connection with the managed OpenSearch Service domain, it is necessary to uninstall the Security plugin from self-managed Dashboards. Otherwise, the Dashboards Security plugin will anticipate a secured domain and will fail to make a connection.

## Removing the Security plugin and spinning up a self-managed Dashboards instance
* Remove all Security plugin configurations from `opensearch_dashboards.yml` or place the following example file in the same folder as the Dockerfile:

```
server.name: opensearch-dashboards
server.host: "0.0.0.0"
opensearch.hosts: http://localhost:9200
```

* Create a new Dockerfile, such as the following:

```
FROM opensearchproject/opensearch-dashboards:2.5.0
RUN /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin remove securityDashboards
COPY --chown=opensearch-dashboards:opensearch-dashboards opensearch_dashboards.yml /usr/share/opensearch-dashboards/config/
```

* Run the command **`docker build --tag=opensearch-dashboards-no-security .`** to build a new Docker image with the Security plugin removed.
* Validate whether the new image has been created by running the **`docker images`** command.
* In the following sample **`docker-compose.yml`** file, change the Dashboards image name from **`opensearchproject/opensearch-dashboards:2.5.0`** to **`opensearch-dashboards-no-security`** and remove the username and password fields:

```yaml
version: '3'
services:
  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:2.5.0
    container_name: opensearch-dashboards
    ports:
      - 5601:5601
    expose:
      - "5601"
    environment:
      OPENSEARCH_HOSTS: '["https://success-2-ce6hkjt5gh.ap-south-1.es.amazonaws.com"]'
      OPENSEARCH_USERNAME: 'xxx'
      OPENSEARCH_PASSWORD: 'xxxx'
    networks:
      - opensearch-net
networks:
  opensearch-net:
```

* The new **`docker-compose-no-security.yml`** file has now been created and should appear similar to the following file. Now run the **`docker-compose up`** command to run the containers with the new image. Then you can access the self-managed Dashboards instances by connecting to the Amazon Elastic Compute Cloud (Amazon EC2) endpoint with port **`5601`**. By doing so, you can conveniently view and interact with all the saved objects.

```yaml
version: '3'
services:
  opensearch-dashboards:
    image: opensearch-dashboards-no-security
    container_name: opensearch-dashboards
    ports:
      - 5601:5601
    expose:
      - "5601"
    environment:
      OPENSEARCH_HOSTS: '["https://success-2-ce6hkjt5gh.ap-south-1.es.amazonaws.com"]'
    networks:
      - opensearch-net
networks:
  opensearch-net:
```

# Setting up self-managed Dashboards instances in Amazon ECS and in an EC2-hosted Docker container: HTTP basic authentication

## Prerequisite
The AWS-managed OpenSearch domain must incorporate fine-grained access control (FGAC) with HTTP basic authentication, ensuring that a primary user is created in the internal user database. For more information, see [this tutorial](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/fgac-http-auth.html).

## Spinning up a self-managed Dashboards instance in Amazon ECS
* Create a task within Amazon Elastic Container Service (Amazon ECS) on AWS Fargate using the Dashboards Docker image.
* When creating a task, under **`container definition`** in **`port mapping`**, make sure the container ports **`5601`** and **`9200`** are added.
* Under **`environment variables`**, add the mandatory keys and values specified in [this document](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/dashboards.html#dashboards-local) to seamlessly connect with the managed service domain.
**NOTE**: The following sample **`task.json`** file from the Amazon ECS task definition shows the environment variables that have to be set while creating tasks:

```
{
...
            "portMappings": [
                {
                    "name": "dash-5601-tcp",
                    "containerPort": 5601,
                    "hostPort": 5601,
                    "protocol": "tcp",
                    "appProtocol": "http"
                },
                {
                    "name": "dash-9200-tcp",
                    "containerPort": 9200,
                    "hostPort": 9200,
                    "protocol": "tcp",
                    "appProtocol": "http"
                }
            ],
            "essential": true,
            "environment": [
                {
                    "name": "OPENSEARCH_USERNAME",
                    "value": "xxx"
                },
                {
                    "name": "OPENSEARCH_HOSTS",
                    "value": "https://success-2-ce6hkjt5gh.ap-south-1.es.amazonaws.com"
                },
                {
                    "name": "OPENSEARCH_PASSWORD",
                    "value": "xxxx"
                }
            ],
...
}
```

* Create a service using the previously created task within the same virtual private cloud (VPC) and subnet where the OpenSearch Service domain is operating.
* Access the self-managed Dashboards instances by connecting to the public endpoint of the running task in Amazon ECS on AWS Fargate. By doing so, you can conveniently view and interact with all the saved objects in accordance with the FGAC settings.

## Spinning up a self-managed Dashboards instance in an EC2-hosted container
* Deploy an EC2 instance in the same VPC and subnet as the managed OpenSearch Service domain.
* Set up Docker/Kubernetes and their dependencies on the instance.
* Use the following **`docker-compose.yml`** file to launch a self-managed Dashboards container. After the container is running, you can easily access and interact with all the saved objects.

```yaml
version: '3'
services:
  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:2.5.0
    container_name: opensearch-dashboards
    ports:
      - 5601:5601
    expose:
      - "5601"
    environment:
      OPENSEARCH_HOSTS: '["https://success-2-ce6hkjt5gh.ap-south-1.es.amazonaws.com"]'
      OPENSEARCH_USERNAME: 'xxx'
      OPENSEARCH_PASSWORD: 'xxxx'
    networks:
      - opensearch-net
networks:
  opensearch-net:
```

* To enable TLS, add the attributes specified [here](https://opensearch.org/docs/latest/install-and-configure/install-dashboards/tls/) as environment variables.

**TIP**: One notable advantage of setting up a self-managed Dashboards instance is that when it is deployed on **`Amazon Elastic Container Service (Amazon ECS) on AWS Fargate`**, it generates a public IP address. This allows the self-managed Dashboards instance to be accessed over the internet without the need to set up a reverse proxy. As a result, the OpenSearch domains will be within the VPC, and the self-managed Dashboards instances will be publicly available, enabling seamless connectivity and eliminating the complexity of configuring additional infrastructure components. This simplifies the setup process and provides convenient access to the Dashboards instances from anywhere on the internet without compromising security or requiring additional network configurations.

# Setting up a self-managed Dashboards instance in an EC2-hosted container: SAML authentication

## Prerequisite
An AWS-managed OpenSearch domain with SAML authentication enabled is required. For more information, see [SAML authentication for OpenSearch Dashboards](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/saml.html)

## Spinning up a self-managed Dashboards instance in an EC2-hosted container
* Create an EC2 instance within the same VPC where the managed OpenSearch Service domain is operating to configure the self-managed Dashboards instance and capture its endpoint.
* Create a new application in your `IDP` with the self-managed Dashboards endpoint, which generates new identity provider (IdP) metadata.
* Copy the IdP metadata of the newly created application and paste it into the IdP metadata text box found in the **`Configure identity provider (IdP)`** section on the **Security Configuration** tab of the managed service domain in the AWS Management Console. The following is the sample IdP metadata XML:

```
<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor entityID="http://www.okta.com/exk5o8mj6eLo2an697" xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"><md:IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><md:KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>MIIDqjCCApKgAwIBAgIGAYhxRsHXMA0GCSqGSIb3DQEBCwUAMIGVMQswCQYDVQQGEwJVUzETMBEG
A1UECAwKQ2FsaWZvcm5pYTEWMBQGA1UEBwwNU2FuIEZyYW5jaXNjbzENMAsGA1UECgwET2t0YTEU
MBIGA1UECwwLU1NPUHJvdmlkZXIxFjAUBgNVBAMMDXRyaWFsLTg4MDM5MzMxHDAaBgkqhkiG9w0B
CQEWDWluZm9Ab2t0YS5jb20wHhcNMjMwNTMxMTAwNjIyWhcNMzMwNTMxMTAwNzIyWjCBlTELMAkG
A1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xDTAL
MRwwGgYJKoZIhvcNAQkBFg1pbmZvQG9rdGEuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA5rt3ZEdTWryMFfGh2CV2am6iO7MFlNj6DsDwWmcpmUtDpR6SxVXT71gYWiphXUzVuYmk
N3r1LzzLC5NaQuTFY7Dps2HlcR9MFbf8ne2v7wXyZG1fora+v8Iv+nUvQ6xzG/ITOciyF1bsIDaH
Ja4n2+qg7Yp462izzAHD9D+e7GYpq84wrtCN4f/MueSFAFBMMg4P8nklDDbaeObOYTAfT9gZhvY0
o5WxDfwfq8zds9dYV0YGTzUVQruLF9VpPIS/6QCOmVmbw6IP8nIIQZjwHBwCHCK3/ArLcYPIL28S
qA0i/ueP3VQWZcljAL3WRW0hUrupOW+sK5nIdF0Ac1OZYQIDAQABMA0GCSqGSIb3DQEBCwUAA4IB
AQBOJM5K86/mJx0zlM1dYmP/PbyUpA+QDSi7aNaYJ06tGomIWHyA8wyw0+dMy7S2ZzSm/buXUv/w
Bgn+nueNrZY5+cOLLW8DSayGG0lZanTgtiCqA7JuKgzwxXmpsld1d7JgQ+EshCNLvF8c3iR47/+R
/rTp7aZ/jn3c+BBynqTQX/2aYWVizQyAPeZjWPZbTjy1kunUTdv6rhLEP+HizH8HN7tCPf1l4HZS
OzAwZlwvGWNaT3kaLtjdLmFjlDV5PUMiQdBf6DKihH8fdQjty/vbswxqfMGj0aSppxzXn0XG1kwH
IK5Y04uMGfRjcE+cPA/vPCKPxh/sgB0n6GaJCIDI</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor><md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified</md:NameIDFormat><md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://trial-8803933.okta.com/app/trial-8803933_2325vpc_1/exk5o8zomj6eLo2an697/sso/saml"/><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://trial-8803933.okta.com/app/trial-8803933_2325vpc_1/exk5o8zomj6eLo2an697/sso/saml"/></md:IDPSSODescriptor></md:EntityDescriptor>
```

* Replace the self-managed Dashboards URL in the security configuration file with the self-managed Dashboards endpoint. The purpose of this change is to guarantee that after the user is authenticated by IdP, they are redirected to the self-managed Dashboards instance instead of the managed Dashboards instance.

**IMPORTANT**: Users do not have access to modify the security configuration file, so you will need to raise a support case with AWS Support to request a change to the self-managed Dashboards URL endpoint. After AWS Support completes your request, you can check the new endpoint by running the API call **```_opendistro/_security/api/securityconfig```** and validate the **`kibana_url`** changes in the security configuration file. Additionally, make sure that **`challenge`** is set to false for basic auth backend, and your idp has the appropriate basepath for your self-managed dashboards.

**Disclaimer**: When changes are made to the Security Configuration file (such as those related to Basic Auth or SAML) after altering the `kibana_url`, it initiates an update to the backend Security Configuration. This update results in the `kibana_url` being reverted to the Custom Domain endpoint. The managed service control plane component uses the PATCH security config API to carry out this process, underscoring the strong recommendation against making any modifications to the security configuration.

* Install Docker and its dependencies on the EC2 instance.
* Use the following **`docker-compose.yml`** file and run the self-managed Dashboards instance:

```yaml
version: '3'
services:
  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:2.9.0
    container_name: opensearch-dashboards
    ports:
      - 5601:5601
    expose:
      - "5601"
    environment:
      OPENSEARCH_HOSTS: '["https://success-2-ce6hkjt5gh.ap-south-1.es.amazonaws.com"]'
      OPENSEARCH_USERNAME: 'xxx'
      OPENSEARCH_PASSWORD: 'xxxx'
    networks:
      - opensearch-net
networks:
  opensearch-net:
```

* After the container is up and running, access it by using the command **`docker exec -it <CONTAINER ID> bash`** and then modify the **`opensearch_dashboards.yml`** file by adding the SAML-specific attributes. Once the modifications are made, restart the container using **`docker restart <CONTAINER ID>`**. See the following sample **`opensearch_dashboards.yml`** file as a reference. See [OpenSearch Dashboards configuration](https://opensearch.org/docs/latest/security/authentication-backends/saml/#opensearch-dashboards-configuration) for more information.

```
opensearch.hosts: [https://localhost:9200]
opensearch.ssl.verificationMode: none
opensearch.username: kibanaserver
opensearch.password: kibanaserver
opensearch.requestHeadersWhitelist: [authorization, securitytenant]
opensearch_security.multitenancy.enabled: true
opensearch_security.multitenancy.tenants.preferred: [Private, Global]
opensearch_security.readonly_mode.roles: [kibana_read_only]
# Use this setting if you are running opensearch-dashboards without https
opensearch_security.cookie.secure: false
server.host: '0.0.0.0'
opensearch_security.auth.type: "saml"
server.xsrf.whitelist: ["/_opendistro/_security/saml/acs", "/_opendistro/_security/saml/logout"]
```

* After restarting the container, you can access the self-managed Dashboards instance by connecting to the EC2 endpoint with port `5601`. By doing so, you can view and interact with all the saved objects in accordance with the FGAC settings and SAML authentication.

**CAUTION**: If the endpoint is transitioned to self-managed Dashboards and the user intends to revert to the managed service Dashboards endpoint, they must repeat the same procedure, which involves changing the `kibana_url` in the security configuration file back to the managed service Dashboards endpoint.

**NOTE**: When using Docker in an EC2 instance, the self-managed Dashboards instance cannot be accessed over the internet. It is only accessible within the same VPC.

# Summary

The self-managed Dashboards workaround during upgrade minimizes downtime and impact to your business operations. The workaround also supports multiple authentication methods. You can find more information in the resources provided in the following section.

# References
* [https://docs.aws.amazon.com/opensearch-service/latest/developerguide/saml.html](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/saml.html)
* [https://opensearch.org/docs/latest/security/authentication-backends/saml/](https://opensearch.org/docs/latest/security/authentication-backends/saml/)
* [https://www.youtube.com/watch?v=TgnHBz4i63M](https://www.youtube.com/watch?v=TgnHBz4i63M)
* [https://www.youtube.com/watch?v=liJO_jOiIF8](https://www.youtube.com/watch?v=liJO_jOiIF8)
* [https://opster.com/guides/opensearch/opensearch-security/how-to-set-up-single-sign-on-using-saml/](https://opster.com/guides/opensearch/opensearch-security/how-to-set-up-single-sign-on-using-saml/)
* [https://opensearch.org/docs/latest/security/configuration/disable/](https://opensearch.org/docs/latest/security/configuration/disable/)

