---
layout: post
title: "Using different Java runtimes with OpenSearch"
authors:
  - dblock
  - smortex
  - reta
date: 2022-02-08
categories:
  - technical-post
twittercard:
  description: "OpenSearch ships with a bundled Java Development Kit (JDK) that has recently been updated to version 17 (LTS). In this blog post we'll explain this change, and describe new features that make swapping the JDK easier."
excerpt: ""

---
At the time of the fork OpenSearch inherited bundling OpenJDK 15, and we have made 8 releases with AdoptOpenJDK 15.0.1+9 as the default runtime, replaced with Adoptium (Temurin) 17.0.2+8 in OpenSearch 1.3.0, which is a Long-Term Support (LTS) release. LTS releases focus on stability, therefore you can expect future versions of OpenSearch to always default to bundling an LTS JDK.

| Version                                                         | Bundled JDK (Linux)         |
|:---------------------------------------------------------------:|:---------------------------:|
| [1.0.0](https://opensearch.org/versions/opensearch-1-0-0.html)  | AdoptOpenJDK 15.0.1+9       |
| [1.0.1](https://opensearch.org/versions/opensearch-1-0-1.html)  | AdoptOpenJDK 15.0.1+9       |
| [1.1.0](https://opensearch.org/versions/opensearch-1-1-0.html)  | AdoptOpenJDK 15.0.1+9       |
| [1.2.0](https://opensearch.org/versions/opensearch-1-2-0.html)  | AdoptOpenJDK 15.0.1+9       |
| [1.2.1](https://opensearch.org/versions/opensearch-1-2-1.html)  | AdoptOpenJDK 15.0.1+9       |
| [1.2.2](https://opensearch.org/versions/opensearch-1-2-2.html)  | AdoptOpenJDK 15.0.1+9       |
| [1.2.3](https://opensearch.org/versions/opensearch-1-2-3.html)  | AdoptOpenJDK 15.0.1+9       |
| [1.2.4](https://opensearch.org/versions/opensearch-1-2-4.html)  | AdoptOpenJDK 15.0.1+9       |
| [1.3.0](https://opensearch.org/versions/opensearch-1-3-0.html)  | Adoptium (Temurin) 17.0.2+8 |

This, however, doesn't tell the whole story. The OpenSearch distribution is comprised of the engine and a dozen plugins. Both the engine and each plugin is built and tested with a range of JDKs (a subset of 8, 11, 14, 15, 17, etc.), across multiple operating systems (Linux, Windows, FreeBSD, MacOS, etc.). Finally, the complete distribution is rebuilt from source, and tested with the bundled JDK.

### Versions 1.0-1.2.0

The complete distribution 1.0 through 1.2.4 was built with JDK 14 and tested with the bundled JDK 15. Various individual components were built and tested individually with a different combination of JDKs, mostly 14. For example, the OpenSearch engine was built with JDK 14, but tested with JDK 8, 11, 14, but not 15. Different components individually used different versions for building and testing.  

### Version 1.3.0

In 1.3.0 we have replaced version 14 with an LTS version 11 for builds, and are testing the complete distribution with the bundled version 17. All components build and test individually with JDK 8, 11, 14 and 17.

The parent issue for this change is [opensearch-build#74](https://github.com/opensearch-project/opensearch-build/issues/74). The change in OpenSearch engine was [OpenSearch#940](https://github.com/opensearch-project/OpenSearch/pull/940), and was followed by plug-ins, e.g. [security#1580](https://github.com/opensearch-project/security/pull/1580).

#### Customizing the OpenSearch Runtime

By default, any OpenSearch distribution consults `JAVA_HOME` first in order to find out the JVM runtime to run on. If `JAVA_HOME` is not set, OpenSearch will try to fallback to the bundled JVM runtime if available. 

OpenSearch 1.3.0 also introduced support for a new environment variable `OPENSEARCH_JAVA_HOME` that take precedence over `JAVA_HOME`. This can be useful for systems with multiple applications co-located with different JVMs, or in migration scenarios with several instances of OpenSearch running on the same machine. The environment setting will propagate to plugins that launch Java processes, such as performance-analyzer. See [OpenSearch#1872](https://github.com/opensearch-project/OpenSearch/issues/1872) for details.

### Version 2.0.0

In OpenSearch 2.0 we will [upgrade Lucene to 9](https://github.com/opensearch-project/OpenSearch/pull/1109), which [requires JDK 11 or newer](https://cwiki.apache.org/confluence/display/LUCENE/Release+Notes+9.0). Furthermore, given that [Java 8 support ends in March 2022](https://endoflife.date/java), OpenSearch 2.0 will [drop support for JDK 8](https://github.com/opensearch-project/opensearch-plugins/issues/110).

In 2.0.0 the complete distribution will be built with JDK 11, and tested with the bundled JDK 17. All individual components will be built and tested individually with JDK 11, 14 and 17.

### No-JDK Distributions

TODO

### Benchmarking JDKs

TODO

### Platform Specifics

#### ArchLinux

TODO

#### FreeBSD

FreeBSD packages are available for OpenSearch from [textproc/opensearch](https://www.freshports.org/textproc/opensearch/). These packages do not bundle a version of Java, and depend on one of the Java versions installed on FreeBSD. 

Users building their own packages can customize the version of Java the package will depend on by setting the java version in the [`DEFAULT_VERSIONS` environment variable](https://wiki.freebsd.org/Ports/DEFAULT_VERSIONS) when building, e.g. `DEFAULT_VERSIONS=java=15`. See [opensearch-build#101](https://github.com/opensearch-project/opensearch-build/issues/101) and [Releasing for FreeBSD](https://github.com/opensearch-project/opensearch-build#releasing-for-freebsd) for more information.

#### Windows

TODO

#### MacOS

TODO

### Documentation

TODO