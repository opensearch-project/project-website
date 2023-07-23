---
layout: post
title: "New custom automated style workflow"
authors:
  - nbower
  - kolchfa
date: 2023-07-19
categories:
  - community-updates
meta_keywords: 
meta_description: 
---

The OpenSearch Project is pleased to announce the rollout of an exciting mechanism in the [`documentation-website`](https://github.com/opensearch-project/documentation-website) and [`project-website`](https://github.com/opensearch-project/project-website) repos. 
 
We have implemented a **custom automated style workflow** to ensure that our documentation and blog posts adhere to the [OpenSearch Project Style Guidelines](https://github.com/opensearch-project/documentation-website/blob/main/STYLE_GUIDE.md). The workflow uses the [Vale](https://github.com/errata-ai/vale) linter. We have implemented rules for spellchecking (custom to OpenSearch), punctuation, capitalization, grammar, and style.
 
The new style workflow aligns our approach to quality assurance with our approach to development, and you can choose which rules to turn on and whether to run the tool in the command line or integrate it with your IDE. Our intent is for this new mechanism to save us time during release cycles while still allowing us to achieve our high quality bar.

## Installing Vale

To install Vale, run `brew install vale`. 

You can use the tool locally in two ways:

1. **From the command line**. Run Vale on the whole directory (`vale .`) or a particular file (`vale /path/to/file`). Vale reports errors in the command line, as shown in the following image.

    ![Command-line error example](/assets/media/blog-images/2023-07-19-style-workflow/command-line-error.png){: .img-fluid }    

1. **As an integrated IDE extension**. Vale integrates with many IDEs, including VS Code, IntelliJ IDEA and other JetBrains IDEs, Sublime, and Emacs. To integrate Vale in VS Code, follow these steps:

    * In the left panel, select **Extensions** and search for **Vale VSCode**. 
    * Select **Install** and restart VS Code. 

    The Vale extension highlights problems with squiggly underlines, similarly to Microsoft Word. You can hover over the underlined text to see the problem and optionally view the associated rule, which in most cases provides a link to the relevant section of the project style guide. For some problems, you can also choose **Quick Fix**, which fixes the problem automatically, as shown in the following image.

    ![Vale error example](/assets/media/blog-images/2023-07-19-style-workflow/vale-error.png){: .img-fluid }

    NOTE: The Vale extension only refreshes when you save the file.

## Reporting levels
 
There are **three levels of reporting** in the style workflow, and you can choose which levels are displayed:

* **Error**: Incorrect usage.
* **Warning**: Usage that is grammatically correct but does not adhere to the style guide.
* **Suggestion**: Stylistic choices that do not follow best practices. Currently, only passive voice and future tense are flagged as suggestions.

By default, Vale is set up to report *errors* and *warnings*. **To select the level of reporting**, follow these steps:

* In the left panel, select **Extensions** and then select **Vale VSCode**.
* Select the settings (gear) icon in the lower-right corner of the Vale VSCode extension and select **Extension settings**.
* In the Vale > Vale CLI: **Min Alert Level** dropdown list, select **suggestion** or any other level.

## Helpful hints

* Code blocks that specify a language after the three tic marks are skipped, for example:
    ````plaintext
    ```json
    GET _cat/aliases?v
    ```
    ````

    It’s a best practice to specify the language in all code blocks. Use `bash` for command line operations:
    ````plaintext
    ```bash
    sudo systemctl start opensearch
    ```
    ````
* If a word is flagged for spelling, it’s a hint that the word might need to be in code format. In general, use code format for commands, variables, and settings. Consider the following examples: `ifnull`, `curdate`, `cluster_manager_timeout`. Values in all capitals (for example, `SELECT` or `AND`) should also generally be in code format.

## Style workflow CI

We have added a style workflow CI to the `documentation-website` and `project-website` repos. The CI runs on any PR and all its subsequent commits and comments on any text flagged as an error or warning in the PR, as shown in the following image.

![CI error example](/assets/media/blog-images/2023-07-19-style-workflow/ci-error.png){: .img-fluid }

The CI is set up as non-blocking, but contributors are expected to correct all errors before merging the PR.

## Wrapping it up

If you have any questions or feedback regarding the style workflow, or if you feel that Vale is flagging a word as a spelling mistake erroneously, tag [**kolchfa-aws**](https://github.com/kolchfa-aws/) or [**natebower**](https://github.com/natebower/), and we’ll be happy to assist. You can always check out [STYLE_GUIDE.md](https://github.com/opensearch-project/documentation-website/blob/main/STYLE_GUIDE.md) or [TERMS.md](https://github.com/opensearch-project/documentation-website/blob/main/TERMS.md) for additional guidance and more information about our style standards, and feel free to create an issue or PR on GitHub if you’d like to contribute to the [OpenSearch documentation](https://opensearch.org/docs/latest/).
