---
layout: post
title:  "OpenSearch plugin zips now in Maven repo"
authors: 
  - prudhvigodithi
date: 2022-08-23 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "Details on how to consume OpenSearch plugin zips from a Maven repo and the process involved in shipping them to a Maven repo."
redirect_from: "/blog/technical-post/2022/08/opensearch-plugin-zips-now-in-maven-repo/"
---

Starting with the release of OpenSearch `2.1.0`, OpenSearch plugin zips are now signed and published to a central Apache Maven [repo](https://repo1.maven.org/maven2/org/opensearch/plugin/).  Using the [Release zips](https://repo1.maven.org/maven2/org/opensearch/plugin/) and [Snapshot zips](https://aws.oss.sonatype.org/content/repositories/snapshots/org/opensearch/plugin/) Maven Repo URLs, OpenSearch plugin zips can now be consumed  as a dependency to build other plugins or fetched as standalone components for your OpenSearch cluster. 

## Motivation 

Before OpenSearch 2.1, plugin zips used as dependencies could not be downloaded dynamically during runtime because plugin zips were not a part of the version-controlled Maven system. The only mechanism for plugin downloads was each plugin's respective Java jars through Maven coordinates. This system forced users who wanted more control over their OpenSearch plugin configuration to use a dependency plugin zip built on a developer desktop instead of a more reliable version-controlled plugin. 

Furthermore, to facilitate the plugin availability as a dependency, tests executed against the OpenSearch build process from zip were not accurate, as each local build zip had to find the plugin repo in order to ensure that plugin's availability. These restrictions were challenging to our community because using plugin zips as separate isolated components via a cached mechanism proved to be impossible. 

## Benefits of Maven

With Maven, plugin zips can now be retrieved by:

- Downloading each plugin directly using their respective Maven coordinates.
- Using clickstream from the central Maven repo, which can be cached later to a local Maven repo.
- Fetching the development `SNAPSHOT` version with the same Maven `groupID` as [org.opensearch.plugin](https://aws.oss.sonatype.org/content/repositories/snapshots/org/opensearch/plugin/).

Using OpenSearch plugin zips through Maven offers the following benefits:

- Plugins zip in the central Maven repo are already signed with `.asc`, `.md5`, `.sha1`, `.sha256`, and `.sha512` extensions.
- Users are no longer required to to check in zips to any `src/` files because zips can be fetched with the right `groupID`, `artifactID`, and `version`.
- Tests and continuous integration (CI) workflows can directly run against zips from the Maven repo instead of requiring a manual download. 

## Maven zip publication with Gradle

OpenSearch publishes plugin zips using a custom Gradle plugin, `opensearch.pluginzip`. With OpenSearch 2.1, all OpenSearch Gradle-supported plugins create a new task, `publishPluginZipPublicationToZipStagingRepository`. The task performs all the heavy lifting for users by:

- Identifying the distribution plugin zip.
- Setting the Maven coordinates.
- Generating the POM file.
- Updating with the user-generated POM fields.
- Publishing the zip to your Maven repo.

You can find more details about the inner workings of OpenSearch plugins in the [opensearch-plugins repo](https://github.com/opensearch-project/opensearch-plugins/blob/main/BUILDING.md#opensearchpluginzip).

**Figure 1**: Workflow that ships generated plugin zips to Maven

![Figure 1: Workflow that ship zips to maven]({{ site.baseurl }}/assets/media/blog-images/2022-07-24-opensearch-plugin-zips-now-in-maven-repo/figure1.png){: .img-fluid }**Figure 1**: Workflow that ships generated plugin zips to Maven

## Consume plugin in zips

You can fetch plugin zips in three different ways.

**Using the Maven CLI**

Consume from the Central Maven repo:

```
mvn org.apache.maven.plugins:maven-dependency-plugin:2.1:get -DrepoUrl=https://repo1.maven.org/maven2 -Dartifact=org.opensearch.plugin:opensearch-job-scheduler:2.1.0.0:zip
```

Consume from the Snapshot Maven repo:

```
mvn org.apache.maven.plugins:maven-dependency-plugin:2.1:get -DrepoUrl=https://aws.oss.sonatype.org/content/repositories/snapshots -Dartifact=org.opensearch.plugin:opensearch-job-scheduler:2.1.0.0-SNAPSHOT:zip
```

**Gradle Project: Using the build.gradle file**

```
dependencies {
    classpath "org.opensearch.plugin:opensearch-job-scheduler:2.1.0.0@zip"
    classpath "org.opensearch.plugin:opensearch-knn:2.1.0.0@zip"
}
```

**Maven Project: Using the pom.xml file**

```
<dependencies>
        <dependency>
            <groupId>org.opensearch.plugin</groupId>
            <artifactId>opensearch-job-scheduler</artifactId>
            <version>2.1.0.0</version>
            <packaging>zip</packaging>
        </dependency>
</dependencies>
```
