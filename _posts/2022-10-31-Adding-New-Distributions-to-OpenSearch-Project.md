---
layout: post
title:  "Adding new distributions to the OpenSearch Project"
authors: 
  - zhujiaxiang
date: 2022-10-31 01:01:01 -0700
categories: 
  - community
redirect_from: "/blog/community/2022/10/Adding-New-Distributions-to-OpenSearch-Project/"
---

Starting with OpenSearch version 1.3.2 for 1.x, and 2.0.0 for 2.x, OpenSearch has expanded its artifacts into multiple distributions, including `TAR`, `Docker`, and `RPM`. Looking back, it has been a challenging and exciting journey to get here. 

With `TAR` as the initial distribution, we were able to wrap the archive into a container as part of the `Docker` release and then expand into multiple architectures, including `x64` and `arm64`. Development of other distributions was delayed because the fundamental code base involved much hard coding to extend it.

OpenSearch continually improves. The community has asked for an `RPM` package, as it is an easy way for LINUX users to deploy, run, and test OpenSearch and OpenSearch Dashboards clusters without complex manual setup. We see the demands and benefits of this new distribution and have prioritized its implementation. This effort led to a two-month-long project involving overhauling code and carrying out modularization activities and testing to advance the `RPM` distribution.

As the lead engineer on the `RPM` project, I would like to share the steps, processes, and results for adding new distribution(s) with the community. I hope you find this information useful in contributing to the code to add new distributions in the future.


## Getting started

The [opensearch-build](https://github.com/opensearch-project/opensearch-build) repository (repo) is the centerpiece of artifact generation for the OpenSearch Project. Most automation and pipelines run the code of this repo. To answer `where to start` the implementation of a new distribution (`RPM` for the purpose in this blog), we need to understand the workflow in the opensearch-build repo.

The OpenSearch Project’s final release artifacts (non-SNAPSHOT) have two formats: with plugins (normal format) and without plugins (min format, only for TAR). This naturally separates OpenSearch into two different parts: the OpenSearch engine and the related plugins. The engine is based on the main [OpenSearch](https://github.com/opensearch-project/OpenSearch) repository. The related plugins are in their own repositories, such as [machine learning plugin](https://github.com/opensearch-project/ml-commons), [index management plugin](https://github.com/opensearch-project/index-management), [sql plugin](https://github.com/opensearch-project/sql), and many more.

Three stages are involved in generating OpenSearch artifacts: `Build`, `Assemble`, and `Test`.

In the `build` stage, you first separately compile the source code for the OpenSearch engine and related plugins. In this stage, the OpenSearch engine and related plugins will run their corresponding build scripts and generate artifacts based on the platform and distribution format you passed through. You will receive a min artifact of the engine and a zip format of each plugin. The plugins zips then will be installed onto the OpenSearch engine and repackaged into the final products in the `assemble` stage. These products then will be pushed to the object storage staging bucket and, once completed, will be validated (the `test` stage) and then promoted to the object storage production bucket for release.

**Example: Directory structure/tree list of opensearch-build repository `src` directory**

```
opensearch-build/src
├── assemble_workflow
├── build_workflow
├── checkout_workflow
├── ci_workflow
├── git
├── jenkins
├── manifests
├── manifests_workflow
├── paths
├── run_assemble.py
├── run_build.py
├── run_bwc_test.py
├── run_checkout.py
├── run_ci.py
├── run_integ_test.py
├── run_manifests.py
├── run_perf_test.py
├── run_sign.py
├── sign_workflow
├── system
└── test_workflow
```

The corresponding directories, `build_workflow`, `assemble_workflow`, and `test_workflow`, contain the code for the `build`, `assemble`, `test` stages, respectively. In this blog post, we focus on the `build` and `assemble` stages because they are crucial to implementing a new OpenSearch distribution.

While we are using Jenkins to execute the opensearch-build repo code for automated distribution builds, this blog post doesn’t go into depth on that topic; See [OpenSearch automated build system is now live](https://opensearch.org/blog/community/2022/10/public-jenkins/) for more information. In this blog post, we focus on running the `build` and `assemble` code in a local environment with the necessary changes. 

**Example: Simplified flow to generate artifacts on Jenkins**
<img src="/assets/media/blog-images/2022-10-31-adding-new-distributions-in-opensearch-project/jenkins_pipeline_flowchart.png" alt="Jenkins Pipeliens Flowchart"/>{: .img-fluid }
As shown in the figure above, after contributors commit their code or merge pull requests (PRs) in the [opensearch-project](https://github.com/opensearch-project) repo, the pipelines on [Public Jenkins](https://build.ci.opensearch.org/) will be triggered. From there, `build_workflow`, `assemble_workflow`, and `test_workflow` will be run sequentially, and then the final products will be promoted to the object storage production bucket and made available publicly at `artifacts.opensearch.org`.

## How to run build_workflow

A common question asked during the `build_workflow` is “How do we run it?”. To answer that question, it’s necessary to understand what available parameters we have access to in order to control the output.

`Older version of opensearch-build/src/build_workflow/README.md before we add RPM`

```
The following parameters are available in `build.sh`.

| Name                    | Description                                     |
|-------------------------|-------------------------------------------------|
| -s, --snapshot          | Build a snapshot instead of a release artifact. |
| -a, --architecture      | Specify architecture to build.                  |
| -p, --platform          | Specify platform to build.                      |
| --component [name ...]  | Rebuild a subset of components by name.         |
| --keep                  | Do not delete the temporary working directory.  |
| -l, --lock              | Generate a stable reference manifest.           |
| -v, --verbose           | Show more verbose output.                       |

```

The figure above shows the parameters available in `build_workflow` before `RPM` is implemented. There is no `--distribution` parameter, as the `--platform` parameter is used to hardcode the distribution type. Initially, it was assumed that if `platform=linux`, then `distribution=tar`.

Let’s now look at the commands in `build_workflow`. First, clone the [opensearch-build](https://github.com/opensearch-project/opensearch-build) repo and move to its root directory, and then use the following command to build artifacts for the 1.3.2 version tarball as an example. Note that we specify the component to be `OpenSearch` only for the purpose of this blog post. All the components in input manifest file [`opensearch-1.3.2.yml`](https://github.com/opensearch-project/opensearch-build/tree/1.3.2/manifests/1.3.2/opensearch-1.3.2.yml) will be compiled by default, unless you specify otherwise.

```bash
# More information on the commands can be found in README.md of each workflow directory

./build.sh manifests/1.3.2/opensearch-1.3.2.yml --component OpenSearch -p <> -a <> ......
```


Next, we need to add a new parameter to handle the different distributions.

```
| -d, --distribution      | Specify distribution to build, default is `tar`. |
```

When running `./build.sh`, it runs `./run.sh` internally to check dependencies on python/pip, which then runs `src/run_build.py`. Note that `src/run_build.py` is the entry point to `build_workflow` and starts the building process, including handling the user-defined parameters (see [run_build.py](https://github.com/opensearch-project/opensearch-build/blob/1.3.2/src/run_build.py)).

```python
from build_workflow.build_args import BuildArgs
......
args = BuildArgs()
```

Next, you add the following code in [src/build_workflow/build_args.py](https://github.com/opensearch-project/opensearch-build/pull/1629/files#diff-f5a380768626613f257a019bff13f8aec914e2b2983cea9d7a4552436eba4a45) using the `argparse` module.

```python
# tar and zip already existed prior to our change
# we will keep them so that olded functions are not broken

SUPPORTED_DISTRIBUTIONS = ["tar", "zip", "rpm"]
......
parser.add_argument(
    "-d",
    "--distribution",
    type=str,
    choices=self.SUPPORTED_DISTRIBUTIONS,
    help="Distribution to build.",
    default=None,
    dest="distribution"
)
```

Other files will need updates to support this new parameter. Examples include [src/build_workflow/build_target.py](https://github.com/opensearch-project/opensearch-build/pull/1629/files#diff-22bbfc8727ab963ed470460b1996e12fbb9974a4caafb113fd2319ffa08a0a46) and [src/run_build.py](https://github.com/opensearch-project/opensearch-build/pull/1629/files#diff-db6a1b8175460e03234674e4c8951029102a373968c4f6cc87e01b17301c2ea8).

When running the `build_workflow`, you use an input manifest file (for this blog post, it's `manifest/1.3.2/opensearch-1.3.2.yml`). This file consists of the components you want to build (the OpenSearch engine and related plugins). To learn more about the manifest files, read the code in [src/manifests](https://github.com/opensearch-project/opensearch-build/tree/1.3.2/src/manifests) for more information. Two other manifest files (both named `manifest.yml`) are generated after `build_workflow` and `assemble_workflow` to record the results. The two `manifest.yml` files are referred to as “build manifest” and “bundle manifest”. Sometimes, “bundle manifest” is also referred to as “dist manifest”. 

To add the distribution key-value pair in the build manifest so that the `assemble_workflow` can use the build manifest to assemble the actual artifact in the given distribution format, you update [src/build_workflow/build_recorder.py](https://github.com/opensearch-project/opensearch-build/pull/1629/files#diff-124059c5fa06b48851cc78f9260a851e37dec9dbbb3e9ea7cde945ad7b159c75) and [src/manifests/build_manifest.py](https://github.com/opensearch-project/opensearch-build/pull/1629/files#diff-728703e829193efc4033a1975aee498a8752fcd2999254326c08865a4af19992).

In `build_recorder.py`, you define the default value `distribution` as `tar`:

```python
 self.data["build"]["distribution"] = target.distribution if target.distribution else "tar"
```

In `build_manifest.py`, `distribution` is `None` so that the older `manifest.yml` files from previous releases without the `distribution` key-value pair are compatible with the new code:

```python
 self.distribution: str = data.get('distribution', None)
```

After the above steps are complete, you are ready to craft the build scripts. First, you will focus on [src/build_workflow/builder_from_source.py](https://github.com/opensearch-project/opensearch-build/pull/1629/files#diff-e4f0b9f43bd4f3a5d5ca99e4ba9e7f38544f1078d2687d9ce5ae973df896e9ff). This file will call a subprocess that runs a shell script returned by the `ScriptFinder` function. The `distribution` value is `None` if related key is not found in input manifest, and you add a filter around the list of commands so that `-d` parameter is not called if `distribution` is `None`.

```python
build_script = ScriptFinder.find_build_script(self.target.name, self.component.name, self.git_repo.working_directory)
 
build_command = " ".join(
    filter(
        None,
        [
            "bash",
            build_script,
            f"-v {self.target.version}",
            f"-p {self.target.platform}",
            f"-a {self.target.architecture}",
            f"-d {self.target.distribution}" if self.target.distribution else None,
            f"-s {str(self.target.snapshot).lower()}",
            f"-o {self.output_path}",
        ]
    )
)
```

The logic of `ScriptFinder.find_build_script` is in [src/paths/script_finder.py](https://github.com/opensearch-project/opensearch-build/blob/1.3.2/src/paths/script_finder.py#L57-L70), which would allocate a build script named `build.sh` (this script has the same name as the one in the root directory of the opensearch-build repository but contains very different content and is used for component-specific build activity). This script can be found in one of the following paths:

1. The opensearch-build repository `scripts/components/<Component Name>/build.sh`
2. The component’s own repository root path `build.sh`
3. The component’s own repository `scripts/build.sh`


For the [OpenSearch engine](https://github.com/opensearch-project/OpenSearch), because a [scripts/components/OpenSearch/build.sh](https://github.com/opensearch-project/opensearch-build/pull/1629/files#diff-004d8135f0e1267ff669721dc64b44f84729dc6fe871c6c2ef02eb9d1e04959d) script exists in the opensearch-build repo, that script takes precedence and is returned by the `ScriptFinder` function. You now have confirmation that `builder_from_source.py` sends all the parameters from `opensearch-build/build.sh` (root build.sh) to `scripts/components/OpenSearch/build.sh` (component build.sh).

For [scripts/components/OpenSearch/build.sh](https://github.com/opensearch-project/opensearch-build/pull/1629/files#diff-004d8135f0e1267ff669721dc64b44f84729dc6fe871c6c2ef02eb9d1e04959d), you add `distribution` as part of the variables and change how the corresponding Gradle task is called. In the OpenSearch engine, you use Gradle to compile the Java code into an artifact and component build.sh uses the `platform` value to decide the Gradle task. You now add additional conditions to set the format for the final artifacts: `PLATFORM`, `DISTRIBUTION`, and `ARCHITECTURE`.

```bash
case $PLATFORM-$DISTRIBUTION-$ARCHITECTURE in
    linux-tar-x64)
        PACKAGE="tar"
        EXT="tar.gz"
        TYPE="archives"
        TARGET="$PLATFORM-$PACKAGE"
        QUALIFIER="$PLATFORM-x64"
        ;;
......

    linux-rpm-x64)
        PACKAGE="rpm"
        EXT="rpm"
        TYPE="packages"
        TARGET="rpm"
        QUALIFIER="x86_64"
        ;;
......

./gradlew :distribution:$TYPE:$TARGET:assemble -Dbuild.snapshot=$SNAPSHOT
```

The following command is called to run the proper Gradle task to build the OpenSearch engine `RPM` distribution on a LINUX host with x64 architecture.

```bash
./gradlew :distribution:packages:rpm:assemble -Dbuild.snapshot=$SNAPSHOT
```


Once execution completes, you will find the following directory structure in the `RPM` directory for the opensearch-build repo root directory. If you want to learn more about implementing the `RPM` directory, see [this GitHub PR](https://github.com/opensearch-project/opensearch-build/pull/1807).

```
opensearch-build/rpm
└── builds
    └── opensearch
        ├── core-plugins
        ├── dist
        │   └── opensearch-min-1.3.2.x86_64.rpm
        ├── manifest.yml
        └── plugins

......
```


Congratulations! You have successfully implemented the `build` of `RPM`.

The Python code can call the component build.sh and pass the `distribution` value so that the proper Gradle task is selected. After compilation, you get an OpenSearch engine min RPM as the artifact and a build manifest in `builds/opensearch/dist/manifest.yml` to pass on in `assemble_workflow`. If you specify more components in `--component` or leave it empty by default, you should see other plugins being compiled similarly in the `builds/opensearch/plugins` directory. For plugins in the OpenSearch engine repo, they are in the `core-plugins` directory because they are part of the OpenSearch engine code base.

Now that you have the necessary artifacts to produce final products, let’s move on to next stage: `assemble_workflow`. 


## How to run assemble_workflow

In `build_workflow`, you learned that OpenSearch artifacts are generated by calling the `root build.sh` and `component build.sh` scripts as they interact with Gradle tasks (OpenSearch Dashboards is similar but interacts with Yarn). To combine or bundle the artifacts into a final product, you need to add more functions in `assemble_workflow`.

You can use the command below to start the assemble process, as information in `build_workflow` is saved in build `manifest.yml` and we can pass the YAML file as the input.

```bash
# More parameters can be found in the README

./assemble.sh rpm/builds/opensearch/manifest.yml
```

Similar to `build_workflow`, several file changes are required to support the new `distribution` parameter in `assemble_workflow`,  such as [src/manifests/bundle_manifest.py](https://github.com/opensearch-project/opensearch-build/pull/1659/files#diff-8b97bcb19b01a2a0ed56bf0c59749b05bc42ca477be40ac20875bc8eaed0c16d).

```python
self.distribution: str = data.get('distribution', None)
```

The `distribution` value from build `manifest.yml` is retrieved by [src/assemble_workflow/bundle_recorder.py](https://github.com/opensearch-project/opensearch-build/pull/1659/files#diff-a742a2a190bd469d6c4b14d13560d969a43fb51389cbd5a959b1f8805ca8a4e2) so that you can use it in the `assemble_workflow`.

```python
self.distribution = build.distribution
```

Next, you need to understand the file structure. Unlike `build_workflow`, where everything is build related, `assemble_workflow` is separated into bundle and dist. “Bundle” controls the general functions of assemble to create a bundle of the OpenSearch engine and related plugins. “Dist” contains specific business logic for different types of distribution to repackage. For more information about the relationship between bundle and dist, see [Assemble Artifacts Based on Distribution Not File Extension](https://github.com/opensearch-project/opensearch-build/pull/1659/files#diff-52d601c8af5bd5f8c66790da6f0e84de498460c18a30989e80634b33aba688c3).

Before you implement the `RPM` distribution, you need to clean up the existing code to support older distributions such as `Tar` and `Zip`. To do this, remove the `from_path` function in [src/assemble_workflow/dist.py](https://github.com/opensearch-project/opensearch-build/pull/1659/files#diff-b6de2321e4e1b16c1d5c6a3c6c4ef51bb2a5a3473f116500a9f859e18f4c7d0a), as it hardcodes the distribution type based on the file extension.

```diff
You need to remove all of these old logic

- @classmethod
- def from_path(cls, name: str, path: str, min_path: str) -> 'Dist':
-     ext = os.path.splitext(path)[1]
-     if ext == ".gz":
-         return DistTar(name, path, min_path)
-     elif ext == ".zip":
-         return DistZip(name, path, min_path)
-     else:
-         raise ValueError(f'Invalid min "dist" extension in input artifacts: {ext} ({path}).')
```

You now have created a new file, [src/assemble_workflow/dists.py](https://github.com/opensearch-project/opensearch-build/pull/1659/files#diff-9d09f47256a1ba3eb99c43c336833f2854a076cef3e1ed048ab2a536aa0caea3), that acts as a class selector for the different distributions. 

```python
from assemble_workflow.dist import Dist, DistTar, DistZip

class Dists:
    DISTRIBUTIONS_MAP = {
        "tar": DistTar,
        "zip": DistZip,
    }

    @classmethod
    def create_dist(cls, name: str, path: str, min_path: str, distribution: str) -> Dist:
        if distribution is None:
            logging.info("Distribution not specified, default to tar")
            distribution = 'tar'

        return cls.DISTRIBUTIONS_MAP[distribution](name, path, min_path)
```

`DistTar` and `DistZip` are dist classes. They contain the specific business logic required for the distribution to be properly assembled for creating the bundled final product. Based on the `distribution` value parsed from build `manifest.yml`, you can return the corresponding class.

Take a look at [class DistTar](https://github.com/peterzhuamazon/opensearch-build/blob/b0ac712e1ce6d10e901ab549d7335ee3b20c81b9/src/assemble_workflow/dist.py#L87-L94) as an example before you implement a similar `DistRpm`.

```python
class DistTar(Dist):
    def __extract__(self, dest: str) -> None:
        with tarfile.open(self.path, "r:gz") as tar:
            tar.extractall(dest)

    def __build__(self, name: str, dest: str) -> None:
        with tarfile.open(name, "w:gz") as tar:
            tar.add(self.archive_path, arcname=os.path.basename(self.archive_path))
```

The `DistTar` class extends `Dist` class with two `@abstractmethod` to be implemented: extract and build. Extract takes the OpenSearch engine tarball artifact from the build stage, extracts the content so you can install plugins, and adjusts the configuration. Build (not to be confused with `build_workflow`) wraps the extracted content after the extract process and regenerates a new tarball as the final bundled product. `Extract` and `build` can be treated as `tar` and `untar` or `zip` and `unzip`, respectively.

After extracting the content, additional refinements can be made in [src/run_assemble.py](https://github.com/peterzhuamazon/opensearch-build/blob/b0ac712e1ce6d10e901ab549d7335ee3b20c81b9/src/run_assemble.py#L42-L45), which was called by `assemble.sh` in the opensearch-build repo root directory.

```python
with Bundles.create(build_manifest, artifacts_dir, bundle_recorder, args.keep) as bundle:
    bundle.install_min()
    bundle.install_plugins()
    logging.info(f"Installed plugins: {bundle.installed_plugins}")
```

The flow runs as `assemble.sh` calls `run_assemble.py`, which calls `Bundles.create`. It then returns the class `bundle_opensearch.py`, which creates an instance of `BundleOpenSearch` that extends `Bundle`, and then `Bundle` internally calls `Dists.create`, which returns `DistTar` and calls [extract](https://github.com/peterzhuamazon/opensearch-build/blob/b0ac712e1ce6d10e901ab549d7335ee3b20c81b9/src/assemble_workflow/bundle.py#L137-L139).

```python
min_dist = Dists.create_dist(min_bundle.name, min_dist_path, min_path, self.build.distribution)
logging.info(f"Extracting dist into {self.tmp_dir.name}.")
min_dist.extract(self.tmp_dir.name)
```

After extraction, you return to `run_assemble.py` to continue installation.

```python
bundle.install_min()
bundle.install_plugins()
```

If no plugin is installed, OpenSearch and OpenSearch Dashboards are referred to as `min`, meaning they are the `minimal` product. The two calls, `bundle.install_min()` and `bundle.install_plugins()`, act similarly to the `build()` call in [builder_from_source](https://github.com/opensearch-project/opensearch-build/pull/1629/files#diff-e4f0b9f43bd4f3a5d5ca99e4ba9e7f38544f1078d2687d9ce5ae973df896e9ff), run another script `install.sh` internally to complete the installation, such as [src/scripts/component/OpenSearch/install.sh](https://github.com/opensearch-project/opensearch-build/pull/1726/files#diff-18196b41230cd78d55ad94c1f4b6b54ad7c225aaa48b16495f6d4352e26e760c) for `bundle.install_min()` and `src/scripts/default/install.sh` for `bundle.install_plugins()`. Typically, the plugin `install.sh` is no-op, as OpenSearch and OpenSearch Dashboards use different installation methods. You override the call with the following function in [bundle_opensearch.py](https://github.com/opensearch-project/opensearch-build/blob/1.3.2/src/assemble_workflow/bundle_opensearch.py):

```python
def install_plugin(self, plugin: BuildComponent) -> None:
    tmp_path = self._copy_component(plugin, "plugins")
    cli_path = os.path.join(self.min_dist.archive_path, "bin", self.install_plugin_script)
    self._execute(f"{cli_path} install --batch file:{tmp_path}")
    super().install_plugin(plugin)
```

You now have completed installation, so you return to `run_assemble.py` to call the following remaining functions:

```python
bundle_recorder.write_manifest(bundle.min_dist.archive_path)
bundle.package(output_dir)
bundle_recorder.write_manifest(output_dir)
```

When you check out the business logic for [bundle.package](https://github.com/peterzhuamazon/opensearch-build/blob/b0ac712e1ce6d10e901ab549d7335ee3b20c81b9/src/assemble_workflow/bundle.py#L100-L101), it internally calls `build `from `DistTar`, which creates a tarball based on the extracted content. 

Now that you know how `assemble_workflow` runs, let’s implement a new section for `RPM`. Like `TAR`, you will add the new section `DistRpm` in [src/assemble_workflow/dist.py](https://github.com/opensearch-project/opensearch-build/pull/1726/files#diff-b6de2321e4e1b16c1d5c6a3c6c4ef51bb2a5a3473f116500a9f859e18f4c7d0a).

```python
from assemble_workflow.bundle_rpm import BundleRpm
......

class DistRpm(Dist):

    def __extract__(self, dest: str) -> None:
        BundleRpm(self.filename, self.path, self.min_path).extract(dest)

    def __build__(self, name: str, dest: str) -> None:
        BundleRpm(self.filename, self.path, self.min_path).build(name, dest, self.archive_path)
```

Similar changes will be added to [src/assemble_workflow/dists.py](https://github.com/opensearch-project/opensearch-build/pull/1726/files#diff-9d09f47256a1ba3eb99c43c336833f2854a076cef3e1ed048ab2a536aa0caea3). You then will implement `RPM`-specific bundle code in [src/assemble_workflow/bundle_rpm.py](https://github.com/opensearch-project/opensearch-build/pull/1726/files#diff-51ea9acc525537d3b2ac2f474be50508d751694c05ef79c611e09d937d07e774). This file is categorized by two `@abstractmethod`: `extract` and `build`.

* Extract:
    * Given the min version of OpenSearch `.rpm`, run `rpm2cpio` to convert `.rpm` to `.cpio` format.
    * Use the `cpio -imdv` command to extract the `.rpm` raw files.
    * Prepare necessary settings before `bundle.install_min()` `bundle.install_plugins()` runs.
* Build:
    * After installation, organize the directory structure to prepare for the final build.
    * Use `rpmbuild` to generate the final `.rpm` product for release.
    * Move the final `.rpm` product to the corresponding directory (`opensearch-build/rpm/dist/opensearch/`).


The current directory structure, or tree, after `assemble_workflow` is similar to the tree for `build_workflow`. The difference is that this tree has a new `dist` folder with the new artifacts.

```
opensearch-build/rpm
├── builds
│   └── opensearch
│       ├── core-plugins
│       ├── dist
│       │   └── opensearch-min-1.3.2.x86_64.rpm
│       ├── manifest.yml
│       └── plugins
└── dist
    └── opensearch
        ├── manifest.yml
        ├── opensearch-1.3.2-linux-x64.rpm
......
```


Congratulations! You have implemented the `RPM` distribution creation process within the `opensearch-build` code base. 

For more information on `rpmbuild,` `.spec` files, `.service` files, and signing, see [opensearch-build/scripts/pkg/](https://github.com/opensearch-project/opensearch-build/tree/1.3.2/scripts/pkg) on GitHub.


## Conclusion

We continually improve by adding new distributions to the OpenSearch Project. With the addition of `RPM`, we have set up a new structure, standard operating procedures, and an entry point to encourage the community to contribute code more easily. For example, we are working with [Graylog](https://www.graylog.org) on `DEB` distribution implementation, using similar steps as `RPM`; the [draft PR](https://github.com/opensearch-project/opensearch-build/pull/2526) is in review. We encourage you to engage with us on improving the process for adding new distributions to OpenSearch.


