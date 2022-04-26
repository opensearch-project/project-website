# How to version for OpenSearch

Each version is represented by an item in a Jekyll collection. Each version has it's own file and should follow the pattern of `YYYY-MM-DD-opensearch-major.minor.patch.markdown` (e.g. `2022-01-18-opensearch-1.2.4.markdown`)

## `version_sort`

There is a special field in each version file called `version_sort`. This corrects for any unusual sorting brought on by the ASCII-based alphanumeric sorting of the version. Any pre-release version should have a sort order appended with a `-` and a number. Non-pre-release versions should be appended with `-ga`.

So, for example `2.0.0 Relase Candidate 1` would have the `version_sort` of `2.0.0-1` and the GA version of `2.0.0` would be `2.0.0-ga`.


## Automation

Included in this directory is the bash script `_v_update.sh`. This script will create a new version file based off of a previous one and command line arguments. It automatically updates the version and release notes URL. Optionally, it can update individual artifacts. 

Usage:

```shell
./_v_update.sh <source> <new release version> <release date in YYYY-MM-DD> <version sort> [<artifact> <new version>]...
```

Example:

```shell
 ./_v_update.sh ./2021-12-22-opensearch-1.2.3.markdown 1.2.4 "2022-01-18" 1.2.4-ga opensearch 1.2.4 opensearch-dashboards 1.2.1
```

Reads all the version file for `2021-12-22-opensearch-1.2.3.markdown`, makes a copy to `2022-01-18-opensearch-1.2.4.markdown`, updates the release notes and version number. Changes the artifact component version for opensearch to 1.2.4 and opensearch-dashboards to 1.2.1.


Notes:
- This overwrites an existing version file.
- It needs version 4 of [`yq`](https://mikefarah.gitbook.io/yq/) 