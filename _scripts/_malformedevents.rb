#!/usr/bin/env ruby

require 'active_support'
require 'active_support/time'

require 'yaml'

issues = 0

Dir['_events/*'].each do |filename|
  data = YAML.safe_load_file(filename, permitted_classes: [Time])
  start_date = data['eventdate']
  end_date = data['enddate']
  tz = data['tz']

  if tz.nil?
    message = "#{filename}: All events must have a 'tz' key"
    if start_date
      message += %{ (based on the time-zone offset of 'eventdate' (#{start_date}), it may be "#{ActiveSupport::TimeZone[start_date.utc_offset].tzinfo.identifier}")}
    end

    warn message
    issues += 1
  end

  if data['online'] == false
    if data.dig('location', 'city').nil?
      warn "#{filename}: non-online events must have a 'location.city' key"
      issues += 1
    end

    if data.dig('location', 'country').nil?
      warn "#{filename}: non-online events must have a 'location.country' key"
      issues += 1
    end
  end

  if start_date.nil?
    warn "#{filename}: All events must have an 'eventdate' key"
    issues += 1
  elsif start_date.is_a?(Time)
    x = start_date.in_time_zone(tz)
    if x.utc_offset != start_date.utc_offset
      warn %{#{filename}: event 'eventdate' (#{start_date}) in not in 'tz' (#{tz}) (did you mean "#{x}"?)}
      issues += 1
    end
  else
    warn "#{filename}: event 'eventdate' (#{start_date}) is not a valid RFC822 date"
    issues += 1
  end

  if end_date.is_a?(Time)
    x = end_date.in_time_zone(tz)
    if x.utc_offset != start_date.utc_offset
      warn %{#{filename}: event 'enddate' (#{end_date}) in not in 'tz' (#{tz}) (did you mean "#{x}"?)}
      issues += 1
    end
  elsif end_date
    warn "#{filename}: event 'enddate' (#{end_date}) is not a valid RFC822 date"
    issues += 1
  end
end

if issues > 0
  warn "#{issues} problems found in events."
  exit 1
end
