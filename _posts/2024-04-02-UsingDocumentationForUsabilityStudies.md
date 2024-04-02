---
# List of one or more author names that map to the value of short_name in site.community_members. See the content in the _community_members collection for reference.
authors: 
    - apasun
    - xeniatup

# Content categorization. One or more categories can be specified. 
category:
  - community-updates

# Publish date in the format of four digit year, two digit month, two digit day, hour, minute, second, and timezone offset; e.g., 2021-04-12 01:01:01 -0700
date: 2024-04-01 01:01:01 -0700

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
meta_description: "Learn how the OpenSearch Project is applying best practices to help designers conduct basic usability studies for their design flows using Figma templates and essential tools." 

# Value used for the meta keywords tag.
meta_keywords: "OpenSearch usability studies, OpenSearch UX research, OpenSearch documentation"

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

Is your product usable? Are your users able to navigate it seamlessly? Do they find your UX options intuitive? This is what a usability study is designed to evaluate. In this blog post, we offer some best practices for running a usability study, including some essential tools. We also provide [Figma templates](https://www.figma.com/community/file/1354537053014589491/opensearch-uxr-usability-study-kit) that can help you conceptualize a usability study.

### When do you need a usability study?

User testing can be extremely helpful in influencing design decisions because it validates assumptions in the software development process. While there are many tests that designers can utilize, a usability study enables designers to evaluative user behavior and flow. A usability study is best executed when a complete workflow has been designed and is available to the user. This could be a clickable prototype (pre-development) or an active endpoint. A usability study validates a workflow that you have created based on [persona knowledge and tasks to be performed](https://opensearch.org/blog/personas-framework/). Persona studies are usually conducted prior to design and UX development. See [this blog post](https://opensearch.org/blog/OpenSearch-Personas-Creating-Figma-Templates-to-Represent-Person-Framework/) for information about using Figma templates for your persona research. 

### Planning your study

To plan your study, you first need to choose participants, who should resemble the actual user profile or persona for which you have designed the experience. Then you need to draft questions either to validate the sample or for the study participant's use case. When framing questions for tasks, refrain from telling the study participant what to do. Instead, frame the question with the task end goal in mind. As an example, instead of telling the user to "Find **File** on the menu bar and click on **Open file**", frame the task question as "Navigate around to show us how you would open a file". 

The **Tasks** page, shown in the following image, is intended to capture the details of each task sequentially.
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.44.05_AM.png)*Example of "Tasks" based on OpenSearch usability study:*
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.44.20_AM.png)
In your instructions, make sure to remind the participant to talk out loud and tell you what they are thinking---this is critical to evaluating user behavior. After the study participant has attempted to accomplish the task, ask follow-up questions regarding the experience. These questions can address things like improvements to the UX or whether the participant thought they were successful. Given the amount of time required to perform a usability study, it is recommended that each study include 4--6 complex tasks or 8--10 simple tasks. Finally, ask any questions regarding the experience or the software as a whole. The following image shows a usability study plan template, including a recruitment email.
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.42.52_AM.png)

### What do you need to start a usability study?

Tools such as [UserZoom](https://www.usertesting.com/platform/userzoom) (now UserTesting) and [Lookback](https://www.lookback.com/) make it convenient to capture screens, record voices and facial expressions, and integrate surveys after tasks. They also offer a variety of testing methodologies to incorporate into the design testing phase of product development. That said, a usability study can be conducted manually using any video conferencing software (such as Zoom). If no specialized tooling is used, make sure to record all calls, ask the user to share their screen, and ask probing questions. If your study is automated so that it can be run with only the software prompts, it is called an *unmoderated* study. If, however, your presence is required in order to run the study, it is called a *moderated* study. Moderated studies are more time consuming at the data collection stage but can be an effective method for rapid prototyping if you plan to incrementally and iteratively improve on the design. 


### Sample considerations

When you run your study, sample considerations are important. Use your persona definitions to guide sample specifications for recruitment. For larger samples and basic usability concerns, consider obtaining a paid sample. Use your screener to qualify or disqualify participants for your study. If your experience is for a niche set of users, it will make sense to recruit them by leveraging your B2B sales and services partners.

On the **Questionnaire** page, shown in the following image, you can organize both the screening and task questions for your study.
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.44.52_AM.png)
### Reporting results

Once you have conducted your study and obtained usage data, you are ready to analyze that data and report the results. The most important data to report is whether or not the user successfully accomplished a given task. A color-coded table summarizing this information, shown in the following image, can be very helpful. 
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/image (3).png)
In addition to tables, a good written report will include details about repetitive usage patterns, anomalies in user flows, or interpretations of icons and other design patterns. Embedding the report with videos showing points of failure or the user struggling to accomplish a task can humanize user experience research for your audience. 

You can also use Figma to visually depict participant task completion and time on task, as shown in the following image.

![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.45.21_AM.png)![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.45.57_AM.png)

### Automation of a usability study

If you have predictable user flows for which you are improving the UX, it may make sense to automate the study. Consider using the same study setup and the same required tasks. Only your backend endpoint or the link to the clickable prototype would need to be changed. 


### Usability study toolkit

The preceding examples are offered to the open-source community as a [usability study toolkit](https://www.figma.com/community/file/1354537053014589491). The toolkit includes an essential set of components for planning and running a usability study, including a questionnaire template and a task board for tracking participant responses. Organizing your assets in Figma can simplify the process of presenting your study to stakeholders. The usability study toolkit is available on the [OpenSearch Project community Figma page](https://www.figma.com/@OpenSearch). 
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.40.43_AM.png)
The following image shows instructions on how to use the toolkit.
![](/assets/media/blog-images/2024-04-03-UsingDocumentationForUsabilityStudies/Screenshot 2024-03-26 at 10.41.39_AM.png)

Additionally, the following video walks you through the toolkit.

<iframe width="560" height="315" src="https://www.youtube.com/embed/06o1yActr7M?si=9MGH4uanu43J8I3D" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## References

Sundar, A. (2023, Aug 04). *Using community insights to create a persona framework to improve search experiences.* [https://opensearch.org/blog/personas-framework/](https://opensearch.org/blog/personas-framework/)

Sundar, A. and Canas, C. (2023, Sept 22). *OpenSearch search personas: Creating Figma templates to represent a persona framework.* [https://opensearch.org/blog/OpenSearch-Personas-Creating-Figma-Templates-to-Represent-Person-Framework/](https://opensearch.org/blog/OpenSearch-Personas-Creating-Figma-Templates-to-Represent-Person-Framework/) 
