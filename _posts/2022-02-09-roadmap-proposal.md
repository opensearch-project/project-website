---
layout: post
title: "Update: OpenSearch Proposed 2022 Release Schedule"
authors:
  - henkle
date: 2022-02-09
categories:
  - partners
twittercard:
  description: "As part of thinking about releases for this year, I’ve been trying to sketch out a schedule of major and minor release dates through 2023. I wanted to share with you what I have so far, and hear your thoughts."
excerpt: "As part of thinking about releases for this year, I’ve been trying to sketch out a schedule of major and minor release dates through 2023. I wanted to share with you what I have so far, and hear your thoughts."

---

Hello!

As part of thinking about releases for this year, I’ve been trying to sketch out a schedule of major and minor release dates through 2023. I wanted to share with you what I have so far, and hear your thoughts.  

### Considerations

Before we get to the dates themselves, here are the things I was thinking about when I picked them. 

**1) The OpenSearch Project uses semver.** 
As a reminder, the OpenSearch project assigns version numbers to releases following [the semantic versioning convention](https://opensearch.org/blog/technical-post/2021/08/what-is-semver/).  This means we won’t introduce an incompatible change without also incrementing the major version number.  

**2) We’re excited about Lucene 9.0.0****.**
Lucene 9.0.0 [released](https://lucene.apache.org/core/corenews.html#apache-lucenetm-900-available) on December 7, 2021. It includes several new features and performance improvements we would like to make available to users of OpenSearch, including K-NN support, Vectors, Big Endian, Faster numeric indexing, faster sorting, concurrent merge scheduler, and prototype java jigsaw module support. It will take a few releases for OpenSearch to take full advantage of it, but we’re so excited by the potential that we wanted to get Lucene 9.0.0 support in as soon as possible rather than try and bundle it with other changes.

**3) We will follow a “release train” model for minor-version releases, and a “tent pole” model for major-version releases.**
We want to produce minor-version releases on a “release-train schedule“: every six weeks a new release comes out, and it includes all the new features that are ready at the time of release.  Having a set release schedule makes sure we’re releasing in a predicable way and prevents us from having a backlog of unreleased changes. In contrast, major-version releases will take place when there is a critical mass of new features that would create incompatibilities, since that’s the only opportunity to release them.  Because we might choose to hold a release up to get one of these changes in, we call those ”tentpole“ features. If any of the tentpole changes runs into serious problems, we would need to decide whether to move the release or wait until the next major release for that change. 

### Proposed schedule:

Taking the above into consideration, here’s how I think the majors and minors would lay out on the calendar.  If you’re planning on submitting code change, note the corresponding feature freeze dates (when we stop adding changes so we can test) as well. 

|Version	|Feature Freeze	|Release Date	|
|-------------	|-------------	|-------------	|
|1.3.0	|March 9th	|March 15th	|
|2.0.0 Preview Release	|March 21st	|March 31st	|
|1.4.0	|April 20th	|April 26th	|
|2.0.0 GA	|May 2nd	|May 12th	|
|2.1.0	|June 23rd	|June 30th	|
|2.2.0	|August 4th	|August 11th	|
|3.0.0 Preview Release	|September 5th	|September 14th	|
|2.4.0	|September 22nd	|September 29th	|
|2.5.0	|December 1st	|December 8th	|
|3.0.0 GA	|January 10th, 2023	|January 19th 2023	|

You’ll notice I’ve included a “Preview Release” for our major releases in 2022 to help folks get an early look. We’ll need to define exactly how that release process looks like and how we can identify feedback for the previews, but as our first major releases I want to make sure everyone has a chance to try them out early.

Also, I’d like to increase how often we’re able to release minor version from 6 weeks to 4 by the end of the year and reduce the length of feature freeze required, but that will depend on our ability to add automation.   For now I’ve planned with 6 week intervals, but when we’re ready I’ll reset the dates.

### Themes for the Major releases

### 2.0.0

As mentioned above, the primary driver for us to have an earlier 2.0.0 release is so that we can get support for Lucene 9.0.0 in earlier. It seems likely with this change we’d be able to start using some of the new Lucene features within the plugins, like KNN and Vector Field types.  We could also use this release for other breaking changes that could be ready earlier, like inclusive naming.  

### 3.0.0

In a different post today, I wrote about the 2022 themes for the core of OpenSearch:  Security, Efficiency, Durability, Extensibility and Engagement.  This is the release where we translate those ideals into changes you can use: Things like [segment replication](https://github.com/opensearch-project/OpenSearch/issues/1694), [inbuilt security](https://github.com/opensearch-project/OpenSearch/issues/1029) and [sandboxing](https://github.com/opensearch-project/OpenSearch/issues/1422).  I’m excited to work with you to make those improvements, and to see your thoughts on how we can make things even better. 

### Next Steps

We’ll leave this up for comments until February 17th, and then we’ll update the roadmap to reflect the new dates/releases.  if we think this is the right cadence of minor releases and the right number of major releases, we can start adding items to the roadmap.  [do we have a write up on how someone external can add something to the roadmap?]  

### One final note....

Like all schedules, it’s possible that it will need to change based on real world conditions *cough* log4j *cough*. As we go along, if we find a better way to do things, or someone has a brilliant idea for a feature, we’ll make changes.  If nothing else, in January of 2023 we can look back at this schedule with a wry smile at the bold confidence of our February 2022 selves.

### Feedback?

Please let me know!  Specifically: 
1) Does this list of considerations make sense?  What else should we take into consideration?
2) Are there any errors in the way the dates are laid out?
3) What would a useful “public preview” look like to you?  What would you want to get out of it?

As we populate the public roadmap with the features, I look forward to also hearing your feedback on what’s going in as well. 

Thanks,