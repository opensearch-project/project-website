---
layout: post
title:  "New IP2Geo processor with automatic update in OpenSearch"
authors:
- heemin
- junqiu
- vamshin
- satnandi
date: 2023-10-04 00:00:00 -0700
categories:
- technical-posts
meta_keywords: OpenSearch ip2geo processor, ip to geo conversion, getting geo data from ip address
meta_description: Learn how the OpenSearch IP2Geo processor helps users to transform IP address to geolocation data during a document ingestion.
excerpt: When you host a service across geographic regions, it often helps to understand load patterns from various geographies. In many cases it helps to analyze anomalies and attacks. Starting with the 2.10 release, the OpenSearch IP2Geo processor allows you to filter the sources to the city level. Additionally, the IP2Geo processor periodically updates the IP-to-Geo mapping data in the background, ensuring that the IP address can be mapped to the latest location data.
---

When you host a service across geographic regions, it often helps to understand load patterns from various geographies. In many cases it helps to analyze anomalies and attacks. Starting with the 2.10 release, the OpenSearch IP2Geo processor allows you to filter the sources to the city level. Additionally, the IP2Geo processor periodically updates the IP-to-Geo mapping data in the background, ensuring that the IP address can be mapped to the latest location data.

## IP2Geo processor overview

<img src="/assets/media/blog-images/2023-10-04-new-ip2geo-processor-with-automatic-update/ip2geo-overview.jpg" alt="IP2Geo processor diagram"/>{: .img-fluid }

As part of configuring and enabling an IP2Geo processor, we need to set up another resource called a data source. A data source represents IP-to-Geo mapping data. It contains an endpoint from which to download IP-to-Geo mapping data and specifies how frequently the database should be updated. The downloaded data is stored in a system index. Once a data source is created, you can create an IP2Geo processor using the data source. Behind the scenes, the IP2Geo processor maps the IP address to the geolocation and appends it to the original document. Due to this internal search to obtain geolocation data for a given IP address, it is important that all ingest nodes become data nodes so that IP-to-Geo mapping data can exist on all ingest nodes and searches can be run locally to reduce ingest latency.
## How to add the country name to incoming requests
Before starting, make sure your OpenSearch cluster has the job-scheduler and geospatial plugins installed.

Now let’s look at how to create a data source and an IP2Geo processor. OpenSearch provides three public endpoints:

* https://geoip.maps.opensearch.org/v1/geolite2-country/manifest.json
* https://geoip.maps.opensearch.org/v1/geolite2-city/manifest.json
* https://geoip.maps.opensearch.org/v1/geolite2-asn/manifest.json

The original data is provided by MaxMind. MaxMind updates the data twice weekly, at most. Each endpoint provides a different type of database. You can find what type of data you can get from each database at https://dev.maxmind.com/geoip/docs/databases. Here you are going to use the country endpoint to create a data source so that you can get the country name to which the IP address belongs:

```http request
PUT /_plugins/geospatial/ip2geo/datasource/county-datasource
{
  "endpoint": "https://geoip.maps.opensearch.org/v1/geolite2-country/manifest.json",
  "update_interval_in_days": 3
}
```
After creation, it takes some time for the data source to be ready because IP-to-Geo mapping data needs to be downloaded from the external endpoint and stored in a system index. You can query the current state of the data source by using the get datasource API operations:
```http request
GET /_plugins/geospatial/ip2geo/datasource/country-datasource
```
```http request
{
    "datasources": [
        {
            "name": "country-datasource",
            "state": "CREATING",
            "endpoint": "https://geoip.maps.opensearch.org/v1/geolite2-country/manifest.json",
            "update_interval_in_days": 3,
            "next_update_at_in_epoch_millis": 1694276644994,
            "database": {
            },
            "update_stats": {
            }
        }
    ]
}
```
Once the data source has been created, the state changes to `AVAILABLE` and it provides all the available fields that you can append to your document:
```http request
{
    "datasources": [
        {
            "name": "country-datasource",
            "state": "AVAILABLE",
            "endpoint": "https://geoip.maps.opensearch.org/v1/geolite2-country/manifest.json",
            "update_interval_in_days": 3,
            "next_update_at_in_epoch_millis": 1694276644994,
            "database": {
                "provider": "maxmind",
                "sha256_hash": "maqhCkz/+pRH6D14Ux6uVDYaul7k1TDnKm3ppulgToY=",
                "updated_at_in_epoch_millis": 1693944024000,
                "valid_for_in_days": 30,
                "fields": [
                    "continent_name",
                    "country_name",
                    "country_iso_code"
                ]
            },
            "update_stats": {
                "last_succeeded_at_in_epoch_millis": 1694017472128,
                "last_processing_time_in_millis": 27060
            }
        }
    ]
}
```
Next, create an IP2Geo processor:
```http request
PUT /_ingest/pipeline/my-processor
{
    "description":"convert ip to country",
    "processors":[
        {
            "ip2geo":{
                "datasource": "country-datasource",
                "field":"ip",
                "properties":["country_name"]
            }
        }
    ]
}
```
After the processor is created, you can determine whether the processor works as expected:
```http request
GET /_ingest/pipeline/my-processor/_simulate
{
    "docs":[
        {
            "_source":{
                "ip":"2001:2000::"
            }
        }
    ]
}
```
You can see that the IP address “2001:2000::” currently belongs to Sweden:
```http request
{
    "docs": [
        {
            "doc": {
                "_index": "_index",
                "_id": "_id",
                "_source": {
                    "ip2geo": {
                        "country_name": "Sweden"
                    },
                    "ip": "2001:2000::"
                },
                "_ingest": {
                    "timestamp": "2023-09-06T16:28:49.59204Z"
                }
            }
        }
    ]
}
```
Now you can use the processor to add the country name to your document during ingestion in the same way that you use other processors:
```http request
PUT /my-index/_doc/1?pipeline=my-processor
{
    "ip":"2001:2000::"
}
```
## Summary
In OpenSearch 2.10, users can create an IP2Geo processor and convert an IP address to a geolocation. This is just one example of how the IP2Geo processor can be used. With added geolocation data and OpenSearch's multilayer map infrastructure, users can present their insights through easily understandable visualizations. The geospatial information can also serve as additional data for anomaly detection algorithms. If you have your own success story about using the IP2Geo processor, we’d love to hear it! Feel free to submit a blog proposal using the blog post:Issue template on GitHub.

To learn more about the IP2Geo processor, check out the IP2Geo processor documentation and the corresponding [RFC](https://github.com/opensearch-project/OpenSearch/issues/5856). If you find any issues or have questions, you can create an issue on [GitHub](https://github.com/opensearch-project/geospatial/issues/new/choose) or ask a question on the community [forum](https://forum.opensearch.org).


