---
layout: post
title: "Journey to find a replacement to the Java Security Manager in OpenSearch 3.0"
authors:
   - cwperks
   - kumargu
date: 2025-05-19
categories:
  - technical-posts
meta_keywords: Opensearch security, Java security manager, OpenSearch 3.0, security, sandboxing.
meta_description: The Java Security Manager (JSM) has long been a foundational security mechanism in OpenSearch. However, with its deprecation underway in the JDK, this blog explores the alternative technologies adopted to replace JSM,  with the trade-offs considered maintaining a very high bar for OpenSearch’s security posture.
---


[OpenSearch 3.0.0](https://opensearch.org/blog/unveiling-opensearch-3-0/) introduced many innovative features that continue to push the frontier with significant advancements in performance, data management, vector database functionality, and more. In the announcement we shared that OpenSearch replaced the Security Manager provided by Java and wanted to share more details about this notable effort.

The decision to remove JSM in 3.0 was carefully considered and primarily driven by two factors:

The upcoming removal of JSM in the Java platform: The Java Security Manager has been deprecated since JDK 17 ([JEP411](https://openjdk.org/jeps/411)) and is scheduled for full removal in JDK 24 ([JEP 486] (https://openjdk.org/jeps/486)).The JEP cited poor adoption of the functionality for its deprecation and specifically highlighted a few large open-source projects as adopters including Elasticsearch. While OpenSearch 3.0 itself is bundled with Java 21 and not yet forced to drop JSM, continuing to rely on a deprecated and soon-to-be-removed component was deemed unsustainable for long-term support and innovation.

Incompatibility with emerging JVM features—particularly virtual threads: Introduced in ([JEP 444](https://openjdk.org/jeps/444)), virtual threads are one of the most anticipated features in modern Java. While OpenSearch 3.0 does not use virtual threads internally, we expect plugin developers and future versions of OpenSearch to explore their use for improved scalability. However, virtual threads do not carry permissions when a Security Manager is enabled—effectively rendering them incompatible with any JSM-based security model. That means continuing to support JSM would have prevented adoption of a key Java feature that unlocks better concurrency and resource efficiency.

Given these needs, OpenSearch 3.0 was seen as the right time to deprecate the Security Manager. Doing so in a major version allowed us to communicate the change clearly and avoid introducing breaking security changes in later 3.x minor releases.


In December 2021, an [issue](https://github.com/opensearch-project/OpenSearch/issues/1687) was created in the OpenSearch core repo to discuss options for a replacement where it soon became clear that there was no direct replacement to the functionality that the Security manager provided for Java programs. OpenSearch embarked on a lengthy search for a replacement that sought to retain important functionality from the Security Manager that OpenSearch relied upon.

Many different options were considered with notable highlights including:

1. A radical change to [OpenSearch extensibility](https://opensearch.org/blog/technical-roadmap-opensearch-extensibility/) through out-of-process extensions. 
2. GraalVM
3. Systemd hardening
4. Java agent
5. Remove the Security Manager altogether

### Purpose of Java Security Manager

At its core, OpenSearch is a powerful search engine built on top of Apache Lucene that provides a REST API layer to access documents stored within the Lucene shards and cluster management to run Lucene distributed across a cluster. OpenSearch has a pluggable architecture and a diverse ecosystem of plugins that build on the core to provide more functionality like security, observability, index management and more. OpenSearch plugins run in the same JVM as the OpenSearch process, but remain partially separated through separate class loading. OpenSearch does not treat plugins as secure-by-default and instead relies on the Java Security Manager to sandbox plugins to prevent plugins from performing privileged actions without explicit approval by a cluster administrator.

There are 2 main sets of users that interface with the Java Security Manager.

1. **Plugin Developers**:

Plugin Developers seeking to perform PrivilegedActions would need to wrap the code that performed the action in an `AccessController.doPrivileged(() -> { ... })` block and provide the requisite grant in the `plugin-security.policy` file. One common complaint about the Java Security Manager by Plugin Developers is that they are not aware of what constitutes a PrivilegedAction until getting an error at runtime that the plugin is forbidden from performing a given operation like connecting to a Socket or reading from the File System. The Java Security manager covered a broad range of areas from preventing calls to system operations like System.exit to other aspects of the java language like reflection (See [Permissions and Security Policy](https://docs.oracle.com/javase/8/docs/technotes/guides/security/spec/security-spec.doc3.html) for more information about areas that the Java Security Manager covered).

Below are 2 examples of how plugin developers interface with the Java Security Manager:


1. Example `plugin-security.policy` file content:

```
grant { 
  permission java.lang.RuntimePermission "shutdownHooks";
  permission java.lang.RuntimePermission "getClassLoader";
  permission java.lang.RuntimePermission "setContextClassLoader";
  permission java.util.PropertyPermission "*","read,write";
}
```

2. `AccessController.doPrivileged` block

```
SpecialPermission.check();
AccessController.doPrivileged((PrivilegedAction<Void>) () -> {
    if (Security.getProvider("BC") == null) {
        try {
            Class<?> providerClass = Class.forName("org.bouncycastle.jce.provider.BouncyCastleProvider");
            Provider provider = (Provider) providerClass.getDeclaredConstructor().newInstance();
            Security.addProvider(provider);
            log.debug("Bouncy Castle Provider added");
        } catch (Exception e) {
            log.debug("Bouncy Castle Provider could not be added", e);
        }
    }
    return null;
});
```

In the block above, there is the usage of `SpecialPermission.check()` before the call to `AccessController.doPrivileged(() -> { ... })`. In OpenSearch, `org.opensearch.SpecialPermission` is granted to all jars across the core and any installed plugin at runtime. If there is an external call on the `callstack` (for example if the code came from an API payload), then the call to `SpecialPermission.check()` fails and will prevent code originating externally to OpenSearch from performing privileged actions. 


2. **Cluster Administrators**: 

For cluster administrators, they are prompted about permissions that a plugin requests at installation time. Below is a snippet from the Security plugin that contains grants that allow it to perform actions like adding the BouncyCastle provider.

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@     WARNING: plugin requires additional permissions     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
* java.io.FilePermission /proc/sys/net/core/somaxconn#plus read
* java.lang.RuntimePermission accessDeclaredMembers

```

### Replacement for the Java Security Manager


After weighing the options for a replacement, it was clear that a single approach would not replace all of the functionality that the Java Security Manager had provided. The OpenSearch community came 2 a consensus to replace JSM with a two-pronged approach:

1. `systemd hardening` - leveraging operating system controls for protection
2. `Java agent` - low-level instrumentation to intercept and authorize privileged operations

#### systemd hardening

The first prong of the replacement strategy is systemd hardening, which is available on Linux distributions that use systemd as the init system. With this approach, OpenSearch leverages native operating system features to sandbox the OpenSearch process. This includes:

Restricting system calls using SystemCallFilter with `seccomp`, limiting what kernel interfaces the OpenSearch process can access.

Isolating filesystem paths using ReadOnlyPaths, ReadWritePaths, and InaccessiblePaths to control access to critical system files and restrict write access to only necessary directories.

Blocking potentially dangerous capabilities using `CapabilityBoundingSet`, such as `CAP_SYS_ADMIN` or `CAP_NET_ADMIN`, which could be exploited by malicious code.

Enabling PrivateTmp, NoNewPrivileges, and ProtectSystem to further reduce the risk of privilege escalation or file system tampering.

This approach is ideal for protecting the system from malicious plugins by constraining what the OpenSearch process itself can do. However, the drawback is that systemd rules are applied at the process level, not at the plugin level. That means any privilege granted affects the entire OpenSearch process, which is not a suitable replacement for the fine-grained, per-plugin control that the Security Manager provided.

#### Java agent

A Java agent is a special Jar that the JVM can load before (or attach during) an application’s execution to see, transform, or monitor the bytecode of every class the JVM loads. Under the hood it relies on the Instrumentation API introduced in Java 5. A java agent is attached to the OpenSearch process through the `-javaagent` java argument. The OpenSearch java agent is composed of Interceptors that intercept privileged operations to ensure that the codebase executing the code has been explicitly granted. Configuration for the java agent remains the same as the Java Security Manager with the `plugin-security.policy` file contains a list of granted permissions and prompting the cluster administrator on plugin installation.

OpenSearch's Java Agent leverages the ByteBuddy Instrumentation API to intercept and instrument Java bytecode at runtime. Specifically, the agent installs interceptors for privileged operations such as:

Opening or connecting sockets

Creating, reading, or writing files

These interceptors inspect the current call stack to determine the originating code, then evaluate whether it has been granted the required permission based on the existing `plugin-security.policy` file. This mirrors the existing Java Security Manager model with minimal disruption for plugin developers and administrators.

While the agent doesn’t cover all permission types that JSM supported (for example., reflection, thread context access), it focuses on covering the most sensitive operations—file and network access—which present the highest security risks. They rest are delegated to operating system using `systemd`. However, the agent is extensible for addition of more interceptors.

We consciously chose to avoid over-instrumentation due to performance and maintainability concerns. Instrumenting every possible permission check would involve excessive boilerplate and runtime overhead.

### Final Thoughts

The deprecation of the Java Security Manager is a significant turning point for the Java ecosystem and OpenSearch alike. While no single solution can fully replicate the functionality that the Security Manager provided, OpenSearch’s two-pronged approach—leveraging operating system-level protections using systemd and introducing a lightweight Java Agent for plugin-level access control—provides a robust and extensible foundation for securing the platform going forward.

We believe this approach ensures that OpenSearch remains secure, performant, and compatible with the evolving Java ecosystem, while retaining its extensibility and plugin ecosystem that users rely on.

