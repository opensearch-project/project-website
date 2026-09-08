---
layout: post
title: "FIPS 140-3 Support in OpenSearch"
authors:
  - kschnitter
date: 2026-09-01
categories:
  - technical-post
meta_keywords: FIPS 140-3, OpenSearch security, cryptographic compliance, BouncyCastle FIPS, enterprise adoption
meta_description: OpenSearch now supports running in a FIPS 140-3 compliant mode. Learn what FIPS is, why it matters for enterprise and government adoption, and how a collaboration between SAP, SAS, and AWS delivered it.
excerpt: OpenSearch now supports running in a FIPS 140-3 compliant mode, contributed through a multi-year collaboration between SAP, SAS, and AWS.
draft: true
---

For many organizations, strong cryptography is not a feature to be configured—it is a prerequisite for deployment at all. With OpenSearch 3.6, OpenSearch can run in a FIPS 140-3 compliant mode, using validated cryptography for its security-relevant operations. This post explains what that means, why it matters, and how a multi-year collaboration between SAP, SAS, and AWS delivered it.

## Why FIPS 140-3 matters

US federal agencies, government contractors, and organizations in regulated industries such as finance and healthcare are frequently required to use cryptographic modules that have been formally validated against a federal standard. Without that validation, a search and analytics platform simply cannot be adopted, however capable it may be otherwise.

That standard is FIPS 140-3. Until now, teams with a FIPS requirement had to work around OpenSearch or choose a different product. They no longer have to. Running OpenSearch in a FIPS 140-3 compliant mode opens the door to public-sector and regulated deployments that were previously out of reach, and it signals that OpenSearch is ready for environments with the most demanding compliance requirements.

A common approach is to place a FIPS-validated TLS-terminating proxy in front of OpenSearch and encrypt data at rest with a validated module. That is a sound pattern, and for deployments whose compliance boundary is drawn at that edge it can be enough. But a cluster does cryptographic work internally, too: it hashes credentials, signs tokens, and encrypts node-to-node traffic—none of which a front proxy ever sees. Native FIPS mode brings that work inside the validated boundary, so OpenSearch itself becomes the compliant component rather than just the front door. The two approaches complement each other; native support simply closes the gap that a proxy alone leaves behind.

## What is FIPS 140-3?

The Federal Information Processing Standards (FIPS) are a set of publicly announced standards developed by the US National Institute of Standards and Technology (NIST). FIPS 140-3 is the current standard governing *cryptographic modules*—the components that perform encryption, hashing, key management, and random number generation.

A validated module has been independently tested and certified to implement approved algorithms correctly and to protect keys and other sensitive material. FIPS 140-3 is the successor to FIPS 140-2: NIST no longer accepts new modules for 140-2 validation, so 140-3 is the active program for anyone certifying cryptography today.

In practice, running "in FIPS mode" means two things: every cryptographic operation is performed by a validated module, and the system is restricted to the algorithms and key sizes that the standard approves. Weaker or non-approved primitives are simply not available. For OpenSearch, achieving this meant auditing every place cryptography is used and making sure each one can operate entirely within an approved boundary. (The original community requests and the first proposal referred to FIPS 140-2, which was current at the time; over the life of the project the target moved to 140-3, and that is what OpenSearch delivers.)

## How the collaboration came together

FIPS support in OpenSearch is the result of a multi-year effort by SAP, SAS, and AWS, working in the open across several repositories, with contributors who crossed team boundaries to get it done.

**The demand.** Community requests for FIPS compliance go back to the earliest days of the project, with [feature requests](https://github.com/opensearch-project/security/issues/1497) opened as far back as 2020 and 2021. The need was clear—regulated users could not adopt OpenSearch without it—but the work is substantial and cross-cutting, and it went unaddressed for years.

**The foundation.** In late 2023, SAS Institute filed the [founding request for comments](https://github.com/opensearch-project/security/issues/3420) proposing a FIPS enforced mode and laying out a phased plan. SAS then did much of the early, unglamorous groundwork in the Security plugin: replacing non-approved primitives—for example, moving field masking off `BLAKE2b` and switching password hashing from `bcrypt` to `PBKDF2`—and removing hard-coded assumptions about which cryptographic provider was in use. This proved that the Security plugin could operate on approved cryptography at all.

**The plan.** In 2024, SAP contributed a [FIPS 140-3 compliance roadmap](https://github.com/opensearch-project/security/issues/4254) that refocused the effort around the current standard and, importantly, around a goal SAP held from the start: letting an administrator enable FIPS at runtime in a standard distribution, rather than requiring a special build compiled from source. Karsten Schnitter sponsored and coordinated the work on the SAP side, keeping it moving across teams and companies. This became the plan the project actually executed.

**The execution.** SAP took on the deep core work: building the tooling to produce a FIPS distribution, and—the hardest part—making the entire OpenSearch test suite build and run under a FIPS-validated JVM, so that FIPS compliance could be verified continuously rather than assumed. An early attempt to land everything in one large pull request was deliberately abandoned in favor of a sequence of small, reviewable PRs, which is how the work finally merged.

Along the way, the neat division of labor—SAP on core, SAS on the Security plugin—gave way to something more collaborative. When AWS maintainers reviewing the core changes observed that a FIPS dependency cannot be cleanly confined to a single repository (it tends to become a prerequisite everywhere it touches), SAP's scope naturally extended into the Security plugin as well, in coordination with SAS. People followed the problem wherever it led.

**Bringing it home.** AWS maintainers did more than review. They shaped the architecture through that review and then built key pieces of the runtime experience: the build switch that produces FIPS-capable binaries and the administrator-facing environment variable that turns enforcement on. A further step delivered the goal SAP had aimed at from the beginning—making the *default* OpenSearch distribution itself FIPS-capable. Before 3.6, running FIPS meant building a dedicated distribution from source with a special flag; by [shipping the validated Bouncy Castle FIPS libraries in the default distribution](https://github.com/opensearch-project/technical-steering/issues/77)—proposed by AWS's Craig Perkins and worked out in the open—3.6 lets operators turn FIPS on at runtime with no custom build.

More recently, the remaining enforced-mode work was driven toward completion by contributors from across the project. Ahead of OpenSearchCon Europe 2026, the collaborators planned and agreed to use the conference to align on the final steps, and they gathered there to settle what remained and how to finish it.

This is what the OpenSearch Project's community model is meant to look like: a feature too large for any single company, built together in the open, with maintainers and contributors from different organizations reviewing each other's work and picking up whatever needed doing.

## How it works

Making OpenSearch FIPS-compliant was less about adding a feature and more about disciplined substitution across the whole codebase. Some of the key changes:

- **Validated cryptography everywhere.** OpenSearch bundles the [Bouncy Castle FIPS provider (`BC-FJA`)](https://www.bouncycastle.org/documentation/documentation-java/), a FIPS 140-3 validated cryptographic module. In FIPS mode, OpenSearch runs Bouncy Castle FIPS in *approved-only* mode, which restricts operations to certified algorithms and key sizes and removes the standard providers that are not validated.
- **Approved algorithms and key material.** Non-approved primitives were replaced with approved ones—for example, `PBKDF2` for password hashing and FIPS-approved hashes for field masking. Key and certificate handling was reworked to parse the formats used in practice while staying within the approved boundary.
- **FIPS-compliant keystores.** Only the `BCFKS` and `PKCS#11` keystore and truststore formats are FIPS compliant; the common `JKS` and `PKCS12` formats are not. OpenSearch ships a helper tool to convert an existing JVM truststore to `BCFKS` (or to use a `PKCS#11` store), so operators don't have to do it by hand.
- **Stronger secrets.** FIPS enforces a minimum strength for keystore and key passwords—at least 112 bits, roughly 14 characters. A weaker password fails fast at startup rather than silently weakening the deployment.
- **Continuous verification.** Perhaps the most important change is invisible to users: the entire test suite can build and run under a FIPS JVM, so FIPS compliance is exercised by continuous integration (CI) rather than taken on faith.

In OpenSearch 3.6, the default distribution is FIPS-capable: it ships the validated Bouncy Castle FIPS libraries, so there is no need to build a special distribution from source. Because those libraries are always present, FIPS enforcement is a deliberate, separate choice rather than something that switches on by itself—a cluster administrator opts in explicitly by setting the environment variable `OPENSEARCH_FIPS_MODE=true` when starting OpenSearch. This keeps FIPS available to everyone while remaining off unless it is asked for.

## Getting started

FIPS support is officially available in OpenSearch 3.6. Enabling it is primarily an environment and configuration task; the detailed, up-to-date steps live in the [FIPS configuration documentation](https://docs.opensearch.org/latest/security/configuration/fips/). At a high level:

1. **Run OpenSearch 3.6 or later on a supported JVM.** The default distribution is FIPS-capable and bundles the Bouncy Castle FIPS providers; you need a JVM configured to use them, on a Java version for which the module is certified.
2. **Use FIPS-compliant keystores and truststores.** Convert your stores to `BCFKS`, or use a `PKCS#11` store. The bundled [`opensearch-fips-demo-installer`](https://docs.opensearch.org/latest/security/configuration/fips/) tool can migrate the default JVM truststore for you and write the required settings into `jvm.options`—handy for getting started, though, as its name suggests, review it before relying on it in production.
3. **Use strong passwords.** Keystore and key passwords must meet the 112-bit minimum, or OpenSearch will refuse to start.
4. **Configure the Security plugin for FIPS.** Use [`PBKDF2` for internal user password hashing](https://docs.opensearch.org/latest/security/configuration/fips/) and a FIPS-approved algorithm for field masking instead of the default.
5. **Turn on enforcement.** Start OpenSearch with `OPENSEARCH_FIPS_MODE=true` to run in FIPS-enforced mode.

### What comes next

FIPS support in OpenSearch is real and usable, and work continues. Some items remain in the Security plugin and in integration testing—for example, broadening automated FIPS coverage and closing out the last enforcement details. If FIPS matters to your deployment, now is a great time to try it, file issues, and help shape the finishing touches.

## Special thanks

The core FIPS implementation was carried out on SAP's behalf by **Sternad Software GmbH**—in particular **Iwan Igonin** and **Kai Sternad**—who did much of the demanding work of making OpenSearch build, test, and run under a validated cryptographic module. Thank you for the deep and careful engineering that made this possible.

We would also like to thank:

- The many community members who requested FIPS support over the years and kept the need visible.
- **Terry Quigley** and the **SAS** team, who laid the foundation and were among the first to run FIPS mode in practice and report back what they found.
- **Craig Perkins**, **Andriy Redko**, and the **AWS** maintainers, who reviewed the work and built the runtime support.
- **Nils Bandener**, for helping drive the effort across the finish line.
