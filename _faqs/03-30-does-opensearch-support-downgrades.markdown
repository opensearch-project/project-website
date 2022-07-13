---
question: Does OpenSearch support version downgrades?
category: Upgrading to OpenSearch
---

OpenSearch does not support direct version downgrades. If your environment must be downgraded, we recommend [using snapshots to create a restore point](https://opensearch.org/docs/latest/opensearch/snapshot-restore/), then restoring the snapshot to a cluster built with the target version.