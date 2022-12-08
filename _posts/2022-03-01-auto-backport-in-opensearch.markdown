---
layout: post
title:  "Auto Backport in OpenSearch"
authors: 
  - vachshah
date: 2022-03-04 01:01:01 -0700
categories: 
  - technical-post
twittercard:
  description: "This post provides details on how we navigated backports in OpenSearch and pursued automation."
redirect_from: "/blog/technical-post/2022/03/auto-backport-in-opensearch/"
---

Backporting is a common process in OpenSearch in order to maintain release branches separate from main and to be ready for a release. This blog post talks about how the team navigated backports manually in OpenSearch and pursued automation to streamline the process and use it across various repos.

## Motivation

[Backporting](https://github.com/opensearch-project/.github/blob/main/RELEASING.md#backporting) is the process of cherry-picking specific commits from the main branch on to release branches according to semantic versioning. Previously in OpenSearch, to backport commits, developers had to cherry-pick the commits from the main branch on to a release branch which causes manual effort and can lead to missed backports before a release.

In order to alleviate the manual effort, the team built a [backport](https://github.com/opensearch-project/OpenSearch/blob/main/.github/workflows/backport.yml) GitHub Action with custom features to automate the end-to-end process of backporting.

## Challenges and Learnings

The backport GitHub Action creates a backport pull request (PR) automatically when appropriate labels are added to the original PR. Upon merging of the original PR, the GitHub Action will open backport PR by creating a new branch, cherry-picking the original commit on it and pushing this branch to create a PR. 

In this blog post I would like to talk about the challenges that came along while integrating auto-backports and the approaches taken to resolve them incrementally.

1. The backport workflow did not have the permissions to create PRs from a backport branch using the `GITHUB_TOKEN`. This happened since the `GITHUB_TOKEN` has read permissions for all scopes unless specified otherwise in the workflow. This was resolved by adding a [`permissions`](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token) key in the workflow file in order to provide the required scope (in this case related to `pull-requests`). Additionally, these updated permissions do not work when used on `pull_request` target events since such events can only get write permissions if the PR is within the source repo; cross-repo PRs do not get write permissions. For this purpose, [`pull_request_target`](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target) event can be used.

2. The original [backport](https://github.com/tibdex/backport) GitHub Action created backport branches of the format `backport-${pullRequestNumber}-to-${base}` which conflicted with other branch protection rules. Using the custom branch name feature on the GitHub Action allows to maintain the correct permissions for custom branches on the repo. As an example, if the branch name prefix passed is `backport/backport-${pullRequestNumber}`, the workflow will create a branch named `backport/backport-${pullRequestNumber}-to-${base}` for the auto-backport.
 
3. For PRs generated automatically for backports, it is necessary to have all the required continuous integration (CI) workflows running just as a normal PR. This helps validate the backport PRs against release branches preventing an incompatible merge. However, according to GitHub's [documentation](https://docs.github.com/en/actions/using-workflows/triggering-a-workflow#triggering-a-workflow-from-a-workflow), when an action in a workflow is performed using the `GITHUB_TOKEN`, it cannot trigger a new workflow run. This means that when the backport GitHub Action runs on the original PR and creates a backport PR from the workflow, another workflows cannot be triggered. Creating a simple GitHub App with the required permissions solved this problem by allowing it to make the backport PRs instead of using the `GITHUB_TOKEN`.

4. The branches created by the backport workflow are opened against the repository. Once the backport PR is merged, such branches are left over and need to be deleted manually from the repo. Incorporating functionality where the source branch of the backport PR is auto deleted after the it is merged would make the process end-to-end automated. This helps to maintain branches efficiently on the repo and allows the backport workflow to clean up after itself. The [auto delete](https://github.com/opensearch-project/OpenSearch/blob/main/.github/workflows/delete_backport_branch.yml) workflow on the release branches cleans up the auto backport branches after the PRs are merged.

## Current Features

The current state of auto-backport after these learnings is:

1. Auto-backports are triggered by labelling a [PR](https://github.com/opensearch-project/OpenSearch/pull/2094) with a backport label of pattern `backport <release-branch>`. Once this PR is merged and labelled, the auto-backport workflow can run to generate a [backport PR](https://github.com/opensearch-project/OpenSearch/pull/2106).
2. A GitHub App is used to create backport PRs so that CI workflows can trigger on such PRs.
3. The backport branches from such PRs are deleted automatically once the backport PR is merged.

![Figure 1: Backport automation]({{ site.baseurl }}/assets/media/blog-images/2022-03-04-auto-backport-in-opensearch/backport-automation.png){: .img-fluid }

## Closing

These type of automation processes help the project get to releases faster with minimum friction. Through this blog, I wanted to shed some light the how the waters were navigated by the team to adopt backport automation and also share these learnings with the community. I hope this blog post helps other open source projects with similar automation. Your feedback and thoughts on this type of automation is always appreciated.
