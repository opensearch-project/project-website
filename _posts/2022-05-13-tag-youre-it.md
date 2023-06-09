---
layout: post
title:  "Building My Own Content Compass"
authors:
- nateboot

date: 2022-05-13
categories:
 - intro
redirect_from: "/blog/intro/2022/05/tag-youre-it/"
---

## Tag, You’re It! 

I feel a personal and vested interest in ensuring that the forums here at OpenSearch are an information-rich environment. They’re a great tool for directly interacting with users and also for seeing first hand what people need help with. To best leverage them as a tool, I need to generate some actionable data from the forum threads that can be a compass for content generation, and I’d also love for everyone to see what I’m up to.

Tags have been appearing on forum posts retroactively almost as far back as the beginning of the year. I feel no shame here in admitting that it was a boring, lifeless toil for me, all this tagging by hand (let me know if you think I’ve tagged your post incorrectly.) I’ve done my best to guess the intent of any new posts, but I don’t think I can get it right every time. So here’s what we can all do: **tag your posts in the forum**. Help us target the right areas of learning content. My part will be faithfully adding tags to threads that don’t have any. 

## How can I tell if I’m doing it right?


I know that the community will be best served when these questions can be answered: 


* Are gaps in documentation being identified and filled in? 
* Are the learning materials in the right format? 
* Are the learning materials of sufficient technical depth? 
* Are the learning materials being released at the right pace?


I foresee an issue right away. In order to answer these questions, I need data! The data will have the purpose of guiding what kinds of content will be produced to best help everyone. Who doesn’t love documentation and learning materials? So I’m pretty sure I need some data (technically, I think we **all** need some data!)

## So what’s the plan?


I only want to start with some basic correlations, and the question I want to answer is basic enough: "What forum topic tags appear the most in each category of the forum?" I tallied up the number of topics tagged in February: 148 tags. Not bad. Then I counted again per category. The top 3 categories were "[OpenSearch & OpenSearch Dashboards](https://forum.opensearch.org/c/forking-elasticsearch-kibana/50)", "[Security](https://forum.opensearch.org/c/security/3)", and "[Open Source Elasticsearch and Kibana](https://forum.opensearch.org/c/general-elasticsearch/10)" (38, 38, and 20 threads with a tag, respectively). 

This is a fine measure of activity and tells me where we might want to spend some time creating content. The content produced may not be specifically targeted though, and I had a specific question to answer. So, what are people specifically having trouble with? I tallied again by category but also by tag this time. The result painted an entirely different picture. 

`Security / configure` was number 1 (17 topics in the "security" category with the tag "configure"). This lined up with anecdotes from the forum. I found the correlation satisfying—all I did was count some things! Now I not only have an idea of where to target some content, but I’m also becoming aware of specific trouble points and where high areas of activity are. Even better, I can answer the first of my four questions with a bit of evidence. 

## Iterate and Increment


I have just taken you through one full iteration of "the plan." Tags and the categories to which they belong are aggregated in order to prioritize documentation and learning materials. The great thing about this is having some data to support why certain documentation issues are being filed. Obviously, this is mostly an exercise in counting. Which is fine, as long as each iteration leads to actions that have impact. It might even be through this process that I learn what has the most impact, and I’ll be able to answer more of the initial four questions as well as answer with more data. 

I’ll be taking these counts monthly, but I think I can do more. A few lines of code, and I could dashboard what our current trends are, and then I wouldn’t have to count anything by hand! It may not be a typical use case for OpenSearch, but that doesn’t mean we can’t use it to accomplish our goal. I’ll share the results of that journey in a future update. Stay tuned.   

## Care to help?

I can’t stress enough that anyone can help guide efforts toward improving learning content. If you see specific areas that you think are lacking documentation or you want some learning content of any kind, please remember that we are a truly open-source project. Please file an issue under the [documentation-website](https://github.com/opensearch-project/documentation-website) repo describing the documentation you’d like to see. We welcome feedback from anyone on any issue with our documentation. 
