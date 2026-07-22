---
layout: post
title: "Using Different Java Runtimes with OpenSearch"
authors:
  - dblock
  - smortex
  - reta
  - ryanbogan
date: 2022-03-28
categories:
  - technical-post
twittercard:
  description: "OpenSearch ships with a bundled Java Development Kit (JDK) that has recently been updated to version 11 (LTS). In this blog post we'll explain this change, and describe new features that make swapping the Java runtime easier."
excerpt: "OpenSearch ships with a bundled Java Development Kit (JDK) that has recently been updated to version 11 (LTS)."
redirect_from: "/blog/technical-post/2022/03/opensearch-java-runtime/"

---
At the time of the fork OpenSearch inherited bundling OpenJDK 15, and eight releases have used AdoptOpenJDK 15.0.1+9 as the default runtime, replaced with Adoptium (Temurin) 11.0.14.1+1 in OpenSearch 1.3.0. This change was primarily driven by the fact that JDK 11 is a Long-Term Support (LTS) release, and JDK 15 is not. LTS releases of JDKs focus on stability, therefore you can expect future versions of OpenSearch to always default to bundling a LTS JDK.

| Version                                                                                                                       | Bundled JDK (Linux)            | Tested JDKs     |
|:-----------------------------------------------------------------------------------------------------------------------------:|:------------------------------:|:---------------:|
| [1.0.0](https://opensearch.org/versions/opensearch-1-0-0.html)-[1.2.4](https://opensearch.org/versions/opensearch-1-2-4.html) | AdoptOpenJDK 15.0.1+9          | 11, 14, 15      |
| [1.3.0](https://opensearch.org/versions/opensearch-1-3-0.html)                                                                | Adoptium (Temurin) 11.0.14.1+1 | 8, 11, 14       |

This, however, doesn't tell the whole story. The OpenSearch distribution is comprised of the engine and a dozen plugins. Both the engine, and each plugin, are built and tested with a range of JDKs (a subset of 8, 11 LTS, 14, 15, and 17), across multiple operating systems (Linux, Windows, FreeBSD, and MacOS). Then, the complete distribution is rebuilt from source, and tested with the bundled JDK. Finally, while OpenSearch was claiming compatibility with JDK 8, CI didn't include tests with that version for most plugins, nor were they actually built to target JDK8 in most components.

### Versions 1.0 to 1.2.0

The complete distribution of OpenSearch 1.0 through 1.2.4 was built with JDK 14, and tested with the bundled JDK 15. Various individual components were built and tested individually with JDK 14.

### Version 1.3.0

In 1.3.0 JDK 14 was replaced with a LTS version 11 for both builds and releases. All components build and test with JDK 8, 11, and 14.

The parent issues for this change were [opensearch-build#64](https://github.com/opensearch-project/opensearch-plugins/issues/64) and [opensearch-build#74](https://github.com/opensearch-project/opensearch-build/issues/74). The implementation in OpenSearch engine was [OpenSearch#940](https://github.com/opensearch-project/OpenSearch/pull/940), and was followed by plugins, e.g. [security#1580](https://github.com/opensearch-project/security/pull/1580). The source and target Java versions were lowered back to 8 in [OpenSearch#2321](https://github.com/opensearch-project/OpenSearch/pull/2321) and any incompatible code in the engine and plugins was fixed. Version 1.3.0 now reliably runs on JDK8. 

Originally, there was a plan to upgrade the bundled JDK to 17 in this version, but the team ran into a number of issues. Engineers decided to downgrade to JDK 11 in [OpenSearch#2301](https://github.com/opensearch-project/OpenSearch/pull/2301), and deferred upgrading to JDK 17 to 2.0.0 via [opensearch-plugins#129](https://github.com/opensearch-project/opensearch-plugins/issues/129).

#### Customizing the OpenSearch Runtime

By default, any OpenSearch distribution consults `JAVA_HOME` first in order to find out the Java runtime to run on. If `JAVA_HOME` is not set, OpenSearch will try to fallback to the bundled JVM runtime if available. 

OpenSearch 1.3.0 is also introducing support for a new environment variable `OPENSEARCH_JAVA_HOME` that takes precedence over `JAVA_HOME`. This can be useful for systems with multiple applications co-located with different JVMs, or in migration scenarios with several instances of OpenSearch running on the same machine. The environment setting propagates to plugins that launch Java processes, such as performance-analyzer. See [OpenSearch#1872](https://github.com/opensearch-project/OpenSearch/issues/1872) for details.

### Version 2.0.0

OpenSearch 2.0 will [upgrade Lucene to 9.0](https://github.com/opensearch-project/OpenSearch/pull/1109), which [requires JDK 11 or newer](https://cwiki.apache.org/confluence/display/LUCENE/Release+Notes+9.0). Furthermore, given that [Java 8 support ends in March 2022](https://endoflife.date/java), OpenSearch 2.0 will [drop support for JDK 8](https://github.com/opensearch-project/opensearch-plugins/issues/110).

In 2.0.0 the complete distribution will be built with JDK 11, and tested with the bundled JDK 17. All individual components will be built and tested individually with JDK 11 and 17. Building and testing with JDK 14 and 15 is up for a discussion in [opensearch-plugins#132](https://github.com/opensearch-project/opensearch-plugins/issues/132).

These changes were made in [OpenSearch#1368](https://github.com/opensearch-project/OpenSearch/pull/1368), [2007](https://github.com/opensearch-project/OpenSearch/pull/2007), [2025](https://github.com/opensearch-project/OpenSearch/pull/2025), and [2407](https://github.com/opensearch-project/OpenSearch/pull/2407). The remaining work in plugins is for adding support for JDK 17 in [opensearch-plugins#129](https://github.com/opensearch-project/opensearch-plugins/issues/129), upgrading to Gradle 7 in [opensearch-plugins#107](https://github.com/opensearch-project/opensearch-plugins/issues/107), and removing support for Java 8 in [opensearch-plugins#110](https://github.com/opensearch-project/opensearch-plugins/issues/110).

### Benchmarking JDKs

Before switching JVMs Engineers wanted to understand the performance impact of upgrading to JDK 17. Benchmarking tests were run across JDK 8, 11, 14, 15, and 17 with both the x64 and ARM versions of OpenSearch-min. Latency and throughput were evaluated. JDK 17 consistently outperformed the rest of JDKs. JDK 15 was the closest to the metrics of JDK 17, followed by JDK 8 and 11. Meanwhile, JDK 14 was significantly slower than the other choices. Based on the results, JDK 17 was decisively the best option for running OpenSearch and the team is looking forward to shipping it by default in OpenSearch 2.0. See [OpenSearch#1276](https://github.com/opensearch-project/OpenSearch/issues/1276) for details and numbers.

### No-JDK Distributions

Releasing a no-JDK distribution of OpenSearch is tracked in [opensearch-build#99](https://github.com/opensearch-project/opensearch-build/issues/99). The current work-around is to download the existing distribution, remove the JDK and set `JAVA_HOME` or `OPENSEARCH_JAVA_HOME`. This is not ideal, so please add your +1 to the issue if you need this feature.

### Platform Specifics

#### FreeBSD

FreeBSD packages are available for OpenSearch from [textproc/opensearch](https://www.freshports.org/textproc/opensearch/). These packages do not bundle a version of Java, and depend on one of the Java versions installed on FreeBSD.

Users building their own packages can customize the version of Java the package will depend on by setting the java version in the [`DEFAULT_VERSIONS` environment variable](https://wiki.freebsd.org/Ports/DEFAULT_VERSIONS) when building, e.g. `DEFAULT_VERSIONS=java=15`. See [opensearch-build#101](https://github.com/opensearch-project/opensearch-build/issues/101) and [Releasing for FreeBSD](https://github.com/opensearch-project/opensearch-build#releasing-for-freebsd) for more information.

#### Arch Linux

The [community-contributed Arch Linux distribution of OpenSearch](https://wiki.archlinux.org/title/OpenSearch) has [been using](https://github.com/archlinux/svntogit-community/blob/packages/opensearch/trunk/PKGBUILD#L34) Java 11 for both versions 1.2.3 and 1.2.4.

#### Windows and MacOS

At this moment there's no official Windows or MacOS distribution of OpenSearch. However, this project does support building and assembling OpenSearch for Windows and MacOS, with some caveats. The version of JDK used and the configuration options are the same as on Linux. See [opensearch-build#33](https://github.com/opensearch-project/opensearch-build/issues/33), [#37](https://github.com/opensearch-project/opensearch-build/issues/37) and [#38](https://github.com/opensearch-project/opensearch-build/issues/38) for details and how you can contribute.

### Documentation

The [compatibility documentation](https://opensearch.org/docs/latest/opensearch/install/compatibility/) has been updated to reflect the above changes in [documentation-website#459](https://github.com/opensearch-project/documentation-website/pull/459).
