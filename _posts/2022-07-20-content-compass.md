---
layout: post
title:  "Which Way is the Compass Pointing?"
authors:
- nateboot

date: 2022-07-22
categories:
 - intro
redirect_from: "/blog/intro/2022/07/content-compass/"
meta_keywords: "data ingestion, ingestion, open source, opensearch, community, observability"
meta_description: "Using OpenSearch to ingest community tag data helps us target learning material towards where knowledge gaps actually exist."
---

I’m still tagging, and much like in my [last post](https://opensearch.org/blog/intro/2022/05/tag-youre-it/), I’ve been tagging forum threads in hopes of gaining insight into where to target content creation. What is most clear is the data showing that we definitely need more configuration, troubleshooting, and documentation material for OpenSearch and OpenSearch Dashboards in general (don’t forget to [file an issue](https://github.com/opensearch-project/documentation-website/issues/new/choose) for whatever you think is missing!)

A few lines of code and some persistence is all it took for this to become clear. I’m personally enjoying using OpenSearch Dashboards to visualize forum data in a number of ways. I thought I’d take you along on part of my journey and share what I think might be meaningful for everyone. 

## Ingestion

I’m applying a business intelligence use case to OpenSearch. Rather than a constant stream of data coming from the various nodes of the infrastructure, I’m taking batches of data provided to me at regular intervals and processing them with a local instance of OpenSearch. 

This could be called an “ad hoc” use of OpenSearch. Some may have called this use case silly, but I really don’t believe that to be true. OpenSearch makes a great analysis tool, even if its powerful search capabilities aren’t used. This is mostly because of the simplicity of being able to spin up an OpenSearch cluster with OpenSearch Dashboards using Docker. 

The first challenge was indexing the data. I wrote a [standalone Ruby app](https://github.com/nateynateynate/csv2opensearch) to take a CSV file that has headers on the first line, convert each line into a JSON object, and then index each object using the bulk API (thanks to the maintainers and contributors of the **[openseach-ruby](https://github.com/opensearch-project/opensearch-ruby)** gem!). I did not consider the task to be difficult, despite my limited programming ability. 

Soon I had an index filled with objects that represented all the data I needed for my monthly counts. Something wasn’t quite right though. A previous article I had written came to mind, and I was reminded of an important lesson about index mappings. 

## **Index mappings are important!**

I went into stack management to create an index pattern, and I noticed that it didn’t detect my date and time field as such. I won’t be able to visualize any aggregations with date or time filters, which I found to be unacceptable. Here’s the mapping I ended up with: 


```
{
  'mappings': {
    'properties': {
      'created_at': { "type": "date",
                      "format": "yyyy-MM-dd HH:mm:ss zzz" },
      'tag': { "type": "keyword" },
      'category_id': { "type": "keyword" },
      'title': { "type": "keyword" }
    }
  }
}
```


In case you need to know how to create your own time format, the format field follows the conventions of the “[DateTimeFormatter](https://docs.oracle.com/javase/8/docs/api/java/time/format/DateTimeFormatter.html)” class. Check out the section under “Patterns for Formatting and Parsing.”

This time I was able to create an index pattern, and I had some data to look at. 

## **Poof! You’re a compass!**

We’re all the compass. The tags and participation in the forum provide this data, which is, quite literally, the community’s own activity. Now that the data was loaded with the right mapping, the visualizations were easy. Let’s check a few out! 

My favorite is the **heat map**. As a means of providing a compass, this is quite helpful. Each of the categories in the forum is on an axis, and each of the tags is on another. Absorbing this was easy. From start to finish, it took 10 minutes. 

![Image: Community Compass Heatmap]({{ site.baseurl }}/assets/media/blog-images/2022-07-20-community-compass/content-compass-heatmap.png){: .img-fluid }


I thought it would be neat to create a starting dashboard by combining the heat map with a data table readout of the actual topics in the forum. So, I made this **data table** **** with just a few mouse clicks.


![Image: Community Compass Data Table]({{ site.baseurl }}/assets/media/blog-images/2022-07-20-community-compass/content-compass-data-table.png){: .img-fluid }

Combining the heat map and data table into a dashboard made something that was more useful than I expected. From this dashboard, I have a plain and easy way to filter topics by category and tag. This will be very useful for helping to target specific topics. No queries. Just drilling. 

![Image: Community Compass Dashboard]({{ site.baseurl }}/assets/media/blog-images/2022-07-20-community-compass/content-compass-dashboard.png){: .img-fluid }

## What’s next?

From here on out, I plan to take steps to deepen the dimensions of our data and will be implementing this compass as a feedback and guidance mechanism for content. It might be time to revisit the forum categories to see if a rearrangement there would deepen our view here.

In the meantime, please do continue to join our [community meetings](https://www.meetup.com/opensearch/) as well as get involved in the [forums.](https://forum.opensearch.org/)





