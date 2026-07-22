FROM jekyll/jekyll:4.2.0 as jekyll

COPY run.sh /usr/local/bin/
RUN chmod a+x /usr/local/bin/run.sh

ENTRYPOINT [ "run.sh" ]

EXPOSE 4000

CMD [ "bundle", "exec", "jekyll", "serve", "--force_polling", "-H", "0.0.0.0", "-P", "4000" ]
