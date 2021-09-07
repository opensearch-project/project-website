---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: homepage
layout_class: sidebar-right
body_class: homepage
sectionid: homepage

meta_description: OpenSearch is a community-driven, open source search and analytics suite derived from Apache 2.0 licensed Elasticsearch 7.10.2 & Kibana 7.10.2. It consists of a search engine daemon, OpenSearch, and a visualization and user interface, OpenSearch Dashboards. OpenSearch enables people to easily ingest, secure, search, aggregate, view, and analyze data.

download_ctas:
  - os
  - os-d

ctas:
    post: ' on GitHub'
    primary: 
        text: 'Get Started'
        url: '/downloads.html'
    roadmap:
        text: 'View the project roadmap'
        url: https://github.com/orgs/opensearch-project/projects/1


greeting: "More about OpenSearch"

headline: "OpenSearch makes it easy to ingest, search, visualize, and analyze your data."

long_description: "OpenSearch is a community-driven, open source search and analytics suite derived from Apache 2.0 licensed Elasticsearch 7.10.2 & Kibana 7.10.2. It consists of a search engine daemon, OpenSearch, and a visualization and user interface, OpenSearch Dashboards. OpenSearch enables people to easily ingest, secure, search, aggregate, view, and analyze data. These capabilities are popular for use cases such as application search, log analytics, and more. With OpenSearch people benefit from having an open source product they can use, modify, extend, monetize, and resell how they want. At the same time, OpenSearch will continue to provide a secure, high-quality search and analytics suite with a rich roadmap of new and innovative functionality."


callouts_head: "The OpenSearch project's principles for development"
callouts_class: list-features
callouts_id: principles
callouts_leader: 'When we (the contributors) are successful, OpenSearch will be:'

version_feature:
    latest_label: "Current Version:"
    date_label: " / "


callout_button:
    title: Get Started
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
        description: Do you have a question regarding OpenSearch? Maybe you aren’t the first to ask it. Checkout our frequently asked questions (FAQ) to see if your question is already answered. If not, don’t hesitate to ask in the community forums.
        links:
            -
                title: Check out the FAQ
                url: /faq
            -
                title: Ask in the forums
                url: https://discuss.opendistrocommunity.dev/
    -
        title: Founding documents
#        more: 
#            title: 'Read all the founding documents'
#            url: http://www.example.com/
        links:
            -
                title: Introducing OpenSearch
                url: https://aws.amazon.com/blogs/opensource/introducing-opensearch
            -
                title: 'Stepping up for a truly open source Elasticsearch'
                url: https://aws.amazon.com/blogs/opensource/stepping-up-for-a-truly-open-source-elasticsearch/
            -
                title: 'Keeping Open Source Open'
                url: https://aws.amazon.com/blogs/opensource/keeping-open-source-open-open-distro-for-elasticsearch/

---