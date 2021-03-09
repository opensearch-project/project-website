---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: homepage
layout_class: sidebar-right
body_class: homepage
sectionid: homepage

download_ctas:
  - os
  - os-d


greeting: "👋 Glad you found us."

headline: "OpenSearch makes it easy to find whatever you need in all of your data."

long_description: "OpenSearch is a community-driven, open source search and analytics suite derived from Elasticsearch & Kibana 7.10.2. It consists of a search engine daemon, *OpenSearch*, and a visualization and user interface, *OpenSearch Dashboards*. "

# Both OpenSearch and OpenSearch Dashboards are super pluggable -- you can provide your own or use the [OpenDistro Plugins](#) for extra functionality." 

callouts_head: "The OpenSearch project's principles for development:"
callouts_class: list-features
callouts:
    -
        title: Great software.
        description: "If it doesn't solve your problems, everything else is moot. It's going to be software you love to use."
    -
        title: Open source like we mean it. 
        description: "It’s all Apache 2.0. There’s no Contributor License Agreement. Easy."
    -
        title: Used everywhere.
        description: Our goal is for as many people as possible to use it in their business, their software, and their projects. Use it however you want. Surprise us!
    - 
        title: Made your way.
        description: Anyone building a feature is going to ask for input on direction, requirements, and implementation - and then listen to that input.
    - 
        title: Open to contributions.
        description:  Great open source software is built together, with a diverse community of contributors. If you want to get involved at any level - big, small, or huge - we'll find a way to make that happen. We don't know what that looks like yet, and we look forward to figuring it out together.
    -
        title: A level playing field.
        description: No one (including us at AWS) gets to tweak the software to make it run better on a single platform only, and doing so would go against principles 1 and 3. Together, we can keep each other accountable to make software that runs great everywhere.

callout_button:
    title: I want to know more about OpenSearch
    url: /blog

opendistro:
    head:  Looking for Open Distro?
    img:
        url: /assets/img/logo-opendistro.svg
        alt: Open Distro Logo
    description: New versions Open Distro for Elasticsearch are still being developed while OpenSearch is in pre-release 
    link: 
        url: http://opendistro.github.io/for-elasticsearch/
        title: Check it out

secondary:
    heading: 'Stay in the loop'
    content: "Follow us on Twitter [@opensearch](http://www.twitter.com/opensearch), like the project on [Facebook](http://example.com) and check out the [forums](https://discuss.opendistrocommunity.dev/) to stay informed."

sidebar:
    -
        title: Founding Documents
#        more: 
#            title: 'Read all the founding documents'
#            url: http://www.example.com/
        links:
            -
                title: Introducing OpenSearch
                url: http://opendistro.github.io/for-elasticsearch/
            -
                title: 'Stepping up for a truly open source Elasticsearch'
                url: https://aws.amazon.com/blogs/opensource/stepping-up-for-a-truly-open-source-elasticsearch/
            -
                title: 'Keeping Open Source Open'
                url: https://aws.amazon.com/blogs/opensource/keeping-open-source-open-open-distro-for-elasticsearch/

---