---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: homepage
layout_class: sidebar-right
body_class: homepage
sectionid: homepage

# primary_title: OpenSearch

meta_description: OpenSearch is a community-driven, Apache 2.0-licensed open source search and analytics suite that makes it easy to ingest, search, visualize, and analyze data.

download_ctas:
  - os
  - os-d

ctas:
    post: ' on GitHub'
    primary: 
        text: 'Download OpenSearch'
        url: '/downloads.html'
    roadmap:
        text: 'View the project roadmap'
        url: https://github.com/orgs/opensearch-project/projects/1


greeting: "More about OpenSearch"

# Normal headline area (undo the commented out "- page.headline -" twice in homepage.html file)
headline: "OpenSearch makes it easy to ingest, search, visualize, and analyze your data."

# Hero banner area (commented out "- page.headline -" twice in homepage.html file)
# headline: <a href="https://opensearch.org/blog/opensearchcon-2022/"> <img src="/assets/media/blog-images/2022-05-09-opensearchcon/opensearchcon.jpg" alt="OpenSearchCon" class="img-fluid"/></a>


long_description: "
OpenSearch is a scalable, flexible, and extensible open-source software suite for search, analytics, and observability applications licensed under Apache 2.0. Powered by [Apache Lucene](https://lucene.apache.org/) and driven by the [OpenSearch Project community](https://opensearch.org/about.html), OpenSearch offers a vendor-agnostic toolset you can use to build secure, high-performance, cost-efficient applications. Use OpenSearch as an end-to-end solution or connect it with your preferred open-source tools or [partner projects](https://opensearch.org/partners).


**Build powerful search solutions**
<br>
Deploy e-commerce, application, and document search with community-built tools. Power artificial intelligence (AI) applications using OpenSearch’s [vector database functionality](https://opensearch.org/platform/search/vector-database.html). Support for [full text queries](https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/), natural language processing, custom dictionaries, and a [range of search features](https://opensearch.org/docs/latest/opensearch/ux/) provides a flexible foundation for structured and unstructured search applications. With built-in faceting, relevance ranking and scoring, and a selection of machine learning (ML) features, you can build search solutions that are finely tuned to your data.


**Analyze and discover at scale**
<br>
Capture, store, and analyze your business, operational, and security data from a variety of sources. Use your preferred data collector and enrich your analytics pipeline with integrated ML tools like [anomaly detection](https://opensearch.org/docs/latest/monitoring-plugins/ad/index/). Built-in search functionality supports fast, accurate query results and time-sensitive insights. Visualize and report discoveries with [OpenSearch Dashboards](https://opensearch.org/docs/latest/dashboards/index/) and use [JDBC](https://opensearch.org/docs/latest/search-plugins/sql/sql/jdbc/) to connect to popular business intelligence systems. 


**Achieve end-to-end observability**
<br>
Visualize your monitored environments from end to end and identify and resolve issues as they arise with flexible [observability tools](https://opensearch.org/docs/latest/observability-plugin/index/). Build visualizations from your metrics, traces, and logs, with the option to use [Data Prepper](https://opensearch.org/docs/latest/data-prepper/index/) to transform and enrich your source data. Support for open-source systems like OpenTelemetry and Prometheus means you can create powerful, customized observability solutions using state-of-the-art components. 


**Getting started**
<br>
OpenSearch includes a data store and search engine, a visualization and user interface, and a [library of plugins](https://opensearch.org/docs/latest/install-and-configure/install-opensearch/plugins/#available-plugins) you can use to tailor your tools to your requirements. Get started in the way that best suits your team and your environment. To configure your first OpenSearch cluster, you can [download the OpenSearch components](https://opensearch.org/downloads.html) in a variety of distributions or start with the official [Docker Image](https://hub.docker.com/r/opensearchproject/opensearch). 


**OpenSearch Project partners**
<br>
Visit the OpenSearch Project [partner page](https://opensearch.org/partners) for a network of organizations who offer hosted solutions, provide help with technical challenges, and build tools to extend the capabilities of OpenSearch. Interested in becoming a project partner? [Learn how](https://opensearch.org/new-partner.html).
"

callouts_head: "The OpenSearch project's principles for development"
callouts_class: list-features
callouts_id: principles
callouts_leader: 'When we (the contributors) are successful, OpenSearch will be:'

version_feature:
    latest_label: "Current Version:"
    date_label: " / "


callout_button:
    title: Download OpenSearch
    url: /downloads.html

opendistro:
    head:  Looking for Open Distro?
    img:
        url: /assets/img/logo-opendistro.svg
        alt: Open Distro Logo
    description: Open Distro for Elasticsearch is still available.
    link: 
        url: https://opendistro.github.io/for-elasticsearch/
        title: Find it here

secondary:
    heading: 'Stay in the loop'
    content: "Check out the [forums](https://discuss.opendistrocommunity.dev/) to stay informed."

sidebar:
    -
        title: Have a question?
        description: Do you have a question regarding OpenSearch? Maybe you aren’t the first to ask it. Checkout our frequently asked questions (FAQs) to see if your question has already been answered. If not, don’t hesitate to ask in the community forums.
        links:
            -
                title: Check out the FAQ
                url: /faq
            -
                title: Ask in the forum
                url: https://forum.opensearch.org/
    -
#       title: Founding documents
#        more: 
#            title: 'Read all the founding documents'
#            url: http://www.example.com/
#       links:
#           -
#               title: Introducing OpenSearch
#               url: https://aws.amazon.com/blogs/opensource/introducing-opensearch
#           -
#               title: 'Stepping up for a truly open source Elasticsearch'
#               url: https://aws.amazon.com/blogs/opensource/stepping-up-for-a-truly-open-source-elasticsearch/
#           -
#               title: 'Keeping Open Source Open'
#               url: https://aws.amazon.com/blogs/opensource/keeping-open-source-open-open-distro-for-elasticsearch/

notice : true

---
