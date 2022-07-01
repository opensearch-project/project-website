---
layout: fullwidth
primary_title: Release Schedule and Maintenance Policy
title: Release Schedule and Maintenance Policy
---


_Updated July 1, 2022_

[Release Schedule](#release-schedule) &middot; [Maintenance Policy](#maintenance-policy) &middot;

---

 
## Release Schedule ##

For more information on the changes planned for each release, please see the [Project Roadmap](https://github.com/orgs/opensearch-project/projects/1)

|Release Number|Code Freeze Date|Release Date|
| --- | --- | --- |
|2.1|June 30th|July 7th|
|1.3.4|July 8 2022|July 14 2022|
|2.2|August 4th|Aug 11th|
|1.3.5|August 16th|August 23rd|
|2.3|September 7th|September 14th|
|1.3.6|September 30 2022|October 06 2022|
|2.4|November 04 2022|November 10 2022|
|1.3.7|December 1st|December 8th|
|2.5|January 10th, 2023|January 12th 2023|



OpenSearch [follows semver](https://opensearch.org/blog/technical-post/2021/08/what-is-semver/), which means we will only release breaking changes in major versions.  All minor versions are compatible with every other minor version for that major.  For example, 1.2.0 will work with 1.3.2, 1.4.1, etc, but may not work with 2.0.
 
For minor version releases, OpenSearch uses a "release-train" model.  Approximately every six weeks we release a new minor version which includes all the new features and fixes that are ready to go.  Having a set release schedule makes sure OpenSearch is releasing in a predictable way and prevents a backlog of unreleased changes. 

In contrast, OpenSearch releases new major versions only when there are a critical mass of breaking changes (e.g. changes that are incompatible with existing APIs).  These tend to be tied to [Lucene](https://lucene.apache.org/) major version releases, and will be announced in the forums at least 4 weeks prior to the release date.

Please note: Both the roadmap and the release dates reflect intentions rather than firm commitments and may change as we learn more or encounters unexpected issues. If dates do need to change, we will be as transparent as possible, and log all changes in the changelog at the bottom of this page.
 

## Maintenance Policy ##

For OpenSearch and other software in the OpenSearch project, new features and active development always takes place against the newest version. The OpenSearch project follows the semantic versioning specification for assigning version numbers to releases, so you should be able to upgrade to the latest minor version of that same major version of the software without encountering incompatible changes (e.g., 1.1.0 → 1.3.x).

Sometimes an incompatible change is unavoidable. When this happens, the software’s maintainers will increment the major version number (e.g., increment from OpenSearch 1.3.z to OpenSearch 2.0.0). The last minor version of the previous major version of the software will then enter a *maintenance window* (e.g., 1.3.x). During the maintenance window, the software will continue to receive bug fixes and security patches, but no new features. 

The duration of the maintenance window will vary from product to product and release to release. **By default, versions will remain under maintenance until the next major version enters maintenance, or 1 year passes, whichever is longer.** Therefore, at any given time, the current major version and previous major version will both be supported, as well as older major versions that have been in maintenance for less than 12 months. Please note that, maintenance windows are influenced by the support schedules for dependencies the software includes, community input, the scope of the changes introduced by the new version, and estimates for the effort required to continue maintenance of the previous version. 

| Major Version | Latest Minor Version  | Status    | Initial Release   | Maintenance Window Start  | Maintenance Window End    |
| ---   | ---   | ---   | ---   | ---   | ---   |
| 1 | 1.3.x | Maintenance   |7/12/2021  | 5/26/2022 | 12/31/2023    |
| 2  | 2.0.0  | Current	| 5/26/2022  | N/A  | N/A   |


*Note that the length of the maintenance window is an estimated minimum and the project may, at its discretion, extend it _to a later_ date 


## Change Log ##
|Date|Change|Reason|
| --- | --- | --- |
|July 1st| | Initial Version |

<br />

