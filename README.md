<img src="https://opensearch.org/assets/img/opensearch-logo-themed.svg" height="64px">

- [opensearch.org website](#opensearchorg-website)
  - [Contributing](#contributing)
    - [Adding to the Partners Page](#adding-to-the-partners-page)
  - [Security](#security)
  - [License](#license)
  - [Build](#build)
  - [Credits](#credits)
  
# opensearch.org website

This repo contains the source for the opensearch.org website. 

## Contributing

We welcome contributions! Please see our [CONTRIBUTING](CONTRIBUTING.md) page to learn more about how to contribute to the website.

### Adding to the Partners Page

If you are a partner, you are welcome to add your logo/link to our partners page. See the [sample file](https://github.com/opensearch-project/project-website/blob/staging/_partners/_sample.md) and submit a pull request.

## Security

If you discover potential security issues, see the reporting instructions on our [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) page for more information.

## License

This project is licensed under the BSD-3-Clause License.

## Build

You can build the site and make it available on a local server via: 
```
docker-compose up -d
```
or by installing all the dependencies on your local environment:

1. Go to the root of the repo
2. Install [Ruby](https://www.ruby-lang.org/en/)
3. Install [Jekyll](https://jekyllrb.com/)
4. Install dependencies: `bundle install`
5. Build: `bundle exec jekyll serve` for the local server, `bundle exec jekyll build` for one off builds. Either way, the HTML of the site is generated to `/_site`.

Browse the site at [`http://127.0.0.1:4000/`](http://127.0.0.1:4000/).

## Credits

This website was forked from the BSD-licensed [djangoproject.com](https://github.com/django/djangoproject.com)
