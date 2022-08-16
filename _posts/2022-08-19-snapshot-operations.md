---
layout: post
title:  "Snapshot Operations in OpenSearch"
authors:
  - adnapibar
  - kotwanikunal
date:   2022-08-19 00:00:00 -0700
categories:
  - technical-post
---

# Snapshots in OpenSearch

In this post, we elaborate on how snapshots are created, deleted and restored in OpenSearch. A snapshot is a backup taken from a running OpenSearch cluster. In order to take a snapshot we must first register a repository where snapshots will be stored. A repository is an abstraction on top of an underlying storage system and provides higher level APIs for working with snapshots. The snapshot process is incremental, that only changes that are not present in an earlier snapshot are copied into the new snapshot.

There are two communication channels for snapshots between the master and all other nodes

![Channels]({{ site.baseurl }}/assets/media/blog-images/2022-08-19-snapshot-operations/communication-channel.png){: .img-fluid}

1. The master updates the cluster state by adding, removing or altering the contents of its custom entry `[SnapshotsInProgress](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/cluster/SnapshotsInProgress.java)`. All nodes consume the state of the `SnapshotInProgress` and starts or aborts the relevant shard snapshot tasks accordingly.
2. Nodes executing shard snapshot tasks, report either success or failure of their snapshot tasks by submitting a `[UpdateIndexShardSnapshotStatusRequest](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/snapshots/UpdateIndexShardSnapshotStatusRequest.java)` to the master node that updates the snapshot’s entry in the cluster state accordingly.

Snapshots are stored in a repository store. which is abstracted by the interface `[Repository](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/repositories/Repository.java)` . The `[SnapshotsService](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/snapshots/SnapshotsService.java)` is responsible for creating and deleting snapshots whereas the `[RestoreService](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/snapshots/RestoreService.java)` is responsible for restoring the snapshots. In the following sections, we will go through the details to understand how snapshots are created, stored, deleted and restored.

## Snapshot Creation

The `[SnapshotService.createSnapshot](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/snapshots/SnapshotsService.java#L408)` method is called for creating a new snapshot. This method is executed when the clients call the [_snapshot](https://opensearch.org/docs/latest/opensearch/snapshots/snapshot-restore/#take-snapshots) API to create a new snapshot. Only one snapshot creation can be running at a time.

![Creation]({{ site.baseurl }}/assets/media/blog-images/2022-08-19-snapshot-operations/snapshot-creation.png){: .img-fluid}

1. The `SnapshotService` on the master node determines the assignments of primary shards for all indices that are part of the snapshot request. It then creates a `SnapshotsInProgress.Entry` with the `STARTED` state.  Each snapshot `Entry` has a map of `ShardId` to `ShardSnapshotStatus` to keep track of the nodes and the shards they are snapshotting.  Each shard’s status (enum `ShardState`) is set to one of the following,

    * `INIT` - this is the initial state for all shards that have a healthy primary node
    * `WAITING` - primary is initializing at this point
    * `MISSING` - primary for a shard is unassigned

`SnapshotsInProgress` is the container for the snapshots metadata that is part of the cluster state, hence this is updated using a `[ClusterStateUpdateTask](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/cluster/ClusterStateUpdateTask.java)` by the master node.

1. The primary node receives a cluster state changed event, it then executes the snapshot process for the shard with an INIT state.
2. The primary nodes write the the shard's data files to the snapshot's Repository.
3. Once it finishes, the node sends an `UpdateIndexShardSnapshotStatusRequest` to the master with a signal indicating the status of the snapshot process, the master then updates the state of the shard to one of the following

    * `SUCCESS` - the snapshotting of the shard was successful.
    * `FAILED` - Either the shard’s primary has been relocated after the Entry was created or the snapshot process on the primary node failed.

1. The master node then updates the Entry for the snapshot to `SUCCESS` if it all the primary shards’ snapshots were in a completed state (`SUCCESS`, `FAILED` or `MISSING`) . It ends the snapshot process by writing all the metadata to the repository.
2. Finally, the master node removes the `SnapshotsInProgress.Entry` from the cluster state indicating the end of the snapshot creation process.

As mentioned earlier, the `[Repository](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/repositories/Repository.java)` interface provides APIs to work with the snapshots. The abstract class  `[BlobStoreRepository](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/repositories/blobstore/BlobStoreRepository.java)`  provides the base implementation of a repository which implements all common operations of managing the snapshots.  The default shared file system based repository is implemented by the `[FsRepository](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/repositories/fs/FsRepository.java)`. Repositories for other types of storage systems are are provided as plugins.

Underneath, a `BlobStoreRepository` uses a `[BlobStore](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/common/blobstore/BlobStore.java)` , a wrapper on top of a [`BlobContainer`](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/common/blobstore/BlobContainer.java), that provides additional operations such as retrieving stats on the store. Further, the `BlobContainer` interface is an abstraction on top of the underlying storage systems (such as shared file system, AWS S3, Google Cloud Storage, Azure Cloud Storage etc) for managing blob entries where each blob entry is a named group of bytes. The concrete implementations of the `BlobContainer` interface define the CRUD operations on blob entries. For instance,  `FsRepository` uses the  [`FsBlobContainer`](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/common/blobstore/fs/FsBlobContainer.java)  as the file system based implementation of the `BlobContainer`. For other storage systems, specific repository plugins provide the underlying implementations - such as `S3BlobContainer`,   `GoogleCloudStorageBlobContainer`,   `AzureBlobContainer` and `HdfsBlobContainer.`

The below diagram depicts the relationships between `Repository`, `BlobStore` and `BlobContainer`

![Interfaces]({{ site.baseurl }}/assets/media/blog-images/2022-08-19-snapshot-operations/snapshot-interfaces.png){: .img-fluid}

Both master and data nodes can read from and write to a blob store. All metadata related to a snapshot’s scope and health is written by the master node only. Data nodes can only write the blobs for shards they hold as primary. The nodes write the primary shard’s segment files to the repository as well as metadata about all the segment files that the repository stores for the shard.

The `[RepositoryData](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/repositories/RepositoryData.java)`  holds the list of all snapshots as well as the mapping o index name to the repository `IndexId`.  For each shard `i` in a given index its path in the blob store is at  `root/indices/${index-snapshot-uuid}/${i}`.  The following diagram shows the directory structure of the blob store.

![Contents]({{ site.baseurl }}/assets/media/blog-images/2022-08-19-snapshot-operations/blobstore-contents.png){: .img-fluid}

In the shard’s primary data node `[BlobStoreRepository.snapshotShard](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/repositories/blobstore/BlobStoreRepository.java#L2336)` method is executed. The following describes the logic as part of this process,

1. The method takes a Lucene `IndexCommit`  and retrieves all file names as part of the commit
2. Get the `[BlobStoreIndexShardSnapshots](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/index/snapshots/blobstore/BlobStoreIndexShardSnapshots.java)` that contains information about all snapshots for the given shard in repository
3. Compare the files in `IndexCommit` and existing files in the blob store to find out the new segments files to write
4. Build a new `[BlobStoreIndexShardSnapshot](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/index/snapshots/blobstore/BlobStoreIndexShardSnapshot.java)` that  contains a list of all the files referenced by the snapshot as well as some metadata about the snapshot. For each segments file, write it to the blob store with a unique UUID whose mapping to the real segments file is in the `BlobStoreIndexShardSnapshot`
5. Write the `BlobStoreIndexShardSnapshot` data which contains the details of all files in the snapshot
6. Finally write the updated shard metadata `BlobStoreIndexShardSnapshots`


After all primaries have finished writing the necessary segment files to the blob store in the previous step, the master node moves on to finalizing the snapshot by invoking `[Repository.finalizeSnapshot](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/repositories/blobstore/BlobStoreRepository.java#L1369)`

This method executes the following actions in order:

1. Write a blob containing the cluster metadata to the root of the blob store repository at `/meta-${snapshot-uuid}.dat`
2. Write the metadata for each index to a blob in that index's directory at `/indices/${index-snapshot-uuid}/meta-${snapshot-uuid}.dat`
3. Write the `[SnapshotInfo](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/snapshots/SnapshotInfo.java)` blob for the given snapshot to the key `/snap-${snapshot-uuid}.dat` directly under the repository root
4. Write an updated `RepositoryData` blob containing the new snapshot



## Snapshot Deletion

Deletion of a snapshot is either deleting it from the repository or aborting (if in progress) and subsequently deleting it from the repository.

Aborting a snapshot starts by updating the state of the snapshot's `SnapshotsInProgress.Entry` to `ABORTED`.

![Aborted]({{ site.baseurl }}/assets/media/blog-images/2022-08-19-snapshot-operations/snapshot-deletion-aborted.png){: .img-fluid}

1. The snapshot's state change to `ABORTED` in cluster state by the master node.
2. This change in cluster state then is picked up by the `SnapshotShardsService` on all nodes.
3. Those nodes that are assigned a shard snapshot action aborts the process and notify the master. If the shard snapshot action was completed or in the state `FINALIZE` when the abort was registered by the `SnapshotShardsService` then the shard's state is reported to master as `SUCCESS`. Otherwise, it is reported as `FAILED`.
4. Once all the shards are reported to master the `SnapshotsService` on the master finishes the snapshot process and updates the meta data in the repository.
5. Finally, it removes the `SnapshotsInProgress.Entry` from the cluster state.


Deleting snapshots are exclusively executed on the master node

![Deletion]({{ site.baseurl }}/assets/media/blog-images/2022-08-19-snapshot-operations/snapshot-deletion.png){: .img-fluid}

1. Assuming there are no entries in the cluster state's `SnapshotsInProgress`, deleting a snapshot starts by the `SnapshotsService` creating an entry for deleting the snapshot in the cluster state's `[SnapshotDeletionsInProgress](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/cluster/SnapshotDeletionsInProgress.java)`
2. Once the cluster state contains the deletion entry in `SnapshotDeletionsInProgress` the `SnapshotsService` invokes `Repository.deleteSnapshots` for the given snapshot.
3. The `Repository` then removes files associated with the snapshot from the repository store as well as update its meta-data to reflect the deletion of the snapshot.
4. After the deletion of the snapshot's data from the repository finishes, the `SnapshotsService` submits a cluster state update to remove the deletion's entry in `SnapshotDeletionsInProgress` which concludes the process of deleting a snapshot.

In the master node, `[BlobStoreRepository.deleteSnapshots](https://github.com/opensearch-project/OpenSearch/blob/1c787e8e28e04ca7f07ffd47b91fb6ff088d9648/server/src/main/java/org/opensearch/repositories/blobstore/BlobStoreRepository.java#L732)` is executed. Deleting a snapshot runs through the following sequence of steps,

1. Get the current `RepositoryData` from the latest `index-N` blob at the repository data
2. For each index referenced by the snapshot:
    1. Delete the snapshot’s `IndexMetadata` at `/indices/{index-snapshot-uuid}/meta-{snapshot-uuid}`
    2. Go through all shard directories `/indices/{index-snapshot-uuid}/{i}` and
        1. Remove the `BlobStoreIndexShardSnapshot` blob at `/indices/{index-snapshot-uuid}/{i}/snap-{snapshot-uud}.dat`
        2. List all blobs in the shard path `/indices/{index-snapshot-uuid}` and build a new `BlobStoreIndexShardSnapshots` from the remaining `BlobStoreIndexShardSnapshot` blobs in the shard. Afterwards, write it to the next shard generation blob at `/indices/{index-snapshot-uuid}/{i}/index-{uuid}` (The shard's generation is determined from the map of shard generations in the `RepositoryData` in the root `index-{N}` blob of the repository.
        3. Collect all segment blobs (identified by having the data blob prefix __) in the shard directory which are not referenced by the new `BlobStoreIndexShardSnapshots` that has been written in the previous step as well as the previous `index-{uuid}` blob so that it can be deleted at the end of the snapshot delete process.
    3. Write an updated `RepositoryData` blob with the deleted snapshot removed and containing the updated repository generations that changed for the shards affected by the delete.
    4. Delete the global Metadata blob `meta-{snapshot-uuid}.dat` stored directly under the repository root for the snapshot as well as the `SnapshotInfo` blob at `/snap-{snapshot-uuid}.dat.`
    5. Delete all unreferenced blobs previously collected when updating the shard directories. Also, remove any index folders or blobs under the repository root that are not referenced by the new `RepositoryData` written in the previous step.

## Snapshot Restore

The `[RestoreService.restoreSnapshot](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/snapshots/RestoreService.java#L296)` method is used for restoring a snapshot from the repository. This method is executed when the clients call the [_restore](https://opensearch.org/docs/latest/opensearch/snapshots/snapshot-restore/#restore-snapshots) API under a particular snapshot to be restored. Snapshot restore operation is performed in several stages outlined below -

1. The service first performs performs pre-checks to ensure the snapshot exists within the repository and ensures restorability by performing version checks against the snapshot metadata.
2. If the above checks succeed, the service reads additional information about the snapshot and the related metadata for the indices within the snapshot. It also filters the requested indices and performs any rename operation based on the request properties.

    The next stages utilize the cluster state update task (`submitStateUpdateTask`) to perform further restore operations.
3.  For each index from `Step 2`:
    1. There is a check to ensure the snapshot being restored is not currently undergoing a delete operation, in which case, it fails with `ConcurrentSnapshotExecutionException`.
    2. The service ensures that the index is currently either closed or does not exist, in which case it is restored as a new index, else throws `SnapshotRestoreException`
    3. It validates that the number of primary shards and replica shards for the index can be served by the current cluster setup.
    4. This stage then adds in the new routing and metadata entries once the above pre-checks have succeeded for the particular index.
4. After creating all the necessary structures for routing, metadata and the shards - it creates a `RestoreInProgress.Entry` which is added to the cluster state to keep track of the snapshot restore.
    This entry also hosts the individual shard states which can be one of the following -
    1. `INIT`
    2. `STARTED`
    3. `SUCCESS`
    4. `FAILED
        `The shards are recovered using the `[IndexShard.restoreFromRespository](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/index/shard/IndexShard.java#L2262-L2272)` where each shard goes through the above states to be restored from the repository to the assigned node.
        The `RestoreInProgress.Entry ` has a corresponding overall state which is calculated using the individual shards states.
5. Finally the request is routed to `AllocationService` which takes care of allocating the unassigned shards to kick off the shard recovery process.
6. During the shard recovery process, an observer instance of `[RestoreInProgressUpdater](https://github.com/opensearch-project/OpenSearch/blob/main/server/src/main/java/org/opensearch/snapshots/RestoreService.java#L904)` is attached to keep track of the shard states which helps to update the overall progress of snapshot restore. The observer instance contains the logic to update the shard restore status within the `RestoreInProgress.Entry ` based on the current shard recovery status.
7. Finally, once the restore operations for all of the shards are complete , the overall status of `RestoreInProgress.Entry` is updated to reflect a `*SUCCESS*` *or `FAILURE`* status*.* After this update, `RestoreService` calls `*cleanupRestoreState*` ** which removes the `RestoreInProgress.Entry` from the cluster state, concluding the restore process.
