---
layout: post
title: "Mitigating CVE-2026-114938 in self-managed OpenSearch deployments"
authors:
  - cwperks
  - zhujiaxiang
date: 2026-11-19
categories:
  - technical-post
tags:
  - security
  - java
  - operations
  - cve
meta_keywords: OpenSearch, Java, JDK, Adoptium/Eclipse Temurin, CVE-2026-114938, java4shell, mitigation
meta_description: "Guidance for identifying and mitigating CVE-2026-114938 in self-managed OpenSearch deployments until a patched OpenSearch release is available."
excerpt: "This post explains how self-managed OpenSearch operators can identify deployments affected by CVE-2026-114938, apply the vendor-provided JVM mitigation, and prepare to upgrade when an OpenSearch release with the fixed JDK is available."
---

OpenSearch runs on Java and may be affected by **CVE-2026-114938**, also known as *java4shell*, a vulnerability in OpenJDK 17 and later. According to [Eclipse Temurin guidance](https://adoptium.net/news/2026/11/temurin-november-2026-cspu-java4shell), it can allow unauthenticated remote code execution on affected x64 systems when the CPU supports the AVX-512 VBMI instruction set.

This post describes how to temporarily mitigate the vulnerability in self-managed OpenSearch deployments. The preferred long-term remediation is to upgrade to an OpenSearch release that includes a fixed JDK once it becomes available and has been validated in your environment.

Before applying this change in production, follow your organization's normal change management procedures and apply it to one node at a time. In particular, do not restart all cluster-manager-eligible nodes simultaneously.

## Determine whether your deployment is affected

A deployment is in scope for the vendor advisory only when all of the following are true:

- The OpenSearch process runs on OpenJDK 17 or later.
- The node runs on x64 (`x86_64`).
- The CPU supports AVX-512 VBMI.

OpenJDK 8 and 11 are not affected according to the vendor guidance. ARM systems are not affected because the vulnerability targets x64 platforms only.

### Verify the JDK version used by OpenSearch

OpenSearch uses its bundled JDK by default. However, if `OPENSEARCH_JAVA_HOME` is set, it uses the JDK specified by that variable instead. Verify which JDK the OpenSearch process is configured to use; the system-wide `java` command may point to a different installation.

For a Linux archive installation using the bundled JDK, run the following command:

```bash
$OPENSEARCH_HOME/jdk/bin/java -version
```

For an RPM or Debian package installation using the bundled JDK, run the following command:

```bash
/usr/share/opensearch/jdk/bin/java -version
```

For an existing Docker Compose deployment, run the equivalent command inside the OpenSearch container. Replace `opensearch-node1` with your service name:

```bash
docker compose exec opensearch-node1 \
  /usr/share/opensearch/jdk/bin/java -version
```

If `OPENSEARCH_JAVA_HOME` is set, run `$OPENSEARCH_JAVA_HOME/bin/java -version` in the service environment instead.

The following table lists the fixed Eclipse Temurin releases from the November 2026 guidance.

| JDK line | Fixed version |
| --- | --- |
| 27 | 27.0.1.1+4 |
| 25 | 25.0.5.1+2 |
| 21 | 21.0.13.1+2 |
| 17 | 17.0.21.1+2 |

For the status of an OpenSearch release containing the updated JDK, see [OpenSearch's November JDK release tracking issue](https://github.com/opensearch-project/OpenSearch/issues/23666).

### Verify the node architecture and CPU capability

On Linux, verify the architecture:

```bash
uname -m
```

For x64 hosts, verify whether the processor exposes the affected capability:

```bash
grep -m1 -ow avx512_vbmi /proc/cpuinfo
```

If no output is returned, the host does not report support for that capability in `/proc/cpuinfo`. If the node runs on a virtualized or managed host, also verify your platform provider's CPU documentation to confirm whether the capability is supported.

## Apply the temporary mitigation

Eclipse Temurin recommends disabling the affected Base64 intrinsic by adding the following option:

```text
-XX:-UseBASE64Intrinsics
```

This JVM-level change takes effect only after the OpenSearch process restarts. Because it disables an optimized Base64 implementation, it may affect the performance of certain workloads.

### Docker and Docker Compose

Add the option to the existing `OPENSEARCH_JAVA_OPTS` value for every OpenSearch node. Preserve any heap or other JVM options that are already present.

For example, if a Compose service currently sets heap options, append the mitigation option:

```yaml
services:
  opensearch-node1:
    environment:
      - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m -XX:-UseBASE64Intrinsics"
```

Do not replace an existing `OPENSEARCH_JAVA_OPTS` value with the single mitigation flag. Keep your existing heap settings and any deployment-specific JVM options.

Recreate one OpenSearch node at a time according to your deployment procedure. The following commands show the usual Compose flow. They do not change the service network exposure or authentication configuration:

```bash
docker compose config
docker compose up -d --force-recreate opensearch-node1
```

After the container restarts, verify that the running Java process includes the option:

```bash
docker compose exec opensearch-node1 sh -c \
  'tr "\000" "\n" </proc/1/cmdline | grep -Fx -- "-XX:-UseBASE64Intrinsics"'
```

For `docker run` deployments, append the same option to the existing `OPENSEARCH_JAVA_OPTS` environment value. Do not add public port mappings or disable OpenSearch security as part of this mitigation.

### OpenSearch Kubernetes Operator

For clusters managed by the [OpenSearch Kubernetes Operator](https://github.com/opensearch-project/opensearch-k8s-operator), add the JVM option to every existing OpenSearch node pool. The `jvm` field is the Operator-supported path for additional JVM options. Do not add this value to `general.additionalConfig`, which configures `opensearch.yml` rather than the JVM:

```yaml
spec:
  nodePools:
    - component: nodes
      jvm: "-XX:-UseBASE64Intrinsics"
```

Treat this change as a patch to an existing cluster resource. Preserve the node pool's existing fields and apply the setting to each node pool that runs OpenSearch. The Operator combines `nodePools[].jvm` with its calculated heap settings when it creates `OPENSEARCH_JAVA_OPTS`, so the mitigation option does not replace Operator-managed heap configuration.

After applying the resource change, follow the Operator's rolling restart procedure for the cluster. Verify each replacement pod's Java command line before proceeding to the next node:

```bash
kubectl exec -n <namespace> <opensearch-pod> -- sh -c \
  'tr "\000" "\n" </proc/1/cmdline | grep -Fx -- "-XX:-UseBASE64Intrinsics"'
```

Do not use this change to modify Kubernetes Services, Ingress, `hostNetwork`, authentication, or Security plugin configuration.

### Linux archive, RPM, and Debian installations

For a persistent setting, add a separate file under `jvm.options.d` instead of modifying the packaged `jvm.options` file. This keeps the mitigation distinct from vendor-managed configuration and reduces the chance that it is overwritten during an upgrade.

For an archive installation, run the following command:

```bash
printf '%s\n' '-XX:-UseBASE64Intrinsics' \
  > "$OPENSEARCH_PATH_CONF/jvm.options.d/99-java4shell.options"
```

For RPM and Debian package installations, run the following command. The standard configuration directory is `/etc/opensearch`:

```bash
sudo install -d -o root -g opensearch -m 0750 /etc/opensearch/jvm.options.d
printf '%s\n' '-XX:-UseBASE64Intrinsics' \
  | sudo tee /etc/opensearch/jvm.options.d/99-java4shell.options >/dev/null
sudo chown root:opensearch /etc/opensearch/jvm.options.d/99-java4shell.options
sudo chmod 0640 /etc/opensearch/jvm.options.d/99-java4shell.options
```

Restart one node, wait for it to rejoin and recover according to your operational procedure, then continue with the next node:

```bash
sudo systemctl restart opensearch
```

Confirm that the active OpenSearch JVM received the option. On a systemd installation, use the service main PID to inspect the process arguments:

```bash
pid=$(systemctl show --property MainPID --value opensearch)
sudo tr '\0' '\n' < "/proc/$pid/cmdline" \
  | grep -Fx -- '-XX:-UseBASE64Intrinsics'
```

If your service manager uses a different unit name, replace `opensearch` with that unit name.

## Upgrade when a fixed OpenSearch release is available

The JVM flag is a temporary mitigation. Upgrade to the OpenSearch patch release that packages a fixed Temurin JDK as soon as it is available for your supported release line.

Before you upgrade, complete the following steps:

1. Review the OpenSearch release notes and the bundled JDK version.
2. Test the upgrade in a representative non-production environment.
3. Follow the documented rolling upgrade procedure for your cluster topology.
4. Confirm that the OpenSearch process uses the expected fixed JDK after the upgrade.
5. Remove the temporary mitigation only after the JDK version and vendor guidance have been verified.

## Verify advisory status before applying changes

This post is based on the Eclipse Temurin guidance. The affected platform conditions, fixed JDK versions, and OpenSearch patch release availability can change as vendors complete their release processes. Check the [Eclipse Temurin guidance](https://adoptium.net/news/2026/11/temurin-november-2026-cspu-java4shell) and [OpenSearch JDK Update](https://github.com/opensearch-project/OpenSearch/issues/23666) immediately before making production changes.
