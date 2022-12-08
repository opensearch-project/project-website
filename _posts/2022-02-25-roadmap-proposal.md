---
layout: post
title: "Update: OpenSearch Proposed 2022 Release Schedule"
authors:
  - henkle
date: 2022-02-25
categories:
  - partners
twittercard:
  description: "As part of thinking about releases for this year, I’ve been trying to sketch out a schedule of major and minor release dates through 2023. I wanted to share with you what I have so far, and hear your thoughts."
excerpt: "As part of thinking about releases for this year, I’ve been trying to sketch out a schedule of major and minor release dates through 2023. I wanted to share with you what I have so far, and hear your thoughts."
redirect_from: "/blog/partners/2022/02/roadmap-proposal/"
---

As part of thinking about releases for this year, I’ve been trying to sketch out a schedule of major and minor release dates through 2023. I wanted to share with you what I have so far.

### Considerations

Before getting to the dates themselves, here are the things I was thinking about when I picked them.

1. **The OpenSearch Project uses SemVer.**
As a reminder, the OpenSearch project assigns version numbers to releases following [the semantic versioning convention](https://opensearch.org/blog/technical-post/2021/08/what-is-semver/).  This means the project won’t introduce an incompatible change without also incrementing the major version number.  

2.  **Everyone is excited about Lucene 9.0.0.**
Lucene 9.0.0 [released](https://lucene.apache.org/core/corenews.html#apache-lucenetm-900-available) on December 7, 2021. It includes several new features and performance improvements that the team would like to make available to users of OpenSearch, including K-NN support, Vectors, Big Endian, faster numeric indexing, faster sorting, concurrent merge scheduler, and prototype Java Jigsaw module support. Starting to use Lucene 9.0.0 as soon as possible is a priority. It will take a few releases to leverage the full value of it, but adding it now is so exciting and has loads of potential for OpenSearch.

3.  **The project will follow a "release train" model for minor-version releases, and a "tentpole" model for major-version releases.**
The team wants to produce minor-version releases on a "release-train" schedule: every six weeks a new release comes out, and it includes all the new features that are ready at the time of release.  Having a set release schedule makes sure OpenSearch is releasing in a predictable way and prevents a backlog of unreleased changes. In contrast, major-version releases will take place when there is a critical mass of new features that would create incompatibilities, since that’s the only opportunity to release them. These are called "tentpole" features because getting one of these in might hold a release. If any of the tentpole changes runs into serious problems, the contributors working on it will need to add a comment on their meta tracking issue with an alert. At that point, the contributors working on the issue and I can decide whether to cut scope, remove the feature from the release, or move the release date depending on the type and severity of the problem.



### Proposed schedule

Taking the above into consideration, here’s how I think the majors and minors would lay out on the calendar.  If you’re planning on submitting a code change, note the corresponding feature freeze dates (the date when no more changes can be added so the release can be tested).

|Version	|Feature Freeze	|Release Date	|
|-------------	|-------------	|-------------	|
|1.3.0	|March 9th	|March 15th	|
|1.3.2  |April 29 2022 | May 05 2022 |
|2.0.0 RC-1	|Core: March 21st|	|
| 	|Plugins and Clients: April 18th	| ~~April 26th~~ April 28th	|
|2.0.0 GA	|~~May 2nd~~ May 17th	|~~May 12th~~ May 24th 	|
|1.3.3 | June 3rd  | June 9th  |
|2.1.0	|~~June 23rd~~ June 30th	|~~June 30th~~ July 7th|
|1.3.4  | ~~July 1st~~ July 8th | ~~July 7th~~ July 14th |
|2.2.0	|August 4th	|August 11th	|
|1.3.5  | August 16th | August 23rd  |
|3.0.0 RC	|  OpenSearch Core/Dashboards : August 11th	|	|
| | Plugin and Clients: | September 14th|
|1.3.6  |September 2nd | September 8th |
|2.4.0	|September 22nd	|September 29th	|
|1.3.7  |September 30th |October 6th |
|1.3.8  |November 4th | November 10th |
|2.5.0	|December 1st	|December 8th	|
|3.0.0 GA	|January 10th, 2023	|January 19th 2023	|
{: .opensearch-supported-versions}

(Updated April 2022 to include patch releases to 1.x, Moved the 2.0-rc date by 2 days, moved 3.0-RC out 1 week)
(Updated May 2022 to move RC GA date out 12 days)
(Updated June 2022 to move 2.1 date out 5 days which bumps 1.3.4)

You’ll notice I’ve included a "Preview Release" for our major releases in 2022 to help folks get an early look. What the exact release process will look like and how feedback for the previews can be identified is yet-to-be determined, but as the first major releases I want to make sure everyone has a chance to try them out early.  I've only planned dates for one Release Candidate per major release, but if we need more we would add them.

Also, I’d like to increase how often OpenSearch is able to release minor version from 6 weeks to 4 by the end of the year and reduce the length of feature freeze required, but that will depend on our ability to add automation. For now I’ve planned with 6 week intervals, but when the team is ready I’ll reset the dates.

### Themes for the Major releases

#### 2.0.0

As mentioned above, the primary driver for the team to have an earlier 2.0.0 release is so that OpenSearch can get support for Lucene 9.0.0 in earlier. This change will likely enable some use of new Lucene features within the plugins, like KNN and Vector Field types. This release also allows for other breaking changes to be ready earlier, like inclusive naming.  

#### 3.0.0

Since Lucene 9 will be released with 2.0, the 3.0 release will contain the bulk of breaking changes planned for 2022. That list is not written in stone, but we already looking ahead to things like [segment replication](https://github.com/opensearch-project/OpenSearch/issues/1694), [inbuilt security](https://github.com/opensearch-project/OpenSearch/issues/1029) and [sandboxing](https://github.com/opensearch-project/OpenSearch/issues/1422).  I’m excited to work with you to make those improvements, and to see your thoughts on how to make things even better.

### One final note....

Like all schedules, it’s possible that it will need to change based on real world conditions *cough* log4j *cough*. As the year goes along, if better ways to do things are found, or someone has a brilliant idea for a feature, those changes will be made.  If nothing else, in January of 2023 everyone can look back at this schedule with a wry smile at the bold confidence of February 2022.

### Feedback?

Please make it known in [the forums](https://discuss.opendistrocommunity.dev/t/2022-release-schedule/8739)!  Specifically:

1. Does this list of considerations make sense?  What else should be taken into consideration?
2. Are there any errors in the way the dates are laid out?
3. What would a useful “public preview” look like to you?  What would you want to get out of it?

As the public roadmap is populated with features, I look forward to also hearing your feedback on what’s going in as well.
