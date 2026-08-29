#!/bin/sh

malformed_event_dates=$(grep -Er --files-without-match '^eventdate: [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2} [-+][0-9]{4}$' _events)
if [ -n "${malformed_event_dates}" ]; then
  echo "Malformed event date in:" >&2
  echo "${malformed_event_dates}" >&2
  exit 1
fi
