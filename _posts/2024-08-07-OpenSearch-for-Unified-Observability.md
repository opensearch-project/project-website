---
layout: post
title:  "OpenSearch for Unified Observability"
authors:
  - jkowall
date: 2024-08-06
categories:
  - technical-posts
meta_keywords: observability, unified observability, tracing, metrics, jaeger, opentelemetry, grafana, prometheus, open source, foundation
meta_description: 
Explore how OpenSearch offers a unified observability solution for platform teams, addressing challenges of open-source tools by integrating with CNCF projects like Prometheus, Grafana, and Jaeger. Learn about the strategic advantages of OpenSearch in managing observability data, and get a preview of an in-depth demo at OpenSearchCon, showcasing its role in enhancing developer platforms.
excerpt: 
Explore how OpenSearch offers a unified observability solution for platform teams, addressing challenges of open-source tools by integrating with CNCF projects like Prometheus, Grafana, and Jaeger. Learn about the strategic advantages of OpenSearch in managing observability data, and get a preview of an in-depth demo at OpenSearchCon, showcasing its role in enhancing developer platforms.
---
# OpenSearch for Unified Observability 

Most organizations today are implementing shared services or platforms when it comes to common building blocks to make developers more productive. This offers many benefits to the development teams and enables better technology along with compliance and integrations without using the time of development teams. These are meant to help productivity and provide the right developer experience. 

Platform teams have many choices for Observability, which is one component of a platform team. Most platform teams select open source most often, at least as part of the service offering they are creating for internal teams. The challenge with open source Observability is that most solutions require several data stores and user experiences. This makes the developer experience difficult and can make it even harder on the platform team who has to manage the lifecycle of the services. This not only includes provisioning, but also data management including backups and scaling the cluster. Don't forget the lifecycle of the software stack including upgrades. Needless to say this is a challenge. 

## Implications of Open Source

Organizations today prefer open source, it’s the enabler of creativity and flexibility, and also something way more engineers know how to use when they join an organization. As the ecosystem evolves your tooling can evolve too, where you can have multiple offerings hopefully with different reasons to have each offering (cost, depth, complexity). Open source comes in many flavors, and understanding the ecosystem, health, and community are critical in picking the winning solutions. One such way to judge the viability of a project is to understand if the project is backed by a foundation and has a vibrant set of maintainers, committers, and community members to help you along with furthering the project. If the project lacks momentum, it can turn into a big cost when having to pick something new. The selection process along with the migration are painful. Getting stuck in a situation which is not ideal can often force this, including missing a bug fix, security patch, or even getting lack of response to an issue. 

Data collection is much easier today thanks to OpenTelemetry, but it’s difficult to migrate the alerting, dash boarding, and overall user experience between tools. Moreover, it’s difficult to retrain users to learn new things, often having to build a user migration path to help users along. Open source makes this harder since this all rests on your shoulders as the decision maker for the platform. The users will feel the pain as well when you have to migrate instead of doing your day job. 

OpenSearch provides a path forward which can be strategic, especially as the project moves towards being part of a foundation. This allows the project to have closer collaboration and alignment with an ecosystem of observability projects supported by the Cloud Native Computing Foundation (CNCF). 

## Analysis using multiple interfaces

OpenSearch is not only a database, but the powerful OpenSearch Dashboards allows the user to analyze observability data, namely logs and traces. In Jaeger (a project I am one of the maintainers of) we are working on some derived metrics on OpenSearch, but this is one weak spot for the database. I would not suggest doing high scale metrics on OpenSearch as it’s not suited for time-series data. However, OpenSearch integrates with popular metric systems such as Prometheus, which is a better path forward for widespread use of metrics. 

Although OpenSearch Dashboards is not as good as some other time series analysis tools such as Grafana, it doesn’t mean you can’t use both. Keep in mind that OpenSearch will never change licenses from its current Apache 2 license. This is not the case with other tools that are open source, but not part of software foundations such as the Apache Software Foundation, The Linux Foundation (LF) or the CNCF which is a sub-foundation of LF. 

If you are building an observability platform which is part of your broader developer platform, it’s essential to provide choice to your teams. Some will prefer certain UX to others, while advanced teams may even want to use command line or programmatic tools to analyze observability data. By leveraging an open source solution, you can build or use whatever you need in the future. 

## Learn more at OpenSearchCon

During the forthcoming OpenSearchCon, I will be presenting a demo and deeper dive of this vision. During that demo, I’ll show how to use OpenSearch to tie together tracing across multiple tools as described above. In this demo, you’ll see how to use OpenTelemetry to instrument a demo application, and how to analyze the traces with OpenSearch Dashboards, Jaeger, and Grafana utilizing OpenSearch as the data store. 

I’ll also be covering some additional use cases for tracing data in open source to move towards monitoring from just looking at traces. This is [what we call SPM in Jaeger](https://www.jaegertracing.io/docs/1.60/spm/) and how you can set up alerting on these metrics in OpenSearch Dashboards, Prometheus, or Grafana to be notified when things are headed the wrong direction.

If you are interested in attending OpenSearchCon in San Francisco on September 24th through the 26th, you can sign up at : [OpenSearchCon 2024: North America · OpenSearch](https://opensearch.org/events/opensearchcon/2024/north-america/index.html)