---
layout: post
title:  "Auto Backport in OpenSearch"
authors: 
  - vachshah
date: 2022-03-01 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "This post provides details on how we navigated backports in OpenSearch and pursued automation."
---

Backporting is a common process in OpenSearch in order to maintain release branches separate from main and to be ready for a release. This blog post talks about how we navigated backports manually in OpenSearch and pursued automation to streamline the process and use it across various repos.

## Motivation

[Backporting](https://github.com/opensearch-project/.github/blob/main/RELEASING.md#backporting) is the process of cherry-picking specific commits from the main branch on to release branches according to semantic versioning. Previously in OpenSearch, to backport commits, developers had to cherry-pick the commits from the main branch on to a release branch which causes manual effort and can lead to missed backports before a release.
In order to alleviate the manual effort, we built a [backport](https://github.com/opensearch-project/OpenSearch/blob/main/.github/workflows/backport.yml) Github Action with custom features to automate the end-to-end process of back-porting.

## Challenges and Learnings

We integrated a backport Github Action which creates a backport pull request automatically when appropriate labels are added to the original pull request. Once the original pull request gets merged, this Github Action will open backport pull request by creating a new branch, cherry-picking the original commit on it and pushing this branch to create a pull request. 

In this blog post I would like to talk about the challenges that came along while integrating auto-backports and the approaches taken to resolve them incrementally.

1. The backport workflow did not have the permissions to create pull requests from a backport branch using the GITHUB_TOKEN. This happened since the GITHUB_TOKEN has read permissions for all scopes unless specified otherwise in the workflow. This was resolved by adding a [`permissions`](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token) key in the workflow file in order to provide the required scope (in this case related to `pull-requests`). Additionally, these updated permissions do not work when used on `pull_request` target events since such events can only get write permissions if the PR is within the source repo; cross-repo PRs do not get write permissions. For this purpose, [`pull_request_target`](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target) event can be used.

2. The original [backport](https://github.com/tibdex/backport) Github Action created backport branches of the format backport-${pullRequestNumber}-to-${base} which conflicted with other branch protection rules. To maintain branch permissions for such custom branches, we ended up adding a [custom branch name](https://github.com/VachaShah/backport#features) feature on the Github Action which allows passing a branch name prefix as an input, so if the branch name prefix passed is `backport/backport-${pullRequestNumber}`, the workflow will create a branch named `backport/backport-${pullRequestNumber}-to-${base}` for auto-backports.
 
3. For pull requests generated automatically for backports, it is also necessary to have all the required CI workflows running on them similar to a normal pull request. This helps validate the backport pull requests against release branches preventing an incompatible merge. However, according to Github's [documentation](https://docs.github.com/en/actions/using-workflows/triggering-a-workflow#triggering-a-workflow-from-a-workflow), when an action in a workflow is performed using the `GITHUB_TOKEN`, it cannot trigger a new workflow run. This means that when the backport Github Action runs on the original pull request and creates a backport pull request as a result of the workflow, CI workflows cannot be triggered on such pull requests. To solve this problem, we created a simple Github App with required permissions so it can work with the backport workflow to create backport pull requests instead of using the `GITHUB_TOKEN`.

4. The branches created by the backport workflow to open backport pull requests are opened against the repository. Once the pull request is merged, such branches are left over and need to be deleted manually. To resolve this problem and make the process end-to-end automated, we wanted to incorporate a feature where the source branch of the backport pull request is auto deleted after the pull request is merged. This helps to maintain branches efficiently on the repo and allows the backport workflow to clean up after itself. We have added an [auto delete](https://github.com/opensearch-project/OpenSearch/blob/main/.github/workflows/delete_backport_branch.yml) workflow to the release branches which can clean up the auto backport branches after the backport pull requests are merged.

## Current Features

The current state of auto-backport after the learnings is:

1. Auto-backports are triggered by labelling a [pull request](https://github.com/opensearch-project/OpenSearch/pull/2094) with a backport label of pattern `backport <release-branch>`. Once this pull request is merged and labelled, the auto-backport workflow can run to generate a [backport pull request](https://github.com/opensearch-project/OpenSearch/pull/2106).
2. A Github App is used to create backport pull requests so that CI workflows can trigger on such pull requests.
3. The backport branches from such pull requests are deleted automatically once the backport pull request is merged.

![Figure 1: Backport automation]({{ site.baseurl }}/assets/media/blog-images/2022-03-01-auto-backport-in-opensearch/backport-automation.png){: .img-fluid }

## Closing

These type of automation processes help us get to releases faster with minimum friction. Through this blog, we want to shed light on how we navigated through the waters to adopt backport automation tailored to our purpose and also share our learnings with the community. We hope this blog post helps other opensource projects in adding such automations. We would love to get your feedback and see what you think about these kinds of automations.
