---
layout: post
title: "FIPS 140-3 support in OpenSearch"
authors:
  - kschnitter
date: 2026-09-01
categories:
  - technical-post
meta_keywords: FIPS 140-3, OpenSearch security, cryptographic compliance, Bouncy Castle FIPS, enterprise adoption
meta_description: OpenSearch now supports running in a mode compliant with FIPS 140-3. Learn what FIPS is, why it matters for enterprise and government adoption, and how a collaboration between SAP, SAS, and AWS delivered it.
excerpt: OpenSearch now supports running in a mode compliant with FIPS 140-3, contributed through a multi-year collaboration between SAP, SAS, and AWS.
---

For many organizations operating in regulated environments, strong cryptography is a prerequisite for software deployment. Starting with version 3.6, OpenSearch can run in a mode compliant with FIPS 140-3, which uses validated cryptographic modules for security-relevant operations. This post describes the changes that make OpenSearch FIPS compliant, the multi-year collaboration between SAP, SAS, and AWS that delivered FIPS compliance, and how to enable the mode in your cluster.

## Why FIPS 140-3 matters

US federal agencies, government contractors, and organizations in regulated industries such as finance and healthcare are frequently required to use cryptographic modules that have been formally validated against a federal standard. A search and analytics platform that cannot meet that requirement cannot be adopted, regardless of its other capabilities.

That standard is FIPS 140-3. Teams with a FIPS requirement previously had to build workarounds or choose a different product. Running OpenSearch in FIPS-compliant mode makes it eligible for regulated and public-sector deployments.

A common alternative is to place a FIPS-validated TLS-terminating proxy in front of OpenSearch and to encrypt data at rest with a validated module. This pattern is sufficient when the compliance boundary is defined at that network edge. A cluster also performs cryptographic operations internally: it hashes credentials, signs tokens, and encrypts node-to-node traffic. However, a proxy has no visibility into any of these operations. Native FIPS mode places them within the validated boundary, so OpenSearch itself is the compliant component. The two approaches complement each other: a proxy encrypts traffic at the network edge, and native FIPS mode applies validated cryptography to the cluster's internal operations.

## What is FIPS 140-3?

The Federal Information Processing Standards (FIPS) are developed by the US National Institute of Standards and Technology (NIST). FIPS 140-3 is the current standard governing *cryptographic modules*, the components that perform encryption, hashing, key management, and random number generation.

A validated module has been independently tested and certified to implement approved algorithms correctly and to protect keys and other sensitive material. FIPS 140-3 is the successor to FIPS 140-2: NIST no longer accepts new modules for 140-2 validation, so 140-3 is the active program for anyone certifying cryptography today.

FIPS mode imposes two requirements: a validated module must perform every cryptographic operation, and the deployment must use only the algorithms and key sizes that the standard approves. Meeting these requirements in OpenSearch required auditing every use of cryptography in the codebase and confirming that each one can operate entirely within an approved boundary. The original community requests and the first proposal referred to FIPS 140-2, which was current at the time. Over the life of the project, the target moved to 140-3, and 140-3 is what OpenSearch delivers.

## How the collaboration developed

Community requests for FIPS compliance date to the earliest days of the project, with [feature requests](https://github.com/opensearch-project/security/issues/1497) opened in 2020 and 2021. The need was clear, but the work was substantial and affected several repositories, so it remained unaddressed for years.

In late 2023, SAS Institute filed the [founding request for comments](https://github.com/opensearch-project/security/issues/3420), which proposed a FIPS-enforced mode and described a phased plan. SAS then completed much of the early groundwork in the Security plugin: adding approved alternatives to non-approved primitives---for example, `PBKDF2` password hashing in place of `bcrypt`, and an approved hash for field masking in place of `BLAKE2b`---and removing hardcoded assumptions about which cryptographic provider was in use. This work demonstrated that the Security plugin could operate on approved cryptography.

In 2024, SAP contributed a [FIPS 140-3 compliance roadmap](https://github.com/opensearch-project/security/issues/4254) that refocused the effort on the current standard and on a goal SAP held from the start: allowing an administrator to enable FIPS at runtime in a standard distribution rather than requiring a special build compiled from source. Karsten Schnitter sponsored and coordinated the work on the SAP side, maintaining momentum across teams and companies. This roadmap became the plan that the project executed.

SAP then took responsibility for the deep core work: building the tooling that produces a FIPS distribution and, most difficult of all, making the entire OpenSearch test suite build and run under a FIPS-validated JVM so that FIPS compliance could be verified continuously rather than assumed. An early attempt to merge all the changes in one large pull request was deliberately abandoned in favor of a sequence of small, reviewable pull requests, which is how the work was ultimately merged.

Over time, the initial division of labor---SAP on core, SAS on the Security plugin---became more collaborative. AWS maintainers reviewing the core changes observed that a FIPS dependency cannot be confined to a single repository, because it becomes a prerequisite in every repository that depends on it. SAP's scope therefore extended into the Security plugin as well, in coordination with SAS.

Those reviews also shaped the architecture, and AWS maintainers built parts of the runtime experience: the build switch that produces FIPS-capable binaries and the administrator-facing environment variable that enables enforcement. A further step delivered SAP's original goal: [shipping the validated Bouncy Castle FIPS libraries in the default distribution](https://github.com/opensearch-project/technical-steering/issues/77), proposed by AWS's Craig Perkins and developed in the open, made the *default* 3.6 distribution FIPS capable.

More recently, contributors from across the project advanced the work on FIPS-enforced mode. Ahead of OpenSearchCon Europe 2026, the collaborators agreed to use the conference to align on the final steps, and they met there to determine what remained and how to complete it.

This effort shows how the OpenSearch Project's community model works: maintainers and contributors from different organizations build a feature too large for any single company, review each other's work, and take responsibility for tasks outside their own scope.

## Changes that enable FIPS compliance

The implementation includes the following key changes:

- **Validated cryptography**: OpenSearch bundles the [Bouncy Castle FIPS provider (`BC-FJA`)](https://www.bouncycastle.org/documentation/documentation-java/), a cryptographic module validated against FIPS 140-3. In FIPS mode, OpenSearch runs Bouncy Castle FIPS in *approved-only* mode, which restricts operations to certified algorithms and key sizes and removes the standard providers that are not validated.
- **Key and certificate formats**: OpenSearch parses the key and certificate formats used in practice while remaining within the approved boundary.
- **FIPS-compliant keystores**: Only the `BCFKS` and `PKCS#11` keystore and truststore formats are FIPS compliant; the common `JKS` and `PKCS12` formats are not.
- **Stronger secrets**: FIPS enforces a minimum strength for keystore and key passwords: at least 112 bits, or approximately 14 characters. OpenSearch fails at startup if a password is weaker, rather than running with a weakened configuration.
- **Continuous verification**: Continuous integration (CI) runs the entire test suite under a FIPS JVM on every change.

Because the validated libraries are present in every 3.6 distribution, enforcement is a separate, explicit choice: FIPS is available in all deployments but remains inactive until a cluster administrator enables it.

## Getting started

To enable FIPS mode, follow these steps:

1. **Run OpenSearch 3.6 or later on a supported JVM**: You need a JVM configured to use the bundled Bouncy Castle FIPS providers, on a Java version for which the module is certified.
2. **Use FIPS-compliant keystores and truststores**: Convert your stores to `BCFKS` or use a `PKCS#11` store. The bundled `opensearch-fips-demo-installer` tool can migrate the default JVM truststore and write the required settings into `jvm.options`. As its name indicates, this tool is intended for demonstration; review its output before using it in production.
3. **Use strong passwords**: Keystore and key passwords must meet the 112-bit minimum.
4. **Configure the Security plugin for FIPS**: Use `PBKDF2` for internal user password hashing and a FIPS-approved hash algorithm for field masking instead of the default `BLAKE2b`.
5. **Enable enforcement**: Start OpenSearch with `OPENSEARCH_FIPS_MODE=true` to run in FIPS-enforced mode.

For more information, see the [FIPS configuration documentation](https://docs.opensearch.org/latest/security/configuration/fips/).

## Next steps

FIPS support in OpenSearch is available for use, and development continues. Some work remains in the Security plugin and integration testing, including expanding automated FIPS coverage and completing the remaining enforcement details. If FIPS requirements apply to your deployment, try the new mode, report any issues you encounter in the [Security plugin repository](https://github.com/opensearch-project/security/issues), and contribute to the remaining work.

## Special thanks

The core FIPS implementation was carried out on SAP's behalf by **Sternad Software GmbH**, in particular, **Iwan Igonin** and **Kai Sternad**, who completed much of the demanding work of making OpenSearch build, test, and run under a validated cryptographic module. Thank you for the careful engineering that made this possible.

We would also like to thank the following contributors:

- The many community members who requested FIPS support over the years and kept the requirement visible.
- **Terry Quigley** and the **SAS** team, who established the foundation and were among the first to run FIPS mode in production and report their findings.
- **Craig Perkins**, **Andriy Redko**, and the **AWS** maintainers, who reviewed the work and built the runtime support.
- **Nils Bandener**, for helping complete the effort.
