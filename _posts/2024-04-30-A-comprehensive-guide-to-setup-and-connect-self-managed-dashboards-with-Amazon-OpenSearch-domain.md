---
layout: post
title:  "A comprehensive guide to setting up and connecting self-managed OpenSearch Dashboards with an Amazon OpenSearch Service domain"
authors:
 - mkbn
date: 2024-04-30
categories:
 - technical-post
meta_keywords: OpenSearch dashboards, Amazon OpenSearch service, self-managed, downtime issues, Mitigation
meta_description: In OpenSearch Managed service, Blue-Green deployment often results in downtime for managed service dashboards, impacting availability. Given the critical reliance of our customers on these dashboards for log analytics and other use cases, I've devised a workaround. By setting up self-managed dashboards and connecting them with the managed service domain, downtime issues during Blue-Green deployment are effectively mitigated. This guide walks through the setup process for self-managed dashboards, covering options such as no authentication, basic authentication, and SAML authentication. Customer to follow along with this blog to implement the solution at their end and ensure uninterrupted access to dashboards.
has_math: true
has_science_table: true
---

[OpenSearch](https://opensearch.org/) is a scalable, flexible, and extensible open-source software suite for search, analytics, security monitoring, and observability applications, licensed under Apache 2.0. [OpenSearch Dashboards](https://opensearch.org/docs/latest/dashboards/) is a powerful and flexible data visualization and exploration platform that enables users to analyze and visualize large volumes of data. It is an open-source project that provides a user-friendly interface for creating interactive dashboards, charts, and graphs, allowing users to gain valuable insights from their data.

In [Amazon OpenSearch service](https://aws.amazon.com/opensearch-service/), a blue/green deployment establishes a standby environment for domain updates by replicating the production environment. After completing the updates, users are directed to the new environment. The blue environment represents the current production setup, while the green environment represents the standby. OpenSearch Service after completing the upgrade process, switches the environments, promoting the green environment to become the new production environment without any data loss. However, due to the current code configuration, access to the OpenSearch dashboards is interrupted during the initial phase of blue/green deployment. This could results in downtime for the dashboards, which presents challenges to customers as it restricts their ability to visualize and explore data during this period.

To maintain continuous access to the dashboards and visualizations during blue/green deployment, customers can implement a workaround by setting up and connecting a self-managed OpenSearch Dashboards with the managed service domain. By utilizing self-managed instances of the OpenSearch Dashboards, customers can ensure continuous access to their dashboards and visualizations throughout the blue/green deployment process, minimizing downtime and mitigating any potential impact on the business operations.

This solution currently supports three different methods of authentication
* No authentication
* HTTP basic authentication
* SAML authentication

> [!IMPORTANT]
> Choosing the identical major version of self-managed dashboards as the source managed service domain you plan to link them with is vital across all supported methods (e.g. while upgrading from 1.3 to 2.11, self-managed dashboards should be in 1.3) - [Docker images repo link](https://hub.docker.com/r/opensearchproject/opensearch-dashboards/tags)

# Guide to setup self-managed dashboards in EC2 hosted docker container - No authentication

## Prerequisite
AWS managed OpenSearch domain without any authentication method enabled and is accompanied by the following domain access policy.
```json
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
> [!CAUTION]
> To establish a connection with the managed OpenSearch domain, it's necessary to uninstall the security plugin from self-managed dashboards. Otherwise, the Dashboards' security plugin will anticipate a secured domain and will fail to make a connection

## Steps to remove the security plugin and spin up a self-managed dashboards
1. Remove all Security plugin configurations from opensearch_dashboards.yml or place the below example file in the same folder as the Dockerfile
```yml
server.name: opensearch-dashboards
server.host: "0.0.0.0"
opensearch.hosts: http://localhost:9200
```
2. Create a new Dockerfile like below
```
FROM opensearchproject/opensearch-dashboards:2.5.0
RUN /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin remove securityDashboards
COPY --chown=opensearch-dashboards:opensearch-dashboards opensearch_dashboards.yml /usr/share/opensearch-dashboards/config/
```
3. Run this command `docker build --tag=opensearch-dashboards-no-security .` to build a new Docker image with security plugin removed.
4. Validate if the new image is created by running the `docker images` command
5. In the below sample `docker-compose.yml`, change the dashboards' image name from `opensearchproject/opensearch-dashboards:2.5.0` to `opensearch-dashboards-no-security` and remove the username and password fields.
```yml
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
6. The new `docker-compose-no-security.yml` file is now created which should look like the below. Now run the `docker-compose up` command to run the containers with new image. Now customer can access the self-managed dashboards by hitting the EC2 endpoint with port `5601`. By doing so, you can conveniently view and interact with all the saved objects
```yml
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
# 
# Guide to setup self-managed dashboards in ECS & in EC2 hosted docker container - HTTP basic authentication

## Prerequisite
AWS managed OpenSearch domain must incorporate Fine-Grained Access Control (FGAC) with HTTP basic authentication, ensuring that a master user is created in the internal user database.
[Reference here](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/fgac-http-auth.html)

## Steps to spin up a self-managed dashboards in ECS
1. Create a task within ECS Fargate using the dashboards docker image.
2. When creating a task, under "container definition" in "port mapping" make sure the container ports `5601` and `9200` are added.
3. Under environment variables, add the mandatory keys and values mentioned in this [doc](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/dashboards.html#dashboards-local) to seamlessly connect with managed service domain.

> [!NOTE]
> Below is the sample `task.json` file from the ECS task defenition to help understand the environment variables that has to be set while creating tasks
```json
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

4. Create a service using the previously created task within the identical VPC and subnet where the managed service OpenSearch domain is operating.
5. Access the self-managed dashboards by hitting the public endpoint of the running task in ECS Fargate. By doing so, you can conveniently view and interact with all the saved objects in accordance with the Fine-Grained Access Control settings.

## Steps to spin up a self-managed dashboards in EC2 hosted container
1. Deploy an EC2 instance in the same VPC and subnet as the managed OpenSearch service domain.
2. Set up Docker/Kubernetes and its dependencies on the instance.
3. Utilize the below `docker-compose.yml` file to launch a self-managed dashboards container. After the container is running, you can easily access and interact with all the saved objects.
```yml
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
4. To enable TLS, add the attributes mentioned in this [link](https://opensearch.org/docs/latest/install-and-configure/install-dashboards/tls/) as environment variables.

> [!TIP]
> One notable advantage of setting up a self-managed dashboards is that when it is deployed on `AWS ECS Fargate`, it generates a public IP. This allows the self-managed dashboards to be accessed over the internet without the need for setting up a reverse proxy. As a result, the OpenSearch domains will be within the VPC and self-managed dashboards will be available in public, enabling seamless connectivity and eliminating the complexity of configuring additional infrastructure components. This simplifies the setup process and provides convenient access to the dashboards from anywhere on the internet without compromising security or requiring additional network configurations.

# 
# Guide to setup self-managed dashboards in EC2 hosted container - SAML authentication

## Prerequisite
AWS managed OpenSearch domain with SAML authentication enabled. [Reference here](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/saml.html
)

## Steps to spin up a self-managed dashboards in EC2 hosted container
1. Create an EC2 instance within the identical VPC where the managed service OpenSearch domain is operating to configure the self-managed dashboards and capture its endpoint.
2. Create a new Application in your `IDP` with the self-managed dashboards endpoint which would generate a new IDP metadata
3. Copy the IDP metadata of the newly created application and paste it into the IDP metadata text box found in the `Configure identity provider (IdP)` section within the security configuration tab of the managed service domain in aws console. Below is the sample IDP metadata xml.
```xml
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
4. Replace the self-managed dashboards url in the security configuration file with the self-managed dashboards endpoint. The purpose of this change is to guarantee that after the user is authenticated by IDP, the redirection occurs to the self-managed dashboards instead of the managed service dashboards.

> [!IMPORTANT]
> Customers do not have access to modify the security configuration file hence raise a support case to AWS support to request a change to the self-managed dashboards URL endpoint. After the AWS support completes your request, you can check the new endpoint by running API call ```_opendistro/_security/api/securityconfig```, customer can validate the `kibana_url` changes in security configuration file.

5. Install docker and its dependencies on the EC2 instance
6. Use the below `docker-compose.yml` file and run the self-managed dashboards
```yml
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
7. After the container is up and running, access it by using the command `docker exec -it <CONTAINER ID> bash` and then modify the `opensearch_dashboards.yml` file by adding the SAML specific attributes. Once the modifications are made, restart the container using `docker restart <CONTAINER ID>`. Find below the sample `opensearch_dashboards.yml` for reference. [Additional Reference here](https://opensearch.org/docs/latest/security/authentication-backends/saml/#opensearch-dashboards-configuration)
```yml
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
8. Post container restart you can access the self-managed dashboards by hitting the EC2 endpoint with port 5601. By doing so, you can view and interact with all the saved objects in accordance with the Fine-Grained Access Control settings and SAML authentication.
> [!CAUTION]
> If the endpoint is transitioned to self-managed dashboards and the customer intends to revert to the managed service dashboards endpoint, they must repeat the same procedure, which involves changing the kibana_url in the security configuration file back to the managed service dashboards endpoint. Until this change is made, the managed service dashboards endpoint will remain inaccessible.

> [!NOTE]
> When using docker in EC2 instance, the self-managed dashboards cannot be accessed over the internet. It is only accessible within the same VPC.

# Summary

The self-managed dashboards workaround during upgrade minimizes dashboard downtime and impact on your business operations. The workaround also supports multiple authentication methods to support any specific authentication method required by the customers. You can find references about these subjects in the resources provided in the following section.

# References
* https://docs.aws.amazon.com/opensearch-service/latest/developerguide/saml.html
* https://opensearch.org/docs/latest/security/authentication-backends/saml/
* https://www.youtube.com/watch?v=TgnHBz4i63M
* https://www.youtube.com/watch?v=liJO_jOiIF8
* https://opster.com/guides/opensearch/opensearch-security/how-to-set-up-single-sign-on-using-saml/
* https://opensearch.org/docs/latest/security/configuration/disable/

