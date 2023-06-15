---
date: 2023-06-15T22:35:09.615Z
excerpt: Usability is vital in facilitating successful interactions between
  users and technology. In software, usability refers to the ability of a
  product to be understood, learned, and used by the user.
meta_description: " The OpenSearch Project partners with Key Lime Interactive
  for a usability study to establish a baseline for future UX improvements for
  our Admin users"
meta_keywords: OpenSearch usability, OpenSearch user experience, OpenSearch research
feature_image: /assets/media/blog-images/pexels-antoni-shkraba-4348404.jpg
authors:
  - apasun
layout: post
title: "OpenSearch Partners with Key lime Interactive for Usability Studies:
  Admin Panel Workflows"
categories:
  - community
---


Usability is vital in facilitating successful interactions between users and technology. In software, *[usability](https://www.computer.org/csdl/magazine/co/2023/02/10042076/1KEtnA3u67S)* refers to the ability of a product to be understood, learned, and used by the user.

A [common perception](https://firstmonday.org/ojs/index.php/fm/article/download/1018/939?inline=1) is usability and user experience (UX) issues are not considered in open source software (OSS). Several reasons contribute to this perception:

* Open source contributors are typically developers who are not end users.
* Usability experts typically do not get involved in OSS projects.
* Developers tend to focus on functionality over usability in OSS projects.
* Usability problems are harder to specify and distribute than functionality problems.
* Design for usability needs to take place in advance of coding.
* OSS projects lack resources to undertake high-quality usability work.

To manage this perception, the OpenSearch Project team has established a baseline for future improvements to UX. In this year’s [OpenSearch Project Q1 community survey](https://opensearch.org/blog/q1-survey-results/), 48.8% of community members self-identified as being in an administrative role (Admin) in OpenSearch3. The Admin, who is responsible for asset and user management in OpenSearch, has a critical role in determining the quality of experience and usability of users downstream, such as Producers and Consumers. Therefore, in the first baseline study, we examined our performance on usability with Admins. We partnered with [Key Lime Interactive (KLI)](https://keylimeinteractive.com/) to conduct a [usability study with 20 of our partners, community members, and users](https://forum.opensearch.org/t/looking-for-opensearch-usability-study-candidates/13045) (that is, participants)4. In the study, we presented 20 participants with seven tasks from the [Admin panel workflow](https://github.com/opensearch-project/index-management-dashboards-plugin/issues). The seven tasks cover the most common data management functionalities, such as managing and creating indexes and index lifecycles, in OpenSearch.

The following image shows the geographic locations of the initial study participants.

![geographic locations of study participants](/assets/media/blog-images/screenshot-2023-06-12-at-1.43.54-pm.png "study participant map")

Participants interacted with OpenSearch version 2.6. The tasks were rated as success, failure, or success with assistance. Participants demonstrated a relatively high level of success with the interface. Six of the seven tasks performed had a success rate of 65% or higher. Two of the seven tasks had a success rate of 100%. Of the 140 sub-task attempts, 107 were rated as success (approx. 76%), 25 were rated as failure (approx. 18%), and 8 were rated success with assistance (approx. 6%). Overall, Admin users in OpenSearch 2.6 found the interface highly usable for the tasks we evaluated.

The OpenSearch Project has other tasks, such such as cluster configuration and monitoring, storage and ingestion management. that Admins need to accomplish. These tasks currently do not have a user interface. KLI, however, used this study to obtain feedback. Participants indicated that complex tasks need to be simplified. Specifically, the OpenSearch Project should consider a two-state system while creating an index management policy by by streamlining the process to allow more functionality on one interface with clear indication of where to start the task and what to do next. These capabilities could provide autocomplete, tool tips, and dropdown assistance to ease the difficulties experienced while naming indexes and templates. Participants signaled that there is a need to find more unified solutions to prevent loss of data or downtime, focusing on migrating, security, and monitoring. Finally, when it came to notifications for Admins, participants provided feedback to consider implementing consistent notification behaviors and placement.

OpenSearch Admins have a pivotal role in asset and user management by influencing the experience of downstream users. In future studies, we intend to expand the study’s scope to include the Admin’s experience in infrastructure setup and other admin tasks, the Producer’s and Consumer’s experience, and use cases for specific flows based on nuanced search versus analytics. Based on the current study outcomes, to date, the Admin panel workflow in OpenSearch version 2.6 has a relatively high success rate when it comes to usability.

## References

1. Rajanen, M. "Open Source Usability and User Experience" in Computer, vol. 56, no. 02, pp. 106-110, 2023.\
   doi: [10.1109/MC.2022.3219634](https://ieeexplore.ieee.org/document/10042076).
2. Nichols, D. M. and Twidale, M. B. “The Usability of Open Source Software,” <https://firstmonday.org/ojs/index.php/fm/article/download/1018/939?inline=1>.
3. Sundar, A. “OpenSearch Project Q1 community survey results,” <https://opensearch.org/blog/q1-survey-results/>.
4. Sundar, A. “Looking for OpenSearch usability study candidates!”, <https://forum.opensearch.org/t/looking-for-opensearch-usability-study-candidates/13045>.