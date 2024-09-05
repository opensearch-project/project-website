---
layout: post
title:  "Announcing Data Prepper 2.7.0"
authors:
- dvenable
- qichen
date: 2024-03-27 13:30:00 -0600
categories:
  - releases
meta_keywords: GeoIP enrichment, AWS Secrets Manager Support, XML parsing, ION parsing, decompression
meta_description: Data Prepper 2.7.0 supports enriching events with GeoIP data, has support for using AWS Secrets Manager, and adds many new processors.
---

Data Prepper 2.7.0 is now available for [download](https://opensearch.org/downloads.html#data-prepper).
This release supports extracting geographic locations from IP addresses, supports injectable secrets, and adds many new processors.


## GeoIP processor

Data Prepper can now enrich events with geographical location data from an IP address using the new `geoip` processor.
The `geoip` processor uses the MaxMind GeoLite2 databases to provide geographical location data from IP addresses.

Many OpenSearch and Data Prepper users want to enrich their data by adding geographical locations to events.
There are a number of reasons this data can be valuable.
Some examples include customer analytics, looking for anomalies in network access, understanding load across geographies, and more.
An industry solution for determining a geographical location is through the use of IP addresses.

One example scenario is locating users of a web server.
Data Prepper already supports parsing Apache Common Log Format for Apache HTTP servers in the `grok` processor.
The following example shows how you can now locate the client making requests using the `clientip` property extracted from the `grok` processor:

```
processor:
  - grok:
      match:
        log: [ "%{COMMONAPACHELOG_DATATYPED}" ]

  - geoip:
      entries:
        - source: clientip
          target: clientlocation
          include_fields: [latitude, longitude, location, postal_code, country_name, city_name]
```

When ingesting data using this pipeline, the OpenSearch index will now contain the geolocation fields expressed above, such as the `latitude` and `city_name`.
Additionally, you can configure template mappings in OpenSearch so that you can display these events in OpenSearch Dashboards using the [Maps feature](https://opensearch.org/docs/latest/dashboards/visualize/maps/).


## AWS Secrets Manager support

Data Prepper now supports [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) as an extension plugin applicable to pipeline plugins (source, buffer, processor, sink).
Users are allowed to configure the AWS Secrets Manager extension through `extensions` in `data-prepper-config.yaml`.

The following example shows how you can configure your secrets:

```
extensions:
  aws:
    secrets:
      host-secret-config:
        secret_id: <YOUR_SECRET_ID_1>
        region: <YOUR_REGION_1>
        sts_role_arn: <YOUR_STS_ROLE_ARN_1>
        refresh_interval: <YOUR_REFRESH_INTERVAL_1>
      credential-secret-config:
        secret_id: <YOUR_SECRET_ID_2>
        region: <YOUR_REGION_2>
        sts_role_arn: <YOUR_STS_ROLE_ARN_2>
        refresh_interval: <YOUR_REFRESH_INTERVAL_2>
```

Users can also configure secrets in the `pipeline_configurations` section of a pipeline YAML file.

The `credential-secret-config` term in the example above is a user-supplied secret configuration ID.
Pipeline authors can reference secrets within pipeline plugin settings using the pattern `$aws_secrets:<<my-defined-secret>>``.
The following example shows how to configure an OpenSearch sink with secret values:

```
{% raw %}
source:
  - opensearch:
      hosts: [ "${{aws_secrets:host-secret-config}}" ]
      username: "${{aws_secrets:credential-secret-config:username}}"
      password: "${{aws_secrets:credential-secret-config:password}}"
{% endraw %}
```

In this example, secrets under `credential-secret-config` are assumed to be stored as the following JSON key-value pairs:

```
{
  "username": <YOUR_USERNAME>
  "password": <YOUR_PASSWORD>
}
```

The secret under `host-secret-config` is assumed to be stored as plaintext.
To support [secret rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html) for OpenSearch, the `opensearch` source automatically refreshes its basic credentials, (username/password) according to the `refresh_interval` by polling the latest secret values.

For more information, please see the [`aws` extension](https://opensearch.org/docs/latest/data-prepper/managing-data-prepper/configuring-data-prepper/#aws-extension-plugins) documentation.

Note that this feature is currently experimental, and we are working to add support for refreshing and dynamically updating certain fields.
In particular, the `opensearch` sink and the `kafka` plugins do not automatically refresh secrets.


## Other features

* Data Prepper can now parse XML data in fields using the `parse_xml` processor.
* The new `parse_ion` processor can parse fields in the [Amazon Ion format](https://amazon-ion.github.io/ion-docs/).
* Some users have fields that are gzip-compressed at the field level. These users can decompress those fields using the `decompress` processor.
* Data Prepper can now join strings from multiple strings, including with a delimiter.
* The new `select_entries` processor allows users to select only the necessary fields from events. This can simplify how users filter unnecessary data.
* Users who wish to reduce the size of fields in OpenSearch can use the `truncate` processor, which truncates strings to a configurable maximum length.
* The `file` source now supports codecs. This can help you test a pipeline locally before using the `s3` source.

## Getting started

* To download Data Prepper, see the [OpenSearch downloads](https://opensearch.org/downloads.html) page.
* For instructions on how to get started with Data Prepper, see [Getting started with Data Prepper](https://opensearch.org/docs/latest/data-prepper/getting-started/).
* To learn more about the work in progress for Data Prepper 2.8 and other releases, see the [Data Prepper roadmap](https://github.com/orgs/opensearch-project/projects/221).

## Thanks to our contributors!

The following people contributed to this release. Thank you!

* [asifsmohammed](https://github.com/asifsmohammed) - Asif Sohail Mohammed
* [asuresh8](https://github.com/asuresh8) - Adi Suresh
* [chenqi0805](https://github.com/chenqi0805) - Qi Chen
* [derek-ho](https://github.com/derek-ho) - Derek Ho
* [dinujoh](https://github.com/dinujoh) - Dinu John
* [dlvenable](https://github.com/dlvenable) - David Venable
* [emmachase](https://github.com/emmachase) - Emma
* [graytaylor0](https://github.com/graytaylor0) - Taylor Gray
* [GumpacG](https://github.com/GumpacG) - Guian Gumpac
* [kkondaka](https://github.com/kkondaka) - Krishna Kondaka
* [mallikagogoi7](https://github.com/mallikagogoi7) - None
* [oeyh](https://github.com/oeyh) - Hai Yan
* [rajeshLovesToCode](https://github.com/rajeshLovesToCode) - None
* [shaavanga](https://github.com/shaavanga) - Prathyusha Vangala
* [srikanthjg](https://github.com/srikanthjg) - Srikanth Govindarajan
* [travisbenedict](https://github.com/travisbenedict) - Travis Benedict
* [Utkarsh-Aga](https://github.com/Utkarsh-Aga) - None
* [venkataraopasyavula](https://github.com/venkataraopasyavula) - venkataraopasyavula
* [wanghd89](https://github.com/wanghd89) - None

