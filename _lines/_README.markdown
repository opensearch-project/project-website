## Release Lines

With the release of 2.0.0-rc, OpenSearch will maintain patches for the 1.x.x line whilst new development will happen in the 2.x.x line. This presents some challenges as users may want to find the latest 1.x.x or 2.x.x line. `project-website` now support the concept of release lines. 

Every new major version will require a file for the _lines_ collection. This short enables release line selection on the version page as well as the `/lines/` pages which give a stable URL listing for releases under a specific major release line.

### Collection format

In the `_lines` folder is the Jekyll collection for each release line. Add a file for each release line.

```
---
major_version: "1" # this identifies and `versions` that match major the `version` in the version file
pretty_version: "1.x" # what is displayed to the user
deprecated: true # optional, will show as deprecated if set to `true`
---

[ optional, write any notes here about the release line - it will show up in the right bar on the /lines/ pages ]

```

