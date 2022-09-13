---
layout: post
title:  "Documenting our Security Issue Response Process"
authors:
  - davidlago
date:   2022-09-16 00:00:00 -0700
categories:
  - technical-post
---

Today we are taking the next step in our open source journey by updating our security policy to include a process for how we respond to security issues. In proper open source fashion, we are creating this as a [pull request](https://github.com/opensearch-project/.github/pull/XXX) and we are inviting everyone to take part in the discussion.

Besides making it transparent what the process looks like for responding to these issues, this policy has a significant addition: **the creation of a pre-disclosure list**.

Having a pre-disclosure list (a group of individuals and companies that will be informed of a security issue before it becomes public) is a risk balancing act. If a security issue gets pre-disclosed to too broad of an audience, we risk it becoming public ahead of time. On the other hand, we might be missing out on collaborations to expedite the creation and testing of a fix by not having a mechanism for involving some individuals and companies early, in addition to effectively creating zero-days for all the issues we disclose, leaving everyone scrambling to apply the fixes.

This is just the first version of this process, and we most likely won’t get it right from the start. But with everyone’s help, we will keep iterating on it and advancing the security of our open source project.
