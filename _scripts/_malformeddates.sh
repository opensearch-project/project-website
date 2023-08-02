#!/bin/sh
online_and_timezone=$(grep -Er --files-match '^online: true$' | xargs grep --files-with-match '^tz:')
if [ -n "${malformed_event_dates}" ]; then
  echo "Online events should not have a time-zone.  Offending files:" >&2
  echo "${malformed_event_dates}" >&2
  exit 1
fi
malformed_timezones=$(grep -Er --files-match '^tz:[^/]*$')
if [ -n "${malformed_timezones}" ]; then
  echo "Time-zones should be in the form 'Continent/City'.  Offending files:" >&2
  echo "${malformed_timezones}" >&2
  exit 1
fi
malformed_event_dates=$(grep -Er --files-without-match '^eventdate: [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2} [-+][0-9]{4}$' _events)
if [ -n "${malformed_event_dates}" ]; then
echo "Malformed event date in:" >&2
echo "${malformed_event_dates}" >&2
exit 1
fi
