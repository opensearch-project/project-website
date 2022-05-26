---
question: Which version of OpenSearch should I use?
category: Upgrading to OpenSearch
---

For OpenSearch and other software in the OpenSearch project, new features and active development always takes place against the newest version. The OpenSearch project follows the [semantic versioning specification](https://opensearch.org/blog/technical-post/2021/08/what-is-semver/) for assigning version numbers to releases, so in most cases you should be able to upgrade to the latest version of any software without encountering incompatible changes.

Sometimes an incompatible change is unavoidable. When this happens, the software’s maintainers will increment the major version number (e.g. increment from OpenSearch 1.y.z to OpenSearch 2.0.0), and the most recent release of the previous major version will be put into maintenance. During the maintenance window, the software will continue to receive bug fixes and security patches, but no new features.

The duration of the maintenance window will vary from product to product and release to release. It will be based on the patching and support schedules for dependencies the software includes, community input, the scope of the changes introduced by the new version, and estimates for the effort required to continue maintenance of the previous version.
