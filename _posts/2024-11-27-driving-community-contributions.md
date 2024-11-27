---
layout: post
title: "Give back and go forward: Driving community contributions from vendor led to vendor neutral"
authors:
   - anandhi
   - jamesmcintyre
date: 2024-11-27
categories: 
    - community
meta_keywords: OpenSearch Project, AWS open source, Linux Foundation, community contributions, OpenSearch Software Foundation
meta_description: Explore the OpenSearch journey from an AWS-led project to a vendor-neutral, community-driven open-source platform under the Linux Foundation. Learn about the project's growth, challenges, and future in search, analytics, and vector databases.
---

When Amazon Web Services (AWS) launched the OpenSearch Project, it sought to inspire a community of contributors to help drive innovation for a strategically important open-source project. Working toward that goal called for new domain knowledge and a fresh look at company culture to help build trust across internal teams and, more importantly, with external contributors and organizations. 

In [this keynote address](https://www.youtube.com/watch?v=9gwTMW901ew&t=4142s), I shared the journey OpenSearch has embarked on with the invaluable support of our community, highlighting our efforts to empower and collaboratively shape the project's future.

<img src="/assets/media/blog-images/2024-11-27-driving-community-contributions/LF_Member_Summit_Keynote_journey.png" alt="OpenSearch Project Linux Foundation infographic" class="center"/>{:style="width: 100%; max-width: 800px; height: auto; text-align: center"}

For those unfamiliar with OpenSearch, it is a community-driven, open-source platform for search, analytics, and vector databases. It includes integrated tools for observability, security, visualization, and AI-powered applications, all available under the Apache 2.0 license. OpenSearch is now a project under the Linux Foundation. At the Open Source Summit Europe in Vienna two months ago, we launched the [OpenSearch Software Foundation](https://foundation.opensearch.org/) to establish open governance for the project. Since then, we've formed a governing board and a technical steering committee, which I have the honor of leading, to guide the project's technical direction.

OpenSearch originated as a fork of Elasticsearch in early 2021 after Elastic changed its licensing to a more restrictive source-available model. Users still desired an open-source alternative, prompting AWS to release a fork. This phase of our journey was both exciting and challenging. The fork involved substantial effort: 650 pull requests, around 56,000 files, and over 4.5 million lines of code to modify. By July, we delivered a feature-complete, stable version 1.0. At that time, OpenSearch was one of the few fully open-source search and analytics engines available. Our primary focus was to launch a stable, interoperable 1.x line that met our community's needs.

With a stable product in place, 2022 was dedicated to listening and learning---a lot of learning. As we invited and encouraged a community of users and contributors, both the OpenSearch team and our sponsors at AWS spent the year understanding how to enable a community independently. This might seem surprising, but AWS had not previously led an open-source project of OpenSearch's scope and trajectory. We had to learn the best ways to build trust with internal AWS teams and, more importantly, with external contributors and organizations. To support this, we engaged through various communication channels---forums, blog posts, and numerous requests for comments.

In 2023, I joined AWS to lead engineering for open-source OpenSearch. I quickly realized that while OpenSearch had achieved significant success, we were still working to rebuild the trust lost when Elastic changed its license. I also saw the immense potential of our dedicated community to drive innovation and accelerate growth.

Early in 2023, the rise of generative AI placed OpenSearch at the forefront, thanks to our early innovations in k-NN algorithms as a vector database. It became crucial to invest in and enhance core search performance and vector database use cases, including hybrid search. This led to a cultural transformation within AWS, OpenSearch, and our relationship with our community, focusing on deeper innovations in the search domain. Initially, there were challenges, but the AWS team and the broader community embraced the change. Together, we pushed for more open governance and trust building. We established a leadership committee comprising diverse stakeholders to promote open and transparent governance. And we saw results!

By the end of 2023, OpenSearch had made significant strides in:

* **Search and generative AI innovation**: We made notable advancements in search performance, hybrid search, and vector database functionality.
* **Community growth**: Contributions from outside of AWS surged, and we added maintainers from over 25 organizations. Our user forum traffic grew to 500,000 views monthly, and [opensearch.org](http://opensearch.org/) reached over 1 million monthly visitors.
* **Broad participation**: A slew of new contributors joined the effort, while long-time contributors deepened their commitments. Companies like Aryn, SAP, and Bytedance made significant contributions, while Intel drove substantial performance improvements with new codecs based on Zstandard compression.

This momentum carried into 2024 as our technical roadmap grew ambitiously. Companies like Uber and Slack/Salesforce began innovating in OpenSearch. This year marked a critical mass for the OpenSearch community. We completed the journey to becoming a truly open-source OpenSearch when we committed to transition the project to the Linux Foundation. This move reinforces our dedication to maintaining OpenSearch as an open-source and neutral project for the long term, and the response from the community has been overwhelming.

Today the OpenSearch Software Foundation has 14 member organizations, including premier members AWS, SAP, and Uber and general members Aiven, Aryn, Atlassian, Canonical, DataStax, Digital Ocean, DTEX, Eliatra, Graylog, Instaclustr by NetApp, and Portal26. Since the launch of the OpenSearch Software Foundation in September, we've confirmed a governing board with leaders from AWS, Aryn, SAP, and Uber. Our Technical Steering Committee is already driving key technology decisions with committee members from SAP, Bytedance, Oracle, Logz.io, Aiven, Aryn, Uber, and Slack/Salesforce.

With a more engaged community than ever before, we're well positioned to build on the foundation we've forged together and continue to innovate. While the OpenSearch Software Foundation represents a culmination of four years of community-focused collaboration and growth, in many ways it feels like we're at the beginning of a new and really exciting journey. As always, we will continue to look to the community for your valuable input as we move forward together on this journey.
