---
layout: post
title: "My agents told me to enter: an independent builder at OpenSearchCon 2026"
authors:
  - cikizeng
date: 2026-10-01
categories:
  - community
excerpt: Before the Hackathon Winners Showcase, I told the hosts that my own agents had told me the OpenSearch Agent Skills Hackathon was right for me. Here is what happened next, what I heard at OpenSearchCon North America 2026, and what I am taking home.
---

A few minutes before the Hackathon Winners Showcase at OpenSearchCon North America, Lisa Briggs and Bobby Mohammed asked how I had found the OpenSearch Agent Skills Hackathon. I gave them the honest answer: my agents told me this competition was right for me.

I'm Ciki Zeng, an independent builder. I design software with AI agents. I decide what a system should do, where it's allowed to be wrong, and how I'll know when it is. The agents write much of the code, and I check the result. This is my recap of the three days in San Jose, with a 2-minute film about the journey:

{% include youtube-player.html id="ytDECUgTMmM" %}

## How the entry started

One of my agents reads hackathon listings every morning and compares them with what I build. In July it ranked this hackathon first: the challenge was to write agent skills, which I already do every day. Two days later, the same report didn't mention it at all. Nothing had errored. A recommendation that quietly disappears looks exactly like "nothing changed."

That became the theme of my entry, [unclosed](https://github.com/simpleciki/unclosed), an agent skill that reads OpenSearch logs and checks whether an investigation's conclusion has enough evidence behind it. Before it lets a conclusion close, it runs three checks:

1. **Check the premise.** Is the reported anomaly real, or could the time window or the measurement be misleading us?
2. **Track the alternatives.** Within a stated scope, which explanations have evidence, which are ruled out, and which were never checked?
3. **Check the numbers.** Does the explanation account for the size of the change we actually saw?

If something is missing, the report names the evidence it needs next. Closing means the scoped checks were met. It doesn't mean the production problem is fixed, and it doesn't prove causation. The longer story of how it was built, including the tests that proved me wrong, is on [my site](https://cikizeng.com/blog/my-agents-told-me-to-enter).

## Ten minutes on stage

At the Winners Showcase, I didn't start with logs. I started with two products I build, dogfood myself, and test with real users.

In IvyBloom, an adaptive learning system I build, two cards showed the same title, both marked complete, both four out of four. The records said otherwise: one skill was Grade 8 and the other was Grade 5. In another case, an audit had attached a learner's latest score to an earlier attempt, so a 2/4 looked like a 4/4. Nothing crashed. The way we joined the data changed the story. In JumpOnion, my figure-skating jump analysis tool, I've watched AI confidently find fault with a world champion's triple Axel. Drawing pose points on a skater is not a diagnosis.

The line I wanted to leave with the room was this: **before AI explains why, it should show whether what happened is real, and what evidence is still missing.**

## The same habit in other rooms

What surprised me most was how many speakers arrived at the same habit from completely different directions.

**From alert to answer.** "From Alert to Answer: Accelerating Anomaly Investigation with OpenSearch Agent Skills" by Brian Graf and Seema Saharan was about helping agents get from an alert to an answer faster, and it was candid about failure modes and what changes in production. Listening to it, I started to see unclosed less as a standalone skill and more as a possible trust layer: a check that asks what an answer is standing on before it reaches a person.

**Shadow traffic before switching.** Booking.com's migration of its autocomplete search to OpenSearch, presented by Ritz Hemnani and Abdulkadir Dalga, stayed with me most. Before moving users over, they listed every feature the old system had and decided which ones mattered. They mirrored real queries to the new system as shadow traffic, compared its results against the old one, required every daily index to pass a validation check before going live, and moved traffic in slices. One line from their slides: "Optimize for non-inferior business metrics, not 100% technical parity."

I had done a much smaller version of this in JumpOnion. When I changed the pose model, I was afraid of changing results for the families already using it, so I froze the existing outputs first and compared old and new on the same real skating videos before letting the new one in. Booking.com works at a far larger scale, and that is exactly why it's worth learning from early.

**A claim and the evidence.** "Your Agent Is a Distributed System," by Harishankar Menderkar and Sarat Chandra Ventrapragada, made the same point from the agent side. In their [reproducible demo](https://github.com/eilhamv/cfp-opensearch), an agent wrote "remediation complete" on every one of 500 incidents. When they asked the platform itself, 104 of those incidents had never stopped erroring.

Different teams, different stacks, one shared habit: treat "done" as a claim to verify, not a result to believe.

## The unconference

After my talk, I went straight to the unconference that Kris Freedain was hosting and heard other people's ideas and the projects they were building. That small circle was the part of the conference that felt most like a community. On the last morning, two engineers at breakfast told me they rarely see anyone use AI the way I do. I've thought about that sentence a lot since.

## What I'm taking home

Before the conference, I thought this problem was narrow, something I cared about because of mistakes in my own products. Now I think it's one of the most common questions in the building.

I've also started using OpenSearch for my own work. On the last day of the conference, I set up a local OpenSearch instance to search my own build history: the conversations and notes behind everything I've built this year. My next step is to combine OpenSearch with long-term memory for agents, so that what an agent remembers can be searched, traced back to its evidence, and trusted. The trust-layer idea is where I'd like to contribute next, and I'd love to explore it with people who work on investigation workflows every day.

Thank you to Lisa Briggs, Bobby Mohammed, and the Linux Foundation events team for making the Winners Showcase run so smoothly, to Kris for pulling me into the conversation, and to the OpenSearch Project for the hackathon that brought me here. If your team has seen a convincing report with missing evidence behind it, I'd love to hear about it.
