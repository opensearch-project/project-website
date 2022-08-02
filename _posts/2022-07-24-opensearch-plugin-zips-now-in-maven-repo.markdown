---
layout: post
title:  "OpenSearch plugin zips now in Maven repo"
authors: 
  - prudhvigodithi
date: 2022-07-24 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "Details on how to consume OpenSearch plugin zips from maven repo and the process involved in shipping them to the maven repo."
---

### Motivation and Current Challenges:

The plugins zips that are used as dependencies cannot be downloaded dynamically during runtime, as they are not part of version controlled maven system. Only the respective Java jars are available to download using maven coordinates. This forces a user to now to use a dependency plugin zip of some random version built on a developer desktop, which is not reliable, also the tests executed as part of this build zip cannot be accurate, so eventually for few plugins the local build zip is forced to check in to the plugin repo to facilitate the plugin availability for dependency, this is one of the challenge faced by the community. Coming to the download part of plugins as separate isolated components via a cached mechanism like maven is not possible, with this challenge users had to  pre-bake the random built zip to the project.

Starting with release `2.1.0` OpenSearch plugin zips are now signed and published to central maven repo, with `groupID` as [org.opensearch.plugin](https://repo1.maven.org/maven2/org/opensearch/plugin/). These zips can now be fetched as individual components by directly downloading using maven coordinates or by clickstream from central maven repo which can be later cached to the desired user local maven repo. The snapshot version of the zips can be fetched from nexus maven repo with the same `groupID` as [org.opensearch.plugin](https://aws.oss.sonatype.org/content/repositories/snapshots/org/opensearch/plugin/).

### Maven publish task with custom gradle plugin.

The publishing of zips to central maven repo had been possible with custom gradle plugin `opensearch.pluginzip`.
Starting with release `2.1.0` all OpenSearch gradle supported plugins will have custom gradle plugin `opensearch.pluginzip` applied to the gradle project, this will create a new task `publishPluginZipPublicationToZipStagingRepository` which does all the heavy lifting in identifying the distribution plugin zip, setting the maven coordinates, generating the POM file, updating the user passed POM fields and publishing it to maven repo. More details and inner workings of the plugin can found at [opensearch-plugins](https://github.com/opensearch-project/opensearch-plugins/blob/main/BUILDING.md#opensearchpluginzip).


**Figure 1**: Workflow that ship generated plugin zips to maven

![Figure 1: Workflow that ship zips to maven]({{ site.baseurl }}/assets/media/blog-images/2022-07-24-opensearch-plugin-zips-now-in-maven-repo/figure1.png){: .img-fluid }

### Benefits of plugin zips in maven:

* The plugin dependencies can now be fetched using the right maven coordinates from maven repo and a user need not use a zip of some random version built on a developer desktop.
* The development dependent `SNAPSHOT` version zips can be directly fetched from maven using the dependency mechanism.
* Not required to check in the zips manually to any `src/` folders, as zips can now be fetched using the right `grounID`, `artifactID` and `version`.
* The published zips to central maven repo are signed with `.asc`, `.md5`, `.sha1`, `.sha256`, `.sha512` extensions.
* The tests and CI workflows can directly run against the zips fetched from maven repo, instead of requiring a manual download and checking into the project.

### Consume plugin zips from maven:

**Using mvn cli:**

Consume from Central Maven repo:
```
mvn dependency:get -DgroupId=org.opensearch.plugin -DartifactId=opensearch-job-scheduler -Dversion=2.1.0.0 -Dpackaging=zip -DremoteRepositories=https://repo1.maven.org/maven2
```
Consume from Snapshot Maven repo:
```
Snapshot Maven repo
mvn dependency:get -DgroupId=org.opensearch.plugin -DartifactId=opensearch-job-scheduler -Dversion=2.1.0.0-SNAPSHOT -Dpackaging=zip -DremoteRepositories=https://aws.oss.sonatype.org/content/repositories/snapshots/
```

**Gradle Project: using build.gradle file**

```
dependencies {
    classpath "org.opensearch.plugin:opensearch-job-scheduler:2.1.0.0@zip"
    classpath "org.opensearch.plugin:opensearch-knn:2.1.0.0@zip"
}
```

**Maven Project: using pom.xml file**

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

### Summary:
Using the maven [Release zips Maven Repo](https://repo1.maven.org/maven2/org/opensearch/plugin/) and [Snapshot zips Maven Repo](https://aws.oss.sonatype.org/content/repositories/snapshots/org/opensearch/plugin/) URL’s, the plugin zips can be consumed and used as dependency to build other plugins and can also be fetched as standalone components to install them to the OpenSearch cluster.
