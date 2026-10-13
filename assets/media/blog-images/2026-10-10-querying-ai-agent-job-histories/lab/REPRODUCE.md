# Portable synthetic OpenSearch history lab

Prepared 10 October 2026 GST.

The source and synthetic queries were executed on 10 October 2026 GST. See the [captured result summary](results/raw-summary.json). Documentation and package metadata were updated on 12 October 2026 GST; no new runtime was executed for that update.

Use the [opensearch-v4 archive](opensearch-v4.tar.gz) and [external package pins](package-pins.json). The archive contains 54 files; extract it into a fresh directory to obtain `opensearch-v4/`. The Python code, event fixtures, mappings, queries and image pins are unchanged from the observed run. Only workflow metadata in the expectation files was removed. Package hashes identify the updated documentation as well as those unchanged inputs. Hash verification establishes byte integrity; it does not execute OpenSearch.

Use Linux amd64 with Docker 29.1.3, its containerd image store, cgroup v2 memory/CPU/PID controllers and system Python 3.10.12. The runner enforces that exact Docker release; the image driver is pinned Python 3.12.12-slim. Docker access and network access for exact image/reference downloads are required. The host must already have `vm.max_map_count >= 262144`, hard `nofile >= 65536`, hard process limit >= 4096, available RAM >= 6 GiB, free disk >= 25 GiB, disk use <94%, and >=10,000 free inodes. Any required host setting change belongs to the host owner; this guide does not change it or bypass the guard.

Use a fresh nonsymlink package extraction and unused run roots directly under `/var/tmp` with prefix `technical-blogs-20261009-opensearch-`. Preserve the same actual disk baseline across both runs and previous lab/download work. `docker_used_bytes` is filesystem used bytes at Docker's data root, not `docker system df`'s reclaimable image total. If the owned root is on another device, record `owned_fs_used_bytes` too. Inspect `source/host.py:disk` and `source/runtime_verifier.py:incremental_bytes` to collect matching values. Put those actual integers, collection provenance and GST timestamp in an external baseline JSON. Do not fill it with estimates or reset it between runs.

From inside the fresh extracted `opensearch-v4/`, use the supported bootstrap only:

```sh
set -eu
LAB_ROOT="$PWD"
BOOTSTRAP="$LAB_ROOT/source/trusted_bootstrap.py"
EXECUTION_MANIFEST_SHA256=4befa6b2e100441db1477e6e89d29513fbcdf6e86ad23b9ac98cc85bdd58187d
export PYTHONDONTWRITEBYTECODE=1
printf '%s  %s\n' 575caeea2cc0b6e4ac9d6321f30427cff6bb3066454a664726471ae2e39dc9f5 "$BOOTSTRAP" | sha256sum --check --strict
python3 -I -S -B "$BOOTSTRAP" --package "$LAB_ROOT" --manifest "$LAB_ROOT/execution-manifest.json" --manifest-sha256 "$EXECUTION_MANIFEST_SHA256" --entry package_check -- --package "$LAB_ROOT" --manifest "$LAB_ROOT/execution-manifest.json"
python3 -I -S -B "$BOOTSTRAP" --package "$LAB_ROOT" --manifest "$LAB_ROOT/execution-manifest.json" --manifest-sha256 "$EXECUTION_MANIFEST_SHA256" --entry materialize_references -- --package "$LAB_ROOT"
```

The archive pin is `2349e84c11a3d904276b3da6d8c1701049a0e10a80992a5d1c2ecfeea60e7e32`. Check it independently before extraction. Reference materialization requires absent destinations and exact reference hashes. Do not bypass the bootstrap, import `driver.py` directly, add source files, create bytecode, or derive expected manifest hashes from the tested package.

Offline checks are useful before the live run, but prove checker sensitivity only. Their commands are in the frozen guide: `--entry offline_checks -- --evidence <fresh-path>` and `--entry os17_offline -- --oracle "$LAB_ROOT/amendments/os17/fixture-expectations.json" --evidence <fresh-path>`. Main controls require eight exit-1 rejections; the separate action-retry controls require thirteen. Keep actual exits and diagnostic output.

Run IDs must match `os-20261009-[a-z0-9]{4,16}`, for example `os-20261009-reader01` and `os-20261009-reader02`. The suffix must be unused. After meeting the host requirements and deciding to execute this owned lab, supply actual paths and unused names:

```sh
: "${SHARED_BASELINE:?Actual cumulative baseline JSON path required}"
: "${STAGING_ROOT:?Existing owned nonsymlink staging directory required}"
: "${RUN_ROOT_1:?Absent owned /var/tmp run root required}"
: "${RUN_ROOT_2:?Second absent owned /var/tmp run root required}"
: "${RUN_ID_1:?Fresh run ID required}"
: "${RUN_ID_2:?Second fresh run ID required}"
python3 -I -S -B "$BOOTSTRAP" --package "$LAB_ROOT" --manifest "$LAB_ROOT/execution-manifest.json" --manifest-sha256 "$EXECUTION_MANIFEST_SHA256" --entry runtime -- preflight --root "$STAGING_ROOT" --shared-baseline "$SHARED_BASELINE"
python3 -I -S -B "$BOOTSTRAP" --package "$LAB_ROOT" --manifest "$LAB_ROOT/execution-manifest.json" --manifest-sha256 "$EXECUTION_MANIFEST_SHA256" --entry runtime -- launch --root "$RUN_ROOT_1" --run-id "$RUN_ID_1" --shared-baseline "$SHARED_BASELINE" --execute-authorized
python3 -I -S -B "$BOOTSTRAP" --package "$LAB_ROOT" --manifest "$LAB_ROOT/execution-manifest.json" --manifest-sha256 "$EXECUTION_MANIFEST_SHA256" --entry runtime -- launch --root "$RUN_ROOT_2" --run-id "$RUN_ID_2" --shared-baseline "$SHARED_BASELINE" --execute-authorized
python3 -I -S -B "$BOOTSTRAP" --package "$LAB_ROOT" --manifest "$LAB_ROOT/execution-manifest.json" --manifest-sha256 "$EXECUTION_MANIFEST_SHA256" --entry runtime -- verify-replay --first "$RUN_ROOT_1/runs/$RUN_ID_1/run-binding.json" --second "$RUN_ROOT_2/runs/$RUN_ID_2/run-binding.json" --output "$LAB_ROOT/replay-results.json"
```

`--execute-authorized` expresses the operator's decision to run; the flag is not proof. Stop after a nonzero launch or rejected cleanup. Do not reuse a partly created root. Launch runs the product through an internal network with no published ports. Security/demo configuration is disabled only in this isolated synthetic cluster; this is not an authentication or persistence example. Bootstrap/mmap/disk checks stay enabled, including explicit JVM bootstrap enforcement. Product: OpenSearch 3.9.0, 4 GiB memory+swap, two CPUs, 512 PIDs, 1 GiB heap, 512 MiB data tmpfs; driver: 256 MiB, 0.5 CPU, 128 PIDs. Logs are 10 MiB x3 per container, evidence <=1 GiB, combined incremental disk <=8 GiB. Sampling is every five seconds; stop below 2 GiB available RAM or on a budget breach. Startup is bounded to 180 seconds; suite to 600 seconds afterward. Cleanup retains unrelated resources and removes only recorded owned objects.

There are **17 obligations and 18 live rows per fresh suite** (OS05 has a/b), repeated independently in two suites. The main fixture remains five histories/two tenants/33 events, including the late failure: alpha 27, beta 6. Q01 has nine IDs and page sizes 3/3/3/0. Q02 enumerates six COMPUTE_STARTED buckets in pages of two and uses the returned `after_key`, not the final bucket. OS17 is a separate eight-event action-retry index, with 3/3/2/0 pages and literal documents; it does not make the main corpus 41 events. Both search-after timelines require paused ingestion and reject timeouts, failed shards and non-exact totals. Tenant filters are not authorization. Sequence and times are authored producer data, not distributed ordering or measured ingestion.

Retain raw responses, exact source/image/build identities, each binding, finalization-success records, replay comparison and verified cleanup. An authored ACTION_CONFIRMED event is not an independent external receipt; no model, external tool or actual restart is demonstrated. Offline controls exercise checker logic; the captured query responses provide the observed synthetic results.

## Inspect the retained query responses

The runner executes every article query automatically on its private network. It deletes the owned indexes and cluster before returning, so the completed lab is inspected through saved responses. There is no manual query window or published endpoint.

For your own run, open `$RUN_ROOT_1/runs/$RUN_ID_1/OS17/bundle.json` and the corresponding second-run file. Its `pages` array holds the four requests, HTTP statuses, headers and complete raw response bodies in order. Parse each `raw_body` as JSON, then inspect `hits.hits`; the second page contains sequence5 and the third contains sequence7. Their `action_id` values match. These are recorded synthetic events, not receipts for external effects.

The two observed runs retain their captured bundles: [first run](results/os17-pages-v4a.json) and [second run](results/os17-pages-v4b.json). Their page sizes are3/3/2/0. Byte hashes are in [capture bindings](results/os17-page-bindings.json).
