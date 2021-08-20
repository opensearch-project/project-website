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

1. Install [Ruby](https://www.ruby-lang.org/en/) and run `bundle install`.
2. Build and start Jekyll with `bundle exec jekyll serve`.
3. Browse the site at [`http://127.0.0.1:4000/`](http://127.0.0.1:4000/).

Alternatively, build the site with `bundle exec jekyll build`. The HTML output is generated into `/_site`.

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](CODE_OF_CONDUCT.md). For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq), or contact [opensource-codeofconduct@amazon.com](mailto:opensource-codeofconduct@amazon.com) with any additional questions or comments.

## Security

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public GitHub issue.

## License

This project is licensed under the [BSD-3-Clause License](LICENSE).

## Credits

This website was forked from the BSD-licensed [djangoproject.com](https://github.com/django/djangoproject.com).

## Copyright

Copyright OpenSearch Contributors. See [NOTICE](NOTICE.txt) for details.