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

# Guide to setup self-managed dashboards in EC2 hosted container - No authentication

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

## Steps to remove the security plugin and spinup a self managed dashboards
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
7. The new `docker-compose-no-security.yml` file is now created and looks like the below. Now run the `docker-compose up` command to run the containers with new image. Now customer can access the self-managed OpenSearch Dashboards by hitting the EC2 endpoint with port `5601`. By doing so, you can conveniently view and interact with all the saved objects
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


