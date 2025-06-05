<img src="https://opensearch.org/assets/img/opensearch-logo-themed.svg" height="64px">

- [OpenSearch.org website](#opensearchorg-website)
  - [Getting help](#getting-help)
  - [Contributing](#contributing)
    - [Adding to the Partners page](#adding-to-the-partners-page)
    - [Writing a blog](#writing-a-blog)
    - [Building the website](#building-the-website)
    - [Testing](#testing)
      - [Link checker](#link-checker)
  - [Code of Conduct](#code-of-conduct)
  - [Security](#security)
  - [License](#license)
  - [Credits](#credits)
  - [Copyright](#copyright)
  
# OpenSearch.org website

This repo contains the source for the [opensearch.org](https://opensearch.org/) website. 

## Getting help

If you find a bug, or have a feature request, please don't hesitate to open an issue in this repository. 

If you need help and are unsure where to open an issue, try [forums](https://forum.opensearch.org/).

## Contributing

We welcome contributions! Please see our [CONTRIBUTING](CONTRIBUTING.md) page to learn more about how to contribute to the website. 

_Note:_ As of July 20, 2021, contributions are welcome on the `main` branch; the `prod` branch is now protected and holds the finalized version of the site. The `staging` branch has been removed and is no longer being used.

### Adding to the Partners page

If you are a partner, you are welcome to add your logo/link to our partners page. Please copy and edit the [sample file](_partners/_sample.md), and submit a pull request.

### Writing a blog

The blog process is as follows:

1. [Submit a GitHub issue for the blog](https://github.com/opensearch-project/project-website/issues/new?template=blog_post.yml) so the blog can be added to the publishing schedule.
1. Create a PR with the blog contents. See the [BLOG_GUIDE](BLOG_GUIDE.md) to learn about formatting the blog contents and adding authors. 
1. (Optional) Have one of your peers conduct a technical review.
1. A technical writer performs a doc review.
1. The editor performs an editorial review.
1. Marketing conducts a final review and provides the blog meta.
1. The blog is published.


For writing guidelines, see the [OpenSearch Project Style Guidelines](https://github.com/opensearch-project/documentation-website/blob/main/STYLE_GUIDE.md).

If you need help, contact [pajuric](https://github.com/pajuric).

### Building the website

This site uses [Jekyll](https://jekyllrb.com/). You can build the site and make it available on a local server via `docker-compose up -d`, or by installing all the dependencies on your local environment as follows (tested to work with Ruby 2.7.2).

1. Install [Ruby](https://www.ruby-lang.org/en/) and [Bundler](https://bundler.io/), then run `bundle install`.
2. Build and start Jekyll with `bundle exec jekyll serve`. 
3. Browse the site at [`http://127.0.0.1:4000/`](http://127.0.0.1:4000/).

Alternatively, build the site with `bundle exec jekyll build`. The HTML output is generated into `/_site`. For the full configuration options when running Jekyll, see [this page](https://jekyllrb.com/docs/configuration/options/).

A full site build takes around 20 seconds. If you want to shave off some time, you can build the development version which lacks the sitemap.xml (which is very time consuming to build). The development version takes about 3 seconds to build, so it's great for fast iteration but not exactly what will be built in deployment (it's very close).

```
BUNDLE_GEMFILE=Gemfile-dev bundle exec jekyll serve --config ./_config-dev.yml
```

#### Content Modifier

In order to automatically mitigate some common security risks, the generated pages are scanned and modified, during build, by the [`ContentModifier` plugin](_plugins/content-modifier.rb). Due to its impact on build times, the plugin does not run when developing locally using `jekyll serve`. This behavior can be changed to force the execution of plugin while serving by adding the ENV flag `JEKYLL_ALLOW_CONTENT_MODIFIER`. E.g.
```sh
JEKYLL_ALLOW_CONTENT_MODIFIER= bundle exec jekyll serve
```

### Search bar invisible pages

To prevent a document from appearing in search results, you can add `omit_from_search: true` to its front matter.


### Testing

#### Link checker

We use a link checker plugin to ensure that we don't have any broken links on the website. It does not run by default since it can slow down the build, especially when running `bundle exec jekyll serve`. To run the link checker, add the ENV flag `JEKYLL_LINK_CHECKER` or `JEKYLL_FATAL_LINK_CHECKER` with any one of the valid values `internal`,`forced`,`all` or `retry`. Each option tests a larger range of links. E.g.

```sh
JEKYLL_FATAL_LINK_CHECKER=all bundle exec jekyll build
```

**`JEKYLL_LINK_CHECKER` vs `JEKYLL_FATAL_LINK_CHECKER`**

They both accept the same values with the only difference being that `JEKYLL_FATAL_LINK_CHECKER` fails the build if a broken link is found

**Env values**
1. **internal**: validates only the internal links
2. **forced**: validates internal links and links that are technically internal but instead link to an external page. e.g. `/docs`
3. **all**: validates all links. however this option does not retry retry-able link or follow redirection links. e.g. HTTP:429 (too many attempts, retry after), HTTP:301 (Permanent redirect)
4. **retry**: validates all the links but also retries links with retry-able HTTP header 

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](CODE_OF_CONDUCT.md). For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq), or contact [opensource-codeofconduct@amazon.com](mailto:opensource-codeofconduct@amazon.com) with any additional questions or comments.

## Security

If you discover a potential security issue in this project we ask that you notify OpenSearch Security directly via email to security@opensearch.org. Please do **not** create a public GitHub issue.

## License

This project is licensed under the [BSD-3-Clause License](LICENSE).

## Credits

This website was forked from the BSD-licensed [djangoproject.com](https://github.com/django/djangoproject.com).

## Copyright

Copyright OpenSearch Contributors. 
