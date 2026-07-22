# Content & Blog Workflow

## Submitted Content

[Opensearch.org](https://opensearch.org/) is open source! Getting content from people outside the team that typically manages the website and content is expected and encouraged. Generally, the idea is to decentralize all the content of the website and remove the concept of *someone* making the changes for someone else. If anyone wants to make a change, they should be empowered to do so. Those managing the website are encouraged to provide feedback and make sure it aligns with the user experience, technical, and editorial standards; the website team then shepherds the content through to publishing. Ultimately, the submitter of the content should be responsible for ensuring that the content is in the correct format, visually works in the template, has the appropriate metadata, and is submitted as a pull request correctly. 

This process is a bit atypical in the general world of websites but not that unusual in the specific realm of open source project websites. The website follows the widely understood open source software pattern of:


* File an issue
* Create a pull request
* Request a review
* Merge

### File an issue

When someone wants to make a change, the first step is often filing an issue. The website repo has a number of [pre-built templates for issues](https://github.com/opensearch-project/project-website/issues/new/choose) that help guide a user to provide the information for the website team. The issue provides a way to discuss the proposed change and track progress. In a repo like project-website that doesn’t have versions or releases, these issues tend to stick around as people work on features or kept as good ideas without someone to execute them. 

### Create a pull request

When the user and website team have come to an agreement, the user then submits the pull request. Pull requests are made by first forking the opensearch-project/project-website repo, making the changes on their own fork and submitting a pull request from their fork to the original. It should be noted that *all* changes should come in this way, even changes from the team who manages the website to ensure transparency and collaboration.

### Review

The website team will need to review the pull request. Generally, the team should review for all aspect of the content:

* Visual & technical review: Cloning the forked version and building the website
* Content review: Reading the content for grammar, spelling, style, and linking.

Feedback is provided by notating the pull request and submitting feedback in GitHub. Lines that need to be changed are noted:

![line comment in github](./images/comment-in-review.png)

And the overall review is added before the individual comments are made public:

![finish review](./images/finish-review.png)



Generally, “Request changes” is used one or more times. When the reviewer is satisfied, “Approve” is selected. “Request changes” will block the merging of the pull request. It’s the responsibility of user submitting the pull request to make changes.

### Merge

Once the reviewers are done, then the change can be merged. Generally, this can be done without intervention if there is no conflict between the current website files and the proposed changes. If there are places where GitHub can’t reason about the changes automatically, it will cause a “merge conflict.” The merge conflict is the responsibility of the submitter to fix and can cause additional review cycles.

## Moving to production

[Opensearch.org](https://opensearch.org/) is built to be operated from GitHub. Once a change is merged on GitHub, it automatically triggers a build and deployment of the website. However this is challenging as it can cause unintentional changes to go live immediately. To mitigate this issue, [opensearch.org](https://opensearch.org/) uses a two phase approach. Merging to the branch `main` will trigger a deployment of the staging site instead of the public facing website. The staging site URL is not a secret, but it is also not published to prevent unintentional linking, confusion, and SEO problems. 

Making the changes appear on [opensearch.org](https://opensearch.org/) is done by doing a pull request from the `main` branch to the `prod` branch. Changes to the `prod` branch will automatically trigger a rebuild and deployment of [opensearch.org](https://opensearch.org/) . It’s important to only make changes to the `prod` branch through pull requests to avoid any sticky merge conflicts. 

## FAQ

**I wrote a blog post in Word, Google Docs, or some other word processor - how can I turn it into a blog post?**
[Opensearch.org](https://opensearch.org/) uses Jekyll which is a static site generator based on [Markdown](https://www.markdownguide.org/). Markdown is well supported and you should look for a feature or tool to export your content as Markdown then add the requisite front-matter.

**GitHub said that I didn’t do the DCO correctly and that it can’t be merged. What’s a DCO and how do I fix it?**
OpenSearch uses a Developer Certificate of Origin (DCO) sign off as a way of ensuring that the developer has the permission to submit the code (or content). Each **commit** needs to be signed off using the `-s` flag:


```
git commit -m "this is my commit message" -s
```

This adds a small, machine-readable message to the commit (i.e. `Signed-off-by: John Doe <johndoe@example.com>`). Our repos check to make sure that the name and email matches your GitHub settings exactly. 

While this might be second nature to developers, it can be unfamiliar to non-developers or casual contributors. The best mitigation is to do it correctly from the start and use the `-s` on every commit. Fixing DCO problems can be tricky due to the nature of how git works but it’s not impossible. The [source{d} project has an excellent guide on how to fix DCO problems](https://github.com/src-d/guide/blob/9171d013c648236c39faabcad8598be3c0cf8f56/developer-community/fix-DCO.md) - in particular [Option #2](https://github.com/src-d/guide/blob/9171d013c648236c39faabcad8598be3c0cf8f56/developer-community/fix-DCO.md#fix-option-2-rebase-git213) is usually the shortest route to fix most DCO problems, but you have to carefully follow the instructions.

**GitHub has a built-in editor! Can I use this to make changes to the website?**
Probably not! While it’s very tempting to use this, it’s exceptionally difficult to correctly apply a DCO and if there are problems with the DCO, you cannot fix it from the web interface. Additionally, those submitting the content really should build the website before submitting a pull request.

**What is ‘front-matter’?**
[Front matter is a way of encoding metadata about a piece of content in opensearch.org’s CMS Jekyll](https://jekyllrb.com/docs/front-matter/). Front matter starts and ends with three dashes (`---`) and contains [YAML](https://en.wikipedia.org/wiki/YAML) fields and values between those two markers. These fields and values contain information that is interpolated by Jekyll into the content and templates and generally controls how content looks, feels and is converted to HTML.

**How do I make sure my content looks good on any device?**
The templates used by [opensearch.org](https://opensearch.org/) use a responsive layout and take care of most aspects of adapting the content for various devices. However, images embedded in content need special care to make sure they don’t cause horizontal scrolling. This is done by applying a special tag following any image markdown: `{: .img-fluid}`. In practice this creates an image that fills the horizontal space and scales proportionally in the vertical axis. In total, image tags should look something like this:


```
![alt text](/assets/media/blog-images/path-to/image.png){: .img-fluid}
```