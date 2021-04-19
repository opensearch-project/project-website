FROM ruby:alpine3.13 as jekyll

RUN apk add --no-cache build-base gcc bash cmake git

RUN gem install bundler -v "~>2.2.11" && gem install jekyll

EXPOSE 4000

ENTRYPOINT [ "jekyll" ]

FROM jekyll/jekyll:4.2.0 as jekyll-serve

COPY run.sh /usr/local/bin/
RUN chmod a+x /usr/local/bin/run.sh

ENTRYPOINT [ "run.sh" ]

CMD [ "bundle", "exec", "jekyll", "serve", "--force_polling", "-H", "0.0.0.0", "-P", "4000" ]
