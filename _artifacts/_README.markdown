# How to artifact for OpenSearch

Each artifact is represented by an item in a Jekyll collection

By convention, each release is organized into a sub-folder by minor version.

Artifacts that are independently released (`opensearch-cli`,`data-prepper`, etc.) should be in their own folder.


## Artifact example:
```yaml
---
# `role` controls what section it will appear under in the downloads page
role: cli 
# `artifact_id` groups artifacts together by version
artifact_id: opensearch-cli 
# `version` is the semver version
version: 1.0.0
# `platform` is the identifier for the OS or platform. Should be `linux`, `windows`,`macos`,`freebsd`
platform: linux
# `architecture` should be `arm64`,`x86`,`x64`
architecture: arm64
# `artifact_url` should be the URL which will download the artifact
artifact_url: https://artifacts.opensearch.org/opensearch-clients/opensearch-cli/opensearch-cli-1.0.0-linux-arm64.zip
# `slug` is the name of the HTML file generated for each artifact.
slug: opensearch-cli-1.0.0-linux-arm64
# `category` Used in the URL for the HTML file. should be either `opensearch` or `opendistroforelasticsearch`
category: opensearch
# `type` the artifact type and controls how the download page template. Usually is the same as the `artifact_url` extension, unless it's `docker_hub` or `system-package`
type: zip
# `signature` is the download link to the signature file
signature: https://artifacts.opensearch.org/opensearch-clients/opensearch-cli/opensearch-cli-1.0.0-linux-arm64.zip.sig
# others:
# `link` used for `docker_hub` and `freebsd_package_name`, the page that has information non-artifact
# `freebsd_package_name` the `pkg` name, used in the template only for freebsd

---
```

File names and folders are not used for rendering the site, but are used for organization. Please follow existing patterns (e.g. `opensearch-cli-1.0.0-macos-arm64.markdown`)


## Non-Artifacts
There are things that are included as part of a release that are _not_ considered artifacts:
- Docker Hub links
- Package manager links

As a general rule, if it doesn't change from release to release and isn't hosted by us, it's not an artifact.


## Automation

Included in this directory is the bash script `_v_update.sh`. This script will make a new copy of all the artifact files for an existing version and change the yaml and file names to the new specified version. It is a blunt tool that will create a lot of new files, so use with caution. You will still need to update the corresponding version in `_version`.

Usage:

```shell
./_v_update.sh <directory> <old version> <new version>
```

Example:

```shell
./_v_update.sh opensearch-1.2 1.2.1 1.2.2
```

Reads all the artifact files in `opensearch-1.2` that match version 1.2.1 and converts them to 1.2.2 

Notes:
- This tool will look in subdirectories.
- It needs version 4 of [`yq`](https://mikefarah.gitbook.io/yq/) 