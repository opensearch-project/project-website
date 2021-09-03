<img src="https://opensearch.org/assets/img/opensearch-logo-themed.svg" height="64px">

- [OpenSearch.org Website](#opensearchorg-website)
  - [Getting Help](#getting-help)
  - [Contributing](#contributing)
    - [Adding to the Partners Page](#adding-to-the-partners-page)
    - [Building the Website](#building-the-website)
  - [Code of Conduct](#code-of-conduct)
  - [Security](#security)
  - [License](#license)
  - [Credits](#credits)
  
# OpenSearch.org Website

This repo contains the source for the [opensearch.org](https://opensearch.org/) website. 

## Getting Help

If you find a bug, or have a feature request, please don't hesitate to open an issue in this repository. 

If you need help and are unsure where to open an issue, try [forums](https://discuss.opendistrocommunity.dev/).

## Contributing

We welcome contributions! Please see our [CONTRIBUTING](CONTRIBUTING.md) page to learn more about how to contribute to the website. 

_Note:_ As of July 20, 2021, contributions are welcome on the `main` branch; the `prod` branch is now protected and holds the finalized version of the site. The `staging` branch has been removed and is no longer being used.

### Adding to the Partners Page

If you are a partner, you are welcome to add your logo/link to our partners page. Please copy and edit the [sample file](_partners/_sample.md), and submit a pull request.

### Building the Website

This site uses [Jekyll](https://jekyllrb.com/). You can build the site and make it available on a local server via `docker-compose up -d`, or by installing all the dependencies on your local environment as follows.

1. Install [Ruby](https://www.ruby-lang.org/en/) and [Bundler](https://bundler.io/), then run `bundle install`.
2. Build and start Jekyll with `bundle exec jekyll serve`. 
3. Browse the site at [`http://127.0.0.1:4000/`](http://127.0.0.1:4000/).

Alternatively, build the site with `bundle exec jekyll build`. The HTML output is generated into `/_site`. For the full configuration options when running Jekyll, see [this page](https://jekyllrb.com/docs/configuration/options/).

### Testing

#### Link checker

We use a link checker plugin to ensure that we dont have any broken links on the website. It does not run by default since it can slow down the build, especially when running `bundle exec jekyll serve`. To run the link checker, add the ENV flag `JEKYLL_LINK_CHECKER` or `JEKYLL_FATAL_LINK_CHECKER` with any one of the valid values `internal`,`forced`,`all` or `retry`. Each option tests a larger range of links. E.g.

```sh
JEKYLL_FATAL_LINK_CHECKER=all bundle exec jekyll build
```

**`JEKYLL_LINK_CHECKER` vs `JEKYLL_FATAL_LINK_CHECKER`**

They both accept the same values with the only difference being that `JEKYLL_FATAL_LINK_CHECKER` fails the build if a broken link is found

**Env values**
1. **internal**: validates only the internal links
2. **forced**: validates internal links and links that are technically internal but instead link to an external page. e.g. `/docs`
3. **all**: validates all links. however this option does not retry retry-able link or follow redirection links. e.g. HTTP:429 (too many attrmpts, retry after), HTTP:301 (Permanent redirect)
4. **retry**: validates all the links but also retries links with retry-able HTTP header 

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](CODE_OF_CONDUCT.md). For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq), or contact [opensource-codeofconduct@amazon.com](mailto:opensource-codeofconduct@amazon.com) with any additional questions or comments.

## Security

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](https://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public GitHub issue.

## License

This project is licensed under the [BSD-3-Clause License](LICENSE).

## Credits

This website was forked from the BSD-licensed [djangoproject.com](https://github.com/django/djangoproject.com).

## Copyright

Copyright OpenSearch Contributors. 
