---
# List of one or more author names that map to the value of short_name in site.community_members. See the content in the _community_members collection for reference.
authors: 
    - apasun
    - xeniatup

# Content categorization. One or more categories can be specified. 
category:
  - community-updates

# Publish date in the format of four digit year, two digit month, two digit day, hour, minute, second, and timezone offset; e.g., 2021-04-12 01:01:01 -0700
date: 2024-04-03 01:01:01 -0700

# An excerpt of the blog post. It is used in the blog post list view, and in the home page what's new list of N most recent blog posts. It is also used as a fallback value for the twittercard:description field if not explictly defined in the front matter.
excerpt: Is your product usable? Are your users able to navigate it seamlessly? Do they find your UX options intuitive? This is what a usability study is designed to evaluate. In this blog post, we offer some best practices for running a usability study, including some essential tools. 

# Used as a fallback for the Twitter Card image, otherwise not currently used. Is only present in content up to June 3, 2021.
#feature_image: /assets/path/to/image/asset.ext

# Setting to true will result in the inclusion of the MathJax JavaScript library for rendering math equations. For reference see: _includes/include-mathjax.html.
#has_math: true

# Setting to true will result in the inclusion of CSS styles specific to using borders for the table, for table header cells, and table data cells. scientific data tables. For reference see: _includes/science-table-styles.html.
#has_science_table: true

# The layout template to use for rendering the content.
# Options are default, fullwidth, homepage, and post.
layout: post

# Value used for the meta description tag. Also used as a final fallback value for the Twitter Card description field after the excerpt property.
#meta_description: "Learn how the OpenSearch approximate k-NN search solution enables you to build a scalable, reliable, and distributed framework for similarity searches" 

# Value used for the meta keywords tag.
#meta_keywords: "approximate k-NN search, k-nearest neighbor plugin, k-NN plugin, ANN similarity search solution"

# Set to true to indicate content that was imported from the Open Distro For Elasticsearch blog.
#odfeimport: true

# URL for use by the jekyll-redirect-from plugin.
# When importing your posts and pages from, say, Tumblr, it's annoying and impractical to create new pages in the proper subdirectories so they, e.g. /post/123456789/my-slug-that-is-often-incompl, redirect to the new post URL.
# For reference see: https://github.com/jekyll/jekyll-redirect-from
#redirect_from: /blog/odfe-updates/2019/09/Check-out-earlier-blogposts-on-Open-Distro-for-Elasticsearch/

# The title of the post.
title: "Using documentation for usability studies"

# Meta data for the twitter card. The twitter card is used when a link to the blog post is shared on twitter. The twitter card is also used by other social media sites when a link to the blog post is shared on those sites. The twitter card is also used by search engines when a link to the blog post is shared on those sites.

---

Is your product usable? Are your users able to navigate seamlessly? Do they find options on the UX intuitive? This is what a usability study is designed to evaluate. A usability study is a technique used to determine if users are able to use what you have elaborately conceptualized. In this blog, we offer some best practices on how to run a usability study, including tools that are essential to help you run a study. We also offer [Figma templates](https://www.figma.com/community/file/1354537053014589491/opensearch-uxr-usability-study-kit)to the open source community to help think through a usability study.

### When do you need a usability study?

User testing is extremely useful in influencing design decisions as it validates assumptions in the software development process. While there are many tests that designers can utilize, a usability study enables designers to evaluative user behavior and flow. The usability study is best executed when a complete workflow has been designed for and is available to the user. This could be a clickable prototype (pre-development) or an active endpoint that users can access. Compared to other testing methodologies, a usability study is useful to validate a work flow that you have created based on[persona knowledge and jobs to be done research](https://opensearch.org/blog/personas-framework/). Persona studies are usually conducted prior to design and UX development. [See this blog to help you plan and use Figma templates for your persona research](https://opensearch.org/blog/OpenSearch-Personas-Creating-Figma-Templates-to-Represent-Person-Framework/). 

### Planning your study

Once you determine you are ready to conduct a usability study, it helps to plan the study. You need to determine the sample characteristics that will take the study. Essentially this needs to be similar to the actual user profile or the persona that you have designed the experience for. Then you need to plan out questions you will ask them either to validate the sample or for the study participant’s use case. Then determine the number of tasks and what the participants need to perform for each task. When framing questions for tasks refrain from tell the study participant what to do. Instead, frame the question with the task end-goal in mind. As an example, instead of telling the user to “find File on the menu bar and click on Open File,” frame the task question as “navigate around to show us how you would open a file”. 

*“Tasks” page is intended to capture details of each task to create a sequential scenario:*
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.44.05 AM.png)*Example of “Tasks” based on OpenSearch usability study:*
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.44.20 AM.png)
In your instructions make sure to remind the participant to talk out loud and tell you what they are thinking. This is very effective in reviewing usage behavior as it is very difficult to discern what a user is thinking if they do not talk out loud. After the study participant has attempted to accomplish the task, add follow up questions on the experience that they just went through. These questions can range from whether the participant thought they were successful, to suggestions for improvements in the task that they just accomplished. Given the time it takes to do a usability study, it is recommended that each study entails 4-6 complex tasks or 8-10 simple tasks. More tasks will make the study too long to complete. Once you are satisfied with the task that you will want your study participant to complete, think through any final questions that you will want to ask the participant regarding the entire experience or the software as a whole. See this template and example of a usability study plan including a recruitment email.
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.42.52 AM.png)

### What do you need to start a usability study?

There are some convenient tooling such as UserZoom (now UserTesting) or Lookback and others. These tools make it convenient to capture user screens, record their voice and facial expressions and integrate surveys after tasks. They also offer a variety of testing methodologies to incorporate in the design testing phase of product development. That said, a usability study can be conducted manually over any video conferencing software (such as Zoom). If no specialized tooling is used, make sure to record all calls, ask the user to screen share and to ask probing questions as relevant. If you automate your study to be run with just the prompts the software provides and you do not need to be present, it is called an unmoderated study. If on the other hand, you spend the time to walk through the experience and help with the questions and probing, it is called a moderated study. Moderated studies are more time consuming at the data collection stage, but can be an effective method for rapid prototyping if the team plans to incrementally and iteratively improve on the design. 


### Sample considerations

When you run your study, sample considerations are important. Use you persona definitions to guide sample specifications for recruitment. For larger samples and basic usability concerns, consider obtaining a paid sample. Use your screener to qualify or disqualify participants for your study. If your experience is for a niche set of users, it will make sense to recruit them by leveraging your B2B sales and services partners. For open source projects consider blogging, dropping links on GitHub, your community forum, announcing on community meetings etc. Always validate your sample with the screening questions either to 

*On the “Questionnaire” page you can organize the questions for screening the participants, and also all other questions that accompany the tasks in your study:*
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.44.52 AM.png)
### Reporting results

Once you have taken time to conduct the studies and obtain usage data, it is time to analyze and report results. The most important aspect to report is task pass or fails. A color coded table summarizing this is very informative. See an example below. In the table, the participant qualification as expert or proficient, other tooling proficiency and the result is called out to give the reader a context on the overall findings. 
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/image (3).png)
In addition to tables, a good written report will include a write up of details on repetitive usage patterns, anomalies in user flows (i.e. the participant clicking around in areas that may not correct), or interpretations of icons and other design patterns. Embedding the report with user videos on points of failure or the user struggling to accomplish the task humanizes user experience research to your audience. 

You can also Figma to visually depict the effectiveness and time on task across participants or fragments of the usability study report as needed:

![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.45.21 AM.png)![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.45.57 AM.png)

### Automation of a usability study

If you have predictable user flows that you are improving the UX on etc., it may make sense to automate the study. Consider using the same usability study set up, and the same required tasks. The only thing that you would update is your end point on the back end or the link the clickable prototype. 


### Usability Study Toolkit

The illustrations above are offered to the open source community as a [usability study toolkit](https://www.figma.com/community/file/1354537053014589491). The toolkit includes essential set of components to plan and run the study including a questionnaire template and a task board to track the responses from participants. Organizing the assets in Figma will simplify the process of presenting your study to the stakeholders and reporting. The Usability study toolkit is available on [OpenSearch page on Figma community](https://www.figma.com/@OpenSearch), and it is available to all Figma users to share and adapt in their work for any purpose. 
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.40.43 AM.png)
*How to use the Figma file (Instructions):*
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.41.39 AM.png)

This video walks you through the [usability study toolkit](https://www.figma.com/community/file/1354537053014589491) that we have created for open source consumption.
[Embed https://youtu.be/06o1yActr7M]

## References

Sundar, A. (2023, Aug 04). *Using community insights to create a persona framework to improve search experiences.* [https://opensearch.org/blog/personas-framework/](https://opensearch.org/blog/personas-framework/)

Sundar, A. and Canas, C. (2023, Sept 22). *OpenSearch search personas: Creating Figma templates to represent a persona framework.* [https://opensearch.org/blog/OpenSearch-Personas-Creating-Figma-Templates-to-Represent-Person-Framework/](https://opensearch.org/blog/OpenSearch-Personas-Creating-Figma-Templates-to-Represent-Person-Framework/) 
