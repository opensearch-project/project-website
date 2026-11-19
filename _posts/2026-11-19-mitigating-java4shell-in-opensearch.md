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
meta_keywords: OpenSearch, Java, JDK, Eclipse Temurin, CVE-2026-114938, java4shell, mitigation
meta_description: "Guidance for identifying and mitigating CVE-2026-114938 in self-managed OpenSearch deployments until a patched OpenSearch release is available."
excerpt: "This post explains how self-managed OpenSearch operators can identify deployments affected by CVE-2026-114938, apply the vendor-provided JVM mitigation, and prepare to upgrade when an OpenSearch release with the fixed JDK is available."
---

CVE-2026-114938, sometimes called "java4shell", is a vulnerability in OpenJDK 17 and later. According to [Eclipse Temurin's public guidance](https://adoptium.net/news/2026/11/temurin-november-2026-cspu-java4shell), it can allow unauthenticated remote code execution on affected x64 systems when the CPU supports the AVX-512 VBMI instruction set.

This post provides temporary mitigation guidance for self-managed OpenSearch deployments. The preferred remediation is to upgrade to an OpenSearch release that includes a fixed JDK. Until that release is available and validated for your environment, Eclipse Temurin recommends disabling the affected Base64 intrinsic with the JVM option `-XX:-UseBASE64Intrinsics`.

Before applying a mitigation in production, follow your normal change-management process and roll it through the cluster one node at a time. Do not restart all cluster-manager-eligible nodes at once.

## Determine whether your deployment is affected

A deployment is in scope for the vendor advisory only when all of the following are true:

- The OpenSearch process runs on OpenJDK 17 or later.
- The node runs on x64 (`x86_64`).
- The CPU supports AVX-512 VBMI.

OpenJDK 8 and 11 are not affected according to the vendor guidance. ARM systems are also outside the affected x64 platform condition.

### Check the JDK used by OpenSearch

OpenSearch normally uses its bundled JDK. If your deployment sets `OPENSEARCH_JAVA_HOME`, it uses that JDK instead. Check the JDK that the OpenSearch process is configured to use, rather than assuming that the system-wide `java` command is representative.

For a Linux archive installation using the bundled JDK:

```bash
$OPENSEARCH_HOME/jdk/bin/java -version
```

For an RPM or Debian package installation using the bundled JDK:

```bash
/usr/share/opensearch/jdk/bin/java -version
```

For an existing Docker Compose deployment, run the equivalent command inside the OpenSearch container. Replace `opensearch-node1` with your service name:

```bash
docker compose exec opensearch-node1 \
  /usr/share/opensearch/jdk/bin/java -version
```

If `OPENSEARCH_JAVA_HOME` is set, run `$OPENSEARCH_JAVA_HOME/bin/java -version` in the service environment instead.

The fixed Eclipse Temurin releases listed in the November 2026 guidance are:

| JDK line | Fixed version |
| --- | --- |
| 27 | 27.0.1.1+4 |
| 25 | 25.0.5.1+2 |
| 21 | 21.0.13.1+2 |
| 17 | 17.0.21.1+2 |

Check [OpenSearch's November JDK release tracking issue](https://github.com/opensearch-project/OpenSearch/issues/23666) for the status of an OpenSearch release containing the updated JDK.

### Check the node architecture and CPU capability

On Linux, check the architecture:

```bash
uname -m
```

For x64 hosts, check whether the processor exposes the affected capability:

```bash
grep -m1 -ow avx512_vbmi /proc/cpuinfo
```

No output means the host does not advertise that capability through `/proc/cpuinfo`. Verify the result against your platform provider's CPU documentation when the node runs on a virtualized or managed host.

## Apply the interim mitigation

The interim mitigation disables the affected intrinsic:

```text
-XX:-UseBASE64Intrinsics
```

This is a JVM-level change. It takes effect only after the OpenSearch process restarts. It may have workload-dependent performance cost because it disables an optimized Base64 implementation. Treat it as a temporary mitigation and upgrade to a fixed JDK when an OpenSearch release containing one is available.

### Docker and Docker Compose

Add the option to the existing `OPENSEARCH_JAVA_OPTS` value for every OpenSearch node. Preserve any heap or other JVM options that are already present.

For example, if a Compose service currently sets heap options, append the mitigation option:

```yaml
services:
  opensearch-node1:
    environment:
      - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m -XX:-UseBASE64Intrinsics"
```

Do not replace an existing `OPENSEARCH_JAVA_OPTS` value with only the mitigation flag. Keep your existing heap settings and any deployment-specific JVM options.

Recreate one OpenSearch node at a time according to your deployment procedure. The following commands show the usual Compose flow; they do not change the service's network exposure or authentication configuration:

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

For clusters managed by the [OpenSearch Kubernetes Operator](https://github.com/opensearch-project/opensearch-k8s-operator), add the JVM option to every existing OpenSearch node pool. The `jvm` field is the Operator-supported path for additional JVM options; do not put this value in `general.additionalConfig`, which configures `opensearch.yml` rather than the JVM.

```yaml
spec:
  nodePools:
    - component: nodes
      jvm: "-XX:-UseBASE64Intrinsics"
```

Treat this as a patch to an existing cluster resource. Preserve the node pool's existing fields and apply the setting to each node pool that runs OpenSearch. The Operator combines `nodePools[].jvm` with its calculated heap settings when it creates `OPENSEARCH_JAVA_OPTS`, so the mitigation option does not replace Operator-managed heap configuration.

After applying the resource change, follow the Operator's rolling-restart procedure for the cluster. Verify each replacement pod's Java command line before proceeding to the next node:

```bash
kubectl exec -n <namespace> <opensearch-pod> -- sh -c \
  'tr "\000" "\n" </proc/1/cmdline | grep -Fx -- "-XX:-UseBASE64Intrinsics"'
```

Do not use this change to modify Kubernetes Services, Ingress, `hostNetwork`, authentication, or Security-plugin configuration.

### Linux archive, RPM, and Debian installations

For a persistent setting, add a separate file under `jvm.options.d` instead of modifying the packaged `jvm.options` file. This keeps the mitigation distinct from vendor-managed configuration and reduces the chance that it is overwritten during an upgrade.

For an archive installation:

```bash
printf '%s\n' '-XX:-UseBASE64Intrinsics' \
  > "$OPENSEARCH_PATH_CONF/jvm.options.d/99-java4shell.options"
```

For RPM and Debian package installations, the standard configuration directory is `/etc/opensearch`:

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

Confirm that the active OpenSearch JVM received the option. On a systemd installation, the service main PID can be used to inspect the process arguments:

```bash
pid=$(systemctl show --property MainPID --value opensearch)
sudo tr '\0' '\n' < "/proc/$pid/cmdline" \
  | grep -Fx -- '-XX:-UseBASE64Intrinsics'
```

If your service manager uses a different unit name, replace `opensearch` with that unit name.

## Upgrade when a fixed OpenSearch release is available

The JVM flag is an interim mitigation. Upgrade to the OpenSearch patch release that packages a fixed Temurin JDK as soon as it is available for your supported release line.

Before upgrading:

1. Review the OpenSearch release notes and the bundled JDK version.
2. Test the upgrade in a representative non-production environment.
3. Follow the documented rolling-upgrade procedure for your cluster topology.
4. Confirm the OpenSearch process uses the expected fixed JDK after the upgrade.
5. Remove the temporary mitigation only after the JDK version and vendor guidance have been verified.

## Keep this guidance current

This post is based on the public Eclipse Temurin advisory. The affected platform conditions, fixed JDK versions, and OpenSearch patch-release availability can change as vendors complete their release processes. Check the [Eclipse Temurin guidance](https://adoptium.net/news/2026/11/temurin-november-2026-cspu-java4shell) and [OpenSearch release tracking](https://github.com/opensearch-project/OpenSearch/issues/23666) immediately before making production changes.
