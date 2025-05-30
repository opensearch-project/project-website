---
layout: post
title: "Finding a replacement for JSM in OpenSearch 3.0"
authors:
   - cwperks
   - kumargu
   - kolchfa
date: 2025-05-19
categories:
  - technical-posts
meta_keywords: Opensearch security, Java security manager, OpenSearch 3.0, security, sandboxing.
meta_description: The Java Security Manager (JSM) has long been a foundational security mechanism in OpenSearch. With its deprecation underway, this blog post explores the alternative technologies adopted to replace JSM.
---

[OpenSearch 3.0.0](https://opensearch.org/blog/unveiling-opensearch-3-0/) introduced many innovative features that continue to push the frontier with significant advancements in performance, data management, vector database functionality, and more. In the announcement, we shared that OpenSearch has replaced JSM (JSM) because of its upcoming deprecation. In this blog post, and we'll to share more details about the efforts that enabled this transition.

The decision to remove JSM in 3.0 was carefully considered and primarily driven by two factors:

1. **The upcoming removal of JSM from the Java platform**: JSM has been deprecated since JDK 17 ([JEP411](https://openjdk.org/jeps/411)) and is scheduled for full removal in JDK 24 ([JEP 486](https://openjdk.org/jeps/486)). According to the Java Enhancement Proposal (JEP), this decision was made because very few projects were using JSM, with Elasticsearch being one of the few major open-source projects that did. While OpenSearch 3.0 is bundled with Java 21 and not yet forced to drop JSM, continuing to rely on a deprecated and soon-to-be-removed component was deemed unsustainable for long-term support and innovation.

2. **Incompatibility with emerging JVM features, particularly, virtual threads**: Introduced in ([JEP 444](https://openjdk.org/jeps/444)), virtual threads are one of the most anticipated features in modern Java. While OpenSearch 3.0 does not use virtual threads internally, we expect plugin developers and future versions of OpenSearch to explore using virtual threads for improved scalability. However, virtual threads do not carry permissions when a Security Manager is enabled, effectively rendering them incompatible with any JSM-based security model. Thus, continuing to support JSM would have prevented adoption of a key Java feature that unlocks better concurrency and resource efficiency.

Given these needs, we decided to deprecate JSM in OpenSearch 3.0. Doing this in a major version allowed us to communicate the change clearly and avoid introducing breaking security changes in later 3.x minor releases.


In December 2021, an [issue](https://github.com/opensearch-project/OpenSearch/issues/1687) was created in the OpenSearch core repo to discuss options for a replacement. Soon it became clear that there was no direct replacement to the functionality that JSM provided for Java programs. OpenSearch embarked on a lengthy search for a replacement that sought to retain important functionality from JSM that OpenSearch relied on.

We considered many different options, including the following notable ones:

1. Moving to [OpenSearch extensibility](https://opensearch.org/blog/technical-roadmap-opensearch-extensibility/) through out-of-process extensions (a radical change).
2. Replacing JVM with GraalVM.
3. Hardening security by using `systemd`.
4. Introducing a separate Java agent.
5. Completely removing JSM and related functionalities.

## Understanding JSM's role in OpenSearch

At its core, OpenSearch is a powerful search engine built on top of Apache Lucene. It provides a REST API layer for accessing documents stored in Lucene shards, along with built-in cluster management for running Lucene on nodes distributed across a cluster. OpenSearch has a pluggable architecture and a diverse set of plugins that extend the core functionality by offering additional features like security, observability, and index management. OpenSearch plugins run in the same JVM as the OpenSearch process but remain partially separated through separate class loading. OpenSearch does not treat plugins as secure-by-default; instead, it relies on JSM to sandbox plugins in order to prevent them from performing privileged actions without explicit approval by a cluster administrator.

There are two main groups of users that interface with JSM: plugin developers and cluster administrators. These groups use JSM in different ways.

### How plugin developers use JSM

To perform a privileged action, plugin developers must wrap the code that performs the action in an `AccessController.doPrivileged(() -> { ... })` block and grant the necessary permissions in the `plugin-security.policy` file. A common complaint about JSM is that plugin developers don't know what constitutes a `PrivilegedAction` until runtime. At runtime, they get an error saying that the plugin is forbidden from performing a given operation, for example, connecting to a socket or reading from the file system. JSM enforced a broad range of restrictions, from preventing calls to system operations like `System.exit` to other Java language features like reflection (for more information about the areas that JSM covered, see [Permissions and Security Policy](https://docs.oracle.com/javase/8/docs/technotes/guides/security/spec/security-spec.doc3.html)).

Plugin developers interface with JSM by defining permissions in a policy file and implementing privileged actions in code:

- The following example `plugin-security.policy` file defines the basic permissions a plugin needs to operate:

    ```json
    grant { 
      permission java.lang.RuntimePermission "shutdownHooks";
      permission java.lang.RuntimePermission "getClassLoader";
      permission java.lang.RuntimePermission "setContextClassLoader";
      permission java.util.PropertyPermission "*","read,write";
    }
    ```

- The following is an example `AccessController.doPrivileged` block. In this example, `SpecialPermission.check()` is invoked before the call to `AccessController.doPrivileged(() -> { ... })`. In OpenSearch, the `org.opensearch.SpecialPermission` is granted to all JAR files, both the core and any installed plugins, at runtime. This permission serves as a safeguard against external code execution. If the call stack includes a source external to OpenSearch (for example, code originating from an API payload), the call to `SpecialPermission.check()` fails. This mechanism helps prevent untrusted code from performing privileged actions within the OpenSearch process:

    ```java
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

### How cluster administrators use JSM

Cluster administrators are prompted about permissions that a plugin requests at installation time. The following snippet from the Security plugin contains permissions that allow the plugin to perform actions like adding the `BouncyCastle` provider:

    ```console
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @     WARNING: plugin requires additional permissions     @
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    * java.io.FilePermission /proc/sys/net/core/somaxconn#plus read
    * java.lang.RuntimePermission accessDeclaredMembers
    ```

## Our solution for replacing JSM

Understanding the key user interactions with JSM was crucial as we developed our replacement strategy. We needed solutions that would continue to support both plugin developers' need for privileged operations and administrators' ability to control permissions. 

After evaluating potential JSM replacement alternatives, it was clear that no single approach could replace all of the functionality that JSM provided. The OpenSearch community came to a consensus to replace JSM by adopting a two-pronged strategy:

1. [`systemd` hardening](#systemd-hardening) - Using operating system controls for protection.
2. [Java agent](#java-agent) - Implementing a low-level instrumentation to intercept and authorize privileged operations.

### systemd hardening

The first component of the replacement strategy is `systemd` hardening, which is available on Linux distributions that use `systemd` as the init system. This approach sandboxes the OpenSearch process using the following native operating system features:

- **System call restriction**: Uses `seccomp` and the `SystemCallFilter` directive to restrict the kernel interfaces that the OpenSearch process can access.

- **File system path isolation**: Configures `ReadOnlyPaths`, `ReadWritePaths`, and `InaccessiblePaths` to control access to critical system files and restrict write access to only necessary directories.

- **Capability restrictions**: Applies `CapabilityBoundingSet` to block dangerous Linux capabilities, such as `CAP_SYS_ADMIN` or `CAP_NET_ADMIN`, that could be exploited by malicious code.

- **Process containment**: Enables options such as `PrivateTmp`, `NoNewPrivileges`, and `ProtectSystem` to further reduce the risk of privilege escalation or file system tampering.

This approach is effective for protecting the system from malicious plugins by constraining the actions that the OpenSearch process can perform. However, the drawback is that `systemd` rules are applied at the process level, not at the plugin level. This means that any privilege granted affects the entire OpenSearch process, which is not a suitable replacement for the fine-grained, per-plugin control that JSM provided.

### Java agent

The second component of the replacement strategy is a custom Java agent. A Java agent is a special JAR that the JVM can load before application execution or attach during execution in order to view, transform, or monitor the bytecode of every class that the JVM loads. Internally, it relies on the Instrumentation API introduced in Java 5. A Java agent is attached to the OpenSearch process through the `-javaagent` Java argument. The OpenSearch Java agent is composed of interceptors that monitor privileged operations and ensure that the executing codebase has been explicitly granted the required permissions. The configuration for the Java agent remains consistent with the Java Security Manager: the `plugin-security.policy` file defines the set of granted permissions and prompts the cluster administrator during plugin installation.

OpenSearch's Java Agent uses the ByteBuddy Instrumentation API to intercept and instrument Java bytecode at runtime. Specifically, the agent installs interceptors for privileged operations such as:

- Opening or connecting sockets

- Creating, reading, or writing files

These interceptors inspect the current call stack to identify the originating code and then evaluate whether it has been granted the required permissions based on the existing `plugin-security.policy` file. This mirrors the existing JSM model, with minimal disruption for plugin developers and administrators.

While the agent does not cover all permission types previously supported by JSM (for example, reflection and thread context access), it focuses on the most sensitive operations, such as file and network access, which pose the highest security risks. Other security controls are delegated to the operating system using `systemd`. The agent is also designed to be extensible, allowing for the addition of more interceptors as needed.

We specifically chose to avoid over-instrumentation because of performance and maintainability concerns. Instrumenting every possible permission check would significantly decrease performance and require an excessive amount of repetitive code.

## Final thoughts

JSM deprecation is a significant turning point for the Java ecosystem and OpenSearch alike. While no single solution can fully replicate the functionality that JSM provided, OpenSearch's two-pronged approach---using operating-system-level protections through `systemd` and introducing a lightweight Java agent for plugin-level access control---provides a robust and extensible foundation for securing the platform.

This approach ensures that OpenSearch remains secure, performant, and compatible with the evolving Java ecosystem while retaining the extensibility and plugin ecosystem that users rely on.

