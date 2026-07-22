---
layout: post
title:  "What’s new: Custom GeoJSON"
authors:
- satnandi
- shivamdhar
- vijay
- alicejw
date: 2022-09-27
categories:
 - technical-post
redirect_from: "/blog/technical-post/2022/09/whatsnew-custom-geo-json/"
---

In [OpenSearch 2.2](https://opensearch.org/blog/releases/2022/08/opensearch-2-2-is-now-available/), we released custom GeoJSON support for region map visualizations in OpenSearch Dashboards. Custom GeoJSON enables customers to map their own GeoJSON file. Custom GeoJSON builds on the GeoShape features included in earlier releases. In this blog post, we will provide the following:

* A quick overview of the GeoJSON format standard defined in [RFC7946](https://www.rfc-editor.org/rfc/rfc7946).
* An overview of how to create a custom GeoJSON region map.

Until the [OpenSearch 2.2 release](https://opensearch.org/blog/releases/2022/08/opensearch-2-2-is-now-available/), region maps in OpenSearch Dashboards had support for a limited set of vector maps for visualization. Starting with this release, you can create [custom GeoJSON region maps](https://github.com/opensearch-project/geospatial/issues/122) and upload your own custom region map for visualization in OpenSearch Dashboards. This enables you to comply with local government regulations in accordance with their geographic map boundary claims. Usually, the maps for disputed boundaries are not available outside the region.

## **A quick overview of the GeoJSON standard**

The GeoJSON format encodes data structures in various geometric shapes, such as a polygon for multiple coordinates or a single point that consists of longitude and latitude coordinates. Shapes such as line strings or polygons represent map areas of multiple coordinates. The following example shows a single-point coordinate map location in the Barents Sea.

```
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [74, 40.71]
  },
  "properties": {
    "name": "Barents sea location"
  }
}
```

With OpenSearch, you can use the standard geographic shapes defined in the GeoJSON standard: `point`, `linestring`, `polygon`, `multipoint`, `multilinestring`, and `multipolygon`. You can specify the geographic shape that you want to use with the corresponding geospatial field types that OpenSearch provides for that shape. To learn more about the geospatial shape field types that OpenSearch supports, see [Geoshape field type](https://opensearch.org/docs/latest/opensearch/supported-field-types/geo-shape/) in the OpenSearch documentation.

To learn more about the GeoJSON format, see [geojson.org](https://geojson.org/). The GeoJSON website also provides information about the GeoJSON format specification [RFC 7946](https://www.rfc-editor.org/rfc/rfc7946).

### Why would I need a custom vector map with GeoJSON?

You might want to define a specific locale’s coordinates in a polygon shape that are not provided by one of the standard GeoJSON files. For example, you can create your own custom vector map with a GeoJSON file, such as a US county or ZIP Code.

## How to create custom vector maps with GeoJSON

The process for creating a custom GeoJSON file for a region map visualization includes four tasks, described below. For in-depth details on each task, see [Region map visualizations](https://opensearch.org/docs/latest/dashboards/geojson-regionmaps/) in the OpenSearch documentation.

**Prerequisite:** You need to install two plugins to use custom GeoJSON files: the OpenSearch Dashboards [dashboards-maps](https://github.com/opensearch-project/dashboards-maps) frontend plugin and the OpenSearch [geospatial](https://github.com/opensearch-project/geospatial) backend plugin.

The following four steps represent individual task procedures for creating a custom vector map with GeoJSON:

1. Prepare a GeoJSON file that contains geospatial data for your new region, such as coordinates, and iso designations (for example, “iso2”: “US”). To see an example GeoJSON file, see [Example GeoJSON](https://opensearch.org/docs/latest/dashboards/geojson-regionmaps/#example-geojson-file) in the OpenSearch documentation.
2. Upload a JSON file with the geospatial data for the region you want to map in OpenSearch Dashboards.
3. Set the Dashboards visualization layer settings option to **Custom vector map**.
4. View your custom region map in OpenSearch Dashboards. For example, the following image shows an example polygon coordinate shape in a region map for Los Angeles county.

![Image: An example polygon coordinate shape in a region map for Los Angeles county]({{ site.baseurl }}/assets/media/blog-images/2022-09-27-whatsnew-custom-geo-json/la-county-region-map.jpg){:.img-fluid }

## Summary

With [OpenSearch 2.2](https://opensearch.org/blog/releases/2022/08/opensearch-2-2-is-now-available/), users can create their own maps using GeoJSON format and upload them to OpenSearch Dashboards.
If you have suggestions for the team and community, we’d love to hear them! Please feel free to submit a blog proposal using the [blog post:Issue](https://github.com/opensearch-project/project-website/issues/new?assignees=&labels=new+blog%2C+enhancement&template=blog_post.md&title=) template on GitHub.


To learn more about using custom region map visualizations with GeoJSON in OpenSearch Dashboards, see [Region map visualizations](https://opensearch.org/docs/latest/dashboards/geojson-regionmaps/) in the OpenSearch documentation. If you encounter an issue with this feature, please let us know by creating a GitHub [issue](https://github.com/opensearch-project/OpenSearch/issues).
