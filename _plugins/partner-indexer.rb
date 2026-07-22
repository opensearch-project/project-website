# frozen_string_literal: true

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: BSD-3-Clause
puts "partner-indexer.rb file loaded"

require "jekyll/hooks"
require "jekyll/document"
require "json"

##
# This singleton facilitates production of an indexable JSON representation of the content to populate a data source
# to provide search functionality.
#
# To prevent the indexing of a document, include `omit_from_search: true` in the document's front matter.
# In rare circumstances, this indexer fails to find the title of some documents; including `primary_title` solves that.
#
# The plugin does not apply changes when the Serve command is used but `JEKYLL_ALLOW_CONTENT_INDEXER`, set on the
# environment, will override the behavior.
# Usage: `JEKYLL_ALLOW_CONTENT_INDEXER= bundle exec jekyll serve --trace`

module Jekyll::ContentIndexer

  ##
  # The collection that will get stores as the output
  @data = []

  ##
  # Pattern to identify documents that should be excluded based on their URL
  @excluded_paths = /(^\/blog\/(page\d|$)|^\/events\/([^\d]|$)|^\/faqs|\.(css|js|json|map|xml|txt|yml)$|\/404\.html)/i.freeze

  ##
  # Pattern to identify block HTML tags (not comprehensive)
  @html_block_tags = /\s*<[?\/]?(article|blockquote|d[dlt]|div|fieldset|form|h|li|main|nav|[ou]l|p|section|table|t[rd]).*?>\s*/im.freeze

  ##
  # Pattern to identify certain HTML tags whose content should be excluded from indexing
  @html_excluded_tags = /\s*<(head|style|script|h1).*?>.*?<\/\1>/im.freeze

  ##
  # Pattern to extract the page heading from div.copy-banner > div.container > h1 > a
  @header_matcher = /<div.+?class="[^"]*copy-banner[^"]*".*?>.*?<div.+?class="[^"]*container[^"]*".*?>.*?<h1.*?><a.*?>\s*([^<]+)\s*<\/a>.*?<\/h1>/m.freeze;

  ##
  # Defines the priority of the plugin
  # The hooks are registered with the lowest possible priority to make sure they run after any other
  def self.priority
    1
  end

  ##
  # Initializes the singleton by recording the site
  def self.init(site)
    @site = site
    puts "PARTNER-INDEXER initialized"

    # Avoid initializing if serving and not forced to run
    # if site.config["serving"] and (!ENV.key?('JEKYLL_ALLOW_CONTENT_INDEXER') or ENV['JEKYLL_ALLOW_CONTENT_INDEXER'] == "false")
    #   return Jekyll.logger.info "ContentIndexer:",
    #                                   "disabled. Enable with JEKYLL_ALLOW_CONTENT_INDEXER on the environment"
    # end

    # Process a Page as soon as its content is ready
    Jekyll::Hooks.register :pages, :post_convert, priority:self.priority do |page|
      self.add(page)
    end

    # Process a Document as soon as its content is ready
    Jekyll::Hooks.register :documents, :post_convert, priority:self.priority do |document|
      self.add(document)
    end

    # Save the produced collection after Jekyll is done writing all its stuff
    Jekyll::Hooks.register :site, :post_write, priority:self.priority do |_|
      self.save()
    end

    Jekyll.logger.info "PARTNER-INDEXER:", "initialized"
  end

  ##
  # Processes a Document or Page and adds it to the collection
  def self.add(page)
    return if @excluded_paths.match(page.url)
    return if page.data['omit_from_search']

    content = page.content
                  .gsub(@html_excluded_tags, ' ')             # Strip certain HTML blocks
                  .gsub(@html_block_tags, "\n")               # Strip some block HTML tags, replacing with newline
                  .gsub(/\s*<[?\/!]?[a-z]+.*?>\s*/im, ' ')    # Strip all remaining HTML tags
                  .gsub(/\s*[\r\n]+\s*/, "\n")                # Clean line-breaks
                  .gsub(/\s{2,}/, ' ')                        # Trim long spaces
                  .gsub(/\s+([.:;,)!\]?])/, '\1')             # Remove spaces before some punctuations
                  .strip                                      # Trim leading and tailing whitespaces

    return if content.empty?

    url = @site.config["baseurl"] + page.url
    type = nil

    if page.instance_of?(Jekyll::Document)
      # Appropriately assign types based on collection
      case page.collection&.label
      when 'posts'
        type = 'Blogs' 
      when 'authors'
        type = 'Authors'
      when 'events'
        type = 'Events'
      when 'versions'
        type = 'Downloads'
      when 'testimonials'
        type = 'Testimonials'
      when 'tutorials'
        type = 'Tutorials'
        #url << '.html'    # Add .html to URLs of author pages to correct the url
      when 'redesign_use_cases'
        type = 'Platform Use Cases'
      when 'redesign_resources'
        type = 'Related Content Resources'
      when 'platforms'
        type = 'OpenSearch Project Platforms'
      when 'platform_products'
        type = 'OpenSearch Platform Products'
      when 'redesign_testimonials'
        type = 'Testimonials'
      when 'redesign_heros'
        type = 'Hero Images'
      when 'community_members'
        type = 'Community Members'
      else
        puts 'Unknown type: ' + page.collection&.label
      end
    end

    # Produce keywords
    keywords = []
    keywords += page.data["categories"] unless page.data["categories"].nil? || page.data["categories"]&.empty?
    keywords += page.data["keywords"] unless page.data["keywords"].nil? || page.data["keywords"]&.empty?

    title = page.data["title"]
    title = page.data["primary_title"] if title.nil? || title.empty?
    if title.nil? || title.empty?
      # Page might be using context variables to set `primary_title`
      if /<div.+?class="[^"]*copy-banner[^"]*".*?>.*?<div.+?class="[^"]*container[^"]*".*?>.*?<h1.*?><a.*?>\s*([^<]+)\s*<\/a>.*?<\/h1>/m =~ page.content
        title = "#{$1}"
      end
    end

    data = {
      url: url,
      title: title,
      content: content,
      keywords: keywords,
      type: type
    }

    @data.push(data)
  end

  ##
  # Saves the collection as a JSON file
  def self.save
    puts "Saving data to partner-search-index.json"
    file_path = File.join(@site.config["destination"], "partner-search-index.json")
    puts "File path: #{file_path}"
    File.open(file_path, 'w') do |f|
        f.puts JSON.pretty_generate(@data)
    end
    puts "Data saved successfully"
  end
end

# Before any Document or Page is processed, initialize the ContentIndexer
Jekyll::Hooks.register :site, :pre_render, priority:Jekyll::ContentIndexer.priority do |site|
  Jekyll::ContentIndexer.init(site)
end
