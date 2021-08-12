# frozen_string_literal: true
require "net/http"
require "jekyll/hooks"
require "jekyll/document"
require "json"
require "set"
require "uri"
require "pathname"

##
# This singleton checks links during build to warn or fail upon finding dead links.
#
# `JEKYLL_CHECK_EXTERNAL_LINKS`, set on the environment, will cause verification of external links, irrespective of its
# value. Usage: `JEKYLL_CHECK_EXTERNAL_LINKS= bundle exec jekyll build --trace`
#
# `JEKYLL_FATAL_LINK_CHECKER`, set on the environment, will cause the build to fail if an internal dead link is found.
# If set as `JEKYLL_FATAL_LINK_CHECKER=2`, the build will fail for internal and external dead links; in this case, there
# is no need to set `JEKYLL_CHECK_EXTERNAL_LINKS`.

module Jekyll::LinkChecker

  ##
  # The collection that will get stores as the output

  @urls

  ##
  # Pattern to identify documents that should be excluded based on their URL

  @excluded_paths = /(\/_faqs\/|\.(css|js|json|map|xml|txt|yml|svg|)$)/i.freeze

  ##
  # Pattern to identify certain HTML tags whose content should be excluded from indexing

  @href_matcher = /<a[^>]+href=(['"])(.+?)\1/im.freeze

  ##
  # Pattern to check for external URLs

  @external_matcher = /^https?:\/\//.freeze
  @force_external_check = /^https?:\/\/.*(?=opensearch\.org\/)/.freeze

  ##
  # List of domains to ignore
  @ignored_domains = %w[localhost]

  ##
  # Pattern of local paths to ignore
  @ignored_paths = /(^\/docs$|^mailto:|^\/javadocs\/)/.freeze

  ##
  # Valid response codes for successful links
  @success_codes = %w[200 302]

  ##
  # Questionable response codes for successful links
  @questionable_codes = %w[301 403 429]

  ##
  # Holds the list of failures
  @failures

  ##
  # Driven by environment variables, it indicates a need to check external links
  @check_external_links

  ##
  # Driven by environment variables, it indicates the need to fail the build for dead links
  @should_build_fatally


  ##
  # Initializes the singleton by recording the site

  def self.init(site)
    @site = site
    @urls = {}
    @failures = []
  end

  ##
  # Processes a Document or Page and adds the links to a collection
  # It also checks for anchors to parts of the same page/doc

  def self.process(page)
    return if @excluded_paths.match(page.path)

    hrefs = page.content.scan(@href_matcher)
    hrefs.each do |(_, href)|
      relative_path = page.path[0] == '/' ? Pathname.new(page.path).relative_path_from(Dir.getwd) : page.path

      if href.eql? '#'
        next
      elsif href.start_with? '#'
        p relative_path if (page.content =~ /<[a-z0-9-]+[^>]+(?:id|name)="#{href[1..]}"/i).nil?
        @failures << "Process:: ##{href[1..]}, linked in ./#{relative_path}" if (page.content =~ /<[a-z0-9-]+[^>]+(?:id|name)="#{href[1..]}"/i).nil?
      else
        @urls[href] = Set[] unless @urls.key?(href)
        @urls[href] << relative_path
      end
    end
  end

  ##
  # Saves the collection as a JSON file

  def self.verify(site)
    if ENV.key?('JEKYLL_CHECK_EXTERNAL_LINKS')
      @check_external_links = true
      puts "LinkChecker: [Notice] Will verify external links"
    end

    if ENV.key?('JEKYLL_FATAL_LINK_CHECKER')
      @should_build_fatally = true
      if ENV['JEKYLL_FATAL_LINK_CHECKER'] == '2'
        @check_external_links = true
        puts "LinkChecker: [Notice] The build will fail if any dead links are found"
      else
        puts "LinkChecker: [Notice] The build will fail if a dead internal link is found"
      end
    end

    @base_url_matcher = /^#{@site.config["url"]}#{@site.baseurl}(\/.*)$/.freeze

    @urls.each do |url, pages|
      @failures << "Verify:: #{url}, linked to in ./#{pages.to_a.join(", ./")}" unless self.check(url)
    end
    
    msg = "Found #{@failures.size} dead link#{@failures.size > 1 ? 's' : ''}:\n#{@failures.join("\n")}" unless @failures.empty?

    if @should_build_fatally
      raise msg
    elsif !@failures.empty?
      puts "\nLinkChecker: [Warning] #{msg}\n"
    else
      puts "\nLinkChecker: [Success] No broken links!\n"
    end
  end

  ##
  # Check if URL is accessible

  def self.check(url)
    match = @base_url_matcher.match(url)
    unless match.nil?
      url = match[1]
    end

    url = @site.config["url"] + url if url.start_with? '/docs/'

    if @force_external_check =~ url
      return self.check_external(url)
    end

    if @external_matcher =~ url
      return true unless @check_external_links
      return self.check_external(url)
    end

    return self.check_internal(url)
  end

  ##
  # Check if an external URL is accessible by making a HEAD call

  def self.check_external(url)
    uri = URI(url)
    return true if @ignored_domains.include? uri.host

    begin
      (Net::HTTP.new uri.host, uri.port).tap do |http|
        http.use_ssl = true
      end.start do |http|
        http.use_ssl = (uri.scheme == "https")
  
        request = Net::HTTP::Get.new(uri)
  
        http.request(request) do |response|
          return true if @success_codes.include? response.code
          
          if @questionable_codes.include? response.code
            puts "LinkChecker: [Warning] Got #{response.code} from #{url}"
            return true
          end
  
          puts "LinkChecker: [Error] Got #{response.code} from #{url}"
          return false
        end
      end
    rescue => exception
      return false
    end
    
  end

  ##
  # Check if an internal link is accessible

  def self.check_internal(url)
    return true if @ignored_paths =~ url

    path, hash = url.split('#')

    unless path =~ /\.[^\/]{2,}$/
      path << '/' unless path.end_with? '/'
      path << 'index.html' unless path.end_with? 'index.html'
    end

    filename = File.join(@site.config["destination"], path)

    return false unless File.file?(filename)

    content = File.read(filename)
    unless content.include? "<title>Redirecting"
      return true if hash.nil? || hash.empty?
      return !(content =~ /<[a-z0-9-]+[^>]+id="#{hash}"/i).nil?
    end

    match = content.match(@href_matcher)
    if match.nil?
      puts "LinkChecker: [Warning] Cannot check #{url} due to an unfollowable redirect"
      return true
    end

    redirect = match[2]
    redirect << '#' + hash unless hash.nil? || hash.empty?
    return self.check(redirect)
  end
end

# Before any Document or Page is processed, initialize the LinkChecker

Jekyll::Hooks.register :site, :pre_render do |site|
  Jekyll::LinkChecker.init(site)
end

# Process a Page as soon as its content is ready

Jekyll::Hooks.register :pages, :post_convert do |page|
  Jekyll::LinkChecker.process(page)
end

# Process a Document as soon as its content is ready

Jekyll::Hooks.register :documents, :post_convert do |document|
  Jekyll::LinkChecker.process(document)
end

# Verify gathered links after Jekyll is done writing all its stuff

Jekyll::Hooks.register :site, :post_write do |site|
  Jekyll::LinkChecker.verify(site)
end