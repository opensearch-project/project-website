---
layout: fullwidth
primary_title: Release Schedule and Maintenance Policy
title: Release Schedule and Maintenance Policy
---


_Updated January 5, 2023_

[Release Schedule](#release-schedule) &middot; [Maintenance Policy](#maintenance-policy)

---

 
## Release Schedule ##

For more information on the changes planned for each release, please see the [Project Roadmap](https://github.com/orgs/opensearch-project/projects/1)

### 2023 ###

Note:  We have not added a major release to the 2023 schedule yet.  If/when we add one, it will replace a minor release in the 2.x line.  See below for criteria for a major releases.

<div class="table-styler"></div>

| Release Number| Code Freeze Date  | Release Date          |
|:--------------|:------------------|:-------------------   |
| 2.5.0         | January 10th      | January 17th          |
| 1.3.8         | January 26th      | February 2nd          |
| 2.6.0         | February 21th     | February 28th         |
| 1.3.9         | March 9th         | March 16th            |
| 2.7.0         | April 11th        | April 18th            |
| 1.3.10        | May 11th          | May 18th              |
| 2.8.0         | May 30th          | June 6th              |
| 1.3.11        | June 22nd         | June 29th             |
| 2.9.0         | July 11th         | July 18th             |
| 1.3.12        | August 3rd        | August 10th           |
| 2.10.0        | August 22nd       | August 29th           |
| 1.3.13        | September 14th    | September 21st        |
| 2.11.0        | October 10th      | October 17th          |
| 1.3.14        | November 9th      | November 16th         |
| 2.12.0        | November 30th     | December 7th          |

OpenSearch [follows semver](https://opensearch.org/blog/technical-post/2021/08/what-is-semver/), which means we will only release breaking changes in major versions.  All minor versions are compatible with every other minor version for that major.  For example, 1.2.0 will work with 1.3.2, 1.4.1, etc, but may not work with 2.0.
 
For minor version releases, OpenSearch uses a "release-train" model.  Approximately every six weeks we release a new minor version which includes all the new features and fixes that are ready to go.  Having a set release schedule makes sure OpenSearch is releasing in a predictable way and prevents a backlog of unreleased changes. 

In contrast, OpenSearch releases new major versions only when there are a critical mass of breaking changes (e.g. changes that are incompatible with existing APIs).  These tend to be tied to [Lucene](https://lucene.apache.org/) major version releases, and will be announced in the forums at least 4 weeks prior to the release date.

Please note: Both the roadmap and the release dates reflect intentions rather than firm commitments and may change as we learn more or encounters unexpected issues. If dates do need to change, we will be as transparent as possible, and log all changes in the changelog at the bottom of this page.
 

## Maintenance Policy ##

For OpenSearch and other software in the OpenSearch project, new features and active development always takes place against the newest version. The OpenSearch project follows the semantic versioning specification for assigning version numbers to releases, so you should be able to upgrade to the latest minor version of that same major version of the software without encountering incompatible changes (e.g., 1.1.0 → 1.3.x).

Sometimes an incompatible change is unavoidable. When this happens, the software’s maintainers will increment the major version number (e.g., increment from OpenSearch 1.3.z to OpenSearch 2.0.0). The last minor version of the previous major version of the software will then enter a *maintenance window* (e.g., 1.3.x). During the maintenance window, the software will continue to receive bug fixes and security patches, but no new features.

We follow [OpenSSF's best practices for patching publicly known vulnerabilities](https://bestpractices.coreinfrastructure.org/en/criteria/0?details=true&rationale=true#0.vulnerabilities_fixed_60_days) and we make sure that there are no unpatched vulnerabilities of medium or higher severity that have been publicly known for more than 60 days in our actively maintained versions.

The duration of the maintenance window will vary from product to product and release to release. **By default, versions will remain under maintenance until the next major version enters maintenance, or 1 year passes, whichever is longer.** Therefore, at any given time, the current major version and previous major version will both be supported, as well as older major versions that have been in maintenance for less than 12 months. Please note that, maintenance windows are influenced by the support schedules for dependencies the software includes, community input, the scope of the changes introduced by the new version, and estimates for the effort required to continue maintenance of the previous version. 

The software maintainers will not back-port fixes or features to versions outside of the maintenance window. That said, PRs with said back-ports are welcome and will follow the project’s [review process](https://github.com/opensearch-project/OpenSearch/blob/main/CONTRIBUTING.md#review-process). No new releases will result from these changes, but interested parties can [create their own distribution](https://github.com/opensearch-project/opensearch-build#building-and-testing-an-opensearch-distribution) from the updated source after the PRs are merged.

<div class="table-styler"></div>

| Major Version | Latest Minor Version |   Status    | Initial Release | Maintenance Window Start | Maintenance Window End |
|:--------------|:---------------------|:-----------:|:---------------:|:------------------------:|:----------------------:|
| 1             | 1.3.x                | Maintenance |  July 12, 2021  |       May 26, 2022       |   December 31, 2023    |
| 2             | 2.0.0                |   Current   |  May 26, 2022   |           N/A            |          N/A           |

*Note that the length of the maintenance window is an estimated minimum and the project may, at its discretion, extend it _to a later_ date 

## Release History ##

### 2022 ###

<div class="table-styler"></div>

| Release Number | Code Freeze Date   | Release Date       |
|:---------------|:-------------------|:-------------------|
| 2.1            | June 30, 2022      | July 7, 2022       |
| 1.3.4          | July 8, 2022       | July 14, 2022      |
| 2.2            | August 4, 2022     | August 11, 2022    |
| 1.3.5          | August 16, 2022    | September 1, 2022  |
| 2.2.1          | August 19, 2022    | September 1, 2022  |
| 2.3            | September 7, 2022  | September 14, 2022 |
| 1.3.6          | September 30, 2022 | October 6, 2022    |
| 2.4            | November 8, 2022   | November 15, 2022  |
| 1.3.7          | December 6, 2022   | December 13, 2022  |

## Change Log ##

<div class="table-styler"></div>

| Date         | Change | Reason          |
|:-------------|:-------|:----------------|
| July 1, 2022 |        | Initial Version |
|October 20,2022 |   Increased time between 2.5 code freeze and release | 7 days is standard, and there were only 2 days for 2.5 | 
|October 20,2022 | Added Initial 2023 schedule|Current schedule was running out|

<br>

