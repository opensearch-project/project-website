---
layout: post
title:  "A comprehensive guide to setup and connect self-managed dashboards with Amazon OpenSearch domain"
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

In [Amazon OpenSearch service](https://aws.amazon.com/opensearch-service/), a blue/green deployment establishes a standby environment for domain updates by replicating the production environment. After completing the updates, users are directed to the new environment. The blue environment represents the current production setup, while the green environment serves as the standby. OpenSearch Service then switches the environments, promoting the green environment to become the new production environment without any data loss. However, due to the current code configuration, access to OpenSearch dashboards is interrupted during the "Creating a new environment" phase of blue/green deployment. This results in a significant downtime for the dashboards, which presents substantial challenges to customers as it restricts their ability to visualize and explore data during this period.

To maintain access to dashboards and visualizations during blue/green deployment, customers can implement a workaround by setting up and connecting self-managed OpenSearch Dashboards with the managed service domain. By utilizing self-managed instances of OpenSearch Dashboards, customers can ensure continuous access to their dashboards and visualizations throughout the blue/green deployment process, minimizing downtime and mitigating any potential impact on business operations.

This solution currently supports three different methods of authentication
* No authentication
* HTTP basic authentication
* SAML authentication

> [!IMPORTANT]
> Choosing the identical major version of dashboards as the OpenSearch domain you plan to link them with is vital across all supported methods - [Docker images repo link](https://hub.docker.com/r/opensearchproject/opensearch-dashboards/tags)

# Guide to setup self-managed dashboards in EC2 hosted docker container - No authentication

## Prerequisite
An AWS managed OpenSearch domain without any authentication method enabled and is accompanied by the following domain access policy.
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
> To establish a connection with the managed OpenSearch domain, it's necessary to uninstall the security plugin from OpenSearch Dashboards. Otherwise, the Dashboards' security plugin will anticipate a secured domain and will fail to make a connection

## Steps to remove the security plugin and spinup a self-managed dashboards
1. Remove all Security plugin configuration settings from opensearch_dashboards.yml or place the below example file in the same folder as the Dockerfile
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
5. In the below sample `docker-compose.yml`, change the dashboards' image name from `opensearchproject/opensearch-dashboards:2.5.0` to `opensearch-dashboards-no-security`.
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
6. The new `docker-compose-no-security.yml` file is now created which looks like the below. Now run the `docker-compose up` command to run the containers with new image. Now customer can access the self-managed OpenSearch Dashboards by hitting the EC2 endpoint with port `5601`. By doing so, you can conveniently view and interact with all the saved objects
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
# Guide to setup self-managed dashboards in ECS & in EC2 hosted docker container

## Prerequisite
An AWS managed OpenSearch domain must incorporate Fine-Grained Access Control (FGAC) with HTTP basic authentication, ensuring that a master user is created in the internal user database.
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
> One notable advantage of setting up a sel-managed OpenSearch Dashboards is that when it is deployed on `AWS ECS Fargate`, it generates a public IP. This allows the standalone dashboards to be accessed over the internet without the need for setting up a reverse proxy. As a result, the OpenSearch domains will be within the VPC and standalone dashboards will be available in public, enabling seamless connectivity and eliminating the complexity of configuring additional infrastructure components. This simplifies the setup process and provides convenient access to the dashboards from anywhere on the internet without compromising security or requiring additional network configurations.
