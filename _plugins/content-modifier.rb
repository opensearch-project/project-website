# frozen_string_literal: true

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: BSD-3-Clause

require "jekyll/hooks"

##
# This singleton modifies the content at build time. Its primary use is to mitigate security risks automatically.
#
# The plugin does not apply changes when the Serve command is used but `JEKYLL_ALLOW_CONTENT_MODIFIER`, set on the
# environment, will override the behavior.
# Usage: `JEKYLL_ALLOW_CONTENT_MODIFIER= bundle exec jekyll serve --trace`

module Jekyll::ContentModifier

  ##
  # Pattern to identify documents that should be excluded based on their URL
  @excluded_paths = /\.(css|js|json|map|xml|txt|yml|svg|)$/i.freeze

  ##
  # Defines the priority of the plugin
  # The hooks are registered with a very high priority to make sure the changes are in before other hooks are run
  def self.priority
    90
  end

  ##
  # Initializes the singleton by recording the site
  def self.init(site)
    @site = site

    # Avoid initializing if serving and not forced to run
    if site.config["serving"] and (!ENV.key?('JEKYLL_ALLOW_CONTENT_MODIFIER') or ENV['JEKYLL_ALLOW_CONTENT_MODIFIER'] == "false")
      return Jekyll.logger.info "ContentModifier:",
                                "disabled. Enable with JEKYLL_ALLOW_CONTENT_MODIFIER on the environment"
    end

    # Process a Page as soon as its content is ready
    Jekyll::Hooks.register :pages, :post_convert, priority:self.priority do |page|
      self.process(page)
    end

    # Process a Document as soon as its content is ready
    Jekyll::Hooks.register :documents, :post_convert, priority:self.priority do |document|
      self.process(document)
    end

    Jekyll.logger.info "ContentModifier:", "initialized"
  end

  ##
  # Processes a Document or Page

  def self.process(page)
    return if @excluded_paths.match(page.path)
    self.mitigateReverseTabnabbing(page)
  end

  ##
  # Reverse Tabnabbing -  https://owasp.org/www-community/attacks/Reverse_Tabnabbing
  # Finds anchors with targets and pointing externally, and upserts `rel="noopener noreferrer"`

  def self.mitigateReverseTabnabbing(page)
    anchor_matcher = /<a\s(?<attrs>[^>]*href=(?<quote>['"])(?<href>(?:https?:)?\/\/.+?)\k<quote>[^>]*)>/im
    external_matcher = /^(https?:)?\/\/(?!([^\/]+\.)?opensearch\.org(\/|$))/i
    target_matcher = /(\s|^)target(=|$)/im
    rel_matcher = /(\s|^)rel=(['"])(.+?)\2/im
    rel_cleanup_matcher = /(\s|^)(noopener|noreferrer)/

    page.content = page.content
        .gsub(anchor_matcher) do |anchor_html|
          attrs = $~[:attrs]
          href = $~[:href]

          # Don't bother if the link is not external
          next anchor_html unless href =~ external_matcher and attrs =~ target_matcher

          # Update or add `rel`
          if attrs =~ rel_matcher
            attrs = attrs.gsub(rel_matcher) do |match|
              rel_prefix = $1
              rel_quote = $2
              rel_cleaned = $3.gsub(rel_cleanup_matcher, '').strip

              # Join `attrs` parts
              rel_prefix + "rel=" + rel_quote + ("noopener noreferrer " + rel_cleaned).strip + rel_quote
            end
          else
            attrs = "rel=\"noopener noreferrer\" " + attrs
          end

          # Join `anchor` parts
          "<a " + attrs + ">"
        end
  end
end

# Before any Document or Page is processed, initialize the ContentModifier
Jekyll::Hooks.register :site, :pre_render, priority:Jekyll::ContentModifier.priority do |site|
  Jekyll::ContentModifier.init(site)
end