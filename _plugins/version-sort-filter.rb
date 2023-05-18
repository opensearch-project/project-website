module VersionSortFilter

  def sort_versions(input, property = nil)
    tokenizer = /(^|\.)(\d+)/.freeze

    if input.empty?
      []
    elsif property.nil?
      input.sort do |a, b|
        a.gsub(@tokenizer) { "#{$1}#{$2.rjust(10, '0')}#{$3}" } <=> b.gsub(@tokenizer) { "#{$1}#{$2.rjust(10, '0')}#{$3}" }
      end
    else
      input.sort do |a, b|
        normalized_a = (a[property].nil? ? "" : a[property]).gsub(tokenizer) { "#{$1}#{$2.rjust(10, '0')}#{$3}" }.strip
        normalized_b = (b[property].nil? ? "" : b[property]).gsub(tokenizer) { "#{$1}#{$2.rjust(10, '0')}#{$3}" }.strip

        # ToDo: add suffix sorting

        normalized_a <=> normalized_b
      end
    end
  end

end

Liquid::Template.register_filter(VersionSortFilter)
